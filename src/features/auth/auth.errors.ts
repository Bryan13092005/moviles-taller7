// Traduce los códigos de Firebase Auth a mensajes claros para el usuario.
const MENSAJES: Record<string, string> = {
  'auth/invalid-email': 'El correo electrónico no es válido.',
  'auth/missing-email': 'Ingresa tu correo electrónico.',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada. Contacta al administrador.',
  'auth/user-not-found': 'No existe una cuenta con ese correo electrónico.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/invalid-login-credentials': 'Correo o contraseña incorrectos.',
  'auth/missing-password': 'Ingresa tu contraseña.',
  'auth/invalid-password': 'La contraseña no es válida.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo electrónico.',
  'auth/weak-password': 'La contraseña es demasiado débil. Usa al menos 6 caracteres.',
  'auth/password-does-not-meet-requirements':
    'La contraseña debe tener mínimo 6 caracteres, una mayúscula, una minúscula y un número.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo nuevamente.',
  'auth/network-request-failed': 'No se pudo conectar. Revisa tu conexión a internet.',
  'auth/requires-recent-login': 'Por seguridad, vuelve a iniciar sesión para cambiar la contraseña.',
  'auth/operation-not-allowed':
    'El inicio de sesión con correo y contraseña no está habilitado en Firebase.',
  'auth/user-mismatch': 'Las credenciales no corresponden a la cuenta actual.',
  'auth/user-token-expired': 'Tu sesión expiró. Vuelve a iniciar sesión.',
  'auth/invalid-action-code': 'El enlace de recuperación no es válido o ya fue utilizado.',
  'auth/expired-action-code': 'El enlace de recuperación expiró. Solicita uno nuevo.',
  'auth/invalid-api-key': 'La configuración de Firebase no es válida. Contacta al administrador.',
  'auth/configuration-not-found':
    'El servicio de autenticación no está configurado en Firebase. Contacta al administrador.',
  'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase.',
  'auth/app-not-authorized': 'Esta aplicación no está autorizada para usar Firebase Authentication.',
  'auth/internal-error': 'Ocurrió un error interno. Inténtalo nuevamente.',
  'auth/multi-factor-auth-required': 'Esta cuenta requiere un segundo factor de autenticación.',
  'auth/account-exists-with-different-credential':
    'Ya existe una cuenta con este correo usando otro método de acceso.',
};

export type ContextoErrorAuth = 'login' | 'registro' | 'recuperacion' | 'cambio';

export function mensajeErrorAuth(error: unknown, contexto?: ContextoErrorAuth): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code)
      : '';

  if (
    contexto === 'cambio' &&
    ['auth/invalid-credential', 'auth/invalid-login-credentials', 'auth/wrong-password'].includes(
      code,
    )
  ) {
    return 'La contraseña actual es incorrecta.';
  }

  if (code && MENSAJES[code]) return MENSAJES[code];

  if (error instanceof Error && error.message) return error.message;

  return 'No se pudo completar la operación. Inténtalo nuevamente.';
}
