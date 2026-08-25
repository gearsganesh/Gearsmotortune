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
