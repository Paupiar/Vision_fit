const { test } = require('node:test');
const assert = require('node:assert/strict');
const curl = require('../.test-build/ejercicios/curl.js');
const press = require('../.test-build/ejercicios/pressHombro.js');
const squat = require('../.test-build/ejercicios/sentadilla.js');
const { PARAMETROS_PRESS } = require('../.test-build/ejercicios/parametros.js');
const { esLandmarkValido } = require('../.test-build/mediapipe/dibujo.js');
const { renderToStaticMarkup } = require('react-dom/server');
const React = require('react');
const Detalle = require('../.test-build/components/DetalleIntento.js').default;
const rad = a => a * Math.PI / 180;
const punto = (x, y, visibility = 1) => ({ x, y, visibility });
function tercerPunto(a, b, grados) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return punto(b.x + dx * Math.cos(rad(grados)) - dy * Math.sin(rad(grados)), b.y + dx * Math.sin(rad(grados)) + dy * Math.cos(rad(grados)));
}
function frameCurl(e, a, { codoX = 0, troncoX = 0, hip = true } = {}) {
  const h = punto(troncoX, 0), c = punto(troncoX + codoX, 1);
  return curl.analizarFrameCurl(e, h, c, tercerPunto(h, c, a), hip ? punto(0, 2) : null);
}
function cicloCurl(e, angles = [170, 130, 90, 45, 90, 130, 170], options) {
  return angles.map(a => frameCurl(e, a, options)).at(-1);
}
function framePress(e, ai, ad = ai, { inclinacionIzquierda = 0, inclinacionDerecha = 0, config } = {}) {
  function brazo(hombro, signo, anguloCodo, inclinacion) {
    const anguloBrazo = rad(anguloCodo + inclinacion);
    const codo = punto(hombro.x - signo * 45 * Math.sin(anguloBrazo), hombro.y + 45 * Math.cos(anguloBrazo));
    const muneca = punto(codo.x + signo * 40 * Math.sin(rad(inclinacion)), codo.y - 40 * Math.cos(rad(inclinacion)));
    return [hombro, codo, muneca];
  }
  const ps = [
    ...brazo(punto(100, 100), 1, ai, inclinacionIzquierda),
    ...brazo(punto(200, 100), -1, ad, inclinacionDerecha),
  ];
  return press.analizarPressHombro(e, ...ps, config);
}
function cicloPress(e, angles = [50, 80, 110, 145, 110, 80, 50], options) {
  return angles.map(a => framePress(e, a, a, options)).at(-1);
}
function frameSquat(e, a, inclinacion = 0, visible = true, anguloPie = 0) {
  const c = punto(0, 0), r = punto(0, 1), t = tercerPunto(c, r, a);
  const h = visible ? punto(Math.sin(rad(inclinacion)), -Math.cos(rad(inclinacion))) : null;
  return squat.analizarSentadilla(e, h, c, r, t, anguloPie);
}
function cicloSquat(e, angles = [170, 135, 95, 135, 170], incl = 0, visible = true) {
  return angles.map(a => frameSquat(e, a, incl, visible)).at(-1);
}

