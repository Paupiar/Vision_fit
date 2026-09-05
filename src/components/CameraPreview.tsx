// Importamos los hooks de React necesarios.
import {
  useEffect,
  useRef,
  useState
} from "react";

// Tipo de MediaPipe.
import type {
  PoseLandmarker
} from "@mediapipe/tasks-vision";

// Configuración del detector.
import {
  crearPoseLandmarker
} from "../mediapipe/pose";


// --------------------------------------------------
// UTILIDADES COMUNES DE MEDIAPIPE
// --------------------------------------------------
//
// Estas funciones antes estaban definidas
// directamente dentro de CameraPreview.
//
// Ahora las reutilizamos desde dibujo.ts.
import {
  convertirAPixeles,
  dibujarConexion,
  dibujarLandmark,
  esLandmarkValido
} from "../mediapipe/dibujo";


// --------------------------------------------------
// LÓGICA DEL CURL
// --------------------------------------------------

// Importamos toda la lógica específica
// del ejercicio curl.
//
// CameraPreview no necesita saber
// cómo se evalúa biomecánicamente el ejercicio.
import {
  analizarFrameCurl,
  calcularResumenSesion,
  crearEstadoCurl,
  DESPLAZAMIENTO_MAXIMO_CODO,
  DESPLAZAMIENTO_MAXIMO_HOMBRO
} from "../ejercicios/curl";

// Importamos únicamente los tipos
// que necesita este componente.
import type {
  FaseCurl,
  Punto,
  ResultadoRepeticion
} from "../ejercicios/curl";


