// --------------------------------------------------
// SENTADILLA
// --------------------------------------------------
//
// Toda la lógica específica de la sentadilla
// estará dentro de este archivo.
//
// Queremos que esta lógica pueda reutilizarse
// más adelante tanto con:
//
// - cámara;
// - vídeo grabado.
//
// En esta fase añadimos:
//
// - ángulo de rodilla;
// - fases;
// - conteo de repeticiones.
// --------------------------------------------------


// --------------------------------------------------
// UMBRALES
// --------------------------------------------------

// Después de probar la sentadilla con cámara,
// observamos aproximadamente:
//
// de pie  -> 170°
// abajo   -> 90°
//
// Dejamos un pequeño margen para evitar
// problemas por pequeñas variaciones
// de MediaPipe.
export const ANGULO_SENTADILLA_ARRIBA =
  160;


export const ANGULO_SENTADILLA_ABAJO =
  100;


// --------------------------------------------------
// TIPOS
// --------------------------------------------------

// Representa un landmark detectado
// por MediaPipe.
export interface PuntoSentadilla {
  x: number;

  y: number;

  visibility?: number;
}


// Fases posibles de la sentadilla.
//
// "arriba":
// estamos esperando que el usuario baje.
//
// "abajo":
// el usuario ya ha alcanzado la profundidad
// necesaria y debe volver a subir.
export type FaseSentadilla =
  "arriba" |
  "abajo";


// Estado interno de la sentadilla.
//
// Este objeto se conserva entre
// un frame y el siguiente.
export interface EstadoSentadilla {
  fase: FaseSentadilla;

  repeticiones: number;
}


// Resultado producido
// después de analizar un frame.
export interface ResultadoSentadilla {
  // Ángulo actual de la rodilla.
  anguloRodilla: number;

  // Fase después de analizar el frame.
  fase: FaseSentadilla;

  // Número de repeticiones actuales.
  repeticiones: number;

  // Nos indica si hemos cambiado
  // de fase en este frame.
  cambioFase: boolean;

  // Nos indica si acabamos
  // de completar una repetición.
  repeticionSumada: boolean;

  // Mensaje relacionado
  // con el movimiento actual.
  feedbackMovimiento: string;
}


// --------------------------------------------------
// CREAR ESTADO INICIAL
// --------------------------------------------------

// La sentadilla empieza suponiendo
// que el usuario está de pie.
//
// Todavía no contamos ninguna repetición.
export function crearEstadoSentadilla():
  EstadoSentadilla {
  return {
    fase:
      "arriba",

    repeticiones:
      0
  };
}


// --------------------------------------------------
// CALCULAR ÁNGULO DE RODILLA
// --------------------------------------------------

// Calculamos:
//
// cadera -> rodilla -> tobillo
//
// La rodilla es el vértice
// del ángulo.
export function calcularAnguloRodilla(
  cadera: PuntoSentadilla,
  rodilla: PuntoSentadilla,
  tobillo: PuntoSentadilla
): number {
  // Ángulo desde la rodilla
  // hacia la cadera.
  const angulo1 =
    Math.atan2(
      cadera.y - rodilla.y,
      cadera.x - rodilla.x
    );


  // Ángulo desde la rodilla
  // hacia el tobillo.
  const angulo2 =
    Math.atan2(
      tobillo.y - rodilla.y,
      tobillo.x - rodilla.x
    );


  // Diferencia entre ambos.
  let angulo =
    Math.abs(
      angulo2 -
      angulo1
    );


  // Convertimos de radianes
  // a grados.
  angulo =
    angulo *
    (180 / Math.PI);


  // Queremos siempre
  // un resultado entre 0° y 180°.
  if (
    angulo >
    180
  ) {
    angulo =
      360 -
      angulo;
  }


  return angulo;
}


// --------------------------------------------------
// FEEDBACK DE MOVIMIENTO
// --------------------------------------------------

