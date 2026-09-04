// Importamos los hooks necesarios.
import {
  useEffect,
  useRef,
  useState
} from "react";

// Tipo del evento utilizado
// cuando seleccionamos un archivo.
import type {
  ChangeEvent
} from "react";

// Importamos los estilos generales.
import "./App.css";


// --------------------------------------------------
// COMPONENTES DE ANÁLISIS
// --------------------------------------------------

// Componente que analiza
// el curl mediante webcam.
import CameraPreview from "./components/CameraPreview";

// Componente que analiza
// vídeos grabados.
//
// Por ahora solamente está preparado
// para analizar curl.
import VideoPreview from "./components/VideoPreview";

// Componente provisional
// para analizar la sentadilla
// mediante webcam.
import SentadillaPreview from "./components/SentadillaPreview";


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
  // todavía no hay ejercicio seleccionado.
  //
  // Por eso la selección de fuente
  // no aparece inmediatamente.
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
  // Solo se activa cuando
  // el usuario pulsa "Encender cámara".
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

  // Input oculto que utilizamos
  // para seleccionar vídeos
  // desde el dispositivo.
  const inputVideoRef =
    useRef<HTMLInputElement | null>(
      null
    );


  // Guarda la URL temporal
  // del archivo seleccionado.
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


  // URL que recibe VideoPreview
  // para reproducir el archivo.
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
    // dentro de la lista EJERCICIOS.
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
    // APAGAMOS LA CÁMARA
    // ------------------------------------------------

    // Si cambiamos de ejercicio
    // mientras la webcam estaba activa,
    // desmontamos el componente anterior.
    //
    // Esto permite que cada ejercicio
    // empiece con un estado limpio.
    setMostrarCamara(
      false
    );


    // ------------------------------------------------
    // GUARDAMOS EL EJERCICIO
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
    setMostrarCamara(
      !mostrarCamara
    );
  }


  // ==================================================
  // ABRIR SELECTOR DE VÍDEO
  // ==================================================

  function abrirSelectorVideo() {
    // De momento el análisis de vídeo
    // solo está implementado para curl.
    if (
      ejercicioSeleccionado !==
      "curl"
    ) {
      return;
    }


    // Simulamos un clic
    // sobre el input oculto.
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
    // Recuperamos el primer
    // archivo seleccionado.
    const archivo =
      evento.target.files?.[0];


    // Si el usuario cancela,
    // no hacemos nada.
    if (!archivo) {
      return;
    }


    // ------------------------------------------------
    // COMPROBAR TIPO
    // ------------------------------------------------

    // Aceptamos únicamente vídeos.
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

    // Si había otro vídeo seleccionado,
    // eliminamos su URL temporal.
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

    // Creamos una URL temporal
    // para reproducir el archivo local.
    //
    // El vídeo no se sube
    // a ningún servidor.
    const nuevaUrl =
      URL.createObjectURL(
        archivo
      );


    // Guardamos internamente la URL.
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


    // Si la webcam estaba funcionando,
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
      // cuando App desaparezca.
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
                // Comprobamos si este
                // es el ejercicio seleccionado.
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
                    // no implementados aparecen
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
                    {/* Nombre del ejercicio. */}
                    {ejercicio.nombre}


                    {/* Mostramos "próximamente"
                        si todavía no está disponible. */}
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

        {/* Esta parte aparece únicamente
            después de seleccionar
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

              {/* Por ahora el vídeo
                  solamente funciona con curl.

                  En sentadilla aparece desactivado
                  hasta que conectemos VideoPreview
                  con sentadilla.ts. */}
              <button
                type="button"

                onClick={
                  abrirSelectorVideo
                }

                disabled={
                  ejercicioSeleccionado !==
                  "curl"
                }
              >
                {ejercicioSeleccionado ===
                "curl"
                  ? "Cargar vídeo"
                  : "Vídeo próximamente"}
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
          CÁMARA - CURL
          ============================================== */}

      {/* Si:

          - la cámara está encendida;
          - el ejercicio es curl;

          mostramos CameraPreview. */}
      {mostrarCamara &&
      ejercicioSeleccionado ===
        "curl" ? (

        <CameraPreview />

      ) : null}


      {/* ==============================================
          CÁMARA - SENTADILLA
          ============================================== */}

      {/* Si:

          - la cámara está encendida;
          - el ejercicio es sentadilla;

          mostramos SentadillaPreview. */}
      {mostrarCamara &&
      ejercicioSeleccionado ===
        "sentadilla" ? (

        <SentadillaPreview />

      ) : null}


      {/* ==============================================
          VÍDEO - CURL
          ============================================== */}

      {/* Por ahora VideoPreview
          solamente analiza curl.

          Cuando preparemos la sentadilla
          para vídeo ampliaremos esta parte. */}
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

          // El vídeo se oculta
          // mientras la cámara está activa.
          visible={
            !mostrarCamara
          }
        />

      ) : null}

    </main>
  );
}


// Exportamos el componente principal.
export default App;