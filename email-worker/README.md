# pokyh.studio — Email Worker

Cloudflare Email Worker für eingehende Mails an **contact@pokyh.studio**.

Er sorgt dafür, dass eine **Direkt-Mail durch denselben Flow läuft wie das
Website-Kontaktformular**. Für jede eingehende Mail:

1. **Weiterleiten** — die Original-Mail geht an die Studio-Inbox (`FORWARD_TO`),
   inkl. Anhänge. Volle Archiv-Kopie in deinem Gmail.
2. **Ins Backend einspeisen** — die Mail wird geparst und an
   `BACKEND_INBOUND_URL` (`/api/inquiries/inbound`) geschickt. Das Backend legt
   daraus eine **Anfrage** an (sichtbar im Admin-Dashboard, `source: email`) und
   schickt dem Absender **dieselbe Bestätigung wie das Formular**.

→ Eine Logik, eine Datenquelle. Der Worker mailt nicht mehr selbst — Bestätigung
und Speicherung macht ausschließlich das Backend.

## Schutz gegen Mail-Loops / Spam (Backscatter)

Bestätigungen werden **nicht** blind verschickt:

- übersprungen für automatische Absender (`mailer-daemon`, `no-reply`, `bounces`, …)
- übersprungen für Bulk-/Listen-/Auto-Submitted-Mail (Newsletter, fremde Autoresponder)
- max. **eine** Bestätigung pro Absender pro `CONFIRM_TTL_MINUTES` (Standard 10 Min, via KV).
  Kurzes Per-Absender-Rate-Limit. Die Anfrage selbst wird trotzdem jedes Mal
  gespeichert — nur die Bestätigungs-Mail wird gedrosselt.

## Konfiguration: wo liegen Adressen & Secrets?

Nichts ist in `wrangler.toml` hardcoded — sauber für späteres Deployment:

| Wo                | Wofür                          | In git? |
| ----------------- | ------------------------------ | ------- |
| `.dev.vars`       | lokales `wrangler dev`         | nein (gitignored) |
| `wrangler secret` | der **deployte** Worker (live) | nein    |
| `wrangler.toml`   | nur `CONFIRM_TTL_MINUTES` + KV | ja      |

> ⚠️ Cloudflare-Eigenheit: `.dev.vars` gilt **nur lokal**. Der live Worker kennt
> diese Werte erst, wenn sie als **Secret** gesetzt sind (Schritt 4).

## Einmaliges Setup

Voraussetzungen:
- Domain `pokyh.studio` bei Cloudflare + in **Resend** verifiziert (für die Bestätigung – macht das Backend).
- Im **Backend** `.env`: `INBOUND_EMAIL_SECRET` gesetzt (gleicher Wert wie hier).

```bash
cd email-worker
npm install

# 1) Bei Cloudflare einloggen
npx wrangler login

# 2) Lokale Env anlegen (für `wrangler dev`)
copy .dev.vars.example .dev.vars      # Windows  (Unix: cp …)
#    … dann FORWARD_TO, BACKEND_INBOUND_URL und INBOUND_EMAIL_SECRET eintragen.

# 3) KV-Namespace für die Dedup-Logik anlegen …
npx wrangler kv namespace create AUTOREPLY_KV
#    … und die ausgegebene id in wrangler.toml bei AUTOREPLY_KV eintragen.

# 4) Werte für den LIVE-Worker als Secrets setzen
npx wrangler secret put FORWARD_TO            # deine Gmail-Adresse
npx wrangler secret put BACKEND_INBOUND_URL   # https://pokyh.studio/api/inquiries/inbound
npx wrangler secret put INBOUND_EMAIL_SECRET  # gleicher Wert wie im Backend .env

# 5) Deployen
npx wrangler deploy
```

## Routing aktivieren (Cloudflare Dashboard)

1. **Email → Email Routing → Destination addresses**: stelle sicher, dass deine
   Gmail-Adresse (`FORWARD_TO`) als Ziel **verifiziert** ist (grüner Haken).
2. **Email → Email Routing → Routing rules**: die Regel für
   `contact@pokyh.studio` auf **„Send to a Worker" → `pokyh-email-worker`** stellen.

Ab dann läuft jede Mail an `contact@` durch den Worker.

## Variablen-Übersicht

| Variable               | Bedeutung                                            | Quelle                   |
| ---------------------- | ---------------------------------------------------- | ------------------------ |
| `FORWARD_TO`           | Studio-Inbox; **muss verifizierte Destination sein** | `.dev.vars` / secret     |
| `BACKEND_INBOUND_URL`  | Backend-Endpoint `/api/inquiries/inbound`            | `.dev.vars` / secret     |
| `INBOUND_EMAIL_SECRET` | Shared Secret; **muss == Backend `.env`** sein       | `.dev.vars` / secret     |
| `CONFIRM_TTL_MINUTES`  | Bestätigungs-Rate-Limit pro Absender (Minuten)       | `wrangler.toml` `[vars]` |

Lokal kommen die Werte aus `.dev.vars`, im Live-Worker aus den Secrets — der
Worker-Code (`env.FORWARD_TO` etc.) bleibt in beiden Fällen identisch.

## Testen

```bash
npx wrangler tail          # Live-Logs während du eine Test-Mail schickst
```

Schick von einer fremden Adresse eine Mail an `contact@pokyh.studio` und prüfe:
1. die Mail landet in deinem **Gmail** (Weiterleitung),
2. im **Admin-Dashboard** taucht eine neue Anfrage auf (`source: email`),
3. der Absender bekommt die **Bestätigung**.

Eine zweite Mail innerhalb von 10 Min: neue Anfrage ja, aber **keine** zweite Bestätigung.
