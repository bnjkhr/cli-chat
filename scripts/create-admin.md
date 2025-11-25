# Admin-User erstellen

Nach dem Deployment musst du manuell einen Admin-User in Supabase erstellen.

## Schritt-für-Schritt:

### 1. User registrieren

Starte den Client und registriere einen neuen Account:
```
Email: admin@example.com
Username: admin
Password: (sicheres Passwort)
```

### 2. User in Supabase finden

1. Gehe zu [supabase.com](https://supabase.com)
2. Öffne dein Projekt
3. Linke Sidebar: **Table Editor**
4. Wähle Tabelle: **profiles**
5. Suche nach deinem Username (`admin`)

### 3. Role ändern

1. Klicke in der `role` Spalte auf `user`
2. Ändere zu: `admin`
3. Drücke **Enter** zum Speichern

### 4. Neu einloggen

1. Beende den Client (Strg+C)
2. Starte den Client neu: `npm start` oder `cli-chat`
3. Logge dich ein

### 5. Admin-Rechte testen

```bash
/admin create-room #test Dies ist ein Test-Raum
```

Wenn du die Success-Message siehst, funktioniert es! ✅

## Mehrere Admins

Wiederhole Schritt 1-4 für jeden zusätzlichen Admin.

## Alternative: SQL-Befehl

Du kannst auch direkt in Supabase einen User zum Admin machen:

1. Supabase Dashboard → **SQL Editor**
2. Führe aus:

```sql
UPDATE profiles
SET role = 'admin'
WHERE username = 'admin';  -- Ersetze mit deinem Username
```

3. Klicke **Run**

## Troubleshooting

**"Admin privileges required" trotz role = admin:**
- Logge dich neu ein (Token muss neu geladen werden)
- Prüfe in Supabase ob role wirklich `admin` ist (nicht `Admin` oder `ADMIN`)

**User nicht in profiles Tabelle:**
- Prüfe ob Registrierung erfolgreich war
- Gehe zu Authentication → Users
- User sollte dort sein
- Wenn ja, aber nicht in profiles: Bug im Server-Code
