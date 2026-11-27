# Aprendizaje de Machine Learning y econometría

Lecciones interactivas de dos cursos de la Diplomatura en Ciencia de Datos para las Ciencias Sociales y la Gestión Pública (PUCP, 2026):

- **Machine Learning**: «Introducción a Machine Learning para Ciencias Sociales», prof. Pavel Coronado Castellanos (se trabaja en Python).
- **Econometría**: «Taller de Introducción a la Econometría Aplicada», prof. Alfonso Rodríguez, QLAB–PUCP (se trabaja en Stata).

Cada lección va **del problema a la fórmula** y **del código a la idea**: una pregunta concreta, laboratorios que se mueven con el mouse, retos con pistas, el código de la clase explicado proceso por proceso (con su equivalente en Excel), cajas «Recuerda» y, al final, la notación explicada símbolo por símbolo.

## Lecciones

| Curso | N.º | Tema | Archivo |
|---|---|---|---|
| Machine Learning | 1 | Cómo aprende una máquina: cálculo, optimización y probabilidad (clase ML1) | `leccion-01.html` |
| Machine Learning | 2 | Del cuaderno al modelo: práctica dirigida 1 (descenso de gradiente, limpieza, clasificación y regresión) | `leccion-02.html` |
| Econometría | 1 | De una pregunta a una estimación con incertidumbre (clase 1) | `econometria-01.html` |

## Estructura

```
index.html                       portada con los dos cursos
leccion-01.html                  lección 1 de ML (usa recursos/leccion-01.js)
leccion-02.html                  lección 2 de ML
econometria-01.html              clase 1 de econometría
recursos/estilos.css             aspecto de todas las páginas
recursos/comun.js                herramientas compartidas desde la lección 2: gráficos, 3D, retos, fórmulas
recursos/leccion-02.js           laboratorios de la lección 2
recursos/econometria-01.js       laboratorios de la clase 1 de econometría
recursos/datos-*.js              datos de los laboratorios, calculados en Python con las bases de cada clase
```

No hay que instalar nada. Las fórmulas usan KaTeX desde un CDN; los gráficos usan JavaScript del navegador.

## Ver en la computadora

Ejecuta en esta carpeta `python -m http.server` y entra a <http://localhost:8000>.

## Publicación

GitHub Pages publica la rama `main` desde la raíz: <https://diegosimemirror.github.io/aprendizaje_ML/>.

## Autoría y créditos

**Machine Learning.** Material del prof. **Pavel Coronado Castellanos** (Facultad de Ciencias Sociales, PUCP, 2026; asistente: Anderson Águila): diapositivas *ML1* e *Intro ML* (Departamento de Economía y QLAB, PUCP); cuadernos y bases de la práctica dirigida 1 (25-11-2026); y Coronado, P. (2026), *Machine Learning para las Ciencias Sociales: con aplicaciones en Python* (Material de Enseñanza n.º 16, Departamento de Economía, PUCP).

**Econometría.** Material del prof. **Alfonso Rodríguez** (QLAB–PUCP, 2026): diapositivas de la clase 1, módulos 1 y 2 y el archivo `Modulo2.do`; estudios de Amaya, Cozzubo, Cueto y Hernández (2021), Yamada (2007) y Bernal, Costa y Ritter (CIES); ENAHO 2023, módulo 500 (INEI).

**Autoría original de los ejemplos.** Deisenroth, Faisal y Ong (2020), ejemplo 7.1; Goldberger (1991), figura 5.1; Angrist y Pischke (2009), figura 3.1.1; Breiman (2001); Mitchell (1997); datos *Advertising* de James, Witten, Hastie y Tibshirani. La lista completa está en la sección «Créditos y autorías» de cada lección.

**Lecturas.** James, Witten, Hastie, Tibshirani y Taylor (2023), *An Introduction to Statistical Learning with Applications in Python*; Deisenroth, Faisal y Ong (2020), *Mathematics for Machine Learning*; Breiman (2001); Athey e Imbens (2019).

**Datos.** SIS, Plataforma Nacional de Datos Abiertos (porcentajes preliminares propios); bases de práctica de los cursos (no son cifras oficiales); ENAHO 2023 del INEI (cálculos propios, sin factor de expansión).

**Herramientas.** KaTeX (licencia MIT); tipografías Newsreader y Schibsted Grotesk (SIL Open Font License).

**Elaboración.** Texto, diseño, laboratorios y código: Diego Sime con Claude Code (Anthropic), noviembre de 2026.

**Licencia.** La licencia MIT de este repositorio cubre solo el código y el texto propios. Las diapositivas, los cuadernos, los archivos de Stata, las lecturas y las demás obras citadas pertenecen a sus autores y no se reproducen aquí.
