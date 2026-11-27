/* ============================================================
   leccion-01.js: todas las interacciones de la lección 1.
   Sin librerías externas: JavaScript del navegador y, para las
   fórmulas, KaTeX (se carga en el <head> de la página).

   Cada laboratorio es una función independiente. Si uno falla,
   los demás siguen funcionando.
   ============================================================ */
(function () {
'use strict';

/* ============================================================
   PROCESO 0: Herramientas comunes
   Insumo:    nada
   Resultado: funciones para leer colores, escribir números en español,
              dibujar gráficos nítidos y guardar el avance de los retos
   ============================================================ */

// css('--g-serie1') → '#4338ca'. Lee un color de estilos.css (cambia con el modo oscuro).
function css(nombre) {
  return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
}

// num(3.14159, 2) → '3,14';  num(-2, 0) → '−2';  num(809655, 0) → '809 655'
function num(valor, decimales) {
  if (decimales === undefined) decimales = 2;
  if (!isFinite(valor)) return '—';
  const s = Math.abs(valor).toFixed(decimales);
  let partes = s.split('.');
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
  const paso = [1, 2, 2.5, 5, 10].map(m => m * pot).find(p => p >= bruto) || 10 * pot;
  return rango(Math.ceil(a / paso) * paso, b, paso);
}

// hexARgb('#4338ca') → [67, 56, 202]
function hexARgb(hex) {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16));
}

// Semilla fija para datos simulados: semilla → función que da números al azar entre 0 y 1,
// siempre los mismos para la misma semilla (así todos ven los mismos datos).
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

// barajar([1,2,3]) → [3,1,2]: cambia el orden al azar (algoritmo de Fisher-Yates).
function barajar(lista, azar) {
  const r = lista.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor((azar || Math.random)() * (i + 1));
    const t = r[i]; r[i] = r[j]; r[j] = t;
  }
  return r;
}

const LETRA = '"Schibsted Grotesk", "Helvetica Neue", Arial, sans-serif';

/* Grafico: un <canvas> con escalas.
   Entrada: el lienzo y los rangos de datos (x, y).
   Salida:  métodos para dibujar ejes, curvas, puntos y textos en coordenadas de datos. */
class Grafico {
  constructor(canvas, op) {
    this.canvas = canvas;
    this.op = Object.assign({ prop: 0.55, min: 220, max: 480, m: { i: 48, d: 14, s: 14, b: 36 } }, op);
    this.op.m = Object.assign({ i: 48, d: 14, s: 14, b: 36 }, op.m || {});
    this.preparar();
  }
  // Ajusta el tamaño real del lienzo a la pantalla (nítido en celulares) y lo limpia.
  preparar() {
    const c = this.canvas, o = this.op;
    const w = Math.max(200, c.clientWidth || (c.parentElement && c.parentElement.clientWidth) || 600);
    const h = Math.max(o.min, Math.min(o.max, Math.round(w * o.prop)));
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    c.style.height = h + 'px';
    this.ctx = c.getContext('2d');
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w; this.h = h; this.dpr = dpr;
    const m = o.m;
    this.x0 = m.i; this.x1 = w - m.d; this.y0 = h - m.b; this.y1 = m.s;
    this.ctx.clearRect(0, 0, w, h);
    return this;
  }
  X(v) { const r = this.op.x; return this.x0 + (v - r[0]) * (this.x1 - this.x0) / (r[1] - r[0]); }
  Y(v) { const r = this.op.y; return this.y0 - (v - r[0]) * (this.y0 - this.y1) / (r[1] - r[0]); }
  invX(px) { const r = this.op.x; return r[0] + (px - this.x0) * (r[1] - r[0]) / (this.x1 - this.x0); }
  invY(py) { const r = this.op.y; return r[0] + (this.y0 - py) * (r[1] - r[0]) / (this.y0 - this.y1); }
  recortar() {
    const c = this.ctx; c.save(); c.beginPath();
    c.rect(this.x0, this.y1, this.x1 - this.x0, this.y0 - this.y1); c.clip();
  }
  soltar() { this.ctx.restore(); }
  // Ejes con rejilla suave, marcas y títulos.
  ejes(o) {
    o = Object.assign({ xt: [], yt: [], fx: v => num(v, 0), fy: v => num(v, 0), ex: '', ey: '', rejillaX: true, rejillaY: true }, o);
    const c = this.ctx;
    c.save();
    c.font = '500 11.5px ' + LETRA;
    c.lineWidth = 1;
    c.strokeStyle = css('--g-rejilla');
    c.fillStyle = css('--tinta-suave');
    c.textAlign = 'center'; c.textBaseline = 'top';
    o.xt.forEach(v => {
      const x = this.X(v);
      if (o.rejillaX) { c.beginPath(); c.moveTo(x, this.y1); c.lineTo(x, this.y0); c.stroke(); }
      c.fillText(o.fx(v), x, this.y0 + 6);
    });
    c.textAlign = 'right'; c.textBaseline = 'middle';
    o.yt.forEach(v => {
      const y = this.Y(v);
      if (o.rejillaY) { c.beginPath(); c.moveTo(this.x0, y); c.lineTo(this.x1, y); c.stroke(); }
      c.fillText(o.fy(v), this.x0 - 6, y);
    });
    c.strokeStyle = css('--g-eje');
    c.beginPath(); c.moveTo(this.x0, this.y0); c.lineTo(this.x1, this.y0); c.stroke();
    c.font = '600 11.5px ' + LETRA;
    if (o.ex) { c.textAlign = 'right'; c.textBaseline = 'top'; c.fillText(o.ex, this.x1, this.y0 + 24); }
    if (o.ey) { c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(o.ey, this.x0 + 4, this.y1); }
    c.restore();
  }
  // Línea que une puntos [[x, y], ...] en coordenadas de datos.
  linea(pts, o) {
    o = Object.assign({ color: css('--g-serie1'), ancho: 2, guion: null, alfa: 1 }, o);
    const c = this.ctx;
    c.save(); c.globalAlpha = o.alfa; c.strokeStyle = o.color; c.lineWidth = o.ancho;
    c.lineJoin = 'round'; c.lineCap = 'round';
    if (o.guion) c.setLineDash(o.guion);
    c.beginPath();
    pts.forEach((p, i) => { const x = this.X(p[0]), y = this.Y(p[1]); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.stroke(); c.restore();
  }
  // Curva de una función f(x) entre los extremos del eje x.
  funcion(f, o) {
    o = Object.assign({ desde: this.op.x[0], hasta: this.op.x[1], pasos: 400 }, o);
    const pts = [];
    for (let i = 0; i <= o.pasos; i++) {
      const x = o.desde + (o.hasta - o.desde) * i / o.pasos;
      const y = f(x);
      if (isFinite(y)) pts.push([x, y]);
    }
    this.recortar(); this.linea(pts, o); this.soltar();
  }
  punto(x, y, o) {
    o = Object.assign({ r: 5, color: css('--g-serie1'), borde: null, hueco: false, alfa: 1 }, o);
    const c = this.ctx;
    c.save(); c.globalAlpha = o.alfa;
    c.beginPath(); c.arc(this.X(x), this.Y(y), o.r, 0, Math.PI * 2);
    if (o.hueco) { c.strokeStyle = o.color; c.lineWidth = 1.8; c.stroke(); }
    else {
      c.fillStyle = o.color; c.fill();
      if (o.borde) { c.strokeStyle = o.borde; c.lineWidth = 2; c.stroke(); }
    }
    c.restore();
  }
  texto(s, x, y, o) { this.textoPx(s, this.X(x), this.Y(y), o); }
  textoPx(s, px, py, o) {
    o = Object.assign({ color: css('--tinta'), al: 'left', base: 'middle', tam: 12, peso: 500, fondo: false }, o);
    const c = this.ctx;
    c.save(); c.font = o.peso + ' ' + o.tam + 'px ' + LETRA;
    c.textAlign = o.al; c.textBaseline = o.base;
    if (o.fondo) {
      const ancho = c.measureText(s).width;
      const ix = o.al === 'center' ? px - ancho / 2 : o.al === 'right' ? px - ancho : px;
      c.fillStyle = css('--papel-2'); c.globalAlpha = 0.85;
      c.fillRect(ix - 3, py - o.tam * 0.7, ancho + 6, o.tam * 1.4);
      c.globalAlpha = 1;
    }
    c.fillStyle = o.color; c.fillText(s, px, py); c.restore();
  }
  // Flecha en píxeles, de (x0, y0) a (x1, y1).
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

/* pintarMapa: dibuja un mapa de curvas de nivel.
   Entrada: un Grafico, una función f(x, y) y la lista de niveles.
   Salida:  bandas de color (claro = bajo, cálido = alto) con una línea donde cambia la banda. */
const memoriaMapas = {};
function pintarMapa(g, f, niveles, clave) {
  const dpr = g.dpr;
  const px0 = Math.round(g.x0 * dpr), py0 = Math.round(g.y1 * dpr);
  const W = Math.round((g.x1 - g.x0) * dpr), H = Math.round((g.y0 - g.y1) * dpr);
  const firma = [clave, W, H, css('--g-mapa-bajo'), css('--g-mapa-alto')].join('|');
  let img = memoriaMapas[firma];
  if (!img) {
    img = g.ctx.createImageData(W, H);
    const bajo = hexARgb(css('--g-mapa-bajo')), alto = hexARgb(css('--g-mapa-alto')), lin = hexARgb(css('--g-eje'));
    const banda = new Int16Array(W * H);
    for (let j = 0; j < H; j++) {
      const y = g.invY(g.y1 + j / dpr);
      for (let i = 0; i < W; i++) {
        const v = f(g.invX(g.x0 + i / dpr), y);
        let b = 0; while (b < niveles.length && v > niveles[b]) b++;
        banda[j * W + i] = b;
      }
    }
    const total = niveles.length;
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const k = j * W + i, b = banda[k];
        const borde = (i + 1 < W && banda[k + 1] !== b) || (j + 1 < H && banda[k + W] !== b);
        const t = Math.pow(b / total, 0.8);
        const col = borde ? lin : [0, 1, 2].map(q => Math.round(bajo[q] + (alto[q] - bajo[q]) * t));
        img.data[4 * k] = col[0]; img.data[4 * k + 1] = col[1]; img.data[4 * k + 2] = col[2]; img.data[4 * k + 3] = 255;
      }
    }
    memoriaMapas[firma] = img;
  }
  g.ctx.putImageData(img, px0, py0);
}

// Redibujo: cada laboratorio se registra aquí para volver a dibujarse al cambiar el tamaño o el tema.
const redibujos = [];
function alRedibujar(fn) { redibujos.push(fn); fn(); }
function redibujarTodo() { redibujos.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); }

// arrastrar(lienzo, fn): llama a fn(px, py) al hacer clic o arrastrar con mouse, dedo o lápiz.
function arrastrar(canvas, fn) {
  let activo = false;
  const pos = ev => { const r = canvas.getBoundingClientRect(); fn(ev.clientX - r.left, ev.clientY - r.top, ev.type); };
  canvas.addEventListener('pointerdown', ev => { activo = true; try { canvas.setPointerCapture(ev.pointerId); } catch (e) {} pos(ev); });
  canvas.addEventListener('pointermove', ev => { if (activo) pos(ev); });
  const fin = () => { activo = false; };
  canvas.addEventListener('pointerup', fin);
  canvas.addEventListener('pointercancel', fin);
  canvas.style.cursor = 'pointer';
}

// Avance de los retos: se guarda en este navegador (si el navegador lo permite).
const CLAVE_RETOS = 'aprendizaje-ml-leccion-01-retos';
const resueltos = (function () {
  try { return new Set(JSON.parse(localStorage.getItem(CLAVE_RETOS) || '[]')); } catch (e) { return new Set(); }
})();
function guardarRetos() { try { localStorage.setItem(CLAVE_RETOS, JSON.stringify(Array.from(resueltos))); } catch (e) {} }


/* ============================================================
   PROCESO 1: Fórmulas, barra superior y tema
   Insumo:    el texto con \( \) y \[ \], las secciones de la página
   Resultado: fórmulas dibujadas, barra de avance, parte activa resaltada
              y botón de modo claro u oscuro
   ============================================================ */
function iniciarFormulas() {
  if (window.renderMathInElement) {
    window.renderMathInElement(document.body, {
      delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }],
      throwOnError: false
    });
  }
}

// formula(elemento, texto TeX): dibuja una fórmula que cambia con los controles.
function formula(el, tex, display) {
  if (!el) return;
  if (window.katex) window.katex.render(tex, el, { displayMode: display !== false, throwOnError: false });
  else el.textContent = tex;
}
// teX(0.05) → '0{,}05': coma decimal dentro de una fórmula, sin espacio extra.
function teX(v, d) { return num(v, d).replace(',', '{,}').replace('−', '-').replace(/ /g, '\\,'); }

