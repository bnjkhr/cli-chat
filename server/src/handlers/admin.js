import { supabaseAdmin } from '../config/supabase.js';
import logger from '../utils/logger.js';

/**
 * Helper: Check ob User Admin ist
 */
function isAdmin(socket) {
  return socket.role === 'admin';
}

/**
 * Admin: Raum erstellen
 */
export async function handleCreateRoom(socket, data) {
  if (!isAdmin(socket)) {
    return socket.emit('error', { message: 'Admin privileges required' });
  }

  const { name, description } = data;
  const userId = socket.userId;

  // Validation
  if (!name || name.trim().length === 0) {
    return socket.emit('error', { message: 'Room name required' });
  }

  if (name.length > 30) {
    return socket.emit('error', { message: 'Room name too long (max 30 characters)' });
  }

  // Name nur alphanumerisch + underscore/hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return socket.emit('error', { message: 'Room name can only contain letters, numbers, _ and -' });
  }

  try {
    const { data: room, error } = await supabaseAdmin
      .from('rooms')
      .insert({
        name: name.trim().toLowerCase(),
        description: description || null,
        created_by: userId
      })
      .select('id, name, description')
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return socket.emit('error', { message: 'Room name already exists' });
      }
      throw error;
    }

    logger.info(`Admin ${socket.username} created room: ${room.name}`);

    // Broadcast an alle: Neuer Raum verfügbar
    socket.server.emit('room_created', {
      room: {
        id: room.id,
        name: room.name,
        description: room.description
      }
    });

    socket.emit('success', { message: `Room #${room.name} created successfully` });
  } catch (error) {
    logger.error('Create room error:', error);
    socket.emit('error', { message: 'Failed to create room' });
  }
}

/**
 * Admin: User bannen
 */
export async function handleBanUser(io, socket, data) {
  if (!isAdmin(socket)) {
    return socket.emit('error', { message: 'Admin privileges required' });
  }

  const { username, reason } = data;
  const adminId = socket.userId;

  if (!username) {
    return socket.emit('error', { message: 'Username required' });
  }

  try {
    // Finde User by Username
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, username, role')
      .eq('username', username)
      .single();

    if (!profile) {
      return socket.emit('error', { message: 'User not found' });
    }

    // Kann keine Admins bannen
    if (profile.role === 'admin') {
      return socket.emit('error', { message: 'Cannot ban admin users' });
    }

    // Check ob schon gebannt
    const { data: existingBan } = await supabaseAdmin
      .from('bans')
      .select('id')
      .eq('user_id', profile.id)
      .single();

    if (existingBan) {
      return socket.emit('error', { message: 'User is already banned' });
    }

    // Ban erstellen
    const { error } = await supabaseAdmin
      .from('bans')
      .insert({
        user_id: profile.id,
        banned_by: adminId,
        reason: reason || 'No reason provided'
      });

    if (error) throw error;

    logger.info(`Admin ${socket.username} banned user: ${username} (${reason || 'no reason'})`);

    // User disconnecten falls online
    const userSockets = await io.in(`user:${profile.id}`).fetchSockets();
    for (const userSocket of userSockets) {
      userSocket.emit('banned', {
        reason: reason || 'No reason provided',
        by: socket.username
      });
      userSocket.disconnect(true);
    }

    socket.emit('success', { message: `User ${username} has been banned` });
  } catch (error) {
    logger.error('Ban user error:', error);
    socket.emit('error', { message: 'Failed to ban user' });
  }
}

/**
 * Admin: User unbannen
 */
export async function handleUnbanUser(socket, data) {
  if (!isAdmin(socket)) {
    return socket.emit('error', { message: 'Admin privileges required' });
  }

  const { username } = data;

  if (!username) {
    return socket.emit('error', { message: 'Username required' });
  }

  try {
    // Finde User
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .eq('username', username)
      .single();

    if (!profile) {
      return socket.emit('error', { message: 'User not found' });
    }

    // Ban entfernen
    const { error } = await supabaseAdmin
      .from('bans')
      .delete()
      .eq('user_id', profile.id);

    if (error) throw error;

    logger.info(`Admin ${socket.username} unbanned user: ${username}`);

    socket.emit('success', { message: `User ${username} has been unbanned` });
  } catch (error) {
    logger.error('Unban user error:', error);
    socket.emit('error', { message: 'Failed to unban user' });
  }
}

/**
 * Admin: User kicken (temporärer Disconnect)
 */
export async function handleKickUser(io, socket, data) {
  if (!isAdmin(socket)) {
    return socket.emit('error', { message: 'Admin privileges required' });
  }

  const { username, reason } = data;

  if (!username) {
    return socket.emit('error', { message: 'Username required' });
  }

  try {
    // Finde User
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, username, role')
      .eq('username', username)
      .single();

    if (!profile) {
      return socket.emit('error', { message: 'User not found' });
    }

    if (profile.role === 'admin') {
      return socket.emit('error', { message: 'Cannot kick admin users' });
    }

    logger.info(`Admin ${socket.username} kicked user: ${username} (${reason || 'no reason'})`);

    // User disconnecten
    const userSockets = await io.in(`user:${profile.id}`).fetchSockets();
    for (const userSocket of userSockets) {
      userSocket.emit('kicked', {
        reason: reason || 'No reason provided',
        by: socket.username
      });
      userSocket.disconnect(true);
    }

    socket.emit('success', { message: `User ${username} has been kicked` });
  } catch (error) {
    logger.error('Kick user error:', error);
    socket.emit('error', { message: 'Failed to kick user' });
  }
}

/**
 * Admin: Raum löschen
 */
export async function handleDeleteRoom(io, socket, data) {
  if (!isAdmin(socket)) {
    return socket.emit('error', { message: 'Admin privileges required' });
  }

  const { roomId } = data;

  if (!roomId) {
    return socket.emit('error', { message: 'Room ID required' });
  }

  try {
    // Check ob Raum existiert
    const { data: room } = await supabaseAdmin
      .from('rooms')
      .select('name')
      .eq('id', roomId)
      .single();

    if (!room) {
      return socket.emit('error', { message: 'Room not found' });
    }

    // Raum löschen (Nachrichten werden durch CASCADE auch gelöscht)
    const { error } = await supabaseAdmin
      .from('rooms')
      .delete()
      .eq('id', roomId);

    if (error) throw error;

    logger.info(`Admin ${socket.username} deleted room: ${room.name}`);

    // Alle aus dem Raum kicken
    const socketsInRoom = await io.in(`room:${roomId}`).fetchSockets();
    for (const s of socketsInRoom) {
      s.leave(`room:${roomId}`);
      s.currentRoom = null;
      s.emit('room_deleted', { roomId, roomName: room.name });
    }

    // Broadcast: Raum gelöscht
    io.emit('room_deleted', { roomId, roomName: room.name });

    socket.emit('success', { message: `Room ${room.name} has been deleted` });
  } catch (error) {
    logger.error('Delete room error:', error);
    socket.emit('error', { message: 'Failed to delete room' });
  }
}
