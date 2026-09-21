// --------------------------------------------------
// CONFIGURACIÓN DEL CURL
// --------------------------------------------------

// Valores que utilizamos para el análisis
// mediante cámara en directo.
//
// Estos valores fueron calibrados
// experimentalmente durante las pruebas.
export const DESPLAZAMIENTO_MAXIMO_CODO =
  0.25;

export const DESPLAZAMIENTO_MAXIMO_HOMBRO =
  0.13;


// --------------------------------------------------
// TIPO DE CONFIGURACIÓN
// --------------------------------------------------

// Permite que el mismo algoritmo del curl
// utilice diferentes tolerancias dependiendo
// de la fuente de imagen.
//
// Por ejemplo:
//
// cámara -> landmarks más estables;
// vídeo  -> algo más de tolerancia.
export interface ConfiguracionCurl {
  desplazamientoMaximoCodo: number;

  desplazamientoMaximoHombro: number;
}


// --------------------------------------------------
// CONFIGURACIÓN PARA CÁMARA
// --------------------------------------------------

// Es la configuración que se utilizará
// por defecto si no especificamos otra.
export const CONFIGURACION_CURL_CAMARA:
  ConfiguracionCurl = {
    desplazamientoMaximoCodo:
      DESPLAZAMIENTO_MAXIMO_CODO,

    desplazamientoMaximoHombro:
      DESPLAZAMIENTO_MAXIMO_HOMBRO
  };


// --------------------------------------------------
// CONFIGURACIÓN PARA VÍDEO
// --------------------------------------------------

// En vídeo damos algo más de tolerancia
// debido a:
//
// - compresión;
// - desenfoque de movimiento;
// - FPS;
// - calidad del vídeo;
// - pequeñas variaciones de MediaPipe.
//
// Estos valores son iniciales.
// Después los probaremos y calibraremos.
export const CONFIGURACION_CURL_VIDEO:
  ConfiguracionCurl = {
    desplazamientoMaximoCodo:
      0.30,

    desplazamientoMaximoHombro:
      0.16
  };


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


// Estado interno completo del curl.
//
// Este estado permanece entre frames.
export interface EstadoCurl {
  // Fase actual.
  fase: FaseCurl;

  // Número de repeticiones detectadas.
  repeticiones: number;

  // Referencia del codo
  // respecto al hombro.
  referenciaCodo:
    ReferenciaPosicion | null;

  // Referencia del hombro
  // respecto a la cadera.
  referenciaHombro:
    ReferenciaPosicion | null;

  // Indica si durante la repetición
  // se ha detectado error de codo.
  errorCodoRepeticion: boolean;

  // Indica si durante la repetición
  // se ha detectado balanceo.
  errorTroncoRepeticion: boolean;
}


// Resultado final
// de una repetición.
export interface ResultadoRepeticion {
  numero: number;

  errorCodo: boolean;

  errorTronco: boolean;

  resultado: string;
}


// Resultado producido al analizar
// un único frame.
export interface ResultadoFrameCurl {
  // Ángulo actual del codo.
  anguloCodo: number;

  // Fase actual.
  fase: FaseCurl;

  // Feedback del rango
  // de movimiento.
  feedbackMovimiento: string;

  // Feedback técnico del codo.
  feedbackCodo: string;

  // Feedback técnico del tronco.
  feedbackHombro: string;

  // Desplazamiento relativo del codo.
  //
  // Ejemplo:
  //
  // 0.25 = 25 %.
  desplazamientoCodo:
    number | null;

  // Desplazamiento relativo del hombro.
  desplazamientoHombro:
    number | null;

  // Indica si hemos cambiado
  // de fase.
  cambioFase: boolean;

  // Indica si se ha sumado
  // una repetición.
  repeticionSumada: boolean;

  // Resultado de la repetición
  // cuando se completa todo el ciclo.
  repeticionFinalizada:
    ResultadoRepeticion | null;
}


// Resumen completo
// de una sesión.
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

// Crea un estado nuevo
// completamente limpio.
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
// DISTANCIA
// --------------------------------------------------

// Calcula la distancia
// entre dos puntos.
export function calcularDistancia(
  a: Punto,
  b: Punto
): number {
  const diferenciaX =
    a.x - b.x;


  const diferenciaY =
    a.y - b.y;


  return Math.sqrt(
    diferenciaX *
      diferenciaX +
    diferenciaY *
      diferenciaY
  );
}


// --------------------------------------------------
// ÁNGULO
// --------------------------------------------------

// Calcula el ángulo:
//
// hombro -> codo -> muñeca.
//
// El segundo punto es
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


  // Convertimos radianes
  // a grados.
  angulo =
    angulo *
    (180 / Math.PI);


  // Queremos un ángulo
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

