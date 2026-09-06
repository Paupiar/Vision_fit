// Importamos los hooks necesarios de React.
import {
  useEffect,
  useRef,
  useState
} from "react";

// Tipo del detector de MediaPipe.
import type {
  PoseLandmarker
} from "@mediapipe/tasks-vision";

// Función que crea MediaPipe.
import {
  crearPoseLandmarker
} from "../mediapipe/pose";


// --------------------------------------------------
// UTILIDADES COMUNES DE MEDIAPIPE
// --------------------------------------------------
//
// Estas funciones antes estaban definidas
// directamente dentro de SentadillaVideoPreview.
//
// Ahora las reutilizamos desde dibujo.ts.
import {
  convertirAPixeles,
  dibujarConexion,
  dibujarLandmark,
  esLandmarkValido
} from "../mediapipe/dibujo";


// --------------------------------------------------
// CONFIGURACIÓN DE LANDMARKS
// --------------------------------------------------
//
// Los índices utilizados por la sentadilla
// se centralizan ahora en landmarks.ts.
import {
  LANDMARKS_SENTADILLA
} from "../ejercicios/landmarks";


// --------------------------------------------------
// LÓGICA DE SENTADILLA
// --------------------------------------------------

import {
  analizarSentadilla,
  calcularResumenSesionSentadilla,
  crearEstadoSentadilla
} from "../ejercicios/sentadilla";

import type {
  FaseSentadilla,
  PuntoSentadilla,
  ResultadoRepeticionSentadilla
} from "../ejercicios/sentadilla";


// --------------------------------------------------
// PROPS
// --------------------------------------------------

interface SentadillaVideoPreviewProps {
  // URL temporal del vídeo seleccionado.
  urlVideo: string;

  // Nombre original del archivo.
  nombreVideo: string;

  // Permite ocultar el vídeo
  // cuando se activa la cámara.
  visible: boolean;
}


