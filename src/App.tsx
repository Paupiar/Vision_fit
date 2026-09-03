// Importamos los hooks necesarios de React.
import {
  useEffect,
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

  // Referencia al input oculto de archivos.
  const inputVideoRef =
    useRef<HTMLInputElement | null>(
      null
    );


  // Guarda la URL temporal del vídeo.
  //
  // Esta URL permite reproducir un archivo local
  // sin subirlo a ningún servidor.
  const urlVideoRef =
    useRef<string | null>(
      null
    );


  // Nombre del archivo seleccionado.
  const [
    nombreVideo,
    setNombreVideo
  ] =
    useState<string>("");


  // URL utilizada por el elemento <video>.
  const [
    urlVideo,
    setUrlVideo
  ] =
    useState<string | null>(
      null
    );


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
    // Recuperamos el primer archivo.
    const archivo =
      evento.target.files?.[0];


    // Si el usuario cancela,
    // no hacemos nada.
    if (!archivo) {
      return;
    }


    // Comprobamos que realmente
    // sea un archivo de vídeo.
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


    // ----------------------------------------------
    // ELIMINAMOS LA URL ANTERIOR
    // ----------------------------------------------

    // Si antes habíamos seleccionado otro vídeo,
    // liberamos la URL temporal anterior.
    if (
      urlVideoRef.current !==
      null
    ) {
      URL.revokeObjectURL(
        urlVideoRef.current
      );
    }


    // ----------------------------------------------
    // CREAMOS LA URL DEL NUEVO VÍDEO
    // ----------------------------------------------

    // URL.createObjectURL permite al navegador
    // utilizar directamente el archivo local.
    const nuevaUrl =
      URL.createObjectURL(
        archivo
      );


    // Guardamos la URL en la referencia.
    urlVideoRef.current =
      nuevaUrl;


    // Guardamos la URL en React
    // para mostrar el vídeo.
    setUrlVideo(
      nuevaUrl
    );


    // Guardamos el nombre.
    setNombreVideo(
      archivo.name
    );


    console.log(
      "Vídeo seleccionado:",
      archivo.name
    );
  }


  // --------------------------------------------------
  // LIMPIEZA DE LA URL
  // --------------------------------------------------

  useEffect(function () {
    // Cuando App desaparezca,
    // eliminamos la URL temporal.
    return function limpiarUrlVideo() {
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


  // --------------------------------------------------
  // INTERFAZ
  // --------------------------------------------------

  return (
    <main>

      {/* ----------------------------------------------
          TÍTULO
          ---------------------------------------------- */}
      <h1>
        Visión Fit
      </h1>


      {/* ----------------------------------------------
          BOTÓN DE CÁMARA
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
          BOTÓN PARA CARGAR VÍDEO
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


      {/* ----------------------------------------------
          VÍDEO SELECCIONADO
          ---------------------------------------------- */}

      {urlVideo !== null ? (

        <section
          style={{
            marginTop: "20px",
            marginBottom: "20px"
          }}
        >

          <p>
            <strong>
              Vídeo seleccionado:
            </strong>{" "}
            {nombreVideo}
          </p>


          <video
            // URL del archivo seleccionado.
            src={
              urlVideo
            }

            // Controles normales:
            // play, pausa, volumen,
            // barra de tiempo...
            controls

            // Evita comportamientos extraños
            // en dispositivos móviles.
            playsInline

            // En este paso solo queremos
            // comprobar que se reproduce bien.
            style={{
              width: "100%",
              maxWidth: "640px",
              display: "block"
            }}
          />

        </section>

      ) : null}


      {/* ----------------------------------------------
          CÁMARA
          ---------------------------------------------- */}

      {/* La cámara continúa exactamente
          como antes.

          Seleccionar un vídeo NO modifica
          CameraPreview. */}
      {mostrarCamara ? (
        <CameraPreview />
      ) : null}

    </main>
  );
}


// Exportamos el componente.
export default App;