# Visión Fit — preparación local para pruebas con cámara

Fecha: 6 de noviembre de 2026. Proyecto TFG GTDM, ETSIT-UPV.

## Aplicación posterior en la carpeta original

Por petición expresa del usuario, los cambios preparados se han aplicado también en `C:/Users/paupi/Desktop/TFG/VS/Vision_fit`. Se han copiado únicamente los archivos de código, tests y documentación de la entrega, manteniendo los cambios locales previos y sin sobrescribir `landmarks.ts`, dependencias, recursos ni configuración de Git. La carpeta original pasa a ser la versión de trabajo actual. No se ha hecho commit, push ni publicación en GitHub. Los apartados siguientes describen la preparación inicial en una copia separada. Los registros de `docs/verificacion` se actualizan con las comprobaciones ejecutadas en la carpeta original.
## Entrega y alcance iniciales

Los cambios están en la copia `Vision_fit_preparacion`, dentro de la carpeta local del proyecto ChatGPT. La carpeta original `C:/Users/paupi/Desktop/TFG/VS/Vision_fit` se ha conservado. La copia contiene los cambios locales previos de `CameraPreview.tsx`, `VideoPreview.tsx` y `landmarks.ts`; este último no se ha modificado durante esta sesión.

Referencia del repositorio original: rama `main`, commit `cdc9b32`. No se ha hecho ningún commit, push, publicación, ni otra escritura en GitHub. La copia no contiene `.git` y no cambia la versión publicada.

Se han realizado cambios en los analizadores, su conexión con cámara/vídeo, el registro de intentos y las comprobaciones. No se han cambiado CSS, diseño general, selector de ejercicio/lado, tutoriales, reproducción/seek, detección de MediaPipe, encuadre del vídeo, ni las métricas de FPS/latencia. No se han añadido dependencias.

## A. Inspección inicial y cambios

### Estado encontrado antes de modificar

| Área | Implementación real encontrada | Carencia o problema |
|---|---|---|
| Curl — `src/ejercicios/curl.ts` | Fases abajo/arriba. Contador al flexionar hasta 50°; clasificación al volver a 160°. Desplazamientos normalizados de codo respecto a hombro y de hombro respecto a cadera. | Un curl sin llegar a 50° no generaba resultado de rango incompleto. Sus errores podían quedar acumulados para otro ciclo. No exigía observar extensión inicial. |
| Sentadilla — `src/ejercicios/sentadilla.ts` | Inicio a 140°, profundidad a 100°, cierre a 160°. Clasifica profundidad insuficiente y máximo de inclinación del tronco >50° respecto a vertical de imagen. Cuenta también los ciclos con poca profundidad. | Una sesión podía comenzar a mitad de descenso. La falta de hombro no impedía considerar correcta la técnica. El cierre mostraba un éxito genérico incluso con poca profundidad. |
| Press — `src/ejercicios/pressHombro.ts` | Espera ambos codos ≤60°, requiere ambos ≥140°, cuenta al volver ambos a ≤60°. Asimetría si diferencia >15° durante al menos el 20% de frames. | Los ciclos que no llegaban arriba desaparecían del historial. No había error independiente de extensión ni apertura. El reposo abajo se incluía en la proporción de asimetría, pudiendo diluirla. |
| Cámara y vídeo | Componentes genéricos con analizadores comunes; conversión a píxeles, visibilidad 0,7 y selección de lado. El press ya usaba solo seis puntos de ambos brazos. | La falta de landmarks saltaba el análisis, pero conservaba el ciclo anterior y podía unir movimientos separados. El filtro no rechazaba coordenadas no finitas o fuera del encuadre. |
| Pie de sentadilla | Los cambios locales previos dibujaban tobillo, talón y punta y mostraban un ángulo talón-punta respecto a la horizontal de imagen. | Era una medición exploratoria; no existía regla de error, asociación por repetición ni registro en resumen. |
| Historial y resumen | Booleanos por repetición y estadísticas propias de cada ejercicio. `ResultadoSesion.tsx` mostraba valoración, consejo e historial. | No había identificación común de intento/recorrido/cobertura. Un análisis parcial podía aparecer como técnica correcta. No existían tests ni script de test. |

