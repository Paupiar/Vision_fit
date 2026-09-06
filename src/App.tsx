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
// COMPONENTES
// --------------------------------------------------

import CameraPreview
  from "./components/CameraPreview";

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


// --------------------------------------------------
// LADO
// --------------------------------------------------

import type {
  Lado
} from "./ejercicios/landmarks";


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
  // LADO
  // ==================================================
  //
  // Curl y Sentadilla utilizan
  // el lado seleccionado.
  //
  // El Press ignora este valor
  // porque continúa siendo bilateral.
  // ==================================================

  const [
    ladoSeleccionado,
    setLadoSeleccionado
  ] =
    useState<Lado>(
      "derecho"
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
  // ¿EL EJERCICIO UTILIZA LADO?
  // ==================================================
  //
  // Actualmente:
  //
  // Curl        -> sí
  // Sentadilla  -> sí
  // Press       -> no, es bilateral
  // ==================================================

  const mostrarSelectorLado =
    ejercicioSeleccionado ===
      "curl" ||
    ejercicioSeleccionado ===
      "sentadilla";


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
  // SELECCIONAR LADO
  // ==================================================

  function seleccionarLado(
    lado: Lado
  ) {
    // Si ya está seleccionado,
    // no hacemos nada.
    if (
      ladoSeleccionado ===
      lado
    ) {
      return;
    }


    setLadoSeleccionado(
      lado
    );


    console.log(
      "Lado seleccionado:",
      lado
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
  // LIMPIEZA DE LA APLICACIÓN
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
            SELECTOR DE LADO
            ============================================
        
            Solo aparece para:
        
            - Curl
            - Sentadilla
        
            El Press sigue siendo bilateral.
            ============================================ */}

        {mostrarSelectorLado ? (

          <section className="exercise-selector">

            <h2>
              Lado a analizar
            </h2>


            <div className="exercise-buttons">

              {/* -------------------------------------
                  IZQUIERDO
                  ------------------------------------- */}

              <button
                type="button"

                onClick={
                  function () {
                    seleccionarLado(
                      "izquierdo"
                    );
                  }
                }

                className={
                  ladoSeleccionado ===
                  "izquierdo"
                    ? "exercise-button exercise-button-active"
                    : "exercise-button"
                }
              >
                Izquierdo
              </button>


              {/* -------------------------------------
                  DERECHO
                  ------------------------------------- */}

              <button
                type="button"

                onClick={
                  function () {
                    seleccionarLado(
                      "derecho"
                    );
                  }
                }

                className={
                  ladoSeleccionado ===
                  "derecho"
                    ? "exercise-button exercise-button-active"
                    : "exercise-button"
                }
              >
                Derecho
              </button>

            </div>

          </section>

        ) : null}


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
      
          Pasamos ahora:
      
          - ejercicio;
          - lado.
      
          La key hace que al cambiar de lado
          se cree una sesión de análisis nueva.
          ============================================== */}

      {mostrarCamara &&
      ejercicioSeleccionado !==
        null ? (

        <CameraPreview
          key={
            ejercicioSeleccionado +
            "-" +
            ladoSeleccionado
          }

          ejercicio={
            ejercicioSeleccionado
          }

          lado={
            ladoSeleccionado
          }
        />

      ) : null}


      {/* ==============================================
          VÍDEO
          ==============================================
      
          También pasamos el lado seleccionado
          al análisis de vídeo.
      
          Al cambiar de lado se reinicia
          la sesión de análisis,
          pero se mantiene el vídeo cargado.
          ============================================== */}

      {urlVideo !==
        null &&
      ejercicioSeleccionado !==
        null ? (

        <VideoPreview
          key={
            ejercicioSeleccionado +
            "-" +
            ladoSeleccionado +
            "-" +
            urlVideo
          }

          ejercicio={
            ejercicioSeleccionado
          }

          lado={
            ladoSeleccionado
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