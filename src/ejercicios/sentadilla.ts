// --------------------------------------------------
// SENTADILLA
// --------------------------------------------------
//
// Este archivo contiene toda la lógica
// específica del análisis de sentadilla.
//
// Actualmente analizamos:
//
// - ángulo de rodilla;
// - inicio y final de repetición;
// - conteo de repeticiones;
// - profundidad;
// - inclinación del tronco;
// - clasificación técnica;
// - historial;
// - resumen de sesión.
//
// Esta lógica es independiente
// de la fuente de imagen para poder
// reutilizarla más adelante con:
//
// - cámara;
// - vídeo grabado.
// --------------------------------------------------


// --------------------------------------------------
// UMBRALES DE MOVIMIENTO
// --------------------------------------------------

// Después de realizar pruebas reales:
//
// de pie -> aproximadamente 170°
// abajo  -> aproximadamente 90°
//
// Dejamos margen para compensar
// pequeñas variaciones de MediaPipe.


// Consideramos que el usuario
// está completamente arriba.
export const ANGULO_SENTADILLA_ARRIBA =
  160;


// A partir de este ángulo consideramos
// que realmente ha empezado
// una repetición.
export const ANGULO_INICIO_SENTADILLA =
  140;


// Profundidad mínima necesaria
// para considerar correcta
// la bajada.
export const ANGULO_SENTADILLA_ABAJO =
  100;


// --------------------------------------------------
// UMBRAL TÉCNICO DEL TRONCO
// --------------------------------------------------

// En las pruebas realizadas observamos:
//
// sentadillas normales:
// aproximadamente 31° - 45°
//
// inclinación exagerada:
// aproximadamente 52° - 57°
//
// Por eso utilizamos 50°
// como límite provisional.
export const INCLINACION_MAXIMA_TRONCO =
  50;


// --------------------------------------------------
// PUNTO
// --------------------------------------------------

// Representa un landmark
// detectado por MediaPipe.
export interface PuntoSentadilla {
  x: number;

  y: number;

  visibility?: number;
}


// --------------------------------------------------
// FASE
// --------------------------------------------------

export type FaseSentadilla =
  "arriba" |
  "abajo";


// --------------------------------------------------
// RESULTADO DE UNA REPETICIÓN
// --------------------------------------------------

export interface ResultadoRepeticionSentadilla {
  // Número de repetición.
  numero: number;

  // Menor ángulo de rodilla
  // alcanzado durante la repetición.
  anguloMinimo: number;

  // Mayor inclinación del tronco
  // durante la repetición.
  //
  // null significa que no pudimos
  // analizar correctamente el hombro.
  inclinacionTroncoMaxima:
    number | null;

  // Indica si alcanzamos
  // suficiente profundidad.
  profundidadCorrecta: boolean;

  // Error específico
  // de profundidad.
  errorProfundidad: boolean;

  // Error específico
  // de inclinación del tronco.
  errorTronco: boolean;

  // Texto final
  // de clasificación.
  resultado:
    "Correcta" |
    "Profundidad insuficiente" |
    "Exceso de inclinación del tronco" |
    "Profundidad insuficiente + exceso de inclinación del tronco";
}


// --------------------------------------------------
// ESTADO INTERNO
// --------------------------------------------------

export interface EstadoSentadilla {
  // Fase actual.
  fase: FaseSentadilla;

  // Total de repeticiones.
  repeticiones: number;

  // Indica si durante la repetición
  // hemos alcanzado 100° o menos.
  profundidadAlcanzada: boolean;

  // Ángulo mínimo de rodilla
  // de la repetición actual.
  anguloMinimo: number;

  // Inclinación máxima del tronco
  // de la repetición actual.
  inclinacionTroncoMaxima:
    number | null;

  // Historial completo.
  historial:
    ResultadoRepeticionSentadilla[];
}


// --------------------------------------------------
// RESULTADO DE UN FRAME
// --------------------------------------------------

