// Importamos los hooks necesarios de React.
import {
  useEffect,
  useRef,
  useState
} from "react";

// Tipo del evento utilizado
// al seleccionar un archivo.
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
  // REINICIO DEL ANÁLISIS
  // ==================================================
  //
  // Cada vez que este número cambia,
  // los componentes reciben la orden
  // de comenzar una sesión nueva.
  // ==================================================

  const [
    reinicioAnalisis,
    setReinicioAnalisis
  ] =
    useState<number>(
      0
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
  // SELECTOR DE LADO
  // ==================================================

  const mostrarSelectorLado =
    ejercicioSeleccionado ===
      "curl" ||
    ejercicioSeleccionado ===
      "sentadilla";


  // ==================================================
  // ¿HAY UN ANÁLISIS ACTIVO?
  // ==================================================
  //
  // Mostramos el botón de reinicio
  // si existe cámara activa
  // o un vídeo seleccionado.
  // ==================================================

  const hayAnalisis =
    mostrarCamara ||
    urlVideo !==
      null;


  // ==================================================
  // LIMPIAR VÍDEO
  // ==================================================

  function limpiarVideoSeleccionado() {
    // Liberamos la URL temporal
    // del vídeo anterior.
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
    // para permitir seleccionar
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


    // Si realmente cambiamos
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


    // Consideramos la selección
    // de ejercicio como una nueva sesión.
    setReinicioAnalisis(
      function (
        valorAnterior
      ) {
        return (
          valorAnterior +
          1
        );
      }
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
    if (
      ladoSeleccionado ===
      lado
    ) {
      return;
    }


    setLadoSeleccionado(
      lado
    );


    // Cambiar de lado implica
    // iniciar una sesión nueva.
    setReinicioAnalisis(
      function (
        valorAnterior
      ) {
        return (
          valorAnterior +
          1
        );
      }
    );


    console.log(
      "Lado seleccionado:",
      lado
    );
  }


  // ==================================================
  // REINICIAR ANÁLISIS
  // ==================================================

  function reiniciarAnalisisActual() {
    // Solo cambiamos este contador.
    //
    // En cámara:
    // se reinicia la lógica
    // sin destruir el componente.
    //
    // En vídeo:
    // la key cambia y React
    // crea una sesión nueva.
    setReinicioAnalisis(
      function (
        valorAnterior
      ) {
        return (
          valorAnterior +
          1
        );
      }
    );


    console.log(
      "Análisis reiniciado"
    );
  }


  // ==================================================
  // ENCENDER / APAGAR CÁMARA
  // ==================================================

  function cambiarCamara() {
    setMostrarCamara(
      function (
        valorAnterior
      ) {
        return (
          !valorAnterior
        );
      }
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


    // Creamos una URL local
    // para reproducir el archivo.
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


    // El vídeo nuevo comienza
    // una sesión nueva.
    setReinicioAnalisis(
      function (
        valorAnterior
      ) {
        return (
          valorAnterior +
          1
        );
      }
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
            ============================================ */}

        {mostrarSelectorLado ? (

          <section className="exercise-selector">

            <h2>
              Lado a analizar
            </h2>


            <div className="exercise-buttons">

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


              {/* ======================================
                  REINICIAR
                  ====================================== */}

              {hayAnalisis ? (

                <button
                  type="button"

                  onClick={
                    reiniciarAnalisisActual
                  }
                >
                  Reiniciar análisis
                </button>

              ) : null}

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
      
          Importante:
      
          reinicioAnalisis NO está dentro
          de la key de CameraPreview.
      
          Así podemos reiniciar los datos
          sin apagar ni volver a crear
          la cámara.
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

          reinicioId={
            reinicioAnalisis
          }
        />

      ) : null}


      {/* ==============================================
          VÍDEO
          ==============================================
      
          En vídeo sí añadimos
          reinicioAnalisis a la key.
      
          De esta manera React crea
          una sesión completamente nueva.
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
            urlVideo +
            "-" +
            reinicioAnalisis
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