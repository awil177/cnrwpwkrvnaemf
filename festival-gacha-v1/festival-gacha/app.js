(() => {
  "use strict";

  const STORAGE_KEY = "festivalPrizeDrawState.v1";
  const TIERS = ["S", "A", "B", "C"];
  const TIER_META = {
    S: { name: "S급", color: "#ffd768", rgb: [255, 215, 104] },
    A: { name: "A급", color: "#c370ff", rgb: [195, 112, 255] },
    B: { name: "B급", color: "#668cff", rgb: [102, 140, 255] },
    C: { name: "C급", color: "#53e8ff", rgb: [83, 232, 255] }
  };

  const DEFAULT_STATE = {
    version: 1,
    settings: {
      title: "대광고 축제 스페셜 드로우",
      subtitle: "버튼을 누르고 오늘의 행운을 확인하세요.",
      pin: "2026",
      sound: true,
      speed: "normal",
      probabilities: { S: 3, A: 12, B: 30, C: 55 }
    },
    items: [
      { id: "demo-s", name: "S급 특별 경품", tier: "S", stock: 1, weight: 1, icon: "🏆", image: "", active: true },
      { id: "demo-a", name: "A급 경품", tier: "A", stock: 3, weight: 1, icon: "🎧", image: "", active: true },
      { id: "demo-b", name: "B급 경품", tier: "B", stock: 8, weight: 1, icon: "🎁", image: "", active: true },
      { id: "demo-c", name: "C급 경품", tier: "C", stock: 20, weight: 1, icon: "🍭", image: "", active: true }
    ],
    history: []
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const uid = () => `${Date.now().toString(36)}-${cryptoRandom().toString(36).slice(2, 10)}`;

  const elements = {
    eventTitle: $("#eventTitle"),
    eventSubtitle: $("#eventSubtitle"),
    remainingCount: $("#remainingCount"),
    drawCount: $("#drawCount"),
    publicOdds: $("#publicOdds"),
    machineStatus: $("#machineStatus"),
    drawButton: $("#drawButton"),
    soundButton: $("#soundButton"),
    fullscreenButton: $("#fullscreenButton"),
    clock: $("#clock"),
    effectLayer: $("#effectLayer"),
    effectCanvas: $("#effectCanvas"),
    tierSignal: $("#tierSignal"),
    resultModal: $("#resultModal"),
    resultGrade: $("#resultGrade"),
    resultMedia: $("#resultMedia"),
    resultName: $("#resultName"),
    resultStock: $("#resultStock"),
    continueButton: $("#continueButton"),
    pinModal: $("#pinModal"),
    pinForm: $("#pinForm"),
    pinInput: $("#pinInput"),
    pinError: $("#pinError"),
    adminPanel: $("#adminPanel"),
    adminClose: $("#adminClose"),
    itemList: $("#itemList"),
    tierSummary: $("#tierSummary"),
    itemForm: $("#itemForm"),
    itemFormTitle: $("#itemFormTitle"),
    editItemId: $("#editItemId"),
    itemName: $("#itemName"),
    itemTier: $("#itemTier"),
    itemStock: $("#itemStock"),
    itemWeight: $("#itemWeight"),
    itemIcon: $("#itemIcon"),
    itemImage: $("#itemImage"),
    itemActive: $("#itemActive"),
    imagePreview: $("#imagePreview"),
    newItemButton: $("#newItemButton"),
    cancelItemButton: $("#cancelItemButton"),
    settingsForm: $("#settingsForm"),
    probS: $("#probS"),
    probA: $("#probA"),
    probB: $("#probB"),
    probC: $("#probC"),
    probabilityTotal: $("#probabilityTotal"),
    settingTitle: $("#settingTitle"),
    settingSubtitle: $("#settingSubtitle"),
    settingPin: $("#settingPin"),
    settingSpeed: $("#settingSpeed"),
    settingSound: $("#settingSound"),
    settingsError: $("#settingsError"),
    historyStats: $("#historyStats"),
    historyList: $("#historyList"),
    undoButton: $("#undoButton"),
    exportButton: $("#exportButton"),
    importButton: $("#importButton"),
    importFile: $("#importFile"),
    clearHistoryButton: $("#clearHistoryButton"),
    factoryResetButton: $("#factoryResetButton"),
    toast: $("#toast"),
    ambientCanvas: $("#ambientCanvas")
  };

  let state = loadState();
  let isDrawing = false;
  let pendingImage = "";
  let toastTimer = null;
  let audioContext = null;

  function cryptoRandom() {
    if (window.crypto?.getRandomValues) {
      const data = new Uint32Array(1);
      window.crypto.getRandomValues(data);
      return data[0] / 4294967296;
    }
    return Math.random();
  }

  function normalizeState(input) {
    const base = clone(DEFAULT_STATE);
    if (!input || typeof input !== "object") return base;

    const output = {
      version: 1,
      settings: {
        ...base.settings,
        ...(input.settings && typeof input.settings === "object" ? input.settings : {}),
        probabilities: { ...base.settings.probabilities, ...(input.settings?.probabilities || {}) }
      },
      items: Array.isArray(input.items) ? input.items : base.items,
      history: Array.isArray(input.history) ? input.history.slice(0, 2000) : []
    };

    output.settings.title = String(output.settings.title || base.settings.title).slice(0, 40);
    output.settings.subtitle = String(output.settings.subtitle || base.settings.subtitle).slice(0, 80);
    output.settings.pin = String(output.settings.pin || base.settings.pin).slice(0, 20);
    if (output.settings.pin.length < 4) output.settings.pin = base.settings.pin;
    output.settings.sound = Boolean(output.settings.sound);
    output.settings.speed = output.settings.speed === "fast" ? "fast" : "normal";

    TIERS.forEach(tier => {
      const value = Number(output.settings.probabilities[tier]);
      output.settings.probabilities[tier] = Number.isFinite(value) ? clamp(value, 0, 100) : base.settings.probabilities[tier];
    });

    output.items = output.items.slice(0, 500).map((item, index) => ({
      id: String(item?.id || `${uid()}-${index}`),
      name: String(item?.name || "이름 없는 경품").slice(0, 40),
      tier: TIERS.includes(item?.tier) ? item.tier : "C",
      stock: clamp(Math.floor(Number(item?.stock) || 0), 0, 99999),
      weight: clamp(Number(item?.weight) || 1, .01, 9999),
      icon: String(item?.icon || "🎁").slice(0, 8),
      image: typeof item?.image === "string" && item.image.startsWith("data:image/") ? item.image : "",
      active: item?.active !== false
    }));

    output.history = output.history.map(entry => ({
      id: String(entry?.id || uid()),
      itemId: String(entry?.itemId || ""),
      itemName: String(entry?.itemName || "삭제된 경품").slice(0, 40),
      tier: TIERS.includes(entry?.tier) ? entry.tier : "C",
      timestamp: Number(entry?.timestamp) || Date.now()
    }));
    return output;
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return normalizeState(saved ? JSON.parse(saved) : DEFAULT_STATE);
    } catch (error) {
      console.warn("설정을 불러오지 못해 기본 설정을 사용합니다.", error);
      return clone(DEFAULT_STATE);
    }
  }

  function saveState({ quiet = false } = {}) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.error(error);
      if (!quiet) showToast("저장 공간이 부족합니다. 상품 이미지를 줄여 주세요.", true);
      return false;
    }
  }

  function showToast(message, isError = false) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.toggle("error", isError);
    elements.toast.classList.add("show");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 2600);
  }

  function setTitle(title) {
    const words = String(title).trim().split(/\s+/).filter(Boolean);
    const splitAt = Math.max(1, Math.ceil(words.length / 2));
    elements.eventTitle.replaceChildren();
    elements.eventTitle.append(document.createTextNode(words.slice(0, splitAt).join(" ")));
    if (words.length > 1) {
      elements.eventTitle.append(document.createElement("br"));
      const em = document.createElement("em");
      em.textContent = words.slice(splitAt).join(" ");
      elements.eventTitle.append(em);
    }
  }

  function getAvailableItems(tier = null) {
    return state.items.filter(item => item.active && item.stock > 0 && (!tier || item.tier === tier));
  }

  function renderPublic() {
    setTitle(state.settings.title);
    document.title = `${state.settings.title} · 경품 추첨`;
    elements.eventSubtitle.textContent = state.settings.subtitle;
    const remaining = state.items.reduce((sum, item) => sum + (item.active ? item.stock : 0), 0);
    elements.remainingCount.textContent = remaining.toLocaleString("ko-KR");
    elements.drawCount.textContent = state.history.length.toLocaleString("ko-KR");
    elements.soundButton.classList.toggle("muted", !state.settings.sound);
    elements.soundButton.title = state.settings.sound ? "소리 끄기" : "소리 켜기";
    elements.soundButton.setAttribute("aria-label", elements.soundButton.title);

    elements.publicOdds.replaceChildren(...TIERS.map(tier => {
      const pill = document.createElement("span");
      pill.className = "odds-pill";
      pill.dataset.tier = tier;
      const grade = document.createElement("b");
      grade.textContent = tier;
      const probability = document.createElement("span");
      probability.textContent = `${formatNumber(state.settings.probabilities[tier])}%`;
      pill.append(grade, probability);
      return pill;
    }));

    const available = TIERS.some(tier => getAvailableItems(tier).length > 0 && state.settings.probabilities[tier] > 0);
    elements.drawButton.disabled = isDrawing || !available;
    elements.machineStatus.textContent = available ? "경품 신호가 감지되었습니다" : "남아 있는 경품이 없습니다";
  }

  function renderAdmin() {
    renderItems();
    renderSettings();
    renderHistory();
  }

  function renderItems() {
    elements.tierSummary.replaceChildren(...TIERS.map(tier => {
      const tierItems = state.items.filter(item => item.tier === tier && item.active);
      const stock = tierItems.reduce((sum, item) => sum + item.stock, 0);
      const card = document.createElement("div");
      card.className = "tier-summary-card";
      card.dataset.tier = tier;
      const label = document.createElement("span");
      label.textContent = `${tier}급 · ${tierItems.length}품목`;
      const value = document.createElement("strong");
      value.textContent = `재고 ${stock.toLocaleString("ko-KR")}개`;
      card.append(label, value);
      return card;
    }));

    if (!state.items.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "등록된 상품이 없습니다. 상품을 추가해 주세요.";
      elements.itemList.replaceChildren(empty);
      return;
    }

    const sorted = [...state.items].sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier));
    elements.itemList.replaceChildren(...sorted.map(item => createItemRow(item)));
  }

  function createItemRow(item) {
    const row = document.createElement("article");
    row.className = `item-row${item.active ? "" : " inactive"}`;
    row.dataset.id = item.id;

    const thumb = document.createElement("div");
    thumb.className = "item-thumb";
    if (item.image) {
      const image = new Image();
      image.src = item.image;
      image.alt = "";
      thumb.append(image);
    } else {
      thumb.textContent = item.icon || "🎁";
    }

    const main = document.createElement("div");
    main.className = "item-main";
    const name = document.createElement("strong");
    name.textContent = item.name;
    const estimate = document.createElement("small");
    estimate.textContent = `현재 예상 당첨률 ${formatNumber(getItemEstimatedProbability(item))}%`;
    main.append(name, estimate);

    const badge = document.createElement("div");
    badge.className = "tier-badge";
    badge.dataset.tier = item.tier;
    badge.textContent = item.tier;

    const stockData = document.createElement("div");
    stockData.className = "item-data";
    const stockLabel = document.createElement("span");
    stockLabel.textContent = "남은 수량";
    const stockControls = document.createElement("div");
    stockControls.className = "stock-controls";
    stockControls.append(
      actionButton("−", "stock-minus", item.id, "재고 1개 감소"),
      Object.assign(document.createElement("strong"), { textContent: String(item.stock) }),
      actionButton("+", "stock-plus", item.id, "재고 1개 증가")
    );
    stockData.append(stockLabel, stockControls);

    const weightData = document.createElement("div");
    weightData.className = "item-data weight-data";
    const weightLabel = document.createElement("span");
    weightLabel.textContent = "품목별 비중";
    const weightValue = document.createElement("strong");
    weightValue.textContent = formatNumber(item.weight);
    weightData.append(weightLabel, weightValue);

    const actions = document.createElement("div");
    actions.className = "row-actions";
    actions.append(
      actionButton(item.active ? "제외" : "포함", "toggle", item.id, item.active ? "추첨에서 제외" : "추첨에 포함"),
      actionButton("수정", "edit", item.id, "상품 수정"),
      actionButton("삭제", "delete", item.id, "상품 삭제", "delete-item")
    );

    row.append(thumb, main, badge, stockData, weightData, actions);
    return row;
  }

  function actionButton(text, action, id, label, extraClass = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.dataset.action = action;
    button.dataset.id = id;
    button.setAttribute("aria-label", label);
    if (extraClass) button.className = extraClass;
    return button;
  }

  function getItemEstimatedProbability(item) {
    if (!item.active || item.stock <= 0) return 0;
    const availableTiers = TIERS.filter(tier => getAvailableItems(tier).length > 0 && state.settings.probabilities[tier] > 0);
    const tierTotal = availableTiers.reduce((sum, tier) => sum + state.settings.probabilities[tier], 0);
    if (!tierTotal || !availableTiers.includes(item.tier)) return 0;
    const tierChance = state.settings.probabilities[item.tier] / tierTotal;
    const itemWeightTotal = getAvailableItems(item.tier).reduce((sum, candidate) => sum + candidate.weight, 0);
    return itemWeightTotal ? tierChance * item.weight / itemWeightTotal * 100 : 0;
  }

  function renderSettings() {
    elements.probS.value = state.settings.probabilities.S;
    elements.probA.value = state.settings.probabilities.A;
    elements.probB.value = state.settings.probabilities.B;
    elements.probC.value = state.settings.probabilities.C;
    elements.settingTitle.value = state.settings.title;
    elements.settingSubtitle.value = state.settings.subtitle;
    elements.settingPin.value = state.settings.pin;
    elements.settingSpeed.value = state.settings.speed;
    elements.settingSound.checked = state.settings.sound;
    updateProbabilityTotal();
  }

  function renderHistory() {
    const counts = Object.fromEntries(TIERS.map(tier => [tier, state.history.filter(entry => entry.tier === tier).length]));
    const totalCard = createHistoryStat("전체 추첨", state.history.length, "ALL");
    elements.historyStats.replaceChildren(totalCard, ...TIERS.map(tier => createHistoryStat(`${tier}급 당첨`, counts[tier], tier)));
    elements.undoButton.disabled = state.history.length === 0;

    if (!state.history.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "아직 추첨 기록이 없습니다.";
      elements.historyList.replaceChildren(empty);
      return;
    }

    elements.historyList.replaceChildren(...state.history.slice(0, 500).map((entry, index) => {
      const row = document.createElement("div");
      row.className = "history-row";
      const badge = document.createElement("div");
      badge.className = "tier-badge";
      badge.dataset.tier = entry.tier;
      badge.textContent = entry.tier;
      const name = document.createElement("strong");
      name.textContent = entry.itemName;
      const number = document.createElement("span");
      number.textContent = `#${state.history.length - index}`;
      const time = document.createElement("time");
      time.dateTime = new Date(entry.timestamp).toISOString();
      time.textContent = new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(entry.timestamp);
      row.append(badge, name, number, time);
      return row;
    }));
  }

  function createHistoryStat(label, value, tier) {
    const card = document.createElement("div");
    card.className = "history-stat";
    const span = document.createElement("span");
    span.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value.toLocaleString("ko-KR");
    if (TIER_META[tier]) strong.style.color = TIER_META[tier].color;
    card.append(span, strong);
    return card;
  }

  function weightedPick(entries, getWeight) {
    const total = entries.reduce((sum, entry) => sum + Math.max(0, Number(getWeight(entry)) || 0), 0);
    if (total <= 0) return null;
    let target = cryptoRandom() * total;
    for (const entry of entries) {
      target -= Math.max(0, Number(getWeight(entry)) || 0);
      if (target < 0) return entry;
    }
    return entries.at(-1) || null;
  }

  function choosePrize() {
    const availableTiers = TIERS.filter(tier => getAvailableItems(tier).length && state.settings.probabilities[tier] > 0);
    const tier = weightedPick(availableTiers, value => state.settings.probabilities[value]);
    if (!tier) return null;
    const item = weightedPick(getAvailableItems(tier), value => value.weight);
    return item ? { tier, item } : null;
  }

  async function startDraw() {
    if (isDrawing) return;
    const selection = choosePrize();
    if (!selection) {
      showToast("추첨 가능한 경품과 확률을 확인해 주세요.", true);
      return;
    }

    isDrawing = true;
    const { item, tier } = selection;
    item.stock -= 1;
    state.history.unshift({ id: uid(), itemId: item.id, itemName: item.name, tier, timestamp: Date.now() });
    saveState();
    renderPublic();

    try {
      await playTierEffect(tier);
      showResult(item);
    } finally {
      isDrawing = false;
      renderPublic();
    }
  }

  function getEffectDuration(tier) {
    const normal = { S: 5200, A: 4600, B: 4000, C: 3450 };
    const fast = { S: 3650, A: 3250, B: 2850, C: 2450 };
    return (state.settings.speed === "fast" ? fast : normal)[tier];
  }

  function playTierEffect(tier, { preview = false } = {}) {
    return new Promise(resolve => {
      const duration = getEffectDuration(tier);
      const layer = elements.effectLayer;
      layer.className = `effect-layer tier-${tier}${preview ? " admin-preview" : ""}`;
      layer.style.setProperty("--effect-duration", `${duration}ms`);
      elements.tierSignal.querySelector("strong").textContent = tier;
      void layer.offsetWidth;
      layer.classList.add("active");
      layer.setAttribute("aria-hidden", "false");
      document.body.classList.add("locked");
      runEffectCanvas(tier, duration);
      playEffectSound(tier, duration);

      window.setTimeout(() => {
        document.body.classList.add("shake");
        window.setTimeout(() => document.body.classList.remove("shake"), 480);
      }, duration * .72);

      window.setTimeout(() => {
        layer.classList.remove("active", "admin-preview");
        layer.setAttribute("aria-hidden", "true");
        document.body.classList.remove("locked");
        resolve();
      }, duration + 120);
    });
  }

  function runEffectCanvas(tier, duration) {
    const canvas = elements.effectCanvas;
    const context = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = rect.width;
    const height = rect.height;
    const cx = width / 2;
    const cy = height / 2;
    const meta = TIER_META[tier];
    const tierPalettes = {
      S: [42, 178, 205, 278, 322],
      A: [190, 232, 272, 318],
      B: [184, 212, 241, 267],
      C: [174, 190, 205]
    };
    const hueShift = { S: 290, A: 190, B: 115, C: 70 }[tier];
    const palette = tierPalettes[tier];
    const showerCounts = { S: 62, A: 48, B: 36, C: 25 };
    const showerMeteors = Array.from({ length: showerCounts[tier] }, (_, index) => ({
      phase: cryptoRandom(),
      speed: .62 + cryptoRandom() * (tier === "S" ? 2.2 : 1.6),
      lane: cryptoRandom(),
      length: 75 + cryptoRandom() * (tier === "S" ? 300 : tier === "A" ? 230 : 170),
      width: .7 + cryptoRandom() * (tier === "S" ? 3.3 : 2.2),
      alpha: .25 + cryptoRandom() * .75,
      hue: palette[index % palette.length] + (cryptoRandom() - .5) * 24,
      colorIndex: index % palette.length,
      twinkle: cryptoRandom() * Math.PI * 2
    }));

    const counts = { S: 280, A: 225, B: 175, C: 112 };
    const particles = Array.from({ length: counts[tier] }, (_, index) => {
      const angle = cryptoRandom() * Math.PI * 2;
      const radius = cryptoRandom() * 18 + 2;
      return {
        angle,
        radius,
        speed: .65 + cryptoRandom() * (tier === "S" ? 4.3 : tier === "A" ? 3.3 : tier === "B" ? 2.7 : 2),
        length: 8 + cryptoRandom() * (tier === "S" ? 90 : tier === "A" ? 65 : 45),
        size: .5 + cryptoRandom() * (tier === "S" ? 3.2 : 2.2),
        alpha: .25 + cryptoRandom() * .75,
        drift: (cryptoRandom() - .5) * .015,
        warm: tier === "S" && index % 4 === 0,
        hue: palette[index % palette.length] + (cryptoRandom() - .5) * 18,
        colorIndex: index % palette.length
      };
    });

    const flashes = Array.from({ length: tier === "S" ? 38 : tier === "A" ? 22 : 8 }, () => ({
      angle: cryptoRandom() * Math.PI * 2,
      radius: 45 + cryptoRandom() * Math.min(width, height) * .42,
      size: 2 + cryptoRandom() * 6,
      phase: cryptoRandom() * Math.PI * 2
    }));
    const start = performance.now();

    function frame(now) {
      const elapsed = now - start;
      const progress = clamp(elapsed / duration, 0, 1);
      context.clearRect(0, 0, width, height);

      const shiftedHue = (palette[1] + progress * hueShift) % 360;
      const bg = context.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * .72);
      bg.addColorStop(0, `hsla(${shiftedHue},92%,58%,${.08 + progress * .1})`);
      bg.addColorStop(.35, `hsla(${(shiftedHue + 65) % 360},90%,35%,.055)`);
      bg.addColorStop(1, "rgba(1,2,8,.5)");
      context.fillStyle = bg;
      context.fillRect(0, 0, width, height);

      drawMeteorShower(context, showerMeteors, width, height, progress, hueShift, tier);

      const accel = 1 + Math.pow(progress, 2.3) * 14;
      const portalFade = clamp((progress - .34) / .42, 0, 1);
      drawPortalParticles(context, particles, palette, width, height, cx, cy, progress, hueShift, accel, portalFade, tier);

      if (tier === "A" || tier === "S") {
        const bolts = tier === "S" ? 7 : 4;
        for (let bolt = 0; bolt < bolts; bolt += 1) {
          const angle = (Math.PI * 2 / bolts) * bolt + progress * .8;
          drawLightning(context, cx, cy, angle, Math.min(width, height) * (.22 + progress * .34), meta.rgb, .18 + progress * .45);
        }
      }

      flashes.forEach((flash, index) => {
        const pulse = Math.max(0, Math.sin(progress * 15 + flash.phase));
        if (pulse < .72) return;
        const angle = flash.angle + progress * (index % 2 ? .3 : -.3);
        const x = cx + Math.cos(angle) * flash.radius;
        const y = cy + Math.sin(angle) * flash.radius;
        context.fillStyle = `rgba(255,255,255,${pulse * .8})`;
        context.fillRect(x - flash.size * 3, y - .6, flash.size * 6, 1.2);
        context.fillRect(x - .6, y - flash.size * 3, 1.2, flash.size * 6);
      });

      if (tier === "S" && progress > .64) drawPrismBurst(context, cx, cy, progress);
      context.globalCompositeOperation = "source-over";
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function drawPortalParticles(context, particles, palette, width, height, cx, cy, progress, hueShift, accel, portalFade, tier) {
    if (portalFade <= 0) return;
    const maxRadius = Math.hypot(width, height) * .58;
    context.save();
    context.globalCompositeOperation = "lighter";
    context.lineCap = "round";

    palette.forEach((baseHue, colorIndex) => {
      context.beginPath();
      for (const particle of particles) {
        if (particle.colorIndex !== colorIndex) continue;
        particle.angle += particle.drift;
        particle.radius += particle.speed * accel;
        if (particle.radius > maxRadius) particle.radius = 3 + cryptoRandom() * 12;
        const cosine = Math.cos(particle.angle);
        const sine = Math.sin(particle.angle);
        const x = cx + cosine * particle.radius;
        const y = cy + sine * particle.radius;
        const backRadius = Math.max(0, particle.radius - particle.length * (1 + progress * 2));
        context.moveTo(cx + cosine * backRadius, cy + sine * backRadius);
        context.lineTo(x, y);
      }

      const hue = (baseHue + progress * hueShift) % 360;
      context.strokeStyle = `hsl(${hue},100%,66%)`;
      context.globalAlpha = portalFade * (tier === "S" ? .2 : .15);
      context.lineWidth = tier === "S" ? 7 : tier === "A" ? 5.5 : 4.5;
      context.stroke();
      context.globalAlpha = portalFade * .88;
      context.lineWidth = tier === "S" ? 1.7 : 1.3;
      context.stroke();
    });

    context.restore();
  }

  function drawMeteorShower(context, meteors, width, height, progress, hueShift, tier) {
    const showerFadeIn = clamp(progress / .12, 0, 1);
    const showerFadeOut = clamp((.8 - progress) / .16, 0, 1);
    const visibility = showerFadeIn * showerFadeOut;
    if (visibility <= 0) return;

    context.save();
    context.globalCompositeOperation = "lighter";
    context.lineCap = "round";
    const bucketCount = Math.max(...meteors.map(meteor => meteor.colorIndex)) + 1;
    for (let colorIndex = 0; colorIndex < bucketCount; colorIndex += 1) {
      const sample = meteors.find(meteor => meteor.colorIndex === colorIndex);
      if (!sample) continue;
      context.beginPath();
      for (const meteor of meteors) {
        if (meteor.colorIndex !== colorIndex) continue;
        const travel = (meteor.phase + progress * meteor.speed * 1.9) % 1;
        const laneOffset = meteor.lane * height * 1.25;
        const x = width * 1.28 - travel * width * 1.72;
        const y = -height * .32 + laneOffset + travel * height * .72;
        context.moveTo(x + meteor.length, y - meteor.length * .46);
        context.lineTo(x, y);
      }
      const hue = (sample.hue + progress * hueShift) % 360;
      context.strokeStyle = `hsl(${hue},100%,70%)`;
      context.globalAlpha = visibility * (tier === "S" ? .17 : .12);
      context.lineWidth = tier === "S" ? 8 : tier === "A" ? 6.5 : 5;
      context.stroke();
      context.globalAlpha = visibility * .82;
      context.lineWidth = tier === "S" ? 1.8 : 1.35;
      context.stroke();
    }
    context.restore();
  }

  function drawLightning(context, cx, cy, angle, length, rgb, alpha) {
    const segments = 10;
    context.beginPath();
    context.moveTo(cx, cy);
    for (let index = 1; index <= segments; index += 1) {
      const distance = length * index / segments;
      const wobble = (cryptoRandom() - .5) * 24 * (index / segments);
      const x = cx + Math.cos(angle) * distance + Math.cos(angle + Math.PI / 2) * wobble;
      const y = cy + Math.sin(angle) * distance + Math.sin(angle + Math.PI / 2) * wobble;
      context.lineTo(x, y);
    }
    context.strokeStyle = `rgba(${rgb.join(",")},${alpha})`;
    context.lineWidth = 1.2;
    context.shadowColor = `rgb(${rgb.join(",")})`;
    context.shadowBlur = 10;
    context.stroke();
    context.shadowBlur = 0;
  }

  function drawPrismBurst(context, cx, cy, progress) {
    const colors = ["#ff617f", "#ffcf5a", "#6cffa4", "#62e7ff", "#9878ff"];
    const intensity = (progress - .64) / .36;
    for (let index = 0; index < 26; index += 1) {
      const angle = index / 26 * Math.PI * 2 + progress * .4;
      const inner = 70 + intensity * 70;
      const outer = inner + 45 + intensity * 240;
      context.strokeStyle = colors[index % colors.length];
      context.globalAlpha = .12 + intensity * .25;
      context.lineWidth = 1 + (index % 3);
      context.beginPath();
      context.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      context.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      context.stroke();
    }
    context.globalAlpha = 1;
  }

  function ensureAudioContext() {
    if (!state.settings.sound) return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContext) audioContext = new AudioCtx();
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
  }

  function playEffectSound(tier, duration) {
    const audio = ensureAudioContext();
    if (!audio) return;
    const start = audio.currentTime;
    const tierIndex = TIERS.indexOf(tier);
    const base = [98, 124, 156, 196][tierIndex];
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = tier === "S" ? "sawtooth" : tier === "A" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(base, start);
    oscillator.frequency.exponentialRampToValueAtTime(base * (tier === "S" ? 13 : 8), start + duration / 1000 * .74);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(tier === "S" ? .09 : .055, start + .12);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration / 1000 * .8);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration / 1000 * .82);

    const impactAt = start + duration / 1000 * .74;
    [1, 1.5, 2].slice(0, tier === "S" ? 3 : tier === "A" ? 2 : 1).forEach((ratio, index) => {
      const note = audio.createOscillator();
      const noteGain = audio.createGain();
      note.type = "sine";
      note.frequency.setValueAtTime(220 * ratio * (tier === "S" ? 1.35 : 1), impactAt);
      noteGain.gain.setValueAtTime(.0001, impactAt);
      noteGain.gain.exponentialRampToValueAtTime(.12 / (index + 1), impactAt + .015);
      noteGain.gain.exponentialRampToValueAtTime(.0001, impactAt + .65);
      note.connect(noteGain).connect(audio.destination);
      note.start(impactAt);
      note.stop(impactAt + .72);
    });
  }

  function showResult(item) {
    elements.resultModal.className = `modal result-modal tier-${item.tier} open`;
    elements.resultModal.setAttribute("aria-hidden", "false");
    elements.resultGrade.textContent = item.tier;
    elements.resultName.textContent = item.name;
    elements.resultStock.textContent = `남은 수량 ${item.stock.toLocaleString("ko-KR")}개`;
    elements.resultMedia.replaceChildren();
    if (item.image) {
      const image = new Image();
      image.src = item.image;
      image.alt = item.name;
      elements.resultMedia.append(image);
    } else {
      const icon = document.createElement("span");
      icon.textContent = item.icon || "🎁";
      elements.resultMedia.append(icon);
    }
    document.body.classList.add("locked");
    window.setTimeout(() => elements.continueButton.focus(), 250);
  }

  function closeResult() {
    elements.resultModal.classList.remove("open");
    elements.resultModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("locked");
    renderPublic();
    elements.drawButton.focus();
  }

  function openPinModal() {
    if (isDrawing || elements.resultModal.classList.contains("open") || elements.adminPanel.classList.contains("open")) return;
    elements.pinError.textContent = "";
    elements.pinInput.value = "";
    elements.pinModal.classList.add("open");
    elements.pinModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("locked");
    window.setTimeout(() => elements.pinInput.focus(), 100);
  }

  function closePinModal() {
    elements.pinModal.classList.remove("open");
    elements.pinModal.setAttribute("aria-hidden", "true");
    if (!elements.adminPanel.classList.contains("open")) document.body.classList.remove("locked");
  }

  function openAdmin() {
    closePinModal();
    renderAdmin();
    switchAdminTab("items");
    elements.adminPanel.classList.add("open");
    elements.adminPanel.setAttribute("aria-hidden", "false");
    document.body.classList.add("locked");
  }

  function closeAdmin() {
    closeItemEditor();
    elements.adminPanel.classList.remove("open");
    elements.adminPanel.setAttribute("aria-hidden", "true");
    document.body.classList.remove("locked");
    renderPublic();
  }

  function switchAdminTab(tab) {
    $$(".admin-tab").forEach(button => button.classList.toggle("active", button.dataset.tab === tab));
    $$(".tab-panel").forEach(panel => panel.classList.toggle("active", panel.dataset.panel === tab));
    if (tab === "history") renderHistory();
  }

  function openItemEditor(item = null) {
    elements.itemForm.classList.remove("hidden");
    elements.editItemId.value = item?.id || "";
    elements.itemFormTitle.textContent = item ? "상품 수정" : "새 상품 추가";
    elements.itemName.value = item?.name || "";
    elements.itemTier.value = item?.tier || "C";
    elements.itemStock.value = item?.stock ?? 1;
    elements.itemWeight.value = item?.weight ?? 1;
    elements.itemIcon.value = item?.icon || "🎁";
    elements.itemActive.checked = item?.active ?? true;
    elements.itemImage.value = "";
    pendingImage = item?.image || "";
    renderImagePreview(pendingImage);
    elements.itemForm.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => elements.itemName.focus(), 250);
  }

  function closeItemEditor() {
    elements.itemForm.classList.add("hidden");
    elements.itemForm.reset();
    elements.editItemId.value = "";
    pendingImage = "";
    renderImagePreview("");
  }

  function renderImagePreview(dataUrl) {
    elements.imagePreview.replaceChildren();
    elements.imagePreview.classList.toggle("visible", Boolean(dataUrl));
    if (dataUrl) {
      const image = new Image();
      image.src = dataUrl;
      image.alt = "상품 이미지 미리보기";
      elements.imagePreview.append(image);
    } else {
      const span = document.createElement("span");
      span.textContent = "미리보기";
      elements.imagePreview.append(span);
    }
  }

  async function compressImage(file) {
    if (!file?.type?.startsWith("image/")) throw new Error("이미지 파일만 선택할 수 있습니다.");
    if (file.size > 12 * 1024 * 1024) throw new Error("이미지는 12MB 이하만 사용할 수 있습니다.");
    const dataUrl = await readFileAsDataURL(file);
    const image = await loadImage(dataUrl);
    const maxSize = 480;
    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/webp", .8);
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("이미지를 처리하지 못했습니다."));
      image.src = src;
    });
  }

  function saveItemFromForm(event) {
    event.preventDefault();
    const id = elements.editItemId.value;
    const payload = {
      name: elements.itemName.value.trim(),
      tier: elements.itemTier.value,
      stock: clamp(Math.floor(Number(elements.itemStock.value)), 0, 99999),
      weight: clamp(Number(elements.itemWeight.value), .01, 9999),
      icon: elements.itemIcon.value.trim().slice(0, 8) || "🎁",
      image: pendingImage,
      active: elements.itemActive.checked
    };
    if (!payload.name || !TIERS.includes(payload.tier) || !Number.isFinite(payload.stock) || !Number.isFinite(payload.weight)) {
      showToast("상품 정보를 올바르게 입력해 주세요.", true);
      return;
    }

    if (id) {
      const item = state.items.find(candidate => candidate.id === id);
      if (!item) return;
      Object.assign(item, payload);
    } else {
      state.items.push({ id: uid(), ...payload });
    }

    if (!saveState()) return;
    closeItemEditor();
    renderItems();
    renderPublic();
    showToast(id ? "상품을 수정했습니다." : "상품을 추가했습니다.");
  }

  function handleItemAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const item = state.items.find(candidate => candidate.id === button.dataset.id);
    if (!item) return;
    const action = button.dataset.action;

    if (action === "stock-minus") item.stock = Math.max(0, item.stock - 1);
    if (action === "stock-plus") item.stock = Math.min(99999, item.stock + 1);
    if (action === "toggle") item.active = !item.active;
    if (action === "edit") {
      openItemEditor(item);
      return;
    }
    if (action === "delete") {
      if (!window.confirm(`\"${item.name}\" 상품을 삭제할까요?\n기존 추첨 기록은 유지됩니다.`)) return;
      state.items = state.items.filter(candidate => candidate.id !== item.id);
      if (elements.editItemId.value === item.id) closeItemEditor();
    }
    saveState();
    renderItems();
    renderPublic();
  }

  function updateProbabilityTotal() {
    const total = [elements.probS, elements.probA, elements.probB, elements.probC]
      .reduce((sum, input) => sum + (Number(input.value) || 0), 0);
    elements.probabilityTotal.textContent = `${formatNumber(total)}%`;
    elements.probabilityTotal.classList.toggle("invalid", Math.abs(total - 100) > .001);
    return total;
  }

  function saveSettings(event) {
    event.preventDefault();
    const total = updateProbabilityTotal();
    elements.settingsError.textContent = "";
    if (Math.abs(total - 100) > .001) {
      elements.settingsError.textContent = `확률 합계를 100%로 맞춰 주세요. 현재 ${formatNumber(total)}%입니다.`;
      return;
    }
    const title = elements.settingTitle.value.trim();
    const subtitle = elements.settingSubtitle.value.trim();
    const pin = elements.settingPin.value.trim();
    if (!title || !subtitle || pin.length < 4) {
      elements.settingsError.textContent = "제목·안내 문구와 4자리 이상의 PIN을 입력해 주세요.";
      return;
    }
    const probabilities = {
      S: clamp(Number(elements.probS.value), 0, 100),
      A: clamp(Number(elements.probA.value), 0, 100),
      B: clamp(Number(elements.probB.value), 0, 100),
      C: clamp(Number(elements.probC.value), 0, 100)
    };
    if (Object.values(probabilities).some(value => !Number.isFinite(value))) {
      elements.settingsError.textContent = "확률은 숫자로 입력해 주세요.";
      return;
    }
    state.settings = {
      ...state.settings,
      title,
      subtitle,
      pin,
      speed: elements.settingSpeed.value === "fast" ? "fast" : "normal",
      sound: elements.settingSound.checked,
      probabilities
    };
    saveState();
    renderPublic();
    renderItems();
    showToast("확률과 화면 설정을 저장했습니다.");
  }

  function undoLastDraw() {
    const entry = state.history[0];
    if (!entry) return;
    if (!window.confirm(`마지막 추첨 \"${entry.itemName}\"을 취소하고 재고를 복구할까요?`)) return;
    const item = state.items.find(candidate => candidate.id === entry.itemId);
    if (item) item.stock = Math.min(99999, item.stock + 1);
    state.history.shift();
    saveState();
    renderAdmin();
    renderPublic();
    showToast(item ? "마지막 추첨을 취소하고 재고를 복구했습니다." : "기록을 취소했습니다. 삭제된 상품은 복구할 수 없습니다.");
  }

  function exportBackup() {
    const date = new Date();
    const stamp = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("");
    const time = [String(date.getHours()).padStart(2, "0"), String(date.getMinutes()).padStart(2, "0")].join("");
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `festival-draw-backup-${stamp}-${time}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("백업 파일을 저장했습니다.");
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.items) || !parsed.settings) throw new Error("올바른 백업 파일이 아닙니다.");
      const normalized = normalizeState(parsed);
      const total = TIERS.reduce((sum, tier) => sum + normalized.settings.probabilities[tier], 0);
      if (Math.abs(total - 100) > .001) throw new Error("백업 파일의 등급 확률 합계가 100%가 아닙니다.");
      if (!window.confirm("현재 설정을 백업 파일의 내용으로 교체할까요?")) return;
      state = normalized;
      saveState();
      closeItemEditor();
      renderAdmin();
      renderPublic();
      showToast("백업을 불러왔습니다.");
    } catch (error) {
      showToast(error.message || "백업 파일을 불러오지 못했습니다.", true);
    }
  }

  function clearHistory() {
    if (!state.history.length) return showToast("삭제할 추첨 기록이 없습니다.");
    if (!window.confirm("모든 추첨 기록을 삭제할까요?\n상품 재고는 변경되지 않습니다.")) return;
    state.history = [];
    saveState();
    renderHistory();
    renderPublic();
    showToast("추첨 기록을 삭제했습니다.");
  }

  function factoryReset() {
    const confirmed = window.confirm("상품·확률·기록을 모두 처음 상태로 되돌릴까요?\n이 작업은 되돌릴 수 없습니다.");
    if (!confirmed) return;
    const second = window.confirm("정말 전체 초기화할까요? 필요한 경우 먼저 백업 파일을 저장하세요.");
    if (!second) return;
    state = clone(DEFAULT_STATE);
    saveState();
    closeItemEditor();
    renderAdmin();
    renderPublic();
    showToast("전체 설정을 초기화했습니다.");
  }

  function formatNumber(value) {
    return Number(value.toFixed(2)).toLocaleString("ko-KR", { maximumFractionDigits: 2 });
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => showToast("브라우저에서 전체 화면을 허용해 주세요.", true));
    } else {
      document.exitFullscreen?.();
    }
  }

  function toggleSound() {
    state.settings.sound = !state.settings.sound;
    saveState({ quiet: true });
    renderPublic();
    if (state.settings.sound) {
      const audio = ensureAudioContext();
      if (audio) playClickTone(audio);
    }
    showToast(state.settings.sound ? "사운드를 켰습니다." : "사운드를 껐습니다.");
  }

  function playClickTone(audio) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(520, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(820, audio.currentTime + .1);
    gain.gain.setValueAtTime(.06, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + .14);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + .15);
  }

  function updateClock() {
    elements.clock.textContent = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());
  }

  function startAmbientCanvas() {
    const canvas = elements.ambientCanvas;
    const context = canvas.getContext("2d");
    let points = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      points = Array.from({ length: Math.min(80, Math.floor(window.innerWidth / 18)) }, () => ({
        x: cryptoRandom() * window.innerWidth,
        y: cryptoRandom() * window.innerHeight,
        size: cryptoRandom() * 1.4 + .2,
        speed: cryptoRandom() * .12 + .025,
        alpha: cryptoRandom() * .55 + .1
      }));
    }

    function frame() {
      if (elements.effectLayer.classList.contains("active")) {
        requestAnimationFrame(frame);
        return;
      }
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const point of points) {
        point.y -= point.speed;
        if (point.y < -3) {
          point.y = window.innerHeight + 3;
          point.x = cryptoRandom() * window.innerWidth;
        }
        context.fillStyle = `rgba(134,229,255,${point.alpha})`;
        context.fillRect(point.x, point.y, point.size, point.size);
      }
      requestAnimationFrame(frame);
    }

    window.addEventListener("resize", resize);
    resize();
    requestAnimationFrame(frame);
  }

  function bindEvents() {
    elements.drawButton.addEventListener("click", startDraw);
    elements.continueButton.addEventListener("click", closeResult);
    elements.soundButton.addEventListener("click", toggleSound);
    elements.fullscreenButton.addEventListener("click", toggleFullscreen);
    elements.pinForm.addEventListener("submit", event => {
      event.preventDefault();
      if (elements.pinInput.value === state.settings.pin) openAdmin();
      else {
        elements.pinError.textContent = "PIN이 올바르지 않습니다.";
        elements.pinInput.select();
      }
    });
    $$('[data-close="pin"]').forEach(element => element.addEventListener("click", closePinModal));
    elements.adminClose.addEventListener("click", closeAdmin);
    $$(".admin-tab").forEach(button => button.addEventListener("click", () => switchAdminTab(button.dataset.tab)));
    elements.newItemButton.addEventListener("click", () => openItemEditor());
    elements.cancelItemButton.addEventListener("click", closeItemEditor);
    elements.itemForm.addEventListener("submit", saveItemFromForm);
    elements.itemList.addEventListener("click", handleItemAction);
    elements.itemImage.addEventListener("change", async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        pendingImage = await compressImage(file);
        renderImagePreview(pendingImage);
      } catch (error) {
        event.target.value = "";
        showToast(error.message, true);
      }
    });
    [elements.probS, elements.probA, elements.probB, elements.probC].forEach(input => input.addEventListener("input", updateProbabilityTotal));
    elements.settingsForm.addEventListener("submit", saveSettings);
    $$('[data-preview-tier]').forEach(button => button.addEventListener("click", async () => {
      const tier = button.dataset.previewTier;
      if (isDrawing) return;
      isDrawing = true;
      await playTierEffect(tier, { preview: true });
      isDrawing = false;
    }));
    elements.undoButton.addEventListener("click", undoLastDraw);
    elements.exportButton.addEventListener("click", exportBackup);
    elements.importButton.addEventListener("click", () => elements.importFile.click());
    elements.importFile.addEventListener("change", importBackup);
    elements.clearHistoryButton.addEventListener("click", clearHistory);
    elements.factoryResetButton.addEventListener("click", factoryReset);

    document.addEventListener("keydown", event => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        openPinModal();
        return;
      }
      if (event.key === "Escape") {
        if (elements.resultModal.classList.contains("open")) closeResult();
        else if (elements.pinModal.classList.contains("open")) closePinModal();
        else if (elements.adminPanel.classList.contains("open")) closeAdmin();
      }
    });
  }

  bindEvents();
  renderPublic();
  updateClock();
  window.setInterval(updateClock, 1000);
  startAmbientCanvas();
})();
