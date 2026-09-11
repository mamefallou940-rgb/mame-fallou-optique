# Déploiement MAME FALLOU OPTIQUE

## Variables frontend
`VITE_API_URL` = URL publique du backend.

## Variables backend
Copier `server/.env.example` vers les variables d'environnement de l'hébergeur. Ne jamais publier `server/.env`.

Le backend utilise Node.js >= 22.5.0 car le projet utilise `node:sqlite`.

## Test local
Backend : `cd server && npm install && npm start`
Frontend : à la racine `npm install && npm run dev`
