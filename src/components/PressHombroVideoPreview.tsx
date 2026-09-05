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

// Función común para crear MediaPipe.
import {
  crearPoseLandmarker
} from "../mediapipe/pose";


// --------------------------------------------------
// UTILIDADES COMUNES DE MEDIAPIPE
// --------------------------------------------------
//
// Estas funciones antes estaban definidas
// directamente dentro de PressHombroVideoPreview.
//
// Ahora las reutilizamos desde dibujo.ts.
import {
  convertirAPixeles,
  dibujarConexion,
  dibujarLandmark,
  esLandmarkValido
} from "../mediapipe/dibujo";


// --------------------------------------------------
// LÓGICA DEL PRESS DE HOMBRO
// --------------------------------------------------

import {
  analizarPressHombro,
  calcularResumenSesionPress,
  crearEstadoPressHombro
} from "../ejercicios/pressHombro";

import type {
  FasePressHombro,
  PuntoPressHombro,
  ResultadoRepeticionPress
} from "../ejercicios/pressHombro";


// --------------------------------------------------
// PROPS
// --------------------------------------------------

interface PressHombroVideoPreviewProps {
  // URL temporal creada
  // a partir del vídeo seleccionado.
  urlVideo: string;

  // Nombre original del archivo.
  nombreVideo: string;

  // Permite ocultar el vídeo
  // cuando se utiliza otra fuente.
  visible: boolean;
}


