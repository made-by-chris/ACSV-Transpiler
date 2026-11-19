import fs from 'node:fs';
// The old Vercel host only redirects; the application runs on Cloudflare.
fs.mkdirSync('dist/web',{recursive:true});
fs.copyFileSync('public/migration.html','dist/web/migration.html');
fs.writeFileSync('dist/web/index.html','<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=https://acsv.majaku.com/"><link rel="canonical" href="https://acsv.majaku.com/"><title>ACSV has moved</title><a href="https://acsv.majaku.com/">Open ACSV</a></html>');
