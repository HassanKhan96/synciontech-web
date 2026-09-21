<?php
/**
 * Contact endpoint for the Syncion Tech website on Spaceship shared hosting.
 *
 * This is a line-for-line port of the Cloudflare Pages Function in
 * server/contact.ts and server/spacemail.ts. Validation rules, status codes,
 * and visitor-facing error strings are deliberately identical, so the existing
 * tests in tests/contact.test.ts still describe this endpoint's behaviour.
 *
 * Secrets live in syncion-private/config.php ABOVE the document root.
 */

declare(strict_types=1);

header_remove('X-Powered-By');
ini_set('display_errors', '0');

const MAILBOX = 'info@synciontech.com';
const SMTP_HOST = 'mail.spacemail.com';
const SMTP_PORT = 465;
const MAX_BODY_BYTES = 24000;
const SINGLE_LINE = '/^[^\x00-\x1f\x7f]*$/D';
const EMAIL_PATTERN = '/^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/D';

/** Send a JSON response and stop. Mirrors json() in server/contact.ts. */
function respond(int $status, ?string $error = null): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    if ($status === 405) {
        header('Allow: POST');
    }
    echo json_encode(
        $error === null ? ['ok' => true] : ['ok' => false, 'error' => $error],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

/**
 * Find syncion-private/ by walking up from this file, so the same code works
 * whether the document root is public_html or an addon-domain subfolder.
 */
function locate_private_dir(): ?string
{
    $dir = __DIR__;
    for ($level = 0; $level < 5; $level++) {
        $dir = dirname($dir);
        if ($dir === '' || $dir === '/' || $dir === '.') {
            break;
        }
        if (is_file($dir . '/syncion-private/config.php')) {
            return $dir . '/syncion-private';
        }
    }
    return null;
}

/** JavaScript String.prototype.trim() also strips NBSP and BOM; PHP trim() does not. */
function trim_unicode(string $value): string
{
    $trimmed = preg_replace('/^[\s\x{00a0}\x{feff}]+|[\s\x{00a0}\x{feff}]+$/u', '', $value);
    return $trimmed === null ? trim($value) : $trimmed;
}

/** Character count, matching the maxLength attributes the browser enforces. */
function length_of(string $value): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($value, 'UTF-8');
    }
    return (int) preg_match_all('/./us', $value);
}

/** Read the request body, counting real bytes rather than trusting Content-Length. */
function read_body(): string
{
    $stream = fopen('php://input', 'rb');
    if ($stream === false) {
        respond(400, 'We couldn’t read your message. Please try again.');
    }
    $text = '';
    $length = 0;
    while (!feof($stream)) {
        $chunk = fread($stream, 8192);
        if ($chunk === false) {
            fclose($stream);
            respond(400, 'We couldn’t read your message. Please try again.');
        }
        $length += strlen($chunk);
        if ($length > MAX_BODY_BYTES) {
            fclose($stream);
            respond(413, 'Your message is too long. Please shorten it and try again.');
        }
        $text .= $chunk;
    }
    fclose($stream);
    return $text;
}

/**
 * Verify a Turnstile token. Throws on transport failure so the caller can tell
 * "the visitor failed the check" apart from "Cloudflare was unreachable".
 */
function verify_turnstile(string $token, string $secret, ?string $ip): array
{
    if (!function_exists('curl_init')) {
        throw new RuntimeException('Verification unavailable');
    }
    $payload = ['secret' => $secret, 'response' => $token];
    if ($ip !== null && $ip !== '') {
        $payload['remoteip'] = $ip;
    }
    $handle = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    curl_setopt_array($handle, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);
    $raw = curl_exec($handle);
    $status = curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    // curl_close() is a deprecated no-op on PHP 8; dropping the handle is enough.
    unset($handle);
    if ($raw === false || $status !== 200) {
        throw new RuntimeException('Verification unavailable');
    }
    $result = json_decode((string) $raw, true);
    if (!is_array($result)) {
        throw new RuntimeException('Verification unavailable');
    }
    return $result;
}

