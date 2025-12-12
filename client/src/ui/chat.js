import blessed from 'blessed';
import socketService from '../services/socket.js';
import authService from '../services/auth.js';
import { parseCommand, getHelpText } from '../utils/commands.js';

/**
 * Main Chat Screen
 */
export function createChatScreen(screen, userData, token) {
  const { username, role } = userData.user;
  const userId = userData.user.id;
  let currentRoom = null;
  let currentDM = null; // { oderId, username } - aktive DM-Konversation
  let rooms = [];
  let messages = [];
  let onlineUsers = [];
  let dmConversations = []; // Liste der DM-Partner

  // ============================================
  // Layout
  // ============================================

  // Escape username in header to prevent tag injection
  const safeHeaderUsername = username.replace(/\{/g, '\\{').replace(/\}/g, '\\}');

  // Header
  const header = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    border: {
      type: 'line'
    },
    style: {
      border: { fg: 'cyan' },
      fg: 'white'
    },
    content: ` {bold}{cyan-fg}CLI-CHAT v1.0{/cyan-fg}{/bold}                    Connected: {green-fg}${safeHeaderUsername}${role === 'admin' ? ' [ADMIN]' : ''}{/green-fg}`,
    tags: true
  });

  // Sidebar - Rooms (top half)
  const sidebar = blessed.box({
    parent: screen,
    top: 3,
    left: 0,
    width: 30,
    height: '50%-3',
    border: {
      type: 'line'
    },
    style: {
      border: { fg: 'yellow' }
    },
    label: ' Rooms ',
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    tags: true
  });

  // Online Users Box (bottom half of sidebar)
  const onlineUsersBox = blessed.box({
    parent: screen,
    top: '50%',
    left: 0,
    width: 30,
    height: '50%-3',
    border: {
      type: 'line'
    },
    style: {
      border: { fg: 'magenta' }
    },
    label: ' Online ',
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    tags: true
  });

  // Message Window
  const messageWindow = blessed.box({
    parent: screen,
    top: 3,
    left: 30,
    width: '100%-30',
    height: '100%-6',
    border: {
      type: 'line'
    },
    style: {
      border: { fg: 'green' }
    },
    label: ' Messages ',
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    tags: true,
    scrollbar: {
      ch: ' ',
      style: {
        bg: 'blue'
      }
    }
  });

  // Input Box
  const inputBox = blessed.textbox({
    parent: screen,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    border: {
      type: 'line'
    },
    style: {
      border: { fg: 'magenta' },
      fg: 'white',
      bg: 'black'
    },
    inputOnFocus: true,
    keys: true,
    label: ' Message '
  });

  // ============================================
  // Helper Functions
  // ============================================

  /**
   * Escape blessed formatting tags in user content to prevent tag injection
   */
  function escapeBlessed(text) {
    if (!text) return '';
    return String(text)
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}');
  }

  function addMessage(msg, color = 'white', isDM = false) {
    const timestamp = new Date(msg.created_at || Date.now()).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let roleTag = '';
    if (msg.role === 'admin') {
      roleTag = '{red-fg}[ADMIN]{/red-fg} ';
    }

    // DM-Kennzeichnung
    const dmTag = isDM ? '{magenta-fg}[DM]{/magenta-fg} ' : '';

    // Escape user-provided content to prevent tag injection
    const safeUsername = escapeBlessed(msg.username);
    const safeContent = escapeBlessed(msg.content);

    const line = `{gray-fg}[${timestamp}]{/gray-fg} ${dmTag}${roleTag}{${color}-fg}${safeUsername}:{/${color}-fg} ${safeContent}`;
    messages.push(line);

    // Limit zu 1000 Nachrichten
    if (messages.length > 1000) {
      messages.shift();
    }

    renderMessages();
  }

  function addSystemMessage(text, color = 'yellow') {
    const timestamp = new Date().toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const line = `{gray-fg}[${timestamp}]{/gray-fg} {${color}-fg}*** ${text}{/${color}-fg}`;
    messages.push(line);
    renderMessages();
  }

  function renderMessages() {
    messageWindow.setContent(messages.join('\n'));
    messageWindow.setScrollPerc(100);
    screen.render();
  }

  function updateRoomsList() {
    let content = '';
    rooms.forEach(room => {
      const marker = currentRoom?.id === room.id ? '{green-fg}► {/green-fg}' : '  ';
      content += `${marker}#${escapeBlessed(room.name)}\n`;
    });
    sidebar.setContent(content);
    screen.render();
  }

  function updateOnlineUsersList() {
    let content = '';
    if (onlineUsers.length === 0) {
      content = '{gray-fg}No users online{/gray-fg}';
    } else {
      onlineUsers.forEach(user => {
        const roleIcon = user.role === 'admin' ? '{red-fg}★{/red-fg} ' : '';
        const isCurrentUser = user.username === username ? ' {green-fg}(you){/green-fg}' : '';
        const roomInfo = user.currentRoom ? ` {gray-fg}(#${escapeBlessed(user.currentRoom)}){/gray-fg}` : ' {gray-fg}(lobby){/gray-fg}';
        content += `${roleIcon}${escapeBlessed(user.username)}${roomInfo}${isCurrentUser}\n`;
      });
    }
    onlineUsersBox.setContent(content);
    screen.render();
  }

  // ============================================
  // Socket Event Handlers
  // ============================================

  function setupSocketListeners() {
    // Authenticated
    socketService.on('authenticated', (data) => {
      addSystemMessage(`Connected as ${escapeBlessed(data.username)}`, 'green');
      // Load rooms
      socketService.getRooms();
    });

    // Message received
    socketService.on('message', (msg) => {
      // DM erhalten oder gesendet
      if (msg.recipientId) {
        // Im DM-Modus: Zeige nur DMs mit dem aktuellen Partner
        if (currentDM) {
          const isFromPartner = msg.username === currentDM.username;
          const isToPartner = msg.recipientId === currentDM.oderId;
          if (isFromPartner || isToPartner) {
            addMessage(msg, 'magenta', true);
          }
        } else {
          // Im Room-Modus: Zeige DM-Benachrichtigung
          addSystemMessage(`New DM from ${escapeBlessed(msg.username)} - use /dm @${escapeBlessed(msg.username)} to open`, 'magenta');
        }
      }
      // Room-Nachricht (nur wenn im richtigen Raum und nicht im DM-Modus)
      else if (!currentDM && msg.roomId === currentRoom?.id) {
        addMessage(msg, 'cyan');
      }
    });

    // Message History
    socketService.on('message_history', (data) => {
      data.messages.forEach(msg => {
        addMessage(msg, 'white');
      });
    });

    // Rooms List
    socketService.on('rooms_list', (data) => {
      rooms = data.rooms;
      updateRoomsList();

      // Auto-join general room
      if (!currentRoom && rooms.length > 0) {
        const generalRoom = rooms.find(r => r.name === 'general');
        if (generalRoom) {
          socketService.joinRoom(generalRoom.id);
        }
      }
    });

    // Joined Room
    socketService.on('joined_room', (data) => {
      currentRoom = { id: data.roomId, name: data.roomName };
      messageWindow.setLabel(` #${escapeBlessed(data.roomName)} `);
      messages = [];
      addSystemMessage(`Joined #${escapeBlessed(data.roomName)}`, 'green');
      updateRoomsList();
      // Load all online users with room info
      socketService.getAllOnlineUsers();
    });

    // User Joined
    socketService.on('user_joined', (data) => {
      if (data.roomId === currentRoom?.id) {
        addSystemMessage(`${escapeBlessed(data.username)} joined the room`, 'yellow');
      }
      // Refresh online users list
      socketService.getAllOnlineUsers();
    });

    // User Left
    socketService.on('user_left', (data) => {
      if (data.roomId === currentRoom?.id) {
        addSystemMessage(`${escapeBlessed(data.username)} left the room`, 'yellow');
      }
      // Refresh online users list
      socketService.getAllOnlineUsers();
    });

    // Users List (for current room - legacy)
    socketService.on('users_list', (data) => {
      onlineUsers = data.users || [];
      updateOnlineUsersList();
    });

    // All Online Users (with room info)
    socketService.on('all_online_users', (data) => {
      onlineUsers = data.users || [];
      updateOnlineUsersList();
    });

    // Room Created
    socketService.on('room_created', (data) => {
      addSystemMessage(`New room created: #${escapeBlessed(data.room.name)}`, 'green');
      socketService.getRooms();
    });

    // Room Deleted
    socketService.on('room_deleted', (data) => {
      addSystemMessage(`Room #${escapeBlessed(data.roomName)} has been deleted`, 'red');
      if (currentRoom?.id === data.roomId) {
        currentRoom = null;
        messages = [];
      }
      socketService.getRooms();
    });

    // Error
    socketService.on('error', (data) => {
      addSystemMessage(`ERROR: ${escapeBlessed(data.message)}`, 'red');
    });

    // Success
    socketService.on('success', (data) => {
      addSystemMessage(escapeBlessed(data.message), 'green');
    });

    // Kicked
    socketService.on('kicked', (data) => {
      addSystemMessage(`You have been kicked by ${escapeBlessed(data.by)}. Reason: ${escapeBlessed(data.reason)}`, 'red');
      setTimeout(() => process.exit(0), 3000);
    });

    // Banned
    socketService.on('banned', (data) => {
      addSystemMessage(`You have been banned by ${escapeBlessed(data.by)}. Reason: ${escapeBlessed(data.reason)}`, 'red');
      setTimeout(() => process.exit(0), 3000);
    });

    // Disconnect
    socketService.on('disconnect', () => {
      addSystemMessage('Disconnected from server', 'red');
    });

    // User Online (global)
    socketService.on('user_online', (data) => {
      addSystemMessage(`${escapeBlessed(data.username)} is now online`, 'green');
      // Refresh online users list
      socketService.getAllOnlineUsers();
    });

    // User Offline (global)
    socketService.on('user_offline', (data) => {
      addSystemMessage(`${escapeBlessed(data.username)} went offline`, 'gray');
      // Refresh online users list
      socketService.getAllOnlineUsers();
    });

    // DM Conversations Liste
    socketService.on('dm_conversations', (data) => {
      dmConversations = data.conversations || [];
      let list = '\n{magenta-fg}DM Conversations:{/magenta-fg}\n';
      if (dmConversations.length === 0) {
        list += '  {gray-fg}No conversations yet{/gray-fg}\n';
      } else {
        dmConversations.forEach(conv => {
          list += `  @${escapeBlessed(conv.username)}\n`;
        });
      }
      list += '\n{gray-fg}Use /dm @username to open a conversation{/gray-fg}';
      messages.push(list);
      renderMessages();
    });

    // DM History
    socketService.on('dm_history', (data) => {
      currentDM = { oderId: data.oderId, username: data.partnerUsername };
      messages = [];
      messageWindow.setLabel(` DM: @${escapeBlessed(data.partnerUsername)} `);
      addSystemMessage(`Conversation with @${escapeBlessed(data.partnerUsername)}`, 'magenta');
      data.messages.forEach(msg => {
        addMessage(msg, 'magenta', true);
      });
      addSystemMessage('Type /back to return to room chat', 'gray');
    });
  }

  // ============================================
  // Command Handling
  // ============================================

  function handleCommand(cmd) {
    switch (cmd.type) {
      case 'message':
        // Im DM-Modus: Sende an DM-Partner
        if (currentDM) {
          socketService.sendDM(currentDM.oderId, cmd.content);
        }
        // Im Room-Modus: Sende an Raum
        else if (currentRoom) {
          socketService.sendMessage(currentRoom.id, cmd.content);
        } else {
          addSystemMessage('You are not in a room. Use /join #roomname', 'red');
        }
        break;

      case 'help':
        messages.push(getHelpText());
        renderMessages();
        break;

      case 'join':
        const room = rooms.find(r => r.name === cmd.roomName);
        if (room) {
          if (currentRoom) {
            socketService.leaveRoom(currentRoom.id);
          }
          socketService.joinRoom(room.id);
        } else {
          addSystemMessage(`Room #${cmd.roomName} not found. Use /rooms to list all rooms.`, 'red');
        }
        break;

      case 'rooms':
        let roomsList = '\n{cyan-fg}Available Rooms:{/cyan-fg}\n';
        rooms.forEach(r => {
          roomsList += `  #${escapeBlessed(r.name)} - ${escapeBlessed(r.description || 'No description')}\n`;
        });
        messages.push(roomsList);
        renderMessages();
        break;

      case 'users':
        socketService.getUsers();
        break;

      case 'quit':
        socketService.disconnect();
        process.exit(0);
        break;

      case 'admin:create_room':
        socketService.adminCreateRoom(cmd.roomName, cmd.description);
        break;

      case 'admin:ban':
        socketService.adminBanUser(cmd.username, cmd.reason);
        break;

      case 'admin:unban':
        socketService.adminUnbanUser(cmd.username);
        break;

      case 'admin:kick':
        socketService.adminKickUser(cmd.username, cmd.reason);
        break;

      case 'admin:delete_room':
        const deleteRoom = rooms.find(r => r.name === cmd.roomName);
        if (deleteRoom) {
          socketService.adminDeleteRoom(deleteRoom.id);
        } else {
          addSystemMessage(`Room #${cmd.roomName} not found`, 'red');
        }
        break;

      case 'dm':
        (async () => {
          addSystemMessage(`Sending DM to ${escapeBlessed(cmd.recipient)}...`, 'gray');
          const recipientId = await socketService.resolveUser(cmd.recipient);
          if (recipientId) {
            socketService.sendDM(recipientId, cmd.message);
          } else {
            addSystemMessage(`User "${escapeBlessed(cmd.recipient)}" not found`, 'red');
          }
        })();
        break;

      case 'open_dm':
        (async () => {
          addSystemMessage(`Opening conversation with @${escapeBlessed(cmd.recipient)}...`, 'gray');
          const oderId = await socketService.resolveUser(cmd.recipient);
          if (oderId) {
            socketService.getDMHistory(oderId);
          } else {
            addSystemMessage(`User "${escapeBlessed(cmd.recipient)}" not found`, 'red');
          }
        })();
        break;

      case 'dms':
        socketService.getDMConversations();
        break;

      case 'back':
        if (currentDM) {
          currentDM = null;
          messages = [];
          if (currentRoom) {
            messageWindow.setLabel(` #${escapeBlessed(currentRoom.name)} `);
            addSystemMessage(`Back to #${escapeBlessed(currentRoom.name)}`, 'green');
            socketService.joinRoom(currentRoom.id); // Lade Room-History neu
          } else {
            messageWindow.setLabel(' Messages ');
            addSystemMessage('Left DM mode. Join a room with /join #roomname', 'yellow');
          }
        } else {
          addSystemMessage('You are not in a DM conversation', 'yellow');
        }
        break;

      case 'error':
        addSystemMessage(cmd.message, 'red');
        break;
    }
  }

  // ============================================
  // Input Handling
  // ============================================

  inputBox.on('submit', (value) => {
    const input = value.trim();
    inputBox.clearValue();

    if (input) {
      const cmd = parseCommand(input);
      handleCommand(cmd);
    }

    inputBox.focus();
  });

  // ============================================
  // Key Bindings
  // ============================================

  screen.key(['C-c'], () => {
    socketService.disconnect();
    process.exit(0);
  });

  screen.key(['escape'], () => {
    inputBox.focus();
  });

  // ============================================
  // Initialize
  // ============================================

  async function initialize() {
    try {
      addSystemMessage('Connecting to server...', 'yellow');
      setupSocketListeners(); // Set up listeners BEFORE connecting
      await socketService.connect(token);

      // Token-Refresh-Callback registrieren
      authService.onTokenRefresh(async (newToken) => {
        addSystemMessage('Session refreshed', 'gray');
        // Update Socket.IO auth für zukünftige Reconnections
        socketService.updateToken(newToken);
      });

      inputBox.focus();
    } catch (error) {
      addSystemMessage(`Connection failed: ${error.message}`, 'red');
      setTimeout(() => process.exit(1), 3000);
    }
  }

  initialize();

  return { header, sidebar, onlineUsersBox, messageWindow, inputBox };
}
