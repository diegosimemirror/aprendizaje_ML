/* ============================================================
   comun.js: herramientas compartidas por las lecciones 2 en adelante
   (la lección 1 conserva su propio archivo, leccion-01.js).

   Uso en una página:
     <body data-leccion="leccion-02">
     <script defer src="recursos/comun.js"></script>
     <script defer src="recursos/leccion-02.js"></script>
   y, al final de leccion-02.js:  ML.arrancar([labUno, labDos, ...]);

   Todo queda en el objeto global ML (por ejemplo, ML.Grafico, ML.m, ML.num).
   ============================================================ */
(function () {
'use strict';

/* ============================================================
   PROCESO 0: Utilidades de texto, números y azar
   Insumo:    nada
   Resultado: funciones pequeñas que usan todos los laboratorios
   ============================================================ */

// css('--g-serie1') → '#4338ca'. Lee un color de estilos.css (cambia con el modo oscuro).
function css(nombre) { return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim(); }

// num(3.14159, 2) → '3,14';  num(-2, 0) → '−2';  num(809655, 0) → '809 655'
function num(valor, decimales) {
  if (decimales === undefined) decimales = 2;
  if (!isFinite(valor)) return '—';
  const s = Math.abs(valor).toFixed(decimales);
  const partes = s.split('.');
  let entero = partes[0];
  if (entero.length > 4) entero = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const signo = (valor < 0 && Number(s) !== 0) ? '−' : '';
  return signo + entero + (partes[1] ? ',' + partes[1] : '');
}
// pct(0.0512) → '5,1 %'. Con probabilidades muy pequeñas usa más decimales.
function pct(p, d) {
  const v = p * 100;
  if (d === undefined) d = v < 0.1 ? 3 : v < 1 ? 2 : 1;
  return num(v, d) + ' %';
}
// rango(0, 10, 2) → [0, 2, 4, 6, 8, 10]
function rango(a, b, paso) {
  const r = [];
  for (let v = a; v <= b + paso * 1e-9; v += paso) r.push(Math.round(v * 1e9) / 1e9);
  return r;
}
// marcas(0, 418, 5) → [0, 100, 200, 300, 400]: valores «redondos» para un eje.
function marcas(a, b, n) {
  const bruto = (b - a) / Math.max(1, n);
  const pot = Math.pow(10, Math.floor(Math.log10(bruto)));
  const paso = [1, 2, 2.5, 5, 10].map(x => x * pot).find(p => p >= bruto) || 10 * pot;
  return rango(Math.ceil(a / paso) * paso, b, paso);
}
// hexARgb('#4338ca') → [67, 56, 202]
function hexARgb(hex) {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16));
}
// azarConSemilla(7) → función que da números entre 0 y 1, siempre los mismos para la misma semilla.
function azarConSemilla(semilla) {
  let a = semilla >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// normalAzar(azar) → un número de una normal estándar (método de Box-Muller).
function normalAzar(azar) {
  const u = (azar || Math.random)() || 1e-12, v = (azar || Math.random)();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
// barajar([1,2,3]) → [3,1,2]: cambia el orden al azar (Fisher-Yates).
function barajar(lista, azar) {
  const r = lista.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor((azar || Math.random)() * (i + 1));
    const t = r[i]; r[i] = r[j]; r[j] = t;
  }
  return r;
}
// Phi(z) → probabilidad acumulada de la normal estándar (aproximación de Abramowitz y Stegun).
function Phi(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

/* ============================================================
   PROCESO 1: Fórmulas con KaTeX
   Insumo:    texto TeX
   Resultado: fórmulas dibujadas, con coma decimal
   ============================================================ */
// m('x^2') → HTML de KaTeX para insertar una fórmula dentro de un texto.
function m(tex) {
  try { return window.katex ? window.katex.renderToString(tex, { throwOnError: false }) : tex; }
  catch (e) { return tex; }
}
// teX(0.05, 2) → '0{,}05': número para TeX, con coma decimal y sin espacio extra.
function teX(v, d) { return num(v, d).replace(',', '{,}').replace('−', '-').replace(/ /g, '\\,'); }
// frT(2, 6) → '\tfrac{1}{3}': fracción simplificada en TeX.
function frT(k, n) {
  if (k === 0) return '0';
  if (k === n) return '1';
  const mcd = (a, b) => b ? mcd(b, a % b) : a, d = mcd(k, n);
  return '\\tfrac{' + (k / d) + '}{' + (n / d) + '}';
}
// formula(elemento, tex): dibuja una fórmula grande dentro de un elemento.
function formula(el, tex, display) {
  if (!el) return;
  if (window.katex) window.katex.render(tex, el, { displayMode: display !== false, throwOnError: false });
  else el.textContent = tex;
}
function iniciarFormulas() {
  if (window.renderMathInElement) {
    window.renderMathInElement(document.body, {
      delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }],
      throwOnError: false
    });
  }
}

