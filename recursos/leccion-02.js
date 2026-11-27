/* ============================================================
   leccion-02.js: laboratorios de la lección 2 (práctica dirigida 1).
   Usa las herramientas de comun.js (objeto ML) y los datos de
   datos-leccion-02.js (objeto DATOS_L2), calculados en Python con
   las bases de la práctica.
   ============================================================ */
(function () {
'use strict';
const { css, num, pct, rango, marcas, m, teX, Grafico, pintarMapa, superficie3D, girable, alRedibujar, arrastrar, marcarResuelto } = ML;
const D = window.DATOS_L2 || {};

/* ============================================================
   PROCESO 1: Laboratorio 1 · Descenso de gradiente del cuaderno 1
   Insumo:    f(x, y) = x² + 2y² − 2xy + 2x − 8y + 10, inicio (−5; 10), α elegido
   Resultado: terreno 3D, mapa de curvas de nivel, tabla de iteraciones y lectura
   ============================================================ */
function labGD() {
  const lienzo3d = document.getElementById('gd-3d'); if (!lienzo3d) return;
  const mapa = document.getElementById('gd-mapa'), cuerpo = document.querySelector('#gd-tabla tbody');
  const lectura = document.getElementById('gd-lectura');
  const botones = Array.from(document.querySelectorAll('#demo-gd [data-alfa]'));
  const f = (x, y) => x * x + 2 * y * y - 2 * x * y + 2 * x - 8 * y + 10;
  const grad = (x, y) => [2 * x - 2 * y + 2, 4 * y - 2 * x - 8];
  const INICIO = [-5, 10], MIN = [2, 3], X = [-6, 8], Y = [-1, 11];
  const NIVELES = [1, 3, 6, 10, 20, 35, 55, 80, 110, 150, 200, 260, 330];
  const estado = { vista: [-0.55, 0.75] };
  let alfa = 0.1, camino = [INICIO.slice()], animando = null;

  // trayectoria: α → lista de 51 posiciones (o menos si el camino se escapa)
  function trayectoria(a) {
    const t = [INICIO.slice()];
    for (let k = 0; k < 50; k++) {
      const p = t[t.length - 1], g = grad(p[0], p[1]), n = [p[0] - a * g[0], p[1] - a * g[1]];
      t.push(n);
    }
    return t;
  }
  function dibujar() {
    superficie3D(lienzo3d, { f: f, x: X, y: Y, zMin: 0, zMax: 330, vista: estado.vista, camino: camino, estrella: MIN,
      rotuloX: 'x →', rotuloY: 'y →', titulo: 'Altura = f(x, y) · arrastra para girar', nx: 40, ny: 34, altura: 7 });
    const g = new Grafico(mapa, { prop: 0.78, min: 260, max: 420, x: X, y: Y, m: { i: 36, d: 12, s: 12, b: 46 } });
    pintarMapa(g, f, NIVELES, 'gd');
    g.ejes({ xt: rango(-6, 8, 2), yt: rango(-1, 11, 2), ex: 'x', ey: 'y', rejillaX: false, rejillaY: false });
    g.textoPx('★', g.X(MIN[0]), g.Y(MIN[1]), { al: 'center', color: css('--g-serie4'), tam: 18, peso: 700 });
    g.recortar(); g.linea(camino, { color: css('--g-serie1'), ancho: 2 });
    camino.forEach((p, i) => g.punto(p[0], p[1], { r: i === 0 || i === camino.length - 1 ? 5 : 2.5, color: css('--g-serie1') }));
    g.soltar();
    const k = camino.length - 1;
    const filas = [0, 10, 20, 30, 40, 50].filter(i => i <= k);
    cuerpo.innerHTML = filas.map(i => {
      const p = camino[i], v = f(p[0], p[1]);
      const grande = Math.abs(p[0]) > 999 || Math.abs(v) > 1e6;
      return '<tr' + (i === k ? ' class="destacada"' : '') + '><td>' + i + '</td><td class="num">' + num(p[0], grande ? 0 : 4) + '</td><td class="num">' + num(p[1], grande ? 0 : 4) + '</td><td class="num">' + num(v, v > 999 ? 0 : 4) + '</td></tr>';
    }).join('');
    const p = camino[k], v = f(p[0], p[1]), dist = Math.hypot(p[0] - MIN[0], p[1] - MIN[1]);
    let texto = 'Con ' + m('\\alpha = ' + teX(alfa, alfa < 0.1 ? 2 : alfa === 0.38 ? 2 : 1)) + ', después de ' + k + ' pasos: ' +
      m('(x;\\ y) = (' + teX(p[0], Math.abs(p[0]) > 999 ? 0 : 4) + ';\\ ' + teX(p[1], Math.abs(p[1]) > 999 ? 0 : 4) + ')') + ' y ' + m('f = ' + teX(v, v > 999 ? 0 : 4)) + '.';
    if (k === 50) {
      if (v > 1000) texto += '<br><b>El camino se escapó:</b> cada salto cruza el valle y cae más alto. α supera el límite de este terreno, ' + m('2/\\lambda_{\\max} \\approx 0{,}382') + '.';
      else if (dist < 0.001) texto += '<br>Llegó al fondo ' + m('(2;\\ 3)') + ': distancia ' + m('< 0{,}001') + '.';
      else texto += '<br>Distancia al fondo: ' + m(teX(dist, 3)) + '. ' + (alfa < 0.05 ? 'Avanza tan lento que en 50 pasos no llega: haría falta muchas más iteraciones.' : alfa > 0.35 ? 'Rebota de un lado al otro del valle: está cerca del límite 0,38.' : 'Llega cerca, pero aún no al fondo exacto.');
    }
    lectura.innerHTML = texto;
  }
  function correr() {
    clearInterval(animando);
    const completo = trayectoria(alfa); camino = [completo[0]];
    let k = 0;
    animando = setInterval(() => { k++; camino = completo.slice(0, k + 1); dibujar(); if (k >= 50) clearInterval(animando); }, 45);
  }
  botones.forEach(b => b.addEventListener('click', () => {
    alfa = Number(b.dataset.alfa);
    botones.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    clearInterval(animando); camino = [INICIO.slice()]; dibujar();
  }));
  document.getElementById('gd-correr').addEventListener('click', correr);
  girable(lienzo3d, estado, () => superficie3D(lienzo3d, { f: f, x: X, y: Y, zMin: 0, zMax: 330, vista: estado.vista, camino: camino, estrella: MIN,
    rotuloX: 'x →', rotuloY: 'y →', titulo: 'Altura = f(x, y) · arrastra para girar', nx: 40, ny: 34, altura: 7 }));
  alRedibujar(dibujar);
}

/* ============================================================
   PROCESO 2: Laboratorio 2 · Detective de datos
   Insumo:    seis filas reales de universidad_desercion.csv
   Resultado: tabla con celdas y columnas que se pueden revisar; ocho hallazgos con su decisión
   ============================================================ */
function labDetective() {
  const tabla = document.getElementById('detective-tabla'); if (!tabla) return;
  const lectura = document.getElementById('detective-lectura'), lista = document.getElementById('detective-hallazgos');
  const COLS = ['edad', 'ingresos_familiares', 'promedio_acumulado', 'cuota_mensual', 'beca_descuento', 'nivel_ingles', 'region', 'trabaja', 'colegio_procedencia', 'desercion'];
  const FILAS = [
    { edad: 2, ingresos_familiares: 947.01, promedio_acumulado: 4.83, cuota_mensual: 738.11, beca_descuento: 683.31, nivel_ingles: 'Intermedio', region: 'Centro', trabaja: 2, colegio_procedencia: 'Colegio_8111', desercion: 0 },
    { edad: 18, ingresos_familiares: 1401.95, promedio_acumulado: 4.43, cuota_mensual: 371.77, beca_descuento: 341.06, nivel_ingles: 'Basico', region: '999XX', trabaja: 1, colegio_procedencia: 'Colegio_6620', desercion: 1 },
    { edad: 25, ingresos_familiares: 8659.69, promedio_acumulado: 3.45, cuota_mensual: 641.83, beca_descuento: 597.63, nivel_ingles: 'Bilingue_Senior', region: 'Norte', trabaja: 2, colegio_procedencia: 'Colegio_7543', desercion: 0 },
    { edad: 25, ingresos_familiares: 612.68, promedio_acumulado: null, cuota_mensual: 708.11, beca_descuento: 654.00, nivel_ingles: 'Basico', region: 'Este', trabaja: 1, colegio_procedencia: 'Colegio_1143', desercion: 0 },
    { edad: 27, ingresos_familiares: 215839.31, promedio_acumulado: 3.46, cuota_mensual: 647.12, beca_descuento: 605.09, nivel_ingles: 'Basico', region: 'Centro', trabaja: 1, colegio_procedencia: 'Colegio_8405', desercion: 1 },
    { edad: 21, ingresos_familiares: 411.71, promedio_acumulado: 1.59, cuota_mensual: 675.88, beca_descuento: 633.92, nivel_ingles: 'Basico', region: 'Sur', trabaja: 1, colegio_procedencia: 'Colegio_9493', desercion: 0 }
  ];
  // Cada problema: dónde está (fila y columna, o columna entera) y qué se hace con él.
  const PROBLEMAS = {
    edad: { fila: 0, col: 'edad', titulo: 'Edad imposible: 2 años', texto: 'Un universitario de 2 años es un error de registro. Hay 1 920 menores de 16. <b>El cuaderno no lo corrigió</b>: conviene preguntar en clase si se eliminan o se revisan.' },
    region: { fila: 1, col: 'region', titulo: 'Código en lugar de región: «999XX»', texto: 'Es un faltante disfrazado. Decisión: conservar solo las cinco regiones válidas (salen 10 filas).' },
    ingles: { fila: 2, col: 'nivel_ingles', titulo: 'Variante rara: «Bilingue_Senior»', texto: 'Solo 15 casos (con «Bilingue_Senior_Master»). Decisión: fusionarlos con «Avanzado».' },
    nulo: { fila: 3, col: 'promedio_acumulado', titulo: 'Dato faltante en el promedio', texto: 'Faltan 400 promedios (2 %) y 100 ingresos (0,5 %). Decisión: eliminar esas filas: de 20 000 quedan 19 503.' },
    ingreso: { fila: 4, col: 'ingresos_familiares', titulo: 'Ingreso extremo: S/ 215 839', texto: 'La mediana es S/ 1 388. Decisión: no borrar, sino usar el logaritmo, que doma los extremos (laboratorio 3).' },
    trabaja: { col: 'trabaja', columna: true, titulo: 'Codificación confusa: «trabaja» vale 1 o 2', texto: 'Decisión: pasar a 0 = no y 1 = sí, que se lee directo.' },
    colegio: { col: 'colegio_procedencia', columna: true, titulo: 'Demasiadas categorías: 11 067 colegios', texto: 'Casi un colegio por estudiante. Decisión: eliminar la columna; con ella el modelo memorizaría.' },
    beca: { col: 'beca_descuento', columna: true, titulo: 'Columna casi copiada: beca ≈ 0,93 × cuota', texto: 'Su correlación con la cuota es 0,9997. Decisión: eliminar la beca; una copia no agrega información.' }
  };
  const hallados = new Set();
  const fmt = (c, v) => v === null ? '<span class="vacio">vacío</span>' : (typeof v === 'number' ? num(v, c === 'edad' || c === 'trabaja' || c === 'desercion' ? 0 : 2) : v);
  tabla.innerHTML = '<thead><tr>' + COLS.map(c => '<th data-col="' + c + '" title="Revisar la columna">' + c + '</th>').join('') + '</tr></thead><tbody>' +
    FILAS.map((f, i) => '<tr>' + COLS.map(c => '<td data-fila="' + i + '" data-col="' + c + '">' + fmt(c, f[c]) + '</td>').join('') + '</tr>').join('') + '</tbody>';

  // revisar: celda o encabezado → hallazgo nuevo, pista o «se ve bien»
  function revisar(el) {
    const col = el.dataset.col, fila = el.dataset.fila === undefined ? null : Number(el.dataset.fila);
    const clave = Object.keys(PROBLEMAS).find(k => {
      const p = PROBLEMAS[k];
      return p.columna ? p.col === col : (p.col === col && p.fila === fila);
    });
    if (!clave) {
      lectura.innerHTML = col === 'cuota_mensual' ? 'La cuota se ve bien. Compárala con la columna de al lado.' :
        el.tagName === 'TH' ? 'Revisa sus celdas: el problema de esta columna está en una fila concreta, o no tiene problema.' : 'Este dato se ve razonable. Sigue buscando.';
      return;
    }
    const p = PROBLEMAS[clave];
    if (!hallados.has(clave)) {
      hallados.add(clave);
      const li = document.createElement('li'); li.innerHTML = '<b>' + p.titulo + '.</b> ' + p.texto; lista.appendChild(li);
    }
    tabla.querySelectorAll('[data-col="' + p.col + '"]').forEach(c => {
      if (p.columna || Number(c.dataset.fila) === p.fila) c.classList.add('hallado');
    });
    lectura.innerHTML = '<b>' + p.titulo + '.</b> ' + p.texto + '<br>Encontrados: ' + hallados.size + ' de 8.';
    const estado = document.getElementById('detective-estado'), ok = document.getElementById('detective-ok'), caja = document.getElementById('reto-detective');
    if (estado) estado.textContent = 'Encontrados: ' + hallados.size + ' de 8.';
    if (hallados.size === 8 && caja && !caja.classList.contains('resuelto')) {
      if (estado) estado.classList.remove('visible');
      if (ok) ok.classList.add('visible');
      marcarResuelto(caja);
    }
  }
  tabla.addEventListener('click', ev => { const el = ev.target.closest('[data-col]'); if (el) revisar(el); });
  lectura.textContent = 'Haz clic en una celda o en el nombre de una columna.';
}

/* ============================================================
   PROCESO 3: Laboratorio 3 · Ingresos en soles y en logaritmo
   Insumo:    histogramas calculados con los 19 900 ingresos familiares
   Resultado: el mismo dato en dos escalas
   ============================================================ */
function labLog() {
  const lienzo = document.getElementById('log-lienzo'); if (!lienzo || !D.ingresos) return;
  const lectura = document.getElementById('log-lectura');
  const botones = Array.from(document.querySelectorAll('#demo-log [data-escala]'));
  let escala = 'crudo';
  function dibujar() {
    const h = D.ingresos[escala], n = h.conteos.length, ancho = (h.bordes[1] - h.bordes[0]) / n;
    const maxC = Math.max.apply(null, h.conteos);
    const g = new Grafico(lienzo, { prop: 0.42, min: 230, max: 330, x: h.bordes, y: [0, maxC * 1.1], m: { i: 52, d: 14, s: 16, b: 46 } });
    g.ejes({ xt: escala === 'crudo' ? rango(0, 20000, 5000) : rango(0, 13, 1), yt: marcas(0, maxC * 1.05, 4), fx: v => num(v, 0),
      ex: escala === 'crudo' ? 'ingreso familiar (S/)' : 'ln(1 + ingreso)', ey: 'estudiantes' });
    h.conteos.forEach((c, i) => g.rect(h.bordes[0] + i * ancho + ancho * 0.06, 0, h.bordes[0] + (i + 1) * ancho - ancho * 0.06, c, css('--g-serie1'), 0.85));
    if (escala === 'crudo') {
      lectura.innerHTML = 'En soles, casi todo se amontona a la izquierda: la mediana es S/ ' + num(D.ingresos.mediana, 0) + ', pero la media sube a S/ ' + num(D.ingresos.media, 0) +
        ' por unos pocos ingresos enormes. Además, ' + D.ingresos.fuera_crudo + ' estudiantes quedan fuera del gráfico (más de S/ 20 000), hasta S/ ' + num(D.ingresos.max, 0) + '.';
    } else {
      lectura.innerHTML = 'En logaritmo, la forma se parece a una campana y los extremos se acercan: S/ 215 839 queda en ' + m('\\ln(215\\,840) \\approx 12{,}3') + ', y S/ 1 388 en ' + m('\\approx 7{,}2') + '. Ningún dato se borró.';
    }
  }
  botones.forEach(b => b.addEventListener('click', () => {
    escala = b.dataset.escala; botones.forEach(x => x.setAttribute('aria-pressed', String(x === b))); dibujar();
  }));
  alRedibujar(dibujar);
}

/* ============================================================
   PROCESO 4: Laboratorio 4 · Tasa de deserción por grupos
   Insumo:    tablas por quintil impresas por el cuaderno 2 (celdas 39 y 41)
   Resultado: barras por grupo frente a la tasa general de 15,1 %
   ============================================================ */
function labSenal() {
  const lienzo = document.getElementById('senal-lienzo'); if (!lienzo) return;
  const zona = document.getElementById('senal-botones'), lectura = document.getElementById('senal-lectura');
  const VARS = {
    'Edad': { g: ['2–18', '18–21', '21–23', '23–26', '26–44'], t: [0.147213, 0.156942, 0.153229, 0.145874, 0.153166] },
    'Promedio': { g: ['0–1,0', '1,0–2,0', '2,0–3,0', '3,0–4,0', '4,0–5,0'], t: [0.161536, 0.143830, 0.148774, 0.147644, 0.153909] },
    'Cuota': { g: ['200–362', '362–524', '524–682', '682–840', '840–1000'], t: [0.156633, 0.151457, 0.161035, 0.146009, 0.140561] },
    'Ingreso (log)': { g: ['0–6,1', '6,1–6,9', '6,9–7,5', '7,5–8,1', '8,1–12,3'], t: [0.150095, 0.155271, 0.153134, 0.144920, 0.152275] },
    'Región': { g: ['Norte', 'Este', 'Centro', 'Sur', 'Oeste'], t: [0.153279, 0.152138, 0.151006, 0.150080, 0.149225] }
  };
  const BASE = 0.151139;
  let elegida = 'Promedio';
  Object.keys(VARS).forEach(v => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'boton boton--hueco'; b.textContent = v;
    b.setAttribute('aria-pressed', String(v === elegida));
    b.addEventListener('click', () => { elegida = v; zona.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); dibujar(); });
    zona.appendChild(b);
  });
  function dibujar() {
    const d = VARS[elegida];
    const g = new Grafico(lienzo, { prop: 0.42, min: 230, max: 320, x: [-0.6, 4.6], y: [0, 0.25], m: { i: 52, d: 14, s: 16, b: 46 } });
    g.ejes({ xt: [], yt: [0, 0.05, 0.1, 0.15, 0.2, 0.25], fy: v => pct(v, 0), ey: 'tasa de deserción', rejillaX: false });
    d.t.forEach((t, i) => {
      g.rect(i - 0.32, 0, i + 0.32, t, css('--g-serie1'), 0.85);
      g.textoPx(pct(t, 1), g.X(i), g.Y(t) - 10, { al: 'center', tam: 11.5, peso: 600 });
      g.textoPx(d.g[i], g.X(i), g.y0 + 14, { al: 'center', tam: 11.5, color: css('--tinta-suave') });
    });
    g.linea([[-0.6, BASE], [4.6, BASE]], { color: css('--g-serie4'), ancho: 2, guion: [6, 4] });
    g.textoPx('tasa general: 15,1 %', g.x1 - 4, g.Y(BASE) - 10, { al: 'right', color: css('--g-serie4'), peso: 700, fondo: true });
    const rango_t = Math.max.apply(null, d.t) - Math.min.apply(null, d.t);
    lectura.innerHTML = 'En ' + elegida.toLowerCase() + ', la tasa va de ' + pct(Math.min.apply(null, d.t), 1) + ' a ' + pct(Math.max.apply(null, d.t), 1) +
      ': una diferencia de ' + num(100 * rango_t, 1) + ' puntos. Ningún grupo se aleja de la tasa general. Con datos así, ' + m('E[\\text{deserción}\\mid X] \\approx 0{,}15') + ' para todos.';
  }
  alRedibujar(dibujar);
}

