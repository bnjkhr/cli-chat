import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.SERVER_URL || 'https://cli-chat-production.up.railway.app';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Registrierung
 */
export async function register(email, password, username) {
  try {
    const response = await api.post('/auth/register', {
      email,
      password,
      username
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Registration failed'
    };
  }
}

/**
 * Login
 */
export async function login(email, password) {
  try {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Login failed'
    };
  }
}

/**
 * Logout
 */
export async function logout() {
  try {
    await api.post('/auth/logout');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Logout failed' };
  }
}

export default api;