// Guarda la posición relativa
// de un landmark respecto a otro.
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


  // Evitamos referencias
  // imposibles.
  if (
    longitudReferencia <=
    0
  ) {
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
// DESPLAZAMIENTO RELATIVO
// --------------------------------------------------

// Calcula cuánto se ha movido
// un punto respecto a su referencia.
//
// El resultado está normalizado:
//
// 0.10 -> 10 %
// 0.25 -> 25 %
// 0.40 -> 40 %
function calcularDesplazamientoRelativo(
  puntoMovil: Punto,
  puntoBase: Punto,
  referencia: ReferenciaPosicion
): number {
  // Posición relativa actual.
  const dxActual =
    puntoMovil.x -
    puntoBase.x;


  const dyActual =
    puntoMovil.y -
    puntoBase.y;


  // Diferencia respecto
  // a la referencia.
  const cambioX =
    dxActual -
    referencia.dx;


  const cambioY =
    dyActual -
    referencia.dy;


  // Desplazamiento total.
  const desplazamiento =
    Math.sqrt(
      cambioX *
        cambioX +
      cambioY *
        cambioY
    );


  // Normalizamos.
  return (
    desplazamiento /
    referencia.longitudReferencia
  );
}


// --------------------------------------------------
// FEEDBACK DEL MOVIMIENTO
// --------------------------------------------------

// Genera el mensaje correspondiente
// al rango de movimiento.
export function obtenerFeedbackMovimiento(
  anguloCodo: number,
  fase: FaseCurl
): string {
  // ------------------------------------------------
  // SUBIDA
  // ------------------------------------------------

  if (
    fase ===
    "abajo"
  ) {
    // Brazo extendido.
    if (
      anguloCodo >=
      160
    ) {
      return (
        "Brazo extendido"
      );
    }


    // Primera mitad
    // de la flexión.
    if (
      anguloCodo >=
      90
    ) {
      return (
        "Sigue flexionando"
      );
    }


    // Cerca del final.
    if (
      anguloCodo >
      50
    ) {
      return (
        "Casi, flexiona un poco más"
      );
    }


    // Flexión completa.
    return (
      "Flexión completa"
    );
  }


  // ------------------------------------------------
  // BAJADA
  // ------------------------------------------------

  if (
    anguloCodo <=
    50
  ) {
    return (
      "Sigue bajando"
    );
  }


  if (
    anguloCodo <
    160
  ) {
    return (
      "Casi estás abajo"
    );
  }


  return (
    "Brazo extendido"
  );
}


// --------------------------------------------------
// CLASIFICAR REPETICIÓN
// --------------------------------------------------

// Genera el resultado final
// de una repetición.
function clasificarRepeticion(
  numero: number,
  errorCodo: boolean,
  errorTronco: boolean
): ResultadoRepeticion {
  // Por defecto suponemos
  // que es correcta.
  let resultado =
    "Correcta";


  // Ambos errores.
  if (
    errorCodo &&
    errorTronco
  ) {
    resultado =
      "Error de codo + balanceo de tronco";
  }

  // Solo error de codo.
  else if (
    errorCodo
  ) {
    resultado =
      "Error de codo";
  }

  // Solo balanceo.
  else if (
    errorTronco
  ) {
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
// ANALIZAR FRAME DEL CURL
// --------------------------------------------------

// Esta función contiene toda
// la lógica del ejercicio.
//
// Puede utilizarse desde:
//
// - cámara;
// - vídeo;
// - cualquier futura fuente.
//
// El último parámetro permite utilizar
// diferentes tolerancias.
//
// Si NO enviamos configuración,
// utilizamos automáticamente
// la configuración de cámara.
export function analizarFrameCurl(
  estado: EstadoCurl,
  hombro: Punto,
  codo: Punto,
  muneca: Punto,
  cadera: Punto | null,
  configuracion:
    ConfiguracionCurl =
    CONFIGURACION_CURL_CAMARA
): ResultadoFrameCurl {
  // Guardamos la fase
  // existente al empezar.
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


  // Calculamos el feedback
  // antes de cambiar de fase.
  const feedbackMovimiento =
    obtenerFeedbackMovimiento(
      anguloCodo,
      faseAntes
    );


  // --------------------------------------------------
  // ANÁLISIS DEL CODO
  // --------------------------------------------------

  let feedbackCodo:
    string;


  let desplazamientoCodo:
    number | null =
    null;


  // Con brazo extendido
  // calibramos la referencia.
  if (
    anguloCodo >=
    160
  ) {
    // Calibramos:
    //
    // - la primera vez;
    // - cuando terminamos
    //   una repetición.
    if (
      estado.referenciaCodo ===
        null ||
      faseAntes ===
        "arriba"
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

  // Todavía no existe
  // referencia.
  else if (
    estado.referenciaCodo ===
    null
  ) {
    feedbackCodo =
      "Extiende el brazo para calibrar el codo";
  }

  // Analizamos normalmente.
  else {
    desplazamientoCodo =
      calcularDesplazamientoRelativo(
        codo,
        hombro,
        estado.referenciaCodo
      );


    // IMPORTANTE:
    //
    // Ya no utilizamos aquí
    // directamente 25 %.
    //
    // Utilizamos el valor
    // recibido en la configuración.
    if (
      desplazamientoCodo >
      configuracion
        .desplazamientoMaximoCodo
    ) {
      feedbackCodo =
        "Mantén el codo estable";


      // Guardamos el error
      // durante toda la repetición.
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

  let feedbackHombro:
    string;


  let desplazamientoHombro:
    number | null =
    null;


  // Si MediaPipe no puede ver
  // correctamente la cadera,
  // no evaluamos el tronco.
  if (
    cadera ===
    null
  ) {
    feedbackHombro =
      "Asegúrate de que la cadera sea visible";
  }

  // Calibramos con
  // el brazo extendido.
  else if (
    anguloCodo >=
    160
  ) {
    if (
      estado.referenciaHombro ===
        null ||
      faseAntes ===
        "arriba"
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

  // Todavía no existe
  // referencia.
  else if (
    estado.referenciaHombro ===
    null
  ) {
    feedbackHombro =
      "Extiende el brazo para calibrar el tronco";
  }

  // Analizamos normalmente.
  else {
    desplazamientoHombro =
      calcularDesplazamientoRelativo(
        hombro,
        cadera,
        estado.referenciaHombro
      );


    // Utilizamos el límite
    // correspondiente a la fuente.
    if (
      desplazamientoHombro >
      configuracion
        .desplazamientoMaximoHombro
    ) {
      feedbackHombro =
        "Evita balancear el tronco";


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

  if (
    anguloCodo >=
    160
  ) {
    if (
      estado.fase ===
      "arriba"
    ) {
      // Hemos completado
      // subida + bajada.
      repeticionFinalizada =
        clasificarRepeticion(
          estado.repeticiones,
          estado.errorCodoRepeticion,
          estado.errorTroncoRepeticion
        );


      // Limpiamos errores.
      estado.errorCodoRepeticion =
        false;


      estado.errorTroncoRepeticion =
        false;


      // Volvemos abajo.
      estado.fase =
        "abajo";


      cambioFase =
        true;

    } else {
      estado.fase =
        "abajo";
    }
  }


  // --------------------------------------------------
  // LLEGADA ARRIBA
  // --------------------------------------------------

  if (
    anguloCodo <=
      50 &&
    estado.fase ===
      "abajo"
  ) {
    estado.fase =
      "arriba";


    estado.repeticiones =
      estado.repeticiones +
      1;


    cambioFase =
      true;


    repeticionSumada =
      true;
  }


  // --------------------------------------------------
  // DEVOLVER RESULTADO
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

export function calcularResumenSesion(
  historial:
    ResultadoRepeticion[]
): ResumenSesion {
  // Número total de repeticiones
  // completamente analizadas.
  const total =
    historial.length;


  // Repeticiones correctas.
  const correctas =
    historial.filter(
      function (repeticion) {
        return (
          !repeticion.errorCodo &&
          !repeticion.errorTronco
        );
      }
    ).length;


  // Errores de codo.
  const erroresCodo =
    historial.filter(
      function (repeticion) {
        return (
          repeticion.errorCodo
        );
      }
    ).length;


  // Balanceos.
  const erroresTronco =
    historial.filter(
      function (repeticion) {
        return (
          repeticion.errorTronco
        );
      }
    ).length;


  // Porcentaje de técnica correcta.
  let porcentajeCorrectas =
    0;


  if (
    total >
    0
  ) {
    porcentajeCorrectas =
      Math.round(
        (
          correctas /
          total
        ) *
        100
      );
  }


  // Error más frecuente.
  let errorMasFrecuente =
    "Ninguno";


  if (
    erroresCodo >
    erroresTronco
  ) {
    errorMasFrecuente =
      "Desplazamiento del codo";
  }


  if (
    erroresTronco >
    erroresCodo
  ) {
    errorMasFrecuente =
      "Balanceo del tronco";
  }


  if (
    erroresCodo ===
      erroresTronco &&
    erroresCodo >
      0
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
