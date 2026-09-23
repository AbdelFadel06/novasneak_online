# Deploiement en production (VPS + CI/CD)

## Deux facons de deployer

- **Option A — VPS dedie** : rien d'autre ne tourne sur ce serveur. Caddy gere les ports 80/443 et le HTTPS automatiquement.
- **Option B — VPS partage, nginx deja present** : d'autres sites tournent deja sur ce VPS, servis par nginx installe directement sur le serveur (hors Docker). Les ports 80/443 sont deja pris — on ne touche pas a Caddy, les conteneurs NovaSneak restent en local (`127.0.0.1`) et nginx ajoute juste un nouveau vhost qui pointe vers eux.

Si tu as deja d'autres sites en prod sur ce VPS avec nginx : **suis l'Option B**, pas l'Option A.

Dans les deux cas il te faut un nom de domaine dont tu controles le DNS.

## 1. Preparer le DNS

Chez ton registrar (ou Cloudflare, etc.), cree deux enregistrements **A** pointant vers l'IP du VPS :

```
example.com           A    <IP_DU_VPS>
analytics.example.com A    <IP_DU_VPS>
```

(remplace `example.com` par ton vrai domaine — le sous-domaine `analytics.` sert au dashboard Umami)

La propagation DNS peut prendre de quelques minutes a quelques heures. Verifie avec `dig example.com` avant de continuer.

## 2. Preparer le VPS

Connecte-toi en SSH. Verifie si Docker est deja installe :

```bash
docker --version && docker compose version
```

Si la commande echoue, installe Docker :

```bash
curl -fsSL https://get.docker.com | sh
```

Clone le depot (une fois qu'il est pousse sur GitHub, voir etape 5) :

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
- **Option B uniquement** : `BACKEND_PORT` / `FRONTEND_PORT` / `UMAMI_PORT` — verifie qu'ils sont libres sur ce VPS (`sudo ss -ltnp | grep -E '8020|3020|3021'` ne doit rien retourner) ; si un de tes projets existants les utilise deja, change-les ici et dans `deploy/nginx-novasneak.conf.example` a l'etape suivante.

## 3. Premier deploiement

### Option A — VPS dedie (Caddy)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose logs caddy --tail=30   # doit confirmer l'obtention du certificat HTTPS
```

Le site est alors accessible directement sur `https://example.com`.

### Option B — VPS partage (nginx existant)

D'abord, lance uniquement les conteneurs (sans Caddy, ports lies a `127.0.0.1` seulement) :

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.nginx.yml up -d --build
docker compose ps   # verifie que tout est "Up"
curl -I http://127.0.0.1:3020   # doit repondre 200, confirme que le frontend tourne
```

Ensuite, ajoute le vhost nginx :

```bash
sudo cp deploy/nginx-novasneak.conf.example /etc/nginx/sites-available/novasneak
sudo nano /etc/nginx/sites-available/novasneak   # remplace les CHANGE-ME par tes vrais domaines
sudo ln -s /etc/nginx/sites-available/novasneak /etc/nginx/sites-enabled/
sudo nginx -t   # verifie la config avant de recharger
sudo systemctl reload nginx
```

Le site est alors accessible en HTTP sur `http://example.com`. Pour activer le HTTPS avec certbot (comme pour tes autres sites) :

```bash
sudo certbot --nginx -d example.com -d analytics.example.com
```

Certbot modifie automatiquement le vhost pour rediriger vers HTTPS et renouvelle le certificat tout seul.

### Dans les deux cas

Les migrations, la collecte des fichiers statiques et la creation du compte admin se font automatiquement au demarrage du conteneur backend — pas d'etape manuelle a faire pour ca.

L'admin maison est sur `https://example.com/admin`, l'admin Django sur `https://example.com/django-admin/`.

### Configurer Umami

1. Va sur `https://analytics.example.com`, connecte-toi avec `admin` / `umami`, **change immediatement ce mot de passe**.
2. Cree un site avec le domaine `example.com`, copie son **Website ID**.
3. Ajoute-le dans `.env` : `NEXT_PUBLIC_UMAMI_WEBSITE_ID=<id copie>`
4. Redeploie juste le frontend pour l'activer (adapte le nom du fichier `-f` a ton option) :
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.nginx.yml up -d --build frontend
   ```

### Peupler avec des produits de demo (optionnel)

```bash
docker compose exec backend python manage.py seed_demo
```

## 4. Verifier que rien d'autre n'a ete casse (Option B)

```bash
sudo nginx -t                 # la config nginx globale reste valide
curl -I https://<un-autre-de-tes-sites>   # tes autres sites repondent toujours normalement
```

## 5. Pousser le code sur GitHub

Depuis ta machine locale (pas le VPS) :

```bash
gh repo create <ton-compte>/<ton-repo> --private --source=. --remote=origin
git push -u origin main
```

(ou cree le depot manuellement sur github.com puis `git remote add origin <url>` + `git push -u origin main`)

## 6. Activer le CI/CD

D'abord, adapte `.github/workflows/deploy.yml` : dans l'etape `deploy`, la ligne

```yaml
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

doit devenir, si tu es en **Option B** :

```yaml
docker compose -f docker-compose.yml -f docker-compose.prod.nginx.yml up -d --build
```

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
- **Logs** : `docker compose logs -f backend` (ou `frontend`, `umami`, etc.)
- **Mettre a jour manuellement** (sans passer par le CI/CD), adapte le `-f` a ton option :
  ```bash
  cd /opt/novasneak
  git pull
  docker compose -f docker-compose.yml -f docker-compose.prod.nginx.yml up -d --build
  ```
