import {
  useEffect,
  useRef,
  useState
} from "react";

import type {
  ChangeEvent
} from "react";

import "./App.css";


// --------------------------------------------------
// COMPONENTES
// --------------------------------------------------

import CameraPreview from "./components/CameraPreview";

import VideoPreview from "./components/VideoPreview";

import SentadillaPreview from "./components/SentadillaPreview";

// Nuevo componente para vídeos
// de sentadilla.
import SentadillaVideoPreview from "./components/SentadillaVideoPreview";


// --------------------------------------------------
// EJERCICIOS
// --------------------------------------------------

import {
  EJERCICIOS
} from "./ejercicios/tipos";

import type {
  EjercicioId
} from "./ejercicios/tipos";


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
  // LIMPIAR VÍDEO ACTUAL
  // ==================================================

  function limpiarVideoSeleccionado() {
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


    if (
      !ejercicioEncontrado ||
      !ejercicioEncontrado.disponible
    ) {
      return;
    }


    // Apagamos la cámara
    // antes de cambiar de ejercicio.
    setMostrarCamara(
      false
    );


    // Si cambiamos realmente de ejercicio,
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
    // Actualmente tenemos vídeo
    // para curl y sentadilla.
    if (
      ejercicioSeleccionado !==
        "curl" &&
      ejercicioSeleccionado !==
        "sentadilla"
    ) {
      return;
    }


    if (
      inputVideoRef.current
    ) {
      // Permite volver a seleccionar
      // incluso el mismo archivo.
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


    if (
      !archivo
    ) {
      return;
    }


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


    // Eliminamos la URL anterior.
    if (
      urlVideoRef.current !==
      null
    ) {
      URL.revokeObjectURL(
        urlVideoRef.current
      );
    }


    // Creamos la nueva URL local.
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


    // Si estaba activa la cámara,
    // la apagamos.
    setMostrarCamara(
      false
    );
  }


  // ==================================================
  // LIMPIEZA FINAL
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
            FUENTE
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
          INPUT OCULTO
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
          CURL - CÁMARA
          ============================================== */}

      {mostrarCamara &&
      ejercicioSeleccionado ===
        "curl" ? (

        <CameraPreview />

      ) : null}


      {/* ==============================================
          SENTADILLA - CÁMARA
          ============================================== */}

      {mostrarCamara &&
      ejercicioSeleccionado ===
        "sentadilla" ? (

        <SentadillaPreview />

      ) : null}


      {/* ==============================================
          CURL - VÍDEO
          ============================================== */}

      {urlVideo !==
        null &&
      ejercicioSeleccionado ===
        "curl" ? (

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


      {/* ==============================================
          SENTADILLA - VÍDEO
          ============================================== */}

      {urlVideo !==
        null &&
      ejercicioSeleccionado ===
        "sentadilla" ? (

        <SentadillaVideoPreview
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