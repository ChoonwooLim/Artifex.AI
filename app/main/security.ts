import { session } from 'electron';

export function setupSecurityPolicy() {
  // Set Content Security Policy for production
  const isDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER === 'true' || process.env.ELECTRON_START_URL;
  
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDev
            ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' file: http://localhost:* ws://localhost:*; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
              "connect-src 'self' http://localhost:* ws://localhost:* https://ollama.com; " +
              "img-src 'self' data: blob: file: http://localhost:*; " +
              "media-src 'self' file: blob: http://localhost:*; " +
              "style-src 'self' 'unsafe-inline';"
            : "default-src 'self' 'unsafe-inline' file:; " +
              "script-src 'self' 'unsafe-inline'; " +
              "connect-src 'self' http://localhost:11434; " +
              "img-src 'self' data: blob: file:; " +
              "media-src 'self' file: blob:; " +
              "style-src 'self' 'unsafe-inline';"
        ]
      }
    });
  });
}