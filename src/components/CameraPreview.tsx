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


// Guarda una posición relativa de referencia.
//
// La utilizaremos tanto para:
// - codo respecto al hombro;
// - hombro respecto a la cadera.
interface ReferenciaPosicion {
  dx: number;
  dy: number;

  // Distancia utilizada para normalizar
  // el desplazamiento.
  longitudReferencia: number;
}


function CameraPreview() {
  // --------------------------------------------------
  // CONFIGURACIÓN
  // --------------------------------------------------

  // Umbral del desplazamiento del codo.
  //
  // Tras nuestras pruebas:
  // - 20 % era demasiado sensible;
  // - 30 % permitía demasiado movimiento;
  // - 25 % ofrecía el mejor equilibrio.
  const desplazamientoMaximoCodo =
    0.25;


  // Umbral inicial del movimiento
  // hombro-cadera.
  //
  // Empezamos con un 15 %,
  // pero lo calibraremos mediante pruebas reales.
  const desplazamientoMaximoHombro =
    0.13;


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

  // Identificador del bucle requestAnimationFrame.
  const animationFrameRef =
    useRef<number | null>(null);


  // --------------------------------------------------
  // ESTADO INTERNO DEL CURL
  // --------------------------------------------------

  // "abajo":
  // el usuario debe comenzar a flexionar.
  //
  // "arriba":
  // el usuario debe volver a extender.
  const faseRef =
    useRef<"abajo" | "arriba">("abajo");


  // Número interno de repeticiones.
  const repeticionesRef =
    useRef<number>(0);


  // Hasta qué instante debemos dibujar
  // los landmarks en verde.
  const verdeHastaRef =
    useRef<number>(0);


  // Última actualización de la interfaz.
  const ultimaActualizacionUIRef =
    useRef<number>(0);


  // --------------------------------------------------
  // FEEDBACK DE MOVIMIENTO
  // --------------------------------------------------

  // Último mensaje de movimiento.
  const feedbackRef =
    useRef<string>(
      "Colócate frente a la cámara"
    );


  // --------------------------------------------------
  // ANÁLISIS DEL CODO
  // --------------------------------------------------

  // Posición inicial del codo
  // respecto al hombro.
  const referenciaCodoRef =
    useRef<ReferenciaPosicion | null>(null);


  // Último mensaje técnico del codo.
  const feedbackCodoRef =
    useRef<string>(
      "Extiende el brazo para calibrar el codo"
    );


  // --------------------------------------------------
  // ANÁLISIS DEL HOMBRO / TRONCO
  // --------------------------------------------------

  // Posición inicial del hombro
  // respecto a la cadera.
  const referenciaHombroRef =
    useRef<ReferenciaPosicion | null>(null);


  // Último mensaje relacionado
  // con hombro y tronco.
  const feedbackHombroRef =
    useRef<string>(
      "Extiende el brazo para calibrar el tronco"
    );


  // --------------------------------------------------
  // ESTADOS VISIBLES
  // --------------------------------------------------

  // Número de repeticiones.
  const [repeticiones, setRepeticiones] =
    useState<number>(0);


  // Ángulo actual.
  const [anguloActual, setAnguloActual] =
    useState<number>(0);


  // Fase actual.
  const [faseActual, setFaseActual] =
    useState<"abajo" | "arriba">("abajo");


  // Feedback del rango de movimiento.
  const [feedback, setFeedback] =
    useState<string>(
      "Colócate frente a la cámara"
    );


  // Feedback técnico del codo.
  const [
    feedbackCodo,
    setFeedbackCodo
  ] =
    useState<string>(
      "Extiende el brazo para calibrar el codo"
    );


  // Feedback técnico del hombro.
  const [
    feedbackHombro,
    setFeedbackHombro
  ] =
    useState<string>(
      "Extiende el brazo para calibrar el tronco"
    );


  // Porcentaje actual de desplazamiento del codo.
  const [
    desplazamientoCodo,
    setDesplazamientoCodo
  ] =
    useState<number | null>(null);


  // Porcentaje actual de desplazamiento del hombro.
  const [
    desplazamientoHombro,
    setDesplazamientoHombro
  ] =
    useState<number | null>(null);


  // --------------------------------------------------
  // INICIALIZACIÓN
  // --------------------------------------------------

  useEffect(function () {
    // Stream de la webcam.
    let stream: MediaStream | null =
      null;

    // Permite saber si el componente
    // sigue montado.
    let componenteActivo =
      true;


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


        // Si el componente ha desaparecido
        // mientras esperábamos la cámara,
        // detenemos el stream.
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
        // mientras cargaba MediaPipe,
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


        // Si el vídeo está preparado,
        // comenzamos directamente.
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


    iniciarSistema();


    // --------------------------------------------------
    // LIMPIEZA
    // --------------------------------------------------

    return function detenerSistema() {
      componenteActivo =
        false;


      // Detenemos el análisis.
      if (
        animationFrameRef.current !== null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );

        animationFrameRef.current =
          null;
      }


      // Apagamos la cámara.
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
  // CONVERTIR COORDENADAS
  // --------------------------------------------------

  // Convierte coordenadas normalizadas
  // de MediaPipe a píxeles.
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

  // Comprueba que MediaPipe tenga
  // suficiente confianza en el punto.
  function esLandmarkValido(
    punto: Punto
  ): boolean {
    if (
      punto.visibility === undefined
    ) {
      return true;
    }


    // Exigimos al menos 70 %.
    return (
      punto.visibility >= 0.7
    );
  }


  // --------------------------------------------------
  // DISTANCIA
  // --------------------------------------------------

  // Calcula la distancia entre dos puntos.
  function calcularDistancia(
    a: Punto,
    b: Punto
  ): number {
    const diferenciaX =
      a.x - b.x;

    const diferenciaY =
      a.y - b.y;


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


    // Limitamos entre 0 y 180.
    if (angulo > 180) {
      angulo =
        360 - angulo;
    }


    return angulo;
  }


  // --------------------------------------------------
  // FEEDBACK VERDE
  // --------------------------------------------------

  // Verde durante 0,3 segundos.
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

    // Sigue en la zona superior.
    if (anguloCodo <= 50) {
      cambiarFeedback(
        "Sigue bajando"
      );

      return;
    }


    // Está bajando.
    if (anguloCodo < 160) {
      cambiarFeedback(
        "Casi estás abajo"
      );

      return;
    }


    // Extensión completa.
    cambiarFeedback(
      "Brazo extendido"
    );
  }


  // --------------------------------------------------
  // FEEDBACK DEL CODO
  // --------------------------------------------------

  function cambiarFeedbackCodo(
    nuevoFeedback: string
  ) {
    if (
      feedbackCodoRef.current ===
      nuevoFeedback
    ) {
      return;
    }


    feedbackCodoRef.current =
      nuevoFeedback;


    setFeedbackCodo(
      nuevoFeedback
    );
  }


  // --------------------------------------------------
  // FEEDBACK DEL HOMBRO
  // --------------------------------------------------

  function cambiarFeedbackHombro(
    nuevoFeedback: string
  ) {
    if (
      feedbackHombroRef.current ===
      nuevoFeedback
    ) {
      return;
    }


    feedbackHombroRef.current =
      nuevoFeedback;


    setFeedbackHombro(
      nuevoFeedback
    );
  }


  // --------------------------------------------------
  // GUARDAR REFERENCIA DEL CODO
  // --------------------------------------------------

  function guardarReferenciaCodo(
    hombro: Punto,
    codo: Punto
  ) {
    // Posición del codo respecto al hombro.
    const dx =
      codo.x -
      hombro.x;

    const dy =
      codo.y -
      hombro.y;


    // Distancia hombro-codo.
    const longitudBrazo =
      calcularDistancia(
        hombro,
        codo
      );


    if (longitudBrazo <= 0) {
      return;
    }


    referenciaCodoRef.current = {
      dx:
        dx,

      dy:
        dy,

      longitudReferencia:
        longitudBrazo
    };


    console.log(
      "Referencia del codo guardada"
    );
  }


  // --------------------------------------------------
  // GUARDAR REFERENCIA DEL HOMBRO
  // --------------------------------------------------

  function guardarReferenciaHombro(
    hombro: Punto,
    cadera: Punto
  ) {
    // Posición del hombro respecto a la cadera.
    const dx =
      hombro.x -
      cadera.x;

    const dy =
      hombro.y -
      cadera.y;


    // Distancia aproximada hombro-cadera.
    //
    // La utilizaremos como medida del torso
    // para normalizar el desplazamiento.
    const longitudTorso =
      calcularDistancia(
        hombro,
        cadera
      );


    if (longitudTorso <= 0) {
      return;
    }


    referenciaHombroRef.current = {
      dx:
        dx,

      dy:
        dy,

      longitudReferencia:
        longitudTorso
    };


    console.log(
      "Referencia del hombro guardada"
    );
  }


  // --------------------------------------------------
  // ANALIZAR CODO
  // --------------------------------------------------

  function analizarTecnicaCodo(
    anguloCodo: number,
    hombro: Punto,
    codo: Punto
  ): number | null {
    // ----------------------------------------------
    // CALIBRACIÓN
    // ----------------------------------------------

    if (anguloCodo >= 160) {
      // Calibramos al comenzar
      // y al terminar cada repetición.
      if (
        referenciaCodoRef.current === null ||
        faseRef.current === "arriba"
      ) {
        guardarReferenciaCodo(
          hombro,
          codo
        );
      }


      cambiarFeedbackCodo(
        "Codo estable"
      );


      return 0;
    }


    // Sin referencia no podemos analizar.
    if (
      referenciaCodoRef.current === null
    ) {
      cambiarFeedbackCodo(
        "Extiende el brazo para calibrar el codo"
      );

      return null;
    }


    // ----------------------------------------------
    // POSICIÓN ACTUAL
    // ----------------------------------------------

    const dxActual =
      codo.x -
      hombro.x;

    const dyActual =
      codo.y -
      hombro.y;


    const referencia =
      referenciaCodoRef.current;


    const cambioX =
      dxActual -
      referencia.dx;

    const cambioY =
      dyActual -
      referencia.dy;


    const desplazamiento =
      Math.sqrt(
        cambioX * cambioX +
        cambioY * cambioY
      );


    // ----------------------------------------------
    // NORMALIZACIÓN
    // ----------------------------------------------

    const desplazamientoRelativo =
      desplazamiento /
      referencia.longitudReferencia;


    // ----------------------------------------------
    // EVALUACIÓN
    // ----------------------------------------------

    if (
      desplazamientoRelativo >
      desplazamientoMaximoCodo
    ) {
      cambiarFeedbackCodo(
        "Mantén el codo estable"
      );
    } else {
      cambiarFeedbackCodo(
        "Codo estable"
      );
    }


    return desplazamientoRelativo;
  }


  // --------------------------------------------------
  // ANALIZAR HOMBRO / TRONCO
  // --------------------------------------------------

  function analizarTecnicaHombro(
    anguloCodo: number,
    hombro: Punto,
    cadera: Punto
  ): number | null {
    // ----------------------------------------------
    // CALIBRACIÓN
    // ----------------------------------------------

    // Igual que con el codo,
    // utilizamos la posición extendida.
    if (anguloCodo >= 160) {
      if (
        referenciaHombroRef.current === null ||
        faseRef.current === "arriba"
      ) {
        guardarReferenciaHombro(
          hombro,
          cadera
        );
      }


      cambiarFeedbackHombro(
        "Tronco estable"
      );


      return 0;
    }


    // Sin referencia no podemos analizar.
    if (
      referenciaHombroRef.current === null
    ) {
      cambiarFeedbackHombro(
        "Extiende el brazo para calibrar el tronco"
      );

      return null;
    }


    // ----------------------------------------------
    // POSICIÓN ACTUAL
    // ----------------------------------------------

    // Posición actual del hombro
    // respecto a la cadera.
    const dxActual =
      hombro.x -
      cadera.x;

    const dyActual =
      hombro.y -
      cadera.y;


    const referencia =
      referenciaHombroRef.current;


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

    // Lo dividimos entre la longitud
    // hombro-cadera.
    //
    // De esta forma el valor no depende
    // directamente de los píxeles.
    const desplazamientoRelativo =
      desplazamiento /
      referencia.longitudReferencia;


    // ----------------------------------------------
    // EVALUACIÓN
    // ----------------------------------------------

    if (
      desplazamientoRelativo >
      desplazamientoMaximoHombro
    ) {
      cambiarFeedbackHombro(
        "Evita balancear el tronco"
      );
    } else {
      cambiarFeedbackHombro(
        "Tronco estable"
      );
    }


    return desplazamientoRelativo;
  }


  // --------------------------------------------------
  // CONTEO DEL CURL
  // --------------------------------------------------

  // Esta lógica no cambia.
  function actualizarCurl(
    anguloCodo: number
  ) {
    // ----------------------------------------------
    // POSICIÓN ABAJO
    // ----------------------------------------------

    if (anguloCodo >= 160) {
      if (
        faseRef.current === "arriba"
      ) {
        // Verde durante 0,3 segundos.
        activarFeedbackVerde();


        // Actualizamos la fase visible.
        setFaseActual(
          "abajo"
        );


        console.log(
          "Cambio de fase: abajo"
        );
      }


      faseRef.current =
        "abajo";
    }


    // ----------------------------------------------
    // POSICIÓN ARRIBA
    // ----------------------------------------------

    if (
      anguloCodo <= 50 &&
      faseRef.current === "abajo"
    ) {
      // Cambiamos de fase.
      faseRef.current =
        "arriba";


      // Actualizamos la interfaz.
      setFaseActual(
        "arriba"
      );


      // Feedback verde.
      activarFeedbackVerde();


      // Sumamos una repetición.
      repeticionesRef.current =
        repeticionesRef.current + 1;


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
    // Comprobamos si estamos todavía
    // dentro de los 300 ms verdes.
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
    // Necesitamos vídeo, canvas
    // y MediaPipe.
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


    // Adaptamos el canvas
    // a la resolución real.
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


    // Contexto de dibujo 2D.
    const contexto =
      canvas.getContext("2d");


    if (!contexto) {
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
      // ----------------------------------------------
      // MEDIAPIPE
      // ----------------------------------------------

      const resultado =
        poseLandmarker.detectForVideo(
          video,
          timestamp
        );


      if (
        resultado.landmarks.length > 0
      ) {
        const landmarks =
          resultado.landmarks[0];


        // ------------------------------------------
        // LANDMARKS NECESARIOS
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

        // 24 = cadera derecha.
        const caderaNormalizada =
          landmarks[24];


        // ------------------------------------------
        // ANÁLISIS PRINCIPAL DEL CURL
        // ------------------------------------------

        // Para contar repeticiones solamente
        // necesitamos hombro, codo y muñeca.
        //
        // La cadera NO bloquea el contador.
        if (
          hombroNormalizado &&
          codoNormalizado &&
          munecaNormalizada
        ) {
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
            // ÁNGULO
            // --------------------------------------

            const anguloCodo =
              calcularAngulo(
                hombro,
                codo,
                muneca
              );


            // --------------------------------------
            // TÉCNICA DEL CODO
            // --------------------------------------

            const desplazamientoRelativoCodo =
              analizarTecnicaCodo(
                anguloCodo,
                hombro,
                codo
              );


            // --------------------------------------
            // TÉCNICA DEL HOMBRO
            // --------------------------------------

            // Empezamos sin medición.
            let desplazamientoRelativoHombro:
              number | null =
              null;


            // El análisis del tronco solo se realiza
            // si MediaPipe ve correctamente la cadera.
            //
            // Si falla la cadera, el contador
            // sigue funcionando igualmente.
            if (
              caderaNormalizada &&
              esLandmarkValido(
                caderaNormalizada
              )
            ) {
              const cadera =
                convertirAPixeles(
                  caderaNormalizada,
                  canvas
                );


              desplazamientoRelativoHombro =
                analizarTecnicaHombro(
                  anguloCodo,
                  hombro,
                  cadera
                );
            } else {
              // No podemos analizar el tronco
              // si la cadera no está visible.
              cambiarFeedbackHombro(
                "Asegúrate de que la cadera sea visible"
              );
            }


            // --------------------------------------
            // ACTUALIZAMOS LA INTERFAZ
            // --------------------------------------

            // Aproximadamente cada 100 ms.
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


              // Feedback del movimiento.
              actualizarFeedback(
                anguloCodo
              );


              // ----------------------------------
              // PORCENTAJE DEL CODO
              // ----------------------------------

              if (
                desplazamientoRelativoCodo !==
                null
              ) {
                setDesplazamientoCodo(
                  Math.round(
                    desplazamientoRelativoCodo *
                    100
                  )
                );
              } else {
                setDesplazamientoCodo(
                  null
                );
              }


              // ----------------------------------
              // PORCENTAJE DEL HOMBRO
              // ----------------------------------

              if (
                desplazamientoRelativoHombro !==
                null
              ) {
                setDesplazamientoHombro(
                  Math.round(
                    desplazamientoRelativoHombro *
                    100
                  )
                );
              } else {
                setDesplazamientoHombro(
                  null
                );
              }


              ultimaActualizacionUIRef.current =
                timestamp;
            }


            // --------------------------------------
            // CONTEO
            // --------------------------------------

            // No modificamos la lógica
            // de repeticiones.
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


    // Siguiente frame.
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


    // Evitamos dos bucles simultáneos.
    if (
      animationFrameRef.current !== null
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
          MOVIMIENTO
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
          TÉCNICA DEL CURL
          ---------------------------------------------- */}
      <div>

        <h3>
          Técnica del curl
        </h3>


        {/* ------------------------------------------
            CODO
            ------------------------------------------ */}

        <p>
          <strong>
            Codo:
          </strong>{" "}
          {feedbackCodo}
        </p>


        <p>
          <strong>
            Desplazamiento del codo:
          </strong>{" "}

          {desplazamientoCodo === null
            ? "--"
            : desplazamientoCodo + " %"}
        </p>


        <p>
          <strong>
            Límite del codo:
          </strong>{" "}
          {Math.round(
            desplazamientoMaximoCodo *
            100
          )} %
        </p>


        {/* ------------------------------------------
            TRONCO / HOMBRO
            ------------------------------------------ */}

        <p>
          <strong>
            Tronco:
          </strong>{" "}
          {feedbackHombro}
        </p>


        <p>
          <strong>
            Desplazamiento del hombro:
          </strong>{" "}

          {desplazamientoHombro === null
            ? "--"
            : desplazamientoHombro + " %"}
        </p>


        <p>
          <strong>
            Límite del hombro:
          </strong>{" "}
          {Math.round(
            desplazamientoMaximoHombro *
            100
          )} %
        </p>

      </div>


      {/* ----------------------------------------------
          CÁMARA + CANVAS
          ---------------------------------------------- */}
      <div className="camera-container">

        <video
          ref={videoRef}
          autoPlay
          playsInline
          onLoadedData={
            videoPreparado
          }
          className="camera-video"
        />


        <canvas
          ref={canvasRef}
          className="camera-canvas"
        />

      </div>

    </div>
  );
}


// Exportamos el componente.
export default CameraPreview;