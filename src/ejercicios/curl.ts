// --------------------------------------------------
// CONFIGURACIÓN DEL CURL
// --------------------------------------------------

// Umbral máximo permitido para el desplazamiento
// del codo.
//
// Tras las pruebas realizadas:
// - 20 % era demasiado sensible;
// - 30 % permitía demasiado movimiento;
// - 25 % ofreció el mejor equilibrio.
export const DESPLAZAMIENTO_MAXIMO_CODO =
  0.25;


// Umbral máximo permitido para el balanceo
// del tronco.
//
// Tras las pruebas realizadas:
// - 10 % era demasiado sensible;
// - 15 % permitía demasiado movimiento;
// - 13 % ofreció el mejor equilibrio.
export const DESPLAZAMIENTO_MAXIMO_HOMBRO =
  0.13;


// --------------------------------------------------
// TIPOS
// --------------------------------------------------

// Punto corporal detectado por MediaPipe.
export interface Punto {
  x: number;
  y: number;
  visibility?: number;
}


// Fases posibles del curl.
export type FaseCurl =
  "abajo" |
  "arriba";


// Posición relativa utilizada
// para comparar dos landmarks.
interface ReferenciaPosicion {
  dx: number;
  dy: number;

  // Distancia utilizada para normalizar
  // el desplazamiento.
  longitudReferencia: number;
}


// Estado interno completo del analizador.
//
// Este objeto conserva la información
// entre un frame y el siguiente.
export interface EstadoCurl {
  // Fase actual.
  fase: FaseCurl;

  // Repeticiones detectadas.
  repeticiones: number;

  // Referencia del codo respecto al hombro.
  referenciaCodo:
    ReferenciaPosicion | null;

  // Referencia del hombro respecto a la cadera.
  referenciaHombro:
    ReferenciaPosicion | null;

  // Indica si durante la repetición actual
  // se ha detectado algún error de codo.
  errorCodoRepeticion: boolean;

  // Indica si durante la repetición actual
  // se ha detectado balanceo del tronco.
  errorTroncoRepeticion: boolean;
}


// Resultado final de una repetición.
export interface ResultadoRepeticion {
  numero: number;

  errorCodo: boolean;

  errorTronco: boolean;

  resultado: string;
}


// Resultado producido después
// de analizar un único frame.
export interface ResultadoFrameCurl {
  // Ángulo actual del codo.
  anguloCodo: number;

  // Fase después de analizar el frame.
  fase: FaseCurl;

  // Mensaje relacionado con
  // el rango de movimiento.
  feedbackMovimiento: string;

  // Feedback técnico del codo.
  feedbackCodo: string;

  // Feedback técnico del tronco.
  feedbackHombro: string;

  // Desplazamiento relativo del codo.
  //
  // Ejemplo:
  // 0.25 = 25 %.
  desplazamientoCodo:
    number | null;

  // Desplazamiento relativo del hombro.
  desplazamientoHombro:
    number | null;

  // Indica si hemos pasado
  // de arriba a abajo o viceversa.
  cambioFase: boolean;

  // Indica si en este frame
  // hemos sumado una repetición.
  repeticionSumada: boolean;

  // Si acabamos de terminar completamente
  // una repetición, contiene su resultado.
  repeticionFinalizada:
    ResultadoRepeticion | null;
}


// Resumen completo de la sesión.
export interface ResumenSesion {
  total: number;

  correctas: number;

  porcentajeCorrectas: number;

  erroresCodo: number;

  erroresTronco: number;

  errorMasFrecuente: string;
}


// --------------------------------------------------
// CREAR ESTADO INICIAL
// --------------------------------------------------

// Crea un nuevo analizador de curl
// completamente limpio.
//
// Esto nos permitirá reutilizarlo más adelante
// tanto con webcam como con vídeos.
export function crearEstadoCurl():
  EstadoCurl {
  return {
    fase:
      "abajo",

    repeticiones:
      0,

    referenciaCodo:
      null,

    referenciaHombro:
      null,

    errorCodoRepeticion:
      false,

    errorTroncoRepeticion:
      false
  };
}


// --------------------------------------------------
// DISTANCIA ENTRE DOS PUNTOS
// --------------------------------------------------

// Calcula la distancia entre dos landmarks
// utilizando el teorema de Pitágoras.
export function calcularDistancia(
  a: Punto,
  b: Punto
): number {
  const diferenciaX =
    a.x - b.x;

  const diferenciaY =
    a.y - b.y;


  return Math.sqrt(
    diferenciaX * diferenciaX +
    diferenciaY * diferenciaY
  );
}


// --------------------------------------------------
// ÁNGULO DEL CODO
// --------------------------------------------------

