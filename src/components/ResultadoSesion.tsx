import type {
  ReactNode
} from "react";


// ==================================================
// RESULTADO / RESUMEN COMPARTIDO DE UNA SESIÓN
// ==================================================
//
// Este componente centraliza la parte de resultados
// que comparten Curl, Sentadilla y Press de hombro.
//
// Mientras el análisis está activo actúa como un
// resumen en directo. Cuando la sesión se finaliza,
// el mismo bloque pasa a presentar un resultado final
// con valoración técnica y un siguiente objetivo.
// ==================================================

interface MetricaResultado {
  etiqueta: string;

  valor: string | number;
}


interface ResultadoSesionProps {
  finalizado: boolean;

  total: number;

  correctas: number;

  porcentajeCorrectas: number;

  metricas: MetricaResultado[];

  errorPrincipal: string;

  hayHistorial: boolean;

  children: ReactNode;
}


// --------------------------------------------------
// VALORACIÓN GENERAL
// --------------------------------------------------
//
// No modifica la evaluación técnica de cada repetición.
// Únicamente transforma el porcentaje final en un
// mensaje sencillo para que el usuario entienda mejor
// cómo ha ido la sesión.
// --------------------------------------------------

function obtenerValoracionSesion(
  total: number,
  porcentajeCorrectas: number
): string {
  if (total === 0) {
    return "Sin datos suficientes";
  }

  if (porcentajeCorrectas >= 90) {
    return "Técnica muy consistente";
  }

  if (porcentajeCorrectas >= 75) {
    return "Buen control técnico";
  }

  if (porcentajeCorrectas >= 50) {
    return "Técnica mejorable";
  }

  return "Conviene priorizar la técnica";
}


// --------------------------------------------------
// CONSEJO FINAL
// --------------------------------------------------

function obtenerConsejoSesion(
  total: number,
  porcentajeCorrectas: number,
  errorPrincipal: string
): string {
  if (total === 0) {
    return "Completa varias repeticiones para poder obtener una valoración técnica de la sesión.";
  }

  if (
    porcentajeCorrectas >= 90 ||
    errorPrincipal === "Ninguno destacado"
  ) {
    return "Mantén una ejecución controlada e intenta repetir este nivel de técnica en la próxima sesión.";
  }

  if (porcentajeCorrectas >= 75) {
    return `La sesión ha sido consistente. En la próxima, presta especial atención a: ${errorPrincipal}.`;
  }

  return `Antes de buscar más repeticiones, intenta corregir principalmente: ${errorPrincipal}.`;
}


function ResultadoSesion(
  props: ResultadoSesionProps
) {
  const porcentajeRedondeado =
    Math.round(
      props.porcentajeCorrectas
    );


  const valoracion =
    obtenerValoracionSesion(
      props.total,
      porcentajeRedondeado
    );


  const consejo =
    obtenerConsejoSesion(
      props.total,
      porcentajeRedondeado,
      props.errorPrincipal
    );


  return (
    <>
      <section
        className={
          props.finalizado
            ? "analysis-section analysis-session-finished"
            : "analysis-section"
        }
      >

        <span className="analysis-section-label">
          {props.finalizado
            ? "Resultado final"
            : "Sesión"}
        </span>


        <h2>
          {props.finalizado
            ? "Resultado de la sesión"
            : "Resumen"}
        </h2>


        {props.finalizado && (
          <div className="analysis-feedback-main">

            <span>
              Valoración
            </span>


            <strong>
              {valoracion}
            </strong>

          </div>
        )}


        <div className="analysis-summary-grid">

          <div className="analysis-summary-item">

            <span>
              Analizadas
            </span>


            <strong>
              {props.total}
            </strong>

          </div>


          <div className="analysis-summary-item">

            <span>
              Correctas
            </span>


            <strong>
              {props.correctas}
            </strong>

          </div>


          <div className="analysis-summary-item">

            <span>
              Técnica correcta
            </span>


            <strong>
              {porcentajeRedondeado}%
            </strong>

          </div>


          {props.metricas.map(
            function (
              metrica
            ) {
              return (
                <div
                  key={metrica.etiqueta}
                  className="analysis-summary-item"
                >

                  <span>
                    {metrica.etiqueta}
                  </span>


                  <strong>
                    {metrica.valor}
                  </strong>

                </div>
              );
            }
          )}

        </div>


        {props.total > 0 && (
          <div className="analysis-most-common-error">

            <span>
              Error principal
            </span>


            <strong>
              {props.errorPrincipal}
            </strong>

          </div>
        )}


        {props.finalizado && (
          <div className="analysis-feedback-main">

            <span>
              Siguiente objetivo
            </span>


            <strong>
              {consejo}
            </strong>

          </div>
        )}

      </section>


      <section className="analysis-section">

        <span className="analysis-section-label">
          Detalle
        </span>


        <h2>
          Historial
        </h2>


        {!props.hayHistorial ? (
          <p className="analysis-empty-message">
            Completa una repetición para empezar a generar el historial.
          </p>
        ) : (
          <div className="analysis-history">
            {props.children}
          </div>
        )}

      </section>
    </>
  );
}


export default ResultadoSesion;
