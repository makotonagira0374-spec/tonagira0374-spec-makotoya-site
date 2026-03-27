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


  const setupSlider = ({ root, trackSelector, slideSelector, dotSelector, dotAttribute }) => {
    if (!root) return;

    const track = root.querySelector(trackSelector);
    const slides = Array.from(root.querySelectorAll(slideSelector));
    const dots = Array.from(root.querySelectorAll(dotSelector));
    if (!track || !slides.length || !dots.length) return;

    let activeIndex = 0;

    const syncSlider = (index) => {
      activeIndex = index;
      track.style.transform = `translateX(-${index * 100}%)`;

      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === index);
      });

      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === index;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-current', String(isActive));
      });
    };

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const nextIndex = Number(dot.getAttribute(dotAttribute));
        if (Number.isNaN(nextIndex)) return;
        syncSlider(nextIndex);
      });
    });

    let touchStartX = 0;
    let touchEndX = 0;

    root.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0]?.clientX || 0;
    }, { passive: true });

    root.addEventListener('touchend', (event) => {
      touchEndX = event.changedTouches[0]?.clientX || 0;
      const deltaX = touchEndX - touchStartX;

      if (Math.abs(deltaX) < 36) return;
      if (deltaX < 0 && activeIndex < slides.length - 1) syncSlider(activeIndex + 1);
      if (deltaX > 0 && activeIndex > 0) syncSlider(activeIndex - 1);
    }, { passive: true });

    syncSlider(0);
  };

  setupSlider({
    root: document.querySelector('[data-memory-slider]'),
    trackSelector: '.memory-slider__track',
    slideSelector: '[data-memory-slide]',
    dotSelector: '[data-memory-dot]',
    dotAttribute: 'data-memory-dot'
  });

  setupSlider({
    root: document.querySelector('[data-gallery-slider]'),
    trackSelector: '.home-gallery__track',
    slideSelector: '[data-gallery-slide]',
    dotSelector: '[data-gallery-dot]',
    dotAttribute: 'data-gallery-dot'
  });

  setupSlider({
    root: document.querySelector('[data-plan-slider]'),
    trackSelector: '.movie-plans__grid',
    slideSelector: '[data-plan-slide]',
    dotSelector: '[data-plan-dot]',
    dotAttribute: 'data-plan-dot'
  });
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