// Calcula el ángulo:
//
// hombro -> codo -> muñeca
//
// El segundo punto es siempre
// el vértice del ángulo.
export function calcularAngulo(
  a: Punto,
  b: Punto,
  c: Punto
): number {
  const angulo1 =
    Math.atan2(
      a.y - b.y,
      a.x - b.x
    );


  const angulo2 =
    Math.atan2(
      c.y - b.y,
      c.x - b.x
    );


  let angulo =
    Math.abs(
      angulo2 -
      angulo1
    );


  // Convertimos radianes a grados.
  angulo =
    angulo *
    (180 / Math.PI);


  // Queremos siempre un resultado
  // entre 0 y 180 grados.
  if (angulo > 180) {
    angulo =
      360 - angulo;
  }


  return angulo;
}


// --------------------------------------------------
// CREAR REFERENCIA DE POSICIÓN
// --------------------------------------------------

// Guarda dónde está un punto
// respecto a otro.
//
// Ejemplo:
//
// puntoMovil = codo
// puntoBase = hombro
//
// o:
//
// puntoMovil = hombro
// puntoBase = cadera
function crearReferenciaPosicion(
  puntoMovil: Punto,
  puntoBase: Punto
): ReferenciaPosicion | null {
  const dx =
    puntoMovil.x -
    puntoBase.x;


  const dy =
    puntoMovil.y -
    puntoBase.y;


  const longitudReferencia =
    calcularDistancia(
      puntoMovil,
      puntoBase
    );


  // Evitamos referencias imposibles.
  if (longitudReferencia <= 0) {
    return null;
  }


  return {
    dx:
      dx,

    dy:
      dy,

    longitudReferencia:
      longitudReferencia
  };
}


// --------------------------------------------------
// CALCULAR DESPLAZAMIENTO
// --------------------------------------------------

// Calcula cuánto ha cambiado la posición
// respecto a una referencia.
//
// El resultado queda normalizado:
//
// 0.10 = 10 %
// 0.25 = 25 %
// 0.40 = 40 %
function calcularDesplazamientoRelativo(
  puntoMovil: Punto,
  puntoBase: Punto,
  referencia: ReferenciaPosicion
): number {
  // Posición actual.
  const dxActual =
    puntoMovil.x -
    puntoBase.x;


  const dyActual =
    puntoMovil.y -
    puntoBase.y;


  // Diferencia respecto
  // a la posición inicial.
  const cambioX =
    dxActual -
    referencia.dx;


  const cambioY =
    dyActual -
    referencia.dy;


  // Desplazamiento total.
  const desplazamiento =
    Math.sqrt(
      cambioX * cambioX +
      cambioY * cambioY
    );


  // Normalizamos el resultado para
  // que no dependa de los píxeles
  // ni de la distancia a la cámara.
  return (
    desplazamiento /
    referencia.longitudReferencia
  );
}


// --------------------------------------------------
// FEEDBACK DE MOVIMIENTO
// --------------------------------------------------

// Genera el mensaje correspondiente
// al rango de movimiento.
//
// Es importante conocer la fase porque
// el mismo ángulo significa cosas diferentes
// durante la subida y durante la bajada.
export function obtenerFeedbackMovimiento(
  anguloCodo: number,
  fase: FaseCurl
): string {
  // ------------------------------------------------
  // SUBIDA
  // ------------------------------------------------

  if (fase === "abajo") {
    // 160 grados o más.
    if (anguloCodo >= 160) {
      return "Brazo extendido";
    }


    // Entre 90 y 159 grados.
    if (anguloCodo >= 90) {
      return "Sigue flexionando";
    }


    // Entre 51 y 89 grados.
    if (anguloCodo > 50) {
      return (
        "Casi, flexiona un poco más"
      );
    }


    // 50 grados o menos.
    return "Flexión completa";
  }


  // ------------------------------------------------
  // BAJADA
  // ------------------------------------------------

  // Todavía está prácticamente arriba.
  if (anguloCodo <= 50) {
    return "Sigue bajando";
  }


  // Está realizando la bajada.
  if (anguloCodo < 160) {
    return "Casi estás abajo";
  }


  // Posición inferior completada.
  return "Brazo extendido";
}


// --------------------------------------------------
// CLASIFICAR UNA REPETICIÓN
// --------------------------------------------------

