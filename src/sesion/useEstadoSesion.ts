// Importamos los hooks necesarios de React.
import {
  useCallback,
  useReducer,
  useRef
} from "react";

import {
  ESTADO_SESION_INICIAL,
  obtenerSiguienteEstadoSesion,
  reducerEstadoSesion
} from "./estadoSesion";

import type {
  EventoSesion,
  EstadoSesion
} from "./estadoSesion";


// ==================================================
// HOOK COMPARTIDO DE LA MÁQUINA DE ESTADOS
// ==================================================
//
// Curl, Sentadilla y Press utilizan exactamente
// la misma máquina de estados de sesión.
//
// Este hook evita repetir en cada ejercicio:
// - useReducer;
// - estadoSesionRef;
// - la función aplicarEventoSesion.
//
// La cuenta atrás y la lógica específica de cada
// ejercicio siguen fuera del hook por ahora.
// ==================================================

export function useEstadoSesion() {
  const [
    estadoSesion,
    enviarEventoSesion
  ] =
    useReducer(
      reducerEstadoSesion,
      ESTADO_SESION_INICIAL
    );


  // requestAnimationFrame necesita consultar
  // inmediatamente el estado actual de la sesión.
  const estadoSesionRef =
    useRef<EstadoSesion>(
      ESTADO_SESION_INICIAL
    );


  // Aplicamos el evento tanto al reducer de React
  // como al ref que consulta el bucle de frames.
  const aplicarEventoSesion =
    useCallback(
      function aplicarEventoSesionCallback(
        evento: EventoSesion
      ) {
        const siguienteEstado =
          obtenerSiguienteEstadoSesion(
            estadoSesionRef.current,
            evento
          );


        estadoSesionRef.current =
          siguienteEstado;


        enviarEventoSesion(
          evento
        );
      },
      []
    );


  return {
    estadoSesion,
    estadoSesionRef,
    aplicarEventoSesion
  };
}
