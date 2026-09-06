// Importamos los hooks necesarios de React.
import {
  useEffect,
  useRef,
  useState
} from "react";

// Tipo del detector de MediaPipe.
import type {
  PoseLandmarker
} from "@mediapipe/tasks-vision";

// Función común para crear MediaPipe.
import {
  crearPoseLandmarker
} from "../mediapipe/pose";


// --------------------------------------------------
// UTILIDADES COMUNES DE MEDIAPIPE
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
// CÁMARA DEL CURL
// ==================================================

function CurlCameraPreview() {
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


  // ==================================================
  // RESUMEN
  // ==================================================

  const resumenSesion =
    calcularResumenSesion(
      historial
    );


  // ==================================================
  // CÁMARA Y MEDIAPIPE
  // ==================================================

  useEffect(function () {
    let stream:
      MediaStream | null =
      null;


    let componenteActivo =
      true;


    async function iniciarSistema() {
      try {
        const nuevoStream =
          await navigator.mediaDevices.getUserMedia({
            video:
              true,

            audio:
              false
          });


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


        console.log(
          "Cargando MediaPipe..."
        );


        const poseLandmarker =
          await crearPoseLandmarker();


        if (
          !componenteActivo
        ) {
          return;
        }


        poseLandmarkerRef.current =
          poseLandmarker;


        console.log(
          "MediaPipe cargado"
        );


        if (
          videoRef.current &&
          videoRef.current.readyState >=
            2
        ) {
          iniciarAnalisis();
        }

      } catch (error) {
        console.error(
          "Error al iniciar cámara o MediaPipe:",
          error
        );
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


      if (
        videoRef.current
      ) {
        videoRef.current.srcObject =
          null;
      }


      console.log(
        "Cámara y análisis de curl detenidos"
      );
    };
  }, []);


  // ==================================================
  // FEEDBACK VERDE
  // ==================================================

  function activarFeedbackVerde() {
    verdeHastaRef.current =
      performance.now() +
      300;
  }


  // ==================================================
  // DIBUJAR BRAZO
  // ==================================================

  function dibujarBrazo(
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
  }


  // ==================================================
  // ANALIZAR FRAME
  // ==================================================

  function analizarFrame(
    timestamp: number
  ) {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !poseLandmarkerRef.current
    ) {
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrame
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
          analizarFrame
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
            LANDMARKS_CURL.hombro
          ];


        const codoNormalizado =
          landmarks[
            LANDMARKS_CURL.codo
          ];


        const munecaNormalizada =
          landmarks[
            LANDMARKS_CURL.muneca
          ];


        const caderaNormalizada =
          landmarks[
            LANDMARKS_CURL.cadera
          ];


        if (
          hombroNormalizado &&
          codoNormalizado &&
          munecaNormalizada
        ) {
          if (
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


            const repeticionFinalizada =
              analisis
                .repeticionFinalizada;


            if (
              repeticionFinalizada !==
              null
            ) {
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


            dibujarBrazo(
              contexto,
              hombro,
              codo,
              muneca
            );
          }
        }
      }

    } catch (error) {
      console.error(
        "Error analizando el curl:",
        error
      );
    }


    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrame
      );
  }


  // ==================================================
  // INICIAR
  // ==================================================

  function iniciarAnalisis() {
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
  }


  function videoPreparado() {
    iniciarAnalisis();
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

        <section className="analysis-section">

          <h2>
            Repeticiones: {repeticiones}
          </h2>


          <p>
            <strong>
              Ángulo del codo:
            </strong>{" "}
            {anguloActual}°
          </p>


          <p>
            <strong>
              Fase:
            </strong>{" "}
            {faseActual}
          </p>


          <p>
            <strong>
              Movimiento:
            </strong>{" "}
            {feedback}
          </p>

        </section>


        <section className="analysis-section">

          <h3>
            Técnica del curl
          </h3>


          <p>
            <strong>
              Codo:
            </strong>{" "}
            {feedbackCodo}
          </p>


          <p>
            <strong>
              Desplazamiento:
            </strong>{" "}

            {desplazamientoCodo ===
            null
              ? "--"
              : desplazamientoCodo +
                " %"}
          </p>


          <p>
            <strong>
              Límite:
            </strong>{" "}

            {Math.round(
              DESPLAZAMIENTO_MAXIMO_CODO *
                100
            )} %
          </p>


          <p>
            <strong>
              Tronco:
            </strong>{" "}
            {feedbackHombro}
          </p>


          <p>
            <strong>
              Desplazamiento:
            </strong>{" "}

            {desplazamientoHombro ===
            null
              ? "--"
              : desplazamientoHombro +
                " %"}
          </p>


          <p>
            <strong>
              Límite:
            </strong>{" "}

            {Math.round(
              DESPLAZAMIENTO_MAXIMO_HOMBRO *
                100
            )} %
          </p>

        </section>


        <section className="analysis-section">

          <h3>
            Resumen de sesión
          </h3>


          <p>
            <strong>
              Repeticiones analizadas:
            </strong>{" "}
            {resumenSesion.total}
          </p>


          <p>
            <strong>
              Correctas:
            </strong>{" "}
            {resumenSesion.correctas}
          </p>


          <p>
            <strong>
              Técnica correcta:
            </strong>{" "}
            {
              resumenSesion
                .porcentajeCorrectas
            } %
          </p>


          <p>
            <strong>
              Errores de codo:
            </strong>{" "}
            {resumenSesion.erroresCodo}
          </p>


          <p>
            <strong>
              Balanceos de tronco:
            </strong>{" "}
            {
              resumenSesion
                .erroresTronco
            }
          </p>


          <p>
            <strong>
              Error más frecuente:
            </strong>{" "}
            {
              resumenSesion
                .errorMasFrecuente
            }
          </p>

        </section>


        <section className="analysis-section">

          <h3>
            Historial
          </h3>


          {historial.length ===
          0 ? (

            <p>
              Completa una repetición
              para ver su análisis.
            </p>

          ) : (

            <ol className="repetition-history">

              {historial.map(
                function (repeticion) {
                  return (
                    <li
                      key={
                        repeticion.numero
                      }
                    >
                      <strong>
                        Rep {
                          repeticion.numero
                        }:
                      </strong>{" "}

                      {
                        repeticion
                          .resultado
                      }
                    </li>
                  );
                }
              )}

            </ol>

          )}

        </section>

      </div>

    </div>
  );
}


