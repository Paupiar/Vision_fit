// Importamos los hooks de React necesarios.
import {
  useEffect,
  useRef,
  useState
} from "react";

// Importamos únicamente el tipo PoseLandmarker.
import type { PoseLandmarker } from "@mediapipe/tasks-vision";

// Importamos nuestra configuración de MediaPipe.
import { crearPoseLandmarker } from "../mediapipe/pose";


// --------------------------------------------------
// TIPOS
// --------------------------------------------------

// Representa un punto detectado por MediaPipe.
interface Punto {
  x: number;
  y: number;
  visibility?: number;
}


// Guarda la posición inicial del codo
// respecto al hombro.
interface ReferenciaCodo {
  dx: number;
  dy: number;

  // Longitud hombro-codo utilizada
  // para normalizar el desplazamiento.
  longitudBrazo: number;
}


function CameraPreview() {
  // --------------------------------------------------
  // REFERENCIAS PRINCIPALES
  // --------------------------------------------------

  // Elemento <video>.
  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  // Elemento <canvas>.
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  // Detector de MediaPipe.
  const poseLandmarkerRef =
    useRef<PoseLandmarker | null>(null);

  // Identificador del bucle de animación.
  const animationFrameRef =
    useRef<number | null>(null);


  // --------------------------------------------------
  // ESTADO INTERNO DEL CURL
  // --------------------------------------------------

  // "abajo":
  // el usuario debe empezar a flexionar.
  //
  // "arriba":
  // el usuario debe volver a extender.
  const faseRef =
    useRef<"abajo" | "arriba">("abajo");

  // Número interno de repeticiones.
  const repeticionesRef =
    useRef<number>(0);

  // Hasta qué instante debe mostrarse
  // el brazo en verde.
  const verdeHastaRef =
    useRef<number>(0);

  // Momento de la última actualización
  // visual del ángulo y feedback.
  const ultimaActualizacionUIRef =
    useRef<number>(0);


  // --------------------------------------------------
  // FEEDBACK DE MOVIMIENTO
  // --------------------------------------------------

  // Guarda el mensaje actual para evitar
  // actualizaciones innecesarias de React.
  const feedbackRef =
    useRef<string>(
      "Colócate frente a la cámara"
    );


  // --------------------------------------------------
  // ANÁLISIS TÉCNICO
  // --------------------------------------------------

  // Guarda la posición inicial del codo
  // respecto al hombro.
  const referenciaCodoRef =
    useRef<ReferenciaCodo | null>(null);

  // Guarda internamente el último
  // mensaje técnico.
  const feedbackTecnicoRef =
    useRef<string>(
      "Extiende el brazo para calibrar el codo"
    );


  // --------------------------------------------------
  // ESTADOS VISIBLES DE REACT
  // --------------------------------------------------

  // Repeticiones.
  const [repeticiones, setRepeticiones] =
    useState<number>(0);

  // Ángulo actual.
  const [anguloActual, setAnguloActual] =
    useState<number>(0);

  // Fase visible.
  const [faseActual, setFaseActual] =
    useState<"abajo" | "arriba">("abajo");

  // Feedback del recorrido.
  const [feedback, setFeedback] =
    useState<string>(
      "Colócate frente a la cámara"
    );

  // Feedback técnico.
  const [
    feedbackTecnico,
    setFeedbackTecnico
  ] =
    useState<string>(
      "Extiende el brazo para calibrar el codo"
    );


  // --------------------------------------------------
  // INICIALIZACIÓN
  // --------------------------------------------------

  useEffect(function () {
    // Stream de la webcam.
    let stream: MediaStream | null =
      null;

    // Nos permite saber si CameraPreview
    // sigue montado.
    let componenteActivo =
      true;


    // Mensaje útil para comprobar que el navegador
    // está utilizando esta versión del componente.
    console.log(
      "CameraPreview con análisis técnico cargado"
    );


    async function iniciarSistema() {
      try {
        // ------------------------------------------
        // CÁMARA
        // ------------------------------------------

        const nuevoStream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });


        // Si el componente desapareció mientras
        // esperábamos la cámara, apagamos el stream.
        if (!componenteActivo) {
          nuevoStream
            .getTracks()
            .forEach(function (track) {
              track.stop();
            });

          return;
        }


        // Guardamos el stream.
        stream =
          nuevoStream;


        // Lo conectamos al vídeo.
        if (videoRef.current) {
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


        // Si el componente desapareció
        // mientras MediaPipe cargaba,
        // dejamos de continuar.
        if (!componenteActivo) {
          return;
        }


        // Guardamos el detector.
        poseLandmarkerRef.current =
          poseLandmarker;


        console.log(
          "MediaPipe cargado"
        );


        // Si el vídeo ya está preparado,
        // iniciamos el análisis.
        if (
          videoRef.current &&
          videoRef.current.readyState >= 2
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


    // Iniciamos cámara y MediaPipe.
    iniciarSistema();


    // --------------------------------------------------
    // LIMPIEZA
    // --------------------------------------------------

    return function detenerSistema() {
      componenteActivo =
        false;


      // Detenemos el bucle de análisis.
      if (
        animationFrameRef.current !== null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );

        animationFrameRef.current =
          null;
      }


      // Apagamos físicamente la cámara.
      if (stream) {
        stream
          .getTracks()
          .forEach(function (track) {
            track.stop();
          });
      }


      // Desconectamos el vídeo.
      if (videoRef.current) {
        videoRef.current.srcObject =
          null;
      }


      console.log(
        "Cámara y análisis detenidos"
      );
    };
  }, []);


  // --------------------------------------------------
  // COORDENADAS
  // --------------------------------------------------

  // Convierte las coordenadas normalizadas
  // de MediaPipe a píxeles del canvas.
  function convertirAPixeles(
    punto: Punto,
    canvas: HTMLCanvasElement
  ): Punto {
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


  // --------------------------------------------------
  // VISIBILIDAD
  // --------------------------------------------------

  // Comprueba que MediaPipe tenga suficiente
  // confianza en un landmark.
  function esLandmarkValido(
    punto: Punto
  ): boolean {
    if (
      punto.visibility === undefined
    ) {
      return true;
    }


    // Exigimos una visibilidad mínima del 70 %.
    return (
      punto.visibility >= 0.7
    );
  }


  // --------------------------------------------------
  // DISTANCIA ENTRE DOS PUNTOS
  // --------------------------------------------------

  function calcularDistancia(
    a: Punto,
    b: Punto
  ): number {
    const diferenciaX =
      a.x - b.x;

    const diferenciaY =
      a.y - b.y;


    // Teorema de Pitágoras.
    return Math.sqrt(
      diferenciaX * diferenciaX +
      diferenciaY * diferenciaY
    );
  }


  // --------------------------------------------------
  // ÁNGULO DEL CODO
  // --------------------------------------------------

  // Calcula:
  //
  // hombro -> codo -> muñeca
  //
  // siendo el codo el vértice.
  function calcularAngulo(
    a: Punto,
    b: Punto,
    c: Punto
  ): number {
    const angulo1 =
      Math.atan2(
        a.y - b.y,
        a.x - b.x
      );


    const angulo2 =
      Math.atan2(
        c.y - b.y,
        c.x - b.x
      );


    let angulo =
      Math.abs(
        angulo2 - angulo1
      );


    // Radianes -> grados.
    angulo =
      angulo *
      (180 / Math.PI);


    // Limitamos entre 0 y 180 grados.
    if (angulo > 180) {
      angulo =
        360 - angulo;
    }


    return angulo;
  }


  // --------------------------------------------------
  // FEEDBACK VERDE
  // --------------------------------------------------

  // Los landmarks aparecen verdes
  // durante 0,3 segundos.
  function activarFeedbackVerde() {
    verdeHastaRef.current =
      performance.now() + 300;
  }


  // --------------------------------------------------
  // FEEDBACK DEL MOVIMIENTO
  // --------------------------------------------------

  function cambiarFeedback(
    nuevoFeedback: string
  ) {
    // Si el mensaje no ha cambiado,
    // no actualizamos React.
    if (
      feedbackRef.current ===
      nuevoFeedback
    ) {
      return;
    }


    feedbackRef.current =
      nuevoFeedback;


    setFeedback(
      nuevoFeedback
    );
  }


  // Genera el feedback de subida y bajada.
  function actualizarFeedback(
    anguloCodo: number
  ) {
    // ----------------------------------------------
    // SUBIDA
    // ----------------------------------------------

    if (
      faseRef.current === "abajo"
    ) {
      // 160 grados o más.
      if (anguloCodo >= 160) {
        cambiarFeedback(
          "Brazo extendido"
        );

        return;
      }


      // 90 - 159 grados.
      if (anguloCodo >= 90) {
        cambiarFeedback(
          "Sigue flexionando"
        );

        return;
      }


      // 51 - 89 grados.
      if (anguloCodo > 50) {
        cambiarFeedback(
          "Casi, flexiona un poco más"
        );

        return;
      }


      // 50 grados o menos.
      cambiarFeedback(
        "Flexión completa"
      );

      return;
    }


    // ----------------------------------------------
    // BAJADA
    // ----------------------------------------------

    // Todavía se encuentra arriba.
    if (anguloCodo <= 50) {
      cambiarFeedback(
        "Sigue bajando"
      );

      return;
    }


    // Está realizando la extensión.
    if (anguloCodo < 160) {
      cambiarFeedback(
        "Casi estás abajo"
      );

      return;
    }


    // Extensión completada.
    cambiarFeedback(
      "Brazo extendido"
    );
  }


  // --------------------------------------------------
  // CAMBIAR FEEDBACK TÉCNICO
  // --------------------------------------------------

  function cambiarFeedbackTecnico(
    nuevoFeedback: string
  ) {
    // Evitamos actualizaciones repetidas.
    if (
      feedbackTecnicoRef.current ===
      nuevoFeedback
    ) {
      return;
    }


    feedbackTecnicoRef.current =
      nuevoFeedback;


    setFeedbackTecnico(
      nuevoFeedback
    );
  }


  // --------------------------------------------------
  // CALIBRAR POSICIÓN DEL CODO
  // --------------------------------------------------

  function guardarReferenciaCodo(
    hombro: Punto,
    codo: Punto
  ) {
    // Posición del codo relativa al hombro.
    const dx =
      codo.x -
      hombro.x;

    const dy =
      codo.y -
      hombro.y;


    // Longitud aproximada del brazo superior.
    const longitudBrazo =
      calcularDistancia(
        hombro,
        codo
      );


    // Evitamos divisiones entre cero.
    if (longitudBrazo <= 0) {
      return;
    }


    referenciaCodoRef.current = {
      dx:
        dx,

      dy:
        dy,

      longitudBrazo:
        longitudBrazo
    };


    console.log(
      "Referencia del codo guardada"
    );
  }


  // --------------------------------------------------
  // ANALIZAR ESTABILIDAD DEL CODO
  // --------------------------------------------------

  function analizarTecnicaCodo(
    anguloCodo: number,
    hombro: Punto,
    codo: Punto
  ) {
    // ----------------------------------------------
    // CALIBRACIÓN
    // ----------------------------------------------

    // Utilizamos la posición extendida
    // como referencia.
    if (anguloCodo >= 160) {
      // Guardamos referencia:
      //
      // - si todavía no existe;
      // - o cuando acabamos de volver desde arriba.
      if (
        referenciaCodoRef.current === null ||
        faseRef.current === "arriba"
      ) {
        guardarReferenciaCodo(
          hombro,
          codo
        );
      }


      cambiarFeedbackTecnico(
        "Codo estable"
      );

      return;
    }


    // Sin referencia no podemos
    // analizar el desplazamiento.
    if (
      referenciaCodoRef.current === null
    ) {
      cambiarFeedbackTecnico(
        "Extiende el brazo para calibrar el codo"
      );

      return;
    }


    // ----------------------------------------------
    // POSICIÓN ACTUAL
    // ----------------------------------------------

    // Posición actual del codo
    // respecto al hombro.
    const dxActual =
      codo.x -
      hombro.x;

    const dyActual =
      codo.y -
      hombro.y;


    const referencia =
      referenciaCodoRef.current;


    // Diferencia respecto
    // a la posición inicial.
    const cambioX =
      dxActual -
      referencia.dx;

    const cambioY =
      dyActual -
      referencia.dy;


    // Desplazamiento total.
    const desplazamiento =
      Math.sqrt(
        cambioX * cambioX +
        cambioY * cambioY
      );


    // ----------------------------------------------
    // NORMALIZACIÓN
    // ----------------------------------------------

    // Normalizamos utilizando la longitud
    // hombro-codo para no depender
    // de la distancia a la cámara.
    const desplazamientoRelativo =
      desplazamiento /
      referencia.longitudBrazo;


    // Permitimos inicialmente un 20 %.
    //
    // Este valor se calibrará posteriormente
    // mediante pruebas reales.
    const desplazamientoMaximo =
      0.20;


    // ----------------------------------------------
    // RESULTADO
    // ----------------------------------------------

    if (
      desplazamientoRelativo >
      desplazamientoMaximo
    ) {
      cambiarFeedbackTecnico(
        "Mantén el codo estable"
      );

      return;
    }


    cambiarFeedbackTecnico(
      "Codo estable"
    );
  }


  // --------------------------------------------------
  // CONTEO DEL CURL
  // --------------------------------------------------

  function actualizarCurl(
    anguloCodo: number
  ) {
    // ----------------------------------------------
    // POSICIÓN ABAJO
    // ----------------------------------------------

    // 160 grados o más.
    if (anguloCodo >= 160) {
      // Solo es cambio real si veníamos
      // de la posición superior.
      if (
        faseRef.current === "arriba"
      ) {
        // Feedback verde 0,3 segundos.
        activarFeedbackVerde();


        // Fase visible.
        setFaseActual(
          "abajo"
        );


        console.log(
          "Cambio de fase: abajo"
        );
      }


      // Preparamos una nueva repetición.
      faseRef.current =
        "abajo";
    }


    // ----------------------------------------------
    // POSICIÓN ARRIBA
    // ----------------------------------------------

    // 50 grados o menos
    // completa la subida.
    if (
      anguloCodo <= 50 &&
      faseRef.current === "abajo"
    ) {
      // Cambiamos de fase.
      faseRef.current =
        "arriba";


      // Fase visible.
      setFaseActual(
        "arriba"
      );


      // Verde durante 0,3 segundos.
      activarFeedbackVerde();


      // Sumamos una repetición.
      repeticionesRef.current =
        repeticionesRef.current + 1;


      // Actualizamos React.
      setRepeticiones(
        repeticionesRef.current
      );


      console.log(
        "Repetición detectada:",
        repeticionesRef.current
      );
    }
  }


  // --------------------------------------------------
  // DIBUJAR LANDMARK
  // --------------------------------------------------

  function dibujarLandmark(
    contexto: CanvasRenderingContext2D,
    punto: Punto,
    verdeActivo: boolean
  ) {
    contexto.beginPath();


    contexto.arc(
      punto.x,
      punto.y,
      8,
      0,
      Math.PI * 2
    );


    if (verdeActivo) {
      contexto.fillStyle =
        "limegreen";
    } else {
      contexto.fillStyle =
        "red";
    }


    contexto.fill();
  }


  // --------------------------------------------------
  // DIBUJAR CONEXIÓN
  // --------------------------------------------------

  function dibujarConexion(
    contexto: CanvasRenderingContext2D,
    inicio: Punto,
    fin: Punto,
    verdeActivo: boolean
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


    if (verdeActivo) {
      contexto.strokeStyle =
        "limegreen";
    } else {
      contexto.strokeStyle =
        "blue";
    }


    contexto.stroke();
  }


  // --------------------------------------------------
  // DIBUJAR BRAZO
  // --------------------------------------------------

  function dibujarBrazo(
    contexto: CanvasRenderingContext2D,
    hombro: Punto,
    codo: Punto,
    muneca: Punto
  ) {
    // Comprobamos si estamos dentro
    // de los 300 ms de feedback verde.
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
    // Necesitamos vídeo, canvas y MediaPipe.
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


    // Esperamos a que el vídeo esté listo.
    if (video.readyState < 2) {
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrame
        );

      return;
    }


    // Igualamos resolución de canvas
    // y webcam.
    if (
      canvas.width !== video.videoWidth ||
      canvas.height !== video.videoHeight
    ) {
      canvas.width =
        video.videoWidth;

      canvas.height =
        video.videoHeight;
    }


    // Contexto de dibujo 2D.
    const contexto =
      canvas.getContext("2d");


    if (!contexto) {
      return;
    }


    // Borramos el frame anterior.
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


      // Comprobamos que exista
      // una persona detectada.
      if (
        resultado.landmarks.length > 0
      ) {
        const landmarks =
          resultado.landmarks[0];


        // 12 = hombro derecho.
        const hombroNormalizado =
          landmarks[12];

        // 14 = codo derecho.
        const codoNormalizado =
          landmarks[14];

        // 16 = muñeca derecha.
        const munecaNormalizada =
          landmarks[16];


        // Comprobamos que existan.
        if (
          hombroNormalizado &&
          codoNormalizado &&
          munecaNormalizada
        ) {
          // Los tres landmarks deben
          // superar visibility >= 0.7.
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
            // --------------------------------------
            // CONVERTIMOS A PÍXELES
            // --------------------------------------

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


            // --------------------------------------
            // ÁNGULO DEL CODO
            // --------------------------------------

            const anguloCodo =
              calcularAngulo(
                hombro,
                codo,
                muneca
              );


            // --------------------------------------
            // INTERFAZ
            // --------------------------------------

            // Actualizamos aproximadamente
            // cada 100 milisegundos.
            if (
              timestamp -
                ultimaActualizacionUIRef.current >=
              100
            ) {
              // Ángulo visible.
              setAnguloActual(
                Math.round(
                  anguloCodo
                )
              );


              // Feedback del recorrido.
              actualizarFeedback(
                anguloCodo
              );


              ultimaActualizacionUIRef.current =
                timestamp;
            }


            // --------------------------------------
            // TÉCNICA
            // --------------------------------------

            // Analizamos el desplazamiento
            // del codo respecto al hombro.
            analizarTecnicaCodo(
              anguloCodo,
              hombro,
              codo
            );


            // --------------------------------------
            // CONTEO
            // --------------------------------------

            actualizarCurl(
              anguloCodo
            );


            // --------------------------------------
            // DIBUJO
            // --------------------------------------

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


    // Solicitamos el siguiente frame.
    animationFrameRef.current =
      requestAnimationFrame(
        analizarFrame
      );
  }


  // --------------------------------------------------
  // INICIAR ANÁLISIS
  // --------------------------------------------------

  function iniciarAnalisis() {
    // Necesitamos MediaPipe preparado.
    if (
      !poseLandmarkerRef.current
    ) {
      return;
    }


    // Evitamos dos bucles simultáneos.
    if (
      animationFrameRef.current !== null
    ) {
      cancelAnimationFrame(
        animationFrameRef.current
      );
    }


    // Iniciamos el análisis.
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
    if (videoRef.current) {
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
    <div>

      {/* ----------------------------------------------
          DATOS DEL MOVIMIENTO
          ---------------------------------------------- */}
      <div className="exercise-data">

        <h2>
          Repeticiones: {repeticiones}
        </h2>


        <p>
          Ángulo del codo: {anguloActual}°
        </p>


        <p>
          Fase: {faseActual}
        </p>


        <p>
          Movimiento: {feedback}
        </p>

      </div>


      {/* ----------------------------------------------
          ANÁLISIS TÉCNICO

          Lo colocamos como un bloque independiente.
          Esto permite comprobar claramente que
          React está renderizando esta funcionalidad.
          ---------------------------------------------- */}
      <div>

        <h3>
          Técnica del curl
        </h3>


        <p>
          <strong>
            Estado:
          </strong>{" "}
          {feedbackTecnico}
        </p>

      </div>


      {/* ----------------------------------------------
          CÁMARA + CANVAS
          ---------------------------------------------- */}
      <div className="camera-container">

        <video
          // Vídeo de la webcam.
          ref={videoRef}

          // Reproducción automática.
          autoPlay

          // Mantiene el vídeo integrado
          // en la página en móviles.
          playsInline

          // Cuando el vídeo está preparado
          // iniciamos el análisis.
          onLoadedData={
            videoPreparado
          }

          // Clase que ya utilizamos
          // para invertir la cámara.
          className="camera-video"
        />


        <canvas
          // Canvas situado encima del vídeo.
          ref={canvasRef}

          // Clase que mantiene el canvas
          // alineado e invertido junto al vídeo.
          className="camera-canvas"
        />

      </div>

    </div>
  );
}


// Exportamos CameraPreview.
export default CameraPreview;