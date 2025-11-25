# 🖥️ CLI-Chat

Ein retro Terminal-Chat-System inspiriert von den 80er Jahren. Chatten Sie im Terminal mit anderen Usern, senden Sie private Nachrichten und erstellen Sie Chaträume.

## ✨ Features

- 🔐 **Authentifizierung**: Registrierung und Login
- 💬 **Öffentliche Chaträume**: Mehrere Räume für verschiedene Themen
- 📨 **Private Nachrichten**: Direkt mit anderen Usern chatten
- 👑 **Admin-Features**: Räume erstellen, User moderieren
- ⚡ **Echtzeit**: Nachrichten erscheinen sofort bei allen Usern
- 🎨 **Retro-UI**: Klassisches Terminal-Interface

## 🏗️ Technologie-Stack

**Backend:**
- Node.js + Express
- Socket.io (WebSockets)
- Supabase (PostgreSQL + Realtime + Auth)

**Frontend:**
- blessed (Terminal UI)
- Socket.io Client

## 📦 Installation

### 1. Repository klonen

```bash
git clone <repository-url>
cd cli-chat
```

### 2. Supabase-Projekt einrichten

1. Erstelle ein kostenloses Konto auf [supabase.com](https://supabase.com)
2. Erstelle ein neues Projekt
3. Gehe zum SQL Editor und führe `docs/supabase-schema.sql` aus
4. Gehe zu Settings → API und kopiere:
   - Project URL
   - anon/public key
   - service_role key

### 3. Server Setup

```bash
cd server
npm install
cp .env.example .env
# Füge deine Supabase-Credentials in .env ein
npm start
```

### 4. Client Setup

```bash
cd client
npm install
cp .env.example .env
# Server-URL eintragen (Standard: http://localhost:3000)
npm start
```

## 🚀 Deployment auf Railway

### Server deployen:

1. Installiere Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Neues Projekt: `railway init`
4. Environment Variables setzen:
   ```
   SUPABASE_URL=your-url
   SUPABASE_ANON_KEY=your-key
   SUPABASE_SERVICE_KEY=your-service-key
   PORT=3000
   NODE_ENV=production
   ```
5. Deploy: `railway up`

## 📖 Verwendung

### Login

Beim Start erscheint der Login-Screen:
```
Registrieren: Neuen Username + Passwort eingeben
Login: Bestehenden Account verwenden
```

### Chat Commands

```bash
/help                           # Alle Commands anzeigen
/join #room                     # Raum beitreten
/msg @username nachricht        # Private Nachricht senden
/rooms                          # Alle Räume auflisten
/users                          # User im aktuellen Raum
/quit                           # Chat beenden
```

### Admin Commands

```bash
/admin create-room #name "Beschreibung"
/admin ban @username "Grund"
/admin unban @username
/admin kick @username
```

## 🗂️ Projektstruktur

```
cli-chat/
├── server/              # Backend (Express + Socket.io)
│   ├── src/
│   │   ├── index.js
│   │   ├── config/      # Supabase Config
│   │   ├── handlers/    # WebSocket & API Handler
│   │   ├── middleware/  # Auth, Rate Limiting
│   │   └── utils/
│   └── package.json
│
├── client/              # Frontend (Terminal UI)
│   ├── src/
│   │   ├── index.js
│   │   ├── ui/          # blessed Components
│   │   ├── services/    # API & WebSocket Client
│   │   └── utils/
│   └── package.json
│
└── docs/
    └── supabase-schema.sql
```

## 🔐 Sicherheit

- Passwörter werden mit bcrypt gehasht (via Supabase Auth)
- JWT-Token für Session-Management
- Row Level Security (RLS) in Supabase
- Rate Limiting gegen Spam
- Input-Sanitization

## 🤝 Contributing

Pull Requests sind willkommen! Für größere Änderungen bitte zuerst ein Issue öffnen.

## 📝 Lizenz

MIT

## 🐛 Troubleshooting

**Server startet nicht:**
- Prüfe `.env` Datei
- Stelle sicher, dass Supabase-Credentials korrekt sind

**Client kann nicht verbinden:**
- Prüfe `SERVER_URL` in `client/.env`
- Stelle sicher, dass der Server läuft

**Keine Nachrichten sichtbar:**
- Prüfe Supabase RLS Policies
- Prüfe Browser-Konsole / Server-Logs

## 📚 Weitere Dokumentation

- [API-Dokumentation](docs/API.md)
- [Commands-Referenz](docs/COMMANDS.md)