// m('x^2') → la fórmula dibujada por KaTeX, lista para insertarla dentro de un texto.
// Así las lecturas de los laboratorios usan la misma notación que el resto de la página.
function m(tex) {
  try { return window.katex ? window.katex.renderToString(tex, { throwOnError: false }) : tex; }
  catch (e) { return tex; }
}
// frT(2, 6) → '\tfrac{1}{3}'; frT(0, 6) → '0'; frT(6, 6) → '1'. Fracción simplificada, en TeX.
function frT(k, n) {
  if (k === 0) return '0';
  if (k === n) return '1';
  const mcd = (a, b) => b ? mcd(b, a % b) : a, d = mcd(k, n);
  return '\\tfrac{' + (k / d) + '}{' + (n / d) + '}';
}

function iniciarBarra() {
  const avance = document.getElementById('avance');
  const enlaces = Array.from(document.querySelectorAll('.barra__partes a'));
  function alDesplazar() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (avance) avance.style.width = (total > 0 ? Math.min(100, 100 * window.scrollY / total) : 0) + '%';
  }
  window.addEventListener('scroll', alDesplazar, { passive: true });
  alDesplazar();
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entradas => {
      entradas.forEach(e => {
        if (!e.isIntersecting) return;
        enlaces.forEach(a => a.classList.toggle('activa', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    enlaces.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) obs.observe(s); });
  }
}

function iniciarTema() {
  const boton = document.getElementById('boton-tema');
  if (!boton) return;
  const CLAVE = 'aprendizaje-ml-tema';
  const ciclo = ['', 'oscuro', 'claro'];
  const iconos = { '': '◐', oscuro: '☾', claro: '☀' };
  const nombres = { '': 'Tema automático (según tu sistema)', oscuro: 'Modo oscuro', claro: 'Modo claro' };
  function aplicar(t) {
    if (t) document.documentElement.setAttribute('data-tema', t); else document.documentElement.removeAttribute('data-tema');
    boton.textContent = iconos[t]; boton.title = nombres[t] + '. Clic para cambiar.';
  }
  let actual = document.documentElement.getAttribute('data-tema') || '';
  aplicar(actual);
  boton.addEventListener('click', () => {
    actual = ciclo[(ciclo.indexOf(actual) + 1) % ciclo.length];
    try { localStorage.setItem(CLAVE, actual); } catch (e) {}
    aplicar(actual);
    redibujarTodo();
  });
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', redibujarTodo);
  }
  let espera;
  window.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(redibujarTodo, 150); });
}


/* ============================================================
   PROCESO 2: Retos
   Insumo:    las cajas .caja--reto con botones .opcion
   Resultado: verde o rojo al responder, pista si fallas, explicación si aciertas,
              y el contador «n/15 retos» en la barra
   ============================================================ */
const cajasReto = Array.from(document.querySelectorAll('.caja--reto[data-reto]'));
function actualizarContador() {
  const el = document.getElementById('contador-retos');
  if (!el) return;
  const n = cajasReto.filter(c => c.classList.contains('resuelto')).length;
  el.textContent = n + '/' + cajasReto.length + ' retos';
}
function marcarResuelto(caja) {
  if (!caja) return;
  caja.classList.add('resuelto');
  resueltos.add(caja.dataset.reto);
  guardarRetos();
  actualizarContador();
}
// mostrarPista(contenedor, texto): escribe la pista bajo las opciones (una sola a la vez).
function mostrarPista(contenedor, texto) {
  let p = contenedor.querySelector(':scope > .pista-reto');
  if (!p) {
    p = document.createElement('p');
    p.className = 'respuesta pista-reto visible';
    const opciones = contenedor.querySelector(':scope > .opciones');
    if (opciones) opciones.after(p); else contenedor.appendChild(p);
  }
  p.textContent = texto ? 'Pista: ' + texto : 'No es esa. Prueba otra opción.';
  p.classList.add('visible');
}
function quitarPista(contenedor) {
  const p = contenedor.querySelector(':scope > .pista-reto');
  if (p) p.remove();
}

function iniciarRetos() {
  cajasReto.forEach(caja => {
    const items = Array.from(caja.querySelectorAll('.clasifica > li'));
    if (items.length) {
      // Reto de clasificación: cada pregunta es un mini reto; la caja se resuelve con todas.
      items.forEach(li => {
        li.querySelectorAll('.opcion').forEach(op => op.addEventListener('click', () => {
          if (op.hasAttribute('data-correcta')) {
            op.classList.add('correcta'); quitarPista(li);
            li.querySelectorAll('.opcion').forEach(o => { if (o !== op) o.classList.remove('incorrecta'); });
            const r = li.querySelector('.respuesta'); if (r) r.classList.add('visible');
            li.dataset.ok = '1';
            if (items.every(x => x.dataset.ok === '1')) {
              const ok = caja.querySelector(':scope > .respuesta'); if (ok) ok.classList.add('visible');
              marcarResuelto(caja);
            }
          } else {
            op.classList.add('incorrecta'); mostrarPista(li, op.dataset.pista);
          }
        }));
      });
      return;
    }
    caja.querySelectorAll(':scope > .opciones .opcion').forEach(op => op.addEventListener('click', () => {
      if (op.hasAttribute('data-correcta')) {
        op.classList.add('correcta'); quitarPista(caja);
        const r = caja.querySelector(':scope > .respuesta:not(.respuesta--pendiente)'); if (r) r.classList.add('visible');
        marcarResuelto(caja);
      } else {
        op.classList.add('incorrecta'); mostrarPista(caja, op.dataset.pista);
      }
    }));
  });

  // Recupera los retos ya resueltos en una visita anterior.
  cajasReto.forEach(caja => {
    if (!resueltos.has(caja.dataset.reto)) return;
    caja.classList.add('resuelto');
    caja.querySelectorAll('.opcion[data-correcta]').forEach(o => o.classList.add('correcta'));
    caja.querySelectorAll('.respuesta:not(.respuesta--pendiente)').forEach(r => r.classList.add('visible'));
    caja.querySelectorAll('.clasifica > li').forEach(li => { li.dataset.ok = '1'; });
    const pend = caja.querySelector('.respuesta--pendiente'); if (pend) pend.classList.remove('visible');
    const ok = caja.querySelector('#independencia-ok');
    if (ok && !ok.textContent) ok.textContent = 'Resuelto en una visita anterior. Una solución: B = «sale impar» = {1, 3, 5}. Con ese B, P(A | B) = 1/3 = P(A).';
  });
  actualizarContador();

  const borrar = document.getElementById('borrar-avance');
  if (borrar) borrar.addEventListener('click', () => {
    resueltos.clear(); guardarRetos();
    window.location.reload();
  });
}


/* ============================================================
   PROCESO 3: Laboratorio 0 · Completa la frase (GPT)
   Insumo:    una frase incompleta y probabilidades inventadas
   Resultado: barras con la probabilidad de cada palabra; una ruleta que compara
              «elegir siempre la más probable» con «sortear»; y 1 000 giros
   ============================================================ */
function labGPT() {
  const caja = document.getElementById('demo-gpt'); if (!caja) return;
  const PALABRAS = [['riñones', 0.31], ['ojos', 0.24], ['nervios', 0.16], ['pies', 0.12], ['vasos', 0.09], ['otras palabras', 0.079], ['zapatos', 0.001]];
  const COLORES = ['var(--g-serie1)', 'var(--g-serie3)', 'var(--g-serie2)', 'var(--g-serie4)', '#7c3aed', 'var(--g-eje)', '#111'];
  const OPCIONES = ['riñones', 'ojos', 'nervios', 'pies', 'zapatos'];
  const zonaOpciones = document.getElementById('gpt-opciones');
  const barras = document.getElementById('gpt-barras');
  const paso2 = document.getElementById('gpt-paso2');
  const hueco = document.getElementById('gpt-hueco');
  const generadas = document.getElementById('gpt-generadas');
  const ruleta = document.getElementById('gpt-ruleta'), aguja = document.getElementById('gpt-aguja');
  const comentario = document.createElement('p');
  comentario.className = 'ui suave'; comentario.style.margin = '8px 0 0';
  barras.after(comentario);
  let girando = null;

  // Ruleta: cada palabra ocupa un ancho igual a su probabilidad.
  ruleta.innerHTML = PALABRAS.map((par, i) =>
    '<span style="flex:0 0 ' + (100 * par[1]) + '%;background:' + COLORES[i] + '">' + (par[1] >= 0.085 ? par[0] : '') + '</span>').join('');
  // girar: número al azar u entre 0 y 1 → palabra donde cae la aguja
  function girar() {
    const u = Math.random();
    let acum = 0;
    for (const par of PALABRAS) { acum += par[1]; if (u <= acum) return [par[0] === 'otras palabras' ? 'otra palabra' : par[0], u]; }
    return [PALABRAS[0][0], u];
  }
  function moverAguja(u) { aguja.style.opacity = '1'; aguja.style.left = (100 * u) + '%'; }

  OPCIONES.forEach(p => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'opcion'; b.textContent = p;
    b.addEventListener('click', () => elegir(p, b));
    zonaOpciones.appendChild(b);
  });

  // elegir: palabra del lector → barras con las probabilidades del «modelo»
  function elegir(palabra, boton) {
    hueco.textContent = palabra;
    zonaOpciones.querySelectorAll('.opcion').forEach(o => o.classList.toggle('correcta', o === boton));
    barras.innerHTML = '';
    PALABRAS.forEach(par => {
      const fila = document.createElement('div'); fila.style.display = 'contents';
      if (par[0] === palabra) fila.className = 'elegida';
      fila.innerHTML = '<span>' + (par[0] === palabra ? '<b>' + par[0] + '</b> (tú)' : par[0]) + '</span>' +
        '<span class="pista"><span class="relleno"></span></span><span style="font-variant-numeric:tabular-nums">' + pct(par[1], par[1] < 0.01 ? 1 : 0) + '</span>';
      barras.appendChild(fila);
    });
    paso2.hidden = false;
    setTimeout(() => {
      barras.querySelectorAll('.relleno').forEach((r, i) => { r.style.width = (100 * PALABRAS[i][1] / 0.31) + '%'; });
    }, 40);
    const p = PALABRAS.find(x => x[0] === palabra)[1];
    comentario.textContent = 'Tu palabra recibe ' + pct(p, p < 0.01 ? 1 : 0) +
      (palabra === 'zapatos' ? '. El modelo aprendió que esa palabra casi nunca sigue a esta frase.' : '. Otras palabras también son razonables: el modelo reparte la probabilidad entre ellas.');
  }

  // Modo 1: elegir siempre la más probable → la misma palabra 12 veces.
  document.getElementById('gpt-siempre').addEventListener('click', () => {
    clearInterval(girando); aguja.style.opacity = '0';
    generadas.innerHTML = Array.from({ length: 12 }, () => '<span>riñones</span>').join('') +
      '<p class="ui suave" style="margin:8px 0 0">Siempre «riñones». Cada vez que alguien escriba esta frase, el modelo completará lo mismo. Con frases largas, el texto se vuelve repetitivo y nunca aparecen otras respuestas razonables, como «ojos» o «nervios».</p>';
  });
  // Modo 2: girar la ruleta 12 veces, con la aguja a la vista.
  document.getElementById('gpt-sortear').addEventListener('click', () => {
    clearInterval(girando);
    const lista = [];
    generadas.innerHTML = '';
    girando = setInterval(() => {
      const r = girar(); lista.push(r[0]); moverAguja(r[1]);
      generadas.innerHTML = lista.map(p => '<span>' + p + '</span>').join('');
      if (lista.length >= 12) {
        clearInterval(girando);
        const n = lista.filter(p => p === 'riñones').length;
        generadas.innerHTML += '<p class="ui suave" style="margin:8px 0 0">«Riñones» salió ' + n + ' de 12 veces; el resto, otras palabras razonables. Gira otra vez: el resultado cambia. Por eso un GPT puede dar respuestas distintas a la misma pregunta.</p>';
      }
    }, 260);
  });
  // Modo 3: 1 000 giros → cada palabra sale en una proporción cercana a su probabilidad.
  document.getElementById('gpt-mil').addEventListener('click', () => {
    clearInterval(girando); aguja.style.opacity = '0';
    const conteo = {};
    for (let i = 0; i < 1000; i++) { const p = girar()[0]; conteo[p] = (conteo[p] || 0) + 1; }
    const filas = PALABRAS.map(par => {
      const nombre = par[0] === 'otras palabras' ? 'otra palabra' : par[0], f = (conteo[nombre] || 0) / 1000;
      return '<tr><td>' + par[0] + '</td><td class="num">' + pct(par[1], 1) + '</td><td class="num">' + pct(f, 1) + '</td></tr>';
    }).join('');
    generadas.innerHTML = '<table class="datos" style="max-width:420px"><thead><tr><th>Palabra</th><th class="num">Probabilidad</th><th class="num">Salió en 1 000 giros</th></tr></thead><tbody>' + filas + '</tbody></table>' +
      '<p class="ui suave" style="margin:4px 0 0">Las dos columnas casi coinciden. Con muchos giros, la frecuencia se acerca a la probabilidad: es la ley de los grandes números de la parte 4.</p>';
  });
}


