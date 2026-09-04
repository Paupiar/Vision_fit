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

// Función que crea MediaPipe.
import {
  crearPoseLandmarker
} from "../mediapipe/pose";


// --------------------------------------------------
// LÓGICA DE SENTADILLA
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


function SentadillaPreview() {
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


  // Estado interno del ejercicio.
  const estadoSentadillaRef =
    useRef(
      crearEstadoSentadilla()
    );


  // ==================================================
  // ESTADOS VISIBLES
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
    mensaje,
    setMensaje
  ] =
    useState<string>(
      "Esperando detección"
    );


  // Historial de repeticiones.
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

  // Se recalcula cada vez
  // que cambia el historial.
  const resumen =
    calcularResumenSesionSentadilla(
      historial
    );


  // ==================================================
  // INICIAR SISTEMA
  // ==================================================

  useEffect(function () {
    let stream:
      MediaStream | null =
      null;


    let componenteActivo =
      true;


    async function iniciarSistema() {
      try {
        // ------------------------------------------
        // CÁMARA
        // ------------------------------------------

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


        // ------------------------------------------
        // MEDIAPIPE
        // ------------------------------------------

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


    // ------------------------------------------------
    // LIMPIEZA
    // ------------------------------------------------

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
  // CONVERTIR A PÍXELES
  // ==================================================

  function convertirAPixeles(
    punto: PuntoSentadilla,
    canvas: HTMLCanvasElement
  ): PuntoSentadilla {
    return {
      x:
        punto.x *
        canvas.width,

      y:
        punto.y *
        canvas.height,

      visibility:
        punto.visibility
    };
  }


  // ==================================================
  // VISIBILIDAD
  // ==================================================

  function esLandmarkValido(
    punto: PuntoSentadilla
  ): boolean {
    if (
      punto.visibility ===
      undefined
    ) {
      return true;
    }


    return (
      punto.visibility >=
      0.7
    );
  }


  // ==================================================
  // DIBUJAR LANDMARK
  // ==================================================

  function dibujarLandmark(
    contexto:
      CanvasRenderingContext2D,
    punto:
      PuntoSentadilla
  ) {
    contexto.beginPath();


    contexto.arc(
      punto.x,
      punto.y,
      8,
      0,
      Math.PI * 2
    );


    contexto.fillStyle =
      "red";


    contexto.fill();
  }


  // ==================================================
  // DIBUJAR CONEXIÓN
  // ==================================================

  function dibujarConexion(
    contexto:
      CanvasRenderingContext2D,
    inicio:
      PuntoSentadilla,
    fin:
      PuntoSentadilla
  ) {
    contexto.beginPath();


    contexto.moveTo(
      inicio.x,
      inicio.y
    );


    contexto.lineTo(
      fin.x,
      fin.y
    );


    contexto.lineWidth =
      4;


    contexto.strokeStyle =
      "blue";


    contexto.stroke();
  }


  // ==================================================
  // DIBUJAR PIERNA
  // ==================================================

  function dibujarPierna(
    contexto:
      CanvasRenderingContext2D,
    cadera:
      PuntoSentadilla,
    rodilla:
      PuntoSentadilla,
    tobillo:
      PuntoSentadilla
  ) {
    // Cadera -> rodilla.
    dibujarConexion(
      contexto,
      cadera,
      rodilla
    );


    // Rodilla -> tobillo.
    dibujarConexion(
      contexto,
      rodilla,
      tobillo
    );


    dibujarLandmark(
      contexto,
      cadera
    );


    dibujarLandmark(
      contexto,
      rodilla
    );


    dibujarLandmark(
      contexto,
      tobillo
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


    // Igualamos resolución
    // de vídeo y canvas.
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


    // Limpiamos el frame anterior.
    contexto.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    try {
      // ------------------------------------------
      // MEDIAPIPE
      // ------------------------------------------

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


        // 24 = cadera derecha.
        const caderaNormalizada =
          landmarks[24];


        // 26 = rodilla derecha.
        const rodillaNormalizada =
          landmarks[26];


        // 28 = tobillo derecho.
        const tobilloNormalizado =
          landmarks[28];


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
            // ------------------------------------
            // CONVERTIR A PÍXELES
            // ------------------------------------

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


            // ------------------------------------
            // ANALIZAR
            // ------------------------------------

            const analisis =
              analizarSentadilla(
                estadoSentadillaRef.current,
                cadera,
                rodilla,
                tobillo
              );


            // ------------------------------------
            // ACTUALIZAR INTERFAZ
            // ------------------------------------

            setAnguloRodilla(
              Math.round(
                analisis.anguloRodilla
              )
            );


            setFase(
              analisis.fase
            );


            setFeedback(
              analisis.feedbackMovimiento
            );


            setMensaje(
              "Pierna detectada correctamente"
            );


            // ------------------------------------
            // REPETICIÓN COMPLETA
            // ------------------------------------

            if (
              analisis.repeticionSumada
            ) {
              setRepeticiones(
                analisis.repeticiones
              );


              // Creamos una copia del array
              // para que React detecte el cambio.
              setHistorial(
                [
                  ...analisis.historial
                ]
              );


              console.log(
                "Repetición de sentadilla:",
                analisis.repeticiones
              );
            }


            // ------------------------------------
            // DIBUJAR
            // ------------------------------------

            dibujarPierna(
              contexto,
              cadera,
              rodilla,
              tobillo
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


    // Siguiente frame.
    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrame
      );
  }


  // ==================================================
  // INICIAR ANÁLISIS
  // ==================================================

  function iniciarAnalisis() {
    if (
      !poseLandmarkerRef.current
    ) {
      return;
    }


    // Evitamos crear dos bucles.
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


    console.log(
      "Análisis de sentadilla iniciado"
    );
  }


  // ==================================================
  // VÍDEO PREPARADO
  // ==================================================

  function videoPreparado() {
    if (
      videoRef.current
    ) {
      console.log(
        "Resolución:",
        videoRef.current.videoWidth,
        videoRef.current.videoHeight
      );
    }


    iniciarAnalisis();
  }


  // ==================================================
  // INTERFAZ
  // ==================================================

  return (
    <div className="vision-fit-layout">

      {/* =============================================
          IZQUIERDA: CÁMARA
          ============================================= */}

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


      {/* =============================================
          DERECHA: INFORMACIÓN
          ============================================= */}

      <div className="vision-fit-data-column">

        {/* ===========================================
            MOVIMIENTO
            =========================================== */}

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
              Detección:
            </strong>{" "}
            {mensaje}
          </p>

        </section>


        {/* ===========================================
            RESUMEN
            =========================================== */}

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

          </section>

        ) : null}


        {/* ===========================================
            HISTORIAL
            =========================================== */}

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

                      mínimo:{" "}

                      {Math.round(
                        repeticion.anguloMinimo
                      )}
                      °
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


// Exportamos el componente.
export default SentadillaPreview;