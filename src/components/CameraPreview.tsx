// Importamos useEffect para gestionar el ciclo de vida del componente,
// useRef para guardar valores entre frames sin provocar renderizados
// y useState para mostrar las repeticiones en la interfaz.
import {
  useEffect,
  useRef,
  useState
} from "react";

// Importamos únicamente el tipo PoseLandmarker
// para poder tipar correctamente nuestra referencia.
import type { PoseLandmarker } from "@mediapipe/tasks-vision";

// Importamos nuestra función que crea
// y configura MediaPipe Pose Landmarker.
import { crearPoseLandmarker } from "../mediapipe/pose";


// Estructura mínima que necesitamos de un landmark.
interface Punto {
  // Posición horizontal.
  x: number;

  // Posición vertical.
  y: number;

  // Confianza de MediaPipe sobre la visibilidad del punto.
  visibility?: number;
}


function CameraPreview() {
  // --------------------------------------------------
  // REFERENCIAS DE REACT
  // --------------------------------------------------

  // Referencia al elemento <video>.
  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  // Referencia al elemento <canvas>.
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  // Referencia al detector de MediaPipe.
  const poseLandmarkerRef =
    useRef<PoseLandmarker | null>(null);

  // Guarda el identificador de requestAnimationFrame
  // para poder cancelar el bucle posteriormente.
  const animationFrameRef =
    useRef<number | null>(null);


  // --------------------------------------------------
  // ESTADO DEL CURL
  // --------------------------------------------------

  // Guarda la fase actual del curl entre frames.
  //
  // "abajo" -> brazo extendido.
  // "arriba" -> brazo flexionado.
  //
  // Empezamos en "abajo", pero solo se contará
  // cuando realmente se alcance primero la zona extendida.
  const faseRef =
    useRef<"abajo" | "arriba">("abajo");

  // Guarda internamente las repeticiones detectadas.
  // useRef es útil porque analizarFrame se ejecuta
  // continuamente muchas veces por segundo.
  const repeticionesRef =
    useRef<number>(0);

  // Estado de React utilizado únicamente para
  // mostrar el contador en la interfaz.
  const [repeticiones, setRepeticiones] =
    useState<number>(0);


  // --------------------------------------------------
  // INICIALIZACIÓN DE CÁMARA Y MEDIAPIPE
  // --------------------------------------------------

  useEffect(function () {
    // Aquí guardaremos el stream de la webcam.
    let stream: MediaStream | null = null;

    // Indica si CameraPreview sigue montado.
    let componenteActivo = true;


    // Inicia la webcam y MediaPipe.
    async function iniciarSistema() {
      try {
        // ----------------------------------------------
        // CÁMARA
        // ----------------------------------------------

        // Solicitamos permiso para utilizar la webcam.
        const nuevoStream =
          await navigator.mediaDevices.getUserMedia({
            // Queremos vídeo.
            video: true,

            // No necesitamos micrófono.
            audio: false
          });


        // Si el componente desapareció mientras
        // esperábamos la cámara, detenemos el stream.
        if (!componenteActivo) {
          nuevoStream
            .getTracks()
            .forEach(function (track) {
              // Detenemos cada pista.
              track.stop();
            });

          return;
        }


        // Guardamos el stream.
        stream = nuevoStream;


        // Conectamos la webcam con el elemento <video>.
        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;
        }


        // ----------------------------------------------
        // MEDIAPIPE
        // ----------------------------------------------

        console.log("Cargando MediaPipe...");


        // Creamos el detector de poses.
        const poseLandmarker =
          await crearPoseLandmarker();


        // Si el componente ya desapareció,
        // no seguimos.
        if (!componenteActivo) {
          return;
        }


        // Guardamos el detector.
        poseLandmarkerRef.current =
          poseLandmarker;

        console.log("MediaPipe cargado");


        // Si el vídeo ya está preparado,
        // iniciamos el análisis inmediatamente.
        if (
          videoRef.current &&
          videoRef.current.readyState >= 2
        ) {
          iniciarAnalisis();
        }

      } catch (error) {
        // Mostramos cualquier problema de cámara
        // o inicialización de MediaPipe.
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

    // Se ejecuta cuando CameraPreview desaparece.
    return function detenerSistema() {
      // Indicamos que el componente ha dejado de existir.
      componenteActivo = false;


      // Cancelamos el bucle de análisis.
      if (
        animationFrameRef.current !== null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }


      // Apagamos la webcam.
      if (stream) {
        stream
          .getTracks()
          .forEach(function (track) {
            // Detenemos cada pista activa.
            track.stop();
          });
      }


      // Desconectamos el stream del vídeo.
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }


      console.log(
        "Cámara y análisis detenidos"
      );
    };
  }, []);


  // --------------------------------------------------
  // CONVERTIR COORDENADAS
  // --------------------------------------------------

  // Convierte coordenadas normalizadas de MediaPipe
  // a píxeles reales del canvas.
  function convertirAPixeles(
    punto: Punto,
    canvas: HTMLCanvasElement
  ): Punto {
    return {
      // Convertimos X.
      x: punto.x * canvas.width,

      // Convertimos Y.
      y: punto.y * canvas.height,

      // Conservamos visibility.
      visibility: punto.visibility
    };
  }


  // --------------------------------------------------
  // VALIDAR LANDMARK
  // --------------------------------------------------

  // Comprueba si MediaPipe ve correctamente el punto.
  function esLandmarkValido(
    punto: Punto
  ): boolean {
    // Si no existe visibility,
    // permitimos temporalmente el punto.
    if (
      punto.visibility === undefined
    ) {
      return true;
    }


    // Exigimos como mínimo una visibilidad del 70 %.
    return punto.visibility >= 0.7;
  }


  // --------------------------------------------------
  // CALCULAR ÁNGULO
  // --------------------------------------------------

  // Calcula el ángulo:
  //
  // hombro -> codo -> muñeca
  //
  // El codo es el vértice.
  function calcularAngulo(
    a: Punto,
    b: Punto,
    c: Punto
  ): number {
    // Dirección desde el codo hacia el hombro.
    const angulo1 =
      Math.atan2(
        a.y - b.y,
        a.x - b.x
      );


    // Dirección desde el codo hacia la muñeca.
    const angulo2 =
      Math.atan2(
        c.y - b.y,
        c.x - b.x
      );


    // Diferencia entre ambas direcciones.
    let angulo =
      Math.abs(
        angulo2 - angulo1
      );


    // Convertimos radianes a grados.
    angulo =
      angulo * (180 / Math.PI);


    // Nos aseguramos de obtener
    // un ángulo entre 0° y 180°.
    if (angulo > 180) {
      angulo =
        360 - angulo;
    }


    // Devolvemos el ángulo final.
    return angulo;
  }


  // --------------------------------------------------
  // CONTAR CURLS
  // --------------------------------------------------

  // Analiza el ángulo del codo
  // y actualiza el estado de la repetición.
  function actualizarCurl(
    anguloCodo: number
  ) {
    // Si el ángulo supera 160°,
    // consideramos que el brazo está extendido.
    if (anguloCodo > 160) {
      // Marcamos la fase como "abajo".
      faseRef.current = "abajo";
    }


    // Solo contamos una repetición cuando:
    //
    // 1. El ángulo baja de 50°.
    // 2. El brazo venía previamente de "abajo".
    if (
      anguloCodo < 50 &&
      faseRef.current === "abajo"
    ) {
      // Cambiamos inmediatamente a "arriba".
      //
      // Esto evita sumar varias repeticiones
      // mientras mantengas el brazo flexionado.
      faseRef.current = "arriba";


      // Incrementamos el contador interno.
      repeticionesRef.current =
        repeticionesRef.current + 1;


      // Actualizamos el estado visual de React
      // para mostrar el nuevo número en pantalla.
      setRepeticiones(
        repeticionesRef.current
      );


      // Mostramos también el resultado en consola
      // durante estas primeras pruebas.
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
    punto: Punto
  ) {
    // Empezamos un nuevo trazado.
    contexto.beginPath();


    // Dibujamos el círculo.
    contexto.arc(
      punto.x,
      punto.y,
      8,
      0,
      Math.PI * 2
    );


    // Color del landmark.
    contexto.fillStyle = "red";


    // Rellenamos el punto.
    contexto.fill();
  }


  // --------------------------------------------------
  // DIBUJAR CONEXIÓN
  // --------------------------------------------------

  function dibujarConexion(
    contexto: CanvasRenderingContext2D,
    inicio: Punto,
    fin: Punto
  ) {
    // Empezamos un nuevo trazado.
    contexto.beginPath();


    // Colocamos el lápiz en el primer punto.
    contexto.moveTo(
      inicio.x,
      inicio.y
    );


    // Dibujamos hasta el segundo punto.
    contexto.lineTo(
      fin.x,
      fin.y
    );


    // Grosor de la línea.
    contexto.lineWidth = 4;


    // Color de la conexión.
    contexto.strokeStyle = "blue";


    // Dibujamos la línea.
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
    // Conectamos hombro con codo.
    dibujarConexion(
      contexto,
      hombro,
      codo
    );


    // Conectamos codo con muñeca.
    dibujarConexion(
      contexto,
      codo,
      muneca
    );


    // Dibujamos los tres puntos.
    dibujarLandmark(
      contexto,
      hombro
    );

    dibujarLandmark(
      contexto,
      codo
    );

    dibujarLandmark(
      contexto,
      muneca
    );
  }


  // --------------------------------------------------
  // ANALIZAR FRAME
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


    // Guardamos referencias más cortas.
    const video =
      videoRef.current;

    const canvas =
      canvasRef.current;

    const poseLandmarker =
      poseLandmarkerRef.current;


    // Esperamos hasta que el vídeo
    // tenga datos suficientes.
    if (video.readyState < 2) {
      animationFrameRef.current =
        requestAnimationFrame(
          analizarFrame
        );

      return;
    }


    // Ajustamos la resolución interna del canvas
    // a la resolución real de la webcam.
    if (
      canvas.width !== video.videoWidth ||
      canvas.height !== video.videoHeight
    ) {
      canvas.width =
        video.videoWidth;

      canvas.height =
        video.videoHeight;
    }


    // Obtenemos el contexto 2D.
    const contexto =
      canvas.getContext("2d");


    // Si no existe, no podemos dibujar.
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
      // ANALIZAMOS LA WEBCAM CON MEDIAPIPE
      // ----------------------------------------------

      const resultado =
        poseLandmarker.detectForVideo(
          video,
          timestamp
        );


      // Si encontramos una persona...
      if (
        resultado.landmarks.length > 0
      ) {
        // Obtenemos sus 33 landmarks.
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
          // Comprobamos también
          // que tengan suficiente visibilidad.
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
            // CALCULAMOS EL ÁNGULO
            // --------------------------------------

            const anguloCodo =
              calcularAngulo(
                hombro,
                codo,
                muneca
              );


            // Mostramos temporalmente
            // el ángulo en consola.
            console.log(
              "Ángulo del codo:",
              Math.round(anguloCodo)
            );


            // --------------------------------------
            // ANALIZAMOS EL CURL
            // --------------------------------------

            // Utilizamos el ángulo calculado
            // para detectar repeticiones.
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
      // Mostramos cualquier error de análisis
      // sin detener la aplicación.
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
    // MediaPipe debe estar preparado.
    if (!poseLandmarkerRef.current) {
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


    // Iniciamos el bucle.
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
    // Mostramos la resolución real.
    if (videoRef.current) {
      console.log(
        "Resolución:",
        videoRef.current.videoWidth,
        videoRef.current.videoHeight
      );
    }


    // Intentamos empezar el análisis.
    iniciarAnalisis();
  }


  // --------------------------------------------------
  // INTERFAZ
  // --------------------------------------------------

  return (
    // Contenedor general del componente.
    <div>

      {/* Mostramos el contador real de curls. */}
      <h2>
        Repeticiones: {repeticiones}
      </h2>


      {/* Contenedor que agrupa vídeo y canvas. */}
      <div className="camera-container">

        <video
          // Referencia al vídeo.
          ref={videoRef}

          // Reproduce automáticamente la webcam.
          autoPlay

          // Mantiene el vídeo integrado
          // en la página en móviles.
          playsInline

          // Iniciamos el análisis
          // cuando el vídeo está preparado.
          onLoadedData={videoPreparado}

          // Clase CSS de la cámara.
          className="camera-video"
        />


        <canvas
          // Referencia al canvas.
          ref={canvasRef}

          // Clase CSS del canvas.
          className="camera-canvas"
        />

      </div>

    </div>
  );
}


// Exportamos CameraPreview.
export default CameraPreview;