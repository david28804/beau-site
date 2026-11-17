<?php
/**
 * B.E.A.U — Traitement du formulaire de contact
 *
 * - Accepte uniquement les requêtes POST
 * - Anti-robots : champ piège (honeypot) + délai minimum de remplissage + limitation de fréquence
 * - Validation et nettoyage des données côté serveur
 * - Protection contre l'injection d'en-têtes e-mail
 * - Envoi d'un e-mail à l'entreprise + accusé de réception au visiteur
 * - Réponse JSON (appel JavaScript) ou page HTML (navigateur sans JavaScript)
 */

declare(strict_types=1);

/* ------------------------------------------------------------------ */
/* CONFIGURATION — à adapter                                           */
/* ------------------------------------------------------------------ */
const DESTINATAIRE   = 'contact@beau-urbanisme.com';    // boîte qui reçoit les demandes
const EXPEDITEUR     = 'no-reply@beau-urbanisme.com';   // adresse du domaine (évite le spam)
const NOM_SITE       = 'B.E.A.U';
const DELAI_MIN_SEC  = 3;     // un humain met plus de 3 s à remplir le formulaire
const LIMITE_ENVOIS  = 5;     // nombre max d'envois…
const FENETRE_SEC    = 3600;  // …par adresse IP et par heure
const ENVOYER_ACCUSE = true;  // envoyer une confirmation au visiteur

/* ------------------------------------------------------------------ */

$wantsJson = isset($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json');

function respond(bool $ok, string $message, int $code = 200): void
{
    global $wantsJson;
    http_response_code($code);
    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    } else {
        header('Content-Type: text/html; charset=utf-8');
        $msg = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
        $color = $ok ? '#1E6B3A' : '#9B2C20';
        echo "<!DOCTYPE html><html lang=\"fr\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
           . "<title>Contact | B.E.A.U</title><link rel=\"stylesheet\" href=\"assets/css/style.css\"></head>"
           . "<body><main class=\"section\"><div class=\"container\" style=\"max-width:640px;text-align:center\">"
           . "<h1 style=\"font-size:2rem\">" . ($ok ? 'Merci !' : 'Oups…') . "</h1>"
           . "<p style=\"color:$color\">$msg</p><a class=\"btn btn--primary\" href=\"contact.html\">Retour</a>"
           . "</div></main></body></html>";
    }
    exit;
}

// 1. Méthode
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 'Méthode non autorisée.', 405);
}

// 2. Honeypot : un robot remplit souvent tous les champs
if (!empty($_POST['website'])) {
    respond(true, 'Votre demande a bien été envoyée.'); // on ne révèle rien au robot
}

// 3. Délai minimum de remplissage
$ts = (int) ($_POST['ts'] ?? 0);
if ($ts > 0 && (time() - $ts) < DELAI_MIN_SEC) {
    respond(false, 'Envoi trop rapide. Veuillez patienter quelques secondes et réessayer.', 429);
}

// 4. Limitation de fréquence par IP (stockage fichier, sans base de données)
$ip = $_SERVER['REMOTE_ADDR'] ?? 'inconnue';
$rateFile = sys_get_temp_dir() . '/beau_rate_' . hash('sha256', $ip);
$now = time();
$hits = [];
if (is_file($rateFile)) {
    $hits = array_filter(
        array_map('intval', explode(',', (string) file_get_contents($rateFile))),
        fn($t) => $t > $now - FENETRE_SEC
    );
}
if (count($hits) >= LIMITE_ENVOIS) {
    respond(false, 'Trop de demandes envoyées. Merci de réessayer plus tard ou de nous appeler.', 429);
}

// 5. Récupération et nettoyage
function clean(string $key, int $max): string
{
    $v = trim((string) ($_POST[$key] ?? ''));
    $v = str_replace("\0", '', $v);
    return mb_substr($v, 0, $max, 'UTF-8');
}
$nom       = clean('nom', 100);
$email     = clean('email', 150);
$telephone = clean('telephone', 20);
$sujet     = clean('sujet', 120);
$message   = clean('message', 5000);
$consent   = !empty($_POST['consentement']);

// 6. Validation
$errors = [];
if (mb_strlen($nom) < 2)                                     $errors[] = 'le nom';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))              $errors[] = "l'adresse e-mail";
if ($telephone !== '' && !preg_match('/^[+0-9 ().-]{6,20}$/', $telephone)) $errors[] = 'le téléphone';
if ($sujet === '')                                           $errors[] = 'le sujet';
if (mb_strlen($message) < 10)                                $errors[] = 'le message';
if (!$consent)                                               $errors[] = 'le consentement';
// Aucune fin de ligne dans les champs utilisés dans les en-têtes (anti-injection)
foreach ([$nom, $email, $sujet] as $h) {
    if (preg_match('/[\r\n]/', $h)) { $errors[] = 'caractères non autorisés'; break; }
}
if ($errors) {
    respond(false, 'Veuillez vérifier les champs suivants : ' . implode(', ', array_unique($errors)) . '.', 422);
}

// 7. Composition de l'e-mail (texte brut : aucun HTML interprété)
$encode = fn(string $s) => '=?UTF-8?B?' . base64_encode($s) . '?=';
$corps = "Nouvelle demande reçue depuis le site " . NOM_SITE . "\n"
       . str_repeat('-', 50) . "\n"
       . "Nom       : $nom\n"
       . "E-mail    : $email\n"
       . "Téléphone : " . ($telephone ?: 'non renseigné') . "\n"
       . "Sujet     : $sujet\n"
       . "Date      : " . date('d/m/Y H:i') . "\n"
       . "IP        : $ip\n"
       . str_repeat('-', 50) . "\n\n"
       . $message . "\n";

$headers = [
    'From: ' . $encode(NOM_SITE . ' — Site web') . ' <' . EXPEDITEUR . '>',
    'Reply-To: ' . $encode($nom) . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: PHP/' . PHP_VERSION,
];

$sent = @mail(DESTINATAIRE, $encode('[Site B.E.A.U] ' . $sujet), $corps, implode("\r\n", $headers), '-f' . EXPEDITEUR);

if (!$sent) {
    error_log('[B.E.A.U] Échec mail() pour une demande de ' . $email);
    respond(false, "Votre message n'a pas pu être envoyé suite à une erreur technique. Merci de nous écrire directement à " . DESTINATAIRE . '.', 500);
}

// 8. Enregistrement pour la limitation de fréquence
$hits[] = $now;
@file_put_contents($rateFile, implode(',', $hits), LOCK_EX);

// 9. Accusé de réception au visiteur
if (ENVOYER_ACCUSE) {
    $accuse = "Bonjour $nom,\n\n"
            . "Nous avons bien reçu votre demande concernant « $sujet ».\n"
            . "Notre équipe l'étudie et vous répondra dans les meilleurs délais (sous 48 heures ouvrées).\n\n"
            . "Cordialement,\n"
            . "L'équipe B.E.A.U\nBureau d'Étude d'Aménagement et d'Urbanisme\n";
    $hAccuse = [
        'From: ' . $encode(NOM_SITE) . ' <' . EXPEDITEUR . '>',
        'Reply-To: ' . DESTINATAIRE,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ];
    @mail($email, $encode('Confirmation de votre demande — B.E.A.U'), $accuse, implode("\r\n", $hAccuse), '-f' . EXPEDITEUR);
}

respond(true, 'Merci, votre demande a bien été envoyée. Nous vous répondrons sous 48 heures ouvrées.');
