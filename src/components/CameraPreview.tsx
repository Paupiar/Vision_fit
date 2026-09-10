// Importamos los hooks necesarios de React.
import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

// Tipo del detector de MediaPipe.
import type {
  PoseLandmarker
} from "@mediapipe/tasks-vision";


// --------------------------------------------------
// MEDIAPIPE
// --------------------------------------------------

import {
  crearPoseLandmarker
} from "../mediapipe/pose";


// --------------------------------------------------
// GESTIÓN DE ERRORES
// --------------------------------------------------

import {
  obtenerMensajeErrorCamara,
  obtenerMensajeErrorMediaPipe
} from "../mediapipe/errores";


// --------------------------------------------------
// UTILIDADES DE DIBUJO
// --------------------------------------------------

import {
  convertirAPixeles,
  dibujarConexion,
  dibujarLandmark,
  esLandmarkValido
} from "../mediapipe/dibujo";


// --------------------------------------------------
// LANDMARKS
// --------------------------------------------------

import {
  LANDMARKS_CURL,
  LANDMARKS_SENTADILLA,
  LANDMARKS_PRESS_HOMBRO
} from "../ejercicios/landmarks";

import type {
  Lado
} from "../ejercicios/landmarks";


// --------------------------------------------------
// CURL
// --------------------------------------------------

import {
  analizarFrameCurl,
  calcularResumenSesion,
  crearEstadoCurl,
  DESPLAZAMIENTO_MAXIMO_CODO,
  DESPLAZAMIENTO_MAXIMO_HOMBRO
} from "../ejercicios/curl";

import type {
  FaseCurl,
  Punto,
  ResultadoRepeticion
} from "../ejercicios/curl";


// --------------------------------------------------
// SENTADILLA
// --------------------------------------------------

import {
  analizarSentadilla,
  calcularResumenSesionSentadilla,
  crearEstadoSentadilla
} from "../ejercicios/sentadilla";

import type {
  FaseSentadilla,
  PuntoSentadilla,
  ResultadoRepeticionSentadilla
} from "../ejercicios/sentadilla";


// --------------------------------------------------
// PRESS DE HOMBRO
// --------------------------------------------------

import {
  analizarPressHombro,
  calcularResumenSesionPress,
  crearEstadoPressHombro
} from "../ejercicios/pressHombro";

import type {
  FasePressHombro,
  PuntoPressHombro,
  ResultadoRepeticionPress
} from "../ejercicios/pressHombro";


// --------------------------------------------------
// EJERCICIOS
// --------------------------------------------------

import type {
  EjercicioId
} from "../ejercicios/tipos";


// ==================================================
// MENSAJE DE ERROR DEL SISTEMA
// ==================================================

interface MensajeErrorSistemaProps {
  mensaje: string;
}


function MensajeErrorSistema(
  props: MensajeErrorSistemaProps
) {
  return (
    <div className="system-error-screen">

      <div className="system-error-content">

        <div className="system-error-icon">
          ⚠
        </div>


        <h1>
          No se puede iniciar el análisis
        </h1>


        <p>
          {props.mensaje}
        </p>

      </div>

    </div>
  );
}


// ==================================================
// CURL
// ==================================================

interface CurlCameraPreviewProps {
  lado: Lado;

  reinicioId: number;
}


type EstadoPreparacionAnalisis =
  "preparacion" |
  "cuenta-atras" |
  "analizando";