// Genera el resultado final
// utilizando todos los errores registrados
// durante la repetición.
function clasificarRepeticion(
  numero: number,
  errorCodo: boolean,
  errorTronco: boolean
): ResultadoRepeticion {
  let resultado =
    "Correcta";


  // Se detectaron los dos errores.
  if (
    errorCodo &&
    errorTronco
  ) {
    resultado =
      "Error de codo + balanceo de tronco";
  }

  // Solo error de codo.
  else if (errorCodo) {
    resultado =
      "Error de codo";
  }

  // Solo balanceo.
  else if (errorTronco) {
    resultado =
      "Balanceo de tronco";
  }


  return {
    numero:
      numero,

    errorCodo:
      errorCodo,

    errorTronco:
      errorTronco,

    resultado:
      resultado
  };
}


// --------------------------------------------------
// ANALIZAR UN FRAME DEL CURL
// --------------------------------------------------

// Esta es la función principal del archivo.
//
// Recibe:
//
// - estado del curl;
// - hombro;
// - codo;
// - muñeca;
// - cadera.
//
// Y devuelve toda la información
// necesaria para la interfaz.
//
// IMPORTANTE:
//
// Esta función NO sabe si la imagen
// procede de una webcam o de un vídeo.
//
// Ese desacoplamiento es precisamente
// lo que queremos conseguir con la refactorización.
export function analizarFrameCurl(
  estado: EstadoCurl,
  hombro: Punto,
  codo: Punto,
  muneca: Punto,
  cadera: Punto | null
): ResultadoFrameCurl {
  // Guardamos la fase existente al empezar
  // a analizar este frame.
  const faseAntes =
    estado.fase;


  // --------------------------------------------------
  // ÁNGULO
  // --------------------------------------------------

  const anguloCodo =
    calcularAngulo(
      hombro,
      codo,
      muneca
    );


  // Calculamos el feedback antes
  // de cambiar la fase.
  //
  // Así conservamos el comportamiento
  // que ya habíamos probado.
  const feedbackMovimiento =
    obtenerFeedbackMovimiento(
      anguloCodo,
      faseAntes
    );


  // --------------------------------------------------
  // ANÁLISIS DEL CODO
  // --------------------------------------------------

  let feedbackCodo =
    "Codo estable";


  let desplazamientoCodo:
    number | null =
    null;


  // Con el brazo extendido calibramos
  // la posición inicial.
  if (anguloCodo >= 160) {
    // Calibramos:
    //
    // - la primera vez;
    // - cuando terminamos una repetición.
    if (
      estado.referenciaCodo === null ||
      faseAntes === "arriba"
    ) {
      estado.referenciaCodo =
        crearReferenciaPosicion(
          codo,
          hombro
        );
    }


    desplazamientoCodo =
      0;


    feedbackCodo =
      "Codo estable";
  }

  // Todavía no existe referencia.
  else if (
    estado.referenciaCodo === null
  ) {
    feedbackCodo =
      "Extiende el brazo para calibrar el codo";
  }

  // Ya podemos analizarlo.
  else {
    desplazamientoCodo =
      calcularDesplazamientoRelativo(
        codo,
        hombro,
        estado.referenciaCodo
      );


    if (
      desplazamientoCodo >
      DESPLAZAMIENTO_MAXIMO_CODO
    ) {
      feedbackCodo =
        "Mantén el codo estable";


      // Guardamos el error hasta
      // terminar la repetición.
      estado.errorCodoRepeticion =
        true;
    } else {
      feedbackCodo =
        "Codo estable";
    }
  }


  // --------------------------------------------------
  // ANÁLISIS DEL TRONCO
  // --------------------------------------------------

  let feedbackHombro =
    "Tronco estable";


  let desplazamientoHombro:
    number | null =
    null;


  // Si MediaPipe no ve correctamente
  // la cadera no podemos analizar el torso.
  //
  // El curl seguirá contando igualmente.
  if (cadera === null) {
    feedbackHombro =
      "Asegúrate de que la cadera sea visible";
  }

  // Brazo extendido:
  // calibramos hombro respecto a cadera.
  else if (anguloCodo >= 160) {
    if (
      estado.referenciaHombro === null ||
      faseAntes === "arriba"
    ) {
      estado.referenciaHombro =
        crearReferenciaPosicion(
          hombro,
          cadera
        );
    }


    desplazamientoHombro =
      0;


    feedbackHombro =
      "Tronco estable";
  }

  // Todavía no existe referencia.
  else if (
    estado.referenciaHombro === null
  ) {
    feedbackHombro =
      "Extiende el brazo para calibrar el tronco";
  }

  // Analizamos el balanceo.
  else {
    desplazamientoHombro =
      calcularDesplazamientoRelativo(
        hombro,
        cadera,
        estado.referenciaHombro
      );


    if (
      desplazamientoHombro >
      DESPLAZAMIENTO_MAXIMO_HOMBRO
    ) {
      feedbackHombro =
        "Evita balancear el tronco";


      // Guardamos el error durante
      // toda la repetición.
      estado.errorTroncoRepeticion =
        true;
    } else {
      feedbackHombro =
        "Tronco estable";
    }
  }


  // --------------------------------------------------
  // EVENTOS DEL MOVIMIENTO
  // --------------------------------------------------

  let cambioFase =
    false;


  let repeticionSumada =
    false;


  let repeticionFinalizada:
    ResultadoRepeticion | null =
    null;


  // --------------------------------------------------
  // VUELTA ABAJO
  // --------------------------------------------------

  // Al llegar a 160 grados
  // después de haber estado arriba,
  // consideramos terminada toda la repetición.
  if (anguloCodo >= 160) {
    if (
      estado.fase === "arriba"
    ) {
      // Guardamos el resultado completo
      // antes de limpiar los errores.
      repeticionFinalizada =
        clasificarRepeticion(
          estado.repeticiones,
          estado.errorCodoRepeticion,
          estado.errorTroncoRepeticion
        );


      // Limpiamos los errores para
      // preparar la siguiente repetición.
      estado.errorCodoRepeticion =
        false;

      estado.errorTroncoRepeticion =
        false;


      // Cambiamos de fase.
      estado.fase =
        "abajo";


      cambioFase =
        true;
    } else {
      // Permanecemos abajo.
      estado.fase =
        "abajo";
    }
  }


  // --------------------------------------------------
  // LLEGADA ARRIBA
  // --------------------------------------------------

  // 50 grados o menos completa la subida.
  //
  // Solo se cuenta si veníamos
  // de la fase inferior.
  if (
    anguloCodo <= 50 &&
    estado.fase === "abajo"
  ) {
    estado.fase =
      "arriba";


    estado.repeticiones =
      estado.repeticiones + 1;


    cambioFase =
      true;


    repeticionSumada =
      true;
  }


  // --------------------------------------------------
  // RESULTADO DEL FRAME
  // --------------------------------------------------

  return {
    anguloCodo:
      anguloCodo,

    fase:
      estado.fase,

    feedbackMovimiento:
      feedbackMovimiento,

    feedbackCodo:
      feedbackCodo,

    feedbackHombro:
      feedbackHombro,

    desplazamientoCodo:
      desplazamientoCodo,

    desplazamientoHombro:
      desplazamientoHombro,

    cambioFase:
      cambioFase,

    repeticionSumada:
      repeticionSumada,

    repeticionFinalizada:
      repeticionFinalizada
  };
}


