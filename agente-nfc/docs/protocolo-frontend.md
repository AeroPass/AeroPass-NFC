# Integración rápida con el frontend

```javascript
const socket = new WebSocket("ws://127.0.0.1:8765");

socket.addEventListener("open", () => {
  // Para el modo input: ejecutar al enfocar el campo UID.
  socket.send(JSON.stringify({ type: "start_focus" }));
});

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "uid") {
    // El UID está normalizado en mayúsculas.
    document.querySelector("#uid").value = message.uid;
  }
});

// Al perder foco del input:
function stopFocusReading() {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "stop_reading" }));
  }
}

// Para la sección que requiere lectura permanente, enviar al entrar:
function startContinuousReading() {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "start_continuous" }));
  }
}

// Y al salir de la sección, enviar stop_reading.
```

Consideraciones:

- La aplicación debe mantener una conexión WebSocket abierta mientras usa la lectura.
- Si el input pierde el foco o el usuario abandona la sección, se debe enviar `stop_reading`.
- Si se utiliza autenticación (`NFC_AGENT_TOKEN`), primero hay que enviar `auth` y esperar `auth_result`; solo después iniciar la lectura.
- Si se prueba con Live Server en otro puerto, ese origen debe agregarse a `NFC_AGENT_ORIGINS`.
- El ejemplo anterior es una guía de integración, no reemplaza la adaptación del frontend existente ni su manejo de reconexión.
