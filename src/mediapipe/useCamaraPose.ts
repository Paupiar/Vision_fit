// Importamos useEffect porque el hook debe
// sincronizar React con dos sistemas externos:
// la webcam del navegador y MediaPipe.
import {
  useEffect
} from "react";

// Tipo del detector de pose de MediaPipe.
import type {
  PoseLandmarker
} from "@mediapipe/tasks-vision";


// --------------------------------------------------
// MEDIAPIPE
// --------------------------------------------------

import {
  crearPoseLandmarker
} from "./pose";


// --------------------------------------------------
// GESTIÓN DE ERRORES
// --------------------------------------------------

import {
  obtenerMensajeErrorCamara,
  obtenerMensajeErrorMediaPipe
} from "./errores";


// ==================================================
// TIPOS AUXILIARES
// ==================================================

// Usamos una interfaz mínima para las refs.
// Así el hook puede trabajar con las referencias
// creadas mediante useRef() sin depender de
// detalles internos de los tipos de React.
interface ReferenciaMutable<T> {
  current: T;
}


interface ParametrosUseCamaraPose {
  // Elemento <video> donde mostramos la webcam.
  videoRef:
    ReferenciaMutable<
      HTMLVideoElement | null
    >;

  // Detector de MediaPipe utilizado por
  // el ejercicio para analizar los frames.
  poseLandmarkerRef:
    ReferenciaMutable<
      PoseLandmarker | null
    >;

  // Identificador del bucle de
  // requestAnimationFrame del ejercicio.
  animationFrameRef:
    ReferenciaMutable<
      number | null
    >;

  // Función propia del ejercicio que pone
  // en marcha su bucle de análisis.
  iniciarAnalisis:
    () => void;

  // Permite mostrar en CameraPreview
  // los errores de cámara o MediaPipe.
  setErrorSistema:
    (mensaje: string | null) => void;

  // Solo se utiliza para que los mensajes
  // de consola indiquen qué ejercicio falló.
  nombreEjercicio:
    string;
}


// ==================================================
// HOOK COMPARTIDO DE CÁMARA + MEDIAPIPE
// ==================================================

export function useCamaraPose(
  parametros: ParametrosUseCamaraPose
) {
  const {
    videoRef,
    poseLandmarkerRef,
    animationFrameRef,
    iniciarAnalisis,
    setErrorSistema,
    nombreEjercicio
  } =
    parametros;


  useEffect(
    function gestionarCamaraYMediaPipe() {
      // Stream real de la webcam.
      // Lo guardamos dentro del efecto para poder
      // detener exactamente esas pistas al desmontar.
      let stream:
        MediaStream | null =
        null;


      // Evita actualizar el componente si el usuario
      // cambia de ejercicio mientras esperamos permisos
      // o mientras se está cargando MediaPipe.
      let componenteActivo =
        true;


      // Guardamos el elemento de vídeo asociado
      // a esta ejecución concreta del efecto.
      //
      // El cleanup utiliza esta referencia y no
      // videoRef.current para evitar avisos de ESLint
      // y desconectar exactamente el mismo elemento.
      const videoActual =
        videoRef.current;


      async function iniciarSistema() {
        let nuevoStream:
          MediaStream;


        // ------------------------------------------
        // 1. PEDIR ACCESO A LA CÁMARA
        // ------------------------------------------

        try {
          nuevoStream =
            await navigator.mediaDevices
              .getUserMedia({
                video:
                  true,

                audio:
                  false
              });

        } catch (error) {
          console.error(
            `Error al iniciar la cámara de ${nombreEjercicio}:`,
            error
          );


          if (
            componenteActivo
          ) {
            setErrorSistema(
              obtenerMensajeErrorCamara(
                error
              )
            );
          }


          return;
        }


        // Si el componente desapareció mientras
        // esperábamos el permiso, apagamos la webcam
        // inmediatamente y no continuamos.
        if (
          !componenteActivo
        ) {
          nuevoStream
            .getTracks()
            .forEach(
              function detenerTrack(track) {
                track.stop();
              }
            );


          return;
        }


        stream =
          nuevoStream;


        if (
          videoRef.current
        ) {
          videoRef.current.srcObject =
            stream;
        }


        // ------------------------------------------
        // 2. CARGAR MEDIAPIPE
        // ------------------------------------------

        try {
          const poseLandmarker =
            await crearPoseLandmarker();


          if (
            !componenteActivo
          ) {
            return;
          }


          poseLandmarkerRef.current =
            poseLandmarker;


          // Si previamente había un error visible,
          // una inicialización correcta lo elimina.
          setErrorSistema(
            null
          );


          // Puede ocurrir que el <video> ya esté listo
          // antes de que MediaPipe termine de cargar.
          // En ese caso iniciamos el análisis aquí.
          if (
            videoRef.current &&
            videoRef.current.readyState >=
              2
          ) {
            iniciarAnalisis();
          }

        } catch (error) {
          // Si MediaPipe falla después de haber abierto
          // la cámara, cerramos también el stream.
          if (
            stream
          ) {
            stream
              .getTracks()
              .forEach(
                function detenerTrack(track) {
                  track.stop();
                }
              );


            stream =
              null;
          }


          if (
            videoRef.current
          ) {
            videoRef.current.srcObject =
              null;
          }


          if (
            componenteActivo
          ) {
            setErrorSistema(
              obtenerMensajeErrorMediaPipe(
                error
              )
            );
          }
        }
      }


      iniciarSistema();


      // --------------------------------------------
      // 3. LIMPIEZA
      // --------------------------------------------

      return function detenerSistema() {
        componenteActivo =
          false;


        // Detenemos el bucle de análisis del ejercicio.
        if (
          animationFrameRef.current !==
          null
        ) {
          cancelAnimationFrame(
            animationFrameRef.current
          );


          animationFrameRef.current =
            null;
        }


        // Apagamos físicamente la webcam.
        if (
          stream
        ) {
          stream
            .getTracks()
            .forEach(
              function detenerTrack(track) {
                track.stop();
              }
            );
        }


        // Desconectamos el stream del elemento
        // de vídeo que pertenecía a este efecto.
        if (
          videoActual
        ) {
          videoActual.srcObject =
            null;
        }
      };
    },
    [
      animationFrameRef,
      iniciarAnalisis,
      nombreEjercicio,
      poseLandmarkerRef,
      setErrorSistema,
      videoRef
    ]
  );
}
