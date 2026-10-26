# OGD Electric website

Static site (HTML/CSS/JS) with one PHP endpoint (`api/quote.php`) for the quote form. Runs on Hostinger shared/web hosting as-is; no build step.

## Deploy on Hostinger

**Option A: Git (hPanel → Websites → Advanced → Git)**
1. Repository: `https://github.com/Mesumraza08-art/ogd.git`, branch `main`.
2. Install path: leave empty (deploys into `public_html`). `public_html` must be empty for the first deploy.
3. Optional: enable Auto Deployment and add the webhook URL to GitHub (Settings → Webhooks).

**Option B: File Manager / FTP**: upload the contents of this repo into `public_html`.

## After deploying
- Create the mailbox `no-reply@ogdelectric.ca` in hPanel (Emails), or change `FROM_EMAIL` in `api/quote.php` to an existing mailbox on the domain. `TO_EMAIL` is where quote requests are delivered.
- Enable SSL for the domain in hPanel. `.htaccess` forces HTTPS on any domain and adds `www.` only for `ogdelectric.ca`.
- Test the form on `/contact/`.
