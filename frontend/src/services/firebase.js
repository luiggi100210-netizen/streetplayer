import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
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

function conLimiteDeTiempo(promesa) {
  return Promise.race([
    promesa,
    new Promise((_, reject) => setTimeout(
      () => reject(Object.assign(new Error('Tiempo de espera agotado'), { code: 'auth/timeout' })),
      POPUP_TIMEOUT_MS,
    )),
  ]);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await conLimiteDeTiempo(signInWithPopup(auth, provider));
  return result.user.getIdToken();
}

export async function signInWithFacebook() {
  const provider = new FacebookAuthProvider();
  const result = await conLimiteDeTiempo(signInWithPopup(auth, provider));
  return result.user.getIdToken();
}
