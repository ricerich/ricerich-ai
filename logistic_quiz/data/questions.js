// 5과목 용어 노트(docs/5과목_용어노트.md)만 근거로 만든 문제은행입니다.
// 문제 객체 형식: { id, session, term, question, choices, answer, explanation, ref }

const QUESTIONS = [
  // 1차시 · 스마트물류 개요와 센터 프로세스
  {
    id: 's1-01',
    session: 1,
    term: '물류센터 프로세스 6단계',
    question: '물류센터 프로세스 6단계의 올바른 순서는?',
    choices: [
      '입고 → 검수 → 보관 → 피킹 → 포장 → 출고',
      '입고 → 보관 → 검수 → 피킹 → 포장 → 출고',
      '검수 → 입고 → 보관 → 피킹 → 출고 → 포장',
      '입고 → 검수 → 피킹 → 보관 → 포장 → 출고'
    ],
    answer: 0,
    explanation: '노트의 6단계는 입고 → 검수 → 보관 → 피킹 → 포장 → 출고 순서입니다.',
    ref: '물류센터 프로세스 6단계'
  },
  {
    id: 's1-02',
    session: 1,
    term: '로케이션',
    question: '로케이션 A-12-03-2에서 12가 뜻하는 것은?',
    choices: ['구역', '통로', '랙 번호', '단'],
    answer: 1,
    explanation: '로케이션 A-12-03-2는 구역 A · 통로 12 · 랙 3번 · 2단을 뜻합니다.',
    ref: '현장 용어'
  },
  {
    id: 's1-03',
    session: 1,
    term: '배치 피킹',
    question: '여러 주문을 모아 품목별로 한 번에 골라 담는 피킹 방식은?',
    choices: ['오더 피킹', '배치 피킹', '존 피킹', 'GTP'],
    answer: 1,
    explanation: '배치 피킹은 여러 주문을 모아 품목별로 한 번에 골라 담는 방식입니다.',
    ref: '피킹 방식'
  },
  {
    id: 's1-04',
    session: 1,
    term: 'WES',
    question: 'WMS와 WCS 사이에서 작업 순서를 실시간으로 최적화하는 시스템은?',
    choices: ['OMS', 'WCS', 'WES', 'TMS'],
    answer: 2,
    explanation: 'WES는 실행 시스템으로, WMS와 WCS 사이에서 작업 순서를 실시간 최적화합니다.',
    ref: '정보시스템'
  },

  // 2차시 · 자동화 설비의 이해
  {
    id: 's2-01',
    session: 2,
    term: 'AGV',
    question: '바닥 테이프나 QR을 따라 이동하고, 장애물을 만나면 멈춰 기다리는 무인운반차는?',
    choices: ['AGV', 'AMR', 'AS/RS', 'GTP'],
    answer: 0,
    explanation: 'AGV는 바닥 테이프·QR을 따라가며 장애물을 만나면 멈춰 기다립니다. AMR은 지도를 만들어 스스로 경로를 정하고 장애물을 돌아갑니다.',
    ref: '설비 용어'
  },
  {
    id: 's2-02',
    session: 2,
    term: '플로우 랙',
    question: '경사 롤러를 이용해 뒤에서 넣고 앞에서 꺼내며 선입선출을 구현하는 랙은?',
    choices: ['셀렉티브 랙', '드라이브인 랙', '모빌 랙', '플로우 랙'],
    answer: 3,
    explanation: '플로우 랙은 경사 롤러로 뒤에서 넣고 앞에서 꺼내므로 선입선출이 됩니다.',
    ref: '랙 종류'
  },
  {
    id: 's2-03',
    session: 2,
    term: 'OEE',
    question: '가동률 90%, 성능률 85%, 양품률 99%일 때 OEE에 가장 가까운 값은?',
    choices: ['70.0%', '75.7%', '80.0%', '85.0%'],
    answer: 1,
    explanation: 'OEE = 가동률 × 성능률 × 양품률 = 0.90 × 0.85 × 0.99 ≈ 75.7%입니다.',
    ref: '계산과 지표'
  },
  {
    id: 's2-04',
    session: 2,
    term: 'DAS',
    question: '한 품목을 여러 주문함에 분배하는 설비는?',
    choices: ['DPS', 'DAS', 'GTP', 'AS/RS'],
    answer: 1,
    explanation: 'DAS는 한 품목을 여러 주문함에 분배하는 설비로, 매장·정기 배송에 적합합니다.',
    ref: '설비 용어'
  },

  // 3차시 · BSP 센터 설계와 계산 실습
  {
    id: 's3-01',
    session: 3,
    term: '도크',
    question: 'BSP 스마트물류센터의 도크 구성으로 맞는 것은?',
    choices: ['입고 4 · 출고 6', '입고 6 · 출고 8', '입고 8 · 출고 6', '입고 6 · 출고 6'],
    answer: 1,
    explanation: 'BSP 센터의 도크는 입고 6개, 출고 8개입니다.',
    ref: 'BSP 스마트물류센터 제원'
  },
  {
    id: 's3-02',
    session: 3,
    term: '미니로드 자동창고',
    question: 'BSP 센터의 냉동 보관 구역에 도입한 설비는?',
    choices: ['셀렉티브 랙', '플로우 랙', '미니로드 자동창고', '드라이브인 랙'],
    answer: 2,
    explanation: '사람이 오래 있기 어려운 냉동 구역에는 미니로드 자동창고를 사용합니다.',
    ref: '설비 구성'
  },
  {
    id: 's3-03',
    session: 3,
    term: 'A등급(ABC)',
    question: 'BSP 센터에서 A등급으로 분류된 품목은?',
    choices: ['음료', '생활용품', '식품', '기획상품'],
    answer: 0,
    explanation: '음료는 A등급(서비스 수준 98%)입니다. 품목 수는 240개(20%)지만 출고 금액 비중이 가장 큽니다.',
    ref: '품목 등급 (ABC)'
  },
  {
    id: 's3-04',
    session: 3,
    term: 'AGV 대수 산정',
    question: '시간당 240건, 1.2m/s, 적재·하역 20초, 여유 20% 조건에서 편도 80m일 때 필요한 AGV 대수는?',
    choices: ['10대', '12대', '13대', '15대'],
    answer: 2,
    explanation: '노트의 계산 결과 편도 60m는 10대, 80m는 13대, 100m는 15대가 필요합니다.',
    ref: '계산 실습 결과'
  }
];
