import { supabaseAdmin } from '../config/supabase.js';
import logger from '../utils/logger.js';

/**
 * Handler: Nachricht senden (Room oder DM)
 */
export async function handleSendMessage(io, socket, data) {
  if (!data) {
    return socket.emit('error', { message: 'Invalid message data' });
  }

  const { roomId, recipientId, content } = data;
  const userId = socket.userId;
  const username = socket.username;

  // Validation
  if (!content || content.trim().length === 0) {
    return socket.emit('error', { message: 'Message cannot be empty' });
  }

  if (content.length > 2000) {
    return socket.emit('error', { message: 'Message too long (max 2000 characters)' });
  }

  // Entweder roomId ODER recipientId
  if ((roomId && recipientId) || (!roomId && !recipientId)) {
    return socket.emit('error', { message: 'Specify either roomId or recipientId' });
  }

  try {
    // Check ob User gebannt ist
    const { data: ban } = await supabaseAdmin
      .from('bans')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (ban) {
      return socket.emit('error', { message: 'You are banned from chatting' });
    }

    // Nachricht in DB speichern
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        user_id: userId,
        room_id: roomId || null,
        recipient_id: recipientId || null,
        content: content.trim()
      })
      .select(`
        id,
        content,
        created_at,
        user:profiles!user_id(username, role)
      `)
      .single();

    if (error) {
      logger.error('Error saving message:', error);
      return socket.emit('error', { message: 'Failed to send message' });
    }

    // Format message für Client
    const formattedMessage = {
      id: message.id,
      content: message.content,
      username: message.user.username,
      role: message.user.role,
      created_at: message.created_at,
      roomId,
      recipientId
    };

    // Nachricht broadcasten
    if (roomId) {
      // Room-Nachricht: An alle im Raum
      io.to(`room:${roomId}`).emit('message', formattedMessage);
      logger.debug(`Message sent to room ${roomId} by ${username}`);
    } else {
      // Private Nachricht: An Sender und Empfänger
      socket.emit('message', formattedMessage);
      io.to(`user:${recipientId}`).emit('message', formattedMessage);
      logger.debug(`DM sent from ${username} to user ${recipientId}`);
    }
  } catch (error) {
    logger.error('Send message error:', error);
    socket.emit('error', { message: 'Failed to send message' });
  }
}

/**
 * Handler: Raum beitreten
 */
export async function handleJoinRoom(io, socket, data) {
  if (!data) {
    return socket.emit('error', { message: 'Invalid room data' });
  }

  const { roomId } = data;
  const username = socket.username;

  try {
    // Check ob Raum existiert
    const { data: room, error } = await supabaseAdmin
      .from('rooms')
      .select('id, name, description')
      .eq('id', roomId)
      .maybeSingle();

    if (error || !room) {
      return socket.emit('error', { message: 'Room not found' });
    }

    // Socket.io Raum beitreten
    socket.join(`room:${roomId}`);
    socket.currentRoom = roomId;

    logger.info(`${username} joined room: ${room.name}`);

    // Bestätigung an Client
    socket.emit('joined_room', {
      roomId: room.id,
      roomName: room.name,
      description: room.description
    });

    // Info an andere im Raum
    socket.to(`room:${roomId}`).emit('user_joined', {
      username,
      roomId
    });

    // Lade letzte 50 Nachrichten des Raums
    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        user:profiles!user_id(username, role)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (messages) {
      // Reverse für chronologische Reihenfolge
      const formattedMessages = messages.reverse().map(msg => ({
        id: msg.id,
        content: msg.content,
        username: msg.user.username,
        role: msg.user.role,
        created_at: msg.created_at,
        roomId
      }));

      socket.emit('message_history', { roomId, messages: formattedMessages });
    }
  } catch (error) {
    logger.error('Join room error:', error);
    socket.emit('error', { message: 'Failed to join room' });
  }
}

/**
 * Handler: Raum verlassen
 */
export async function handleLeaveRoom(socket, data) {
  if (!data) {
    return socket.emit('error', { message: 'Invalid room data' });
  }

  const { roomId } = data;
  const username = socket.username;

  socket.leave(`room:${roomId}`);
  socket.currentRoom = null;

  logger.debug(`${username} left room ${roomId}`);

  // Info an andere im Raum
  socket.to(`room:${roomId}`).emit('user_left', {
    username,
    roomId
  });

  socket.emit('left_room', { roomId });
}

/**
 * Handler: Alle Räume auflisten
 */
export async function handleGetRooms(socket) {
  try {
    const { data: rooms, error } = await supabaseAdmin
      .from('rooms')
      .select('id, name, description, created_at')
      .order('name', { ascending: true });

    if (error) throw error;

    socket.emit('rooms_list', { rooms });
  } catch (error) {
    logger.error('Get rooms error:', error);
    socket.emit('error', { message: 'Failed to fetch rooms' });
  }
}

/**
 * Handler: User in aktuellem Raum auflisten
 */
export async function handleGetUsers(io, socket) {
  const roomId = socket.currentRoom;

  if (!roomId) {
    return socket.emit('error', { message: 'You are not in a room' });
  }

  try {
    // Alle Sockets im Raum finden
    const socketsInRoom = await io.in(`room:${roomId}`).fetchSockets();
    const users = socketsInRoom.map(s => ({
      username: s.username,
      role: s.role
    }));

    socket.emit('users_list', { roomId, users });
  } catch (error) {
    logger.error('Get users error:', error);
    socket.emit('error', { message: 'Failed to fetch users' });
  }
}
