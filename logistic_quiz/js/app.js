'use strict';

(function () {
  const SESSION_TITLES = {
    1: '1차시 · 스마트물류 개요와 센터 프로세스',
    2: '2차시 · 자동화 설비의 이해',
    3: '3차시 · BSP 센터 설계와 계산 실습'
  };

  const DEFAULT_COUNT = 8;
  const questionBank = typeof QUESTIONS !== 'undefined' && Array.isArray(QUESTIONS)
    ? QUESTIONS
    : [];

  const state = {
    dataErrors: [],
    config: { session: 'all', count: DEFAULT_COUNT },
    quiz: null
  };

  const els = {
    screenStart: document.getElementById('screen-start'),
    screenQuiz: document.getElementById('screen-quiz'),
    screenResult: document.getElementById('screen-result'),
    startTitle: document.getElementById('start-title'),
    dataError: document.getElementById('data-error'),
    startForm: document.getElementById('start-form'),
    sessionOptions: document.getElementById('session-options'),
    countOptions: document.getElementById('count-options'),
    poolHint: document.getElementById('pool-hint'),
    startBtn: document.getElementById('start-btn'),
    quitBtn: document.getElementById('quit-btn'),
    quizProgressLabel: document.getElementById('quiz-progress-label'),
    progress: document.getElementById('progress'),
    progressFill: document.getElementById('progress-fill'),
    quizSession: document.getElementById('quiz-session'),
    questionNumber: document.getElementById('question-number'),
    questionText: document.getElementById('question-text'),
    choiceList: document.getElementById('choice-list'),
    selectionHint: document.getElementById('selection-hint'),
    nextBtn: document.getElementById('next-btn'),
    resultTitle: document.getElementById('result-title'),
    resultCorrect: document.getElementById('result-correct'),
    resultTotal: document.getElementById('result-total'),
    resultPercent: document.getElementById('result-percent'),
    resultMessage: document.getElementById('result-message'),
    resultConfig: document.getElementById('result-config'),
    retryBtn: document.getElementById('retry-btn'),
    homeBtn: document.getElementById('home-btn')
  };

  init();

  function init() {
    state.dataErrors = validateQuestions(questionBank);

    if (state.dataErrors.length > 0) {
      showDataError(state.dataErrors);
    } else {
      renderCountOptions();
    }

    bindEvents();
    showScreen('start', false);
  }

  function bindEvents() {
    els.startForm.addEventListener('submit', handleStart);
    els.sessionOptions.addEventListener('change', handleSessionChange);
    els.countOptions.addEventListener('change', handleCountChange);
    els.choiceList.addEventListener('click', handleChoiceClick);
    els.nextBtn.addEventListener('click', handleNext);
    els.quitBtn.addEventListener('click', handleQuit);
    els.retryBtn.addEventListener('click', handleRetry);
    els.homeBtn.addEventListener('click', goHome);
  }

  function validateQuestions(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return ['문제은행을 불러오지 못했습니다. data/questions.js를 확인해 주세요.'];
    }

    const errors = [];
    const seenIds = new Set();

    data.forEach(function (question, index) {
      const label = question && typeof question.id === 'string' && question.id
        ? question.id
        : (index + 1) + '번째 문항';

      if (!question || typeof question !== 'object') {
        errors.push(label + ': 문제 객체가 아닙니다.');
        return;
      }

      if (typeof question.id !== 'string' || !question.id.trim()) {
        errors.push(label + ': id가 없습니다.');
      } else if (seenIds.has(question.id)) {
        errors.push(label + ': id가 중복됩니다.');
      } else {
        seenIds.add(question.id);
      }

      if (![1, 2, 3].includes(question.session)) {
        errors.push(label + ': session은 1~3이어야 합니다.');
      }

      if (typeof question.term !== 'string' || !question.term.trim()) {
        errors.push(label + ': term이 없습니다.');
      }

      if (typeof question.question !== 'string' || !question.question.trim()) {
        errors.push(label + ': question이 없습니다.');
      }

      if (!Array.isArray(question.choices) || question.choices.length !== 4) {
        errors.push(label + ': choices는 4개여야 합니다.');
      } else {
        const hasBlankChoice = question.choices.some(function (choice) {
          return typeof choice !== 'string' || !choice.trim();
        });

        if (hasBlankChoice) {
          errors.push(label + ': choices에 빈 보기가 있습니다.');
        } else if (new Set(question.choices).size !== 4) {
          errors.push(label + ': choices에 중복 보기가 있습니다.');
        }
      }

      if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3) {
        errors.push(label + ': answer는 0~3이어야 합니다.');
      }

      if (typeof question.explanation !== 'string' || !question.explanation.trim()) {
        errors.push(label + ': explanation이 없습니다.');
      }

      if (typeof question.ref !== 'string' || !question.ref.trim()) {
        errors.push(label + ': ref가 없습니다.');
      }
    });

    return errors;
  }

  function showDataError(messages) {
    state.dataErrors = messages;
    els.dataError.hidden = false;
    els.dataError.textContent = '문제은행에 문제가 있어 퀴즈를 시작할 수 없습니다.\n'
      + messages.join('\n');
    els.startBtn.disabled = true;
    console.error('문제은행 검증 오류:', messages);
  }

  function renderCountOptions() {
    if (state.dataErrors.length > 0) {
      return;
    }

    const session = getSelectedSession();
    const pool = getPool(session);
    state.config.session = session;

    if (pool.length === 0) {
      els.countOptions.replaceChildren();
      els.poolHint.textContent = '선택한 범위에 문제가 없습니다.';
      els.startBtn.disabled = true;
      return;
    }

    const values = [];
    if (pool.length > 4) {
      values.push(4);
      if (pool.length > 8) {
        values.push(8);
      }
    }
    values.push(pool.length);

    const uniqueValues = Array.from(new Set(values));
    let preferred = state.config.count;

    if (!uniqueValues.includes(preferred)) {
      preferred = uniqueValues[uniqueValues.length - 1];
    }

    els.countOptions.replaceChildren();

    uniqueValues.forEach(function (value, index) {
      const label = document.createElement('label');
      label.className = 'chip';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'count';
      input.value = String(value);
      input.id = 'count-option-' + index;
      input.checked = value === preferred;

      const text = document.createElement('span');
      text.textContent = value === pool.length ? '전체 (' + value + '문제)' : value + '문제';

      label.append(input, text);
      els.countOptions.append(label);
    });

    state.config.count = preferred;
    els.startBtn.disabled = false;
    updatePoolHint();
  }

  function updatePoolHint() {
    const pool = getPool(getSelectedSession());

    if (pool.length === 0) {
      els.poolHint.textContent = '선택한 범위에 문제가 없습니다.';
      return;
    }

    els.poolHint.textContent = '선택한 범위에 ' + pool.length + '문항이 있습니다. '
      + state.config.count + '문항을 출제합니다.';
  }

  function handleSessionChange(event) {
    if (!event.target.matches('input[name="session"]')) {
      return;
    }

    renderCountOptions();
  }

  function handleCountChange(event) {
    if (!event.target.matches('input[name="count"]')) {
      return;
    }

    state.config.count = Number(event.target.value);
    updatePoolHint();
  }

  function handleStart(event) {
    event.preventDefault();

    if (state.dataErrors.length > 0) {
      return;
    }

    const session = getSelectedSession();
    const pool = getPool(session);

    if (pool.length === 0) {
      els.poolHint.textContent = '선택한 범위에 문제가 없습니다.';
      els.startBtn.disabled = true;
      return;
    }

    const countInput = els.countOptions.querySelector('input[name="count"]:checked');
    const count = countInput ? Number(countInput.value) : pool.length;

    state.config.session = session;
    state.config.count = Math.min(count, pool.length);
    startQuiz();
  }

  function startQuiz() {
    const pool = getPool(state.config.session);
    const count = Math.min(state.config.count, pool.length);
    const queue = shuffle(pool).slice(0, count).map(prepareQuestion);

    state.quiz = {
      queue: queue,
      index: 0,
      selectedIndex: null,
      answers: new Array(queue.length).fill(null)
    };

    renderQuestion();
    showScreen('quiz');
  }

  function prepareQuestion(question) {
    const order = shuffle([0, 1, 2, 3]);

    return {
      id: question.id,
      session: question.session,
      term: question.term,
      question: question.question,
      choices: order.map(function (originalIndex) {
        return question.choices[originalIndex];
      }),
      answerIndex: order.indexOf(question.answer)
    };
  }

  function renderQuestion() {
    const quiz = state.quiz;
    if (!quiz) {
      return;
    }

    const question = quiz.queue[quiz.index];
    const current = quiz.index + 1;
    const total = quiz.queue.length;
    const percent = Math.round((current / total) * 100);

    els.quizSession.textContent = SESSION_TITLES[question.session] || '스마트물류 용어';
    els.questionNumber.textContent = '문제 ' + current;
    els.quizProgressLabel.textContent = current + ' / ' + total;
    els.progressFill.style.width = percent + '%';
    els.progress.setAttribute('aria-valuenow', String(percent));
    els.questionText.textContent = question.question;
    els.selectionHint.textContent = '보기를 하나 선택하세요.';
    els.nextBtn.textContent = current === total ? '결과 보기' : '다음 문제';
    els.nextBtn.disabled = true;
    els.choiceList.classList.remove('is-locked');

    renderChoices(question);
  }

  function renderChoices(question) {
    els.choiceList.replaceChildren();

    question.choices.forEach(function (choiceText, index) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice';
      button.dataset.index = String(index);
      button.setAttribute('aria-pressed', 'false');

      const number = document.createElement('span');
      number.className = 'choice-number';
      number.textContent = String(index + 1);

      const text = document.createElement('span');
      text.className = 'choice-text';
      text.textContent = choiceText;

      button.append(number, text);
      els.choiceList.append(button);
    });
  }

  function handleChoiceClick(event) {
    if (!(event.target instanceof Element)) {
      return;
    }

    const button = event.target.closest('.choice');
    if (!button || !els.choiceList.contains(button)) {
      return;
    }

    selectChoice(Number(button.dataset.index));
  }

  function selectChoice(index) {
    const quiz = state.quiz;
    if (!quiz || quiz.selectedIndex !== null) {
      return;
    }

    const question = quiz.queue[quiz.index];
    const buttons = els.choiceList.querySelectorAll('.choice');

    if (!Number.isInteger(index) || index < 0 || index >= buttons.length) {
      return;
    }

    quiz.selectedIndex = index;
    quiz.answers[quiz.index] = {
      selectedIndex: index,
      isCorrect: index === question.answerIndex
    };

    buttons.forEach(function (button, buttonIndex) {
      const isSelected = buttonIndex === index;
      button.classList.toggle('is-selected', isSelected);
      button.classList.toggle('is-dimmed', !isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
    });

    els.choiceList.classList.add('is-locked');
    els.nextBtn.disabled = false;
    els.selectionHint.textContent = '선택을 완료했습니다. 다음 문제로 넘어가세요.';
    els.nextBtn.focus();
  }

  function handleNext() {
    const quiz = state.quiz;
    if (!quiz || quiz.selectedIndex === null) {
      return;
    }

    if (quiz.index === quiz.queue.length - 1) {
      finishQuiz();
      return;
    }

    quiz.index += 1;
    quiz.selectedIndex = null;
    renderQuestion();
    showScreen('quiz');
  }

  function finishQuiz() {
    const quiz = state.quiz;
    if (!quiz) {
      return;
    }

    const correctCount = quiz.answers.reduce(function (sum, answer) {
      return sum + (answer && answer.isCorrect ? 1 : 0);
    }, 0);
    const total = quiz.queue.length;
    const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    els.resultCorrect.textContent = String(correctCount);
    els.resultTotal.textContent = String(total);
    els.resultPercent.textContent = percent + '%';
    els.resultMessage.textContent = getResultMessage(percent);
    els.resultConfig.textContent = getScopeLabel(state.config.session) + ' · ' + total + '문항';

    showScreen('result');
  }

  function getResultMessage(percent) {
    if (percent === 100) {
      return '완벽합니다! 모든 용어를 정확히 기억하고 있습니다.';
    }
    if (percent >= 80) {
      return '훌륭합니다. 핵심 용어를 잘 익혔습니다.';
    }
    if (percent >= 60) {
      return '좋습니다. 틀린 부분만 다시 확인해 보세요.';
    }
    if (percent >= 40) {
      return '조금 더 복습해 볼까요? 용어 노트를 다시 읽어 보세요.';
    }
    return '기본 용어부터 차근차근 다시 복습해 보세요.';
  }

  function getScopeLabel(session) {
    if (session === 'all') {
      return '전체 범위';
    }

    return SESSION_TITLES[Number(session)] || '전체 범위';
  }

  function handleQuit() {
    if (!state.quiz) {
      goHome();
      return;
    }

    const answeredAny = state.quiz.answers.some(function (answer) {
      return answer !== null;
    });
    const message = answeredAny
      ? '퀴즈를 그만두고 시작 화면으로 돌아갈까요?\n지금까지의 풀이는 저장되지 않습니다.'
      : '퀴즈를 그만두고 시작 화면으로 돌아갈까요?';

    if (window.confirm(message)) {
      goHome();
    }
  }

  function handleRetry() {
    if (state.dataErrors.length > 0) {
      return;
    }

    startQuiz();
  }

  function goHome() {
    state.quiz = null;
    showScreen('start');
  }

  function getSelectedSession() {
    const selected = els.sessionOptions.querySelector('input[name="session"]:checked');
    return selected ? selected.value : 'all';
  }

  function getPool(session) {
    if (session === 'all') {
      return questionBank;
    }

    return questionBank.filter(function (question) {
      return String(question.session) === String(session);
    });
  }

  function shuffle(items) {
    const result = items.slice();

    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }

    return result;
  }

  function showScreen(name, shouldFocus) {
    const screens = {
      start: els.screenStart,
      quiz: els.screenQuiz,
      result: els.screenResult
    };

    Object.keys(screens).forEach(function (key) {
      screens[key].hidden = key !== name;
    });

    if (shouldFocus === false) {
      return;
    }

    const headings = {
      start: els.startTitle,
      quiz: els.questionText,
      result: els.resultTitle
    };
    const heading = headings[name];

    if (heading) {
      heading.focus({ preventScroll: true });
    }

    window.scrollTo({ top: 0, behavior: 'auto' });
  }
})();
