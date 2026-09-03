// Importamos los hooks necesarios de React.
import {
  useEffect,
  useRef,
  useState
} from "react";

// Importamos el tipo del evento
// para seleccionar archivos.
import type {
  ChangeEvent
} from "react";

// Tipo del detector de MediaPipe.
import type {
  PoseLandmarker
} from "@mediapipe/tasks-vision";

// Estilos generales.
import "./App.css";

// Componente encargado
// de la webcam.
import CameraPreview from "./components/CameraPreview";

// Función que crea MediaPipe.
import {
  crearPoseLandmarker
} from "./mediapipe/pose";

// --------------------------------------------------
// LÓGICA DEL CURL
// --------------------------------------------------

import {
  analizarFrameCurl,
  calcularResumenSesion,
  crearEstadoCurl,
  CONFIGURACION_CURL_VIDEO
} from "./ejercicios/curl";

import type {
  FaseCurl,
  Punto,
  ResultadoRepeticion
} from "./ejercicios/curl";


function App() {
  // ==================================================
  // CÁMARA
  // ==================================================

  // La cámara comienza apagada.
  const [
    mostrarCamara,
    setMostrarCamara
  ] =
    useState<boolean>(
      false
    );


  // ==================================================
  // VÍDEO
  // ==================================================

  // Input oculto
  // para seleccionar vídeos.
  const inputVideoRef =
    useRef<HTMLInputElement | null>(
      null
    );


  // Elemento <video>.
  const videoSubidoRef =
    useRef<HTMLVideoElement | null>(
      null
    );


  // Canvas situado encima
  // del vídeo.
  const canvasVideoRef =
    useRef<HTMLCanvasElement | null>(
      null
    );


  // MediaPipe utilizado
  // para el vídeo.
  const poseLandmarkerVideoRef =
    useRef<PoseLandmarker | null>(
      null
    );


  // requestAnimationFrame
  // del vídeo.
  const animationFrameVideoRef =
    useRef<number | null>(
      null
    );


  // URL temporal
  // del archivo.
  const urlVideoRef =
    useRef<string | null>(
      null
    );


  // ==================================================
  // ESTADO INTERNO DEL CURL
  // ==================================================

  // Estado independiente
  // para analizar el vídeo.
  const estadoCurlVideoRef =
    useRef(
      crearEstadoCurl()
    );


  // ==================================================
  // CONTROL DEL ANÁLISIS
  // ==================================================

  // Hasta cuándo mostrar
  // landmarks verdes.
  const verdeHastaVideoRef =
    useRef<number>(
      0
    );


  // Controla cada cuánto
  // actualizamos React.
  const ultimaActualizacionUIVideoRef =
    useRef<number>(
      0
    );


  // Si el vídeo ha terminado,
  // la próxima reproducción
  // debe comenzar una sesión nueva.
  const reiniciarAlReproducirRef =
    useRef<boolean>(
      false
    );


  // Permite distinguir
  // un seek automático
  // de uno manual.
  const seekAutomaticoRef =
    useRef<boolean>(
      false
    );


  // ==================================================
  // ESTADOS VISIBLES
  // ==================================================

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
    >([]);


  // ==================================================
  // RESUMEN
  // ==================================================

  const resumenVideo =
    calcularResumenSesion(
      historialVideo
    );


  // ==================================================
  // REINICIAR ANÁLISIS
  // ==================================================

  function reiniciarAnalisisCurlVideo() {
    // Creamos un estado nuevo.
    estadoCurlVideoRef.current =
      crearEstadoCurl();


    // Limpiamos la interfaz.
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


    console.log(
      "Análisis del curl del vídeo reiniciado"
    );
  }


  // ==================================================
  // CÁMARA
  // ==================================================

  function cambiarCamara() {
    // Si vamos a encenderla,
    // detenemos primero el vídeo.
    if (
      !mostrarCamara
    ) {
      detenerAnalisisVideo();


      if (
        videoSubidoRef.current &&
        !videoSubidoRef.current.paused
      ) {
        videoSubidoRef.current.pause();
      }
    }


    setMostrarCamara(
      !mostrarCamara
    );
  }


  // ==================================================
  // ABRIR SELECTOR
  // ==================================================

  function abrirSelectorVideo() {
    if (
      inputVideoRef.current
    ) {
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


    if (!archivo) {
      return;
    }


    // Solo aceptamos vídeos.
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


    detenerAnalisisVideo();


    // Limpiamos la sesión anterior.
    reiniciarAnalisisCurlVideo();


    reiniciarAlReproducirRef.current =
      false;


    // Liberamos la URL anterior.
    if (
      urlVideoRef.current !==
      null
    ) {
      URL.revokeObjectURL(
        urlVideoRef.current
      );
    }


    // Creamos la nueva URL.
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


    // La cámara se apaga.
    setMostrarCamara(
      false
    );


    console.log(
      "Vídeo seleccionado:",
      archivo.name
    );
  }


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
  // COORDENADAS
  // ==================================================

  function convertirAPixeles(
    punto: Punto,
    canvas: HTMLCanvasElement
  ): Punto {
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
    punto: Punto
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
  // FEEDBACK VERDE
  // ==================================================

  function activarFeedbackVerdeVideo() {
    verdeHastaVideoRef.current =
      performance.now() +
      300;
  }


  // ==================================================
  // DIBUJAR LANDMARK
  // ==================================================

  function dibujarLandmark(
    contexto:
      CanvasRenderingContext2D,
    punto:
      Punto,
    verdeActivo:
      boolean
  ) {
    contexto.beginPath();


    contexto.arc(
      punto.x,
      punto.y,
      8,
      0,
      Math.PI * 2
    );


    if (
      verdeActivo
    ) {
      contexto.fillStyle =
        "limegreen";
    } else {
      contexto.fillStyle =
        "red";
    }


    contexto.fill();
  }


  // ==================================================
  // DIBUJAR CONEXIÓN
  // ==================================================

  function dibujarConexion(
    contexto:
      CanvasRenderingContext2D,
    inicio:
      Punto,
    fin:
      Punto,
    verdeActivo:
      boolean
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


    if (
      verdeActivo
    ) {
      contexto.strokeStyle =
        "limegreen";
    } else {
      contexto.strokeStyle =
        "blue";
    }


    contexto.stroke();
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
    // MISMO ANALIZADOR DEL CURL
    // ------------------------------------------------

    // Este es el cambio importante.
    //
    // Le indicamos que estamos
    // analizando un VÍDEO.
    //
    // Por tanto:
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
    // REPETICIÓN
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
    // ACTUALIZAR INTERFAZ
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
      // CODO
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
      // TRONCO
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


    // Ajustamos la resolución.
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


    contexto.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    try {
      // --------------------------------------------
      // MEDIAPIPE
      // --------------------------------------------

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


      // --------------------------------------------
      // LANDMARKS
      // --------------------------------------------

      // 12 = hombro derecho.
      const hombroNormalizado =
        landmarks[12];


      // 14 = codo derecho.
      const codoNormalizado =
        landmarks[14];


      // 16 = muñeca derecha.
      const munecaNormalizada =
        landmarks[16];


      // 24 = cadera derecha.
      const caderaNormalizada =
        landmarks[24];


      if (
        !hombroNormalizado ||
        !codoNormalizado ||
        !munecaNormalizada
      ) {
        return;
      }


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


      // --------------------------------------------
      // PÍXELES
      // --------------------------------------------

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


      // --------------------------------------------
      // CADERA
      // --------------------------------------------

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


      // --------------------------------------------
      // ANALIZAR
      // --------------------------------------------

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


      // --------------------------------------------
      // DIBUJAR
      // --------------------------------------------

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
  // BUCLE
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


    // Esperamos mientras
    // cambia de posición.
    if (
      video.seeking
    ) {
      animationFrameVideoRef.current =
        requestAnimationFrame(
          analizarFrameVideo
        );

      return;
    }


    if (
      video.ended
    ) {
      animationFrameVideoRef.current =
        null;

      return;
    }


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
  // INICIAR
  // ==================================================

  async function iniciarAnalisisVideo() {
    if (
      !videoSubidoRef.current
    ) {
      return;
    }


    // Si estamos reproduciendo otra vez
    // después de terminar,
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


    if (
      videoSubidoRef.current.paused ||
      videoSubidoRef.current.ended
    ) {
      return;
    }


    // Evitamos dos bucles.
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
  // DETENER
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
  // VÍDEO TERMINADO
  // ==================================================

  function videoTerminado() {
    detenerAnalisisVideo();


    if (
      !videoSubidoRef.current
    ) {
      return;
    }


    // Conservamos el resumen.
    reiniciarAlReproducirRef.current =
      true;


    // Indicamos que el salto
    // al segundo 0 es automático.
    seekAutomaticoRef.current =
      true;


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


    // ----------------------------------------------
    // SEEK AUTOMÁTICO
    // ----------------------------------------------

    if (
      seekAutomaticoRef.current
    ) {
      seekAutomaticoRef.current =
        false;


      analizarFramePausado();


      return;
    }


    // ----------------------------------------------
    // SEEK MANUAL
    // ----------------------------------------------

    detenerAnalisisVideo();


    // Saltarse frames invalida
    // el estado del ejercicio.
    reiniciarAnalisisCurlVideo();


    reiniciarAlReproducirRef.current =
      false;


    // Mostramos los landmarks
    // del nuevo instante.
    analizarFramePausado();


    // Si seguía reproduciéndose,
    // continuamos el análisis.
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


    // false:
    //
    // dibujamos landmarks
    // pero no modificamos
    // el estado del curl.
    procesarFrameVideo(
      performance.now(),
      false
    );
  }


  // ==================================================
  // LIMPIEZA
  // ==================================================

  useEffect(function () {
    return function limpiarAplicacion() {
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

      {/* ----------------------------------------------
          TÍTULO
          ---------------------------------------------- */}
      <h1>
        Visión Fit
      </h1>


      {/* ----------------------------------------------
          CONTROLES
          ---------------------------------------------- */}

      <button
        type="button"

        onClick={
          cambiarCamara
        }
      >
        {mostrarCamara
          ? "Apagar cámara"
          : "Encender cámara"}
      </button>


      <button
        type="button"

        onClick={
          abrirSelectorVideo
        }

        style={{
          marginLeft: "12px"
        }}
      >
        Cargar vídeo
      </button>


      {/* ----------------------------------------------
          INPUT
          ---------------------------------------------- */}

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
          display: "none"
        }}
      />


      {/* ==============================================
          MODO VÍDEO
          ============================================== */}

      {urlVideo !== null &&
      mostrarCamara === false ? (

        <div className="vision-fit-layout">

          {/* ------------------------------------------
              IZQUIERDA
              ------------------------------------------ */}
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

              {/* VÍDEO */}
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


              {/* CANVAS */}
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

                  // Dejamos pasar los clics
                  // hacia los controles del vídeo.
                  pointerEvents: "none"
                }}
              />

            </div>

          </div>


          {/* ------------------------------------------
              DERECHA
              ------------------------------------------ */}
          <div className="vision-fit-data-column">

            {/* MOVIMIENTO */}
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


            {/* TÉCNICA */}
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


            {/* RESUMEN */}
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


            {/* HISTORIAL */}
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

      ) : null}


      {/* ==============================================
          MODO CÁMARA
          ============================================== */}

      {mostrarCamara ? (
        <CameraPreview />
      ) : null}

    </main>
  );
}


// Exportamos App.
export default App;