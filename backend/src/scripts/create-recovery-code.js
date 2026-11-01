import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createPasswordHash } from '../src/services/authService.js';

const envPath = resolve(process.cwd(), '.env');
const secret = randomBytes(24).toString('base64url');
const hash = await createPasswordHash(secret);
let content = await readFile(envPath, 'utf8');
if (/^AUTH_RECOVERY_CODE_HASH\s*=/m.test(content)) {
  content = content.replace(/^AUTH_RECOVERY_CODE_HASH\s*=.*$/m, `AUTH_RECOVERY_CODE_HASH=${hash}`);
} else {
  content = `${content.trimEnd()}\nAUTH_RECOVERY_CODE_HASH=${hash}\n`;
}
await writeFile(envPath, content, 'utf8');
console.log('Kode pemulihan baru (simpan di tempat aman; tidak dapat dilihat lagi):');
console.log(secret);
console.log('Restart backend agar kode pemulihan aktif.');
