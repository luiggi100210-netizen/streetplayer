// firebase-admin v13+ reemplazó el namespace compat (admin.apps, admin.auth(), etc.)
// por una API modular — se importa así y se re-expone `auth` con la misma forma
// que usaban los controladores (admin.auth().verifyIdToken(...)).
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

if (!getApps().length) {
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    initializeApp({
      credential: cert({
        projectId:   FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        // Render guarda la clave con \n literal — convertirla a saltos reales
        privateKey:  FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    console.warn('[firebase] Credenciales no configuradas — login OAuth deshabilitado');
  }
}

module.exports = { auth: getAuth };
