# Cloudflare Pages deployment

> **The site is moving to Spaceship shared hosting.** See
> [hosting/README.md](hosting/README.md) for the static-upload plus PHP endpoint
> setup that replaces this one. This document is kept for the Cloudflare Pages
> path, which still works if you go back to it.

The site exports static HTML, CSS, JavaScript, and images into `out/`.
Domain registration and the `info@synciontech.com` mailbox remain at Spaceship.
No DNS records or external hosting settings have been changed by this setup.

## Build and publish

Run `npm ci` and `npm run build`. The publishable folder is `out/`, not `.next/`.
`npm run dev` is frontend-only development. After a build, `npm run pages:dev`
(or `npm start`) previews the exported site **and** its contact endpoint at
`http://localhost:8788`. Next's development server does not run Pages Functions.

For automatic deployments, push this project to a GitHub or GitLab repository
and connect it to a **Pages** project in Cloudflare's Workers & Pages dashboard:

- Framework preset: Next.js (Static HTML Export)
- Build command: `npm run build`
- Build output directory: `out`
- Root directory: the directory containing `package.json`
- Node.js version: 22 (set the build environment variable `NODE_VERSION=22`)

Alternatively, use Wrangler Direct Upload: log in with `npx wrangler login`,
then run `npm run pages:deploy`. Check that the project name in `wrangler.jsonc`
matches the intended Pages project first. **Do not use dashboard drag-and-drop**:
it does not compile the `functions/` folder needed for the contact form.
Choose Git integration if you want automatic deployments: a Direct Upload
project cannot later be switched to Git integration.

Test the assigned `pages.dev` address before connecting the production domain.

## Connect the domain without moving the mailbox

Choose the preferred website address before making DNS changes.

### Keep DNS at Spaceship: use `www.synciontech.com`

1. Add `www.synciontech.com` under the Pages project's **Custom domains** first.
2. At the current DNS provider, set the `www` CNAME to the actual Pages hostname
   shown by Cloudflare, such as `<your-project>.pages.dev` (no protocol or path).
3. Do not modify the mailbox's MX, SPF, DKIM, DMARC, or other mail records.
4. Wait for the custom domain and HTTPS certificate to become active, then test.

The bare domain needs a separate HTTPS-capable redirect to `www`; a CNAME for
`www` alone does not configure the bare domain. Confirm the registrar's redirect
options before choosing this arrangement.

### Use `synciontech.com` directly: move DNS, not registration

Cloudflare Pages requires Cloudflare nameservers for an apex custom domain.
The domain registration, renewals, and mailbox can still remain at Spaceship.

1. Add the domain to Cloudflare on its Free plan.
2. Export or record the existing DNS zone. Copy and verify **all** required
   records, especially Spaceship mail records, before changing nameservers.
   Do not assume automatic scanning found every record. Keep mail-server records
   DNS-only, not proxied. Keep one SPF record per hostname; merge changes properly.
3. If DNSSEC is enabled, follow the providers' DNSSEC migration instructions
   before switching nameservers to avoid validation failures.
4. Set the assigned Cloudflare nameservers at Spaceship, then wait for activation.
5. Add both the apex and `www` under the Pages project's Custom domains and choose
   a primary address. Configure the other address to redirect to it.
6. Test HTTPS, mailbox sending and receiving, and mail authentication afterward.

## Contact form: direct Spacemail SMTP (no Resend)

`functions/api/contact.ts` validates the submission and Cloudflare Turnstile,
then uses Nodemailer with the Workers Node compatibility flag to send via
`mail.spacemail.com:465` over TLS. The fixed sender and recipient are
`info@synciontech.com`; the visitor's email is Reply-To. The server accepts only
plain-text messages and never sends automatic replies to visitor-supplied addresses.

### Configure production

1. In Spacemail Manager, confirm that SMTP access is enabled for
   `info@synciontech.com`. Use that **mailbox's password**, not your Spaceship
   account password. Do not paste it into source files, Git, or chat.
