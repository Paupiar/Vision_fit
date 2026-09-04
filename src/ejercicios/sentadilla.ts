// --------------------------------------------------
// SENTADILLA
// --------------------------------------------------
//
// Este archivo contiene toda la lógica
// específica del análisis de sentadilla.
//
// Queremos que esta lógica sea independiente
// de la fuente de imagen:
//
// - cámara;
// - vídeo grabado.
//
// Actualmente analizamos:
//
// - ángulo de rodilla;
// - inicio y final de repetición;
// - conteo de repeticiones;
// - profundidad;
// - historial;
// - resumen de sesión.
// --------------------------------------------------


// --------------------------------------------------
// UMBRALES
// --------------------------------------------------

// Después de realizar pruebas reales:
//
// de pie -> aproximadamente 170°
// abajo  -> aproximadamente 90°
//
// Utilizamos márgenes para evitar que
// pequeñas variaciones de MediaPipe
// afecten al conteo.


// Consideramos que el usuario
// está completamente arriba.
export const ANGULO_SENTADILLA_ARRIBA =
  160;


// A partir de este ángulo consideramos
// que realmente ha empezado una repetición.
//
// Esto evita contar pequeños movimientos
// de rodilla como sentadillas.
export const ANGULO_INICIO_SENTADILLA =
  140;


// Para considerar que la sentadilla
// ha alcanzado suficiente profundidad.
export const ANGULO_SENTADILLA_ABAJO =
  100;


// --------------------------------------------------
// PUNTO
// --------------------------------------------------

// Representa un landmark de MediaPipe.
export interface PuntoSentadilla {
  x: number;

  y: number;

  visibility?: number;
}


// --------------------------------------------------
// FASE
// --------------------------------------------------

// "arriba":
// todavía no hemos iniciado una repetición.
//
// "abajo":
// la repetición ya está en curso.
//
// Importante:
//
// estar en fase "abajo" NO significa
// necesariamente haber alcanzado ya
// una profundidad correcta.
//
// Para eso utilizamos:
// profundidadAlcanzada.
export type FaseSentadilla =
  "arriba" |
  "abajo";


// --------------------------------------------------
// RESULTADO DE UNA REPETICIÓN
// --------------------------------------------------

export interface ResultadoRepeticionSentadilla {
  // Número de repetición.
  numero: number;

  // Ángulo más pequeño alcanzado
  // durante la repetición.
  anguloMinimo: number;

  // Indica si alcanzó
  // una profundidad correcta.
  profundidadCorrecta: boolean;

  // Texto que mostramos al usuario.
  resultado:
    "Correcta" |
    "Profundidad insuficiente";
}


// --------------------------------------------------
// ESTADO INTERNO
// --------------------------------------------------

// Este estado se mantiene
// entre un frame y el siguiente.
export interface EstadoSentadilla {
  // Fase actual.
  fase: FaseSentadilla;

  // Número total de repeticiones realizadas.
  repeticiones: number;

  // Indica si durante esta repetición
  // se llegó a 100° o menos.
  profundidadAlcanzada: boolean;

  // Ángulo mínimo de la repetición actual.
  anguloMinimo: number;

  // Historial completo de la sesión.
  historial:
    ResultadoRepeticionSentadilla[];
}


// --------------------------------------------------
// RESULTADO DE UN FRAME
// --------------------------------------------------

export interface ResultadoSentadilla {
  // Ángulo actual de rodilla.
  anguloRodilla: number;

  // Fase actual.
  fase: FaseSentadilla;

  // Total de repeticiones.
  repeticiones: number;

  // Indica si hemos cambiado
  // de fase en este frame.
  cambioFase: boolean;

  // Indica si acabamos
  // de terminar una repetición.
  repeticionSumada: boolean;

  // Feedback del movimiento.
  feedbackMovimiento: string;

  // Historial completo.
  historial:
    ResultadoRepeticionSentadilla[];
}


// --------------------------------------------------
// RESUMEN DE SESIÓN
// --------------------------------------------------

export interface ResumenSesionSentadilla {
  total: number;

  correctas: number;

  porcentajeCorrectas: number;

  profundidadInsuficiente: number;
}


// --------------------------------------------------
// CREAR ESTADO INICIAL
// --------------------------------------------------

export function crearEstadoSentadilla():
  EstadoSentadilla {
  return {
    // Empezamos suponiendo
    // que el usuario está arriba.
    fase:
      "arriba",

    // Todavía no hay repeticiones.
    repeticiones:
      0,

    // No hemos alcanzado profundidad.
    profundidadAlcanzada:
      false,

    // Inicializamos con 180°
    // porque buscamos posteriormente
    // el ángulo mínimo.
    anguloMinimo:
      180,

    // Historial inicialmente vacío.
    historial:
      []
  };
}


// --------------------------------------------------
// CALCULAR ÁNGULO DE RODILLA
// --------------------------------------------------

// Calculamos:
//
// cadera -> rodilla -> tobillo
//
// La rodilla es el vértice.
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


  // Convertimos radianes
  // a grados.
  angulo =
    angulo *
    (180 / Math.PI);


  // Queremos un resultado
  // siempre entre 0° y 180°.
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
// FEEDBACK
// --------------------------------------------------

