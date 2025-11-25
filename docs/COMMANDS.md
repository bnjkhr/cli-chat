# Chat Commands Referenz

## Allgemeine Commands

### /help

Zeigt alle verfügbaren Commands.

```
/help
```

### /join

Tritt einem Chatraum bei.

```
/join #general
/join #dev
```

**Hinweis:** Du kannst nur in einem Raum gleichzeitig sein.

### /rooms

Listet alle verfügbaren Chaträume auf.

```
/rooms
```

**Output:**
```
Available Rooms:
  #general - Allgemeiner Chatraum
  #random - Random Talk
  #dev - Developer Chat
```

### /users

Zeigt alle User im aktuellen Raum.

```
/users
```

**Hinweis:** Du musst in einem Raum sein.

### /msg oder /dm

Sendet eine private Nachricht an einen User.

```
/msg @username Hallo, wie geht's?
/dm @alice Hey Alice!
```

**Hinweis:** Private Nachrichten sind nur zwischen Sender und Empfänger sichtbar.

### /quit oder /exit

Beendet den Chat.

```
/quit
/exit
```

---

## Admin Commands

**Hinweis:** Diese Commands funktionieren nur für User mit Admin-Rolle.

### /admin create-room

Erstellt einen neuen Chatraum.

```
/admin create-room #newroom
/admin create-room #gaming Gaming und Spiele
```

**Format:**
```
/admin create-room #roomname [description]
```

**Beispiele:**
```
/admin create-room #music
/admin create-room #offtopic Alles außer Chat
/admin create-room #support-deutsch Deutscher Support-Raum
```

### /admin ban

Bannt einen User permanent. Der User wird sofort disconnected und kann sich nicht mehr einloggen.

```
/admin ban @spammer Spamming
/admin ban @troll Beleidigung
```

**Format:**
```
/admin ban @username [reason]
```

**Hinweis:**
- Gebannte User können den Chat nicht mehr betreten
- Um den Ban aufzuheben, verwende `/admin unban`
- Admins können nicht gebannt werden

### /admin unban

Entfernt einen Ban.

```
/admin unban @username
```

**Format:**
```
/admin unban @username
```

### /admin kick

Kickt einen User temporär aus dem Chat. Der User wird disconnected, kann sich aber wieder einloggen.

```
/admin kick @username
/admin kick @spammer Zu viele Nachrichten
```

**Format:**
```
/admin kick @username [reason]
```

**Hinweis:**
- Kick ist temporär (User kann sich wieder einloggen)
- Für permanenten Ban verwende `/admin ban`
- Admins können nicht gekickt werden

### /admin delete-room

Löscht einen Chatraum permanent.

```
/admin delete-room #oldroom
```

**Format:**
```
/admin delete-room #roomname
```

**Hinweis:**
- Alle Nachrichten im Raum werden ebenfalls gelöscht
- User im Raum werden automatisch disconnected
- Diese Aktion kann nicht rückgängig gemacht werden

---

## Command-Beispiele

### Typischer Chat-Flow

```bash
# 1. Login
[Login Screen]

# 2. Hilfe anzeigen
/help

# 3. Räume anzeigen
/rooms

# 4. Raum beitreten
/join #general

# 5. Nachricht senden
Hallo zusammen!

# 6. User anzeigen
/users

# 7. Private Nachricht
/msg @alice Hey, hast du mal 5 Minuten?

# 8. Raum wechseln
/join #dev

# 9. Beenden
/quit
```

### Admin-Workflow

```bash
# 1. Neuen Raum erstellen
/admin create-room #announcements Wichtige Ankündigungen

# 2. User moderieren
/admin kick @spammer Zu viele Nachrichten in kurzer Zeit

# 3. Bei wiederholtem Verstoß: Ban
/admin ban @spammer Wiederholtes Spamming nach Kick

# 4. Ban aufheben (wenn gerechtfertigt)
/admin unban @spammer

# 5. Ungenutzten Raum löschen
/admin delete-room #oldroom
```

---

## Tastenkombinationen

| Taste/Kombination | Aktion                      |
|-------------------|-----------------------------|
| Enter             | Nachricht/Command absenden  |
| Escape            | Zurück zum Input-Feld       |
| Ctrl+C            | Chat beenden                |
| Tab               | (Login: Mode wechseln)      |

---

## Tipps & Tricks

### Schnell zwischen Räumen wechseln

Du musst nicht `/leave` verwenden. Einfach `/join #neuerraum` - der alte Raum wird automatisch verlassen.

### Private Nachrichten organisieren

Verwende ein konsistentes Format für DMs:
```
/msg @alice [Projekt] Status-Update benötigt
/msg @bob [Bug] Hast du den Fix deployed?
```

### Commands Case-Insensitive

Commands sind nicht case-sensitive:
```
/JOIN #general   ✓
/join #GENERAL   ✓
/JoIn #GeNeRaL   ✓
```

### Mehrere Räume im Blick behalten

Leider kannst du nur in einem Raum gleichzeitig sein. Für mehrere Räume:
- Öffne mehrere Terminal-Fenster
- Oder wechsle häufig mit `/join`

### Admin werden

1. Registriere einen Account
2. Bitte den Datenbank-Admin (Supabase), deine `role` auf `admin` zu setzen
3. Logge dich erneut ein
4. Jetzt hast du Admin-Commands

---

## Fehler-Nachrichten

| Nachricht                          | Bedeutung                               | Lösung                          |
|------------------------------------|------------------------------------------|----------------------------------|
| "You are not in a room"            | Du hast keinen Raum betreten             | `/join #roomname`                |
| "Room not found"                   | Raum existiert nicht                     | `/rooms` um alle Räume zu sehen |
| "User not found"                   | Username existiert nicht                 | Prüfe Schreibweise               |
| "Admin privileges required"        | Du bist kein Admin                       | Command nur für Admins           |
| "Message cannot be empty"          | Leere Nachricht gesendet                 | Schreibe eine Nachricht          |
| "Message too long"                 | Nachricht über 2000 Zeichen              | Kürze die Nachricht              |
| "You are banned from chatting"     | Du bist gebannt                          | Kontaktiere einen Admin          |
| "Cannot ban/kick admin users"      | Admins können nicht moderiert werden     | -                                |
| "Username already taken"           | Username existiert bereits               | Wähle einen anderen Namen        |
| "Connection failed"                | Server nicht erreichbar                  | Prüfe Server-URL und Verbindung  |

---

## FAQ

**Q: Wie viele Nachrichten werden im Verlauf angezeigt?**
A: Die letzten 50 Nachrichten eines Raums werden beim Beitreten geladen.

**Q: Werden private Nachrichten gespeichert?**
A: Ja, in der Datenbank. Sie sind nur für Sender und Empfänger sichtbar.

**Q: Kann ich einen Command rückgängig machen?**
A: Nein, aber `/admin unban` hebt einen Ban auf, und gelöschte Räume können neu erstellt werden.

**Q: Gibt es eine Nachrichtenlimit?**
A: Ja, 2000 Zeichen pro Nachricht.

**Q: Kann ich Emojis verwenden?**
A: Ja! Terminal muss Unicode unterstützen. 🎉💬🚀

**Q: Wie sehe ich wer online ist?**
A: `/users` zeigt alle User im aktuellen Raum.
