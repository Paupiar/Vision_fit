import { PARAMETROS_CURL as P } from './parametros';
import { angulo, depurarIntento, distancia, errorPrincipal, puntoValido } from './registro';
import type { PuntoAnalisis, RegistroIntento } from './registro';

export const DESPLAZAMIENTO_MAXIMO_CODO = P.camara.desplazamientoMaximoCodo;
export const DESPLAZAMIENTO_MAXIMO_HOMBRO = P.camara.desplazamientoMaximoHombro;
export interface ConfiguracionCurl { desplazamientoMaximoCodo: number; desplazamientoMaximoHombro: number }
export const CONFIGURACION_CURL_CAMARA: ConfiguracionCurl = P.camara;
export const CONFIGURACION_CURL_VIDEO: ConfiguracionCurl = P.video;
export type Punto = PuntoAnalisis;
export type FaseCurl = 'abajo' | 'arriba';
interface ReferenciaPosicion { dx: number; dy: number; longitudReferencia: number }
export interface EstadoCurl {
  fase: FaseCurl; repeticiones: number;
  referenciaCodo: ReferenciaPosicion | null; referenciaHombro: ReferenciaPosicion | null;
  errorCodoRepeticion: boolean; errorTroncoRepeticion: boolean;
  preparado: boolean; activo: boolean; intentos: number;
  anguloMinimo: number; maximaExtensionRetorno: number;
  framesMovimiento: number; framesCodo: number; framesTronco: number; maxCodo: number; maxTronco: number;
  troncoNoEvaluado: boolean; historial: ResultadoRepeticion[]; ultimoMensaje: string;
}
export interface ResultadoRepeticion extends RegistroIntento {
  numero: number; // ID del intento; no se reutiliza cuando el recorrido es incompleto.
  errorCodo: boolean; errorTronco: boolean; errorRango: boolean; resultado: string;
}
export interface ResultadoFrameCurl {
  anguloCodo: number; fase: FaseCurl; feedbackMovimiento: string; feedbackCodo: string; feedbackHombro: string;
  desplazamientoCodo: number | null; desplazamientoHombro: number | null;
  cambioFase: boolean; repeticionSumada: boolean; repeticionFinalizada: ResultadoRepeticion | null;
}
export interface ResumenSesion {
  total: number; correctas: number; porcentajeCorrectas: number;
  erroresCodo: number; erroresTronco: number; erroresRango: number;
  completas: number; incompletas: number; noEvaluadas: number; errorMasFrecuente: string;
}
export function crearEstadoCurl(): EstadoCurl {
  return { fase: 'abajo', repeticiones: 0, referenciaCodo: null, referenciaHombro: null,
    errorCodoRepeticion: false, errorTroncoRepeticion: false, preparado: false,
    activo: false, intentos: 0, anguloMinimo: 180, maximaExtensionRetorno: 0,
    framesMovimiento: 0, framesCodo: 0, framesTronco: 0, maxCodo: 0, maxTronco: 0,
    troncoNoEvaluado: false, historial: [], ultimoMensaje: '' };
}
export const calcularDistancia = distancia;
export const calcularAngulo = angulo;
function referencia(movil: Punto, base: Punto): ReferenciaPosicion | null {
  const longitudReferencia = distancia(movil, base);
  return longitudReferencia > 1e-6 ? { dx: movil.x - base.x, dy: movil.y - base.y, longitudReferencia } : null;
}
function desplazamiento(movil: Punto, base: Punto, ref: ReferenciaPosicion | null): number | null {
  return ref ? Math.hypot(movil.x - base.x - ref.dx, movil.y - base.y - ref.dy) / ref.longitudReferencia : null;
}
export function obtenerFeedbackMovimiento(a: number, fase: FaseCurl): string {
  if (a >= P.extension) return 'Brazo extendido';
  if (fase === 'arriba') return a <= P.flexion ? 'Sigue bajando' : 'Casi estás abajo';
  return a <= P.flexion ? 'Flexión completa' : a > 90 ? 'Sigue flexionando' : 'Casi, flexiona un poco más';
}
function limpiarIntento(e: EstadoCurl) {
  e.activo = false; e.errorCodoRepeticion = false; e.errorTroncoRepeticion = false;
  e.framesMovimiento = 0; e.framesCodo = 0; e.framesTronco = 0; e.maxCodo = 0; e.maxTronco = 0;
  e.anguloMinimo = 180; e.maximaExtensionRetorno = 0; e.troncoNoEvaluado = false;
}
export function interrumpirCurl(e: EstadoCurl) {
  limpiarIntento(e); e.preparado = false; e.fase = 'abajo';
  e.referenciaCodo = null; e.referenciaHombro = null; e.ultimoMensaje = '';
}
function cerrarIntento(e: EstadoCurl, c: ConfiguracionCurl, completo: boolean, motivo: string): ResultadoRepeticion {
  e.intentos++;
  const errores = [e.errorCodoRepeticion ? 'Desplazamiento del codo' : '',
    e.errorTroncoRepeticion ? 'Balanceo del tronco' : '', !completo ? 'Rango de movimiento incompleto' : ''].filter(Boolean);
  const r: ResultadoRepeticion = { ejercicio: 'curl', numero: e.intentos, intento: e.intentos,
    numeroRepeticion: e.fase === 'arriba' ? e.repeticiones : null,
    recorridoCompleto: completo, evaluacionCompleta: !e.troncoNoEvaluado,
    noEvaluados: e.troncoNoEvaluado ? ['Tronco sin seguimiento suficiente'] : [],
    errorCodo: e.errorCodoRepeticion, errorTronco: e.errorTroncoRepeticion, errorRango: !completo,
    condiciones: { anguloMinimo: e.anguloMinimo, extensionRetorno: e.maximaExtensionRetorno,
      desplazamientoCodoMaximo: e.maxCodo, desplazamientoTroncoMaximo: e.maxTronco,
      limiteCodo: c.desplazamientoMaximoCodo, limiteTronco: c.desplazamientoMaximoHombro,
      flexion: P.flexion, extension: P.extension, motivo },
    resultado: errores.join(' + ') || (e.troncoNoEvaluado ? 'Sin errores observados; tronco no evaluado' : 'Correcta') };
  e.historial.push(r); e.ultimoMensaje = r.resultado; depurarIntento(r); limpiarIntento(e);
  return r;
}
export function analizarFrameCurl(e: EstadoCurl, hombro: Punto, codo: Punto, muneca: Punto,
  cadera: Punto | null, configuracion: ConfiguracionCurl = CONFIGURACION_CURL_CAMARA): ResultadoFrameCurl {
  const a = angulo(hombro, codo, muneca);
  if (!Number.isFinite(a)) {
    interrumpirCurl(e);
    return { anguloCodo: a, fase: e.fase, feedbackMovimiento: 'Recupera la visibilidad y extiende el brazo',
      feedbackCodo: 'No evaluable', feedbackHombro: 'No evaluable', desplazamientoCodo: null,
      desplazamientoHombro: null, cambioFase: false, repeticionSumada: false, repeticionFinalizada: null };
  }
  const faseAntes = e.fase;
  let repeticionSumada = false;
  let repeticionFinalizada: ResultadoRepeticion | null = null;
  // Armar desde extensión observada evita contar una pose inicial ya flexionada.
  if (a >= P.extension && !e.activo) {
    e.preparado = true;
    e.referenciaCodo = referencia(codo, hombro);
    e.referenciaHombro = puntoValido(cadera) ? referencia(hombro, cadera) : null;
  }
  if (e.preparado && !e.activo && a <= P.inicio) {
    limpiarIntento(e); e.activo = true; e.ultimoMensaje = '';
  }
  const dc = desplazamiento(codo, hombro, e.referenciaCodo);
  const dt = puntoValido(cadera) ? desplazamiento(hombro, cadera, e.referenciaHombro) : null;
  if (e.activo) {
    e.framesMovimiento++;
    e.anguloMinimo = Math.min(e.anguloMinimo, a);
    e.troncoNoEvaluado ||= dt === null;
    e.maxCodo = Math.max(e.maxCodo, dc ?? 0); e.maxTronco = Math.max(e.maxTronco, dt ?? 0);
    e.framesCodo = dc !== null && dc > configuracion.desplazamientoMaximoCodo ? e.framesCodo + 1 : 0;
    e.framesTronco = dt !== null && dt > configuracion.desplazamientoMaximoHombro ? e.framesTronco + 1 : 0;
    e.errorCodoRepeticion ||= e.framesCodo >= P.framesErrorConsecutivos;
    e.errorTroncoRepeticion ||= e.framesTronco >= P.framesErrorConsecutivos;
    // Conserva el contador histórico al alcanzar flexión; historial al cerrar ciclo.
    if (a <= P.flexion && e.fase === 'abajo') {
      e.fase = 'arriba'; e.repeticiones++; repeticionSumada = true;
    }
    if (e.fase === 'arriba') e.maximaExtensionRetorno = Math.max(e.maximaExtensionRetorno, a);
    if (a >= P.extension) {
      if (e.fase === 'arriba' || (P.extension - e.anguloMinimo >= P.excursionMinima && e.framesMovimiento >= P.framesMovimientoMinimos)) {
        repeticionFinalizada = cerrarIntento(e, configuracion, e.fase === 'arriba', 'Retorno a extensión');
      } else limpiarIntento(e);
      e.fase = 'abajo';
      e.referenciaCodo = referencia(codo, hombro);
      e.referenciaHombro = puntoValido(cadera) ? referencia(hombro, cadera) : null;
    } else if (e.fase === 'arriba' && a <= P.flexion && e.maximaExtensionRetorno >= P.flexion + P.excursionMinima) {
      repeticionFinalizada = cerrarIntento(e, configuracion, false, 'Nueva flexión sin extender el brazo');
      e.preparado = false; e.fase = 'abajo';
    }
  }
  return { anguloCodo: a, fase: e.fase,
    feedbackMovimiento: e.ultimoMensaje || obtenerFeedbackMovimiento(a, e.fase),
    feedbackCodo: dc === null ? 'Extiende el brazo para calibrar el codo' : dc > configuracion.desplazamientoMaximoCodo ? 'Mantén el codo estable' : 'Codo estable',
    feedbackHombro: dt === null ? 'Asegúrate de que la cadera sea visible al calibrar' : dt > configuracion.desplazamientoMaximoHombro ? 'Evita balancear el tronco' : 'Tronco estable',
    desplazamientoCodo: dc, desplazamientoHombro: dt, cambioFase: faseAntes !== e.fase,
    repeticionSumada, repeticionFinalizada };
}
export function calcularResumenSesion(historial: ResultadoRepeticion[]): ResumenSesion {
  const total = historial.length;
  const correctas = historial.filter(r => r.recorridoCompleto && r.evaluacionCompleta && !r.errorCodo && !r.errorTronco && !r.errorRango).length;
  const erroresCodo = historial.filter(r => r.errorCodo).length;
  const erroresTronco = historial.filter(r => r.errorTronco).length;
  const erroresRango = historial.filter(r => r.errorRango).length;
  return { total, correctas, porcentajeCorrectas: total ? Math.round(correctas / total * 100) : 0,
    erroresCodo, erroresTronco, erroresRango, completas: historial.filter(r => r.recorridoCompleto).length,
    incompletas: erroresRango, noEvaluadas: historial.filter(r => !r.evaluacionCompleta).length,
    errorMasFrecuente: errorPrincipal([['Desplazamiento del codo', erroresCodo], ['Balanceo del tronco', erroresTronco], ['Rango de movimiento incompleto', erroresRango]]) };
}