export function obtenerFeedbackSentadilla(
  anguloRodilla: number,
  fase: FaseSentadilla,
  profundidadAlcanzada: boolean,
  repeticionSumada: boolean
): string {
  // Si acabamos de terminar
  // una repetición.
  if (
    repeticionSumada
  ) {
    return (
      "Repetición completa"
    );
  }


  // ------------------------------------------------
  // ARRIBA
  // ------------------------------------------------

  if (
    fase ===
    "arriba"
  ) {
    return (
      "Empieza a bajar"
    );
  }


  // ------------------------------------------------
  // REPETICIÓN EN CURSO
  // ------------------------------------------------

  // Todavía no hemos alcanzado
  // suficiente profundidad.
  if (
    !profundidadAlcanzada
  ) {
    return (
      "Sigue bajando"
    );
  }


  // Acabamos de llegar
  // a suficiente profundidad.
  if (
    anguloRodilla <=
    ANGULO_SENTADILLA_ABAJO
  ) {
    return (
      "Profundidad alcanzada"
    );
  }


  // Ya hemos alcanzado profundidad
  // y estamos volviendo arriba.
  return (
    "Sigue subiendo"
  );
}


// --------------------------------------------------
// ANALIZAR SENTADILLA
// --------------------------------------------------

export function analizarSentadilla(
  estado: EstadoSentadilla,
  cadera: PuntoSentadilla,
  rodilla: PuntoSentadilla,
  tobillo: PuntoSentadilla
): ResultadoSentadilla {
  // ------------------------------------------------
  // ÁNGULO ACTUAL
  // ------------------------------------------------

  const anguloRodilla =
    calcularAnguloRodilla(
      cadera,
      rodilla,
      tobillo
    );


  let cambioFase =
    false;


  let repeticionSumada =
    false;


  // ------------------------------------------------
  // INICIO DE REPETICIÓN
  // ------------------------------------------------

  // Si estamos arriba y la rodilla
  // baja hasta 140° o menos,
  // consideramos que ha empezado
  // una repetición real.
  if (
    estado.fase ===
      "arriba" &&
    anguloRodilla <=
      ANGULO_INICIO_SENTADILLA
  ) {
    estado.fase =
      "abajo";


    estado.anguloMinimo =
      anguloRodilla;


    estado.profundidadAlcanzada =
      anguloRodilla <=
      ANGULO_SENTADILLA_ABAJO;


    cambioFase =
      true;
  }


  // ------------------------------------------------
  // REPETICIÓN EN CURSO
  // ------------------------------------------------

  if (
    estado.fase ===
    "abajo"
  ) {
    // Guardamos el ángulo
    // más pequeño alcanzado.
    if (
      anguloRodilla <
      estado.anguloMinimo
    ) {
      estado.anguloMinimo =
        anguloRodilla;
    }


    // Si llegamos a 100° o menos,
    // marcamos profundidad correcta.
    if (
      anguloRodilla <=
      ANGULO_SENTADILLA_ABAJO
    ) {
      estado.profundidadAlcanzada =
        true;
    }


    // ------------------------------------------------
    // FINAL DE REPETICIÓN
    // ------------------------------------------------

    // La repetición termina
    // cuando volvemos completamente arriba.
    if (
      anguloRodilla >=
      ANGULO_SENTADILLA_ARRIBA
    ) {
      // Sumamos una repetición,
      // sea correcta o incorrecta.
      estado.repeticiones =
        estado.repeticiones +
        1;


      // --------------------------------------------
      // CLASIFICAR
      // --------------------------------------------

      const profundidadCorrecta =
        estado.profundidadAlcanzada;


      const resultado:
        ResultadoRepeticionSentadilla["resultado"] =
        profundidadCorrecta
          ? "Correcta"
          : "Profundidad insuficiente";


      // Creamos el registro
      // de esta repetición.
      const nuevaRepeticion:
        ResultadoRepeticionSentadilla = {
        numero:
          estado.repeticiones,

        anguloMinimo:
          estado.anguloMinimo,

        profundidadCorrecta:
          profundidadCorrecta,

        resultado:
          resultado
      };


      // Añadimos la repetición
      // al historial.
      estado.historial.push(
        nuevaRepeticion
      );


      // --------------------------------------------
      // PREPARAR SIGUIENTE REPETICIÓN
      // --------------------------------------------

      estado.fase =
        "arriba";


      estado.profundidadAlcanzada =
        false;


      estado.anguloMinimo =
        180;


      cambioFase =
        true;


      repeticionSumada =
        true;
    }
  }


  // ------------------------------------------------
  // FEEDBACK
  // ------------------------------------------------

  const feedbackMovimiento =
    obtenerFeedbackSentadilla(
      anguloRodilla,
      estado.fase,
      estado.profundidadAlcanzada,
      repeticionSumada
    );


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
      feedbackMovimiento,

    historial:
      estado.historial
  };
}


// --------------------------------------------------
// CALCULAR RESUMEN
// --------------------------------------------------

export function calcularResumenSesionSentadilla(
  historial:
    ResultadoRepeticionSentadilla[]
): ResumenSesionSentadilla {
  // Total de repeticiones.
  const total =
    historial.length;


  // Contamos las correctas.
  const correctas =
    historial.filter(
      function (repeticion) {
        return (
          repeticion.profundidadCorrecta
        );
      }
    ).length;


  // Contamos las repeticiones
  // con poca profundidad.
  const profundidadInsuficiente =
    historial.filter(
      function (repeticion) {
        return (
          !repeticion.profundidadCorrecta
        );
      }
    ).length;


  // Evitamos dividir entre cero.
  const porcentajeCorrectas =
    total ===
    0
      ? 0
      : (
          correctas /
          total
        ) *
        100;


  return {
    total:
      total,

    correctas:
      correctas,

    porcentajeCorrectas:
      porcentajeCorrectas,

    profundidadInsuficiente:
      profundidadInsuficiente
  };
}