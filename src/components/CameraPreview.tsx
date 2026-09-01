// Importamos useEffect para ejecutar código cuando el componente se carga
// e useRef para poder acceder directamente al elemento <video>.
import { useEffect, useRef } from "react";

function CameraPreview() {
  // Creamos una referencia al elemento <video>.
  // Al principio vale null porque el vídeo todavía no existe en el DOM.
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // useEffect ejecuta este código cuando el componente aparece en pantalla.
  useEffect(function () {
    // Creamos una función asíncrona porque acceder a la cámara tarda un poco
    // y necesitamos esperar a que el navegador nos devuelva el stream de vídeo.
    async function iniciarCamara() {
      try {
        // Pedimos permiso al navegador para utilizar la cámara.
        // video: true -> queremos usar la cámara.
        // audio: false -> no necesitamos utilizar el micrófono.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });

        // Comprobamos que el elemento <video> ya existe.
        if (videoRef.current) {
          // Conectamos el stream de la webcam con nuestro elemento <video>.
          // A partir de aquí debería empezar a verse la cámara en pantalla.
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        // Si el usuario rechaza el permiso o hay algún problema con la cámara,
        // mostramos el error en la consola del navegador.
        console.error("No se pudo acceder a la cámara:", error);
      }
    }

    // Ejecutamos la función que inicia la cámara.
    iniciarCamara();
  }, []);

  return (
    // Contenedor de la cámara.
    <div className="camera-container">
      <video
        // Conectamos este <video> con videoRef.
        ref={videoRef}

        // Hace que el vídeo se reproduzca automáticamente.
        autoPlay

        // Evita que en algunos móviles el vídeo se abra a pantalla completa.
        playsInline

        // Clase CSS que utilizaremos para darle estilo al vídeo.
        className="camera-video"
      />
    </div>
  );
}

// Exportamos el componente para poder utilizarlo desde App.tsx.
export default CameraPreview;