/* ============================================================
   PROCESO 5: Laboratorio 5 · Umbral y matriz de confusión
   Insumo:    probabilidades predichas en el grupo de prueba (deserción: 3 671; empleo formal: 2 714)
   Resultado: histograma por clase real, matriz de confusión y métricas para el umbral elegido
   ============================================================ */
function labUmbral() {
  const lienzo = document.getElementById('umbral-hist'); if (!lienzo || !D.desercion) return;
  const matriz = document.getElementById('umbral-matriz'), metricas = document.getElementById('umbral-metricas');
  const leyenda = document.getElementById('umbral-leyenda');
  const cu = document.getElementById('umbral-u'), ou = document.getElementById('umbral-u-out');
  const botones = Array.from(document.querySelectorAll('#demo-umbral [data-base]'));
  const BASES = {
    desercion: { datos: D.desercion, si: 'Deserta', no: 'No deserta', marcado: 'deserta' },
    formal: { datos: D.formal, si: 'Formal', no: 'Informal', marcado: 'formal' }
  };
  let base = 'desercion';
  // histogramas: probabilidades → conteos por clase real en 100 intervalos de 0,01
  function histos(d) {
    const pos = new Array(100).fill(0), neg = new Array(100).fill(0);
    d.prob.forEach((p, i) => { const k = Math.min(99, Math.floor(p * 100)); if (d.real[i] === 1) pos[k]++; else neg[k]++; });
    return { pos, neg };
  }
  function dibujar() {
    const B = BASES[base], d = B.datos, u = Number(cu.value);
    ou.textContent = num(u, 2);
    const h = histos(d), maxC = Math.max.apply(null, h.pos.concat(h.neg));
    const g = new Grafico(lienzo, { prop: 0.62, min: 250, max: 360, x: [0, 1], y: [0, maxC * 1.12], m: { i: 46, d: 14, s: 16, b: 46 } });
    g.ejes({ xt: rango(0, 1, 0.1), yt: marcas(0, maxC * 1.05, 4), fx: v => num(v, 1), ex: 'probabilidad predicha', ey: 'personas' });
    for (let k = 0; k < 100; k++) {
      if (h.neg[k]) g.rect(k / 100 + 0.001, 0, (k + 1) / 100 - 0.001, h.neg[k], css('--g-serie1'), 0.55);
      if (h.pos[k]) g.rect(k / 100 + 0.001, 0, (k + 1) / 100 - 0.001, h.pos[k], css('--g-serie2'), 0.75);
    }
    g.linea([[u, 0], [u, maxC * 1.12]], { color: css('--g-serie4'), ancho: 2.5 });
    g.textoPx('umbral ' + num(u, 2), g.X(u) + (u > 0.8 ? -6 : 6), g.y1 + 8, { al: u > 0.8 ? 'right' : 'left', color: css('--g-serie4'), peso: 700, fondo: true });
    leyenda.innerHTML = '<span style="--c:var(--g-serie2)">' + B.si + ' (realidad)</span><span style="--c:var(--g-serie1)">' + B.no + ' (realidad)</span><span style="--c:var(--g-serie4)">Umbral: a la derecha, se marca «' + B.marcado + '»</span>';

    let VP = 0, FP = 0, FN = 0, VN = 0;
    d.prob.forEach((p, i) => { const marca = p >= u, real = d.real[i] === 1; if (marca && real) VP++; else if (marca) FP++; else if (real) FN++; else VN++; });
    const n = VP + FP + FN + VN, exact = (VP + VN) / n, prec = VP + FP ? VP / (VP + FP) : NaN, sens = VP / (VP + FN), f1 = prec + sens ? 2 * prec * sens / (prec + sens) : 0;
    matriz.innerHTML = '<thead><tr><th></th><th>Predicción: ' + B.si.toLowerCase() + '</th><th>Predicción: ' + B.no.toLowerCase() + '</th></tr></thead><tbody>' +
      '<tr><th>Real: ' + B.si.toLowerCase() + '</th><td class="bien"><b>' + num(VP, 0) + '</b>VP</td><td class="mal"><b>' + num(FN, 0) + '</b>FN</td></tr>' +
      '<tr><th>Real: ' + B.no.toLowerCase() + '</th><td class="mal"><b>' + num(FP, 0) + '</b>FP</td><td class="bien"><b>' + num(VN, 0) + '</b>VN</td></tr></tbody>';
    const tasa = (VP + FN) / n;
    metricas.innerHTML =
      '<b>Exactitud:</b> ' + m('\\frac{' + VP + ' + ' + VN + '}{' + n + '} = ' + teX(100 * exact, 1) + '\\,\\%') + '<br>' +
      '<b>Precisión:</b> ' + (isNaN(prec) ? 'no se define: el modelo no marcó a nadie' : m('\\frac{' + VP + '}{' + (VP + FP) + '} = ' + teX(100 * prec, 1) + '\\,\\%')) + '<br>' +
      '<b>Sensibilidad:</b> ' + m('\\frac{' + VP + '}{' + (VP + FN) + '} = ' + teX(100 * sens, 1) + '\\,\\%') + ' · <b>F1:</b> ' + m(teX(f1, 2)) + '<br>' +
      '<span class="suave">Si marcaras al azar, la precisión sería la tasa base: ' + m(teX(100 * tasa, 1) + '\\,\\%') + '. Decir «no» a todos daría una exactitud de ' + m(teX(100 * (1 - tasa), 1) + '\\,\\%') + '.</span>';
  }
  cu.addEventListener('input', dibujar);
  botones.forEach(b => b.addEventListener('click', () => {
    base = b.dataset.base; botones.forEach(x => x.setAttribute('aria-pressed', String(x === b))); dibujar();
  }));
  alRedibujar(dibujar);
}

