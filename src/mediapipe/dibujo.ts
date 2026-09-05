// --------------------------------------------------
// UTILIDADES COMUNES DE MEDIAPIPE
// --------------------------------------------------
//
// Este archivo contiene funciones que pueden
// utilizar todos los ejercicios de Visión Fit.
//
// Su objetivo es evitar repetir en cada componente:
//
// - el tipo de los puntos;
// - la comprobación de visibilidad;
// - la conversión de coordenadas;
// - el dibujo de landmarks;
// - el dibujo de conexiones.
//
// IMPORTANTE:
//
// Por ahora mantenemos exactamente los mismos
// tamaños y colores que ya utilizamos.
//
// Más adelante podremos mejorar aquí
// el escalado para vídeos 1080p / 4K
// sin modificar todos los componentes.
// --------------------------------------------------


// --------------------------------------------------
// CONFIGURACIÓN GENERAL
// --------------------------------------------------

// Visibilidad mínima que hemos utilizado
// hasta ahora en los ejercicios.
export const VISIBILIDAD_MINIMA =
  0.7;


// Radio actual de cada landmark.
//
// Lo mantenemos en 8 píxeles
// para no cambiar todavía
// el comportamiento visual.
export const RADIO_LANDMARK =
  8;


// Grosor actual de las conexiones.
export const GROSOR_CONEXION =
  4;


// --------------------------------------------------
// TIPO DE PUNTO
// --------------------------------------------------

// MediaPipe devuelve:
//
// x -> posición horizontal normalizada;
// y -> posición vertical normalizada;
// visibility -> confianza de visibilidad.
//
// Cuando convertimos el punto a píxeles,
// seguimos utilizando la misma interfaz.
export interface PuntoPose {
  x: number;

  y: number;

  visibility?: number;
}


// --------------------------------------------------
// COMPROBAR VISIBILIDAD
// --------------------------------------------------

export function esLandmarkValido(
  punto: PuntoPose,
  visibilidadMinima:
    number = VISIBILIDAD_MINIMA
): boolean {
  // Algunos resultados pueden no incluir
  // la propiedad visibility.
  //
  // En ese caso no descartamos el punto.
  if (
    punto.visibility ===
    undefined
  ) {
    return true;
  }


  return (
    punto.visibility >=
    visibilidadMinima
  );
}


// --------------------------------------------------
// CONVERTIR COORDENADAS A PÍXELES
// --------------------------------------------------

// MediaPipe devuelve normalmente:
//
// x = 0 - 1
// y = 0 - 1
//
// Para dibujar sobre el canvas
// necesitamos coordenadas reales.
export function convertirAPixeles(
  punto: PuntoPose,
  canvas: HTMLCanvasElement
): PuntoPose {
  return {
    x:
      punto.x *
      canvas.width,

    y:
      punto.y *
      canvas.height,

    visibility:
      punto.visibility
  };
}


// --------------------------------------------------
// DIBUJAR LANDMARK
// --------------------------------------------------

export function dibujarLandmark(
  contexto:
    CanvasRenderingContext2D,

  punto:
    PuntoPose,

  verde:
    boolean = false
): void {
  contexto.beginPath();


  contexto.arc(
    punto.x,
    punto.y,
    RADIO_LANDMARK,
    0,
    Math.PI * 2
  );


  // Mantenemos exactamente
  // el código visual actual:
  //
  // rojo -> estado normal;
  // verde -> posición correcta.
  contexto.fillStyle =
    verde
      ? "limegreen"
      : "red";


  contexto.fill();
}


// --------------------------------------------------
// DIBUJAR CONEXIÓN
// --------------------------------------------------

export function dibujarConexion(
  contexto:
    CanvasRenderingContext2D,

  inicio:
    PuntoPose,

  fin:
    PuntoPose,

  verde:
    boolean = false
): void {
  contexto.beginPath();


  contexto.moveTo(
    inicio.x,
    inicio.y
  );


  contexto.lineTo(
    fin.x,
    fin.y
  );


  contexto.lineWidth =
    GROSOR_CONEXION;


  // Igual que antes:
  //
  // azul -> movimiento normal;
  // verde -> rango alcanzado.
  contexto.strokeStyle =
    verde
      ? "limegreen"
      : "blue";


  contexto.stroke();
}


// --------------------------------------------------
// DIBUJAR UNA CADENA DE PUNTOS
// --------------------------------------------------
//
// Esta función será útil para:
//
// CURL
// hombro -> codo -> muñeca
//
// SENTADILLA
// hombro -> cadera -> rodilla -> tobillo
//
// PRESS
// hombro -> codo -> muñeca
//
// De momento los componentes pueden seguir
// utilizando dibujarLandmark y dibujarConexion
// individualmente.
//
// La dejamos preparada para la refactorización
// que haremos posteriormente.
// --------------------------------------------------

export function dibujarCadena(
  contexto:
    CanvasRenderingContext2D,

  puntos:
    PuntoPose[],

  verde:
    boolean = false
): void {
  // ----------------------------------------------
  // CONEXIONES
  // ----------------------------------------------

  for (
    let indice = 0;
    indice <
    puntos.length - 1;
    indice++
  ) {
    dibujarConexion(
      contexto,
      puntos[indice],
      puntos[indice + 1],
      verde
    );
  }


  // ----------------------------------------------
  // LANDMARKS
  // ----------------------------------------------

  puntos.forEach(
    function (punto) {
      dibujarLandmark(
        contexto,
        punto,
        verde
      );
    }
  );
}