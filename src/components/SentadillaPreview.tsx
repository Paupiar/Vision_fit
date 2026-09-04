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
  crearEstadoSentadilla
} from "../ejercicios/sentadilla";

import type {
  FaseSentadilla,
  PuntoSentadilla
} from "../ejercicios/sentadilla";


function SentadillaPreview() {
  // ==================================================
  // REFERENCIAS PRINCIPALES
  // ==================================================

  // Elemento <video>
  // utilizado por la webcam.
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );


  // Canvas que colocamos
  // encima de la cámara.
  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );


  // Detector de MediaPipe.
  const poseLandmarkerRef =
    useRef<PoseLandmarker | null>(
      null
    );


  // requestAnimationFrame.
  const animationFrameRef =
    useRef<number | null>(
      null
    );


  // ==================================================
  // ESTADO INTERNO DE SENTADILLA
  // ==================================================

  // Conserva entre frames:
  //
  // - fase;
  // - repeticiones.
  const estadoSentadillaRef =
    useRef(
      crearEstadoSentadilla()
    );


  // ==================================================
  // ESTADO VISIBLE
  // ==================================================

  // Número de repeticiones.
  const [
    repeticiones,
    setRepeticiones
  ] =
    useState<number>(
      0
    );


  // Ángulo de la rodilla.
  const [
    anguloRodilla,
    setAnguloRodilla
  ] =
    useState<number>(
      0
    );


  // Fase actual.
  const [
    fase,
    setFase
  ] =
    useState<FaseSentadilla>(
      "arriba"
    );


  // Feedback del movimiento.
  const [
    feedback,
    setFeedback
  ] =
    useState<string>(
      "Colócate de forma que se vea la pierna completa"
    );


  // Estado de detección
  // de los landmarks.
  const [
    mensaje,
    setMensaje
  ] =
    useState<string>(
      "Esperando detección"
    );


  // ==================================================
  // INICIAR CÁMARA Y MEDIAPIPE
  // ==================================================

  useEffect(function () {
    // Stream real de la webcam.
    let stream:
      MediaStream | null =
      null;


    // Evita problemas si el componente
    // desaparece mientras estamos
    // esperando procesos async.
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


        // Si el componente ya desapareció,
        // detenemos inmediatamente la cámara.
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


        // Conectamos el stream
        // al elemento <video>.
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


        // Si la cámara ya tiene datos,
        // comenzamos directamente.
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


      // Detenemos el bucle.
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


      // Apagamos la webcam.
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


      // Desconectamos el vídeo.
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
  // CONVERTIR COORDENADAS
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
    // Si visibility no existe,
    // aceptamos el landmark.
    if (
      punto.visibility ===
      undefined
    ) {
      return true;
    }


    // Mantenemos el mismo
    // umbral del 70 %.
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


    // Landmarks.
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


    // Esperamos una imagen válida.
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


    // Igualamos la resolución.
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


    if (!contexto) {
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


        // ----------------------------------------
        // PIERNA DERECHA
        // ----------------------------------------

        // 24 = cadera derecha.
        const caderaNormalizada =
          landmarks[24];


        // 26 = rodilla derecha.
        const rodillaNormalizada =
          landmarks[26];


        // 28 = tobillo derecho.
        const tobilloNormalizado =
          landmarks[28];


        // Comprobamos que existan.
        if (
          caderaNormalizada &&
          rodillaNormalizada &&
          tobilloNormalizado
        ) {
          // Comprobamos visibilidad.
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
            // ANALIZAR SENTADILLA
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
            // Alguno de los landmarks
            // tiene poca visibilidad.
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


    // Evitamos dos bucles
    // simultáneos.
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
          DERECHA: ANÁLISIS
          ============================================= */}
      <div className="vision-fit-data-column">

        <section className="analysis-section">

          <h2>
            Repeticiones: {repeticiones}
          </h2>


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

      </div>

    </div>
  );
}


// Exportamos el componente.
export default SentadillaPreview;