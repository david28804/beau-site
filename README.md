# Site web B.E.A.U — Documentation technique

Site institutionnel du **Bureau d'Étude d'Aménagement et d'Urbanisme**.
Technologies : HTML5, CSS3, JavaScript (sans framework) et PHP 8 pour le formulaire de contact.

## Arborescence

```
BEAU_SITE/
├── index.html                      Accueil
├── a-propos.html                   À propos (histoire, vision, valeurs, équipe)
├── services.html                   Nos services (8 prestations + méthode)
├── realisations.html               Galerie filtrable, fiche projet, avant/après
├── partenaires.html                Nos partenaires
├── contact.html                    Coordonnées, formulaire, carte, FAQ
├── mentions-legales.html
├── politique-confidentialite.html
├── 404.html                        Page d'erreur
├── contact.php                     Traitement du formulaire (e-mail)
├── sitemap.xml / robots.txt        Référencement
├── .htaccess                       HTTPS, sécurité, cache (serveur Apache)
└── assets/
    ├── css/style.css               Charte graphique et responsive
    ├── js/main.js                  Menu mobile, animations, galerie, formulaire
    └── img/                        Logo, favicon, illustrations (SVG)
```

## Charte graphique

| Rôle | Couleur |
|---|---|
| Bleu principal | `#123B70` |
| Bleu secondaire | `#2563A6` |
| Bleu clair | `#EAF3FC` |
| Blanc | `#FFFFFF` |
| Gris clair | `#F4F6F8` |
| Gris foncé (texte) | `#303846` |

Polices : **Poppins** pour les titres, **Inter** pour les textes (Google Fonts).
Les couleurs sont définies une seule fois, en variables CSS au début de `assets/css/style.css`.

## Contenus à remplacer avant la mise en ligne

Les textes de démonstration doivent être validés ou remplacés par l'entreprise :

1. **Coordonnées** (adresse, téléphone, e-mail, horaires, liens réseaux sociaux) : dans l'en-tête, le pied de page et `contact.html` de chaque page. Une recherche-remplacement sur `+000 00 00 00 00`, `contact@beau-urbanisme.com` et `Avenue de l'Urbanisme` suffit.
2. **Chiffres clés** (15+ ans, 120+ projets…) : `index.html` et `a-propos.html`.
3. **Historique et équipe dirigeante** : `a-propos.html`.
4. **Réalisations** : les 8 projets de `realisations.html` sont fictifs. Chaque carte porte ses informations dans des attributs `data-*` (titre, lieu, année, domaine, maître d'ouvrage, description), lus par la fenêtre de détail.
5. **Partenaires** : noms et logos de `partenaires.html` et le bandeau de l'accueil. Il faut l'accord des partenaires avant de publier leur logo.
6. **Carte** : `contact.html`. L'iframe OpenStreetMap pointe sur des coordonnées provisoires. Pour la remplacer : openstreetmap.org, puis *Partager*, puis *HTML*.
7. **Mentions légales** : compléter les champs entre crochets (RCCM, hébergeur, directeur de publication…).
8. **Nom de domaine** : remplacer `www.beau-urbanisme.com` dans les balises `canonical`, `sitemap.xml`, `robots.txt` et `contact.php`.

### Remplacer les illustrations par des photos

Les visuels actuels sont des illustrations SVG au style « plan technique ». Pour mettre des photos :
- les exporter en **WebP** (ou JPEG), d'environ 1600 px de large et de moins de 300 Ko ;
- les placer dans `assets/img/` et modifier l'attribut `src` (et `data-img` pour les réalisations) ;
- toujours renseigner un texte `alt` descriptif (accessibilité et référencement).

## Formulaire de contact

`contact.php` reçoit la demande par AJAX et renvoie du JSON. Sans JavaScript, il affiche une page HTML.

- Configuration en haut du fichier : `DESTINATAIRE`, `EXPEDITEUR`, limites anti-spam.
- Protections : champ piège (honeypot), délai minimum de remplissage, limite de 5 envois par heure et par IP, validation côté serveur, protection contre l'injection d'en-têtes, e-mail en texte brut.
- Un accusé de réception est envoyé au visiteur (`ENVOYER_ACCUSE`).
- Prérequis : **PHP 8 ou plus** avec la fonction `mail()` active chez l'hébergeur. L'`EXPEDITEUR` doit appartenir au domaine du site (configurer SPF/DKIM). Si `mail()` n'est pas fiable chez l'hébergeur, passer par PHPMailer et un compte SMTP.

> Ouvert directement depuis le disque (`file://`), le formulaire ne peut pas envoyer d'e-mail et affiche un message d'erreur. C'est normal : il faut un serveur PHP.

## Tester en local

```bash
# Avec PHP installé (formulaire fonctionnel, mais sans envoi réel de mail)
php -S localhost:8000
# Sans PHP (consultation seule)
npx serve .
```

Puis ouvrir http://localhost:8000.

## Mise en ligne

1. Envoyer tout le dossier à la racine de l'hébergement (FTP ou gestionnaire de fichiers).
2. Activer le certificat SSL (Let's Encrypt). Le `.htaccess` redirige ensuite vers HTTPS.
3. Configurer le nom de domaine (DNS A/CNAME vers l'hébergeur).
4. Déclarer le site et `sitemap.xml` dans Google Search Console.
5. Tester le formulaire en conditions réelles.

## Fonctionnalités

- Menu responsive avec menu hamburger (moins de 960 px).
- Animations discrètes au défilement, qui respectent la préférence « réduire les animations ».
- Compteurs animés pour les chiffres clés.
- Galerie de réalisations filtrable, avec fenêtre de détail (fermeture par Échap ou clic extérieur).
- Comparateur avant/après (curseur, utilisable au clavier).
- Bouton de retour en haut de page.
- SEO : balises title et description propres à chaque page, Open Graph, données structurées schema.org, HTML sémantique, sitemap et robots.txt.
- Accessibilité : lien d'évitement, focus visible, attributs ARIA, textes alternatifs, contrastes conformes.

## Maintenance

- Mettre à jour PHP chez l'hébergeur.
- Sauvegarder régulièrement le dossier du site.
- Ajouter les nouvelles réalisations en dupliquant un bloc `project-item` dans `realisations.html`.
