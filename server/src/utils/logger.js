/**
 * Simple Logger mit Timestamps
 */

function timestamp() {
  return new Date().toISOString();
}

export const logger = {
  info: (...args) => {
    console.log(`[${timestamp()}] INFO:`, ...args);
  },

  error: (...args) => {
    console.error(`[${timestamp()}] ERROR:`, ...args);
  },

  warn: (...args) => {
    console.warn(`[${timestamp()}] WARN:`, ...args);
  },

  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${timestamp()}] DEBUG:`, ...args);
    }
  }
};

export default logger;