Los mensajes originales relevantes eran «Mantén el codo estable», «Evita balancear el tronco», «Sigue flexionando», «Sigue bajando», «Reduce la inclinación hacia delante» e «Intenta mover ambos brazos al mismo nivel». Se mantienen como feedback de movimiento/técnica. Se añaden los mensajes específicos de rango incompleto, extensión incompleta, seguimiento perdido y apertura experimental.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/ejercicios/curl.ts` | Registro independiente de rango incompleto; identificación única de intentos; amplitud y persistencia mínimas; inicio desde extensión observada; cierre y limpieza de errores por intento; resumen de rango y cobertura. Conserva el contador al alcanzar flexión. |
| `src/ejercicios/pressHombro.ts` | Registra intentos sin extensión al volver abajo; separa el umbral de extensión del umbral histórico de conteo; excluye reposo de la simetría; añade indicador bilateral experimental de apertura con calibración; conserva fases y conteo de ciclos completos. |
| `src/ejercicios/sentadilla.ts` | Centraliza umbrales, exige postura inicial observada, registra cobertura del tronco y condiciones; corrige feedback al cerrar un ciclo con poca profundidad. Conserva clasificación y conteo anteriores. |
| `src/components/CameraPreview.tsx`, `VideoPreview.tsx` | Interrumpen el ciclo si falta seguimiento; actualizan historial también con intentos no contados; muestran mensajes, cobertura y nuevas métricas. Press exige únicamente hombros, codos y muñecas. |
| `src/mediapipe/dibujo.ts` | Reutiliza visibilidad centralizada y rechaza coordenadas no finitas o fuera de imagen antes de convertirlas a píxeles. |
| `src/components/ResultadoSesion.tsx` | Consejo específico cuando falta cobertura y no hay error dominante; descripción del historial compatible con intentos. |
| `package.json`, `.gitignore`, `README.md` | Scripts de tests y TypeScript; exclusión de salida temporal de tests; acceso rápido a la copia preparada. |

Archivos nuevos: `src/ejercicios/parametros.ts` (calibración), `src/ejercicios/registro.ts` (contrato de registro, geometría y depuración), `src/components/DetalleIntento.tsx` (detalle de recorrido/cobertura), `tests/deteccion.test.cjs`, `scripts/test.cjs`, `tsconfig.tests.json`, el lanzador `INICIAR_VISION_FIT.cmd` y esta documentación con registros de verificación.

### Decisiones y semántica de los resultados

- `intento`/`numero`: ID consecutivo de cada ciclo clasificable cerrado, independiente del contador de repeticiones. No se reutiliza para el siguiente ciclo incompleto.
- `numeroRepeticion`: valor asociado del contador o `null` si no sumó. `recorridoCompleto` expresa si se observó todo el recorrido requerido. `evaluacionCompleta` y `noEvaluados` identifican falta de cobertura entre las reglas activas. Las reglas desactivadas/pendientes no se presentan como evaluadas; su estado se detalla en la tabla B.
- Se conservan los distintos criterios de conteo existentes: curl suma en la flexión; sentadilla suma cualquier descenso suficiente para iniciar ciclo que vuelve arriba, incluso con poca profundidad; press suma solo si ambos brazos alcanzan el umbral alto y vuelven abajo. Por ello «Repeticiones» y «Recorridos completos» pueden diferir. El historial es la referencia para los ciclos cerrados y su técnica.
- Curl incompleto en flexión: desde extensión, baja de 140°, excursión de al menos 35° respecto al límite de extensión y al menos tres frames activos; al volver a extensión, registra rango incompleto sin sumar. Los errores técnicos quedan en ese intento, no pasan al siguiente.
- Curl incompleto en extensión: después de llegar a flexión, extiende al menos 35° desde el límite de flexión y vuelve a flexionar sin llegar a 160°. Se cierra un intento con rango incompleto y se exige extensión antes de armar otro. El contador de curl ya había sumado en la primera flexión, como antes; no suma otra vez en el rebote.
- Press incompleto: subida significativa (al menos un brazo supera 60° en 25°), al menos tres frames activos y retorno de ambos a ≤60° sin haber alcanzado ambos ≥140°. Se registra extensión incompleta sin sumar al contador. No se etiqueta durante la subida normal. Por defecto extensión mínima y umbral alto coinciden en 140°; pueden calibrarse por separado.
- El reposo abajo del press no entra en el denominador de simetría. Durante el ciclo cada frame válido entra una sola vez. Se mantiene la estadística por frames, no por tiempo.
- Los errores se acumulan como booleanos por ciclo. Pueden coexistir varios errores independientes en una tarjeta; los contadores de errores no son categorías excluyentes y su suma puede superar el total de intentos.
- En curl, los errores de desplazamiento requieren tres frames consecutivos sobre su límite, para filtrar picos. En sentadilla se conserva el criterio de máximo observado del tronco. La persistencia por frames depende de los FPS y requiere revisión física.
- Sin cadera visible/referencia en curl o sin hombro durante parte de la sentadilla, el movimiento puede contarse, pero la evaluación se marca parcial y no entra en «Correctas». No se inventa un error de tronco cuando falta observación.
- Al perder un landmark imprescindible, el ciclo abierto se descarta y se exige volver a la postura inicial. No se transforma una pérdida de seguimiento en un error biomecánico. Los registros cerrados se conservan. El contador histórico de curl puede haber sumado antes de la pérdida; por eso no debe equipararse al historial.
- Al finalizar una sesión o un vídeo a mitad de ciclo no se fuerza un diagnóstico de rango: no se ha observado su retorno. Para probar y comparar resultados, vuelve a la postura inicial antes de finalizar. Esta limitación se conserva explícita; no se afirma que un ciclo sin cerrar haya sido clasificado.

## B. Estado de los nueve errores

«Tests superados» significa comprobación de lógica con puntos sintéticos. Todas las filas con implementación siguen pendientes de validación física y calibración; ningún umbral nuevo se considera definitivo.

| Ejercicio | Error | Implementación al entregar | Tests automáticos superados | Validación física pendiente | Umbral provisional real |
|---|---|---|---|---|---|
| Curl | Desplazamiento del codo | Activa, deduplicada por intento | Aislado, combinado, pico aislado y separación de ciclos | Sí: variación normal, perspectiva y persistencia | >0,25 cámara / >0,30 vídeo de longitud inicial hombro-codo; 3 frames consecutivos |
| Curl | Balanceo del tronco | Activa cuando cadera y referencia son visibles | Aislado, combinado, cobertura ausente y separación de ciclos | Sí: traslación, balanceo y distancia | >0,13 cámara / >0,16 vídeo de longitud inicial hombro-cadera; 3 frames consecutivos |
| Curl | Rango incompleto | Añadido como error independiente, con historial y resumen | Flexión parcial, extensión parcial con nueva flexión, ruido, picos, siguiente intento y resumen | Sí: excursión mínima y rangos por persona | Extensión ≥160°, flexión ≤50°, inicio ≤140°, excursión ≥35°; mínimo 3 frames para flexión incompleta |
| Sentadilla | Profundidad insuficiente | Existente; asociación y feedback revisados | Normal, aislado, combinado, límites y resumen | Sí: vista lateral, profundidad y antropometría | Inicio ≤140°, profundidad ≤100°, cierre ≥160° |
| Sentadilla | Inclinación excesiva del tronco | Existente; cobertura explícita | Aislado, combinado, hombro ausente y resumen | Sí: variante, perspectiva y ruido | Máxima inclinación >50° respecto a vertical de imagen |
| Sentadilla | Tobillo / posición del pie | Pendiente de definición; medición exploratoria conservada, sin clasificador | No hay regla que validar; no se atribuye un test biomecánico al dibujo | Definir exactamente el fallo y el protocolo antes de implementarlo | Ninguno; `pie.habilitado=false` es un marcador de pendiente |
| Press | Asimetría | Activa; comparación de ambos codos y reposo excluido | Aislado, reposo prolongado, pérdida de seguimiento y separación respecto a apertura | Sí: desfases, anatomía y FPS | Diferencia >15° durante ≥20% de frames del ciclo |
| Press | Extensión incompleta de codos | Añadida, se decide al retornar abajo | Intento incompleto, subida transitoria, ruido, resumen y umbral independiente | Sí: mínimo de extensión y tolerancia del inicio | Bajo ≤60°, alto ≥140°, extensión mínima 140°, excursión ≥25°, mínimo 3 frames para intento sin posición alta |
| Press | Codos demasiado abiertos | Implementación experimental, desactivada en uso habitual | Referencia ausente, persistencia, escala, aislamiento de simetría y activación explícita | Sí; además acordar variante/referencia y demostrar utilidad del indicador | Aumento bilateral >0,20 de anchura entre hombros sobre referencia; codos ≤90°; 3 frames, referencia de 5 frames bajos |

### Límites del indicador de apertura

Se mide la distancia horizontal hombro-codo de cada brazo dividida por la anchura horizontal entre hombros. Se toma una referencia de cinco frames de la posición baja y se exige que ambos lados aumenten su separación por encima del límite durante tres frames, solo en la parte baja del recorrido. No se reutiliza la diferencia angular de simetría para este error.

Es un indicador de cambio en la proyección frontal, no una medición de rotación del hombro ni una frontera biomecánica validada. No permite determinar si una apertura inicial ya era inadecuada. La rotación del cuerpo, el movimiento en profundidad, una anchura proyectada pequeña, la variante elegida y la anatomía pueden cambiar el resultado. La referencia debe acordarse para la variante y la persona. Por estas razones queda desactivado por defecto y siempre se etiqueta experimental.

### Por qué no se clasifica todavía el pie

Falta acordar qué se busca: elevación del talón, cambio de orientación, pérdida de apoyo u otro fallo concreto. La inclinación talón-punta respecto a la horizontal de la imagen, que ya mostraba el proyecto, no identifica por sí sola contacto con el suelo. Faltan una referencia inicial del suelo y del pie, compensación de inclinación/perspectiva de cámara, escala/ruido y vídeos etiquetados con el fallo acordado. Se conserva el dibujo y la medida para recoger esos datos; no hay un error ficticio en el resumen.

## C. Verificación técnica

Entorno utilizado: Windows, Node 24.21.0, TypeScript instalado del proyecto y Vite 8.2.1. Se reutilizaron las dependencias locales copiadas del original; no hubo instalación ni cambios de versiones.

| Comprobación final | Resultado real | Evidencia |
|---|---|---|
| `npm run typecheck` | Correcto, salida 0 | `verificacion/typescript.txt` |
| `npm run lint` | Correcto, salida 0; sin errores ni avisos | `verificacion/lint.txt` |
| `npm run build` | Correcto, salida 0; 39 módulos transformados | `verificacion/build.txt` |
| `npm test` | 28 tests superados, 0 fallos | `verificacion/tests.txt` |
| Tests previos | No había infraestructura ni tests existentes | `package.json` inicial y revisión del árbol |
| Pruebas físicas / iPhone / webcam | No ejecutadas | Pendientes del protocolo de cámara |

La compilación inicial se detuvo con `spawn EPERM` al iniciar una herramienta en el entorno restringido. La compilación final se ejecutó con permiso ampliado y terminó correctamente. El runner de tests evita lanzar un proceso de aislamiento por fichero mediante `--test-isolation=none`; mantiene los tests reales de Node. El script compila primero las funciones TypeScript. Se incluye una comprobación de renderizado del detalle de intento, pero no una prueba completa de navegación o reproducción en navegador.

Los tests cubren lógica, resultados y resúmenes con landmarks sintéticos, baja visibilidad, segmentos degenerados, NaN/infinito, coordenadas fuera de imagen, pérdidas de seguimiento, límites, separación entre intentos y la activación experimental. No miden precisión, sensibilidad, especificidad ni validez biomecánica sobre personas reales. Tampoco prueban la inferencia de MediaPipe, permisos del navegador, encuadre real ni rendimiento en el móvil.

## D. Pruebas con cámara

Sigue `GUIA_PRUEBAS_CAMARA.md`. Abre la copia preparada con `INICIAR_VISION_FIT.cmd`. La configuración está centralizada en `src/ejercicios/parametros.ts`. No es necesario publicar nada para probar en el ordenador.

## E. Texto resumido para el seguimiento del TFG

Durante esta sesión se inspeccionaron los tres analizadores de Visión Fit y la propagación de errores desde cada fotograma al historial y al resumen de sesión. Se detectó que los recorridos incompletos de curl y press podían quedar sin registro. Se incorporaron registros independientes de intentos, clasificación de rango incompleto en curl y de extensión incompleta en press, feedback específico y estadísticas asociadas. Se mantuvieron los criterios históricos de conteo, documentando su diferencia respecto al recorrido completo.

Se reforzó el tratamiento de visibilidad y continuidad y se identificaron explícitamente las evaluaciones parciales. Se centralizaron parámetros provisionales y se añadió depuración opcional con condiciones e identificación de cada intento. El press mantiene un encuadre frontal desde el pecho hacia arriba y no utiliza caderas ni piernas. Se preparó un indicador experimental de apertura bilateral de codos, desactivado por defecto por las limitaciones de la proyección frontal. El error de pie/tobillo de sentadilla permanece pendiente de definición; se conservó la medición exploratoria existente.

TypeScript, ESLint y compilación de producción terminaron correctamente. Se incorporaron y superaron 28 tests automáticos con datos sintéticos sin dependencias adicionales. Estos resultados verifican el comportamiento programado y no constituyen validación biomecánica. La evaluación con movimientos reales, la calibración por ejercicio y las pruebas de cámara/móvil quedan como siguiente fase. El trabajo se entregó en una copia local separada y no se publicó nada en GitHub.

