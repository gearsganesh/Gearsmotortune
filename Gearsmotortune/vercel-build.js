const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const archiveIndexUrl = 'https://raw.githubusercontent.com/gearsganesh/Gearsmotortune/4e79da5d4040016d27433adbb8881c5677347c2e/Gearsmotortune/index.html';

async function main() {
  const response = await fetch(archiveIndexUrl);
  if (!response.ok) throw new Error(`Could not restore archive index: ${response.status}`);
  let html = await response.text();

  html = html.replace('data-netlify="true"', '');
  html = html.replace('netlify-honeypot="bot-field"', '');
  html = html.replace('action="/"', '');
  html = html.replace('name="automotive-enquiry"', '');

  if (!html.includes('whatsapp-enquiry.js')) {
    html = html.replace('</body>', '  <script src="/whatsapp-enquiry.js" defer></script>\n</body>');
  }

  // Use the actual global cinematic-wave background from the Varadaraja
  // Cinemas repository, installed locally in Gearsmotortune. It is a
  // standalone fixed canvas, so there is no hero-specific WebGL layout.
  if (!html.includes('global-cinematic-wave.js')) {
    const cinematicStyles = `
  <style id="gmt-global-cinematic-layer">
    body { background:#070809 !important; }
    body > *:not(#gearsmotortune-cinematic-wave-canvas) { position:relative; z-index:2; }
    header { z-index:1000 !important; }
    .hero { background:#070809 !important; background-image:none !important; }
    .hero:before, .hero:after { pointer-events:none; }
  </style>
`;
    const loader = `
  <script src="/global-cinematic-wave.js"></script>
`;
    html = html.replace('</head>', `${cinematicStyles}</head>`);
    html = html.replace('</body>', `${loader}</body>`);
  }

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('Gearsmotortune: restored supplied archive and installed the Varadaraja global cinematic-wave background with Gearsmotortune orange palette.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
