const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const archiveIndexUrl = 'https://raw.githubusercontent.com/gearsganesh/Gearsmotortune/4e79da5d4040016d27433adbb8881c5677347c2e/Gearsmotortune/index.html';

async function main() {
  // The supplied archive is the source of truth for the page layout/content.
  // Pull that exact historical file so later experiments cannot accidentally
  // alter the website structure or alignment.
  const response = await fetch(archiveIndexUrl);
  if (!response.ok) throw new Error(`Could not restore archive index: ${response.status}`);
  let html = await response.text();

  // Remove Netlify-only form attributes. Vercel handles the static page and
  // whatsapp-enquiry.js handles the enquiry action.
  html = html.replace('data-netlify="true"', '');
  html = html.replace('netlify-honeypot="bot-field"', '');
  html = html.replace('action="/"', '');
  html = html.replace('name="automotive-enquiry"', '');

  // Load the WhatsApp enquiry handler exactly once.
  if (!html.includes('whatsapp-enquiry.js')) {
    html = html.replace('</body>', '  <script src="/whatsapp-enquiry.js" defer></script>\n</body>');
  }

  // Add the Varadaraja-style cinematic background without changing the page
  // layout. The canvas is inserted behind the existing .hero content.
  if (!html.includes('varadaraja-cinematic-background.js')) {
    const imports = `
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.185.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/"
    }
  }
  </script>
`;
    const loader = `
  <script type="module">
    import { createCinematicBackground } from './varadaraja-cinematic-background.js';
    const hero = document.querySelector('.hero');
    if (hero) {
      createCinematicBackground(hero, {
        particleCount: 520,
        maxPixelRatio: 1.35,
        bloomStrength: 0.34,
        bloomRadius: 0.52,
        bloomThreshold: 0.82,
        reelOpacity: 0.28,
        filmOpacity: 0.085
      });
    }
  </script>
`;
    html = html.replace('</head>', `${imports}</head>`);
    html = html.replace('</body>', `${loader}</body>`);
  }

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('Gearsmotortune: restored supplied archive and added Varadaraja-style cinematic background.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
