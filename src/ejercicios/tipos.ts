// --------------------------------------------------
// EJERCICIOS DE VISIÓN FIT
// --------------------------------------------------

// Identificadores internos
// de los ejercicios.
//
// Estos valores nos permiten saber
// qué ejercicio ha seleccionado
// el usuario en App.tsx.
export type EjercicioId =
  "curl" |
  "sentadilla" |
  "press-hombro";


// --------------------------------------------------
// INFORMACIÓN DE UN EJERCICIO
// --------------------------------------------------

// Define la información básica
// que necesita cada ejercicio
// para aparecer en la interfaz.
export interface Ejercicio {
  // Identificador interno.
  id: EjercicioId;

  // Nombre que verá el usuario.
  nombre: string;

  // Indica si el ejercicio
  // ya puede seleccionarse.
  disponible: boolean;
}


// --------------------------------------------------
// LISTA DE EJERCICIOS
// --------------------------------------------------

// Esta lista genera automáticamente
// los botones de ejercicios.
//
// Cuando implementemos un ejercicio nuevo,
// podremos simplemente cambiar:
//
// disponible: false
//
// por:
//
// disponible: true
export const EJERCICIOS:
  Ejercicio[] = [

    // ------------------------------------------------
    // CURL DE BÍCEPS
    // ------------------------------------------------

    {
      id:
        "curl",

      nombre:
        "Curl de bíceps",

      disponible:
        true
    },


    // ------------------------------------------------
    // SENTADILLA
    // ------------------------------------------------

    // Ya empezamos a implementar
    // el análisis de sentadilla.
    {
      id:
        "sentadilla",

      nombre:
        "Sentadilla",

      disponible:
        true
    },


    // ------------------------------------------------
    // PRESS DE HOMBRO
    // ------------------------------------------------

    // Todavía no hemos creado
    // su analizador.
    {
      id:
        "press-hombro",

      nombre:
        "Press de hombro",

      disponible:
        false
    }

  ];