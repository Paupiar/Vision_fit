// Importamos los hooks necesarios de React.
import {
  useCallback,
  useRef,
  useState
} from "react";


// ==================================================
// MÉTRICAS DE RENDIMIENTO
// ==================================================

// Este hook centraliza la medición del rendimiento
// para poder reutilizarla en todos los ejercicios.
function useMetricasRendimiento() {
  // Instante en el que comenzó la ventana
  // actual de medición de FPS.
  const inicioVentanaFpsRef =
    useRef<number | null>(
      null
    );


  // Número de frames procesados
  // durante la ventana actual.
  const framesVentanaFpsRef =
    useRef<number>(
      0
    );


  // Número total de frames procesados
  // durante la sesión actual.
  const framesAnalizadosRef =
    useRef<number>(
      0
    );


  // Suma del tiempo empleado
  // únicamente por MediaPipe.
  const tiempoInferenciaTotalRef =
    useRef<number>(
      0
    );


  // FPS procesados durante
  // la última ventana de medición.
  const [
    fpsAnalisis,
    setFpsAnalisis
  ] =
    useState<number>(
      0
    );


  // Tiempo medio que tarda
  // MediaPipe en procesar un frame.
  const [
    latenciaMedia,
    setLatenciaMedia
  ] =
    useState<number>(
      0
    );


  // Total de frames enviados
  // al detector durante la sesión.
  const [
    framesAnalizados,
    setFramesAnalizados
  ] =
    useState<number>(
      0
    );


  // Publica en la interfaz el total de frames
  // y la latencia media acumulada.
  //
  // useCallback mantiene estable la función
  // entre renders del componente consumidor.
  const publicarMetricas =
    useCallback(
      function publicarMetricas() {
        const framesTotales =
          framesAnalizadosRef.current;


        const tiempoTotal =
          tiempoInferenciaTotalRef.current;


        const latenciaCalculada =
          framesTotales > 0
            ? tiempoTotal / framesTotales
            : 0;


        setFramesAnalizados(
          framesTotales
        );


        setLatenciaMedia(
          Math.round(
            latenciaCalculada * 10
          ) / 10
        );
      },
      []
    );


  // Registra una inferencia y actualiza
  // las métricas visibles una vez por segundo.
  const registrarInferencia =
    useCallback(
      function registrarInferencia(
        inicioInferencia: number,
        finInferencia: number
      ) {
        const duracionInferencia =
          finInferencia -
          inicioInferencia;


        framesAnalizadosRef.current +=
          1;


        framesVentanaFpsRef.current +=
          1;


        tiempoInferenciaTotalRef.current +=
          duracionInferencia;


        // La primera inferencia abre
        // una nueva ventana de medición.
        if (
          inicioVentanaFpsRef.current ===
          null
        ) {
          inicioVentanaFpsRef.current =
            inicioInferencia;
        }


        const duracionVentana =
          finInferencia -
          inicioVentanaFpsRef.current;


        // Actualizamos React una vez por segundo
        // para no provocar un render por frame.
        if (
          duracionVentana < 1000
        ) {
          return;
        }


        const fpsCalculados =
          framesVentanaFpsRef.current /
          (
            duracionVentana /
            1000
          );


        setFpsAnalisis(
          Math.round(
            fpsCalculados * 10
          ) / 10
        );


        publicarMetricas();


        // Comenzamos la siguiente
        // ventana de medición.
        inicioVentanaFpsRef.current =
          finInferencia;


        framesVentanaFpsRef.current =
          0;
      },
      [
        publicarMetricas
      ]
    );


  // Cierra la ventana actual para que una pausa
  // no reduzca artificialmente los FPS.
  // Los acumulados de la sesión se conservan.
  const cerrarVentanaFps =
    useCallback(
      function cerrarVentanaFps() {
        inicioVentanaFpsRef.current =
          null;


        framesVentanaFpsRef.current =
          0;
      },
      []
    );


  // Devuelve todas las métricas a cero
  // al comenzar una sesión nueva.
  const reiniciarMetricas =
    useCallback(
      function reiniciarMetricas() {
        cerrarVentanaFps();


        framesAnalizadosRef.current =
          0;


        tiempoInferenciaTotalRef.current =
          0;


        setFpsAnalisis(
          0
        );


        setLatenciaMedia(
          0
        );


        setFramesAnalizados(
          0
        );
      },
      [
        cerrarVentanaFps
      ]
    );


  return {
    fpsAnalisis,
    latenciaMedia,
    framesAnalizados,
    registrarInferencia,
    publicarMetricas,
    cerrarVentanaFps,
    reiniciarMetricas
  };
}


export default useMetricasRendimiento;
