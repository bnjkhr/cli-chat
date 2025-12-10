# Setup-Anleitung

## 1. Supabase einrichten

### Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com) und erstelle einen Account
2. Klicke auf "New Project"
3. Wähle einen Namen und ein Passwort für die Datenbank
4. Warte bis das Projekt bereit ist (~2 Minuten)

### Schema erstellen

1. Gehe zu "SQL Editor" in der linken Sidebar
2. Klicke auf "New Query"
3. Kopiere den Inhalt von `docs/supabase-schema.sql` und füge ihn ein
4. Klicke auf "Run" (oder Ctrl+Enter)
5. Du solltest "Success" sehen

### Auth konfigurieren

1. Gehe zu "Authentication" → "Settings"
2. Unter "Auth Providers" aktiviere "Email"
3. Deaktiviere "Confirm Email" für Entwicklung (optional)
4. Speichere die Änderungen

### API-Keys kopieren

1. Gehe zu "Settings" → "API"
2. Kopiere folgende Werte:
   - **Project URL** (z.B. `https://xxx.supabase.co`)
   - **anon/public key** (beginnt mit `eyJ...`)
   - **service_role key** (beginnt mit `eyJ...`) ⚠️ Geheim halten!

## 2. Server lokal starten

```bash
cd server
npm install

# .env Datei erstellen
cp .env.example .env

# .env mit deinen Supabase-Credentials ausfüllen:
# SUPABASE_URL=https://xxx.supabase.co
# SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_KEY=eyJ...

# Server starten
npm start
```

Der Server läuft jetzt auf `http://localhost:3000`

## 3. Client lokal starten

```bash
cd client
npm install

# .env Datei erstellen
cp .env.example .env

# Client starten
npm start
```

## 4. Ersten Admin-User erstellen

Standardmäßig sind alle neuen User normale User. Um einen Admin zu erstellen:

1. Registriere einen User über den Client
2. Gehe zu Supabase → "Table Editor" → "profiles"
3. Finde den User und ändere `role` von `user` zu `admin`
4. Logge dich im Client erneut ein

## 5. Server auf Railway deployen

### Railway Account erstellen

1. Gehe zu [railway.app](https://railway.app)
2. Erstelle einen Account (GitHub-Login empfohlen)

### Projekt deployen

```bash
# Railway CLI installieren
npm install -g @railway/cli

# Login
railway login

# In dein Projekt-Verzeichnis gehen
cd /pfad/zu/cli-chat

# Neues Railway-Projekt erstellen
railway init

# Environment Variables setzen
railway variables set SUPABASE_URL=https://xxx.supabase.co
railway variables set SUPABASE_ANON_KEY=eyJ...
railway variables set SUPABASE_SERVICE_KEY=eyJ...
railway variables set PORT=3000
railway variables set NODE_ENV=production
railway variables set CORS_ORIGIN=*

# Deploy
railway up
```

### Domain erhalten

1. Gehe zum Railway Dashboard
2. Klicke auf dein Projekt
3. Gehe zu "Settings" → "Domains"
4. Klicke "Generate Domain"
5. Du bekommst eine URL wie `xxx.railway.app`

### Client mit Railway-Server verbinden

```bash
cd client
# .env anpassen
echo "SERVER_URL=https://deine-app.railway.app" > .env
echo "SOCKET_URL=https://deine-app.railway.app" >> .env
```

## 6. Client als globales CLI-Tool installieren

```bash
cd client
npm install -g .

# Jetzt kannst du von überall aus chatten:
cli-chat
```

## Troubleshooting

### Server startet nicht

**Problem:** "Missing Supabase environment variables"
**Lösung:** Prüfe ob `.env` existiert und alle Werte korrekt sind

**Problem:** Port 3000 already in use
**Lösung:** Ändere `PORT` in `.env` zu einem anderen Wert (z.B. 3001)

### Client kann nicht verbinden

**Problem:** "Connection failed"
**Lösung:**
- Prüfe ob Server läuft
- Prüfe `SERVER_URL` in `client/.env`
- Prüfe Firewall-Einstellungen

### Login funktioniert nicht

**Problem:** "Invalid credentials"
**Lösung:**
- Registriere zuerst einen Account
- Prüfe Supabase Auth-Einstellungen

**Problem:** "Account banned"
**Lösung:**
- Gehe zu Supabase → "bans" Tabelle
- Lösche den Eintrag für deinen User

### Nachrichten werden nicht angezeigt

**Problem:** Keine Nachrichten sichtbar
**Lösung:**
- Prüfe Supabase RLS Policies (siehe `supabase-schema.sql`)
- Stelle sicher, dass du einem Raum beigetreten bist (`/join #general`)

### Railway Deployment schlägt fehl

**Problem:** Build error
**Lösung:**
- Prüfe `railway.json` Konfiguration
- Stelle sicher, dass alle Dependencies in `package.json` sind

**Problem:** App crasht nach Deploy
**Lösung:**
- Prüfe Environment Variables im Railway Dashboard
- Prüfe Logs: `railway logs`

## Nächste Schritte

- Erstelle mehr Chaträume über `/admin create-room #name`
- Lade Freunde ein zum Chatten
- Passe das UI an (siehe `client/src/ui/chat.js`)
- Aktiviere TLS/SSL für Production

## Kosten-Übersicht

**Entwicklung (lokal):**
- Supabase: Kostenlos (Free Tier)
- Alles andere: Lokal, keine Kosten

**Production (Railway):**
- Supabase: Kostenlos bis ~1000 Users
- Railway: ~$5-10/Monat (je nach Usage)
- **Total: ~$5-10/Monat**

Bei mehr als 1000 aktiven Usern:
- Supabase Pro: $25/Monat
- Railway: $10-20/Monat
- **Total: ~$35-45/Monat**
