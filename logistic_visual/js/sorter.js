/* 실습 ④ 소터 용량 검토 — sorter.py 와 같은 식 */
(() => {
  function sorterCheck(daily, peakRatio, hours, cap, chutes) {
    const peak = daily * peakRatio / hours;
    const u = peak / cap;
    return { peak, u, perChute: peak / chutes, judge: u < 0.8 ? "여유" : (u < 1 ? "주의" : "부족") };
  }
  const JUDGE_COLOR = { 여유: "#1f8a5b", 주의: "#d99a17", 부족: "#c8463a" };
  const CASES = [
    { label: "평상시 (16시간)", ratio: 1.0, hours: 16 },
    { label: "피크 (16시간)", ratio: 1.6, hours: 16 },
    { label: "피크 (10시간 집중)", ratio: 1.6, hours: 10 },
    { label: "피크 (8시간 집중)", ratio: 1.6, hours: 8 },
  ];

  const dailyEl = document.getElementById("st-daily");
  const ratio = bindRange("st-ratio", 1, update);
  const hours = bindRange("st-hours", 0, update);
  const cap = bindRange("st-cap", 0, update);
  const chutes = bindRange("st-chutes", 0, () => { update(); layout(); });
  dailyEl.addEventListener("input", update);

  // 실습 상황 바로가기 버튼
  const casesBox = document.getElementById("st-cases");
  CASES.forEach(c => {
    const b = document.createElement("button");
    b.className = "btn btn-outline-secondary btn-sm";
    b.textContent = c.label;
    b.addEventListener("click", () => { ratio.el.value = c.ratio; hours.el.value = c.hours; ratio.refresh(); hours.refresh(); update(); });
    casesBox.appendChild(b);
  });

  /* ---------- 게이지 (0 ~ 150%) ---------- */
  const svg = document.getElementById("st-gauge");
  const CX = 150, CY = 160, R = 120, MAX = 1.5;
  const ang = u => Math.PI * (1 - Math.min(u, MAX) / MAX);          // 0% = 왼쪽, 150% = 오른쪽
  const pt = (a, r) => [CX + r * Math.cos(a), CY - r * Math.sin(a)];
  function arc(u0, u1, color) {
    const [x0, y0] = pt(ang(u0), R), [x1, y1] = pt(ang(u1), R);
    return `<path d="M${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1}" stroke="${color}" stroke-width="26" fill="none"/>`;
  }
  let ticks = "";
  [0, 0.5, 0.8, 1.0, 1.5].forEach(u => {
    const [x0, y0] = pt(ang(u), R - 18), [x1, y1] = pt(ang(u), R + 16);
    const [tx, ty] = pt(ang(u), R + 28);
    ticks += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#fff" stroke-width="2"/>
              <text x="${tx}" y="${ty + 4}" font-size="11" text-anchor="middle" fill="#5d7481">${u * 100}%</text>`;
  });
  svg.innerHTML = arc(0, 0.8, "#1f8a5b") + arc(0.8, 1.0, "#d99a17") + arc(1.0, 1.5, "#c8463a") + ticks +
    `<g class="needle" id="st-needle"><line x1="${CX}" y1="${CY}" x2="${CX}" y2="${CY - R + 8}" stroke="#1d2b33" stroke-width="4" stroke-linecap="round"/></g>
     <circle cx="${CX}" cy="${CY}" r="9" fill="#1d2b33"/>
     <text id="st-gauge-val" x="${CX}" y="${CY - 30}" font-size="30" font-weight="700" text-anchor="middle" fill="#0e4a5c">-</text>`;

  /* ---------- 그래프 ---------- */
  const thresholdPlugin = {            // 80% · 100% 기준선
    id: "thresholds",
    afterDatasetsDraw(chart) {
      const { ctx, chartArea: a, scales: { y } } = chart;
      [[80, "#d99a17", "주의 80%"], [100, "#c8463a", "부족 100%"]].forEach(([v, c, t]) => {
        const yy = y.getPixelForValue(v);
        if (yy < a.top || yy > a.bottom) return;
        ctx.save(); ctx.strokeStyle = c; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(a.left, yy); ctx.lineTo(a.right, yy); ctx.stroke();
        ctx.fillStyle = c; ctx.font = "11px 'Malgun Gothic', sans-serif"; ctx.textAlign = "left"; ctx.fillText(t, a.left + 4, yy - 4);
        ctx.restore();
      });
    },
  };
  const chCases = new Chart(document.getElementById("st-chart-cases"), {
    type: "bar",
    data: { labels: CASES.map(c => c.label), datasets: [{ data: [], backgroundColor: [], borderRadius: 6 }] },
    options: {
      scales: { y: { beginAtZero: true, suggestedMax: 130, title: { display: true, text: "설비 대비 부하 (%)" } } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => { const r = c.chart.$rows[c.dataIndex]; return `부하 ${pct(r.u)} · 시간당 ${fmt(r.peak)}개 · ${r.judge}`; } } },
      },
    },
    plugins: [thresholdPlugin],
  });
  const HOURS = [];
  for (let h = 6; h <= 20; h++) HOURS.push(h);
  const chHours = new Chart(document.getElementById("st-chart-hours"), {
    type: "line",
    data: { datasets: [
      { label: "", data: [], borderColor: "#0e4a5c", backgroundColor: "#0e4a5c", pointRadius: 2, tension: .25 },
      { label: "평상시 (1.0배)", data: [], borderColor: "#7aa6b5", backgroundColor: "#7aa6b5", pointRadius: 0, borderDash: [5, 4], tension: .25 },
      { label: "지금 설정", data: [], type: "scatter", backgroundColor: "#c8463a", borderColor: "#fff", borderWidth: 2, pointRadius: 8 },
    ] },
    options: {
      scales: {
        x: { type: "linear", min: 6, max: 20, title: { display: true, text: "출고를 몰아 내보내는 시간 (시간)" } },
        y: { beginAtZero: true, suggestedMax: 130, title: { display: true, text: "부하 (%)" } },
      },
      plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y.toFixed(0)}% (${c.parsed.x}시간)` } } },
    },
    plugins: [thresholdPlugin],
  });

  let state = null;
  function update() {
    const daily = Number(dailyEl.value) || 0;
    state = sorterCheck(daily, ratio.value, hours.value, cap.value, chutes.value);
    document.getElementById("st-peak").textContent = fmt(state.peak) + "개/h";
    document.getElementById("st-chute").textContent = fmt(state.perChute) + "개/h";
    const j = document.getElementById("st-judge");
    j.textContent = state.judge; j.style.color = JUDGE_COLOR[state.judge];
    document.getElementById("st-gauge-val").textContent = pct(state.u);
    const deg = -90 + Math.min(state.u, MAX) / MAX * 180;
    document.getElementById("st-needle").style.transform = `rotate(${deg}deg)`;

    const rows = CASES.map(c => sorterCheck(daily, c.ratio, c.hours, cap.value, chutes.value));
    chCases.$rows = rows;
    chCases.data.datasets[0].data = rows.map(r => +(r.u * 100).toFixed(1));
    chCases.data.datasets[0].backgroundColor = rows.map(r => JUDGE_COLOR[r.judge]);
    chCases.update();

    chHours.data.datasets[0].label = `피크 ${ratio.value.toFixed(1)}배`;
    chHours.data.datasets[0].data = HOURS.map(h => ({ x: h, y: sorterCheck(daily, ratio.value, h, cap.value, chutes.value).u * 100 }));
    chHours.data.datasets[1].data = HOURS.map(h => ({ x: h, y: sorterCheck(daily, 1.0, h, cap.value, chutes.value).u * 100 }));
    chHours.data.datasets[2].data = [{ x: hours.value, y: state.u * 100 }];
    chHours.update();

    resetSim();
  }

  /* ---------- 슬라이딩슈 소터 애니메이션 (화면 속 1초 = 실제 1초) ---------- */
  const canvas = document.getElementById("st-canvas");
  let ctx, W, H, raf = null, last = null;
  let boxes = [], spawnAcc = 0, tokens = 0, sorted = 0, recirc = 0, chuteX = [], chuteFill = [];
  const LINE_Y = 60, LINE_SPEED = 260;                 // px/초
  const PALETTE = ["#c99a5b", "#9bc1cf", "#e7b86a", "#a9c99a", "#8fb0e0", "#b8a6d9"];

  function resize() { ({ ctx, w: W, h: H } = fitCanvas(canvas, 260)); layout(); }
  function layout() {
    if (!W) return;
    const n = chutes.value, x0 = 150, x1 = W - 110;
    chuteX = Array.from({ length: n }, (_, i) => x0 + (x1 - x0) * (i + 0.5) / n);
    chuteFill = Array(n).fill(0);
  }
  function resetSim() {
    boxes = []; spawnAcc = 0; tokens = 1; sorted = 0; recirc = 0;
    chuteFill = chuteFill.map(() => 0);
    document.getElementById("st-sorted").textContent = "0";
    document.getElementById("st-recirc").textContent = "0";
  }

  function step(dt) {
    if (!state) return;
    const arrive = state.peak / 3600, capRate = cap.value / 3600;   // 개/초
    spawnAcc += arrive * dt;
    tokens = Math.min(1.5, tokens + capRate * dt);
    while (spawnAcc >= 1) {
      spawnAcc -= 1;
      const ok = tokens >= 1;                 // 소터가 받을 여력이 있으면 분류, 아니면 그대로 흘러가 재순환
      if (ok) tokens -= 1;
      const chute = Math.floor(Math.random() * chuteX.length);
      boxes.push({ x: -30, y: LINE_Y, chute, ok, phase: "line", c: PALETTE[chute % PALETTE.length] });
    }
    boxes.forEach(b => {
      if (b.phase === "line") {
        b.x += LINE_SPEED * dt;
        if (b.ok && b.x >= chuteX[b.chute]) { b.x = chuteX[b.chute]; b.phase = "chute"; }
        if (!b.ok && b.x > W - 60) { b.phase = "done"; recirc++; }
      } else if (b.phase === "chute") {
        b.y += 160 * dt;
        const floor = H - 30 - Math.min(5, chuteFill[b.chute]) * 6;
        if (b.y >= floor) { b.phase = "done"; sorted++; chuteFill[b.chute] = (chuteFill[b.chute] + 1) % 12; }
      }
    });
    boxes = boxes.filter(b => b.phase !== "done");
    document.getElementById("st-sorted").textContent = fmt(sorted);
    document.getElementById("st-recirc").textContent = fmt(recirc);
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    // 투입 컨베이어 · 본선
    ctx.fillStyle = "#2f3b42"; roundRect(ctx, 10, LINE_Y - 4, W - 20, 30, 8); ctx.fill();
    ctx.fillStyle = "#5d7481";
    for (let x = 20; x < W - 20; x += 14) ctx.fillRect(x, LINE_Y + 2, 6, 18);       // 슬랫
    ctx.font = "12px 'Malgun Gothic', sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#3c5260";
    ctx.fillText("투입 →", 12, LINE_Y - 12);
    ctx.fillText(`투입 ${fmt(state ? state.peak : 0)}개/h · 소터 능력 ${fmt(cap.value)}개/h`, 70, LINE_Y - 12);
    // 재순환
    ctx.fillStyle = "#fbefed"; ctx.strokeStyle = "#c8463a"; roundRect(ctx, W - 96, LINE_Y + 40, 86, 60, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#c8463a"; ctx.textAlign = "center"; ctx.fillText("재순환", W - 53, LINE_Y + 66);
    ctx.fillText("(다시 한 바퀴)", W - 53, LINE_Y + 84);
    // 슈트
    const cw = Math.min(46, (W - 260) / Math.max(1, chuteX.length) - 8);
    chuteX.forEach((x, i) => {
      ctx.fillStyle = "#dfe9ee";
      ctx.beginPath(); ctx.moveTo(x - cw / 2, LINE_Y + 28); ctx.lineTo(x + cw / 2, LINE_Y + 28);
      ctx.lineTo(x + cw / 2, H - 22); ctx.lineTo(x - cw / 2, H - 22); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#aebdc5"; ctx.stroke();
      ctx.fillStyle = "#3c5260"; ctx.font = "11px 'Malgun Gothic', sans-serif"; ctx.textAlign = "center";
      ctx.fillText(i + 1, x, H - 8);
      // 쌓인 박스
      for (let k = 0; k < Math.min(5, chuteFill[i]); k++) {
        ctx.fillStyle = PALETTE[i % PALETTE.length]; ctx.fillRect(x - cw / 2 + 4, H - 30 - k * 6, cw - 8, 5);
      }
    });
    // 박스
    boxes.forEach(b => {
      const s = 20;
      ctx.fillStyle = b.ok ? b.c : "#c8463a";
      ctx.fillRect(b.x - s / 2, b.y - s / 2 + (b.phase === "line" ? -4 : 0), s, s);
      ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.strokeRect(b.x - s / 2 + .5, b.y - s / 2 + .5 + (b.phase === "line" ? -4 : 0), s - 1, s - 1);
      // 슈(shoe)가 밀어내는 순간 표시
      if (b.phase === "chute" && b.y < LINE_Y + 30) {
        ctx.strokeStyle = "#e0902a"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(b.x - 16, LINE_Y - 6); ctx.lineTo(b.x - 4, LINE_Y + 22); ctx.stroke(); ctx.lineWidth = 1;
      }
    });
    if (state && state.u >= 1) {
      ctx.fillStyle = "#c8463a"; ctx.font = "bold 13px 'Malgun Gothic', sans-serif"; ctx.textAlign = "right";
      ctx.fillText(`능력 초과 — 투입의 약 ${pct(1 - 1 / state.u)}가 분류되지 못합니다`, W - 110, LINE_Y + 50);
    }
  }
  function loop(t) {
    if (last == null) last = t;
    const dt = Math.min(.05, (t - last) / 1000); last = t;
    step(dt); draw();
    raf = requestAnimationFrame(loop);
  }

  [ratio, hours, cap, chutes].forEach(r => r.refresh());
  update();

  BSP.register("sorter", {
    onShow() { resize(); chCases.resize(); chHours.resize(); last = null; if (!raf) raf = requestAnimationFrame(loop); },
    onHide() { cancelAnimationFrame(raf); raf = null; },
    onResize: resize,
  });
})();
