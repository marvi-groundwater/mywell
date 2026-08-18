// Render content/landing.json into template.html → _site/.
//
// Everything an editor can touch lives in the JSON; the template holds the
// design. All text is HTML-escaped on the way in, so nothing typed into the
// CMS can inject markup — the CMS edits words, not code.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "_site");

const content = JSON.parse(readFileSync(join(ROOT, "content/landing.json"), "utf8"));
let html = readFileSync(join(ROOT, "template.html"), "utf8");

const esc = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

// The hero headline may carry one highlighted phrase, wrapped in the page's
// water-gradient span. Escaping happens per fragment, so the span is the only
// markup that can ever appear inside the h1.
function heroTitle({ title = "", highlight = "" }) {
  const at = highlight ? title.indexOf(highlight) : -1;
  if (at === -1) return esc(title);
  return (
    esc(title.slice(0, at)) +
    '<span class="grad">' +
    esc(highlight) +
    "</span>" +
    esc(title.slice(at + highlight.length))
  );
}

const stat = (s) =>
  `            <div class="stat"><div class="n">${esc(s.n)}</div><div class="l">${esc(s.l)}</div></div>`;

const feature = (f) => `            <div class="feature">
              <img src="${esc(f.image)}" alt="" />
              <div>
                <h3>${esc(f.title)}</h3>
                <p>${esc(f.text)}</p>
              </div>
            </div>`;

const shot = (s) => `            <figure class="shot">
              <img class="phone" src="${esc(s.image)}" alt="${esc(s.caption)}" />
              <figcaption>${esc(s.caption)}</figcaption>
            </figure>`;

const step = (s, i) => `            <div class="step">
              <div class="num">${i + 1}</div>
              <img src="${esc(s.image)}" alt="" />
              <h3>${esc(s.title)}</h3>
              <p>${esc(s.text)}</p>
            </div>`;

const dataset = (d) => `            <div class="dataset">
              <h3><span class="flag">${esc(d.flag)}</span>${esc(d.title)}</h3>
              <p>${esc(d.text)}</p>
            </div>`;

const faq = (f) => `            <details>
              <summary>${esc(f.q)}</summary>
              <p>${esc(f.a)}</p>
            </details>`;

const ANDROID_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.6 2.1 13.7 12 3.6 21.9c-.4-.2-.6-.6-.6-1.1V3.2c0-.5.2-.9.6-1.1Zm11.1 8.9 2.5-2.4 3.9 2.2c.8.5.8 1.6 0 2.1l-3.9 2.2-2.5-2.4-1-1 .9-.9.1.2Zm-1.9-1.9L5.4 2l8.9 5.1-1.5 2ZM5.4 22l7.4-7.1 1.5 2L5.4 22Z"/></svg>`;
const APPLE_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.7 12.9c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.9-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3.1 2.4 1.2-.1 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.6-1-2.7-3.8ZM14.4 5.6c.7-.8 1.1-1.9 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4Z"/></svg>`;

// A store URL flips a badge from "Coming soon" (tester-invite mailto) to the
// live listing — the launch-day switch, made in the CMS, no code change.
function badge(icon, platformLine, url, comingSoonHref) {
  const live = typeof url === "string" && url.startsWith("https://");
  const href = live ? url : comingSoonHref;
  const big = live ? platformLine.split(" · ")[1] : "Coming soon";
  return `            <a class="store-badge" href="${esc(href)}">
              ${icon}
              <span class="lines">
                <span class="small">${esc(platformLine)}</span>
                <span class="big">${esc(big)}</span>
              </span>
            </a>`;
}

const email = content.app.contactEmail;
const slots = {
  APP_URL: esc(String(content.app.url).replace(/\/+$/, "")),
  CONTACT_EMAIL: esc(email),
  HERO_TITLE: heroTitle(content.hero),
  HERO_TAGLINE: esc(content.hero.tagline),
  HERO_NOTE: esc(content.hero.note),
  HERO_IMAGE: esc(content.hero.image),
  STATS: content.stats.map(stat).join("\n"),
  OVERVIEW_FEATURES: [content.features[0], content.features[2], content.features[3]]
    .filter(Boolean)
    .map(feature)
    .join("\n"),
  FEATURES: content.features.map(feature).join("\n"),
  SHOTS: content.shots.map(shot).join("\n"),
  STEPS: content.steps.map(step).join("\n"),
  DATASETS: content.datasets.map(dataset).join("\n"),
  FAQ: content.faq.map(faq).join("\n"),
  STORE_BADGES: [
    badge(ANDROID_ICON, "Android · Google Play", content.store.playUrl,
      `mailto:${email}?subject=MyWell%20Android%20tester%20invite`),
    badge(APPLE_ICON, "iPhone · App Store", content.store.iosUrl,
      `mailto:${email}?subject=MyWell%20iOS%20TestFlight%20invite`),
  ].join("\n"),
  STORE_NOTE: esc(content.store.note),
  AUDIENCE: esc(content.audience),
  CTA_TITLE: esc(content.cta.title),
  CTA_SUB: esc(content.cta.subtitle),
};

for (const [name, value] of Object.entries(slots)) {
  html = html.replaceAll(`@@${name}@@`, value);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "index.html"), html);
cpSync(join(ROOT, "assets"), join(OUT, "assets"), { recursive: true });
cpSync(join(ROOT, "admin"), join(OUT, "admin"), { recursive: true });
cpSync(join(ROOT, "content"), join(OUT, "content"), { recursive: true });
writeFileSync(join(OUT, ".nojekyll"), "");
console.log("built _site/");
