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


  // Estado interno de la sentadilla.
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


  // Feedback técnico
  // específico del tronco.
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
  // INICIAR CÁMARA Y MEDIAPIPE
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
  // COMPROBAR VISIBILIDAD
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
      PuntoSentadilla
  ) {
    // ----------------------------------------------
    // TRONCO
    // ----------------------------------------------

    if (
      hombro !==
      null
    ) {
      dibujarConexion(
        contexto,
        hombro,
        cadera
      );


      dibujarLandmark(
        contexto,
        hombro
      );
    }


    // ----------------------------------------------
    // PIERNA
    // ----------------------------------------------

    dibujarConexion(
      contexto,
      cadera,
      rodilla
    );


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


    // Esperamos a tener
    // una imagen válida.
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


    // Igualamos la resolución
    // del canvas y del vídeo.
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


    // Eliminamos los dibujos
    // del frame anterior.
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


        // ----------------------------------------
        // LANDMARKS DERECHOS
        // ----------------------------------------

        // 12 = hombro.
        const hombroNormalizado =
          landmarks[12];


        // 24 = cadera.
        const caderaNormalizada =
          landmarks[24];


        // 26 = rodilla.
        const rodillaNormalizada =
          landmarks[26];


        // 28 = tobillo.
        const tobilloNormalizado =
          landmarks[28];


        // ----------------------------------------
        // PIERNA OBLIGATORIA
        // ----------------------------------------

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
            // CONVERTIR PIERNA
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
            // HOMBRO
            // ------------------------------------

            let hombro:
              PuntoSentadilla | null =
              null;


            // El hombro es opcional.
            //
            // Si se pierde momentáneamente,
            // seguimos analizando la pierna.
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


            // ------------------------------------
            // ANALIZAR SENTADILLA
            // ------------------------------------

            const analisis =
              analizarSentadilla(
                estadoSentadillaRef.current,
                hombro,
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


            // ------------------------------------
            // REPETICIÓN COMPLETA
            // ------------------------------------

            if (
              analisis.repeticionSumada
            ) {
              setRepeticiones(
                analisis.repeticiones
              );


              // Copiamos el array para que
              // React detecte el cambio.
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
            // DIBUJAR LANDMARKS
            // ------------------------------------

            dibujarCuerpo(
              contexto,
              hombro,
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


    // Analizamos el siguiente frame.
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


    // Evitamos tener dos
    // bucles simultáneos.
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
  // CÁMARA PREPARADA
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


// Exportamos el componente.
export default SentadillaPreview;