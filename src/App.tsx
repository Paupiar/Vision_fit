// Importamos los hooks necesarios de React.
import {
  useEffect,
  useRef,
  useState
} from "react";

// Tipo del evento utilizado
// para seleccionar archivos.
import type {
  ChangeEvent
} from "react";

// Estilos generales.
import "./App.css";

// Componente de cámara.
import CameraPreview from "./components/CameraPreview";

// Componente de vídeo.
import VideoPreview from "./components/VideoPreview";


function App() {
  // ==================================================
  // CÁMARA
  // ==================================================

  // La cámara empieza apagada.
  const [
    mostrarCamara,
    setMostrarCamara
  ] =
    useState<boolean>(
      false
    );


  // ==================================================
  // SELECCIÓN DE VÍDEO
  // ==================================================

  // Input oculto utilizado
  // para seleccionar el archivo.
  const inputVideoRef =
    useRef<HTMLInputElement | null>(
      null
    );


  // URL temporal del vídeo.
  const urlVideoRef =
    useRef<string | null>(
      null
    );


  // Nombre del archivo.
  const [
    nombreVideo,
    setNombreVideo
  ] =
    useState<string>(
      ""
    );


  // URL utilizada por VideoPreview.
  const [
    urlVideo,
    setUrlVideo
  ] =
    useState<string | null>(
      null
    );


  // ==================================================
  // CÁMARA
  // ==================================================

  function cambiarCamara() {
    // Simplemente mostramos
    // u ocultamos CameraPreview.
    //
    // VideoPreview recibirá también
    // esta información para detener
    // su reproducción si es necesario.
    setMostrarCamara(
      !mostrarCamara
    );
  }


  // ==================================================
  // ABRIR SELECTOR DE VÍDEO
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
    // Recuperamos el primer archivo.
    const archivo =
      evento.target.files?.[0];


    // Si el usuario cancela,
    // no hacemos nada.
    if (!archivo) {
      return;
    }


    // Comprobamos que sea un vídeo.
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


    // ------------------------------------------------
    // LIBERAR URL ANTERIOR
    // ------------------------------------------------

    if (
      urlVideoRef.current !==
      null
    ) {
      URL.revokeObjectURL(
        urlVideoRef.current
      );
    }


    // ------------------------------------------------
    // CREAR NUEVA URL
    // ------------------------------------------------

    // El archivo permanece en el dispositivo.
    //
    // Creamos únicamente una URL temporal
    // para que el navegador pueda reproducirlo.
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


    // Al seleccionar un vídeo
    // apagamos la webcam.
    setMostrarCamara(
      false
    );


    console.log(
      "Vídeo seleccionado:",
      archivo.name
    );
  }


  // ==================================================
  // LIMPIEZA
  // ==================================================

  useEffect(function () {
    return function limpiarAplicacion() {
      // Liberamos la URL temporal
      // cuando desaparece App.
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
          ENCENDER / APAGAR CÁMARA
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


      {/* ----------------------------------------------
          CARGAR VÍDEO
          ---------------------------------------------- */}
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
          INPUT OCULTO
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
          CÁMARA
          ============================================== */}

      {/* CameraPreview únicamente existe
          mientras la cámara está activa. */}
      {mostrarCamara ? (
        <CameraPreview />
      ) : null}


      {/* ==============================================
          VÍDEO
          ============================================== */}

      {/* VideoPreview permanece montado
          mientras exista un vídeo seleccionado.

          Cuando la cámara está activa
          recibe visible=false y se oculta.

          De esta forma toda la lógica
          relacionada con vídeo deja
          de estar dentro de App.tsx. */}
      {urlVideo !== null ? (
        <VideoPreview
          urlVideo={
            urlVideo
          }

          nombreVideo={
            nombreVideo
          }

          visible={
            !mostrarCamara
          }
        />
      ) : null}

    </main>
  );
}


// Exportamos App.
export default App;