2. Create a **Managed Turnstile widget** in the Cloudflare dashboard. Add each
   actual website hostname where the form should work (without protocol/path).
   Do not enable arbitrary preview hosts.
3. In the Pages project's build environment, set the public variable
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to the widget's site key. This value is public
   and is embedded during `npm run build`; changes require a rebuild.
4. In Pages **Settings → Variables and Secrets**, add these runtime values as
   encrypted secrets for **Production**:

   | Name | Value |
   | --- | --- |
   | `SPACEMAIL_PASSWORD` | Password for `info@synciontech.com` |
   | `TURNSTILE_SECRET_KEY` | The Turnstile widget's secret key |
   | `CONTACT_ALLOWED_ORIGINS` | Exact comma-separated origins, e.g. `https://synciontech.com,https://www.synciontech.com` |

   Only include addresses you own and intend to enable, with no trailing slash.
   For testing on `pages.dev`, add the exact project origin here and its hostname
   to the Turnstile widget. Previews are not automatically authorized. Leave
   preview SMTP secrets unset unless you deliberately want them to send real mail.
5. Rebuild and deploy through Pages Git integration or Wrangler. The checked-in
   compatibility flag enables Node APIs; `public/_routes.json` restricts Function
   execution to `/api/contact`, leaving the rest of the site static.
6. Submit one enquiry on the deployed site. Confirm it arrives in the inbox
   (also check spam), and that Reply targets the visitor. SMTP acceptance is not
   proof of inbox delivery. An error after sending can be ambiguous; do not retry
   repeatedly. The application does not automatically retry SMTP sends.

No extra sending-domain DNS records or Resend account are needed. Keep the
existing Spaceship mail authentication records. Sending remains subject to your
Spacemail plan's limits; the form is for enquiries, not bulk email.

Turnstile is checked server-side for hostname and action. There is also an
origin allowlist, honeypot, size limits, and field/header validation. Turnstile
is not a hard per-IP rate limit: consider a Cloudflare rate-limiting rule for
`POST /api/contact` if traffic or abuse grows, checking plan availability first.

### Local testing

- Copy `.env.example` to `.env.local` and enter the **public** site key.
- Copy `.dev.vars.example` to `.dev.vars` and privately fill in runtime secrets.
  Both filled files are ignored by Git. Never prefix secrets with `NEXT_PUBLIC_`.
- Build, then run `npm run pages:dev`; use the allowed localhost origin.
- Turnstile offers test keys for local testing. Never deploy test keys to production.
  Submitting locally with real SMTP credentials **will send real email**.
- Run `npm test`, `npm run typecheck`, `npm run build`, and `npm run pages:build`.
  Unit tests mock verification and delivery; they do not send email.
- Optional diagnostic: `node scripts/check-spacemail.mjs` checks a TLS/SMTP
  handshake using the local Cloudflare runtime. It does not authenticate or send
  mail and cannot replace a deployed end-to-end delivery test.

Until configured, the form disables sending if the public site key is missing,
or returns an honest unavailable state if runtime secrets are missing. It retains
the visitor's entered text on errors and always offers a direct email link.

## Before launch: outstanding work

- Confirm the primary website address and update the hard-coded `syncion.tech`
  metadata URLs in `app/layout.tsx` to match it.
- Add the credentials and Turnstile configuration above. Authenticated sending
  and live inbox delivery still need verification in your Cloudflare account.
- Test the final live deployment on mobile and desktop, including images,
  navigation, 404 handling, and actual email delivery when configured.

## Official references

- [Next.js static export on Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/)
- [Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Direct Upload options and limitations](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Spacemail SMTP settings](https://www.spaceship.com/knowledgebase/connect-spacemail-to-email-client/)
- [Workers TLS support](https://developers.cloudflare.com/workers/runtime-apis/nodejs/tls/)
- [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Turnstile local test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)
