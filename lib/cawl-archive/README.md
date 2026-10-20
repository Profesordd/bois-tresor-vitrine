# Versions archivées de l'intégration CAWL

## `cawl-v1-portage-ogarden.ts.txt` (20/10/2026)

Première version, reprise du portage Next.js déjà en production sur
ogarden-fr.com (`cawl-plugin-comme-dev` dans les téléchargements du
client), avec une seule modification : `authorizationMode` réglé sur
`SALE` comme dans le plugin officiel.

**Pourquoi elle est archivée.** Le premier paiement réel a échoué sur
« Authentication failed. Please retry or cancel. » (réf. CAWL
`903bf02eacc6f95430d7b0aafc70eda0`), c'est-à-dire un refus à l'étape
d'authentification 3-D Secure, et non un refus de la carte.

Cette version envoie une demande presque nue : ni nom du porteur, ni
e-mail, ni adresse de facturation. Le plugin officiel WooCommerce, lui,
les transmet. Les banques françaises s'en servent pour décider.

L'extension `.txt` est volontaire : le fichier ne doit pas être compilé.
Pour revenir en arrière, le recopier sur `lib/cawl.ts`.
