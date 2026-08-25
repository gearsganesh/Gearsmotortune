(() => {
  const WHATSAPP_NUMBER = '918072432675';

  function prettyLabel(name) {
    return String(name || '')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, ch => ch.toUpperCase())
      .trim();
  }

  function showStatus(form, message, isError = false) {
    const status = form.querySelector('.form-status') || document.getElementById('formStatus');
    if (!status) return;
    status.textContent = message;
    status.className = `form-status ${isError ? 'error' : 'success'}`;
    status.style.display = 'block';
  }

  // Keep the floating controls fixed to the viewport. The cinematic layer
  // intentionally gives direct body children a position context, so these
  // controls must explicitly override that rule with !important.
  function lockFloatingControls() {
    if (document.getElementById('gmt-floating-control-fix')) return;

    const style = document.createElement('style');
    style.id = 'gmt-floating-control-fix';
    style.textContent = `
      /* Hide the older duplicate WhatsApp control. */
      .gmt-whatsapp { display: none !important; }

      /* Sound control: fixed above WhatsApp. */
      .gmt-sound-wrap {
        position: fixed !important;
        right: 24px !important;
        bottom: 92px !important;
        left: auto !important;
        top: auto !important;
        z-index: 20001 !important;
        transform: none !important;
      }

      /* WhatsApp control: fixed at the bottom-right corner. */
      .gmt-floating-whatsapp {
        position: fixed !important;
        right: 24px !important;
        bottom: 24px !important;
        left: auto !important;
        top: auto !important;
        z-index: 20002 !important;
        transform: none;
      }

      .gmt-floating-whatsapp:hover {
        transform: translateY(-3px) scale(1.04) !important;
      }

      @media (max-width: 600px) {
        .gmt-sound-wrap {
          right: 16px !important;
          bottom: 86px !important;
        }
        .gmt-floating-whatsapp {
          right: 16px !important;
          bottom: 16px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', lockFloatingControls, { once: true });
  } else {
    lockFloatingControls();
  }

  document.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id !== 'enquiryForm' && form.id !== 'automotiveEnquiryForm') return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const formData = new FormData(form);
    const lines = [
      'Hello Gearsmotortune, I would like to make an enquiry.',
      ''
    ];

    for (const [name, rawValue] of formData.entries()) {
      const value = String(rawValue).trim();
      if (!value || name === 'bot-field') continue;
      lines.push(`${prettyLabel(name)}: ${value}`);
    }

    const message = lines.join('\n');
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    showStatus(form, 'WhatsApp is opening with your enquiry ready to send.');
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (!popup) window.location.href = url;
  }, true);
})();
