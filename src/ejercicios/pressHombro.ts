import { PARAMETROS_PRESS as P } from './parametros';
import { angulo, depurarIntento, errorPrincipal } from './registro';
import type { PuntoAnalisis, RegistroIntento } from './registro';
export const ANGULO_PRESS_ABAJO = P.abajo;
export const ANGULO_PRESS_ARRIBA = P.arriba;
export const DIFERENCIA_MAXIMA_BRAZOS = P.diferenciaMaxima;
export const PORCENTAJE_MAXIMO_DESCOMPENSADO = P.porcentajeDescompensado;
export type PuntoPressHombro = PuntoAnalisis;
export type FasePressHombro = 'esperando' | 'abajo' | 'arriba';
export type ConfiguracionPress = typeof P;
export interface ResultadoRepeticionPress extends RegistroIntento {
  numero: number; diferenciaMedia: number; diferenciaMaxima: number; porcentajeDescompensado: number;
  errorSimetria: boolean; errorExtension: boolean; resultado: string;
}
export interface EstadoPressHombro {
  fase: FasePressHombro; repeticiones: number; framesAnalizados: number; framesDescompensados: number;
  sumaDiferencias: number; diferenciaMaxima: number; historial: ResultadoRepeticionPress[];
  activo: boolean; maxIzquierdo: number; maxDerecho: number; excursion: number;
  ultimoMensaje: string;
}
export interface ResultadoPressHombro {
  anguloCodoIzquierdo: number; anguloCodoDerecho: number; diferenciaAngular: number;
  fase: FasePressHombro; repeticiones: number; cambioFase: boolean;
  posicionBajaAlcanzada: boolean; posicionAltaAlcanzada: boolean; repeticionSumada: boolean;
  intentoFinalizado: boolean; feedbackMovimiento: string; feedbackSimetria: string;
  feedbackExtension: string; historial: ResultadoRepeticionPress[];
}
export interface ResumenSesionPress {
  total: number; correctas: number; descompensadas: number; porcentajeCorrectas: number;
  extensionIncompleta: number; completas: number;
  incompletas: number; errorMasFrecuente: string;
}
export function crearEstadoPressHombro(): EstadoPressHombro {
  return { fase: 'esperando', repeticiones: 0, framesAnalizados: 0, framesDescompensados: 0,
    sumaDiferencias: 0, diferenciaMaxima: 0, historial: [], activo: false, maxIzquierdo: 0,
    maxDerecho: 0, excursion: 0, ultimoMensaje: '' };
}
export function reiniciarDatosRepeticion(e: EstadoPressHombro) {
  e.framesAnalizados = 0; e.framesDescompensados = 0; e.sumaDiferencias = 0;
  e.diferenciaMaxima = 0; e.activo = false; e.maxIzquierdo = 0; e.maxDerecho = 0;
  e.excursion = 0;
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
function finalizarIntento(e: EstadoPressHombro, c: ConfiguracionPress): ResultadoRepeticionPress {
  const recorridoCompleto = e.fase === 'arriba';
  if (recorridoCompleto) e.repeticiones++;
  const diferenciaMedia = e.framesAnalizados ? e.sumaDiferencias / e.framesAnalizados : 0;
  const porcentajeDescompensado = e.framesAnalizados ? e.framesDescompensados / e.framesAnalizados * 100 : 0;
  const errorSimetria = porcentajeDescompensado >= c.porcentajeDescompensado;
  const errorExtension = !recorridoCompleto || Math.min(e.maxIzquierdo, e.maxDerecho) < c.extensionMinima;
  const errores = [
    errorSimetria ? 'Descompensación entre brazos' : '',
    errorExtension ? 'Extensión incompleta de los codos' : '',
  ].filter(Boolean);
  const r: ResultadoRepeticionPress = { ejercicio: 'press-hombro', numero: e.historial.length + 1,
    intento: e.historial.length + 1, numeroRepeticion: recorridoCompleto ? e.repeticiones : null,
    recorridoCompleto, evaluacionCompleta: true, noEvaluados: [],
    diferenciaMedia, diferenciaMaxima: e.diferenciaMaxima, porcentajeDescompensado,
    errorSimetria, errorExtension,
    condiciones: { extensionMaximaIzquierda: e.maxIzquierdo, extensionMaximaDerecha: e.maxDerecho,
      extensionMinima: c.extensionMinima, altoConteo: c.arriba, bajoConteo: c.abajo,
      diferenciaMaxima: e.diferenciaMaxima, porcentajeDescompensado, limiteSimetria: c.diferenciaMaxima,
      limitePorcentaje: c.porcentajeDescompensado },
    resultado: errores.join(' + ') || 'Correcta' };
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
      feedbackSimetria: 'No evaluable', feedbackExtension: 'No evaluable', historial: e.historial };
  }
  const faseAntes = e.fase;
  const bajos = ai <= c.abajo && ad <= c.abajo;
  const altos = ai >= c.arriba && ad >= c.arriba;
  let baja = false, alta = false, sumada = false, finalizado = false;
  if (e.fase === 'esperando' && bajos) { e.fase = 'abajo'; baja = true; }
  else if (e.fase !== 'esperando') {
    // Excluye el reposo en posición baja de la estadística de simetría.
    if (!bajos && !e.activo) { reiniciarDatosRepeticion(e); e.activo = true; e.ultimoMensaje = ''; }
    if (e.activo) {
      e.maxIzquierdo = Math.max(e.maxIzquierdo, ai); e.maxDerecho = Math.max(e.maxDerecho, ad);
      e.excursion = Math.max(e.excursion, Math.max(ai, ad) - c.abajo);
      e.framesAnalizados++; e.sumaDiferencias += d; e.diferenciaMaxima = Math.max(e.diferenciaMaxima, d);
      if (d > c.diferenciaMaxima) e.framesDescompensados++;
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
    historial: e.historial };
}
export function calcularResumenSesionPress(historial: ResultadoRepeticionPress[]): ResumenSesionPress {
  const total = historial.length;
  const correctas = historial.filter(r => r.recorridoCompleto && r.evaluacionCompleta && !r.errorSimetria && !r.errorExtension).length;
  const descompensadas = historial.filter(r => r.errorSimetria).length;
  const extensionIncompleta = historial.filter(r => r.errorExtension).length;
  return { total, correctas, descompensadas, extensionIncompleta,
    completas: historial.filter(r => r.recorridoCompleto).length, incompletas: historial.filter(r => !r.recorridoCompleto).length,
    porcentajeCorrectas: total ? correctas / total * 100 : 0,
    errorMasFrecuente: errorPrincipal([['Descompensación entre brazos', descompensadas], ['Extensión incompleta de los codos', extensionIncompleta]]) };
}
