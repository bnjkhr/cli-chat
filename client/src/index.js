#!/usr/bin/env node

import blessed from 'blessed';
import { createLoginScreen } from './ui/login.js';
import { createChatScreen } from './ui/chat.js';

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
  process.exit(0);
});

// Show Login Screen
function showLogin() {
  createLoginScreen(screen, (userData) => {
    // Login successful, show chat
    const token = userData.session.access_token;
    createChatScreen(screen, userData, token);
  });
}

// Start
showLogin();

// Render
screen.render();
