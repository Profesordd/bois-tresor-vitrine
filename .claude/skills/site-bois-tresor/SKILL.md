---
name: site-bois-tresor
description: Tout sur le site bois-tresor.com — architecture Next.js, catalogue, règle de prix du checkout externe, mesure d'audience maison, espace d'administration, suivi Meta. À charger avant toute intervention sur ce projet, y compris une simple modification de texte.
---

# Site Bois Tresor

Site vitrine et de vente de bois de chauffage, granulés et bois densifié.
Livré en France, Belgique et Suisse. En production sur
**https://www.bois-tresor.com**.

Ce document existe parce que ce projet contient plusieurs règles qui
paraissent absurdes tant qu'on n'en connaît pas la raison — et dont
l'ignorance casse des choses graves, comme facturer un client au mauvais
prix. Lis au moins « Les cinq règles à ne jamais casser » avant de toucher
au code.

---

## 1. Les cinq règles à ne jamais casser

### 1.1 La quantité envoyée au paiement n'est pas la quantité commandée

Le processeur de paiement externe **n'accepte que huit prix unitaires
fixes** : 9,99 / 14,99 / 19,99 / 24,99 / 29,99 / 34,99 / 39,99 / 44,99 €.
Le prix réel d'une palette est reconstitué en envoyant une **quantité
multipliée**.

```
Palette à 89,91 € = 9,99 € × 9
URL envoyée : ?products=58459585479000:9   ← 9, pas 1
```

`lib/checkout.ts` applique `quantité choisie × product.checkoutMultiplier`.
**Envoyer la quantité brute facturerait le client au mauvais prix.**

Les 34 produits tombent exactement sur la grille — vérifie-le après tout
ajout ou changement de prix :

```bash
node -e "
const s=require('fs').readFileSync('lib/products.ts','utf8');
const grille=[9.99,14.99,19.99,24.99,29.99,34.99,39.99,44.99];
for(const m of s.matchAll(/price:\s*([0-9.]+),[^}]*?checkoutMultiplier:\s*(\d+)/g)){
  const u=+(+m[1]/+m[2]).toFixed(2);
  if(!grille.includes(u)) console.log('HORS GRILLE', m[1], '/', m[2], '=', u);
}"
```

Note : le checkout est sur `checkout.bois-**trez**or.com`, avec un « z ».
Le site est sur `bois-**tres**or.com`. Ce n'est pas une faute de frappe,
mais cet écart a été signalé au client comme pouvant inquiéter un visiteur
méfiant.

### 1.2 Le parcours d'achat est linéaire, sans étape de panier

`collection → fiche produit → paiement`. Cliquer « Commander maintenant »
mène **directement** au paiement externe.

Il n'y a **aucun bouton d'achat sur les cartes de collection** : la carte
entière est un lien vers la fiche. C'est délibéré — les données montraient
que la majorité des visiteurs achetaient depuis la carte, sautant toute la
réassurance qui décide précisément cet acheteur-là.

**Il n'y a plus de bouton « Ajouter à ma commande »** sur les fiches
(retiré le 20/09/2026 à la demande du client) : quantité + « Commander
maintenant », rien d'autre. Le tiroir « Ma commande » et la page /panier
existent toujours ; ce qui s'y trouve part avec au paiement.

**Sur téléphone, une barre d'achat fixe** (prix × quantité + « Commander
maintenant ») reste en bas d'écran tant que le bouton principal n'est pas
visible. Elle vit dans `QuantitySelector` pour partager la quantité et le
même `handleBuy`. Motif mesuré : bouton à 20 % de la hauteur de page, scroll
moyen mobile à 19 %. Son clic est étiqueté `Commander (barre mobile)` pour
le distinguer dans le tableau des clics ; il compte comme un achat (le
serveur reconnaît `/command|panier|acheter/i`) et porte les `data-product-*`.

