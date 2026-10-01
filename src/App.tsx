// Importamos los hooks necesarios de React.

import {

  useEffect,

  useRef,

  useState

} from "react";

// Tipo del evento utilizado

// al seleccionar un archivo.

import type {

  ChangeEvent

} from "react";

// Estilos generales.

import "./App.css";

// --------------------------------------------------

// COMPONENTES

// --------------------------------------------------

import CameraPreview

  from "./components/CameraPreview";

import VideoPreview

  from "./components/VideoPreview";

// --------------------------------------------------

// EJERCICIOS

// --------------------------------------------------

import {

  EJERCICIOS

} from "./ejercicios/tipos";

import type {

  EjercicioId

} from "./ejercicios/tipos";

// --------------------------------------------------

// LADO

// --------------------------------------------------

import type {

  Lado

} from "./ejercicios/landmarks";

// ==================================================

// HERRAMIENTAS TEMPORALES DE PRUEBA

// ==================================================

//

// Cuando terminemos las pruebas de rendimiento,

// cambiaremos este valor a false.

//

// El botón y el panel dejarán de mostrarse,

// pero todo el código seguirá disponible.

// ==================================================

const MOSTRAR_BOTON_METRICAS_RENDIMIENTO =

  false;

function obtenerIconoEjercicio(

  ejercicio: EjercicioId

) {

  if (ejercicio === "curl") {

    return "↗";

  }

  if (ejercicio === "sentadilla") {

    return "↓";

  }

  return "↑";

}

function obtenerDescripcionEjercicio(

  ejercicio: EjercicioId

) {

  if (ejercicio === "curl") {

    return "Control del brazo y del codo";

  }

  if (ejercicio === "sentadilla") {

    return "Profundidad y alineación";

  }

  return "Simetría y recorrido";

}

