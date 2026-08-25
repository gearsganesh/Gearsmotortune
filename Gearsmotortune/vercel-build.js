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

  // Floating WhatsApp contact button.
  // Opens a direct WhatsApp chat to Gearsmotortune without changing the site layout.
  if (!html.includes('gmt-floating-whatsapp')) {
    const whatsappStyles = `
  <style id="gmt-floating-whatsapp-styles">
    .gmt-floating-whatsapp {
      position: fixed;
      right: 24px;
      bottom: 24px;
      width: 58px;
      height: 58px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: #25D366;
      color: #fff;
      box-shadow: 0 10px 30px rgba(0,0,0,.38), 0 0 0 1px rgba(255,255,255,.12);
      z-index: 2000;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .gmt-floating-whatsapp:hover {
      transform: translateY(-3px) scale(1.04);
      box-shadow: 0 14px 34px rgba(0,0,0,.45), 0 0 24px rgba(37,211,102,.28);
    }
    .gmt-floating-whatsapp:focus-visible {
      outline: 3px solid rgba(255,255,255,.9);
      outline-offset: 3px;
    }
    .gmt-floating-whatsapp svg {
      width: 31px;
      height: 31px;
      fill: currentColor;
    }
    .gmt-floating-whatsapp::after {
      content: "Chat on WhatsApp";
      position: absolute;
      right: 68px;
      top: 50%;
      transform: translateY(-50%) translateX(5px);
      white-space: nowrap;
      padding: 7px 10px;
      border-radius: 5px;
      background: #111518;
      border: 1px solid rgba(255,255,255,.1);
      color: #fff;
      font: 600 12px Inter, Arial, sans-serif;
      opacity: 0;
      pointer-events: none;
      transition: opacity .18s ease, transform .18s ease;
    }
    .gmt-floating-whatsapp:hover::after,
    .gmt-floating-whatsapp:focus-visible::after {
      opacity: 1;
      transform: translateY(-50%) translateX(0);
    }
    @media (max-width: 600px) {
      .gmt-floating-whatsapp {
        right: 16px;
        bottom: 16px;
        width: 54px;
        height: 54px;
      }
      .gmt-floating-whatsapp svg { width: 29px; height: 29px; }
      .gmt-floating-whatsapp::after { display: none; }
    }
  </style>
`;

    const whatsappButton = `
  <a
    id="gmt-floating-whatsapp"
    class="gmt-floating-whatsapp"
    href="https://wa.me/918072432675"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chat with Gearsmotortune on WhatsApp"
    title="Chat on WhatsApp"
  >
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M16.02 3.2c-7.08 0-12.83 5.74-12.83 12.82 0 2.26.59 4.46 1.71 6.4L3.1 28.8l6.56-1.72a12.78 12.78 0 0 0 6.35 1.68h.01c7.07 0 12.82-5.75 12.82-12.82S23.09 3.2 16.02 3.2Zm0 23.38h-.01a10.56 10.56 0 0 1-5.38-1.47l-.39-.23-3.89 1.02 1.04-3.79-.25-.39a10.6 10.6 0 1 1 8.88 4.86Zm5.81-7.94c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1.01 1.25-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.57-1.87-1.75-2.18-.18-.32-.02-.49.14-.65.15-.15.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.98-2.34-.26-.61-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65s1.14 3.08 1.3 3.29c.16.21 2.24 3.42 5.43 4.79.76.33 1.35.53 1.81.68.76.24 1.45.21 2 .13.61-.09 1.89-.77 2.16-1.52.27-.74.27-1.38.19-1.52-.08-.13-.29-.21-.61-.37Z"/>
    </svg>
  </a>
`;

    html = html.replace('</head>', `${whatsappStyles}</head>`);
    html = html.replace('</body>', `${whatsappButton}</body>`);
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

    /* Mobile-only correction. Desktop layout remains untouched. */
    @media (max-width:600px) {
      .hero-scroll { height:125vh !important; min-height:0 !important; }
      .hero-stage, .hero { min-height:100svh !important; height:100svh !important; }
      .hero-stage { align-items:flex-start !important; }
      .hero-stage .hero-content {
        width:100% !important;
        max-width:none !important;
        padding-top:145px !important;
        padding-bottom:30px !important;
      }
      .hero-stage .eyebrow {
        font-size:11px !important;
        letter-spacing:1.25px !important;
        padding:8px 12px !important;
        white-space:nowrap !important;
      }
      .hero-stage h1 {
        font-size:clamp(48px,14vw,62px) !important;
        line-height:.86 !important;
        letter-spacing:-1.4px !important;
        margin:22px 0 20px !important;
      }
      .hero-stage p {
        font-size:14px !important;
        line-height:1.65 !important;
        max-width:100% !important;
      }
      .hero-stage .hero-actions {
        gap:10px !important;
        margin-top:24px !important;
      }
      .hero-stage .hero-actions .btn {
        min-height:50px !important;
        padding:12px 16px !important;
        font-size:14px !important;
      }

      /* Let the global cinematic wave fill the mobile hero instead of hiding it behind an opaque layer. */
      .hero-stage,
      .hero-stage.hero {
        background:rgba(7,8,9,.18) !important;
        background-image:none !important;
      }
      .hero-stage:after {
        opacity:.42 !important;
      }
    }
  </style>
`;
    const loader = `
  <script src="/global-cinematic-wave.js"></script>
`;
    html = html.replace('</head>', `${cinematicStyles}</head>`);
    html = html.replace('</body>', `${loader}</body>`);
  }

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('Gearsmotortune: restored supplied archive, installed the Varadaraja global cinematic-wave background, and added the floating WhatsApp button.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