// ==================================================
// CÁMARA DE SENTADILLA
// ==================================================

function SentadillaCameraPreview() {
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


  // ==================================================
  // RESUMEN
  // ==================================================

  const resumen =
    calcularResumenSesionSentadilla(
      historial
    );


  // ==================================================
  // CÁMARA Y MEDIAPIPE
  // ==================================================

  useEffect(function () {
    let stream:
      MediaStream | null =
      null;


    let componenteActivo =
      true;


    async function iniciarSistema() {
      try {
        const nuevoStream =
          await navigator.mediaDevices.getUserMedia({
            video:
              true,

            audio:
              false
          });


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


        console.log(
          "Cargando MediaPipe para sentadilla..."
        );


        const poseLandmarker =
          await crearPoseLandmarker();


        if (
          !componenteActivo
        ) {
          return;
        }


        poseLandmarkerRef.current =
          poseLandmarker;


        console.log(
          "MediaPipe preparado para sentadilla"
        );


        if (
          videoRef.current &&
          videoRef.current.readyState >=
            2
        ) {
          iniciarAnalisis();
        }

      } catch (error) {
        console.error(
          "Error iniciando sentadilla:",
          error
        );
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


      if (
        videoRef.current
      ) {
        videoRef.current.srcObject =
          null;
      }


      console.log(
        "Análisis de sentadilla detenido"
      );
    };
  }, []);


  // ==================================================
  // DIBUJAR CUERPO
  // ==================================================

  function dibujarCuerpo(
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
  }


  // ==================================================
  // ANALIZAR FRAME
  // ==================================================

  function analizarFrame(
    timestamp: number
  ) {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !poseLandmarkerRef.current
    ) {
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrame
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
          analizarFrame
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
            LANDMARKS_SENTADILLA.hombro
          ];


        const caderaNormalizada =
          landmarks[
            LANDMARKS_SENTADILLA.cadera
          ];


        const rodillaNormalizada =
          landmarks[
            LANDMARKS_SENTADILLA.rodilla
          ];


        const tobilloNormalizado =
          landmarks[
            LANDMARKS_SENTADILLA.tobillo
          ];


        if (
          caderaNormalizada &&
          rodillaNormalizada &&
          tobilloNormalizado
        ) {
          if (
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
            setMensaje(
              "Asegúrate de que se vea la pierna completa"
            );
          }
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
        analizarFrame
      );
  }


  // ==================================================
  // INICIAR
  // ==================================================

  function iniciarAnalisis() {
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
  }


  function videoPreparado() {
    iniciarAnalisis();
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

        <section className="analysis-section">

          <h2>
            Sentadilla
          </h2>


          <p>
            <strong>
              Repeticiones:
            </strong>{" "}
            {repeticiones}
          </p>


          <p>
            <strong>
              Ángulo de rodilla:
            </strong>{" "}
            {anguloRodilla}°
          </p>


          <p>
            <strong>
              Inclinación del tronco:
            </strong>{" "}

            {inclinacionTronco !==
            null
              ? inclinacionTronco +
                "°"
              : "No disponible"}
          </p>


          <p>
            <strong>
              Fase:
            </strong>{" "}
            {fase}
          </p>


          <p>
            <strong>
              Movimiento:
            </strong>{" "}
            {feedback}
          </p>


          <p>
            <strong>
              Técnica del tronco:
            </strong>{" "}
            {feedbackTronco}
          </p>


          <p>
            <strong>
              Pierna:
            </strong>{" "}
            {mensaje}
          </p>


          <p>
            <strong>
              Tronco:
            </strong>{" "}
            {mensajeTronco}
          </p>

        </section>


        {historial.length >
        0 ? (

          <section className="analysis-section">

            <h2>
              Resumen de sesión
            </h2>


            <p>
              <strong>
                Repeticiones:
              </strong>{" "}
              {resumen.total}
            </p>


            <p>
              <strong>
                Correctas:
              </strong>{" "}
              {resumen.correctas}
            </p>


            <p>
              <strong>
                Técnica correcta:
              </strong>{" "}

              {Math.round(
                resumen.porcentajeCorrectas
              )}
              %
            </p>


            <p>
              <strong>
                Profundidad insuficiente:
              </strong>{" "}

              {
                resumen.profundidadInsuficiente
              }
            </p>


            <p>
              <strong>
                Exceso de inclinación:
              </strong>{" "}

              {
                resumen.excesoInclinacionTronco
              }
            </p>

          </section>

        ) : null}


        {historial.length >
        0 ? (

          <section className="analysis-section">

            <h2>
              Historial
            </h2>


            <ol className="repetition-history">

              {historial.map(
                function (repeticion) {
                  return (
                    <li
                      key={
                        repeticion.numero
                      }
                    >
                      <strong>
                        Rep{" "}
                        {
                          repeticion.numero
                        }
                        :
                      </strong>{" "}

                      {
                        repeticion.resultado
                      }

                      {" — "}

                      rodilla mín.:{" "}

                      {Math.round(
                        repeticion.anguloMinimo
                      )}
                      °

                      {" — "}

                      tronco máx.:{" "}

                      {repeticion
                        .inclinacionTroncoMaxima !==
                      null
                        ? Math.round(
                            repeticion
                              .inclinacionTroncoMaxima
                          ) +
                          "°"
                        : "N/D"}
                    </li>
                  );
                }
              )}

            </ol>

          </section>

        ) : null}

      </div>

    </div>
  );
}


