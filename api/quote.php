<?php
// OGD Electric quote form handler for PHP hosting (e.g. Hostinger).
// 1) The contact page form posts here (action="../api/quote.php").
// 2) Set TO_EMAIL / FROM_EMAIL below. FROM_EMAIL must be a mailbox on your own domain
//    (e.g. no-reply@ogdelectric.ca) so mail is not rejected as spoofed.
const TO_EMAIL   = 'info@ogdelectric.ca';
const FROM_EMAIL = 'no-reply@ogdelectric.ca';
const MAX_FILES = 5; const MAX_SIZE = 8 * 1024 * 1024;

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo '{"ok":false}'; exit; }
if (!empty($_POST['website'])) { echo '{"ok":true}'; exit; } // honeypot

// basic rate limit: 1 request / 30s per IP
$ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
$lock = sys_get_temp_dir() . '/ogd_q_' . md5($ip);
if (file_exists($lock) && time() - filemtime($lock) < 30) { http_response_code(429); echo '{"ok":false,"error":"rate"}'; exit; }
touch($lock);

$clean = fn($k, $max = 500) => trim(mb_substr(str_replace(["\r", "\0"], '', (string)($_POST[$k] ?? '')), 0, $max));
$name = $clean('name', 120); $email = $clean('email', 160); $phone = $clean('phone', 30);
$service = $clean('service', 40); $loc = $clean('location', 160); $method = $clean('contact_method', 20);
$desc = $clean('description', 4000); $consent = !empty($_POST['consent']);
$services = ['Residential', 'Commercial', 'Industrial', 'Doors & Docks'];
$errors = [];
if (mb_strlen($name) < 2) $errors[] = 'name';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'email';
if (strlen(preg_replace('/\D/', '', $phone)) < 10) $errors[] = 'phone';
if (!in_array($service, $services, true)) $errors[] = 'service';
if (mb_strlen($desc) < 10) $errors[] = 'description';
if (!$consent) $errors[] = 'consent';
if ($errors) { http_response_code(422); echo json_encode(['ok' => false, 'errors' => $errors]); exit; }

$text = "New quote request from ogdelectric.ca\n\nName: $name\nEmail: $email\nPhone: $phone\nService: $service\nLocation: " . ($loc ?: '-') . "\nPreferred contact: $method\n\nProject description:\n$desc\n";
$boundary = 'b' . bin2hex(random_bytes(12));
$headers = "From: OGD Electric Website <" . FROM_EMAIL . ">\r\nReply-To: " . $email . "\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=\"$boundary\"";
$bodyMail = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n$text\r\n";

if (!empty($_FILES['photos']) && is_array($_FILES['photos']['name'])) {
  $finfo = new finfo(FILEINFO_MIME_TYPE); $count = 0;
  foreach ($_FILES['photos']['tmp_name'] as $i => $tmp) {
    if ($_FILES['photos']['error'][$i] !== UPLOAD_ERR_OK || !is_uploaded_file($tmp)) continue;
    if (++$count > MAX_FILES) break;
    if ($_FILES['photos']['size'][$i] > MAX_SIZE) continue;
    $mime = $finfo->file($tmp);
    if (!preg_match('#^image/(jpeg|png|webp|heic|heif|gif)$#', $mime)) continue;
    $fname = preg_replace('/[^A-Za-z0-9._-]/', '_', basename($_FILES['photos']['name'][$i]));
    $bodyMail .= "--$boundary\r\nContent-Type: $mime; name=\"$fname\"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"$fname\"\r\n\r\n" . chunk_split(base64_encode(file_get_contents($tmp))) . "\r\n";
  }
}
$bodyMail .= "--$boundary--";
$subject = '=?UTF-8?B?' . base64_encode("Quote request: $service - $name") . '?=';
$sent = mail(TO_EMAIL, $subject, $bodyMail, $headers, '-f' . FROM_EMAIL);
if (!$sent) { http_response_code(500); echo '{"ok":false,"error":"mail"}'; exit; }
echo '{"ok":true}';
