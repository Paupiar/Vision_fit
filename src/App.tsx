// Importamos los hooks necesarios de React.
import {
  useEffect,
  useRef,
  useState
} from "react";

// Tipo utilizado por el selector
// de archivos.
import type {
  ChangeEvent
} from "react";

// Estilos generales.
import "./App.css";


// --------------------------------------------------
// COMPONENTE DE CÁMARA
// --------------------------------------------------
//
// CameraPreview gestiona internamente
// qué análisis utilizar:
//
// - Curl
// - Sentadilla
// - Press de hombro
// --------------------------------------------------

import CameraPreview
  from "./components/CameraPreview";


// --------------------------------------------------
// COMPONENTE DE VÍDEO
// --------------------------------------------------
//
// VideoPreview será también
// el único punto de entrada
// para el análisis de vídeos.
//
// Actualmente decide internamente
// qué ejercicio analizar.
// --------------------------------------------------

import VideoPreview
  from "./components/VideoPreview";


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

  // Input oculto utilizado
  // para seleccionar vídeos.
  const inputVideoRef =
    useRef<HTMLInputElement | null>(
      null
    );


  // Guardamos también la URL temporal
  // en una referencia para poder
  // liberarla correctamente.
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
  // LIMPIAR VÍDEO
  // ==================================================

  function limpiarVideoSeleccionado() {
    // ----------------------------------------------
    // LIBERAR URL TEMPORAL
    // ----------------------------------------------

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


    // ----------------------------------------------
    // LIMPIAR ESTADOS
    // ----------------------------------------------

    setUrlVideo(
      null
    );


    setNombreVideo(
      ""
    );


    // ----------------------------------------------
    // REINICIAR INPUT
    // ----------------------------------------------
    //
    // Esto permite seleccionar posteriormente
    // exactamente el mismo archivo.
    // ----------------------------------------------

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
    // Buscamos el ejercicio
    // dentro de nuestra configuración.
    const ejercicioEncontrado =
      EJERCICIOS.find(
        function (elemento) {
          return (
            elemento.id ===
            ejercicio
          );
        }
      );


    // ----------------------------------------------
    // COMPROBAR DISPONIBILIDAD
    // ----------------------------------------------

    if (
      !ejercicioEncontrado ||
      !ejercicioEncontrado.disponible
    ) {
      return;
    }


    // ----------------------------------------------
    // APAGAR CÁMARA
    // ----------------------------------------------
    //
    // Cuando cambiamos de ejercicio
    // desmontamos CameraPreview.
    //
    // De esta forma se detienen correctamente
    // la webcam y MediaPipe.
    // ----------------------------------------------

    setMostrarCamara(
      false
    );


    // ----------------------------------------------
    // LIMPIAR VÍDEO
    // ----------------------------------------------
    //
    // Solo eliminamos el vídeo
    // si realmente cambiamos de ejercicio.
    // ----------------------------------------------

    if (
      ejercicioSeleccionado !==
      ejercicio
    ) {
      limpiarVideoSeleccionado();
    }


    // ----------------------------------------------
    // GUARDAR EJERCICIO
    // ----------------------------------------------

    setEjercicioSeleccionado(
      ejercicio
    );


    console.log(
      "Ejercicio seleccionado:",
      ejercicio
    );
  }


  // ==================================================
  // ENCENDER / APAGAR CÁMARA
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
    // No permitimos cargar vídeo
    // hasta seleccionar un ejercicio.
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


    // ----------------------------------------------
    // USUARIO CANCELA
    // ----------------------------------------------

    if (
      !archivo
    ) {
      return;
    }


    // ----------------------------------------------
    // COMPROBAR TIPO
    // ----------------------------------------------

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
    // LIBERAR VÍDEO ANTERIOR
    // ----------------------------------------------

    if (
      urlVideoRef.current !==
      null
    ) {
      URL.revokeObjectURL(
        urlVideoRef.current
      );
    }


    // ----------------------------------------------
    // CREAR URL TEMPORAL
    // ----------------------------------------------

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


    // ----------------------------------------------
    // APAGAR CÁMARA
    // ----------------------------------------------
    //
    // El usuario utiliza una fuente
    // u otra, pero no ambas
    // simultáneamente.
    // ----------------------------------------------

    setMostrarCamara(
      false
    );


    console.log(
      "Vídeo seleccionado:",
      archivo.name
    );
  }


  // ==================================================
  // LIMPIEZA DE LA APLICACIÓN
  // ==================================================

  useEffect(function () {
    return function limpiarAplicacion() {
      // Si la aplicación se desmonta,
      // liberamos la URL temporal
      // del vídeo.
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
            SELECTOR DE EJERCICIO
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
                    {
                      ejercicio.nombre
                    }


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

              {/* ======================================
                  CÁMARA
                  ====================================== */}

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


              {/* ======================================
                  VÍDEO
                  ====================================== */}

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
          INPUT OCULTO DE VÍDEO
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
      
          App ya no necesita saber
          cómo funciona cada ejercicio.
      
          Simplemente pasa el identificador
          a CameraPreview.
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
          ==============================================
      
          Igual que ocurre con la cámara,
          App solamente pasa:
      
          - ejercicio;
          - URL;
          - nombre;
          - visibilidad.
      
          VideoPreview decide internamente
          qué análisis debe ejecutar.
          ============================================== */}

      {urlVideo !==
        null &&
      ejercicioSeleccionado !==
        null ? (

        <VideoPreview
          ejercicio={
            ejercicioSeleccionado
          }

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