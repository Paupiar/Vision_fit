# Visión Fit — sesión de comprobación en casa

## Inicio rápido

1. Abre `INICIAR_VISION_FIT.cmd` desde la carpeta original `C:/Users/paupi/Desktop/TFG/VS/Vision_fit`. Mantén abierta la ventana mientras usas la aplicación. Se abrirá `http://127.0.0.1:5173/Vision_fit/` si ese puerto está libre; la ventana indicará otra dirección si fuera necesario.
2. Selecciona ejercicio, lado cuando corresponda y cámara o vídeo. En cámara espera a que esté lista, pulsa «Empezar análisis» y deja terminar la cuenta atrás.
3. Empieza por tres ciclos normales. Vuelve siempre a la postura inicial y después pulsa «Finalizar». Compara contador, intentos y resumen.
4. Prueba un único error por serie y después uno combinado. Usa movimientos lentos y carga ligera o sin carga; no fuerces movimientos dolorosos para provocar un aviso. Los umbrales son provisionales.
5. Si se pierde el seguimiento, recupera el encuadre y vuelve a la postura inicial: brazo extendido en curl, de pie en sentadilla, ambos codos bajos en press. El ciclo abierto se descarta para no mezclarlo con otro.

Para ver las condiciones de cada resultado, añade `?debugVisionFit=1` a la dirección. En el historial aparecerá «Datos del intento» y la consola del navegador registrará una entrada por cierre, con ejercicio, intento, contador, errores y medidas. La depuración está apagada en la dirección habitual.

Si usas vídeo, no saltes en su línea temporal durante una serie que quieras conservar: el seek inicia una sesión nueva, como antes. Una pausa normal no fuerza un diagnóstico de intento incompleto. Termina los ciclos antes de llegar al final del archivo.

## Encuadre común

- Curl: coloca la cámara de modo que hombro, codo y muñeca del lado elegido sean claramente visibles; empieza por una vista lateral estable para comparar recorridos. Incluye la cadera si quieres evaluar balanceo. Mantén la cámara fija y el mismo lado seleccionado.
- Sentadilla: vista lateral estable del lado elegido, con hombro, cadera, rodilla, tobillo, talón y punta del pie visibles. Se evalúa un lado, no valgo bilateral de rodillas.
- Press: cámara frontal, encuadre desde el pecho hacia arriba, sentado o de pie. Deben verse los dos hombros, codos y muñecas durante todo el recorrido, incluyendo las manos en la posición superior. No hacen falta caderas ni piernas. No se utiliza vista a 45°.

## Pruebas por error

