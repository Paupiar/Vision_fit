// --------------------------------------------------
// LANDMARKS DE MEDIAPIPE
// --------------------------------------------------
//
// Este archivo centraliza los índices
// de los landmarks que utiliza Visión Fit.
//
// MediaPipe Pose devuelve 33 landmarks.
//
// Centralizar estos índices nos permite:
//
// - evitar números repetidos;
// - reducir errores;
// - cambiar fácilmente de lado;
// - utilizar el mismo análisis
//   para izquierda y derecha;
// - simplificar CameraPreview y VideoPreview.
// --------------------------------------------------


// ==================================================
// TIPO DE LADO
// ==================================================
//
// Curl y Sentadilla pueden analizarse
// utilizando el lado izquierdo
// o el lado derecho.
//
// El Press de hombro sigue siendo bilateral.
// ==================================================

export type Lado =
  "izquierdo" |
  "derecho";


// ==================================================
// CURL DE BÍCEPS
// ==================================================
//
// MediaPipe:
//
// IZQUIERDO
// 11 -> hombro
// 13 -> codo
// 15 -> muñeca
// 23 -> cadera
//
// DERECHO
// 12 -> hombro
// 14 -> codo
// 16 -> muñeca
// 24 -> cadera
// ==================================================

export const LANDMARKS_CURL = {
  izquierdo: {
    hombro: 11,
    codo: 13,
    muneca: 15,
    cadera: 23
  },

  derecho: {
    hombro: 12,
    codo: 14,
    muneca: 16,
    cadera: 24
  }
};


// ==================================================
// SENTADILLA
// ==================================================
//
// MediaPipe:
//
// IZQUIERDO
// 11 -> hombro
// 23 -> cadera
// 25 -> rodilla
// 27 -> tobillo
//
// DERECHO
// 12 -> hombro
// 24 -> cadera
// 26 -> rodilla
// 28 -> tobillo
// ==================================================

export const LANDMARKS_SENTADILLA = {
  izquierdo: {
    hombro: 11,
    cadera: 23,
    rodilla: 25,
    tobillo: 27
  },

  derecho: {
    hombro: 12,
    cadera: 24,
    rodilla: 26,
    tobillo: 28
  }
};


// ==================================================
// PRESS DE HOMBRO
// ==================================================
//
// El Press continúa analizándose
// de forma bilateral.
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