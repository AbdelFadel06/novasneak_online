# Deploiement en production (VPS + CI/CD)

## Vue d'ensemble

- **Caddy** sert de reverse proxy et gere le HTTPS automatiquement (certificats Let's Encrypt, renouvellement automatique). C'est le seul service expose sur Internet (ports 80/443).
- **backend**, **frontend**, **umami**, les deux bases Postgres : uniquement accessibles entre conteneurs, jamais directement depuis Internet.
- Le deploiement se fait par `git pull` + rebuild Docker sur le VPS, declenche automatiquement par GitHub Actions a chaque push sur `main`.

Il te faut : un VPS (Ubuntu/Debian recommande) avec Docker installe, et un nom de domaine dont tu controles le DNS.

## 1. Preparer le DNS

Chez ton registrar (ou Cloudflare, etc.), cree deux enregistrements **A** pointant vers l'IP du VPS :

```
example.com           A    <IP_DU_VPS>
analytics.example.com A    <IP_DU_VPS>
```

(remplace `example.com` par ton vrai domaine — le sous-domaine `analytics.` sert au dashboard Umami)

## 2. Preparer le VPS

Connecte-toi en SSH, installe Docker si besoin :

```bash
curl -fsSL https://get.docker.com | sh
```

Clone le depot (une fois qu'il est pousse sur GitHub, voir etape 4) :

```bash
git clone https://github.com/<ton-compte>/<ton-repo>.git /opt/novasneak
cd /opt/novasneak
```

Cree le fichier `.env` de production a partir du modele :

```bash
cp .env.production.example .env
nano .env   # remplace TOUTES les valeurs marquees "CHANGE-ME"
```

Points importants dans `.env` :
- `DOMAIN` / `UMAMI_DOMAIN` : tes vrais domaines
- `DJANGO_SECRET_KEY` : genere avec `python3 -c "import secrets; print(secrets.token_urlsafe(50))"`
- `POSTGRES_PASSWORD`, `UMAMI_APP_SECRET` : genere avec `openssl rand -hex 32`
- `DJANGO_SUPERUSER_PASSWORD` : mot de passe fort pour le compte admin
- `DJANGO_ALLOWED_HOSTS` et `CORS_ALLOWED_ORIGINS` : doivent correspondre a `DOMAIN`

## 3. Premier deploiement (manuel)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Les migrations, la collecte des fichiers statiques et la creation du compte admin se font automatiquement au demarrage du conteneur backend. Verifie que tout tourne :

```bash
docker compose ps
docker compose logs caddy --tail=30   # doit confirmer l'obtention du certificat HTTPS
```

Le site est alors accessible sur `https://example.com`, l'admin maison sur `https://example.com/admin`, l'admin Django sur `https://example.com/django-admin/`.

### Configurer Umami

1. Va sur `https://analytics.example.com`, connecte-toi avec `admin` / `umami`, **change immediatement ce mot de passe**.
2. Cree un site avec le domaine `example.com`, copie son **Website ID**.
3. Ajoute-le dans `.env` : `NEXT_PUBLIC_UMAMI_WEBSITE_ID=<id copie>`
4. Redeploie juste le frontend pour l'activer :
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build frontend
   ```

### Peupler avec des produits de demo (optionnel)

```bash
docker compose exec backend python manage.py seed_demo
```

## 4. Pousser le code sur GitHub

Depuis ta machine locale (pas le VPS) :

```bash
gh repo create <ton-compte>/<ton-repo> --private --source=. --remote=origin
git push -u origin main
```

(ou cree le depot manuellement sur github.com puis `git remote add origin <url>` + `git push -u origin main`)

## 5. Activer le CI/CD

### Cle SSH dediee au deploiement

Sur ta machine locale (pas le VPS, et pas ta cle SSH personnelle) :

```bash
ssh-keygen -t ed25519 -f deploy_key -N "" -C "github-actions-novasneak"
```

Copie la cle **publique** sur le VPS :

```bash
ssh-copy-id -i deploy_key.pub <utilisateur>@<IP_DU_VPS>
```

### Secrets GitHub

Dans le depot GitHub : **Settings → Secrets and variables → Actions → New repository secret**, ajoute :

| Nom | Valeur |
|---|---|
| `VPS_HOST` | IP ou nom d'hote du VPS |
| `VPS_USER` | utilisateur SSH (ex. `root` ou `deploy`) |
| `VPS_SSH_KEY` | contenu du fichier `deploy_key` (la cle **privee**, en entier) |
| `VPS_DEPLOY_PATH` | `/opt/novasneak` (ou le chemin choisi a l'etape 2) |

Supprime ensuite `deploy_key` et `deploy_key.pub` de ta machine locale une fois les secrets enregistres (ils ne doivent pas trainer dans le repo).

### C'est tout

A partir de maintenant, chaque `git push` sur `main` declenche automatiquement (`.github/workflows/deploy.yml`) :
1. Verification du frontend (typecheck, lint, build) et du backend (`manage.py check`, migrations manquantes)
2. Si tout passe : connexion SSH au VPS, `git pull`, rebuild et redemarrage des conteneurs Docker

## Maintenance

- **Sauvegardes** : la base Postgres vit dans le volume Docker `db_data`. Planifie une sauvegarde reguliere, par exemple via une tache cron sur le VPS :
  ```bash
  docker compose exec -T db pg_dump -U novasneak novasneak > backup-$(date +%F).sql
  ```
- **Logs** : `docker compose logs -f backend` (ou `frontend`, `caddy`, etc.)
- **Mettre a jour manuellement** (sans passer par le CI/CD) :
  ```bash
  cd /opt/novasneak
  git pull
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
  ```
