/* ============================================================
   econometria-01.js: laboratorios de la lección de Econometría, clase 1.
   Usa las herramientas compartidas de recursos/comun.js (objeto ML)
   y los datos de la ENAHO 2023 de recursos/datos-econometria-01.js (DATOS_ECO1).
   ============================================================ */
(function () {
'use strict';
const D = window.DATOS_ECO1 || {};
const { css, num, pct, m, teX, Grafico, alRedibujar, marcas, rango } = ML;

// botonesGrupo(selector, alElegir): botones con aria-pressed → solo uno activo; llama alElegir(botón).
function botonesGrupo(selector, alElegir) {
  const bs = Array.from(document.querySelectorAll(selector));
  bs.forEach(b => b.addEventListener('click', () => { bs.forEach(x => x.setAttribute('aria-pressed', String(x === b))); alElegir(b); }));
  return bs;
}
// media(lista) → promedio;  de(lista) → desviación estándar de la muestra (divide entre n − 1)
const media = a => a.reduce((s, v) => s + v, 0) / a.length;
const de = a => { const mu = media(a); return Math.sqrt(a.reduce((s, v) => s + (v - mu) * (v - mu), 0) / (a.length - 1)); };
// muestraDe(lista, n) → n elementos al azar, sin repetir
function muestraDe(lista, n) {
  const idx = new Set();
  while (idx.size < n) idx.add(Math.floor(Math.random() * lista.length));
  return Array.from(idx).map(i => lista[i]);
}
// histograma(valores, a, b, bins) → conteos por intervalo entre a y b
function histograma(valores, a, b, bins) {
  const c = new Array(bins).fill(0), w = (b - a) / bins;
  valores.forEach(v => { const k = Math.floor((v - a) / w); if (k >= 0 && k < bins) c[k]++; });
  return c;
}
// barras(g, conteos, a, b, color, alfa, escala): dibuja un histograma (escala convierte conteos en alturas)
function barras(g, conteos, a, b, color, alfa, escala) {
  const w = (b - a) / conteos.length;
  conteos.forEach((cnt, k) => { if (cnt) g.rect(a + k * w + w * 0.06, 0, a + (k + 1) * w - w * 0.06, cnt * (escala || 1), color, alfa === undefined ? 0.85 : alfa); });
}
const densNormal = (x, mu, s) => Math.exp(-0.5 * Math.pow((x - mu) / s, 2)) / (s * Math.sqrt(2 * Math.PI));


/* ============================================================
   PROCESO 1: Laboratorio 0 · Contrafactual y diferencias en diferencias
   Insumo:    efecto real, diferencia inicial, tendencia común y tendencia propia
   Resultado: dos grupos antes y después, el contrafactual y tres estimaciones comparadas
   ============================================================ */
function labDiD() {
  const lienzo = document.getElementById('did-lienzo'); if (!lienzo) return;
  const ids = ['e', 'd', 't', 'p'], c = {}, o = {};
  ids.forEach(k => { c[k] = document.getElementById('did-' + k); o[k] = document.getElementById('did-' + k + '-out'); });
  const lectura = document.getElementById('did-lectura');
  const BASE = 45;
  const firm = v => (v > 0 ? '+' : '') + num(v, 0);

  function dibujar() {
    const v = {}; ids.forEach(k => { v[k] = Number(c[k].value); o[k].textContent = firm(v[k]) + ' pts'; });
    const C0 = BASE, C1 = BASE + v.t, T0 = BASE + v.d, T1c = BASE + v.d + v.t + v.p, T1 = T1c + v.e;
    const g = new Grafico(lienzo, { prop: 0.45, min: 280, max: 400, x: [-0.3, 1.45], y: [0, 100], m: { i: 46, d: 16, s: 18, b: 46 } });
    g.ejes({ xt: [0, 1], yt: [0, 20, 40, 60, 80, 100], fx: x => x === 0 ? 'Antes' : 'Después', ey: '% de vecinos con miedo', rejillaX: false });
    const ind = css('--g-serie1'), ver = css('--g-serie3'), gris = css('--g-eje'), amb = css('--g-serie2');
    g.linea([[0, C0], [1, C1]], { color: ver, ancho: 3 });
    g.linea([[0, T0], [1, T1c]], { color: gris, ancho: 2, guion: [6, 5] });
    g.linea([[0, T0], [1, T1]], { color: ind, ancho: 3 });
    [[0, C0, ver], [1, C1, ver], [0, T0, ind], [1, T1, ind]].forEach(q => g.punto(q[0], q[1], { r: 6, color: q[2], borde: css('--papel-2') }));
    g.punto(1, T1c, { r: 5, color: gris, hueco: true });
    // Llave del efecto real (contrafactual → tratados) y de la comparación ingenua (control → tratados).
    const llave = (x, a, b, color, texto) => {
      g.linea([[x, a], [x, b]], { color: color, ancho: 2.5 });
      g.linea([[x - 0.02, a], [x + 0.02, a]], { color: color, ancho: 2.5 }); g.linea([[x - 0.02, b], [x + 0.02, b]], { color: color, ancho: 2.5 });
      g.textoPx(texto, g.X(x) + 8, g.Y((a + b) / 2), { color: color, peso: 700, tam: 11.5, fondo: true });
    };
    if (Math.abs(v.e) > 0) llave(1.07, T1c, T1, ind, 'efecto real ' + firm(v.e));
    llave(1.2, C1, T1, amb, 'ingenua ' + firm(T1 - C1));
    const ingenua = T1 - C1, antesDespues = T1 - T0, did = (T1 - T0) - (C1 - C0);
    lectura.innerHTML =
      '<b>Comparación ingenua</b> (después, tratados menos control): ' + m('\\bar Y_{T,1} - \\bar Y_{C,1} = ' + teX(T1, 0) + ' - ' + teX(C1, 0) + ' = ' + teX(ingenua, 0)) + ' puntos.<br>' +
      '<b>Antes y después</b> (solo tratados): ' + m('\\bar Y_{T,1} - \\bar Y_{T,0} = ' + teX(antesDespues, 0)) + ' puntos.<br>' +
      '<b>Diferencia en diferencias:</b> ' + m('(' + teX(T1, 0) + ' - ' + teX(T0, 0) + ') - (' + teX(C1, 0) + ' - ' + teX(C0, 0) + ') = ' + teX(did, 0)) + ' puntos.<br>' +
      'Efecto real: ' + m(teX(v.e, 0)) + ' puntos. ' +
      (v.p === 0 ? 'La diferencia en diferencias acierta: resta la diferencia inicial y la tendencia común.'
                 : 'La diferencia en diferencias se equivoca en ' + num(Math.abs(v.p), 0) + ' puntos: sin el programa, los tratados no habrían seguido la tendencia del control (tendencias no paralelas).');
  }
  ids.forEach(k => c[k].addEventListener('input', dibujar));
  alRedibujar(dibujar);
}


/* ============================================================
   PROCESO 2: Laboratorio 1 · Cinco maneras de elegir 10 estudiantes
   Insumo:    100 estudiantes simulados en 5 facultades (semilla fija)
   Resultado: la muestra resaltada, el histograma de 1 000 promedios y la tabla de sesgo y dispersión
   ============================================================ */
function labMuestreo() {
  const rejilla = document.getElementById('muestreo-rejilla'); if (!rejilla) return;
  const lienzoH = document.getElementById('muestreo-hist'), lectura = document.getElementById('muestreo-lectura');
  const cuerpo = document.querySelector('#muestreo-tabla tbody');
  const azar = ML.azarConSemilla(2611);
  const FACULTADES = [['Artes', 20], ['Ingeniería', 21], ['Ciencias Sociales', 22], ['Derecho', 23], ['Educación', 25]];
  // Población: 100 estudiantes; los más jóvenes pasan más tiempo en el campus (son «más accesibles»).
  const P = [];
  FACULTADES.forEach((f, fi) => { for (let k = 0; k < 20; k++) {
    const edad = Math.max(17, Math.min(35, Math.round(f[1] + 1.6 * ML.normalAzar(azar))));
    P.push({ fac: fi, edad: edad, acceso: -edad + 1.5 * ML.normalAzar(azar) });
  } });
  const MU = media(P.map(p => p.edad));
  const accesibles = P.map((p, i) => i).sort((a, b) => P[b].acceso - P[a].acceso).slice(0, 15);
  const N = 10;
  const METODOS = {
    simple: { nombre: 'Aleatorio simple', como: '10 al azar entre los 100', elegir: () => ML.barajar(P.map((p, i) => i)).slice(0, N) },
    sistematico: { nombre: 'Sistemático', como: 'inicio al azar y uno de cada 10', elegir: () => { const s = Math.floor(Math.random() * 10); return rango(0, 9, 1).map(i => s + 10 * i); } },
    estratificado: { nombre: 'Estratificado', como: '2 al azar en cada facultad', elegir: () => [].concat(...FACULTADES.map((f, fi) => ML.barajar(rango(0, 19, 1)).slice(0, 2).map(k => fi * 20 + k))) },
    conglomerados: { nombre: 'Por conglomerados', como: 'una facultad al azar y 10 de sus estudiantes', elegir: () => { const fi = Math.floor(Math.random() * 5); return ML.barajar(rango(0, 19, 1)).slice(0, N).map(k => fi * 20 + k); } },
    conveniencia: { nombre: 'Por conveniencia', como: '10 entre los 15 más accesibles', elegir: () => ML.barajar(accesibles).slice(0, N) }
  };
  const promedio = idx => media(idx.map(i => P[i].edad));
  // Resultados de 1 000 repeticiones por método (se calculan una vez).
  const REP = {};
  Object.keys(METODOS).forEach(k => { REP[k] = []; for (let r = 0; r < 1000; r++) REP[k].push(promedio(METODOS[k].elegir())); });
  cuerpo.innerHTML = Object.keys(METODOS).map(k => {
    const mm = media(REP[k]), s = de(REP[k]);
    return '<tr><td>' + METODOS[k].nombre + '</td><td>' + METODOS[k].como + '</td><td class="num">' + num(mm, 2) + '</td><td class="num">' + (mm - MU >= 0 ? '+' : '') + num(mm - MU, 2) + '</td><td class="num">' + num(s, 2) + '</td></tr>';
  }).join('');
  let metodo = 'simple', muestra = METODOS.simple.elegir(), verMil = false;

  function dibujarRejilla() {
    const g = new Grafico(rejilla, { prop: 0.78, min: 280, max: 400, x: [0, 1], y: [0, 1], m: { i: 0, d: 0, s: 0, b: 0 } });
    const c = g.ctx, izq = Math.min(130, g.w * 0.28), celdaX = (g.w - izq - 8) / 10, celdaY = (g.h - 10) / 10;
    const r = Math.min(celdaX, celdaY) * 0.42, elegidos = new Set(muestra);
    FACULTADES.forEach((f, fi) => g.textoPx(f[0], izq - 8, 5 + celdaY * (fi * 2 + 1), { al: 'right', tam: 11, peso: 600, color: css('--tinta-suave') }));
    P.forEach((p, i) => {
      const fila = Math.floor(i / 10), col = i % 10, x = izq + celdaX * (col + 0.5), y = 5 + celdaY * (fila + 0.5);
      c.beginPath(); c.arc(x, y, r, 0, 2 * Math.PI);
      const sel = elegidos.has(i);
      c.fillStyle = sel ? css('--g-serie1') : (fila % 4 < 2 ? css('--acento-suave') : css('--papel'));
      c.fill(); c.lineWidth = 1; c.strokeStyle = css('--linea'); c.stroke();
      if (accesibles.indexOf(i) >= 0 && metodo === 'conveniencia') { c.lineWidth = 2; c.strokeStyle = css('--g-serie2'); c.stroke(); }
      g.textoPx(String(p.edad), x, y + 0.5, { al: 'center', tam: Math.max(9, r * 0.85), peso: sel ? 700 : 500, color: sel ? '#fff' : css('--tinta') });
    });
  }
  function dibujarHist() {
    const datos = REP[metodo], a = 18, b = 26, bins = 32;
    const cnt = histograma(datos, a, b, bins), mx = Math.max.apply(null, cnt);
    const g = new Grafico(lienzoH, { prop: 0.78, min: 280, max: 400, x: [a, b], y: [0, mx * 1.15], m: { i: 40, d: 12, s: 22, b: 46 } });
    g.ejes({ xt: rango(18, 26, 1), yt: marcas(0, mx * 1.1, 4), ex: 'promedio de edad de la muestra', ey: '1 000 muestras: ' + METODOS[metodo].nombre.toLowerCase() });
    barras(g, cnt, a, b, css('--g-serie1'), 0.85);
    g.linea([[MU, 0], [MU, mx * 1.15]], { color: css('--g-serie4'), ancho: 2, guion: [6, 4] });
    g.textoPx('real: ' + num(MU, 2), g.X(MU) + 5, g.y1 + 6, { color: css('--g-serie4'), peso: 700, fondo: true });
    const mm = media(datos);
    g.linea([[mm, 0], [mm, mx * 1.15]], { color: css('--g-serie2'), ancho: 2 });
  }
  function leer() {
    const xb = promedio(muestra), R = REP[metodo], mm = media(R);
    lectura.innerHTML = '<b>' + METODOS[metodo].nombre + '</b> (' + METODOS[metodo].como + '). Edades de la muestra: ' + muestra.map(i => P[i].edad).join(', ') + '.<br>' +
      'Promedio de la muestra: ' + m('\\bar x = ' + teX(xb, 2)) + ' · edad promedio real de los 100: ' + m('\\mu = ' + teX(MU, 2)) + ' · error de esta muestra: ' + m(teX(xb - MU, 2)) + ' años.' +
      (verMil ? '<br><b>En 1 000 muestras:</b> promedio de los promedios ' + m(teX(mm, 2)) + ' (sesgo ' + m(teX(mm - MU, 2)) + '), dispersión ' + m(teX(de(R), 2)) + '. Línea ámbar: promedio de los promedios; línea roja: valor real.' : '');
  }
  function todo() { dibujarRejilla(); dibujarHist(); leer(); }
  botonesGrupo('#demo-muestreo [data-metodo]', b => { metodo = b.dataset.metodo; muestra = METODOS[metodo].elegir(); verMil = false; todo(); });
  document.getElementById('muestreo-una').addEventListener('click', () => { muestra = METODOS[metodo].elegir(); leer(); dibujarRejilla(); });
  document.getElementById('muestreo-mil').addEventListener('click', () => { REP[metodo] = []; for (let r = 0; r < 1000; r++) REP[metodo].push(promedio(METODOS[metodo].elegir())); verMil = true; dibujarHist(); leer(); });
  alRedibujar(todo);
}


/* ============================================================
   PROCESO 3: Laboratorio 2 · La media, la mediana y el código 999999
   Insumo:    histogramas de la ENAHO 2023 (ingreso, logaritmo y logaritmo por sexo)
   Resultado: media y mediana dibujadas; la media salta al incluir el código
   ============================================================ */
function labEnaho() {
  const lienzo = document.getElementById('enaho-lienzo'); if (!lienzo || !D.hist_ingreso) return;
  const casilla = document.getElementById('enaho-codigo'), lectura = document.getElementById('enaho-lectura');
  const leyenda = document.getElementById('enaho-leyenda');
  let vista = 'soles';
  const R = D.resumen, CC = D.con_codigo, PS = D.por_sexo;

  function dibujar() {
    casilla.disabled = vista !== 'soles';
    const amb = css('--g-serie2'), ver = css('--g-serie3'), ind = css('--g-serie1');
    if (vista === 'soles') {
      const conCodigo = casilla.checked, mediaV = conCodigo ? CC.media : R.media, mx = Math.max.apply(null, D.hist_ingreso);
      const g = new Grafico(lienzo, { prop: 0.42, min: 260, max: 380, x: [0, 10000], y: [0, mx * 1.12], m: { i: 50, d: 34, s: 22, b: 46 } });
      g.ejes({ xt: rango(0, 10000, 2000), yt: marcas(0, mx * 1.08, 4), fx: v => 'S/ ' + num(v, 0), ex: 'ingreso mensual', ey: 'personas' });
      barras(g, D.hist_ingreso, 0, 10000, ind, 0.8);
      g.linea([[1200, 0], [1200, mx * 1.12]], { color: ver, ancho: 2.5 });
      g.textoPx('mediana S/ 1 200', g.X(1200) + 6, g.y1 + 20, { color: ver, peso: 700, fondo: true });
      if (mediaV <= 10000) {
        g.linea([[mediaV, 0], [mediaV, mx * 1.12]], { color: amb, ancho: 2.5, guion: [6, 4] });
        g.textoPx('media S/ ' + num(mediaV, 0), g.X(mediaV) + 6, g.y1 + 40, { color: amb, peso: 700, fondo: true });
      } else {
        g.flechaPx(g.x1 - 120, g.y1 + 40, g.x1 - 4, g.y1 + 40, { color: amb });
        g.textoPx('media S/ ' + num(mediaV, 0) + ' →', g.x1 - 126, g.y1 + 40, { al: 'right', color: amb, peso: 700, fondo: true });
      }
      leyenda.innerHTML = '<span style="--c:var(--g-serie1)">Personas por tramo de S/ 200</span><span style="--c:var(--g-serie3)">Mediana</span><span style="--c:var(--g-serie2)">Media</span>';
      lectura.innerHTML = (conCodigo ? 'Con los ' + num(CC.n_codigo, 0) + ' códigos: ' + m('n = ' + teX(CC.n, 0)) : 'Sin el código: ' + m('n = ' + teX(R.n, 0))) +
        ' · media ' + m('\\bar x = ' + teX(mediaV, 0)) + ' soles · mediana ' + m(teX(conCodigo ? CC.mediana : R.mediana, 0)) + ' soles.<br>' +
        (conCodigo ? 'Las ' + num(CC.n_codigo, 0) + ' personas con el código no se ven en el gráfico: figuran con S/ 999 999 o más (hasta S/ ' + num(CC.max, 0) + '). Son el 1,5 % de la muestra y multiplican la media por 17.'
                   : 'Hay ' + num(D.fuera_ingreso, 0) + ' personas con más de S/ 10 000 que no caben en el gráfico. La media queda a la derecha de la mediana: la cola larga la jala.');
    } else if (vista === 'log') {
      const a = D.hist_log_rango[0], b = D.hist_log_rango[1], mx = Math.max.apply(null, D.hist_log);
      const g = new Grafico(lienzo, { prop: 0.42, min: 260, max: 380, x: [a, b], y: [0, mx * 1.12], m: { i: 50, d: 20, s: 22, b: 46 } });
      g.ejes({ xt: rango(2, 11, 1), yt: marcas(0, mx * 1.08, 4), fx: v => num(v, 0), ex: 'logaritmo del ingreso mensual', ey: 'personas' });
      barras(g, D.hist_log, a, b, ind, 0.8);
      const lm = Math.log(1200);
      g.linea([[lm, 0], [lm, mx * 1.12]], { color: ver, ancho: 2.5 });
      g.linea([[R.media_log, 0], [R.media_log, mx * 1.12]], { color: amb, ancho: 2.5, guion: [6, 4] });
      g.textoPx('media ' + num(R.media_log, 2), g.X(R.media_log) - 6, g.y1 + 20, { al: 'right', color: amb, peso: 700, fondo: true });
      g.textoPx('mediana ' + num(lm, 2), g.X(lm) + 6, g.y1 + 40, { color: ver, peso: 700, fondo: true });
      leyenda.innerHTML = '<span style="--c:var(--g-serie1)">Personas</span><span style="--c:var(--g-serie3)">Mediana</span><span style="--c:var(--g-serie2)">Media</span>';
      lectura.innerHTML = 'En logaritmos, la media (' + m(teX(R.media_log, 3)) + ') y la mediana (' + m('\\ln(1\\,200) = ' + teX(lm, 3)) + ') casi coinciden, y la forma se parece a una campana. Equivalencias: ' +
        m('\\ln(1\\,000) \\approx 6{,}91') + ', ' + m('\\ln(3\\,000) \\approx 8{,}01') + '. Un punto más de logaritmo multiplica el ingreso por ' + m('e \\approx 2{,}72') + '.';
    } else {
      const a = D.hist_log_sexo_rango[0], b = D.hist_log_sexo_rango[1], bins = D.hist_log_sexo.Hombre.length, w = (b - a) / bins;
      const tot = s => D.hist_log_sexo[s].reduce((x, y) => x + y, 0);
      const dens = s => D.hist_log_sexo[s].map(v => v / (tot(s) * w));
      const dH = dens('Hombre'), dM = dens('Mujer'), mx = Math.max.apply(null, dH.concat(dM));
      const g = new Grafico(lienzo, { prop: 0.42, min: 260, max: 380, x: [a, b], y: [0, mx * 1.15], m: { i: 50, d: 20, s: 22, b: 46 } });
      g.ejes({ xt: rango(2, 11, 1), yt: marcas(0, mx * 1.1, 4), fx: v => num(v, 0), fy: v => num(v, 1), ex: 'logaritmo del ingreso mensual', ey: 'densidad (proporción por unidad)' });
      barras(g, dH, a, b, ind, 0.45); barras(g, dM, a, b, amb, 0.45);
      [['Hombre', ind], ['Mujer', amb]].forEach(q => g.linea([[PS[q[0]].media_log, 0], [PS[q[0]].media_log, mx * 1.15]], { color: q[1], ancho: 2.5, guion: [6, 4] }));
      leyenda.innerHTML = '<span style="--c:var(--g-serie1)">Hombres (línea: su media)</span><span style="--c:var(--g-serie2)">Mujeres (línea: su media)</span>';
      lectura.innerHTML = 'Hombres: ' + m('n = ' + teX(PS.Hombre.n, 0)) + ', media del logaritmo ' + m(teX(PS.Hombre.media_log, 3)) + ', mediana S/ ' + num(PS.Hombre.mediana_ing, 0) + '. ' +
        'Mujeres: ' + m('n = ' + teX(PS.Mujer.n, 0)) + ', media ' + m(teX(PS.Mujer.media_log, 3)) + ', mediana S/ ' + num(PS.Mujer.mediana_ing, 0) + '.<br>' +
        'La curva de las mujeres está corrida a la izquierda: diferencia de medias ' + m(teX(D.dif_log, 3)) + '. La parte 5 calcula su incertidumbre.';
    }
  }
  botonesGrupo('#demo-enaho [data-vista]', b => { vista = b.dataset.vista; dibujar(); });
  casilla.addEventListener('change', dibujar);
  alRedibujar(dibujar);
}


/* ============================================================
   PROCESO 4: Laboratorio 3 · La normal frente a los ingresos reales
   Insumo:    histograma del logaritmo del ingreso y 6 000 ingresos individuales
   Resultado: área bajo la normal frente a la proporción real, para el monto elegido
   ============================================================ */
function labNormal() {
  const lienzo = document.getElementById('normal-lienzo'); if (!lienzo || !D.hist_log) return;
  const cx = document.getElementById('normal-x'), ox = document.getElementById('normal-x-out'), lectura = document.getElementById('normal-lectura');
  const MU = D.resumen.media_log, SD = D.resumen.sd_log, POB = D.poblacion_ingreso;
  const a0 = D.hist_log_rango[0], b0 = D.hist_log_rango[1], w = (b0 - a0) / D.hist_log.length, n = D.hist_log.reduce((x, y) => x + y, 0);
  const dens = D.hist_log.map(v => v / (n * w));

  function dibujar() {
    const x = Number(cx.value), lx = Math.log(x);
    ox.textContent = num(x, 0);
    const mx = Math.max(Math.max.apply(null, dens), densNormal(MU, MU, SD));
    const g = new Grafico(lienzo, { prop: 0.42, min: 260, max: 380, x: [3.5, 10.5], y: [0, mx * 1.15], m: { i: 46, d: 20, s: 22, b: 46 } });
    const montos = [50, 200, 500, 1000, 3000, 10000, 30000];
    g.ejes({ xt: montos.map(v => Math.log(v)), yt: marcas(0, mx * 1.1, 4), fx: v => 'S/ ' + num(Math.exp(v), 0), fy: v => num(v, 2), ex: 'ingreso mensual (escala logarítmica)', ey: 'densidad' });
    // Barras: más oscuras a la izquierda del monto elegido.
    dens.forEach((d, k) => { const xa = a0 + k * w, xb = xa + w; if (d) g.rect(xa + w * 0.06, 0, xb - w * 0.06, d, css('--g-serie1'), xb <= lx ? 0.85 : 0.3); });
    // Área bajo la normal a la izquierda del monto.
    const c = g.ctx; c.save(); c.globalAlpha = 0.22; c.fillStyle = css('--g-serie2'); c.beginPath(); c.moveTo(g.X(3.5), g.Y(0));
    for (let t = 3.5; t <= lx; t += 0.02) c.lineTo(g.X(t), g.Y(densNormal(t, MU, SD)));
    c.lineTo(g.X(lx), g.Y(0)); c.closePath(); c.fill(); c.restore();
    g.funcion(t => densNormal(t, MU, SD), { color: css('--g-serie2'), ancho: 2.5 });
    g.linea([[lx, 0], [lx, mx * 1.15]], { color: css('--g-serie4'), ancho: 2 });
    const z = (lx - MU) / SD, pN = ML.Phi(z);
    const real = POB.filter(v => v <= x).length / POB.length, exactos = POB.filter(v => v === x).length / POB.length;
    lectura.innerHTML = 'Monto: S/ ' + num(x, 0) + ', es decir, ' + m('\\ln(' + teX(x, 0) + ') = ' + teX(lx, 3)) + '.<br>' +
      'Estandarizado: ' + m('z = \\dfrac{' + teX(lx, 3) + ' - ' + teX(MU, 3) + '}{' + teX(SD, 3) + '} = ' + teX(z, 2)) + '. Según la normal, ' + m('\\Phi(' + teX(z, 2) + ') = ' + teX(pN * 100, 1) + '\\%') + ' gana S/ ' + num(x, 0) + ' o menos.<br>' +
      'En los datos (6 000 trabajadores de la ENAHO): <b>' + pct(real, 1) + '</b>. Diferencia: ' + num(Math.abs(pN - real) * 100, 1) + ' puntos.' +
      (exactos >= 0.01 ? ' Ojo: el ' + pct(exactos, 1) + ' reporta exactamente S/ ' + num(x, 0) + '; esos picos no existen en una campana.' : '');
  }
  cx.addEventListener('input', dibujar);
  alRedibujar(dibujar);
}


/* ============================================================
   PROCESO 5: Laboratorio 4 · La distribución muestral
   Insumo:    6 000 ingresos tratados como población; tamaño n
   Resultado: histograma de 1 000 promedios, su dispersión y la fórmula σ/√n
   ============================================================ */
function labDistMuestral() {
  const lienzoP = document.getElementById('dm-poblacion'); if (!lienzoP || !D.poblacion_ingreso) return;
  const lienzoM = document.getElementById('dm-medias'), lectura = document.getElementById('dm-lectura');
  const POB = D.poblacion_ingreso, MU = media(POB), SIG = Math.sqrt(POB.reduce((s, v) => s + (v - MU) * (v - MU), 0) / POB.length);
  let n = 25, medias = [];
  function sortear() { medias = []; for (let r = 0; r < 1000; r++) medias.push(media(muestraDe(POB, n))); dibujar(); }
  function dibujar() {
    const cntP = histograma(POB, 0, 8000, 40), mxP = Math.max.apply(null, cntP);
    const g = new Grafico(lienzoP, { prop: 0.72, min: 240, max: 330, x: [0, 8000], y: [0, mxP * 1.12], m: { i: 46, d: 12, s: 22, b: 46 } });
    g.ejes({ xt: [0, 2000, 4000, 6000, 8000], yt: marcas(0, mxP * 1.08, 4), fx: v => num(v / 1000, 0) + ' mil', ex: 'ingreso mensual (soles)', ey: 'población: 6 000 personas' });
    barras(g, cntP, 0, 8000, css('--g-eje'), 0.75);
    g.linea([[MU, 0], [MU, mxP * 1.12]], { color: css('--g-serie4'), ancho: 2, guion: [6, 4] });
    const ee = SIG / Math.sqrt(n), a = Math.max(0, MU - 4.2 * ee), b = MU + 4.2 * ee, bins = 36, w = (b - a) / bins;
    const cnt = histograma(medias, a, b, bins), dens = cnt.map(c => c / (1000 * w));
    const mx = Math.max(Math.max.apply(null, dens), densNormal(MU, MU, ee));
    const h = new Grafico(lienzoM, { prop: 0.72, min: 240, max: 330, x: [a, b], y: [0, mx * 1.15], m: { i: 46, d: 12, s: 22, b: 46 } });
    h.ejes({ xt: marcas(a, b, 4), yt: [], fx: v => num(v, 0), ex: 'promedio de cada muestra (soles)', ey: '1 000 promedios con n = ' + n });
    barras(h, dens, a, b, css('--g-serie1'), 0.85);
    h.funcion(x => densNormal(x, MU, ee), { color: css('--g-serie2'), ancho: 2.3 });
    h.linea([[MU, 0], [MU, mx * 1.15]], { color: css('--g-serie4'), ancho: 2, guion: [6, 4] });
    const sd = de(medias);
    lectura.innerHTML = m('n = ' + n) + ' · promedio de los 1 000 promedios: ' + m(teX(media(medias), 0)) + ' (media verdadera ' + m('\\mu = ' + teX(MU, 0)) + ').<br>' +
      'Dispersión de los promedios (error estándar observado): ' + m(teX(sd, 0)) + ' soles. La fórmula predice ' +
      m('\\dfrac{\\sigma}{\\sqrt{n}} = \\dfrac{' + teX(SIG, 0) + '}{\\sqrt{' + n + '}} = ' + teX(ee, 0)) + ' soles.' +
      (n <= 5 ? '<br>Con n tan pequeño, el histograma todavía se inclina a la izquierda con cola a la derecha, como la población: la normal aún no es buena aproximación.' : '');
  }
  botonesGrupo('#demo-dmuestral [data-n]', b => { n = Number(b.dataset.n); sortear(); });
  document.getElementById('dm-sortear').addEventListener('click', sortear);
  sortear();
  alRedibujar(dibujar);
}


/* ============================================================
   PROCESO 6: Laboratorio 5 · Cien intervalos al 95 %
   Insumo:    6 000 ingresos tratados como población; tamaño n
   Resultado: 100 intervalos dibujados y la cuenta de los que atrapan la media verdadera
   ============================================================ */
function labIC() {
  const lienzo = document.getElementById('ic-lienzo'); if (!lienzo || !D.poblacion_ingreso) return;
  const lectura = document.getElementById('ic-lectura');
  const POB = D.poblacion_ingreso, MU = media(POB), SIG = de(POB);
  let n = 100, intervalos = [], acum = { si: 0, total: 0 };
  function sortear() {
    intervalos = [];
    for (let r = 0; r < 100; r++) { const s = muestraDe(POB, n), xb = media(s), ee = de(s) / Math.sqrt(n); intervalos.push([xb - 1.96 * ee, xb, xb + 1.96 * ee]); }
    const si = intervalos.filter(iv => iv[0] <= MU && MU <= iv[2]).length;
    acum.si += si; acum.total += 100;
    dibujar();
  }
  function dibujar() {
    const ee = SIG / Math.sqrt(n), a = MU - 4.5 * ee, b = MU + 4.5 * ee;
    const g = new Grafico(lienzo, { prop: 0.62, min: 340, max: 520, x: [a, b], y: [0, 101], m: { i: 22, d: 14, s: 10, b: 46 } });
    g.ejes({ xt: marcas(a, b, 5), yt: [], fx: v => num(v, 0), ex: 'ingreso mensual promedio (soles)', rejillaY: false });
    g.recortar();
    intervalos.forEach((iv, k) => {
      const ok = iv[0] <= MU && MU <= iv[2], col = ok ? css('--g-serie3') : css('--g-serie4'), y = k + 1;
      g.linea([[iv[0], y], [iv[2], y]], { color: col, ancho: ok ? 1.6 : 2.4 });
      g.punto(iv[1], y, { r: 1.8, color: col });
    });
    g.soltar();
    g.linea([[MU, 0], [MU, 101]], { color: css('--g-serie4'), ancho: 2 });
    g.textoPx('μ = ' + num(MU, 0), g.X(MU) + 5, g.y1 + 6, { color: css('--g-serie4'), peso: 700, fondo: true });
    const si = intervalos.filter(iv => iv[0] <= MU && MU <= iv[2]).length;
    lectura.innerHTML = 'Con ' + m('n = ' + n) + ', <b>' + si + ' de 100</b> intervalos atrapan a ' + m('\\mu') + '. Acumulado con este tamaño: ' + num(acum.si, 0) + ' de ' + num(acum.total, 0) +
      ' (' + pct(acum.si / acum.total, 1) + ').<br>Cada intervalo: ' + m('\\bar x \\pm 1{,}96\\,\\dfrac{s}{\\sqrt{' + n + '}}') + '.' +
      (n === 25 ? ' Con n = 25 y una población tan asimétrica, la cobertura suele quedar por debajo del 95 %.' : '');
  }
  botonesGrupo('#demo-ic [data-n]', b => { n = Number(b.dataset.n); acum = { si: 0, total: 0 }; sortear(); });
  document.getElementById('ic-otros').addEventListener('click', sortear);
  sortear();
  alRedibujar(dibujar);
}


/* ============================================================
   PROCESO 7: Laboratorio 6 · Prueba de una diferencia, error tipo I y potencia
   Insumo:    logaritmo del ingreso y sexo de 6 000 trabajadores; mundo real o mundo con H0 verdadera
   Resultado: el estadístico T de una muestra o de 1 000, y la proporción de rechazos
   ============================================================ */
function labPrueba() {
  const lienzo = document.getElementById('prueba-lienzo'); if (!lienzo || !D.poblacion_ingreso) return;
  const lectura = document.getElementById('prueba-lectura');
  const L = D.poblacion_ingreso.map(v => Math.log(v)), S = D.poblacion_sexo;
  const H = L.filter((v, i) => S[i] === 0), M = L.filter((v, i) => S[i] === 1);
  let mundo = 'real', n = 30, ultimo = null, tes = [];
  // unaPrueba() → {dif, ee, T, p}: n hombres y n mujeres (o 2n de la mezcla si H0 es verdad)
  function unaPrueba() {
    let gH, gM;
    if (mundo === 'real') { gH = muestraDe(H, n); gM = muestraDe(M, n); }
    else { const todo = muestraDe(L, 2 * n); gH = todo.slice(0, n); gM = todo.slice(n); }
    const dif = media(gH) - media(gM), ee = Math.sqrt(Math.pow(de(gH), 2) / n + Math.pow(de(gM), 2) / n), T = dif / ee;
    return { dif: dif, ee: ee, T: T, p: 2 * (1 - ML.Phi(Math.abs(T))) };
  }
  function dibujar() {
    const a = -5, b = 9, bins = 56, w = (b - a) / bins;
    const cnt = histograma(tes, a, b, bins), dens = tes.length ? cnt.map(c => c / (tes.length * w)) : cnt;
    const mx = Math.max(0.45, Math.max.apply(null, dens));
    const g = new Grafico(lienzo, { prop: 0.42, min: 260, max: 360, x: [a, b], y: [0, mx * 1.12], m: { i: 30, d: 14, s: 22, b: 46 } });
    g.rect(a, 0, -1.96, mx * 1.12, css('--g-serie4'), 0.08); g.rect(1.96, 0, b, mx * 1.12, css('--g-serie4'), 0.08);
    g.ejes({ xt: [-4, -1.96, 0, 1.96, 4, 6, 8], yt: [], fx: v => num(v, Math.abs(v) === 1.96 ? 2 : 0), ex: 'estadístico T', rejillaY: false });
    if (tes.length) barras(g, dens, a, b, css('--g-serie1'), 0.8);
    g.funcion(x => densNormal(x, 0, 1), { color: css('--g-serie2'), ancho: 2.2 });
    g.textoPx('rechaza H₀', g.X(5.5), g.y1 + 6, { al: 'center', color: css('--g-serie4'), peso: 700 });
    g.textoPx('no rechaza', g.X(0), g.y1 + 6, { al: 'center', color: css('--tinta-suave'), peso: 700 });
    if (ultimo) { g.linea([[Math.max(a, Math.min(b, ultimo.T)), 0], [Math.max(a, Math.min(b, ultimo.T)), mx * 1.12]], { color: css('--g-serie3'), ancho: 3 }); }
    let txt = '';
    if (ultimo) {
      txt += 'Última muestra (' + n + ' por grupo): diferencia ' + m('\\bar y_H - \\bar y_M = ' + teX(ultimo.dif, 3)) + ', ' + m('\\text{EE} = ' + teX(ultimo.ee, 3)) + ', ' +
        m('T = ' + teX(ultimo.T, 2)) + ', ' + m('\\text{valor-}p = ' + (ultimo.p < 0.001 ? '<0{,}001' : teX(ultimo.p, 3))) + ' → <b>' + (Math.abs(ultimo.T) > 1.96 ? 'rechaza' : 'no rechaza') + '</b> ' + m('H_0') + '.';
    }
    if (tes.length > 1) {
      const r = tes.filter(t => Math.abs(t) > 1.96).length / tes.length;
      txt += (txt ? '<br>' : '') + 'En ' + num(tes.length, 0).replace(/^(\d)(\d{3})$/, '$1 $2') + ' muestras rechaza ' + m('H_0') + ' el <b>' + pct(r, 1) + '</b>: ' +
        (mundo === 'real' ? 'es la <b>potencia</b> estimada. La diferencia existe; el resto de veces es un error tipo II.' : 'es el <b>error tipo I</b> estimado. Debería rondar ' + m('\\alpha = 5\\%') + '.');
    }
    txt += (txt ? '<br>' : '') + 'Curva ámbar: la distribución de ' + m('T') + ' si ' + m('H_0') + ' fuera verdad. Zonas rojas: ' + m('|T| > 1{,}96') + '.';
    lectura.innerHTML = txt;
  }
  botonesGrupo('#demo-prueba [data-mundo]', b => { mundo = b.dataset.mundo; tes = []; ultimo = null; dibujar(); });
  botonesGrupo('#demo-prueba [data-n]', b => { n = Number(b.dataset.n); tes = []; ultimo = null; dibujar(); });
  document.getElementById('prueba-una').addEventListener('click', () => { ultimo = unaPrueba(); tes.push(ultimo.T); dibujar(); });
  document.getElementById('prueba-mil').addEventListener('click', () => { tes = []; for (let r = 0; r < 1000; r++) tes.push(unaPrueba().T); ultimo = null; dibujar(); });
  alRedibujar(dibujar);
}

ML.arrancar([labDiD, labMuestreo, labEnaho, labNormal, labDistMuestral, labIC, labPrueba]);
})();
