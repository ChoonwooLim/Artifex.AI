import { session } from 'electron';

export function setupSecurityPolicy() {
  // Set Content Security Policy for production
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          process.env.NODE_ENV === 'development'
            ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
              "connect-src 'self' http://localhost:* ws://localhost:* https://ollama.com; " +
              "img-src 'self' data: blob: http://localhost:*; " +
              "style-src 'self' 'unsafe-inline';"
            : "default-src 'self'; " +
              "script-src 'self'; " +
              "connect-src 'self' http://localhost:11434; " +
              "img-src 'self' data: blob:; " +
              "style-src 'self' 'unsafe-inline';"
        ]
      }
    });
  });
}