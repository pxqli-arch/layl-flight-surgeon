import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {randomInt, createHash, timingSafeEqual} from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const host = '127.0.0.1';
const port = Number(process.env.PORT || 5173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

// The owner PIN is generated ONLY on the local Node server — never sent in frontend code.
const ownerPin = String(randomInt(100000,1000000));
const pinDigest = createHash('sha256').update(ownerPin).digest();
let failedAttempts = 0;
let lockedUntil = 0;

http.createServer((req, res) => {
  if (req.url?.startsWith('/api/owner/authorize')) {
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    const origin = req.headers.origin;
    if (req.method!=='POST' || (origin && ![`http://${host}:${port}`,`http://localhost:${port}`].includes(origin))) {
      res.writeHead(403);res.end(JSON.stringify({error:'Not allowed.'}));return;
    }
    if (Date.now()<lockedUntil) {res.writeHead(429);res.end(JSON.stringify({error:'Too many attempts. Try again in one minute.'}));return;}
    let input='';
    req.on('data',chunk=>{
      input+=chunk;
      if (input.length>2048) req.destroy();
    });
    req.on('end',()=>{
      let pin='';let action='';
      try {const parsed=JSON.parse(input);pin=String(parsed.pin??'');action=String(parsed.action??'');}catch {}
      const submitted = createHash('sha256').update(pin).digest();
      if (!timingSafeEqual(submitted,pinDigest) || !['clear','restart','credit','reset_all'].includes(action)) {
        failedAttempts++;
        if (failedAttempts>=5) {lockedUntil=Date.now()+60000;failedAttempts=0;}
        res.writeHead(401);res.end(JSON.stringify({error:'Incorrect owner PIN.'}));return;
      }
      failedAttempts=0;
      res.writeHead(200);res.end(JSON.stringify({ok:true}));
    });
    return;
  }
  const pathname = decodeURIComponent(new URL(req.url, `http://${host}`).pathname);
  const target = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!target.startsWith(root + path.sep)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(target, (err, body) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      res.end(err.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(body);
  });
}).listen(port, host, () => {
  console.log(`\nLAYL // FLIGHT SURGEON is running at http://${host}:${port}`);
  console.log(`🔒 Owner Tools PIN (local only): ${ownerPin}\n`);
});
