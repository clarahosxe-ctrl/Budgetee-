# Daylance

Web app de budget perso (calendrier, récurrences, détail des lignes, répartition, projection du solde), pensée pour le téléphone.
Français / English, monnaie au choix, page d'accueil personnalisable (solde, reste à vivre, prochains mouvements, alertes, suivi des crédits, objectifs d'épargne, mini-graphiques), mode clair / sombre / automatique, thème « Liquid Glass » clair ou sombre, avec ou sans auras (fond, transparence, flou, reflets), bandeau de nouveautés, tutoriel de démarrage, fonctionne hors ligne, mise à jour automatique.

## Mise en ligne (GitHub Pages)

1. GitHub → dépôt → **Settings → Pages**
2. *Source* : **Deploy from a branch**, branche choisie, dossier **/ (root)** → Save
3. Ouvre `https://<ton-compte>.github.io/Budgetee-/` sur ton téléphone
4. Chrome : menu ⋮ → **Ajouter à l'écran d'accueil** · Safari : Partager → **Sur l'écran d'accueil**

## Données et utilisateurs

- Par défaut, les données sont stockées **dans le navigateur de chaque personne** (localStorage). Chaque nouvelle personne qui ouvre le lien **repart de zéro** (appli vide + tutoriel) et ne voit jamais les données des autres.
- Les données d'une personne qui avait déjà utilisé l'appli sont conservées lors des mises à jour.
- Sans compte, les données ne sont **que sur cet appareil** : exporter une sauvegarde de temps en temps (Réglages).

## Activer les comptes (retrouver ses données sur tous les appareils)

Les comptes utilisent [Firebase](https://firebase.google.com) (gratuit pour un usage perso). Connexion par **e-mail + mot de passe**, mot de passe oublié par e-mail, sauvegarde automatique des données du compte.

1. Sur https://console.firebase.google.com → **Ajouter un projet**
2. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable**
3. **Authentication → Settings → Authorized domains** : ajouter `<ton-compte>.github.io`
4. **Build → Firestore Database → Create database** (mode production, région Europe)
5. Onglet **Rules** : coller le contenu de `firestore.rules` → Publish
6. **Project settings (⚙) → Your apps → Web (`</>`)** → enregistrer l'app → copier l'objet `firebaseConfig`
7. Le coller dans `firebase-config.js` à la place de `null` (`window.FIREBASE_CONFIG = { ... }`), commit, push

Une fois la configuration en place, **Réglages → Mon compte** apparaît. Ces valeurs de configuration ne sont pas secrètes ; la sécurité repose sur `firestore.rules` (chacun ne peut lire/écrire que son propre document).

Fonctionnement : chaque modification est envoyée au compte (quelques secondes après), et récupérée sur les autres appareils au retour dans l'appli. Si un appareil et le compte contiennent des données différentes à la première connexion, l'appli demande lesquelles garder.

## Ajouter une langue

Ajouter un bloc dans `DICT` (`i18n.js`) puis l'ajouter à `LANGS` (`app.js`).

## Fichiers

`index.html` (page + styles) · `app.js` (application) · `i18n.js` (traductions) · `cloud.js` (comptes / synchro) · `firebase-config.js` · `firestore.rules` · `sw.js` (hors-ligne + mises à jour) · `manifest.webmanifest`

## Bandeau « Nouveautés »

À chaque mise à jour importante, modifier `NEWS_VERSION` et la liste `NEWS` dans `app.js` : le bandeau réapparaît une fois pour chaque utilisateur, avec une croix pour le fermer. Les nouveaux utilisateurs ne le voient pas.

## Logo

Source : `icons/logo-source.jpg`. Les icônes (`icons/`, `icon-180.png`) en sont dérivées. Sur un téléphone où l'appli est déjà installée, l'ancienne icône peut rester : la supprimer puis la réajouter à l'écran d'accueil.

## Répétitions et jours de prélèvement

Répétitions prédéfinies : aucune, chaque semaine, chaque mois, chaque année, ou **personnalisée** (tous les N jours / semaines / mois / ans). Dans une ligne regroupée en postes, chaque poste peut avoir son propre **jour du mois** ; un poste sans jour suit la date de la ligne (qui doit donc être la plus précoce du mois).