/* ============================================================
   PROCESO 4: Laboratorio 1 · Encuentra el mejor número (pérdida)
   Insumo:    días de 9 pacientes, el número c y el tipo de pérdida
   Resultado: errores dibujados, curva de pérdida promedio y lectura del valor
   ============================================================ */
function labPerdida() {
  const lienzoA = document.getElementById('perdida-puntos'); if (!lienzoA) return;
  const lienzoB = document.getElementById('perdida-curva');
  const control = document.getElementById('perdida-c');
  const salida = document.getElementById('perdida-c-out');
  const lectura = document.getElementById('perdida-lectura');
  const extremo = document.getElementById('perdida-extremo');
  const botones = Array.from(document.querySelectorAll('#demo-perdida [data-modo]'));
  const TODOS = [2, 3, 3, 4, 4, 5, 6, 8, 25];
  let modo = 'cuadratica';

  const datos = () => extremo.checked ? TODOS : TODOS.slice(0, 8);
  // perdida(c, datos) → pérdida promedio (cuadrática o absoluta) de predecir c para todos
  const perdida = (c, d) => d.reduce((s, y) => s + (modo === 'cuadratica' ? (y - c) * (y - c) : Math.abs(y - c)), 0) / d.length;

  function dibujar() {
    const c = Number(control.value), d = datos();
    salida.textContent = num(c, 2);
    const ambar = css('--g-serie2'), rojo = css('--g-serie4'), indigo = css('--g-serie1');

    // Arriba: los pacientes en una recta de días y la predicción c.
    const g = new Grafico(lienzoA, { prop: 0.17, min: 118, max: 150, x: [0, 26], y: [0, 1], m: { i: 16, d: 18, s: 24, b: 28 } });
    g.ejes({ xt: rango(0, 26, g.w < 520 ? 5 : 2) });
    const pila = {};
    TODOS.forEach((y, i) => {
      const k = pila[y] = (pila[y] || 0) + 1;
      const yy = 0.18 + 0.3 * (k - 1);
      const fuera = !extremo.checked && i === 8;
      if (!fuera) g.linea([[c, yy], [y, yy]], { color: rojo, ancho: 2.2, alfa: 0.85 });
      g.punto(y, yy, { r: 5.5, color: fuera ? css('--g-eje') : indigo, hueco: fuera });
    });
    g.linea([[c, 0], [c, 1.02]], { color: ambar, ancho: 3 });
    g.textoPx('c = ' + num(c, 2), g.X(c), g.y1 - 12, { color: ambar, al: 'center', peso: 700, tam: 12.5 });

    // Abajo: la pérdida promedio para cada c posible.
    let maxL = 0;
    for (let x = 0; x <= 26; x += 0.25) maxL = Math.max(maxL, perdida(x, d));
    const g2 = new Grafico(lienzoB, { prop: 0.34, min: 180, max: 290, x: [0, 26], y: [0, maxL * 1.08], m: { i: 46, d: 18, s: 18, b: 46 } });
    g2.ejes({ xt: rango(0, 26, g2.w < 520 ? 5 : 2), yt: marcas(0, maxL * 1.05, 4), ex: 'c', ey: modo === 'cuadratica' ? 'pérdida cuadrática promedio' : 'pérdida absoluta promedio' });
    g2.funcion(x => perdida(x, d), { color: indigo, ancho: 2.5, pasos: 520 });
    const L = perdida(c, d);
    g2.linea([[c, 0], [c, L]], { color: ambar, ancho: 1.5, guion: [4, 4] });
    g2.punto(c, L, { r: 6.5, color: ambar, borde: css('--papel-2') });
    g2.textoPx(num(L, 2), g2.X(c) + 9, g2.Y(L) - 10, { color: ambar, peso: 700, fondo: true });

    const formulaL = modo === 'cuadratica' ? '\\frac{1}{' + d.length + '}\\sum_{i=1}^{' + d.length + '}(y_i - c)^2'
                                           : '\\frac{1}{' + d.length + '}\\sum_{i=1}^{' + d.length + '}|y_i - c|';
    lectura.innerHTML = 'Predicción ' + m('c = ' + teX(c, 2)) + ' días · ' +
      (modo === 'cuadratica' ? 'pérdida cuadrática' : 'pérdida absoluta') + ' promedio: ' +
      m('R_{\\text{emp}}(c) = ' + formulaL + ' = ' + teX(L, 2)) + '<br>Busca el punto más bajo de la curva.';
  }

  control.addEventListener('input', dibujar);
  extremo.addEventListener('change', dibujar);
  botones.forEach(b => b.addEventListener('click', () => {
    modo = b.dataset.modo;
    botones.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    dibujar();
  }));
  const mover = px => {
    const g = { x0: 16, x1: lienzoA.clientWidth - 18 };
    const v = (px - g.x0) * 26 / (g.x1 - g.x0);
    control.value = Math.max(0, Math.min(26, v)).toFixed(2);
    dibujar();
  };
  arrastrar(lienzoA, mover);
  arrastrar(lienzoB, px => {
    const v = (px - 46) * 26 / (lienzoB.clientWidth - 18 - 46);
    control.value = Math.max(0, Math.min(26, v)).toFixed(2);
    dibujar();
  });
  alRedibujar(dibujar);
}


/* ============================================================
   PROCESO 5: Curva del profesor y laboratorios 2, 3 y 4
   Insumo:    f(x) = x⁴ + 7x³ + 5x² − 17x + 3 (ML1, pág. 10)
   Resultado: secante y tangente; el juego del límite; descenso de gradiente en 1D
   ============================================================ */
const fP = x => x * x * x * x + 7 * x * x * x + 5 * x * x - 17 * x + 3;
const dP = x => 4 * x * x * x + 21 * x * x + 10 * x - 17;
const PUNTOS_P = { global: -4.4803, maximo: -1.4321, local: 0.6624 };
function graficoCurva(canvas) {
  return new Grafico(canvas, { prop: 0.52, min: 250, max: 420, x: [-6.3, 2.2], y: [-60, 75], m: { i: 44, d: 14, s: 14, b: 46 } });
}
function ejesCurva(g) {
  g.ejes({ xt: rango(-6, 2, 1), yt: [-50, -25, 0, 25, 50, 75], ex: 'x', ey: 'f(x)' });
}

