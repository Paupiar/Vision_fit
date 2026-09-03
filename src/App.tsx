// Importamos los hooks necesarios de React.
import {
  useRef,
  useState
} from "react";

// Importamos el tipo utilizado
// cuando cambia el input de archivos.
import type {
  ChangeEvent
} from "react";

// Importamos los estilos actuales.
import "./App.css";

// Importamos el componente de la cámara.
import CameraPreview from "./components/CameraPreview";


function App() {
  // --------------------------------------------------
  // CÁMARA
  // --------------------------------------------------

  // Controla si la cámara está visible.
  //
  // Conservamos exactamente el funcionamiento
  // que ya teníamos y sabemos que funciona.
  const [
    mostrarCamara,
    setMostrarCamara
  ] =
    useState<boolean>(
      true
    );


  // --------------------------------------------------
  // VÍDEO
  // --------------------------------------------------

  // Referencia al input de archivos.
  //
  // El input estará oculto y lo abriremos
  // utilizando el botón "Cargar vídeo".
  const inputVideoRef =
    useRef<HTMLInputElement | null>(
      null
    );


  // Guardamos únicamente el nombre
  // del vídeo seleccionado.
  //
  // TODAVÍA no vamos a reproducirlo.
  const [
    nombreVideo,
    setNombreVideo
  ] =
    useState<string>("");


  // --------------------------------------------------
  // ENCENDER / APAGAR CÁMARA
  // --------------------------------------------------

  function cambiarCamara() {
    setMostrarCamara(
      !mostrarCamara
    );
  }


  // --------------------------------------------------
  // ABRIR SELECTOR DE VÍDEO
  // --------------------------------------------------

  function abrirSelectorVideo() {
    // Simulamos un clic sobre
    // el input oculto.
    if (
      inputVideoRef.current
    ) {
      inputVideoRef.current.click();
    }
  }


  // --------------------------------------------------
  // SELECCIONAR VÍDEO
  // --------------------------------------------------

  function seleccionarVideo(
    evento:
      ChangeEvent<HTMLInputElement>
  ) {
    // Recuperamos el primer archivo seleccionado.
    const archivo =
      evento.target.files?.[0];


    // Si el usuario cancela,
    // no hacemos nada.
    if (!archivo) {
      return;
    }


    // Comprobamos que sea un archivo de vídeo.
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


    // De momento solamente guardamos
    // el nombre del archivo.
    setNombreVideo(
      archivo.name
    );


    console.log(
      "Vídeo seleccionado:",
      archivo
    );
  }


  // --------------------------------------------------
  // INTERFAZ
  // --------------------------------------------------

  return (
    <main>

      {/* Título principal. */}
      <h1>
        Visión Fit
      </h1>


      {/* ----------------------------------------------
          CONTROL DE CÁMARA
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

      {/* Este botón solamente abre
          el selector de archivos.

          NO apaga la cámara.
          NO reproduce el vídeo.
          NO toca MediaPipe. */}
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


      {/* Input real de archivos.

          Está oculto porque lo abrimos
          desde el botón anterior. */}
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


      {/* Si seleccionamos un archivo,
          mostramos únicamente su nombre. */}
      {nombreVideo !== "" ? (
        <p>
          <strong>
            Vídeo seleccionado:
          </strong>{" "}
          {nombreVideo}
        </p>
      ) : null}


      {/* ----------------------------------------------
          CÁMARA
          ---------------------------------------------- */}

      {/* Conservamos exactamente
          el comportamiento anterior. */}
      {mostrarCamara ? (
        <CameraPreview />
      ) : null}

    </main>
  );
}


// Exportamos el componente.
export default App;