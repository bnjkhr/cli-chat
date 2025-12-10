#!/bin/bash

# Client Setup Script
# Konfiguriert den Client für die Verbindung zum Production-Server

set -e

echo "🖥️  CLI-Chat Client Setup"
echo "========================="
echo ""

# Check ob im richtigen Verzeichnis
if [ ! -d "client" ]; then
    echo "❌ client/ Verzeichnis nicht gefunden!"
    echo "Bitte führe das Skript vom cli-chat/ Verzeichnis aus aus"
    exit 1
fi

cd client

# Server-URL abfragen
echo "Gib deine Railway Server-URL ein:"
echo "(z.B. https://cli-chat-production.railway.app)"
echo ""
read -p "SERVER_URL: " SERVER_URL

if [ -z "$SERVER_URL" ]; then
    echo "❌ SERVER_URL darf nicht leer sein!"
    exit 1
fi

# .env erstellen
echo ""
echo "Erstelle .env Datei..."

cat > .env <<EOF
# Production Server Configuration
SERVER_URL=$SERVER_URL
SOCKET_URL=$SERVER_URL
EOF

echo "✅ .env erstellt"
echo ""

# Dependencies installieren
echo "📦 Installiere Dependencies..."
npm install

echo ""
echo "✅ Setup abgeschlossen!"
echo ""
echo "Client starten:"
echo "  cd client && npm start"
echo ""
echo "Oder global installieren:"
echo "  cd client && npm install -g ."
echo "  cli-chat"
echo ""
