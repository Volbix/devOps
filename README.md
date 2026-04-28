# My Favorite Places - Exercice Docker

Ce README documente la réalisation de l'exercice de dockerisation (serveur, base PostgreSQL, client React), puis les améliorations demandées "pour aller plus loin".

## Prérequis

- Docker + Docker Compose
- Node.js + npm/yarn (pour tests hors Docker)
- Bruno (pour tester l'API)

## 1) Prise en main du projet et test du serveur

### Lancer le serveur en local (hors Docker)

Dans `server` :

```bash
yarn dev
```

Par défaut, l'API écoute sur `http://localhost:3000`.

### Tester avec Bruno

Exemple de requête :

- `GET http://localhost:3000/api/users/me` (avec token si nécessaire)
- ou un endpoint public disponible dans le projet

## 2) Dockerisation du serveur

Le Dockerfile du serveur est présent dans `server/Dockerfile`.

Build + run :

```bash
docker build -t mfp-server ./server
docker run --rm -p 3000:3000 --network host mfp-server
```

Puis retest de l'API avec Bruno sur `http://localhost:3000`.

## 3) `compose.yml` à la racine (API + PostgreSQL)

Le fichier `compose.yml` à la racine lance :

- `db` : conteneur PostgreSQL (`postgres:17.3`)
- `api` : serveur Node/TypeScript
- `client` : front React servi par Nginx

Lancement :

```bash
docker compose up --build
```

## 4) Test et dockerisation du client React

Le Dockerfile du client est présent dans `client/Dockerfile`.

Avec compose :

- Front : `http://localhost:5173`
- API : `http://localhost:3000`

En conteneur, le front est buildé en statique puis servi par Nginx.

## 5) Réflexion : communication entre les services

### BDD <-> Serveur

- Le serveur utilise TypeORM + driver `pg` pour se connecter à PostgreSQL en TCP.
- Dans Docker Compose, le serveur contacte la base via le nom de service `db` (résolution DNS interne du réseau Docker).
- Variables utilisées côté API : `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

### Serveur <-> Front

- Le navigateur charge le client React sur `localhost:5173`.
- Les appels API du front utilisent `/api/...`.
- En local (hors Docker), Vite proxy ces requêtes vers l'API (`http://localhost:3000`).
- En Docker Compose, Nginx proxy `/api` vers `http://api:3000` sur le réseau interne Docker.

## Pour aller plus loin - Réalisé

### 1) Démarrage API uniquement quand la BDD est prête

Dans `compose.yml` :

- ajout d'un `healthcheck` sur `db` avec `pg_isready`
- passage de `api.depends_on.db.condition` à `service_healthy`

Effet : le conteneur `api` ne démarre qu'une fois PostgreSQL déclarée "healthy".

### 2) Redémarrage automatique des services

Dans `compose.yml`, ajout de :

- `restart: unless-stopped` sur `db`
- `restart: unless-stopped` sur `api`
- `restart: unless-stopped` sur `client`

Effet : les services redémarrent après crash/reboot, sauf arrêt manuel.

### 3) Optimisation des images avec Docker build stages

#### Serveur (`server/Dockerfile`)

- passage en multi-stage : `deps` -> `builder` -> `runtime`
- build TypeScript dans le stage `builder`
- image finale runtime avec dépendances de production uniquement (`npm ci --omit=dev`)
- lancement en prod via `node dist/index.js`
- ajout de `server/.dockerignore` pour réduire le contexte de build

#### Client (`client/Dockerfile`)

- stage `builder` : build Vite (`npm run build`)
- stage `runtime` : image Nginx alpine légère
- copie des assets statiques dans `/usr/share/nginx/html`
- ajout d'un `client/nginx.conf` pour :
  - servir l'application React (fallback SPA vers `index.html`)
  - proxifier `/api` vers le service `api`
- ajout de `client/.dockerignore`

### Résultat attendu sur la taille des images

Le serveur n'embarque plus TypeScript, nodemon ni les dépendances de dev dans l'image finale, ce qui permet de réduire significativement la taille (objectif de l'ordre de ~100 Mo selon cache et couches locales).

## Vérifications rapides

```bash
docker compose config
docker compose up --build
```

Puis :

- Ouvrir le front sur `http://localhost:5173`
- Tester un endpoint API dans Bruno sur `http://localhost:3000`
- Vérifier dans les logs Docker que l'API se connecte bien à PostgreSQL

## Commandes utiles de vérification

```bash
docker compose ps
docker compose logs db
docker compose logs api
docker images | grep -E "my-favorite-places|server|client"
```