function SentadillaVideoPreview(
  props: SentadillaVideoPreviewProps
) {
  // ==================================================
  // REFERENCIAS
  // ==================================================

  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );


  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );


  const poseLandmarkerRef =
    useRef<PoseLandmarker | null>(
      null
    );


  const animationFrameRef =
    useRef<number | null>(
      null
    );


  // Estado interno del ejercicio.
  const estadoSentadillaRef =
    useRef(
      crearEstadoSentadilla()
    );


  // Guarda hasta cuándo
  // deben aparecer los landmarks verdes.
  const verdeHastaRef =
    useRef<number>(
      0
    );


  // Cuando termina el vídeo,
  // la siguiente reproducción
  // empezará una sesión nueva.
  const reiniciarAlReproducirRef =
    useRef<boolean>(
      false
    );


  // ==================================================
  // ESTADOS VISIBLES
  // ==================================================

  const [
    repeticiones,
    setRepeticiones
  ] =
    useState<number>(
      0
    );


  const [
    anguloRodilla,
    setAnguloRodilla
  ] =
    useState<number>(
      0
    );


  const [
    inclinacionTronco,
    setInclinacionTronco
  ] =
    useState<number | null>(
      null
    );


  const [
    fase,
    setFase
  ] =
    useState<FaseSentadilla>(
      "arriba"
    );


  const [
    feedback,
    setFeedback
  ] =
    useState<string>(
      "Pulsa reproducir para comenzar el análisis"
    );


  const [
    feedbackTronco,
    setFeedbackTronco
  ] =
    useState<string>(
      "Esperando análisis"
    );


  const [
    mensaje,
    setMensaje
  ] =
    useState<string>(
      "Esperando reproducción"
    );


  const [
    historial,
    setHistorial
  ] =
    useState<
      ResultadoRepeticionSentadilla[]
    >(
      []
    );


  // ==================================================
  // RESUMEN
  // ==================================================

  const resumen =
    calcularResumenSesionSentadilla(
      historial
    );


  // ==================================================
  // DETENER ANÁLISIS
  // ==================================================

  function detenerAnalisisVideo() {
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
  }


  // ==================================================
  // REINICIAR SESIÓN
  // ==================================================

  function reiniciarAnalisisSentadilla() {
    // Creamos un estado completamente nuevo.
    estadoSentadillaRef.current =
      crearEstadoSentadilla();


    // Reiniciamos los datos visibles.
    setRepeticiones(
      0
    );


    setAnguloRodilla(
      0
    );


    setInclinacionTronco(
      null
    );


    setFase(
      "arriba"
    );


    setFeedback(
      "Pulsa reproducir para comenzar el análisis"
    );


    setFeedbackTronco(
      "Esperando análisis"
    );


    setMensaje(
      "Esperando reproducción"
    );


    setHistorial(
      []
    );


    verdeHastaRef.current =
      0;
  }


  // ==================================================
  // CAMBIO DE VÍDEO
  // ==================================================

  useEffect(
    function () {
      // Detenemos cualquier análisis anterior.
      detenerAnalisisVideo();


      // Reiniciamos la sesión.
      reiniciarAnalisisSentadilla();


      // El nuevo vídeo todavía
      // no necesita reinicio por replay.
      reiniciarAlReproducirRef.current =
        false;


      // Limpiamos el canvas anterior.
      if (
        canvasRef.current
      ) {
        const contexto =
          canvasRef.current.getContext(
            "2d"
          );


        if (
          contexto
        ) {
          contexto.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
        }
      }

    },
    [
      props.urlVideo
    ]
  );


  // ==================================================
  // VISIBILIDAD
  // ==================================================

  useEffect(
    function () {
      // Si activamos la cámara,
      // ocultamos y detenemos el vídeo.
      if (
        !props.visible
      ) {
        detenerAnalisisVideo();


        if (
          videoRef.current
        ) {
          videoRef.current.pause();
        }
      }

    },
    [
      props.visible
    ]
  );


  // ==================================================
  // LIMPIEZA DEL COMPONENTE
  // ==================================================

  useEffect(function () {
    return function limpiar() {
      detenerAnalisisVideo();


      if (
        videoRef.current
      ) {
        videoRef.current.pause();
      }
    };
  }, []);


  // ==================================================
  // MEDIAPIPE
  // ==================================================

  async function prepararMediaPipe() {
    // Si ya está cargado,
    // no volvemos a crearlo.
    if (
      poseLandmarkerRef.current
    ) {
      return;
    }


    console.log(
      "Cargando MediaPipe para vídeo de sentadilla..."
    );


    const poseLandmarker =
      await crearPoseLandmarker();


    poseLandmarkerRef.current =
      poseLandmarker;


    console.log(
      "MediaPipe preparado para vídeo de sentadilla"
    );
  }


  // ==================================================
  // DIBUJAR CUERPO
  // ==================================================
  //
  // Esta función sigue siendo propia
  // de la sentadilla porque define
  // cómo dibujamos el tronco y la pierna.
  //
  // Las operaciones básicas
  // dibujarConexion y dibujarLandmark
  // vienen ahora desde dibujo.ts.
  // ==================================================

  function dibujarCuerpo(
    contexto:
      CanvasRenderingContext2D,
    hombro:
      PuntoSentadilla | null,
    cadera:
      PuntoSentadilla,
    rodilla:
      PuntoSentadilla,
    tobillo:
      PuntoSentadilla,
    verde:
      boolean
  ) {
    // Tronco.
    if (
      hombro !==
      null
    ) {
      dibujarConexion(
        contexto,
        hombro,
        cadera,
        verde
      );


      dibujarLandmark(
        contexto,
        hombro,
        verde
      );
    }


    // Pierna.
    dibujarConexion(
      contexto,
      cadera,
      rodilla,
      verde
    );


    dibujarConexion(
      contexto,
      rodilla,
      tobillo,
      verde
    );


    dibujarLandmark(
      contexto,
      cadera,
      verde
    );


    dibujarLandmark(
      contexto,
      rodilla,
      verde
    );


    dibujarLandmark(
      contexto,
      tobillo,
      verde
    );
  }


  // ==================================================
  // ANALIZAR FRAME
  // ==================================================

  function analizarFrameVideo(
    timestamp: number
  ) {
    if (
      !props.visible ||
      !videoRef.current ||
      !canvasRef.current ||
      !poseLandmarkerRef.current
    ) {
      detenerAnalisisVideo();

      return;
    }


    const video =
      videoRef.current;


    const canvas =
      canvasRef.current;


    const poseLandmarker =
      poseLandmarkerRef.current;


    // Si el vídeo está pausado
    // o ha terminado,
    // no seguimos analizando.
    if (
      video.paused ||
      video.ended
    ) {
      detenerAnalisisVideo();

      return;
    }


    if (
      video.readyState <
      2
    ) {
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrameVideo
        );


      return;
    }


    // Igualamos canvas
    // y resolución del vídeo.
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


      if (
        resultado.landmarks.length >
        0
      ) {
        const landmarks =
          resultado.landmarks[0];


        // ----------------------------------------
        // LANDMARKS DE SENTADILLA
        // ----------------------------------------
        //
        // Ya no utilizamos directamente:
        //
        // 12 / 24 / 26 / 28
        //
        // La configuración viene ahora
        // desde landmarks.ts.
        // ----------------------------------------

        const hombroNormalizado =
          landmarks[
            LANDMARKS_SENTADILLA.hombro
          ];


        const caderaNormalizada =
          landmarks[
            LANDMARKS_SENTADILLA.cadera
          ];


        const rodillaNormalizada =
          landmarks[
            LANDMARKS_SENTADILLA.rodilla
          ];


        const tobilloNormalizado =
          landmarks[
            LANDMARKS_SENTADILLA.tobillo
          ];


        // ----------------------------------------
        // PIERNA OBLIGATORIA
        // ----------------------------------------

        if (
          caderaNormalizada &&
          rodillaNormalizada &&
          tobilloNormalizado &&
          esLandmarkValido(
            caderaNormalizada
          ) &&
          esLandmarkValido(
            rodillaNormalizada
          ) &&
          esLandmarkValido(
            tobilloNormalizado
          )
        ) {
          // --------------------------------------
          // CONVERTIR PIERNA A PÍXELES
          // --------------------------------------

          const cadera =
            convertirAPixeles(
              caderaNormalizada,
              canvas
            );


          const rodilla =
            convertirAPixeles(
              rodillaNormalizada,
              canvas
            );


          const tobillo =
            convertirAPixeles(
              tobilloNormalizado,
              canvas
            );


          // --------------------------------------
          // HOMBRO OPCIONAL
          // --------------------------------------

          let hombro:
            PuntoSentadilla | null =
            null;


          if (
            hombroNormalizado &&
            esLandmarkValido(
              hombroNormalizado
            )
          ) {
            hombro =
              convertirAPixeles(
                hombroNormalizado,
                canvas
              );
          }


          // Guardamos el estado anterior
          // de profundidad para detectar
          // exactamente cuándo llega abajo.
          const profundidadAntes =
            estadoSentadillaRef
              .current
              .profundidadAlcanzada;


          // --------------------------------------
          // ANALIZAR SENTADILLA
          // --------------------------------------

          const analisis =
            analizarSentadilla(
              estadoSentadillaRef.current,
              hombro,
              cadera,
              rodilla,
              tobillo
            );


          const profundidadDespues =
            estadoSentadillaRef
              .current
              .profundidadAlcanzada;


          // --------------------------------------
          // EFECTO VERDE
          // --------------------------------------

          // Acaba de alcanzar profundidad.
          if (
            !profundidadAntes &&
            profundidadDespues
          ) {
            verdeHastaRef.current =
              timestamp +
              300;
          }


          // Ha completado la repetición
          // al volver arriba.
          if (
            analisis.repeticionSumada
          ) {
            verdeHastaRef.current =
              timestamp +
              300;
          }


          const mostrarVerde =
            timestamp <
            verdeHastaRef.current;


          // --------------------------------------
          // ACTUALIZAR INTERFAZ
          // --------------------------------------

          setAnguloRodilla(
            Math.round(
              analisis.anguloRodilla
            )
          );


          if (
            analisis.inclinacionTronco !==
            null
          ) {
            setInclinacionTronco(
              Math.round(
                analisis.inclinacionTronco
              )
            );
          } else {
            setInclinacionTronco(
              null
            );
          }


          setFase(
            analisis.fase
          );


          setFeedback(
            analisis.feedbackMovimiento
          );


          setFeedbackTronco(
            analisis.feedbackTronco
          );


          setMensaje(
            hombro !== null
              ? "Cuerpo detectado correctamente"
              : "Pierna detectada; hombro no disponible"
          );


          // --------------------------------------
          // REPETICIÓN COMPLETA
          // --------------------------------------

          if (
            analisis.repeticionSumada
          ) {
            setRepeticiones(
              analisis.repeticiones
            );


            setHistorial(
              [
                ...analisis.historial
              ]
            );


            console.log(
              "Repetición de sentadilla en vídeo:",
              analisis.repeticiones
            );
          }


          // --------------------------------------
          // DIBUJAR
          // --------------------------------------

          dibujarCuerpo(
            contexto,
            hombro,
            cadera,
            rodilla,
            tobillo,
            mostrarVerde
          );

        } else {
          setMensaje(
            "Asegúrate de que se vea la pierna completa"
          );
        }
      }

    } catch (error) {
      console.error(
        "Error analizando vídeo de sentadilla:",
        error
      );
    }


    // Analizamos el siguiente frame.
    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrameVideo
      );
  }


  // ==================================================
  // REPRODUCIR VÍDEO
  // ==================================================

  async function iniciarAnalisisVideo() {
    // Si el vídeo había terminado,
    // empezamos una sesión nueva.
    if (
      reiniciarAlReproducirRef.current
    ) {
      reiniciarAnalisisSentadilla();


      reiniciarAlReproducirRef.current =
        false;
    }


    // MediaPipe se carga
    // únicamente cuando hace falta.
    await prepararMediaPipe();


    // Evitamos dos bucles
    // simultáneos.
    detenerAnalisisVideo();


    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrameVideo
      );


    setMensaje(
      "Analizando vídeo"
    );
  }


  // ==================================================
  // PAUSAR
  // ==================================================

  function pausarAnalisisVideo() {
    detenerAnalisisVideo();
  }


  // ==================================================
  // VÍDEO TERMINADO
  // ==================================================

  function videoTerminado() {
    detenerAnalisisVideo();


    // Conservamos historial y resumen
    // para que el usuario pueda verlos.
    setMensaje(
      "Análisis terminado"
    );


    // La siguiente reproducción
    // empezará desde una sesión nueva.
    reiniciarAlReproducirRef.current =
      true;
  }


  // ==================================================
  // INTERFAZ
  // ==================================================

  if (
    !props.visible
  ) {
    return null;
  }


  return (
    <div className="vision-fit-layout">

      {/* =============================================
          IZQUIERDA: VÍDEO
          ============================================= */}

      <div className="vision-fit-camera-column">

        <h3>
          {props.nombreVideo}
        </h3>


        {/* Usamos estilos propios aquí
            para NO aplicar el espejo
            que utilizamos en la webcam. */}

        <div
          style={{
            position:
              "relative",

            width:
              "100%",

            maxWidth:
              "640px"
          }}
        >

          <video
            ref={
              videoRef
            }

            src={
              props.urlVideo
            }

            controls

            playsInline

            onPlaying={
              iniciarAnalisisVideo
            }

            onPause={
              pausarAnalisisVideo
            }

            onEnded={
              videoTerminado
            }

            style={{
              width:
                "100%",

              height:
                "auto",

              display:
                "block",

              borderRadius:
                "8px"
            }}
          />


          <canvas
            ref={
              canvasRef
            }

            style={{
              position:
                "absolute",

              top:
                0,

              left:
                0,

              width:
                "100%",

              height:
                "100%",

              pointerEvents:
                "none"
            }}
          />

        </div>

      </div>


      {/* =============================================
          DERECHA: ANÁLISIS
          ============================================= */}

      <div className="vision-fit-data-column">

        <section className="analysis-section">

          <h2>
            Sentadilla
          </h2>


          <p>
            <strong>
              Repeticiones:
            </strong>{" "}
            {repeticiones}
          </p>


          <p>
            <strong>
              Ángulo de rodilla:
            </strong>{" "}
            {anguloRodilla}°
          </p>


          <p>
            <strong>
              Inclinación del tronco:
            </strong>{" "}

            {inclinacionTronco !==
            null
              ? inclinacionTronco +
                "°"
              : "No disponible"}
          </p>


          <p>
            <strong>
              Fase:
            </strong>{" "}
            {fase}
          </p>


          <p>
            <strong>
              Movimiento:
            </strong>{" "}
            {feedback}
          </p>


          <p>
            <strong>
              Técnica del tronco:
            </strong>{" "}
            {feedbackTronco}
          </p>


          <p>
            <strong>
              Estado:
            </strong>{" "}
            {mensaje}
          </p>

        </section>


        {/* ===========================================
            RESUMEN
            =========================================== */}

        {historial.length >
        0 ? (

          <section className="analysis-section">

            <h2>
              Resumen de sesión
            </h2>


            <p>
              <strong>
                Repeticiones:
              </strong>{" "}
              {resumen.total}
            </p>


            <p>
              <strong>
                Correctas:
              </strong>{" "}
              {resumen.correctas}
            </p>


            <p>
              <strong>
                Técnica correcta:
              </strong>{" "}

              {Math.round(
                resumen.porcentajeCorrectas
              )}
              %
            </p>


            <p>
              <strong>
                Profundidad insuficiente:
              </strong>{" "}

              {
                resumen.profundidadInsuficiente
              }
            </p>


            <p>
              <strong>
                Exceso de inclinación:
              </strong>{" "}

              {
                resumen.excesoInclinacionTronco
              }
            </p>

          </section>

        ) : null}


        {/* ===========================================
            HISTORIAL
            =========================================== */}

        {historial.length >
        0 ? (

          <section className="analysis-section">

            <h2>
              Historial
            </h2>


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
                        Rep{" "}
                        {
                          repeticion.numero
                        }
                        :
                      </strong>{" "}

                      {
                        repeticion.resultado
                      }

                      {" — "}

                      rodilla mín.:{" "}

                      {Math.round(
                        repeticion.anguloMinimo
                      )}
                      °

                      {" — "}

                      tronco máx.:{" "}

                      {repeticion
                        .inclinacionTroncoMaxima !==
                      null
                        ? Math.round(
                            repeticion
                              .inclinacionTroncoMaxima
                          ) +
                          "°"
                        : "N/D"}
                    </li>
                  );
                }
              )}

            </ol>

          </section>

        ) : null}

      </div>

    </div>
  );
}


export default SentadillaVideoPreview;