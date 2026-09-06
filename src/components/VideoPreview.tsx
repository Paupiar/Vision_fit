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
  CONFIGURACION_CURL_VIDEO
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
// EJERCICIO SELECCIONADO
// --------------------------------------------------

import type {
  EjercicioId
} from "../ejercicios/tipos";


// ==================================================
// PROPS COMUNES DE VÍDEO
// ==================================================

interface VideoComunProps {
  urlVideo: string;

  nombreVideo: string;

  visible: boolean;
}


// ==================================================
// PROPS DEL VÍDEO DEL CURL
// ==================================================

interface CurlVideoPreviewProps
  extends VideoComunProps {
  lado: Lado;
}


// ==================================================
// VÍDEO DEL CURL
// ==================================================

function CurlVideoPreview(
  props: CurlVideoPreviewProps
) {
  // Extraemos las propiedades
  // recibidas desde App.
  const {
    urlVideo,
    nombreVideo,
    visible
  } =
    props;


  // Elegimos los landmarks
  // correspondientes al lado seleccionado.
  const landmarksCurl =
    LANDMARKS_CURL[
      props.lado
    ];


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
  //
  // Esta función sigue siendo específica
  // del curl.
  //
  // Las funciones básicas de dibujo
  // vienen ahora desde dibujo.ts.
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
    // ------------------------------------------------
    // ANALIZADOR COMÚN
    // ------------------------------------------------

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
      // Ángulo.
      setAnguloVideo(
        Math.round(
          analisis.anguloCodo
        )
      );


      // Fase.
      setFaseVideo(
        analisis.fase
      );


      // Feedback del movimiento.
      setFeedbackVideo(
        analisis.feedbackMovimiento
      );


      // Feedback técnico del codo.
      setFeedbackCodoVideo(
        analisis.feedbackCodo
      );


      // Feedback técnico del tronco.
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


      // No detectamos ninguna persona.
      if (
        resultado.landmarks.length ===
        0
      ) {
        return;
      }


      const landmarks =
        resultado.landmarks[0];


      // ------------------------------------------------
      // LANDMARKS DEL LADO SELECCIONADO
      // ------------------------------------------------

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


      // Necesitamos hombro, codo y muñeca.
      if (
        !hombroNormalizado ||
        !codoNormalizado ||
        !munecaNormalizada
      ) {
        return;
      }


      // Comprobamos visibilidad.
      //
      // esLandmarkValido viene ahora
      // desde dibujo.ts.
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
      //
      // convertirAPixeles viene ahora
      // desde dibujo.ts.
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


    // Procesamos el frame actual.
    procesarFrameVideo(
      timestamp,
      true
    );


    // Solicitamos el siguiente.
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
      // Cuando se enciende la cámara
      // mantenemos VideoPreview montado,
      // pero lo ocultamos.
      //
      // Así no perdemos su estado
      // innecesariamente.
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


          {/* ------------------------------------------
              VÍDEO + CANVAS
              ------------------------------------------ */}

          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "640px"
            }}
          >

            {/* ----------------------------------------
                VÍDEO
                ---------------------------------------- */}

            <video
              ref={
                videoSubidoRef
              }

              src={
                urlVideo
              }

              controls

              playsInline

              // Cuando conocemos las dimensiones
              // reales del vídeo preparamos
              // el canvas.
              onLoadedMetadata={
                prepararCanvasVideo
              }

              // Cuando realmente empieza
              // a reproducirse iniciamos MediaPipe.
              onPlaying={
                iniciarAnalisisVideo
              }

              // Una pausa normal conserva
              // todos los resultados.
              onPause={
                detenerAnalisisVideo
              }

              // Al terminar conservamos
              // el resumen.
              onEnded={
                videoTerminado
              }

              // Si el usuario mueve la barra,
              // reiniciamos la sesión.
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


            {/* ----------------------------------------
                CANVAS
                ---------------------------------------- */}

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

                // Los controles del vídeo
                // siguen funcionando.
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


// ==================================================
// PROPS DEL VÍDEO DE SENTADILLA
// ==================================================

interface SentadillaVideoPreviewProps
  extends VideoComunProps {
  lado: Lado;
}


// ==================================================
// VÍDEO DE SENTADILLA
// ==================================================

