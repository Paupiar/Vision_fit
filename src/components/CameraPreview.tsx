// Importamos useEffect para gestionar el inicio y cierre
// de la cámara, useRef para conservar valores entre frames
// y useState para mostrar datos en la interfaz.
import {
  useEffect,
  useRef,
  useState
} from "react";

// Importamos únicamente el tipo PoseLandmarker
// para poder tipar correctamente nuestra referencia.
import type { PoseLandmarker } from "@mediapipe/tasks-vision";

// Importamos nuestra función encargada
// de crear y configurar MediaPipe.
import { crearPoseLandmarker } from "../mediapipe/pose";


// --------------------------------------------------
// TIPOS
// --------------------------------------------------

// Representa un punto detectado por MediaPipe.
interface Punto {
  // Coordenada horizontal.
  x: number;

  // Coordenada vertical.
  y: number;

  // Nivel de visibilidad/confianza del landmark.
  visibility?: number;
}


function CameraPreview() {
  // --------------------------------------------------
  // REFERENCIAS PRINCIPALES
  // --------------------------------------------------

  // Referencia al elemento <video>.
  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  // Referencia al elemento <canvas>.
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  // Referencia al detector de poses de MediaPipe.
  const poseLandmarkerRef =
    useRef<PoseLandmarker | null>(null);

  // Guarda el identificador de requestAnimationFrame.
  const animationFrameRef =
    useRef<number | null>(null);


  // --------------------------------------------------
  // ESTADO INTERNO DEL CURL
  // --------------------------------------------------

  // Guarda la fase real del movimiento.
  //
  // "abajo":
  // el brazo está en la parte inferior
  // y queremos que empiece a flexionar.
  //
  // "arriba":
  // ya ha completado la flexión
  // y queremos que vuelva a bajar.
  const faseRef =
    useRef<"abajo" | "arriba">("abajo");


  // Guarda internamente el número
  // de repeticiones realizadas.
  const repeticionesRef =
    useRef<number>(0);


  // Guarda hasta qué momento deben
  // mostrarse los landmarks en verde.
  const verdeHastaRef =
    useRef<number>(0);


  // Guarda cuándo actualizamos por última vez
  // los datos visibles de la interfaz.
  const ultimaActualizacionUIRef =
    useRef<number>(0);


  // Guarda internamente el último mensaje
  // de feedback mostrado.
  //
  // Así evitamos actualizar React si
  // el mensaje sigue siendo el mismo.
  const feedbackRef =
    useRef<string>(
      "Colócate frente a la cámara"
    );


  // --------------------------------------------------
  // ESTADOS VISIBLES DE REACT
  // --------------------------------------------------

  // Número de repeticiones.
  const [repeticiones, setRepeticiones] =
    useState<number>(0);


  // Ángulo actual del codo.
  const [anguloActual, setAnguloActual] =
    useState<number>(0);


  // Fase actual mostrada al usuario.
  const [faseActual, setFaseActual] =
    useState<"abajo" | "arriba">("abajo");


  // Mensaje de feedback.
  const [feedback, setFeedback] =
    useState<string>(
      "Colócate frente a la cámara"
    );


  // --------------------------------------------------
  // INICIALIZACIÓN
  // --------------------------------------------------

  useEffect(function () {
    // Aquí guardaremos el stream
    // real de la webcam.
    let stream: MediaStream | null =
      null;


    // Indica si el componente
    // sigue montado.
    let componenteActivo =
      true;


    // Inicia la cámara y MediaPipe.
    async function iniciarSistema() {
      try {
        // ----------------------------------------------
        // CÁMARA
        // ----------------------------------------------

        // Solicitamos acceso a la webcam.
        const nuevoStream =
          await navigator.mediaDevices.getUserMedia({
            // Queremos vídeo.
            video: true,

            // No necesitamos audio.
            audio: false
          });


        // Si el componente desapareció
        // mientras esperábamos el permiso,
        // detenemos inmediatamente la cámara.
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


        // Conectamos el stream
        // con el elemento <video>.
        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;
        }


        // ----------------------------------------------
        // MEDIAPIPE
        // ----------------------------------------------

        console.log(
          "Cargando MediaPipe..."
        );


        // Creamos nuestro detector de poses.
        const poseLandmarker =
          await crearPoseLandmarker();


        // Si el componente desapareció
        // mientras MediaPipe cargaba,
        // dejamos de continuar.
        if (!componenteActivo) {
          return;
        }


        // Guardamos MediaPipe.
        poseLandmarkerRef.current =
          poseLandmarker;


        console.log(
          "MediaPipe cargado"
        );


        // Si el vídeo ya está preparado,
        // empezamos directamente el análisis.
        if (
          videoRef.current &&
          videoRef.current.readyState >= 2
        ) {
          iniciarAnalisis();
        }

      } catch (error) {
        // Mostramos cualquier error
        // relacionado con cámara o MediaPipe.
        console.error(
          "Error al iniciar cámara o MediaPipe:",
          error
        );
      }
    }


    // Iniciamos el sistema.
    iniciarSistema();


    // --------------------------------------------------
    // LIMPIEZA
    // --------------------------------------------------

    // Esta función se ejecuta cuando
    // CameraPreview desaparece.
    return function detenerSistema() {
      // Indicamos que el componente
      // ya no está activo.
      componenteActivo =
        false;


      // Detenemos el bucle de análisis.
      if (
        animationFrameRef.current !== null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }


      // Apagamos físicamente la cámara.
      if (stream) {
        stream
          .getTracks()
          .forEach(function (track) {
            track.stop();
          });
      }


      // Desconectamos el stream
      // del elemento <video>.
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
  // CONVERSIÓN DE COORDENADAS
  // --------------------------------------------------

  // MediaPipe utiliza coordenadas normalizadas
  // aproximadamente entre 0 y 1.
  //
  // Canvas trabaja con píxeles.
  //
  // Esta función realiza la conversión.
  function convertirAPixeles(
    punto: Punto,
    canvas: HTMLCanvasElement
  ): Punto {
    return {
      // Convertimos X a píxeles.
      x:
        punto.x *
        canvas.width,

      // Convertimos Y a píxeles.
      y:
        punto.y *
        canvas.height,

      // Conservamos la visibilidad.
      visibility:
        punto.visibility
    };
  }


  // --------------------------------------------------
  // VALIDACIÓN DE LANDMARKS
  // --------------------------------------------------

  // Comprueba que MediaPipe tenga
  // suficiente confianza en el punto.
  function esLandmarkValido(
    punto: Punto
  ): boolean {
    // Si visibility no existe,
    // aceptamos el punto.
    if (
      punto.visibility === undefined
    ) {
      return true;
    }


    // Exigimos una visibilidad mínima
    // del 70 %.
    return (
      punto.visibility >= 0.7
    );
  }


  // --------------------------------------------------
  // CÁLCULO DEL ÁNGULO
  // --------------------------------------------------

  // Calcula el ángulo formado por:
  //
  // hombro -> codo -> muñeca
  //
  // El codo es el vértice.
  function calcularAngulo(
    a: Punto,
    b: Punto,
    c: Punto
  ): number {
    // Dirección desde el codo
    // hacia el hombro.
    const angulo1 =
      Math.atan2(
        a.y - b.y,
        a.x - b.x
      );


    // Dirección desde el codo
    // hacia la muñeca.
    const angulo2 =
      Math.atan2(
        c.y - b.y,
        c.x - b.x
      );


    // Calculamos la diferencia
    // entre las dos direcciones.
    let angulo =
      Math.abs(
        angulo2 - angulo1
      );


    // Convertimos radianes a grados.
    angulo =
      angulo *
      (180 / Math.PI);


    // Queremos siempre un ángulo
    // entre 0 y 180 grados.
    if (angulo > 180) {
      angulo =
        360 - angulo;
    }


    return angulo;
  }


  // --------------------------------------------------
  // FEEDBACK VERDE
  // --------------------------------------------------

  // Activa el color verde durante
  // 300 milisegundos = 0,3 segundos.
  function activarFeedbackVerde() {
    verdeHastaRef.current =
      performance.now() + 300;
  }


  // --------------------------------------------------
  // CAMBIAR MENSAJE DE FEEDBACK
  // --------------------------------------------------

  // Cambia el mensaje únicamente
  // si realmente es diferente al anterior.
  function cambiarFeedback(
    nuevoFeedback: string
  ) {
    // Si ya mostramos este mensaje,
    // no necesitamos actualizar React.
    if (
      feedbackRef.current ===
      nuevoFeedback
    ) {
      return;
    }


    // Guardamos el mensaje internamente.
    feedbackRef.current =
      nuevoFeedback;


    // Actualizamos la interfaz.
    setFeedback(
      nuevoFeedback
    );
  }


  // --------------------------------------------------
  // FEEDBACK DEL MOVIMIENTO
  // --------------------------------------------------

  // Genera mensajes diferentes
  // dependiendo de la fase actual.
  //
  // FASE ABAJO:
  //
  // 160° o más -> Brazo extendido
  // 90°-159°   -> Sigue flexionando
  // 51°-89°    -> Casi, flexiona un poco más
  // 50° o menos -> Flexión completa
  //
  //
  // FASE ARRIBA:
  //
  // 50° o menos -> Sigue bajando
  // 51°-159°    -> Casi estás abajo
  // 160° o más  -> Brazo extendido
  function actualizarFeedback(
    anguloCodo: number
  ) {
    // ----------------------------------------------
    // FASE ABAJO
    // ----------------------------------------------

    // Estamos abajo y queremos
    // que el usuario flexione el brazo.
    if (
      faseRef.current === "abajo"
    ) {
      // 160 grados o más:
      // posición inicial correctamente extendida.
      if (anguloCodo >= 160) {
        cambiarFeedback(
          "Brazo extendido"
        );

        return;
      }


      // Entre 90 y menos de 160 grados:
      // todavía queda recorrido.
      if (anguloCodo >= 90) {
        cambiarFeedback(
          "Sigue flexionando"
        );

        return;
      }


      // Entre más de 50 y menos de 90 grados:
      // está cerca de completar la subida.
      if (anguloCodo > 50) {
        cambiarFeedback(
          "Casi, flexiona un poco más"
        );

        return;
      }


      // 50 grados o menos:
      // ha completado la flexión.
      cambiarFeedback(
        "Flexión completa"
      );

      return;
    }


    // ----------------------------------------------
    // FASE ARRIBA
    // ----------------------------------------------

    // Ya hemos completado la subida.
    // Ahora queremos que el usuario baje.

    // Hasta 50 grados sigue prácticamente
    // en la posición superior.
    if (anguloCodo <= 50) {
      cambiarFeedback(
        "Sigue bajando"
      );

      return;
    }


    // Entre más de 50 y menos de 160 grados,
    // está realizando la bajada.
    if (anguloCodo < 160) {
      cambiarFeedback(
        "Casi estás abajo"
      );

      return;
    }


    // 160 grados o más:
    // ha completado la bajada.
    cambiarFeedback(
      "Brazo extendido"
    );
  }


  // --------------------------------------------------
  // CONTEO DEL CURL
  // --------------------------------------------------

  // Detecta las dos posiciones extremas
  // del movimiento y cuenta las repeticiones.
  function actualizarCurl(
    anguloCodo: number
  ) {
    // ----------------------------------------------
    // BRAZO EXTENDIDO
    // ----------------------------------------------

    // 160 grados o más significa
    // que hemos llegado abajo.
    if (anguloCodo >= 160) {
      // Solo existe un cambio real
      // si veníamos de arriba.
      if (
        faseRef.current === "arriba"
      ) {
        // Feedback visual verde.
        activarFeedbackVerde();


        // Actualizamos la fase visible.
        setFaseActual(
          "abajo"
        );


        console.log(
          "Cambio de fase: abajo"
        );
      }


      // Dejamos preparada
      // la siguiente repetición.
      faseRef.current =
        "abajo";
    }


    // ----------------------------------------------
    // BRAZO FLEXIONADO
    // ----------------------------------------------

    // 50 grados o menos significa
    // que hemos completado la subida.
    //
    // Solo contamos si anteriormente
    // estábamos abajo.
    if (
      anguloCodo <= 50 &&
      faseRef.current === "abajo"
    ) {
      // Cambiamos la fase interna.
      faseRef.current =
        "arriba";


      // Actualizamos la fase visible.
      setFaseActual(
        "arriba"
      );


      // Activamos el verde
      // durante 0,3 segundos.
      activarFeedbackVerde();


      // Sumamos exactamente
      // una repetición.
      repeticionesRef.current =
        repeticionesRef.current + 1;


      // Actualizamos el contador visible.
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

  // Dibuja uno de los puntos
  // del brazo.
  function dibujarLandmark(
    contexto: CanvasRenderingContext2D,
    punto: Punto,
    verdeActivo: boolean
  ) {
    // Iniciamos un nuevo trazado.
    contexto.beginPath();


    // Dibujamos el círculo.
    contexto.arc(
      punto.x,
      punto.y,

      // Radio.
      8,

      // Inicio.
      0,

      // Círculo completo.
      Math.PI * 2
    );


    // Verde durante el feedback.
    if (verdeActivo) {
      contexto.fillStyle =
        "limegreen";
    } else {
      // Color normal.
      contexto.fillStyle =
        "red";
    }


    // Dibujamos el punto.
    contexto.fill();
  }


  // --------------------------------------------------
  // DIBUJAR CONEXIÓN
  // --------------------------------------------------

  // Dibuja una línea
  // entre dos landmarks.
  function dibujarConexion(
    contexto: CanvasRenderingContext2D,
    inicio: Punto,
    fin: Punto,
    verdeActivo: boolean
  ) {
    // Nuevo trazado.
    contexto.beginPath();


    // Punto inicial.
    contexto.moveTo(
      inicio.x,
      inicio.y
    );


    // Punto final.
    contexto.lineTo(
      fin.x,
      fin.y
    );


    // Grosor de la línea.
    contexto.lineWidth =
      4;


    // Verde durante el feedback.
    if (verdeActivo) {
      contexto.strokeStyle =
        "limegreen";
    } else {
      // Color normal.
      contexto.strokeStyle =
        "blue";
    }


    // Dibujamos la línea.
    contexto.stroke();
  }


  // --------------------------------------------------
  // DIBUJAR BRAZO
  // --------------------------------------------------

  // Dibuja:
  //
  // hombro -> codo -> muñeca
  function dibujarBrazo(
    contexto: CanvasRenderingContext2D,
    hombro: Punto,
    codo: Punto,
    muneca: Punto
  ) {
    // Comprobamos si todavía estamos
    // dentro de los 300 ms de feedback.
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


    // Hombro.
    dibujarLandmark(
      contexto,
      hombro,
      verdeActivo
    );


    // Codo.
    dibujarLandmark(
      contexto,
      codo,
      verdeActivo
    );


    // Muñeca.
    dibujarLandmark(
      contexto,
      muneca,
      verdeActivo
    );
  }


  // --------------------------------------------------
  // ANALIZAR CADA FRAME
  // --------------------------------------------------

  function analizarFrame(
    timestamp: number
  ) {
    // Comprobamos que todos los elementos
    // necesarios estén disponibles.
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !poseLandmarkerRef.current
    ) {
      // Lo volvemos a intentar
      // en el siguiente frame.
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrame
        );

      return;
    }


    // Guardamos referencias más cómodas.
    const video =
      videoRef.current;

    const canvas =
      canvasRef.current;

    const poseLandmarker =
      poseLandmarkerRef.current;


    // Esperamos hasta que el vídeo
    // tenga suficientes datos.
    if (video.readyState < 2) {
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrame
        );

      return;
    }


    // Adaptamos el canvas
    // a la resolución real de la cámara.
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


    // Obtenemos el contexto 2D.
    const contexto =
      canvas.getContext("2d");


    // Si no existe,
    // no podemos dibujar.
    if (!contexto) {
      return;
    }


    // Borramos lo dibujado
    // en el frame anterior.
    contexto.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    try {
      // ----------------------------------------------
      // MEDIAPIPE
      // ----------------------------------------------

      // Analizamos el frame actual.
      const resultado =
        poseLandmarker.detectForVideo(
          video,
          timestamp
        );


      // Comprobamos que se haya
      // detectado una persona.
      if (
        resultado.landmarks.length > 0
      ) {
        // Landmarks de la primera persona.
        const landmarks =
          resultado.landmarks[0];


        // ------------------------------------------
        // BRAZO DERECHO
        // ------------------------------------------

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
          // Comprobamos que los tres puntos
          // tengan suficiente visibilidad.
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
            // CONVERSIÓN A PÍXELES
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
            // CÁLCULO DEL ÁNGULO
            // --------------------------------------

            const anguloCodo =
              calcularAngulo(
                hombro,
                codo,
                muneca
              );


            // --------------------------------------
            // ACTUALIZAMOS LA INTERFAZ
            // --------------------------------------

            // Actualizamos aproximadamente
            // cada 100 milisegundos.
            //
            // Así no obligamos a React
            // a renderizar en cada frame.
            if (
              timestamp -
                ultimaActualizacionUIRef.current >=
              100
            ) {
              // Mostramos el ángulo
              // redondeado sin decimales.
              setAnguloActual(
                Math.round(
                  anguloCodo
                )
              );


              // Generamos el feedback
              // correspondiente a la fase actual.
              actualizarFeedback(
                anguloCodo
              );


              // Guardamos el momento
              // de esta actualización.
              ultimaActualizacionUIRef.current =
                timestamp;
            }


            // --------------------------------------
            // CONTEO DEL CURL
            // --------------------------------------

            // Comprobamos si hemos llegado
            // a alguno de los extremos.
            actualizarCurl(
              anguloCodo
            );


            // --------------------------------------
            // DIBUJAMOS EL BRAZO
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
      // Mostramos cualquier problema
      // sin detener completamente la aplicación.
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
    // Si MediaPipe todavía
    // no está preparado,
    // no podemos empezar.
    if (
      !poseLandmarkerRef.current
    ) {
      return;
    }


    // Evitamos tener dos bucles
    // de análisis simultáneamente.
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
    // Mostramos la resolución
    // real de la webcam.
    if (videoRef.current) {
      console.log(
        "Resolución:",
        videoRef.current.videoWidth,
        videoRef.current.videoHeight
      );
    }


    // Intentamos iniciar el análisis.
    iniciarAnalisis();
  }


  // --------------------------------------------------
  // INTERFAZ
  // --------------------------------------------------

  return (
    <div>

      {/* Información en tiempo real del ejercicio. */}
      <div className="exercise-data">

        {/* Número de repeticiones detectadas. */}
        <h2>
          Repeticiones: {repeticiones}
        </h2>


        {/* Ángulo actual del codo. */}
        <p>
          Ángulo del codo: {anguloActual}°
        </p>


        {/* Fase actual del movimiento. */}
        <p>
          Fase: {faseActual}
        </p>


        {/* Mensaje de ayuda generado
            a partir del movimiento. */}
        <p>
          Feedback: {feedback}
        </p>

      </div>


      {/* Contenedor de vídeo y canvas. */}
      <div className="camera-container">

        <video
          // Referencia al elemento <video>.
          ref={videoRef}

          // Reproduce automáticamente.
          autoPlay

          // Evita que en móvil
          // se abra a pantalla completa.
          playsInline

          // Cuando está preparado,
          // iniciamos el análisis.
          onLoadedData={
            videoPreparado
          }

          // Clase CSS de la cámara.
          className="camera-video"
        />


        <canvas
          // Referencia al canvas.
          ref={canvasRef}

          // Clase CSS que permite
          // colocarlo encima del vídeo.
          className="camera-canvas"
        />

      </div>

    </div>
  );
}

// Exportamos el componente.
export default CameraPreview;