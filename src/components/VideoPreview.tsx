// Importamos los hooks necesarios de React.
import {
  useEffect,
  useRef,
  useState
} from "react";

// Importamos únicamente el tipo
// del detector de MediaPipe.
import type {
  PoseLandmarker
} from "@mediapipe/tasks-vision";

// Función que crea el detector de pose.
import {
  crearPoseLandmarker
} from "../mediapipe/pose";


// --------------------------------------------------
// UTILIDADES COMUNES DE MEDIAPIPE
// --------------------------------------------------
//
// Estas funciones se reutilizan
// desde dibujo.ts.
import {
  convertirAPixeles,
  dibujarConexion,
  dibujarLandmark,
  esLandmarkValido
} from "../mediapipe/dibujo";


// --------------------------------------------------
// CONFIGURACIÓN DE LANDMARKS
// --------------------------------------------------
//
// Los índices utilizados por el Curl
// se centralizan ahora en landmarks.ts.
import {
  LANDMARKS_CURL
} from "../ejercicios/landmarks";


// --------------------------------------------------
// LÓGICA DEL CURL
// --------------------------------------------------

import {
  analizarFrameCurl,
  calcularResumenSesion,
  crearEstadoCurl,
  CONFIGURACION_CURL_VIDEO
} from "../ejercicios/curl";

import type {
  FaseCurl,
  Punto,
  ResultadoRepeticion
} from "../ejercicios/curl";


// --------------------------------------------------
// PROPS DEL COMPONENTE
// --------------------------------------------------

// App.tsx solamente le entrega:
//
// - la URL del vídeo;
// - el nombre del archivo;
// - si debe mostrarse.
//
// Todo el análisis se gestiona aquí.
interface VideoPreviewProps {
  urlVideo: string;

  nombreVideo: string;

  visible: boolean;
}


