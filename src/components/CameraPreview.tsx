// Importamos useEffect para gestionar el ciclo de vida del componente
// y useRef para acceder al vídeo, canvas y animación.
import { useEffect, useRef } from "react";

// Definimos la estructura básica de un punto 2D.
// x e y serán coordenadas normalizadas entre 0 y 1.
interface Punto {
  x: number;
  y: number;
}

function CameraPreview() {
  // Referencia al elemento <video>.
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Referencia al elemento <canvas>.
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Guardamos aquí el identificador de requestAnimationFrame.
  // Nos permitirá detener la animación posteriormente.
  const animationFrameRef = useRef<number | null>(null);

  useEffect(function () {
    // Guardaremos aquí el stream recibido de la webcam.
    let stream: MediaStream | null = null;

    // Permite saber si CameraPreview sigue montado.
    let componenteActivo = true;

    // Función encargada de solicitar acceso a la webcam.
    async function iniciarCamara() {
      try {
        // Pedimos acceso solamente al vídeo.
        const nuevoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });

        // Si el componente se desmontó mientras esperábamos
        // a recibir la cámara, detenemos el stream inmediatamente.
        if (!componenteActivo) {
          nuevoStream.getTracks().forEach(function (track) {
            track.stop();
          });

          return;
        }

        // Guardamos el stream para poder detenerlo después.
        stream = nuevoStream;

        // Comprobamos que exista el elemento <video>.
        if (videoRef.current) {
          // Conectamos la webcam con el vídeo.
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        // Mostramos cualquier problema relacionado con la webcam.
        console.error("No se pudo acceder a la cámara:", error);
      }
    }

    // Iniciamos la cámara cuando aparece el componente.
    iniciarCamara();

    // Esta función se ejecuta cuando CameraPreview se desmonta.
    return function detenerCamara() {
      // Indicamos que el componente ha dejado de estar activo.
      componenteActivo = false;

      // Detenemos la animación del canvas si existe.
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Detenemos todas las pistas de la webcam.
      if (stream) {
        stream.getTracks().forEach(function (track) {
          track.stop();
        });
      }

      // Desconectamos el stream del elemento <video>.
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // Convierte coordenadas normalizadas entre 0 y 1
  // a coordenadas reales en píxeles del canvas.
  function convertirAPixeles(
    punto: Punto,
    canvas: HTMLCanvasElement
  ): Punto {
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

    // Dibujamos el círculo.
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

  // Dibuja una conexión entre dos landmarks.
  function dibujarConexion(
    contexto: CanvasRenderingContext2D,
    puntoInicial: Punto,
    puntoFinal: Punto
  ) {
    // Empezamos una nueva línea.
    contexto.beginPath();

    // Colocamos el inicio de la línea.
    contexto.moveTo(
      puntoInicial.x,
      puntoInicial.y
    );

    // Indicamos dónde termina.
    contexto.lineTo(
      puntoFinal.x,
      puntoFinal.y
    );

    // Definimos el grosor de la línea.
    contexto.lineWidth = 5;

    // Definimos el color.
    contexto.strokeStyle = "blue";

    // Dibujamos la línea.
    contexto.stroke();
  }

  // Dibuja un brazo formado por hombro, codo y muñeca.
  function dibujarBrazo(
    contexto: CanvasRenderingContext2D,
    hombro: Punto,
    codo: Punto,
    muneca: Punto
  ) {
    // Dibujamos hombro -> codo.
    dibujarConexion(
      contexto,
      hombro,
      codo
    );

    // Dibujamos codo -> muñeca.
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

  // Esta función se ejecutará continuamente,
  // aproximadamente una vez por cada frame de pantalla.
  function dibujarFrame(timestamp: number) {
    // Necesitamos que existan vídeo y canvas.
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    // Guardamos las referencias en variables más cómodas.
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Igualamos la resolución del canvas a la resolución real del vídeo.
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Obtenemos el contexto 2D.
    const contexto = canvas.getContext("2d");

    // Si no existe, detenemos este frame.
    if (!contexto) {
      return;
    }

    // Limpiamos completamente el frame anterior.
    contexto.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Creamos un valor que cambia continuamente entre -1 y 1.
    // timestamp aumenta con el paso del tiempo.
    // Math.sin() nos permite crear un movimiento suave.
    const movimiento = Math.sin(timestamp / 500);

    // El hombro permanece quieto.
    const hombroNormalizado: Punto = {
      x: 0.4,
      y: 0.25
    };

    // El codo se mueve ligeramente.
    const codoNormalizado: Punto = {
      x: 0.5 + movimiento * 0.05,
      y: 0.5
    };

    // La muñeca se mueve más que el codo,
    // simulando aproximadamente una flexión del brazo.
    const munecaNormalizada: Punto = {
      x: 0.65 + movimiento * 0.15,
      y: 0.7 - movimiento * 0.15
    };

    // Convertimos los landmarks a píxeles reales.
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

    // Dibujamos el brazo actualizado.
    dibujarBrazo(
      contexto,
      hombro,
      codo,
      muneca
    );

    // Pedimos al navegador que vuelva a ejecutar
    // esta misma función en el siguiente frame.
    animationFrameRef.current =
      requestAnimationFrame(dibujarFrame);
  }

  // Se ejecuta cuando el vídeo ya conoce su resolución real.
  function iniciarDibujo() {
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

    // Si ya existiera una animación anterior,
    // la cancelamos para evitar dos bucles simultáneos.
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Iniciamos el primer frame.
    animationFrameRef.current =
      requestAnimationFrame(dibujarFrame);
  }

  return (
    // Contenedor común para vídeo y canvas.
    <div className="camera-container">

      <video
        // Conectamos el elemento con videoRef.
        ref={videoRef}

        // Reproduce automáticamente la webcam.
        autoPlay

        // Mantiene el vídeo integrado en la página en móviles.
        playsInline

        // Cuando el vídeo está preparado,
        // iniciamos nuestro bucle de dibujo.
        onLoadedMetadata={iniciarDibujo}

        // Clase CSS del vídeo.
        className="camera-video"
      />

      <canvas
        // Conectamos el canvas con canvasRef.
        ref={canvasRef}

        // Clase CSS que coloca el canvas sobre el vídeo.
        className="camera-canvas"
      />

    </div>
  );
}

// Exportamos CameraPreview para utilizarlo desde App.tsx.
export default CameraPreview;