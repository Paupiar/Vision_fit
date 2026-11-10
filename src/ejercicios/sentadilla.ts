import { PARAMETROS_SENTADILLA as P } from './parametros';
import { angulo, depurarIntento, distancia, errorPrincipal, puntoValido } from './registro';
import type { RegistroIntento } from './registro';

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
export const ANGULO_SENTADILLA_ARRIBA = P.arriba;


// A partir de este ángulo consideramos
// que realmente ha empezado
// una repetición.
export const ANGULO_INICIO_SENTADILLA = P.inicio;


// Profundidad mínima necesaria
// para considerar correcta
// la bajada.
export const ANGULO_SENTADILLA_ABAJO = P.abajo;


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
export const INCLINACION_MAXIMA_TRONCO = P.inclinacionMaxima;


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

export interface ResultadoRepeticionSentadilla extends RegistroIntento {
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

  errorTalon: boolean;
  resultado: string;
}


// --------------------------------------------------
// ESTADO INTERNO
// --------------------------------------------------

export interface EstadoSentadilla {
  ultimoMensaje: string;
  preparado: boolean;
  troncoNoEvaluado: boolean;
  anguloPieDePie: number | null;
  elevacionTalonMaxima: number | null;
  framesTalonElevado: number;
  errorTalon: boolean;
  pieNoEvaluado: boolean;
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
  feedbackPie: string;

  // Historial completo.
  historial:
    ResultadoRepeticionSentadilla[];
}


// --------------------------------------------------
// RESUMEN DE SESIÓN
// --------------------------------------------------

export interface ResumenSesionSentadilla {
  // Repeticiones realizadas.
  noEvaluadas: number;
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
  talonElevado: number;
  errorMasFrecuente: string;
}


// --------------------------------------------------
// CREAR ESTADO INICIAL
// --------------------------------------------------

