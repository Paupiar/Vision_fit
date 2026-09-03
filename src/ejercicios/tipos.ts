// --------------------------------------------------
// EJERCICIOS DE VISIÓN FIT
// --------------------------------------------------

// Identificadores internos de los ejercicios.
//
// Utilizamos valores sencillos para poder
// utilizarlos después en:
// - selectores;
// - analizadores;
// - vídeos;
// - cámara;
// - historial;
// - configuración.
export type EjercicioId =
  "curl" |
  "sentadilla" |
  "press-hombro";


// --------------------------------------------------
// INFORMACIÓN DE UN EJERCICIO
// --------------------------------------------------

export interface Ejercicio {
  // Identificador utilizado internamente.
  id: EjercicioId;

  // Nombre que verá el usuario.
  nombre: string;

  // Indica si el análisis del ejercicio
  // está implementado actualmente.
  disponible: boolean;
}


// --------------------------------------------------
// LISTA DE EJERCICIOS
// --------------------------------------------------

// Tener los ejercicios en una lista
// nos permitirá generar automáticamente
// la interfaz.
//
// Cuando implementemos uno nuevo,
// simplemente cambiaremos disponible
// a true.
export const EJERCICIOS:
  Ejercicio[] = [
    {
      id:
        "curl",

      nombre:
        "Curl de bíceps",

      disponible:
        true
    },

    {
      id:
        "sentadilla",

      nombre:
        "Sentadilla",

      disponible:
        false
    },

    {
      id:
        "press-hombro",

      nombre:
        "Press de hombro",

      disponible:
        false
    }
  ];