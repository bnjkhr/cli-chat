# CLI-Chat Client

A beautiful terminal-based chat application with real-time messaging, multiple chat rooms, and admin controls.

## Features

- 🚀 Real-time messaging with Socket.io
- 💬 Multiple chat rooms
- 👥 User presence tracking
- 🔒 Secure authentication with Supabase
- 🎨 Beautiful terminal UI with blessed
- 📱 Direct messages (DMs)
- 👑 Admin commands (ban, kick, room management)
- ⌨️ Intuitive keyboard shortcuts

## Installation

Install globally using npm:

```bash
npm install -g @bnjkhr/cli-chat-client
```

## Usage

Simply run the command:

```bash
cli-chat
```

On first launch, you'll see the login screen where you can register a new account or log in with existing credentials.

### Registration

1. Press `Tab` to switch to registration mode
2. Enter your email, username, and password
3. Confirm your email (check your inbox)
4. Log in with your credentials

### Logging In

1. Enter your email and password
2. Press `Enter` to submit

## Commands

Once logged in, you can use the following commands:

### General Commands

- `/help` - Show all available commands
- `/join #room` - Join a chat room
- `/rooms` - List all available rooms
- `/users` - List users in current room
- `/msg @username message` - Send a private message
- `/quit` or `/exit` - Exit the chat

### Admin Commands

(Only available for admin users)

- `/admin create-room <name> [description]` - Create a new chat room
- `/admin ban <username> [reason]` - Ban a user
- `/admin unban <username>` - Unban a user
- `/admin kick <username> [reason]` - Kick a user (temporary)
- `/admin delete-room` - Delete the current room

## Keyboard Shortcuts

- `Ctrl+C` - Exit the application
- `Enter` - Send message / Submit form
- `Tab` - Switch between login and registration mode
- `Up/Down` - Navigate through chat history

## Requirements

- Node.js 16 or higher
- Active internet connection
- Valid email address for registration

## Technology Stack

- [blessed](https://github.com/chjj/blessed) - Terminal UI framework
- [Socket.io](https://socket.io/) - Real-time communication
- [Supabase](https://supabase.com/) - Authentication and database
- [Axios](https://axios-http.com/) - HTTP client

## Support

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/bnjkhr/cli-chat/issues).

## License

MIT © bnjkhr
