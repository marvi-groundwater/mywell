# MyWell — landing site

The public front door for the [MyWell](https://d3l1n17hqtm5w.cloudfront.net)
water-monitoring app: a single static page, published on GitHub Pages, with
its content managed through a git-based CMS — the same setup as the MARVI
website.

**Live site:** https://mywell.au/
**Content admin (CMS):** https://mywell.au/admin/

## How it fits together

```
content/landing.json   ← everything an editor can change (the CMS edits this)
template.html          ← the page design (layout, styles, animations)
scripts/build.mjs      ← content + template → _site/index.html
scripts/verify.mjs     ← refuses to publish a broken build
admin/                 ← Sveltia CMS (vendored), edits content/ via GitHub
.github/workflows/     ← every push to main rebuilds and republishes Pages
```

Editing flow: open `/admin/`, sign in, change the text, save. The save is a
commit to `main`; the deploy workflow rebuilds the site from it. Nothing to
install, no server anywhere.

## Signing in to the CMS

Sveltia is configured with `auth_methods: [token]`: editors sign in with a
GitHub **fine-grained personal access token** — create one at
github.com/settings/personal-access-tokens with access to only this
repository and the **Contents: read and write** permission. Tokens expire
(GitHub caps them at about a year); when saving stops working, issue a new
one and sign in again.

## Local development

```
node scripts/build.mjs && node scripts/verify.mjs
```

then open `_site/index.html`. No dependencies to install.

## Relationship to the app

This repository holds only the marketing page. The MyWell application
(frontend, backend, mobile) lives in its own private repository; the copy of
the landing page that the app itself serves at `/welcome.html` is maintained
there. When one changes substantially, mirror the change in the other.
