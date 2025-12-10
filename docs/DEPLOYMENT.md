# Live-Deployment Anleitung

Diese Anleitung führt dich durch das komplette Deployment des CLI-Chat Systems auf Live-Servern.

## Übersicht

1. **Supabase** - Database + Auth (Cloud)
2. **Railway** - Chat-Server (Cloud)
3. **Client** - Terminal-Client (NPM oder direkt)

**Geschätzte Zeit:** 30-45 Minuten

---

## Phase 1: Supabase Setup (10-15 Min)

### 1.1 Account erstellen

1. Gehe zu [supabase.com](https://supabase.com)
2. Klicke auf "Start your project"
3. Registriere dich mit GitHub, Google oder Email
4. Bestätige deine Email-Adresse

### 1.2 Neues Projekt erstellen

1. Im Dashboard: Klicke "New Project"
2. Fülle aus:
   - **Name**: `cli-chat` (oder dein Name)
   - **Database Password**: Generiere ein sicheres Passwort (speichere es!)
   - **Region**: Wähle die nächstgelegene Region (z.B. `Europe West (Frankfurt)`)
   - **Pricing Plan**: Free
3. Klicke "Create new project"
4. Warte ~2 Minuten bis das Projekt bereit ist

### 1.3 Datenbank-Schema erstellen

1. In der linken Sidebar: Klicke "SQL Editor"
2. Klicke "+ New query"
3. Öffne lokal die Datei `docs/supabase-schema.sql`
4. Kopiere den GESAMTEN Inhalt (Strg+A, Strg+C)
5. Füge ihn im SQL Editor ein (Strg+V)
6. Klicke "Run" (oder Strg+Enter)
7. Du solltest "Success. No rows returned" sehen

### 1.4 Email Auth konfigurieren

1. Linke Sidebar: "Authentication" → "Providers"
2. Finde "Email" und stelle sicher es ist aktiviert (grüner Toggle)
3. **Für Entwicklung** (optional):
   - Gehe zu "Settings" (unten links) → "Auth"
   - Deaktiviere "Enable email confirmations"
   - (So können User sich ohne Email-Bestätigung registrieren)
4. Speichere die Änderungen

### 1.5 API-Keys kopieren

1. Linke Sidebar: "Settings" (ganz unten) → "API"
2. Du siehst:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGc...` (langer String)
   - **service_role**: `eyJhbGc...` (anderer langer String - klicke "Reveal")

3. **WICHTIG**: Kopiere diese 3 Werte in eine Text-Datei:
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_KEY=eyJhbGc...
   ```

⚠️ **ACHTUNG**: `SUPABASE_SERVICE_KEY` ist GEHEIM! Niemals in Git committen oder öffentlich teilen!

### 1.6 Ersten Admin-User vorbereiten

Du kannst erst später einen Admin erstellen (nach erster Registrierung).

✅ **Supabase ist fertig!**

---

## Phase 2: Railway Deployment (15-20 Min)

### 2.1 Railway Account erstellen

1. Gehe zu [railway.app](https://railway.app)
2. Klicke "Login" → "Login with GitHub" (empfohlen)
3. Authorisiere Railway für dein GitHub-Konto

### 2.2 Neues Projekt erstellen

#### Option A: GitHub Repository (empfohlen)

1. Im Railway Dashboard: "+ New Project"
2. Wähle "Deploy from GitHub repo"
3. Falls gefragt: Gib Railway Zugriff auf dein Repository
4. Wähle dein `cli-chat` Repository
5. Railway erkennt automatisch Node.js

#### Option B: Railway CLI

```bash
# Railway CLI installieren
npm install -g @railway/cli

# In dein Projekt-Verzeichnis
cd /pfad/zu/cli-chat

# Login
railway login
# Browser öffnet sich, authorisiere

# Neues Projekt erstellen
railway init
# Wähle "Empty Project"
# Gib einen Namen ein: cli-chat-server

# Environment Variables setzen (siehe nächster Schritt)
```

### 2.3 Environment Variables konfigurieren

**Web-Interface (empfohlen):**

1. Gehe zu deinem Projekt im Railway Dashboard
2. Klicke auf dein Service (z.B. "cli-chat")
3. Klicke auf "Variables" Tab
4. Klicke "+ New Variable" und füge hinzu:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
PORT=3000
NODE_ENV=production
CORS_ORIGIN=*
```

5. Ersetze die Werte mit deinen Supabase-Credentials!

**CLI-Alternative:**

```bash
railway variables set SUPABASE_URL="https://xxxxx.supabase.co"
railway variables set SUPABASE_ANON_KEY="eyJhbGc..."
railway variables set SUPABASE_SERVICE_KEY="eyJhbGc..."
railway variables set PORT=3000
railway variables set NODE_ENV=production
railway variables set CORS_ORIGIN="*"
```

### 2.4 Build-Konfiguration anpassen

Railway muss wissen, dass nur der Server deployed werden soll:

**Im Web-Interface:**

1. Klicke auf "Settings" Tab
2. Unter "Build":
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Speichere

**ODER: railway.toml erstellen**

Erstelle im Projekt-Root eine `railway.toml`:

```toml
[build]
builder = "NIXPACKS"

[build.nixpacksConfig]
buildCommand = "cd server && npm install"
startCommand = "cd server && npm start"
```

### 2.5 Deployment starten

**Web-Interface:**
1. Gehe zu "Deployments" Tab
2. Klicke "Deploy" (falls nicht automatisch gestartet)

**CLI:**
```bash
railway up
```

3. Warte ~2-5 Minuten
4. Deployment-Log beobachten
5. Bei "✓ Build successful" → "✓ Deployment live"

### 2.6 Public Domain erhalten

1. Im Railway Dashboard: Klicke auf dein Service
2. Gehe zu "Settings" Tab
3. Unter "Networking":
   - Klicke "Generate Domain"
   - Du bekommst eine URL: `https://xxx-production.railway.app`
4. **Kopiere diese URL!** Das ist deine Server-URL

### 2.7 Server testen

```bash
# Health Check
curl https://deine-app.railway.app/health

# Sollte zurückgeben:
# {"status":"ok","timestamp":"..."}
```

✅ **Railway ist fertig!**

---

## Phase 3: Client-Distribution (5-10 Min)

Es gibt **3 Optionen**, wie User den Client nutzen können:

### Option A: NPM Package (empfohlen für regelmäßige Nutzung)

**Client für Production konfigurieren:**

1. Öffne `client/.env` (erstelle falls nicht vorhanden)
2. Füge ein:
   ```
   SERVER_URL=https://deine-app.railway.app
   SOCKET_URL=https://deine-app.railway.app
   ```

**Als globales CLI-Tool installieren:**

```bash
cd client
npm install -g .
```

**Nutzung:**
```bash
# Von überall:
cli-chat
```

**Für andere User:**
Du kannst dein Package auf NPM veröffentlichen:

```bash
cd client

# package.json anpassen:
# - name: "@deinusername/cli-chat" (muss unique sein)
# - version: "1.0.0"

# NPM Login
npm login

# Veröffentlichen
npm publish --access public

# User können dann installieren:
# npm install -g @deinusername/cli-chat
```

### Option B: Git-Clone (für Entwickler)

User klonen dein Repo und nutzen es lokal:

```bash
# User führt aus:
git clone https://github.com/deinusername/cli-chat.git
cd cli-chat/client

# .env erstellen
echo "SERVER_URL=https://deine-app.railway.app" > .env
echo "SOCKET_URL=https://deine-app.railway.app" >> .env

# Dependencies installieren
npm install

# Starten
npm start
```

### Option C: Binary Distribution (Advanced)

Erstelle ausführbare Binaries mit pkg:

```bash
# pkg installieren
npm install -g pkg

cd client
npm install

# package.json erweitern:
# "bin": {
#   "cli-chat": "src/index.js"
# },
# "pkg": {
#   "scripts": "src/**/*.js",
#   "targets": ["node18-linux-x64", "node18-macos-x64", "node18-win-x64"]
# }

# Binaries erstellen
pkg .

# Output:
# cli-chat-linux
# cli-chat-macos
# cli-chat-win.exe

# User laden Binary herunter und führen aus:
# ./cli-chat-linux
```

---

## Phase 4: Admin-User erstellen

Nach dem ersten User-Registrierung:

1. Registriere dich im Client (oder lasse jemanden registrieren)
2. Gehe zu Supabase Dashboard
3. Linke Sidebar: "Table Editor" → "profiles"
4. Finde deinen User (nach Username suchen)
5. Doppelklicke auf die `role` Spalte
6. Ändere von `user` zu `admin`
7. Speichere (Enter)
8. Logge dich im Client neu ein

✅ **Du bist jetzt Admin!**

Teste:
```bash
/admin create-room #test Dies ist ein Test
```

---

## Phase 5: Testen & Monitoring

### Server-Logs anschauen

**Railway Web:**
1. Dashboard → Dein Projekt → "Deployments"
2. Klicke auf latest deployment
3. "View Logs"

**Railway CLI:**
```bash
railway logs
```

### Live-Test

1. Starte Client (lokal oder global):
   ```bash
   cli-chat
   ```

2. Registriere einen Account:
   - Email: `test@example.com`
   - Username: `testuser`
   - Password: `test123`

3. Du solltest in #general landen

4. Teste Commands:
   ```bash
   /rooms
   /join #dev
   /msg @andereruser Hi
   /help
   ```

### Performance überwachen

**Railway Dashboard:**
- CPU-Nutzung
- Memory-Nutzung
- Request-Count
- Deployment-Status

**Supabase Dashboard:**
- Database Size
- API Requests
- Active Connections

---

## Phase 6: Domain & SSL (Optional)

### Custom Domain für Railway

1. Railway Dashboard → Settings → Networking
2. "Custom Domain" → Füge deine Domain hinzu (z.B. `chat.deinedomain.com`)
3. Erstelle CNAME Record bei deinem DNS-Provider:
   ```
   chat.deinedomain.com → xxx-production.railway.app
   ```
4. Warte auf SSL-Zertifikat (~5 Min)
5. Update Client `.env`:
   ```
   SERVER_URL=https://chat.deinedomain.com
   SOCKET_URL=https://chat.deinedomain.com
   ```

---

## Troubleshooting

### Server startet nicht

**Symptom:** Railway-Logs zeigen Fehler

**Check:**
```bash
# Railway Logs
railway logs

# Häufige Fehler:
# 1. "Missing Supabase environment variables"
#    → Prüfe Environment Variables im Dashboard

# 2. "Cannot find module"
#    → Build Command falsch, sollte sein: cd server && npm install

# 3. "Port already in use"
#    → Sollte nicht auf Railway passieren, lokal: ändere PORT in .env
```

**Fix:**
1. Gehe zu Variables Tab
2. Prüfe alle Werte
3. Redeploy: Deployments → "Redeploy"

### Client kann nicht verbinden

**Symptom:** "Connection failed"

**Check:**
```bash
# Server erreichbar?
curl https://deine-app.railway.app/health

# Sollte zurückgeben:
# {"status":"ok",...}
```

**Fix:**
1. Prüfe `client/.env`:
   ```
   SERVER_URL=https://deine-app.railway.app
   SOCKET_URL=https://deine-app.railway.app
   ```
2. Stelle sicher keine Leerzeichen oder Anführungszeichen
3. Neustart Client

### Registrierung schlägt fehl

**Symptom:** "Registration failed"

**Check Supabase:**
1. Dashboard → Authentication → Users
2. Gibt es bereits einen User mit dieser Email?
3. Dashboard → Auth → Settings
4. "Enable email confirmations" deaktiviert?

**Check Server Logs:**
```bash
railway logs | grep -i error
```

### Admin-Commands funktionieren nicht

**Symptom:** "Admin privileges required"

**Fix:**
1. Supabase → Table Editor → profiles
2. Finde deinen User
3. `role` muss `admin` sein (nicht `user`)
4. Neu einloggen im Client

---

## Kosten-Übersicht (Stand 2024)

### Free Tier (bis ~500-1000 User)

| Service    | Free Tier                     | Upgrade bei        |
|------------|-------------------------------|--------------------|
| Supabase   | 500MB DB, 2GB Bandwidth       | ~1000 aktive User  |
| Railway    | $5 Credit/Monat               | ~500 Server-Stunden|

**Total: $0-5/Monat**

### Bezahlte Tiers (>1000 User)

| Service    | Bezahlt                       | Kosten             |
|------------|-------------------------------|--------------------|
| Supabase   | Pro Plan: 8GB DB, 50GB BW     | $25/Monat          |
| Railway    | ~1000h/Monat Server-Zeit      | $10-20/Monat       |

**Total: $35-45/Monat**

---

## Checkliste

- [ ] Supabase-Projekt erstellt
- [ ] Schema ausgeführt (`supabase-schema.sql`)
- [ ] Supabase API-Keys kopiert
- [ ] Railway-Account erstellt
- [ ] Railway-Projekt deployed
- [ ] Environment Variables gesetzt
- [ ] Public Domain erhalten
- [ ] Client konfiguriert (`SERVER_URL`)
- [ ] Erster User registriert
- [ ] Admin-User erstellt (role = admin)
- [ ] Live-Test erfolgreich

---

## Support & Weiterentwicklung

**Nächste Schritte:**
- Custom Domain einrichten
- SSL/TLS aktivieren (automatisch bei Railway)
- Monitoring aufsetzen (Railway + Supabase Dashboards)
- Client als NPM Package veröffentlichen
- Branding anpassen (Logo, Farben)

**Bei Problemen:**
- Railway Logs: `railway logs`
- Supabase Logs: Dashboard → Logs
- GitHub Issues: Erstelle ein Issue im Repo

Viel Erfolg mit deinem Live-Deployment! 🚀
