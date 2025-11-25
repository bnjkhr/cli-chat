import { supabase } from '../config/supabase.js';

/**
 * Middleware: JWT Token validieren
 * Extrahiert User-Info aus Token und fügt zu req.user hinzu
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Token mit Supabase validieren
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // User-Info zu Request hinzufügen
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Socket.io Middleware: Token validieren
 */
export async function authenticateSocket(socket, next) {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication token required'));
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return next(new Error('Invalid token'));
    }

    // User-Info zu Socket hinzufügen
    socket.userId = user.id;
    socket.userEmail = user.email;

    // Lade Profil-Info (username, role)
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', user.id)
      .single();

    socket.username = profile?.username || 'Unknown';
    socket.role = profile?.role || 'user';

    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Authentication failed'));
  }
}