// --------------------------------------------------
// RESUMEN DE SESIÓN
// --------------------------------------------------

// Calcula todas las estadísticas
// utilizando únicamente el historial.
//
// También es totalmente independiente
// de la cámara.
export function calcularResumenSesion(
  historial: ResultadoRepeticion[]
): ResumenSesion {
  // Número total de repeticiones
  // completamente analizadas.
  const total =
    historial.length;


  // Repeticiones sin ningún error.
  const correctas =
    historial.filter(
      function (repeticion) {
        return (
          !repeticion.errorCodo &&
          !repeticion.errorTronco
        );
      }
    ).length;


  // Repeticiones en las que
  // apareció error de codo.
  const erroresCodo =
    historial.filter(
      function (repeticion) {
        return (
          repeticion.errorCodo
        );
      }
    ).length;


  // Repeticiones donde apareció
  // balanceo del tronco.
  const erroresTronco =
    historial.filter(
      function (repeticion) {
        return (
          repeticion.errorTronco
        );
      }
    ).length;


  // Evitamos dividir entre cero
  // antes de realizar la primera repetición.
  let porcentajeCorrectas =
    0;


  if (total > 0) {
    porcentajeCorrectas =
      Math.round(
        (correctas / total) *
        100
      );
  }


  // Por defecto no existe
  // un error más frecuente.
  let errorMasFrecuente =
    "Ninguno";


  // Predominan errores del codo.
  if (
    erroresCodo >
    erroresTronco
  ) {
    errorMasFrecuente =
      "Desplazamiento del codo";
  }


  // Predomina el balanceo.
  if (
    erroresTronco >
    erroresCodo
  ) {
    errorMasFrecuente =
      "Balanceo del tronco";
  }


  // Hay empate entre los dos errores.
  if (
    erroresCodo ===
      erroresTronco &&
    erroresCodo > 0
  ) {
    errorMasFrecuente =
      "Codo y tronco por igual";
  }


  return {
    total:
      total,

    correctas:
      correctas,

    porcentajeCorrectas:
      porcentajeCorrectas,

    erroresCodo:
      erroresCodo,

    erroresTronco:
      erroresTronco,

    errorMasFrecuente:
      errorMasFrecuente
  };
}