function SentadillaVideoPreviewIntegrado(
  props: SentadillaVideoPreviewProps
) {
  // Elegimos los landmarks
  // correspondientes al lado seleccionado.
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


  // Estado interno del ejercicio.
  const estadoSentadillaRef =
    useRef(
      crearEstadoSentadilla()
    );


  // Guarda hasta cuándo
  // deben aparecer los landmarks verdes.
  const verdeHastaRef =
    useRef<number>(
      0
    );


  // Cuando termina el vídeo,
  // la siguiente reproducción
  // empezará una sesión nueva.
  const reiniciarAlReproducirRef =
    useRef<boolean>(
      false
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
      "Pulsa reproducir para comenzar el análisis"
    );


  const [
    feedbackTronco,
    setFeedbackTronco
  ] =
    useState<string>(
      "Esperando análisis"
    );


  const [
    mensaje,
    setMensaje
  ] =
    useState<string>(
      "Esperando reproducción"
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
  // DETENER ANÁLISIS
  // ==================================================

  function detenerAnalisisVideo() {
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
  }


  // ==================================================
  // REINICIAR SESIÓN
  // ==================================================

  function reiniciarAnalisisSentadilla() {
    // Creamos un estado completamente nuevo.
    estadoSentadillaRef.current =
      crearEstadoSentadilla();


    // Reiniciamos los datos visibles.
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
      "Pulsa reproducir para comenzar el análisis"
    );


    setFeedbackTronco(
      "Esperando análisis"
    );


    setMensaje(
      "Esperando reproducción"
    );


    setHistorial(
      []
    );


    verdeHastaRef.current =
      0;
  }


  // ==================================================
  // CAMBIO DE VÍDEO
  // ==================================================

  useEffect(
    function () {
      // Detenemos cualquier análisis anterior.
      detenerAnalisisVideo();


      // Reiniciamos la sesión.
      reiniciarAnalisisSentadilla();


      // El nuevo vídeo todavía
      // no necesita reinicio por replay.
      reiniciarAlReproducirRef.current =
        false;


      // Limpiamos el canvas anterior.
      if (
        canvasRef.current
      ) {
        const contexto =
          canvasRef.current.getContext(
            "2d"
          );


        if (
          contexto
        ) {
          contexto.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
        }
      }

    },
    [
      props.urlVideo
    ]
  );


  // ==================================================
  // VISIBILIDAD
  // ==================================================

  useEffect(
    function () {
      // Si activamos la cámara,
      // ocultamos y detenemos el vídeo.
      if (
        !props.visible
      ) {
        detenerAnalisisVideo();


        if (
          videoRef.current
        ) {
          videoRef.current.pause();
        }
      }

    },
    [
      props.visible
    ]
  );


  // ==================================================
  // LIMPIEZA DEL COMPONENTE
  // ==================================================

  useEffect(function () {
    return function limpiar() {
      detenerAnalisisVideo();


      if (
        videoRef.current
      ) {
        videoRef.current.pause();
      }
    };
  }, []);


  // ==================================================
  // MEDIAPIPE
  // ==================================================

  async function prepararMediaPipe() {
    // Si ya está cargado,
    // no volvemos a crearlo.
    if (
      poseLandmarkerRef.current
    ) {
      return;
    }


    console.log(
      "Cargando MediaPipe para vídeo de sentadilla..."
    );


    const poseLandmarker =
      await crearPoseLandmarker();


    poseLandmarkerRef.current =
      poseLandmarker;


    console.log(
      "MediaPipe preparado para vídeo de sentadilla"
    );
  }


  // ==================================================
  // DIBUJAR CUERPO
  // ==================================================
  //
  // Esta función sigue siendo propia
  // de la sentadilla porque define
  // cómo dibujamos el tronco y la pierna.
  //
  // Las operaciones básicas
  // dibujarConexion y dibujarLandmark
  // vienen ahora desde dibujo.ts.
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
    // Tronco.
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


    // Pierna.
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

  function analizarFrameVideo(
    timestamp: number
  ) {
    if (
      !props.visible ||
      !videoRef.current ||
      !canvasRef.current ||
      !poseLandmarkerRef.current
    ) {
      detenerAnalisisVideo();

      return;
    }


    const video =
      videoRef.current;


    const canvas =
      canvasRef.current;


    const poseLandmarker =
      poseLandmarkerRef.current;


    // Si el vídeo está pausado
    // o ha terminado,
    // no seguimos analizando.
    if (
      video.paused ||
      video.ended
    ) {
      detenerAnalisisVideo();

      return;
    }


    if (
      video.readyState <
      2
    ) {
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrameVideo
        );


      return;
    }


    // Igualamos canvas
    // y resolución del vídeo.
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
        // LANDMARKS DEL LADO SELECCIONADO
        // ----------------------------------------

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


        // ----------------------------------------
        // PIERNA OBLIGATORIA
        // ----------------------------------------

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
          // --------------------------------------
          // CONVERTIR PIERNA A PÍXELES
          // --------------------------------------
          //
          // convertirAPixeles ahora viene
          // desde dibujo.ts.
          // --------------------------------------

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


          // --------------------------------------
          // HOMBRO OPCIONAL
          // --------------------------------------

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


          // Guardamos el estado anterior
          // de profundidad para detectar
          // exactamente cuándo llega abajo.
          const profundidadAntes =
            estadoSentadillaRef
              .current
              .profundidadAlcanzada;


          // --------------------------------------
          // ANALIZAR SENTADILLA
          // --------------------------------------

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


          // --------------------------------------
          // EFECTO VERDE
          // --------------------------------------

          // Acaba de alcanzar profundidad.
          if (
            !profundidadAntes &&
            profundidadDespues
          ) {
            verdeHastaRef.current =
              timestamp +
              300;
          }


          // Ha completado la repetición
          // al volver arriba.
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


          // --------------------------------------
          // ACTUALIZAR INTERFAZ
          // --------------------------------------

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
            hombro !== null
              ? "Cuerpo detectado correctamente"
              : "Pierna detectada; hombro no disponible"
          );


          // --------------------------------------
          // REPETICIÓN COMPLETA
          // --------------------------------------

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


            console.log(
              "Repetición de sentadilla en vídeo:",
              analisis.repeticiones
            );
          }


          // --------------------------------------
          // DIBUJAR
          // --------------------------------------

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

    } catch (error) {
      console.error(
        "Error analizando vídeo de sentadilla:",
        error
      );
    }


    // Analizamos el siguiente frame.
    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrameVideo
      );
  }


  // ==================================================
  // REPRODUCIR VÍDEO
  // ==================================================

  async function iniciarAnalisisVideo() {
    // Si el vídeo había terminado,
    // empezamos una sesión nueva.
    if (
      reiniciarAlReproducirRef.current
    ) {
      reiniciarAnalisisSentadilla();


      reiniciarAlReproducirRef.current =
        false;
    }


    // MediaPipe se carga
    // únicamente cuando hace falta.
    await prepararMediaPipe();


    // Evitamos dos bucles
    // simultáneos.
    detenerAnalisisVideo();


    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrameVideo
      );


    setMensaje(
      "Analizando vídeo"
    );
  }


  // ==================================================
  // PAUSAR
  // ==================================================

  function pausarAnalisisVideo() {
    detenerAnalisisVideo();
  }


  // ==================================================
  // VÍDEO TERMINADO
  // ==================================================

  function videoTerminado() {
    detenerAnalisisVideo();


    // Conservamos historial y resumen
    // para que el usuario pueda verlos.
    setMensaje(
      "Análisis terminado"
    );


    // La siguiente reproducción
    // empezará desde una sesión nueva.
    reiniciarAlReproducirRef.current =
      true;
  }


  // ==================================================
  // INTERFAZ
  // ==================================================

  if (
    !props.visible
  ) {
    return null;
  }


  return (
    <div className="vision-fit-layout">

      {/* =============================================
          IZQUIERDA: VÍDEO
          ============================================= */}

      <div className="vision-fit-camera-column">

        <h3>
          {props.nombreVideo}
        </h3>


        {/* Usamos estilos propios aquí
            para NO aplicar el espejo
            que utilizamos en la webcam. */}

        <div
          style={{
            position:
              "relative",

            width:
              "100%",

            maxWidth:
              "640px"
          }}
        >

          <video
            ref={
              videoRef
            }

            src={
              props.urlVideo
            }

            controls

            playsInline

            onPlaying={
              iniciarAnalisisVideo
            }

            onPause={
              pausarAnalisisVideo
            }

            onEnded={
              videoTerminado
            }

            style={{
              width:
                "100%",

              height:
                "auto",

              display:
                "block",

              borderRadius:
                "8px"
            }}
          />


          <canvas
            ref={
              canvasRef
            }

            style={{
              position:
                "absolute",

              top:
                0,

              left:
                0,

              width:
                "100%",

              height:
                "100%",

              pointerEvents:
                "none"
            }}
          />

        </div>

      </div>


      {/* =============================================
          DERECHA: ANÁLISIS
          ============================================= */}

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
              Estado:
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


// ==================================================
// VÍDEO DEL PRESS DE HOMBRO
// ==================================================

function PressHombroVideoPreviewIntegrado(
  props: VideoComunProps
) {
  // ==================================================
  // REFERENCIAS
  // ==================================================

  // Elemento <video>.
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );


  // Canvas situado
  // encima del vídeo.
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


  // Estado interno del press.
  const estadoPressRef =
    useRef(
      crearEstadoPressHombro()
    );


  // Instante hasta el que
  // queremos mantener los landmarks
  // y conexiones en verde.
  const verdeHastaRef =
    useRef<number>(
      0
    );


  // Cuando el vídeo termina,
  // la siguiente reproducción
  // debe comenzar una sesión nueva.
  const reiniciarAlReproducirRef =
    useRef<boolean>(
      false
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
      "Pulsa reproducir para comenzar el análisis"
    );


  const [
    feedbackSimetria,
    setFeedbackSimetria
  ] =
    useState<string>(
      "Esperando análisis"
    );


  const [
    mensaje,
    setMensaje
  ] =
    useState<string>(
      "Esperando reproducción"
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
  // DETENER ANÁLISIS
  // ==================================================

  function detenerAnalisisVideo() {
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
  }


  // ==================================================
  // REINICIAR SESIÓN
  // ==================================================

  function reiniciarAnalisisPress() {
    // Creamos un estado interno
    // completamente nuevo.
    estadoPressRef.current =
      crearEstadoPressHombro();


    // Reiniciamos los datos visibles.
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
      "Pulsa reproducir para comenzar el análisis"
    );


    setFeedbackSimetria(
      "Esperando análisis"
    );


    setMensaje(
      "Esperando reproducción"
    );


    setHistorial(
      []
    );


    verdeHastaRef.current =
      0;
  }


  // ==================================================
  // CAMBIO DE VÍDEO
  // ==================================================

  useEffect(
    function () {
      // Detenemos cualquier análisis anterior.
      detenerAnalisisVideo();


      // Cada vídeo representa
      // una sesión nueva.
      reiniciarAnalisisPress();


      reiniciarAlReproducirRef.current =
        false;


      // Limpiamos el canvas.
      if (
        canvasRef.current
      ) {
        const contexto =
          canvasRef.current.getContext(
            "2d"
          );


        if (
          contexto
        ) {
          contexto.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
        }
      }

    },
    [
      props.urlVideo
    ]
  );


  // ==================================================
  // CAMBIO DE VISIBILIDAD
  // ==================================================

  useEffect(
    function () {
      // Si el componente deja
      // de estar visible,
      // detenemos también el vídeo.
      if (
        !props.visible
      ) {
        detenerAnalisisVideo();


        if (
          videoRef.current
        ) {
          videoRef.current.pause();
        }
      }

    },
    [
      props.visible
    ]
  );


  // ==================================================
  // LIMPIEZA FINAL
  // ==================================================

  useEffect(function () {
    return function limpiarComponente() {
      detenerAnalisisVideo();


      if (
        videoRef.current
      ) {
        videoRef.current.pause();
      }
    };
  }, []);


  // ==================================================
  // PREPARAR MEDIAPIPE
  // ==================================================

  async function prepararMediaPipe() {
    // Si ya está preparado,
    // reutilizamos el mismo detector.
    if (
      poseLandmarkerRef.current
    ) {
      return;
    }


    console.log(
      "Cargando MediaPipe para vídeo de press de hombro..."
    );


    const poseLandmarker =
      await crearPoseLandmarker();


    poseLandmarkerRef.current =
      poseLandmarker;


    console.log(
      "MediaPipe preparado para vídeo de press de hombro"
    );
  }


  // ==================================================
  // DIBUJAR BRAZO
  // ==================================================
  //
  // Esta función sigue siendo específica
  // del press porque define
  // cómo dibujamos cada brazo.
  //
  // Las operaciones básicas
  // dibujarConexion y dibujarLandmark
  // vienen ahora desde dibujo.ts.
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
    // Hombro -> codo.
    dibujarConexion(
      contexto,
      hombro,
      codo,
      verde
    );


    // Codo -> muñeca.
    dibujarConexion(
      contexto,
      codo,
      muneca,
      verde
    );


    // Landmarks.
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
  // ANALIZAR FRAME DE VÍDEO
  // ==================================================

  function analizarFrameVideo(
    timestamp: number
  ) {
    // Comprobamos que todo
    // lo necesario existe.
    if (
      !props.visible ||
      !videoRef.current ||
      !canvasRef.current ||
      !poseLandmarkerRef.current
    ) {
      detenerAnalisisVideo();

      return;
    }


    const video =
      videoRef.current;


    const canvas =
      canvasRef.current;


    const poseLandmarker =
      poseLandmarkerRef.current;


    // Si el vídeo está pausado
    // o ha terminado,
    // detenemos el bucle.
    if (
      video.paused ||
      video.ended
    ) {
      detenerAnalisisVideo();

      return;
    }


    // Esperamos a tener
    // una imagen válida.
    if (
      video.readyState <
      2
    ) {
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrameVideo
        );


      return;
    }


    // Igualamos la resolución
    // real del canvas
    // con la resolución del vídeo.
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


        // ========================================
        // BRAZO IZQUIERDO
        // ========================================

        // 11 = hombro izquierdo.
        const hombroIzquierdoNormalizado =
          landmarks[LANDMARKS_PRESS_HOMBRO.izquierdo.hombro];


        // 13 = codo izquierdo.
        const codoIzquierdoNormalizado =
          landmarks[LANDMARKS_PRESS_HOMBRO.izquierdo.codo];


        // 15 = muñeca izquierda.
        const munecaIzquierdaNormalizada =
          landmarks[LANDMARKS_PRESS_HOMBRO.izquierdo.muneca];


        // ========================================
        // BRAZO DERECHO
        // ========================================

        // 12 = hombro derecho.
        const hombroDerechoNormalizado =
          landmarks[LANDMARKS_PRESS_HOMBRO.derecho.hombro];


        // 14 = codo derecho.
        const codoDerechoNormalizado =
          landmarks[LANDMARKS_PRESS_HOMBRO.derecho.codo];


        // 16 = muñeca derecha.
        const munecaDerechaNormalizada =
          landmarks[LANDMARKS_PRESS_HOMBRO.derecho.muneca];


        // ----------------------------------------
        // COMPROBAR LANDMARKS
        // ----------------------------------------

        if (
          hombroIzquierdoNormalizado &&
          codoIzquierdoNormalizado &&
          munecaIzquierdaNormalizada &&
          hombroDerechoNormalizado &&
          codoDerechoNormalizado &&
          munecaDerechaNormalizada
        ) {
          // --------------------------------------
          // VISIBILIDAD IZQUIERDA
          // --------------------------------------
          //
          // esLandmarkValido viene
          // ahora desde dibujo.ts.
          // --------------------------------------

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


          // --------------------------------------
          // VISIBILIDAD DERECHA
          // --------------------------------------

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


          // Para el press necesitamos
          // ambos brazos simultáneamente.
          if (
            brazoIzquierdoValido &&
            brazoDerechoValido
          ) {
            // ====================================
            // IZQUIERDO A PÍXELES
            // ====================================
            //
            // convertirAPixeles viene
            // ahora desde dibujo.ts.
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
            //
            // La lógica bilateral
            // permanece exactamente igual.
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

            // Cuando ambos brazos alcanzan
            // una posición importante,
            // mostramos los landmarks
            // en verde durante 300 ms.
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
            // ACTUALIZAR INTERFAZ
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


              // Copiamos el array
              // para que React detecte
              // correctamente el cambio.
              setHistorial(
                [
                  ...analisis.historial
                ]
              );


              console.log(
                "Repetición de press en vídeo:",
                analisis.repeticiones
              );
            }


            // ====================================
            // DIBUJAR AMBOS BRAZOS
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
        "Error analizando vídeo de press de hombro:",
        error
      );
    }


    // Analizamos el siguiente frame.
    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrameVideo
      );
  }


  // ==================================================
  // INICIAR ANÁLISIS
  // ==================================================

  async function iniciarAnalisisVideo() {
    // Si el vídeo ya terminó anteriormente,
    // la siguiente reproducción
    // empieza una sesión limpia.
    if (
      reiniciarAlReproducirRef.current
    ) {
      reiniciarAnalisisPress();


      reiniciarAlReproducirRef.current =
        false;
    }


    // Cargamos MediaPipe
    // solo cuando realmente lo necesitamos.
    await prepararMediaPipe();


    // Evitamos dos bucles simultáneos.
    detenerAnalisisVideo();


    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrameVideo
      );


    setMensaje(
      "Analizando vídeo"
    );
  }


  // ==================================================
  // PAUSAR
  // ==================================================

  function pausarAnalisisVideo() {
    detenerAnalisisVideo();
  }


  // ==================================================
  // VÍDEO TERMINADO
  // ==================================================

  function videoTerminado() {
    detenerAnalisisVideo();


    // Dejamos visibles
    // historial y resumen.
    setMensaje(
      "Análisis terminado"
    );


    // La siguiente reproducción
    // será una sesión nueva.
    reiniciarAlReproducirRef.current =
      true;
  }


  // ==================================================
  // INTERFAZ
  // ==================================================

  // Si por algún motivo
  // el componente debe ocultarse,
  // no renderizamos nada.
  if (
    !props.visible
  ) {
    return null;
  }


  return (
    <div className="vision-fit-layout">

      {/* =============================================
          VÍDEO
          ============================================= */}

      <div className="vision-fit-camera-column">

        <h3>
          {props.nombreVideo}
        </h3>


        {/* No utilizamos camera-container
            porque el vídeo grabado
            NO debe verse como espejo. */}

        <div
          style={{
            position:
              "relative",

            width:
              "100%",

            maxWidth:
              "640px"
          }}
        >

          <video
            ref={
              videoRef
            }

            src={
              props.urlVideo
            }

            controls

            playsInline

            onPlaying={
              iniciarAnalisisVideo
            }

            onPause={
              pausarAnalisisVideo
            }

            onEnded={
              videoTerminado
            }

            style={{
              width:
                "100%",

              height:
                "auto",

              display:
                "block",

              borderRadius:
                "8px"
            }}
          />


          <canvas
            ref={
              canvasRef
            }

            style={{
              position:
                "absolute",

              top:
                0,

              left:
                0,

              width:
                "100%",

              height:
                "100%",

              pointerEvents:
                "none"
            }}
          />

        </div>

      </div>


      {/* =============================================
          DATOS
          ============================================= */}

      <div className="vision-fit-data-column">

        {/* ===========================================
            MOVIMIENTO
            =========================================== */}

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
              Estado:
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
                Descompensación:
              </strong>{" "}
              {resumen.descompensadas}
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

interface VideoPreviewProps
  extends VideoComunProps {
  ejercicio: EjercicioId;

  // Temporalmente es opcional.
  // Mientras App.tsx todavía no tenga
  // selector visual, utilizamos
  // el lado derecho por defecto.
  lado?: Lado;
}


// ==================================================
// VIDEO PREVIEW GENÉRICO
// ==================================================
//
// App.tsx solamente conoce este componente.
//
// Dependiendo del ejercicio seleccionado,
// utilizamos internamente el análisis
// correspondiente.
//
// Los tres análisis de vídeo ya viven
// dentro de este mismo archivo.
// ==================================================

function VideoPreview(
  props: VideoPreviewProps
) {
  // Mientras App todavía no tenga
  // selector de lado, utilizamos
  // el derecho por defecto.
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
      <CurlVideoPreview
        urlVideo={
          props.urlVideo
        }

        nombreVideo={
          props.nombreVideo
        }

        visible={
          props.visible
        }

        lado={
          lado
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
      <SentadillaVideoPreviewIntegrado
        urlVideo={
          props.urlVideo
        }

        nombreVideo={
          props.nombreVideo
        }

        visible={
          props.visible
        }

        lado={
          lado
        }
      />
    );
  }


  // ------------------------------------------------
  // PRESS DE HOMBRO
  // ------------------------------------------------

  return (
    <PressHombroVideoPreviewIntegrado
      urlVideo={
        props.urlVideo
      }

      nombreVideo={
        props.nombreVideo
      }

      visible={
        props.visible
      }
    />
  );
}


export default VideoPreview;
