/**
 * Command Parser für Chat-Commands
 */

export function parseCommand(input) {
  if (!input.startsWith('/')) {
    return { type: 'message', content: input };
  }

  const parts = input.slice(1).split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (command) {
    case 'help':
      return { type: 'help' };

    case 'quit':
    case 'exit':
      return { type: 'quit' };

    case 'join':
      if (args.length === 0) {
        return { type: 'error', message: 'Usage: /join #roomname' };
      }
      const roomName = args[0].replace('#', '');
      return { type: 'join', roomName };

    case 'rooms':
      return { type: 'rooms' };

    case 'users':
      return { type: 'users' };

    case 'msg':
    case 'dm':
      if (args.length < 2) {
        return { type: 'error', message: 'Usage: /msg @username message' };
      }
      const recipient = args[0].replace('@', '');
      const message = args.slice(1).join(' ');
      return { type: 'dm', recipient, message };

    case 'admin':
      return parseAdminCommand(args);

    default:
      return { type: 'error', message: `Unknown command: /${command}. Type /help for available commands.` };
  }
}

function parseAdminCommand(args) {
  if (args.length === 0) {
    return { type: 'error', message: 'Usage: /admin <subcommand>. Available: create-room, ban, unban, kick, delete-room' };
  }

  const subcommand = args[0].toLowerCase();
  const subargs = args.slice(1);

  switch (subcommand) {
    case 'create-room':
      if (subargs.length === 0) {
        return { type: 'error', message: 'Usage: /admin create-room #roomname [description]' };
      }
      const roomName = subargs[0].replace('#', '');
      const description = subargs.slice(1).join(' ') || null;
      return { type: 'admin:create_room', roomName, description };

    case 'ban':
      if (subargs.length < 1) {
        return { type: 'error', message: 'Usage: /admin ban @username [reason]' };
      }
      const banUsername = subargs[0].replace('@', '');
      const banReason = subargs.slice(1).join(' ') || null;
      return { type: 'admin:ban', username: banUsername, reason: banReason };

    case 'unban':
      if (subargs.length === 0) {
        return { type: 'error', message: 'Usage: /admin unban @username' };
      }
      const unbanUsername = subargs[0].replace('@', '');
      return { type: 'admin:unban', username: unbanUsername };

    case 'kick':
      if (subargs.length < 1) {
        return { type: 'error', message: 'Usage: /admin kick @username [reason]' };
      }
      const kickUsername = subargs[0].replace('@', '');
      const kickReason = subargs.slice(1).join(' ') || null;
      return { type: 'admin:kick', username: kickUsername, reason: kickReason };

    case 'delete-room':
      if (subargs.length === 0) {
        return { type: 'error', message: 'Usage: /admin delete-room #roomname' };
      }
      const deleteRoomName = subargs[0].replace('#', '');
      return { type: 'admin:delete_room', roomName: deleteRoomName };

    default:
      return { type: 'error', message: `Unknown admin command: ${subcommand}` };
  }
}

/**
 * Hilfetext für Commands
 */
export function getHelpText() {
  return `
╔════════════════════════════════════════════════════════════╗
║                     CLI-CHAT COMMANDS                      ║
╠════════════════════════════════════════════════════════════╣
║  General Commands:                                         ║
║  /help                      - Show this help               ║
║  /join #room                - Join a chat room             ║
║  /rooms                     - List all rooms               ║
║  /users                     - List users in current room   ║
║  /msg @username text        - Send private message         ║
║  /quit                      - Exit the chat                ║
║                                                            ║
║  Admin Commands:                                           ║
║  /admin create-room #name [desc]  - Create new room        ║
║  /admin ban @user [reason]        - Ban user               ║
║  /admin unban @user               - Unban user             ║
║  /admin kick @user [reason]       - Kick user              ║
║  /admin delete-room #name         - Delete room            ║
╚════════════════════════════════════════════════════════════╝
  `.trim();
}
