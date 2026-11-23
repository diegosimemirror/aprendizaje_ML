# Aprendizaje de Machine Learning

Lecciones interactivas del curso «Introducción a Machine Learning para Ciencias Sociales» (prof. Pavel Coronado), de la Diplomatura en Ciencia de Datos para las Ciencias Sociales y la Gestión Pública (PUCP, 2026).

Cada lección va **del problema a la fórmula**: una pregunta concreta, laboratorios que se mueven con el mouse, retos con pistas, cajas «Recuerda» y, al final, la notación explicada símbolo por símbolo.

## Lecciones

| N.º | Tema | Archivo |
|---|---|---|
| 1 | Cómo aprende una máquina: cálculo, optimización y probabilidad (clase ML1) | `leccion-01.html` |

## Estructura

```
index.html             portada del curso y lista de lecciones
leccion-01.html        lección 1 (texto, retos y fórmulas)
recursos/estilos.css   aspecto de todas las páginas (colores, letras, cajas)
recursos/leccion-01.js laboratorios de la lección 1 (gráficos en <canvas>)
```

No hay que instalar nada. Las fórmulas usan KaTeX desde un CDN; los gráficos usan JavaScript del navegador.

## Ver en la computadora

Abre `index.html` con doble clic. Si el navegador bloquea algo, ejecuta en esta carpeta `python -m http.server` y entra a <http://localhost:8000>.

## Publicación

GitHub Pages publica la rama `main` desde la raíz: <https://diegosimemirror.github.io/aprendizaje_ML/>.

## Autoría y créditos

**Material del curso.** Las lecciones se basan en el material del prof. **Pavel Coronado Castellanos** para el curso «Introducción a Machine Learning para Ciencias Sociales» (Diplomatura en Ciencia de Datos para las Ciencias Sociales y la Gestión Pública, Facultad de Ciencias Sociales, PUCP, 2026; asistente: Anderson Águila):

- Diapositivas *ML1 · Machine Learning para CSSS. Repaso estadístico y de optimización* e *Intro ML · Machine Learning: Introducción* (Departamento de Economía y QLAB, PUCP).
- Coronado, P. (2026). *Machine Learning para las Ciencias Sociales: con aplicaciones en Python* (Material de Enseñanza n.º 16). Departamento de Economía, PUCP.

**Autoría original de los ejemplos de la clase.** Deisenroth, Faisal y Ong (2020), ejemplo 7.1 (descenso de gradiente en dos dimensiones); Goldberger (1991), figura 5.1 (distribución «techo»); Angrist y Pischke (2009), figura 3.1.1 (salario y educación); Breiman (2001) (las dos culturas); Mitchell (1997) (definición de aprendizaje).

**Lecturas del curso.** James, Witten, Hastie, Tibshirani y Taylor (2023), *An Introduction to Statistical Learning with Applications in Python*; Deisenroth, Faisal y Ong (2020), *Mathematics for Machine Learning*; Breiman (2001), «Statistical Modeling: The Two Cultures»; Athey e Imbens (2019), «Machine Learning Methods That Economists Should Know About».

**Datos.** Seguro Integral de Salud (SIS), Plataforma Nacional de Datos Abiertos; los porcentajes son cálculos preliminares propios.

**Herramientas.** KaTeX (licencia MIT); tipografías Newsreader y Schibsted Grotesk (SIL Open Font License).

**Elaboración.** Texto, diseño, laboratorios y código: Diego Sime con Claude Code (Anthropic), noviembre de 2026. La lista completa de obras citadas está en la sección «Créditos y autorías» de cada lección.

**Licencia.** La licencia MIT de este repositorio cubre solo el código y el texto propios. Las diapositivas, el manual, las lecturas y las demás obras citadas pertenecen a sus autores y no se reproducen aquí.
