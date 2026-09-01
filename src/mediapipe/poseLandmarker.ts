// Importamos las herramientas necesarias de MediaPipe.
//
// FilesetResolver:
// carga los archivos WASM necesarios para ejecutar MediaPipe
// directamente en el navegador.
//
// PoseLandmarker:
// es el detector que utilizaremos para encontrar
// los puntos del cuerpo de la persona.
import {
  FilesetResolver,
  PoseLandmarker
} from "@mediapipe/tasks-vision";


// Esta función crea y configura el detector de poses.
//
// La exportamos para poder utilizarla posteriormente
// desde CameraPreview.tsx.
//
// Al ser una función async, devuelve una Promise.
// Cuando termine de cargar, esa Promise contendrá
// nuestro PoseLandmarker preparado.
export async function crearPoseLandmarker(): Promise<PoseLandmarker> {

  // --------------------------------------------------
  // 1. CARGAMOS LOS ARCHIVOS WASM
  // --------------------------------------------------

  // MediaPipe necesita una serie de archivos WebAssembly (WASM)
  // para ejecutar el procesamiento de visión en el navegador.
  //
  // FilesetResolver se encarga de cargar esos archivos.
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );


  // --------------------------------------------------
  // 2. CREAMOS EL DETECTOR DE POSES
  // --------------------------------------------------

  // Creamos PoseLandmarker indicando:
  // - qué modelo utilizar;
  // - que vamos a analizar vídeo;
  // - cuántas personas queremos detectar;
  // - los niveles mínimos de confianza.
  const poseLandmarker = await PoseLandmarker.createFromOptions(
    vision,
    {
      // Configuración del modelo que utilizará MediaPipe.
      baseOptions: {
        // Utilizamos el modelo Pose Landmarker Lite.
        //
        // Es una versión ligera del modelo y es adecuada
        // para nuestro primer prototipo de Visión Fit.
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
      },


      // --------------------------------------------------
      // MODO DE FUNCIONAMIENTO
      // --------------------------------------------------

      // Indicamos que vamos a analizar una secuencia de vídeo.
      //
      // En nuestro caso serán los frames de la webcam.
      runningMode: "VIDEO",


      // --------------------------------------------------
      // NÚMERO DE PERSONAS
      // --------------------------------------------------

      // Solo necesitamos detectar una persona
      // durante el entrenamiento.
      numPoses: 1,


      // --------------------------------------------------
      // NIVELES DE CONFIANZA
      // --------------------------------------------------

      // Confianza mínima para que MediaPipe considere
      // que ha detectado correctamente una pose.
      minPoseDetectionConfidence: 0.5,

      // Confianza mínima para considerar que
      // la pose está realmente presente.
      minPosePresenceConfidence: 0.5,

      // Confianza mínima para seguir correctamente
      // la pose entre diferentes frames del vídeo.
      minTrackingConfidence: 0.5
    }
  );


  // --------------------------------------------------
  // 3. DEVOLVEMOS EL DETECTOR
  // --------------------------------------------------

  // Devolvemos PoseLandmarker ya cargado y configurado.
  //
  // CameraPreview.tsx podrá utilizarlo después
  // para analizar cada frame de la webcam.
  return poseLandmarker;
}