test('curl: ciclo normal, contador en flexión y un solo cierre', () => {
  const e = curl.crearEstadoCurl(); cicloCurl(e);
  for (let i=0;i<20;i++) frameCurl(e,170);
  assert.equal(e.repeticiones,1); assert.equal(e.historial.length,1);
  assert.equal(e.historial[0].resultado,'Correcta'); assert.equal(curl.calcularResumenSesion(e.historial).correctas,1);
});
test('curl: flexión incompleta clasificada sin sumar, siguiente intento aislado', () => {
  const e=curl.crearEstadoCurl(); cicloCurl(e,[170,130,100,130,170]); cicloCurl(e);
  assert.equal(e.repeticiones,1); assert.deepEqual(e.historial.map(r=>r.numero),[1,2]);
  assert.deepEqual(e.historial.map(r=>r.errorRango),[true,false]);
  assert.equal(e.historial[0].numeroRepeticion,null); assert.equal(e.historial[1].numeroRepeticion,1);
  const r=curl.calcularResumenSesion(e.historial); assert.equal(r.erroresRango,1); assert.equal(r.correctas,1);
});
test('curl: no cuenta ruido, reposo ni una pose flexionada al iniciar', () => {
  const e=curl.crearEstadoCurl(); cicloCurl(e,[45,90,45]); assert.equal(e.repeticiones,0);
  cicloCurl(e,[170,150,145,150,170]); assert.equal(e.historial.length,0);
  cicloCurl(e,[170,139,140,170]); assert.equal(e.historial.length,0);
});
test('curl: extensión incompleta al volver a flexionar, sin duplicados', () => {
  const e=curl.crearEstadoCurl(); cicloCurl(e,[170,130,45,90,125,90,45,45,45]);
  assert.equal(e.historial.length,1); assert.equal(e.historial[0].errorRango,true);
  assert.equal(e.repeticiones,1); assert.equal(e.historial[0].recorridoCompleto,false);
});
for (const [nombre,opts,codo,tronco] of [['codo',{codoX:.4},true,false],['tronco',{troncoX:.5},false,true],['ambos',{codoX:.4,troncoX:.5},true,true]]) {
  test(`curl: error ${nombre} aislado por intento y persistencia`,()=>{
    const e=curl.crearEstadoCurl(); frameCurl(e,170);
    for(const a of [130,100,80,45,80,130]) frameCurl(e,a,opts);
    frameCurl(e,170); cicloCurl(e);
    assert.equal(e.historial[0].errorCodo,codo); assert.equal(e.historial[0].errorTronco,tronco);
    assert.equal(e.historial[1].resultado,'Correcta');
  });
}
test('curl: pico aislado no activa error técnico',()=>{
  const e=curl.crearEstadoCurl(); frameCurl(e,170); frameCurl(e,130,{codoX:.4});
  for(const a of [90,45,90,170]) frameCurl(e,a);
  assert.equal(e.historial[0].errorCodo,false);
});
test('curl: cadera invisible no da una técnica completamente correcta',()=>{
  const e=curl.crearEstadoCurl(); cicloCurl(e,undefined,{hip:false});
  assert.equal(e.historial[0].evaluacionCompleta,false);
  assert.equal(curl.calcularResumenSesion(e.historial).correctas,0);
});
test('curl: pérdida de seguimiento descarta el ciclo y exige extensión',()=>{
  const e=curl.crearEstadoCurl(); frameCurl(e,170); frameCurl(e,100);
  curl.analizarFrameCurl(e,punto(0,0),punto(0,1,.1),punto(1,1),null);
  frameCurl(e,45); assert.equal(e.repeticiones,0); assert.equal(e.historial.length,0);
  cicloCurl(e); assert.equal(e.historial.length,1);
});

test('sentadilla: profundidad e inclinación son dos reglas independientes',()=>{
  const e=squat.crearEstadoSentadilla(); cicloSquat(e); cicloSquat(e,[170,135,120,135,170]);
  cicloSquat(e,undefined,60); cicloSquat(e,[170,135,120,170],60);
  assert.equal(e.historial.length,4); assert.deepEqual(e.historial.map(r=>[r.errorProfundidad,r.errorTronco]),[[false,false],[true,false],[false,true],[true,true]]);
  const s=squat.calcularResumenSesionSentadilla(e.historial); assert.equal(s.correctas,1); assert.equal(s.profundidadInsuficiente,2); assert.equal(s.excesoInclinacionTronco,2);
});
test('sentadilla: hombro ausente y cobertura parcial no se consideran técnica correcta',()=>{
  const e=squat.crearEstadoSentadilla(); frameSquat(e,170); frameSquat(e,135); frameSquat(e,95,0,false); frameSquat(e,170);
  assert.equal(e.historial[0].evaluacionCompleta,false); assert.equal(squat.calcularResumenSesionSentadilla(e.historial).correctas,0);
});
test('sentadilla: postura inicial baja y pérdida de seguimiento no cierran ciclos falsos',()=>{
  const e=squat.crearEstadoSentadilla(); frameSquat(e,95); frameSquat(e,170); assert.equal(e.repeticiones,0);
  frameSquat(e,95); squat.interrumpirSentadilla(e); frameSquat(e,170); assert.equal(e.repeticiones,0);
  cicloSquat(e); for(let i=0;i<10;i++)frameSquat(e,170); assert.equal(e.repeticiones,1);
});
test('sentadilla: límites heredados incluidos y feedback de poca profundidad',()=>{
  const e=squat.crearEstadoSentadilla(); cicloSquat(e,[170,139,100,170]); assert.equal(e.historial[0].errorProfundidad,false);
  const r=cicloSquat(e,[170,139,110,170]); assert.equal(r.feedbackMovimiento,'Profundidad insuficiente');
});

