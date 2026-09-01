// Importamos useState para guardar si la cámara
// debe estar encendida o apagada.
import { useState } from "react";

// Importamos los estilos generales de la aplicación.
// Aquí deben estar las clases:
// .camera-container
// .camera-video
// .camera-canvas
import "./App.css";

// Importamos el componente que muestra la webcam.
import CameraPreview from "./components/CameraPreview";

function App() {
  // Este estado controla si el componente CameraPreview
  // aparece o no en la página.
  //
  // true  -> la cámara se muestra.
  // false -> la cámara se desmonta y se apaga.
  const [mostrarCamara, setMostrarCamara] = useState(true);

  // Esta función cambia el estado de la cámara.
  function cambiarCamara() {
    // Si estaba encendida, pasa a apagada.
    // Si estaba apagada, pasa a encendida.
    setMostrarCamara(!mostrarCamara);
  }

  return (
    // Contenido principal de la aplicación.
    <main>
      {/* Título provisional de Visión Fit. */}
      <h1>Visión Fit</h1>

      {/* Botón para encender o apagar la cámara. */}
      <button onClick={cambiarCamara}>
        {/* El texto del botón cambia según el estado actual. */}
        {mostrarCamara ? "Apagar cámara" : "Encender cámara"}
      </button>

      {/* 
        Si mostrarCamara es true:
        React muestra CameraPreview.

        Si mostrarCamara es false:
        React elimina CameraPreview de la página,
        lo que provoca que se ejecute su función de limpieza
        y se detenga la webcam.
      */}
      {mostrarCamara ? <CameraPreview /> : null}
    </main>
  );
}

// Exportamos App para que main.tsx pueda utilizarlo
// como componente principal de la aplicación.
export default App;