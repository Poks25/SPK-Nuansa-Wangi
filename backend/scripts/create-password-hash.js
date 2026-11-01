import { createPasswordHash } from '../src/services/authService.js';

function readSecret(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Jalankan perintah ini dari terminal interaktif.');
  }
  return new Promise((resolve, reject) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    let value = '';
    const onData = (buffer) => {
      for (const character of buffer.toString('utf8')) {
        if (character === '\u0003') {
          process.stdin.off('data', onData);
          process.stdin.setRawMode(false);
          process.stdout.write('\n');
          reject(new Error('Dibatalkan.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          process.stdin.off('data', onData);
          process.stdin.setRawMode(false);
          process.stdout.write('\n');
          resolve(value);
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1);
          continue;
        }
        if (character >= ' ' && character !== '\u007f') value += character;
      }
    };
    process.stdin.on('data', onData);
  });
}

try {
  const password = await readSecret('Password baru (min. 1 karakter): ');
  const confirmation = await readSecret('Ulangi password: ');
  if (password !== confirmation) throw new Error('Password tidak sama.');
  process.stdout.write(`${await createPasswordHash(password)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}

