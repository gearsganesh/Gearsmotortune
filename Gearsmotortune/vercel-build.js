const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
const archiveIndexUrl = 'https://raw.githubusercontent.com/gearsganesh/Gearsmotortune/4e79da5d4040016d27433adbb8881c5677347c2e/Gearsmotortune/index.html';

async function main() {
  const response = await fetch(archiveIndexUrl);
  if (!response.ok) throw new Error(`Could not restore archive index: ${response.status}`);
  let html = await response.text();

  // Vercel is independent of Netlify Forms. The standalone WhatsApp handler
  // receives the enquiry instead.
  html = html.replace('data-netlify="true"', '');
  html = html.replace('netlify-honeypot="bot-field"', '');
  html = html.replace('action="/"', '');
  html = html.replace('name="automotive-enquiry"', '');

  if (!html.includes('whatsapp-enquiry.js')) {
    html = html.replace('</body>', '  <script src="/whatsapp-enquiry.js" defer></script>\n</body>');
  }

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
  <style id="gmt-cinematic-layer">
    /* The original page layout stays untouched. Only its hero background is replaced. */
    .hero { background: #070809 !important; background-image: none !important; }
    .hero > .container, .hero > .scroll-cue { position: relative; z-index: 2; }
    .hero:before, .hero:after { pointer-events:none; }
  </style>
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
  console.log('Gearsmotortune: restored supplied archive and replaced only the hero background with the Varadaraja-style cinematic layer.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
