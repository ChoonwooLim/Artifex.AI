import { session } from 'electron';

export function setupSecurityPolicy() {
  // Set Content Security Policy for production
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          process.env.NODE_ENV === 'development'
            ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' file: http://localhost:* ws://localhost:*; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
              "connect-src 'self' http://localhost:* ws://localhost:* https://ollama.com; " +
              "img-src 'self' data: blob: file: http://localhost:*; " +
              "media-src 'self' file: blob: http://localhost:*; " +
              "style-src 'self' 'unsafe-inline';"
            : "default-src 'self' file:; " +
              "script-src 'self'; " +
              "connect-src 'self' http://localhost:11434; " +
              "img-src 'self' data: blob: file:; " +
              "media-src 'self' file: blob:; " +
              "style-src 'self' 'unsafe-inline';"
        ]
      }
    });
  });
}