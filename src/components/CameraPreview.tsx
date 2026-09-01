// Importamos useEffect para gestionar el ciclo de vida del componente
// y useRef para acceder directamente al <video> y al <canvas>.
import { useEffect, useRef } from "react";

// Definimos un tipo sencillo para representar un punto 2D.
// De momento solo necesitamos las coordenadas x e y.
interface Punto {
  x: number;
  y: number;
}

function CameraPreview() {
  // Referencia al elemento <video>.
  // Nos permite conectar la webcam con el vídeo de la página.
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Referencia al elemento <canvas>.
  // Nos permite dibujar puntos y líneas encima de la webcam.
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(function () {
    // Aquí guardaremos el stream recibido de la cámara.
    let stream: MediaStream | null = null;

    // Sirve para saber si el componente sigue montado.
    let componenteActivo = true;

    // Función asíncrona que solicita acceso a la webcam.
    async function iniciarCamara() {
      try {
        // Pedimos acceso solo al vídeo.
        const nuevoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });

        // Si el componente ya se desmontó mientras esperábamos,
        // detenemos el stream inmediatamente.
        if (!componenteActivo) {
          nuevoStream.getTracks().forEach(function (track) {
            track.stop();
          });

          return;
        }

        // Guardamos el stream para poder detenerlo después.
        stream = nuevoStream;

        // Comprobamos que el elemento <video> exista.
        if (videoRef.current) {
          // Conectamos la webcam con el vídeo.
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        // Mostramos cualquier problema relacionado con la cámara.
        console.error("No se pudo acceder a la cámara:", error);
      }
    }

    // Iniciamos la cámara cuando aparece CameraPreview.
    iniciarCamara();

    // Esta función se ejecuta al desmontar CameraPreview.
    return function detenerCamara() {
      // Indicamos que el componente ya no está activo.
      componenteActivo = false;

      // Si existe un stream, detenemos todas sus pistas.
      if (stream) {
        stream.getTracks().forEach(function (track) {
          track.stop();
        });
      }

      // Desconectamos también el stream del elemento <video>.
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // Convierte un punto con coordenadas normalizadas
  // a coordenadas reales en píxeles del canvas.
  function convertirAPixeles(
    punto: Punto,
    canvas: HTMLCanvasElement
  ): Punto {
    // Multiplicamos la coordenada normalizada
    // por las dimensiones reales del canvas.
    return {
      x: punto.x * canvas.width,
      y: punto.y * canvas.height
    };
  }

  // Dibuja un landmark como un círculo.
  function dibujarLandmark(
    contexto: CanvasRenderingContext2D,
    punto: Punto
  ) {
    // Empezamos un nuevo trazado.
    contexto.beginPath();

    // Dibujamos un círculo centrado en el punto recibido.
    contexto.arc(
      punto.x,
      punto.y,
      12,
      0,
      Math.PI * 2
    );

    // Elegimos el color del landmark.
    contexto.fillStyle = "red";

    // Rellenamos el círculo.
    contexto.fill();
  }

  // Dibuja una línea entre dos puntos.
  function dibujarConexion(
    contexto: CanvasRenderingContext2D,
    puntoInicial: Punto,
    puntoFinal: Punto
  ) {
    // Empezamos un nuevo trazado.
    contexto.beginPath();

    // Movemos el "lápiz" al punto inicial.
    contexto.moveTo(
      puntoInicial.x,
      puntoInicial.y
    );

    // Dibujamos una línea hasta el punto final.
    contexto.lineTo(
      puntoFinal.x,
      puntoFinal.y
    );

    // Elegimos el grosor de la línea.
    contexto.lineWidth = 5;

    // Elegimos el color de la conexión.
    contexto.strokeStyle = "blue";

    // Dibujamos físicamente la línea.
    contexto.stroke();
  }

  // Dibuja hombro, codo y muñeca
  // y las conexiones entre ellos.
  function dibujarBrazo(
    contexto: CanvasRenderingContext2D,
    hombro: Punto,
    codo: Punto,
    muneca: Punto
  ) {
    // Dibujamos la conexión hombro -> codo.
    dibujarConexion(
      contexto,
      hombro,
      codo
    );

    // Dibujamos la conexión codo -> muñeca.
    dibujarConexion(
      contexto,
      codo,
      muneca
    );

    // Dibujamos los tres landmarks.
    dibujarLandmark(contexto, hombro);
    dibujarLandmark(contexto, codo);
    dibujarLandmark(contexto, muneca);
  }

  // Función de prueba que simula landmarks
  // como los que más adelante devolverá MediaPipe.
  function dibujarLandmarksPrueba() {
    // Comprobamos que existan vídeo y canvas.
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    // Guardamos las referencias en variables más cómodas.
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Igualamos la resolución interna del canvas
    // con la resolución real de la webcam.
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Obtenemos el contexto 2D.
    const contexto = canvas.getContext("2d");

    // Si no existe el contexto, detenemos la función.
    if (!contexto) {
      return;
    }

    // Limpiamos cualquier dibujo anterior.
    contexto.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Creamos landmarks simulados
    // usando coordenadas normalizadas entre 0 y 1.
    const hombroNormalizado: Punto = {
      x: 0.4,
      y: 0.25
    };

    const codoNormalizado: Punto = {
      x: 0.5,
      y: 0.5
    };

    const munecaNormalizada: Punto = {
      x: 0.65,
      y: 0.7
    };

    // Convertimos los landmarks normalizados
    // a coordenadas reales del canvas.
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

    // Dibujamos el brazo completo.
    dibujarBrazo(
      contexto,
      hombro,
      codo,
      muneca
    );

    // Mostramos un mensaje para comprobar
    // que el dibujo se ha realizado correctamente.
    console.log("Brazo simulado dibujado");
  }

  // Se ejecuta cuando el navegador ya conoce
  // la resolución real del vídeo.
  function mostrarResolucion() {
    // Comprobamos que el vídeo exista.
    if (!videoRef.current) {
      return;
    }

    // Mostramos la resolución real de la webcam.
    console.log(
      "Ancho real:",
      videoRef.current.videoWidth
    );

    console.log(
      "Alto real:",
      videoRef.current.videoHeight
    );

    // Dibujamos los landmarks simulados.
    dibujarLandmarksPrueba();
  }

  return (
    // Contenedor común para el vídeo y el canvas.
    <div className="camera-container">
      <video
        // Asociamos el vídeo con videoRef.
        ref={videoRef}

        // Hace que la webcam se reproduzca automáticamente.
        autoPlay

        // Mantiene el vídeo dentro de la página en móviles.
        playsInline

        // Cuando conocemos la resolución real,
        // ejecutamos mostrarResolucion().
        onLoadedMetadata={mostrarResolucion}

        // Clase CSS del vídeo.
        className="camera-video"
      />

      <canvas
        // Asociamos el canvas con canvasRef.
        ref={canvasRef}

        // Clase CSS que lo coloca encima del vídeo.
        className="camera-canvas"
      />
    </div>
  );
}

// Exportamos el componente para utilizarlo desde App.tsx.
export default CameraPreview;