// --------------------------------------------------
// LANDMARKS DE MEDIAPIPE
// --------------------------------------------------
//
// Este archivo centraliza los índices
// de los landmarks que utiliza Visión Fit.
//
// MediaPipe Pose devuelve 33 landmarks.
//
// Hasta ahora estos números estaban escritos
// directamente dentro de los componentes.
//
// Centralizarlos nos permitirá:
//
// - evitar números repetidos;
// - reducir errores;
// - cambiar fácilmente de lado;
// - preparar el selector izquierda/derecha;
// - simplificar CameraPreview y VideoPreview.
// --------------------------------------------------


// ==================================================
// CURL DE BÍCEPS
// ==================================================
//
// Actualmente analizamos el lado derecho.
//
// Más adelante añadiremos también
// la configuración del lado izquierdo.
// ==================================================

export const LANDMARKS_CURL = {
  hombro: 12,
  codo: 14,
  muneca: 16,
  cadera: 24
};


// ==================================================
// SENTADILLA
// ==================================================
//
// Actualmente analizamos
// la pierna derecha.
//
// 12 -> hombro derecho
// 24 -> cadera derecha
// 26 -> rodilla derecha
// 28 -> tobillo derecho
// ==================================================

export const LANDMARKS_SENTADILLA = {
  hombro: 12,
  cadera: 24,
  rodilla: 26,
  tobillo: 28
};


// ==================================================
// PRESS DE HOMBRO
// ==================================================
//
// El Press se analiza de forma bilateral.
//
// Por eso necesitamos simultáneamente
// los landmarks de ambos brazos.
// ==================================================

export const LANDMARKS_PRESS_HOMBRO = {
  izquierdo: {
    hombro: 11,
    codo: 13,
    muneca: 15
  },

  derecho: {
    hombro: 12,
    codo: 14,
    muneca: 16
  }
};