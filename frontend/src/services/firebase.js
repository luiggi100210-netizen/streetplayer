import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId:      import.meta.env.VITE_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

// El popup de Google/Facebook a veces se queda esperando sin resolver ni
// rechazar (popup bloqueado, ventana cerrada por el SO, etc.) y deja al
// botón que lo llamó girando para siempre. Este límite de tiempo garantiza
// que signInWithPopup siempre termine, en éxito o en error.
const POPUP_TIMEOUT_MS = 20000;

function conLimiteDeTiempo(promesa, ms = POPUP_TIMEOUT_MS) {
  return Promise.race([
    promesa,
    new Promise((_, reject) => setTimeout(
      () => reject(Object.assign(new Error('Tiempo de espera agotado'), { code: 'auth/timeout' })),
      ms,
    )),
  ]);
}

// Firebase persiste su propia sesión en el navegador (independiente del
// access/refresh token del backend). Si ya hay una sesión de Firebase
// restaurada, no hace falta abrir el popup del selector de cuenta de nuevo.
function sesionFirebaseActual() {
  return new Promise((resolve) => {
    const cancelar = onAuthStateChanged(auth, (user) => { cancelar(); resolve(user); });
  });
}

async function iniciarSesionConProveedor(Provider, { forzarSelector = true, personalizar } = {}) {
  if (!forzarSelector) {
    const actual = await conLimiteDeTiempo(sesionFirebaseActual(), 5000).catch(() => null);
    if (actual) return actual.getIdToken();
  }

  const provider = new Provider();
  personalizar?.(provider);
  const result = await conLimiteDeTiempo(signInWithPopup(auth, provider));
  return result.user.getIdToken();
}

// `forzarSelector: false` evita el popup cuando la sesión de Firebase del
// navegador sigue siendo válida (caso "Continuar como [nombre]"); un login
// nuevo o "Usar otra cuenta" siempre debe forzarlo.
export function signInWithGoogle(opciones) {
  return iniciarSesionConProveedor(GoogleAuthProvider, {
    ...opciones,
    personalizar: (provider) => provider.setCustomParameters({ prompt: 'select_account' }),
  });
}

export function signInWithFacebook(opciones) {
  return iniciarSesionConProveedor(FacebookAuthProvider, opciones);
}
