document.addEventListener('DOMContentLoaded', () => {
  const TIME_SLOTS = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'];
  const START_DATE = createStartDate();
  const MAX_MONTH_OFFSET = 5;
  const BOOKING_API_URL = (window.MAKOTOYA_BOOKING_API_URL || '').trim();
  const AVAILABILITY_API_BASE_URL = 'https://tonagira0374-spec-makotoya-site.vercel.app/api/availability';

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
        { id: 'rickshaw-undecided', name: '未定', price: '', duration: '', note: 'コースは当日または事前のご相談で決めたい方向け。' },
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
        { type: 'select', name: 'rainOption', label: '雨天対応', required: true, options: ['日程変更を希望', '雨ならキャンセル希望', '相談して決めたい'] }
      ]
    }
  };

  const state = {
    currentStep: 'top',
    selectedService: null,
    selectedDate: '',
    selectedTime: '',
    lastBooking: null,
    currentMonthOffset: 0,
    selectedPlanId: '',
    availabilityByMonth: {},
    availabilityLoading: false,
    availabilityError: '',
    activeAvailabilityMonthKey: ''
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
    submitButton: document.getElementById('booking-submit'),
    formStatus: document.getElementById('form-status'),
    dynamicFields: document.getElementById('dynamic-fields'),
    completeTitle: document.getElementById('complete-title'),
    completeMessage: document.getElementById('complete-message'),
    completeSummary: document.getElementById('complete-summary')
  };

  renderServices();
  bindCommonActions();
  updateStep('top');
  renderSelectionSummary();

  function bindCommonActions() {
    document.querySelectorAll('[data-action="back-to-top"]').forEach((button) => {
      button.addEventListener('click', () => updateStep('top'));
    });

    document.querySelectorAll('[data-action="back-to-availability"]').forEach((button) => {
      button.addEventListener('click', () => {
        renderCalendar();
        renderTimeSlots();
        updateStep('availability');
      });
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
    state.selectedPlanId = '';
    elements.form.reset();
    if (elements.formStatus) {
      elements.formStatus.textContent = '';
    }
    renderCalendar();
    renderTimeSlots();
    renderSelectionSummary();
    updateStep('availability');
  }

  async function renderCalendar() {
    const service = serviceCatalog[state.selectedService];
    if (!service) return;

    const monthDate = addMonths(startOfMonth(START_DATE), state.currentMonthOffset);
    const monthKey = getAvailabilityMonthKey(monthDate);

    elements.availabilityLead.textContent = `${service.name}の空き状況です。まず日程を選ぶと、その日だけの時間枠が表示されます。`;
    elements.calendarTitle.textContent = formatMonthTitle(monthDate);
    elements.calendarPrev.disabled = state.currentMonthOffset === 0;
    elements.calendarNext.disabled = state.currentMonthOffset === MAX_MONTH_OFFSET;
    state.activeAvailabilityMonthKey = monthKey;
    state.availabilityLoading = true;
    state.availabilityError = '';

    renderCalendarStatus(buildCalendarCells(monthDate), null);

    try {
      const availability = await loadAvailabilityForMonth(monthDate);
      if (state.activeAvailabilityMonthKey !== monthKey) return;

      state.availabilityLoading = false;
      applyAvailabilityToUI(monthDate, availability);
    } catch {
      if (state.activeAvailabilityMonthKey !== monthKey) return;

      state.availabilityLoading = false;
      state.availabilityError = '空き状況の取得に失敗しました。時間をおいて再度お試しください。';
      applyAvailabilityToUI(monthDate, null);
    }
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
          isPast: true
        });
        continue;
      }

      cells.push({
        type: 'day',
        day,
        dateString: formatDateKey(current),
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

    const availability = getAvailabilityEntry(state.selectedDate);
    elements.timeSlotsPanel.classList.remove('is-hidden');
    elements.timeSlotsTitle.textContent = `${formatDisplayDate(state.selectedDate)} の時間を選ぶ`;
    elements.timeSlotsLead.textContent = state.availabilityError
      ? state.availabilityError
      : '空いている時間だけ押せます。時間を選ぶと予約フォームへ進みます。';

    elements.timeSlotsGrid.innerHTML = TIME_SLOTS.map((time) => {
      const disabled = state.availabilityLoading || !availability || !availability.slots.includes(time);
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

  function getAvailabilityMonthKey(monthDate) {
    return `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}-${getSelectedAvailabilityPlan()}`;
  }

  function getSelectedAvailabilityPlan() {
    if (!state.selectedPlanId) {
      return '6000';
    }

    return mapPlanIdToAvailabilityPlan(state.selectedPlanId);
  }

  function mapPlanIdToAvailabilityPlan(planId) {
    const availabilityPlanMap = {
      'rickshaw-yukkuri': '3000',
      'rickshaw-river': '4000',
      'rickshaw-full': '6000',
      'rickshaw-undecided': '6000'
    };

    return availabilityPlanMap[planId] || '6000';
  }

  async function loadAvailabilityForMonth(monthDate) {
    const monthKey = getAvailabilityMonthKey(monthDate);
    if (state.availabilityByMonth[monthKey]) {
      return state.availabilityByMonth[monthKey];
    }

    const availability = await fetchAvailability(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      getSelectedAvailabilityPlan()
    );

    state.availabilityByMonth[monthKey] = availability;
    return availability;
  }

  async function fetchAvailability(year, month, plan) {
    const url = new URL(AVAILABILITY_API_BASE_URL);
    url.searchParams.set('year', String(year));
    url.searchParams.set('month', String(month));
    url.searchParams.set('plan', plan || '6000');
    url.searchParams.set('_ts', String(Date.now()));

    const response = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch availability');
    }

    return response.json();
  }

  function applyAvailabilityToUI(monthDate, availability) {
    renderCalendarStatus(buildCalendarCells(monthDate), availability);

    if (state.selectedDate) {
      const selectedEntry = getAvailabilityEntry(state.selectedDate, availability);
      if (!selectedEntry || selectedEntry.status === 'cross') {
        state.selectedDate = '';
        state.selectedTime = '';
      }
    }

    if (state.availabilityError) {
      elements.availabilityLead.textContent = state.availabilityError;
    }

    renderTimeSlots();
    renderSelectionSummary();
  }

  function renderCalendarStatus(monthCells, availability) {
    elements.calendar.innerHTML = monthCells.map((cell) => {
      if (cell.type === 'empty') {
        return '<div class="calendar-day--empty"></div>';
      }

      const entry = getAvailabilityEntry(cell.dateString, availability);
      const isCross = cell.isPast || (entry && entry.status === 'cross');
      const isDisabled = cell.isPast || state.availabilityLoading || (entry && entry.status === 'cross');
      const selected = state.selectedDate === cell.dateString;
      const label = cell.isPast ? '×' : state.availabilityLoading ? '...' : getStatusLabel(entry);
      const statusClassName = cell.isPast ? 'status-badge--full' : getStatusClass(entry);

      return `
        <button
          class="calendar-day ${selected ? 'is-selected' : ''} ${isCross ? 'is-full' : ''}"
          type="button"
          data-date="${cell.dateString}"
          ${isDisabled ? 'disabled' : ''}
        >
          <span class="calendar-day__number">${cell.day}</span>
          <span class="calendar-day__status ${statusClassName}">${label}</span>
        </button>
      `;
    }).join('');

    elements.calendar.querySelectorAll('.calendar-day[data-date]').forEach((button) => {
      button.addEventListener('click', () => {
        state.selectedDate = button.getAttribute('data-date') || '';
        state.selectedTime = '';
        renderCalendarStatus(buildCalendarCells(addMonths(startOfMonth(START_DATE), state.currentMonthOffset)), getCurrentAvailability());
        renderTimeSlots();
        renderSelectionSummary();
      });
    });
  }

  function getCurrentAvailability() {
    return state.availabilityByMonth[getAvailabilityMonthKey(addMonths(startOfMonth(START_DATE), state.currentMonthOffset))] || null;
  }

  function getAvailabilityEntry(dateString, availability = getCurrentAvailability()) {
    if (!availability || !availability[dateString]) {
      return {
        status: 'cross',
        count: 0,
        slots: []
      };
    }

    return availability[dateString];
  }

  function getStatusLabel(entry) {
    if (!entry) return '×';
    if (entry.status === 'circle') return '〇';
    if (entry.status === 'triangle') return '△';
    return '×';
  }

  function getStatusClass(entry) {
    if (!entry) return 'status-badge--full';
    if (entry.status === 'circle') return 'status-badge--open';
    if (entry.status === 'triangle') return 'status-badge--few';
    return 'status-badge--full';
  }

  function prepareForm() {
    const service = serviceCatalog[state.selectedService];
    if (!service) return;

    elements.form.elements.date.value = state.selectedDate;
    elements.form.elements.time.value = state.selectedTime;
    if (elements.formStatus) {
      elements.formStatus.textContent = '';
    }
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

    elements.dynamicFields.querySelectorAll('input[name="planId"]').forEach((input) => {
      input.addEventListener('change', (event) => {
        state.selectedPlanId = event.target.value;
      });
    });
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

  async function handleSubmit(event) {
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
    const bookingPayload = buildBookPayload(raw, selectedPlan);

    const booking = {
      id: '',
      status: 'confirmed',
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

    setSubmittingState(true);
    elements.formStatus.textContent = '送信中です。しばらくお待ちください。';

    try {
      const payload = await submitBookingRequest(bookingPayload);

      booking.id = payload.reservationId || '';
      state.lastBooking = booking;
      await refreshCurrentAvailability();
      renderCompletion();
      renderSelectionSummary();
      updateStep('complete');
    } catch (error) {
      const message = error instanceof Error ? error.message : '予約の送信に失敗しました。';
      elements.formStatus.textContent = message;
      window.alert(message);
    } finally {
      setSubmittingState(false);
    }
  }

  async function submitBookingRequest(payload) {
    if (!BOOKING_API_URL || BOOKING_API_URL.includes('your-vercel-project')) {
      throw new Error('予約APIの接続先が設定されていません。');
    }

    const response = await fetch(BOOKING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.error || '予約の送信に失敗しました。時間をおいて再度お試しください。');
    }

    if (!data?.ok && !data?.success) {
      throw new Error(data?.error || '予約の確定に失敗しました。');
    }

    return data;
  }

  function buildBookPayload(raw, selectedPlan) {
    return {
      date: raw.date,
      time: raw.time,
      plan: getBookPlanValue(raw.planId),
      name: raw.name,
      phone: raw.phone,
      people: Number(raw.guests),
      note: buildBookingNote(raw, selectedPlan)
    };
  }

  function getBookPlanValue(planId) {
    if (state.selectedService === 'photo' || state.selectedService === 'movie') {
      return '前撮り';
    }

    const bookPlanMap = {
      'rickshaw-yukkuri': 3000,
      'rickshaw-river': 4000,
      'rickshaw-full': 6000,
      'rickshaw-undecided': 6000
    };

    return bookPlanMap[planId] || 6000;
  }

  function buildBookingNote(raw, selectedPlan) {
    return [
      selectedPlan ? `プラン: ${selectedPlan.name}` : '',
      raw.purpose ? `利用目的: ${raw.purpose}` : '',
      raw.lineContact ? `LINE: ${raw.lineContact}` : '',
      raw.notes || ''
    ].filter(Boolean).join(' / ');
  }

  async function refreshCurrentAvailability() {
    const monthDate = addMonths(startOfMonth(START_DATE), state.currentMonthOffset);
    const monthKey = getAvailabilityMonthKey(monthDate);
    delete state.availabilityByMonth[monthKey];
    await renderCalendar();
  }

  function setSubmittingState(isSubmitting) {
    if (elements.submitButton) {
      elements.submitButton.disabled = isSubmitting;
      elements.submitButton.textContent = isSubmitting ? '送信中...' : 'この内容で送信する';
    }
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
    elements.completeTitle.textContent = '予約が確定しました';
    elements.completeMessage.textContent = '確認のLINEを送信しました';
    elements.completeSummary.innerHTML = `
      <div>
        <strong>${state.lastBooking.serviceName}</strong>
        <p>${state.lastBooking.planName}</p>
      </div>
      <div>
        <strong>${formatDisplayDate(state.lastBooking.date)} / ${state.lastBooking.time}</strong>
        <p>${state.lastBooking.customer.name} 様 / ${state.lastBooking.guests}名 / ${state.lastBooking.customer.lineContact}</p>
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
    state.selectedPlanId = '';
    state.availabilityLoading = false;
    state.availabilityError = '';
    state.activeAvailabilityMonthKey = '';
    elements.form.reset();
    elements.dynamicFields.innerHTML = '';
    elements.formSummary.innerHTML = '';
    if (elements.formStatus) {
      elements.formStatus.textContent = '';
    }
    setSubmittingState(false);
    renderSelectionSummary();
    updateStep('top');
  }

  function createStartDate() {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
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

});