function CameraPreview() {
  // --------------------------------------------------
  // ELEMENTOS DE LA PÁGINA
  // --------------------------------------------------

  // Elemento <video>.
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  // Canvas situado encima del vídeo.
  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );

  // Detector de MediaPipe.
  const poseLandmarkerRef =
    useRef<PoseLandmarker | null>(
      null
    );

  // Identificador del bucle
  // requestAnimationFrame.
  const animationFrameRef =
    useRef<number | null>(
      null
    );


  // --------------------------------------------------
  // ANALIZADOR DEL CURL
  // --------------------------------------------------

  // Creamos un único estado interno del ejercicio.
  //
  // Todo lo relacionado con:
  // - fases;
  // - referencias;
  // - errores;
  // - repeticiones;
  //
  // vive ahora dentro de este objeto.
  const estadoCurlRef =
    useRef(
      crearEstadoCurl()
    );


  // --------------------------------------------------
  // FEEDBACK VISUAL
  // --------------------------------------------------

  // Guarda hasta qué instante
  // los puntos deben aparecer verdes.
  const verdeHastaRef =
    useRef<number>(
      0
    );


  // Último instante en que actualizamos
  // la interfaz de React.
  const ultimaActualizacionUIRef =
    useRef<number>(
      0
    );


  // --------------------------------------------------
  // ESTADOS VISIBLES
  // --------------------------------------------------

  const [
    repeticiones,
    setRepeticiones
  ] =
    useState<number>(
      0
    );


  const [
    anguloActual,
    setAnguloActual
  ] =
    useState<number>(
      0
    );


  const [
    faseActual,
    setFaseActual
  ] =
    useState<FaseCurl>(
      "abajo"
    );


  const [
    feedback,
    setFeedback
  ] =
    useState<string>(
      "Colócate frente a la cámara"
    );


  const [
    feedbackCodo,
    setFeedbackCodo
  ] =
    useState<string>(
      "Extiende el brazo para calibrar el codo"
    );


  const [
    feedbackHombro,
    setFeedbackHombro
  ] =
    useState<string>(
      "Extiende el brazo para calibrar el tronco"
    );


  const [
    desplazamientoCodo,
    setDesplazamientoCodo
  ] =
    useState<number | null>(
      null
    );


  const [
    desplazamientoHombro,
    setDesplazamientoHombro
  ] =
    useState<number | null>(
      null
    );


  // Historial de repeticiones
  // completamente terminadas.
  const [
    historial,
    setHistorial
  ] =
    useState<
      ResultadoRepeticion[]
    >(
      []
    );


  // --------------------------------------------------
  // RESUMEN DE LA SESIÓN
  // --------------------------------------------------

  // El cálculo también está ahora
  // dentro del módulo del curl.
  const resumenSesion =
    calcularResumenSesion(
      historial
    );


  // --------------------------------------------------
  // INICIAR CÁMARA Y MEDIAPIPE
  // --------------------------------------------------

  useEffect(function () {
    // Stream real de la webcam.
    let stream:
      MediaStream | null =
      null;


    // Permite saber si el componente
    // continúa montado.
    let componenteActivo =
      true;


    async function iniciarSistema() {
      try {
        // ------------------------------------------
        // CÁMARA
        // ------------------------------------------

        const nuevoStream =
          await navigator.mediaDevices.getUserMedia({
            video:
              true,

            audio:
              false
          });


        // Si CameraPreview desapareció
        // mientras esperábamos el permiso,
        // apagamos inmediatamente la cámara.
        if (
          !componenteActivo
        ) {
          nuevoStream
            .getTracks()
            .forEach(
              function (track) {
                track.stop();
              }
            );

          return;
        }


        stream =
          nuevoStream;


        // Conectamos la cámara
        // al elemento <video>.
        if (
          videoRef.current
        ) {
          videoRef.current.srcObject =
            stream;
        }


        // ------------------------------------------
        // MEDIAPIPE
        // ------------------------------------------

        console.log(
          "Cargando MediaPipe..."
        );


        const poseLandmarker =
          await crearPoseLandmarker();


        if (
          !componenteActivo
        ) {
          return;
        }


        poseLandmarkerRef.current =
          poseLandmarker;


        console.log(
          "MediaPipe cargado"
        );


        // Si el vídeo ya está preparado,
        // podemos empezar directamente.
        if (
          videoRef.current &&
          videoRef.current.readyState >=
            2
        ) {
          iniciarAnalisis();
        }

      } catch (error) {
        console.error(
          "Error al iniciar cámara o MediaPipe:",
          error
        );
      }
    }


    iniciarSistema();


    // --------------------------------------------------
    // LIMPIEZA
    // --------------------------------------------------

    return function detenerSistema() {
      componenteActivo =
        false;


      // Detenemos el análisis.
      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );


        animationFrameRef.current =
          null;
      }


      // Apagamos físicamente
      // las pistas de la webcam.
      if (
        stream
      ) {
        stream
          .getTracks()
          .forEach(
            function (track) {
              track.stop();
            }
          );
      }


      // Desconectamos el vídeo.
      if (
        videoRef.current
      ) {
        videoRef.current.srcObject =
          null;
      }


      console.log(
        "Cámara y análisis detenidos"
      );
    };
  }, []);


  // --------------------------------------------------
  // ACTIVAR VERDE
  // --------------------------------------------------

  // Activa los puntos y conexiones
  // verdes durante 0,3 segundos.
  function activarFeedbackVerde() {
    verdeHastaRef.current =
      performance.now() +
      300;
  }


  // --------------------------------------------------
  // DIBUJAR BRAZO
  // --------------------------------------------------

  // Esta función sigue siendo propia
  // del curl porque describe
  // qué conexiones queremos dibujar.
  //
  // Las operaciones básicas
  // dibujarConexion y dibujarLandmark
  // vienen ahora de dibujo.ts.
  function dibujarBrazo(
    contexto:
      CanvasRenderingContext2D,
    hombro:
      Punto,
    codo:
      Punto,
    muneca:
      Punto
  ) {
    // Comprobamos si todavía estamos
    // dentro de los 300 ms de verde.
    const verdeActivo =
      performance.now() <
      verdeHastaRef.current;


    // Hombro -> codo.
    dibujarConexion(
      contexto,
      hombro,
      codo,
      verdeActivo
    );


    // Codo -> muñeca.
    dibujarConexion(
      contexto,
      codo,
      muneca,
      verdeActivo
    );


    // Puntos.
    dibujarLandmark(
      contexto,
      hombro,
      verdeActivo
    );


    dibujarLandmark(
      contexto,
      codo,
      verdeActivo
    );


    dibujarLandmark(
      contexto,
      muneca,
      verdeActivo
    );
  }


  // --------------------------------------------------
  // ANALIZAR FRAME
  // --------------------------------------------------

  function analizarFrame(
    timestamp: number
  ) {
    // Necesitamos los tres elementos
    // principales preparados.
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !poseLandmarkerRef.current
    ) {
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrame
        );

      return;
    }


    const video =
      videoRef.current;


    const canvas =
      canvasRef.current;


    const poseLandmarker =
      poseLandmarkerRef.current;


    // Esperamos a que exista
    // una imagen válida en el vídeo.
    if (
      video.readyState <
      2
    ) {
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrame
        );

      return;
    }


    // Igualamos la resolución
    // del canvas a la cámara.
    if (
      canvas.width !==
        video.videoWidth ||
      canvas.height !==
        video.videoHeight
    ) {
      canvas.width =
        video.videoWidth;


      canvas.height =
        video.videoHeight;
    }


    const contexto =
      canvas.getContext(
        "2d"
      );


    if (
      !contexto
    ) {
      return;
    }


    // Limpiamos el dibujo anterior.
    contexto.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    try {
      // ------------------------------------------
      // MEDIAPIPE
      // ------------------------------------------

      const resultado =
        poseLandmarker.detectForVideo(
          video,
          timestamp
        );


      // Necesitamos una persona detectada.
      if (
        resultado.landmarks.length >
        0
      ) {
        const landmarks =
          resultado.landmarks[0];


        // ----------------------------------------
        // LANDMARKS NECESARIOS PARA CURL
        // ----------------------------------------

        // Por ahora mantenemos exactamente
        // los landmarks del último commit estable.
        //
        // 12 = hombro derecho.
        const hombroNormalizado =
          landmarks[12];


        // 14 = codo derecho.
        const codoNormalizado =
          landmarks[14];


        // 16 = muñeca derecha.
        const munecaNormalizada =
          landmarks[16];


        // 24 = cadera derecha.
        const caderaNormalizada =
          landmarks[24];


        // ----------------------------------------
        // VALIDAMOS EL BRAZO
        // ----------------------------------------

        if (
          hombroNormalizado &&
          codoNormalizado &&
          munecaNormalizada
        ) {
          // esLandmarkValido ahora
          // viene de dibujo.ts.
          if (
            esLandmarkValido(
              hombroNormalizado
            ) &&
            esLandmarkValido(
              codoNormalizado
            ) &&
            esLandmarkValido(
              munecaNormalizada
            )
          ) {
            // ------------------------------------
            // PASAMOS A PÍXELES
            // ------------------------------------
            //
            // convertirAPixeles ahora
            // viene también de dibujo.ts.

            const hombro =
              convertirAPixeles(
                hombroNormalizado,
                canvas
              );


            const codo =
              convertirAPixeles(
                codoNormalizado,
                canvas
              );


            const muneca =
              convertirAPixeles(
                munecaNormalizada,
                canvas
              );


            // ------------------------------------
            // CADERA
            // ------------------------------------

            // Por defecto suponemos
            // que la cadera no es válida.
            let cadera:
              Punto | null =
              null;


            // Solamente la utilizamos
            // si MediaPipe la ve correctamente.
            if (
              caderaNormalizada &&
              esLandmarkValido(
                caderaNormalizada
              )
            ) {
              cadera =
                convertirAPixeles(
                  caderaNormalizada,
                  canvas
                );
            }


            // ------------------------------------
            // ANALIZADOR DEL CURL
            // ------------------------------------

            // CameraPreview entrega los landmarks
            // y curl.ts hace todo
            // el análisis biomecánico.
            const analisis =
              analizarFrameCurl(
                estadoCurlRef.current,
                hombro,
                codo,
                muneca,
                cadera
              );


            // ------------------------------------
            // CAMBIO DE FASE
            // ------------------------------------

            if (
              analisis.cambioFase
            ) {
              // Feedback visual verde.
              activarFeedbackVerde();


              // Actualizamos inmediatamente
              // la fase visible.
              setFaseActual(
                analisis.fase
              );
            }


            // ------------------------------------
            // NUEVA REPETICIÓN
            // ------------------------------------

            if (
              analisis.repeticionSumada
            ) {
              setRepeticiones(
                estadoCurlRef.current
                  .repeticiones
              );


              console.log(
                "Repetición detectada:",
                estadoCurlRef.current
                  .repeticiones
              );
            }


            // ------------------------------------
            // REPETICIÓN TERMINADA
            // ------------------------------------
            //
            // IMPORTANTE:
            //
            // Este es exactamente el campo
            // que utiliza tu ResultadoFrameCurl
            // actual.
            //
            // NO usamos resultadoRepeticion.
            // ------------------------------------

            const repeticionFinalizada =
              analisis
                .repeticionFinalizada;


            if (
              repeticionFinalizada !==
              null
            ) {
              // Añadimos el resultado
              // al historial.
              setHistorial(
                function (
                  historialAnterior
                ) {
                  return [
                    ...historialAnterior,
                    repeticionFinalizada
                  ];
                }
              );


              console.log(
                "Resultado repetición:",
                repeticionFinalizada
              );
            }


            // ------------------------------------
            // ACTUALIZAR INTERFAZ
            // ------------------------------------

            // Aproximadamente cada 100 ms.
            if (
              timestamp -
                ultimaActualizacionUIRef
                  .current >=
              100
            ) {
              // Ángulo.
              setAnguloActual(
                Math.round(
                  analisis.anguloCodo
                )
              );


              // Fase.
              setFaseActual(
                analisis.fase
              );


              // Feedback de movimiento.
              setFeedback(
                analisis
                  .feedbackMovimiento
              );


              // Feedback del codo.
              setFeedbackCodo(
                analisis
                  .feedbackCodo
              );


              // Feedback del tronco.
              setFeedbackHombro(
                analisis
                  .feedbackHombro
              );


              // ----------------------------------
              // DESPLAZAMIENTO CODO
              // ----------------------------------

              if (
                analisis
                  .desplazamientoCodo !==
                null
              ) {
                setDesplazamientoCodo(
                  Math.round(
                    analisis
                      .desplazamientoCodo *
                    100
                  )
                );
              } else {
                setDesplazamientoCodo(
                  null
                );
              }


              // ----------------------------------
              // DESPLAZAMIENTO TRONCO
              // ----------------------------------

              if (
                analisis
                  .desplazamientoHombro !==
                null
              ) {
                setDesplazamientoHombro(
                  Math.round(
                    analisis
                      .desplazamientoHombro *
                    100
                  )
                );
              } else {
                setDesplazamientoHombro(
                  null
                );
              }


              // Guardamos cuándo
              // hemos actualizado la interfaz.
              ultimaActualizacionUIRef
                .current =
                timestamp;
            }


            // ------------------------------------
            // DIBUJAR
            // ------------------------------------

            dibujarBrazo(
              contexto,
              hombro,
              codo,
              muneca
            );
          }
        }
      }

    } catch (error) {
      console.error(
        "Error analizando el frame:",
        error
      );
    }


    // Analizamos el siguiente frame.
    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrame
      );
  }


  // --------------------------------------------------
  // INICIAR ANÁLISIS
  // --------------------------------------------------

  function iniciarAnalisis() {
    if (
      !poseLandmarkerRef.current
    ) {
      return;
    }


    // Evitamos crear dos bucles
    // simultáneamente.
    if (
      animationFrameRef.current !==
      null
    ) {
      cancelAnimationFrame(
        animationFrameRef.current
      );
    }


    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrame
      );


    console.log(
      "Análisis de pose iniciado"
    );
  }


  // --------------------------------------------------
  // VÍDEO PREPARADO
  // --------------------------------------------------

  function videoPreparado() {
    if (
      videoRef.current
    ) {
      console.log(
        "Resolución:",
        videoRef.current.videoWidth,
        videoRef.current.videoHeight
      );
    }


    iniciarAnalisis();
  }


  // --------------------------------------------------
  // INTERFAZ
  // --------------------------------------------------

  return (
    <div className="vision-fit-layout">

      {/* ----------------------------------------------
          IZQUIERDA: CÁMARA
          ---------------------------------------------- */}

      <div className="vision-fit-camera-column">

        <div className="camera-container">

          <video
            ref={
              videoRef
            }

            autoPlay

            playsInline

            onLoadedData={
              videoPreparado
            }

            className="camera-video"
          />


          <canvas
            ref={
              canvasRef
            }

            className="camera-canvas"
          />

        </div>

      </div>


      {/* ----------------------------------------------
          DERECHA: ANÁLISIS
          ---------------------------------------------- */}

      <div className="vision-fit-data-column">

        {/* ------------------------------------------
            MOVIMIENTO
            ------------------------------------------ */}

        <section className="analysis-section">

          <h2>
            Repeticiones: {repeticiones}
          </h2>


          <p>
            <strong>
              Ángulo del codo:
            </strong>{" "}
            {anguloActual}°
          </p>


          <p>
            <strong>
              Fase:
            </strong>{" "}
            {faseActual}
          </p>


          <p>
            <strong>
              Movimiento:
            </strong>{" "}
            {feedback}
          </p>

        </section>


        {/* ------------------------------------------
            TÉCNICA
            ------------------------------------------ */}

        <section className="analysis-section">

          <h3>
            Técnica del curl
          </h3>


          <p>
            <strong>
              Codo:
            </strong>{" "}
            {feedbackCodo}
          </p>


          <p>
            <strong>
              Desplazamiento:
            </strong>{" "}

            {desplazamientoCodo ===
            null
              ? "--"
              : desplazamientoCodo +
                " %"}
          </p>


          <p>
            <strong>
              Límite:
            </strong>{" "}

            {Math.round(
              DESPLAZAMIENTO_MAXIMO_CODO *
                100
            )} %
          </p>


          <p>
            <strong>
              Tronco:
            </strong>{" "}
            {feedbackHombro}
          </p>


          <p>
            <strong>
              Desplazamiento:
            </strong>{" "}

            {desplazamientoHombro ===
            null
              ? "--"
              : desplazamientoHombro +
                " %"}
          </p>


          <p>
            <strong>
              Límite:
            </strong>{" "}

            {Math.round(
              DESPLAZAMIENTO_MAXIMO_HOMBRO *
                100
            )} %
          </p>

        </section>


        {/* ------------------------------------------
            RESUMEN DE SESIÓN
            ------------------------------------------ */}

        <section className="analysis-section">

          <h3>
            Resumen de sesión
          </h3>


          <p>
            <strong>
              Repeticiones analizadas:
            </strong>{" "}
            {resumenSesion.total}
          </p>


          <p>
            <strong>
              Correctas:
            </strong>{" "}
            {resumenSesion.correctas}
          </p>


          <p>
            <strong>
              Técnica correcta:
            </strong>{" "}
            {
              resumenSesion
                .porcentajeCorrectas
            } %
          </p>


          <p>
            <strong>
              Errores de codo:
            </strong>{" "}
            {resumenSesion.erroresCodo}
          </p>


          <p>
            <strong>
              Balanceos de tronco:
            </strong>{" "}
            {
              resumenSesion
                .erroresTronco
            }
          </p>


          <p>
            <strong>
              Error más frecuente:
            </strong>{" "}
            {
              resumenSesion
                .errorMasFrecuente
            }
          </p>

        </section>


        {/* ------------------------------------------
            HISTORIAL
            ------------------------------------------ */}

        <section className="analysis-section">

          <h3>
            Historial
          </h3>


          {historial.length ===
          0 ? (

            <p>
              Completa una repetición
              para ver su análisis.
            </p>

          ) : (

            <ol className="repetition-history">

              {historial.map(
                function (repeticion) {
                  return (
                    <li
                      key={
                        repeticion.numero
                      }
                    >
                      <strong>
                        Rep {
                          repeticion.numero
                        }:
                      </strong>{" "}

                      {
                        repeticion
                          .resultado
                      }
                    </li>
                  );
                }
              )}

            </ol>

          )}

        </section>

      </div>

    </div>
  );
}


// Exportamos el componente.
export default CameraPreview;