function labDerivada() {
  const lienzo = document.getElementById('derivada-lienzo'); if (!lienzo) return;
  const cx = document.getElementById('derivada-x'), ch = document.getElementById('derivada-h');
  const ox = document.getElementById('derivada-x-out'), oh = document.getElementById('derivada-h-out');
  const lectura = document.getElementById('derivada-lectura');

  function dibujar() {
    const x = Number(cx.value), h = Number(ch.value);
    ox.textContent = num(x, 2); oh.textContent = num(h, 2);
    const g = graficoCurva(lienzo); ejesCurva(g);
    const indigo = css('--g-serie1'), ambar = css('--g-serie2');
    g.funcion(fP, { color: css('--tinta'), ancho: 2.2 });
    const y = fP(x), yh = fP(x + h), mSec = (yh - y) / h, mTan = dP(x);
    // Secante: la recta que pasa por los dos puntos.
    g.recortar();
    g.linea([[x - 2, y - 2 * mSec], [x + h + 2, yh + 2 * mSec]], { color: indigo, ancho: 2 });
    g.linea([[x - 1.7, y - 1.7 * mTan], [x + 1.7, y + 1.7 * mTan]], { color: ambar, ancho: 2.5, guion: [7, 5] });
    // Triángulo: avance h y cambio de altura.
    g.linea([[x, y], [x + h, y], [x + h, yh]], { color: indigo, ancho: 1.2, guion: [3, 3], alfa: 0.8 });
    g.soltar();
    g.punto(x, y, { r: 6, color: ambar, borde: css('--papel-2') });
    g.punto(x + h, yh, { r: 5, color: indigo, borde: css('--papel-2') });
    if (g.X(x + h) < g.x1 - 10) g.textoPx('h', (g.X(x) + g.X(x + h)) / 2, g.Y(y) + (yh > y ? 11 : -11), { color: indigo, al: 'center', peso: 700 });

    let sentido;
    if (Math.abs(mTan) < 1) sentido = 'La curva está casi plana: estás cerca de un mínimo o de un máximo.';
    else if (mTan < 0) sentido = 'La pendiente es negativa: la curva baja hacia la derecha. Para bajar, avanza a la derecha.';
    else sentido = 'La pendiente es positiva: la curva sube hacia la derecha. Para bajar, retrocede a la izquierda.';
    lectura.innerHTML = '<b style="color:var(--g-serie1)">Pendiente de la secante:</b> ' +
      m('\\frac{f(x+h) - f(x)}{h} = \\frac{f(' + teX(x + h, 2) + ') - f(' + teX(x, 2) + ')}{' + teX(h, 2) + '} = ' + teX(mSec, 2)) +
      '<br><b style="color:var(--g-serie2)">Derivada (pendiente de la tangente):</b> ' + m("f'(" + teX(x, 2) + ') = ' + teX(mTan, 2)) +
      ' · diferencia: ' + m(teX(Math.abs(mSec - mTan), 2)) + '<br>' + sentido;
  }
  cx.addEventListener('input', dibujar); ch.addEventListener('input', dibujar);
  // Botón «Probar x = −2 y h = 2»: la secante engaña cuando h es grande.
  document.querySelectorAll('[data-preparar="derivada"]').forEach(b => b.addEventListener('click', () => {
    cx.value = b.dataset.x; ch.value = b.dataset.h; dibujar();
    document.getElementById('demo-derivada').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
  alRedibujar(dibujar);
}

/* Laboratorio 3: el límite como juego, con las pendientes de las secantes del laboratorio 2.
   Entrada: la tolerancia ε del escéptico. Salida: tu respuesta N y la comprobación. */
function labLimite() {
  const lienzo = document.getElementById('limite-lienzo'); if (!lienzo) return;
  const ce = document.getElementById('limite-e'), oe = document.getElementById('limite-e-out');
  const lectura = document.getElementById('limite-lectura');
  const L = -17;                                  // f'(0) = −17
  const a = n => { const h = 1 / n; return (fP(h) - fP(0)) / h; };   // pendiente de la secante con h = 1/n
  const error = n => Math.abs(a(n) - L);          // decrece cuando n crece

  function dibujar() {
    const e = Number(ce.value);
    let n0 = 1; while (error(n0) >= e && n0 < 10000) n0++;
    const N = n0 - 1;
    oe.textContent = num(e, 2);
    const g = new Grafico(lienzo, { prop: 0.42, min: 210, max: 300, x: [0, 61], y: [-18.5, -3], m: { i: 44, d: 14, s: 14, b: 46 } });
    g.ejes({ xt: [1, 10, 20, 30, 40, 50, 60], yt: [-18, -15, -12, -9, -6, -3], ex: 'n (con h = 1/n)', ey: 'pendiente de la secante' });
    g.rect(0, L - e, 61, Math.min(-3, L + e), css('--g-relleno'));
    g.linea([[0, L], [61, L]], { color: css('--g-serie3'), ancho: 1.5, guion: [6, 4] });
    g.textoPx("f'(0) = −17", g.x1 - 4, g.Y(L) + 12, { al: 'right', color: css('--g-serie3'), peso: 700 });
    if (N + 0.5 < 61) {
      g.linea([[N + 0.5, -18.5], [N + 0.5, -3]], { color: css('--g-serie2'), ancho: 2 });
      g.textoPx('N = ' + N, g.X(N + 0.5) + 5, g.y1 + 18, { color: css('--g-serie2'), peso: 700 });
    }
    for (let n = 1; n <= 60; n++) g.punto(n, a(n), { r: 3.6, color: n > N ? css('--g-serie3') : css('--g-eje') });
    lectura.innerHTML = 'Afirmas que ' + m("f'(0) = -17") + '. El escéptico pide ' + m('\\varepsilon = ' + teX(e, 2)) +
      '. Tú respondes ' + m('N = ' + N) + ': desde ' + m('n = ' + n0) + ', es decir, con ' + m('h \\le \\tfrac{1}{' + n0 + '}') +
      ', todas las secantes tienen una pendiente a menos de ' + m(teX(e, 2)) + ' de ' + m('-17') + '.<br>Compruébalo con la primera: ' +
      m('a_{' + n0 + '} = ' + teX(a(n0), 3)) + ' y ' + m('|a_{' + n0 + '} - (-17)| = ' + teX(error(n0), 3) + ' < ' + teX(e, 2)) +
      '. Cuanto más pequeño el ε, más grande el N; pero siempre existe un N. Por eso decimos que la derivada <em>es</em> −17, sin usar nunca ' + m('h = 0') + '.';
  }
  ce.addEventListener('input', dibujar);
  alRedibujar(dibujar);
}

/* ============================================================
   PROCESO 5b: Laboratorio 4 · Regla de la cadena
   Insumo:    un paciente con x = 2 y gasto real y = 7; el parámetro w
   Resultado: los tres eslabones (w → predicción → error), las dos tasas, su producto
              y la comprobación con la pendiente medida directamente
   ============================================================ */
function labCadena() {
  const cw = document.getElementById('cadena-w'); if (!cw) return;
  const ow = document.getElementById('cadena-w-out');
  const eslabones = document.getElementById('cadena-eslabones');
  const lectura = document.getElementById('cadena-lectura');
  const X = 2, Y = 7;
  function actualizar() {
    const w = Number(cw.value), yh = w * X, L = Math.pow(Y - yh, 2);
    const tasaFuera = -2 * (Y - yh), tasaDentro = X, cadena = tasaFuera * tasaDentro;
    const hh = 1e-4, medida = (Math.pow(Y - (w + hh) * X, 2) - L) / hh;   // pendiente medida con un h muy pequeño
    ow.textContent = num(w, 2);
    eslabones.innerHTML =
      '<div class="eslabon"><span class="etq">parámetro</span>' + m('w = ' + teX(w, 2)) + '</div>' +
      '<div class="enlace">' + m('\\hat y = w \\times ' + X) + '<br>' + m('\\tfrac{d\\hat y}{dw} = ' + X) + '</div>' +
      '<div class="eslabon"><span class="etq">predicción</span>' + m('\\hat y = ' + teX(yh, 2)) + '</div>' +
      '<div class="enlace">' + m('L = (' + Y + ' - \\hat y)^2') + '<br>' + m('\\tfrac{dL}{d\\hat y} = ' + teX(tasaFuera, 2)) + '</div>' +
      '<div class="eslabon"><span class="etq">error</span>' + m('L = ' + teX(L, 2)) + '</div>';
    let sentido = cadena < -0.01 ? 'Derivada negativa: si subes <em>w</em>, el error baja.' :
      cadena > 0.01 ? 'Derivada positiva: si subes <em>w</em>, el error sube. Conviene bajar <em>w</em>.' :
      'Derivada cero: la predicción es exacta y el error es mínimo.';
    lectura.innerHTML = '<b>Regla de la cadena:</b> ' + m('\\frac{dL}{dw} = \\frac{dL}{d\\hat y}\\cdot\\frac{d\\hat y}{dw} = ' + teX(tasaFuera, 2) + ' \\times ' + X + ' = ' + teX(cadena, 2)) +
      '<br><b>Pendiente medida directamente</b> (con ' + m('h = 0{,}0001') + '): ' + m(teX(medida, 2)) + '. Coinciden.<br>' + sentido;
  }
  cw.addEventListener('input', actualizar);
  actualizar();
}

function labDescenso1D() {
  const lienzo = document.getElementById('d1-lienzo'); if (!lienzo) return;
  const cx = document.getElementById('d1-x0'), cg = document.getElementById('d1-g');
  const ox = document.getElementById('d1-x0-out'), og = document.getElementById('d1-g-out');
  const lectura = document.getElementById('d1-lectura');
  let camino = [Number(cx.value)], escapo = false, animando = null;

  function reiniciar() {
    clearInterval(animando); animando = null;
    camino = [Number(cx.value)]; escapo = false; dibujar();
  }
  // paso: posición actual → nueva posición = x − γ·f′(x)
  function paso() {
    if (escapo) return;
    const x = camino[camino.length - 1], g = Number(cg.value);
    const nx = x - g * dP(x);
    if (!isFinite(nx) || Math.abs(nx) > 60) { escapo = true; }
    else camino.push(nx);
    dibujar();
  }
  function dibujar() {
    ox.textContent = num(Number(cx.value), 1); og.textContent = num(Number(cg.value), 3);
    const g = graficoCurva(lienzo); ejesCurva(g);
    g.funcion(fP, { color: css('--tinta'), ancho: 2.2 });
    const suave = css('--tinta-suave');
    [['mínimo global', PUNTOS_P.global, 18], ['máximo local', PUNTOS_P.maximo, -16], ['mínimo local', PUNTOS_P.local, 18]].forEach(p => {
      g.punto(p[1], fP(p[1]), { r: 3.5, color: suave });
      g.textoPx(p[0], g.X(p[1]), g.Y(fP(p[1])) + p[2], { al: 'center', color: suave, tam: 11.5, fondo: true });
    });
    const ambar = css('--g-serie2');
    g.recortar();
    for (let i = 1; i < camino.length; i++) {
      const a = camino[i - 1], b = camino[i];
      g.linea([[a, fP(a)], [b, fP(b)]], { color: ambar, ancho: 1.6, guion: [4, 3], alfa: 0.75 });
    }
    camino.forEach((x, i) => g.punto(x, fP(x), { r: i === camino.length - 1 ? 8 : 4, color: ambar, alfa: i === camino.length - 1 ? 1 : 0.55, borde: i === camino.length - 1 ? css('--papel-2') : null }));
    g.soltar();

    const k = camino.length - 1, x = camino[k], pend = dP(x), gam = Number(cg.value);
    let texto = '<b>Paso ' + k + '</b> · ' + m('x_{' + k + '} = ' + teX(x, 3)) + ' · pendiente: ' + m("f'(x_{" + k + '}) = ' + teX(pend, 2)) +
      '<br>Siguiente: ' + m('x_{' + (k + 1) + "} = x_{" + k + "} - \\gamma\\, f'(x_{" + k + '}) = ' + teX(x, 3) + ' - ' + teX(gam, 3) + ' \\times (' + teX(pend, 2) + ') = ' + teX(x - gam * pend, 3));
    if (escapo) texto = '<b>El camino se escapó:</b> cada salto es más grande que el anterior. El paso ' + m('\\gamma') + ' es demasiado grande.';
    else if (x < -6.3 || x > 2.2) texto += '<br>La bola está fuera del dibujo.';
    else if (k > 0 && Math.abs(pend) < 0.05) texto += '<br>La pendiente es casi cero: llegaste al fondo de un valle.';
    lectura.innerHTML = texto;
  }
  function veinte() {
    clearInterval(animando);
    let n = 0;
    animando = setInterval(() => { paso(); n++; if (n >= 20 || escapo) { clearInterval(animando); animando = null; } }, 90);
  }
  document.getElementById('d1-paso').addEventListener('click', paso);
  document.getElementById('d1-veinte').addEventListener('click', veinte);
  document.getElementById('d1-reinicio').addEventListener('click', reiniciar);
  cx.addEventListener('input', reiniciar);
  cg.addEventListener('input', () => { og.textContent = num(Number(cg.value), 3); dibujar(); });
  arrastrar(lienzo, (px, py, tipo) => {
    if (tipo !== 'pointerdown') return;
    const g = { x0: 44, x1: lienzo.clientWidth - 14 };
    const v = -6.3 + (px - g.x0) * 8.5 / (g.x1 - g.x0);
    cx.value = Math.max(-6, Math.min(1.8, v)).toFixed(1);
    reiniciar();
  });
  // Botones «Preparar el caso» de los retos 2.2 y 2.3.
  document.querySelectorAll('[data-preparar="d1"]').forEach(b => b.addEventListener('click', () => {
    cx.value = b.dataset.x0; cg.value = b.dataset.g; reiniciar();
    document.getElementById('demo-d1').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
  alRedibujar(dibujar);
}


/* ============================================================
   PROCESO 6: Laboratorio 5 · Espacio de gustos (recomendaciones)
   Insumo:    coordenadas inventadas de 12 películas y tu punto
   Resultado: nota predicha = producto de los dos vectores, lista ordenada
              y la derivada parcial explicada con números
   ============================================================ */
function labGustos() {
  const lienzo = document.getElementById('gustos-lienzo'); if (!lienzo) return;
  const lista = document.getElementById('gustos-lista');
  const lectura = document.getElementById('gustos-lectura');
  // [título, acción (−1 tranquila … +1 mucha acción), seriedad (−1 ligera … +1 seria)]
  const PELIS = [
    ['Mad Max: furia en el camino', 0.9, 0.15], ['Rápidos y furiosos', 0.85, -0.6], ['John Wick', 0.95, -0.2],
    ['Gladiador', 0.7, 0.6], ['El Padrino', 0.3, 0.9], ['Parásitos', 0.2, 0.7], ['Rashomon', -0.1, 0.95],
    ['Roma', -0.7, 0.85], ['La teta asustada', -0.75, 0.7], ['Amélie', -0.6, -0.25], ['Toy Story', 0.1, -0.65], ['Mamma Mia!', -0.5, -0.85]
  ];
  let tu = [0.5, 0.3];
  const nota = p => tu[0] * p[1] + tu[1] * p[2];

  function dibujar() {
    const g = new Grafico(lienzo, { prop: 0.92, min: 290, max: 460, x: [-1.2, 1.2], y: [-1.2, 1.2], m: { i: 12, d: 12, s: 16, b: 16 } });
    const c = g.ctx, eje = css('--g-eje'), suave = css('--tinta-suave');
    g.linea([[-1.2, 0], [1.2, 0]], { color: eje, ancho: 1 });
    g.linea([[0, -1.2], [0, 1.2]], { color: eje, ancho: 1 });
    g.textoPx('más acción →', g.x1 - 2, g.Y(0) + 12, { al: 'right', color: suave, tam: 11.5, peso: 600 });
    g.textoPx('← más tranquila', g.x0 + 2, g.Y(0) + 12, { al: 'left', color: suave, tam: 11.5, peso: 600 });
    g.textoPx('↑ más seria', g.X(0) + 6, g.y1 + 4, { al: 'left', color: suave, tam: 11.5, peso: 600 });
    g.textoPx('↓ más ligera', g.X(0) + 6, g.y0 - 6, { al: 'left', color: suave, tam: 11.5, peso: 600 });
    const orden = PELIS.slice().sort((p, q) => nota(q) - nota(p));
    const top = new Set(orden.slice(0, 3).map(p => p[0]));
    const corto = g.w < 380;
    PELIS.forEach(p => {
      const esTop = top.has(p[0]);
      g.punto(p[1], p[2], { r: esTop ? 6 : 4.5, color: esTop ? css('--g-serie1') : eje });
      const nombre = corto && p[0].length > 16 ? p[0].slice(0, 14) + '…' : p[0];
      const derecha = p[1] < 0.45;
      g.textoPx(nombre, g.X(p[1]) + (derecha ? 8 : -8), g.Y(p[2]), { al: derecha ? 'left' : 'right', tam: 11, peso: esTop ? 700 : 500, color: esTop ? css('--g-serie1') : css('--tinta'), fondo: true });
    });
    g.flechaPx(g.X(0), g.Y(0), g.X(tu[0]), g.Y(tu[1]), { color: css('--g-serie2'), ancho: 2.5 });
    g.punto(tu[0], tu[1], { r: 9, color: css('--g-serie2'), borde: css('--papel-2') });
    g.textoPx('Tú', g.X(tu[0]) - 13, g.Y(tu[1]) - 13, { al: 'right', peso: 700, color: css('--g-serie2'), tam: 13, fondo: true });

    lista.innerHTML = orden.slice(0, 6).map(p => {
      const v = nota(p), ancho = Math.max(2, Math.min(100, 50 + 35 * v));
      return '<li style="margin-bottom:7px"><span style="display:flex;justify-content:space-between;gap:8px"><span>' + p[0] + '</span><b style="font-variant-numeric:tabular-nums">' + num(v, 2) + '</b></span>' +
        '<span style="display:block;height:6px;border-radius:3px;background:var(--g-rejilla)"><span style="display:block;height:6px;border-radius:3px;width:' + ancho + '%;background:var(--g-serie1)"></span></span></li>';
    }).join('');
    const p = orden[0];
    // nt(−0.2) → '(-0{,}20)': número para una fórmula, entre paréntesis si es negativo
    const nt = v => v < 0 ? '(' + teX(v, 2) + ')' : teX(v, 2);
    lectura.innerHTML = 'Tu punto: ' + m('u = (u_1;\\ u_2) = (' + teX(tu[0], 2) + ';\\ ' + teX(tu[1], 2) + ')') + ' (acción; seriedad). ' +
      'La película con la nota más alta es <b>' + p[0] + '</b>: ' + m('v = (' + teX(p[1], 2) + ';\\ ' + teX(p[2], 2) + ')') + '.<br>' +
      'Nota predicha: ' + m('u_1 v_1 + u_2 v_2 = ' + nt(tu[0]) + '\\times' + nt(p[1]) + ' + ' + nt(tu[1]) + '\\times' + nt(p[2]) + ' = ' + teX(nota(p), 2)) + '<br>' +
      '<b>Derivada parcial</b> respecto de tu gusto por la acción: ' + m('\\frac{\\partial\\,\\text{nota}}{\\partial u_1} = v_1 = ' + teX(p[1], 2)) +
      '. Si subes ' + m('u_1') + ' en 0,1, la nota cambia en ' + m('0{,}1 \\times ' + nt(p[1]) + ' = ' + teX(0.1 * p[1], 3)) + '.';
  }
  arrastrar(lienzo, (px, py) => {
    const g = { x0: 12, x1: lienzo.clientWidth - 12, y1: 16, y0: lienzo.clientHeight - 16 };
    const x = -1.2 + (px - g.x0) * 2.4 / (g.x1 - g.x0);
    const y = -1.2 + (g.y0 - py) * 2.4 / (g.y0 - g.y1);
    tu = [Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y))];
    dibujar();
  });
  alRedibujar(dibujar);
}


/* ============================================================
   PROCESO 7: Laboratorio 7 · Descenso de gradiente en 3D y desde arriba (ejemplo 7.1)
   Insumo:    f(x₁, x₂) = x₁² + x₁x₂ + 10x₂² − 5x₁ − 3x₂, x₀ = (−3; −1), γ = 0,085
   Resultado: el terreno en 3D (se gira arrastrando), el mapa de curvas de nivel,
              el gráfico «mismo paso, distinta subida», la tabla de pasos y la lectura
   ============================================================ */
function labDescenso2D() {
  const lienzo = document.getElementById('d2-lienzo'); if (!lienzo) return;
  const lienzo3d = document.getElementById('d2-3d');
  const lienzoCortes = document.getElementById('d2-cortes');
  const botonesVista = Array.from(document.querySelectorAll('#demo-d2 [data-vista]'));
  const cg = document.getElementById('d2-g'), og = document.getElementById('d2-g-out');
  const cuerpo = document.querySelector('#d2-tabla tbody');
  const lectura = document.getElementById('d2-lectura');
  const f = (a, b) => a * a + a * b + 10 * b * b - 5 * a - 3 * b;
  const grad = (a, b) => [2 * a + b - 5, a + 20 * b - 3];
  const MIN = [97 / 39, 1 / 39];   // solución exacta: (2,487; 0,026)
  const F_MIN = f(MIN[0], MIN[1]);  // −6,256
  const NIVELES = [-5, 0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  // Vistas del terreno: [giro alrededor del eje vertical, inclinación de la mirada], en radianes.
  const VISTAS = { inclinada: [-0.5, 0.8], 'este-oeste': [0, 0.1], 'norte-sur': [-Math.PI / 2, 0.1], arriba: [0, 1.54] };
  let vista = VISTAS.inclinada.slice();
  let inicio = [-3, -1], camino = [inicio.slice()], escapo = false, animando = null;

  function reiniciar(desde) {
    clearInterval(animando); animando = null;
    if (desde) inicio = desde;
    camino = [inicio.slice()]; escapo = false; dibujar();
  }
  // paso: posición (x₁; x₂) → nueva posición = posición − γ·∇f
  function paso() {
    if (escapo) return;
    const p = camino[camino.length - 1], gr = grad(p[0], p[1]), gam = Number(cg.value);
    const n = [p[0] - gam * gr[0], p[1] - gam * gr[1]];
    if (!isFinite(n[0]) || Math.abs(n[0]) > 1e4 || Math.abs(n[1]) > 1e4) escapo = true; else camino.push(n);
    dibujar();
  }

  /* dibujar3D: terreno → malla de cuadriláteros coloreados por altura, ordenados de atrás hacia adelante.
     La escala es fija: un metro del terreno mide lo mismo en todas las vistas, para comparar pendientes. */
  const ESC_Z = 0.04;                       // altura en el dibujo por cada unidad de error
  const Z_MEDIO = (96 * ESC_Z) / 2;         // centra el terreno en vertical
  const altura = v => (v - F_MIN) * ESC_Z - Z_MEDIO;
  function dibujar3D() {
    const g = new Grafico(lienzo3d, { prop: 0.56, min: 300, max: 560, x: [0, 1], y: [0, 1], m: { i: 0, d: 0, s: 0, b: 0 } });
    const c = g.ctx, az = vista[0], el = vista[1];
    const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
    // crudo: punto del terreno (x₁, x₂, altura) → [x, y] en unidades del terreno, y la profundidad
    const crudo = (X, Y, Z) => {
      const xr = X * ca - Y * sa, yr = X * sa + Y * ca;
      return [xr, yr * se + Z * ce, yr * ce - Z * se];
    };
    // Encuadre: el terreno ocupa el lienzo en cada vista. Dentro de una vista, una unidad mide
    // lo mismo en las tres direcciones, así que las pendientes se comparan sin engaño.
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i <= 16; i++) for (let j = 0; j <= 8; j++) {
      const X = -4 + i / 2, Y = -2 + j / 2, q = crudo(X, Y, altura(f(X, Y)));
      x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]);
    }
    const esc = Math.min((g.w - 40) / (x1 - x0), (g.h - 60) / (y1 - y0));
    const cx = g.w / 2 - esc * (x0 + x1) / 2, cy = g.h / 2 + 10 + esc * (y0 + y1) / 2;
    // proy: punto del terreno (x₁, x₂, altura) → [x en pantalla, y en pantalla, profundidad]
    const proy = (X, Y, Z) => { const q = crudo(X, Y, Z); return [cx + esc * q[0], cy - esc * q[1], q[2]]; };
    const bajo = hexARgb(css('--g-mapa-bajo')), alto = hexARgb(css('--g-mapa-alto'));
    const NX = 40, NY = 20, malla = [];
    for (let i = 0; i <= NX; i++) {
      malla.push([]);
      for (let j = 0; j <= NY; j++) {
        const X = -4 + 8 * i / NX, Y = -2 + 4 * j / NY, v = f(X, Y);
        malla[i].push({ X: X, Y: Y, v: v, p: proy(X, Y, altura(v)) });
      }
    }
    const caras = [];
    for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
      const a = malla[i][j], b = malla[i + 1][j], d = malla[i + 1][j + 1], e = malla[i][j + 1];
      const prof = (a.p[2] + b.p[2] + d.p[2] + e.p[2]) / 4, v = (a.v + b.v + d.v + e.v) / 4;
      // Sombreado suave: normal de la cara frente a una luz que viene de arriba.
      const ux = b.X - a.X, uz = altura(b.v) - altura(a.v), vy = e.Y - a.Y, vz = altura(e.v) - altura(a.v);
      const nx = -uz * vy, ny = -ux * vz, nz = ux * vy, nn = Math.hypot(nx, ny, nz) || 1;
      const luz = Math.abs((nx * -0.35 + ny * -0.45 + nz * 0.82) / nn);
      caras.push({ pts: [a.p, b.p, d.p, e.p], prof: prof, v: v, luz: luz });
    }
    caras.sort((p, q) => q.prof - p.prof);
    const linea = css('--g-eje');
    c.lineWidth = 0.6;
    caras.forEach(k => {
      const t = Math.pow(Math.min(1, Math.max(0, (k.v - F_MIN) / 96)), 0.8), s = 0.72 + 0.28 * k.luz;
      const col = [0, 1, 2].map(q => Math.round((bajo[q] + (alto[q] - bajo[q]) * t) * s));
      c.fillStyle = 'rgb(' + col.join(',') + ')';
      c.beginPath(); k.pts.forEach((p, n) => n ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill();
      c.globalAlpha = 0.28; c.strokeStyle = linea; c.stroke(); c.globalAlpha = 1;
    });
    // trazo3D: lista de puntos (x₁, x₂) → línea dibujada sobre el terreno
    const trazo = (pts, color, ancho) => {
      c.save(); c.strokeStyle = color; c.lineWidth = ancho; c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath();
      pts.forEach((q, n) => { const p = proy(q[0], q[1], altura(f(q[0], q[1])) + 0.03); if (n) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
      c.stroke(); c.restore();
    };
    const esteOeste = [], norteSur = [];
    for (let k = 0; k <= 80; k++) esteOeste.push([-4 + 8 * k / 80, MIN[1]]);
    for (let k = 0; k <= 40; k++) norteSur.push([MIN[0], -2 + 4 * k / 40]);
    trazo(esteOeste, css('--g-serie3'), 3);
    trazo(norteSur, css('--g-serie4'), 3);
    // Camino del descenso (solo los puntos dentro del terreno dibujado).
    const dentro = camino.filter(q => Math.abs(q[0]) <= 4 && Math.abs(q[1]) <= 2);
    if (dentro.length) {
      trazo(dentro, css('--g-serie1'), 2.6);
      dentro.forEach((q, n) => {
        const p = proy(q[0], q[1], altura(f(q[0], q[1])) + 0.03);
        c.beginPath(); c.arc(p[0], p[1], n === dentro.length - 1 ? 6 : 3.5, 0, 2 * Math.PI);
        c.fillStyle = css('--g-serie1'); c.fill();
      });
    }
    const pm = proy(MIN[0], MIN[1], altura(F_MIN) + 0.05);
    g.textoPx('★', pm[0], pm[1], { al: 'center', color: css('--g-serie4'), tam: 18, peso: 700 });
    // Rótulos de los ejes, en el borde del terreno.
    const r1 = proy(4.6, -2, altura(F_MIN)), r2 = proy(-4, 2.6, altura(F_MIN));
    // Rótulos solo si caen dentro del lienzo (en las vistas de frente, un eje apunta hacia ti).
    if (r1[0] > 60 && r1[0] < g.w - 60) g.textoPx('x₁ · este →', r1[0], r1[1], { al: 'center', color: css('--tinta-suave'), tam: 12, peso: 700, fondo: true });
    if (r2[0] > 60 && r2[0] < g.w - 60) g.textoPx('x₂ · norte →', r2[0], r2[1], { al: 'center', color: css('--tinta-suave'), tam: 12, peso: 700, fondo: true });
    g.textoPx('Altura = error f(x₁, x₂) · arrastra para girar', 10, 14, { color: css('--tinta-suave'), tam: 12, peso: 600 });
  }

  /* dibujarCortes: distancia desde el mínimo → subida del error hacia el este (d²) y hacia el norte (10·d²). */
  function dibujarCortes() {
    const g = new Grafico(lienzoCortes, { prop: 0.78, min: 230, max: 330, x: [-1.3, 1.3], y: [0, 14], m: { i: 36, d: 12, s: 28, b: 46 } });
    g.ejes({ xt: [-1, -0.5, 0, 0.5, 1], yt: [0, 5, 10], fx: v => num(v, v % 1 ? 1 : 0), ex: 'pasos desde el mínimo (d)', ey: 'cuánto sube el error' });
    g.textoPx('Mismo paso, distinta subida', g.x0 + 4, 12, { peso: 700, tam: 12.5 });
    g.funcion(d => 10 * d * d, { color: css('--g-serie4'), ancho: 2.6 });
    g.funcion(d => d * d, { color: css('--g-serie3'), ancho: 2.6 });
    g.linea([[1, 0], [1, 14]], { color: css('--g-eje'), ancho: 1, guion: [3, 3] });
    g.punto(1, 10, { r: 5.5, color: css('--g-serie4'), borde: css('--papel-2') });
    g.punto(1, 1, { r: 5.5, color: css('--g-serie3'), borde: css('--papel-2') });
    g.textoPx('norte: sube 10', g.X(1) - 8, g.Y(10), { al: 'right', color: css('--g-serie4'), peso: 700, fondo: true });
    g.textoPx('este: sube 1', g.X(1) - 8, g.Y(1) - 12, { al: 'right', color: css('--g-serie3'), peso: 700, fondo: true });
  }

  function dibujar() {
    og.textContent = num(Number(cg.value), 3);
    dibujar3D();
    dibujarCortes();
    const g = new Grafico(lienzo, { prop: 0.5, min: 230, max: 520, x: [-4, 4], y: [-2, 2], m: { i: 36, d: 12, s: 12, b: 46 } });
    pintarMapa(g, f, NIVELES, 'd2');
    g.ejes({ xt: rango(-4, 4, 1), yt: [-2, -1, 0, 1, 2], ex: 'x₁ (este)', ey: 'x₂ (norte)', rejillaX: false, rejillaY: false });
    g.linea([[-4, MIN[1]], [4, MIN[1]]], { color: css('--g-serie3'), ancho: 1.6, guion: [5, 4] });
    g.linea([[MIN[0], -2], [MIN[0], 2]], { color: css('--g-serie4'), ancho: 1.6, guion: [5, 4] });
    g.textoPx('★', g.X(MIN[0]), g.Y(MIN[1]), { al: 'center', color: css('--g-serie4'), tam: 18, peso: 700 });
    const indigo = css('--g-serie1');
    g.recortar();
    g.linea(camino, { color: indigo, ancho: 2.2 });
    camino.forEach((p, i) => g.punto(p[0], p[1], { r: i === 0 ? 6 : 3.8, color: indigo, borde: i === 0 ? css('--papel-2') : null }));
    g.soltar();
    const p = camino[camino.length - 1], gr = grad(p[0], p[1]);
    // Flecha: dirección contraria al gradiente, dibujada con largo fijo.
    const dx = -gr[0] * (g.X(1) - g.X(0)), dy = gr[1] * (g.Y(0) - g.Y(1));
    const largo = Math.hypot(dx, dy);
    if (largo > 1e-9 && !escapo && Math.abs(p[0]) < 4 && Math.abs(p[1]) < 2) {
      const px = g.X(p[0]), py = g.Y(p[1]);
      g.flechaPx(px, py, px + 40 * dx / largo, py + 40 * dy / largo, { color: css('--g-serie2'), ancho: 3 });
    }

    // Tabla de pasos.
    const filas = camino.map((q, i) => [i, q]).filter(r => r[0] <= 8 || r[0] === camino.length - 1);
    cuerpo.innerHTML = filas.map(r => '<tr' + (r[0] === camino.length - 1 ? ' class="destacada"' : '') + '><td>' + m('x_{' + r[0] + '}') + '</td><td class="num">' + num(r[1][0], 2) + '</td><td class="num">' + num(r[1][1], 2) + '</td><td class="num">' + num(f(r[1][0], r[1][1]), 2) + '</td></tr>').join('');
    const gam = Number(cg.value), k = camino.length - 1;
    const par = (a, b) => '(' + teX(a, 2) + ';\\ ' + teX(b, 2) + ')';
    lectura.innerHTML = escapo
      ? '<b>El camino se escapó.</b> Con ' + m('\\gamma = ' + teX(gam, 3)) + ' cada salto cruza el valle y cae más alto. Baja ' + m('\\gamma') + ' y pulsa «Volver a (−3; −1)».'
      : '<b>Paso ' + k + '</b> en ' + m('x_{' + k + '} = ' + par(p[0], p[1])) +
        '<br>' + m('\\tfrac{\\partial f}{\\partial x_1} = ' + teX(gr[0], 2)) + ' · ' + m('\\tfrac{\\partial f}{\\partial x_2} = ' + teX(gr[1], 2)) +
        ', así que ' + m('\\nabla f(x_{' + k + '}) = ' + par(gr[0], gr[1])) + '. La flecha ámbar va en sentido contrario.' +
        '<br>Siguiente: ' + m('x_{' + (k + 1) + '} = ' + par(p[0], p[1]) + ' - ' + teX(gam, 3) + '\\times' + par(gr[0], gr[1]) + ' = ' + par(p[0] - gam * gr[0], p[1] - gam * gr[1]));
  }

  // Giro del terreno: arrastrar en horizontal gira; en vertical, inclina la mirada.
  let ultimo = null;
  arrastrar(lienzo3d, (px, py, tipo) => {
    if (tipo === 'pointerdown') { ultimo = [px, py]; return; }
    if (!ultimo) return;
    vista = [vista[0] - (px - ultimo[0]) * 0.01, Math.max(0.05, Math.min(1.56, vista[1] + (py - ultimo[1]) * 0.01))];
    ultimo = [px, py];
    botonesVista.forEach(b => b.setAttribute('aria-pressed', 'false'));
    dibujar3D();
  });
  lienzo3d.style.cursor = 'grab';
  botonesVista.forEach(b => b.addEventListener('click', () => {
    vista = VISTAS[b.dataset.vista].slice();
    botonesVista.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    dibujar3D();
  }));

  document.getElementById('d2-paso').addEventListener('click', paso);
  document.getElementById('d2-diez').addEventListener('click', () => {
    clearInterval(animando); let n = 0;
    animando = setInterval(() => { paso(); n++; if (n >= 10 || escapo) { clearInterval(animando); animando = null; } }, 140);
  });
  document.getElementById('d2-reinicio').addEventListener('click', () => reiniciar([-3, -1]));
  cg.addEventListener('input', () => { og.textContent = num(Number(cg.value), 3); dibujar(); });
  arrastrar(lienzo, (px, py, tipo) => {
    if (tipo !== 'pointerdown') return;
    const x0 = 36, x1 = lienzo.clientWidth - 12, y1 = 12, y0 = lienzo.clientHeight - 46;
    const a = -4 + (px - x0) * 8 / (x1 - x0), b = -2 + (y0 - py) * 4 / (y0 - y1);
    if (a < -4 || a > 4 || b < -2 || b > 2) return;
    reiniciar([Math.round(a * 100) / 100, Math.round(b * 100) / 100]);
  });
  alRedibujar(dibujar);
}


/* ============================================================
   PROCESO 8: Laboratorio 7 · Lotes completos, minilotes y estocástico
   Insumo:    40 personas simuladas (educación, ingreso) con semilla fija
   Resultado: tres caminos en el mapa de pérdida, tres rectas y la cuenta de épocas
   ============================================================ */
function labLotes() {
  const mapa = document.getElementById('lotes-mapa'); if (!mapa) return;
  const lienzoDatos = document.getElementById('lotes-datos');
  const lectura = document.getElementById('lotes-lectura');
  const GAMMA = 0.1, PASOS = 40, INICIO = [-1.0, -1.2];

  // Datos simulados: educación (años) → z = (educación − 6) / 4 → ingreso = 1 + 0,45·z + ruido
  const azar = azarConSemilla(20261122);
  const normal = () => Math.sqrt(-2 * Math.log(azar() + 1e-12)) * Math.cos(2 * Math.PI * azar());
  const DATOS = Array.from({ length: 40 }, () => {
    const ed = Math.floor(azar() * 18), z = (ed - 6) / 4;
    return { ed: ed, z: z, y: 1 + 0.45 * z + 0.3 * normal() };
  });
  const n = DATOS.length;
  // perdida(a, b) → error cuadrático medio de la recta y = a + b·z en los 40 datos
  const perdida = (a, b) => DATOS.reduce((s, d) => s + Math.pow(d.y - a - b * d.z, 2), 0) / n;
  // Mínimo exacto (mínimos cuadrados), para fijar los niveles del mapa.
  const mz = DATOS.reduce((s, d) => s + d.z, 0) / n, my = DATOS.reduce((s, d) => s + d.y, 0) / n;
  const bOpt = DATOS.reduce((s, d) => s + (d.z - mz) * (d.y - my), 0) / DATOS.reduce((s, d) => s + Math.pow(d.z - mz, 2), 0);
  const aOpt = my - bOpt * mz, Lmin = perdida(aOpt, bOpt);
  const NIVELES = [0.02, 0.06, 0.15, 0.3, 0.55, 0.9, 1.4, 2, 2.8, 3.8, 5, 6.5].map(v => Lmin + v);

  const METODOS = [
    { nombre: 'Lotes completos', tam: 40, color: '--g-serie1' },
    { nombre: 'Minilotes', tam: 8, color: '--g-serie3' },
    { nombre: 'Estocástico', tam: 1, color: '--g-serie2' }
  ];
  let animando = null;
  function reiniciar() {
    clearInterval(animando); animando = null;
    METODOS.forEach(m => { m.camino = [INICIO.slice()]; m.orden = barajar(DATOS.map((_, i) => i)); m.pos = 0; });
    dibujar();
  }
  // paso(m): parámetros (a, b) → (a, b) − γ·gradiente calculado con el lote del método
  function paso(m) {
    if (m.pos + m.tam > n) { m.orden = barajar(m.orden); m.pos = 0; }
    const lote = m.orden.slice(m.pos, m.pos + m.tam); m.pos += m.tam;
    const p = m.camino[m.camino.length - 1];
    let ga = 0, gb = 0;
    lote.forEach(i => { const d = DATOS[i], r = d.y - p[0] - p[1] * d.z; ga += -2 * r; gb += -2 * r * d.z; });
    ga /= lote.length; gb /= lote.length;
    m.camino.push([p[0] - GAMMA * ga, p[1] - GAMMA * gb]);
  }
  function dibujar() {
    const g = new Grafico(mapa, { prop: 0.82, min: 250, max: 380, x: [-1.6, 2.2], y: [-1.6, 1.4], m: { i: 40, d: 10, s: 12, b: 46 } });
    pintarMapa(g, perdida, NIVELES, 'lotes');
    g.ejes({ xt: [-1, 0, 1, 2], yt: [-1, 0, 1], ex: 'a (altura)', ey: 'b (inclinación)', rejillaX: false, rejillaY: false, fx: v => num(v, 0) });
    g.textoPx('★', g.X(aOpt), g.Y(bOpt), { al: 'center', color: css('--g-serie4'), tam: 17, peso: 700 });
    g.recortar();
    METODOS.slice().reverse().forEach(m => {
      g.linea(m.camino, { color: css(m.color), ancho: m.tam === 1 ? 1.6 : 2.4, alfa: 0.95 });
      const u = m.camino[m.camino.length - 1];
      g.punto(u[0], u[1], { r: 5, color: css(m.color), borde: css('--papel-2') });
    });
    g.soltar();
    g.punto(INICIO[0], INICIO[1], { r: 5, color: css('--tinta') });
    g.textoPx('inicio', g.X(INICIO[0]) + 8, g.Y(INICIO[1]), { tam: 11.5, peso: 600, fondo: true });

    const h = new Grafico(lienzoDatos, { prop: 0.82, min: 250, max: 380, x: [-0.5, 17.5], y: [-0.4, 3], m: { i: 36, d: 10, s: 12, b: 46 } });
    h.ejes({ xt: [0, 5, 10, 15], yt: [0, 1, 2, 3], ex: 'años de educación', ey: 'ingreso (miles de S/)' });
    DATOS.forEach(d => h.punto(d.ed, d.y, { r: 3.6, color: css('--g-eje') }));
    h.recortar();
    METODOS.forEach(m => {
      const u = m.camino[m.camino.length - 1];
      const recta = ed => u[0] + u[1] * (ed - 6) / 4;
      h.linea([[-0.5, recta(-0.5)], [17.5, recta(17.5)]], { color: css(m.color), ancho: 2.4, alfa: 0.9 });
    });
    h.soltar();

    lectura.innerHTML = METODOS.map(mt => {
      const k = mt.camino.length - 1, u = mt.camino[k];
      return '<span style="color:var(' + mt.color + ');font-weight:700">' + mt.nombre + '</span>: ' + k + ' pasos · ' +
        num(k * mt.tam / n, k * mt.tam % n === 0 ? 0 : 1) + (k * mt.tam === n ? ' época' : ' épocas') + ' · ' + m('R_{\\text{emp}} = ' + teX(perdida(u[0], u[1]), 3));
    }).join('<br>') + '<br><span class="suave">Pérdida mínima posible: ' + m(teX(Lmin, 3)) + ' (estrella roja).</span>';
  }
  document.getElementById('lotes-correr').addEventListener('click', () => {
    reiniciar();
    let k = 0;
    animando = setInterval(() => {
      METODOS.forEach(paso); k++; dibujar();
      if (k >= PASOS) { clearInterval(animando); animando = null; }
    }, 60);
  });
  document.getElementById('lotes-reiniciar').addEventListener('click', reiniciar);
  METODOS.forEach(m => { m.camino = [INICIO.slice()]; m.orden = barajar(DATOS.map((_, i) => i)); m.pos = 0; });
  alRedibujar(dibujar);
}


/* ============================================================
   PROCESO 9: Laboratorio 8 · Eventos con un dado
   Insumo:    las caras marcadas en A y en B
   Resultado: P(A), P(B), P(A ∩ B), P(A | B), veredicto de independencia y el reto 3.2
   ============================================================ */
function labDado() {
  const zonaA = document.getElementById('dado-a'); if (!zonaA) return;
  const zonaB = document.getElementById('dado-b');
  const lectura = document.getElementById('dado-lectura');
  const A = new Set([1, 2]), B = new Set([2, 3]);
  const mcd = (a, b) => b ? mcd(b, a % b) : a;
  // fr(2, 6) → '1/3'; fr(0, 6) → '0'; fr(6, 6) → '1'
  const fr = (k, m) => { if (k === 0) return '0'; if (k === m) return '1'; const d = mcd(k, m); return (k / d) + '/' + (m / d); };
  const conjunto = S => '{' + Array.from(S).sort().join(', ') + '}';

  function botones(zona, S) {
    for (let i = 1; i <= 6; i++) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'cara'; b.textContent = i; b.setAttribute('aria-pressed', String(S.has(i)));
      b.setAttribute('aria-label', 'Cara ' + i);
      b.addEventListener('click', () => { if (S.has(i)) S.delete(i); else S.add(i); b.setAttribute('aria-pressed', String(S.has(i))); actualizar(); });
      zona.appendChild(b);
    }
  }
  botones(zonaA, A); botones(zonaB, B);

  function actualizar() {
    const inter = Array.from(A).filter(x => B.has(x)).length;
    const conjT = S => '\\{' + Array.from(S).sort().join(',\\ ') + '\\}';
    let html = m('A = ' + conjT(A)) + ' · ' + m('B = ' + conjT(B)) + '<br>' +
      m('P(A) = ' + frT(A.size, 6)) + ' · ' + m('P(B) = ' + frT(B.size, 6)) + ' · ' + m('P(A\\cap B) = ' + frT(inter, 6)) + '<br>';
    let independientes = false;
    if (B.size === 0) html += 'B está vacío: ' + m('P(A\\mid B)') + ' no está definida, porque no se puede dividir entre ' + m('P(B) = 0') + '.';
    else {
      html += m('P(A\\mid B) = \\dfrac{P(A\\cap B)}{P(B)} = \\dfrac{' + frT(inter, 6) + '}{' + frT(B.size, 6) + '} = ' + frT(inter, B.size)) + '<br>';
      independientes = inter * 6 === A.size * B.size;
      html += independientes ? 'Saber B no cambia la probabilidad de A: <b>A y B son independientes</b>.'
        : 'Saber B cambia la probabilidad de A, de ' + m(frT(A.size, 6)) + ' a ' + m(frT(inter, B.size)) + ': A y B <b>no</b> son independientes.';
    }
    lectura.innerHTML = html;

    // Reto 3.2: A = {1, 2} y un B independiente, ni vacío ni con las seis caras.
    const estado = document.getElementById('independencia-estado'), ok = document.getElementById('independencia-ok');
    const caja = document.getElementById('reto-independencia');
    if (!estado || !ok || !caja || caja.classList.contains('resuelto')) return;
    const esA = A.size === 2 && A.has(1) && A.has(2);
    if (!esA) estado.innerHTML = 'Para este reto, deja ' + m('A = \\{1,\\ 2\\}') + '.';
    else if (B.size === 0 || B.size === 6) estado.textContent = 'B no puede estar vacío ni tener las seis caras.';
    else if (!independientes) estado.innerHTML = 'Todavía no: con ' + m('B = ' + conjT(B)) + ', ' + m('P(A\\mid B) = ' + frT(inter, B.size)) + ', distinto de ' + m('P(A) = \\tfrac13') + '.';
    else {
      estado.classList.remove('visible');
      ok.innerHTML = '¡Lo lograste! Con ' + m('B = ' + conjT(B)) + ', ' + m('P(A\\mid B) = \\tfrac13 = P(A)') + '. Saber B no te dice nada sobre A: son independientes. Hay varias soluciones; por ejemplo, «sale impar» ' + m('= \\{1,\\ 3,\\ 5\\}') + ' o «sale par» ' + m('= \\{2,\\ 4,\\ 6\\}') + '. Todas tienen tres caras y exactamente una de ellas está en A.';
      ok.classList.add('visible');
      marcarResuelto(caja);
    }
  }
  actualizar();
}


/* ============================================================
   PROCESO 10: Laboratorio 9 · Bayes con personas
   Insumo:    P(z), P(J | z) y P(J | no z)
   Resultado: el árbol de frecuencias en 1 000 000 de personas, una barra y la fórmula con números
   ============================================================ */
function labBayes() {
  const cz = document.getElementById('bayes-pz'); if (!cz) return;
  const cjz = document.getElementById('bayes-pjz'), cjn = document.getElementById('bayes-pjn');
  const oz = document.getElementById('bayes-pz-out'), ojz = document.getElementById('bayes-pjz-out'), ojn = document.getElementById('bayes-pjn-out');
  const arbol = document.getElementById('bayes-arbol'), barra = document.getElementById('bayes-barra');
  const zonaFormula = document.getElementById('bayes-formula');
  // Valores de la clase: P(z) = 0,0001; P(J | z) = 0,5; P(J) = 0,001 → P(J | no z) = 0,00095/0,9999
  const CLASE = { z: -4, jz: 0.5, jn: Math.log10(0.00095 / 0.9999) };
  cjn.value = CLASE.jn;
  // personas(50.0) → '50'; personas(3.25) → '3,3'; personas(0.04) → '0,04'
  const personas = v => (v >= 100 || Math.abs(v - Math.round(v)) < 0.05) ? num(v, 0) : v >= 1 ? num(v, 1) : num(v, 2);
  // dec(0.0001) → '0,0001' (sin notación científica)
  const dec = v => { let s = Number(v.toPrecision(3)).toFixed(8).replace(/0+$/, '').replace(/\.$/, ''); return s.replace('.', '{,}'); };

  function actualizar() {
    const pz = Math.pow(10, Number(cz.value)), pjz = Number(cjz.value), pjn = Math.pow(10, Number(cjn.value));
    oz.textContent = pct(pz); ojz.textContent = pct(pjz, 0); ojn.textContent = pct(pjn);
    const M = 1e6, enf = M * pz, enfJ = enf * pjz, san = M - enf, sanJ = san * pjn, totJ = enfJ + sanJ, post = enfJ / totJ;
    arbol.innerHTML = 'De <b>1 000 000</b> de personas: <b>' + personas(enf) + '</b> tienen la enfermedad, y <b>' + personas(enfJ) + '</b> de ellas tienen el defecto. ' +
      '<b>' + personas(san) + '</b> están sanas, y <b>' + personas(sanJ) + '</b> de ellas tienen el defecto.<br>' +
      'En total, <b>' + personas(totJ) + '</b> personas tienen el defecto. De ellas, <b>' + personas(enfJ) + '</b> están enfermas: ' +
      m('P(z\\mid J) = \\dfrac{' + personas(enfJ).replace(',', '{,}').replace(/\u202f/g, '\\,') + '}{' + personas(totJ).replace(',', '{,}').replace(/\u202f/g, '\\,') + '} = ' + pct(post).replace(',', '{,}').replace('\u00a0%', '\\,\\%')) + '.';
    // Barra: personas con el defecto, enfermas (rojo) y sanas (índigo).
    const g = new Grafico(barra, { prop: 0.06, min: 44, max: 52, x: [0, 1], y: [0, 1], m: { i: 0, d: 0, s: 6, b: 6 } });
    g.rect(0, 0, post, 1, css('--g-serie4'));
    g.rect(post, 0, 1, 1, css('--g-serie1'), 0.85);
    const etiqueta = 'enfermas: ' + pct(post);
    if (post > 0.3) g.textoPx(etiqueta, g.X(post / 2), g.h / 2, { al: 'center', color: '#fff', peso: 700 });
    else g.textoPx(etiqueta, g.X(post) + 8, g.h / 2, { color: '#fff', peso: 700 });
    formula(zonaFormula, 'P(z\\mid J)=\\frac{P(J\\mid z)\\,P(z)}{P(J)}=\\frac{' + dec(pjz) + '\\times ' + dec(pz) + '}{' + dec(totJ / M) + '}=' + dec(post));
  }
  [cz, cjz, cjn].forEach(c => c.addEventListener('input', actualizar));
  // Botón para volver a los valores de la clase.
  const volver = document.createElement('button');
  volver.type = 'button'; volver.className = 'boton boton--hueco'; volver.textContent = 'Volver a los valores de la clase';
  volver.addEventListener('click', () => { cz.value = CLASE.z; cjz.value = CLASE.jz; cjn.value = CLASE.jn; actualizar(); });
  cz.closest('.lab__controles').appendChild(volver);
  alRedibujar(actualizar);
}


/* ============================================================
   PROCESO 11: Laboratorio 10 · Suma y diferencia de dos dados (FEC)
   Insumo:    los 36 pares de dos dados (ML1, pág. 32)
   Resultado: tabla conjunta, distribución condicional del grupo elegido,
              la FEC en forma de carpa y la mejor recta (horizontal)
   ============================================================ */
function labFEC() {
  const tabla = document.getElementById('fec-tabla'); if (!tabla) return;
  const lienzoC = document.getElementById('fec-condicional'), lienzoF = document.getElementById('fec-curva');
  const lectura = document.getElementById('fec-lectura');
  // cuenta[x][y]: cuántos de los 36 pares tienen suma x y diferencia y
  const cuenta = {};
  for (let x = 2; x <= 12; x++) { cuenta[x] = [0, 0, 0, 0, 0, 0]; }
  for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) cuenta[i + j][Math.abs(i - j)]++;
  const total = x => cuenta[x].reduce((s, v) => s + v, 0);
  const media = x => cuenta[x].reduce((s, v, y) => s + v * y, 0) / total(x);
  const MEDIA_GENERAL = 70 / 36;
  // fr(2, 6) → '1/3': fracción simplificada
  const mcd = (a, b) => b ? mcd(b, a % b) : a;
  const fr = (k, m) => (k / mcd(k, m)) + '/' + (m / mcd(k, m));
  let elegido = 4;

  // Tabla como la de la diapositiva: columnas = suma (x), filas = diferencia (y).
  let html = '<thead><tr><th>y \\ x</th>';
  for (let x = 2; x <= 12; x++) html += '<th class="columna" data-x="' + x + '" tabindex="0" role="button" aria-label="Elegir suma ' + x + '">' + x + '</th>';
  html += '</tr></thead><tbody>';
  for (let y = 0; y <= 5; y++) {
    html += '<tr><th>' + y + '</th>';
    for (let x = 2; x <= 12; x++) {
      const c = cuenta[x][y];
      html += '<td data-x="' + x + '" class="' + (c ? 'lleno' : '') + '">' + (c === 1 ? '1/36' : c === 2 ? '1/18' : '') + '</td>';
    }
    html += '</tr>';
  }
  tabla.innerHTML = html + '</tbody>';
  tabla.addEventListener('click', ev => { const t = ev.target.closest('[data-x]'); if (t) { elegido = Number(t.dataset.x); dibujar(); } });
  tabla.addEventListener('keydown', ev => {
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.dataset.x) { ev.preventDefault(); elegido = Number(ev.target.dataset.x); dibujar(); }
  });

  function dibujar() {
    tabla.querySelectorAll('[data-x]').forEach(c => c.classList.toggle('activa', Number(c.dataset.x) === elegido));
    const t = total(elegido), med = media(elegido);
    const indigo = css('--g-serie1'), ambar = css('--g-serie2');

    const g = new Grafico(lienzoC, { prop: 0.7, min: 220, max: 300, x: [-0.6, 5.6], y: [0, 1.08], m: { i: 40, d: 10, s: 22, b: 46 } });
    g.ejes({ xt: [0, 1, 2, 3, 4, 5], yt: [0, 0.25, 0.5, 0.75, 1], fy: v => num(v, 2), ex: 'diferencia y', ey: 'P(y | x = ' + elegido + ')', rejillaX: false });
    cuenta[elegido].forEach((c, y) => {
      if (!c) return;
      g.rect(y - 0.32, 0, y + 0.32, c / t, indigo, 0.9);
      g.textoPx(fr(c, t), g.X(y), g.Y(c / t) - 9, { al: 'center', tam: 11, peso: 600 });
    });
    g.linea([[med, 0], [med, 1.08]], { color: ambar, ancho: 2.5, guion: [6, 4] });
    g.textoPx('media = ' + num(med, 2), g.X(med) + (med > 3.5 ? -6 : 6), g.y1 + 6, { al: med > 3.5 ? 'right' : 'left', color: ambar, peso: 700, fondo: true });

    const h = new Grafico(lienzoF, { prop: 0.7, min: 220, max: 300, x: [1.5, 12.5], y: [-0.2, 3.4], m: { i: 36, d: 10, s: 22, b: 46 } });
    h.ejes({ xt: rango(2, 12, 2), yt: [0, 1, 2, 3], ex: 'suma x', ey: 'E[Y | X = x]' });
    h.linea([[1.5, MEDIA_GENERAL], [12.5, MEDIA_GENERAL]], { color: ambar, ancho: 2.2, guion: [7, 5] });
    h.textoPx('mejor recta: 1,94', h.x1 - 2, h.Y(MEDIA_GENERAL) - 10, { al: 'right', color: ambar, tam: 11.5, peso: 700, fondo: true });
    const pts = []; for (let x = 2; x <= 12; x++) pts.push([x, media(x)]);
    h.linea(pts, { color: indigo, ancho: 2.5 });
    pts.forEach(p => h.punto(p[0], p[1], { r: p[0] === elegido ? 7 : 4, color: indigo, borde: p[0] === elegido ? css('--papel-2') : null }));

    const partes = cuenta[elegido].map((c, y) => c ? m('P(Y = ' + y + '\\mid X = ' + elegido + ') = ' + frT(c, t)) : null).filter(Boolean);
    lectura.innerHTML = 'Suma ' + m('x = ' + elegido) + ': ' + t + ' de los 36 pares, así que ' + m('P(X = ' + elegido + ') = \\tfrac{' + t + '}{36}') + ' (probabilidad marginal: la columna sumada).<br>' +
      'Dentro del grupo: ' + partes.join(' · ') + '.<br><b>Media del grupo:</b> ' + m('E[Y\\mid X = ' + elegido + '] = ' + teX(med, 2)) + '. Sin saber la suma, la mejor predicción sería la media general: ' + m('E[Y] = ' + teX(MEDIA_GENERAL, 2)) + '.';
  }
  alRedibujar(dibujar);
}


/* ============================================================
   PROCESO 12: Laboratorio 11 · Distribución «techo» (págs. 35, 42, 45)
   Insumo:    f(x, y) = x + y en [0, 1] × [0, 1]
   Resultado: la FEC (curva) frente al mejor predictor lineal (recta)
   ============================================================ */
function labTecho() {
  const lienzo = document.getElementById('techo-lienzo'); if (!lienzo) return;
  const cx = document.getElementById('techo-x'), ox = document.getElementById('techo-x-out');
  const lectura = document.getElementById('techo-lectura');
  const fec = x => (3 * x + 2) / (6 * x + 3);   // E[Y | X = x]
  const recta = x => 7 / 11 - x / 11;           // a* + b*·x, con b* = Cov/Var = −1/11

  function dibujar() {
    const x = Number(cx.value); ox.textContent = num(x, 2);
    const g = new Grafico(lienzo, { prop: 0.45, min: 230, max: 340, x: [0, 1], y: [0.53, 0.69], m: { i: 48, d: 14, s: 14, b: 46 } });
    g.ejes({ xt: rango(0, 1, 0.2), yt: [0.55, 0.6, 0.65], fx: v => num(v, 1), fy: v => num(v, 2), ex: 'x', ey: 'predicción de Y' });
    g.funcion(recta, { color: css('--g-serie2'), ancho: 2.5, guion: [8, 5] });
    g.funcion(fec, { color: css('--g-serie1'), ancho: 2.8 });
    g.linea([[x, 0.53], [x, 0.69]], { color: css('--g-eje'), ancho: 1.2, guion: [3, 3] });
    g.punto(x, fec(x), { r: 6, color: css('--g-serie1'), borde: css('--papel-2') });
    g.punto(x, recta(x), { r: 6, color: css('--g-serie2'), borde: css('--papel-2') });
    const dif = recta(x) - fec(x);
    lectura.innerHTML = m('x = ' + teX(x, 2)) + ' · <b style="color:var(--g-serie1)">FEC:</b> ' + m('E[Y\\mid X = x] = \\tfrac{3x+2}{6x+3} = ' + teX(fec(x), 3)) + ' · <b style="color:var(--g-serie2)">mejor recta:</b> ' + m('\\tfrac{7}{11} - \\tfrac{x}{11} = ' + teX(recta(x), 3)) + ' · ' +
      (Math.abs(dif) < 0.002 ? 'aquí casi coinciden.' : dif > 0 ? 'la recta queda por encima de la FEC.' : 'la recta queda por debajo de la FEC.') +
      '<br>La FEC es una curva; la recta solo la aproxima: queda por debajo en los extremos y por encima en el centro.';
  }
  cx.addEventListener('input', dibujar);
  alRedibujar(dibujar);
}


/* ============================================================
   PROCESO 13: Laboratorio 12 · Ley de los grandes números y límite central
   Insumo:    asegurados con 5 % de probabilidad de hospitalizarse (Bernoulli p = 0,05)
   Resultado: promedio acumulado de una muestra que crece y histograma de 1 000 promedios
   ============================================================ */
function labTCL() {
  const lienzoL = document.getElementById('tcl-lgn'); if (!lienzoL) return;
  const lienzoH = document.getElementById('tcl-hist');
  const lectura = document.getElementById('tcl-lectura');
  const botones = Array.from(document.querySelectorAll('#demo-tcl [data-n]'));
  const P = 0.05, SIGMA = Math.sqrt(P * (1 - P)), REPETICIONES = 1000, LARGO = 2000;
  let N = 10, medias = [], acumulado = [];

  // sortear: tamaño N → 1 000 promedios de muestras de N datos 0/1; y una muestra de 2 000 para la izquierda
  function sortear() {
    medias = new Array(REPETICIONES);
    for (let r = 0; r < REPETICIONES; r++) {
      let s = 0; for (let i = 0; i < N; i++) if (Math.random() < P) s++;
      medias[r] = s / N;
    }
    acumulado = new Array(LARGO); let s = 0;
    for (let i = 0; i < LARGO; i++) { if (Math.random() < P) s++; acumulado[i] = s / (i + 1); }
    dibujar();
  }
  function dibujar() {
    if (!medias.length) return;
    const indigo = css('--g-serie1'), rojo = css('--g-serie4'), ambar = css('--g-serie2');
    // Izquierda: el promedio de una sola muestra que crece, con el embudo de ±1,96 σ/√n.
    const g = new Grafico(lienzoL, { prop: 0.75, min: 230, max: 320, x: [0, LARGO], y: [0, 0.2], m: { i: 44, d: 12, s: 22, b: 46 } });
    g.ejes({ xt: [0, 500, 1000, 1500, 2000], yt: [0, 0.05, 0.1, 0.15, 0.2], fy: v => num(v, 2), ex: 'tamaño de la muestra', ey: 'promedio acumulado' });
    const arriba = [], abajo = [];
    for (let n = 5; n <= LARGO; n += 5) { const e = 1.96 * SIGMA / Math.sqrt(n); arriba.push([n, Math.min(0.2, P + e)]); abajo.push([n, Math.max(0, P - e)]); }
    const c = g.ctx; c.save(); c.fillStyle = css('--g-relleno'); c.beginPath();
    arriba.forEach((p, i) => { if (i) c.lineTo(g.X(p[0]), g.Y(p[1])); else c.moveTo(g.X(p[0]), g.Y(p[1])); });
    abajo.reverse().forEach(p => c.lineTo(g.X(p[0]), g.Y(p[1]))); c.closePath(); c.fill(); c.restore();
    g.linea([[0, P], [LARGO, P]], { color: rojo, ancho: 1.6, guion: [6, 4] });
    g.recortar(); g.linea(acumulado.map((v, i) => [i + 1, v]), { color: indigo, ancho: 1.8 }); g.soltar();

    // Derecha: histograma de los 1 000 promedios, con la curva normal que predice el teorema.
    const anchoBin = Math.max(1 / N, 0.0025), sigmaN = SIGMA / Math.sqrt(N);
    const conteo = {};
    medias.forEach(m => { const k = Math.round(m / anchoBin); conteo[k] = (conteo[k] || 0) + 1; });
    const densidad = k => conteo[k] / (REPETICIONES * anchoBin);
    const picoNormal = 1 / (sigmaN * Math.sqrt(2 * Math.PI));
    let maxD = picoNormal; Object.keys(conteo).forEach(k => { maxD = Math.max(maxD, densidad(k)); });
    const h = new Grafico(lienzoH, { prop: 0.75, min: 230, max: 320, x: [0, 0.2], y: [0, maxD * 1.12], m: { i: 44, d: 12, s: 22, b: 46 } });
    h.ejes({ xt: [0, 0.05, 0.1, 0.15, 0.2], yt: marcas(0, maxD * 1.08, 4), fx: v => num(v, 2), ex: 'promedio de cada muestra', ey: 'densidad' });
    const anchoBarra = anchoBin >= 0.02 ? 0.006 : anchoBin * 0.88;
    h.recortar();
    Object.keys(conteo).forEach(k => { const x = Number(k) * anchoBin; h.rect(x - anchoBarra / 2, 0, x + anchoBarra / 2, densidad(k), indigo, 0.85); });
    h.funcion(x => Math.exp(-0.5 * Math.pow((x - P) / sigmaN, 2)) * picoNormal, { color: ambar, ancho: 2.2, pasos: 500 });
    h.linea([[P, 0], [P, maxD * 1.12]], { color: rojo, ancho: 1.5, guion: [6, 4] });
    h.soltar();

    const prom = medias.reduce((s, v) => s + v, 0) / REPETICIONES;
    const de = Math.sqrt(medias.reduce((s, v) => s + Math.pow(v - prom, 2), 0) / (REPETICIONES - 1));
    lectura.innerHTML = m('N = ' + teX(N, 0)) + ' · 1 000 muestras · media de los promedios: ' + m(teX(prom, 4)) + ' (el valor real es ' + m('\\mu = 0{,}05') + ').<br>' +
      'Ancho de los promedios (desviación estándar): ' + m(teX(de, 4)) + '. El teorema predice ' + m('\\sigma/\\sqrt{N} = 0{,}218/\\sqrt{' + teX(N, 0) + '} = ' + teX(sigmaN, 4)) + '.<br>' +
      'Izquierda: la franja sombreada es donde cae el promedio el 95 % de las veces; se angosta como ' + m('1/\\sqrt{n}') + '.';
  }
  botones.forEach(b => b.addEventListener('click', () => {
    N = Number(b.dataset.n);
    botones.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    sortear();
  }));
  document.getElementById('tcl-sortear').addEventListener('click', sortear);
  sortear();
  alRedibujar(dibujar);
}


/* ============================================================
   PROCESO 14: Barras de la tabla del SIS y ficha de repaso
   Insumo:    los porcentajes de la tabla y las cajas «Recuerda»
   Resultado: barritas proporcionales en la tabla y la ficha final imprimible
   ============================================================ */
function barrasSIS() {
  const celdas = document.querySelectorAll('#tabla-sis td[data-pct]');
  const max = Math.max.apply(null, Array.from(celdas).map(c => Number(c.dataset.pct)));
  celdas.forEach(c => {
    const v = Number(c.dataset.pct);
    c.innerHTML = '<span class="barrita" style="width:' + Math.max(3, 110 * v / max) + 'px"></span>' + c.textContent;
  });
}

function armarFicha() {
  const destino = document.getElementById('ficha-contenido'); if (!destino) return;
  document.querySelectorAll('main .caja--recuerda').forEach(caja => {
    if (destino.contains(caja)) return;
    const copia = caja.cloneNode(true);
    const origen = document.createElement('p');
    origen.className = 'caja__origen';
    origen.textContent = caja.dataset.origen || '';
    copia.querySelector('.caja__titulo').after(origen);
    destino.appendChild(copia);
  });
  const boton = document.getElementById('imprimir-ficha');
  if (boton) boton.addEventListener('click', () => {
    document.body.classList.add('imprimir-ficha');
    window.print();
  });
  window.addEventListener('afterprint', () => document.body.classList.remove('imprimir-ficha'));
}


/* ============================================================
   PROCESO 15: Arranque
   Insumo:    la página ya cargada
   Resultado: todo funcionando; un error en un laboratorio no detiene a los demás
   ============================================================ */
function arrancar() {
  [iniciarFormulas, iniciarBarra, iniciarTema, iniciarRetos, labGPT, labPerdida, labDerivada, labLimite, labCadena, labDescenso1D,
   labGustos, labDescenso2D, labLotes, labDado, labBayes, labFEC, labTecho, labTCL, barrasSIS, armarFicha]
    .forEach(fn => { try { fn(); } catch (e) { console.error('[lección 1] ' + fn.name, e); } });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();

})();
