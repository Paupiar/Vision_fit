import { CALIDAD, PARAMETROS_PRESS as P } from './parametros';
import { angulo, depurarIntento, errorPrincipal } from './registro';
import type { PuntoAnalisis, RegistroIntento } from './registro';
export const ANGULO_PRESS_ABAJO = P.abajo;
export const ANGULO_PRESS_ARRIBA = P.arriba;
export const DIFERENCIA_MAXIMA_BRAZOS = P.diferenciaMaxima;
export const PORCENTAJE_MAXIMO_DESCOMPENSADO = P.porcentajeDescompensado;
const FALLO_APERTURA = 'Codos demasiado abiertos';
export type PuntoPressHombro = PuntoAnalisis;
export type FasePressHombro = 'esperando' | 'abajo' | 'arriba';
export type ConfiguracionPress = typeof P;
export interface ResultadoRepeticionPress extends RegistroIntento {
  numero: number; diferenciaMedia: number; diferenciaMaxima: number; porcentajeDescompensado: number;
  errorSimetria: boolean; errorExtension: boolean; errorApertura: boolean; resultado: string;
}
export interface EstadoPressHombro {
  fase: FasePressHombro; repeticiones: number; framesAnalizados: number; framesDescompensados: number;
  sumaDiferencias: number; diferenciaMaxima: number; historial: ResultadoRepeticionPress[];
  activo: boolean; maxIzquierdo: number; maxDerecho: number; excursion: number;
  framesAperturaIzquierda: number; framesAperturaDerecha: number;
  maxAperturaIzquierda: number | null; maxAperturaDerecha: number | null;
  errorApertura: boolean; ultimoMensaje: string;
}
export interface ResultadoPressHombro {
  anguloCodoIzquierdo: number; anguloCodoDerecho: number; diferenciaAngular: number;
  fase: FasePressHombro; repeticiones: number; cambioFase: boolean;
  posicionBajaAlcanzada: boolean; posicionAltaAlcanzada: boolean; repeticionSumada: boolean;
  intentoFinalizado: boolean; feedbackMovimiento: string; feedbackSimetria: string;
  feedbackExtension: string; feedbackApertura: string; historial: ResultadoRepeticionPress[];
}
export interface ResumenSesionPress {
  total: number; correctas: number; descompensadas: number; porcentajeCorrectas: number;
  extensionIncompleta: number; aperturaExcesiva: number; completas: number;
  incompletas: number; noEvaluadas: number; errorMasFrecuente: string;
}
export function crearEstadoPressHombro(): EstadoPressHombro {
  return { fase: 'esperando', repeticiones: 0, framesAnalizados: 0, framesDescompensados: 0,
    sumaDiferencias: 0, diferenciaMaxima: 0, historial: [], activo: false, maxIzquierdo: 0,
    maxDerecho: 0, excursion: 0, framesAperturaIzquierda: 0, framesAperturaDerecha: 0,
    maxAperturaIzquierda: null, maxAperturaDerecha: null, errorApertura: false, ultimoMensaje: '' };
}
export function reiniciarDatosRepeticion(e: EstadoPressHombro) {
  e.framesAnalizados = 0; e.framesDescompensados = 0; e.sumaDiferencias = 0;
  e.diferenciaMaxima = 0; e.activo = false; e.maxIzquierdo = 0; e.maxDerecho = 0;
  e.excursion = 0; e.framesAperturaIzquierda = 0; e.framesAperturaDerecha = 0;
  e.maxAperturaIzquierda = null; e.maxAperturaDerecha = null; e.errorApertura = false;
}
export function interrumpirPress(e: EstadoPressHombro) {
  reiniciarDatosRepeticion(e); e.fase = 'esperando'; e.ultimoMensaje = '';
}
export const calcularAnguloCodoPress = angulo;
export function obtenerFeedbackSimetria(d: number): string {
  return d <= P.diferenciaMaxima ? 'Movimiento simétrico' : 'Intenta mover ambos brazos al mismo nivel';
}
export function obtenerFeedbackMovimientoPress(fase: FasePressHombro, baja: boolean, alta: boolean, sumada: boolean): string {
  if (sumada) return 'Repetición completa';
  if (alta) return 'Posición alta alcanzada';
  if (baja) return 'Posición inicial preparada';
  return fase === 'esperando' ? 'Coloca ambos brazos en posición baja' : fase === 'abajo' ? 'Sube ambos brazos' : 'Baja ambos brazos';
}
// Mide cuánto cae la muñeca hacia dentro respecto al codo en la vista frontal.
// Los ejes siguen los hombros para tolerar un giro leve de la imagen o un espejo.
function medirAperturaFrontal(
  hombro: PuntoPressHombro,
  codo: PuntoPressHombro,
  muneca: PuntoPressHombro,
  hombroOpuesto: PuntoPressHombro
): number | null {
  const hombrosX = hombroOpuesto.x - hombro.x;
  const hombrosY = hombroOpuesto.y - hombro.y;
  const anchura = Math.hypot(hombrosX, hombrosY);
  if (anchura <= CALIDAD.segmentoMinimo || Math.abs(hombrosX) < anchura / 2) return null;

  const ejeX = hombrosX / anchura;
  const ejeY = hombrosY / anchura;
  const antebrazoX = muneca.x - codo.x;
  const antebrazoY = muneca.y - codo.y;
  const haciaArriba = Math.sign(ejeX) * (antebrazoX * ejeY - antebrazoY * ejeX);
  if (haciaArriba <= 0) return null;

  const codoHaciaDentro = (codo.x - hombro.x) * ejeX + (codo.y - hombro.y) * ejeY;
  const munecaHaciaDentro = antebrazoX * ejeX + antebrazoY * ejeY;
  return codoHaciaDentro < 0
    ? Math.atan2(Math.max(0, munecaHaciaDentro), haciaArriba) * 180 / Math.PI
    : 0;
}
function finalizarIntento(e: EstadoPressHombro, c: ConfiguracionPress): ResultadoRepeticionPress {
  const recorridoCompleto = e.fase === 'arriba';
  if (recorridoCompleto) e.repeticiones++;
  const diferenciaMedia = e.framesAnalizados ? e.sumaDiferencias / e.framesAnalizados : 0;
  const porcentajeDescompensado = e.framesAnalizados ? e.framesDescompensados / e.framesAnalizados * 100 : 0;
  const errorSimetria = porcentajeDescompensado >= c.porcentajeDescompensado;
  const errorExtension = !recorridoCompleto || Math.min(e.maxIzquierdo, e.maxDerecho) < c.extensionMinima;
  const errores = [errorSimetria ? 'Descompensación entre brazos' : '', errorExtension ? 'Extensión incompleta de los codos' : '',
    e.errorApertura ? FALLO_APERTURA : ''].filter(Boolean);
  const noEvaluados = e.maxAperturaIzquierda === null || e.maxAperturaDerecha === null
    ? ['Apertura sin seguimiento frontal suficiente'] : [];
  const r: ResultadoRepeticionPress = { ejercicio: 'press-hombro', numero: e.historial.length + 1,
    intento: e.historial.length + 1, numeroRepeticion: recorridoCompleto ? e.repeticiones : null,
    recorridoCompleto, evaluacionCompleta: noEvaluados.length === 0, noEvaluados,
    diferenciaMedia, diferenciaMaxima: e.diferenciaMaxima, porcentajeDescompensado,
    errorSimetria, errorExtension, errorApertura: e.errorApertura,
    condiciones: { extensionMaximaIzquierda: e.maxIzquierdo, extensionMaximaDerecha: e.maxDerecho,
      extensionMinima: c.extensionMinima, altoConteo: c.arriba, bajoConteo: c.abajo,
      diferenciaMaxima: e.diferenciaMaxima, porcentajeDescompensado, limiteSimetria: c.diferenciaMaxima,
      limitePorcentaje: c.porcentajeDescompensado,
      inclinacionAntebrazoIzquierdo: e.maxAperturaIzquierda,
      inclinacionAntebrazoDerecho: e.maxAperturaDerecha,
      limiteApertura: c.apertura.inclinacionMinimaAntebrazo },
    resultado: errores.join(' + ') || (noEvaluados.length ? 'Sin errores observados; apertura no evaluada' : 'Correcta') };
  e.historial.push(r); e.ultimoMensaje = r.resultado; depurarIntento(r);
  return r;
}
export function analizarPressHombro(e: EstadoPressHombro, hi: PuntoPressHombro, ci: PuntoPressHombro, mi: PuntoPressHombro,
  hd: PuntoPressHombro, cd: PuntoPressHombro, md: PuntoPressHombro, c: ConfiguracionPress = P): ResultadoPressHombro {
  const ai = angulo(hi, ci, mi), ad = angulo(hd, cd, md), d = Math.abs(ai - ad);
  if (!Number.isFinite(ai) || !Number.isFinite(ad)) {
    interrumpirPress(e);
    return { anguloCodoIzquierdo: ai, anguloCodoDerecho: ad, diferenciaAngular: d, fase: e.fase,
      repeticiones: e.repeticiones, cambioFase: false, posicionBajaAlcanzada: false, posicionAltaAlcanzada: false,
      repeticionSumada: false, intentoFinalizado: false, feedbackMovimiento: 'Recupera ambos brazos y vuelve a la posición baja',
      feedbackSimetria: 'No evaluable', feedbackExtension: 'No evaluable', feedbackApertura: 'No evaluable', historial: e.historial };
  }
  const faseAntes = e.fase;
  const bajos = ai <= c.abajo && ad <= c.abajo;
  const altos = ai >= c.arriba && ad >= c.arriba;
  let baja = false, alta = false, sumada = false, finalizado = false;
  let aperturaIzquierda: number | null = null;
  let aperturaDerecha: number | null = null;
  let avisoApertura = false;
  if (e.fase === 'esperando' && bajos) { e.fase = 'abajo'; baja = true; }
  else if (e.fase !== 'esperando') {
    // Excluye el reposo en posición baja de la estadística de simetría.
    if (!bajos && !e.activo) { reiniciarDatosRepeticion(e); e.activo = true; e.ultimoMensaje = ''; }
    if (e.activo) {
      e.maxIzquierdo = Math.max(e.maxIzquierdo, ai); e.maxDerecho = Math.max(e.maxDerecho, ad);
      e.excursion = Math.max(e.excursion, Math.max(ai, ad) - c.abajo);
      e.framesAnalizados++; e.sumaDiferencias += d; e.diferenciaMaxima = Math.max(e.diferenciaMaxima, d);
      if (d > c.diferenciaMaxima) e.framesDescompensados++;
      if (ai <= c.apertura.anguloMaximoCodo) aperturaIzquierda = medirAperturaFrontal(hi, ci, mi, hd);
      if (ad <= c.apertura.anguloMaximoCodo) aperturaDerecha = medirAperturaFrontal(hd, cd, md, hi);
      if (aperturaIzquierda !== null) {
        e.maxAperturaIzquierda = Math.max(e.maxAperturaIzquierda ?? 0, aperturaIzquierda);
      }
      if (aperturaDerecha !== null) {
        e.maxAperturaDerecha = Math.max(e.maxAperturaDerecha ?? 0, aperturaDerecha);
      }
      const limite = c.apertura.inclinacionMinimaAntebrazo;
      e.framesAperturaIzquierda = aperturaIzquierda !== null && aperturaIzquierda >= limite ? e.framesAperturaIzquierda + 1 : 0;
      e.framesAperturaDerecha = aperturaDerecha !== null && aperturaDerecha >= limite ? e.framesAperturaDerecha + 1 : 0;
      avisoApertura = Math.max(e.framesAperturaIzquierda, e.framesAperturaDerecha) >= c.apertura.framesConsecutivos;
      e.errorApertura ||= avisoApertura;
      if (e.fase === 'abajo' && altos) { e.fase = 'arriba'; alta = true; }
      if (bajos) {
        if (e.fase === 'arriba' || (e.excursion >= c.excursionMinima && e.framesAnalizados >= c.framesMovimientoMinimos)) {
          const r = finalizarIntento(e, c); sumada = r.recorridoCompleto; finalizado = true;
        }
        reiniciarDatosRepeticion(e); e.fase = 'abajo'; baja = true;
      }
    }
  }
  return { anguloCodoIzquierdo: ai, anguloCodoDerecho: ad, diferenciaAngular: d, fase: e.fase,
    repeticiones: e.repeticiones, cambioFase: faseAntes !== e.fase, posicionBajaAlcanzada: baja,
    posicionAltaAlcanzada: alta, repeticionSumada: sumada, intentoFinalizado: finalizado,
    feedbackMovimiento: e.ultimoMensaje || obtenerFeedbackMovimientoPress(e.fase, baja, alta, sumada),
    feedbackSimetria: d <= c.diferenciaMaxima ? 'Movimiento simétrico' : 'Intenta mover ambos brazos al mismo nivel',
    feedbackExtension: finalizado && e.historial.at(-1)?.errorExtension ? 'Extensión incompleta de los codos' : 'La extensión se evalúa al volver abajo',
    feedbackApertura: avisoApertura || (finalizado && e.historial.at(-1)?.errorApertura)
      ? 'Alinea las muñecas sobre los codos'
      : aperturaIzquierda !== null && aperturaDerecha !== null
        ? 'Apertura en seguimiento'
        : 'La apertura se evalúa con los codos flexionados y las muñecas por encima',
    historial: e.historial };
}
export function calcularResumenSesionPress(historial: ResultadoRepeticionPress[]): ResumenSesionPress {
  const total = historial.length;
  const correctas = historial.filter(r => r.recorridoCompleto && r.evaluacionCompleta && !r.errorSimetria && !r.errorExtension && !r.errorApertura).length;
  const descompensadas = historial.filter(r => r.errorSimetria).length;
  const extensionIncompleta = historial.filter(r => r.errorExtension).length;
  const aperturaExcesiva = historial.filter(r => r.errorApertura).length;
  return { total, correctas, descompensadas, extensionIncompleta, aperturaExcesiva,
    completas: historial.filter(r => r.recorridoCompleto).length, incompletas: historial.filter(r => !r.recorridoCompleto).length,
    noEvaluadas: historial.filter(r => !r.evaluacionCompleta).length, porcentajeCorrectas: total ? correctas / total * 100 : 0,
    errorMasFrecuente: errorPrincipal([['Descompensación entre brazos', descompensadas], ['Extensión incompleta de los codos', extensionIncompleta], [FALLO_APERTURA, aperturaExcesiva]]) };
}
