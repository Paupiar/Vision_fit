// Importamos useEffect para gestionar cuándo se inicia y se detiene
// la cámara, y useRef para guardar referencias al vídeo, canvas,
// detector de MediaPipe y bucle de animación.
import { useEffect, useRef } from "react";

// Importamos el tipo PoseLandmarker para poder tipar correctamente
// nuestra referencia al detector.
import type { PoseLandmarker } from "@mediapipe/tasks-vision";

// Importamos la función que hemos creado anteriormente
// para preparar el detector de MediaPipe.
import { crearPoseLandmarker } from "../mediapipe/pose";

// Definimos la estructura mínima que necesitamos de un landmark.
// MediaPipe devuelve x e y normalizadas entre 0 y 1.
// visibility indica qué tan visible está ese punto.
interface Punto {
  x: number;
  y: number;
  visibility?: number;
}

function CameraPreview() {
  // Referencia al elemento <video>.
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Referencia al elemento <canvas>.
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Referencia al detector de pose de MediaPipe.
  // Empieza en null porque MediaPipe tarda un poco en cargarse.
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);

  // Guardamos el identificador del bucle requestAnimationFrame
  // para poder detenerlo cuando apaguemos la cámara.
  const animationFrameRef = useRef<number | null>(null);

  useEffect(function () {
    // Guardaremos aquí el stream de la webcam.
    let stream: MediaStream | null = null;

    // Nos permite saber si el componente sigue activo.
    let componenteActivo = true;

    // Función principal de inicialización.
    async function iniciarSistema() {
      try {
        // --------------------------------------------------
        // 1. INICIAMOS LA CÁMARA
        // --------------------------------------------------

        // Solicitamos permiso para utilizar la webcam.
        const nuevoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });

        // Si el componente se desmontó mientras esperábamos,
        // apagamos inmediatamente la webcam.
        if (!componenteActivo) {
          nuevoStream.getTracks().forEach(function (track) {
            track.stop();
          });

          return;
        }

        // Guardamos el stream.
        stream = nuevoStream;

        // Conectamos el stream al elemento <video>.
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // --------------------------------------------------
        // 2. CARGAMOS MEDIAPIPE
        // --------------------------------------------------

        console.log("Cargando MediaPipe...");

        // Creamos el detector utilizando la función
        // definida en poseLandmarker.ts.
        const poseLandmarker = await crearPoseLandmarker();

        // Si el componente desapareció mientras MediaPipe cargaba,
        // no seguimos con la inicialización.
        if (!componenteActivo) {
          return;
        }

        // Guardamos el detector para utilizarlo en cada frame.
        poseLandmarkerRef.current = poseLandmarker;

        console.log("MediaPipe cargado");

        // Si el vídeo ya está preparado,
        // iniciamos inmediatamente el análisis.
        if (
          videoRef.current &&
          videoRef.current.readyState >= 2
        ) {
          iniciarAnalisis();
        }
      } catch (error) {
        // Mostramos cualquier error relacionado
        // con la cámara o MediaPipe.
        console.error(
          "Error al iniciar cámara o MediaPipe:",
          error
        );
      }
    }

    // Ejecutamos la inicialización.
    iniciarSistema();

    // Función de limpieza que React ejecuta
    // cuando CameraPreview desaparece.
    return function detenerSistema() {
      // Indicamos que el componente ya no está activo.
      componenteActivo = false;

      // Detenemos el bucle de animación.
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Apagamos todas las pistas de la webcam.
      if (stream) {
        stream.getTracks().forEach(function (track) {
          track.stop();
        });
      }

      // Desconectamos la webcam del vídeo.
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      console.log("Cámara y análisis detenidos");
    };
  }, []);

  // Convierte las coordenadas normalizadas de MediaPipe
  // a coordenadas reales en píxeles del canvas.
  function convertirAPixeles(
    punto: Punto,
    canvas: HTMLCanvasElement
  ): Punto {
    return {
      x: punto.x * canvas.width,
      y: punto.y * canvas.height,
      visibility: punto.visibility
    };
  }

  // Comprueba que un landmark tenga suficiente visibilidad.
  function esLandmarkValido(punto: Punto): boolean {
    // Si MediaPipe no devuelve visibility,
    // de momento aceptamos el landmark.
    if (punto.visibility === undefined) {
      return true;
    }

    // Solo consideramos válido el punto
    // si su visibilidad es igual o superior a 0.7.
    return punto.visibility >= 0.7;
  }

  // Dibuja un landmark como un círculo.
  function dibujarLandmark(
    contexto: CanvasRenderingContext2D,
    punto: Punto
  ) {
    // Empezamos un nuevo trazado.
    contexto.beginPath();

    // Dibujamos un círculo en la posición del landmark.
    contexto.arc(
      punto.x,
      punto.y,
      8,
      0,
      Math.PI * 2
    );

    // Elegimos el color del punto.
    contexto.fillStyle = "red";

    // Rellenamos el círculo.
    contexto.fill();
  }

  // Dibuja una línea entre dos landmarks.
  function dibujarConexion(
    contexto: CanvasRenderingContext2D,
    inicio: Punto,
    fin: Punto
  ) {
    // Empezamos un nuevo trazado.
    contexto.beginPath();

    // Colocamos el inicio de la línea.
    contexto.moveTo(
      inicio.x,
      inicio.y
    );

    // Indicamos dónde termina.
    contexto.lineTo(
      fin.x,
      fin.y
    );

    // Definimos el grosor.
    contexto.lineWidth = 4;

    // Elegimos el color de la conexión.
    contexto.strokeStyle = "blue";

    // Dibujamos la línea.
    contexto.stroke();
  }

  // Dibuja el brazo derecho completo.
  function dibujarBrazo(
    contexto: CanvasRenderingContext2D,
    hombro: Punto,
    codo: Punto,
    muneca: Punto
  ) {
    // Conectamos hombro con codo.
    dibujarConexion(
      contexto,
      hombro,
      codo
    );

    // Conectamos codo con muñeca.
    dibujarConexion(
      contexto,
      codo,
      muneca
    );

    // Dibujamos los landmarks individuales.
    dibujarLandmark(contexto, hombro);
    dibujarLandmark(contexto, codo);
    dibujarLandmark(contexto, muneca);
  }

  // Esta función analiza un frame de vídeo
  // utilizando MediaPipe.
  function analizarFrame(timestamp: number) {
    // Comprobamos que existan todos los elementos necesarios.
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !poseLandmarkerRef.current
    ) {
      // Volvemos a intentarlo en el siguiente frame.
      animationFrameRef.current =
        requestAnimationFrame(analizarFrame);

      return;
    }

    // Guardamos referencias más cortas.
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const poseLandmarker = poseLandmarkerRef.current;

    // Comprobamos que el vídeo tenga datos suficientes
    // para poder analizarlo.
    if (video.readyState < 2) {
      animationFrameRef.current =
        requestAnimationFrame(analizarFrame);

      return;
    }

    // Hacemos que la resolución interna del canvas
    // coincida con la resolución real de la webcam.
    if (
      canvas.width !== video.videoWidth ||
      canvas.height !== video.videoHeight
    ) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Obtenemos el contexto 2D del canvas.
    const contexto = canvas.getContext("2d");

    // Si no existe, no podemos dibujar.
    if (!contexto) {
      return;
    }

    // Limpiamos lo dibujado en el frame anterior.
    contexto.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    try {
      // --------------------------------------------------
      // ANALIZAMOS EL FRAME REAL DE LA WEBCAM
      // --------------------------------------------------

      // MediaPipe procesa el frame actual del vídeo.
      // timestamp indica el momento exacto del frame en milisegundos.
      const resultado = poseLandmarker.detectForVideo(
        video,
        timestamp
      );

      // Comprobamos que MediaPipe haya detectado
      // al menos una persona.
      if (resultado.landmarks.length > 0) {
        // Obtenemos todos los landmarks
        // de la primera persona detectada.
        const landmarks = resultado.landmarks[0];

        // Landmark 12 = hombro derecho.
        const hombroNormalizado = landmarks[12];

        // Landmark 14 = codo derecho.
        const codoNormalizado = landmarks[14];

        // Landmark 16 = muñeca derecha.
        const munecaNormalizada = landmarks[16];

        // Comprobamos que los tres landmarks existan.
        if (
          hombroNormalizado &&
          codoNormalizado &&
          munecaNormalizada
        ) {
          // Comprobamos que los tres puntos tengan
          // suficiente visibilidad.
          if (
            esLandmarkValido(hombroNormalizado) &&
            esLandmarkValido(codoNormalizado) &&
            esLandmarkValido(munecaNormalizada)
          ) {
            // Convertimos las coordenadas normalizadas
            // de MediaPipe a píxeles reales.
            const hombro = convertirAPixeles(
              hombroNormalizado,
              canvas
            );

            const codo = convertirAPixeles(
              codoNormalizado,
              canvas
            );

            const muneca = convertirAPixeles(
              munecaNormalizada,
              canvas
            );

            // Dibujamos el brazo derecho
            // encima de la imagen de la webcam.
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
      // Si MediaPipe falla al procesar algún frame,
      // mostramos el error sin detener toda la aplicación.
      console.error(
        "Error analizando el frame:",
        error
      );
    }

    // Solicitamos analizar el siguiente frame.
    animationFrameRef.current =
      requestAnimationFrame(analizarFrame);
  }

  // Inicia el bucle de análisis.
  function iniciarAnalisis() {
    // No iniciamos el análisis si MediaPipe
    // todavía no está preparado.
    if (!poseLandmarkerRef.current) {
      return;
    }

    // Evitamos tener dos bucles funcionando a la vez.
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Iniciamos el primer frame.
    animationFrameRef.current =
      requestAnimationFrame(analizarFrame);

    console.log("Análisis de pose iniciado");
  }

  // Se ejecuta cuando el vídeo ya tiene datos suficientes
  // para poder empezar a analizarlo.
  function videoPreparado() {
    // Mostramos la resolución real.
    if (videoRef.current) {
      console.log(
        "Resolución:",
        videoRef.current.videoWidth,
        videoRef.current.videoHeight
      );
    }

    // Si MediaPipe ya está cargado,
    // comenzamos el análisis.
    iniciarAnalisis();
  }

  return (
    // Contenedor común de vídeo y canvas.
    <div className="camera-container">

      <video
        // Referencia al vídeo.
        ref={videoRef}

        // Reproduce automáticamente la webcam.
        autoPlay

        // Mantiene el vídeo integrado en la página
        // en dispositivos móviles.
        playsInline

        // Cuando el vídeo está preparado,
        // intentamos iniciar MediaPipe.
        onLoadedData={videoPreparado}

        // Clase CSS del vídeo.
        className="camera-video"
      />

      <canvas
        // Referencia al canvas.
        ref={canvasRef}

        // Clase CSS que coloca el canvas
        // encima del vídeo.
        className="camera-canvas"
      />

    </div>
  );
}

// Exportamos CameraPreview
// para poder utilizarlo desde App.tsx.
export default CameraPreview;