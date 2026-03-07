document.addEventListener('DOMContentLoaded', () => {
  const measurementMeta = document.querySelector('meta[name="ga4-measurement-id"]');
  const gaMeasurementId = (measurementMeta?.content || '').trim();
  const isGaReady = gaMeasurementId.startsWith('G-') && !gaMeasurementId.includes('XXXX');

  const trackEvent = (eventName, params = {}) => {
    if (!isGaReady || typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, params);
  };

  if (isGaReady) {
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', gaMeasurementId, {
      anonymize_ip: true
    });
  }

  const header = document.getElementById('site-header');

  const onScroll = () => {
    if (!header) return;
    if (window.scrollY > 60) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Contact/link click tracking
  document.querySelectorAll('a[href]').forEach((anchor) => {
    anchor.addEventListener('click', () => {
      const href = anchor.getAttribute('href') || '';
      let channel = '';

      if (href.startsWith('tel:')) channel = 'phone';
      else if (href.includes('line.me')) channel = 'line';
      else if (href.includes('instagram.com')) channel = 'instagram';
      else if (href.includes('google.') && href.includes('/maps')) channel = 'map';

      if (!channel) return;

      trackEvent('contact_click', {
        channel,
        link_text: (anchor.textContent || '').trim(),
        link_url: href
      });
    });
  });

  // FAQ accordion
  document.querySelectorAll('.faq-item .faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('is-open');

      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('is-open');
        i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        i.querySelector('.faq-icon').textContent = '+';
      });

      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        item.querySelector('.faq-icon').textContent = '−';
      }
    });
  });
});
