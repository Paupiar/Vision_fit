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


// --------------------------------------------------
// MÁQUINA DE ESTADOS DE LA SESIÓN
// --------------------------------------------------

import {
  useControlSesion
} from "../sesion/useControlSesion";


// --------------------------------------------------
// INTERFAZ COMPARTIDA DE LA SESIÓN
// --------------------------------------------------

import ControlSesion from "./ControlSesion";

import ResultadoSesion from "./ResultadoSesion";


// --------------------------------------------------
// CÁMARA + MEDIAPIPE COMPARTIDOS
// --------------------------------------------------

import {
  useCamaraPose
} from "../mediapipe/useCamaraPose";


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


  // Control compartido del flujo de la sesión.
  const {
    estadoSesion,
    estadoSesionRef,
    cuentaAtras,
    empezarAnalisis,
    finalizarAnalisis,
    prepararReinicioSesion,
    reiniciarSesion
  } =
    useControlSesion();


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


      // Bloqueamos inmediatamente el análisis
      // y cancelamos una posible cuenta atrás.
      prepararReinicioSesion();


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


            // La máquina vuelve al estado inicial
            // sin apagar la cámara.
            reiniciarSesion();
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
      prepararReinicioSesion,
      reiniciarSesion,
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
            estadoSesionRef.current ===
            "analizando"
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
        estadoSesionRef,
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
    empezarAnalisis(
      function prepararCurlParaAnalisis() {
        // El ejercicio empieza desde un estado
        // interno completamente limpio.
        estadoCurlRef.current =
          crearEstadoCurl();


        verdeHastaRef.current =
          0;


        ultimaActualizacionUIRef.current =
          0;
      }
    );
  }


  // ==================================================
  // FINALIZAR ANÁLISIS DEL CURL
  // ==================================================

  function finalizarAnalisisCurl() {
    finalizarAnalisis(
      function limpiarCurlAlFinalizar() {
        // Eliminamos cualquier feedback verde
        // que pudiera seguir activo.
        verdeHastaRef.current =
          0;
      }
    );
  }


  // ==================================================
  // CÁMARA Y MEDIAPIPE
  // ==================================================

  // La inicialización y la limpieza de la webcam
  // y de MediaPipe ya no viven dentro del Curl.
  //
  // El hook compartido se encarga de:
  // - pedir permisos de cámara;
  // - conectar el stream al <video>;
  // - crear PoseLandmarker;
  // - iniciar el bucle cuando todo está preparado;
  // - detener tracks y requestAnimationFrame al salir;
  // - traducir los errores a mensajes visibles.
  //
  // La lógica específica del Curl sigue estando
  // completamente dentro de este componente.
  useCamaraPose({
    videoRef,
    poseLandmarkerRef,
    animationFrameRef,
    iniciarAnalisis,
    setErrorSistema,
    nombreEjercicio: "curl"
  });


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

        <ControlSesion
          estadoSesion={estadoSesion}
          cuentaAtras={cuentaAtras}
          etiquetaPreparacion="Preparación"
          tituloPreparacion="Antes de empezar"
          introduccion="Colócate correctamente antes de iniciar el análisis del curl."
          instrucciones={[
            "Colócate de lado a la cámara.",
            `Mantén visibles hombro, codo y muñeca del brazo ${props.lado}.`,
            "Intenta que la cadera también sea visible para analizar el tronco.",
            "Empieza con el brazo completamente extendido."
          ]}
          etiquetaDetalle="Lado seleccionado"
          valorDetalle={
            props.lado ===
            "derecho"
              ? "Derecho"
              : "Izquierdo"
          }
          mensajeCuentaAtras="Mantén el brazo extendido. El análisis comenzará al terminar la cuenta atrás."
          totalRepeticiones={resumenSesion.total}
          onEmpezar={empezarAnalisisCurl}
          onFinalizar={finalizarAnalisisCurl}
        >
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


                  

                
        </ControlSesion>


        {(estadoSesion ===
          "analizando" ||
          estadoSesion ===
          "finalizado") && (

          <ResultadoSesion
            finalizado={
              estadoSesion ===
              "finalizado"
            }
            total={resumenSesion.total}
            correctas={resumenSesion.correctas}
            porcentajeCorrectas={
              resumenSesion.porcentajeCorrectas
            }
            metricas={[
              {
                etiqueta: "Errores de codo",
                valor: resumenSesion.erroresCodo
              },
              {
                etiqueta: "Balanceo tronco",
                valor: resumenSesion.erroresTronco
              }
            ]}
            errorPrincipal={
              resumenSesion.total === 0
                ? "Sin datos"
                : resumenSesion.errorMasFrecuente
            }
            hayHistorial={
              historial.length > 0
            }
          >

            {historial.map(
              function (
                repeticion
              ) {
                return (
                  <div
                    key={repeticion.numero}
                    className="analysis-history-item"
                  >

                    <span className="analysis-history-number">
                      Rep {repeticion.numero}
                    </span>


                    <strong>
                      {repeticion.resultado}
                    </strong>

                  </div>
                );
              }
            )}

          </ResultadoSesion>

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


  // Control compartido del flujo de la sesión.
  const {
    estadoSesion,
    estadoSesionRef,
    cuentaAtras,
    empezarAnalisis,
    finalizarAnalisis,
    prepararReinicioSesion,
    reiniciarSesion
  } =
    useControlSesion();


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


      // Bloqueamos inmediatamente el análisis
      // y cancelamos una posible cuenta atrás.
      prepararReinicioSesion();


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


            // La máquina vuelve al estado inicial
            // sin apagar la cámara.
            reiniciarSesion();
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
      prepararReinicioSesion,
      reiniciarSesion,
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
            estadoSesionRef.current ===
            "analizando"
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
          estadoSesionRef.current ===
          "analizando"
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
        estadoSesionRef,
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
    empezarAnalisis(
      function prepararSentadillaParaAnalisis() {
        // La sentadilla comienza desde un estado
        // interno completamente limpio.
        estadoSentadillaRef.current =
          crearEstadoSentadilla();


        verdeHastaRef.current =
          0;
      }
    );
  }


  // ==================================================
  // FINALIZAR ANÁLISIS DE LA SENTADILLA
  // ==================================================

  function finalizarAnalisisSentadilla() {
    finalizarAnalisis(
      function limpiarSentadillaAlFinalizar() {
        // Quitamos cualquier feedback verde
        // que pudiera seguir activo.
        verdeHastaRef.current =
          0;
      }
    );
  }


  // ==================================================
  // CÁMARA Y MEDIAPIPE
  // ==================================================

  // Reutilizamos el mismo hook de cámara y MediaPipe
  // que ya se validó previamente con el Curl.
  //
  // Sentadilla mantiene aquí únicamente su lógica
  // específica de landmarks, ángulos y repeticiones.
  useCamaraPose({
    videoRef,
    poseLandmarkerRef,
    animationFrameRef,
    iniciarAnalisis,
    setErrorSistema,
    nombreEjercicio: "sentadilla"
  });


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

        <ControlSesion
          estadoSesion={estadoSesion}
          cuentaAtras={cuentaAtras}
          etiquetaPreparacion="Antes de empezar"
          tituloPreparacion="Preparación"
          introduccion="Colócate correctamente antes de iniciar el análisis de la sentadilla."
          instrucciones={[
            "Colócate de lado a la cámara.",
            `Mantén visibles hombro, cadera, rodilla y tobillo del lado ${props.lado}.`,
            "Deja suficiente espacio para que la cámara vea el movimiento completo.",
            "Empieza de pie, con la pierna extendida."
          ]}
          etiquetaDetalle="Lado seleccionado"
          valorDetalle={
            props.lado ===
            "derecho"
              ? "Derecho"
              : "Izquierdo"
          }
          mensajeCuentaAtras="Mantente de pie y completamente visible. El análisis comenzará al terminar la cuenta atrás."
          totalRepeticiones={resumen.total}
          onEmpezar={empezarAnalisisSentadilla}
          onFinalizar={finalizarAnalisisSentadilla}
        >
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

          

        
        </ControlSesion>


        {(estadoSesion ===
          "analizando" ||
          estadoSesion ===
          "finalizado") && (

          <ResultadoSesion
            finalizado={
              estadoSesion ===
              "finalizado"
            }
            total={resumen.total}
            correctas={resumen.correctas}
            porcentajeCorrectas={
              resumen.porcentajeCorrectas
            }
            metricas={[
              {
                etiqueta: "Profundidad insuficiente",
                valor: resumen.profundidadInsuficiente
              },
              {
                etiqueta: "Exceso de inclinación",
                valor: resumen.excesoInclinacionTronco
              }
            ]}
            errorPrincipal={
              resumen.total === 0
                ? "Sin datos"
                : resumen.profundidadInsuficiente === 0 &&
                  resumen.excesoInclinacionTronco === 0
                  ? "Ninguno destacado"
                  : resumen.profundidadInsuficiente >
                    resumen.excesoInclinacionTronco
                    ? "Profundidad insuficiente"
                    : resumen.excesoInclinacionTronco >
                      resumen.profundidadInsuficiente
                      ? "Exceso de inclinación del tronco"
                      : "Profundidad e inclinación"
            }
            hayHistorial={
              historial.length > 0
            }
          >

            {historial.map(
              function (
                repeticion
              ) {
                return (
                  <div
                    key={repeticion.numero}
                    className="analysis-history-item"
                  >

                    <span className="analysis-history-number">
                      Rep {repeticion.numero}
                    </span>


                    <div>

                      <strong>
                        {repeticion.resultado}
                      </strong>


                      <p>
                        Rodilla mín.:{" "}
                        {Math.round(
                          repeticion.anguloMinimo
                        )}
                        °
                      </p>


                      <p>
                        Tronco máx.:{" "}
                        {repeticion.inclinacionTroncoMaxima !==
                        null
                          ? Math.round(
                              repeticion.inclinacionTroncoMaxima
                            ) + "°"
                          : "N/D"}
                      </p>

                    </div>

                  </div>
                );
              }
            )}

          </ResultadoSesion>

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


  // Control compartido del flujo de la sesión.
  const {
    estadoSesion,
    estadoSesionRef,
    cuentaAtras,
    empezarAnalisis,
    finalizarAnalisis,
    prepararReinicioSesion,
    reiniciarSesion
  } =
    useControlSesion();


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


      // Bloqueamos inmediatamente el análisis
      // y cancelamos una posible cuenta atrás.
      prepararReinicioSesion();


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


            // La máquina vuelve al estado inicial
            // sin reiniciar ni apagar la webcam.
            reiniciarSesion();
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
      prepararReinicioSesion,
      reiniciarSesion,
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
              estadoSesionRef.current ===
              "analizando"
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
            estadoSesionRef.current ===
            "analizando"
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
        dibujarBrazo,
        estadoSesionRef
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
    empezarAnalisis(
      function prepararPressParaAnalisis() {
        // El press comienza desde un estado
        // interno completamente limpio.
        estadoPressRef.current =
          crearEstadoPressHombro();


        verdeHastaRef.current =
          0;
      }
    );
  }


  // ==================================================
  // FINALIZAR ANÁLISIS DEL PRESS DE HOMBRO
  // ==================================================

  function finalizarAnalisisPress() {
    finalizarAnalisis(
      function limpiarPressAlFinalizar() {
        // Eliminamos cualquier feedback verde
        // que pudiera seguir activo.
        verdeHastaRef.current =
          0;
      }
    );
  }


  // ==================================================
  // CÁMARA Y MEDIAPIPE
  // ==================================================

  // Reutilizamos el hook común para gestionar
  // permisos, stream, MediaPipe y limpieza.
  //
  // El Press conserva únicamente su análisis
  // bilateral y la lógica de simetría.
  useCamaraPose({
    videoRef,
    poseLandmarkerRef,
    animationFrameRef,
    iniciarAnalisis,
    setErrorSistema,
    nombreEjercicio: "press de hombro"
  });


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

        <ControlSesion
          estadoSesion={estadoSesion}
          cuentaAtras={cuentaAtras}
          etiquetaPreparacion="Antes de empezar"
          tituloPreparacion="Preparación"
          introduccion="Colócate correctamente antes de iniciar el análisis del press de hombro."
          instrucciones={[
            "Colócate de frente a la cámara.",
            "Mantén completamente visibles los dos hombros, codos y muñecas.",
            "Deja espacio por encima de la cabeza para poder extender ambos brazos.",
            "Empieza con ambos brazos en la posición baja del press."
          ]}
          etiquetaDetalle="Análisis"
          valorDetalle="Bilateral"
          mensajeCuentaAtras="Mantén ambos brazos en posición baja. El análisis comenzará al terminar la cuenta atrás."
          totalRepeticiones={resumen.total}
          onEmpezar={empezarAnalisisPress}
          onFinalizar={finalizarAnalisisPress}
        >
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

          

        
        </ControlSesion>


        {(estadoSesion ===
          "analizando" ||
          estadoSesion ===
          "finalizado") && (

          <ResultadoSesion
            finalizado={
              estadoSesion ===
              "finalizado"
            }
            total={resumen.total}
            correctas={resumen.correctas}
            porcentajeCorrectas={
              resumen.porcentajeCorrectas
            }
            metricas={[
              {
                etiqueta: "Descompensadas",
                valor: resumen.descompensadas
              }
            ]}
            errorPrincipal={
              resumen.total === 0
                ? "Sin datos"
                : resumen.descompensadas > 0
                  ? "Descompensación entre brazos"
                  : "Ninguno destacado"
            }
            hayHistorial={
              historial.length > 0
            }
          >

            {historial.map(
              function (
                repeticion
              ) {
                return (
                  <div
                    key={repeticion.numero}
                    className="analysis-history-item"
                  >

                    <span className="analysis-history-number">
                      Rep {repeticion.numero}
                    </span>


                    <div>

                      <strong>
                        {repeticion.resultado}
                      </strong>


                      <p>
                        Diferencia media:{" "}
                        {Math.round(
                          repeticion.diferenciaMedia
                        )}
                        °
                      </p>


                      <p>
                        Diferencia máxima:{" "}
                        {Math.round(
                          repeticion.diferenciaMaxima
                        )}
                        °
                      </p>


                      <p>
                        Descompensado:{" "}
                        {Math.round(
                          repeticion.porcentajeDescompensado
                        )}
                        %
                      </p>

                    </div>

                  </div>
                );
              }
            )}

          </ResultadoSesion>

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