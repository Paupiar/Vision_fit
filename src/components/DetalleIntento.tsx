import type { RegistroIntento } from '../ejercicios/registro';

export default function DetalleIntento({ registro }: { registro: RegistroIntento }) {
  const debug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debugVisionFit') === '1';
  return <>
    <p>{registro.recorridoCompleto ? 'Recorrido completo' : 'Recorrido incompleto'}
      {registro.numeroRepeticion !== null ? ` · Contador: ${registro.numeroRepeticion}` : ' · No suma al contador'}</p>
    {registro.noEvaluados.length > 0 && <p>Evaluación parcial: {registro.noEvaluados.join(', ')}</p>}
    {debug && <details><summary>Datos del intento {registro.intento}</summary>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(registro.condiciones, null, 2)}</pre>
    </details>}
  </>;
}
