// Importamos los hooks necesarios de React.
import {
  useEffect,
  useRef,
  useState
} from "react";

// Tipo utilizado por el evento
// del selector de archivos.
import type {
  ChangeEvent
} from "react";

// Importamos los estilos generales.
import "./App.css";


// --------------------------------------------------
// COMPONENTES DE CÁMARA
// --------------------------------------------------

// Curl mediante webcam.
import CameraPreview from "./components/CameraPreview";

// Sentadilla mediante webcam.
import SentadillaPreview from "./components/SentadillaPreview";

// Press de hombro mediante webcam.
//
// En este ejercicio analizaremos
// los dos brazos simultáneamente.
import PressHombroPreview from "./components/PressHombroPreview";


// --------------------------------------------------
// COMPONENTES DE VÍDEO
// --------------------------------------------------

// Curl mediante vídeo grabado.
import VideoPreview from "./components/VideoPreview";

// Sentadilla mediante vídeo grabado.
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
  // EJERCICIO SELECCIONADO
  // ==================================================

  // Al entrar en Visión Fit
  // no hay ningún ejercicio seleccionado.
  //
  // Por eso inicialmente solamente
  // aparece el selector de ejercicios.
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
  //
  // Cuando sea true,
  // mostraremos el componente correspondiente
  // al ejercicio seleccionado.
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

  // Referencia al input oculto
  // utilizado para seleccionar archivos.
  const inputVideoRef =
    useRef<HTMLInputElement | null>(
      null
    );


  // Guarda internamente la URL temporal
  // del vídeo seleccionado.
  //
  // Nos permite liberarla posteriormente
  // mediante URL.revokeObjectURL().
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


  // URL temporal utilizada
  // por los componentes de vídeo.
  const [
    urlVideo,
    setUrlVideo
  ] =
    useState<string | null>(
      null
    );


  // ==================================================
  // LIMPIAR VÍDEO SELECCIONADO
  // ==================================================

  function limpiarVideoSeleccionado() {
    // Si existe una URL temporal anterior,
    // la liberamos de memoria.
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


    // Eliminamos los datos
    // visibles del vídeo.
    setUrlVideo(
      null
    );


    setNombreVideo(
      ""
    );


    // Reiniciamos también el input.
    //
    // Esto permite seleccionar
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
    // Buscamos el ejercicio
    // dentro de la lista principal.
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


    // ------------------------------------------------
    // APAGAR CÁMARA
    // ------------------------------------------------

    // Antes de cambiar de ejercicio
    // desmontamos cualquier componente
    // de cámara activo.
    //
    // De esta forma la webcam
    // también se libera correctamente.
    setMostrarCamara(
      false
    );


    // ------------------------------------------------
    // LIMPIAR VÍDEO
    // ------------------------------------------------

    // Si realmente estamos cambiando
    // a otro ejercicio,
    // eliminamos el vídeo anterior.
    //
    // Así evitamos que un vídeo de curl
    // aparezca después en sentadilla, etc.
    if (
      ejercicioSeleccionado !==
      ejercicio
    ) {
      limpiarVideoSeleccionado();
    }


    // ------------------------------------------------
    // GUARDAR EJERCICIO
    // ------------------------------------------------

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
    // Si vamos a encender la cámara,
    // el vídeo quedará oculto mientras
    // la cámara esté activa.
    setMostrarCamara(
      !mostrarCamara
    );
  }


  // ==================================================
  // ABRIR SELECTOR DE VÍDEO
  // ==================================================

  function abrirSelectorVideo() {
    // Actualmente solamente tenemos
    // análisis de vídeo para:
    //
    // - curl;
    // - sentadilla.
    //
    // Press de hombro todavía
    // no tiene componente de vídeo.
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
      // Reiniciamos el valor
      // para permitir seleccionar
      // dos veces seguidas
      // el mismo archivo.
      inputVideoRef.current.value =
        "";


      // Abrimos el selector
      // de archivos del dispositivo.
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
    // Recuperamos el primer archivo
    // seleccionado.
    const archivo =
      evento.target.files?.[0];


    // Si el usuario cancela,
    // no hacemos nada.
    if (
      !archivo
    ) {
      return;
    }


    // ------------------------------------------------
    // COMPROBAR QUE SEA UN VÍDEO
    // ------------------------------------------------

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
    // CREAR URL LOCAL
    // ------------------------------------------------

    // Creamos una URL temporal
    // que permite reproducir el archivo
    // directamente desde el dispositivo.
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


    // La guardamos también
    // en el estado de React.
    setUrlVideo(
      nuevaUrl
    );


    // Guardamos el nombre original.
    setNombreVideo(
      archivo.name
    );


    // Si la cámara estaba activa,
    // la apagamos.
    //
    // De esta forma usamos
    // una única fuente cada vez.
    setMostrarCamara(
      false
    );


    console.log(
      "Vídeo seleccionado:",
      archivo.name
    );
  }


  // ==================================================
  // LIMPIEZA FINAL
  // ==================================================

  useEffect(function () {
    // Esta función se ejecutará
    // cuando App desaparezca.
    return function limpiarAplicacion() {
      // Liberamos cualquier URL
      // temporal pendiente.
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
          CABECERA DE VISIÓN FIT
          ============================================== */}

      <div className="vision-fit-header">

        {/* --------------------------------------------
            TÍTULO
            -------------------------------------------- */}

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
                // Comprobamos si este botón
                // corresponde al ejercicio actual.
                const seleccionado =
                  ejercicio.id ===
                  ejercicioSeleccionado;


                return (
                  <button
                    key={
                      ejercicio.id
                    }

                    type="button"

                    // Los ejercicios no disponibles
                    // aparecen desactivados.
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
                    {/* Nombre visible. */}
                    {ejercicio.nombre}


                    {/* Si algún ejercicio vuelve
                        a estar marcado como no disponible,
                        añadimos automáticamente
                        "(próximamente)". */}
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

        {/* La fuente solamente aparece
            cuando ya hemos seleccionado
            un ejercicio. */}
        {ejercicioSeleccionado !==
        null ? (

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

                // El press todavía
                // no tiene análisis de vídeo.
                disabled={
                  ejercicioSeleccionado ===
                  "press-hombro"
                }
              >
                {ejercicioSeleccionado ===
                "press-hombro"
                  ? "Vídeo próximamente"
                  : "Cargar vídeo"}
              </button>

            </div>

          </section>

        ) : null}

      </div>


      {/* ==============================================
          INPUT OCULTO PARA VÍDEOS
          ============================================== */}

      <input
        ref={
          inputVideoRef
        }

        type="file"

        // Aceptamos archivos de vídeo.
        accept="video/*"

        onChange={
          seleccionarVideo
        }

        // El usuario no necesita
        // ver este input.
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
          PRESS DE HOMBRO - CÁMARA
          ============================================== */}

      {/* El press utiliza su propio componente
          porque analiza simultáneamente:

          brazo izquierdo:
          11 - 13 - 15

          brazo derecho:
          12 - 14 - 16
      */}
      {mostrarCamara &&
      ejercicioSeleccionado ===
        "press-hombro" ? (

        <PressHombroPreview />

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

          // El vídeo solamente
          // está visible si la cámara
          // está apagada.
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


      {/* ==============================================
          PRESS DE HOMBRO - VÍDEO
          ============================================== */}

      {/*
        Todavía no existe un componente
        de vídeo para press de hombro.

        Lo añadiremos cuando primero
        tengamos calibrado y estable
        el análisis bilateral mediante cámara.
      */}

    </main>
  );
}


// Exportamos el componente principal.
export default App;