/* ============================================================
   PROCESO 2: Gráficos en <canvas>
   Insumo:    un lienzo y los rangos de los datos
   Resultado: ejes, curvas, puntos, textos, mapas de curvas de nivel y superficies 3D
   ============================================================ */
const LETRA = '"Schibsted Grotesk", "Helvetica Neue", Arial, sans-serif';

/* Grafico: lienzo con escalas. Entrada: canvas y {prop, min, max, x:[a,b], y:[c,d], m:{i,d,s,b}}.
   Salida: métodos que dibujan en coordenadas de datos. */
class Grafico {
  constructor(canvas, op) {
    this.canvas = canvas;
    this.op = Object.assign({ prop: 0.55, min: 220, max: 480 }, op);
    this.op.m = Object.assign({ i: 48, d: 14, s: 14, b: 46 }, op.m || {});
    this.preparar();
  }
  preparar() {
    const c = this.canvas, o = this.op;
    const w = Math.max(200, c.clientWidth || (c.parentElement && c.parentElement.clientWidth) || 600);
    const h = Math.max(o.min, Math.min(o.max, Math.round(w * o.prop)));
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.height = h + 'px';
    this.ctx = c.getContext('2d'); this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w; this.h = h; this.dpr = dpr;
    const mm = o.m; this.x0 = mm.i; this.x1 = w - mm.d; this.y0 = h - mm.b; this.y1 = mm.s;
    this.ctx.clearRect(0, 0, w, h);
    return this;
  }
  X(v) { const r = this.op.x; return this.x0 + (v - r[0]) * (this.x1 - this.x0) / (r[1] - r[0]); }
  Y(v) { const r = this.op.y; return this.y0 - (v - r[0]) * (this.y0 - this.y1) / (r[1] - r[0]); }
  invX(px) { const r = this.op.x; return r[0] + (px - this.x0) * (r[1] - r[0]) / (this.x1 - this.x0); }
  invY(py) { const r = this.op.y; return r[0] + (this.y0 - py) * (r[1] - r[0]) / (this.y0 - this.y1); }
  recortar() { const c = this.ctx; c.save(); c.beginPath(); c.rect(this.x0, this.y1, this.x1 - this.x0, this.y0 - this.y1); c.clip(); }
  soltar() { this.ctx.restore(); }
  ejes(o) {
    o = Object.assign({ xt: [], yt: [], fx: v => num(v, 0), fy: v => num(v, 0), ex: '', ey: '', rejillaX: true, rejillaY: true }, o);
    const c = this.ctx;
    c.save(); c.font = '500 11.5px ' + LETRA; c.lineWidth = 1;
    c.strokeStyle = css('--g-rejilla'); c.fillStyle = css('--tinta-suave');
    c.textAlign = 'center'; c.textBaseline = 'top';
    o.xt.forEach(v => { const x = this.X(v); if (o.rejillaX) { c.beginPath(); c.moveTo(x, this.y1); c.lineTo(x, this.y0); c.stroke(); } c.fillText(o.fx(v), x, this.y0 + 6); });
    c.textAlign = 'right'; c.textBaseline = 'middle';
    o.yt.forEach(v => { const y = this.Y(v); if (o.rejillaY) { c.beginPath(); c.moveTo(this.x0, y); c.lineTo(this.x1, y); c.stroke(); } c.fillText(o.fy(v), this.x0 - 6, y); });
    c.strokeStyle = css('--g-eje'); c.beginPath(); c.moveTo(this.x0, this.y0); c.lineTo(this.x1, this.y0); c.stroke();
    c.font = '600 11.5px ' + LETRA;
    if (o.ex) { c.textAlign = 'right'; c.textBaseline = 'top'; c.fillText(o.ex, this.x1, this.y0 + 24); }
    if (o.ey) { c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(o.ey, this.x0 + 4, this.y1); }
    c.restore();
  }
  linea(pts, o) {
    o = Object.assign({ color: css('--g-serie1'), ancho: 2, guion: null, alfa: 1 }, o);
    const c = this.ctx;
    c.save(); c.globalAlpha = o.alfa; c.strokeStyle = o.color; c.lineWidth = o.ancho; c.lineJoin = 'round'; c.lineCap = 'round';
    if (o.guion) c.setLineDash(o.guion);
    c.beginPath(); pts.forEach((p, i) => { const x = this.X(p[0]), y = this.Y(p[1]); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.stroke(); c.restore();
  }
  funcion(f, o) {
    o = Object.assign({ desde: this.op.x[0], hasta: this.op.x[1], pasos: 400 }, o);
    const pts = [];
    for (let i = 0; i <= o.pasos; i++) { const x = o.desde + (o.hasta - o.desde) * i / o.pasos, y = f(x); if (isFinite(y)) pts.push([x, y]); }
    this.recortar(); this.linea(pts, o); this.soltar();
  }
  punto(x, y, o) {
    o = Object.assign({ r: 5, color: css('--g-serie1'), borde: null, hueco: false, alfa: 1 }, o);
    const c = this.ctx;
    c.save(); c.globalAlpha = o.alfa; c.beginPath(); c.arc(this.X(x), this.Y(y), o.r, 0, Math.PI * 2);
    if (o.hueco) { c.strokeStyle = o.color; c.lineWidth = 1.8; c.stroke(); }
    else { c.fillStyle = o.color; c.fill(); if (o.borde) { c.strokeStyle = o.borde; c.lineWidth = 2; c.stroke(); } }
    c.restore();
  }
  texto(s, x, y, o) { this.textoPx(s, this.X(x), this.Y(y), o); }
  textoPx(s, px, py, o) {
    o = Object.assign({ color: css('--tinta'), al: 'left', base: 'middle', tam: 12, peso: 500, fondo: false }, o);
    const c = this.ctx;
    c.save(); c.font = o.peso + ' ' + o.tam + 'px ' + LETRA; c.textAlign = o.al; c.textBaseline = o.base;
    if (o.fondo) {
      const ancho = c.measureText(s).width, ix = o.al === 'center' ? px - ancho / 2 : o.al === 'right' ? px - ancho : px;
      c.fillStyle = css('--papel-2'); c.globalAlpha = 0.85; c.fillRect(ix - 3, py - o.tam * 0.7, ancho + 6, o.tam * 1.4); c.globalAlpha = 1;
    }
    c.fillStyle = o.color; c.fillText(s, px, py); c.restore();
  }
  flechaPx(x0, y0, x1, y1, o) {
    o = Object.assign({ color: css('--g-serie2'), ancho: 2.5, punta: 9 }, o);
    const c = this.ctx, ang = Math.atan2(y1 - y0, x1 - x0);
    c.save(); c.strokeStyle = o.color; c.fillStyle = o.color; c.lineWidth = o.ancho; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - Math.cos(ang) * o.punta * 0.6, y1 - Math.sin(ang) * o.punta * 0.6); c.stroke();
    c.beginPath(); c.moveTo(x1, y1);
    c.lineTo(x1 - o.punta * Math.cos(ang - 0.42), y1 - o.punta * Math.sin(ang - 0.42));
    c.lineTo(x1 - o.punta * Math.cos(ang + 0.42), y1 - o.punta * Math.sin(ang + 0.42));
    c.closePath(); c.fill(); c.restore();
  }
  rect(xa, ya, xb, yb, color, alfa) {
    const c = this.ctx;
    c.save(); c.globalAlpha = alfa === undefined ? 1 : alfa; c.fillStyle = color;
    const x = Math.min(this.X(xa), this.X(xb)), y = Math.min(this.Y(ya), this.Y(yb));
    c.fillRect(x, y, Math.abs(this.X(xb) - this.X(xa)), Math.abs(this.Y(yb) - this.Y(ya)));
    c.restore();
  }
}

/* pintarMapa: función f(x, y) y niveles → mapa de curvas de nivel (bandas de color con borde). */
const memoriaMapas = {};
function pintarMapa(g, f, niveles, clave) {
  const dpr = g.dpr, px0 = Math.round(g.x0 * dpr), py0 = Math.round(g.y1 * dpr);
  const W = Math.round((g.x1 - g.x0) * dpr), H = Math.round((g.y0 - g.y1) * dpr);
  const firma = [clave, W, H, css('--g-mapa-bajo'), css('--g-mapa-alto')].join('|');
  let img = memoriaMapas[firma];
  if (!img) {
    img = g.ctx.createImageData(W, H);
    const bajo = hexARgb(css('--g-mapa-bajo')), alto = hexARgb(css('--g-mapa-alto')), lin = hexARgb(css('--g-eje'));
    const banda = new Int16Array(W * H);
    for (let j = 0; j < H; j++) {
      const y = g.invY(g.y1 + j / dpr);
      for (let i = 0; i < W; i++) { const v = f(g.invX(g.x0 + i / dpr), y); let b = 0; while (b < niveles.length && v > niveles[b]) b++; banda[j * W + i] = b; }
    }
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = j * W + i, b = banda[k];
      const borde = (i + 1 < W && banda[k + 1] !== b) || (j + 1 < H && banda[k + W] !== b);
      const t = Math.pow(b / niveles.length, 0.8);
      const col = borde ? lin : [0, 1, 2].map(q => Math.round(bajo[q] + (alto[q] - bajo[q]) * t));
      img.data[4 * k] = col[0]; img.data[4 * k + 1] = col[1]; img.data[4 * k + 2] = col[2]; img.data[4 * k + 3] = 255;
    }
    memoriaMapas[firma] = img;
  }
  g.ctx.putImageData(img, px0, py0);
}

