# NovaSneak

Catalogue de sneakers avec panier et commande par WhatsApp.

- Backend : Django + DRF + PostgreSQL (`backend/`)
- Frontend : Next.js (App Router) + TypeScript + Tailwind (`frontend/`)

## Demarrer en local avec Docker

```bash
cp .env.example .env   # deja fait, ajuster si besoin
docker compose up --build
```

- Frontend : http://localhost:3000
- API : http://localhost:8000/api/
- Admin maison (produits, commandes, stats) : http://localhost:3000/admin (memes identifiants que l'admin Django, ex. `admin` / `admin1234`)
- Admin Django (fallback technique) : http://localhost:8000/django-admin/
- Statistiques de trafic (Umami) : http://localhost:3001 — premiere connexion avec `admin` / `umami`, a changer immediatement ; puis creer un site pour `localhost:3000` et copier son Website ID dans `.env` (`NEXT_PUBLIC_UMAMI_WEBSITE_ID`), puis `docker compose up -d frontend` pour l'activer sur le site

Pour peupler la boutique avec des produits de demo (image placeholder generees) :

```bash
docker compose exec backend python manage.py seed_demo
```

Pensez a renseigner le numero WhatsApp reel dans l'admin (Parametres de la boutique), le champ par defaut est un numero factice.

## Structure

- `backend/catalog/models.py` : `Product`, `ProductImage`, `StoreSettings` (singleton avec `size_min`/`size_max` globaux), `Order`/`OrderItem` (historique des commandes, loggees automatiquement avant redirection WhatsApp)
- `backend/catalog/admin.py` : admin Django (fallback technique) avec upload multiple d'images (inline) et toggle rapide actif/inactif
- `backend/catalog/admin_views.py` : API CRUD complete pour l'admin maison (`/api/admin/products/`, `/api/admin/orders/`, `/api/admin/settings/`, `/api/admin/stats/`), protegee par JWT + `IsAdminUser`
- `backend/catalog/auth_views.py` : login JWT (`/api/auth/login/`), rejette les comptes non-staff
- `backend/catalog/views.py` : API publique en lecture seule — `GET /api/products/` (filtrable par `brand` multi-valeurs et `price_max`), `GET /api/products/:id/`, `GET /api/settings/`, `POST /api/orders/`
- `frontend/src/app/page.tsx` : page catalogue (grille + filtre + panier)
- `frontend/src/app/admin/` : admin maison (login, tableau de bord + stats, CRUD produits avec upload d'images, commandes, parametres) — protege par JWT stocke dans `localStorage` (Zustand)
- `frontend/src/lib/adminApi.ts` : client API admin (attache le token, rafraichit automatiquement en cas de 401)
- `frontend/src/components/ProductModal.tsx` : fiche produit (pointure, coffret, quantite, couleur souhaitee)
- `frontend/src/lib/cart-store.ts` : panier persistant (Zustand + localStorage)
- `frontend/src/lib/whatsapp.ts` : construction du message recapitulatif + lien `wa.me`
- `frontend/src/lib/analytics.ts` : evenements custom envoyes a Umami (`add_to_cart`, `checkout_whatsapp`)
