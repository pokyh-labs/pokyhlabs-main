# PostgreSQL-Migration & Dokploy-Setup

Das Backend wurde von **MySQL** auf **PostgreSQL** umgestellt. Dank Sequelize
(ORM) ist die Anwendung dialect-agnostisch – der Datenbank-Typ wird allein über
die Umgebungsvariable `DB_DIALECT` gesteuert. Standard ist jetzt `postgres`.

Diese Anleitung zeigt:

1. PostgreSQL in Dokploy anlegen
2. Backend-Umgebungsvariablen umstellen
3. Bestehende Daten 1:1 von MySQL nach PostgreSQL übernehmen
4. Deployen & verifizieren

---

## 1. PostgreSQL-Service in Dokploy anlegen

1. Dokploy → dein Projekt → **Create Service → Database → PostgreSQL**.
2. Werte setzen (Beispiel – Passwort frei wählen, **stark**):

   | Feld              | Wert                          |
   | ----------------- | ----------------------------- |
   | **Name**          | `pokyhlabs-postgres`          |
   | **Database Name** | `pokyhlabs`                   |
   | **User**          | `pokyhlabs_user`              |
   | **Password**      | `<starkes-Passwort>`          |
   | **Image / Version** | `postgres:16` (empfohlen)   |

3. **Deploy** klicken und warten, bis der Service „running" ist.
4. **Internen Hostnamen merken.** Dokploy vergibt einen internen Service-Namen,
   ähnlich wie bei deiner alten MySQL-DB (`business-pokyhlabsmysql-wsugxn`).
   Du findest ihn im Service unter **„Internal Connection" / „Host"**, z. B.
   `business-pokyhlabspostgres-xxxxxx`. Diesen Wert brauchst du als `DB_HOST`.

> Die App und die DB müssen im **selben Dokploy-Projekt/Netzwerk** liegen, damit
> das Backend den internen Hostnamen auflösen kann (kein öffentlicher Port nötig).

---

## 2. Backend-Umgebungsvariablen anpassen

Im **Application-Service** (dein Frontend/Backend) unter **Environment** den
Datenbank-Block ersetzen. Aus dem alten MySQL-Block …

```env
DB_HOST=business-pokyhlabsmysql-wsugxn
DB_PORT=3306
DB_NAME=pokyhlabs
DB_USER=pokyhlabs_user
DB_PASSWORD="..."
DB_ROOT_PASSWORD="..."
```

… wird der neue PostgreSQL-Block:

```env
DB_DIALECT=postgres
DB_HOST=business-pokyhlabspostgres-xxxxxx   # interner Hostname aus Schritt 1.4
DB_PORT=5432
DB_NAME=pokyhlabs
DB_USER=pokyhlabs_user
DB_PASSWORD="<dasselbe-Passwort-wie-in-Dokploy>"
```

Alle übrigen Variablen (JWT, ENCRYPTION_KEY, ADMIN_*, Cloudflare, …) bleiben
**unverändert**.

**Hinweise:**

- `DB_ROOT_PASSWORD` wird von der App nicht gelesen → kann entfallen.
- TLS ist beim internen Dokploy-Netzwerk i. d. R. **nicht** nötig. Falls deine
  Postgres-Instanz SSL erzwingt:
  ```env
  DB_SSL=true
  DB_SSL_REJECT_UNAUTHORIZED=false   # für interne/selbstsignierte Zertifikate
  ```
- Connection-Pool ist optional konfigurierbar (Defaults sind sinnvoll):
  `DB_POOL_MAX=10`, `DB_POOL_MIN=0`, `DB_POOL_ACQUIRE=30000`, `DB_POOL_IDLE=10000`.

Beim ersten Start legt das Backend **automatisch** alle Tabellen, Indizes und –
falls noch keine Nutzer existieren – den Admin aus `ADMIN_*` an. Du musst kein
Schema manuell erstellen.

---

## 3. Bestehende Daten von MySQL nach PostgreSQL übernehmen

> **Nur nötig, wenn du deine vorhandenen Inhalte (Blogs, Projekte, Anfragen,
> Nutzer) behalten willst.** Wer bei null startet, überspringt diesen Schritt –
> die Tabellen werden beim ersten Start automatisch erzeugt.

Am einfachsten und zuverlässigsten ist **`pgloader`**. Es überträgt Daten *und*
konvertiert die Typunterschiede automatisch (z. B. MySQL `TINYINT(1)` → Postgres
`BOOLEAN`, `DATETIME` → `TIMESTAMP`) und setzt am Ende die `id`-Sequenzen korrekt.

### 3a. Vorgehen

