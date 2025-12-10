#!/usr/bin/env node

import blessed from 'blessed';
import { createLoginScreen } from './ui/login.js';
import { createChatScreen } from './ui/chat.js';
import authService from './services/auth.js';

/**
 * CLI-Chat Client Entry Point
 */

// Create Screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'CLI-Chat',
  fullUnicode: true
});

// Global Key Bindings
screen.key(['C-c'], () => {
  authService.clearSession();
  process.exit(0);
});

// Show Login Screen
function showLogin() {
  createLoginScreen(screen, (userData) => {
    // Login successful, show chat
    const session = userData.session;
    if (!session || !session.access_token || !session.refresh_token) {
      console.error('No session token received. Email confirmation might be required.');
      process.exit(1);
    }

    // Session im AuthService speichern und Auto-Refresh starten
    try {
      authService.setSession(session);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      process.exit(1);
    }

    // Chat Screen mit initialem Token starten
    createChatScreen(screen, userData, session.access_token);
  });
}

// Start
showLogin();

// Render
screen.render();
