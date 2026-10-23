/* 공통 — 메뉴 이동, 숫자 표시, 캔버스 크기 맞추기 */
const BSP = {
  pages: {},          // 페이지 이름 → { onShow, onHide }
  current: null,

  register(name, hooks) { this.pages[name] = hooks; },

  show(name) {
    if (!document.getElementById("page-" + name)) name = "home";
    if (this.current && this.pages[this.current] && this.pages[this.current].onHide) {
      this.pages[this.current].onHide();
    }
    document.querySelectorAll(".page").forEach(p => p.classList.add("d-none"));
    document.getElementById("page-" + name).classList.remove("d-none");
    document.querySelectorAll("[data-page]").forEach(a =>
      a.classList.toggle("active", a.dataset.page === name));
    this.current = name;
    if (this.pages[name] && this.pages[name].onShow) this.pages[name].onShow();
    window.scrollTo(0, 0);
    // 모바일에서 메뉴를 고르면 접는다
    const nav = document.getElementById("mainNav");
    if (nav.classList.contains("show")) bootstrap.Collapse.getOrCreateInstance(nav).hide();
  },
};

/* 숫자 표시 */
const fmt = (n, d = 0) => Number(n).toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (r, d = 0) => (r * 100).toFixed(d) + "%";

/* 고해상도 화면에서도 선명하게: 캔버스의 화면 크기에 맞춰 내부 픽셀을 조정하고 2D 컨텍스트를 돌려준다 */
function fitCanvas(canvas, cssHeight) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || canvas.parentElement.clientWidth;
  const h = cssHeight || canvas.clientHeight || Number(canvas.getAttribute("height"));
  canvas.style.height = h + "px";
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

/* 둥근 사각형 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* Chart.js 기본값 */
Chart.defaults.font.family = '"Malgun Gothic", "맑은 고딕", system-ui, sans-serif';
Chart.defaults.color = "#3c5260";
Chart.defaults.maintainAspectRatio = false;

/* 슬라이더 옆 값 표시를 자동으로 연결: <input id="x"> ↔ <b id="x-v"> */
function bindRange(id, digits, onChange) {
  const el = document.getElementById(id);
  const out = document.getElementById(id + "-v");
  const update = () => {
    if (out) out.textContent = Number(el.value).toFixed(digits);
    onChange();
  };
  el.addEventListener("input", update);
  return { el, set(v) { el.value = v; update(); }, get value() { return Number(el.value); }, refresh: () => { if (out) out.textContent = Number(el.value).toFixed(digits); } };
}

window.addEventListener("hashchange", () => BSP.show(location.hash.slice(1)));
window.addEventListener("DOMContentLoaded", () => BSP.show(location.hash.slice(1) || "home"));
window.addEventListener("resize", () => {
  const p = BSP.pages[BSP.current];
  if (p && p.onResize) p.onResize();
});
