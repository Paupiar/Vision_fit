// Importamos useEffect para gestionar cuándo se inicia y se detiene
// la cámara, y useRef para acceder directamente al <video> y <canvas>.
import { useEffect, useRef } from "react";

function CameraPreview() {
  // Referencia al elemento <video>.
  // Nos permitirá conectar la webcam con el vídeo de la página.
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Referencia al elemento <canvas>.
  // Nos permitirá dibujar puntos y líneas encima de la cámara.
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(function () {
    // Aquí guardaremos el stream de vídeo recibido de la webcam.
    let stream: MediaStream | null = null;

    // Esta variable nos permite saber si el componente
    // sigue estando activo.
    let componenteActivo = true;

    // Función asíncrona encargada de solicitar acceso a la webcam.
    async function iniciarCamara() {
      try {
        // Pedimos permiso al navegador para utilizar la cámara.
        // video: true -> queremos vídeo.
        // audio: false -> no necesitamos el micrófono.
        const nuevoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });

        // Si el componente se desmontó mientras esperábamos
        // a que la cámara se iniciara, detenemos el stream.
        if (!componenteActivo) {
          nuevoStream.getTracks().forEach(function (track) {
            // Detenemos cada pista activa del stream.
            track.stop();
          });

          return;
        }

        // Guardamos el stream para poder detenerlo más adelante.
        stream = nuevoStream;

        // Comprobamos que el elemento <video> exista.
        if (videoRef.current) {
          // Conectamos la webcam con el elemento <video>.
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        // Si el usuario rechaza el permiso o hay algún problema
        // con la webcam, mostramos el error en consola.
        console.error("No se pudo acceder a la cámara:", error);
      }
    }

    // Iniciamos la cámara cuando aparece CameraPreview.
    iniciarCamara();

    // Esta función se ejecuta cuando CameraPreview desaparece.
    return function detenerCamara() {
      // Indicamos que el componente ya no está activo.
      componenteActivo = false;

      // Mostramos un mensaje para comprobar la limpieza.
      console.log("Deteniendo cámara");

      // Si existe un stream activo, detenemos sus pistas.
      if (stream) {
        stream.getTracks().forEach(function (track) {
          // Detenemos físicamente la pista de la webcam.
          track.stop();

          // Mostramos su estado para comprobar que ha finalizado.
          console.log("Estado de la pista:", track.readyState);
        });
      }

      // Desconectamos también el stream del elemento <video>.
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // Esta función convierte una coordenada normalizada
  // en una coordenada real del canvas y dibuja un punto.
  function dibujarPuntoPrueba() {
    // Comprobamos que existan tanto el vídeo como el canvas.
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    // Guardamos las referencias en variables más cómodas.
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Hacemos que la resolución interna del canvas coincida
    // exactamente con la resolución real recibida de la webcam.
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Obtenemos el contexto 2D necesario para dibujar.
    const contexto = canvas.getContext("2d");

    // Si no podemos obtener el contexto, detenemos la función.
    if (!contexto) {
      return;
    }

    // Limpiamos completamente el canvas antes de volver a dibujar.
    contexto.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Coordenadas simuladas como las que nos devolverá MediaPipe.
    // 0.75 significa el 75% del ancho.
    // 0.25 significa el 25% del alto.
    const xNormalizada = 0.75;
    const yNormalizada = 0.25;

    // Convertimos la coordenada X normalizada
    // a una posición real en píxeles.
    const xPixel = xNormalizada * canvas.width;

    // Convertimos la coordenada Y normalizada
    // a una posición real en píxeles.
    const yPixel = yNormalizada * canvas.height;

    // Iniciamos un nuevo trazado.
    contexto.beginPath();

    // Dibujamos un círculo:
    // xPixel -> posición horizontal.
    // yPixel -> posición vertical.
    // 20 -> radio del círculo.
    // 0 y Math.PI * 2 -> círculo completo.
    contexto.arc(
      xPixel,
      yPixel,
      20,
      0,
      Math.PI * 2
    );

    // Elegimos rojo para que el punto sea fácil de ver.
    contexto.fillStyle = "red";

    // Rellenamos el círculo.
    contexto.fill();

    // Mostramos la información en consola
    // para comprobar que la conversión funciona.
    console.log(
      "Coordenadas normalizadas:",
      xNormalizada,
      yNormalizada
    );

    console.log(
      "Coordenadas en píxeles:",
      xPixel,
      yPixel
    );
  }

  // Esta función se ejecuta cuando el navegador ya conoce
  // los metadatos del vídeo, incluida su resolución real.
  function mostrarResolucion() {
    // Comprobamos que el elemento <video> exista.
    if (!videoRef.current) {
      return;
    }

    // Mostramos la resolución real recibida de la webcam.
    console.log(
      "Ancho real:",
      videoRef.current.videoWidth
    );

    console.log(
      "Alto real:",
      videoRef.current.videoHeight
    );

    // Dibujamos el punto de prueba una vez conocemos
    // la resolución real del vídeo.
    dibujarPuntoPrueba();
  }

  return (
    // Contenedor común del vídeo y el canvas.
    <div className="camera-container">

      <video
        // Asociamos este elemento <video> con videoRef.
        ref={videoRef}

        // Hace que el vídeo empiece a reproducirse automáticamente.
        autoPlay

        // Evita que algunos móviles abran el vídeo
        // automáticamente a pantalla completa.
        playsInline

        // Cuando conocemos la resolución real del vídeo,
        // ejecutamos mostrarResolucion().
        onLoadedMetadata={mostrarResolucion}

        // Clase CSS utilizada para darle estilo.
        className="camera-video"
      />

      <canvas
        // Asociamos este elemento <canvas> con canvasRef.
        ref={canvasRef}

        // Clase CSS que lo coloca encima del vídeo.
        className="camera-canvas"
      />

    </div>
  );
}

// Exportamos el componente para utilizarlo desde App.tsx.
export default CameraPreview;