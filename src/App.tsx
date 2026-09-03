// Importamos los hooks necesarios.
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

// Componente encargado
// de analizar la webcam.
import CameraPreview from "./components/CameraPreview";

// Componente encargado
// de analizar vídeos grabados.
import VideoPreview from "./components/VideoPreview";

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

  // Al abrir Visión Fit todavía
  // no hay ningún ejercicio seleccionado.
  //
  // Esto permite que la fuente de análisis
  // aparezca únicamente después
  // de elegir un ejercicio.
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

  // La cámara comienza apagada.
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
  // para seleccionar archivos.
  const inputVideoRef =
    useRef<HTMLInputElement | null>(
      null
    );


  // URL temporal del vídeo.
  const urlVideoRef =
    useRef<string | null>(
      null
    );


  // Nombre original del vídeo.
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
  // SELECCIONAR EJERCICIO
  // ==================================================

  function seleccionarEjercicio(
    ejercicio: EjercicioId
  ) {
    // Buscamos el ejercicio
    // dentro de nuestra lista.
    const ejercicioEncontrado =
      EJERCICIOS.find(
        function (elemento) {
          return (
            elemento.id ===
            ejercicio
          );
        }
      );


    // Si no existe o todavía
    // no está disponible,
    // no hacemos nada.
    if (
      !ejercicioEncontrado ||
      !ejercicioEncontrado.disponible
    ) {
      return;
    }


    // Si estaba funcionando la cámara,
    // la apagamos antes de cambiar.
    setMostrarCamara(
      false
    );


    // Guardamos el ejercicio seleccionado.
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

    // Creamos una URL temporal.
    //
    // El vídeo permanece
    // en el dispositivo del usuario.
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


    // Si la cámara estaba activa,
    // la apagamos.
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

      {/* ==============================================
          CABECERA
          ============================================== */}

      <div className="vision-fit-header">

        <h1>
          Visión Fit
        </h1>


        {/* ============================================
            SELECCIÓN DE EJERCICIO
            ============================================ */}

        <section className="exercise-selector">

          <h2>
            Selecciona un ejercicio
          </h2>


          <div className="exercise-buttons">

            {EJERCICIOS.map(
              function (ejercicio) {
                // Comprobamos si este
                // es el ejercicio actual.
                const seleccionado =
                  ejercicio.id ===
                  ejercicioSeleccionado;


                return (
                  <button
                    key={
                      ejercicio.id
                    }

                    type="button"

                    // Los ejercicios todavía
                    // no implementados quedan
                    // desactivados.
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

        {/* Esta sección solamente aparece
            después de seleccionar
            un ejercicio disponible. */}
        {ejercicioSeleccionado !== null ? (

          <section className="analysis-source-selector">

            <h2>
              Fuente de análisis
            </h2>


            <div className="analysis-source-buttons">

              {/* --------------------------------------
                  CÁMARA
                  -------------------------------------- */}

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


              {/* --------------------------------------
                  VÍDEO
                  -------------------------------------- */}

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
          display: "none"
        }}
      />


      {/* ==============================================
          CÁMARA
          ============================================== */}

      {mostrarCamara &&
      ejercicioSeleccionado ===
        "curl" ? (

        <CameraPreview />

      ) : null}


      {/* ==============================================
          VÍDEO
          ============================================== */}

      {urlVideo !== null &&
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

    </main>
  );
}


// Exportamos App.
export default App;