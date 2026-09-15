// Importamos los hooks necesarios de React.
import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import {
  useEstadoSesion
} from "./useEstadoSesion";


// ==================================================
// CONTROL COMPARTIDO DE UNA SESIÓN
// ==================================================
//
// Este hook centraliza el flujo común que utilizan
// Curl, Sentadilla y Press de hombro:
//
// preparación
//      ↓
// cuenta atrás 3 - 2 - 1
//      ↓
// análisis
//      ↓
// finalizado
//
// La lógica específica de cada ejercicio continúa
// fuera de este hook. Por ejemplo, cada ejercicio
// decide cómo reiniciar sus propios datos internos
// justo antes de comenzar el análisis.
// ==================================================

export function useControlSesion() {
  const {
    estadoSesion,
    estadoSesionRef,
    aplicarEventoSesion
  } =
    useEstadoSesion();


  // Número mostrado durante la cuenta atrás.
  // null significa que no hay cuenta atrás activa.
  const [
    cuentaAtras,
    setCuentaAtras
  ] =
    useState<number | null>(
      null
    );


  // Guardamos el intervalo para poder cancelarlo
  // al reiniciar o desmontar el componente.
  const intervaloCuentaAtrasRef =
    useRef<number | null>(
      null
    );


  // --------------------------------------------------
  // CANCELAR CUENTA ATRÁS
  // --------------------------------------------------

  const cancelarCuentaAtras =
    useCallback(
      function cancelarCuentaAtrasCallback() {
        if (
          intervaloCuentaAtrasRef.current ===
          null
        ) {
          return;
        }


        window.clearInterval(
          intervaloCuentaAtrasRef.current
        );


        intervaloCuentaAtrasRef.current =
          null;
      },
      []
    );


  // Si el componente desaparece mientras existe
  // una cuenta atrás, eliminamos el intervalo.
  useEffect(
    function gestionarLimpiezaCuentaAtras() {
      return function limpiarCuentaAtras() {
        cancelarCuentaAtras();
      };
    },
    [
      cancelarCuentaAtras
    ]
  );


  // --------------------------------------------------
  // PREPARAR UN REINICIO
  // --------------------------------------------------
  //
  // Esta función NO actualiza estados de React.
  // Únicamente bloquea inmediatamente el análisis
  // y cancela una posible cuenta atrás.
  //
  // Esto permite utilizarla dentro de un useEffect
  // sin provocar el aviso set-state-in-effect.
  // --------------------------------------------------

  const prepararReinicioSesion =
    useCallback(
      function prepararReinicioSesionCallback() {
        estadoSesionRef.current =
          "preparacion";


        cancelarCuentaAtras();
      },
      [
        cancelarCuentaAtras,
        estadoSesionRef
      ]
    );


  // --------------------------------------------------
  // REINICIAR SESIÓN
  // --------------------------------------------------
  //
  // La llamada que actualiza React se mantiene
  // separada de prepararReinicioSesion para que
  // CameraPreview pueda ejecutarla de forma
  // asíncrona junto al resto de sus setState().
  // --------------------------------------------------

  const reiniciarSesion =
    useCallback(
      function reiniciarSesionCallback() {
        aplicarEventoSesion({
          type: "REINICIAR"
        });


        setCuentaAtras(
          null
        );
      },
      [
        aplicarEventoSesion
      ]
    );


  // --------------------------------------------------
  // EMPEZAR ANÁLISIS
  // --------------------------------------------------
  //
  // Recibimos una función que contiene únicamente
  // la preparación específica del ejercicio.
  //
  // Ejemplo para Curl:
  // - crearEstadoCurl();
  // - limpiar feedback verde;
  // - reiniciar controles internos.
  // --------------------------------------------------

  const empezarAnalisis =
    useCallback(
      function empezarAnalisisCallback(
        prepararEjercicio:
          () => void
      ) {
        // Solo se puede iniciar desde preparación.
        if (
          estadoSesionRef.current !==
          "preparacion"
        ) {
          return;
        }


        // Evitamos mantener un intervalo anterior.
        cancelarCuentaAtras();


        aplicarEventoSesion({
          type: "INICIAR_CUENTA_ATRAS"
        });


        setCuentaAtras(
          3
        );


        let valorCuentaAtras =
          3;


        intervaloCuentaAtrasRef.current =
          window.setInterval(
            function actualizarCuentaAtras() {
              valorCuentaAtras -=
                1;


              if (
                valorCuentaAtras >
                0
              ) {
                setCuentaAtras(
                  valorCuentaAtras
                );


                return;
              }


              // La cuenta atrás ha terminado.
              cancelarCuentaAtras();


              // Cada ejercicio limpia aquí
              // únicamente su estado específico.
              prepararEjercicio();


              setCuentaAtras(
                null
              );


              aplicarEventoSesion({
                type: "COMENZAR_ANALISIS"
              });
            },
            1000
          );
      },
      [
        aplicarEventoSesion,
        cancelarCuentaAtras,
        estadoSesionRef
      ]
    );


  // --------------------------------------------------
  // FINALIZAR ANÁLISIS
  // --------------------------------------------------

  const finalizarAnalisis =
    useCallback(
      function finalizarAnalisisCallback(
        limpiarEjercicio?:
          () => void
      ) {
        // Solo puede finalizar una sesión activa.
        if (
          estadoSesionRef.current !==
          "analizando"
        ) {
          return;
        }


        aplicarEventoSesion({
          type: "FINALIZAR_ANALISIS"
        });


        // Cada ejercicio puede limpiar aquí
        // información visual temporal, como
        // el feedback verde.
        if (
          limpiarEjercicio
        ) {
          limpiarEjercicio();
        }
      },
      [
        aplicarEventoSesion,
        estadoSesionRef
      ]
    );


  return {
    estadoSesion,
    estadoSesionRef,
    cuentaAtras,
    empezarAnalisis,
    finalizarAnalisis,
    prepararReinicioSesion,
    reiniciarSesion
  };
}