function VideoPreview(
  props: VideoPreviewProps
) {
  // Extraemos las propiedades
  // recibidas desde App.
  const {
    urlVideo,
    nombreVideo,
    visible
  } =
    props;


  // ==================================================
  // ELEMENTOS DEL VÍDEO
  // ==================================================

  // Elemento <video>.
  const videoSubidoRef =
    useRef<HTMLVideoElement | null>(
      null
    );


  // Canvas situado encima del vídeo.
  const canvasVideoRef =
    useRef<HTMLCanvasElement | null>(
      null
    );


  // Detector MediaPipe.
  const poseLandmarkerVideoRef =
    useRef<PoseLandmarker | null>(
      null
    );


  // Bucle de análisis.
  const animationFrameVideoRef =
    useRef<number | null>(
      null
    );


  // ==================================================
  // ESTADO INTERNO DEL CURL
  // ==================================================

  // Este objeto mantiene:
  //
  // - fase;
  // - repeticiones;
  // - referencias;
  // - errores técnicos.
  const estadoCurlVideoRef =
    useRef(
      crearEstadoCurl()
    );


  // ==================================================
  // CONTROL DEL ANÁLISIS
  // ==================================================

  // Hasta qué instante deben aparecer
  // los landmarks verdes.
  const verdeHastaVideoRef =
    useRef<number>(
      0
    );


  // Controla cada cuánto actualizamos
  // la interfaz de React.
  const ultimaActualizacionUIVideoRef =
    useRef<number>(
      0
    );


  // Cuando termina el vídeo,
  // la siguiente reproducción
  // comienza una sesión nueva.
  const reiniciarAlReproducirRef =
    useRef<boolean>(
      false
    );


  // Permite distinguir entre:
  //
  // - mover manualmente la barra;
  // - volver automáticamente al segundo 0.
  const seekAutomaticoRef =
    useRef<boolean>(
      false
    );


  // ==================================================
  // DATOS VISIBLES
  // ==================================================

  const [
    repeticionesVideo,
    setRepeticionesVideo
  ] =
    useState<number>(
      0
    );


  const [
    anguloVideo,
    setAnguloVideo
  ] =
    useState<number>(
      0
    );


  const [
    faseVideo,
    setFaseVideo
  ] =
    useState<FaseCurl>(
      "abajo"
    );


  const [
    feedbackVideo,
    setFeedbackVideo
  ] =
    useState<string>(
      "Reproduce el vídeo para comenzar"
    );


  const [
    feedbackCodoVideo,
    setFeedbackCodoVideo
  ] =
    useState<string>(
      "Esperando análisis"
    );


  const [
    feedbackTroncoVideo,
    setFeedbackTroncoVideo
  ] =
    useState<string>(
      "Esperando análisis"
    );


  const [
    desplazamientoCodoVideo,
    setDesplazamientoCodoVideo
  ] =
    useState<number | null>(
      null
    );


  const [
    desplazamientoTroncoVideo,
    setDesplazamientoTroncoVideo
  ] =
    useState<number | null>(
      null
    );


  const [
    historialVideo,
    setHistorialVideo
  ] =
    useState<
      ResultadoRepeticion[]
    >(
      []
    );


  // ==================================================
  // RESUMEN
  // ==================================================

  // Seguimos utilizando exactamente
  // la misma función de curl.ts.
  const resumenVideo =
    calcularResumenSesion(
      historialVideo
    );


  // ==================================================
  // REINICIAR SESIÓN
  // ==================================================

  function reiniciarAnalisisCurlVideo() {
    // Creamos un estado del ejercicio
    // completamente limpio.
    estadoCurlVideoRef.current =
      crearEstadoCurl();


    setRepeticionesVideo(
      0
    );


    setAnguloVideo(
      0
    );


    setFaseVideo(
      "abajo"
    );


    setFeedbackVideo(
      "Reproduce el vídeo para comenzar"
    );


    setFeedbackCodoVideo(
      "Esperando análisis"
    );


    setFeedbackTroncoVideo(
      "Esperando análisis"
    );


    setDesplazamientoCodoVideo(
      null
    );


    setDesplazamientoTroncoVideo(
      null
    );


    setHistorialVideo(
      []
    );


    verdeHastaVideoRef.current =
      0;


    ultimaActualizacionUIVideoRef.current =
      0;


    console.log(
      "Análisis del curl del vídeo reiniciado"
    );
  }


  // ==================================================
  // DETENER ANÁLISIS
  // ==================================================

  function detenerAnalisisVideo() {
    if (
      animationFrameVideoRef.current !==
      null
    ) {
      cancelAnimationFrame(
        animationFrameVideoRef.current
      );


      animationFrameVideoRef.current =
        null;
    }
  }


  // ==================================================
  // CAMBIO DE VÍDEO
  // ==================================================

  // Cada vez que App nos envía
  // una URL diferente significa que
  // el usuario ha seleccionado otro vídeo.
  useEffect(
    function () {
      detenerAnalisisVideo();


      reiniciarAnalisisCurlVideo();


      reiniciarAlReproducirRef.current =
        false;


      seekAutomaticoRef.current =
        false;


      // Limpiamos también el canvas anterior.
      if (
        canvasVideoRef.current
      ) {
        const canvas =
          canvasVideoRef.current;


        const contexto =
          canvas.getContext(
            "2d"
          );


        if (
          contexto
        ) {
          contexto.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
          );
        }
      }
    },
    [urlVideo]
  );


  // ==================================================
  // MOSTRAR / OCULTAR
  // ==================================================

  // Cuando el usuario enciende la cámara,
  // App mantiene VideoPreview montado
  // pero lo oculta.
  //
  // Detenemos también la reproducción
  // y el análisis.
  useEffect(
    function () {
      if (
        visible
      ) {
        return;
      }


      detenerAnalisisVideo();


      if (
        videoSubidoRef.current &&
        !videoSubidoRef.current.paused
      ) {
        videoSubidoRef.current.pause();
      }
    },
    [visible]
  );


  // ==================================================
  // PREPARAR CANVAS
  // ==================================================

  function prepararCanvasVideo() {
    if (
      !videoSubidoRef.current ||
      !canvasVideoRef.current
    ) {
      return;
    }


    const video =
      videoSubidoRef.current;


    const canvas =
      canvasVideoRef.current;


    // El canvas utiliza exactamente
    // la resolución real del vídeo.
    canvas.width =
      video.videoWidth;


    canvas.height =
      video.videoHeight;


    console.log(
      "Resolución del vídeo:",
      video.videoWidth,
      video.videoHeight
    );


    const contexto =
      canvas.getContext(
        "2d"
      );


    if (
      contexto
    ) {
      contexto.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );
    }
  }


  // ==================================================
  // FEEDBACK VERDE
  // ==================================================

  function activarFeedbackVerdeVideo() {
    // 300 ms = 0,3 segundos.
    verdeHastaVideoRef.current =
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
      verdeHastaVideoRef.current;


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
  // PREPARAR MEDIAPIPE
  // ==================================================

  async function prepararMediaPipeVideo():
    Promise<PoseLandmarker | null> {
    // Si ya está cargado,
    // reutilizamos el detector.
    if (
      poseLandmarkerVideoRef.current !==
      null
    ) {
      return (
        poseLandmarkerVideoRef.current
      );
    }


    try {
      console.log(
        "Cargando MediaPipe para vídeo..."
      );


      const poseLandmarker =
        await crearPoseLandmarker();


      poseLandmarkerVideoRef.current =
        poseLandmarker;


      console.log(
        "MediaPipe preparado para vídeo"
      );


      return (
        poseLandmarker
      );

    } catch (error) {
      console.error(
        "Error cargando MediaPipe para vídeo:",
        error
      );


      return null;
    }
  }


  // ==================================================
  // PROCESAR CURL
  // ==================================================

  function procesarCurlVideo(
    timestamp: number,
    hombro: Punto,
    codo: Punto,
    muneca: Punto,
    cadera: Punto | null
  ) {
    // Utilizamos el mismo analizarFrameCurl()
    // que utiliza la cámara.
    //
    // La única diferencia es
    // CONFIGURACION_CURL_VIDEO:
    //
    // codo   -> 30 %
    // tronco -> 16 %
    const analisis =
      analizarFrameCurl(
        estadoCurlVideoRef.current,
        hombro,
        codo,
        muneca,
        cadera,
        CONFIGURACION_CURL_VIDEO
      );


    // ------------------------------------------------
    // CAMBIO DE FASE
    // ------------------------------------------------

    if (
      analisis.cambioFase
    ) {
      activarFeedbackVerdeVideo();


      setFaseVideo(
        analisis.fase
      );
    }


    // ------------------------------------------------
    // NUEVA REPETICIÓN
    // ------------------------------------------------

    if (
      analisis.repeticionSumada
    ) {
      setRepeticionesVideo(
        estadoCurlVideoRef.current
          .repeticiones
      );


      console.log(
        "Repetición detectada en vídeo:",
        estadoCurlVideoRef.current
          .repeticiones
      );
    }


    // ------------------------------------------------
    // REPETICIÓN TERMINADA
    // ------------------------------------------------

    if (
      analisis.repeticionFinalizada !==
      null
    ) {
      const repeticionFinalizada =
        analisis.repeticionFinalizada;


      setHistorialVideo(
        function (
          historialAnterior
        ) {
          return [
            ...historialAnterior,
            repeticionFinalizada
          ];
        }
      );


      console.log(
        "Resultado de repetición en vídeo:",
        repeticionFinalizada
      );
    }


    // ------------------------------------------------
    // ACTUALIZAR REACT
    // ------------------------------------------------

    if (
      timestamp -
        ultimaActualizacionUIVideoRef
          .current >=
      100
    ) {
      setAnguloVideo(
        Math.round(
          analisis.anguloCodo
        )
      );


      setFaseVideo(
        analisis.fase
      );


      setFeedbackVideo(
        analisis.feedbackMovimiento
      );


      setFeedbackCodoVideo(
        analisis.feedbackCodo
      );


      setFeedbackTroncoVideo(
        analisis.feedbackHombro
      );


      // --------------------------------------------
      // DESPLAZAMIENTO DEL CODO
      // --------------------------------------------

      if (
        analisis.desplazamientoCodo !==
        null
      ) {
        setDesplazamientoCodoVideo(
          Math.round(
            analisis
              .desplazamientoCodo *
            100
          )
        );

      } else {
        setDesplazamientoCodoVideo(
          null
        );
      }


      // --------------------------------------------
      // DESPLAZAMIENTO DEL TRONCO
      // --------------------------------------------

      if (
        analisis.desplazamientoHombro !==
        null
      ) {
        setDesplazamientoTroncoVideo(
          Math.round(
            analisis
              .desplazamientoHombro *
            100
          )
        );

      } else {
        setDesplazamientoTroncoVideo(
          null
        );
      }


      ultimaActualizacionUIVideoRef
        .current =
        timestamp;
    }
  }


  // ==================================================
  // PROCESAR FRAME
  // ==================================================

  function procesarFrameVideo(
    timestamp: number,
    analizarEjercicio: boolean
  ) {
    if (
      !videoSubidoRef.current ||
      !canvasVideoRef.current ||
      !poseLandmarkerVideoRef.current
    ) {
      return;
    }


    const video =
      videoSubidoRef.current;


    const canvas =
      canvasVideoRef.current;


    const poseLandmarker =
      poseLandmarkerVideoRef.current;


    // Mantenemos la resolución correcta.
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


    // Borramos el frame anterior.
    contexto.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    try {
      // ------------------------------------------------
      // MEDIAPIPE
      // ------------------------------------------------

      const resultado =
        poseLandmarker.detectForVideo(
          video,
          timestamp
        );


      if (
        resultado.landmarks.length ===
        0
      ) {
        return;
      }


      const landmarks =
        resultado.landmarks[0];


      // ------------------------------------------------
      // LANDMARKS DEL CURL
      // ------------------------------------------------
      //
      // Ya no escribimos aquí:
      //
      // 12 / 14 / 16 / 24
      //
      // La configuración viene de landmarks.ts.
      // ------------------------------------------------

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


      // Necesitamos hombro, codo y muñeca.
      if (
        !hombroNormalizado ||
        !codoNormalizado ||
        !munecaNormalizada
      ) {
        return;
      }


      // Comprobamos visibilidad.
      if (
        !esLandmarkValido(
          hombroNormalizado
        ) ||
        !esLandmarkValido(
          codoNormalizado
        ) ||
        !esLandmarkValido(
          munecaNormalizada
        )
      ) {
        return;
      }


      // ------------------------------------------------
      // CONVERTIR A PÍXELES
      // ------------------------------------------------

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


      // ------------------------------------------------
      // CADERA
      // ------------------------------------------------

      // La cadera es opcional
      // para poder seguir contando
      // aunque no se vea correctamente.
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


      // ------------------------------------------------
      // ANALIZAR EJERCICIO
      // ------------------------------------------------

      if (
        analizarEjercicio
      ) {
        procesarCurlVideo(
          timestamp,
          hombro,
          codo,
          muneca,
          cadera
        );
      }


      // ------------------------------------------------
      // DIBUJAR LANDMARKS
      // ------------------------------------------------

      dibujarBrazo(
        contexto,
        hombro,
        codo,
        muneca
      );

    } catch (error) {
      console.error(
        "Error procesando frame del vídeo:",
        error
      );
    }
  }


  // ==================================================
  // BUCLE DE ANÁLISIS
  // ==================================================

  function analizarFrameVideo(
    timestamp: number
  ) {
    if (
      !videoSubidoRef.current ||
      !canvasVideoRef.current ||
      !poseLandmarkerVideoRef.current
    ) {
      animationFrameVideoRef.current =
        null;

      return;
    }


    const video =
      videoSubidoRef.current;


    // ------------------------------------------------
    // SEEK
    // ------------------------------------------------

    if (
      video.seeking
    ) {
      animationFrameVideoRef.current =
        requestAnimationFrame(
          analizarFrameVideo
        );

      return;
    }


    // ------------------------------------------------
    // FINAL
    // ------------------------------------------------

    if (
      video.ended
    ) {
      animationFrameVideoRef.current =
        null;

      return;
    }


    // ------------------------------------------------
    // PAUSA
    // ------------------------------------------------

    if (
      video.paused
    ) {
      animationFrameVideoRef.current =
        null;

      return;
    }


    procesarFrameVideo(
      timestamp,
      true
    );


    animationFrameVideoRef.current =
      requestAnimationFrame(
        analizarFrameVideo
      );
  }


  // ==================================================
  // INICIAR ANÁLISIS
  // ==================================================

  async function iniciarAnalisisVideo() {
    if (
      !videoSubidoRef.current
    ) {
      return;
    }


    // Si el vídeo había terminado
    // y volvemos a reproducirlo,
    // iniciamos una sesión nueva.
    if (
      reiniciarAlReproducirRef.current
    ) {
      reiniciarAnalisisCurlVideo();


      reiniciarAlReproducirRef.current =
        false;
    }


    const poseLandmarker =
      await prepararMediaPipeVideo();


    if (
      poseLandmarker ===
      null
    ) {
      return;
    }


    if (
      !videoSubidoRef.current
    ) {
      return;
    }


    // Si mientras cargábamos MediaPipe
    // el vídeo ha sido pausado,
    // no arrancamos.
    if (
      videoSubidoRef.current.paused ||
      videoSubidoRef.current.ended
    ) {
      return;
    }


    // Evitamos dos bucles simultáneos.
    if (
      animationFrameVideoRef.current !==
      null
    ) {
      cancelAnimationFrame(
        animationFrameVideoRef.current
      );


      animationFrameVideoRef.current =
        null;
    }


    animationFrameVideoRef.current =
      requestAnimationFrame(
        analizarFrameVideo
      );


    console.log(
      "Análisis técnico del vídeo iniciado"
    );
  }


  // ==================================================
  // VÍDEO TERMINADO
  // ==================================================

  function videoTerminado() {
    detenerAnalisisVideo();


    if (
      !videoSubidoRef.current
    ) {
      return;
    }


    // Conservamos los resultados
    // para que el usuario pueda verlos.
    reiniciarAlReproducirRef.current =
      true;


    // El siguiente seek será automático.
    seekAutomaticoRef.current =
      true;


    // Dejamos el reproductor
    // preparado para volver a empezar.
    videoSubidoRef.current.currentTime =
      0;


    console.log(
      "Vídeo terminado. Resultados conservados."
    );
  }


  // ==================================================
  // SEEK
  // ==================================================

  function manejarSeekVideo() {
    if (
      !videoSubidoRef.current
    ) {
      return;
    }


    // ------------------------------------------------
    // SEEK AUTOMÁTICO
    // ------------------------------------------------

    if (
      seekAutomaticoRef.current
    ) {
      seekAutomaticoRef.current =
        false;


      analizarFramePausado();


      return;
    }


    // ------------------------------------------------
    // SEEK MANUAL
    // ------------------------------------------------

    // Saltar frames rompe la continuidad
    // de una repetición.
    detenerAnalisisVideo();


    reiniciarAnalisisCurlVideo();


    reiniciarAlReproducirRef.current =
      false;


    // Dibujamos MediaPipe
    // en la nueva posición.
    analizarFramePausado();


    // Si el vídeo seguía reproduciéndose,
    // retomamos el análisis.
    if (
      !videoSubidoRef.current.paused &&
      !videoSubidoRef.current.ended
    ) {
      iniciarAnalisisVideo();
    }


    console.log(
      "Salto temporal detectado. Sesión reiniciada."
    );
  }


  // ==================================================
  // FRAME PAUSADO
  // ==================================================

  function analizarFramePausado() {
    if (
      !videoSubidoRef.current ||
      !canvasVideoRef.current ||
      !poseLandmarkerVideoRef.current
    ) {
      return;
    }


    // false significa:
    //
    // dibujar MediaPipe,
    // pero no modificar el estado del curl.
    procesarFrameVideo(
      performance.now(),
      false
    );
  }


  // ==================================================
  // LIMPIEZA FINAL
  // ==================================================

  useEffect(function () {
    return function limpiarVideoPreview() {
      detenerAnalisisVideo();


      // Pausamos el vídeo si seguía activo.
      if (
        videoSubidoRef.current &&
        !videoSubidoRef.current.paused
      ) {
        videoSubidoRef.current.pause();
      }


      console.log(
        "VideoPreview detenido"
      );
    };
  }, []);


  // ==================================================
  // INTERFAZ
  // ==================================================

  return (
    <div
      style={{
        display:
          visible
            ? "block"
            : "none"
      }}
    >

      <div className="vision-fit-layout">

        {/* =============================================
            IZQUIERDA: VÍDEO
            ============================================= */}

        <div className="vision-fit-camera-column">

          <p>
            <strong>
              Vídeo:
            </strong>{" "}
            {nombreVideo}
          </p>


          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "640px"
            }}
          >

            <video
              ref={
                videoSubidoRef
              }

              src={
                urlVideo
              }

              controls

              playsInline

              onLoadedMetadata={
                prepararCanvasVideo
              }

              onPlaying={
                iniciarAnalisisVideo
              }

              onPause={
                detenerAnalisisVideo
              }

              onEnded={
                videoTerminado
              }

              onSeeked={
                manejarSeekVideo
              }

              style={{
                width: "100%",
                height: "auto",
                display: "block",
                position: "relative",
                zIndex: 1
              }}
            />


            <canvas
              ref={
                canvasVideoRef
              }

              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 2,
                pointerEvents: "none"
              }}
            />

          </div>

        </div>


        {/* =============================================
            DERECHA: INFORMACIÓN
            ============================================= */}

        <div className="vision-fit-data-column">

          {/* ------------------------------------------
              MOVIMIENTO
              ------------------------------------------ */}

          <section className="analysis-section">

            <h2>
              Repeticiones: {repeticionesVideo}
            </h2>


            <p>
              <strong>
                Ángulo del codo:
              </strong>{" "}
              {anguloVideo}°
            </p>


            <p>
              <strong>
                Fase:
              </strong>{" "}
              {faseVideo}
            </p>


            <p>
              <strong>
                Movimiento:
              </strong>{" "}
              {feedbackVideo}
            </p>

          </section>


          {/* ------------------------------------------
              TÉCNICA
              ------------------------------------------ */}

          <section className="analysis-section">

            <h3>
              Técnica del curl
            </h3>


            <p>
              <strong>
                Codo:
              </strong>{" "}
              {feedbackCodoVideo}
            </p>


            <p>
              <strong>
                Desplazamiento:
              </strong>{" "}

              {desplazamientoCodoVideo ===
              null
                ? "--"
                : desplazamientoCodoVideo +
                  " %"}
            </p>


            <p>
              <strong>
                Límite:
              </strong>{" "}

              {Math.round(
                CONFIGURACION_CURL_VIDEO
                  .desplazamientoMaximoCodo *
                100
              )} %
            </p>


            <p>
              <strong>
                Tronco:
              </strong>{" "}
              {feedbackTroncoVideo}
            </p>


            <p>
              <strong>
                Desplazamiento:
              </strong>{" "}

              {desplazamientoTroncoVideo ===
              null
                ? "--"
                : desplazamientoTroncoVideo +
                  " %"}
            </p>


            <p>
              <strong>
                Límite:
              </strong>{" "}

              {Math.round(
                CONFIGURACION_CURL_VIDEO
                  .desplazamientoMaximoHombro *
                100
              )} %
            </p>

          </section>


          {/* ------------------------------------------
              RESUMEN
              ------------------------------------------ */}

          <section className="analysis-section">

            <h3>
              Resumen de sesión
            </h3>


            <p>
              <strong>
                Repeticiones analizadas:
              </strong>{" "}
              {resumenVideo.total}
            </p>


            <p>
              <strong>
                Correctas:
              </strong>{" "}
              {resumenVideo.correctas}
            </p>


            <p>
              <strong>
                Técnica correcta:
              </strong>{" "}
              {
                resumenVideo
                  .porcentajeCorrectas
              } %
            </p>


            <p>
              <strong>
                Errores de codo:
              </strong>{" "}
              {resumenVideo.erroresCodo}
            </p>


            <p>
              <strong>
                Balanceos de tronco:
              </strong>{" "}
              {resumenVideo.erroresTronco}
            </p>


            <p>
              <strong>
                Error más frecuente:
              </strong>{" "}
              {
                resumenVideo
                  .errorMasFrecuente
              }
            </p>

          </section>


          {/* ------------------------------------------
              HISTORIAL
              ------------------------------------------ */}

          <section className="analysis-section">

            <h3>
              Historial
            </h3>


            {historialVideo.length ===
            0 ? (

              <p>
                Reproduce el vídeo para
                comenzar el análisis.
              </p>

            ) : (

              <ol className="repetition-history">

                {historialVideo.map(
                  function (
                    repeticion
                  ) {
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

    </div>
  );
}


// Exportamos el componente.
export default VideoPreview;