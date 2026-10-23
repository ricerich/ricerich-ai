/* 실습 ③ AGV · AMR 대수 산정 — agv.py 와 같은 식 */
(() => {
  const cycleSeconds = (dist, speed, handling) => dist * 2 / speed + handling;
  function requiredAgv(moves, dist, speed = 1.2, handling = 20, margin = 0.2) {
    const cycle = cycleSeconds(dist, speed, handling);
    const perAgv = 3600 / cycle;                    // 1대의 시간당 처리 건수
    const need = moves / perAgv;                    // 여유 없이 계산한 대수(소수)
    return { n: Math.ceil(need * (1 + margin)), cycle, perAgv, need };
  }

  const moves = bindRange("ag-moves", 0, update);
  const dist = bindRange("ag-dist", 0, update);
  const speed = bindRange("ag-speed", 1, update);
  const hand = bindRange("ag-hand", 0, update);
  const margin = bindRange("ag-margin", 0, update);

  /* ---------- AGV 아이콘 ---------- */
  function agvSVG(body, idx) {
    return `<svg viewBox="0 0 68 50" aria-label="AMR ${idx}">
      <rect x="6" y="8" width="56" height="8" rx="2" fill="#c99a5b" stroke="#7a5a2e"/>
      <rect x="4" y="16" width="60" height="20" rx="5" fill="${body}"/>
      <rect x="10" y="21" width="22" height="9" rx="2" fill="rgba(255,255,255,.85)"/>
      <circle cx="54" cy="23" r="3" fill="#bff3ff"/>
      <rect x="4" y="30" width="60" height="3" fill="rgba(0,0,0,.18)"/>
      <circle cx="16" cy="40" r="6" fill="#26323a"/><circle cx="16" cy="40" r="2.2" fill="#9fb3bd"/>
      <circle cx="52" cy="40" r="6" fill="#26323a"/><circle cx="52" cy="40" r="2.2" fill="#9fb3bd"/>
      <text x="21" y="28.3" font-size="7" font-weight="700" fill="${body}" text-anchor="middle" font-family="Malgun Gothic">${idx}</text>
    </svg>`;
  }

  /* ---------- 그래프 ---------- */
  const DISTS = [60, 80, 100, 120];
  const chTime = new Chart(document.getElementById("ag-chart-time"), {
    type: "bar",
    data: { labels: [], datasets: [
      { label: "왕복 주행", data: [], backgroundColor: "#0e7c86", borderRadius: 4 },
      { label: "적재·하역", data: [], backgroundColor: "#e0a33a", borderRadius: 4 },
    ] },
    options: {
      indexAxis: "y",
      scales: { x: { stacked: true, title: { display: true, text: "1회 사이클 (초)" } }, y: { stacked: true } },
      plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${fmt(c.parsed.x)}초` } } },
    },
  });
  const chMoves = new Chart(document.getElementById("ag-chart-moves"), {
    type: "bar",
    data: { labels: ["요구 운반", "1대 처리", "확보 능력"], datasets: [{ data: [], backgroundColor: ["#c8463a", "#7aa6b5", "#0e7c86"], borderRadius: 6 }] },
    options: {
      scales: { y: { beginAtZero: true, title: { display: true, text: "건 / 시간" } } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmt(c.parsed.y) + "건/h" } } },
    },
  });
  const distAxis = [];
  for (let d = 40; d <= 160; d += 10) distAxis.push(d);
  const chDist = new Chart(document.getElementById("ag-chart-dist"), {
    type: "line",
    data: { datasets: [
      { label: "", data: [], borderColor: "#0e4a5c", backgroundColor: "#0e4a5c", stepped: true, pointRadius: 2 },
      { label: "", data: [], borderColor: "#e0902a", backgroundColor: "#e0902a", stepped: true, pointRadius: 2, borderDash: [5, 4] },
      { label: "지금 설정", data: [], type: "scatter", backgroundColor: "#c8463a", borderColor: "#fff", borderWidth: 2, pointRadius: 8 },
    ] },
    options: {
      scales: {
        x: { type: "linear", min: 40, max: 160, title: { display: true, text: "편도 거리 (m)" } },
        y: { beginAtZero: true, title: { display: true, text: "필요 대수" }, ticks: { precision: 0 } },
      },
      plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y}대 (거리 ${c.parsed.x} m)` } } },
    },
  });

  let cur = null;
  function update() {
    const m = moves.value, d = dist.value, v = speed.value, h = hand.value, mg = margin.value / 100;
    cur = requiredAgv(m, d, v, h, mg);
    const base = Math.ceil(cur.need);
    document.getElementById("ag-cycle").textContent = fmt(cur.cycle) + "초";
    document.getElementById("ag-per").textContent = fmt(cur.perAgv, 1) + "건";
    document.getElementById("ag-raw").textContent = fmt(cur.need, 2) + "대";
    document.getElementById("ag-need").textContent = cur.n + "대";

    // 실제 대수만큼 로봇 그리기
    const fleet = document.getElementById("ag-fleet");
    let html = "";
    for (let i = 1; i <= cur.n; i++) {
      const spare = i > base;
      html += `<div class="agv-card">${agvSVG(spare ? "#e0a33a" : "#0e7c86", i)}<div>${spare ? "여유" : "운반"}</div></div>`;
    }
    fleet.innerHTML = html;
    document.getElementById("ag-fleet-note").textContent =
      `운반에 꼭 필요한 ${base}대(${fmt(cur.need, 2)}대 올림) + 여유 ${cur.n - base}대 = ${cur.n}대. ` +
      `여유율 ${margin.value}%를 곱한 ${fmt(cur.need * (1 + mg), 2)}대를 올림한 값입니다.`;

    // 걸린 시간 — 실습 거리 넷 + 지금
    const rows = DISTS.map(x => ({ lab: x + " m", drive: x * 2 / v, h }));
    rows.push({ lab: `지금 ${d} m`, drive: d * 2 / v, h });
    chTime.data.labels = rows.map(r => r.lab);
    chTime.data.datasets[0].data = rows.map(r => +r.drive.toFixed(1));
    chTime.data.datasets[1].data = rows.map(r => r.h);
    chTime.update();

    // 건수
    chMoves.data.datasets[0].data = [m, +cur.perAgv.toFixed(1), +(cur.perAgv * cur.n).toFixed(0)];
    chMoves.update();

    // 거리별 필요 대수
    const other = Math.abs(v - 1.5) < 1e-9 ? 1.2 : 1.5;
    chDist.data.datasets[0].label = `속도 ${v.toFixed(1)} m/s (지금)`;
    chDist.data.datasets[0].data = distAxis.map(x => ({ x, y: requiredAgv(m, x, v, h, mg).n }));
    chDist.data.datasets[1].label = `속도 ${other.toFixed(1)} m/s`;
    chDist.data.datasets[1].data = distAxis.map(x => ({ x, y: requiredAgv(m, x, other, h, mg).n }));
    chDist.data.datasets[2].data = [{ x: d, y: cur.n }];
    chDist.update();

    phaseT = 0;
  }

  /* ---------- 1대 사이클 애니메이션 ---------- */
  const canvas = document.getElementById("ag-canvas");
  let ctx, W, H, raf = null, last = null, phaseT = 0;
  const SHOW_SEC = 7;           // 사이클 한 번을 화면에서 약 7초에 보여 준다
  function resize() { ({ ctx, w: W, h: H } = fitCanvas(canvas, 120)); }

  function drawCycle() {
    if (!ctx || !cur) return;
    const d = dist.value, v = speed.value, h = hand.value;
    const drive = d / v, half = h / 2;
    const T = cur.cycle;
    const t = phaseT % T;
    const L = 70, R = W - 70, y = 70;
    let x, label;
    if (t < half) { x = L; label = "적재 중"; }
    else if (t < half + drive) { x = L + (R - L) * (t - half) / drive; label = "가는 중"; }
    else if (t < half * 2 + drive) { x = R; label = "하역 중"; }
    else { x = R - (R - L) * (t - half * 2 - drive) / drive; label = "돌아오는 중"; }
    const loaded = t >= half && t < half * 2 + drive;   // 적재가 끝난 뒤 ~ 하역이 끝날 때까지 박스를 싣고 있음

    ctx.clearRect(0, 0, W, H);
    // 주행로
    ctx.strokeStyle = "#cbd7dd"; ctx.lineWidth = 10; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(L, y + 14); ctx.lineTo(R, y + 14); ctx.stroke();
    ctx.setLineDash([8, 8]); ctx.strokeStyle = "#e0902a"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(L, y + 14); ctx.lineTo(R, y + 14); ctx.stroke(); ctx.setLineDash([]);
    // 스테이션
    [[L, "적재 (피킹 구역)"], [R, "하역 (포장대)"]].forEach(([sx, t2]) => {
      ctx.fillStyle = "#dfe9ee"; ctx.fillRect(sx - 34, 18, 68, 30);
      ctx.fillStyle = "#3c5260"; ctx.font = "12px 'Malgun Gothic', sans-serif"; ctx.textAlign = "center"; ctx.fillText(t2, sx, 37);
    });
    ctx.fillStyle = "#5d7481"; ctx.fillText(`편도 ${d} m`, (L + R) / 2, y + 40);
    // AMR
    ctx.fillStyle = "#0e7c86"; roundRect(ctx, x - 26, y - 6, 52, 18, 5); ctx.fill();
    ctx.fillStyle = "#26323a"; [x - 16, x + 16].forEach(wx => { ctx.beginPath(); ctx.arc(wx, y + 14, 5, 0, Math.PI * 2); ctx.fill(); });
    if (loaded) { ctx.fillStyle = "#c99a5b"; ctx.fillRect(x - 18, y - 22, 36, 16); }
    ctx.fillStyle = "#0e4a5c"; ctx.font = "bold 12px 'Malgun Gothic', sans-serif"; ctx.fillText(label, x, y - 28);
    document.getElementById("ag-timer").textContent = fmt(T - t) + "초";
    document.getElementById("ag-scale").textContent = fmt(T / SHOW_SEC, 1);
  }
  function loop(ts) {
    if (last == null) last = ts;
    const dt = Math.min(.05, (ts - last) / 1000); last = ts;
    if (cur) phaseT += dt * cur.cycle / SHOW_SEC;
    drawCycle();
    raf = requestAnimationFrame(loop);
  }

  document.getElementById("ag-reset").addEventListener("click", () => {
    moves.el.value = 240; dist.el.value = 100; speed.el.value = 1.2; hand.el.value = 20; margin.el.value = 20;
    [moves, dist, speed, hand, margin].forEach(r => r.refresh()); update();
  });
  document.getElementById("ag-60").addEventListener("click", () => dist.set(60));
  document.getElementById("ag-fast").addEventListener("click", () => speed.set(1.5));

  [moves, dist, speed, hand, margin].forEach(r => r.refresh());
  update();

  BSP.register("agv", {
    onShow() { resize(); [chTime, chMoves, chDist].forEach(c => c.resize()); last = null; if (!raf) raf = requestAnimationFrame(loop); },
    onHide() { cancelAnimationFrame(raf); raf = null; },
    onResize: resize,
  });
})();
