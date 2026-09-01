
const sesion = {
  ejercicio: "curl",
  repeticiones: [
    { numero: 1, anguloMinimo: 52, visibilidad: 0.9 },
    { numero: 2, anguloMinimo: 65, visibilidad: 0.85 },
    { numero: 3, anguloMinimo: 48, visibilidad: 0.6 },
    { numero: 4, anguloMinimo: 55, visibilidad: 0.95 }
  ]
};

function analizarSesion(sesion) {
  const repeticionesValidas = sesion.repeticiones.filter(
    (repeticion) =>
      repeticion.anguloMinimo < 60 &&
      repeticion.visibilidad >= 0.7
  );

  const numerosValidos = repeticionesValidas.map(
    (repeticion) => repeticion.numero
  );

  console.log(`Ejercicio: ${sesion.ejercicio}`);
  console.log(`Repeticiones válidas: ${repeticionesValidas.length}`);
  console.log(`Repeticiones: [${numerosValidos.join(", ")}]`);

  return {
    ejercicio: sesion.ejercicio,
    repeticionesValidas: repeticionesValidas.length,
    numeros: numerosValidos
  };
}

analizarSesion(sesion);