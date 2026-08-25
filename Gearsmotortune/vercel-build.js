const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Remove the Netlify form markers so Vercel is fully independent.
html = html.replace('data-netlify="true"', '');
html = html.replace('netlify-honeypot="bot-field"', '');
html = html.replace('action="/"', '');
html = html.replace('name="automotive-enquiry"', '');

// Load the standalone WhatsApp enquiry handler exactly once.
if (!html.includes('whatsapp-enquiry.js')) {
  html = html.replace('</body>', '  <script src="/whatsapp-enquiry.js" defer></script>\n</body>');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Gearsmotortune: standalone WhatsApp enquiry handler injected.');