// Genera un mensaje sencillo
// dependiendo de:
//
// - ángulo actual;
// - fase de la sentadilla.
export function obtenerFeedbackSentadilla(
  anguloRodilla: number,
  fase: FaseSentadilla
): string {
  // ------------------------------------------------
  // FASE ARRIBA
  // ------------------------------------------------

  // Si estamos arriba,
  // esperamos que el usuario baje.
  if (
    fase ===
    "arriba"
  ) {
    // Está prácticamente de pie.
    if (
      anguloRodilla >=
      ANGULO_SENTADILLA_ARRIBA
    ) {
      return (
        "Empieza a bajar"
      );
    }


    // Todavía no ha alcanzado
    // suficiente profundidad.
    if (
      anguloRodilla >
      ANGULO_SENTADILLA_ABAJO
    ) {
      return (
        "Sigue bajando"
      );
    }


    // Ha alcanzado
    // la profundidad requerida.
    return (
      "Profundidad alcanzada"
    );
  }


  // ------------------------------------------------
  // FASE ABAJO
  // ------------------------------------------------

  // Una vez abajo,
  // queremos que vuelva a subir.
  if (
    anguloRodilla <
    ANGULO_SENTADILLA_ARRIBA
  ) {
    return (
      "Sigue subiendo"
    );
  }


  // Ha vuelto completamente arriba.
  return (
    "Repetición completa"
  );
}


// --------------------------------------------------
// ANALIZAR SENTADILLA
// --------------------------------------------------

// Esta función recibe:
//
// - estado actual;
// - cadera;
// - rodilla;
// - tobillo.
//
// Y devuelve toda la información
// necesaria para la interfaz.
export function analizarSentadilla(
  estado: EstadoSentadilla,
  cadera: PuntoSentadilla,
  rodilla: PuntoSentadilla,
  tobillo: PuntoSentadilla
): ResultadoSentadilla {
  // ------------------------------------------------
  // ÁNGULO
  // ------------------------------------------------

  const anguloRodilla =
    calcularAnguloRodilla(
      cadera,
      rodilla,
      tobillo
    );


  // Guardamos la fase existente
  // antes de modificar nada.
  const faseAntes =
    estado.fase;


  // Calculamos el feedback
  // según la fase actual.
  const feedbackMovimiento =
    obtenerFeedbackSentadilla(
      anguloRodilla,
      faseAntes
    );


  // Variables que indican
  // qué ha ocurrido en este frame.
  let cambioFase =
    false;


  let repeticionSumada =
    false;


  // ------------------------------------------------
  // LLEGAR ABAJO
  // ------------------------------------------------

  // Solo cambiamos a "abajo"
  // si antes estábamos arriba
  // y alcanzamos 100° o menos.
  if (
    estado.fase ===
      "arriba" &&
    anguloRodilla <=
      ANGULO_SENTADILLA_ABAJO
  ) {
    estado.fase =
      "abajo";


    cambioFase =
      true;
  }


  // ------------------------------------------------
  // VOLVER ARRIBA
  // ------------------------------------------------

  // Una repetición se considera completa
  // únicamente cuando:
  //
  // 1. previamente alcanzamos la fase abajo;
  // 2. volvemos a 160° o más.
  if (
    estado.fase ===
      "abajo" &&
    anguloRodilla >=
      ANGULO_SENTADILLA_ARRIBA
  ) {
    // Volvemos a la fase inicial.
    estado.fase =
      "arriba";


    // Sumamos una repetición.
    estado.repeticiones =
      estado.repeticiones +
      1;


    cambioFase =
      true;


    repeticionSumada =
      true;
  }


  // ------------------------------------------------
  // RESULTADO
  // ------------------------------------------------

  return {
    anguloRodilla:
      anguloRodilla,

    fase:
      estado.fase,

    repeticiones:
      estado.repeticiones,

    cambioFase:
      cambioFase,

    repeticionSumada:
      repeticionSumada,

    feedbackMovimiento:
      feedbackMovimiento
  };
}