function CurlCameraPreview(
  props: CurlCameraPreviewProps
) {
  const landmarksCurl =
    LANDMARKS_CURL[
      props.lado
    ];


  // ==================================================
  // REFERENCIAS
  // ==================================================

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );


  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );


  const poseLandmarkerRef =
    useRef<PoseLandmarker | null>(
      null
    );


  const animationFrameRef =
    useRef<number | null>(
      null
    );


  const estadoCurlRef =
    useRef(
      crearEstadoCurl()
    );


  const verdeHastaRef =
    useRef<number>(
      0
    );


  const ultimaActualizacionUIRef =
    useRef<number>(
      0
    );


  // Indica si la lógica del curl puede
  // modificar repeticiones, fase e historial.
  //
  // MediaPipe seguirá detectando y dibujando
  // landmarks aunque este valor sea false.
  const analisisActivoRef =
    useRef<boolean>(
      false
    );


  // Guardamos aquí el intervalo utilizado
  // para la cuenta atrás 3 - 2 - 1.
  const intervaloCuentaAtrasRef =
    useRef<number | null>(
      null
    );


  // ==================================================
  // ESTADOS
  // ==================================================

  const [
    repeticiones,
    setRepeticiones
  ] =
    useState<number>(
      0
    );


  const [
    anguloActual,
    setAnguloActual
  ] =
    useState<number>(
      0
    );


  const [
    faseActual,
    setFaseActual
  ] =
    useState<FaseCurl>(
      "abajo"
    );


  const [
    feedback,
    setFeedback
  ] =
    useState<string>(
      "Colócate frente a la cámara"
    );


  const [
    feedbackCodo,
    setFeedbackCodo
  ] =
    useState<string>(
      "Extiende el brazo para calibrar el codo"
    );


  const [
    feedbackHombro,
    setFeedbackHombro
  ] =
    useState<string>(
      "Extiende el brazo para calibrar el tronco"
    );


  const [
    desplazamientoCodo,
    setDesplazamientoCodo
  ] =
    useState<number | null>(
      null
    );


  const [
    desplazamientoHombro,
    setDesplazamientoHombro
  ] =
    useState<number | null>(
      null
    );


  const [
    historial,
    setHistorial
  ] =
    useState<
      ResultadoRepeticion[]
    >(
      []
    );


  const [
    errorSistema,
    setErrorSistema
  ] =
    useState<string | null>(
      null
    );


  const [
    estadoPreparacion,
    setEstadoPreparacion
  ] =
    useState<EstadoPreparacionAnalisis>(
      "preparacion"
    );


  const [
    cuentaAtras,
    setCuentaAtras
  ] =
    useState<number | null>(
      null
    );


  // ==================================================
  // RESUMEN
  // ==================================================

  const resumenSesion =
    calcularResumenSesion(
      historial
    );


  // ==================================================
  // REINICIAR SESIÓN
  // ==================================================

  useEffect(
    function () {
      // Reiniciamos inmediatamente
      // el estado interno que no provoca
      // un render de React.
      estadoCurlRef.current =
        crearEstadoCurl();


      verdeHastaRef.current =
        0;


      ultimaActualizacionUIRef.current =
        0;


      // Al reiniciar una sesión, la lógica
      // de conteo vuelve a quedar bloqueada.
      analisisActivoRef.current =
        false;


      // Si el usuario reinicia mientras está
      // en la cuenta atrás, la cancelamos.
      if (
        intervaloCuentaAtrasRef.current !==
        null
      ) {
        window.clearInterval(
          intervaloCuentaAtrasRef.current
        );


        intervaloCuentaAtrasRef.current =
          null;
      }


      // Los estados de React se reinician
      // de forma asíncrona.
      //
      // Así evitamos realizar varios setState()
      // de forma síncrona dentro del efecto,
      // que es lo que marca ESLint con
      // react-hooks/set-state-in-effect.
      const temporizadorReinicio =
        window.setTimeout(
          function () {
            setRepeticiones(
              0
            );


            setAnguloActual(
              0
            );


            setFaseActual(
              "abajo"
            );


            setFeedback(
              "Colócate frente a la cámara"
            );


            setFeedbackCodo(
              "Extiende el brazo para calibrar el codo"
            );


            setFeedbackHombro(
              "Extiende el brazo para calibrar el tronco"
            );


            setDesplazamientoCodo(
              null
            );


            setDesplazamientoHombro(
              null
            );


            setHistorial(
              []
            );


            // La interfaz vuelve a la pantalla
            // de preparación sin apagar la cámara.
            setEstadoPreparacion(
              "preparacion"
            );


            setCuentaAtras(
              null
            );
          },
          0
        );


      return function cancelarReinicioPendiente() {
        window.clearTimeout(
          temporizadorReinicio
        );
      };

    },
    [
      props.reinicioId
    ]
  );


  // ==================================================
  // FEEDBACK VERDE
  // ==================================================

  const activarFeedbackVerde =
    useCallback(
      function activarFeedbackVerdeCallback() {
    verdeHastaRef.current =
      performance.now() +
      300;
      },
      []
    );


  // ==================================================
  // DIBUJAR BRAZO
  // ==================================================

  const dibujarBrazo =
    useCallback(
      function dibujarBrazoCallback(
    contexto:
      CanvasRenderingContext2D,
    hombro:
      Punto,
    codo:
      Punto,
    muneca:
      Punto
  ) {
    const verdeActivo =
      performance.now() <
      verdeHastaRef.current;


    dibujarConexion(
      contexto,
      hombro,
      codo,
      verdeActivo
    );


    dibujarConexion(
      contexto,
      codo,
      muneca,
      verdeActivo
    );


    dibujarLandmark(
      contexto,
      hombro,
      verdeActivo
    );


    dibujarLandmark(
      contexto,
      codo,
      verdeActivo
    );


    dibujarLandmark(
      contexto,
      muneca,
      verdeActivo
    );
      },
      []
    );


  // ==================================================
  // ANALIZAR FRAME
  // ==================================================

  const analizarFrame =
    useCallback(
      function analizarFrameCallback(
    timestamp: number
  ) {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !poseLandmarkerRef.current
    ) {
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrameCallback
        );


      return;
    }


    const video =
      videoRef.current;


    const canvas =
      canvasRef.current;


    const poseLandmarker =
      poseLandmarkerRef.current;


    if (
      video.readyState <
      2
    ) {
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrameCallback
        );


      return;
    }


    if (
      canvas.width !==
        video.videoWidth ||
      canvas.height !==
        video.videoHeight
    ) {
      canvas.width =
        video.videoWidth;


      canvas.height =
        video.videoHeight;
    }


    const contexto =
      canvas.getContext(
        "2d"
      );


    if (
      !contexto
    ) {
      return;
    }


    contexto.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    try {
      const resultado =
        poseLandmarker.detectForVideo(
          video,
          timestamp
        );


      if (
        resultado.landmarks.length >
        0
      ) {
        const landmarks =
          resultado.landmarks[0];


        const hombroNormalizado =
          landmarks[
            landmarksCurl.hombro
          ];


        const codoNormalizado =
          landmarks[
            landmarksCurl.codo
          ];


        const munecaNormalizada =
          landmarks[
            landmarksCurl.muneca
          ];


        const caderaNormalizada =
          landmarks[
            landmarksCurl.cadera
          ];


        if (
          hombroNormalizado &&
          codoNormalizado &&
          munecaNormalizada &&
          esLandmarkValido(
            hombroNormalizado
          ) &&
          esLandmarkValido(
            codoNormalizado
          ) &&
          esLandmarkValido(
            munecaNormalizada
          )
        ) {
          const hombro =
            convertirAPixeles(
              hombroNormalizado,
              canvas
            );


          const codo =
            convertirAPixeles(
              codoNormalizado,
              canvas
            );


          const muneca =
            convertirAPixeles(
              munecaNormalizada,
              canvas
            );


          let cadera:
            Punto | null =
            null;


          if (
            caderaNormalizada &&
            esLandmarkValido(
              caderaNormalizada
            )
          ) {
            cadera =
              convertirAPixeles(
                caderaNormalizada,
                canvas
              );
          }


          // Durante la preparación seguimos detectando
          // y dibujando el brazo, pero NO dejamos que
          // analizarFrameCurl modifique la sesión.
          if (
            analisisActivoRef.current
          ) {
            const analisis =
              analizarFrameCurl(
                estadoCurlRef.current,
                hombro,
                codo,
                muneca,
                cadera
              );


            if (
              analisis.cambioFase
            ) {
            activarFeedbackVerde();


            setFaseActual(
              analisis.fase
            );
          }


          if (
            analisis.repeticionSumada
          ) {
            setRepeticiones(
              estadoCurlRef.current
                .repeticiones
            );
          }


          if (
            analisis.repeticionFinalizada !==
            null
          ) {
            const repeticionFinalizada =
              analisis
                .repeticionFinalizada;


            setHistorial(
              function (
                historialAnterior
              ) {
                return [
                  ...historialAnterior,
                  repeticionFinalizada
                ];
              }
            );
          }


          if (
            timestamp -
              ultimaActualizacionUIRef
                .current >=
            100
          ) {
            setAnguloActual(
              Math.round(
                analisis.anguloCodo
              )
            );


            setFaseActual(
              analisis.fase
            );


            setFeedback(
              analisis
                .feedbackMovimiento
            );


            setFeedbackCodo(
              analisis
                .feedbackCodo
            );


            setFeedbackHombro(
              analisis
                .feedbackHombro
            );


            if (
              analisis
                .desplazamientoCodo !==
              null
            ) {
              setDesplazamientoCodo(
                Math.round(
                  analisis
                    .desplazamientoCodo *
                  100
                )
              );

            } else {
              setDesplazamientoCodo(
                null
              );
            }


            if (
              analisis
                .desplazamientoHombro !==
              null
            ) {
              setDesplazamientoHombro(
                Math.round(
                  analisis
                    .desplazamientoHombro *
                  100
                )
              );

            } else {
              setDesplazamientoHombro(
                null
              );
            }


              ultimaActualizacionUIRef
                .current =
                timestamp;
            }
          }


          // El brazo se dibuja siempre, incluso
          // durante la preparación y la cuenta atrás.
          dibujarBrazo(
            contexto,
            hombro,
            codo,
            muneca
          );
        }
      }

    } catch (error) {
      console.error(
        "Error analizando curl:",
        error
      );
    }


    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrameCallback
      );
      },
      [
        activarFeedbackVerde,
        dibujarBrazo,
        landmarksCurl
      ]
    );



  const iniciarAnalisis =
    useCallback(
      function iniciarAnalisisCallback() {
    if (
      !poseLandmarkerRef.current
    ) {
      return;
    }


    if (
      animationFrameRef.current !==
      null
    ) {
      cancelAnimationFrame(
        animationFrameRef.current
      );
    }


    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrame
      );
      },
      [
        analizarFrame
      ]
    );



  function videoPreparado() {
    iniciarAnalisis();
  }


  // ==================================================
  // PREPARACIÓN DEL CURL
  // ==================================================

  function empezarAnalisisCurl() {
    // Evitamos lanzar dos cuentas atrás
    // si el usuario pulsa varias veces.
    if (
      estadoPreparacion !==
      "preparacion"
    ) {
      return;
    }


    // Por seguridad, cancelamos cualquier
    // intervalo anterior que pudiera quedar vivo.
    if (
      intervaloCuentaAtrasRef.current !==
      null
    ) {
      window.clearInterval(
        intervaloCuentaAtrasRef.current
      );


      intervaloCuentaAtrasRef.current =
        null;
    }


    analisisActivoRef.current =
      false;


    setEstadoPreparacion(
      "cuenta-atras"
    );


    setCuentaAtras(
      3
    );


    let valorCuentaAtras =
      3;


    intervaloCuentaAtrasRef.current =
      window.setInterval(
        function () {
          valorCuentaAtras -=
            1;


          if (
            valorCuentaAtras >
            0
          ) {
            setCuentaAtras(
              valorCuentaAtras
            );


            return;
          }


          // La cuenta atrás ha terminado.
          if (
            intervaloCuentaAtrasRef.current !==
            null
          ) {
            window.clearInterval(
              intervaloCuentaAtrasRef.current
            );


            intervaloCuentaAtrasRef.current =
              null;
          }


          // Empezamos la sesión desde un estado
          // limpio justo cuando termina el 3 - 2 - 1.
          estadoCurlRef.current =
            crearEstadoCurl();


          verdeHastaRef.current =
            0;


          ultimaActualizacionUIRef.current =
            0;


          analisisActivoRef.current =
            true;


          setCuentaAtras(
            null
          );


          setEstadoPreparacion(
            "analizando"
          );
        },
        1000
      );
  }



  // ==================================================
  // CÁMARA Y MEDIAPIPE
  // ==================================================

  useEffect(function () {
    let stream:
      MediaStream | null =
      null;


    let componenteActivo =
      true;


    // Guardamos la referencia actual
    // del elemento de vídeo.
    //
    // La utilizaremos también en el cleanup
    // para evitar el aviso de ESLint
    // sobre el uso de ref.current.
    const videoActual =
      videoRef.current;


    async function iniciarSistema() {
      // El estado de error ya comienza en null.
      // No hacemos setState síncrono al arrancar
      // el efecto para evitar renders innecesarios.
      let nuevoStream:
        MediaStream;


      try {
        nuevoStream =
          await navigator.mediaDevices.getUserMedia({
            video:
              true,

            audio:
              false
          });

      } catch (error) {
        console.error(
          "Error al iniciar la cámara del curl:",
          error
        );


        if (
          componenteActivo
        ) {
          setErrorSistema(
            obtenerMensajeErrorCamara(
              error
            )
          );
        }


        return;
      }


      if (
        !componenteActivo
      ) {
        nuevoStream
          .getTracks()
          .forEach(
            function (track) {
              track.stop();
            }
          );


        return;
      }


      stream =
        nuevoStream;


      if (
        videoRef.current
      ) {
        videoRef.current.srcObject =
          stream;
      }


      try {
        const poseLandmarker =
          await crearPoseLandmarker();


        if (
          !componenteActivo
        ) {
          return;
        }


        poseLandmarkerRef.current =
          poseLandmarker;


        setErrorSistema(
          null
        );


        if (
          videoRef.current &&
          videoRef.current.readyState >=
            2
        ) {
          iniciarAnalisis();
        }

      } catch (error) {
        if (
          stream
        ) {
          stream
            .getTracks()
            .forEach(
              function (track) {
                track.stop();
              }
            );


          stream =
            null;
        }


        if (
          videoRef.current
        ) {
          videoRef.current.srcObject =
            null;
        }


        if (
          componenteActivo
        ) {
          setErrorSistema(
            obtenerMensajeErrorMediaPipe(
              error
            )
          );
        }
      }
    }


    iniciarSistema();


    return function detenerSistema() {
      componenteActivo =
        false;


      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );


        animationFrameRef.current =
          null;
      }


      // Si el componente se desmonta durante
      // la cuenta atrás, cancelamos el intervalo.
      if (
        intervaloCuentaAtrasRef.current !==
        null
      ) {
        window.clearInterval(
          intervaloCuentaAtrasRef.current
        );


        intervaloCuentaAtrasRef.current =
          null;
      }


      if (
        stream
      ) {
        stream
          .getTracks()
          .forEach(
            function (track) {
              track.stop();
            }
          );
      }


      // Utilizamos la referencia guardada
      // al crear el efecto.
      //
      // Así el cleanup no depende de
      // un posible valor diferente de
      // videoRef.current.
      if (
        videoActual
      ) {
        videoActual.srcObject =
          null;
      }
    };
  }, [iniciarAnalisis]);


  if (
    errorSistema !==
    null
  ) {
    return (
      <MensajeErrorSistema
        mensaje={
          errorSistema
        }
      />
    );
  }


  // ==================================================
  // INTERFAZ CURL
  // ==================================================

  return (
    <div className="vision-fit-layout">

      <div className="vision-fit-camera-column">

        <div className="camera-container">

          <video
            ref={
              videoRef
            }

            autoPlay

            playsInline

            onLoadedData={
              videoPreparado
            }

            className="camera-video"
          />


          <canvas
            ref={
              canvasRef
            }

            className="camera-canvas"
          />

        </div>

      </div>


      <div className="vision-fit-data-column">

        {estadoPreparacion !==
        "analizando" ? (

          <section className="analysis-section analysis-current analysis-preparation">

            <span className="analysis-section-label">
              Preparación
            </span>


            {estadoPreparacion ===
            "preparacion" ? (

              <>

                <h2>
                  Antes de empezar
                </h2>


                <p className="analysis-preparation-intro">
                  Colócate correctamente antes de iniciar el análisis del curl.
                </p>


                <div className="analysis-preparation-list">

                  <p>
                    <strong>1.</strong>{" "}
                    Colócate de lado a la cámara.
                  </p>


                  <p>
                    <strong>2.</strong>{" "}
                    Mantén visibles hombro, codo y muñeca del brazo {props.lado}.
                  </p>


                  <p>
                    <strong>3.</strong>{" "}
                    Intenta que la cadera también sea visible para analizar el tronco.
                  </p>


                  <p>
                    <strong>4.</strong>{" "}
                    Empieza con el brazo completamente extendido.
                  </p>

                </div>


                <div className="analysis-preparation-side">

                  <span>
                    Lado seleccionado
                  </span>


                  <strong>
                    {props.lado ===
                    "derecho"
                      ? "Derecho"
                      : "Izquierdo"}
                  </strong>

                </div>


                <button
                  type="button"
                  className="analysis-start-button"
                  onClick={
                    empezarAnalisisCurl
                  }
                >
                  Empezar análisis
                </button>

              </>

            ) : (

              <div className="analysis-countdown">

                <h2>
                  Prepárate
                </h2>


                <div className="analysis-countdown-number">
                  {cuentaAtras}
                </div>


                <p>
                  Mantén el brazo extendido. El análisis comenzará al terminar la cuenta atrás.
                </p>

              </div>

            )}

          </section>

        ) : (

          <>

        {/* ==========================================
            FEEDBACK ACTUAL
            ========================================== */}

        <section className="analysis-section analysis-current">

          <div className="analysis-section-header">

            <div>

              <span className="analysis-section-label">
                Análisis en tiempo real
              </span>


              <h2>
                Feedback actual
              </h2>

            </div>


            <div className="analysis-repetition-counter">

              <span>
                Repeticiones
              </span>


              <strong>
                {repeticiones}
              </strong>

            </div>

          </div>


          <div className="analysis-metrics-grid">

            <div className="analysis-metric">

              <span>
                Fase
              </span>


              <strong>
                {faseActual}
              </strong>

            </div>


            <div className="analysis-metric">

              <span>
                Ángulo del codo
              </span>


              <strong>
                {anguloActual}°
              </strong>

            </div>

          </div>


          <div className="analysis-feedback-main">

            <span>
              Movimiento
            </span>


            <strong>
              {feedback}
            </strong>

          </div>


          <div className="analysis-technique">

            <h3>
              Técnica
            </h3>


            <div className="analysis-technique-item">

              <div>

                <strong>
                  Codo
                </strong>


                <p>
                  {feedbackCodo}
                </p>

              </div>


              <span>
                {desplazamientoCodo ===
                null
                  ? "--"
                  : desplazamientoCodo +
                    " %"}
              </span>

            </div>


            <div className="analysis-technique-item">

              <div>

                <strong>
                  Tronco
                </strong>


                <p>
                  {feedbackHombro}
                </p>

              </div>


              <span>
                {desplazamientoHombro ===
                null
                  ? "--"
                  : desplazamientoHombro +
                    " %"}
              </span>

            </div>


            <div className="analysis-limits">

              <small>
                Límite codo:{" "}
                {Math.round(
                  DESPLAZAMIENTO_MAXIMO_CODO *
                    100
                )}
                %
              </small>


              <small>
                Límite tronco:{" "}
                {Math.round(
                  DESPLAZAMIENTO_MAXIMO_HOMBRO *
                    100
                )}
                %
              </small>

            </div>

          </div>

        </section>


        {/* ==========================================
            RESUMEN
            ========================================== */}

        <section className="analysis-section">

          <span className="analysis-section-label">
            Sesión
          </span>


          <h2>
            Resumen
          </h2>


          <div className="analysis-summary-grid">

            <div className="analysis-summary-item">

              <span>
                Analizadas
              </span>


              <strong>
                {resumenSesion.total}
              </strong>

            </div>


            <div className="analysis-summary-item">

              <span>
                Correctas
              </span>


              <strong>
                {resumenSesion.correctas}
              </strong>

            </div>


            <div className="analysis-summary-item">

              <span>
                Técnica correcta
              </span>


              <strong>
                {
                  resumenSesion
                    .porcentajeCorrectas
                }
                %
              </strong>

            </div>


            <div className="analysis-summary-item">

              <span>
                Errores de codo
              </span>


              <strong>
                {resumenSesion.erroresCodo}
              </strong>

            </div>


            <div className="analysis-summary-item">

              <span>
                Balanceo tronco
              </span>


              <strong>
                {resumenSesion.erroresTronco}
              </strong>

            </div>

          </div>


          <div className="analysis-most-common-error">

            <span>
              Error más frecuente
            </span>


            <strong>
              {
                resumenSesion
                  .errorMasFrecuente
              }
            </strong>

          </div>

        </section>


        {/* ==========================================
            HISTORIAL
            ========================================== */}

        <section className="analysis-section">

          <span className="analysis-section-label">
            Detalle
          </span>


          <h2>
            Historial
          </h2>


          {historial.length ===
          0 ? (

            <p className="analysis-empty-message">
              Completa una repetición para
              empezar a generar el historial.
            </p>

          ) : (

            <div className="analysis-history">

              {historial.map(
                function (
                  repeticion
                ) {
                  return (
                    <div
                      key={
                        repeticion.numero
                      }

                      className="analysis-history-item"
                    >

                      <span className="analysis-history-number">
                        Rep{" "}
                        {
                          repeticion.numero
                        }
                      </span>


                      <strong>
                        {
                          repeticion.resultado
                        }
                      </strong>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </section>

          </>

        )}

      </div>

    </div>
  );
}


// ==================================================
// SENTADILLA
// ==================================================

interface SentadillaCameraPreviewProps {
  lado: Lado;

  reinicioId: number;
}


function SentadillaCameraPreview(
  props: SentadillaCameraPreviewProps
) {
  const landmarksSentadilla =
    LANDMARKS_SENTADILLA[
      props.lado
    ];


  // ==================================================
  // REFERENCIAS
  // ==================================================

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );


  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );


  const poseLandmarkerRef =
    useRef<PoseLandmarker | null>(
      null
    );


  const animationFrameRef =
    useRef<number | null>(
      null
    );


  const estadoSentadillaRef =
    useRef(
      crearEstadoSentadilla()
    );


  const verdeHastaRef =
    useRef<number>(
      0
    );


  // Indica si la lógica de la sentadilla
  // puede modificar la sesión.
  //
  // MediaPipe sigue detectando y dibujando
  // landmarks mientras este valor sea false.
  const analisisActivoRef =
    useRef<boolean>(
      false
    );


  // Intervalo utilizado para la
  // cuenta atrás 3 - 2 - 1.
  const intervaloCuentaAtrasRef =
    useRef<number | null>(
      null
    );


  // ==================================================
  // ESTADOS
  // ==================================================

  const [
    repeticiones,
    setRepeticiones
  ] =
    useState<number>(
      0
    );


  const [
    anguloRodilla,
    setAnguloRodilla
  ] =
    useState<number>(
      0
    );


  const [
    inclinacionTronco,
    setInclinacionTronco
  ] =
    useState<number | null>(
      null
    );


  const [
    fase,
    setFase
  ] =
    useState<FaseSentadilla>(
      "arriba"
    );


  const [
    feedback,
    setFeedback
  ] =
    useState<string>(
      "Colócate de forma que se vea la pierna completa"
    );


  const [
    feedbackTronco,
    setFeedbackTronco
  ] =
    useState<string>(
      "Esperando detección"
    );


  const [
    mensaje,
    setMensaje
  ] =
    useState<string>(
      "Esperando detección"
    );


  const [
    mensajeTronco,
    setMensajeTronco
  ] =
    useState<string>(
      "Esperando detección"
    );


  const [
    historial,
    setHistorial
  ] =
    useState<
      ResultadoRepeticionSentadilla[]
    >(
      []
    );


  const [
    errorSistema,
    setErrorSistema
  ] =
    useState<string | null>(
      null
    );


  const [
    estadoPreparacion,
    setEstadoPreparacion
  ] =
    useState<EstadoPreparacionAnalisis>(
      "preparacion"
    );


  const [
    cuentaAtras,
    setCuentaAtras
  ] =
    useState<number | null>(
      null
    );


  // ==================================================
  // RESUMEN
  // ==================================================

  const resumen =
    calcularResumenSesionSentadilla(
      historial
    );


  // ==================================================
  // REINICIAR SESIÓN
  // ==================================================

  useEffect(
    function () {
      // Reiniciamos primero
      // el estado interno del ejercicio.
      estadoSentadillaRef.current =
        crearEstadoSentadilla();


      verdeHastaRef.current =
        0;


      // Al reiniciar bloqueamos de nuevo
      // el conteo de repeticiones.
      analisisActivoRef.current =
        false;


      // Si el usuario reinicia durante
      // la cuenta atrás, la cancelamos.
      if (
        intervaloCuentaAtrasRef.current !==
        null
      ) {
        window.clearInterval(
          intervaloCuentaAtrasRef.current
        );


        intervaloCuentaAtrasRef.current =
          null;
      }


      // Posponemos los setState()
      // para no ejecutarlos de forma
      // síncrona dentro del efecto.
      const temporizadorReinicio =
        window.setTimeout(
          function () {
            setRepeticiones(
              0
            );


            setAnguloRodilla(
              0
            );


            setInclinacionTronco(
              null
            );


            setFase(
              "arriba"
            );


            setFeedback(
              "Colócate de forma que se vea la pierna completa"
            );


            setFeedbackTronco(
              "Esperando detección"
            );


            setMensaje(
              "Esperando detección"
            );


            setMensajeTronco(
              "Esperando detección"
            );


            setHistorial(
              []
            );


            // Volvemos a la pantalla
            // de preparación sin apagar la cámara.
            setEstadoPreparacion(
              "preparacion"
            );


            setCuentaAtras(
              null
            );
          },
          0
        );


      return function cancelarReinicioPendiente() {
        window.clearTimeout(
          temporizadorReinicio
        );
      };

    },
    [
      props.reinicioId
    ]
  );


  // ==================================================
  // DIBUJAR CUERPO
  // ==================================================

  const dibujarCuerpo =
    useCallback(
      function dibujarCuerpoCallback(
    contexto:
      CanvasRenderingContext2D,
    hombro:
      PuntoSentadilla | null,
    cadera:
      PuntoSentadilla,
    rodilla:
      PuntoSentadilla,
    tobillo:
      PuntoSentadilla,
    verde:
      boolean
  ) {
    if (
      hombro !==
      null
    ) {
      dibujarConexion(
        contexto,
        hombro,
        cadera,
        verde
      );


      dibujarLandmark(
        contexto,
        hombro,
        verde
      );
    }


    dibujarConexion(
      contexto,
      cadera,
      rodilla,
      verde
    );


    dibujarConexion(
      contexto,
      rodilla,
      tobillo,
      verde
    );


    dibujarLandmark(
      contexto,
      cadera,
      verde
    );


    dibujarLandmark(
      contexto,
      rodilla,
      verde
    );


    dibujarLandmark(
      contexto,
      tobillo,
      verde
    );
      },
      []
    );


  // ==================================================
  // ANALIZAR FRAME
  // ==================================================

  const analizarFrame =
    useCallback(
      function analizarFrameCallback(
    timestamp: number
  ) {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !poseLandmarkerRef.current
    ) {
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrameCallback
        );


      return;
    }


    const video =
      videoRef.current;


    const canvas =
      canvasRef.current;


    if (
      video.readyState <
      2
    ) {
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrameCallback
        );


      return;
    }


    if (
      canvas.width !==
        video.videoWidth ||
      canvas.height !==
        video.videoHeight
    ) {
      canvas.width =
        video.videoWidth;


      canvas.height =
        video.videoHeight;
    }


    const contexto =
      canvas.getContext(
        "2d"
      );


    if (
      !contexto
    ) {
      return;
    }


    contexto.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    try {
      const resultado =
        poseLandmarkerRef.current.detectForVideo(
          video,
          timestamp
        );


      if (
        resultado.landmarks.length >
        0
      ) {
        const landmarks =
          resultado.landmarks[0];


        const hombroNormalizado =
          landmarks[
            landmarksSentadilla.hombro
          ];


        const caderaNormalizada =
          landmarks[
            landmarksSentadilla.cadera
          ];


        const rodillaNormalizada =
          landmarks[
            landmarksSentadilla.rodilla
          ];


        const tobilloNormalizado =
          landmarks[
            landmarksSentadilla.tobillo
          ];


        if (
          caderaNormalizada &&
          rodillaNormalizada &&
          tobilloNormalizado &&
          esLandmarkValido(
            caderaNormalizada
          ) &&
          esLandmarkValido(
            rodillaNormalizada
          ) &&
          esLandmarkValido(
            tobilloNormalizado
          )
        ) {
          const cadera =
            convertirAPixeles(
              caderaNormalizada,
              canvas
            );


          const rodilla =
            convertirAPixeles(
              rodillaNormalizada,
              canvas
            );


          const tobillo =
            convertirAPixeles(
              tobilloNormalizado,
              canvas
            );


          let hombro:
            PuntoSentadilla | null =
            null;


          if (
            hombroNormalizado &&
            esLandmarkValido(
              hombroNormalizado
            )
          ) {
            hombro =
              convertirAPixeles(
                hombroNormalizado,
                canvas
              );
          }


          // Durante la preparación seguimos
          // detectando y dibujando el cuerpo,
          // pero no dejamos que la lógica
          // de la sentadilla modifique la sesión.
          if (
            analisisActivoRef.current
          ) {
            if (
              hombro !==
              null
            ) {
              setMensajeTronco(
                "Tronco detectado correctamente"
              );

            } else {
              setMensajeTronco(
                "Asegúrate de que se vea el hombro"
              );
            }


            const profundidadAntes =
              estadoSentadillaRef
                .current
                .profundidadAlcanzada;


            const analisis =
              analizarSentadilla(
                estadoSentadillaRef.current,
                hombro,
                cadera,
                rodilla,
                tobillo
              );


            const profundidadDespues =
              estadoSentadillaRef
                .current
                .profundidadAlcanzada;


            if (
              !profundidadAntes &&
              profundidadDespues
            ) {
              verdeHastaRef.current =
                timestamp +
                300;
            }


            if (
              analisis.repeticionSumada
            ) {
              verdeHastaRef.current =
                timestamp +
                300;
            }


            const mostrarVerde =
              timestamp <
              verdeHastaRef.current;


            setAnguloRodilla(
              Math.round(
                analisis.anguloRodilla
              )
            );


            if (
              analisis.inclinacionTronco !==
              null
            ) {
              setInclinacionTronco(
                Math.round(
                  analisis.inclinacionTronco
                )
              );

            } else {
              setInclinacionTronco(
                null
              );
            }


            setFase(
              analisis.fase
            );


            setFeedback(
              analisis.feedbackMovimiento
            );


            setFeedbackTronco(
              analisis.feedbackTronco
            );


            setMensaje(
              "Pierna detectada correctamente"
            );


            if (
              analisis.repeticionSumada
            ) {
              setRepeticiones(
                analisis.repeticiones
              );


              setHistorial(
                [
                  ...analisis.historial
                ]
              );
            }


            dibujarCuerpo(
              contexto,
              hombro,
              cadera,
              rodilla,
              tobillo,
              mostrarVerde
            );

          } else {
            // Antes de empezar solo dibujamos
            // los landmarks para facilitar
            // la colocación del usuario.
            dibujarCuerpo(
              contexto,
              hombro,
              cadera,
              rodilla,
              tobillo,
              false
            );
          }

        } else if (
          analisisActivoRef.current
        ) {
          setMensaje(
            "Asegúrate de que se vea la pierna completa"
          );
        }
      }

    } catch (error) {
      console.error(
        "Error analizando sentadilla:",
        error
      );
    }


    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrameCallback
      );
      },
      [
        dibujarCuerpo,
        landmarksSentadilla
      ]
    );



  const iniciarAnalisis =
    useCallback(
      function iniciarAnalisisCallback() {
    if (
      !poseLandmarkerRef.current
    ) {
      return;
    }


    if (
      animationFrameRef.current !==
      null
    ) {
      cancelAnimationFrame(
        animationFrameRef.current
      );
    }


    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrame
      );
      },
      [
        analizarFrame
      ]
    );



  function videoPreparado() {
    iniciarAnalisis();
  }


  // ==================================================
  // PREPARACIÓN DE LA SENTADILLA
  // ==================================================

  function empezarAnalisisSentadilla() {
    // Evitamos iniciar varias cuentas atrás
    // si el usuario pulsa repetidamente.
    if (
      estadoPreparacion !==
      "preparacion"
    ) {
      return;
    }


    if (
      intervaloCuentaAtrasRef.current !==
      null
    ) {
      window.clearInterval(
        intervaloCuentaAtrasRef.current
      );


      intervaloCuentaAtrasRef.current =
        null;
    }


    analisisActivoRef.current =
      false;


    setEstadoPreparacion(
      "cuenta-atras"
    );


    setCuentaAtras(
      3
    );


    let valorCuentaAtras =
      3;


    intervaloCuentaAtrasRef.current =
      window.setInterval(
        function () {
          valorCuentaAtras -=
            1;


          if (
            valorCuentaAtras >
            0
          ) {
            setCuentaAtras(
              valorCuentaAtras
            );


            return;
          }


          if (
            intervaloCuentaAtrasRef.current !==
            null
          ) {
            window.clearInterval(
              intervaloCuentaAtrasRef.current
            );


            intervaloCuentaAtrasRef.current =
              null;
          }


          // Empezamos con un estado limpio
          // cuando termina la cuenta atrás.
          estadoSentadillaRef.current =
            crearEstadoSentadilla();


          verdeHastaRef.current =
            0;


          analisisActivoRef.current =
            true;


          setCuentaAtras(
            null
          );


          setEstadoPreparacion(
            "analizando"
          );
        },
        1000
      );
  }


  // ==================================================
  // CÁMARA Y MEDIAPIPE
  // ==================================================

  useEffect(function () {
    let stream:
      MediaStream | null =
      null;


    let componenteActivo =
      true;


    // Guardamos la referencia actual
    // del elemento de vídeo.
    //
    // La utilizaremos también en el cleanup
    // para evitar el aviso de ESLint
    // sobre el uso de ref.current.
    const videoActual =
      videoRef.current;


    async function iniciarSistema() {
      // El estado de error ya comienza en null.
      // No hacemos setState síncrono al arrancar
      // el efecto para evitar renders innecesarios.
      let nuevoStream:
        MediaStream;


      try {
        nuevoStream =
          await navigator.mediaDevices.getUserMedia({
            video:
              true,

            audio:
              false
          });

      } catch (error) {
        console.error(
          "Error al iniciar cámara de sentadilla:",
          error
        );


        if (
          componenteActivo
        ) {
          setErrorSistema(
            obtenerMensajeErrorCamara(
              error
            )
          );
        }


        return;
      }


      if (
        !componenteActivo
      ) {
        nuevoStream
          .getTracks()
          .forEach(
            function (track) {
              track.stop();
            }
          );


        return;
      }


      stream =
        nuevoStream;


      if (
        videoRef.current
      ) {
        videoRef.current.srcObject =
          stream;
      }


      try {
        const poseLandmarker =
          await crearPoseLandmarker();


        if (
          !componenteActivo
        ) {
          return;
        }


        poseLandmarkerRef.current =
          poseLandmarker;


        setErrorSistema(
          null
        );


        if (
          videoRef.current &&
          videoRef.current.readyState >=
            2
        ) {
          iniciarAnalisis();
        }

      } catch (error) {
        if (
          stream
        ) {
          stream
            .getTracks()
            .forEach(
              function (track) {
                track.stop();
              }
            );


          stream =
            null;
        }


        if (
          videoRef.current
        ) {
          videoRef.current.srcObject =
            null;
        }


        if (
          componenteActivo
        ) {
          setErrorSistema(
            obtenerMensajeErrorMediaPipe(
              error
            )
          );
        }
      }
    }


    iniciarSistema();


    return function detenerSistema() {
      componenteActivo =
        false;


      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );


        animationFrameRef.current =
          null;
      }


      // Cancelamos también una posible
      // cuenta atrás pendiente.
      if (
        intervaloCuentaAtrasRef.current !==
        null
      ) {
        window.clearInterval(
          intervaloCuentaAtrasRef.current
        );


        intervaloCuentaAtrasRef.current =
          null;
      }


      if (
        stream
      ) {
        stream
          .getTracks()
          .forEach(
            function (track) {
              track.stop();
            }
          );
      }


      // Utilizamos la referencia guardada
      // al crear el efecto.
      //
      // Así el cleanup no depende de
      // un posible valor diferente de
      // videoRef.current.
      if (
        videoActual
      ) {
        videoActual.srcObject =
          null;
      }
    };
  }, [iniciarAnalisis]);


  if (
    errorSistema !==
    null
  ) {
    return (
      <MensajeErrorSistema
        mensaje={
          errorSistema
        }
      />
    );
  }


  // ==================================================
  // INTERFAZ SENTADILLA
  // ==================================================

  return (
    <div className="vision-fit-layout">

      <div className="vision-fit-camera-column">

        <div className="camera-container">

          <video
            ref={
              videoRef
            }

            autoPlay

            playsInline

            onLoadedData={
              videoPreparado
            }

            className="camera-video"
          />


          <canvas
            ref={
              canvasRef
            }

            className="camera-canvas"
          />

        </div>

      </div>


      <div className="vision-fit-data-column">

        {estadoPreparacion !==
        "analizando" ? (

          <section className="analysis-section analysis-current analysis-preparation">

            {estadoPreparacion ===
            "preparacion" ? (

              <>

                <span className="analysis-section-label">
                  Antes de empezar
                </span>


                <h2>
                  Preparación
                </h2>


                <p className="analysis-preparation-intro">
                  Colócate correctamente antes de iniciar el análisis de la sentadilla.
                </p>


                <div className="analysis-preparation-list">

                  <p>
                    <strong>1.</strong>{" "}
                    Colócate de lado a la cámara.
                  </p>


                  <p>
                    <strong>2.</strong>{" "}
                    Mantén visibles hombro, cadera, rodilla y tobillo del lado {props.lado}.
                  </p>


                  <p>
                    <strong>3.</strong>{" "}
                    Deja suficiente espacio para que la cámara vea el movimiento completo.
                  </p>


                  <p>
                    <strong>4.</strong>{" "}
                    Empieza de pie, con la pierna extendida.
                  </p>

                </div>


                <div className="analysis-preparation-side">

                  <span>
                    Lado seleccionado
                  </span>


                  <strong>
                    {props.lado ===
                    "derecho"
                      ? "Derecho"
                      : "Izquierdo"}
                  </strong>

                </div>


                <button
                  type="button"
                  className="analysis-start-button"
                  onClick={
                    empezarAnalisisSentadilla
                  }
                >
                  Empezar análisis
                </button>

              </>

            ) : (

              <div className="analysis-countdown">

                <h2>
                  Prepárate
                </h2>


                <div className="analysis-countdown-number">
                  {cuentaAtras}
                </div>


                <p>
                  Mantente de pie y completamente visible. El análisis comenzará al terminar la cuenta atrás.
                </p>

              </div>

            )}

          </section>

        ) : (

          <>

        {/* ==========================================
            FEEDBACK ACTUAL
            ========================================== */}

        <section className="analysis-section analysis-current">

          <div className="analysis-section-header">

            <div>

              <span className="analysis-section-label">
                Análisis en tiempo real
              </span>


              <h2>
                Feedback actual
              </h2>

            </div>


            <div className="analysis-repetition-counter">

              <span>
                Repeticiones
              </span>


              <strong>
                {repeticiones}
              </strong>

            </div>

          </div>


          {/* ========================================
              MÉTRICAS
              ======================================== */}

          <div className="analysis-metrics-grid">

            <div className="analysis-metric">

              <span>
                Fase
              </span>


              <strong>
                {fase}
              </strong>

            </div>


            <div className="analysis-metric">

              <span>
                Ángulo de rodilla
              </span>


              <strong>
                {anguloRodilla}°
              </strong>

            </div>


            <div className="analysis-metric">

              <span>
                Inclinación del tronco
              </span>


              <strong>
                {inclinacionTronco !==
                null
                  ? inclinacionTronco +
                    "°"
                  : "--"}
              </strong>

            </div>

          </div>


          {/* ========================================
              MOVIMIENTO
              ======================================== */}

          <div className="analysis-feedback-main">

            <span>
              Movimiento
            </span>


            <strong>
              {feedback}
            </strong>

          </div>


          {/* ========================================
              TÉCNICA
              ======================================== */}

          <div className="analysis-technique">

            <h3>
              Técnica
            </h3>


            <div className="analysis-technique-item">

              <div>

                <strong>
                  Pierna
                </strong>


                <p>
                  {mensaje}
                </p>

              </div>

            </div>


            <div className="analysis-technique-item">

              <div>

                <strong>
                  Tronco
                </strong>


                <p>
                  {feedbackTronco}
                </p>

              </div>


              <span>
                {inclinacionTronco !==
                null
                  ? inclinacionTronco +
                    "°"
                  : "--"}
              </span>

            </div>


            <div className="analysis-technique-item">

              <div>

                <strong>
                  Detección de tronco
                </strong>


                <p>
                  {mensajeTronco}
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ==========================================
            RESUMEN
            ========================================== */}

        <section className="analysis-section">

          <span className="analysis-section-label">
            Sesión
          </span>


          <h2>
            Resumen
          </h2>


          <div className="analysis-summary-grid">

            <div className="analysis-summary-item">

              <span>
                Analizadas
              </span>


              <strong>
                {resumen.total}
              </strong>

            </div>


            <div className="analysis-summary-item">

              <span>
                Correctas
              </span>


              <strong>
                {resumen.correctas}
              </strong>

            </div>


            <div className="analysis-summary-item">

              <span>
                Técnica correcta
              </span>


              <strong>
                {Math.round(
                  resumen
                    .porcentajeCorrectas
                )}
                %
              </strong>

            </div>


            <div className="analysis-summary-item">

              <span>
                Profundidad insuficiente
              </span>


              <strong>
                {
                  resumen
                    .profundidadInsuficiente
                }
              </strong>

            </div>


            <div className="analysis-summary-item">

              <span>
                Exceso de inclinación
              </span>


              <strong>
                {
                  resumen
                    .excesoInclinacionTronco
                }
              </strong>

            </div>

          </div>

        </section>


        {/* ==========================================
            HISTORIAL
            ========================================== */}

        <section className="analysis-section">

          <span className="analysis-section-label">
            Detalle
          </span>


          <h2>
            Historial
          </h2>


          {historial.length ===
          0 ? (

            <p className="analysis-empty-message">
              Completa una repetición para
              empezar a generar el historial.
            </p>

          ) : (

            <div className="analysis-history">

              {historial.map(
                function (
                  repeticion
                ) {
                  return (
                    <div
                      key={
                        repeticion.numero
                      }

                      className="analysis-history-item"
                    >

                      <span className="analysis-history-number">

                        Rep{" "}
                        {
                          repeticion.numero
                        }

                      </span>


                      <div>

                        <strong>
                          {
                            repeticion.resultado
                          }
                        </strong>


                        <p>
                          Rodilla mín.:{" "}
                          {Math.round(
                            repeticion
                              .anguloMinimo
                          )}
                          °
                        </p>


                        <p>
                          Tronco máx.:{" "}
                          {repeticion
                            .inclinacionTroncoMaxima !==
                          null
                            ? Math.round(
                                repeticion
                                  .inclinacionTroncoMaxima
                              ) +
                              "°"
                            : "N/D"}
                        </p>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </section>

          </>

        )}

      </div>

    </div>
  );
}


// ==================================================
// PRESS DE HOMBRO
// ==================================================

interface PressHombroCameraPreviewProps {
  reinicioId: number;
}


function PressHombroCameraPreview(
  props:
    PressHombroCameraPreviewProps
) {
  // ==================================================
  // REFERENCIAS
  // ==================================================

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );


  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );


  const poseLandmarkerRef =
    useRef<PoseLandmarker | null>(
      null
    );


  const animationFrameRef =
    useRef<number | null>(
      null
    );


  const estadoPressRef =
    useRef(
      crearEstadoPressHombro()
    );


  const verdeHastaRef =
    useRef<number>(
      0
    );


  // Indica si la lógica del press puede
  // modificar la sesión.
  //
  // MediaPipe continúa detectando y dibujando
  // los dos brazos durante la preparación.
  const analisisActivoRef =
    useRef<boolean>(
      false
    );


  // Intervalo utilizado para la
  // cuenta atrás 3 - 2 - 1.
  const intervaloCuentaAtrasRef =
    useRef<number | null>(
      null
    );


  // ==================================================
  // ESTADOS
  // ==================================================

  const [
    repeticiones,
    setRepeticiones
  ] =
    useState<number>(
      0
    );


  const [
    anguloIzquierdo,
    setAnguloIzquierdo
  ] =
    useState<number>(
      0
    );


  const [
    anguloDerecho,
    setAnguloDerecho
  ] =
    useState<number>(
      0
    );


  const [
    diferenciaAngular,
    setDiferenciaAngular
  ] =
    useState<number>(
      0
    );


  const [
    fase,
    setFase
  ] =
    useState<FasePressHombro>(
      "esperando"
    );


  const [
    feedbackMovimiento,
    setFeedbackMovimiento
  ] =
    useState<string>(
      "Coloca ambos brazos en posición baja"
    );


  const [
    feedbackSimetria,
    setFeedbackSimetria
  ] =
    useState<string>(
      "Esperando detección"
    );


  const [
    mensaje,
    setMensaje
  ] =
    useState<string>(
      "Colócate de frente y muestra los dos brazos"
    );


  const [
    historial,
    setHistorial
  ] =
    useState<
      ResultadoRepeticionPress[]
    >(
      []
    );


  const [
    errorSistema,
    setErrorSistema
  ] =
    useState<string | null>(
      null
    );


  const [
    estadoPreparacion,
    setEstadoPreparacion
  ] =
    useState<EstadoPreparacionAnalisis>(
      "preparacion"
    );


  const [
    cuentaAtras,
    setCuentaAtras
  ] =
    useState<number | null>(
      null
    );


  // ==================================================
  // RESUMEN
  // ==================================================

  const resumen =
    calcularResumenSesionPress(
      historial
    );


  // ==================================================
  // REINICIAR SESIÓN
  // ==================================================

  useEffect(
    function () {
      // Reiniciamos primero
      // el estado interno del press.
      estadoPressRef.current =
        crearEstadoPressHombro();


      verdeHastaRef.current =
        0;


      // Al reiniciar volvemos a bloquear
      // el análisis del ejercicio.
      analisisActivoRef.current =
        false;


      if (
        intervaloCuentaAtrasRef.current !==
        null
      ) {
        window.clearInterval(
          intervaloCuentaAtrasRef.current
        );


        intervaloCuentaAtrasRef.current =
          null;
      }


      // Posponemos los setState()
      // para evitar el aviso
      // react-hooks/set-state-in-effect.
      const temporizadorReinicio =
        window.setTimeout(
          function () {
            setRepeticiones(
              0
            );


            setAnguloIzquierdo(
              0
            );


            setAnguloDerecho(
              0
            );


            setDiferenciaAngular(
              0
            );


            setFase(
              "esperando"
            );


            setFeedbackMovimiento(
              "Coloca ambos brazos en posición baja"
            );


            setFeedbackSimetria(
              "Esperando detección"
            );


            setMensaje(
              "Colócate de frente y muestra los dos brazos"
            );


            setHistorial(
              []
            );


            // Volvemos a preparación sin
            // reiniciar ni apagar la webcam.
            setEstadoPreparacion(
              "preparacion"
            );


            setCuentaAtras(
              null
            );
          },
          0
        );


      return function cancelarReinicioPendiente() {
        window.clearTimeout(
          temporizadorReinicio
        );
      };

    },
    [
      props.reinicioId
    ]
  );


  // ==================================================
  // DIBUJAR BRAZO
  // ==================================================

  const dibujarBrazo =
    useCallback(
      function dibujarBrazoCallback(
    contexto:
      CanvasRenderingContext2D,
    hombro:
      PuntoPressHombro,
    codo:
      PuntoPressHombro,
    muneca:
      PuntoPressHombro,
    verde:
      boolean
  ) {
    dibujarConexion(
      contexto,
      hombro,
      codo,
      verde
    );


    dibujarConexion(
      contexto,
      codo,
      muneca,
      verde
    );


    dibujarLandmark(
      contexto,
      hombro,
      verde
    );


    dibujarLandmark(
      contexto,
      codo,
      verde
    );


    dibujarLandmark(
      contexto,
      muneca,
      verde
    );
      },
      []
    );


  // ==================================================
  // ANALIZAR FRAME
  // ==================================================

  const analizarFrame =
    useCallback(
      function analizarFrameCallback(
    timestamp: number
  ) {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !poseLandmarkerRef.current
    ) {
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrameCallback
        );


      return;
    }


    const video =
      videoRef.current;


    const canvas =
      canvasRef.current;


    if (
      video.readyState <
      2
    ) {
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrameCallback
        );


      return;
    }


    if (
      canvas.width !==
        video.videoWidth ||
      canvas.height !==
        video.videoHeight
    ) {
      canvas.width =
        video.videoWidth;


      canvas.height =
        video.videoHeight;
    }


    const contexto =
      canvas.getContext(
        "2d"
      );


    if (
      !contexto
    ) {
      return;
    }


    contexto.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    try {
      const resultado =
        poseLandmarkerRef.current.detectForVideo(
          video,
          timestamp
        );


      if (
        resultado.landmarks.length >
        0
      ) {
        const landmarks =
          resultado.landmarks[0];


        const hombroIzquierdoNormalizado =
          landmarks[
            LANDMARKS_PRESS_HOMBRO
              .izquierdo
              .hombro
          ];


        const codoIzquierdoNormalizado =
          landmarks[
            LANDMARKS_PRESS_HOMBRO
              .izquierdo
              .codo
          ];


        const munecaIzquierdaNormalizada =
          landmarks[
            LANDMARKS_PRESS_HOMBRO
              .izquierdo
              .muneca
          ];


        const hombroDerechoNormalizado =
          landmarks[
            LANDMARKS_PRESS_HOMBRO
              .derecho
              .hombro
          ];


        const codoDerechoNormalizado =
          landmarks[
            LANDMARKS_PRESS_HOMBRO
              .derecho
              .codo
          ];


        const munecaDerechaNormalizada =
          landmarks[
            LANDMARKS_PRESS_HOMBRO
              .derecho
              .muneca
          ];


        if (
          hombroIzquierdoNormalizado &&
          codoIzquierdoNormalizado &&
          munecaIzquierdaNormalizada &&
          hombroDerechoNormalizado &&
          codoDerechoNormalizado &&
          munecaDerechaNormalizada
        ) {
          const brazoIzquierdoValido =
            esLandmarkValido(
              hombroIzquierdoNormalizado
            ) &&
            esLandmarkValido(
              codoIzquierdoNormalizado
            ) &&
            esLandmarkValido(
              munecaIzquierdaNormalizada
            );


          const brazoDerechoValido =
            esLandmarkValido(
              hombroDerechoNormalizado
            ) &&
            esLandmarkValido(
              codoDerechoNormalizado
            ) &&
            esLandmarkValido(
              munecaDerechaNormalizada
            );


          if (
            brazoIzquierdoValido &&
            brazoDerechoValido
          ) {
            const hombroIzquierdo =
              convertirAPixeles(
                hombroIzquierdoNormalizado,
                canvas
              );


            const codoIzquierdo =
              convertirAPixeles(
                codoIzquierdoNormalizado,
                canvas
              );


            const munecaIzquierda =
              convertirAPixeles(
                munecaIzquierdaNormalizada,
                canvas
              );


            const hombroDerecho =
              convertirAPixeles(
                hombroDerechoNormalizado,
                canvas
              );


            const codoDerecho =
              convertirAPixeles(
                codoDerechoNormalizado,
                canvas
              );


            const munecaDerecha =
              convertirAPixeles(
                munecaDerechaNormalizada,
                canvas
              );


            // Durante la preparación dibujamos
            // ambos brazos, pero la lógica del press
            // no modifica repeticiones ni historial.
            if (
              analisisActivoRef.current
            ) {
              const analisis =
                analizarPressHombro(
                  estadoPressRef.current,

                  hombroIzquierdo,
                  codoIzquierdo,
                  munecaIzquierda,

                  hombroDerecho,
                  codoDerecho,
                  munecaDerecha
                );


              if (
                analisis.posicionBajaAlcanzada ||
                analisis.posicionAltaAlcanzada
              ) {
                verdeHastaRef.current =
                  timestamp +
                  300;
              }


              const mostrarVerde =
                timestamp <
                verdeHastaRef.current;


              setAnguloIzquierdo(
                Math.round(
                  analisis.anguloCodoIzquierdo
                )
              );


              setAnguloDerecho(
                Math.round(
                  analisis.anguloCodoDerecho
                )
              );


              setDiferenciaAngular(
                Math.round(
                  analisis.diferenciaAngular
                )
              );


              setFase(
                analisis.fase
              );


              setFeedbackMovimiento(
                analisis.feedbackMovimiento
              );


              setFeedbackSimetria(
                analisis.feedbackSimetria
              );


              setMensaje(
                "Ambos brazos detectados correctamente"
              );


              if (
                analisis.repeticionSumada
              ) {
                setRepeticiones(
                  analisis.repeticiones
                );


                setHistorial(
                  [
                    ...analisis.historial
                  ]
                );
              }


              dibujarBrazo(
                contexto,
                hombroIzquierdo,
                codoIzquierdo,
                munecaIzquierda,
                mostrarVerde
              );


              dibujarBrazo(
                contexto,
                hombroDerecho,
                codoDerecho,
                munecaDerecha,
                mostrarVerde
              );

            } else {
              dibujarBrazo(
                contexto,
                hombroIzquierdo,
                codoIzquierdo,
                munecaIzquierda,
                false
              );


              dibujarBrazo(
                contexto,
                hombroDerecho,
                codoDerecho,
                munecaDerecha,
                false
              );
            }

          } else if (
            analisisActivoRef.current
          ) {
            setMensaje(
              "Asegúrate de que se vean completamente los dos brazos"
            );
          }
        }
      }

    } catch (error) {
      console.error(
        "Error analizando press:",
        error
      );
    }


    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrameCallback
      );
      },
      [
        dibujarBrazo
      ]
    );



  const iniciarAnalisis =
    useCallback(
      function iniciarAnalisisCallback() {
    if (
      !poseLandmarkerRef.current
    ) {
      return;
    }


    if (
      animationFrameRef.current !==
      null
    ) {
      cancelAnimationFrame(
        animationFrameRef.current
      );
    }


    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrame
      );
      },
      [
        analizarFrame
      ]
    );



  function videoPreparado() {
    iniciarAnalisis();
  }


  // ==================================================
  // PREPARACIÓN DEL PRESS DE HOMBRO
  // ==================================================

  function empezarAnalisisPress() {
    if (
      estadoPreparacion !==
      "preparacion"
    ) {
      return;
    }


    if (
      intervaloCuentaAtrasRef.current !==
      null
    ) {
      window.clearInterval(
        intervaloCuentaAtrasRef.current
      );


      intervaloCuentaAtrasRef.current =
        null;
    }


    analisisActivoRef.current =
      false;


    setEstadoPreparacion(
      "cuenta-atras"
    );


    setCuentaAtras(
      3
    );


    let valorCuentaAtras =
      3;


    intervaloCuentaAtrasRef.current =
      window.setInterval(
        function () {
          valorCuentaAtras -=
            1;


          if (
            valorCuentaAtras >
            0
          ) {
            setCuentaAtras(
              valorCuentaAtras
            );


            return;
          }


          if (
            intervaloCuentaAtrasRef.current !==
            null
          ) {
            window.clearInterval(
              intervaloCuentaAtrasRef.current
            );


            intervaloCuentaAtrasRef.current =
              null;
          }


          // Reiniciamos el estado del press
          // justo antes de activar el análisis.
          estadoPressRef.current =
            crearEstadoPressHombro();


          verdeHastaRef.current =
            0;


          analisisActivoRef.current =
            true;


          setCuentaAtras(
            null
          );


          setEstadoPreparacion(
            "analizando"
          );
        },
        1000
      );
  }


  // ==================================================
  // CÁMARA Y MEDIAPIPE
  // ==================================================

  useEffect(function () {
    let stream:
      MediaStream | null =
      null;


    let componenteActivo =
      true;


    // Guardamos la referencia actual
    // del elemento de vídeo.
    //
    // La utilizaremos también en el cleanup
    // para evitar el aviso de ESLint
    // sobre el uso de ref.current.
    const videoActual =
      videoRef.current;


    async function iniciarSistema() {
      // El estado de error ya comienza en null.
      // No hacemos setState síncrono al arrancar
      // el efecto para evitar renders innecesarios.
      let nuevoStream:
        MediaStream;


      try {
        nuevoStream =
          await navigator.mediaDevices.getUserMedia({
            video:
              true,

            audio:
              false
          });

      } catch (error) {
        console.error(
          "Error al iniciar cámara del press:",
          error
        );


        if (
          componenteActivo
        ) {
          setErrorSistema(
            obtenerMensajeErrorCamara(
              error
            )
          );
        }


        return;
      }


      if (
        !componenteActivo
      ) {
        nuevoStream
          .getTracks()
          .forEach(
            function (track) {
              track.stop();
            }
          );


        return;
      }


      stream =
        nuevoStream;


      if (
        videoRef.current
      ) {
        videoRef.current.srcObject =
          stream;
      }


      try {
        const poseLandmarker =
          await crearPoseLandmarker();


        if (
          !componenteActivo
        ) {
          return;
        }


        poseLandmarkerRef.current =
          poseLandmarker;


        setErrorSistema(
          null
        );


        if (
          videoRef.current &&
          videoRef.current.readyState >=
            2
        ) {
          iniciarAnalisis();
        }

      } catch (error) {
        if (
          stream
        ) {
          stream
            .getTracks()
            .forEach(
              function (track) {
                track.stop();
              }
            );


          stream =
            null;
        }


        if (
          videoRef.current
        ) {
          videoRef.current.srcObject =
            null;
        }


        if (
          componenteActivo
        ) {
          setErrorSistema(
            obtenerMensajeErrorMediaPipe(
              error
            )
          );
        }
      }
    }


    iniciarSistema();


    return function detenerSistema() {
      componenteActivo =
        false;


      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );


        animationFrameRef.current =
          null;
      }


      // Cancelamos una cuenta atrás
      // pendiente si se desmonta el componente.
      if (
        intervaloCuentaAtrasRef.current !==
        null
      ) {
        window.clearInterval(
          intervaloCuentaAtrasRef.current
        );


        intervaloCuentaAtrasRef.current =
          null;
      }


      if (
        stream
      ) {
        stream
          .getTracks()
          .forEach(
            function (track) {
              track.stop();
            }
          );
      }


      // Utilizamos la referencia guardada
      // al crear el efecto.
      //
      // Así el cleanup no depende de
      // un posible valor diferente de
      // videoRef.current.
      if (
        videoActual
      ) {
        videoActual.srcObject =
          null;
      }
    };
  }, [iniciarAnalisis]);


  if (
    errorSistema !==
    null
  ) {
    return (
      <MensajeErrorSistema
        mensaje={
          errorSistema
        }
      />
    );
  }


  // ==================================================
  // INTERFAZ PRESS
  // ==================================================

  return (
    <div className="vision-fit-layout">

      <div className="vision-fit-camera-column">

        <div className="camera-container">

          <video
            ref={
              videoRef
            }

            autoPlay

            playsInline

            onLoadedData={
              videoPreparado
            }

            className="camera-video"
          />


          <canvas
            ref={
              canvasRef
            }

            className="camera-canvas"
          />

        </div>

      </div>


      <div className="vision-fit-data-column">

        {estadoPreparacion !==
        "analizando" ? (

          <section className="analysis-section analysis-current analysis-preparation">

            {estadoPreparacion ===
            "preparacion" ? (

              <>

                <span className="analysis-section-label">
                  Antes de empezar
                </span>


                <h2>
                  Preparación
                </h2>


                <p className="analysis-preparation-intro">
                  Colócate correctamente antes de iniciar el análisis del press de hombro.
                </p>


                <div className="analysis-preparation-list">

                  <p>
                    <strong>1.</strong>{" "}
                    Colócate de frente a la cámara.
                  </p>


                  <p>
                    <strong>2.</strong>{" "}
                    Mantén completamente visibles los dos hombros, codos y muñecas.
                  </p>


                  <p>
                    <strong>3.</strong>{" "}
                    Deja espacio por encima de la cabeza para poder extender ambos brazos.
                  </p>


                  <p>
                    <strong>4.</strong>{" "}
                    Empieza con ambos brazos en la posición baja del press.
                  </p>

                </div>


                <div className="analysis-preparation-side">

                  <span>
                    Análisis
                  </span>


                  <strong>
                    Bilateral
                  </strong>

                </div>


                <button
                  type="button"
                  className="analysis-start-button"
                  onClick={
                    empezarAnalisisPress
                  }
                >
                  Empezar análisis
                </button>

              </>

            ) : (

              <div className="analysis-countdown">

                <h2>
                  Prepárate
                </h2>


                <div className="analysis-countdown-number">
                  {cuentaAtras}
                </div>


                <p>
                  Mantén ambos brazos en posición baja. El análisis comenzará al terminar la cuenta atrás.
                </p>

              </div>

            )}

          </section>

        ) : (

          <>

        {/* ==========================================
            FEEDBACK ACTUAL
            ========================================== */}

        <section className="analysis-section analysis-current">

          <div className="analysis-section-header">

            <div>

              <span className="analysis-section-label">
                Análisis en tiempo real
              </span>


              <h2>
                Feedback actual
              </h2>

            </div>


            <div className="analysis-repetition-counter">

              <span>
                Repeticiones
              </span>


              <strong>
                {repeticiones}
              </strong>

            </div>

          </div>


          {/* ========================================
              MÉTRICAS
              ======================================== */}

          <div className="analysis-metrics-grid">

            <div className="analysis-metric">

              <span>
                Fase
              </span>


              <strong>
                {fase}
              </strong>

            </div>


            <div className="analysis-metric">

              <span>
                Ángulo izquierdo
              </span>


              <strong>
                {anguloIzquierdo}°
              </strong>

            </div>


            <div className="analysis-metric">

              <span>
                Ángulo derecho
              </span>


              <strong>
                {anguloDerecho}°
              </strong>

            </div>


            <div className="analysis-metric">

              <span>
                Diferencia
              </span>


              <strong>
                {diferenciaAngular}°
              </strong>

            </div>

          </div>


          {/* ========================================
              MOVIMIENTO
              ======================================== */}

          <div className="analysis-feedback-main">

            <span>
              Movimiento
            </span>


            <strong>
              {feedbackMovimiento}
            </strong>

          </div>


          {/* ========================================
              TÉCNICA
              ======================================== */}

          <div className="analysis-technique">

            <h3>
              Técnica
            </h3>


            <div className="analysis-technique-item">

              <div>

                <strong>
                  Simetría
                </strong>


                <p>
                  {feedbackSimetria}
                </p>

              </div>


              <span>
                {diferenciaAngular}°
              </span>

            </div>


            <div className="analysis-technique-item">

              <div>

                <strong>
                  Detección
                </strong>


                <p>
                  {mensaje}
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* ==========================================
            RESUMEN
            ========================================== */}

        <section className="analysis-section">

          <span className="analysis-section-label">
            Sesión
          </span>


          <h2>
            Resumen
          </h2>


          <div className="analysis-summary-grid">

            <div className="analysis-summary-item">

              <span>
                Analizadas
              </span>


              <strong>
                {resumen.total}
              </strong>

            </div>


            <div className="analysis-summary-item">

              <span>
                Correctas
              </span>


              <strong>
                {resumen.correctas}
              </strong>

            </div>


            <div className="analysis-summary-item">

              <span>
                Técnica correcta
              </span>


              <strong>
                {Math.round(
                  resumen
                    .porcentajeCorrectas
                )}
                %
              </strong>

            </div>


            <div className="analysis-summary-item">

              <span>
                Descompensadas
              </span>


              <strong>
                {
                  resumen
                    .descompensadas
                }
              </strong>

            </div>

          </div>

        </section>


        {/* ==========================================
            HISTORIAL
            ========================================== */}

        <section className="analysis-section">

          <span className="analysis-section-label">
            Detalle
          </span>


          <h2>
            Historial
          </h2>


          {historial.length ===
          0 ? (

            <p className="analysis-empty-message">
              Completa una repetición para
              empezar a generar el historial.
            </p>

          ) : (

            <div className="analysis-history">

              {historial.map(
                function (
                  repeticion
                ) {
                  return (
                    <div
                      key={
                        repeticion.numero
                      }

                      className="analysis-history-item"
                    >

                      <span className="analysis-history-number">

                        Rep{" "}
                        {
                          repeticion.numero
                        }

                      </span>


                      <div>

                        <strong>
                          {
                            repeticion.resultado
                          }
                        </strong>


                        <p>
                          Diferencia media:{" "}
                          {Math.round(
                            repeticion
                              .diferenciaMedia
                          )}
                          °
                        </p>


                        <p>
                          Diferencia máxima:{" "}
                          {Math.round(
                            repeticion
                              .diferenciaMaxima
                          )}
                          °
                        </p>


                        <p>
                          Descompensado:{" "}
                          {Math.round(
                            repeticion
                              .porcentajeDescompensado
                          )}
                          %
                        </p>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </section>

          </>

        )}

      </div>

    </div>
  );
}


// ==================================================
// COMPONENTE GENÉRICO
// ==================================================

interface CameraPreviewProps {
  ejercicio: EjercicioId;

  lado?: Lado;

  reinicioId: number;
}


function CameraPreview(
  props: CameraPreviewProps
) {
  const lado =
    props.lado ??
    "derecho";


  // ------------------------------------------------
  // CURL
  // ------------------------------------------------

  if (
    props.ejercicio ===
    "curl"
  ) {
    return (
      <CurlCameraPreview
        lado={
          lado
        }

        reinicioId={
          props.reinicioId
        }
      />
    );
  }


  // ------------------------------------------------
  // SENTADILLA
  // ------------------------------------------------

  if (
    props.ejercicio ===
    "sentadilla"
  ) {
    return (
      <SentadillaCameraPreview
        lado={
          lado
        }

        reinicioId={
          props.reinicioId
        }
      />
    );
  }


  // ------------------------------------------------
  // PRESS DE HOMBRO
  // ------------------------------------------------

  return (
    <PressHombroCameraPreview
      reinicioId={
        props.reinicioId
      }
    />
  );
}


export default CameraPreview;