/* ============================================================
   PROCESO 6: Laboratorio 6 · Traza tu recta
   Insumo:    años de educación y logaritmo del ingreso (grupo de prueba de la base de empleo)
   Resultado: la recta elegida, su MSE y su R² frente a la media
   ============================================================ */
function labRecta() {
  const lienzo = document.getElementById('recta-lienzo'); if (!lienzo || !D.regresion) return;
  const R = D.regresion, lectura = document.getElementById('recta-lectura');
  const ca = document.getElementById('recta-a'), cb = document.getElementById('recta-b');
  const oa = document.getElementById('recta-a-out'), ob = document.getElementById('recta-b-out');
  const n = R.todos_y.length, media = R.todos_y.reduce((s, v) => s + v, 0) / n;
  const SST = R.todos_y.reduce((s, v) => s + (v - media) * (v - media), 0);
  // Desplazamiento fijo en x para que los puntos con los mismos años no se tapen (solo para dibujar).
  const azar = ML.azarConSemilla(11), jitter = R.x.map(() => (azar() - 0.5) * 0.7);
  function dibujar() {
    const a = Number(ca.value), b = Number(cb.value);
    oa.textContent = num(a, 2); ob.textContent = num(b, 3);
    const g = new Grafico(lienzo, { prop: 0.5, min: 260, max: 420, x: [-1, 22], y: [3.5, 10.5], m: { i: 46, d: 14, s: 16, b: 46 } });
    g.ejes({ xt: [0, 6, 11, 14, 16, 18, 21], yt: [4, 5, 6, 7, 8, 9, 10], ex: 'años de educación', ey: 'ln(ingreso laboral)' });
    R.x.forEach((x, i) => g.punto(x + jitter[i], R.y[i], { r: 3, color: css('--g-eje'), alfa: 0.6 }));
    g.linea([[-1, media], [22, media]], { color: css('--g-serie4'), ancho: 1.2, guion: [4, 4], alfa: 0.8 });
    g.textoPx('media', g.x1 - 4, g.Y(media) + 11, { al: 'right', color: css('--g-serie4'), tam: 11 });
    g.recortar(); g.linea([[-1, a - b], [22, a + 22 * b]], { color: css('--g-serie1'), ancho: 3 }); g.soltar();
    let SSE = 0; for (let i = 0; i < n; i++) { const e = R.todos_y[i] - (a + b * R.todos_x[i]); SSE += e * e; }
    const mse = SSE / n, r2 = 1 - SSE / SST;
    lectura.innerHTML = 'Tu recta: ' + m('\\hat y = ' + teX(a, 2) + (b < 0 ? ' - ' : ' + ') + teX(Math.abs(b), 3) + '\\,x') + '<br>' +
      m('\\text{MSE} = ' + teX(mse, 3)) + ' · MSE de la media: ' + m(teX(SST / n, 3)) + ' · ' + m('R^2 = 1 - \\frac{' + teX(mse, 3) + '}{' + teX(SST / n, 3) + '} = ' + teX(r2, 3)) +
      '<br>' + (r2 < -0.01 ? 'Tu recta es peor que predecir siempre la media: ' + m('R^2 < 0') + '.' :
               r2 < 0.01 ? 'No mejora a la media.' :
               r2 > 0.2355 ? 'Es la mejor recta posible con una sola variable: ningún otro par (a, b) baja más el MSE.' : 'Mejora a la media. ¿Puedes acercarte más a la mejor?') +
      (b > 0.01 ? ' Con esta pendiente, cada año de educación se asocia con un ingreso ' + m(teX(100 * (Math.exp(b) - 1), 1) + '\\,\\%') + ' mayor.' : '');
  }
  ca.addEventListener('input', dibujar); cb.addEventListener('input', dibujar);
  document.getElementById('recta-media').addEventListener('click', () => { ca.value = media.toFixed(2); cb.value = 0; dibujar(); });
  document.getElementById('recta-mejor').addEventListener('click', () => { ca.value = R.a.toFixed(2); cb.value = R.b.toFixed(3); dibujar(); });
  alRedibujar(dibujar);
}

ML.arrancar([labGD, labDetective, labLog, labSenal, labUmbral, labRecta]);
})();