**Limite de quantité par commande** (`maxParCommande` dans `lib/checkout.ts`) :
1 unité si le prix est ≥ 100 €, 2 en dessous. La règle est unique et
appliquée à trois niveaux : le magasin Zustand plafonne (`addItem`,
`updateQuantity`, et à la réhydratation d'un panier antérieur), la fiche
affiche « Stock limité — N max par commande » en permanence et le passe en
avertissement rouge quand le client tente de dépasser, le tiroir et la page
commande affichent le même message une fois le maximum atteint. Le message
vient toujours de `messageLimite()`, jamais recopié à la main.

**Stock réel** (`lib/stock.ts`, table `stock_epuise`, `supabase-stock.sql`) :
le catalogue en dur porte un stock indicatif ; la table liste les produits
épuisés, appliqués par `chargerProduits()` / `chargerProduit()` avant tout
rendu (accueil, collections, fiche). La lecture passe par le cache de
données Next (60 s, étiquette `stock`) pour garder les pages statiques ;
toute écriture appelle `invaliderStock()` (`revalidateTag`). Deux sources :
le webhook Shopify `orders/paid` (`/api/stock/webhook/`, signature HMAC
vérifiée, `SHOPIFY_WEBHOOK_SECRET`) et une écriture directe en base par le
développeur (script `pg`, voir section 5). **L'admin n'a volontairement
aucun bouton** : le client a demandé à gérer les ruptures avec le
développeur (19/09/2026) — le bloc Stock du tableau de bord est en lecture
seule. Une écriture directe en base n'invalide pas le cache : comptez
jusqu'à 60 s avant de la voir sur le site.
**Stock catalogue = 1 signifie « dernier exemplaire »** : pastille ambre,
message « Dernier exemplaire en stock — 1 max par commande », et le webhook
le passe en rupture dès qu'une commande payée le contient. Les autres
produits ne sont pas suivis par le webhook. Premier cas : Limouzi.

**Produits vendus par lot** (`Product.lots`, `lib/lots.ts`, `LotSelector`) :
une seule fiche, plusieurs formats, chaque lot avec son propre `variantId`
Shopify et son multiplicateur. Au choix, `produitDuLot()` fabrique un
produit dérivé (id `produit:lot`, prix et identifiant du lot, champ `lot`)
qui traverse panier, checkout, mesure et Meta sans que ces couches
connaissent les lots. Règles : un lot est toujours sélectionné (jamais
d'état vide), présélection par `?lot=<id>` pour les publicités, prix
affiché = prix du lot choisi, 1 lot par commande (`maxParCommande`), pas de
sélecteur de quantité. Un lot dont `variantId` est null est masqué ; s'il
n'en reste qu'un, la liste de choix disparaît. Premier cas : Limouzi, lots
20 / 30 / 40 sacs et palette 65, prix 49,98 / 59,97 / 74,97 / 119,88 €
(tous sur la grille). La fiche affiche un repère « prix moyen constaté en
magasin » (`PRIX_MARCHE_SAC`, daté) : chiffre réel à tenir à jour. Les cartes affichent « à partir de » + « jusqu'à X € le
sac ».

**Fiche granulés prête pour la publicité** (20/09/2026) : pas de bloc
Description (`richDescription: false`), 5 points clés, repère marché placé
sous « Choisissez votre quantité », FAQ filtrée par famille (`ProductFaq`
reçoit `family` et `parLot` ; les questions « bois sec » ne s'affichent pas
sur les granulés), `UrgencyNote variant="destockage"`, témoignage « plus
cher qu'en grande surface » exclu sur un déstockage, produits liés jamais
en rupture (`getRelatedProducts` reçoit le catalogue à stock réel, complète
avec les autres familles). Aucune caractéristique non vérifiée dans les
réponses (pas de diamètre, pas de marque de poêle).

**Identité de l'entreprise visible partout** (21/09/2026) : des clients
écrivaient pour demander le SIRET. Source unique dans `lib/site.ts`
(`SIRET`, `SIREN`, `TVA_INTRACOM` = FR80 844 733 964, `ADRESSE_SIEGE`,
`ANNUAIRE_URL` vers annuaire-entreprises.data.gouv.fr). Affichée dans le
pied de page (bloc « Une entreprise française », sur toutes les pages), la
FAQ produit (« Qui êtes-vous ? Puis-je vérifier votre entreprise ? »), la
page Contact, la réassurance sous le bouton et les mentions légales.
Toujours avec le lien « vérifier sur l'annuaire officiel ». Le nom du
gérant reste réservé aux mentions légales.

**Catégorie cachée « Désherbants & herbicides »** (22/09/2026) : 28 fiches
importées de naturejardin-fr.com par `scripts/import-herbicides.mjs`
(données `lib/herbicides.json`, photos `public/products/herbicides/`),
famille `jardin`, catégorie `hidden: true`. Accessible seulement par
`/product-category/desherbants-herbicides/` : absente du menu, des filtres,
du « tout voir » (`CATEGORIES_VISIBLES`), de l'accueil et des produits liés
des autres fiches. Textes adaptés par famille : livraison en colis, FAQ
jardin (« réservé aux professionnels, Certiphyto »), pas de preuve sociale
« se chauffer ». **Non commandables** (`variantId: null`) tant que les
produits Shopify n'existent pas et que les prix (64,90, 149,90…) ne sont
pas ramenés sur la grille du checkout. Prix barrés = ceux du site source.

**Livraison offerte partout, sans seuil** (décision du 20/09/2026) : plus
aucun montant minimum nulle part — `lib/site.ts` n'a plus de
`FREE_SHIPPING_THRESHOLD`, tiroir et page commande n'ont plus de logique
de seuil, CGV article 5 et FAQ réécrites. Shopify doit facturer 0 € de
port sur tout.

**Prix au stère** : `Product.pricePerStere` (calculé dans `lib/products.ts`,
`null` hors bûches) s'affiche sous le prix, sur les cartes et la fiche. C'est
l'unité que connaît le client ; il rend les palettes comparables. Il rend
aussi visibles les écarts de la grille (34,58 € le stère pour le 45cm,
54,95 € pour le 1m, 88,15 € pour le hêtre 1,7 stère) — validé par le client
en connaissance de cause.

**Un seul repère « Le plus vendu »**, sur le 45cm (`badge: 'bestseller'`).
Ne pas en ajouter d'autres : le repère n'a de sens que s'il est unique.

**Déstockage** (`badge: 'destockage'` + `original_price`) : pastille rouge
« Déstockage −N % » sur la carte et la fiche, encadré « dans la limite des
stocks disponibles ». La remise est toujours calculée depuis le prix barré.
**Jamais de compte à rebours** : l'urgence fabriquée est une pratique
commerciale trompeuse et c'est précisément ce qui fait fuir le persona.
Premier cas : granulés Limouzi (palette 134 sacs à l'origine), repris de depot-avenues.pro
(19/09/2026), `variantId` null tant que le client ne l'a pas fourni. Le prix
barré doit être le prix le plus bas pratiqué dans les 30 jours précédents
(art. L112-1-1 Code de la consommation) — à faire confirmer par le client.

### 1.3 Aucun texte trompeur, jamais

Le persona ci-dessous fuit au moindre signal d'arnaque. Sont **interdits** :
faux compteurs animés, fausses promotions, faux avis, fausse urgence,
stocks inventés, repères « à compléter » visibles par le client.

Toute affirmation sur la livraison, les délais ou la zone desservie doit
être **vérifiée auprès du client avant d'être écrite**. Cela a déjà évité
d'annoncer une livraison en Suisse avant de savoir qui payait la douane.

### 1.4 Le site tourne en `trailingSlash: true`

Toutes les URL se terminent par `/`. Conséquence non évidente : **un appel
API sans slash final provoque une redirection 308, et `sendBeacon` ne suit
pas les redirections**. Tout appel interne doit s'écrire `/api/xxx/`.

Ce défaut a déjà fait disparaître l'intégralité de la mesure d'audience
pendant un temps, sans aucune erreur visible.

### 1.5 Le nom complet du client n'apparaît que sur les mentions légales

La loi l'exige là, et nulle part ailleurs. Partout sur le site, seul le
prénom est utilisé. Ne pas diffuser le nom complet dans un autre contexte.

---

## 2. Le persona, qui commande toutes les décisions

**« Michel, 61 ans »** — rural, 50-70 ans, se chauffe au bois depuis
toujours, peu à l'aise avec internet.

**Sa première crainte n'est pas le prix, c'est l'arnaque.** Payer et ne
rien recevoir, ou recevoir du bois vert qui ne chauffe pas.

Ordre des messages, imposé par ce profil :

1. **Confiance** — entreprise familiale française, vraies personnes, SIRET
2. **Bois sec** — moins de 20 % d'humidité, il chauffe vraiment
3. **Qualité** — essences, séchage, calibrage
4. **Livraison** — offerte sur tout, sans seuil, déposée au plus près
5. **Urgence crédible** — la saison, jamais un faux compteur

La page collection est le vrai point d'entrée, pas l'accueil : la majorité
du trafic vient des publicités Meta qui pointent directement dessus.

---

## 3. Pile technique

| | |
|---|---|
| Framework | Next.js 14.2.35, App Router, TypeScript |
| Style | Tailwind CSS |
| Panier | Zustand, persistance `localStorage` |
| Base | Supabase (PostgreSQL), région `eu-west-3` |
| Hébergement | Vercel |
| Dépôt | `github.com/Profesordd/bois-tresor-vitrine`, branche `main` |

Le déploiement est automatique à chaque `git push` sur `main`.

**Le catalogue n'est pas en base.** Les 34 produits vivent en dur dans
`lib/products.ts`. Les tables `products` et `categories` de Supabase
existent mais ne sont pas utilisées à l'exécution — elles préparent une
bascule éventuelle.

---

## 4. Carte du code

```
app/
  page.tsx                      accueil
  produits/                     collection (navigation interne)
  produits/[slug]/              fiche produit
  product-category/[slug]/      collection — URL historique WooCommerce,
                                utilisée par les publicités : NE PAS CASSER
  panier/                       commande en cours
  contact/ livraison/ cgv/ mentions-legales/ …   pages légales
  admin/                        tableau de bord (protégé)
  api/
    contact/                    enregistre les demandes
    analytics/collect/          reçoit la mesure d'audience
    meta/                       relais vers l'API Conversions Meta
    admin/login|messages|export tableau de bord
    orders/track/               suivi de commande

lib/
  products.ts     les 34 produits et 3 catégories
  checkout.ts     construction de l'URL de paiement — voir règle 1.1
  site.ts         SIRET, libellé livraison, contact
  reviews.ts      note, nombre d'avis, témoignages
  analytics/      meta.ts capi.ts track.ts geo.ts queries.ts rapport.ts
  admin/session.ts  jeton signé HMAC
  supabase/server.ts  clients Supabase

components/
  shop/    ProductCard CollectionView QuantitySelector CartDrawer …
  ui/      FamilyBlock UrgencyNote SocialProof LivraisonPays …
  admin/   PeriodePicker MessageCard RefreshButton
  analytics/ MetaPixel MetaPageView ViewContentTracker AnalyticsTracker
```

**Sources uniques à respecter** — ne jamais recopier ces valeurs ailleurs :

| Valeur | Fichier |
|---|---|
| SIRET | `lib/site.ts` |
| Note et nombre d'avis | `lib/reviews.ts` |
| Seuil de livraison offerte | `lib/site.ts` |
| Identifiant du pixel Meta | `lib/analytics/meta.ts` |
| Zone commerciale | `lib/analytics/geo.ts` |

Des incohérences sont déjà apparues faute de centralisation : un nombre
d'avis différent d'une page à l'autre, un SIRET écrit de deux façons.

---

## 5. Base de données

Un fichier `.sql` par étape, à la racine, à exécuter dans l'ordre sur une
base neuve :

```
supabase-schema.sql              catalogue + commandes (préparatoire)
supabase-contact.sql             demandes de contact
supabase-contact-spam.sql        adresses bloquées
supabase-analytics.sql           sessions et événements
supabase-analytics-views.sql     agrégats
supabase-analytics-v2.sql        conversion produit, entonnoir par appareil
supabase-analytics-geo.sql       colonne pays
supabase-analytics-geo-filters.sql  filtrage zone commerciale
supabase-analytics-produits-fix.sql calcul de taux corrigé
supabase-analytics-dates.sql     requêtes par plage de dates, heure de Paris
```

**Toutes les tables ont le RLS actif sans aucune policy publique.** Rien
n'est lisible depuis le navigateur ; tout passe par la clé `service_role`
côté serveur. C'est volontaire : un correctif a dû être appliqué parce que
les policies d'origine rendaient le fichier client lisible par n'importe
quel visiteur.

**Piège connu :** Supabase envoie les `.select()` en GET, que Next.js met en
cache. `createAdminClient()` force donc `cache: 'no-store'`. Sans cela, une
donnée modifiée réapparaît indéfiniment, même après rechargement complet.

Se connecter en ligne de commande :

```
postgresql://postgres.gokiqefjfbiusaoyimxe:<MDP>@aws-1-eu-west-3.pooler.supabase.com:5432/postgres
```

Le mot de passe est dans `.env.local`, clé `SUPABASE_DB_PASSWORD`. La
connexion directe `db.<ref>.supabase.co` ne fonctionne pas depuis un réseau
sans IPv6 — utiliser le pooler.

---

## 6. Mesure d'audience — développée sur mesure

Aucun outil tiers. La collecte est maison, dans Supabase.

**Pourquoi :** sans cookie, sans adresse IP stockée, sans transmission à un
tiers, la CNIL exempte la mesure d'audience de consentement. Elle couvre
donc **100 % des visiteurs**, là où un outil soumis au bandeau n'en verrait
qu'une fraction — et un entonnoir calculé sur 40 % des gens ne vaut rien.

Ce qui est mesuré : temps par page, parcours complet, profondeur de scroll,
clics avec leur libellé, champs de formulaire laissés vides, entonnoir.

**Filtres appliqués à l'entrée, pas à l'affichage :**

- Les robots sont écartés sur l'identifiant du navigateur
- Seules les visites de **FR, BE, CH, LU, MC** sont enregistrées
- L'espace `/admin` n'est pas mesuré

Ces trois filtres sont dans `app/api/analytics/collect/route.ts`. Rien
d'autre n'est écrit en base — un correctif a été nécessaire parce que du
trafic thaïlandais, masqué à l'affichage, ressortait dans les exports.

**Journées en heure française.** Toutes les bornes passent par
`analytics_bornes()`, qui convertit depuis `Europe/Paris`. Interrogées en
UTC, une visite de 23 h 30 basculerait au lendemain.

---

## 7. Espace d'administration

`/admin`, protégé par mot de passe. Jeton signé HMAC-SHA256 dans un cookie
`httpOnly`, vérifié par `middleware.ts` avant tout rendu.

**Le middleware ne protège que les pages.** Chaque route `/api/admin/*`
vérifie donc elle-même le jeton.

Contenu : vue d'ensemble, entonnoir, entonnoir par appareil, conversion par
produit, pages, clics, champs abandonnés, provenance, parcours détaillé
visiteur par visiteur, demandes de contact.

**Export :** six fichiers CSV par jeu de données, plus un **rapport complet
en Markdown** conçu pour être soumis à une IA d'analyse — il contient le
contexte du site, sans lequel une IA interprète les chiffres de travers.

`GET /api/meta/`, connecté en admin, renvoie un diagnostic en direct du
suivi Meta.

### Il n'y a plus de formulaire de contact (22/09/2026)

La page Contact affiche deux grandes cartes (`CartesContact`, canaux dans
`lib/site.ts` : `CANAUX`) : « Je n'ai pas encore commandé » → `contact@`,
« J'ai déjà commandé » → adresse de support externe (`APRES_VENTE_EMAIL`).
Chaque carte est un `mailto:` avec objet pré-rempli (et, après-vente, le
corps « Numéro de commande (commence par BA) : »), l'adresse en clair et un
bouton « Copier l'adresse » — sur ordinateur, un mailto n'ouvre parfois
rien. `?canal=apres-vente` met la carte commande en premier. La route
`/api/contact` est supprimée ; la page admin « Demandes de contact » ne
sert plus qu'à l'archive des anciens messages. Règle d'adressage partout
sur le site : avant-vente et légal → `contact@`, tout ce qui suit une
commande (FAQ « problème », suivi, retours) → `APRES_VENTE_EMAIL`.

### (Historique) Le formulaire de contact n'envoyait aucun email

Les demandes sont enregistrées en base et lues dans `/admin/messages`. Le
gérant répond depuis sa propre boîte.

**Raison :** l'envoi par Resend échouait en silence. Le SDK ne lève pas
d'erreur, il la renvoie dans `{ error }` — le code ne la lisait pas et
répondait « message envoyé » alors que rien ne partait.

**Blocage indésirable définitif.** Marquer une demande comme indésirable
supprime le message et bloque l'adresse pour toujours. Aucune interface de
déblocage, **par décision explicite du client**. L'expéditeur continue de
voir une confirmation normale — l'avertir l'inviterait à changer d'adresse.

---

## 8. Suivi Meta

Pixel navigateur **et** API Conversions serveur, dédupliqués.

Les deux envois portent le **même `event_id`**. Sans lui, chaque événement
compterait double et le coût par résultat serait divisé par deux — une
optimisation faussée dans le mauvais sens.

| Événement | Où |
|---|---|
| `PageView` | toutes les pages |
| `ViewContent` | fiche produit |
| `AddToCart` | clic sur « Commander » |
| `InitiateCheckout`, `Purchase` | **checkout externe — ne pas toucher** |

**Ne jamais proposer la vérification de domaine Meta ni les événements
agrégés iOS.** Décision du client : son architecture repose sur des Business
Manager susceptibles d'être suspendus, et un domaine vérifié par un BM mort
est bien plus difficile à récupérer qu'un compte publicitaire à recréer.

Deux pièges rencontrés, à ne pas réintroduire :

- Réessayer un envoi tant que le pixel n'est pas chargé crée **plusieurs**
  événements serveur, chacun avec son identifiant. Attendre le pixel
  (`attendreLePixel`) **avant** l'envoi, jamais autour.
- Annuler l'envoi au démontage du composant, combiné au garde-fou
  anti-doublon, **fait disparaître l'événement** : React monte, démonte puis
  remonte en développement.
- `<noscript>` écrit en JSX est chargé même avec JavaScript actif, ce qui
  double chaque visite. Il doit passer par `dangerouslySetInnerHTML`.

---

## 9. Configuration

`.env.local` — jamais commité, couvert par `.gitignore` :

```
NEXT_PUBLIC_SUPABASE_URL        projet Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY   clé publique (part dans le navigateur)
SUPABASE_SERVICE_ROLE_KEY       clé secrète — accès total à la base
SUPABASE_DB_PASSWORD            connexion psql directe (pas utilisée par le site)
SHOPIFY_WEBHOOK_SECRET          signature du webhook orders/paid (vide = webhook 503)
NEXT_PUBLIC_SITE_URL            https://www.bois-tresor.com
ADMIN_PASSWORD                  accès au tableau de bord
ADMIN_SESSION_SECRET            signature des sessions admin
META_CONVERSIONS_TOKEN          API Conversions Meta
META_GRAPH_VERSION              optionnel, v23.0 par défaut
META_TEST_EVENT_CODE            optionnel — ATTENTION, voir ci-dessous
```

⚠️ **`META_TEST_EVENT_CODE` ne doit jamais rester en production.** Tant
qu'il est défini, les événements partent en mode test : visibles dans Test
Events, mais **ne comptant ni dans les statistiques ni dans l'optimisation
des campagnes**.

Sur Vercel, les `NEXT_PUBLIC_*` sont de type *Config* (elles partent dans le
navigateur) ; `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_*` et le token Meta sont
des *Secret*.

`.env.vercel.local` contient les mêmes valeurs, prêtes pour le bouton
*Import .env* de Vercel.

---

## 10. Vérifier avant de livrer

```bash
npx tsc --noEmit          # obligatoire : les erreurs TS sont ignorées au build
npm run build             # 64 pages doivent se générer
```

**Tester au navigateur, pas seulement en lisant le HTML.** Playwright est
installé à la demande (`npm install playwright --no-save`). Deux pièges :

- Installer `pg` évince `playwright` et inversement — les deux sont
  installés sans être enregistrés. Réinstaller selon le besoin.
- **L'identifiant de Playwright contient `HeadlessChrome`**, que le filtre
  anti-robot écarte. Forcer un `userAgent` réaliste, sinon les mesures et
  les envois Meta sont silencieusement ignorés pendant les tests.

Toujours vérifier **mobile (390 px) et ordinateur (1440 px)**. Beaucoup de
réglages sont propres au mobile : bloc histoire condensé, urgence déplacée
après les produits, filtres sur une ligne défilante, deux produits par
ligne. Ne rien changer sur ordinateur en touchant à ces points.

Objectif mesuré sur la collection mobile : **le premier produit à environ
900 px**, soit un écran de défilement.

---

## 11. Ce qui reste ouvert

- **Pas de bandeau de consentement cookies.** Le pixel et l'API Conversions
  se déclenchent sans consentement, et le serveur transmet l'adresse IP à
  Meta. Signalé au client à plusieurs reprises, reporté par lui. Le point de
  passage unique existe déjà dans `lib/analytics/meta.ts` pour tout couper.
- **CGV à relire** : elles décrivent encore une étape de panier qui
  n'existe plus.
- Informations manquantes côté client : raison sociale, forme juridique,
  médiateur de la consommation (la TVA est connue depuis le 21/09/2026).
- **Compte Vercel en offre Hobby**, réservée à un usage non commercial.
  Ce site est commercial à double titre. Signalé au client.
- Le token Meta a circulé en clair et doit être régénéré.

---

## 12. Décisions déjà tranchées — ne pas les rouvrir

| Sujet | Décision |
|---|---|
| Vérification de domaine Meta | **non**, BM fragiles |
| Déblocage d'une adresse indésirable | **non**, blocage définitif |
| Envoi d'emails par le formulaire | **non**, lecture dans l'admin |
| Achat depuis les cartes de collection | **non**, passage obligé par la fiche |
| Bandeau de consentement | reporté par le client |
| Luxembourg et Monaco dans la zone | conservés ; **Luxembourg desservi** depuis le 20/09/2026 (bandeau LU, livraison offerte) |
| Bouton rupture / remise en vente dans l'admin | **non**, géré avec le développeur |
