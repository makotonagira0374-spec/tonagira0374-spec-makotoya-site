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


  const memorySlider = document.querySelector('[data-memory-slider]');
  const memoryTrack = memorySlider?.querySelector('.memory-slider__track');
  const memorySlides = memorySlider ? Array.from(memorySlider.querySelectorAll('[data-memory-slide]')) : [];
  const memoryDots = Array.from(document.querySelectorAll('[data-memory-dot]'));
  let activeMemoryIndex = 0;

  const syncMemorySlider = (index) => {
    if (!memoryTrack || !memorySlides.length) return;

    activeMemoryIndex = index;
    memoryTrack.style.transform = `translateX(-${index * 100}%)`;

    memorySlides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === index);
    });

    memoryDots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === index;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-current', String(isActive));
    });
  };

  if (memoryTrack && memorySlides.length && memoryDots.length) {
    memoryDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const nextIndex = Number(dot.getAttribute('data-memory-dot'));
        if (Number.isNaN(nextIndex)) return;
        syncMemorySlider(nextIndex);
      });
    });

    let touchStartX = 0;
    let touchEndX = 0;

    memorySlider.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0]?.clientX || 0;
    }, { passive: true });

    memorySlider.addEventListener('touchend', (event) => {
      touchEndX = event.changedTouches[0]?.clientX || 0;
      const deltaX = touchEndX - touchStartX;

      if (Math.abs(deltaX) < 36) return;
      if (deltaX < 0 && activeMemoryIndex < memorySlides.length - 1) syncMemorySlider(activeMemoryIndex + 1);
      if (deltaX > 0 && activeMemoryIndex > 0) syncMemorySlider(activeMemoryIndex - 1);
    }, { passive: true });

    syncMemorySlider(0);
  }
  document.querySelectorAll('.faq-item .faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      if (!item) return;

      const isOpen = item.classList.contains('is-open');

      document.querySelectorAll('.faq-item').forEach((entry) => {
        entry.classList.remove('is-open');

        const question = entry.querySelector('.faq-q');
        const icon = entry.querySelector('.faq-icon');

        if (question) question.setAttribute('aria-expanded', 'false');
        if (icon) icon.textContent = '+';
      });

      if (isOpen) return;

      item.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');

      const icon = item.querySelector('.faq-icon');
      if (icon) icon.textContent = '-';
    });
  });
});
