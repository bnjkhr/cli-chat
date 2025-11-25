import blessed from 'blessed';
import socketService from '../services/socket.js';
import { parseCommand, getHelpText } from '../utils/commands.js';

/**
 * Main Chat Screen
 */
export function createChatScreen(screen, userData, token) {
  const { username, role } = userData.user;
  let currentRoom = null;
  let rooms = [];
  let messages = [];

  // ============================================
  // Layout
  // ============================================

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
    content: ` {bold}{cyan-fg}CLI-CHAT v1.0{/cyan-fg}{/bold}                    Connected: {green-fg}${username}${role === 'admin' ? ' [ADMIN]' : ''}{/green-fg}`,
    tags: true
  });

  // Sidebar (Rooms & Users)
  const sidebar = blessed.box({
    parent: screen,
    top: 3,
    left: 0,
    width: 20,
    height: '100%-6',
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
    vi: true
  });

  // Message Window
  const messageWindow = blessed.box({
    parent: screen,
    top: 3,
    left: 20,
    width: '100%-20',
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

  function addMessage(msg, color = 'white') {
    const timestamp = new Date(msg.created_at || Date.now()).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let roleTag = '';
    if (msg.role === 'admin') {
      roleTag = '{red-fg}[ADMIN]{/red-fg} ';
    }

    const line = `{gray-fg}[${timestamp}]{/gray-fg} ${roleTag}{${color}-fg}${msg.username}:{/${color}-fg} ${msg.content}`;
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
      content += `${marker}#${room.name}\n`;
    });
    sidebar.setContent(content);
    screen.render();
  }

  // ============================================
  // Socket Event Handlers
  // ============================================

  function setupSocketListeners() {
    // Authenticated
    socketService.on('authenticated', (data) => {
      addSystemMessage(`Connected as ${data.username}`, 'green');
      // Load rooms
      socketService.getRooms();
    });

    // Message received
    socketService.on('message', (msg) => {
      if (msg.roomId === currentRoom?.id || msg.recipientId === userData.user.id) {
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
      messageWindow.setLabel(` #${data.roomName} `);
      messages = [];
      addSystemMessage(`Joined #${data.roomName}`, 'green');
      updateRoomsList();
    });

    // User Joined
    socketService.on('user_joined', (data) => {
      if (data.roomId === currentRoom?.id) {
        addSystemMessage(`${data.username} joined the room`, 'yellow');
      }
    });

    // User Left
    socketService.on('user_left', (data) => {
      if (data.roomId === currentRoom?.id) {
        addSystemMessage(`${data.username} left the room`, 'yellow');
      }
    });

    // Room Created
    socketService.on('room_created', (data) => {
      addSystemMessage(`New room created: #${data.room.name}`, 'green');
      socketService.getRooms();
    });

    // Room Deleted
    socketService.on('room_deleted', (data) => {
      addSystemMessage(`Room #${data.roomName} has been deleted`, 'red');
      if (currentRoom?.id === data.roomId) {
        currentRoom = null;
        messages = [];
      }
      socketService.getRooms();
    });

    // Error
    socketService.on('error', (data) => {
      addSystemMessage(`ERROR: ${data.message}`, 'red');
    });

    // Success
    socketService.on('success', (data) => {
      addSystemMessage(data.message, 'green');
    });

    // Kicked
    socketService.on('kicked', (data) => {
      addSystemMessage(`You have been kicked by ${data.by}. Reason: ${data.reason}`, 'red');
      setTimeout(() => process.exit(0), 3000);
    });

    // Banned
    socketService.on('banned', (data) => {
      addSystemMessage(`You have been banned by ${data.by}. Reason: ${data.reason}`, 'red');
      setTimeout(() => process.exit(0), 3000);
    });

    // Disconnect
    socketService.on('disconnect', () => {
      addSystemMessage('Disconnected from server', 'red');
    });
  }

  // ============================================
  // Command Handling
  // ============================================

  function handleCommand(cmd) {
    switch (cmd.type) {
      case 'message':
        if (currentRoom) {
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
          roomsList += `  #${r.name} - ${r.description || 'No description'}\n`;
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
      await socketService.connect(token);
      setupSocketListeners();
      inputBox.focus();
    } catch (error) {
      addSystemMessage(`Connection failed: ${error.message}`, 'red');
      setTimeout(() => process.exit(1), 3000);
    }
  }

  initialize();

  return { header, sidebar, messageWindow, inputBox };
}
