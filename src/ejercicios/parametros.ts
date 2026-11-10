// Provisionales: se conservan los umbrales heredados, pendientes de validaciÃ³n fÃ­sica.
export const CALIDAD = { visibilidadMinima: 0.7, segmentoMinimo: 1e-6 };
export const PARAMETROS_CURL = {
  extension: 160, flexion: 50, inicio: 140, excursionMinima: 35, framesErrorConsecutivos: 3, framesMovimientoMinimos: 3,
  camara: { desplazamientoMaximoCodo: 0.25, desplazamientoMaximoHombro: 0.13 },
  video: { desplazamientoMaximoCodo: 0.30, desplazamientoMaximoHombro: 0.16 },
};
export const PARAMETROS_SENTADILLA = {
  arriba: 160, inicio: 140, abajo: 100, inclinacionMaxima: 50,
  pie: { habilitado: false }, // Faltan criterio acordado y referencia al suelo.
};
export const PARAMETROS_PRESS = {
  abajo: 60, arriba: 140, extensionMinima: 140, excursionMinima: 25, framesMovimientoMinimos: 3,
  diferenciaMaxima: 15, porcentajeDescompensado: 20,
  apertura: {
    habilitada: false, anguloMaximoEvaluable: 90,
    incrementoSobreReferencia: 0.20, // Distancia lateral / anchura entre hombros.
    framesConsecutivos: 3, framesReferencia: 5,
  },
};