/* superficie3D: dibuja una función de dos variables como terreno en 3D.
   Entrada: canvas y {f, x:[a,b], y:[c,d], zMin, zMax, vista:[giro, inclinación], lineas:[{pts:[[x,y],...], color, ancho}],
            camino:[[x,y],...], estrella:[x,y], rotuloX, rotuloY, titulo}.
   Salida: el dibujo. Dentro de una vista, una unidad mide lo mismo en las tres direcciones. */
function superficie3D(canvas, o) {
  const g = new Grafico(canvas, { prop: o.prop || 0.56, min: o.min || 300, max: o.max || 560, x: [0, 1], y: [0, 1], m: { i: 0, d: 0, s: 0, b: 0 } });
  const c = g.ctx, az = o.vista[0], el = o.vista[1], f = o.f;
  const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
  const cx0 = (o.x[0] + o.x[1]) / 2, cy0 = (o.y[0] + o.y[1]) / 2;
  const escZ = (o.altura || 0.45 * Math.max(o.x[1] - o.x[0], o.y[1] - o.y[0])) / (o.zMax - o.zMin);
  const altura = v => (Math.min(v, o.zMax) - o.zMin) * escZ - (o.zMax - o.zMin) * escZ / 2;
  const crudo = (X, Y, Z) => { const xr = (X - cx0) * ca - (Y - cy0) * sa, yr = (X - cx0) * sa + (Y - cy0) * ca; return [xr, yr * se + Z * ce, yr * ce - Z * se]; };
  let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
  for (let i = 0; i <= 16; i++) for (let j = 0; j <= 16; j++) {
    const X = o.x[0] + (o.x[1] - o.x[0]) * i / 16, Y = o.y[0] + (o.y[1] - o.y[0]) * j / 16, q = crudo(X, Y, altura(f(X, Y)));
    a0 = Math.min(a0, q[0]); a1 = Math.max(a1, q[0]); b0 = Math.min(b0, q[1]); b1 = Math.max(b1, q[1]);
  }
  const esc = Math.min((g.w - 40) / (a1 - a0), (g.h - 60) / (b1 - b0));
  const cx = g.w / 2 - esc * (a0 + a1) / 2, cy = g.h / 2 + 10 + esc * (b0 + b1) / 2;
  const proy = (X, Y, Z) => { const q = crudo(X, Y, Z); return [cx + esc * q[0], cy - esc * q[1], q[2]]; };
  const bajo = hexARgb(css('--g-mapa-bajo')), alto = hexARgb(css('--g-mapa-alto'));
  const NX = o.nx || 36, NY = o.ny || 36, malla = [];
  for (let i = 0; i <= NX; i++) { malla.push([]); for (let j = 0; j <= NY; j++) {
    const X = o.x[0] + (o.x[1] - o.x[0]) * i / NX, Y = o.y[0] + (o.y[1] - o.y[0]) * j / NY, v = f(X, Y);
    malla[i].push({ X: X, Y: Y, v: v, p: proy(X, Y, altura(v)) }); } }
  const caras = [];
  for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
    const A = malla[i][j], B = malla[i + 1][j], D = malla[i + 1][j + 1], E = malla[i][j + 1];
    const ux = B.X - A.X, uz = altura(B.v) - altura(A.v), vy = E.Y - A.Y, vz = altura(E.v) - altura(A.v);
    const nx = -uz * vy, ny = -ux * vz, nz = ux * vy, nn = Math.hypot(nx, ny, nz) || 1;
    caras.push({ pts: [A.p, B.p, D.p, E.p], prof: (A.p[2] + B.p[2] + D.p[2] + E.p[2]) / 4, v: (A.v + B.v + D.v + E.v) / 4,
                 luz: Math.abs((nx * -0.35 + ny * -0.45 + nz * 0.82) / nn) });
  }
  caras.sort((p, q) => q.prof - p.prof);
  const linea = css('--g-eje'); c.lineWidth = 0.6;
  caras.forEach(k => {
    const t = Math.pow(Math.min(1, Math.max(0, (k.v - o.zMin) / (o.zMax - o.zMin))), 0.8), s = 0.72 + 0.28 * k.luz;
    c.fillStyle = 'rgb(' + [0, 1, 2].map(q => Math.round((bajo[q] + (alto[q] - bajo[q]) * t) * s)).join(',') + ')';
    c.beginPath(); k.pts.forEach((p, n) => n ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill();
    c.globalAlpha = 0.28; c.strokeStyle = linea; c.stroke(); c.globalAlpha = 1;
  });
  const encima = 0.03 * (o.x[1] - o.x[0]) / 8;
  const trazo = (pts, color, ancho) => {
    c.save(); c.strokeStyle = color; c.lineWidth = ancho; c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath();
    pts.forEach((q, n) => { const p = proy(q[0], q[1], altura(f(q[0], q[1])) + encima); if (n) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
    c.stroke(); c.restore();
  };
  (o.lineas || []).forEach(l => trazo(l.pts, l.color, l.ancho || 3));
  const dentro = (o.camino || []).filter(q => q[0] >= o.x[0] && q[0] <= o.x[1] && q[1] >= o.y[0] && q[1] <= o.y[1]);
  if (dentro.length) {
    trazo(dentro, css('--g-serie1'), 2.6);
    dentro.forEach((q, n) => { const p = proy(q[0], q[1], altura(f(q[0], q[1])) + encima); c.beginPath(); c.arc(p[0], p[1], n === dentro.length - 1 ? 6 : 3.5, 0, 2 * Math.PI); c.fillStyle = css('--g-serie1'); c.fill(); });
  }
  if (o.estrella) { const pm = proy(o.estrella[0], o.estrella[1], altura(f(o.estrella[0], o.estrella[1])) + encima); g.textoPx('★', pm[0], pm[1], { al: 'center', color: css('--g-serie4'), tam: 18, peso: 700 }); }
  const base = altura(o.zMin);
  const r1 = proy(o.x[1] + 0.08 * (o.x[1] - o.x[0]), o.y[0], base), r2 = proy(o.x[0], o.y[1] + 0.12 * (o.y[1] - o.y[0]), base);
  if (o.rotuloX && r1[0] > 60 && r1[0] < g.w - 60) g.textoPx(o.rotuloX, r1[0], r1[1], { al: 'center', color: css('--tinta-suave'), tam: 12, peso: 700, fondo: true });
  if (o.rotuloY && r2[0] > 60 && r2[0] < g.w - 60) g.textoPx(o.rotuloY, r2[0], r2[1], { al: 'center', color: css('--tinta-suave'), tam: 12, peso: 700, fondo: true });
  g.textoPx(o.titulo || 'Altura = error · arrastra para girar', 10, 14, { color: css('--tinta-suave'), tam: 12, peso: 600 });
  return g;
}
/* girable(canvas, estado, redibujar): arrastrar en horizontal gira el terreno; en vertical, inclina la mirada.
   estado.vista = [giro, inclinación] se modifica en el lugar. */
function girable(canvas, estado, redibujar, alGirar) {
  let ultimo = null;
  arrastrar(canvas, (px, py, tipo) => {
    if (tipo === 'pointerdown') { ultimo = [px, py]; return; }
    if (!ultimo) return;
    estado.vista = [estado.vista[0] - (px - ultimo[0]) * 0.01, Math.max(0.05, Math.min(1.56, estado.vista[1] + (py - ultimo[1]) * 0.01))];
    ultimo = [px, py];
    if (alGirar) alGirar();
    redibujar();
  });
  canvas.style.cursor = 'grab';
}

// Redibujo al cambiar el tamaño de la ventana o el tema.
const redibujos = [];
function alRedibujar(fn) { redibujos.push(fn); fn(); }
function redibujarTodo() { redibujos.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); }
// arrastrar(lienzo, fn): llama a fn(px, py, tipo) al hacer clic o arrastrar con mouse, dedo o lápiz.
function arrastrar(canvas, fn) {
  let activo = false;
  const pos = ev => { const r = canvas.getBoundingClientRect(); fn(ev.clientX - r.left, ev.clientY - r.top, ev.type); };
  canvas.addEventListener('pointerdown', ev => { activo = true; try { canvas.setPointerCapture(ev.pointerId); } catch (e) {} pos(ev); });
  canvas.addEventListener('pointermove', ev => { if (activo) pos(ev); });
  const fin = () => { activo = false; };
  canvas.addEventListener('pointerup', fin); canvas.addEventListener('pointercancel', fin);
  canvas.style.cursor = 'pointer';
}

/* ============================================================
   PROCESO 3: Barra superior, tema, retos y ficha de repaso
   Insumo:    la página con sus cajas
   Resultado: avance de lectura, modo claro u oscuro, retos con pistas y ficha imprimible
   ============================================================ */
function iniciarBarra() {
  const avance = document.getElementById('avance');
  const enlaces = Array.from(document.querySelectorAll('.barra__partes a'));
  const alDesplazar = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (avance) avance.style.width = (total > 0 ? Math.min(100, 100 * window.scrollY / total) : 0) + '%';
  };
  window.addEventListener('scroll', alDesplazar, { passive: true }); alDesplazar();
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) enlaces.forEach(a => a.classList.toggle('activa', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    enlaces.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) obs.observe(s); });
  }
}
function iniciarTema() {
  const boton = document.getElementById('boton-tema'); if (!boton) return;
  const CLAVE = 'aprendizaje-ml-tema', ciclo = ['', 'oscuro', 'claro'];
  const iconos = { '': '◐', oscuro: '☾', claro: '☀' };
  const nombres = { '': 'Tema automático (según tu sistema)', oscuro: 'Modo oscuro', claro: 'Modo claro' };
  const aplicar = t => {
    if (t) document.documentElement.setAttribute('data-tema', t); else document.documentElement.removeAttribute('data-tema');
    boton.textContent = iconos[t]; boton.title = nombres[t] + '. Clic para cambiar.';
  };
  let actual = document.documentElement.getAttribute('data-tema') || '';
  aplicar(actual);
  boton.addEventListener('click', () => {
    actual = ciclo[(ciclo.indexOf(actual) + 1) % ciclo.length];
    try { localStorage.setItem(CLAVE, actual); } catch (e) {}
    aplicar(actual); redibujarTodo();
  });
  if (window.matchMedia) { const mq = window.matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', redibujarTodo); }
  let espera; window.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(redibujarTodo, 150); });
}

