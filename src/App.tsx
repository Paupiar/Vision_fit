// Importamos los hooks necesarios de React.
import {
  useEffect,
  useRef,
  useState
} from "react";

// Tipos utilizados por React
// y por el selector de archivos.
import type {
  ChangeEvent,
  ComponentType
} from "react";

// Estilos generales.
import "./App.css";


// --------------------------------------------------
// CÁMARA
// --------------------------------------------------
//
// Ahora App solamente conoce
// un componente de cámara.
import CameraPreview
  from "./components/CameraPreview";


// --------------------------------------------------
// COMPONENTES DE VÍDEO
// --------------------------------------------------
//
// Los vídeos todavía mantienen
// sus tres componentes independientes.
//
// Los unificaremos después
// de terminar con la cámara.

// Curl.
import VideoPreview
  from "./components/VideoPreview";

// Sentadilla.
import SentadillaVideoPreview
  from "./components/SentadillaVideoPreview";

// Press de hombro bilateral.
import PressHombroVideoPreview
  from "./components/PressHombroVideoPreview";


// --------------------------------------------------
// EJERCICIOS
// --------------------------------------------------

import {
  EJERCICIOS
} from "./ejercicios/tipos";

import type {
  EjercicioId
} from "./ejercicios/tipos";


// ==================================================
// PROPS COMUNES DE LOS VÍDEOS
// ==================================================

interface VideoPreviewComunProps {
  urlVideo: string;

  nombreVideo: string;

  visible: boolean;
}


// ==================================================
// COMPONENTES DE VÍDEO POR EJERCICIO
// ==================================================
//
// Este sistema sigue siendo necesario
// mientras no hayamos unificado
// VideoPreview.
// ==================================================

const COMPONENTES_VIDEO:
  Record<
    EjercicioId,
    ComponentType<VideoPreviewComunProps>
  > = {
    curl:
      VideoPreview,

    sentadilla:
      SentadillaVideoPreview,

    "press-hombro":
      PressHombroVideoPreview
  };


function App() {
  // ==================================================
  // EJERCICIO
  // ==================================================

  const [
    ejercicioSeleccionado,
    setEjercicioSeleccionado
  ] =
    useState<EjercicioId | null>(
      null
    );


  // ==================================================
  // CÁMARA
  // ==================================================

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

  const inputVideoRef =
    useRef<HTMLInputElement | null>(
      null
    );


  const urlVideoRef =
    useRef<string | null>(
      null
    );


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


  // ==================================================
  // COMPONENTE DE VÍDEO ACTUAL
  // ==================================================

  const ComponenteVideo =
    ejercicioSeleccionado !==
    null
      ? COMPONENTES_VIDEO[
          ejercicioSeleccionado
        ]
      : null;


  // ==================================================
  // LIMPIAR VÍDEO
  // ==================================================

  function limpiarVideoSeleccionado() {
    // Liberamos la URL temporal anterior.
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


    setUrlVideo(
      null
    );


    setNombreVideo(
      ""
    );


    // Reiniciamos el input
    // para poder seleccionar
    // posteriormente el mismo archivo.
    if (
      inputVideoRef.current
    ) {
      inputVideoRef.current.value =
        "";
    }
  }


  // ==================================================
  // SELECCIONAR EJERCICIO
  // ==================================================

  function seleccionarEjercicio(
    ejercicio: EjercicioId
  ) {
    const ejercicioEncontrado =
      EJERCICIOS.find(
        function (elemento) {
          return (
            elemento.id ===
            ejercicio
          );
        }
      );


    // Evitamos seleccionar
    // ejercicios no disponibles.
    if (
      !ejercicioEncontrado ||
      !ejercicioEncontrado.disponible
    ) {
      return;
    }


    // Apagamos cualquier cámara activa.
    setMostrarCamara(
      false
    );


    // Si cambiamos realmente
    // de ejercicio,
    // eliminamos el vídeo anterior.
    if (
      ejercicioSeleccionado !==
      ejercicio
    ) {
      limpiarVideoSeleccionado();
    }


    setEjercicioSeleccionado(
      ejercicio
    );


    console.log(
      "Ejercicio seleccionado:",
      ejercicio
    );
  }


  // ==================================================
  // CÁMARA
  // ==================================================

  function cambiarCamara() {
    setMostrarCamara(
      !mostrarCamara
    );
  }


  // ==================================================
  // ABRIR SELECTOR DE VÍDEO
  // ==================================================

  function abrirSelectorVideo() {
    if (
      ejercicioSeleccionado ===
      null
    ) {
      return;
    }


    if (
      inputVideoRef.current
    ) {
      // Permitimos seleccionar
      // de nuevo el mismo archivo.
      inputVideoRef.current.value =
        "";


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


    // Si el usuario cancela,
    // no hacemos nada.
    if (
      !archivo
    ) {
      return;
    }


    // Comprobamos que sea
    // realmente un vídeo.
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


    // Liberamos una URL anterior.
    if (
      urlVideoRef.current !==
      null
    ) {
      URL.revokeObjectURL(
        urlVideoRef.current
      );
    }


    // Creamos una URL local.
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


    // Cuando seleccionamos vídeo,
    // apagamos la cámara.
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

      {/* ==============================================
          CABECERA
          ============================================== */}

      <div className="vision-fit-header">

        <h1>
          Visión Fit
        </h1>


        {/* ============================================
            EJERCICIOS
            ============================================ */}

        <section className="exercise-selector">

          <h2>
            Selecciona un ejercicio
          </h2>


          <div className="exercise-buttons">

            {EJERCICIOS.map(
              function (ejercicio) {
                const seleccionado =
                  ejercicio.id ===
                  ejercicioSeleccionado;


                return (
                  <button
                    key={
                      ejercicio.id
                    }

                    type="button"

                    disabled={
                      !ejercicio.disponible
                    }

                    onClick={
                      function () {
                        seleccionarEjercicio(
                          ejercicio.id
                        );
                      }
                    }

                    className={
                      seleccionado
                        ? "exercise-button exercise-button-active"
                        : "exercise-button"
                    }
                  >
                    {ejercicio.nombre}


                    {!ejercicio.disponible ? (
                      <>
                        {" "}
                        (próximamente)
                      </>
                    ) : null}

                  </button>
                );
              }
            )}

          </div>

        </section>


        {/* ============================================
            FUENTE DE ANÁLISIS
            ============================================ */}

        {ejercicioSeleccionado !==
        null ? (

          <section className="analysis-source-selector">

            <h2>
              Fuente de análisis
            </h2>


            <div className="analysis-source-buttons">

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
              >
                Cargar vídeo
              </button>

            </div>

          </section>

        ) : null}

      </div>


      {/* ==============================================
          INPUT DE VÍDEO
          ============================================== */}

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
          display:
            "none"
        }}
      />


      {/* ==============================================
          CÁMARA
          ==============================================
      
          Ya existe un único punto de entrada
          para cualquier ejercicio.
          ============================================== */}

      {mostrarCamara &&
      ejercicioSeleccionado !==
        null ? (

        <CameraPreview
          ejercicio={
            ejercicioSeleccionado
          }
        />

      ) : null}


      {/* ==============================================
          VÍDEO
          ============================================== */}

      {urlVideo !==
        null &&
      ComponenteVideo !==
        null ? (

        <ComponenteVideo
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


export default App;