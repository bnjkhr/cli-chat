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

    this.session = session;
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
      return;
    }

    // Berechne Zeit bis zum Refresh (5 Minuten vor Ablauf)
    const expiresAt = this.session.expires_at * 1000; // Unix timestamp in ms
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    const refreshBuffer = 5 * 60 * 1000; // 5 Minuten in ms
    const timeUntilRefresh = timeUntilExpiry - refreshBuffer;

    // Wenn Token bereits abgelaufen oder weniger als 5 Minuten übrig, sofort erneuern
    if (timeUntilRefresh <= 0) {
      this.refreshToken();
      return;
    }

    // Timer setzen für automatischen Refresh
    this.refreshTimer = setTimeout(() => {
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

    try {
      const response = await api.post('/auth/refresh', {
        refresh_token: this.session.refresh_token
      });

      if (response.data && response.data.session) {
        const newSession = response.data.session;
        this.session = newSession;

        // Callbacks aufrufen mit neuem Token
        this.onTokenRefreshCallbacks.forEach(callback => {
          try {
            callback(newSession.access_token);
          } catch (error) {
            console.error('Error in token refresh callback:', error);
          }
        });

        // Neuen Timer starten
        this.startRefreshTimer();

        return newSession;
      } else {
        throw new Error('Invalid response from refresh endpoint');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);

      // Session löschen bei Fehler
      this.clearSession();

      throw error;
    }
  }
}

export default new AuthService();
