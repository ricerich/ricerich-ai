/* 실습 ① 컨베이어 처리량 — conveyor.py 와 같은 식 */
(() => {
  const throughputPerHour = (speedMpm, boxLen, gap) => speedMpm / (boxLen + gap) * 60;

  const speed = bindRange("cv-speed", 0, update);
  const box = bindRange("cv-box", 2, update);
  const gap = bindRange("cv-gap", 2, update);
  const needEl = document.getElementById("cv-need");
  needEl.addEventListener("input", update);

  /* ---------- 그래프: 속도 20~60 m/분, 간격 0.15 / 0.20 / 0.25 ---------- */
  const speeds = [];
  for (let s = 20; s <= 60; s += 2) speeds.push(s);
  const chart = new Chart(document.getElementById("cv-chart"), {
    type: "line",
    data: {
      labels: speeds,
      datasets: [
        { label: "간격 0.15 m", data: [], borderColor: "#e0902a", backgroundColor: "#e0902a", tension: 0, pointRadius: 0, borderWidth: 2 },
        { label: "간격 0.20 m", data: [], borderColor: "#0e4a5c", backgroundColor: "#0e4a5c", tension: 0, pointRadius: 0, borderWidth: 2 },
        { label: "간격 0.25 m", data: [], borderColor: "#7aa6b5", backgroundColor: "#7aa6b5", tension: 0, pointRadius: 0, borderWidth: 2 },
        { label: "피크 필요량", data: [], borderColor: "#c8463a", borderDash: [6, 4], pointRadius: 0, borderWidth: 2 },
        { label: "지금 설정", data: [], type: "scatter", backgroundColor: "#c8463a", borderColor: "#fff", pointRadius: 8, pointHoverRadius: 9, borderWidth: 2 },
      ],
    },
    options: {
      interaction: { mode: "nearest", intersect: false },
      scales: {
        x: { type: "linear", min: 20, max: 60, title: { display: true, text: "벨트 속도 (m/분)" } },
        y: { beginAtZero: true, title: { display: true, text: "시간당 처리량 (개)" }, ticks: { callback: v => fmt(v) } },
      },
      plugins: {
        tooltip: { callbacks: { label: c => `${c.dataset.label}: ${fmt(c.parsed.y)}개/h (속도 ${c.parsed.x} m/분)` } },
        legend: { position: "bottom" },
      },
    },
  });

  function update() {
    const s = speed.value, b = box.value, g = gap.value, need = Number(needEl.value) || 0;
    const tp = throughputPerHour(s, b, g);
    document.getElementById("cv-pitch").textContent = (b + g).toFixed(2) + " m";
    document.getElementById("cv-tp").textContent = fmt(tp) + " 개";
    const ok = tp >= need;
    const jb = document.getElementById("cv-judge-box");
    jb.classList.toggle("ok", ok);
    jb.classList.toggle("bad", !ok);
    document.getElementById("cv-judge").textContent = (ok ? "충분 " : "부족 ") + (tp - need >= 0 ? "+" : "") + fmt(tp - need);

    // 그래프 — 간격 세 줄은 현재 박스 길이 기준
    [0.15, 0.20, 0.25].forEach((gg, i) => {
      chart.data.datasets[i].data = speeds.map(x => ({ x, y: throughputPerHour(x, b, gg) }));
    });
    chart.data.datasets[3].data = [{ x: 20, y: need }, { x: 60, y: need }];
    chart.data.datasets[4].data = [{ x: s, y: tp }];
    chart.update("none");

    // 실습 표 (30·36·42·48 m/분)
    const tbody = document.querySelector("#cv-table tbody");
    tbody.innerHTML = [30, 36, 42, 48].map(v => {
      const t = throughputPerHour(v, b, g);
      const good = t >= need;
      return `<tr class="${v === s ? "table-active fw-semibold" : ""}"><td>${v} m/분</td><td>${fmt(t)}</td>
              <td><span class="badge ${good ? "text-bg-success" : "text-bg-danger"}">${good ? "충분" : "부족"}</span></td></tr>`;
    }).join("");

    resetSim();
  }

  /* ---------- 벨트 애니메이션 ---------- */
  const canvas = document.getElementById("cv-canvas");
  let ctx, W, H;
  const VIEW_M = 8;                 // 화면에 보이는 벨트 길이 8 m
  let boxes = [], offset = 0, simTime = 0, count = 0, sinceSpawn = 0;
  let running = true, fast = 1, raf = null, last = null;

  function resize() { ({ ctx, w: W, h: H } = fitCanvas(canvas, 170)); draw(); }

  function resetSim() {
    // 벨트 전체에 피치 간격으로 박스를 미리 깔아 두고 시작 (정상 상태)
    const pitch = box.value + gap.value;
    boxes = []; simTime = 0; count = 0; sinceSpawn = 0;
    for (let x = VIEW_M - box.value; x > -box.value; x -= pitch) boxes.push({ x, c: COLORS[boxes.length % 3], counted: x + box.value >= VIEW_M * 0.82 });
    sinceSpawn = boxes[boxes.length - 1].x + box.value;   // 맨 왼쪽 박스와 다음 박스 사이도 정확히 피치
    document.getElementById("cv-count").textContent = "0";
    document.getElementById("cv-simtp").textContent = "-";
  }

  const COLORS = ["#c99a5b", "#b8874a", "#d4a868"];

  function step(dt) {
    const v = speed.value / 60;        // m/s
    const d = v * dt;
    const pitch = box.value + gap.value;
    simTime += dt;
    offset = (offset + d) % 1;
    boxes.forEach(bx => bx.x += d);
    sinceSpawn += d;
    while (sinceSpawn >= pitch) {      // 피치만큼 벨트가 움직일 때마다 박스 하나 투입
      sinceSpawn -= pitch;
      boxes.push({ x: -box.value + sinceSpawn, c: COLORS[(count + boxes.length) % 3], counted: false });
    }
    const sensor = VIEW_M * 0.82;
    boxes.forEach(bx => {
      if (!bx.counted && bx.x + box.value >= sensor) { bx.counted = true; count++; }
    });
    boxes = boxes.filter(bx => bx.x < VIEW_M + 0.5);
    document.getElementById("cv-count").textContent = fmt(count);
    if (simTime > 10) document.getElementById("cv-simtp").textContent = fmt(count / simTime * 3600);
  }

  function draw() {
    if (!ctx) return;
    const padX = 20, beltY = 70, beltH = 46;
    const scale = (W - padX * 2) / VIEW_M;      // 1 m 당 픽셀
    ctx.clearRect(0, 0, W, H);

    // 프레임과 다리
    ctx.fillStyle = "#9fb3bd";
    for (let i = 0; i <= 4; i++) ctx.fillRect(padX + i * (W - padX * 2) / 4 - 3, beltY + beltH, 6, 40);
    // 벨트
    ctx.fillStyle = "#2f3b42";
    roundRect(ctx, padX - 12, beltY, W - padX * 2 + 24, beltH, 23); ctx.fill();
    ctx.fillStyle = "#3d4b53";
    ctx.fillRect(padX, beltY + 6, W - padX * 2, beltH - 12);
    // 1 m 눈금 (벨트와 함께 움직임)
    ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 2;
    for (let m = -1; m <= VIEW_M + 1; m++) {
      const x = padX + (m + offset) * scale;
      if (x < padX || x > W - padX) continue;
      ctx.beginPath(); ctx.moveTo(x, beltY + 8); ctx.lineTo(x, beltY + beltH - 8); ctx.stroke();
    }
    // 롤러 (회전)
    const rollerR = 9, ang = offset * Math.PI * 2 * 4;
    [padX - 2, W - padX + 2].forEach(cx => {
      ctx.fillStyle = "#c4d2d8"; ctx.beginPath(); ctx.arc(cx, beltY + beltH / 2, rollerR + 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#5d7481"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, beltY + beltH / 2);
      ctx.lineTo(cx + Math.cos(ang) * (rollerR + 4), beltY + beltH / 2 + Math.sin(ang) * (rollerR + 4)); ctx.stroke();
    });
    // 박스
    const bh = 34;
    boxes.forEach(bx => {
      const x = padX + bx.x * scale, w = box.value * scale;
      if (x + w < padX - 10 || x > W - padX + 10) return;
      ctx.fillStyle = bx.c; ctx.fillRect(x, beltY - bh + 4, w, bh);
      ctx.strokeStyle = "#7a5a2e"; ctx.lineWidth = 1; ctx.strokeRect(x + .5, beltY - bh + 4.5, w - 1, bh - 1);
      ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fillRect(x + w / 2 - 3, beltY - bh + 4, 6, bh);   // 테이프
    });
    // 간격 표시 (첫 두 박스 사이)
    const vis = boxes.filter(bx => bx.x > 1 && bx.x < VIEW_M * 0.6).sort((a, b) => b.x - a.x);
    if (vis.length >= 2) {
      const a = vis[1], b2 = vis[0];
      const x1 = padX + (a.x + box.value) * scale, x2 = padX + b2.x * scale;
      ctx.strokeStyle = "#e0902a"; ctx.fillStyle = "#e0902a"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x1, 22); ctx.lineTo(x2, 22); ctx.stroke();
      ctx.font = "12px 'Malgun Gothic', sans-serif"; ctx.textAlign = "center";
      ctx.fillText("간격 " + gap.value.toFixed(2) + " m", (x1 + x2) / 2, 16);
    }
    // 센서
    const sx = padX + VIEW_M * 0.82 * scale;
    ctx.strokeStyle = "#c8463a"; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(sx, 28); ctx.lineTo(sx, beltY + beltH); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#c8463a"; ctx.font = "12px 'Malgun Gothic', sans-serif"; ctx.textAlign = "left";
    ctx.fillText("카운트 센서", sx + 5, beltY + beltH + 16);
    ctx.fillStyle = "#3c5260"; ctx.fillText(`속도 ${speed.value} m/분 = ${(speed.value / 60).toFixed(2)} m/s`, padX, H - 8);
  }

  function loop(t) {
    if (last == null) last = t;
    const dt = Math.min(0.05, (t - last) / 1000) * fast;
    last = t;
    if (running) step(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  document.getElementById("cv-play").addEventListener("click", e => {
    running = !running; e.target.textContent = running ? "일시정지" : "재생";
  });
  document.getElementById("cv-fast").addEventListener("click", e => {
    fast = fast === 1 ? 2 : 1; e.target.textContent = fast === 1 ? "2배속" : "1배속";
    e.target.classList.toggle("active", fast === 2);
  });
  document.getElementById("cv-reset").addEventListener("click", () => {
    speed.el.value = 36; box.el.value = 0.4; gap.el.value = 0.2; needEl.value = 4000;
    [speed, box, gap].forEach(r => r.refresh()); update();
  });
  document.getElementById("cv-try").addEventListener("click", () => gap.set(0.15));

  [speed, box, gap].forEach(r => r.refresh());
  update();

  BSP.register("conveyor", {
    onShow() { resize(); chart.resize(); last = null; if (!raf) raf = requestAnimationFrame(loop); },
    onHide() { cancelAnimationFrame(raf); raf = null; },
    onResize: resize,
  });
})();
