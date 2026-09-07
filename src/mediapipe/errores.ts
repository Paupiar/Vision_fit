// --------------------------------------------------
// GESTIÓN DE ERRORES DE VISIÓN FIT
// --------------------------------------------------
//
// Centralizamos aquí los mensajes
// relacionados con:
//
// - acceso a la cámara;
// - permisos;
// - dispositivos;
// - carga de MediaPipe.
//
// Así evitamos repetir condiciones
// dentro de CameraPreview.
// --------------------------------------------------


// ==================================================
// ERROR DE CÁMARA
// ==================================================

export function obtenerMensajeErrorCamara(
  error: unknown
): string {
  // Los errores producidos por
  // getUserMedia suelen ser DOMException.
  if (
    error instanceof DOMException
  ) {
    // ----------------------------------------------
    // PERMISO DENEGADO
    // ----------------------------------------------

    if (
      error.name ===
        "NotAllowedError" ||
      error.name ===
        "SecurityError"
    ) {
      return (
        "No se ha podido acceder a la cámara. " +
        "Comprueba que has concedido permiso al navegador para utilizarla."
      );
    }


    // ----------------------------------------------
    // NO HAY CÁMARA
    // ----------------------------------------------

    if (
      error.name ===
        "NotFoundError" ||
      error.name ===
        "DevicesNotFoundError"
    ) {
      return (
        "No se ha encontrado ninguna cámara disponible en el dispositivo."
      );
    }


    // ----------------------------------------------
    // CÁMARA OCUPADA O NO DISPONIBLE
    // ----------------------------------------------

    if (
      error.name ===
        "NotReadableError" ||
      error.name ===
        "TrackStartError"
    ) {
      return (
        "La cámara no está disponible. " +
        "Puede que otra aplicación la esté utilizando."
      );
    }


    // ----------------------------------------------
    // CONFIGURACIÓN NO COMPATIBLE
    // ----------------------------------------------

    if (
      error.name ===
        "OverconstrainedError" ||
      error.name ===
        "ConstraintNotSatisfiedError"
    ) {
      return (
        "La cámara no admite la configuración solicitada."
      );
    }
  }


  // ----------------------------------------------
  // ERROR DESCONOCIDO
  // ----------------------------------------------

  return (
    "No se ha podido iniciar la cámara. " +
    "Comprueba los permisos y vuelve a intentarlo."
  );
}


// ==================================================
// ERROR DE MEDIAPIPE
// ==================================================

export function obtenerMensajeErrorMediaPipe(
  error: unknown
): string {
  // Mostramos el error técnico
  // únicamente por consola.
  //
  // El usuario recibe un mensaje
  // sencillo y comprensible.
  console.error(
    "Error interno de MediaPipe:",
    error
  );


  return (
    "No se ha podido iniciar el sistema de análisis. " +
    "Vuelve a intentarlo en unos segundos."
  );
}