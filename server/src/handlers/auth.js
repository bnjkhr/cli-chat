import { supabase, supabaseAdmin } from '../config/supabase.js';
import logger from '../utils/logger.js';

/**
 * POST /auth/register
 * Registriert einen neuen User
 */
export async function register(req, res) {
  const { email, password, username } = req.body;

  // Validation
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be 3-20 characters' });
  }

  // Username darf nur alphanumerisch + underscore sein
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
  }

  try {
    // Check ob Username schon existiert
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingProfile) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // User in Supabase Auth erstellen
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      logger.error('Registration auth error:', authError);
      return res.status(400).json({ error: authError.message });
    }

    // Profil erstellen
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        username,
        role: 'user'
      });

    if (profileError) {
      logger.error('Registration profile error:', profileError);
      // Cleanup: User löschen wenn Profil nicht erstellt werden konnte
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Failed to create profile' });
    }

    logger.info(`New user registered: ${username} (${email})`);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username
      },
      session: authData.session
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

/**
 * POST /auth/login
 * User einloggen
 */
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Login mit Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      logger.warn(`Login failed for ${email}:`, error.message);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check ob User gebannt ist
    const { data: ban } = await supabaseAdmin
      .from('bans')
      .select('reason, banned_at')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (ban) {
      return res.status(403).json({
        error: 'Account banned',
        reason: ban.reason,
        banned_at: ban.banned_at
      });
    }

    // Lade Profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', data.user.id)
      .maybeSingle();

    // Update last_seen
    await supabaseAdmin
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', data.user.id);

    logger.info(`User logged in: ${profile?.username} (${email})`);

    res.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        username: profile?.username,
        role: profile?.role
      },
      session: data.session
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * POST /auth/logout
 * User ausloggen
 */
export async function logout(req, res) {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    res.json({ message: 'Logout successful' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}