export function crearEstadoSentadilla():
  EstadoSentadilla {
  return {
    ultimoMensaje: '',
    preparado: false,
    troncoNoEvaluado: false,
    anguloPieDePie: null,
    elevacionTalonMaxima: null,
    framesTalonElevado: 0,
    errorTalon: false,
    pieNoEvaluado: false,
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
  return angulo(cadera, rodilla, tobillo);
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
  if (Math.hypot(diferenciaX, diferenciaY) <= 1e-6) return NaN;
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
const FALLO_TALON = 'Talón levantado';
const FALLO_PROFUNDIDAD = 'Profundidad insuficiente';
const FALLO_TRONCO = 'Exceso de inclinación del tronco';

export function calcularAnguloPie(
  talon: PuntoSentadilla | null,
  punta: PuntoSentadilla | null,
  rodilla: PuntoSentadilla,
  tobillo: PuntoSentadilla
): number | null {
  if (!puntoValido(talon) || !puntoValido(punta)) return null;
  const ancho = Math.abs(punta.x - talon.x);
  // Un pie muy escorzado no da una medida lateral fiable.
  if (ancho <= P.pie.longitudMinimaRespectoTibia * distancia(rodilla, tobillo)) return null;
  return Math.atan2(punta.y - talon.y, ancho) * 180 / Math.PI;
}

function reiniciarMedicionTalon(estado: EstadoSentadilla) {
  estado.elevacionTalonMaxima = null;
  estado.framesTalonElevado = 0;
  estado.errorTalon = false;
  estado.pieNoEvaluado = false;
}


// --------------------------------------------------
// ANALIZAR SENTADILLA
// --------------------------------------------------

export function analizarSentadilla(
  estado: EstadoSentadilla,
  hombro: PuntoSentadilla | null,
  cadera: PuntoSentadilla,
  rodilla: PuntoSentadilla,
  tobillo: PuntoSentadilla,
  anguloPie: number | null = null
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
    puntoValido(hombro)
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

  if (!Number.isFinite(anguloRodilla)) {
    interrumpirSentadilla(estado);
    return { anguloRodilla, inclinacionTronco: null, fase: estado.fase, repeticiones: estado.repeticiones,
      cambioFase: false, repeticionSumada: false, feedbackMovimiento: 'Recupera la pierna y ponte de pie',
      feedbackTronco: 'No evaluable', feedbackPie: 'No evaluable', historial: estado.historial };
  }
  if (anguloRodilla >= P.arriba) estado.preparado = true;
  if (estado.fase === 'arriba' && anguloRodilla >= P.arriba && Number.isFinite(anguloPie)) {
    estado.anguloPieDePie ??= anguloPie;
  }
  const elevacionTalon = anguloPie !== null && Number.isFinite(anguloPie) && estado.anguloPieDePie !== null
    ? anguloPie - estado.anguloPieDePie
    : null;
  let avisoTalon = false;
  if (inclinacionTronco !== null && !Number.isFinite(inclinacionTronco)) inclinacionTronco = null;
  let cambioFase = false;


  let repeticionSumada =
    false;


  // ------------------------------------------------
  // INICIO DE REPETICIÓN
  // ------------------------------------------------

  if (
    estado.preparado &&
    estado.fase ===
      "arriba" &&
    anguloRodilla <=
      ANGULO_INICIO_SENTADILLA
  ) {
    estado.ultimoMensaje = '';
    estado.troncoNoEvaluado = inclinacionTronco === null;
    reiniciarMedicionTalon(estado);
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
    estado.troncoNoEvaluado ||= inclinacionTronco === null;
    estado.pieNoEvaluado ||= elevacionTalon === null;
    if (elevacionTalon !== null) {
      estado.elevacionTalonMaxima = Math.max(estado.elevacionTalonMaxima ?? 0, elevacionTalon);
    }
    estado.framesTalonElevado = elevacionTalon !== null && elevacionTalon >= P.pie.elevacionMinima
      ? estado.framesTalonElevado + 1
      : 0;
    avisoTalon = estado.framesTalonElevado >= P.pie.framesConsecutivos;
    estado.errorTalon ||= avisoTalon;
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

      const errores = [
        errorProfundidad ? FALLO_PROFUNDIDAD : '',
        errorTronco ? FALLO_TRONCO : '',
        estado.errorTalon ? FALLO_TALON : '',
      ].filter(Boolean);
      const noEvaluados = [
        estado.troncoNoEvaluado ? 'Tronco sin seguimiento suficiente' : '',
        estado.pieNoEvaluado ? 'Talón sin referencia de pie o seguimiento suficiente' : '',
      ].filter(Boolean);


      // --------------------------------------------
      // GUARDAR EN HISTORIAL
      // --------------------------------------------

      const nuevaRepeticion:
        ResultadoRepeticionSentadilla = {
        ejercicio: 'sentadilla', intento: estado.repeticiones,
        numeroRepeticion: estado.repeticiones, recorridoCompleto: !errorProfundidad,
        evaluacionCompleta: noEvaluados.length === 0,
        noEvaluados,
        condiciones: { anguloMinimo: estado.anguloMinimo, inclinacionMaxima: estado.inclinacionTroncoMaxima,
          limiteProfundidad: P.abajo, limiteTronco: P.inclinacionMaxima,
          anguloPieDePie: estado.anguloPieDePie, elevacionTalonMaxima: estado.elevacionTalonMaxima,
          limiteTalon: P.pie.elevacionMinima, pieEvaluado: !estado.pieNoEvaluado },
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

        errorTalon: estado.errorTalon,
        resultado: errores.join(' + ') || (noEvaluados.length ? 'Sin errores observados; evaluación parcial' : 'Correcta')
      };


      estado.historial.push(
        nuevaRepeticion
      );
      depurarIntento(nuevaRepeticion);
      estado.ultimoMensaje = nuevaRepeticion.resultado === 'Correcta' ? 'Repetición completa' : nuevaRepeticion.resultado;


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
      estado.ultimoMensaje || feedbackMovimiento,

    feedbackTronco:
      feedbackTronco,

    feedbackPie: avisoTalon
      ? 'Mantén el talón apoyado'
      : anguloPie === null
        ? 'Muestra el talón y la punta del pie de lado'
        : elevacionTalon === null
          ? 'Ponte de pie con el talón apoyado para fijar la referencia'
          : 'Talón en seguimiento',

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
          repeticion.evaluacionCompleta &&
          !repeticion.errorProfundidad &&
          !repeticion.errorTronco &&
          !repeticion.errorTalon
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
  const talonElevado = historial.filter(repeticion => repeticion.errorTalon).length;


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
    noEvaluadas: historial.filter(r => !r.evaluacionCompleta).length,
    total:
      total,

    correctas:
      correctas,

    porcentajeCorrectas:
      porcentajeCorrectas,

    profundidadInsuficiente:
      profundidadInsuficiente,

    excesoInclinacionTronco:
      excesoInclinacionTronco,
    talonElevado,
    errorMasFrecuente: errorPrincipal([
      [FALLO_PROFUNDIDAD, profundidadInsuficiente],
      [FALLO_TRONCO, excesoInclinacionTronco],
      [FALLO_TALON, talonElevado],
    ]),
  };
}
// Descarta un ciclo interrumpido: no permite completarlo con otro movimiento.
export function interrumpirSentadilla(e: EstadoSentadilla) {
  e.ultimoMensaje = ''; e.fase = 'arriba'; e.preparado = false; e.profundidadAlcanzada = false;
  e.anguloMinimo = 180; e.inclinacionTroncoMaxima = null; e.troncoNoEvaluado = false;
  e.anguloPieDePie = null;
  reiniciarMedicionTalon(e);
}