/** Compose and send the enquiry. Mirrors composeContactEmail/sendContactEmail. */
function send_contact_email(array $contact, string $password, string $libDir): void
{
    require_once $libDir . '/PHPMailer/Exception.php';
    require_once $libDir . '/PHPMailer/PHPMailer.php';
    require_once $libDir . '/PHPMailer/SMTP.php';

    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->Port = SMTP_PORT;
    $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
    $mail->SMTPAuth = true;
    $mail->Username = MAILBOX;
    $mail->Password = $password;
    $mail->Timeout = 25;
    $mail->SMTPDebug = 0;
    $mail->CharSet = PHPMailer\PHPMailer\PHPMailer::CHARSET_UTF8;
    // 8bit can be refused by servers that do not advertise 8BITMIME.
    $mail->Encoding = PHPMailer\PHPMailer\PHPMailer::ENCODING_BASE64;
    $mail->XMailer = ' ';

    $mail->setFrom(MAILBOX, 'Syncion Tech Website');
    $mail->addAddress(MAILBOX);
    // Visitor-controlled; already rejected above if it contains control characters.
    $mail->addReplyTo($contact['email'], $contact['name']);
    $mail->isHTML(false);
    $mail->Subject = 'New enquiry from the Syncion Tech website';
    $mail->Body = implode("\n", [
        'New website enquiry',
        '',
        'Name: ' . $contact['name'],
        'Email: ' . $contact['email'],
        'Company: ' . ($contact['company'] !== '' ? $contact['company'] : 'Not provided'),
        '',
        'Message:',
        $contact['message'],
    ]);

    $mail->send();
}

// ---------------------------------------------------------------------------

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, 'Please submit the contact form.');
}

$privateDir = locate_private_dir();
$config = $privateDir === null ? [] : require $privateDir . '/config.php';
if (!is_array($config)) {
    $config = [];
}

$password = (string) ($config['SPACEMAIL_PASSWORD'] ?? '');
$secret = (string) ($config['TURNSTILE_SECRET_KEY'] ?? '');
$origins = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) ($config['CONTACT_ALLOWED_ORIGINS'] ?? ''))
), static fn (string $value): bool => $value !== ''));

if ($password === '' || $secret === '' || $origins === [] || $privateDir === null) {
    respond(503, 'The contact form is temporarily unavailable. Please email info@synciontech.com.');
}

// Never trust the request host as an allowlist.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === '' || !in_array($origin, $origins, true)) {
    respond(403, 'Please send your message from our website.');
}

$contentType = trim(explode(';', (string) ($_SERVER['CONTENT_TYPE'] ?? ''))[0]);
if (strtolower($contentType) !== 'application/json') {
    respond(415, 'Please submit the contact form.');
}

$raw = read_body();
if ($raw === '' || preg_match('//u', $raw) !== 1) {
    respond(400, 'We couldn’t read your message. Please try again.');
}

$body = json_decode($raw, false);
if (json_last_error() !== JSON_ERROR_NONE) {
    respond(400, 'We couldn’t read your message. Please try again.');
}
if (!($body instanceof stdClass)) {
    respond(400, 'Please check the form fields.');
}

$fields = (array) $body;
foreach (['name', 'email', 'company', 'message', 'website', 'token'] as $key) {
    if (!isset($fields[$key]) || !is_string($fields[$key])) {
        respond(400, 'Please check the form fields.');
    }
}

$name = $fields['name'];
$email = $fields['email'];
$company = $fields['company'];
$message = $fields['message'];
$website = $fields['website'];
$token = $fields['token'];

if ($website !== '') {
    respond(400, 'We couldn’t verify your submission.');
}

$contact = [
    'name' => trim_unicode($name),
    'email' => trim_unicode($email),
    'company' => trim_unicode($company),
    'message' => trim_unicode($message),
];

if (
    $contact['name'] === ''
    || length_of($contact['name']) > 100
    || preg_match(SINGLE_LINE, $name) !== 1
    || length_of($contact['email']) > 254
    || preg_match(EMAIL_PATTERN, $contact['email']) !== 1
    || preg_match(SINGLE_LINE, $email) !== 1
    || length_of($company) > 160
    || preg_match(SINGLE_LINE, $company) !== 1
    || length_of($contact['message']) < 10
    || length_of($message) > 5000
    || preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/', $message) === 1
    || $token === ''
    || length_of($token) > 2048
) {
    respond(400, 'Check your name and email, and enter a message between 10 and 5,000 characters.');
}

try {
    $verification = verify_turnstile($token, $secret, $_SERVER['REMOTE_ADDR'] ?? null);
    $hostname = parse_url($origin, PHP_URL_HOST);
    if (
        ($verification['success'] ?? false) !== true
        || ($verification['action'] ?? null) !== 'contact'
        || ($verification['hostname'] ?? null) !== $hostname
    ) {
        respond(400, 'Verification expired or failed. Please complete the security check again.');
    }
} catch (Throwable $error) {
    respond(503, 'The security check is unavailable. Please try again or email info@synciontech.com.');
}

try {
    send_contact_email($contact, $password, $privateDir);
    respond(200);
} catch (Throwable $error) {
    // Never return or log the SMTP transcript: it can contain credentials or
    // personal data. A send may be accepted after a failure, so do not retry.
    error_log('contact.send failed: ' . get_class($error));
    respond(502, 'We couldn’t confirm your message was sent. Please email info@synciontech.com if needed.');
}
