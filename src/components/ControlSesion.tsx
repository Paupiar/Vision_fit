import type {
  ReactNode
} from "react";

import type {
  EstadoSesion
} from "../sesion/estadoSesion";


// ==================================================
// CONTROL VISUAL COMPARTIDO DE LA SESIÓN
// ==================================================
//
// Este componente centraliza la interfaz que se
// repite en Curl, Sentadilla y Press de hombro:
//
// - pantalla de preparación;
// - cuenta atrás 3 - 2 - 1;
// - botón para empezar;
// - botón para finalizar;
// - pantalla de sesión finalizada.
//
// El contenido específico del ejercicio durante el
// análisis se recibe mediante props.children.
// ==================================================

interface ControlSesionProps {
  estadoSesion: EstadoSesion;

  cuentaAtras: number | null;

  etiquetaPreparacion: string;

  tituloPreparacion: string;

  introduccion: string;

  instrucciones: string[];

  etiquetaDetalle: string;

  valorDetalle: string;

  mensajeCuentaAtras: string;

  totalRepeticiones: number;

  onEmpezar: () => void;

  onFinalizar: () => void;

  children: ReactNode;
}


function ControlSesion(
  props: ControlSesionProps
) {
  // --------------------------------------------------
  // PREPARACIÓN
  // --------------------------------------------------

  if (
    props.estadoSesion ===
    "preparacion"
  ) {
    return (
      <section className="analysis-section analysis-current analysis-preparation">

        <span className="analysis-section-label">
          {props.etiquetaPreparacion}
        </span>


        <h2>
          {props.tituloPreparacion}
        </h2>


        <p className="analysis-preparation-intro">
          {props.introduccion}
        </p>


        <div className="analysis-preparation-list">

          {props.instrucciones.map(
            function (
              instruccion,
              indice
            ) {
              return (
                <p key={indice}>
                  <strong>
                    {indice + 1}.
                  </strong>{" "}
                  {instruccion}
                </p>
              );
            }
          )}

        </div>


        <div className="analysis-preparation-side">

          <span>
            {props.etiquetaDetalle}
          </span>


          <strong>
            {props.valorDetalle}
          </strong>

        </div>


        <button
          type="button"
          className="analysis-start-button"
          onClick={props.onEmpezar}
        >
          Empezar análisis
        </button>

      </section>
    );
  }


  // --------------------------------------------------
  // CUENTA ATRÁS
  // --------------------------------------------------

  if (
    props.estadoSesion ===
    "cuenta-atras"
  ) {
    return (
      <section className="analysis-section analysis-current analysis-preparation">

        <span className="analysis-section-label">
          Preparación
        </span>


        <div className="analysis-countdown">

          <h2>
            Prepárate
          </h2>


          <div className="analysis-countdown-number">
            {props.cuentaAtras}
          </div>


          <p>
            {props.mensajeCuentaAtras}
          </p>

        </div>

      </section>
    );
  }


  // --------------------------------------------------
  // SESIÓN FINALIZADA
  // --------------------------------------------------

  if (
    props.estadoSesion ===
    "finalizado"
  ) {
    return (
      <section className="analysis-section analysis-current analysis-session-finished">

        <span className="analysis-section-label">
          Sesión completada
        </span>


        <h2>
          Análisis finalizado
        </h2>


        <p>
          El análisis está detenido. Puedes revisar los resultados de la sesión o pulsar Reiniciar análisis para comenzar una nueva.
        </p>


        <div className="analysis-finished-total">

          <span>
            Repeticiones analizadas
          </span>


          <strong>
            {props.totalRepeticiones}
          </strong>

        </div>

      </section>
    );
  }


  // --------------------------------------------------
  // ANÁLISIS ACTIVO
  // --------------------------------------------------
  //
  // El componente común crea la tarjeta principal
  // y cada ejercicio aporta únicamente sus métricas,
  // feedback y controles específicos.
  // --------------------------------------------------

  return (
    <section className="analysis-section analysis-current">

      {props.children}


      <button
        type="button"
        className="analysis-finish-button"
        onClick={props.onFinalizar}
      >
        Finalizar análisis
      </button>

    </section>
  );
}


export default ControlSesion;
