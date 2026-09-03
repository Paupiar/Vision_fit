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
  //
  // false -> la cámara empieza apagada.
  // true  -> CameraPreview se monta y
  //          solicita acceso a la webcam.
  const [
    mostrarCamara,
    setMostrarCamara
  ] =
    useState<boolean>(
      false
    );


  // --------------------------------------------------
  // VÍDEO
  // --------------------------------------------------

  // Referencia al input oculto
  // utilizado para seleccionar archivos.
  const inputVideoRef =
    useRef<HTMLInputElement | null>(
      null
    );


  // Guarda internamente la URL temporal
  // del vídeo seleccionado.
  const urlVideoRef =
    useRef<string | null>(
      null
    );


  // Nombre original del archivo.
  const [
    nombreVideo,
    setNombreVideo
  ] =
    useState<string>(
      ""
    );


  // URL temporal utilizada
  // por el elemento <video>.
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
    // Cambiamos entre:
    //
    // false -> cámara apagada.
    // true  -> cámara encendida.
    setMostrarCamara(
      !mostrarCamara
    );
  }


  // --------------------------------------------------
  // ABRIR SELECTOR DE VÍDEO
  // --------------------------------------------------

  function abrirSelectorVideo() {
    // El input está oculto visualmente.
    //
    // Este botón provoca el clic
    // sobre el input real.
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
    // Recuperamos el primer archivo
    // seleccionado por el usuario.
    const archivo =
      evento.target.files?.[0];


    // Si el usuario cancela
    // el selector, no hacemos nada.
    if (!archivo) {
      return;
    }


    // ------------------------------------------------
    // COMPROBAR TIPO DE ARCHIVO
    // ------------------------------------------------

    // Solo aceptamos archivos cuyo tipo MIME
    // empiece por "video/".
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
    // ELIMINAR URL ANTERIOR
    // ------------------------------------------------

    // Si ya habíamos cargado otro vídeo,
    // liberamos su URL temporal.
    if (
      urlVideoRef.current !==
      null
    ) {
      URL.revokeObjectURL(
        urlVideoRef.current
      );
    }


    // ------------------------------------------------
    // CREAR URL DEL NUEVO VÍDEO
    // ------------------------------------------------

    // Creamos una URL temporal
    // para reproducir directamente
    // el archivo local.
    //
    // El vídeo no se sube
    // a ningún servidor.
    const nuevaUrl =
      URL.createObjectURL(
        archivo
      );


    // Guardamos la URL internamente.
    urlVideoRef.current =
      nuevaUrl;


    // Guardamos la URL en React
    // para mostrar el vídeo.
    setUrlVideo(
      nuevaUrl
    );


    // Guardamos el nombre original.
    setNombreVideo(
      archivo.name
    );


    // ------------------------------------------------
    // APAGAR CÁMARA
    // ------------------------------------------------

    // Si el usuario selecciona un vídeo,
    // la cámara se apaga automáticamente.
    //
    // CameraPreview desaparecerá
    // y ejecutará su limpieza.
    setMostrarCamara(
      false
    );


    console.log(
      "Vídeo seleccionado:",
      archivo.name
    );
  }


  // --------------------------------------------------
  // LIMPIEZA DE LA URL DEL VÍDEO
  // --------------------------------------------------

  useEffect(function () {
    // Cuando App desaparezca,
    // liberamos la URL temporal.
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
          INPUT DE ARCHIVOS
          ---------------------------------------------- */}

      {/* El input real está oculto.

          El botón "Cargar vídeo"
          lo abre utilizando inputVideoRef. */}
      <input
        ref={
          inputVideoRef
        }

        type="file"

        // Pedimos al sistema que muestre
        // archivos de vídeo.
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

      {/* El vídeo aparece solamente cuando:

          1. existe un vídeo seleccionado;
          2. la cámara está apagada.

          Así no mostramos cámara
          y vídeo simultáneamente. */}
      {urlVideo !== null &&
      mostrarCamara === false ? (

        <section
          style={{
            marginTop: "20px",
            marginBottom: "20px"
          }}
        >

          {/* Nombre del archivo seleccionado. */}
          <p>
            <strong>
              Vídeo seleccionado:
            </strong>{" "}
            {nombreVideo}
          </p>


          {/* Reproductor del vídeo local. */}
          <video
            // URL temporal generada
            // con URL.createObjectURL().
            src={
              urlVideo
            }

            // Controles normales:
            // play, pausa, volumen,
            // barra de tiempo...
            controls

            // Mejora el funcionamiento
            // en dispositivos móviles.
            playsInline

            // De momento solo controlamos
            // el tamaño del vídeo.
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

      {/* CameraPreview solamente existe
          cuando mostrarCamara es true.

          Como el estado inicial es false,
          la webcam NO se enciende
          al abrir la aplicación. */}
      {mostrarCamara ? (
        <CameraPreview />
      ) : null}

    </main>
  );
}


// Exportamos el componente principal.
export default App;