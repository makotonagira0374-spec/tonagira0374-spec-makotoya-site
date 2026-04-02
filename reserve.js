document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'makotoyaBookings';
  const MAX_BOOKINGS_PER_DAY = 5;
  const TIME_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
  const START_DATE = createLocalDate('2026-04-03');
  const MAX_MONTH_OFFSET = 5;

  const serviceCatalog = {
    rickshaw: {
      id: 'rickshaw',
      tag: 'Rickshaw Experience',
      name: '人力車体験',
      lead: '観光地の人力車のように長いコースを巡るのではなく、気軽に人力車を体験できるのが誠屋の特徴です。',
      description: '',
      meta: ['料金 3,000円〜6,000円', '所要時間 約15分〜35分', '※当日予約はお電話ください。'],
      completionTitle: '予約を受け付けました',
      completionMessage: '予約を受け付けました。LINEでご連絡します。',
      plans: [
        { id: 'rickshaw-yukkuri', name: 'ゆっくり水間コース', price: '3,000円', duration: '約15分', note: '迷ったら、これ。街道を抜けて、水間の空気をちょうどよく楽しめるコースです。' },
        { id: 'rickshaw-river', name: 'しずかな川沿いコース', price: '4,000円', duration: '約20分', note: '自然を感じながら、少しだけ静かな時間を楽しめるコースです。' },
        { id: 'rickshaw-full', name: 'たっぷり水間コース', price: '6,000円', duration: '約35分', note: '山も、街も、駅も。水間門前町をたっぷり巡る一番贅沢な体験です。' }
      ],
      extraFields: [
        { type: 'radio', name: 'planId', label: 'コース選択', required: true },
        { type: 'select', name: 'rainOption', label: '雨天対応', required: true, options: ['日程変更を希望', '雨ならキャンセル希望', '相談して決めたい'] }
      ]
    },
    photo: {
      id: 'photo',
      tag: 'Anniversary Photo',
      name: '記念日フォトプラン',
      cardTitle: '記念日<br>フォトプラン',
      lead: '日常に、埋もれない一瞬を。',
      description: '人力車に乗る姿や表情を、<br>プロのカメラマンが撮影し、<br>一生残るかたちに。',
      meta: ['料金 19,800円〜59,800円', '※内容確認後に日程を確定'],
      completionTitle: '予約リクエストを受け付けました',
      completionMessage: '予約リクエストを受け付けました。確認後LINEでご連絡します。',
      plans: [
        { id: 'photo-beginning', name: 'はじまりの一枚', price: '19,800円', duration: '短時間撮影', note: '気負わず、でもきちんと残したい日に。' },
        { id: 'photo-laugh', name: '笑ったひととき', price: '29,800円', duration: '標準撮影', note: '自然な表情と空気感をゆったり残したい方向け。' },
        { id: 'photo-story', name: '物語を残す', price: '59,800円', duration: '充実撮影', note: '一日の流れごと、丁寧に記録する上位プラン。' }
      ],
      extraFields: [
        { type: 'radio', name: 'planId', label: 'プラン選択', required: true },
        { type: 'text', name: 'shootingPurpose', label: '撮影目的', required: true, placeholder: '例：結婚記念日、旅行記念、家族写真' },
        { type: 'textarea', name: 'shootingDetails', label: '希望内容', required: true, placeholder: '撮りたい雰囲気や場所、残したい瞬間をご記入ください' },
        { type: 'select', name: 'delivery', label: '納期', required: true, options: ['通常納期で問題ない', '1週間以内を希望', 'できるだけ早めを希望'] },
        { type: 'select', name: 'rainOption', label: '雨天対応', required: true, options: ['日程変更を希望', '雨ならキャンセル希望', '相談して決めたい'] }
      ]
    },
    movie: {
      id: 'movie',
      tag: 'Anniversary Movie',
      name: '記念日ムービープラン',
      cardTitle: '記念日<br>ムービープラン',
      lead: 'あなたの笑顔も、ちゃんと残す。',
      description: 'あなたの笑顔も、<br>その日の感情も、<br>その場の空気も残す。',
      meta: ['料金 19,800円〜59,800円', '※内容確認後に日程を確定'],
      completionTitle: '予約リクエストを受け付けました',
      completionMessage: '予約リクエストを受け付けました。確認後LINEでご連絡します。',
      plans: [
        { id: 'movie-light', name: 'ライトプラン', price: '19,800円', duration: '短尺編集', note: 'その日の体験を、1分に残す。' },
        { id: 'movie-standard', name: 'スタンダードプラン', price: '29,800円', duration: '標準編集', note: 'その日の節目を、未来に残す。' },
        { id: 'movie-premium', name: 'プレミアムプラン', price: '59,800円', duration: '充実編集', note: 'その日の物語を、形に残す。' }
      ],
      extraFields: [
        { type: 'radio', name: 'planId', label: 'プラン選択', required: true },
        { type: 'text', name: 'videoPurpose', label: '動画用途', required: true, placeholder: '例：記念保存、家族共有、SNS掲載' },
        { type: 'textarea', name: 'videoImage', label: 'イメージ', required: true, placeholder: 'しっとり、自然体、映画のように など希望する雰囲気' },
        { type: 'select', name: 'delivery', label: '納期', required: true, options: ['通常納期で問題ない', '2週間以内を希望', 'できるだけ早めを希望'] },
        { type: 'select', name: 'rainOption', label: '雨天対応', required: true, options: ['日程変更を希望', '雨ならキャンセル希望', '相談して決めたい'] }
      ]
    }
  };

  const seededDailyCounts = {
    '2026-04-03': 2,
    '2026-04-04': 3,
    '2026-04-05': 4,
    '2026-04-06': 1,
    '2026-04-07': 5,
    '2026-04-08': 2,
    '2026-04-09': 0,
    '2026-04-10': 3,
    '2026-04-11': 4,
    '2026-04-12': 1
  };

  const seededBookedSlots = {
    '2026-04-03': ['09:00', '10:30'],
    '2026-04-04': ['12:00', '13:30', '15:00'],
    '2026-04-05': ['09:00', '10:30', '12:00', '15:00'],
    '2026-04-07': ['09:00', '10:30', '12:00', '13:30', '15:00']
  };

  const state = {
    currentStep: 'top',
    selectedService: null,
    selectedDate: '',
    selectedTime: '',
    lastBooking: null,
    currentMonthOffset: 0
  };

  const elements = {
    serviceGrid: document.getElementById('service-grid'),
    availabilityLead: document.getElementById('availability-lead'),
    calendarTitle: document.getElementById('calendar-title'),
    calendar: document.getElementById('availability-calendar'),
    calendarPrev: document.getElementById('calendar-prev'),
    calendarNext: document.getElementById('calendar-next'),
    timeSlotsPanel: document.getElementById('time-slots-panel'),
    timeSlotsTitle: document.getElementById('time-slots-title'),
    timeSlotsLead: document.getElementById('time-slots-lead'),
    timeSlotsGrid: document.getElementById('time-slots-grid'),
    selectionSummary: document.getElementById('selection-summary'),
    formSummary: document.getElementById('form-summary'),
    form: document.getElementById('booking-form'),
    dynamicFields: document.getElementById('dynamic-fields'),
    completeTitle: document.getElementById('complete-title'),
    completeMessage: document.getElementById('complete-message'),
    completeSummary: document.getElementById('complete-summary'),
    clearStorage: document.getElementById('clear-storage')
  };

  const bookings = loadBookings();

  renderServices();
  bindCommonActions();
  updateStep('top');
  renderSelectionSummary();

  function loadBookings() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveBookings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }

  function bindCommonActions() {
    document.querySelectorAll('[data-action="back-to-top"]').forEach((button) => {
      button.addEventListener('click', () => updateStep('top'));
    });

    document.querySelectorAll('[data-action="back-to-availability"]').forEach((button) => {
      button.addEventListener('click', () => updateStep('availability'));
    });

    document.querySelectorAll('[data-action="restart"]').forEach((button) => {
      button.addEventListener('click', resetFlow);
    });

    document.querySelectorAll('[data-action="go-top"]').forEach((button) => {
      button.addEventListener('click', () => {
        resetFlow();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    elements.calendarPrev.addEventListener('click', () => {
      if (state.currentMonthOffset > 0) {
        state.currentMonthOffset -= 1;
        renderCalendar();
      }
    });

    elements.calendarNext.addEventListener('click', () => {
      if (state.currentMonthOffset < MAX_MONTH_OFFSET) {
        state.currentMonthOffset += 1;
        renderCalendar();
      }
    });

    elements.form.addEventListener('submit', handleSubmit);

    elements.clearStorage.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      bookings.splice(0, bookings.length);
      renderCalendar();
      renderTimeSlots();
      renderSelectionSummary();
      window.alert('この端末の仮予約データを削除しました。');
    });
  }

  function renderServices() {
    elements.serviceGrid.innerHTML = Object.values(serviceCatalog).map((service) => `
      <article class="service-card" data-service="${service.id}">
        <p class="service-card__tag">${service.tag}</p>
        <h3>${service.cardTitle || service.name}</h3>
        <p class="service-card__lead">${service.lead}</p>
        ${service.description ? `<p class="service-card__description">${service.description}</p>` : ''}
        <div class="service-card__meta">${service.meta.map((item) => `<p>${item}</p>`).join('')}</div>
        <div class="service-card__actions">
          <button class="btn btn-primary btn-lg" type="button" data-select-service="${service.id}">空き状況を見る</button>
        </div>
      </article>
    `).join('');

    elements.serviceGrid.querySelectorAll('[data-select-service]').forEach((button) => {
      button.addEventListener('click', () => selectService(button.getAttribute('data-select-service')));
    });
  }

  function selectService(serviceId) {
    state.selectedService = serviceId;
    state.selectedDate = '';
    state.selectedTime = '';
    state.lastBooking = null;
    state.currentMonthOffset = 0;
    elements.form.reset();
    renderCalendar();
    renderTimeSlots();
    renderSelectionSummary();
    updateStep('availability');
  }

  function renderCalendar() {
    const service = serviceCatalog[state.selectedService];
    if (!service) return;

    const monthDate = addMonths(startOfMonth(START_DATE), state.currentMonthOffset);
    elements.availabilityLead.textContent = `${service.name}の空き状況です。まず日程を選ぶと、その日だけの時間枠が表示されます。`;
    elements.calendarTitle.textContent = formatMonthTitle(monthDate);
    elements.calendarPrev.disabled = state.currentMonthOffset === 0;
    elements.calendarNext.disabled = state.currentMonthOffset === MAX_MONTH_OFFSET;

    const monthCells = buildCalendarCells(monthDate);
    elements.calendar.innerHTML = monthCells.map((cell) => {
      if (cell.type === 'empty') {
        return '<div class="calendar-day--empty"></div>';
      }

      const disabled = cell.isPast || cell.count >= MAX_BOOKINGS_PER_DAY;
      const selected = state.selectedDate === cell.dateString;

      return `
        <button
          class="calendar-day ${selected ? 'is-selected' : ''} ${cell.count >= MAX_BOOKINGS_PER_DAY ? 'is-full' : ''}"
          type="button"
          data-date="${cell.dateString}"
          ${disabled ? 'disabled' : ''}
        >
          <span class="calendar-day__number">${cell.day}</span>
          <span class="calendar-day__status ${statusClass(cell.count)}">${statusLabel(cell.count)}</span>
        </button>
      `;
    }).join('');

    elements.calendar.querySelectorAll('.calendar-day[data-date]').forEach((button) => {
      button.addEventListener('click', () => {
        state.selectedDate = button.getAttribute('data-date') || '';
        state.selectedTime = '';
        renderCalendar();
        renderTimeSlots();
        renderSelectionSummary();
      });
    });
  }

  function buildCalendarCells(monthDate) {
    const firstDay = startOfMonth(monthDate);
    const lastDay = endOfMonth(monthDate);
    const cells = [];

    for (let index = 0; index < firstDay.getDay(); index += 1) {
      cells.push({ type: 'empty' });
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      const current = new Date(firstDay.getFullYear(), firstDay.getMonth(), day);
      if (current < START_DATE) {
        cells.push({
          type: 'day',
          day,
          dateString: formatDateKey(current),
          count: MAX_BOOKINGS_PER_DAY,
          isPast: true
        });
        continue;
      }

      cells.push({
        type: 'day',
        day,
        dateString: formatDateKey(current),
        count: getDailyCount(formatDateKey(current)),
        isPast: false
      });
    }

    return cells;
  }

  function renderTimeSlots() {
    if (!state.selectedDate) {
      elements.timeSlotsPanel.classList.add('is-hidden');
      elements.timeSlotsGrid.innerHTML = '';
      return;
    }

    elements.timeSlotsPanel.classList.remove('is-hidden');
    elements.timeSlotsTitle.textContent = `${formatDisplayDate(state.selectedDate)} の時間を選ぶ`;
    elements.timeSlotsLead.textContent = '空いている時間だけ押せます。時間を選ぶと予約フォームへ進みます。';

    elements.timeSlotsGrid.innerHTML = TIME_SLOTS.map((time) => {
      const disabled = isSlotDisabled(state.selectedDate, time);
      return `
        <button class="slot-button" type="button" data-time="${time}" ${disabled ? 'disabled' : ''}>
          <strong>${time}</strong>
          <small>${disabled ? 'この時間は埋まっています' : 'この時間で予約する'}</small>
        </button>
      `;
    }).join('');

    elements.timeSlotsGrid.querySelectorAll('.slot-button[data-time]').forEach((button) => {
      button.addEventListener('click', () => {
        state.selectedTime = button.getAttribute('data-time') || '';
        prepareForm();
        updateStep('form');
      });
    });
  }

  function getDailyCount(dateString) {
    const savedCount = bookings.filter((booking) => booking.date === dateString && booking.status !== 'cancelled').length;
    const baseCount = typeof seededDailyCounts[dateString] === 'number' ? seededDailyCounts[dateString] : createDummyDailyCount(dateString);
    return Math.min(MAX_BOOKINGS_PER_DAY, baseCount + savedCount);
  }

  function createDummyDailyCount(dateString) {
    const numeric = Number(dateString.replaceAll('-', ''));
    return numeric % 6;
  }

  function isSlotDisabled(dateString, time) {
    const bookedTimes = new Set([...(seededBookedSlots[dateString] || []), ...bookings.filter((booking) => booking.date === dateString).map((booking) => booking.time)]);
    return bookedTimes.has(time) || getDailyCount(dateString) >= MAX_BOOKINGS_PER_DAY;
  }

  function prepareForm() {
    const service = serviceCatalog[state.selectedService];
    if (!service) return;

    elements.form.elements.date.value = state.selectedDate;
    elements.form.elements.time.value = state.selectedTime;
    renderFormSummary(service);
    renderDynamicFields(service);
    renderSelectionSummary();
  }

  function renderFormSummary(service) {
    elements.formSummary.innerHTML = `
      <div class="summary-pill"><span>Service</span><strong>${service.name}</strong></div>
      <div class="summary-pill"><span>Date</span><strong>${formatDisplayDate(state.selectedDate)}</strong></div>
      <div class="summary-pill"><span>Time</span><strong>${state.selectedTime}</strong></div>
    `;
  }

  function renderDynamicFields(service) {
    elements.dynamicFields.innerHTML = `
      <div class="subfields-grid">
        ${service.extraFields.map((field) => renderField(field, service)).join('')}
      </div>
    `;
  }

  function renderField(field, service) {
    if (field.type === 'radio') {
      return `
        <fieldset class="subfields field--full">
          <legend>${field.label}</legend>
          <div class="radio-grid">
            ${service.plans.map((plan) => `
              <label class="radio-card">
                <input type="radio" name="${field.name}" value="${plan.id}" ${field.required ? 'required' : ''} />
                <span>
                  <strong>${plan.name} / ${plan.price} / ${plan.duration}</strong>
                  <small>${plan.note}</small>
                </span>
              </label>
            `).join('')}
          </div>
        </fieldset>
      `;
    }

    if (field.type === 'select') {
      return `
        <label class="field">
          <span>${field.label}</span>
          <select name="${field.name}" ${field.required ? 'required' : ''}>
            <option value="">選択してください</option>
            ${field.options.map((option) => `<option value="${option}">${option}</option>`).join('')}
          </select>
        </label>
      `;
    }

    if (field.type === 'textarea') {
      return `
        <label class="field field--full">
          <span>${field.label}</span>
          <textarea name="${field.name}" rows="4" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}></textarea>
        </label>
      `;
    }

    return `
      <label class="field">
        <span>${field.label}</span>
        <input name="${field.name}" type="text" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} />
      </label>
    `;
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!state.selectedService || !state.selectedDate || !state.selectedTime) {
      window.alert('先にカテゴリ、日程、時間を選んでください。');
      updateStep('availability');
      return;
    }

    if (!elements.form.reportValidity()) return;

    const formData = new FormData(elements.form);
    const raw = Object.fromEntries(formData.entries());
    const selectedPlan = serviceCatalog[state.selectedService].plans.find((plan) => plan.id === raw.planId);

    const booking = {
      id: `booking-${Date.now()}`,
      status: state.selectedService === 'rickshaw' ? 'confirmed' : 'requested',
      serviceType: state.selectedService,
      serviceName: serviceCatalog[state.selectedService].name,
      planId: raw.planId,
      planName: selectedPlan ? selectedPlan.name : '',
      date: raw.date,
      time: raw.time,
      guests: raw.guests,
      purpose: raw.purpose,
      notes: raw.notes || '',
      customer: {
        name: raw.name,
        phone: raw.phone,
        lineContact: raw.lineContact
      },
      details: collectServiceDetails(raw),
      createdAt: new Date().toISOString()
    };

    bookings.push(booking);
    saveBookings();
    state.lastBooking = booking;
    renderCompletion();
    renderSelectionSummary();
    updateStep('complete');
  }

  function collectServiceDetails(raw) {
    const details = {};
    Object.keys(raw).forEach((key) => {
      if (!['name', 'phone', 'lineContact', 'date', 'time', 'guests', 'purpose', 'notes'].includes(key)) {
        details[key] = raw[key];
      }
    });
    return details;
  }

  function renderCompletion() {
    const service = serviceCatalog[state.lastBooking.serviceType];
    elements.completeTitle.textContent = service.completionTitle;
    elements.completeMessage.textContent = service.completionMessage;
    elements.completeSummary.innerHTML = `
      <div>
        <strong>${state.lastBooking.serviceName}</strong>
        <p>${state.lastBooking.planName}</p>
      </div>
      <div>
        <strong>${formatDisplayDate(state.lastBooking.date)} / ${state.lastBooking.time}</strong>
        <p>${state.lastBooking.customer.name} 様 / ${state.lastBooking.guests}名 / ${state.lastBooking.customer.lineContact}</p>
      </div>
      <div>
        <strong>保存データ</strong>
        <p>serviceType, planId, date, time, customer, details, status をローカル保存しています。</p>
      </div>
    `;
  }

  function renderSelectionSummary() {
    const service = state.selectedService ? serviceCatalog[state.selectedService] : null;
    if (!service) {
      elements.selectionSummary.innerHTML = '<p class="selection-summary__empty">カテゴリを選ぶと、ここに内容が表示されます。</p>';
      return;
    }

    const blocks = [{ label: 'Service', title: service.name, body: service.lead.replaceAll('<br>', ' ') }];

    if (state.selectedDate) {
      blocks.push({ label: 'Date', title: formatDisplayDate(state.selectedDate), body: '選択中の日程' });
    } else {
      blocks.push({ label: 'Date', title: '日程を選択', body: 'まずはカレンダーから日付を選びます。' });
    }

    if (state.selectedTime) {
      blocks.push({ label: 'Time', title: state.selectedTime, body: '選択中の時間帯' });
    } else if (state.selectedDate) {
      blocks.push({ label: 'Time', title: '時間を選択', body: '日付を選ぶと、その日の時間枠が表示されます。' });
    }

    if (state.lastBooking) {
      blocks.push({ label: 'Saved', title: state.lastBooking.planName, body: `${state.lastBooking.customer.name} 様で仮保存済み` });
    }

    elements.selectionSummary.innerHTML = blocks.map((block) => `
      <div class="selection-block">
        <span>${block.label}</span>
        <strong>${block.title}</strong>
        <p>${block.body}</p>
      </div>
    `).join('');
  }

  function updateStep(step) {
    state.currentStep = step;
    document.querySelectorAll('.booking-step').forEach((section) => {
      section.classList.toggle('is-hidden', section.getAttribute('data-step') !== step);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetFlow() {
    state.currentStep = 'top';
    state.selectedService = null;
    state.selectedDate = '';
    state.selectedTime = '';
    state.lastBooking = null;
    state.currentMonthOffset = 0;
    elements.form.reset();
    elements.dynamicFields.innerHTML = '';
    elements.formSummary.innerHTML = '';
    renderSelectionSummary();
    updateStep('top');
  }

  function createLocalDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function endOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  function addMonths(date, months) {
    return new Date(date.getFullYear(), date.getMonth() + months, 1);
  }

  function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDisplayDate(dateString) {
    if (!dateString) return '未選択';
    const date = createLocalDate(dateString);
    return new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' }).format(date);
  }

  function formatMonthTitle(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  }

  function statusLabel(count) {
    if (count >= MAX_BOOKINGS_PER_DAY) return '×';
    if (count === MAX_BOOKINGS_PER_DAY - 1) return '△';
    return '〇';
  }

  function statusClass(count) {
    if (count >= MAX_BOOKINGS_PER_DAY) return 'status-badge--full';
    if (count === MAX_BOOKINGS_PER_DAY - 1) return 'status-badge--few';
    return 'status-badge--open';
  }
});
