// --------------------------------------------------
// PRESS DE HOMBRO
// --------------------------------------------------
//
// El press de hombro se analiza
// con la cámara situada DE FRENTE.
//
// Analizamos simultáneamente:
//
// IZQUIERDO
// 11 -> hombro
// 13 -> codo
// 15 -> muñeca
//
// DERECHO
// 12 -> hombro
// 14 -> codo
// 16 -> muñeca
//
// Actualmente analizamos:
//
// - ángulo de ambos codos;
// - posición baja;
// - posición alta;
// - conteo bilateral;
// - diferencia angular;
// - simetría durante toda la repetición;
// - historial;
// - resumen de sesión.
// --------------------------------------------------


// --------------------------------------------------
// UMBRALES DE MOVIMIENTO
// --------------------------------------------------

// Posición baja observada
// durante las pruebas:
// aproximadamente 50°.
//
// Dejamos margen hasta 60°.
export const ANGULO_PRESS_ABAJO =
  60;


// Posición alta observada:
// aproximadamente 150°.
//
// Dejamos margen desde 140°.
export const ANGULO_PRESS_ARRIBA =
  140;


// --------------------------------------------------
// UMBRALES DE SIMETRÍA
// --------------------------------------------------

// Durante las repeticiones correctas
// observamos diferencias inferiores a 10°.
//
// Dejamos un margen hasta 15°.
export const DIFERENCIA_MAXIMA_BRAZOS =
  15;


// No queremos considerar incorrecta
// una repetición por un único frame.
//
// La diferencia superior a 15°
// tendrá que aparecer al menos
// durante el 20 % de la repetición.
export const PORCENTAJE_MAXIMO_DESCOMPENSADO =
  20;


// --------------------------------------------------
// PUNTO
// --------------------------------------------------

export interface PuntoPressHombro {
  x: number;

  y: number;

  visibility?: number;
}


// --------------------------------------------------
// FASE
// --------------------------------------------------

export type FasePressHombro =
  "esperando" |
  "abajo" |
  "arriba";


// --------------------------------------------------
// RESULTADO DE UNA REPETICIÓN
// --------------------------------------------------

export interface ResultadoRepeticionPress {
  // Número de repetición.
  numero: number;

  // Diferencia angular media
  // durante toda la repetición.
  diferenciaMedia: number;

  // Mayor diferencia detectada.
  diferenciaMaxima: number;

  // Porcentaje de frames
  // donde se superaron los 15°.
  porcentajeDescompensado: number;

  // Indica si consideramos
  // que existe una descompensación real.
  errorSimetria: boolean;

  // Clasificación final.
  resultado:
    "Correcta" |
    "Descompensación entre brazos";
}


// --------------------------------------------------
// ESTADO INTERNO
// --------------------------------------------------

export interface EstadoPressHombro {
  fase: FasePressHombro;

  repeticiones: number;


  // ----------------------------------------------
  // DATOS DE LA REPETICIÓN ACTUAL
  // ----------------------------------------------

  // Número de frames analizados.
  framesAnalizados: number;

  // Número de frames donde
  // la diferencia superó 15°.
  framesDescompensados: number;

  // Suma de las diferencias.
  //
  // Nos permitirá calcular
  // la diferencia media.
  sumaDiferencias: number;

  // Mayor diferencia observada.
  diferenciaMaxima: number;


  // ----------------------------------------------
  // HISTORIAL
  // ----------------------------------------------

  historial:
    ResultadoRepeticionPress[];
}


// --------------------------------------------------
// RESULTADO DE UN FRAME
// --------------------------------------------------

export interface ResultadoPressHombro {
  anguloCodoIzquierdo: number;

  anguloCodoDerecho: number;

  diferenciaAngular: number;

  fase: FasePressHombro;

  repeticiones: number;

  cambioFase: boolean;

  posicionBajaAlcanzada: boolean;

  posicionAltaAlcanzada: boolean;

