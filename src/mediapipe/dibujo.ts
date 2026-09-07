// --------------------------------------------------
// CONFIGURACIÓN DE DIBUJO
// --------------------------------------------------
//
// Estos valores representan ahora
// el tamaño VISUAL aproximado
// que queremos ver en pantalla.
//
// Ya no representan directamente
// píxeles internos del canvas.
//
// Esto permite que un vídeo 4K,
// 1080p o 720p muestre los puntos
// con un tamaño visual parecido.
// --------------------------------------------------

export const VISIBILIDAD_MINIMA =
  0.7;


// Radio visual aproximado
// de cada landmark.
export const RADIO_LANDMARK =
  8;


// Grosor visual aproximado
// de las conexiones.
export const GROSOR_CONEXION =
  4;


// --------------------------------------------------
// TIPO DE PUNTO
// --------------------------------------------------

export interface PuntoPose {
  x: number;

  y: number;

  visibility?: number;
}


// ==================================================
// COMPROBAR VISIBILIDAD
// ==================================================

export function esLandmarkValido(
  punto: PuntoPose,
  visibilidadMinima:
    number =
    VISIBILIDAD_MINIMA
): boolean {
  // Algunos puntos creados manualmente
  // pueden no tener visibility.
  //
  // En ese caso consideramos
  // que el punto es válido.
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


// ==================================================
// CONVERTIR COORDENADAS A PÍXELES
// ==================================================
//
// MediaPipe devuelve normalmente:
//
// x -> entre 0 y 1
// y -> entre 0 y 1
//
// Las convertimos a las dimensiones
// internas reales del canvas.
// ==================================================

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


// ==================================================
// CALCULAR ESCALA DEL CANVAS
// ==================================================
//
// El canvas tiene dos tamaños:
//
// 1. Tamaño interno:
//
//    canvas.width
//
//    Por ejemplo:
//    3840 px.
//
// 2. Tamaño mostrado mediante CSS:
//
//    getBoundingClientRect().width
//
//    Por ejemplo:
//    640 px.
//
// Si dibujásemos siempre un punto
// de radio 8 dentro de un canvas 4K,
// al reducirse visualmente sería
// prácticamente invisible.
//
// Por eso calculamos:
//
// tamaño interno / tamaño mostrado.
//
// Ejemplo:
//
// 3840 / 640 = 6
//
// Después multiplicaremos el tamaño
// del punto y de la línea por 6.
// ==================================================

export function calcularEscalaCanvas(
  canvas: HTMLCanvasElement
): number {
  const rectangulo =
    canvas.getBoundingClientRect();


  const anchoMostrado =
    rectangulo.width;


  // Si el canvas todavía no está
  // visible o no tiene tamaño CSS,
  // evitamos dividir entre cero.
  if (
    anchoMostrado <=
    0
  ) {
    return 1;
  }


  const escala =
    canvas.width /
    anchoMostrado;


  // Protección adicional
  // por si apareciese un valor
  // no válido.
  if (
    !Number.isFinite(
      escala
    ) ||
    escala <=
    0
  ) {
    return 1;
  }


  return escala;
}


// ==================================================
// RADIO RESPONSIVE
// ==================================================
//
// Devuelve el radio interno
// que debemos utilizar para que
// el punto mantenga aproximadamente
// RADIO_LANDMARK píxeles visuales.
// ==================================================

export function calcularRadioLandmark(
  canvas: HTMLCanvasElement
): number {
  const escala =
    calcularEscalaCanvas(
      canvas
    );


  return (
    RADIO_LANDMARK *
    escala
  );
}


// ==================================================
// GROSOR RESPONSIVE
// ==================================================
//
// Hace lo mismo para las líneas.
// ==================================================

export function calcularGrosorConexion(
  canvas: HTMLCanvasElement
): number {
  const escala =
    calcularEscalaCanvas(
      canvas
    );


  return (
    GROSOR_CONEXION *
    escala
  );
}


// ==================================================
// DIBUJAR LANDMARK
// ==================================================

export function dibujarLandmark(
  contexto:
    CanvasRenderingContext2D,
  punto:
    PuntoPose,
  verde:
    boolean =
    false
): void {
  // Obtenemos automáticamente
  // el canvas asociado al contexto.
  const canvas =
    contexto.canvas;


  // Calculamos el radio
  // adaptado a la resolución.
  const radio =
    calcularRadioLandmark(
      canvas
    );


  contexto.beginPath();


  contexto.arc(
    punto.x,
    punto.y,
    radio,
    0,
    Math.PI *
      2
  );


  // Verde cuando existe
  // feedback positivo.
  //
  // Rojo durante
  // el análisis normal.
  contexto.fillStyle =
    verde
      ? "limegreen"
      : "red";


  contexto.fill();
}


// ==================================================
// DIBUJAR CONEXIÓN
// ==================================================

export function dibujarConexion(
  contexto:
    CanvasRenderingContext2D,
  inicio:
    PuntoPose,
  fin:
    PuntoPose,
  verde:
    boolean =
    false
): void {
  const canvas =
    contexto.canvas;


  // Calculamos el grosor
  // adaptado a la resolución.
  const grosor =
    calcularGrosorConexion(
      canvas
    );


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
    grosor;


  contexto.strokeStyle =
    verde
      ? "limegreen"
      : "blue";


  contexto.stroke();
}


// ==================================================
// DIBUJAR CADENA DE PUNTOS
// ==================================================
//
// Permite dibujar:
//
// punto -> punto -> punto...
//
// Aunque actualmente algunos ejercicios
// dibujan sus conexiones manualmente,
// mantenemos esta utilidad común.
// ==================================================

export function dibujarCadena(
  contexto:
    CanvasRenderingContext2D,
  puntos:
    PuntoPose[],
  verde:
    boolean =
    false
): void {
  // ----------------------------------------------
  // CONEXIONES
  // ----------------------------------------------

  for (
    let indice =
      0;
    indice <
    puntos.length -
      1;
    indice++
  ) {
    dibujarConexion(
      contexto,
      puntos[
        indice
      ],
      puntos[
        indice +
        1
      ],
      verde
    );
  }


  // ----------------------------------------------
  // LANDMARKS
  // ----------------------------------------------

  puntos.forEach(
    function (
      punto
    ) {
      dibujarLandmark(
        contexto,
        punto,
        verde
      );
    }
  );
}