test('sentadilla: el talón levantado se cuenta por repetición y no se arrastra a la siguiente', () => {
  const estado = squat.crearEstadoSentadilla();
  frameSquat(estado, 170, 0, true, 8);
  frameSquat(estado, 135, 60, true, 24);
  frameSquat(estado, 95, 60, true, 24);
  const aviso = frameSquat(estado, 135, 60, true, 24);
  assert.equal(aviso.feedbackPie, 'Mantén el talón apoyado');
  frameSquat(estado, 170, 0, true, 8);
  for (const angulo of [135, 95, 135, 170]) frameSquat(estado, angulo, 0, true, 8);
  const resumen = squat.calcularResumenSesionSentadilla(estado.historial);
  assert.equal(estado.repeticiones, 2);
  assert.equal(estado.historial[0].errorTronco, true);
  assert.equal(estado.historial[0].errorTalon, true);
  assert.match(estado.historial[0].resultado, /Talón levantado/);
  assert.equal(estado.historial[1].resultado, 'Correcta');
  assert.equal(resumen.talonElevado, 1);
  assert.equal(resumen.correctas, 1);
  assert.match(resumen.errorMasFrecuente, /Talón levantado/);
});

test('sentadilla: un pico, un pie oculto y una referencia ausente se distinguen', () => {
  const estado = squat.crearEstadoSentadilla();
  frameSquat(estado, 170, 0, true, null);
  for (const angulo of [135, 95, 135, 170]) frameSquat(estado, angulo, 0, true, 30);
  frameSquat(estado, 170);
  frameSquat(estado, 135, 0, true, 30);
  frameSquat(estado, 95);
  frameSquat(estado, 135);
  frameSquat(estado, 170);
  frameSquat(estado, 135, 0, true, 25);
  frameSquat(estado, 95, 0, true, null);
  frameSquat(estado, 135, 0, true, 25);
  frameSquat(estado, 170, 0, true, 25);
  assert.deepEqual(estado.historial.map(r => r.errorTalon), [false, false, false]);
  assert.deepEqual(estado.historial.map(r => r.evaluacionCompleta), [false, true, false]);
});

test('sentadilla: el ángulo del pie conserva el signo al cambiar de lado y exige un perfil visible', () => {
  const rodilla = punto(0, 0), tobillo = punto(0, 10);
  const talon = punto(0, 9);
  const izquierda = squat.calcularAnguloPie(talon, punto(-4, 10), rodilla, tobillo);
  const derecha = squat.calcularAnguloPie(talon, punto(4, 10), rodilla, tobillo);
  assert.equal(izquierda, derecha);
  assert.ok(derecha > 0);
  assert.ok(squat.calcularAnguloPie(talon, punto(4, 8), rodilla, tobillo) < 0);
  assert.equal(squat.calcularAnguloPie(talon, punto(0.1, 10), rodilla, tobillo), null);
  assert.equal(squat.calcularAnguloPie(talon, punto(4, 10, 0.2), rodilla, tobillo), null);
});

