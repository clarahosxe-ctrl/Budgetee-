# Budget — application mobile

Calendrier de budget personnel (entrées, dépenses, récurrences, analyse par catégorie, projection du solde).
Les données restent sur l'appareil (stockage local) ; export / import de sauvegarde JSON dans **Réglages**.

L'app est une web app (`www/`) empaquetée en application **Android** et **iOS** avec [Capacitor](https://capacitorjs.com).
Elle fonctionne aussi comme **PWA** installable depuis un navigateur mobile.

## Structure

- `www/` — l'application (HTML/CSS/JS, manifest PWA, service worker, icônes)
- `src/native.js` — pont vers les plugins natifs (partage de fichier, bouton retour, barre d'état), compilé en `www/native.js`
- `capacitor.config.json` — identifiant `com.budgetee.app`, nom « Budget »
- `resources/icon.png` — icône source (1024 px)

## Utilisation

```bash
npm install
npm run serve          # tester dans le navigateur

npm run android        # génère le projet Android et l'ouvre dans Android Studio (JDK 17+ requis)
npm run ios            # génère le projet iOS et l'ouvre dans Xcode (macOS requis)
npm run assets         # génère icônes et splash natifs depuis resources/icon.png (après npm run android/ios)
```

Après toute modification de `www/`, lancer `npm run sync` pour la recopier dans les projets natifs.

## PWA

Hébergez `www/` en HTTPS (GitHub Pages, Netlify…), puis « Ajouter à l'écran d'accueil ». Fonctionne hors ligne.