function PressHombroVideoPreview(
  props: PressHombroVideoPreviewProps
) {
  // ==================================================
  // REFERENCIAS
  // ==================================================

  // Elemento <video>.
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );


  // Canvas situado
  // encima del vídeo.
  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );


  // Detector de MediaPipe.
  const poseLandmarkerRef =
    useRef<PoseLandmarker | null>(
      null
    );


  // requestAnimationFrame.
  const animationFrameRef =
    useRef<number | null>(
      null
    );


  // Estado interno del press.
  const estadoPressRef =
    useRef(
      crearEstadoPressHombro()
    );


  // Instante hasta el que
  // queremos mantener los landmarks
  // y conexiones en verde.
  const verdeHastaRef =
    useRef<number>(
      0
    );


  // Cuando el vídeo termina,
  // la siguiente reproducción
  // debe comenzar una sesión nueva.
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
    anguloIzquierdo,
    setAnguloIzquierdo
  ] =
    useState<number>(
      0
    );


  const [
    anguloDerecho,
    setAnguloDerecho
  ] =
    useState<number>(
      0
    );


  const [
    diferenciaAngular,
    setDiferenciaAngular
  ] =
    useState<number>(
      0
    );


  const [
    fase,
    setFase
  ] =
    useState<FasePressHombro>(
      "esperando"
    );


  const [
    feedbackMovimiento,
    setFeedbackMovimiento
  ] =
    useState<string>(
      "Pulsa reproducir para comenzar el análisis"
    );


  const [
    feedbackSimetria,
    setFeedbackSimetria
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
      ResultadoRepeticionPress[]
    >(
      []
    );


  // ==================================================
  // RESUMEN
  // ==================================================

  const resumen =
    calcularResumenSesionPress(
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

  function reiniciarAnalisisPress() {
    // Creamos un estado interno
    // completamente nuevo.
    estadoPressRef.current =
      crearEstadoPressHombro();


    // Reiniciamos los datos visibles.
    setRepeticiones(
      0
    );


    setAnguloIzquierdo(
      0
    );


    setAnguloDerecho(
      0
    );


    setDiferenciaAngular(
      0
    );


    setFase(
      "esperando"
    );


    setFeedbackMovimiento(
      "Pulsa reproducir para comenzar el análisis"
    );


    setFeedbackSimetria(
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


      // Cada vídeo representa
      // una sesión nueva.
      reiniciarAnalisisPress();


      reiniciarAlReproducirRef.current =
        false;


      // Limpiamos el canvas.
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
  // CAMBIO DE VISIBILIDAD
  // ==================================================

  useEffect(
    function () {
      // Si el componente deja
      // de estar visible,
      // detenemos también el vídeo.
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
  // LIMPIEZA FINAL
  // ==================================================

  useEffect(function () {
    return function limpiarComponente() {
      detenerAnalisisVideo();


      if (
        videoRef.current
      ) {
        videoRef.current.pause();
      }
    };
  }, []);


  // ==================================================
  // PREPARAR MEDIAPIPE
  // ==================================================

  async function prepararMediaPipe() {
    // Si ya está preparado,
    // reutilizamos el mismo detector.
    if (
      poseLandmarkerRef.current
    ) {
      return;
    }


    console.log(
      "Cargando MediaPipe para vídeo de press de hombro..."
    );


    const poseLandmarker =
      await crearPoseLandmarker();


    poseLandmarkerRef.current =
      poseLandmarker;


    console.log(
      "MediaPipe preparado para vídeo de press de hombro"
    );
  }


  // ==================================================
  // DIBUJAR BRAZO
  // ==================================================
  //
  // Esta función sigue siendo específica
  // del press porque define
  // cómo dibujamos cada brazo.
  //
  // Las operaciones básicas
  // dibujarConexion y dibujarLandmark
  // vienen ahora desde dibujo.ts.
  // ==================================================

  function dibujarBrazo(
    contexto:
      CanvasRenderingContext2D,
    hombro:
      PuntoPressHombro,
    codo:
      PuntoPressHombro,
    muneca:
      PuntoPressHombro,
    verde:
      boolean
  ) {
    // Hombro -> codo.
    dibujarConexion(
      contexto,
      hombro,
      codo,
      verde
    );


    // Codo -> muñeca.
    dibujarConexion(
      contexto,
      codo,
      muneca,
      verde
    );


    // Landmarks.
    dibujarLandmark(
      contexto,
      hombro,
      verde
    );


    dibujarLandmark(
      contexto,
      codo,
      verde
    );


    dibujarLandmark(
      contexto,
      muneca,
      verde
    );
  }


  // ==================================================
  // ANALIZAR FRAME DE VÍDEO
  // ==================================================

  function analizarFrameVideo(
    timestamp: number
  ) {
    // Comprobamos que todo
    // lo necesario existe.
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
    // detenemos el bucle.
    if (
      video.paused ||
      video.ended
    ) {
      detenerAnalisisVideo();

      return;
    }


    // Esperamos a tener
    // una imagen válida.
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


    // Igualamos la resolución
    // real del canvas
    // con la resolución del vídeo.
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


    // Limpiamos el frame anterior.
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


        // ========================================
        // BRAZO IZQUIERDO
        // ========================================

        // 11 = hombro izquierdo.
        const hombroIzquierdoNormalizado =
          landmarks[11];


        // 13 = codo izquierdo.
        const codoIzquierdoNormalizado =
          landmarks[13];


        // 15 = muñeca izquierda.
        const munecaIzquierdaNormalizada =
          landmarks[15];


        // ========================================
        // BRAZO DERECHO
        // ========================================

        // 12 = hombro derecho.
        const hombroDerechoNormalizado =
          landmarks[12];


        // 14 = codo derecho.
        const codoDerechoNormalizado =
          landmarks[14];


        // 16 = muñeca derecha.
        const munecaDerechaNormalizada =
          landmarks[16];


        // ----------------------------------------
        // COMPROBAR LANDMARKS
        // ----------------------------------------

        if (
          hombroIzquierdoNormalizado &&
          codoIzquierdoNormalizado &&
          munecaIzquierdaNormalizada &&
          hombroDerechoNormalizado &&
          codoDerechoNormalizado &&
          munecaDerechaNormalizada
        ) {
          // --------------------------------------
          // VISIBILIDAD IZQUIERDA
          // --------------------------------------
          //
          // esLandmarkValido viene
          // ahora desde dibujo.ts.
          // --------------------------------------

          const brazoIzquierdoValido =
            esLandmarkValido(
              hombroIzquierdoNormalizado
            ) &&
            esLandmarkValido(
              codoIzquierdoNormalizado
            ) &&
            esLandmarkValido(
              munecaIzquierdaNormalizada
            );


          // --------------------------------------
          // VISIBILIDAD DERECHA
          // --------------------------------------

          const brazoDerechoValido =
            esLandmarkValido(
              hombroDerechoNormalizado
            ) &&
            esLandmarkValido(
              codoDerechoNormalizado
            ) &&
            esLandmarkValido(
              munecaDerechaNormalizada
            );


          // Para el press necesitamos
          // ambos brazos simultáneamente.
          if (
            brazoIzquierdoValido &&
            brazoDerechoValido
          ) {
            // ====================================
            // IZQUIERDO A PÍXELES
            // ====================================
            //
            // convertirAPixeles viene
            // ahora desde dibujo.ts.
            // ====================================

            const hombroIzquierdo =
              convertirAPixeles(
                hombroIzquierdoNormalizado,
                canvas
              );


            const codoIzquierdo =
              convertirAPixeles(
                codoIzquierdoNormalizado,
                canvas
              );


            const munecaIzquierda =
              convertirAPixeles(
                munecaIzquierdaNormalizada,
                canvas
              );


            // ====================================
            // DERECHO A PÍXELES
            // ====================================

            const hombroDerecho =
              convertirAPixeles(
                hombroDerechoNormalizado,
                canvas
              );


            const codoDerecho =
              convertirAPixeles(
                codoDerechoNormalizado,
                canvas
              );


            const munecaDerecha =
              convertirAPixeles(
                munecaDerechaNormalizada,
                canvas
              );


            // ====================================
            // ANALIZAR PRESS
            // ====================================
            //
            // La lógica bilateral
            // permanece exactamente igual.
            // ====================================

            const analisis =
              analizarPressHombro(
                estadoPressRef.current,

                hombroIzquierdo,
                codoIzquierdo,
                munecaIzquierda,

                hombroDerecho,
                codoDerecho,
                munecaDerecha
              );


            // ====================================
            // FEEDBACK VERDE
            // ====================================

            // Cuando ambos brazos alcanzan
            // una posición importante,
            // mostramos los landmarks
            // en verde durante 300 ms.
            if (
              analisis.posicionBajaAlcanzada ||
              analisis.posicionAltaAlcanzada
            ) {
              verdeHastaRef.current =
                timestamp +
                300;
            }


            const mostrarVerde =
              timestamp <
              verdeHastaRef.current;


            // ====================================
            // ACTUALIZAR INTERFAZ
            // ====================================

            setAnguloIzquierdo(
              Math.round(
                analisis.anguloCodoIzquierdo
              )
            );


            setAnguloDerecho(
              Math.round(
                analisis.anguloCodoDerecho
              )
            );


            setDiferenciaAngular(
              Math.round(
                analisis.diferenciaAngular
              )
            );


            setFase(
              analisis.fase
            );


            setFeedbackMovimiento(
              analisis.feedbackMovimiento
            );


            setFeedbackSimetria(
              analisis.feedbackSimetria
            );


            setMensaje(
              "Ambos brazos detectados correctamente"
            );


            // ====================================
            // REPETICIÓN COMPLETA
            // ====================================

            if (
              analisis.repeticionSumada
            ) {
              setRepeticiones(
                analisis.repeticiones
              );


              // Copiamos el array
              // para que React detecte
              // correctamente el cambio.
              setHistorial(
                [
                  ...analisis.historial
                ]
              );


              console.log(
                "Repetición de press en vídeo:",
                analisis.repeticiones
              );
            }


            // ====================================
            // DIBUJAR AMBOS BRAZOS
            // ====================================

            dibujarBrazo(
              contexto,
              hombroIzquierdo,
              codoIzquierdo,
              munecaIzquierda,
              mostrarVerde
            );


            dibujarBrazo(
              contexto,
              hombroDerecho,
              codoDerecho,
              munecaDerecha,
              mostrarVerde
            );

          } else {
            setMensaje(
              "Asegúrate de que se vean completamente los dos brazos"
            );
          }
        }
      }

    } catch (error) {
      console.error(
        "Error analizando vídeo de press de hombro:",
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
  // INICIAR ANÁLISIS
  // ==================================================

  async function iniciarAnalisisVideo() {
    // Si el vídeo ya terminó anteriormente,
    // la siguiente reproducción
    // empieza una sesión limpia.
    if (
      reiniciarAlReproducirRef.current
    ) {
      reiniciarAnalisisPress();


      reiniciarAlReproducirRef.current =
        false;
    }


    // Cargamos MediaPipe
    // solo cuando realmente lo necesitamos.
    await prepararMediaPipe();


    // Evitamos dos bucles simultáneos.
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


    // Dejamos visibles
    // historial y resumen.
    setMensaje(
      "Análisis terminado"
    );


    // La siguiente reproducción
    // será una sesión nueva.
    reiniciarAlReproducirRef.current =
      true;
  }


  // ==================================================
  // INTERFAZ
  // ==================================================

  // Si por algún motivo
  // el componente debe ocultarse,
  // no renderizamos nada.
  if (
    !props.visible
  ) {
    return null;
  }


  return (
    <div className="vision-fit-layout">

      {/* =============================================
          VÍDEO
          ============================================= */}

      <div className="vision-fit-camera-column">

        <h3>
          {props.nombreVideo}
        </h3>


        {/* No utilizamos camera-container
            porque el vídeo grabado
            NO debe verse como espejo. */}

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
          DATOS
          ============================================= */}

      <div className="vision-fit-data-column">

        {/* ===========================================
            MOVIMIENTO
            =========================================== */}

        <section className="analysis-section">

          <h2>
            Press de hombro
          </h2>


          <p>
            <strong>
              Repeticiones:
            </strong>{" "}
            {repeticiones}
          </p>


          <p>
            <strong>
              Ángulo izquierdo:
            </strong>{" "}
            {anguloIzquierdo}°
          </p>


          <p>
            <strong>
              Ángulo derecho:
            </strong>{" "}
            {anguloDerecho}°
          </p>


          <p>
            <strong>
              Diferencia actual:
            </strong>{" "}
            {diferenciaAngular}°
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
            {feedbackMovimiento}
          </p>


          <p>
            <strong>
              Simetría:
            </strong>{" "}
            {feedbackSimetria}
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
                Descompensación:
              </strong>{" "}
              {resumen.descompensadas}
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

                      diferencia media:{" "}

                      {Math.round(
                        repeticion.diferenciaMedia
                      )}
                      °

                      {" — "}

                      máxima:{" "}

                      {Math.round(
                        repeticion.diferenciaMaxima
                      )}
                      °

                      {" — "}

                      descompensado:{" "}

                      {Math.round(
                        repeticion.porcentajeDescompensado
                      )}
                      %
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


export default PressHombroVideoPreview;