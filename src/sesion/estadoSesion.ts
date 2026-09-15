// ==================================================
// MÁQUINA DE ESTADOS DE UNA SESIÓN DE VISIÓN FIT
// ==================================================
//
// Este archivo define los estados posibles de una
// sesión y las transiciones válidas entre ellos.
//
// La lógica del ejercicio (curl, sentadilla, press...)
// no decide directamente a qué estado saltar.
// En su lugar envía un evento a esta máquina.
// ==================================================

export type EstadoSesion =
  | "preparacion"
  | "cuenta-atras"
  | "analizando"
  | "finalizado";


export type EventoSesion =
  | {
      type: "INICIAR_CUENTA_ATRAS";
    }
  | {
      type: "COMENZAR_ANALISIS";
    }
  | {
      type: "FINALIZAR_ANALISIS";
    }
  | {
      type: "REINICIAR";
    };


export const ESTADO_SESION_INICIAL:
  EstadoSesion =
  "preparacion";


// --------------------------------------------------
// TRANSICIONES
// --------------------------------------------------
//
// Flujo permitido:
//
// preparacion
//      ↓ INICIAR_CUENTA_ATRAS
// cuenta-atras
//      ↓ COMENZAR_ANALISIS
// analizando
//      ↓ FINALIZAR_ANALISIS
// finalizado
//
// REINICIAR devuelve cualquier estado a preparacion.
//
// Si llega un evento que no corresponde al estado
// actual, la máquina mantiene el estado anterior.
// --------------------------------------------------

export function obtenerSiguienteEstadoSesion(
  estadoActual: EstadoSesion,
  evento: EventoSesion
): EstadoSesion {
  if (
    evento.type ===
    "REINICIAR"
  ) {
    return "preparacion";
  }


  if (
    estadoActual ===
      "preparacion" &&
    evento.type ===
      "INICIAR_CUENTA_ATRAS"
  ) {
    return "cuenta-atras";
  }


  if (
    estadoActual ===
      "cuenta-atras" &&
    evento.type ===
      "COMENZAR_ANALISIS"
  ) {
    return "analizando";
  }


  if (
    estadoActual ===
      "analizando" &&
    evento.type ===
      "FINALIZAR_ANALISIS"
  ) {
    return "finalizado";
  }


  return estadoActual;
}


// --------------------------------------------------
// REDUCER PARA REACT
// --------------------------------------------------
//
// useReducer utiliza esta función como única puerta
// de entrada para cambiar el estado de la sesión.
// --------------------------------------------------

export function reducerEstadoSesion(
  estadoActual: EstadoSesion,
  evento: EventoSesion
): EstadoSesion {
  return obtenerSiguienteEstadoSesion(
    estadoActual,
    evento
  );
}