// ==================================================
// CÁMARA DEL PRESS DE HOMBRO
// ==================================================
//
// El Press queda ahora integrado
// directamente en CameraPreview.tsx.
//
// Sigue siendo bilateral:
// analizamos los dos brazos
// simultáneamente.
// ==================================================

function PressHombroCameraPreview() {
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


  // ==================================================
  // RESUMEN
  // ==================================================

  const resumen =
    calcularResumenSesionPress(
      historial
    );


  // ==================================================
  // CÁMARA Y MEDIAPIPE
  // ==================================================

  useEffect(function () {
    let stream:
      MediaStream | null =
      null;


    let componenteActivo =
      true;


    async function iniciarSistema() {
      try {
        const nuevoStream =
          await navigator.mediaDevices.getUserMedia({
            video:
              true,

            audio:
              false
          });


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


        console.log(
          "Cargando MediaPipe para press de hombro..."
        );


        const poseLandmarker =
          await crearPoseLandmarker();


        if (
          !componenteActivo
        ) {
          return;
        }


        poseLandmarkerRef.current =
          poseLandmarker;


        console.log(
          "MediaPipe preparado para press de hombro"
        );


        if (
          videoRef.current &&
          videoRef.current.readyState >=
            2
        ) {
          iniciarAnalisis();
        }

      } catch (error) {
        console.error(
          "Error iniciando press de hombro:",
          error
        );
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


      if (
        videoRef.current
      ) {
        videoRef.current.srcObject =
          null;
      }


      console.log(
        "Análisis de press detenido"
      );
    };
  }, []);


  // ==================================================
  // DIBUJAR BRAZO
  // ==================================================

  function dibujarBrazo(
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
  }


  // ==================================================
  // ANALIZAR FRAME
  // ==================================================

  function analizarFrame(
    timestamp: number
  ) {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !poseLandmarkerRef.current
    ) {
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrame
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
          analizarFrame
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


        // ========================================
        // BRAZO IZQUIERDO
        // ========================================

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


        // ========================================
        // BRAZO DERECHO
        // ========================================

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


        // ========================================
        // COMPROBAR EXISTENCIA
        // ========================================

        if (
          hombroIzquierdoNormalizado &&
          codoIzquierdoNormalizado &&
          munecaIzquierdaNormalizada &&
          hombroDerechoNormalizado &&
          codoDerechoNormalizado &&
          munecaDerechaNormalizada
        ) {
          // ======================================
          // VISIBILIDAD
          // ======================================

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


          // El Press necesita
          // ambos brazos visibles.
          if (
            brazoIzquierdoValido &&
            brazoDerechoValido
          ) {
            // ====================================
            // IZQUIERDO A PÍXELES
            // ====================================

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


            // ====================================
            // DERECHO A PÍXELES
            // ====================================

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


            // ====================================
            // ANALIZAR PRESS
            // ====================================

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


            // ====================================
            // FEEDBACK VERDE
            // ====================================

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


            // ====================================
            // INTERFAZ
            // ====================================

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


            // ====================================
            // REPETICIÓN COMPLETA
            // ====================================

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


            // ====================================
            // DIBUJAR
            // ====================================

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
            setMensaje(
              "Asegúrate de que se vean completamente los dos brazos"
            );
          }
        }
      }

    } catch (error) {
      console.error(
        "Error analizando press de hombro:",
        error
      );
    }


    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrame
      );
  }


  // ==================================================
  // INICIAR
  // ==================================================

  function iniciarAnalisis() {
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
  }


  function videoPreparado() {
    iniciarAnalisis();
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

        <section className="analysis-section">

          <h2>
            Press de hombro
          </h2>


          <p>
            <strong>
              Repeticiones:
            </strong>{" "}
            {repeticiones}
          </p>


          <p>
            <strong>
              Ángulo izquierdo:
            </strong>{" "}
            {anguloIzquierdo}°
          </p>


          <p>
            <strong>
              Ángulo derecho:
            </strong>{" "}
            {anguloDerecho}°
          </p>


          <p>
            <strong>
              Diferencia actual:
            </strong>{" "}
            {diferenciaAngular}°
          </p>


          <p>
            <strong>
              Fase:
            </strong>{" "}
            {fase}
          </p>


          <p>
            <strong>
              Movimiento:
            </strong>{" "}
            {feedbackMovimiento}
          </p>


          <p>
            <strong>
              Simetría:
            </strong>{" "}
            {feedbackSimetria}
          </p>


          <p>
            <strong>
              Detección:
            </strong>{" "}
            {mensaje}
          </p>

        </section>


        {historial.length >
        0 ? (

          <section className="analysis-section">

            <h2>
              Resumen de sesión
            </h2>


            <p>
              <strong>
                Repeticiones:
              </strong>{" "}
              {resumen.total}
            </p>


            <p>
              <strong>
                Correctas:
              </strong>{" "}
              {resumen.correctas}
            </p>


            <p>
              <strong>
                Técnica correcta:
              </strong>{" "}

              {Math.round(
                resumen.porcentajeCorrectas
              )}
              %
            </p>


            <p>
              <strong>
                Descompensación:
              </strong>{" "}
              {resumen.descompensadas}
            </p>

          </section>

        ) : null}


        {historial.length >
        0 ? (

          <section className="analysis-section">

            <h2>
              Historial
            </h2>


            <ol className="repetition-history">

              {historial.map(
                function (repeticion) {
                  return (
                    <li
                      key={
                        repeticion.numero
                      }
                    >
                      <strong>
                        Rep{" "}
                        {
                          repeticion.numero
                        }
                        :
                      </strong>{" "}

                      {
                        repeticion.resultado
                      }

                      {" — "}

                      diferencia media:{" "}

                      {Math.round(
                        repeticion.diferenciaMedia
                      )}
                      °

                      {" — "}

                      máxima:{" "}

                      {Math.round(
                        repeticion.diferenciaMaxima
                      )}
                      °

                      {" — "}

                      descompensado:{" "}

                      {Math.round(
                        repeticion.porcentajeDescompensado
                      )}
                      %
                    </li>
                  );
                }
              )}

            </ol>

          </section>

        ) : null}

      </div>

    </div>
  );
}


// ==================================================
// PROPS DEL COMPONENTE GENÉRICO
// ==================================================

interface CameraPreviewProps {
  ejercicio: EjercicioId;
}


// ==================================================
// CAMERA PREVIEW GENÉRICO
// ==================================================
//
// Este es ahora el único punto
// de entrada de cámara.
//
// Dependiendo del ejercicio seleccionado,
// utiliza el análisis correspondiente.
// ==================================================

function CameraPreview(
  props: CameraPreviewProps
) {
  // ------------------------------------------------
  // CURL
  // ------------------------------------------------

  if (
    props.ejercicio ===
    "curl"
  ) {
    return (
      <CurlCameraPreview />
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
      <SentadillaCameraPreview />
    );
  }


  // ------------------------------------------------
  // PRESS DE HOMBRO
  // ------------------------------------------------

  return (
    <PressHombroCameraPreview />
  );
}


// Exportamos el único
// componente de cámara.
export default CameraPreview;