// Import the functions you need from the SDKs you need
import { initializeApp,getApp, getApps } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type Auth, getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth solo se puede llamar una vez por app. Si ya existe, loreutilizamos.
function crearAuth(): Auth {
    try {
    // getReactNativePersistence guarda la sesión en AsyncStorage: así el
    // estudiante sigue conectado aunque cierre la app. Sin esto, la sesión
    // vive solo en memoria y se pierde al reiniciar.
        return initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
        })
    } catch {
        return getAuth(app);
    }
}

export const auth = crearAuth();

// Los correos de recuperacion de contrasena llegaran en español.
auth. languageCode = 'es';