export interface ResultadoSentadilla {
  // Ángulo actual de rodilla.
  anguloRodilla: number;

  // Inclinación actual
  // del tronco.
  inclinacionTronco:
    number | null;

  // Fase actual.
  fase: FaseSentadilla;

  // Total de repeticiones.
  repeticiones: number;

  // Indica si ha cambiado
  // la fase en este frame.
  cambioFase: boolean;

  // Indica si acabamos
  // de completar una repetición.
  repeticionSumada: boolean;

  // Feedback relacionado
  // con bajar/subir.
  feedbackMovimiento: string;

  // Feedback técnico
  // del tronco en tiempo real.
  feedbackTronco: string;

  // Historial completo.
  historial:
    ResultadoRepeticionSentadilla[];
}


// --------------------------------------------------
// RESUMEN DE SESIÓN
// --------------------------------------------------

export interface ResumenSesionSentadilla {
  // Repeticiones realizadas.
  total: number;

  // Repeticiones sin ninguno
  // de los errores analizados.
  correctas: number;

  // Porcentaje de repeticiones correctas.
  porcentajeCorrectas: number;

  // Número de repeticiones
  // que no alcanzaron profundidad.
  profundidadInsuficiente: number;

  // Número de repeticiones
  // con demasiado tronco hacia delante.
  excesoInclinacionTronco: number;
}


// --------------------------------------------------
// CREAR ESTADO INICIAL
// --------------------------------------------------

