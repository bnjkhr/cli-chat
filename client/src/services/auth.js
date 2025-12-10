import api from './api.js';

/**
 * AuthService - Verwaltet Session und automatischen Token-Refresh
 */
class AuthService {
  constructor() {
    this.session = null;
    this.refreshTimer = null;
    this.onTokenRefreshCallbacks = [];
  }

  /**
   * Session setzen und Auto-Refresh starten
   */
  setSession(session) {
    if (!session || !session.access_token || !session.refresh_token) {
      throw new Error('Invalid session object');
    }

    // Wenn expires_in vorhanden ist, berechne expires_at
    if (session.expires_in && !session.expires_at) {
      session.expires_at = Math.floor(Date.now() / 1000) + session.expires_in;
    }

    this.session = session;
    console.log('[AuthService] Session set, expires_at:', session.expires_at, 'expires_in:', session.expires_in);
    this.startRefreshTimer();
  }

  /**
   * Aktuellen Access Token abrufen
   */
  getAccessToken() {
    return this.session?.access_token || null;
  }

  /**
   * Refresh Token abrufen
   */
  getRefreshToken() {
    return this.session?.refresh_token || null;
  }

  /**
   * Session-Daten abrufen
   */
  getSession() {
    return this.session;
  }

  /**
   * Session löschen und Timer stoppen
   */
  clearSession() {
    this.session = null;
    this.stopRefreshTimer();
  }

  /**
   * Callback registrieren für Token-Refresh-Events
   * Callback erhält den neuen access_token als Parameter
   */
  onTokenRefresh(callback) {
    if (typeof callback === 'function') {
      this.onTokenRefreshCallbacks.push(callback);
    }
  }

  /**
   * Token-Refresh-Timer starten
   * Erneuert Token 5 Minuten vor Ablauf
   */
  startRefreshTimer() {
    this.stopRefreshTimer(); // Vorherigen Timer stoppen

    if (!this.session || !this.session.expires_at) {
      console.error('[AuthService] Cannot start refresh timer: no expires_at in session', this.session);
      return;
    }

    // Berechne Zeit bis zum Refresh (5 Minuten vor Ablauf)
    const expiresAt = this.session.expires_at * 1000; // Unix timestamp in ms
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    const refreshBuffer = 5 * 60 * 1000; // 5 Minuten in ms
    const timeUntilRefresh = timeUntilExpiry - refreshBuffer;

    console.log('[AuthService] Token expires in', Math.floor(timeUntilExpiry / 1000), 'seconds');
    console.log('[AuthService] Refresh scheduled in', Math.floor(timeUntilRefresh / 1000), 'seconds');

    // Wenn Token bereits abgelaufen oder weniger als 5 Minuten übrig, sofort erneuern
    if (timeUntilRefresh <= 0) {
      console.log('[AuthService] Token expires soon, refreshing immediately');
      this.refreshToken();
      return;
    }

    // Timer setzen für automatischen Refresh
    this.refreshTimer = setTimeout(() => {
      console.log('[AuthService] Refresh timer triggered, refreshing token...');
      this.refreshToken();
    }, timeUntilRefresh);
  }

  /**
   * Timer stoppen
   */
  stopRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Token manuell erneuern
   */
  async refreshToken() {
    if (!this.session || !this.session.refresh_token) {
      throw new Error('No refresh token available');
    }

    console.log('[AuthService] Refreshing token...');

    try {
      const response = await api.post('/auth/refresh', {
        refresh_token: this.session.refresh_token
      });

      if (response.data && response.data.session) {
        const newSession = response.data.session;

        // Wenn expires_in vorhanden ist, berechne expires_at
        if (newSession.expires_in && !newSession.expires_at) {
          newSession.expires_at = Math.floor(Date.now() / 1000) + newSession.expires_in;
        }

        this.session = newSession;
        console.log('[AuthService] Token refreshed successfully');

        // Callbacks aufrufen mit neuem Token
        this.onTokenRefreshCallbacks.forEach(callback => {
          try {
            callback(newSession.access_token);
          } catch (error) {
            console.error('[AuthService] Error in token refresh callback:', error);
          }
        });

        // Neuen Timer starten
        this.startRefreshTimer();

        return newSession;
      } else {
        throw new Error('Invalid response from refresh endpoint');
      }
    } catch (error) {
      console.error('[AuthService] Token refresh failed:', error);

      // Session löschen bei Fehler
      this.clearSession();

      throw error;
    }
  }
}

export default new AuthService();
