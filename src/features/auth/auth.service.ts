import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';

import { auth } from '@/config/firebase';

import { normalizarNombre, validarNombre } from './profile';
import { validarContrasena } from './password';

export interface Session {
  /** Identificador del usuario autenticado. */
  uid: string;
  /** Se mantiene por compatibilidad con las lecturas ya guardadas. */
  codigoEmpleado: string;
  email: string;
  displayName: string | null;
  loggedAt: string;
}

function aSesion(user: User): Session {
  const email = user.email ?? '';
  return {
    uid: user.uid,
    codigoEmpleado: email,
    email,
    displayName: user.displayName,
    loggedAt: new Date().toISOString(),
  };
}

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

const AUTH_TIMEOUT_MS = 15000;
const AUTH_READY_TIMEOUT_MS = 5000;
const MENSAJE_TIMEOUT =
  'No se pudo conectar con Firebase. Revisa tu conexión a internet e inténtalo nuevamente.';

/** Evita que una petición de autenticación deje la UI esperando indefinidamente. */
function conTimeout<T>(promesa: Promise<T>, ms = AUTH_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let terminado = false;
    const temporizador = setTimeout(() => {
      if (terminado) return;
      terminado = true;
      const error = new Error(MENSAJE_TIMEOUT);
      error.name = 'AuthTimeoutError';
      reject(error);
    }, ms);

    promesa.then(
      (valor) => {
        if (terminado) return;
        terminado = true;
        clearTimeout(temporizador);
        resolve(valor);
      },
      (error) => {
        if (terminado) return;
        terminado = true;
        clearTimeout(temporizador);
        reject(error);
      },
    );
  });
}

/** Inicia sesión con correo y contraseña (Firebase Auth). */
export async function login(email: string, password: string): Promise<Session> {
  try {
    const credencial = await conTimeout(
      signInWithEmailAndPassword(auth, normalizarEmail(email), password),
    );
    return aSesion(credencial.user);
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthTimeoutError') {
      // Si Firebase termina respondiendo después del tiempo límite, no dejamos
      // una sesión abierta que el usuario no solicitó ver.
      void signOut(auth).catch(() => undefined);
    }
    throw error;
  }
}

/** Registra una cuenta nueva y deja la sesión iniciada. */
export async function registro(email: string, password: string): Promise<Session> {
  const errorPolitica = validarContrasena(password);
  if (errorPolitica) throw new Error(errorPolitica);

  const credencial = await createUserWithEmailAndPassword(
    auth,
    normalizarEmail(email),
    password,
  );
  return aSesion(credencial.user);
}

/** Envía el correo de recuperación de contraseña de Firebase. */
export async function recuperarContrasena(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, normalizarEmail(email));
}

/**
 * Cambia la contraseña del usuario con sesión activa.
 * Firebase exige reautenticación reciente antes de actualizar la contraseña.
 */
export async function cambiarContrasena(
  contrasenaActual: string,
  contrasenaNueva: string,
): Promise<void> {
  const errorPolitica = validarContrasena(contrasenaNueva);
  if (errorPolitica) throw new Error(errorPolitica);

  const user = auth.currentUser;
  if (!user) throw new Error('No hay una sesión activa. Vuelve a iniciar sesión.');
  if (!user.email) throw new Error('La cuenta actual no tiene un correo asociado.');

  const credencial = EmailAuthProvider.credential(user.email, contrasenaActual);
  await reauthenticateWithCredential(user, credencial);
  await updatePassword(user, contrasenaNueva);
}

/**
 * Actualiza el nombre visible de la cuenta con updateProfile de Firebase.
 * Devuelve la sesión ya actualizada para refrescar la UI.
 */
export async function actualizarNombre(nombre: string): Promise<Session> {
  const error = validarNombre(nombre);
  if (error) throw new Error(error);

  const user = auth.currentUser;
  if (!user) throw new Error('No hay una sesión activa. Vuelve a iniciar sesión.');

  await updateProfile(user, { displayName: normalizarNombre(nombre) });
  return aSesion(user);
}

/**
 * Recupera la sesión persistida en AsyncStorage (firebase/auth + RN persistence).
 * authStateReady espera a que Firebase restaure la sesión antes de consultar currentUser.
 */
export async function getSession(): Promise<Session | null> {
  try {
    await conTimeout(auth.authStateReady(), AUTH_READY_TIMEOUT_MS);
  } catch {
    // Si la restauración falla o tarda demasiado, se responde como si no hubiera sesión.
  }
  return auth.currentUser ? aSesion(auth.currentUser) : null;
}

/** Escucha cambios de sesión (login, registro, logout). */
export function observarSesion(callback: (session: Session | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => callback(user ? aSesion(user) : null));
}

export async function logout(): Promise<void> {
  await signOut(auth);
}
