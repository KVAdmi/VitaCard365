import SFTPClient from 'ssh2-sftp-client';
import fs from 'node:fs/promises';
import fetch from 'node-fetch';

const url = process.env.IGS_EXPORT_URL;
const host = process.env.IGS_SFTP_HOST;
const port = Number(process.env.IGS_SFTP_PORT || 22);
const user = process.env.IGS_SFTP_USER;
const pass = process.env.IGS_SFTP_PASS;
const remoteDir = process.env.IGS_SFTP_DIR || '/BDD';

if (!url) {
  console.error('Missing IGS_EXPORT_URL');
  process.exit(1);
}

const now = new Date();
const y = now.getUTCFullYear();
const m = String(now.getUTCMonth() + 1).padStart(2, '0');
const d = String(now.getUTCDate()).padStart(2, '0');
const fileName = `IGS_${y}${m}${d}.csv`;

const resp = await fetch(url, { method: 'GET' });
if (!resp.ok) {
  console.error('Export function failed:', resp.status, await resp.text());
  process.exit(1);
}
const csv = await resp.text();
await fs.writeFile(fileName, csv, 'utf8');

const sftp = new SFTPClient();
try {
  await sftp.connect({ host, port, username: user, password: pass });
  if (remoteDir) {
    try { await sftp.cwd(remoteDir); } catch { await sftp.mkdir(remoteDir, true); }
  }
  await sftp.put(fileName, `${remoteDir}/${fileName}`);
  console.log('Uploaded:', `${remoteDir}/${fileName}`);
} finally {
  try { await sftp.end(); } catch {}
}
