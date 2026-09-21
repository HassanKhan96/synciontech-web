# Spaceship shared hosting

The site is a static export plus one PHP endpoint for the contact form. There is
no WordPress, no database, and no Node.js process on the server.

| Where | What |
| --- | --- |
| Document root (`public_html`) | The exported site, `.htaccess`, `api/contact.php` |
| One level **above** the document root | `syncion-private/` — secrets and PHPMailer |

`api/contact.php` is a port of the Cloudflare Pages Function. Validation rules,
status codes, and visitor-facing messages match `server/contact.ts` exactly, so
`npm test` still describes the endpoint's behaviour even though those tests run
against the TypeScript version.

## Build the upload bundle

```
npm ci
npm run build
npm run hosting:bundle
```

`npm run build` needs `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in `.env.local`: the site
key is compiled into the page, so changing it means rebuilding and re-uploading.

The bundle lands in `dist-upload/`, with `syncion-upload.zip` if `zip` is
available. Secrets are never bundled — `hosting/private/config.php` is skipped.

## Upload

1. In cPanel → File Manager, upload and extract the archive somewhere outside
   the document root, such as your home directory.
2. Move the **contents** of `public_html/` into the real document root. For a
   primary domain that is `public_html`; for an addon domain it is that domain's
   own folder.
3. Move the `syncion-private/` folder so it sits **beside** the document root,
   not inside it. The endpoint walks up the directory tree to find it, so both
   layouts work, but anything inside the document root is web-reachable.
4. Rename `syncion-private/config.example.php` to `config.php` and fill in:

   | Key | Value |
   | --- | --- |
   | `SPACEMAIL_PASSWORD` | Mailbox password for `info@synciontech.com` — not the Spaceship account password |
   | `TURNSTILE_SECRET_KEY` | Secret key from the Managed Turnstile widget |
   | `CONTACT_ALLOWED_ORIGINS` | `https://synciontech.com,https://www.synciontech.com` |

   Never commit `config.php`; `.gitignore` already excludes it.
5. Set the file permissions on `config.php` to `600`.
6. In cPanel → MultiPHP Manager, confirm the domain runs **PHP 8.1 or newer**.

## Turnstile

Turnstile is a free Cloudflare service and needs no Cloudflare hosting or DNS.
In the widget's settings, list every hostname the form should work on
(`synciontech.com`, `www.synciontech.com`) with no protocol or path. The server
checks both the widget hostname and the `contact` action, so a token minted for
another site is rejected.

## Verify after uploading

Work through these in order; each one isolates a different failure.

1. `https://synciontech.com` loads over HTTPS with images and styles intact.
2. A made-up URL such as `/nope` returns the styled 404 page.
3. `curl -i https://synciontech.com/api/contact` returns **405** with an `Allow:
   POST` header. Anything else — 404, or PHP source in the response body — means
   the rewrite or PHP handler is wrong, and nothing below will work.
4. `curl -i -X POST -H 'Content-Type: application/json' -d '{}'
   https://synciontech.com/api/contact` returns **403**, because there is no
   `Origin` header. A **503** here means `config.php` was not found or is empty.
5. Submit a real enquiry through the website form. Confirm it arrives at
   `info@synciontech.com`, check the spam folder too, and confirm Reply goes to
   the visitor's address rather than to the mailbox itself.

Step 5 is the only test of the SMTP path. It cannot be verified anywhere but the
live server, because it needs the real mailbox password.

## If the form fails

The endpoint never returns SMTP detail to visitors, because those messages can
contain credentials. Diagnose from the status code instead:

| Status | Meaning |
| --- | --- |
| 403 | The posting origin is not in `CONTACT_ALLOWED_ORIGINS` |
| 415 | Something stripped the JSON `Content-Type` header |
| 503 | `config.php` missing or incomplete, or Turnstile was unreachable |
| 502 | SMTP refused the message — usually a wrong mailbox password |

A 502 logs only the exception class to the PHP error log, viewable in cPanel →
Errors. If SMTP is rejected, check the mailbox password first, then whether the
host allows outbound connections on port 465.

Do not resubmit repeatedly after an error. A send can be accepted by the mail
server after the connection fails, so retrying can deliver duplicates.

## Deploying an update

Rebuild, re-bundle, and re-upload the document root contents. `syncion-private/`
only changes when PHPMailer or the secrets change. Hashed assets under
`_next/static` are cached for a year; HTML is revalidated on every request, so a
new deploy is visible immediately.