test('press: ciclo normal conserva conteo al regresar abajo',()=>{
  const e=press.crearEstadoPressHombro(); const r=cicloPress(e);
  assert.equal(r.repeticionSumada,true); assert.equal(e.repeticiones,1); assert.equal(e.historial[0].resultado,'Correcta');
  assert.equal(e.historial[0].evaluacionCompleta,true);
});
test('press: subida transitoria no se clasifica hasta el retorno; intento incompleto visible',()=>{
  const e=press.crearEstadoPressHombro(); framePress(e,50); framePress(e,80); framePress(e,100); assert.equal(e.historial.length,0);
  const r=framePress(e,50); assert.equal(r.intentoFinalizado,true); assert.equal(r.repeticionSumada,false);
  assert.equal(e.historial[0].errorExtension,true); assert.match(r.feedbackMovimiento,/Extensión incompleta/);
  cicloPress(e); assert.equal(e.repeticiones,1); assert.equal(e.historial[1].resultado,'Correcta');
  const s=press.calcularResumenSesionPress(e.historial); assert.equal(s.extensionIncompleta,1); assert.equal(s.completas,1); assert.equal(s.incompletas,1);
});
test('press: ruido pequeño, espera y reposo no crean registros',()=>{
  const e=press.crearEstadoPressHombro(); cicloPress(e,[145,100,145]); assert.equal(e.historial.length,0);
  cicloPress(e,[50,65,70,65,50,50]); assert.equal(e.historial.length,0);
});
test('press: asimetría no se diluye con el reposo entre repeticiones',()=>{
  const e=press.crearEstadoPressHombro(); for(let i=0;i<1000;i++)framePress(e,50);
  for(let i=0;i<5;i++)framePress(e,100,130);
  framePress(e,145); framePress(e,100); framePress(e,50);
  assert.equal(e.historial[0].errorSimetria,true); assert.equal(e.historial[0].errorExtension,false);
});
test('press: extensión configurable independiente del umbral histórico de conteo',()=>{
  const e=press.crearEstadoPressHombro(); const config={...PARAMETROS_PRESS,extensionMinima:155};
  cicloPress(e,undefined,{config}); assert.equal(e.repeticiones,1); assert.equal(e.historial[0].errorExtension,true);
});
test('press: pérdida de un brazo requiere volver abajo y no mezcla simetrías',()=>{
  const e=press.crearEstadoPressHombro(); framePress(e,50); framePress(e,100,130); press.interrumpirPress(e);
  framePress(e,145); framePress(e,50); assert.equal(e.historial.length,0); cicloPress(e);
  assert.equal(e.historial[0].errorSimetria,false);
});
test('press: una inclinación lateral del antebrazo no penaliza un ciclo completo y simétrico', () => {
  const estado = press.crearEstadoPressHombro();
  const opciones = { inclinacionIzquierda: 28 };
  cicloPress(estado, [50, 75, 80, 85, 110, 145, 110, 50], opciones);
  assert.equal(estado.repeticiones, 1);
  assert.equal(estado.historial[0].resultado, 'Correcta');
  assert.equal(estado.historial[0].evaluacionCompleta, true);
  assert.equal(press.calcularResumenSesionPress(estado.historial).correctas, 1);
});
test('calidad: rechaza NaN, infinito, puntos fuera de imagen y baja visibilidad',()=>{
  for(const p of [punto(NaN,.5),punto(.5,Infinity),punto(-.1,.5),punto(.5,1.1),punto(.5,.5,.69)])assert.equal(esLandmarkValido(p),false);
  assert.equal(esLandmarkValido(punto(.5,.5,.7)),true);
  assert.ok(Number.isNaN(curl.calcularAngulo(punto(0,0),punto(0,0),punto(1,1))));
});
test('UI: la tarjeta diferencia intento no contado y cobertura parcial',()=>{
  const e=curl.crearEstadoCurl(); cicloCurl(e,[170,130,100,170],{hip:false});
  const html=renderToStaticMarkup(React.createElement(Detalle,{registro:e.historial[0]}));
  assert.match(html,/Recorrido incompleto/); assert.match(html,/No suma al contador/); assert.match(html,/Evaluación parcial/);
});

test('los picos de un frame no generan intentos incompletos',()=>{
  const c=curl.crearEstadoCurl(); cicloCurl(c,[170,100,170]); assert.equal(c.historial.length,0);
  const p=press.crearEstadoPressHombro(); cicloPress(p,[50,110,50]); assert.equal(p.historial.length,0);
});

test('sentadilla: feedback del fallo permanece legible hasta el siguiente intento',()=>{
  const e=squat.crearEstadoSentadilla(); cicloSquat(e,[170,135,120,170]);
  assert.equal(frameSquat(e,170).feedbackMovimiento,'Profundidad insuficiente');
  frameSquat(e,135); assert.equal(frameSquat(e,95).feedbackMovimiento,'Profundidad alcanzada');
});
