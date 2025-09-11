const { spawn, execSync } = require('child_process');
const http = require('http');

const port = process.env.VITE_PORT || '5174';

console.log('========================================');
console.log('  Artifex.AI Studio - Desktop Mode');
console.log(`  Port: ${port}`);
console.log('========================================\n');

// Kill existing processes on Windows
if (process.platform === 'win32') {
  console.log('Cleaning up existing processes...');
  try {
    execSync('taskkill /F /IM electron.exe 2>nul', { stdio: 'ignore' });
  } catch (e) {
    // Process not found is okay
  }
  try {
    execSync('taskkill /F /IM node.exe 2>nul', { stdio: 'ignore' });
  } catch (e) {
    // Process not found is okay
  }
}

// Start immediately without delay
console.log(`Starting Vite development server on port ${port}...\n`);

// Start Vite with specific port
const vite = spawn('npx', ['vite', '--port', port, '--host'], {
  stdio: 'pipe',
  env: { ...process.env, VITE_PORT: port, VITE_DEV_SERVER: 'true' }
});

let electronStarted = false;

// Function to check if Vite is ready
const checkViteReady = () => {
  http.get(`http://localhost:${port}`, (res) => {
    if (!electronStarted && res.statusCode === 200) {
      electronStarted = true;
      console.log('\n✅ Vite server ready!');
      console.log('🚀 Starting Electron desktop application...\n');
      
      // Launch Electron as desktop app
      const electron = spawn('npx', ['electron', '.'], {
        stdio: 'inherit',
        env: { 
          ...process.env, 
          ELECTRON_START_URL: `http://localhost:${port}`,
          NODE_ENV: 'development'
        }
      });
      
      electron.on('close', (code) => {
        console.log(`\nElectron desktop app closed (code ${code})`);
        vite.kill();
        process.exit(code);
      });
    }
  }).on('error', () => {
    // Server not ready yet, retry
    if (!electronStarted) {
      setTimeout(checkViteReady, 500);
    }
  });
};

// Pipe Vite output
vite.stdout.on('data', (data) => {
  process.stdout.write(data);
  // Start checking for server readiness after initial output
  if (!electronStarted && data.toString().includes('VITE')) {
    setTimeout(checkViteReady, 1000);
  }
});

vite.stderr.on('data', (data) => {
  process.stderr.write(data);
});

vite.on('close', (code) => {
  console.log(`Vite exited with code ${code}`);
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\nShutting down Artifex.AI Studio...');
  vite.kill();
  process.exit();
});