const claveRetos = () => 'aprendizaje-ml-' + (document.body.dataset.leccion || 'leccion') + '-retos';
let resueltos = new Set();
function guardarRetos() { try { localStorage.setItem(claveRetos(), JSON.stringify(Array.from(resueltos))); } catch (e) {} }
function cajasReto() { return Array.from(document.querySelectorAll('.caja--reto[data-reto]')); }
function actualizarContador() {
  const el = document.getElementById('contador-retos'); if (!el) return;
  const cajas = cajasReto();
  el.textContent = cajas.filter(c => c.classList.contains('resuelto')).length + '/' + cajas.length + ' retos';
}
// marcarResuelto(caja): pinta la caja como resuelta, guarda el avance y actualiza el contador.
function marcarResuelto(caja) {
  if (!caja) return;
  caja.classList.add('resuelto'); resueltos.add(caja.dataset.reto); guardarRetos(); actualizarContador();
}
function mostrarPista(contenedor, texto) {
  let p = contenedor.querySelector(':scope > .pista-reto');
  if (!p) {
    p = document.createElement('p'); p.className = 'respuesta pista-reto visible';
    const opciones = contenedor.querySelector(':scope > .opciones');
    if (opciones) opciones.after(p); else contenedor.appendChild(p);
  }
  p.textContent = texto ? 'Pista: ' + texto : 'No es esa. Prueba otra opción.';
}
function quitarPista(contenedor) { const p = contenedor.querySelector(':scope > .pista-reto'); if (p) p.remove(); }
function iniciarRetos() {
  try { resueltos = new Set(JSON.parse(localStorage.getItem(claveRetos()) || '[]')); } catch (e) { resueltos = new Set(); }
  cajasReto().forEach(caja => {
    const items = Array.from(caja.querySelectorAll('.clasifica > li'));
    if (items.length) {
      items.forEach(li => li.querySelectorAll('.opcion').forEach(op => op.addEventListener('click', () => {
        if (op.hasAttribute('data-correcta')) {
          op.classList.add('correcta'); quitarPista(li);
          const r = li.querySelector('.respuesta'); if (r) r.classList.add('visible');
          li.dataset.ok = '1';
          if (items.every(x => x.dataset.ok === '1')) { const ok = caja.querySelector(':scope > .respuesta'); if (ok) ok.classList.add('visible'); marcarResuelto(caja); }
        } else { op.classList.add('incorrecta'); mostrarPista(li, op.dataset.pista); }
      })));
      return;
    }
    caja.querySelectorAll(':scope > .opciones .opcion').forEach(op => op.addEventListener('click', () => {
      if (op.hasAttribute('data-correcta')) {
        op.classList.add('correcta'); quitarPista(caja);
        const r = caja.querySelector(':scope > .respuesta:not(.respuesta--pendiente)'); if (r) r.classList.add('visible');
        marcarResuelto(caja);
      } else { op.classList.add('incorrecta'); mostrarPista(caja, op.dataset.pista); }
    }));
  });
  cajasReto().forEach(caja => {
    if (!resueltos.has(caja.dataset.reto)) return;
    caja.classList.add('resuelto');
    caja.querySelectorAll('.opcion[data-correcta]').forEach(o => o.classList.add('correcta'));
    caja.querySelectorAll('.respuesta:not(.respuesta--pendiente)').forEach(r => r.classList.add('visible'));
    caja.querySelectorAll('.clasifica > li').forEach(li => { li.dataset.ok = '1'; });
    const pend = caja.querySelector('.respuesta--pendiente'); if (pend) pend.classList.remove('visible');
  });
  actualizarContador();
  const borrar = document.getElementById('borrar-avance');
  if (borrar) borrar.addEventListener('click', () => { resueltos.clear(); guardarRetos(); window.location.reload(); });
}
function armarFicha() {
  const destino = document.getElementById('ficha-contenido'); if (!destino) return;
  document.querySelectorAll('main .caja--recuerda').forEach(caja => {
    if (destino.contains(caja)) return;
    const copia = caja.cloneNode(true), origen = document.createElement('p');
    origen.className = 'caja__origen'; origen.textContent = caja.dataset.origen || '';
    copia.querySelector('.caja__titulo').after(origen); destino.appendChild(copia);
  });
  const boton = document.getElementById('imprimir-ficha');
  if (boton) boton.addEventListener('click', () => { document.body.classList.add('imprimir-ficha'); window.print(); });
  window.addEventListener('afterprint', () => document.body.classList.remove('imprimir-ficha'));
}
/* «Preparar» un laboratorio desde un reto: botones con data-preparar="id-del-lab" llevan al laboratorio. */
function iniciarPreparar() {
  document.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => {
    const el = document.getElementById(b.dataset.ir); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
}

/* ============================================================
   PROCESO 4: Arranque
   Insumo:    la lista de laboratorios de la lección
   Resultado: fórmulas, barra, tema, retos, laboratorios y ficha, en ese orden;
              un error en un laboratorio no detiene a los demás
   ============================================================ */
function arrancar(labs) {
  const pasos = [iniciarFormulas, iniciarBarra, iniciarTema, iniciarRetos, iniciarPreparar].concat(labs || [], [armarFicha]);
  const correr = () => pasos.forEach(fn => { try { fn(); } catch (e) { console.error('[' + (document.body.dataset.leccion || 'lección') + '] ' + (fn.name || 'paso'), e); } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', correr); else correr();
}

window.ML = { css, num, pct, rango, marcas, hexARgb, azarConSemilla, normalAzar, barajar, Phi, m, teX, frT, formula,
  Grafico, pintarMapa, superficie3D, girable, alRedibujar, redibujarTodo, arrastrar, marcarResuelto, arrancar };
})();
