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
// Se utiliza para comparar:
// - codo respecto al hombro;
// - hombro respecto a la cadera.
interface ReferenciaPosicion {
  dx: number;
  dy: number;

  // Distancia utilizada para normalizar
  // el desplazamiento.
  longitudReferencia: number;
}


// Representa el resultado técnico
// de una repetición terminada.
interface ResultadoRepeticion {
  // Número de repetición.
  numero: number;

  // Indica si hubo error de codo.
  errorCodo: boolean;

  // Indica si hubo balanceo del tronco.
  errorTronco: boolean;

  // Resultado mostrado en pantalla.
  resultado: string;
}


// Representa el resumen completo
// de una sesión.
interface ResumenSesion {
  // Número de repeticiones totalmente analizadas.
  total: number;

  // Número de repeticiones sin errores.
  correctas: number;

  // Porcentaje de repeticiones correctas.
  porcentajeCorrectas: number;

  // Número de repeticiones
  // donde apareció error de codo.
  erroresCodo: number;

  // Número de repeticiones
  // donde apareció balanceo del tronco.
  erroresTronco: number;

  // Error que aparece más veces.
  errorMasFrecuente: string;
}


function CameraPreview() {
  // --------------------------------------------------
  // CONFIGURACIÓN
  // --------------------------------------------------

  // Umbral del desplazamiento del codo.
  //
  // Después de nuestras pruebas:
  // 20 % era demasiado sensible.
  // 30 % permitía demasiado movimiento.
  // 25 % ofreció el mejor equilibrio.
  const desplazamientoMaximoCodo =
    0.25;


  // Umbral del balanceo del tronco.
  //
  // Después de nuestras pruebas:
  // 10 % era demasiado sensible.
  // 15 % permitía demasiado movimiento.
  // 13 % ofreció el mejor equilibrio.
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

  // Identificador del bucle de análisis.
  const animationFrameRef =
    useRef<number | null>(null);


  // --------------------------------------------------
  // ESTADO INTERNO DEL CURL
  // --------------------------------------------------

  // "abajo":
  // debemos flexionar el brazo.
  //
  // "arriba":
  // debemos volver a extenderlo.
  const faseRef =
    useRef<"abajo" | "arriba">("abajo");


  // Número interno de repeticiones.
  const repeticionesRef =
    useRef<number>(0);


  // Hasta qué instante deben aparecer
  // puntos y conexiones en verde.
  const verdeHastaRef =
    useRef<number>(0);


  // Última actualización visual.
  const ultimaActualizacionUIRef =
    useRef<number>(0);


  // --------------------------------------------------
  // ERRORES DE LA REPETICIÓN ACTUAL
  // --------------------------------------------------

  // Se vuelve true si durante cualquier instante
  // de la repetición aparece un error de codo.
  const errorCodoRepeticionRef =
    useRef<boolean>(false);


  // Se vuelve true si aparece
  // balanceo del tronco.
  const errorTroncoRepeticionRef =
    useRef<boolean>(false);


  // --------------------------------------------------
  // FEEDBACK DE MOVIMIENTO
  // --------------------------------------------------

  const feedbackRef =
    useRef<string>(
      "Colócate frente a la cámara"
    );


  // --------------------------------------------------
  // ANÁLISIS DEL CODO
  // --------------------------------------------------

  const referenciaCodoRef =
    useRef<ReferenciaPosicion | null>(null);


  const feedbackCodoRef =
    useRef<string>(
      "Extiende el brazo para calibrar el codo"
    );


  // --------------------------------------------------
  // ANÁLISIS DEL TRONCO
  // --------------------------------------------------

  const referenciaHombroRef =
    useRef<ReferenciaPosicion | null>(null);


  const feedbackHombroRef =
    useRef<string>(
      "Extiende el brazo para calibrar el tronco"
    );


  // --------------------------------------------------
  // ESTADOS VISIBLES
  // --------------------------------------------------

  const [repeticiones, setRepeticiones] =
    useState<number>(0);


  const [anguloActual, setAnguloActual] =
    useState<number>(0);


  const [faseActual, setFaseActual] =
    useState<"abajo" | "arriba">("abajo");


  const [feedback, setFeedback] =
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
    useState<number | null>(null);


  const [
    desplazamientoHombro,
    setDesplazamientoHombro
  ] =
    useState<number | null>(null);


  // Historial de repeticiones completadas.
  const [
    historial,
    setHistorial
  ] =
    useState<ResultadoRepeticion[]>([]);


  // --------------------------------------------------
  // CALCULAR RESUMEN DE SESIÓN
  // --------------------------------------------------

  // Recibe el historial completo
  // y obtiene las estadísticas de la sesión.
  function calcularResumenSesion(
    repeticionesSesion: ResultadoRepeticion[]
  ): ResumenSesion {
    // Número total de repeticiones
    // que han completado subida y bajada.
    const total =
      repeticionesSesion.length;


    // ----------------------------------------------
    // REPETICIONES CORRECTAS
    // ----------------------------------------------

    // Una repetición es correcta solamente
    // cuando no tiene ninguno de los dos errores.
    const correctas =
      repeticionesSesion.filter(
        function (repeticion) {
          return (
            !repeticion.errorCodo &&
            !repeticion.errorTronco
          );
        }
      ).length;


    // ----------------------------------------------
    // ERRORES DE CODO
    // ----------------------------------------------

    // Contamos todas las repeticiones
    // en las que apareció error de codo.
    const erroresCodo =
      repeticionesSesion.filter(
        function (repeticion) {
          return repeticion.errorCodo;
        }
      ).length;


    // ----------------------------------------------
    // ERRORES DE TRONCO
    // ----------------------------------------------

    // Contamos todas las repeticiones
    // donde apareció balanceo.
    const erroresTronco =
      repeticionesSesion.filter(
        function (repeticion) {
          return repeticion.errorTronco;
        }
      ).length;


    // ----------------------------------------------
    // PORCENTAJE CORRECTO
    // ----------------------------------------------

    // Evitamos dividir entre cero
    // cuando todavía no hay repeticiones.
    let porcentajeCorrectas =
      0;


    if (total > 0) {
      porcentajeCorrectas =
        Math.round(
          (correctas / total) *
          100
        );
    }


    // ----------------------------------------------
    // ERROR MÁS FRECUENTE
    // ----------------------------------------------

    // Por defecto no existe ningún error.
    let errorMasFrecuente =
      "Ninguno";


    // Hay más errores de codo.
    if (
      erroresCodo >
      erroresTronco
    ) {
      errorMasFrecuente =
        "Desplazamiento del codo";
    }


    // Hay más balanceos de tronco.
    if (
      erroresTronco >
      erroresCodo
    ) {
      errorMasFrecuente =
        "Balanceo del tronco";
    }


    // Si ambos aparecen el mismo número
    // de veces y existe al menos uno,
    // indicamos que están empatados.
    if (
      erroresCodo ===
        erroresTronco &&
      erroresCodo > 0
    ) {
      errorMasFrecuente =
        "Codo y tronco por igual";
    }


    // Devolvemos todas las estadísticas.
    return {
      total:
        total,

      correctas:
        correctas,

      porcentajeCorrectas:
        porcentajeCorrectas,

      erroresCodo:
        erroresCodo,

      erroresTronco:
        erroresTronco,

      errorMasFrecuente:
        errorMasFrecuente
    };
  }


  // Calculamos el resumen utilizando
  // el historial actual.
  //
  // Cada vez que historial cambia,
  // React vuelve a ejecutar el componente
  // y este resumen se actualiza automáticamente.
  const resumenSesion =
    calcularResumenSesion(
      historial
    );


  // --------------------------------------------------
  // INICIALIZACIÓN
  // --------------------------------------------------

  useEffect(function () {
    // Stream real de la webcam.
    let stream: MediaStream | null =
      null;

    // Indica si el componente
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
            video: true,
            audio: false
          });


        if (!componenteActivo) {
          nuevoStream
            .getTracks()
            .forEach(function (track) {
              track.stop();
            });

          return;
        }


        stream =
          nuevoStream;


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


        if (!componenteActivo) {
          return;
        }


        poseLandmarkerRef.current =
          poseLandmarker;


        console.log(
          "MediaPipe cargado"
        );


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


      if (
        animationFrameRef.current !== null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );

        animationFrameRef.current =
          null;
      }


      if (stream) {
        stream
          .getTracks()
          .forEach(function (track) {
            track.stop();
          });
      }


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

  function esLandmarkValido(
    punto: Punto
  ): boolean {
    if (
      punto.visibility === undefined
    ) {
      return true;
    }


    // Visibilidad mínima del 70 %.
    return (
      punto.visibility >= 0.7
    );
  }


  // --------------------------------------------------
  // DISTANCIA
  // --------------------------------------------------

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
  // ÁNGULO
  // --------------------------------------------------

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


    angulo =
      angulo *
      (180 / Math.PI);


    if (angulo > 180) {
      angulo =
        360 - angulo;
    }


    return angulo;
  }


  // --------------------------------------------------
  // FEEDBACK VERDE
  // --------------------------------------------------

  function activarFeedbackVerde() {
    verdeHastaRef.current =
      performance.now() + 300;
  }


  // --------------------------------------------------
  // FEEDBACK DE MOVIMIENTO
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
      if (anguloCodo >= 160) {
        cambiarFeedback(
          "Brazo extendido"
        );

        return;
      }


      if (anguloCodo >= 90) {
        cambiarFeedback(
          "Sigue flexionando"
        );

        return;
      }


      if (anguloCodo > 50) {
        cambiarFeedback(
          "Casi, flexiona un poco más"
        );

        return;
      }


      cambiarFeedback(
        "Flexión completa"
      );

      return;
    }


    // ----------------------------------------------
    // BAJADA
    // ----------------------------------------------

    if (anguloCodo <= 50) {
      cambiarFeedback(
        "Sigue bajando"
      );

      return;
    }


    if (anguloCodo < 160) {
      cambiarFeedback(
        "Casi estás abajo"
      );

      return;
    }


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
  // FEEDBACK DEL TRONCO
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
    const dx =
      codo.x -
      hombro.x;

    const dy =
      codo.y -
      hombro.y;


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
  }


  // --------------------------------------------------
  // GUARDAR REFERENCIA DEL TRONCO
  // --------------------------------------------------

  function guardarReferenciaHombro(
    hombro: Punto,
    cadera: Punto
  ) {
    const dx =
      hombro.x -
      cadera.x;

    const dy =
      hombro.y -
      cadera.y;


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
  }


  // --------------------------------------------------
  // ANALIZAR CODO
  // --------------------------------------------------

  function analizarTecnicaCodo(
    anguloCodo: number,
    hombro: Punto,
    codo: Punto
  ): number | null {
    // Calibramos con el brazo extendido.
    if (anguloCodo >= 160) {
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


    if (
      referenciaCodoRef.current === null
    ) {
      cambiarFeedbackCodo(
        "Extiende el brazo para calibrar el codo"
      );

      return null;
    }


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


    const desplazamientoRelativo =
      desplazamiento /
      referencia.longitudReferencia;


    if (
      desplazamientoRelativo >
      desplazamientoMaximoCodo
    ) {
      cambiarFeedbackCodo(
        "Mantén el codo estable"
      );


      // Guardamos el error durante
      // toda la repetición.
      errorCodoRepeticionRef.current =
        true;

    } else {
      cambiarFeedbackCodo(
        "Codo estable"
      );
    }


    return desplazamientoRelativo;
  }


  // --------------------------------------------------
  // ANALIZAR TRONCO
  // --------------------------------------------------

  function analizarTecnicaHombro(
    anguloCodo: number,
    hombro: Punto,
    cadera: Punto
  ): number | null {
    // Calibramos con el brazo extendido.
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


    if (
      referenciaHombroRef.current === null
    ) {
      cambiarFeedbackHombro(
        "Extiende el brazo para calibrar el tronco"
      );

      return null;
    }


    const dxActual =
      hombro.x -
      cadera.x;

    const dyActual =
      hombro.y -
      cadera.y;


    const referencia =
      referenciaHombroRef.current;


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


    const desplazamientoRelativo =
      desplazamiento /
      referencia.longitudReferencia;


    if (
      desplazamientoRelativo >
      desplazamientoMaximoHombro
    ) {
      cambiarFeedbackHombro(
        "Evita balancear el tronco"
      );


      // Guardamos el error durante
      // toda la repetición.
      errorTroncoRepeticionRef.current =
        true;

    } else {
      cambiarFeedbackHombro(
        "Tronco estable"
      );
    }


    return desplazamientoRelativo;
  }


  // --------------------------------------------------
  // GUARDAR RESULTADO DE REPETICIÓN
  // --------------------------------------------------

  function guardarResultadoRepeticion() {
    const huboErrorCodo =
      errorCodoRepeticionRef.current;


    const huboErrorTronco =
      errorTroncoRepeticionRef.current;


    // Por defecto consideramos
    // la repetición correcta.
    let resultado =
      "Correcta";


    if (
      huboErrorCodo &&
      huboErrorTronco
    ) {
      resultado =
        "Error de codo + balanceo de tronco";
    }

    else if (huboErrorCodo) {
      resultado =
        "Error de codo";
    }

    else if (huboErrorTronco) {
      resultado =
        "Balanceo de tronco";
    }


    const nuevaRepeticion:
      ResultadoRepeticion = {
        numero:
          repeticionesRef.current,

        errorCodo:
          huboErrorCodo,

        errorTronco:
          huboErrorTronco,

        resultado:
          resultado
      };


    // Añadimos el resultado
    // al historial de la sesión.
    setHistorial(
      function (historialAnterior) {
        return [
          ...historialAnterior,
          nuevaRepeticion
        ];
      }
    );


    // Limpiamos los errores para
    // comenzar la siguiente repetición.
    errorCodoRepeticionRef.current =
      false;

    errorTroncoRepeticionRef.current =
      false;
  }


  // --------------------------------------------------
  // CONTEO DEL CURL
  // --------------------------------------------------

  function actualizarCurl(
    anguloCodo: number
  ) {
    // ----------------------------------------------
    // VUELTA ABAJO
    // ----------------------------------------------

    if (anguloCodo >= 160) {
      if (
        faseRef.current === "arriba"
      ) {
        // Al volver abajo tenemos
        // una repetición completamente analizada.
        guardarResultadoRepeticion();


        activarFeedbackVerde();


        setFaseActual(
          "abajo"
        );
      }


      faseRef.current =
        "abajo";
    }


    // ----------------------------------------------
    // LLEGADA ARRIBA
    // ----------------------------------------------

    if (
      anguloCodo <= 50 &&
      faseRef.current === "abajo"
    ) {
      faseRef.current =
        "arriba";


      setFaseActual(
        "arriba"
      );


      activarFeedbackVerde();


      repeticionesRef.current =
        repeticionesRef.current + 1;


      setRepeticiones(
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
    const verdeActivo =
      performance.now() <
      verdeHastaRef.current;


    dibujarConexion(
      contexto,
      hombro,
      codo,
      verdeActivo
    );


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


    if (video.readyState < 2) {
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrame
        );

      return;
    }


    // Igualamos la resolución
    // del canvas y la cámara.
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
      // Analizamos la imagen actual.
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
            // Convertimos a píxeles.
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


            // Calculamos el ángulo.
            const anguloCodo =
              calcularAngulo(
                hombro,
                codo,
                muneca
              );


            // --------------------------------------
            // ANÁLISIS DEL CODO
            // --------------------------------------

            const desplazamientoRelativoCodo =
              analizarTecnicaCodo(
                anguloCodo,
                hombro,
                codo
              );


            // --------------------------------------
            // ANÁLISIS DEL TRONCO
            // --------------------------------------

            let desplazamientoRelativoHombro:
              number | null =
              null;


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
              cambiarFeedbackHombro(
                "Asegúrate de que la cadera sea visible"
              );
            }


            // --------------------------------------
            // ACTUALIZACIÓN DE INTERFAZ
            // --------------------------------------

            if (
              timestamp -
                ultimaActualizacionUIRef.current >=
              100
            ) {
              setAnguloActual(
                Math.round(
                  anguloCodo
                )
              );


              actualizarFeedback(
                anguloCodo
              );


              // Porcentaje del codo.
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


              // Porcentaje del tronco.
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


            // Conteo y clasificación.
            actualizarCurl(
              anguloCodo
            );


            // Dibujamos el brazo.
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
    <div className="vision-fit-layout">

      {/* ----------------------------------------------
          IZQUIERDA: CÁMARA
          ---------------------------------------------- */}
      <div className="vision-fit-camera-column">

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


      {/* ----------------------------------------------
          DERECHA: INFORMACIÓN
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
            TÉCNICA ACTUAL
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
            {desplazamientoCodo === null
              ? "--"
              : desplazamientoCodo + " %"}
          </p>


          <p>
            <strong>
              Límite:
            </strong>{" "}
            25 %
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
            {desplazamientoHombro === null
              ? "--"
              : desplazamientoHombro + " %"}
          </p>


          <p>
            <strong>
              Límite:
            </strong>{" "}
            13 %
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
            {resumenSesion.porcentajeCorrectas} %
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
            {resumenSesion.erroresTronco}
          </p>


          <p>
            <strong>
              Error más frecuente:
            </strong>{" "}
            {resumenSesion.errorMasFrecuente}
          </p>

        </section>


        {/* ------------------------------------------
            HISTORIAL
            ------------------------------------------ */}
        <section className="analysis-section">

          <h3>
            Historial
          </h3>


          {historial.length === 0 ? (
            <p>
              Completa una repetición para ver
              su análisis.
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
                        Rep {repeticion.numero}:
                      </strong>{" "}
                      {repeticion.resultado}
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