| Error | Cámara | Movimiento de prueba | Resultado esperado | Indicio de fallo | Datos que registrar |
|---|---|---|---|---|---|
| Curl: desplazamiento del codo | Encuadre de curl; hombro y codo visibles | Tras un ciclo normal y la extensión inicial, realiza otro desplazando de forma controlada el codo respecto al hombro durante parte del recorrido | «Mantén el codo estable»; al cerrar, un error de codo en ese intento y una unidad en resumen | No se detecta un desplazamiento sostenido evidente; aparece con mínima variación normal; se repite por frame o contamina el siguiente ciclo | Fuente, lado, intento, máximo de desplazamiento y límite aplicado; vídeo si puedes conservarlo |
| Curl: balanceo | Mismo encuadre incluyendo cadera | Extiende para fijar referencia; realiza un ciclo con un pequeño balanceo controlado del tronco y otro estable | «Evita balancear el tronco» si supera el límite; error de tronco en ese intento. Si falta cadera, debe decir evaluación parcial | Se evalúa como correcta sin cadera; arrastra el error al ciclo siguiente; confunde una traslación conjunta con balanceo | Máximo hombro-cadera normalizado, límite, visibilidad de cadera y errores simultáneos |
| Curl: rango incompleto | Encuadre de curl | A: desde extensión, flexiona de forma apreciable sin llegar arriba y vuelve a extender. B: flexiona completamente, baja parcialmente y vuelve a flexionar sin extender. C: movimientos mínimos | A: intento con «Rango de movimiento incompleto», sin sumar. B: un registro de rango incompleto, sin sumar otra vez en el rebote. C: sin intentos nuevos. Cada ciclo debe quedar separado del siguiente | El intento apreciable desaparece; el mínimo cuenta; hay duplicados; un parcial hereda errores anteriores | Ángulo mínimo, máxima extensión del retorno, intento, contador, recorrido y amplitud realizada |
| Sentadilla: profundidad | Vista lateral, pierna completa | Un descenso que alcance profundidad y otro deliberadamente corto pero apreciable; vuelve de pie en ambos | Dos ciclos contados según criterio existente; solo el corto muestra «Profundidad insuficiente» y recorrido incompleto | El corto desaparece del historial; el profundo activa el error; solo se ve «Repetición completa» pese al fallo | Ángulo mínimo, lado, intento, profundidad observada y resumen |
| Sentadilla: inclinación | Vista lateral incluyendo hombro y cadera | Compara un ciclo con tronco controlado con otro cambiando moderadamente la inclinación; no fuerces la espalda | Aviso «Reduce la inclinación hacia delante» al superar el límite; un error en el ciclo afectado. Si falta hombro, evaluación parcial | No detecta un cambio sostenido por encima del límite; activa por un único punto errático; marca técnica correcta sin hombro | Máxima inclinación, calidad del hombro/cadera, variante, ángulo mínimo y coexistencia de profundidad |
| Sentadilla: talón levantado | Vista lateral y pie completo | Empieza de pie con el talón apoyado. Compara una repetición con el talón apoyado con otra en la que se levante de forma controlada. | «Mantén el talón apoyado» si el ángulo talón-punta aumenta al menos 12° durante 3 fotogramas. Una entrada en historial y resumen por repetición afectada. Si falta el pie o la referencia, se indica evaluación parcial. | Salta con un solo fotograma o arrastra el fallo al siguiente ciclo | Lado, ángulo inicial, aumento máximo y visibilidad del pie |
| Press: asimetría | Frontal, pecho hacia arriba, ambos brazos enteros | Ciclo normal y ciclo con un pequeño desfase controlado entre brazos; incluye reposo abajo antes de otro ciclo | Feedback de simetría y registro de descompensación si supera 15° en ≥20% de frames del ciclo. El reposo previo no debe diluirlo | Un brazo oculto genera diagnóstico; el reposo borra el error | Ángulos de ambos codos, diferencia media/máxima, porcentaje descompensado, intento y duración del reposo |
| Press: extensión incompleta | Mismo encuadre frontal, espacio por encima de cabeza | Desde abajo, sube de forma apreciable sin extender completamente y vuelve abajo; después haz un ciclo completo | Mientras subes no debe cerrar un error. Al volver, «Extensión incompleta de los codos», intento en historial y resumen, sin sumar ese parcial; siguiente ciclo independiente | El error aparece durante toda subida normal; parcial desaparece; suma una repetición completa o duplica entradas | Máximas extensiones izquierda/derecha, umbral, intento, contador y momento del mensaje |

## Orden recomendado y criterios de revisión

1. Curl: normal → codo → tronco → flexión parcial → extensión parcial → normal. Comprueba que el último normal no hereda errores.
2. Sentadilla: normal → poca profundidad → cambio de inclinación → talón levantado → normal. Prueba también qué ocurre si el pie deja de verse.
3. Press: normal sentado → normal de pie → desfase → extensión parcial → normal. Mantén siempre el encuadre pecho-arriba.
4. En cada ejercicio prueba ocultar un punto imprescindible durante un ciclo. No debe completarlo con el movimiento posterior. Recupera la posición inicial antes del siguiente intento.
5. Repite una serie en vídeo y comprueba historial/resumen. La cámara y el vídeo comparten analizadores, aunque el curl mantiene tolerancias de desplazamiento diferentes.

Registra también falsos positivos en movimientos normales, falsos negativos con un fallo visible, pérdidas de seguimiento y si los mensajes se leen a tiempo. La persistencia se expresa en frames, de modo que conviene anotar FPS y latencia del panel existente.

## Plantilla para comunicar resultados

| Fuente/dispositivo | Ejercicio/lado/variante | Intento y contador | Movimiento real | Mensaje y errores | Medidas/límites | ¿Coincide? | Observaciones o vídeo |
|---|---|---|---|---|---|---|---|
| Cámara o vídeo | | | | | | | |

Los cambios de umbrales se hacen en `src/ejercicios/parametros.ts`. Ajusta una regla cada vez con ejemplos normales y con error, conservando las medidas anteriores. No conviertas un único ejemplo satisfactorio en validación del sistema.

Esta entrega está preparada para comprobación local en Windows. No se ha probado en iPhone en esta sesión; la dirección 127.0.0.1 del ordenador no sirve para abrirlo desde el teléfono. Se conserva el flujo que ya utilizabas para pruebas móviles y no se ha actualizado la versión publicada.

