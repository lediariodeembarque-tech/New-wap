import { spawn } from 'child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const processes = [];
let shuttingDown = false;

const start = (command, args, label) => {
  const child = spawn(command, args, { stdio: 'inherit', env: process.env });
  processes.push(child);

  child.on('error', (error) => {
    console.error(`[${label}] ${error.message}`);
    shutdown(1);
  });

  child.on('exit', (code, signal) => {
    if (!shuttingDown && code !== 0) {
      console.error(`[${label}] encerrou${signal ? ` com ${signal}` : ` com código ${code}`}.`);
      shutdown(code || 1);
    }
  });

  return child;
};

const shutdown = (code = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of processes) {
    if (!child.killed) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 250);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('Iniciando API em http://localhost:3001...');
start(process.execPath, ['server.js'], 'API');
console.log('Iniciando frontend Vite...');
start(npmCommand, ['run', 'dev:frontend'], 'frontend');
