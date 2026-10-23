/* 실습 ② 피킹 동선 거리 — picking.py 와 같은 좌표·같은 거리 계산 */
(() => {
  const LOCATIONS = {            // 로케이션 → (x, y) 미터
    "A-01": [5, 2], "A-12": [5, 26],
    "B-04": [14, 8], "B-19": [14, 38],
    "C-07": [23, 14], "C-21": [23, 42],
  };
  const START = [0, 0];          // 작업 스테이션
  const END = [28, 44];          // 출고 컨베이어
  const DEFAULT_ORDER = ["C-21", "A-01", "B-19", "A-12", "C-07", "B-04"];
  let order = DEFAULT_ORDER.slice();

  const manhattan = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]);
  function routeLength(seq) {
    let pos = START, total = 0;
    seq.forEach(c => { total += manhattan(pos, LOCATIONS[c]); pos = LOCATIONS[c]; });
    return total + manhattan(pos, END);
  }
  function serpentine(locs) {    // 통로(A·B·C)별로 묶고, 홀수 번째 통로는 거꾸로
    const aisles = {};
    locs.forEach(c => (aisles[c[0]] = aisles[c[0]] || []).push(c));
    let out = [];
    Object.keys(aisles).sort().forEach((key, i) => {
      const rows = aisles[key].slice().sort((a, b) => LOCATIONS[a][1] - LOCATIONS[b][1]);
      if (i % 2 === 1) rows.reverse();
      out = out.concat(rows);
    });
    return out;
  }

  /* ---------- 블록맵 ---------- */
  const AISLE_X = [0, 5, 14, 23, 28];                 // 세로 통로
  const RACK_X = [[1.2, 3.8], [6.2, 12.8], [15.2, 21.8], [24.2, 26.8]];
  const CROSS = 4;                                     // 가로 통로 간격 (y = 0, 4, 8, … 44)
  const canvas = document.getElementById("pk-canvas");
  const CSS_W = 560, CSS_H = 760, CELL = 16, OX = 28, OY = CSS_H - 28;   // 원점(0,0) 화면 위치
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CSS_W * dpr; canvas.height = CSS_H * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const X = x => OX + x * CELL;
  const Y = y => OY - y * CELL;

  // p → q 를 실제로 걷는 꺾은선. 사이에 가로 통로가 있으면 길이는 맨해튼 거리와 같다.
  function walkPath(p, q) {
    if (p[0] === q[0]) return [p, q];
    const lo = Math.min(p[1], q[1]), hi = Math.max(p[1], q[1]);
    let yc = null;
    for (let y = 0; y <= 44; y += CROSS) {
      if (y >= lo && y <= hi && (yc === null || Math.abs(y - p[1]) < Math.abs(yc - p[1]))) yc = y;
    }
    if (yc === null) yc = Math.round(p[1] / CROSS) * CROSS;   // 사이에 가로 통로가 없으면 가까운 곳으로 돌아간다
    return [p, [p[0], yc], [q[0], yc], q];
  }
  function fullPath(seq) {
    const pts = [START, ...seq.map(c => LOCATIONS[c]), END];
    let out = [START];
    for (let i = 0; i < pts.length - 1; i++) out = out.concat(walkPath(pts[i], pts[i + 1]).slice(1));
    return out;
  }
  const pathLen = pts => pts.slice(1).reduce((s, p, i) => s + manhattan(pts[i], p), 0);

  function drawMap() {
    ctx.clearRect(0, 0, CSS_W, CSS_H);
    // 바닥 격자 (1 m 블록)
    ctx.fillStyle = "#fbfcfd"; ctx.fillRect(X(-1), Y(46), 31 * CELL, 47 * CELL);
    ctx.strokeStyle = "#eef2f4"; ctx.lineWidth = 1;
    for (let x = -1; x <= 30; x++) { ctx.beginPath(); ctx.moveTo(X(x), Y(-1)); ctx.lineTo(X(x), Y(46)); ctx.stroke(); }
    for (let y = -1; y <= 46; y++) { ctx.beginPath(); ctx.moveTo(X(-1), Y(y)); ctx.lineTo(X(30), Y(y)); ctx.stroke(); }
    // 랙 블록
    for (let k = 0; k < 11; k++) {
      const y0 = k * CROSS + 0.6, y1 = k * CROSS + 3.4;
      RACK_X.forEach(([x0, x1]) => {
        ctx.fillStyle = "#c9d4da"; ctx.fillRect(X(x0), Y(y1), (x1 - x0) * CELL, (y1 - y0) * CELL);
        ctx.strokeStyle = "#aebdc5"; ctx.strokeRect(X(x0) + .5, Y(y1) + .5, (x1 - x0) * CELL - 1, (y1 - y0) * CELL - 1);
      });
    }
    // 통로 이름
    ctx.font = "bold 13px 'Malgun Gothic', sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#5d7481";
    [["A 통로", 5], ["B 통로", 14], ["C 통로", 23]].forEach(([t, x]) => ctx.fillText(t, X(x), Y(45.2)));
    // 시작 · 끝
    marker(START, "#0e4a5c", "시작"); marker(END, "#0e4a5c", "출고");
    // 로케이션
    Object.entries(LOCATIONS).forEach(([name, [x, y]]) => {
      ctx.fillStyle = "#e0902a"; ctx.fillRect(X(x) - 6, Y(y) - 6, 12, 12);
      ctx.fillStyle = "#1d2b33"; ctx.font = "bold 12px 'Malgun Gothic', sans-serif"; ctx.textAlign = "left";
      ctx.fillText(name, X(x) + 9, Y(y) + 4);
    });
    // 축 눈금
    ctx.fillStyle = "#8aa0ab"; ctx.font = "10px 'Malgun Gothic', sans-serif"; ctx.textAlign = "right";
    for (let y = 0; y <= 44; y += 4) ctx.fillText(y, X(-1) - 3, Y(y) + 3);
    ctx.textAlign = "center";
    for (let x = 0; x <= 28; x += 7) ctx.fillText(x, X(x), Y(-1) + 12);
  }
  function marker([x, y], color, label) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(X(x), Y(y), 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 9px 'Malgun Gothic', sans-serif"; ctx.textAlign = "center"; ctx.fillText(label[0], X(x), Y(y) + 3);
    ctx.fillStyle = color; ctx.font = "bold 11px 'Malgun Gothic', sans-serif";
    ctx.fillText(label, X(x) + (x > 20 ? -20 : 22), Y(y) + (y > 40 ? -10 : 4));
  }

  /* ---------- 걷는 애니메이션 ---------- */
  const SPEED = 22;     // 화면 속 속도 (m/초) — 284 m 를 약 13초에
  let walkers = [], raf = null, last = null;

  function makeWalker(seq, color, key) {
    const pts = fullPath(seq);
    return { pts, color, key, total: pathLen(pts), d: 0, seq };
  }
  function posAt(w, d) {
    let acc = 0;
    for (let i = 0; i < w.pts.length - 1; i++) {
      const seg = manhattan(w.pts[i], w.pts[i + 1]);
      if (acc + seg >= d) {
        const t = seg ? (d - acc) / seg : 0;
        return { p: [w.pts[i][0] + (w.pts[i + 1][0] - w.pts[i][0]) * t, w.pts[i][1] + (w.pts[i + 1][1] - w.pts[i][1]) * t], i };
      }
      acc += seg;
    }
    return { p: w.pts[w.pts.length - 1], i: w.pts.length - 2 };
  }
  function drawWalkers() {
    drawMap();
    walkers.forEach((w, wi) => {
      const shift = walkers.length > 1 ? (wi === 0 ? -2 : 2) : 0;   // 두 경로가 겹쳐도 보이게 살짝 비킨다
      const { p, i } = posAt(w, w.d);
      ctx.strokeStyle = w.color; ctx.lineWidth = 3; ctx.globalAlpha = .85;
      ctx.beginPath(); ctx.moveTo(X(w.pts[0][0]) + shift, Y(w.pts[0][1]) + shift);
      for (let k = 1; k <= i; k++) ctx.lineTo(X(w.pts[k][0]) + shift, Y(w.pts[k][1]) + shift);
      ctx.lineTo(X(p[0]) + shift, Y(p[1]) + shift); ctx.stroke(); ctx.globalAlpha = 1;
      // 들른 순서 번호
      let acc = 0, visited = 0;
      const stops = w.seq.map(c => LOCATIONS[c]);
      for (let k = 0; k < w.pts.length - 1; k++) {
        acc += manhattan(w.pts[k], w.pts[k + 1]);
        if (acc > w.d + 1e-9) break;
        const hit = stops.findIndex(s => s[0] === w.pts[k + 1][0] && s[1] === w.pts[k + 1][1]);
        if (hit >= 0 && hit === visited) {
          visited++;
          ctx.fillStyle = w.color; ctx.beginPath();
          ctx.arc(X(stops[hit][0]) - 14 + (wi * 28), Y(stops[hit][1]) - 12, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.font = "bold 10px 'Malgun Gothic', sans-serif"; ctx.textAlign = "center";
          ctx.fillText(visited, X(stops[hit][0]) - 14 + (wi * 28), Y(stops[hit][1]) - 8.5);
        }
      }
      // 작업자
      ctx.fillStyle = w.color; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(X(p[0]) + shift, Y(p[1]) + shift, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      document.getElementById(w.key === "raw" ? "pk-raw-live" : "pk-opt-live").textContent = fmt(w.d);
    });
  }
  function loop(t) {
    if (last == null) last = t;
    const dt = Math.min(.05, (t - last) / 1000); last = t;
    let moving = false;
    walkers.forEach(w => { if (w.d < w.total) { w.d = Math.min(w.total, w.d + SPEED * dt); moving = true; } });
    drawWalkers();
    raf = moving ? requestAnimationFrame(loop) : null;
  }
  function run(which) {
    cancelAnimationFrame(raf); last = null;
    document.getElementById("pk-raw-live").textContent = "0";
    document.getElementById("pk-opt-live").textContent = "0";
    walkers = [];
    if (which !== "opt") walkers.push(makeWalker(order, "#d9534f", "raw"));
    if (which !== "raw") walkers.push(makeWalker(serpentine(order), "#1e6fd9", "opt"));
    raf = requestAnimationFrame(loop);
  }

  /* ---------- 수치 · 그래프 ---------- */
  const chart = new Chart(document.getElementById("pk-chart"), {
    type: "bar",
    data: { labels: ["주문 순서", "지그재그"], datasets: [{ data: [0, 0], backgroundColor: ["#d9534f", "#1e6fd9"], borderRadius: 6 }] },
    options: {
      indexAxis: "y",
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmt(c.parsed.x) + " m" } } },
      scales: { x: { beginAtZero: true, title: { display: true, text: "걷는 거리 (m)" } } },
    },
  });
  const orders = bindRange("pk-orders", 0, updateDaily);

  function updateNumbers() {
    const raw = routeLength(order), opt = routeLength(serpentine(order));
    document.getElementById("pk-raw").textContent = fmt(raw);
    document.getElementById("pk-opt").textContent = fmt(opt);
    document.getElementById("pk-raw-seq").textContent = order.join(" → ");
    document.getElementById("pk-opt-seq").textContent = serpentine(order).join(" → ");
    document.getElementById("pk-save").textContent = `${fmt(raw - opt)} m (${pct((raw - opt) / raw)})`;
    chart.data.datasets[0].data = [raw, opt]; chart.update();
    updateDaily();
  }
  function updateDaily() {
    const raw = routeLength(order), opt = routeLength(serpentine(order));
    const km = (raw - opt) * orders.value / 1000;
    document.getElementById("pk-daily").innerHTML =
      `오더 ${fmt(orders.value)}건 × ${fmt(raw - opt)} m = 하루 <b>${fmt(km, 1)} km</b> 절감<br>
       시속 4 km로 걷는다면 하루 <b>${fmt(km / 4, 1)}시간</b>분의 작업이 사라집니다.
       <div class="small text-secondary mt-1">설비를 하나도 사지 않고 줄인 거리입니다.</div>`;
  }

  document.getElementById("pk-run-raw").addEventListener("click", () => run("raw"));
  document.getElementById("pk-run-opt").addEventListener("click", () => run("opt"));
  document.getElementById("pk-run-both").addEventListener("click", () => run("both"));
  document.getElementById("pk-shuffle").addEventListener("click", () => {
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    updateNumbers(); walkers = []; drawMap();
  });
  document.getElementById("pk-default").addEventListener("click", () => {
    order = DEFAULT_ORDER.slice(); updateNumbers(); walkers = []; drawMap();
  });

  orders.refresh();
  updateNumbers();
  drawMap();

  BSP.register("picking", {
    onShow() {
      chart.resize();
      if (!walkers.length) run("both");
      else if (walkers.some(w => w.d < w.total)) { last = null; raf = requestAnimationFrame(loop); }
      else drawWalkers();
    },
    onHide() { cancelAnimationFrame(raf); raf = null; },
  });
})();
