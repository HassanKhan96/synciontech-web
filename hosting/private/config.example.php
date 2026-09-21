<?php
/**
 * Copy to config.php in the same directory and fill in the real values.
 * This file must live ABOVE the document root. Never commit config.php.
 */

return [
    // Mailbox password for info@synciontech.com — not the Spaceship account password.
    'SPACEMAIL_PASSWORD' => '',

    // Secret key from the Managed Turnstile widget.
    'TURNSTILE_SECRET_KEY' => '',

    // Exact origins allowed to post the form. No trailing slashes.
    'CONTACT_ALLOWED_ORIGINS' => 'https://synciontech.com,https://www.synciontech.com',
];
