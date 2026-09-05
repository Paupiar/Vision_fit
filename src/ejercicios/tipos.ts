// --------------------------------------------------
// EJERCICIOS DE VISIÓN FIT
// --------------------------------------------------
//
// En este archivo definimos:
//
// - los identificadores de ejercicios;
// - la información que necesita cada ejercicio;
// - qué ejercicios están disponibles.
//
// App.tsx utilizará esta lista para generar
// automáticamente los botones.
// --------------------------------------------------


// --------------------------------------------------
// IDENTIFICADORES
// --------------------------------------------------

// Identificadores internos de los ejercicios.
//
// Utilizamos valores cortos porque después
// los emplearemos para decidir qué componente
// y qué analizador debemos utilizar.
export type EjercicioId =
  "curl" |
  "sentadilla" |
  "press-hombro";


// --------------------------------------------------
// INTERFAZ DE EJERCICIO
// --------------------------------------------------

// Define la información mínima
// que necesitamos de cada ejercicio.
export interface Ejercicio {
  // Identificador interno.
  id: EjercicioId;

  // Nombre que verá el usuario.
  nombre: string;

  // Indica si el ejercicio
  // puede utilizarse actualmente.
  disponible: boolean;
}


// --------------------------------------------------
// LISTA DE EJERCICIOS
// --------------------------------------------------

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

    // Ya está disponible para comenzar
    // las pruebas con cámara.
    //
    // El análisis se realizará de frente
    // utilizando los dos brazos.
    {
      id:
        "press-hombro",

      nombre:
        "Press de hombro",

      disponible:
        true
    }

  ];