function App() {

  // Tutorial que está abierto. Ambos usan el mismo vídeo de prueba por ahora.

  const [

    tutorialAbierto,

    setTutorialAbierto

  ] = useState<"ordenador" | "movil" | null>(null);

  // ==================================================

  // EJERCICIO

  // ==================================================

  const [

    ejercicioSeleccionado,

    setEjercicioSeleccionado

  ] =

    useState<EjercicioId | null>(

      null

    );

  // ==================================================

  // LADO

  // ==================================================

  const [

    ladoSeleccionado,

    setLadoSeleccionado

  ] =

    useState<Lado>(

      "derecho"

    );

  // ==================================================

  // CÁMARA

  // ==================================================

  const [

    mostrarCamara,

    setMostrarCamara

  ] =

    useState<boolean>(

      false

    );

  // ==================================================

  // REINICIO DEL ANÁLISIS

  // ==================================================

  //

  // Cada vez que este número cambia,

  // los componentes reciben la orden

  // de comenzar una sesión nueva.

  // ==================================================

  const [

    reinicioAnalisis,

    setReinicioAnalisis

  ] =

    useState<number>(

      0

    );

  // ==================================================

  // MÉTRICAS DE RENDIMIENTO

  // ==================================================

  // El panel está oculto al abrir la aplicación.

  // El usuario puede mostrarlo desde el botón

  // situado junto a Reiniciar análisis.

  const [

    mostrarMetricasRendimiento,

    setMostrarMetricasRendimiento

  ] =

    useState<boolean>(

      false

    );

  // ==================================================

  // VÍDEO

  // ==================================================

  const inputVideoRef =

    useRef<HTMLInputElement | null>(

      null

    );

  const urlVideoRef =

    useRef<string | null>(

      null

    );

  const [

    nombreVideo,

    setNombreVideo

  ] =

    useState<string>(

      ""

    );

  const [

    urlVideo,

    setUrlVideo

  ] =

    useState<string | null>(

      null

    );

  // ==================================================

  // SELECTOR DE LADO

  // ==================================================

  const mostrarSelectorLado =

    ejercicioSeleccionado ===

      "curl" ||

    ejercicioSeleccionado ===

      "sentadilla";

  // ==================================================

  // ¿HAY UN ANÁLISIS ACTIVO?

  // ==================================================

  //

  // Mostramos el botón de reinicio

  // si existe cámara activa

  // o un vídeo seleccionado.

  // ==================================================

  const hayAnalisis =

    mostrarCamara ||

    urlVideo !==

      null;

// Las métricas ya están conectadas

  // a los vídeos de los tres ejercicios.

  const ejercicioConMetricas =

    ejercicioSeleccionado ===

      "curl" ||

    ejercicioSeleccionado ===

      "sentadilla" ||

    ejercicioSeleccionado ===

      "press-hombro";

  // El botón solo aparece cuando:

  //

  // - la herramienta temporal está activada;

  // - el ejercicio tiene métricas;

  // - existe un vídeo cargado;

  // - la cámara no está activa.

  const mostrarBotonMetricas =

    MOSTRAR_BOTON_METRICAS_RENDIMIENTO &&

    ejercicioConMetricas &&

    urlVideo !==

      null &&

    !mostrarCamara;

  // ==================================================

  // LIMPIAR VÍDEO

  // ==================================================

  function limpiarVideoSeleccionado() {

    // Liberamos la URL temporal

    // del vídeo anterior.

    if (

      urlVideoRef.current !==

      null

    ) {

      URL.revokeObjectURL(

        urlVideoRef.current

      );

      urlVideoRef.current =

        null;

    }

    setUrlVideo(

      null

    );

    setNombreVideo(

      ""

    );

    // Cada vídeo nuevo comienza con

    // el panel de pruebas oculto.

    setMostrarMetricasRendimiento(

      false

    );

    // Reiniciamos el input

    // para permitir seleccionar

    // posteriormente el mismo archivo.

    if (

      inputVideoRef.current

    ) {

      inputVideoRef.current.value =

        "";

    }

  }

  // ==================================================

  // SELECCIONAR EJERCICIO

  // ==================================================

  function seleccionarEjercicio(

    ejercicio: EjercicioId

  ) {

    const ejercicioEncontrado =

      EJERCICIOS.find(

        function (elemento) {

          return (

            elemento.id ===

            ejercicio

          );

        }

      );

    // Evitamos seleccionar

    // ejercicios no disponibles.

    if (

      !ejercicioEncontrado ||

      !ejercicioEncontrado.disponible

    ) {

      return;

    }

    // Apagamos cualquier cámara activa.

    setMostrarCamara(

      false

    );

    // Si realmente cambiamos

    // de ejercicio,

    // eliminamos el vídeo anterior.

    if (

      ejercicioSeleccionado !==

      ejercicio

    ) {

      limpiarVideoSeleccionado();

    }

    setEjercicioSeleccionado(

      ejercicio

    );

    // Consideramos la selección

    // de ejercicio como una nueva sesión.

    setReinicioAnalisis(

      function (

        valorAnterior

      ) {

        return (

          valorAnterior +

          1

        );

      }

    );

    console.log(

      "Ejercicio seleccionado:",

      ejercicio

    );

  }

  // ==================================================

  // SELECCIONAR LADO

  // ==================================================

  function seleccionarLado(

    lado: Lado

  ) {

    if (

      ladoSeleccionado ===

      lado

    ) {

      return;

    }

    setLadoSeleccionado(

      lado

    );

    // Cambiar de lado implica

    // iniciar una sesión nueva.

    setReinicioAnalisis(

      function (

        valorAnterior

      ) {

        return (

          valorAnterior +

          1

        );

      }

    );

    console.log(

      "Lado seleccionado:",

      lado

    );

  }

  // ==================================================

  // REINICIAR ANÁLISIS

  // ==================================================

  function reiniciarAnalisisActual() {

    // Solo cambiamos este contador.

    //

    // En cámara:

    // se reinicia la lógica

    // sin destruir el componente.

    //

    // En vídeo:

    // la key cambia y React

    // crea una sesión nueva.

    setReinicioAnalisis(

      function (

        valorAnterior

      ) {

        return (

          valorAnterior +

          1

        );

      }

    );

    console.log(

      "Análisis reiniciado"

    );

  }

  // ==================================================

  // MOSTRAR / OCULTAR MÉTRICAS

  // ==================================================

  function alternarMetricasRendimiento() {

    setMostrarMetricasRendimiento(

      function (

        valorAnterior

      ) {

        return (

          !valorAnterior

        );

      }

    );

  }

  // ==================================================

  // ENCENDER / APAGAR CÁMARA

  // ==================================================

  function cambiarCamara() {

    setMostrarCamara(

      function (

        valorAnterior

      ) {

        return (

          !valorAnterior

        );

      }

    );

  }

  // ==================================================

  // ABRIR SELECTOR DE VÍDEO

  // ==================================================

  function abrirSelectorVideo() {

    if (

      ejercicioSeleccionado ===

      null

    ) {

      return;

    }

    if (

      inputVideoRef.current

    ) {

      // Permitimos seleccionar

      // de nuevo el mismo archivo.

      inputVideoRef.current.value =

        "";

      inputVideoRef.current.click();

    }

  }

  // ==================================================

  // SELECCIONAR VÍDEO

  // ==================================================

  function seleccionarVideo(

    evento:

      ChangeEvent<HTMLInputElement>

  ) {

    const archivo =

      evento.target.files?.[0];

    // Si el usuario cancela,

    // no hacemos nada.

    if (

      !archivo

    ) {

      return;

    }

    // Comprobamos que sea

    // realmente un vídeo.

    if (

      !archivo.type.startsWith(

        "video/"

      )

    ) {

      console.error(

        "El archivo seleccionado no es un vídeo"

      );

      return;

    }

    // Liberamos una URL anterior.

    if (

      urlVideoRef.current !==

      null

    ) {

      URL.revokeObjectURL(

        urlVideoRef.current

      );

    }

    // Creamos una URL local

    // para reproducir el archivo.

    const nuevaUrl =

      URL.createObjectURL(

        archivo

      );

    urlVideoRef.current =

      nuevaUrl;

    setUrlVideo(

      nuevaUrl

    );

    setNombreVideo(

      archivo.name

    );

    // Un vídeo recién seleccionado empieza

    // con las métricas ocultas.

    setMostrarMetricasRendimiento(

      false

    );

    // Cuando seleccionamos vídeo,

    // apagamos la cámara.

    setMostrarCamara(

      false

    );

    // El vídeo nuevo comienza

    // una sesión nueva.

    setReinicioAnalisis(

      function (

        valorAnterior

      ) {

        return (

          valorAnterior +

          1

        );

      }

    );

    console.log(

      "Vídeo seleccionado:",

      archivo.name

    );

  }

  // ==================================================

  // LIMPIEZA DE LA APLICACIÓN

  // ==================================================

  useEffect(function () {

    return function limpiarAplicacion() {

      if (

        urlVideoRef.current !==

        null

      ) {

        URL.revokeObjectURL(

          urlVideoRef.current

        );

        urlVideoRef.current =

          null;

      }

    };

  }, []);

  // ==================================================

  // INTERFAZ

  // ==================================================

  return (

    <main>

      <div className="vision-fit-page">

        <div className="vision-fit-content">

      {/* ==============================================

          CABECERA

          ============================================== */}

      <div className="vision-fit-header">

        <div className="vision-fit-hero-copy">

          <p className="vision-fit-kicker">

            ANÁLISIS DE MOVIMIENTO

          </p>

          <h1>

            VISIÓN FIT

          </h1>

          <p className="vision-fit-hero-description">

            Selecciona un ejercicio y recibe feedback visual sobre tu movimiento

            mientras entrenas.

          </p>

        </div>

        {/* Los tutoriales están siempre visibles, antes de elegir un ejercicio. */}

        <section className="exercise-selector tutorial-selector" aria-labelledby="tutoriales-heading">

          <div className="selector-heading">

            <div>

              <h2 id="tutoriales-heading">Tutoriales de uso</h2>

              <p>Aprende a usar Visión Fit en tu ordenador o móvil.</p>

            </div>

          </div>

          <div className="tutorial-actions">

            <button

              type="button"

              className="tutorial-button"

              aria-haspopup="dialog"

              onClick={function () {

                setTutorialAbierto("ordenador");

              }}

            >

              <span className="tutorial-button-icon" aria-hidden="true">▷</span>

              Tutorial para ordenador

            </button>

            <button

              type="button"

              className="tutorial-button"

              aria-haspopup="dialog"

              onClick={function () {

                setTutorialAbierto("movil");

              }}

            >

              <span className="tutorial-button-icon" aria-hidden="true">▷</span>

              Tutorial para móvil

            </button>

          </div>

        </section>

        {/* ============================================

            SELECTOR DE EJERCICIO

            ============================================ */}

        <section className="exercise-selector exercise-selector-main">

          <div className="selector-heading">

            <div>

              <h2>

                Elige el ejercicio

              </h2>

              <p>

                Selecciona qué movimiento quieres analizar.

              </p>

            </div>

            <span className="selector-state">

              {ejercicioSeleccionado === null ? "Pendiente" : "Seleccionado"}

            </span>

          </div>

          <div className="exercise-buttons">

            {EJERCICIOS.map(

              function (ejercicio) {

                const seleccionado =

                  ejercicio.id ===

                  ejercicioSeleccionado;

                return (

                  <button

                    key={

                      ejercicio.id

                    }

                    type="button"

                    disabled={

                      !ejercicio.disponible

                    }

                    onClick={

                      function () {

                        seleccionarEjercicio(

                          ejercicio.id

                        );

                      }

                    }

                    className={

                      "exercise-button exercise-" +

                      ejercicio.id +

                      (seleccionado

                        ? " exercise-button-active"

                        : "")

                    }

                  >

                    <span className="exercise-button-icon" aria-hidden="true">

                      {obtenerIconoEjercicio(ejercicio.id)}

                    </span>

                    <span className="exercise-button-copy">

                      <strong>

                        {ejercicio.nombre}

                      </strong>

                      <small>

                        {ejercicio.disponible

                          ? obtenerDescripcionEjercicio(ejercicio.id)

                          : "Disponible próximamente"}

                      </small>

                    </span>

                    <span className="exercise-button-arrow" aria-hidden="true">

                      →

                    </span>

                    {!ejercicio.disponible ? (

                      <span className="exercise-button-badge">

                        Próximamente

                      </span>

                    ) : null}

                  </button>

                );

              }

            )}

          </div>

        </section>

        {/* ============================================

            SELECTOR DE LADO

            ============================================ */}

        {mostrarSelectorLado ? (

          <section className="exercise-selector side-selector">

            <div className="selector-heading selector-heading-compact">

              <div>

                <h2>

                  Elige el lado

                </h2>

                <p>

                  Indica qué lado debe seguir la cámara.

                </p>

              </div>

              <span className="selector-state">

                {ladoSeleccionado === "derecho" ? "Derecho" : "Izquierdo"}

              </span>

            </div>

            <div className="exercise-buttons side-buttons">

              <button

                type="button"

                onClick={

                  function () {

                    seleccionarLado(

                      "izquierdo"

                    );

                  }

                }

                className={

                  ladoSeleccionado === "izquierdo"

                    ? "exercise-button side-button exercise-button-active"

                    : "exercise-button side-button"

                }

              >

                <span className="side-button-icon" aria-hidden="true">←</span>

                Izquierdo

              </button>

              <button

                type="button"

                onClick={

                  function () {

                    seleccionarLado(

                      "derecho"

                    );

                  }

                }

                className={

                  ladoSeleccionado === "derecho"

                    ? "exercise-button side-button exercise-button-active"

                    : "exercise-button side-button"

                }

              >

                <span className="side-button-icon" aria-hidden="true">→</span>

                Derecho

              </button>

            </div>

          </section>

        ) : null}

        {/* ============================================

            FUENTE DE ANÁLISIS

            ============================================ */}

        {ejercicioSeleccionado !==

        null ? (

          <section className="analysis-source-selector">

            <div className="selector-heading selector-heading-compact">

              <div>

                <h2>

                  Configura el análisis

                </h2>

                <p>

                  Elige una fuente para empezar la sesión.

                </p>

              </div>

              <span className="selector-state">

                {hayAnalisis ? "Sesión activa" : "Listo para empezar"}

              </span>

            </div>

            <div className="analysis-source-buttons">

              {/* ======================================

                  CÁMARA

                  ====================================== */}

              <button

                type="button"

                className={

                  mostrarCamara

                    ? "source-button source-button-active"

                    : "source-button"

                }

                onClick={

                  cambiarCamara

                }

              >

                <span className="source-button-icon" aria-hidden="true">◉</span>

                <span className="source-button-copy">

                  <strong>{mostrarCamara ? "Cámara activa" : "Usar cámara"}</strong>

                  <small>Analiza el movimiento en directo</small>

                </span>

                <span className="source-button-arrow" aria-hidden="true">→</span>

              </button>

              {/* ======================================

                  VÍDEO

                  ====================================== */}

              <button

                type="button"

                className={

                  urlVideo !== null

                    ? "source-button source-button-active"

                    : "source-button"

                }

                onClick={

                  abrirSelectorVideo

                }

              >

                <span className="source-button-icon" aria-hidden="true">▶</span>

                <span className="source-button-copy">

                  <strong>Subir un vídeo</strong>

                  <small>Analiza una grabación guardada</small>

                </span>

                <span className="source-button-arrow" aria-hidden="true">→</span>

              </button>

              {/* ======================================

                  REINICIAR

                  ====================================== */}

              {hayAnalisis ? (

                <button

                  type="button"

                  className="source-button source-button-secondary"

                  onClick={

                    reiniciarAnalisisActual

                  }

                >

                  <span className="source-button-icon" aria-hidden="true">↻</span>

                  <span className="source-button-copy">

                    <strong>Reiniciar análisis</strong>

                    <small>Comenzar una sesión nueva</small>

                  </span>

                </button>

              ) : null}

              {/* ======================================

                  MÉTRICAS DE PRUEBA

                  ====================================== */}

              {mostrarBotonMetricas ? (

                <button

                  type="button"

                  onClick={

                    alternarMetricasRendimiento

                  }

                  aria-pressed={

                    mostrarMetricasRendimiento

                  }

                >

                  {mostrarMetricasRendimiento

                    ? "Ocultar métricas"

                    : "Mostrar métricas"}

                </button>

              ) : null}

            </div>

          </section>

        ) : null}

      </div>

      {/* ==============================================

          INPUT OCULTO DE VÍDEO

          ============================================== */}

      <input

        ref={

          inputVideoRef

        }

        type="file"

        accept="video/*"

        onChange={

          seleccionarVideo

        }

        style={{

          display:

            "none"

        }}

      />

      {/* ==============================================

          CÁMARA

          ==============================================

          Importante:

          reinicioAnalisis NO está dentro

          de la key de CameraPreview.

          Así podemos reiniciar los datos

          sin apagar ni volver a crear

          la cámara.

          ============================================== */}

      {mostrarCamara &&

      ejercicioSeleccionado !==

        null ? (

        <CameraPreview

          key={

            ejercicioSeleccionado +

            "-" +

            ladoSeleccionado

          }

          ejercicio={

            ejercicioSeleccionado

          }

          lado={

            ladoSeleccionado

          }

          reinicioId={

            reinicioAnalisis

          }

        />

      ) : null}

      {/* ==============================================

          VÍDEO

          ==============================================

          En vídeo sí añadimos

          reinicioAnalisis a la key.

          De esta manera React crea

          una sesión completamente nueva.

          ============================================== */}

      {urlVideo !==

        null &&

      ejercicioSeleccionado !==

        null ? (

        <VideoPreview

          key={

            ejercicioSeleccionado +

            "-" +

            ladoSeleccionado +

            "-" +

            urlVideo +

            "-" +

            reinicioAnalisis

          }

          ejercicio={

            ejercicioSeleccionado

          }

          lado={

            ladoSeleccionado

          }

          urlVideo={

            urlVideo

          }

          nombreVideo={

            nombreVideo

          }

          visible={

            !mostrarCamara

          }

          mostrarMetricasRendimiento={

            MOSTRAR_BOTON_METRICAS_RENDIMIENTO &&

            mostrarMetricasRendimiento

          }

        />

      ) : null}

        </div>

      </div>

      {tutorialAbierto !== null ? (

        <div className="tutorial-overlay">

          <div

            className="tutorial-modal"

            role="dialog"

            aria-modal="true"

            aria-labelledby="tutorial-title"

          >

            <div className="tutorial-modal-header">

              <h2 id="tutorial-title">

                Tutorial para {tutorialAbierto === "ordenador" ? "ordenador" : "móvil"}

              </h2>

              <button

                type="button"

                className="tutorial-close"

                aria-label="Cerrar tutorial"

                onClick={function () {

                  setTutorialAbierto(null);

                }}

              >

                ×

              </button>

            </div>

            <video

              className="tutorial-video"

              controls

              autoPlay

              playsInline

              src={
                import.meta.env.BASE_URL +
                "tutoriales/" +
                (tutorialAbierto === "ordenador" ? "TO.mp4" : "TM.mp4")
              }

            >

              Tu navegador no puede reproducir este vídeo.

            </video>

          </div>

        </div>

      ) : null}

    </main>

  );

}

export default App;