export function crearEstadoSentadilla():
  EstadoSentadilla {
  return {
    fase:
      "arriba",

    repeticiones:
      0,

    profundidadAlcanzada:
      false,

    anguloMinimo:
      180,

    inclinacionTroncoMaxima:
      null,

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


  // Convertimos de radianes
  // a grados.
  angulo =
    angulo *
    (180 / Math.PI);


  // Queremos siempre
  // un valor entre 0° y 180°.
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
// CALCULAR INCLINACIÓN DEL TRONCO
// --------------------------------------------------

// Utilizamos:
//
// hombro -> cadera
//
// y calculamos cuánto se separa
// esa línea de la vertical.
//
// Aproximadamente:
//
// 0°  -> tronco vertical
// 30° -> inclinación moderada
// 50° -> límite actual
// >50° -> exceso de inclinación
export function calcularInclinacionTronco(
  hombro: PuntoSentadilla,
  cadera: PuntoSentadilla
): number {
  // Distancia horizontal.
  const diferenciaX =
    Math.abs(
      hombro.x -
      cadera.x
    );


  // Distancia vertical.
  const diferenciaY =
    Math.abs(
      hombro.y -
      cadera.y
    );


  // Ángulo respecto
  // a la vertical.
  const inclinacion =
    Math.atan2(
      diferenciaX,
      diferenciaY
    ) *
    (180 / Math.PI);


  return inclinacion;
}


// --------------------------------------------------
// FEEDBACK DE MOVIMIENTO
// --------------------------------------------------

export function obtenerFeedbackSentadilla(
  anguloRodilla: number,
  fase: FaseSentadilla,
  profundidadAlcanzada: boolean,
  repeticionSumada: boolean
): string {
  // Acabamos de terminar
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

  if (
    !profundidadAlcanzada
  ) {
    return (
      "Sigue bajando"
    );
  }


  // Hemos llegado
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
  // y estamos subiendo.
  return (
    "Sigue subiendo"
  );
}


// --------------------------------------------------
// FEEDBACK DEL TRONCO
// --------------------------------------------------

export function obtenerFeedbackTronco(
  inclinacionTronco:
    number | null
): string {
  // No podemos analizarlo
  // si falta el hombro.
  if (
    inclinacionTronco ===
    null
  ) {
    return (
      "No se puede analizar el tronco"
    );
  }


  // Dentro del límite
  // que hemos calibrado.
  if (
    inclinacionTronco <=
    INCLINACION_MAXIMA_TRONCO
  ) {
    return (
      "Inclinación correcta"
    );
  }


  // Supera los 50°.
  return (
    "Reduce la inclinación hacia delante"
  );
}


// --------------------------------------------------
// CLASIFICAR REPETICIÓN
// --------------------------------------------------

// Separamos la clasificación
// del resto del análisis para
// mantener el código más claro.
export function clasificarRepeticionSentadilla(
  errorProfundidad: boolean,
  errorTronco: boolean
):
  ResultadoRepeticionSentadilla["resultado"] {
  // Dos errores.
  if (
    errorProfundidad &&
    errorTronco
  ) {
    return (
      "Profundidad insuficiente + exceso de inclinación del tronco"
    );
  }


  // Solo profundidad.
  if (
    errorProfundidad
  ) {
    return (
      "Profundidad insuficiente"
    );
  }


  // Solo tronco.
  if (
    errorTronco
  ) {
    return (
      "Exceso de inclinación del tronco"
    );
  }


  // Ningún error.
  return (
    "Correcta"
  );
}


// --------------------------------------------------
// ANALIZAR SENTADILLA
// --------------------------------------------------

export function analizarSentadilla(
  estado: EstadoSentadilla,
  hombro: PuntoSentadilla | null,
  cadera: PuntoSentadilla,
  rodilla: PuntoSentadilla,
  tobillo: PuntoSentadilla
): ResultadoSentadilla {
  // ------------------------------------------------
  // ÁNGULO DE RODILLA
  // ------------------------------------------------

  const anguloRodilla =
    calcularAnguloRodilla(
      cadera,
      rodilla,
      tobillo
    );


  // ------------------------------------------------
  // INCLINACIÓN ACTUAL DEL TRONCO
  // ------------------------------------------------

  let inclinacionTronco:
    number | null =
    null;


  if (
    hombro !==
    null
  ) {
    inclinacionTronco =
      calcularInclinacionTronco(
        hombro,
        cadera
      );
  }


  // ------------------------------------------------
  // VARIABLES DEL FRAME
  // ------------------------------------------------

  let cambioFase =
    false;


  let repeticionSumada =
    false;


  // ------------------------------------------------
  // INICIO DE REPETICIÓN
  // ------------------------------------------------

  if (
    estado.fase ===
      "arriba" &&
    anguloRodilla <=
      ANGULO_INICIO_SENTADILLA
  ) {
    estado.fase =
      "abajo";


    // Primer valor de rodilla
    // de la nueva repetición.
    estado.anguloMinimo =
      anguloRodilla;


    // Comprobamos si ya
    // ha alcanzado profundidad.
    estado.profundidadAlcanzada =
      anguloRodilla <=
      ANGULO_SENTADILLA_ABAJO;


    // Primera medición
    // de inclinación.
    estado.inclinacionTroncoMaxima =
      inclinacionTronco;


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
    // ----------------------------------------------
    // ÁNGULO MÍNIMO
    // ----------------------------------------------

    if (
      anguloRodilla <
      estado.anguloMinimo
    ) {
      estado.anguloMinimo =
        anguloRodilla;
    }


    // ----------------------------------------------
    // PROFUNDIDAD
    // ----------------------------------------------

    if (
      anguloRodilla <=
      ANGULO_SENTADILLA_ABAJO
    ) {
      estado.profundidadAlcanzada =
        true;
    }


    // ----------------------------------------------
    // INCLINACIÓN MÁXIMA
    // ----------------------------------------------

    if (
      inclinacionTronco !==
      null
    ) {
      // Primera medición válida.
      if (
        estado.inclinacionTroncoMaxima ===
        null
      ) {
        estado.inclinacionTroncoMaxima =
          inclinacionTronco;
      }

      // Nueva inclinación máxima.
      else if (
        inclinacionTronco >
        estado.inclinacionTroncoMaxima
      ) {
        estado.inclinacionTroncoMaxima =
          inclinacionTronco;
      }
    }


    // ------------------------------------------------
    // FINAL DE REPETICIÓN
    // ------------------------------------------------

    if (
      anguloRodilla >=
      ANGULO_SENTADILLA_ARRIBA
    ) {
      // Sumamos la repetición.
      estado.repeticiones =
        estado.repeticiones +
        1;


      // --------------------------------------------
      // ERROR DE PROFUNDIDAD
      // --------------------------------------------

      const errorProfundidad =
        !estado.profundidadAlcanzada;


      // --------------------------------------------
      // ERROR DE TRONCO
      // --------------------------------------------

      // Si hemos conseguido medir
      // la inclinación durante la repetición,
      // comprobamos el límite de 50°.
      //
      // Si no se pudo medir el hombro,
      // no marcamos automáticamente
      // la repetición como incorrecta.
      const errorTronco =
        estado.inclinacionTroncoMaxima !==
          null &&
        estado.inclinacionTroncoMaxima >
          INCLINACION_MAXIMA_TRONCO;


      // --------------------------------------------
      // CLASIFICACIÓN
      // --------------------------------------------

      const resultado =
        clasificarRepeticionSentadilla(
          errorProfundidad,
          errorTronco
        );


      // --------------------------------------------
      // GUARDAR EN HISTORIAL
      // --------------------------------------------

      const nuevaRepeticion:
        ResultadoRepeticionSentadilla = {
        numero:
          estado.repeticiones,

        anguloMinimo:
          estado.anguloMinimo,

        inclinacionTroncoMaxima:
          estado.inclinacionTroncoMaxima,

        profundidadCorrecta:
          !errorProfundidad,

        errorProfundidad:
          errorProfundidad,

        errorTronco:
          errorTronco,

        resultado:
          resultado
      };


      estado.historial.push(
        nuevaRepeticion
      );


      // --------------------------------------------
      // REINICIAR PARA LA SIGUIENTE
      // --------------------------------------------

      estado.fase =
        "arriba";


      estado.profundidadAlcanzada =
        false;


      estado.anguloMinimo =
        180;


      estado.inclinacionTroncoMaxima =
        null;


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


  const feedbackTronco =
    obtenerFeedbackTronco(
      inclinacionTronco
    );


  // ------------------------------------------------
  // RESULTADO DEL FRAME
  // ------------------------------------------------

  return {
    anguloRodilla:
      anguloRodilla,

    inclinacionTronco:
      inclinacionTronco,

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

    feedbackTronco:
      feedbackTronco,

    historial:
      estado.historial
  };
}


// --------------------------------------------------
// RESUMEN DE SESIÓN
// --------------------------------------------------

export function calcularResumenSesionSentadilla(
  historial:
    ResultadoRepeticionSentadilla[]
): ResumenSesionSentadilla {
  // Total de repeticiones.
  const total =
    historial.length;


  // ----------------------------------------------
  // CORRECTAS
  // ----------------------------------------------

  // Una repetición solo es correcta
  // si no tiene ninguno
  // de los errores analizados.
  const correctas =
    historial.filter(
      function (repeticion) {
        return (
          !repeticion.errorProfundidad &&
          !repeticion.errorTronco
        );
      }
    ).length;


  // ----------------------------------------------
  // PROFUNDIDAD
  // ----------------------------------------------

  const profundidadInsuficiente =
    historial.filter(
      function (repeticion) {
        return (
          repeticion.errorProfundidad
        );
      }
    ).length;


  // ----------------------------------------------
  // TRONCO
  // ----------------------------------------------

  const excesoInclinacionTronco =
    historial.filter(
      function (repeticion) {
        return (
          repeticion.errorTronco
        );
      }
    ).length;


  // ----------------------------------------------
  // PORCENTAJE CORRECTO
  // ----------------------------------------------

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
      profundidadInsuficiente,

    excesoInclinacionTronco:
      excesoInclinacionTronco
  };
}