1. **Alte MySQL-DB nicht löschen**, bevor die Übernahme bestätigt ist.
2. Eine `migrate.load`-Datei anlegen (lokal oder in einem One-off-Container, der
   beide DBs im Netzwerk erreicht):

   ```
   LOAD DATABASE
     FROM      mysql://pokyhlabs_user:ALTES_PW@MYSQL_HOST:3306/pokyhlabs
     INTO postgresql://pokyhlabs_user:NEUES_PW@POSTGRES_HOST:5432/pokyhlabs

   WITH include drop, create tables, create indexes, reset sequences,
        workers = 4, concurrency = 1

   SET maintenance_work_mem to '128MB', work_mem to '32MB'

   CAST type datetime to timestamptz,
        type tinyint  to boolean using tinyint-to-boolean;
   ```

   `MYSQL_HOST` / `POSTGRES_HOST` durch die internen Dokploy-Hostnamen ersetzen,
   Passwörter eintragen.

3. Ausführen:

   ```bash
   pgloader migrate.load
   ```

   `pgloader` legt Tabellen, Daten, Indizes an und setzt die Auto-Increment-
   Sequenzen. Am Ende kommt eine Zusammenfassung mit Zeilenzahl pro Tabelle.

> **Tipp:** Die Log-Tabellen (`access_logs`, `auth_logs`, `error_logs`,
> `suspicious_activities`) müssen **nicht** mitgenommen werden – die füllen sich
> im Betrieb neu. Du kannst sie in der `.load` auslassen
> (`INCLUDING ONLY TABLE NAMES MATCHING 'users','blogs','projects','inquiries',
> 'refresh_tokens'`), um die Migration schlank zu halten.

### 3b. Reihenfolge mit der App

`pgloader` erstellt das Schema selbst. Die App nutzt beim Start
`sequelize.sync({ force: false })` – das ist **nicht-destruktiv**: vorhandene
Tabellen/Spalten werden nie verändert oder gelöscht, nur fehlende Spalten ergänzt.
Daher ist beide Reihenfolgen unkritisch; empfohlen:

1. Postgres-Service anlegen (Schritt 1).
2. **Erst** `pgloader` laufen lassen (Daten landen in Postgres).
3. **Dann** das Backend mit den neuen Env-Variablen deployen.

---

## 4. Deployen & verifizieren

1. Application-Service in Dokploy **Redeploy**.
2. Logs prüfen – diese Zeilen müssen erscheinen:
   ```
   Database connected
   Database synced
   Server running on http://localhost:3001 (production)
   ```
   (Bei Migration aus Schritt 3 erscheint zusätzlich kein „Default admin created",
   weil bereits Nutzer existieren – das ist korrekt.)
3. Smoke-Test:
   - `https://pokyh.studio` lädt, Blogs/Projekte erscheinen.
   - Admin-Login funktioniert.
   - Im Admin-Dashboard: Logs-Statistiken & Geo-Karte laden ohne Fehler.

### Rollback

Sollte etwas klemmen: in den Env-Variablen einfach wieder den alten MySQL-Block
einsetzen (`DB_DIALECT=mysql`, `DB_PORT=3306`, alter `DB_HOST`) und redeployen.
Der `mysql2`-Treiber ist weiterhin installiert – es ist kein Code-Rollback nötig.

---

## Was sich im Code geändert hat (Referenz)

- `src/config/database.js` – Dialekt über `DB_DIALECT` (Default `postgres`),
  Default-Port pro Dialekt, optionales SSL & konfigurierbarer Pool. Nichts hardcoded.
- `src/app.js` – Auto-Migration nutzt jetzt `qi.addColumn()` mit Sequelize-
  DataTypes (dialect-neutral) statt MySQL-Backtick-SQL.
- `src/controllers/logsController.js` – Stunden-Extraktion dialect-aware
  (`date_part('hour', …)` für Postgres, `HOUR()` für MySQL, `strftime` für SQLite);
  Substring-Filter nutzen auf Postgres `ILIKE`, damit die Suche – wie in MySQL –
  case-insensitiv bleibt.
- `src/controllers/systemController.js` – derselbe `ILIKE`-Abgleich für den
  Endpoint-Filter.
- `package.json` – `pg` + `pg-hstore` ergänzt (`mysql2` bleibt als Fallback).

Server-seitiges **Caching** (Blog-Listen, Stats, SEO, Geo etc.) war bereits über
`node-cache` aktiv (`src/config/cache.js`) und wurde unverändert übernommen – die
Performance bleibt also gleich gut bzw. besser, da Postgres-Indizes greifen.
