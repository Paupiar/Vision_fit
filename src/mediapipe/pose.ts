// Importamos las herramientas necesarias de MediaPipe
// para cargar y ejecutar el detector de poses.
import {
  FilesetResolver,
  PoseLandmarker
} from "@mediapipe/tasks-vision";

// Exportamos la función para poder utilizarla
// desde CameraPreview.tsx.
export async function crearPoseLandmarker(): Promise<PoseLandmarker> {
  // Cargamos los archivos WASM necesarios para MediaPipe.
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  // Creamos el detector de poses.
  const poseLandmarker = await PoseLandmarker.createFromOptions(
    vision,
    {
      // Configuración del modelo.
      baseOptions: {
        // Modelo Pose Landmarker Lite.
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
      },

      // Analizaremos vídeo continuo de la webcam.
      runningMode: "VIDEO",

      // Solo queremos detectar una persona.
      numPoses: 1,

      // Niveles mínimos de confianza.
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    }
  );

  // Devolvemos el detector configurado.
  return poseLandmarker;
}