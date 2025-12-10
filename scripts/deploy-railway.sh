#!/bin/bash

# Railway Deployment Script für CLI-Chat
# Verwendung: ./scripts/deploy-railway.sh

set -e

echo "🚀 CLI-Chat Railway Deployment"
echo "================================"
echo ""

# Check ob Railway CLI installiert ist
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI nicht gefunden!"
    echo ""
    echo "Installation:"
    echo "  npm install -g @railway/cli"
    echo ""
    exit 1
fi

# Check ob im richtigen Verzeichnis
if [ ! -f "railway.json" ]; then
    echo "❌ Nicht im Projekt-Root-Verzeichnis!"
    echo "Bitte führe das Skript vom cli-chat/ Verzeichnis aus aus"
    exit 1
fi

echo "✅ Railway CLI gefunden"
echo ""

# Login Check
echo "Prüfe Railway Login..."
if ! railway whoami &> /dev/null; then
    echo "⚠️  Nicht eingeloggt. Login wird gestartet..."
    railway login
else
    echo "✅ Bereits eingeloggt bei Railway"
fi
echo ""

# Environment Variables prüfen
echo "📋 Environment Variables Checklist:"
echo ""
echo "Hast du folgende Werte parat?"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_KEY"
echo ""
read -p "Weiter? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Abgebrochen. Besorge dir zuerst die Supabase-Credentials."
    exit 1
fi

# Environment Variables setzen
echo ""
echo "🔧 Environment Variables konfigurieren..."
echo ""

read -p "SUPABASE_URL (https://xxx.supabase.co): " SUPABASE_URL
read -p "SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
read -sp "SUPABASE_SERVICE_KEY: " SUPABASE_SERVICE_KEY
echo ""

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "❌ Alle Werte müssen ausgefüllt sein!"
    exit 1
fi

# Variables setzen
railway variables set SUPABASE_URL="$SUPABASE_URL"
railway variables set SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
railway variables set SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY"
railway variables set PORT=3000
railway variables set NODE_ENV=production
railway variables set CORS_ORIGIN="*"

echo ""
echo "✅ Environment Variables gesetzt"
echo ""

# Deploy
echo "🚢 Starte Deployment..."
echo ""

railway up

echo ""
echo "✅ Deployment abgeschlossen!"
echo ""
echo "📡 Nächste Schritte:"
echo "  1. Gehe zum Railway Dashboard"
echo "  2. Settings → Networking → Generate Domain"
echo "  3. Kopiere die URL"
echo "  4. Update client/.env mit der URL"
echo ""
echo "Deployment-Logs anschauen:"
echo "  railway logs"
echo ""
