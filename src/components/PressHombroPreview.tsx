// Importamos los hooks necesarios.
import {
  useEffect,
  useRef,
  useState
} from "react";

// Tipo de MediaPipe.
import type {
  PoseLandmarker
} from "@mediapipe/tasks-vision";

// Función común
// para crear MediaPipe.
import {
  crearPoseLandmarker
} from "../mediapipe/pose";


// --------------------------------------------------
// PRESS DE HOMBRO
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


function PressHombroPreview() {
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


  const estadoPressRef =
    useRef(
      crearEstadoPressHombro()
    );


  // Hasta cuándo mantenemos
  // el dibujo en verde.
  const verdeHastaRef =
    useRef<number>(
      0
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
      "Coloca ambos brazos en posición baja"
    );


  const [
    feedbackSimetria,
    setFeedbackSimetria
  ] =
    useState<string>(
      "Esperando detección"
    );


  const [
    mensaje,
    setMensaje
  ] =
    useState<string>(
      "Colócate de frente y muestra los dos brazos"
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
  // CÁMARA Y MEDIAPIPE
  // ==================================================

  useEffect(function () {
    let stream:
      MediaStream | null =
      null;


    let componenteActivo =
      true;


    async function iniciarSistema() {
      try {
        const nuevoStream =
          await navigator.mediaDevices.getUserMedia({
            video:
              true,

            audio:
              false
          });


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


        if (
          videoRef.current
        ) {
          videoRef.current.srcObject =
            stream;
        }


        console.log(
          "Cargando MediaPipe para press de hombro..."
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
          "MediaPipe preparado para press de hombro"
        );


        if (
          videoRef.current &&
          videoRef.current.readyState >=
            2
        ) {
          iniciarAnalisis();
        }

      } catch (error) {
        console.error(
          "Error iniciando press de hombro:",
          error
        );
      }
    }


    iniciarSistema();


    // ------------------------------------------------
    // LIMPIEZA
    // ------------------------------------------------

    return function detenerSistema() {
      componenteActivo =
        false;


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


      if (
        videoRef.current
      ) {
        videoRef.current.srcObject =
          null;
      }
    };
  }, []);


  // ==================================================
  // CONVERTIR A PÍXELES
  // ==================================================

  function convertirAPixeles(
    punto: PuntoPressHombro,
    canvas: HTMLCanvasElement
  ): PuntoPressHombro {
    return {
      x:
        punto.x *
        canvas.width,

      y:
        punto.y *
        canvas.height,

      visibility:
        punto.visibility
    };
  }


  // ==================================================
  // VISIBILIDAD
  // ==================================================

  function esLandmarkValido(
    punto: PuntoPressHombro
  ): boolean {
    if (
      punto.visibility ===
      undefined
    ) {
      return true;
    }


    return (
      punto.visibility >=
      0.7
    );
  }


  // ==================================================
  // DIBUJAR PUNTO
  // ==================================================

  function dibujarLandmark(
    contexto:
      CanvasRenderingContext2D,
    punto:
      PuntoPressHombro,
    verde:
      boolean
  ) {
    contexto.beginPath();


    contexto.arc(
      punto.x,
      punto.y,
      8,
      0,
      Math.PI * 2
    );


    contexto.fillStyle =
      verde
        ? "limegreen"
        : "red";


    contexto.fill();
  }


  // ==================================================
  // DIBUJAR CONEXIÓN
  // ==================================================

  function dibujarConexion(
    contexto:
      CanvasRenderingContext2D,
    inicio:
      PuntoPressHombro,
    fin:
      PuntoPressHombro,
    verde:
      boolean
  ) {
    contexto.beginPath();


    contexto.moveTo(
      inicio.x,
      inicio.y
    );


    contexto.lineTo(
      fin.x,
      fin.y
    );


    contexto.lineWidth =
      4;


    contexto.strokeStyle =
      verde
        ? "limegreen"
        : "blue";


    contexto.stroke();
  }


  // ==================================================
  // DIBUJAR BRAZO
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
    dibujarConexion(
      contexto,
      hombro,
      codo,
      verde
    );


    dibujarConexion(
      contexto,
      codo,
      muneca,
      verde
    );


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
  // ANALIZAR FRAME
  // ==================================================

  function analizarFrame(
    timestamp: number
  ) {
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

        const hombroIzquierdoNormalizado =
          landmarks[11];


        const codoIzquierdoNormalizado =
          landmarks[13];


        const munecaIzquierdaNormalizada =
          landmarks[15];


        // ========================================
        // BRAZO DERECHO
        // ========================================

        const hombroDerechoNormalizado =
          landmarks[12];


        const codoDerechoNormalizado =
          landmarks[14];


        const munecaDerechaNormalizada =
          landmarks[16];


        // ----------------------------------------
        // EXISTENCIA
        // ----------------------------------------

        if (
          hombroIzquierdoNormalizado &&
          codoIzquierdoNormalizado &&
          munecaIzquierdaNormalizada &&
          hombroDerechoNormalizado &&
          codoDerechoNormalizado &&
          munecaDerechaNormalizada
        ) {
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


          if (
            brazoIzquierdoValido &&
            brazoDerechoValido
          ) {
            // ====================================
            // CONVERTIR IZQUIERDO
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
            // CONVERTIR DERECHO
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
            // ANALIZAR
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
            // VERDE
            // ====================================

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


            // ------------------------------------
            // INTERFAZ
            // ------------------------------------

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


            // ------------------------------------
            // REPETICIÓN COMPLETA
            // ------------------------------------

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
            }


            // ====================================
            // DIBUJAR
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
        "Error analizando press de hombro:",
        error
      );
    }


    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrame
      );
  }


  // ==================================================
  // INICIAR
  // ==================================================

  function iniciarAnalisis() {
    if (
      !poseLandmarkerRef.current
    ) {
      return;
    }


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
  }


  // ==================================================
  // VÍDEO PREPARADO
  // ==================================================

  function videoPreparado() {
    iniciarAnalisis();
  }


  // ==================================================
  // INTERFAZ
  // ==================================================

  return (
    <div className="vision-fit-layout">

      {/* =============================================
          CÁMARA
          ============================================= */}

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
              Detección:
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


export default PressHombroPreview;