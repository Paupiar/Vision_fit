import { CALIDAD } from './parametros';
import type { EjercicioId } from './tipos';
export interface PuntoAnalisis { x: number; y: number; visibility?: number }
export interface RegistroIntento {
  ejercicio: EjercicioId; intento: number; numeroRepeticion: number | null;
  recorridoCompleto: boolean; evaluacionCompleta: boolean; noEvaluados: string[];
  condiciones: Record<string, number | boolean | string | null>;
}
export function puntoValido(p: PuntoAnalisis | null | undefined): p is PuntoAnalisis {
  return !!p && Number.isFinite(p.x) && Number.isFinite(p.y) &&
    (p.visibility === undefined || (Number.isFinite(p.visibility) && p.visibility >= CALIDAD.visibilidadMinima));
}
export function distancia(a: PuntoAnalisis, b: PuntoAnalisis): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
export function angulo(a: PuntoAnalisis, b: PuntoAnalisis, c: PuntoAnalisis): number {
  if (![a, b, c].every(puntoValido) || distancia(a, b) <= CALIDAD.segmentoMinimo || distancia(b, c) <= CALIDAD.segmentoMinimo) return NaN;
  const grados = Math.abs(Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)) * 180 / Math.PI;
  return grados > 180 ? 360 - grados : grados;
}
// Un evento por intento; activar con ?debugVisionFit=1, sin panel permanente.
export function depurarIntento(registro: RegistroIntento & { resultado: string }): void {
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debugVisionFit') === '1') console.debug('[Visión Fit: intento]', registro);
}
export function errorPrincipal(errores: [string, number][]): string {
  const maximo = Math.max(0, ...errores.map(([, total]) => total));
  return maximo === 0 ? 'Ninguno destacado' : errores.filter(([, total]) => total === maximo).map(([nombre]) => nombre).join(' / ');
}