  repeticionSumada: boolean;

  feedbackMovimiento: string;

  feedbackSimetria: string;

  historial:
    ResultadoRepeticionPress[];
}


// --------------------------------------------------
// RESUMEN DE SESIÓN
// --------------------------------------------------

export interface ResumenSesionPress {
  total: number;

  correctas: number;

  descompensadas: number;

  porcentajeCorrectas: number;
}


// --------------------------------------------------
// CREAR ESTADO
// --------------------------------------------------

export function crearEstadoPressHombro():
  EstadoPressHombro {
  return {
    fase:
      "esperando",

    repeticiones:
      0,

    framesAnalizados:
      0,

    framesDescompensados:
      0,

    sumaDiferencias:
      0,

    diferenciaMaxima:
      0,

    historial:
      []
  };
}


// --------------------------------------------------
// REINICIAR DATOS DE UNA REPETICIÓN
// --------------------------------------------------

export function reiniciarDatosRepeticion(
  estado: EstadoPressHombro
) {
  estado.framesAnalizados =
    0;


  estado.framesDescompensados =
    0;


  estado.sumaDiferencias =
    0;


  estado.diferenciaMaxima =
    0;
}


// --------------------------------------------------
// CALCULAR ÁNGULO
// --------------------------------------------------

export function calcularAnguloCodoPress(
  hombro: PuntoPressHombro,
  codo: PuntoPressHombro,
  muneca: PuntoPressHombro
): number {
  const angulo1 =
    Math.atan2(
      hombro.y - codo.y,
      hombro.x - codo.x
    );


  const angulo2 =
    Math.atan2(
      muneca.y - codo.y,
      muneca.x - codo.x
    );


  let angulo =
    Math.abs(
      angulo2 -
      angulo1
    );


  angulo =
    angulo *
    (180 / Math.PI);


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
// REGISTRAR SIMETRÍA DEL FRAME
// --------------------------------------------------

function registrarSimetriaFrame(
  estado: EstadoPressHombro,
  diferenciaAngular: number
) {
  // Añadimos un frame
  // a la repetición actual.
  estado.framesAnalizados =
    estado.framesAnalizados +
    1;


  // Sumamos la diferencia
  // para calcular después
  // la media.
  estado.sumaDiferencias =
    estado.sumaDiferencias +
    diferenciaAngular;


  // Comprobamos si este frame
  // supera los 15°.
  if (
    diferenciaAngular >
    DIFERENCIA_MAXIMA_BRAZOS
  ) {
    estado.framesDescompensados =
      estado.framesDescompensados +
      1;
  }


  // Guardamos también
  // la diferencia máxima.
  if (
    diferenciaAngular >
    estado.diferenciaMaxima
  ) {
    estado.diferenciaMaxima =
      diferenciaAngular;
  }
}


// --------------------------------------------------
// FEEDBACK INSTANTÁNEO DE SIMETRÍA
// --------------------------------------------------

// Este mensaje sí utiliza
// el frame actual.
//
// Sirve para dar feedback inmediato,
// pero NO clasifica por sí solo
// la repetición final.
export function obtenerFeedbackSimetria(
  diferenciaAngular: number
): string {
  if (
    diferenciaAngular <=
    DIFERENCIA_MAXIMA_BRAZOS
  ) {
    return (
      "Movimiento simétrico"
    );
  }


  return (
    "Intenta mover ambos brazos al mismo nivel"
  );
}


// --------------------------------------------------
// FEEDBACK DE MOVIMIENTO
// --------------------------------------------------

export function obtenerFeedbackMovimientoPress(
  fase: FasePressHombro,
  posicionBajaAlcanzada: boolean,
  posicionAltaAlcanzada: boolean,
  repeticionSumada: boolean
): string {
  if (
    repeticionSumada
  ) {
    return (
      "Repetición completa"
    );
  }


  if (
    posicionAltaAlcanzada
  ) {
    return (
      "Posición alta alcanzada"
    );
  }


  if (
    posicionBajaAlcanzada
  ) {
    return (
      "Posición inicial preparada"
    );
  }


  if (
    fase ===
    "esperando"
  ) {
    return (
      "Coloca ambos brazos en posición baja"
    );
  }


  if (
    fase ===
    "abajo"
  ) {
    return (
      "Sube ambos brazos"
    );
  }


  return (
    "Baja ambos brazos"
  );
}


// --------------------------------------------------
// ANALIZAR PRESS
// --------------------------------------------------

export function analizarPressHombro(
  estado: EstadoPressHombro,

  hombroIzquierdo: PuntoPressHombro,
  codoIzquierdo: PuntoPressHombro,
  munecaIzquierda: PuntoPressHombro,

  hombroDerecho: PuntoPressHombro,
  codoDerecho: PuntoPressHombro,
  munecaDerecha: PuntoPressHombro
): ResultadoPressHombro {
  // ------------------------------------------------
  // ÁNGULO IZQUIERDO
  // ------------------------------------------------

  const anguloCodoIzquierdo =
    calcularAnguloCodoPress(
      hombroIzquierdo,
      codoIzquierdo,
      munecaIzquierda
    );


  // ------------------------------------------------
  // ÁNGULO DERECHO
  // ------------------------------------------------

  const anguloCodoDerecho =
    calcularAnguloCodoPress(
      hombroDerecho,
      codoDerecho,
      munecaDerecha
    );


  // ------------------------------------------------
  // DIFERENCIA
  // ------------------------------------------------

  const diferenciaAngular =
    Math.abs(
      anguloCodoIzquierdo -
      anguloCodoDerecho
    );


  // ------------------------------------------------
  // POSICIONES
  // ------------------------------------------------

  const ambosAbajo =
    anguloCodoIzquierdo <=
      ANGULO_PRESS_ABAJO &&
    anguloCodoDerecho <=
      ANGULO_PRESS_ABAJO;


  const ambosArriba =
    anguloCodoIzquierdo >=
      ANGULO_PRESS_ARRIBA &&
    anguloCodoDerecho >=
      ANGULO_PRESS_ARRIBA;


  // ------------------------------------------------
  // EVENTOS
  // ------------------------------------------------

  let cambioFase =
    false;


  let posicionBajaAlcanzada =
    false;


  let posicionAltaAlcanzada =
    false;


  let repeticionSumada =
    false;


  // ------------------------------------------------
  // POSICIÓN INICIAL
  // ------------------------------------------------

  if (
    estado.fase ===
      "esperando" &&
    ambosAbajo
  ) {
    estado.fase =
      "abajo";


    // Empezamos una repetición
    // completamente limpia.
    reiniciarDatosRepeticion(
      estado
    );


    cambioFase =
      true;


    posicionBajaAlcanzada =
      true;
  }


  // ------------------------------------------------
  // ANALIZAR SIMETRÍA
  // ------------------------------------------------

  // Cuando ya hemos confirmado
  // la posición inicial,
  // guardamos datos de simetría
  // durante toda la repetición.
  else if (
    estado.fase !==
    "esperando"
  ) {
    registrarSimetriaFrame(
      estado,
      diferenciaAngular
    );


    // ----------------------------------------------
    // LLEGAR ARRIBA
    // ----------------------------------------------

    if (
      estado.fase ===
        "abajo" &&
      ambosArriba
    ) {
      estado.fase =
        "arriba";


      cambioFase =
        true;


      posicionAltaAlcanzada =
        true;
    }


    // ----------------------------------------------
    // VOLVER ABAJO
    // ----------------------------------------------

    else if (
      estado.fase ===
        "arriba" &&
      ambosAbajo
    ) {
      // ============================================
      // REPETICIÓN COMPLETA
      // ============================================

      estado.repeticiones =
        estado.repeticiones +
        1;


      // --------------------------------------------
      // DIFERENCIA MEDIA
      // --------------------------------------------

      const diferenciaMedia =
        estado.framesAnalizados ===
        0
          ? 0
          : estado.sumaDiferencias /
            estado.framesAnalizados;


      // --------------------------------------------
      // PORCENTAJE DESCOMPENSADO
      // --------------------------------------------

      const porcentajeDescompensado =
        estado.framesAnalizados ===
        0
          ? 0
          : (
              estado.framesDescompensados /
              estado.framesAnalizados
            ) *
            100;


      // --------------------------------------------
      // CLASIFICACIÓN
      // --------------------------------------------

      // Solo consideramos error técnico
      // si la diferencia superior a 15°
      // se ha mantenido durante
      // al menos el 20 % de la repetición.
      const errorSimetria =
        porcentajeDescompensado >=
        PORCENTAJE_MAXIMO_DESCOMPENSADO;


      const resultado:
        ResultadoRepeticionPress["resultado"] =
        errorSimetria
          ? "Descompensación entre brazos"
          : "Correcta";


      // --------------------------------------------
      // GUARDAR REPETICIÓN
      // --------------------------------------------

      const nuevaRepeticion:
        ResultadoRepeticionPress = {
        numero:
          estado.repeticiones,

        diferenciaMedia:
          diferenciaMedia,

        diferenciaMaxima:
          estado.diferenciaMaxima,

        porcentajeDescompensado:
          porcentajeDescompensado,

        errorSimetria:
          errorSimetria,

        resultado:
          resultado
      };


      estado.historial.push(
        nuevaRepeticion
      );


      // --------------------------------------------
      // PREPARAR SIGUIENTE REPETICIÓN
      // --------------------------------------------

      // Nos encontramos de nuevo
      // abajo, por tanto ya estamos
      // preparados para la siguiente.
      estado.fase =
        "abajo";


      // Reiniciamos únicamente
      // los datos técnicos
      // de la siguiente repetición.
      reiniciarDatosRepeticion(
        estado
      );


      cambioFase =
        true;


      posicionBajaAlcanzada =
        true;


      repeticionSumada =
        true;
    }
  }


  // ------------------------------------------------
  // FEEDBACK
  // ------------------------------------------------

  const feedbackMovimiento =
    obtenerFeedbackMovimientoPress(
      estado.fase,
      posicionBajaAlcanzada,
      posicionAltaAlcanzada,
      repeticionSumada
    );


  const feedbackSimetria =
    obtenerFeedbackSimetria(
      diferenciaAngular
    );


  // ------------------------------------------------
  // RESULTADO
  // ------------------------------------------------

  return {
    anguloCodoIzquierdo:
      anguloCodoIzquierdo,

    anguloCodoDerecho:
      anguloCodoDerecho,

    diferenciaAngular:
      diferenciaAngular,

    fase:
      estado.fase,

    repeticiones:
      estado.repeticiones,

    cambioFase:
      cambioFase,

    posicionBajaAlcanzada:
      posicionBajaAlcanzada,

    posicionAltaAlcanzada:
      posicionAltaAlcanzada,

    repeticionSumada:
      repeticionSumada,

    feedbackMovimiento:
      feedbackMovimiento,

    feedbackSimetria:
      feedbackSimetria,

    historial:
      estado.historial
  };
}


// --------------------------------------------------
// RESUMEN DE SESIÓN
// --------------------------------------------------

export function calcularResumenSesionPress(
  historial:
    ResultadoRepeticionPress[]
): ResumenSesionPress {
  const total =
    historial.length;


  const correctas =
    historial.filter(
      function (repeticion) {
        return (
          !repeticion.errorSimetria
        );
      }
    ).length;


  const descompensadas =
    historial.filter(
      function (repeticion) {
        return (
          repeticion.errorSimetria
        );
      }
    ).length;


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

    descompensadas:
      descompensadas,

    porcentajeCorrectas:
      porcentajeCorrectas
  };
}