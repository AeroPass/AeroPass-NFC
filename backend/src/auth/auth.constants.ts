/**
 * Hash argon2id VÁLIDO pero ficticio.
 *
 * Se usa cuando el usuario NO existe para ejecutar igualmente una verificación
 * de argon2 y así igualar el tiempo de respuesta del login. De esta forma un
 * atacante no puede descubrir qué usernames existen midiendo los tiempos
 * de respuesta (timing attack).
 *
 * NOTA: nunca representa una contraseña real; el resultado siempre es "no coincide".
 */
export const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$tJXfvemnAQvVp8nu7WpcUA$cJ9BrUAHOK48Hw/5+Wfi/UAUxoeNiQYCcWycJasu6sc';
