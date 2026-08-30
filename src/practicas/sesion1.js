console.log("=== Evaluación básica del curl ===");

const visibilidadMinima = 0.7;

const esLandmarkValido = (visibilidad, minimo) =>
  visibilidad >= minimo;

const incrementarRepeticiones = (cantidadActual) =>
  cantidadActual + 1;

const evaluarRepeticionCurl = (
  visibilidadHombro,
  visibilidadCodo,
  visibilidadMuneca,
  anguloCodo
) => {
  const hombroValido = esLandmarkValido(visibilidadHombro, visibilidadMinima);
  const codoValido = esLandmarkValido(visibilidadCodo, visibilidadMinima);
  const munecaValida = esLandmarkValido(visibilidadMuneca, visibilidadMinima);

  const brazoValido =
    hombroValido && codoValido && munecaValida;

  if (!brazoValido) {
    console.log("No se puede analizar: brazo incompleto");
    return false;
  }

  if (anguloCodo > 60) {
    console.log("Flexiona más el brazo");
    return false;
  }

  console.log("Repetición correcta");
  return true;
};

let repeticiones = 0;

const repeticion1 = evaluarRepeticionCurl(
  0.92,
  0.88,
  0.90,
  50
);

if (repeticion1) {
  repeticiones = incrementarRepeticiones(repeticiones);
}

const repeticion2 = evaluarRepeticionCurl(
  0.92,
  0.88,
  0.55,
  50
);

if (repeticion2) {
  repeticiones = incrementarRepeticiones(repeticiones);
}

const repeticion3 = evaluarRepeticionCurl(
  0.92,
  0.88,
  0.90,
  85
);

if (repeticion3) {
  repeticiones = incrementarRepeticiones(repeticiones);
}

console.log(
  "Repeticiones contabilizadas:",
  repeticiones
);