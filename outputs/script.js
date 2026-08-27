(function () {
  "use strict";

  const START_COINS = 100;
  const BODY_DAMAGE_COOLDOWN = 620;
  const MIN_DAMAGE = 2;
  const RESTITUTION = 0.96;
  const MAX_FRAME_STEP = 0.033;
  const MAX_PHYSICS_STEP = 0.012;
  const DEFEAT_CINEMATIC_DURATION_MS = 2200;
  const BATTLE_COUNTDOWN_MS = 3000;
  const MENU_BATTLE_FIGHTER_COUNT = 7;
  const MENU_BATTLE_MAX_MS = 45000;
  const MENU_BATTLE_WINNER_LINGER_MS = 1000;
  const MENU_BATTLE_FADE_MS = 800;
  const MENU_BATTLE_COLORS = ["#ff6b76", "#43f0dc", "#ffd66a", "#a876ff", "#ff8f3d", "#72a8ff", "#7ee36d"];
  const BATTLEFIELDS = [
    {
      id: "default",
      name: "기본 전장",
      tag: "표준 규칙",
      description: "특별 효과 없이 기존 전투 규칙 그대로 진행됩니다.",
      effectText: "어두운 경기장"
    },
    {
      id: "seal",
      name: "봉인지대",
      tag: "스킬 봉인",
      description: "라운드 시작 시 양쪽 캐릭터의 일반 스킬 중 1개가 무작위로 봉인됩니다.",
      effectText: "보라색 마법진"
    },
    {
      id: "grass",
      name: "초원",
      tag: "이동속도 증가",
      description: "양쪽 캐릭터의 이동속도가 증가합니다.",
      effectText: "풀밭과 바람"
    },
    {
      id: "time",
      name: "시간의 지평선",
      tag: "능력치 변동",
      description: "체력, 공격력, 방어력 중 하나가 1~100 사이 값으로 변경됩니다.",
      effectText: "시간 균열"
    },
    {
      id: "desert",
      name: "사막",
      tag: "피해 감소",
      description: "모든 스킬 피해와 기본 충돌 피해가 30% 감소합니다.",
      effectText: "모래바람"
    }
  ];
  const DEFAULT_BATTLEFIELD_ID = "default";
  const GRASS_SPEED_MULTIPLIER = 1.2;
  const DESERT_DAMAGE_MULTIPLIER = 0.7;
  const RECOVERY_SPEED_RATE = 0.18;
  const DEV_CODE = "pdc2026";
  const HIDDEN_HIM_CODE = "him";
  const HIM_CHARM_AURA_RADIUS_RATE = 0.26;
  const HIM_CHARM_BUILD_PER_SECOND = 28;
  const HIM_CHARM_MAX = 100;
  const HIM_CHARM_DURATION = 2500;
  const HIM_ABSOLUTE_DURATION = 5000;
  const HIM_STATUS_RESISTANCE = 0.5;
  const HIM_BOSS_RECOVERY_HP = 80;
  const JARVAN_DEATH_TIME_MS = 30000;
  const JARVAN_MAX_ATK = 84;
  const OIIA_REFERENCE_HP = 64;
  const OIIA_MIN_SIZE_SCALE = 0.25;
  const OIIA_MAX_SIZE_SCALE = 1;
  const OIIA_MAX_CLONES = 30;
  const OIIA_CLONE_GRACE_MS = 200;
  const OIIA_REMOVE_DURATIONS = {
    zero: 420
  };
  const GASTER_BODY_SCALE = 1.4;
  const GASTER_BODY_WIDTH = 82 * GASTER_BODY_SCALE;
  const GASTER_BODY_HEIGHT = 56 * GASTER_BODY_SCALE;
  const GASTER_MOUTH_OFFSET = 21 * GASTER_BODY_SCALE;
  const GASTER_BEAM_WIDTH_SCALE = 1.3;
  const GASTER_ULTIMATE_BLASTER_SCALE = 1.2;
  const GASTER_ULTIMATE_BEAM_WIDTH_SCALE = 1.95;
  const SANS_DODGE_CHANCE = 0.95;
  const SANS_DODGE_LOCK_MS = 100;
  const SANS_PERSISTENT_ATTACK_STALE_MS = 240;
  const SANS_ULTIMATE_PHASE_MS = 280;
  const ULTIMATE_RETURN_STABILIZE_MS = 90;
  const RONALDO_FREEKICK_REHIT_MS = 300;
  const RICO_BULLET_REHIT_MS = 300;
  const MONK_REFLECT_LOCK_MS = 100;
  const MONK_COMBO_INTERVAL_MS = 400;
  const GOJO_INFINITY_MAX = 100;
  const GOJO_INFINITY_REGEN_DELAY = 4000;
  const GOJO_INFINITY_REGEN_PER_SECOND = 4;
  const GOJO_INFINITY_COLLAPSE_MS = 5000;
  const GOJO_INFINITY_RECOVER_GAUGE = 15;
  const GOJO_INFINITY_DOT_DRAIN_INTERVAL = 300;
  const MUZAN_CELL_MAX = 100;
  const MUZAN_BLOOD_DURATION_MS = 8000;
  const MUZAN_BLOOD_DECAY_MS = 2000;
  const MUZAN_SUNRISE_TIME_MS = 40000;
  const MAUGA_SINGLE_GUN_SPREAD_MIN = 15;
  const MAUGA_SINGLE_GUN_SPREAD_MAX = 20;
  const MAUGA_DUAL_GUN_SPREAD_MIN = 35;
  const MAUGA_DUAL_GUN_SPREAD_MAX = 45;
  const IMAGE_FAILURE_WARNINGS = new Set();
  const RANKING_STORAGE_KEY = "bounceBetArenaRankings";
  const TRAINING_DUMMY = {
    id: "training_dummy",
    name: "훈련장 허수아비",
    description: "공격하지 않는 훈련장 테스트 대상입니다.",
    hp: 100000,
    atk: 0,
    def: 0,
    speed: 0,
    abilityType: "basic",
    skills: []
  };

  const abilityLabels = {
    basic: "기본 충돌 전투",
    damageDrain: "실제 피해의 일부를 회복",
    jarvanTimedWall: "벽 충돌로 공격력 증가, 전투 30초에 자연사",
    speedCollisionRamp: "영구 속도에 따라 충돌 피해 증가",
    oiiaDivision: "벽 충돌 시 최대 30개 분신 생성 · 초과 시 분신 강화",
    sansDodge: "모든 직접 피해를 순간이동으로 회피",
    darkinSustain: "검격 적중 시 실제 피해 기반 회복",
    chillSun: "중앙 태양과 느긋한 보호막",
    maugaBerserker: "불타는 적에게 치명타 시 임시 체력 획득",
    ricoBouncer: "벽 반사를 활용하는 원거리 기술",
    monkReflector: "근접 연속 공격과 투사체 완전 반사",
    blueEyesFusion: "궁극융합 스택과 위기 진화",
    gojoInfinity: "모든 피해 차단 (게이지 소모 증가)",
    muzanBiology: "세포를 소모해 지속적으로 재생하고 치명상을 한 번 복구한다",
    chainsawDevil: "소멸 스택으로 일반 스킬을 잠시 봉인",
    himCharm: "매혹 오라로 상대를 끌어들이고 행동을 지배"
  };

  abilityLabels.ronaldoChampion = "빠른 공간 창출과 강력한 축구 기술";

  const passiveTitles = {
    basic: "기본 전투",
    damageDrain: "흡혈",
    jarvanTimedWall: "정해진 종점",
    speedCollisionRamp: "영구 속도 성장",
    oiiaDivision: "무한 분열",
    sansDodge: "순간이동 회피",
    darkinSustain: "다르킨 흡혈",
    chillSun: "태양",
    maugaBerserker: "광전사",
    ricoBouncer: "벽 반사",
    monkReflector: "연속 수련",
    ronaldoChampion: "챔피언 본능",
    blueEyesFusion: "궁극융합 (Ultimate Fusion)",
    gojoInfinity: "무하한",
    muzanBiology: "완전생물",
    chainsawDevil: "소멸",
    himCharm: "매혹의 지배자"
  };

  const els = {
    app: document.getElementById("appRoot"),
    views: {
      menu: document.getElementById("menuView"),
      nickname: document.getElementById("nicknameView"),
      ranking: document.getElementById("rankingView"),
      battlefield: document.getElementById("battlefieldView"),
      matchup: document.getElementById("matchupView"),
      battle: document.getElementById("battleView")
    },
    menu: {
      start: document.getElementById("menuStartButton"),
      ranking: document.getElementById("menuRankingButton"),
      coin: document.getElementById("menuCoinDisplay")
    },
    nickname: {
      box: document.getElementById("nicknameBox"),
      display: document.getElementById("nicknameDisplay"),
      input: document.getElementById("nicknameInput"),
      message: document.getElementById("nicknameMessage"),
      confirm: document.getElementById("nicknameConfirmButton"),
      back: document.getElementById("nicknameBackButton")
    },
    ranking: {
      view: document.getElementById("rankingView"),
      list: document.getElementById("rankingList"),
      back: document.getElementById("rankingBackButton")
    },
    battlefield: {
      roundLabel: document.getElementById("battlefieldRoundLabel"),
      choices: document.getElementById("battlefieldChoices"),
      confirm: document.getElementById("battlefieldConfirmButton"),
      reroll: document.getElementById("battlefieldRerollButton"),
      message: document.getElementById("battlefieldMessage")
    },
    coin: document.getElementById("coinDisplay"),
    best: document.getElementById("bestDisplay"),
    round: document.getElementById("roundDisplay"),
    state: document.getElementById("stateDisplay"),
    battleTimer: document.getElementById("battleTimer"),
    battleCountdown: document.getElementById("battleCountdown"),
    arena: document.getElementById("arena"),
    skillLayer: document.getElementById("skillLayer"),
    fighterA: document.getElementById("fighterA"),
    fighterB: document.getElementById("fighterB"),
    miniHpA: document.getElementById("miniHpA"),
    miniHpB: document.getElementById("miniHpB"),
    betAmount: document.getElementById("betAmount"),
    startButton: document.getElementById("startButton"),
    nextButton: document.getElementById("nextButton"),
    pauseButton: document.getElementById("pauseButton"),
    speedButton: document.getElementById("speedButton"),
    betA: document.getElementById("betA"),
    betB: document.getElementById("betB"),
    betMessage: document.getElementById("betMessage"),
    log: document.getElementById("battleLog"),
    logPanel: document.getElementById("logPanel"),
    logToggle: document.getElementById("logToggleButton"),
    matchupSkills: {
      A: document.getElementById("matchupSkillsA"),
      B: document.getElementById("matchupSkillsB")
    },
    battleSkills: {
      A: document.getElementById("battleSkillsA"),
      B: document.getElementById("battleSkillsB")
    },
    battlePortraits: {
      A: {
        card: document.getElementById("battleCharacterCardA"),
        portrait: document.getElementById("battlePortraitA"),
        name: document.getElementById("battleCharacterNameA"),
        hp: document.getElementById("battleCharacterHpA"),
        hpBar: document.getElementById("battleCharacterHpBarA"),
        atk: document.getElementById("battleCharacterAtkA"),
        def: document.getElementById("battleCharacterDefA"),
        speed: document.getElementById("battleCharacterSpeedA")
      },
      B: {
        card: document.getElementById("battleCharacterCardB"),
        portrait: document.getElementById("battlePortraitB"),
        name: document.getElementById("battleCharacterNameB"),
        hp: document.getElementById("battleCharacterHpB"),
        hpBar: document.getElementById("battleCharacterHpBarB"),
        atk: document.getElementById("battleCharacterAtkB"),
        def: document.getElementById("battleCharacterDefB"),
        speed: document.getElementById("battleCharacterSpeedB")
      }
    },
    hud: {
      A: {
        portrait: document.getElementById("hudPortraitA"),
        name: document.getElementById("hudNameA"),
        hpText: document.getElementById("hudHpTextA"),
        hpBar: document.getElementById("hudHpBarA"),
        status: document.getElementById("statusIconsA")
      },
      B: {
        portrait: document.getElementById("hudPortraitB"),
        name: document.getElementById("hudNameB"),
        hpText: document.getElementById("hudHpTextB"),
        hpBar: document.getElementById("hudHpBarB"),
        status: document.getElementById("statusIconsB")
      }
    },
    skillPopup: {
      root: document.getElementById("skillPopup"),
      close: document.getElementById("skillPopupClose"),
      kind: document.getElementById("skillPopupKind"),
      title: document.getElementById("skillPopupTitle"),
      description: document.getElementById("skillPopupDescription"),
      stats: document.getElementById("skillPopupStats")
    },
    result: {
      overlay: document.getElementById("resultOverlay"),
      panel: document.getElementById("resultPanel"),
      kicker: document.getElementById("resultKicker"),
      winnerPortrait: document.getElementById("resultWinnerPortrait"),
      loserPortrait: document.getElementById("resultLoserPortrait"),
      title: document.getElementById("resultTitle"),
      loserName: document.getElementById("resultLoserName"),
      betStatus: document.getElementById("resultBetStatus"),
      betTarget: document.getElementById("resultBetTarget"),
      coinDelta: document.getElementById("resultCoinDelta"),
      coinTotal: document.getElementById("resultCoinTotal"),
      defeatCause: document.getElementById("resultDefeatCause"),
      battleTime: document.getElementById("resultBattleTime"),
      winnerHp: document.getElementById("resultWinnerHp"),
      damageTotal: document.getElementById("resultDamageTotal"),
      bestNote: document.getElementById("resultBestNote"),
      highlights: document.getElementById("resultHighlights"),
      gameOver: document.getElementById("resultGameOver"),
      nextButton: document.getElementById("resultNextButton"),
      restartButton: document.getElementById("resultRestartButton"),
      closeButton: document.getElementById("resultCloseButton")
    },
    dev: {
      trigger: document.getElementById("devTrigger"),
      login: document.getElementById("devLogin"),
      loginClose: document.getElementById("devLoginClose"),
      codeInput: document.getElementById("devCodeInput"),
      codeSubmit: document.getElementById("devCodeSubmit"),
      message: document.getElementById("devMessage"),
      badge: document.getElementById("devBadge"),
      panel: document.getElementById("devPanel"),
      panelClose: document.getElementById("devPanelClose"),
      selectA: document.getElementById("devSelectA"),
      selectB: document.getElementById("devSelectB"),
      applySelection: document.getElementById("devApplySelection"),
      trainingMode: document.getElementById("devTrainingMode"),
      resetCurrent: document.getElementById("devResetCurrent"),
      randomPair: document.getElementById("devRandomPair"),
      closeMode: document.getElementById("devCloseMode"),
      note: document.getElementById("devPanelNote")
    },
    panel: {
      A: {
        name: document.getElementById("nameA"),
        portrait: document.getElementById("portraitA"),
        description: document.getElementById("descriptionA"),
        hpText: document.getElementById("hpTextA"),
        hpBar: document.getElementById("hpBarA"),
        atk: document.getElementById("atkA"),
        def: document.getElementById("defA"),
        speed: document.getElementById("speedA"),
        ability: document.getElementById("abilityA")
      },
      B: {
        name: document.getElementById("nameB"),
        portrait: document.getElementById("portraitB"),
        description: document.getElementById("descriptionB"),
        hpText: document.getElementById("hpTextB"),
        hpBar: document.getElementById("hpBarB"),
        atk: document.getElementById("atkB"),
        def: document.getElementById("defB"),
        speed: document.getElementById("speedB"),
      ability: document.getElementById("abilityB")
      }
    },
    training: {
      panel: document.getElementById("trainingPanel"),
      selectedSkill: document.getElementById("trainingSelectedSkill"),
      totalDamage: document.getElementById("trainingTotalDamage"),
      lastDamage: document.getElementById("trainingLastDamage"),
      dps: document.getElementById("trainingDps"),
      heal: document.getElementById("trainingHealButton"),
      cooldown: document.getElementById("trainingCooldownButton"),
      cleanse: document.getElementById("trainingCleanseButton"),
      position: document.getElementById("trainingPositionButton"),
      collision: document.getElementById("trainingCollisionButton"),
      reset: document.getElementById("trainingResetButton"),
      exit: document.getElementById("trainingExitButton")
    }
  };

  const game = {
    coins: START_COINS,
    best: loadBestScore(),
    sessionBest: START_COINS,
    round: 0,
    phase: "menu",
    screen: "MENU",
    currentNickname: "",
    rankingRegistered: false,
    devForcedGame: false,
    resumePreparedMatchAfterNickname: false,
    trainingMode: false,
    trainingCharacterIndex: 0,
    trainingStats: {
      totalDamage: 0,
      lastDamage: 0,
      startedAt: 0,
      lastSkillName: "스킬 대기"
    },
    trainingCollisionTest: {
      active: false,
      hitTask: null,
      restoreTask: null
    },
    selectedBet: null,
    lockedBet: null,
    betValue: 10,
    currentBattlefield: null,
    battlefieldChoices: [],
    selectedBattlefieldId: "",
    battlefieldStatEffect: null,
    battlefieldSelectionPending: false,
    battlefieldEffectsApplied: false,
    arenaSize: 560,
    fighters: {},
    animationId: 0,
    countdownTimer: 0,
    countdownHideTimer: 0,
    countdownEndsAt: 0,
    lastTime: 0,
    lastBodyDamageAt: 0,
    battleClock: {
      startedAt: 0,
      elapsedMs: 0,
      running: false
    },
    combatClock: {
      now: 0,
      paused: false,
      timeScale: 1
    },
    activeUltimate: {
      ownerId: null,
      ultimateId: null,
      isActive: false
    },
    arenaObjects: [],
    summons: [],
    summonCounter: 0,
    fighterBaseRadius: 26,
    timeouts: new Set(),
    devMode: false,
    battleEnding: false,
    pendingWinnerSide: "",
    cinematicTimer: 0,
    cinematicOverlay: null,
    finalBlow: null,
    finalBlowCounter: 0,
    evolutionFreezeActive: false,
    evolutionFreezeUntilWall: 0,
    lastResult: null
  };

  const menuBattle = {
    root: null,
    arena: null,
    effectLayer: null,
    entities: [],
    projectiles: [],
    effects: [],
    events: [],
    animationId: 0,
    lastTime: 0,
    startedAt: 0,
    elapsedMs: 0,
    width: 0,
    height: 0,
    radius: 34,
    active: false,
    ending: false,
    lastRosterIds: [],
    activeUltimateUntil: 0,
    activeUltimateOwnerId: ""
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (!Array.isArray(window.CHARACTERS) || window.CHARACTERS.length < 2) {
      els.state.textContent = "캐릭터 데이터 오류";
      addLog("CHARACTERS 배열에 캐릭터를 2명 이상 넣어주세요.", "bad");
      return;
    }

    els.betA.addEventListener("click", () => selectBet("A"));
    els.betB.addEventListener("click", () => selectBet("B"));
    els.startButton.addEventListener("click", startBattle);
    if (els.nextButton) els.nextButton.addEventListener("click", handleNextButton);
    if (els.menu.start) els.menu.start.addEventListener("click", handleMenuStartButton);
    if (els.menu.ranking) els.menu.ranking.addEventListener("click", openRankingScreen);
    if (els.battlefield.confirm) els.battlefield.confirm.addEventListener("click", confirmBattlefieldSelection);
    if (els.battlefield.reroll) els.battlefield.reroll.addEventListener("click", rerollBattlefieldChoices);
    if (els.nickname.confirm) els.nickname.confirm.addEventListener("click", confirmNicknameAndStartGame);
    if (els.nickname.back) els.nickname.back.addEventListener("click", goToMainMenu);
    if (els.nickname.input) {
      els.nickname.input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") confirmNicknameAndStartGame();
      });
    }
    if (els.ranking.back) els.ranking.back.addEventListener("click", goToMainMenu);
    els.pauseButton.addEventListener("click", toggleCombatPause);
    els.speedButton.addEventListener("click", toggleCombatSpeed);
    if (els.result.nextButton) els.result.nextButton.addEventListener("click", handleResultNextButton);
    if (els.result.restartButton) els.result.restartButton.addEventListener("click", handleResultRestartButton);
    if (els.result.closeButton) els.result.closeButton.addEventListener("click", showResultBattleLog);
    els.betAmount.addEventListener("input", syncBetInput);
    document.querySelectorAll("[data-bet-quick]").forEach((button) => {
      button.addEventListener("click", () => applyQuickBet(button.dataset.betQuick));
    });
    if (els.logToggle) {
      els.logToggle.addEventListener("click", toggleBattleLog);
    }
    document.addEventListener("keydown", handleGlobalKeydown);
    document.addEventListener("click", handleGlobalClick);
    if (els.skillPopup.close) {
      els.skillPopup.close.addEventListener("click", closeSkillPopup);
    }
    if (els.skillPopup.root) {
      els.skillPopup.root.addEventListener("click", (event) => {
        if (event.target === els.skillPopup.root) closeSkillPopup();
      });
    }
    document.addEventListener("click", handleSkillCardClick);
    setupDeveloperMode();
    setupTrainingControls();
    setupMenuBackgroundBattle();
    window.addEventListener("resize", () => {
      measureArena();
      placeFighters();
      updateAllStats();
      measureMenuBackgroundBattle();
    });

    updateTopUi();
    goToMainMenu();
  }

  function startRound() {
    if (!game.currentNickname) {
      openNicknameScreen();
      return;
    }
    beginRoundWithBattlefield(getBattlefieldById(DEFAULT_BATTLEFIELD_ID), {
      requireBattlefieldSelection: game.round >= 1
    });
  }

  function beginRoundWithBattlefield(battlefield, options = {}) {
    game.trainingMode = false;
    if (els.training.panel) els.training.panel.hidden = true;
    game.round += 1;
    game.battlefieldSelectionPending = !!options.requireBattlefieldSelection;
    game.battlefieldEffectsApplied = false;
    game.currentBattlefield = game.battlefieldSelectionPending
      ? getBattlefieldById(DEFAULT_BATTLEFIELD_ID)
      : (battlefield || getBattlefieldById(DEFAULT_BATTLEFIELD_ID));
    game.battlefieldChoices = [];
    game.selectedBattlefieldId = "";
    game.battlefieldStatEffect = null;
    const pair = pickRandomPair(window.CHARACTERS);
    prepareFightWithCharacters(pair[0], pair[1], {
      clearLog: true,
      message: `${pair[0].name} vs ${pair[1].name}`,
      applyBattlefieldEffects: !game.battlefieldSelectionPending
    });
    els.round.textContent = `Round ${game.round}`;
  }

  function getBattlefieldById(id) {
    return BATTLEFIELDS.find((field) => field.id === id) || BATTLEFIELDS[0];
  }

  function getBattlefieldRerollCost() {
    return Math.ceil(Math.max(0, Number(game.coins) || 0) * 0.1);
  }

  function pickBattlefieldChoices() {
    const pool = BATTLEFIELDS.slice();
    const choices = [];
    while (pool.length && choices.length < 2) {
      const index = Math.floor(Math.random() * pool.length);
      choices.push(pool.splice(index, 1)[0]);
    }
    return choices;
  }

  function openBattlefieldSelection() {
    stopBattleLoop();
    clearTrainingCollisionTest();
    clearScheduledTimers();
    resetBattleEndingState();
    hideResultOverlay();
    closeBattleLog({ resetScroll: true });
    clearRoundEffects();
    resetCombatControls();
    resetBattleTimer();
    game.phase = "battlefield";
    game.trainingMode = false;
    game.currentBattlefield = null;
    game.battlefieldStatEffect = null;
    game.battlefieldEffectsApplied = false;
    game.battlefieldChoices = pickBattlefieldChoices();
    game.selectedBattlefieldId = "";
    if (els.training.panel) els.training.panel.hidden = true;
    setScreenState("BATTLEFIELD");
    renderBattlefieldChoices();
    updateTopUi();
    updateDevControls();
  }

  function renderBattlefieldChoices(message = "") {
    if (els.battlefield.roundLabel) {
      els.battlefield.roundLabel.textContent = `ROUND ${Math.max(1, game.round)}`;
    }
    if (els.battlefield.choices) {
      els.battlefield.choices.innerHTML = "";
      game.battlefieldChoices.forEach((field) => {
        const isSelected = field.id === game.selectedBattlefieldId;
        const card = document.createElement("button");
        card.type = "button";
        card.className = `battlefield-card battlefield-${field.id}${isSelected ? " is-selected" : ""}`;
        card.dataset.battlefieldId = field.id;
        card.setAttribute("aria-pressed", String(isSelected));
        const tag = document.createElement("span");
        tag.className = "battlefield-card-tag";
        tag.textContent = field.tag;
        const title = document.createElement("strong");
        title.textContent = field.name;
        const desc = document.createElement("p");
        desc.textContent = field.description;
        const effect = document.createElement("small");
        effect.textContent = field.effectText;
        card.append(tag, title, desc, effect);
        card.addEventListener("click", () => selectBattlefield(field.id));
        els.battlefield.choices.appendChild(card);
      });
    }
    const selectedField = game.battlefieldChoices.find((field) => field.id === game.selectedBattlefieldId) || null;
    const cost = getBattlefieldRerollCost();
    const leavesEnoughPredictionCoins = game.betValue > 0 ? game.coins - cost >= game.betValue : true;
    const canReroll = cost > 0 && game.coins > cost && leavesEnoughPredictionCoins;
    if (els.battlefield.confirm) {
      els.battlefield.confirm.disabled = !selectedField;
      els.battlefield.confirm.textContent = selectedField ? `${selectedField.name} 결정` : "전장 결정";
    }
    if (els.battlefield.reroll) {
      els.battlefield.reroll.textContent = "리롤 - 현재 코인의 10%";
      els.battlefield.reroll.disabled = !canReroll;
      els.battlefield.reroll.title = canReroll
        ? `리롤 비용: ${cost} 전장 코인`
        : "예측 코인을 유지할 수 없어 리롤할 수 없습니다.";
    }
    if (els.battlefield.message) {
      els.battlefield.message.textContent = message
        || (selectedField
          ? `${selectedField.name}을 선택했습니다. 전장 결정 버튼으로 확정하세요.`
          : "전장을 먼저 선택하세요.");
    }
  }

  function rerollBattlefieldChoices() {
    if (game.phase !== "battlefield") return;
    const cost = getBattlefieldRerollCost();
    if (cost <= 0 || game.coins <= cost || (game.betValue > 0 && game.coins - cost < game.betValue)) {
      renderBattlefieldChoices("예측 코인을 유지할 수 없어 리롤할 수 없습니다.");
      return;
    }
    game.coins = Math.max(0, game.coins - cost);
    game.battlefieldChoices = pickBattlefieldChoices();
    game.selectedBattlefieldId = "";
    updateTopUi();
    renderBattlefieldChoices(`${cost} 전장 코인을 사용해 전장을 다시 뽑았습니다.`);
  }

  function selectBattlefield(id) {
    if (game.phase !== "battlefield") return;
    const battlefield = game.battlefieldChoices.find((field) => field.id === id);
    if (!battlefield) return;
    game.selectedBattlefieldId = id;
    renderBattlefieldChoices(`${battlefield.name}을 선택했습니다. 전장 결정 버튼으로 확정하세요.`);
  }

  function confirmBattlefieldSelection() {
    if (game.phase !== "battlefield") return;
    const battlefield = game.battlefieldChoices.find((field) => field.id === game.selectedBattlefieldId);
    if (!battlefield) {
      renderBattlefieldChoices("전장을 먼저 선택하세요.");
      return;
    }
    game.currentBattlefield = battlefield;
    game.selectedBattlefieldId = "";
    game.battlefieldSelectionPending = false;
    startBattleAfterBattlefieldSelection();
  }

  function setScreenState(screen) {
    game.screen = screen;
    if (els.app) {
      els.app.dataset.screen = screen;
    }
    const isMenu = screen === "MENU";
    const isNickname = screen === "NICKNAME";
    const isRanking = screen === "RANKING";
    const isBattlefield = screen === "BATTLEFIELD";
    const isMatchup = screen === "MATCHUP";
    const isBattle = screen === "BATTLE";
    const isResult = screen === "RESULT";
    if (els.views.menu) {
      els.views.menu.hidden = !isMenu;
      els.views.menu.setAttribute("aria-hidden", String(!isMenu));
    }
    if (els.views.nickname) {
      els.views.nickname.hidden = !isNickname;
      els.views.nickname.setAttribute("aria-hidden", String(!isNickname));
    }
    if (els.views.ranking) {
      els.views.ranking.hidden = !isRanking;
      els.views.ranking.setAttribute("aria-hidden", String(!isRanking));
    }
    if (els.views.battlefield) {
      els.views.battlefield.hidden = !isBattlefield;
      els.views.battlefield.setAttribute("aria-hidden", String(!isBattlefield));
    }
    if (els.views.matchup) {
      els.views.matchup.hidden = !isMatchup;
      els.views.matchup.setAttribute("aria-hidden", String(!isMatchup));
    }
    if (els.views.battle) {
      els.views.battle.hidden = !isBattle;
      els.views.battle.setAttribute("aria-hidden", String(!isBattle));
    }
    if (els.result.overlay) {
      els.result.overlay.hidden = !isResult;
      els.result.overlay.setAttribute("aria-hidden", String(!isResult));
    }
    if (isMenu) {
      startMenuBackgroundBattle();
    } else {
      stopMenuBackgroundBattle(true);
    }
    closeSkillPopup();
  }

  function setupMenuBackgroundBattle() {
    if (!els.views.menu || menuBattle.root) return;
    const root = document.createElement("div");
    root.className = "menu-battle-bg";
    root.setAttribute("aria-hidden", "true");
    root.hidden = true;

    const arena = document.createElement("div");
    arena.className = "menu-battle-arena";
    const effects = document.createElement("div");
    effects.className = "menu-battle-effects";
    arena.appendChild(effects);
    root.appendChild(arena);
    els.views.menu.prepend(root);

    menuBattle.root = root;
    menuBattle.arena = arena;
    menuBattle.effectLayer = effects;
  }

  function startMenuBackgroundBattle() {
    if (!menuBattle.root) setupMenuBackgroundBattle();
    if (!menuBattle.root || menuBattle.active) return;
    menuBattle.active = true;
    menuBattle.root.hidden = false;
    menuBattle.root.classList.remove("menu-battle-fading");
    startMenuBackgroundRound();
    menuBattle.lastTime = performance.now();
    menuBattle.animationId = requestAnimationFrame(tickMenuBackgroundBattle);
  }

  function stopMenuBackgroundBattle(clear = false) {
    if (menuBattle.animationId) {
      cancelAnimationFrame(menuBattle.animationId);
      menuBattle.animationId = 0;
    }
    menuBattle.active = false;
    menuBattle.ending = false;
    menuBattle.events = [];
    if (clear) clearMenuBackgroundRound();
    if (menuBattle.root) {
      menuBattle.root.hidden = true;
      menuBattle.root.classList.remove("menu-battle-fading");
    }
  }

  function measureMenuBackgroundBattle() {
    if (!menuBattle.arena) return;
    const rect = menuBattle.arena.getBoundingClientRect();
    menuBattle.width = Math.max(1, rect.width || 1280);
    menuBattle.height = Math.max(1, rect.height || 720);
    const base = Math.min(menuBattle.width, menuBattle.height);
    menuBattle.radius = clamp(base * 0.055, 30, 48);
    menuBattle.entities.forEach((entity) => {
      entity.radius = menuBattle.radius * (entity.sizeMultiplier || 1);
      keepMenuEntityInside(entity);
    });
  }

  function startMenuBackgroundRound() {
    clearMenuBackgroundRound();
    measureMenuBackgroundBattle();
    const roster = pickMenuBackgroundRoster();
    if (!roster || roster.length < MENU_BATTLE_FIGHTER_COUNT) return;
    menuBattle.ending = false;
    menuBattle.elapsedMs = 0;
    menuBattle.startedAt = 0;
    menuBattle.activeUltimateUntil = 0;
    menuBattle.activeUltimateOwnerId = "";
    menuBattle.root.classList.remove("menu-battle-fading");
    const positions = createMenuBackgroundStartPositions(roster.length);
    menuBattle.entities = roster.map((character, index) => {
      const entity = createMenuBackgroundEntity(character, index);
      const position = positions[index] || { x: menuBattle.width * 0.5, y: menuBattle.height * 0.5 };
      entity.x = position.x;
      entity.y = position.y;
      setMenuEntityVelocity(entity, Math.atan2(menuBattle.height * 0.5 - entity.y, menuBattle.width * 0.5 - entity.x) + (Math.random() - 0.5) * 0.9, 1.05);
      initializeMenuEntitySkills(entity, 0);
      renderMenuBackgroundEntity(entity);
      return entity;
    });
  }

  function clearMenuBackgroundRound() {
    menuBattle.events = [];
    menuBattle.projectiles.forEach((projectile) => removeElement(projectile.element));
    menuBattle.projectiles = [];
    menuBattle.effects.forEach((effect) => removeElement(effect));
    menuBattle.effects = [];
    menuBattle.entities.forEach((entity) => removeElement(entity.element));
    menuBattle.entities = [];
    menuBattle.activeUltimateUntil = 0;
    menuBattle.activeUltimateOwnerId = "";
    if (menuBattle.effectLayer) menuBattle.effectLayer.innerHTML = "";
  }

  function pickMenuBackgroundRoster() {
    const roster = (window.CHARACTERS || []).filter((character) => character && character.id && !character.trainingOnly && !character.hidden);
    if (roster.length < MENU_BATTLE_FIGHTER_COUNT) return null;
    let pool = roster.filter((character) => !menuBattle.lastRosterIds.includes(character.id));
    if (pool.length < MENU_BATTLE_FIGHTER_COUNT) pool = roster.slice();
    const selected = shuffleMenuArray(pool).slice(0, MENU_BATTLE_FIGHTER_COUNT);
    menuBattle.lastRosterIds = selected.map((character) => character.id);
    return selected;
  }

  function shuffleMenuArray(items) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[target]] = [copy[target], copy[index]];
    }
    return copy;
  }

  function createMenuBackgroundStartPositions(count) {
    const positions = [];
    const centerX = menuBattle.width * 0.5;
    const centerY = menuBattle.height * 0.5;
    const radiusX = menuBattle.width * 0.34;
    const radiusY = menuBattle.height * 0.31;
    const minimumGap = menuBattle.radius * 2.35;
    const startAngle = -Math.PI / 2 + Math.random() * 0.45;
    for (let index = 0; index < count; index += 1) {
      let position = null;
      for (let attempt = 0; attempt < 16; attempt += 1) {
        const angle = startAngle + (Math.PI * 2 * index) / count + (Math.random() - 0.5) * 0.34;
        const spread = 0.62 + Math.random() * 0.42;
        const x = clamp(centerX + Math.cos(angle) * radiusX * spread, menuBattle.radius * 1.4, menuBattle.width - menuBattle.radius * 1.4);
        const y = clamp(centerY + Math.sin(angle) * radiusY * spread, menuBattle.radius * 1.4, menuBattle.height - menuBattle.radius * 1.4);
        if (positions.every((item) => Math.hypot(item.x - x, item.y - y) >= minimumGap)) {
          position = { x, y };
          break;
        }
      }
      positions.push(position || {
        x: clamp(centerX + Math.cos(startAngle + (Math.PI * 2 * index) / count) * radiusX, menuBattle.radius * 1.4, menuBattle.width - menuBattle.radius * 1.4),
        y: clamp(centerY + Math.sin(startAngle + (Math.PI * 2 * index) / count) * radiusY, menuBattle.radius * 1.4, menuBattle.height - menuBattle.radius * 1.4)
      });
    }
    return shuffleMenuArray(positions);
  }

  function createMenuBackgroundEntity(data, slot) {
    const color = MENU_BATTLE_COLORS[slot % MENU_BATTLE_COLORS.length];
    const element = document.createElement("div");
    element.className = `menu-battle-fighter menu-battle-slot-${slot}`;
    element.style.setProperty("--menu-battle-color", color);
    element.style.setProperty("--menu-battle-glow", color);
    const image = document.createElement("img");
    image.alt = "";
    image.draggable = false;
    image.src = data.image || data.evolvedImage || "";
    image.style.objectFit = data.imageFit || "contain";
    image.style.objectPosition = data.imagePosition || "center";
    image.addEventListener("error", () => {
      image.hidden = true;
      element.classList.add("image-missing");
      element.dataset.initial = (data.name || String(slot + 1)).slice(0, 1);
    }, { once: true });
    element.appendChild(image);
    menuBattle.arena.appendChild(element);

    return {
      id: `menu-${slot}-${data.id}-${Math.round(Math.random() * 100000)}`,
      slot,
      color,
      data,
      name: data.name || String(slot + 1),
      element,
      image,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: menuBattle.radius,
      hp: Number(data.hp) || 100,
      maxHp: Number(data.hp) || 100,
      atk: Number(data.atk) || 10,
      def: Number(data.def) || 0,
      speed: Number(data.speed) || 3,
      sizeMultiplier: Number(data.sizeMultiplier) || 1,
      skills: (data.skills || []).map((skill) => ({ ...skill })),
      nextSkillAt: {},
      castingUntil: 0,
      bodyHitLockUntil: 0,
      contactLocks: new Map(),
      dead: false
    };
  }

  function initializeMenuEntitySkills(entity, now) {
    entity.nextSkillAt = {};
    entity.skills.forEach((skill, index) => {
      const cooldown = Number(skill.cooldown) || 7000;
      const initial = Number(skill.initialCooldown);
      entity.nextSkillAt[index] = Number.isFinite(initial) && initial >= 0
        ? now + initial
        : now + 1100 + Math.random() * Math.min(3600, cooldown * 0.42);
    });
  }

  function tickMenuBackgroundBattle(time) {
    if (!menuBattle.active) return;
    const dt = Math.max(0, Math.min((time - menuBattle.lastTime) / 1000, MAX_FRAME_STEP));
    menuBattle.lastTime = time;
    menuBattle.elapsedMs += dt * 1000;
    const now = menuBattle.elapsedMs;

    try {
      measureMenuBackgroundBattle();
      processMenuBackgroundEvents(now);
      if (!menuBattle.ending) {
        updateMenuBackgroundEntities(dt, now);
        updateMenuBackgroundProjectiles(dt, now);
        resolveMenuBackgroundBodyCollision(now);
        renderMenuBackgroundBattle();
        const alive = menuBattle.entities.filter((entity) => !entity.dead);
        if (alive.length <= 1 || now >= MENU_BATTLE_MAX_MS) {
          finishMenuBackgroundRound(alive.length === 1 ? alive[0] : null);
        }
      }
    } catch (error) {
      console.error("[Bounce Bet Arena] 시작 화면 배경 전투 오류", error);
      finishMenuBackgroundRound();
    }

    if (menuBattle.active) {
      menuBattle.animationId = requestAnimationFrame(tickMenuBackgroundBattle);
    }
  }

  function processMenuBackgroundEvents(now) {
    if (!menuBattle.events.length) return;
    const due = [];
    menuBattle.events = menuBattle.events.filter((event) => {
      if (event.at <= now) {
        due.push(event);
        return false;
      }
      return true;
    });
    due.forEach((event) => {
      if (typeof event.run === "function") event.run();
    });
  }

  function scheduleMenuBackgroundEvent(delay, run) {
    menuBattle.events.push({
      at: menuBattle.elapsedMs + Math.max(0, delay),
      run
    });
  }

  function getMenuBackgroundTarget(entity) {
    if (!entity || entity.dead) return null;
    let best = null;
    let bestDistance = Infinity;
    menuBattle.entities.forEach((candidate) => {
      if (!candidate || candidate === entity || candidate.dead) return;
      const distance = Math.hypot(candidate.x - entity.x, candidate.y - entity.y);
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    });
    return best;
  }

  function updateMenuBackgroundEntities(dt, now) {
    menuBattle.entities.forEach((entity) => {
      if (!entity || entity.dead) return;
      const target = getMenuBackgroundTarget(entity);
      if (!target || target.dead) return;
      updateMenuBackgroundSkill(entity, target, now);
      const castingSlow = entity.castingUntil > now ? 0.28 : 1;
      entity.x += entity.vx * dt * castingSlow;
      entity.y += entity.vy * dt * castingSlow;
      resolveMenuBackgroundWallBounce(entity);
      steerMenuEntity(entity, target, dt, now);
    });
  }

  function updateMenuBackgroundSkill(entity, target, now) {
    if (!entity.skills.length || entity.castingUntil > now) return;
    entity.skills.forEach((skill, index) => {
      if (entity.castingUntil > now || now < (entity.nextSkillAt[index] || 0)) return;
      if (skill.isUltimate && menuBattle.activeUltimateUntil > now && menuBattle.activeUltimateOwnerId !== entity.id) return;
      startMenuBackgroundSkill(entity, target, skill, index, now);
    });
  }

  function startMenuBackgroundSkill(entity, target, skill, index, now) {
    const cooldown = Math.max(4200, Number(skill.cooldown) || 7500);
    const delay = clamp(Number(skill.delay) || (skill.isUltimate ? 760 : 420), 180, skill.isUltimate ? 950 : 620);
    entity.nextSkillAt[index] = now + cooldown;
    entity.castingUntil = now + delay + 120;
    if (skill.isUltimate) {
      menuBattle.activeUltimateUntil = now + delay + 920;
      menuBattle.activeUltimateOwnerId = entity.id;
    }
    if (entity.element) entity.element.classList.add("menu-battle-casting");
    createMenuChargeEffect(entity, skill);
    scheduleMenuBackgroundEvent(delay, () => {
      if (entity.element) entity.element.classList.remove("menu-battle-casting");
      const currentTarget = target && !target.dead ? target : getMenuBackgroundTarget(entity);
      if (!menuBattle.active || menuBattle.ending || entity.dead || !currentTarget || currentTarget.dead) return;
      if (skill.isUltimate || /slash|beam|burst|void|dimension|blast|flash|sun|domain|ultimate/i.test(skill.type || "")) {
        fireMenuBackgroundBeam(entity, currentTarget, skill);
      } else {
        fireMenuBackgroundProjectile(entity, currentTarget, skill);
      }
    });
  }

  function updateMenuBackgroundProjectiles(dt, now) {
    const remove = new Set();
    menuBattle.projectiles.forEach((projectile) => {
      if (projectile.dead) {
        remove.add(projectile);
        return;
      }
      projectile.life -= dt * 1000;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;

      const r = projectile.radius;
      if (projectile.x < r || projectile.x > menuBattle.width - r) {
        projectile.x = clamp(projectile.x, r, menuBattle.width - r);
        projectile.vx *= -1;
        projectile.bounces += 1;
        createMenuSpark(projectile.x, projectile.y, projectile.color);
      }
      if (projectile.y < r || projectile.y > menuBattle.height - r) {
        projectile.y = clamp(projectile.y, r, menuBattle.height - r);
        projectile.vy *= -1;
        projectile.bounces += 1;
        createMenuSpark(projectile.x, projectile.y, projectile.color);
      }
      if (projectile.life <= 0 || projectile.bounces > 5) remove.add(projectile);

      const target = menuBattle.entities
        .filter((entity) => entity !== projectile.owner && !entity.dead)
        .find((entity) => Math.hypot(entity.x - projectile.x, entity.y - projectile.y) <= entity.radius + projectile.radius);
      if (target) {
        applyMenuBackgroundDamage(projectile.owner, target, projectile.damage, projectile.skill);
        createMenuSpark(projectile.x, projectile.y, projectile.color);
        remove.add(projectile);
      }

      if (projectile.element) {
        projectile.element.style.transform = `translate(${projectile.x}px, ${projectile.y}px) translate(-50%, -50%)`;
      }
    });
    if (remove.size) {
      menuBattle.projectiles = menuBattle.projectiles.filter((projectile) => {
        if (!remove.has(projectile)) return true;
        removeElement(projectile.element);
        return false;
      });
    }
  }

  function resolveMenuBackgroundBodyCollision(now) {
    const alive = menuBattle.entities.filter((entity) => entity && !entity.dead);
    for (let i = 0; i < alive.length; i += 1) {
      for (let j = i + 1; j < alive.length; j += 1) {
        const a = alive[i];
        const b = alive[j];
        if (a.dead || b.dead) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 1;
        const minDistance = a.radius + b.radius;
        const contactKey = b.id;
        if (distance >= minDistance) {
          a.contactLocks.delete(contactKey);
          b.contactLocks.delete(a.id);
          continue;
        }
        const nx = dx / distance;
        const ny = dy / distance;
        const overlap = minDistance - distance;
        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;
        keepMenuEntityInside(a);
        keepMenuEntityInside(b);
        reflectMenuVelocity(a, b, nx, ny);
        if ((a.contactLocks.get(contactKey) || 0) <= now && (b.contactLocks.get(a.id) || 0) <= now) {
          a.contactLocks.set(contactKey, now + 620);
          b.contactLocks.set(a.id, now + 620);
          applyMenuBackgroundDamage(a, b, Math.max(1, a.atk - b.def * 0.35), { name: "충돌" });
          applyMenuBackgroundDamage(b, a, Math.max(1, b.atk - a.def * 0.35), { name: "충돌" });
          createMenuSpark((a.x + b.x) / 2, (a.y + b.y) / 2, "#ffd56a");
        }
      }
    }
  }

  function fireMenuBackgroundProjectile(entity, target, skill) {
    const angle = Math.atan2(target.y - entity.y, target.x - entity.x);
    const color = entity.color || "#ffffff";
    const radius = clamp(menuBattle.radius * (skill.isUltimate ? 0.54 : 0.36), 12, 26);
    const speed = getMenuEntitySpeed(entity) * (skill.isUltimate ? 1.65 : 1.28);
    const projectileElement = document.createElement("div");
    projectileElement.className = "menu-battle-projectile";
    projectileElement.style.setProperty("--menu-projectile-color", color);
    projectileElement.style.setProperty("--menu-projectile-glow", color);
    projectileElement.style.width = `${radius * 2}px`;
    projectileElement.style.height = `${radius * 2}px`;
    menuBattle.arena.appendChild(projectileElement);
    menuBattle.projectiles.push({
      owner: entity,
      skill,
      element: projectileElement,
      x: entity.x + Math.cos(angle) * (entity.radius + radius),
      y: entity.y + Math.sin(angle) * (entity.radius + radius),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      damage: getMenuSkillDamage(entity, skill),
      life: 3000,
      bounces: 0,
      color
    });
  }

  function fireMenuBackgroundBeam(entity, target, skill) {
    const angle = Math.atan2(target.y - entity.y, target.x - entity.x);
    const length = Math.hypot(menuBattle.width, menuBattle.height) * (skill.isUltimate ? 0.74 : 0.52);
    const width = clamp(menuBattle.radius * (skill.isUltimate ? 1.35 : 0.86), 28, 74);
    const x = entity.x + Math.cos(angle) * entity.radius;
    const y = entity.y + Math.sin(angle) * entity.radius;
    const beam = document.createElement("div");
    beam.className = `menu-battle-beam${skill.isUltimate ? " ultimate" : ""}`;
    beam.style.setProperty("--menu-beam-color", entity.color || "#ffffff");
    beam.style.width = `${length}px`;
    beam.style.height = `${width}px`;
    beam.style.transform = `translate(${x}px, ${y}px) rotate(${angle}rad)`;
    menuBattle.effectLayer.appendChild(beam);
    trackMenuEffect(beam);

    menuBattle.entities.forEach((candidate) => {
      if (!candidate || candidate === entity || candidate.dead) return;
      const hit = isPointNearMenuSegment(candidate.x, candidate.y, x, y, x + Math.cos(angle) * length, y + Math.sin(angle) * length, width * 0.58 + candidate.radius);
      if (!hit) return;
      applyMenuBackgroundDamage(entity, candidate, getMenuSkillDamage(entity, skill), skill);
      createMenuSpark(candidate.x, candidate.y, entity.color || "#ffffff");
    });
  }

  function applyMenuBackgroundDamage(attacker, defender, amount, skill) {
    if (!attacker || !defender || defender.dead) return;
    const damage = Math.max(1, Math.round(Number(amount) || 1));
    defender.hp -= damage;
    if (defender.element) defender.element.classList.add("menu-battle-hit");
    scheduleMenuBackgroundEvent(120, () => defender.element && defender.element.classList.remove("menu-battle-hit"));
    if (defender.hp <= 0) {
      defender.dead = true;
      if (defender.element) defender.element.classList.add("menu-battle-defeated");
      cleanupMenuBackgroundEntityObjects(defender);
      scheduleMenuBackgroundEvent(520, () => {
        if (!defender.dead || !defender.element || menuBattle.ending) return;
        removeElement(defender.element);
        defender.element = null;
      });
    }
  }

  function cleanupMenuBackgroundEntityObjects(entity) {
    if (!entity) return;
    if (menuBattle.activeUltimateOwnerId === entity.id) {
      menuBattle.activeUltimateOwnerId = "";
      menuBattle.activeUltimateUntil = 0;
    }
    menuBattle.projectiles = menuBattle.projectiles.filter((projectile) => {
      if (projectile.owner !== entity) return true;
      removeElement(projectile.element);
      return false;
    });
  }

  function finishMenuBackgroundRound(winner = null) {
    if (!menuBattle.active || menuBattle.ending) return;
    menuBattle.ending = true;
    if (winner && winner.element) winner.element.classList.add("menu-battle-winner");
    const linger = winner ? MENU_BATTLE_WINNER_LINGER_MS : 0;
    scheduleMenuBackgroundEvent(linger, () => {
      if (menuBattle.root) menuBattle.root.classList.add("menu-battle-fading");
    });
    scheduleMenuBackgroundEvent(linger + MENU_BATTLE_FADE_MS, () => {
      if (!menuBattle.active) return;
      startMenuBackgroundRound();
    });
  }

  function renderMenuBackgroundBattle() {
    menuBattle.entities.forEach(renderMenuBackgroundEntity);
  }

  function renderMenuBackgroundEntity(entity) {
    if (!entity || !entity.element) return;
    const size = entity.radius * 2.25;
    entity.element.style.width = `${size}px`;
    entity.element.style.height = `${size}px`;
    entity.element.style.transform = `translate(${entity.x}px, ${entity.y}px) translate(-50%, -50%)`;
  }

  function createMenuChargeEffect(entity, skill) {
    const effect = document.createElement("div");
    effect.className = `menu-battle-charge${skill.isUltimate ? " ultimate" : ""}`;
    effect.style.setProperty("--menu-charge-color", entity.color || "#ffffff");
    effect.style.width = `${entity.radius * (skill.isUltimate ? 3.1 : 2.3)}px`;
    effect.style.height = effect.style.width;
    effect.style.transform = `translate(${entity.x}px, ${entity.y}px) translate(-50%, -50%)`;
    menuBattle.effectLayer.appendChild(effect);
    trackMenuEffect(effect);
  }

  function createMenuSpark(x, y, color = "#ffffff") {
    const spark = document.createElement("div");
    spark.className = "menu-battle-spark";
    spark.style.setProperty("--menu-spark-color", color);
    spark.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    menuBattle.effectLayer.appendChild(spark);
    trackMenuEffect(spark);
  }

  function trackMenuEffect(element) {
    menuBattle.effects.push(element);
    element.addEventListener("animationend", () => {
      removeElement(element);
      menuBattle.effects = menuBattle.effects.filter((item) => item !== element);
    }, { once: true });
    if (menuBattle.effects.length > 80) {
      const old = menuBattle.effects.splice(0, menuBattle.effects.length - 80);
      old.forEach((item) => removeElement(item));
    }
  }

  function getMenuSkillDamage(entity, skill) {
    const values = [
      skill.damage,
      skill.coreDamage,
      skill.maxDamage,
      skill.baseDamage,
      skill.explosionDamage,
      skill.burnDamage
    ].map(Number).filter(Number.isFinite);
    const base = values.length ? Math.max(...values) : entity.atk * (skill.isUltimate ? 2.4 : 1.5);
    return Math.max(1, base + entity.atk * (skill.isUltimate ? 0.75 : 0.35));
  }

  function steerMenuEntity(entity, target, dt, now) {
    if (entity.castingUntil > now) return;
    const desired = Math.atan2(target.y - entity.y, target.x - entity.x);
    const speed = getMenuEntitySpeed(entity);
    const blend = Math.min(1, dt * 0.7);
    entity.vx = entity.vx * (1 - blend) + Math.cos(desired) * speed * blend;
    entity.vy = entity.vy * (1 - blend) + Math.sin(desired) * speed * blend;
  }

  function setMenuEntityVelocity(entity, angle, multiplier = 1) {
    const speed = getMenuEntitySpeed(entity) * multiplier;
    entity.vx = Math.cos(angle) * speed;
    entity.vy = Math.sin(angle) * speed;
  }

  function getMenuEntitySpeed(entity) {
    const scale = Math.min(menuBattle.width, menuBattle.height) / 720;
    return (58 + entity.speed * 22) * clamp(scale, 0.82, 1.35);
  }

  function resolveMenuBackgroundWallBounce(entity) {
    const r = entity.radius;
    let bounced = false;
    if (entity.x < r || entity.x > menuBattle.width - r) {
      entity.x = clamp(entity.x, r, menuBattle.width - r);
      entity.vx *= -1;
      bounced = true;
    }
    if (entity.y < r || entity.y > menuBattle.height - r) {
      entity.y = clamp(entity.y, r, menuBattle.height - r);
      entity.vy *= -1;
      bounced = true;
    }
    if (bounced) createMenuSpark(entity.x, entity.y, entity.color || "#ffffff");
  }

  function keepMenuEntityInside(entity) {
    const r = entity.radius || menuBattle.radius;
    entity.x = clamp(entity.x, r, menuBattle.width - r);
    entity.y = clamp(entity.y, r, menuBattle.height - r);
  }

  function reflectMenuVelocity(a, b, nx, ny) {
    const av = a.vx * nx + a.vy * ny;
    const bv = b.vx * nx + b.vy * ny;
    a.vx += (bv - av) * nx;
    a.vy += (bv - av) * ny;
    b.vx += (av - bv) * nx;
    b.vy += (av - bv) * ny;
  }

  function isPointNearMenuSegment(px, py, ax, ay, bx, by, radius) {
    const vx = bx - ax;
    const vy = by - ay;
    const wx = px - ax;
    const wy = py - ay;
    const lengthSq = vx * vx + vy * vy || 1;
    const t = clamp((wx * vx + wy * vy) / lengthSq, 0, 1);
    const cx = ax + vx * t;
    const cy = ay + vy * t;
    return Math.hypot(px - cx, py - cy) <= radius;
  }

  function handleMenuStartButton() {
    if (game.currentNickname) {
      startGameWithCurrentNickname();
      return;
    }
    openNicknameScreen();
  }

  function startGameWithCurrentNickname() {
    if (!game.currentNickname) {
      openNicknameScreen();
      return;
    }
    stopBattleLoop();
    clearTrainingCollisionTest();
    clearScheduledTimers();
    resetBattleEndingState();
    hideResultOverlay();
    closeBattleLog({ resetScroll: true });
    clearRoundEffects();
    resetCombatControls();
    resetBattleTimer();
    game.coins = START_COINS;
    game.sessionBest = START_COINS;
    game.round = 0;
    game.rankingRegistered = false;
    game.devForcedGame = false;
    game.resumePreparedMatchAfterNickname = false;
    game.selectedBet = null;
    game.lockedBet = null;
    game.currentBattlefield = getBattlefieldById(DEFAULT_BATTLEFIELD_ID);
    game.battlefieldChoices = [];
    game.selectedBattlefieldId = "";
    game.battlefieldStatEffect = null;
    game.battlefieldSelectionPending = false;
    game.battlefieldEffectsApplied = false;
    applyBattlefieldVisuals(game.currentBattlefield);
    updateBattlefieldBadge();
    game.trainingMode = false;
    if (els.training.panel) els.training.panel.hidden = true;
    updateNicknameUi();
    updateTopUi();
    startRound();
  }

  function handleResultRestartButton() {
    goToMainMenu({ preserveNickname: true });
  }

  function goToMainMenu(options = {}) {
    const preservedNickname = options.preserveNickname ? game.currentNickname : "";
    stopBattleLoop();
    clearTrainingCollisionTest();
    clearScheduledTimers();
    resetBattleEndingState();
    hideResultOverlay();
    closeBattleLog({ resetScroll: true });
    clearRoundEffects();
    resetCombatControls();
    resetBattleTimer();
    game.phase = "menu";
    game.trainingMode = false;
    game.currentNickname = preservedNickname;
    game.rankingRegistered = false;
    game.devForcedGame = false;
    game.resumePreparedMatchAfterNickname = false;
    game.selectedBet = null;
    game.lockedBet = null;
    game.currentBattlefield = getBattlefieldById(DEFAULT_BATTLEFIELD_ID);
    game.battlefieldChoices = [];
    game.selectedBattlefieldId = "";
    game.battlefieldStatEffect = null;
    game.battlefieldSelectionPending = false;
    game.battlefieldEffectsApplied = false;
    applyBattlefieldVisuals(game.currentBattlefield);
    updateBattlefieldBadge();
    if (els.training.panel) els.training.panel.hidden = true;
    updateNicknameUi();
    setScreenState("MENU");
    updateTopUi();
    updateDevControls();
  }

  function openNicknameScreen(options = {}) {
    stopBattleLoop();
    clearTrainingCollisionTest();
    clearScheduledTimers();
    resetBattleEndingState();
    hideResultOverlay();
    closeBattleLog({ resetScroll: true });
    clearRoundEffects();
    resetCombatControls();
    resetBattleTimer();
    game.phase = "nickname";
    game.trainingMode = false;
    game.currentNickname = "";
    game.rankingRegistered = false;
    if (!options.preservePreparedMatch) {
      game.resumePreparedMatchAfterNickname = false;
      game.devForcedGame = false;
    }
    if (els.training.panel) els.training.panel.hidden = true;
    updateNicknameUi();
    if (els.nickname.input) els.nickname.input.value = "";
    if (els.nickname.message) els.nickname.message.textContent = "";
    setScreenState("NICKNAME");
    if (els.nickname.input) els.nickname.input.focus();
  }

  function confirmNicknameAndStartGame() {
    const result = validateNickname(els.nickname.input ? els.nickname.input.value : "");
    if (!result.ok) {
      if (els.nickname.message) els.nickname.message.textContent = result.message;
      return;
    }
    const preserveDevForced = game.resumePreparedMatchAfterNickname && game.devForcedGame;
    game.currentNickname = result.value;
    game.coins = START_COINS;
    game.sessionBest = START_COINS;
    game.round = 0;
    game.rankingRegistered = false;
    game.devForcedGame = preserveDevForced;
    game.currentBattlefield = getBattlefieldById(DEFAULT_BATTLEFIELD_ID);
    game.battlefieldChoices = [];
    game.selectedBattlefieldId = "";
    game.battlefieldStatEffect = null;
    game.battlefieldSelectionPending = false;
    game.battlefieldEffectsApplied = false;
    applyBattlefieldVisuals(game.currentBattlefield);
    updateBattlefieldBadge();
    updateNicknameUi();
    updateTopUi();
    if (game.resumePreparedMatchAfterNickname && game.fighters.A && game.fighters.B) {
      game.resumePreparedMatchAfterNickname = false;
      game.phase = "betting";
      if (game.round <= 0) {
        game.round = 1;
        if (els.round) els.round.textContent = `Round ${game.round}`;
      }
      setScreenState("MATCHUP");
      updateButtons();
      startBattle();
      return;
    }
    startRound();
  }

  function validateNickname(rawValue) {
    const value = String(rawValue || "").trim().replace(/[<>]/g, "");
    if (!value) return { ok: false, message: "닉네임을 입력하세요." };
    if (value.length < 2 || value.length > 12) return { ok: false, message: "닉네임은 2~12자로 입력하세요." };
    return { ok: true, value };
  }

  function updateNicknameUi() {
    const hasName = !!game.currentNickname;
    if (els.nickname.box) els.nickname.box.hidden = !hasName;
    if (els.nickname.display) els.nickname.display.textContent = hasName ? game.currentNickname : "-";
  }

  function openRankingScreen() {
    renderRankingList();
    game.phase = "ranking";
    setScreenState("RANKING");
  }

  function loadRankings() {
    try {
      const parsed = JSON.parse(localStorage.getItem(RANKING_STORAGE_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((entry) => entry && typeof entry.nickname === "string" && Number.isFinite(Number(entry.score)))
        .map((entry) => ({
          nickname: entry.nickname.slice(0, 12),
          score: Math.max(0, Math.round(Number(entry.score) || 0)),
          date: entry.date || new Date().toISOString(),
          achievedAt: Number(entry.achievedAt) || Date.parse(entry.date || "") || Date.now()
        }))
        .sort(sortRankingEntries)
        .slice(0, 10);
    } catch (error) {
      console.warn("랭킹 데이터를 불러오지 못했습니다.", error);
      return [];
    }
  }

  function saveRankings(rankings) {
    localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(rankings.slice(0, 10)));
  }

  function sortRankingEntries(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return a.achievedAt - b.achievedAt;
  }

  function renderRankingList() {
    if (!els.ranking.list) return;
    const rankings = loadRankings();
    els.ranking.list.innerHTML = "";
    if (!rankings.length) {
      const empty = document.createElement("p");
      empty.className = "ranking-empty";
      empty.textContent = "아직 등록된 기록이 없습니다.";
      els.ranking.list.appendChild(empty);
      return;
    }
    rankings.forEach((entry, index) => {
      const row = document.createElement("div");
      row.className = "ranking-row";
      const rank = document.createElement("strong");
      rank.textContent = `${index + 1}`;
      const name = document.createElement("span");
      name.textContent = entry.nickname;
      const score = document.createElement("b");
      score.textContent = formatAmount(entry.score);
      const date = document.createElement("time");
      date.dateTime = entry.date;
      date.textContent = formatRankingDate(entry.date);
      row.append(rank, name, score, date);
      els.ranking.list.appendChild(row);
    });
  }

  function formatRankingDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }

  function registerRankingIfNeeded(result) {
    if (!result || !result.gameOver) return false;
    if (game.rankingRegistered || game.trainingMode || game.devForcedGame || !game.currentNickname) return false;
    const score = Math.max(START_COINS, Math.round(game.sessionBest || game.coins || 0));
    const now = new Date();
    const rankings = loadRankings();
    rankings.push({
      nickname: game.currentNickname,
      score,
      date: now.toISOString(),
      achievedAt: now.getTime()
    });
    rankings.sort(sortRankingEntries);
    saveRankings(rankings.slice(0, 10));
    game.rankingRegistered = true;
    return true;
  }

  function prepareFightWithCharacters(characterA, characterB, options = {}) {
    stopBattleLoop();
    clearTrainingCollisionTest();
    clearScheduledTimers();
    resetBattleEndingState();
    hideResultOverlay();
    closeBattleLog({ resetScroll: true });
    clearRoundEffects();
    game.phase = "betting";
    game.trainingMode = false;
    if (els.training.panel) els.training.panel.hidden = true;
    setScreenState("MATCHUP");
    game.selectedBet = null;
    game.lockedBet = null;
    game.lastBodyDamageAt = 0;
    resetCombatControls();
    resetBattleTimer();

    if (options.clearLog) {
      els.log.innerHTML = "";
    }

    game.fighters.A = createFighterState(characterA, "A");
    game.fighters.B = createFighterState(characterB, "B");
    if (options.applyBattlefieldEffects === false) {
      game.battlefieldEffectsApplied = false;
      applyBattlefieldVisuals(game.currentBattlefield || getBattlefieldById(DEFAULT_BATTLEFIELD_ID));
      updateBattlefieldBadge();
    } else {
      applyCurrentBattlefieldEffects();
    }

    els.state.textContent = "승부 예측 대기";
    els.startButton.disabled = false;
    if (els.nextButton) {
      els.nextButton.disabled = true;
      els.nextButton.textContent = "다음 라운드";
    }
    els.betA.disabled = false;
    els.betB.disabled = false;
    els.betAmount.disabled = false;
    els.betA.classList.remove("selected");
    els.betB.classList.remove("selected");
    syncBetInput();

    measureArena();
    resetPositions();
    renderCharacterPanels();
    renderSkillCardsForFighters();
    renderFighterFaces();
    placeFighters();
    updateAllStats();
    updateButtons();
    updateDevControls();

    if (options.message) {
      addLog(options.message, options.tone);
    }
  }

  function createFighterState(data, side) {
    const copiedSkills = (data.skills || []).map((skill) => ({ ...skill }));
    const copiedEvolvedSkills = (data.evolvedSkills || []).map((skill) => ({ ...skill }));
    const copiedData = {
      ...data,
      skills: copiedSkills.map((skill) => ({ ...skill })),
      evolvedSkills: copiedEvolvedSkills.map((skill) => ({ ...skill })),
      evolvedStats: data.evolvedStats ? { ...data.evolvedStats } : null
    };
    return {
      id: `${side}-${copiedData.id}`,
      side,
      data: copiedData,
      name: copiedData.name,
      image: copiedData.image || "",
      imageFallback: copiedData.imageFallback || "",
      imageFit: copiedData.imageFit || "contain",
      imagePosition: copiedData.imagePosition || "center",
      description: copiedData.description || "",
      abilityType: copiedData.abilityType || "",
      skills: copiedSkills,
      baseName: copiedData.name,
      baseImage: copiedData.image || "",
      baseSkills: copiedSkills.map((skill) => ({ ...skill })),
      evolvedName: copiedData.evolvedName || copiedData.name,
      evolvedImage: copiedData.evolvedImage || copiedData.image || "",
      evolvedStats: copiedData.evolvedStats ? { ...copiedData.evolvedStats } : null,
      evolvedSkills: copiedEvolvedSkills,
      maxHp: Number(copiedData.hp) || 100,
      currentHp: Number(copiedData.hp) || 100,
      atk: Number(copiedData.atk) || 10,
      def: Number(copiedData.def) || 0,
      speed: Number(copiedData.speed) || 3,
      baseRadius: 26,
      oiiaBaseRadius: 26,
      sizeScale: 1,
      baseSizeMultiplier: Number(copiedData.sizeMultiplier) || 1,
      sizeMultiplier: Number(copiedData.sizeMultiplier) || 1,
      radius: 26,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      wallHits: 0,
      bonusAtkFromWalls: 0,
      skillWallContacts: new Set(),
      divisionWallContacts: new Set(),
      oiiaCloneHealContacts: new Set(),
      oiiaProjectiles: [],
      oiiaGreatSpin: null,
      naturalDeathTriggered: false,
      naturalDeathEffect: null,
      battlefieldCompressionWallId: "",
      speedMultiplier: 1,
      slowMultiplier: 1,
      slowUntil: 0,
      slowEffect: null,
      damageReduction: 0,
      healMultiplier: 1,
      duelDefenseWallId: "",
      duelDefenseMultiplier: 1,
      duelDefenseEffect: null,
      duelDefenseLabel: null,
      roundSpeedStacks: 0,
      lastRampageStackAt: 0,
      rampageContactIds: new Set(),
      lastSansDodgeAt: 0,
      sansCollisionLocks: new Map(),
      sansAttackLocks: new Map(),
      isUltimateHidden: false,
      ultimateStabilizeUntil: 0,
      ultimateStoredVelocity: null,
      telekinesisControlled: false,
      storedTelekinesisVelocity: null,
      aatroxUltimate: null,
      shadowDashReadyAt: 0,
      shadowDashDamageSuppressUntil: 0,
      lastSubwayNoBodyUntil: 0,
      chillSun: null,
      chillNextSunTickAt: 0,
      chillSunWaveIndex: 0,
      chillShieldUntil: 0,
      chillNextShieldAt: 0,
      chillShieldEffect: null,
      chillShieldFading: false,
      chillTransformed: false,
      maugaTempHp: 0,
      maugaTempHpLastGainAt: 0,
      maugaTempHpLastDecayAt: 0,
      maugaGunAngles: null,
      maugaCage: null,
      maugaHeartUntil: 0,
      maugaHeartEffect: null,
      maugaUnstoppable: false,
      maugaBurns: new Map(),
      maugaIgniteStacks: new Map(),
      ronaldoUltimate: null,
      ronaldoAirborne: false,
      ronaldoBalls: [],
      ricoBullets: [],
      ricoUltimate: null,
      ricoUltimateHitTimes: new Map(),
      monkComboCount: 0,
      monkLastComboAt: -Infinity,
      monkMeditationUntil: 0,
      monkMeditationEffect: null,
      monkEnlightenment: null,
      monkWallCrash: null,
      blueEyesBlindUntil: 0,
      blueEyesBurnUntil: 0,
      blueEyesBurnNextAt: 0,
      blueEyesBurnDamage: 0,
      blueEyesBurnInterval: 0,
      blueEyesBurnOwnerId: "",
      blueEyesStatusEffect: null,
      stunUntil: 0,
      storedStunVelocity: null,
      blueEyesEvolved: false,
      blueEyesEvolutionUsed: false,
      blueEyesFusionStacks: 0,
      blueEyesFusionMaxStacks: 3,
      blueEyesBodyContactIds: new Set(),
      blueEyesFusionRing: null,
      blueEyesPendingUltimate: false,
      blueEyesUltimateCreatureUsed: false,
      blueEyesInvulnerableUntil: 0,
      blueEyesAttackHasteUntil: 0,
      blueEyesStolenBuffs: [],
      blueEyesStolenSpeedMultiplier: 1,
      blueEyesStolenDamageReduction: 0,
      blueEyesStolenHealMultiplier: 1,
      blueEyesVisualEffects: [],
      blueEyesChaosField: null,
      blueEyesInvulnerableShield: null,
      blueEyesLastShieldSparkAt: -Infinity,
      gojoInfinityGauge: copiedData.abilityType === "gojoInfinity" ? GOJO_INFINITY_MAX : 0,
      gojoInfinityMax: copiedData.abilityType === "gojoInfinity" ? GOJO_INFINITY_MAX : 0,
      gojoInfinityLastBlockAt: -Infinity,
      gojoInfinityLastDotDrainAt: -Infinity,
      gojoInfinityLastUpdateAt: 0,
      gojoInfinityCollapsedUntil: 0,
      gojoInfinityEffect: null,
      gojoBlueMarks: new Map(),
      gojoPurpleReadyAt: 0,
      gojoPurpleProjectiles: [],
      gojoMaterials: {
        blue: false,
        red: false,
        blueEffect: null,
        redEffect: null
      },
      gojoPurpleFusionActive: false,
      gojoPurpleFusionEffect: null,
      gojoTimers: [],
      gojoDomain: null,
      gojoDomainLockedUntil: 0,
      gojoDomainLockEffect: null,
      storedGojoDomainVelocity: null,
      muzanCellGauge: copiedData.abilityType === "muzanBiology" ? MUZAN_CELL_MAX : 0,
      muzanCellMax: copiedData.abilityType === "muzanBiology" ? MUZAN_CELL_MAX : 0,
      muzanLastPassiveAt: 0,
      muzanLastDamageAt: -Infinity,
      muzanFatalRegenUsed: false,
      muzanFatalRegen: null,
      muzanUltimate: null,
      muzanSunriseActive: false,
      muzanSunriseNextAt: 0,
      muzanSunriseEffect: null,
      muzanBloodRecords: new Map(),
      muzanBloodEffect: null,
      muzanNeuralUntil: 0,
      chainsawExtinctionRecords: new Map(),
      chainsawBodyContacts: new Set(),
      chainsawTimers: [],
      chainsawEffects: [],
      chainsawSuppressionEffect: null,
      chainsawSpin: null,
      chainsawHellArena: null,
      himCharmRecords: new Map(),
      himAuraEffect: null,
      himVisualEffects: [],
      himPull: null,
      himAbsoluteCharm: null,
      himBossRecoveryUsed: false,
      skillState: null,
      recoveryUntil: 0,
      recoverySkill: null,
      nextSkillAt: {},
      damageDealt: 0,
      damageTaken: 0,
      arenaSealedSkillIndexes: new Set(),
      arenaSealedSkillTypes: new Set(),
      arenaSpeedMultiplier: 1,
      dead: false
    };
  }

  function applyCurrentBattlefieldEffects() {
    const battlefield = game.currentBattlefield || getBattlefieldById(DEFAULT_BATTLEFIELD_ID);
    game.currentBattlefield = battlefield;
    game.battlefieldStatEffect = null;
    game.battlefieldEffectsApplied = true;
    applyBattlefieldVisuals(battlefield);

    Object.values(game.fighters).forEach((fighter) => {
      if (!fighter) return;
      fighter.arenaSealedSkillIndexes = new Set();
      fighter.arenaSealedSkillTypes = new Set();
      fighter.arenaSpeedMultiplier = 1;
    });

    if (battlefield.id === "seal") {
      applySealedZoneBattlefield();
    } else if (battlefield.id === "grass") {
      Object.values(game.fighters).forEach((fighter) => {
        if (!fighter) return;
        fighter.arenaSpeedMultiplier = GRASS_SPEED_MULTIPLIER;
      });
      addLog("초원: 양쪽 캐릭터의 이동속도가 증가합니다.", "skill");
    } else if (battlefield.id === "time") {
      applyTimeHorizonBattlefield();
    } else if (battlefield.id === "desert") {
      addLog("사막: 스킬 피해와 충돌 피해가 30% 감소합니다.", "skill");
    } else {
      addLog("기본 전장: 특별 효과 없이 전투가 진행됩니다.", "skill");
    }
    updateBattlefieldBadge();
  }

  function applyBattlefieldVisuals(battlefield) {
    const field = battlefield || getBattlefieldById(DEFAULT_BATTLEFIELD_ID);
    if (els.app) {
      els.app.dataset.battlefield = field.id;
    }
    if (els.arena) {
      els.arena.dataset.battlefield = field.id;
    }
  }

  function updateBattlefieldBadge() {
  }

  function getNormalSkillEntries(fighter) {
    if (!fighter || !Array.isArray(fighter.skills)) return [];
    return fighter.skills
      .map((skill, index) => ({ skill, index }))
      .filter(({ skill }) => skill && !skill.linkedOnly && !isUltimateSkill(skill));
  }

  function applySealedZoneBattlefield() {
    ["A", "B"].forEach((side) => {
      const fighter = game.fighters[side];
      const entries = getNormalSkillEntries(fighter);
      if (!fighter || !entries.length) return;
      const picked = entries[Math.floor(Math.random() * entries.length)];
      fighter.arenaSealedSkillIndexes.add(picked.index);
      fighter.arenaSealedSkillTypes.add(picked.skill.type);
      addLog(`봉인지대: ${fighter.name} ${picked.skill.name} 봉인`, "skill");
    });
  }

  function applyTimeHorizonBattlefield() {
    const statKeys = ["hp", "atk", "def"];
    const stat = statKeys[Math.floor(Math.random() * statKeys.length)];
    const labels = { hp: "체력", atk: "공격력", def: "방어력" };
    const changes = [];
    Object.values(game.fighters).forEach((fighter) => {
      if (!fighter) return;
      const value = Math.floor(Math.random() * 100) + 1;
      if (stat === "hp") {
        fighter.maxHp = value;
        fighter.currentHp = value;
      } else if (stat === "atk") {
        fighter.atk = value;
      } else if (stat === "def") {
        fighter.def = value;
      }
      changes.push(`${fighter.name} ${value}`);
    });
    game.battlefieldStatEffect = { stat, label: labels[stat], changes };
    addLog(`시간의 지평선: ${labels[stat]}이 1~100 사이로 재설정됩니다.`, "skill");
  }

  function isSkillSealedByBattlefield(fighter, skill, index = -1) {
    if (!fighter || !skill) return false;
    if (fighter.arenaSealedSkillIndexes && fighter.arenaSealedSkillIndexes.has(index)) return true;
    return !!(fighter.arenaSealedSkillTypes && fighter.arenaSealedSkillTypes.has(skill.type));
  }

  function pickRandomPair(list) {
    const pool = getPublicCharacters(list);
    const roster = pool.length >= 2 ? pool : list;
    const firstIndex = Math.floor(Math.random() * roster.length);
    let secondIndex = Math.floor(Math.random() * roster.length);
    while (secondIndex === firstIndex) {
      secondIndex = Math.floor(Math.random() * roster.length);
    }
    return [roster[firstIndex], roster[secondIndex]];
  }

  function getPublicCharacters(list = window.CHARACTERS || []) {
    return (list || []).filter((character) => character && !character.hidden && !character.trainingOnly);
  }

  function stopBattleLoop() {
    cancelAnimationFrame(game.animationId);
    game.animationId = 0;
    clearPreBattleCountdown();
  }

  function clearPreBattleCountdown() {
    if (game.countdownTimer) {
      window.clearInterval(game.countdownTimer);
      game.countdownTimer = 0;
    }
    if (game.countdownHideTimer) {
      window.clearTimeout(game.countdownHideTimer);
      game.countdownHideTimer = 0;
    }
    game.countdownEndsAt = 0;
    if (els.battleCountdown) {
      els.battleCountdown.hidden = true;
      els.battleCountdown.classList.remove("is-fight");
    }
    if (els.arena) {
      els.arena.classList.remove("countdown-active");
    }
  }

  function startPreBattleCountdown() {
    clearPreBattleCountdown();
    game.phase = "countdown";
    game.countdownEndsAt = performance.now() + BATTLE_COUNTDOWN_MS;
    els.state.textContent = "전투 준비";
    syncCombatControlsUi();
    updateDevControls();
    if (els.battleCountdown) {
      els.battleCountdown.hidden = false;
      els.battleCountdown.classList.remove("is-fight");
    }
    if (els.arena) {
      els.arena.classList.add("countdown-active");
    }
    renderBattleCountdown();
    game.countdownTimer = window.setInterval(() => {
      if (game.phase !== "countdown") {
        clearPreBattleCountdown();
        return;
      }
      const remaining = game.countdownEndsAt - performance.now();
      if (remaining <= 0) {
        finishPreBattleCountdown();
        return;
      }
      renderBattleCountdown();
    }, 80);
  }

  function renderBattleCountdown() {
    if (!els.battleCountdown) return;
    const remaining = Math.max(0, game.countdownEndsAt - performance.now());
    const count = Math.max(1, Math.ceil(remaining / 1000));
    const label = els.battleCountdown.querySelector("span");
    const value = els.battleCountdown.querySelector("strong");
    if (label) label.textContent = "전투 준비";
    if (value) value.textContent = String(count);
  }

  function finishPreBattleCountdown() {
    if (game.countdownTimer) {
      window.clearInterval(game.countdownTimer);
      game.countdownTimer = 0;
    }
    game.countdownEndsAt = 0;
    if (els.battleCountdown) {
      const label = els.battleCountdown.querySelector("span");
      const value = els.battleCountdown.querySelector("strong");
      if (label) label.textContent = "START";
      if (value) value.textContent = "FIGHT";
      els.battleCountdown.classList.add("is-fight");
    }
    if (els.arena) {
      els.arena.classList.remove("countdown-active");
    }
    game.phase = "running";
    game.combatClock.now = 0;
    game.combatClock.paused = false;
    game.lastTime = performance.now();
    startBattleTimer(0);
    els.state.textContent = "전투 진행";
    addLog("전투 시작", "good");
    syncCombatControlsUi();
    updateDevControls();
    game.animationId = requestAnimationFrame(tick);
    game.countdownHideTimer = window.setTimeout(() => {
      game.countdownHideTimer = 0;
      if (els.battleCountdown) {
        els.battleCountdown.hidden = true;
        els.battleCountdown.classList.remove("is-fight");
      }
    }, 520);
  }

  function ensureBattleLoopRunning() {
    if (game.phase !== "running" || game.battleEnding) return;
    if (game.animationId) return;
    game.lastTime = performance.now();
    game.animationId = requestAnimationFrame(tick);
  }

  function getBattleNow() {
    return game.phase === "running" ? game.combatClock.now : performance.now();
  }

  function scheduleTimeout(callback, delay) {
    const task = {
      dueAt: getBattleNow() + Math.max(0, Number(delay) || 0),
      callback,
      cancelled: false
    };
    game.timeouts.add(task);
    return task;
  }

  function processScheduledTimers(now) {
    Array.from(game.timeouts).forEach((task) => {
      if (task.cancelled) {
        game.timeouts.delete(task);
        return;
      }
      if (now < task.dueAt) return;
      game.timeouts.delete(task);
      task.callback();
    });
  }

  function clearScheduledTimers() {
    game.timeouts.forEach((task) => {
      task.cancelled = true;
    });
    game.timeouts.clear();
  }

  function resetCombatControls() {
    game.combatClock.now = 0;
    game.combatClock.paused = false;
    game.combatClock.timeScale = 1;
    syncCombatControlsUi();
    syncCombatAnimationPlayback();
  }

  function toggleCombatPause() {
    if (game.phase !== "running" || game.battleEnding) return;
    game.combatClock.paused = !game.combatClock.paused;
    game.lastTime = performance.now();
    syncCombatControlsUi();
    syncCombatAnimationPlayback();
  }

  function toggleCombatSpeed() {
    if (game.phase !== "running" || game.battleEnding) return;
    game.combatClock.timeScale = game.combatClock.timeScale === 2 ? 1 : 2;
    syncCombatControlsUi();
    syncCombatAnimationPlayback();
  }

  function syncCombatControlsUi() {
    if (!els.pauseButton || !els.speedButton) return;
    const isRunning = game.phase === "running" && !game.battleEnding;
    els.pauseButton.disabled = !isRunning;
    els.speedButton.disabled = !isRunning;
    els.pauseButton.textContent = game.combatClock.paused ? "▶ 계속하기" : "⏸ 일시정지";
    els.speedButton.textContent = game.combatClock.timeScale === 2 ? "×2 배속" : "×1 배속";
    els.pauseButton.classList.toggle("active", isRunning && game.combatClock.paused);
    els.speedButton.classList.toggle("active", isRunning && game.combatClock.timeScale === 2);
    els.arena.classList.toggle("combat-paused", isRunning && game.combatClock.paused);
  }

  function syncCombatAnimationPlayback() {
    if (!els.arena || !els.arena.getAnimations) return;
    const animations = els.arena.getAnimations({ subtree: true });
    animations.forEach((animation) => {
      const cinematicRate = game.battleEnding && game.phase === "ending" ? 0.28 : null;
      animation.playbackRate = cinematicRate || game.combatClock.timeScale || 1;
      if ((game.phase === "running" && game.combatClock.paused) || game.evolutionFreezeActive) {
        animation.pause();
      } else if (animation.playState === "paused") {
        animation.play();
      }
    });
  }

  function resetBattleEndingState(options = {}) {
    clearDefeatCinematicVisuals();
    game.battleEnding = false;
    game.pendingWinnerSide = "";
    game.evolutionFreezeActive = false;
    game.evolutionFreezeUntilWall = 0;
    if (!options.preserveFinalBlow) {
      game.finalBlow = null;
    }
    if (els.arena) {
      els.arena.classList.remove("evolution-freeze", "blue-eyes-cinematic", "blue-eyes-ultimate-impact");
    }
  }

  function clearDefeatCinematicVisuals() {
    if (game.cinematicTimer) {
      window.clearTimeout(game.cinematicTimer);
      game.cinematicTimer = 0;
    }
    removeElement(game.cinematicOverlay);
    game.cinematicOverlay = null;
    if (els.arena) {
      els.arena.classList.remove("defeat-cinematic-active");
      els.arena.style.removeProperty("--defeat-origin-x");
      els.arena.style.removeProperty("--defeat-origin-y");
      els.arena.style.removeProperty("--defeat-pan-x");
      els.arena.style.removeProperty("--defeat-pan-y");
    }
    Object.values(game.fighters).forEach((fighter) => {
      if (!fighter) return;
      const element = getFighterElement(fighter);
      if (element) {
        element.classList.remove("defeat-cinematic-loser", "defeat-cinematic-winner");
      }
    });
  }

  function clearRoundEffects() {
    clearOiiaGreatSpinLooseTitles();
    els.skillLayer.innerHTML = "";
    if (els.arena) {
      els.arena.classList.remove("blue-eyes-cinematic", "blue-eyes-ultimate-impact");
    }
    game.arenaObjects.forEach((object) => removeElement(object.element));
    game.arenaObjects = [];
    game.summons.forEach((summon) => removeElement(summon.element));
    game.summons = [];
    resetUltimateLock();
    Object.values(game.fighters).forEach((fighter) => {
      if (!fighter) return;
      endWorldEnder(fighter, true, getBattleNow());
      fighter.speedMultiplier = 1;
      fighter.arenaSpeedMultiplier = 1;
      if (fighter.arenaSealedSkillIndexes) fighter.arenaSealedSkillIndexes.clear();
      if (fighter.arenaSealedSkillTypes) fighter.arenaSealedSkillTypes.clear();
      fighter.slowMultiplier = 1;
      fighter.slowUntil = 0;
      removeElement(fighter.slowEffect);
      fighter.slowEffect = null;
      fighter.damageReduction = 0;
      fighter.healMultiplier = 1;
      fighter.sizeMultiplier = fighter.baseSizeMultiplier || 1;
      fighter.radius = (fighter.baseRadius || game.fighterBaseRadius || 26) * (fighter.sizeMultiplier || 1);
      fighter.shadowDashReadyAt = 0;
      fighter.shadowDashDamageSuppressUntil = 0;
      fighter.lastSubwayNoBodyUntil = 0;
      fighter.naturalDeathTriggered = false;
      fighter.battlefieldCompressionWallId = "";
      clearJarvanNaturalDeathVisual(fighter);
      resetMaugaState(fighter);
      resetChillGuyState(fighter);
      resetRonaldoState(fighter);
      resetRicoState(fighter);
      resetOiiaState(fighter);
      resetMuzanState(fighter, true);
      resetMonkState(fighter);
      resetGojoState(fighter, true);
      resetChainsawState(fighter, true);
      resetHimState(fighter);
      clearBlueEyesDebuffs(fighter);
      clearBlueEyesVisualState(fighter);
      if (fighter.skillWallContacts) {
        fighter.skillWallContacts.clear();
      }
      if (fighter.divisionWallContacts) {
        fighter.divisionWallContacts.clear();
      }
      if (fighter.oiiaCloneHealContacts) {
        fighter.oiiaCloneHealContacts.clear();
      }
      fighter.duelDefenseWallId = "";
      fighter.duelDefenseMultiplier = 1;
      removeElement(fighter.duelDefenseEffect);
      removeElement(fighter.duelDefenseLabel);
      fighter.duelDefenseEffect = null;
      fighter.duelDefenseLabel = null;
      if (fighter.rampageContactIds) {
        fighter.rampageContactIds.clear();
      }
      if (fighter.blueEyesBodyContactIds) {
        fighter.blueEyesBodyContactIds.clear();
      }
      if (fighter.abilityType === "speedCollisionRamp") {
        fighter.speed = Number(fighter.data.speed) || fighter.speed;
        fighter.roundSpeedStacks = 0;
      }
      fighter.lastRampageStackAt = 0;
      fighter.lastSansDodgeAt = 0;
      if (fighter.sansCollisionLocks) {
        fighter.sansCollisionLocks.clear();
      }
      if (fighter.sansAttackLocks) {
        fighter.sansAttackLocks.clear();
      }
      resetUltimateHiddenState(fighter);
      clearTelekinesisTarget(fighter);
      clearAatroxActiveSkillEffects(fighter);
      fighter.skillState = null;
      fighter.recoveryUntil = 0;
      fighter.recoverySkill = null;
      const element = getFighterElement(fighter);
      element.classList.remove("casting", "recovering", "rampaging", "slowed", "stunned", "duel-defending", "sans-dodging", "sans-eye", "telekinesis-held", "aatrox-ultimate", "chill-shielded", "chill-transformed", "ronaldo-kicking", "ronaldo-jump-ready", "ronaldo-airborne", "ronaldo-ultimate", "monk-meditating", "monk-enlightened", "blue-eyes-evolved", "blue-eyes-invulnerable", "enma-yamato-caster", "enma-yamato-silhouette", "last-subway-rushing", "jarvan-natural-death", "oiia-spin-charging", "oiia-great-spin", "muzan-ultimate-active", "muzan-fatal-regenerating", "chainsaw-shredded", "winner-glow", "defeated");
    });
  }

  function clearOiiaGreatSpinLooseTitles() {
    if (!els.arena) return;
    els.arena.querySelectorAll(".oiia-great-spin-title").forEach((element) => removeElement(element));
  }

  function resetBattleTimer() {
    game.battleClock.startedAt = 0;
    game.battleClock.elapsedMs = 0;
    game.battleClock.running = false;
    updateBattleTimerDisplay();
  }

  function startBattleTimer(now) {
    game.battleClock.startedAt = now;
    game.battleClock.elapsedMs = 0;
    game.battleClock.running = true;
    updateBattleTimerDisplay();
  }

  function updateBattleTimer(now) {
    if (!game.battleClock.running) return;
    game.battleClock.elapsedMs = Math.max(0, now - game.battleClock.startedAt);
    updateBattleTimerDisplay();
  }

  function stopBattleTimer(now = getBattleNow()) {
    if (game.battleClock.running) {
      updateBattleTimer(now);
      game.battleClock.running = false;
      updateBattleTimerDisplay();
    }
  }

  function getBattleElapsedMs(now = getBattleNow()) {
    if (!game.battleClock.running) return game.battleClock.elapsedMs;
    return Math.max(0, now - game.battleClock.startedAt);
  }

  function updateBattleTimerDisplay() {
    const totalTenths = Math.floor(game.battleClock.elapsedMs / 100);
    const minutes = Math.floor(totalTenths / 600);
    const seconds = Math.floor((totalTenths % 600) / 10);
    const tenths = totalTenths % 10;
    els.battleTimer.textContent = `경과 시간 ${padTime(minutes)}:${padTime(seconds)}.${tenths}`;
  }

  function formatElapsedTime(ms) {
    const totalTenths = Math.floor(Math.max(0, ms) / 100);
    const minutes = Math.floor(totalTenths / 600);
    const seconds = Math.floor((totalTenths % 600) / 10);
    const tenths = totalTenths % 10;
    return `${padTime(minutes)}:${padTime(seconds)}.${tenths}`;
  }

  function padTime(value) {
    return String(value).padStart(2, "0");
  }

  function initializeSkillTimers(now) {
    Object.values(game.fighters).forEach((fighter) => {
      fighter.nextSkillAt = {};
      fighter.skills.forEach((skill, index) => {
        const cooldown = Number(skill.cooldown) || 0;
        const initialCooldown = Number(skill.initialCooldown);
        fighter.nextSkillAt[index] = skill.linkedOnly && !Number.isFinite(initialCooldown)
          ? now
          : Number.isFinite(initialCooldown) && initialCooldown >= 0
          ? now + initialCooldown
          : now + 900 + cooldown * 0.35 * Math.random();
      });
    });
  }

  function measureArena() {
    const rect = els.arena.getBoundingClientRect();
    game.arenaSize = rect.width || 560;
    const radius = clamp(game.arenaSize * 0.07, 30, 44);
    game.fighterBaseRadius = radius;
    Object.values(game.fighters).forEach((fighter) => {
      if (!fighter) return;
      fighter.baseRadius = radius;
      fighter.oiiaBaseRadius = radius;
      fighter.radius = radius * (fighter.sizeMultiplier || fighter.baseSizeMultiplier || 1);
      refreshOiiaSize(fighter);
    });
    game.summons.forEach((summon) => {
      summon.baseRadius = radius;
      summon.oiiaBaseRadius = radius;
      refreshOiiaSize(summon);
    });
  }

  function resetPositions() {
    const a = game.fighters.A;
    const b = game.fighters.B;
    const size = game.arenaSize;
    a.x = size * 0.27;
    a.y = size * 0.34;
    b.x = size * 0.73;
    b.y = size * 0.66;
    setVelocityFromAngle(a, randomAngleToward(0.25, 0.9));
    setVelocityFromAngle(b, randomAngleToward(3.4, 4.2));
  }

  function randomAngleToward(min, max) {
    return min + Math.random() * (max - min);
  }

  function setVelocityFromAngle(fighter, angle, speedMultiplier = 1) {
    const speed = getPixelSpeed(fighter) * speedMultiplier;
    fighter.vx = Math.cos(angle) * speed;
    fighter.vy = Math.sin(angle) * speed;
  }

  function getPixelSpeed(fighter) {
    return (54 + getEffectiveSpeed(fighter) * 22) * (game.arenaSize / 560);
  }

  function getEffectiveSpeed(fighter) {
    return fighter.speed * (fighter.speedMultiplier || 1) * (fighter.arenaSpeedMultiplier || 1) * (fighter.slowMultiplier || 1) * (fighter.blueEyesStolenSpeedMultiplier || 1) * getMuzanBloodSpeedMultiplier(fighter) * getChainsawSpeedMultiplier(fighter) * getHimCharmSpeedMultiplier(fighter);
  }

  function applyQuickBet(value) {
    if (game.phase !== "betting") return;
    const parsed = value === "all" ? game.coins : Number(value);
    const nextValue = clamp(Math.floor(parsed) || 1, 1, Math.max(1, game.coins));
    els.betAmount.value = String(nextValue);
    syncBetInput();
  }

  function syncBetInput() {
    let value = Math.floor(Number(els.betAmount.value));
    if (!Number.isFinite(value)) value = 1;
    value = clamp(value, 1, Math.max(1, game.coins));
    game.betValue = value;
    els.betAmount.value = String(value);
    updateButtons();
  }

  function selectBet(side) {
    if (game.phase !== "betting") return;
    game.selectedBet = side;
    els.betA.classList.toggle("selected", side === "A");
    els.betB.classList.toggle("selected", side === "B");
    els.state.textContent = `${side} 선택`;
    updateButtons();
  }

  function updateButtons() {
    const canStart = game.phase === "betting" && game.selectedBet && game.betValue > 0 && game.betValue <= game.coins;
    els.startButton.disabled = !canStart;
    els.betAmount.max = String(Math.max(1, game.coins));
    updateBetMessage(canStart);
    syncCombatControlsUi();
  }

  function updateBetMessage(canStart) {
    if (!els.betMessage) return;
    if (game.phase !== "betting") {
      els.betMessage.textContent = "전투가 진행 중입니다.";
      return;
    }
    if (!game.selectedBet) {
      els.betMessage.textContent = "응원할 진영을 선택하세요.";
      return;
    }
    if (game.betValue < 1) {
      els.betMessage.textContent = "예측 코인은 1 이상이어야 합니다.";
      return;
    }
    if (game.betValue > game.coins) {
      els.betMessage.textContent = "보유 전장 코인을 초과할 수 없습니다.";
      return;
    }
    els.betMessage.textContent = canStart
      ? `${game.selectedBet} 진영에 ${game.betValue} 전장 코인으로 승부를 예측합니다.`
      : "승부 예측 정보를 확인하세요.";
  }

  function startBattle() {
    syncBetInput();
    if (game.phase !== "betting" || !game.selectedBet) return;
    if (!game.currentNickname) {
      game.resumePreparedMatchAfterNickname = true;
      openNicknameScreen({ preservePreparedMatch: true });
      return;
    }
    if (game.betValue < 1 || game.betValue > game.coins) {
      addLog("예측 코인을 다시 확인해주세요.", "bad");
      return;
    }
    if (game.battlefieldSelectionPending) {
      openBattlefieldSelection();
      return;
    }
    startBattleAfterBattlefieldSelection();
  }

  function startBattleAfterBattlefieldSelection() {
    if (!game.selectedBet || game.betValue < 1 || game.betValue > game.coins) {
      setScreenState("MATCHUP");
      game.phase = "betting";
      updateButtons();
      addLog("예측 코인을 다시 확인해주세요.", "bad");
      return;
    }
    if (!game.battlefieldEffectsApplied) {
      applyCurrentBattlefieldEffects();
      renderCharacterPanels();
      renderSkillCardsForFighters();
      updateAllStats();
    }
    resetBattleEndingState();
    closeBattleLog({ resetScroll: true });
    game.combatClock.now = 0;
    game.combatClock.paused = false;
    game.combatClock.timeScale = 1;
    syncCombatControlsUi();
    const now = game.combatClock.now;
    initializeSkillTimers(now);

    game.trainingMode = false;
    game.phase = "running";
    setScreenState("BATTLE");
    measureArena();
    resetPositions();
    placeFighters();
    updateAllStats();
    game.lockedBet = game.selectedBet;
    game.lastTime = performance.now();
    game.lastBodyDamageAt = 0;
    resetBattleTimer();
    els.state.textContent = "전투 준비";
    els.startButton.disabled = true;
    if (els.nextButton) els.nextButton.disabled = true;
    els.betA.disabled = true;
    els.betB.disabled = true;
    els.betAmount.disabled = true;
    addLog(`${game.lockedBet} 진영에 ${game.betValue} 전장 코인 승부 예측`, "skill");
    updateDevControls();
    syncCombatControlsUi();
    startPreBattleCountdown();
  }

  function tick(time) {
    if (game.phase !== "running") return;
    if (game.combatClock.paused) {
      game.lastTime = time;
      syncCombatAnimationPlayback();
      game.animationId = requestAnimationFrame(tick);
      return;
    }
    if (game.evolutionFreezeActive) {
      if (time < game.evolutionFreezeUntilWall) {
        game.lastTime = time;
        syncCombatAnimationPlayback();
        game.animationId = requestAnimationFrame(tick);
        return;
      }
      game.evolutionFreezeActive = false;
      game.evolutionFreezeUntilWall = 0;
      if (els.arena) els.arena.classList.remove("evolution-freeze");
      game.lastTime = time;
      syncCombatAnimationPlayback();
    }
    const realDt = Math.max(0, Math.min((time - game.lastTime) / 1000, MAX_FRAME_STEP));
    game.lastTime = time;
    const dt = realDt * (game.combatClock.timeScale || 1);
    game.combatClock.now += dt * 1000;
    const now = game.combatClock.now;
    try {
      processScheduledTimers(now);
      updateBattleTimer(now);

      updatePassiveState(game.fighters.A, now);
      updatePassiveState(game.fighters.B, now);
      updateStatusEffects(game.fighters.A, now);
      updateStatusEffects(game.fighters.B, now);
      updateSkillState(game.fighters.A, game.fighters.B, now);
      updateSkillState(game.fighters.B, game.fighters.A, now);
      updateArenaObjects(now);
      updateSummons(now);
      runPhysicsSteps(dt, now);
      updateJarvanDuelDefense(game.fighters.A);
      updateJarvanDuelDefense(game.fighters.B);
      placeFighters();
      placeSummons();
      updateAllStats();
      if (game.trainingMode) updateTrainingStatsUi(now);
      checkBattleEnd();
      syncCombatAnimationPlayback();
    } catch (error) {
      handleBattleLoopError(error, now);
      syncCombatAnimationPlayback();
    }

    if (game.phase === "running") {
      game.animationId = requestAnimationFrame(tick);
    }
  }

  function handleBattleLoopError(error, now = getBattleNow()) {
    console.error("[Bounce Bet Arena] 전투 루프 오류", error);
    const fighters = Object.values(game.fighters).filter(Boolean);
    const active = fighters.find((fighter) => fighter.skillState && fighter.skillState.skill);
    if (active && active.skillState && active.skillState.skill) {
      const state = active.skillState;
      const skillName = state.skill.name || state.skill.type || "알 수 없는 스킬";
      console.error(`[Bounce Bet Arena] 스킬 오류 복구: ${active.name} / ${skillName}`, error);
      if (isGojoSkill(state.skill)) {
        clearGojoSkillState(active, state, true);
      }
      if (isMuzanSkill(state.skill)) {
        clearMuzanSkillState(active, state);
      }
      if (isChainsawSkill(state.skill)) {
        clearChainsawSkillState(active, state);
      }
      active.skillState = null;
      if (Number.isFinite(state.storedVx) && Number.isFinite(state.storedVy)) {
        active.vx = state.storedVx;
        active.vy = state.storedVy;
      }
      active.recoveryUntil = Math.max(active.recoveryUntil || 0, now + 350);
      const element = getFighterElement(active);
      if (element) element.classList.remove("casting");
      addLog(`${active.name} ${skillName} 오류 복구`, "bad");
    } else {
      addLog("전투 루프 오류 복구", "bad");
    }
  }

  function runPhysicsSteps(dt, now) {
    if (game.battleEnding) return;
    const steps = Math.max(1, Math.ceil(dt / MAX_PHYSICS_STEP), getDynamicPhysicsSteps(dt));
    const stepDt = dt / steps;
    for (let i = 0; i < steps; i += 1) {
      if (game.trainingMode) {
        moveFighter(game.fighters.A, stepDt, now);
        moveFighter(game.fighters.B, stepDt, now);
        moveSummons(stepDt, now);
        resolveArenaObjectCollisions(game.fighters.A, now);
        resolveArenaObjectCollisions(game.fighters.B, now);
        resolveSummonArenaObjectCollisions(now);
        resolveOiiaOwnerCloneCollisions(now);
        resolveOiiaGreatSpinCloneCollisions(now);
        resolveSummonCollisions(now);
        continue;
      }
      moveFighter(game.fighters.A, stepDt, now);
      moveFighter(game.fighters.B, stepDt, now);
      moveSummons(stepDt, now);
      resolveArenaObjectCollisions(game.fighters.A, now);
      resolveArenaObjectCollisions(game.fighters.B, now);
      resolveSummonArenaObjectCollisions(now);
      resolveCircleCollision(game.fighters.A, game.fighters.B, now);
      resolveOiiaOwnerCloneCollisions(now);
      resolveOiiaGreatSpinCloneCollisions(now);
      resolveSummonCollisions(now);
    }
    removeDeadSummons(now);
  }

  function getDynamicPhysicsSteps(dt) {
    const bodies = [game.fighters.A, game.fighters.B].concat(game.summons)
      .filter((body) => body && !body.dead && !body.removing && !isFighterOutOfBattle(body));
    if (!bodies.length) return 1;

    const maxVelocity = bodies.reduce((largest, body) => Math.max(largest, Math.hypot(body.vx || 0, body.vy || 0)), 0);
    const minRadius = bodies.reduce((smallest, body) => Math.min(smallest, Math.max(6, body.radius || game.fighterBaseRadius || 26)), Infinity);
    const maxStepDistance = Math.max(6, minRadius * 0.45);
    return clamp(Math.ceil((maxVelocity * dt) / maxStepDistance), 1, 24);
  }

  function updateSummons(now) {
    game.summons.forEach((summon) => {
      refreshOiiaSize(summon);
      updateEntitySlowEffect(summon, now);
      updateMaugaBurns(summon, now);
      updateBlueEyesDebuffs(summon, now);
      updateGojoMarksOnEntity(summon, now);
      updateMuzanBloodOnEntity(summon, now);
    });
    removeDeadSummons(now);
  }

  function moveSummons(dt, now) {
    game.summons.forEach((summon) => {
      if (summon.dead || summon.removing || summon.bornAt >= now) return;
      summon.x += summon.vx * dt;
      summon.y += summon.vy * dt;
      resolveWallCollision(summon, now);
      normalizeVelocity(summon, getPixelSpeed(summon));
    });
  }

  function resolveSummonArenaObjectCollisions(now) {
    game.summons.forEach((summon) => {
      if (summon.dead || summon.removing || summon.bornAt >= now) return;
      game.arenaObjects.forEach((object) => {
        if (object.type === "circleWall") {
          resolveCircleWallCollision(summon, object, now);
        }
        if (object.type === "compressionWall") {
          resolveCompressionWallCollision(summon, object, now);
        }
        if (object.type === "maugaCage") {
          resolveMaugaCageCollision(summon, object);
        }
      });
    });
  }

  function resolveSummonCollisions(now) {
    game.summons.forEach((summon) => {
      if (summon.dead || summon.removing || summon.bornAt >= now) return;
      const targets = getOpposingSummonTargets(summon, now);
      if (!summon.contactTargetIds) summon.contactTargetIds = new Set();
      const activeContacts = new Set();
      let handledContact = false;

      for (const candidate of targets) {
        const data = getCircleOverlap(summon, candidate);
        const key = getEntityContactKey(candidate);
        if (data.overlap <= 0) {
          summon.contactTargetIds.delete(key);
          continue;
        }
        activeContacts.add(key);

        const { nx, ny, overlap } = data;
        const summonMove = candidate.isOiiaClone ? overlap * 0.5 : overlap;
        summon.x -= nx * summonMove;
        summon.y -= ny * summonMove;
        keepInsideArena(summon);

        if (candidate.isOiiaClone) {
          candidate.x += nx * summonMove;
          candidate.y += ny * summonMove;
          keepInsideArena(candidate);
        }
        reflectCollisionVelocity(summon, candidate, nx, ny);

        if (handledContact) continue;
        handledContact = true;
        if (now < summon.canHitAt || summon.contactTargetIds.has(key)) continue;
        summon.contactTargetIds.add(key);

        handleMonkComboCollision(candidate, summon, now);
        const cloneDamage = Math.max(1, summon.currentHp * 2);
        applyDamage(summon, candidate, {
          label: "Oiia 분신 충돌",
          baseDamage: cloneDamage,
          attackId: `oiia-clone-contact-${summon.id}-${key}-${Math.round(now)}`,
          hitId: "contact"
        });
      }

      summon.contactTargetIds.forEach((key) => {
        if (!activeContacts.has(key)) summon.contactTargetIds.delete(key);
      });
    });
  }

  function resolveOiiaOwnerCloneCollisions(now) {
    game.summons.forEach((summon) => {
      if (!summon || !summon.isOiiaClone || summon.dead || summon.removing || summon.bornAt >= now) return;
      const owner = getFighterById(summon.ownerId);
      if (!owner || owner.dead || owner.side !== summon.side || isFighterOutOfBattle(owner)) return;
      if (!owner.oiiaCloneHealContacts) owner.oiiaCloneHealContacts = new Set();
      const key = summon.id;
      const data = getCircleOverlap(summon, owner);
      if (data.overlap <= 0) {
        owner.oiiaCloneHealContacts.delete(key);
        return;
      }

      const { nx, ny, overlap } = data;
      const move = overlap * 0.5;
      summon.x -= nx * move;
      summon.y -= ny * move;
      owner.x += nx * move;
      owner.y += ny * move;
      keepInsideArena(summon);
      keepInsideArena(owner);
      reflectCollisionVelocity(summon, owner, nx, ny);

      if (owner.oiiaCloneHealContacts.has(key)) return;
      owner.oiiaCloneHealContacts.add(key);
      const healed = healFighter(owner, summon.currentHp * 0.5, "분신 공명");
      if (healed > 0) {
        createOiiaCloneHealEffect(summon, owner, healed);
      }
    });
  }

  function resolveOiiaGreatSpinCloneCollisions(now) {
    Object.values(game.fighters).forEach((owner) => {
      if (!isOiiaGreatSpinActive(owner, now)) return;
      const state = owner.oiiaGreatSpin;
      if (!state.cloneContacts) state.cloneContacts = new Set();
      const activeContacts = new Set();
      const clones = getOwnedOiiaSummons(owner)
        .filter((clone) => clone && !clone.dead && !clone.removing && clone.bornAt < now);

      for (let i = 0; i < clones.length; i += 1) {
        for (let j = i + 1; j < clones.length; j += 1) {
          const first = clones[i];
          const second = clones[j];
          const data = getCircleOverlap(first, second);
          const key = [first.id, second.id].sort().join(":");
          if (data.overlap <= 0) {
            state.cloneContacts.delete(key);
            continue;
          }

          activeContacts.add(key);
          const { nx, ny, overlap } = data;
          const move = overlap * 0.5;
          first.x -= nx * move;
          first.y -= ny * move;
          second.x += nx * move;
          second.y += ny * move;
          keepInsideArena(first);
          keepInsideArena(second);
          reflectCollisionVelocity(first, second, nx, ny);

          if (state.cloneContacts.has(key)) continue;
          state.cloneContacts.add(key);
          const source = first.currentHp >= second.currentHp ? first : second;
          if (handleOiiaDivision(source, now)) {
            createOiiaGreatSpinCloneCollisionEffect(
              (first.x + second.x) / 2,
              (first.y + second.y) / 2,
              Math.max(first.radius, second.radius)
            );
          }
        }
      }

      state.cloneContacts.forEach((key) => {
        if (!activeContacts.has(key)) state.cloneContacts.delete(key);
      });
    });
  }

  function getEntityContactKey(entity) {
    return entity && (entity.id || `${entity.side || "entity"}-${entity.name || "unknown"}`);
  }

  function reflectCollisionVelocity(source, target, nx, ny) {
    const sourceDot = (source.vx || 0) * nx + (source.vy || 0) * ny;
    if (sourceDot > 0) {
      source.vx -= 2 * sourceDot * nx;
      source.vy -= 2 * sourceDot * ny;
    }
    if (target && Number.isFinite(target.vx) && Number.isFinite(target.vy)) {
      const targetDot = target.vx * nx + target.vy * ny;
      if (targetDot < 0) {
        target.vx -= 2 * targetDot * nx;
        target.vy -= 2 * targetDot * ny;
      }
      if (!target.dead && !isFighterOutOfBattle(target)) normalizeVelocity(target, getPixelSpeed(target));
    }
    if (!source.dead && !source.removing) normalizeVelocity(source, getPixelSpeed(source));
  }

  function getCircleOverlap(source, target) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.hypot(dx, dy) || 1;
    const minDistance = source.radius + target.radius;
    return {
      nx: dx / distance,
      ny: dy / distance,
      overlap: minDistance - distance
    };
  }

  function getOpposingSummonTargets(summon, now) {
    const mainTarget = getOpposingFighter(summon.side);
    return [mainTarget]
      .concat(game.summons.filter((target) => target.side !== summon.side))
      .filter((target) => target && !target.dead && !target.removing && !isFighterOutOfBattle(target) && target !== summon && (!target.isOiiaClone || target.bornAt < now));
  }

  function removeDeadSummons(now = getBattleNow()) {
    const alive = [];
    game.summons.forEach((summon) => {
      if (summon.currentHp <= 0 && !summon.removing) {
        startOiiaSummonRemoval(summon, "zero", now);
      }
      if (summon.dead || summon.removing) {
        if (summon.removeAt && now < summon.removeAt) {
          alive.push(summon);
          return;
        }
        clearSummonReferences(summon);
        removeElement(summon.element);
      } else {
        alive.push(summon);
      }
    });
    game.summons = alive;
  }

  function getOpposingFighter(side) {
    return side === "A" ? game.fighters.B : game.fighters.A;
  }

  function updateSkillState(fighter, opponent, now) {
    if (game.battleEnding) return;
    if (fighter.dead) return;
    updateConceptSuppressionState(fighter, now);
    if (isGojoDomainLocked(fighter, now)) {
      if (fighter.skillState) cancelFighterSkill(fighter);
      return;
    }
    if (isConceptFullySuppressed(fighter, now)) {
      if (fighter.skillState) cancelFighterSkill(fighter);
      updateRecoveryState(fighter, now);
      return;
    }
    if (isHimAbsoluteCharmed(fighter, now)) {
      if (fighter.skillState) cancelFighterSkill(fighter);
      updateRecoveryState(fighter, now);
      return;
    }

    updateRecoveryState(fighter, now);
    if (fighter.skillState && isSkillBlockedByHimCharm(fighter, fighter.skillState.skill, now)) {
      cancelFighterSkill(fighter);
      return;
    }
    if (isFighterStunned(fighter, now)) {
      if (fighter.skillState && fighter.skillState.skill && (fighter.skillState.skill.type === "oiiaGreatSpin" || fighter.skillState.skill.type === "gojoUnlimitedVoid")) {
        updateActiveSkillState(fighter, opponent, now);
        return;
      }
      if (fighter.skillState) {
        cancelFighterSkill(fighter);
      }
      return;
    }

    if (fighter.skillState) {
      updateActiveSkillState(fighter, opponent, now);
      return;
    }

    if (game.trainingMode) return;

    if (isFighterOutOfBattle(fighter) || isFighterOutOfBattle(opponent)) return;
    if (fighter.recoveryUntil > now) return;
    if (tryStartPendingBlueEyesUltimate(fighter, opponent, now)) return;

    const skillEntries = fighter.abilityType === "chainsawDevil"
      ? getChainsawSkillPriorityEntries(fighter)
      : fighter.skills.map((skill, index) => ({ skill, index }));
    skillEntries.forEach(({ skill, index }) => {
      if (fighter.skillState || fighter.recoveryUntil > now) return;
      if (skill.linkedOnly) return;
      if (isSkillSealedByBattlefield(fighter, skill, index)) return;
      if (isSkillSuppressedByConcept(fighter, skill, now)) return;
      if (isSkillBlockedByHimCharm(fighter, skill, now)) return;
      if (now >= (fighter.nextSkillAt[index] || 0)) {
        if (!shouldStartSkillNow(fighter, opponent, skill, now)) return;
        if (isUltimateSkill(skill) && isUltimateLockedByOther(fighter, skill)) return;
        if (skill.type === "cageFight" && !canStartMaugaCageFight(fighter, opponent, skill)) return;
        startSkillCast(fighter, opponent, skill, index, now);
      }
    });
  }

  function shouldStartSkillNow(fighter, opponent, skill, now) {
    if (fighter && fighter.abilityType === "himCharm") {
      return shouldStartHimSkillNow(fighter, opponent, skill, now);
    }
    if (fighter && fighter.abilityType === "chainsawDevil") {
      return shouldStartChainsawSkillNow(fighter, opponent, skill, now);
    }
    if (skill && (skill.type === "muzanBlackBloodWhip" || skill.type === "muzanCellCollapse" || skill.type === "muzanNeuralShockwave" || skill.type === "muzanDemonKing")) {
      return shouldStartMuzanSkillNow(fighter, opponent, skill, now);
    }
    if (skill && skill.type === "battlefieldCompression") {
      return !getActiveBattlefieldCompressionWall(fighter);
    }
    if (skill && skill.type === "oiiaGreatSpin") {
      return fighter && fighter.abilityType === "oiiaDivision" && !isOiiaGreatSpinActive(fighter, now);
    }
    if (fighter && fighter.abilityType === "monkReflector") {
      return shouldStartMonkSkillNow(fighter, opponent, skill, now);
    }
    if (fighter && fighter.abilityType === "ricoBouncer") {
      return shouldStartRicoSkillNow(fighter, opponent, skill, now);
    }
    if (!fighter || fighter.abilityType !== "ronaldoChampion") return true;
    if (!opponent || opponent.dead || isFighterOutOfBattle(opponent)) return false;
    if (skill.type === "siuuuChampion") return true;
    if (skill.type !== "ronaldoFreeKick" && skill.type !== "ronaldoHeader") return true;

    const distance = Math.hypot(opponent.x - fighter.x, opponent.y - fighter.y);
    const closeRange = game.arenaSize * 0.3;
    const farRange = game.arenaSize * 0.38;
    const clusteredSummons = countEnemySummonsNear(fighter.side, opponent.x, opponent.y, game.arenaSize * 0.18) >= 2;
    const headerSkillIndex = fighter.skills.findIndex((item) => item.type === "ronaldoHeader");
    const headerReady = headerSkillIndex >= 0 && now >= (fighter.nextSkillAt[headerSkillIndex] || 0);

    if (skill.type === "ronaldoHeader") {
      return distance <= closeRange || clusteredSummons || !isRonaldoFreeKickReady(fighter, now);
    }

    if (headerReady && (distance <= closeRange || clusteredSummons)) return false;
    return distance >= farRange || !headerReady;
  }

  function isRonaldoFreeKickReady(fighter, now) {
    const index = fighter.skills.findIndex((skill) => skill.type === "ronaldoFreeKick");
    return index >= 0 && now >= (fighter.nextSkillAt[index] || 0);
  }

  function countEnemySummonsNear(side, x, y, radius) {
    return game.summons.filter((summon) => (
      summon &&
      summon.side !== side &&
      !summon.dead &&
      !summon.removing &&
      Math.hypot(summon.x - x, summon.y - y) <= radius + summon.radius
    )).length;
  }

  function updatePassiveState(fighter, now) {
    updateConceptSuppressionState(fighter, now);
    updateChainsawState(fighter, now);
    if (isPassiveSuppressedByConcept(fighter, now)) {
      updateStunState(fighter, now);
      if (
        fighter.abilityType === "jarvanTimedWall" &&
        !fighter.naturalDeathTriggered &&
        !game.trainingMode &&
        !game.battleEnding &&
        !game.finalBlow &&
        getBattleElapsedMs(now) >= JARVAN_DEATH_TIME_MS
      ) {
        triggerJarvanNaturalDeath(fighter, now);
      }
      return;
    }
    updateWorldEnderState(fighter, now);
    updateMaugaState(fighter, now);
    updateChillGuyState(fighter, now);
    updateRonaldoUltimateState(fighter, now);
    updateRonaldoProjectiles(fighter, now);
    updateRicoUltimateState(fighter, now);
    updateRicoProjectiles(fighter, now);
    updateOiiaProjectiles(fighter, now);
    updateOiiaGreatSpinState(fighter, now);
    updateMuzanState(fighter, now);
    updateMonkState(fighter, now);
    updateGojoState(fighter, now);
    updateHimState(fighter, now);
    updateStunState(fighter, now);
    updateBlueEyesState(fighter, now);
    if (fighter.dead) return;

    if (
      fighter.abilityType === "jarvanTimedWall" &&
      !fighter.naturalDeathTriggered &&
      !game.trainingMode &&
      !game.battleEnding &&
      !game.finalBlow &&
      getBattleElapsedMs(now) >= JARVAN_DEATH_TIME_MS
    ) {
      triggerJarvanNaturalDeath(fighter, now);
      return;
    }

    updateJarvanDuelDefense(fighter);
  }

  function updateStatusEffects(fighter, now) {
    updateEntitySlowEffect(fighter, now);
    updateMaugaBurns(fighter, now);
    updateBlueEyesDebuffs(fighter, now);
    updateGojoMarksOnEntity(fighter, now);
    updateMuzanBloodOnEntity(fighter, now);
    updateHimEffectsOnEntity(fighter, now);
  }

  function updateEntitySlowEffect(entity, now) {
    if (!entity || entity.dead) return;

    if (entity.slowUntil && now >= entity.slowUntil) {
      entity.slowUntil = 0;
      entity.slowMultiplier = 1;
      removeElement(entity.slowEffect);
      entity.slowEffect = null;
      const element = getEntityElement(entity);
      if (element) element.classList.remove("slowed");
      normalizeVelocity(entity, getPixelSpeed(entity));
      addLog(`${entity.name} 둔화 해제`, "skill");
    }
  }

  function isUltimateSkill(skill) {
    return !!(skill && (skill.isUltimate || skill.type === "gasterDoomBarrage" || skill.type === "worldEnder" || skill.type === "cageFight" || skill.type === "siuuuChampion" || skill.type === "superBounceStorm" || skill.type === "enlightenmentField" || skill.type === "blueEyesUltimateBurst" || skill.type === "blueEyesNeutronBlast" || skill.type === "lastSubwayRush" || skill.type === "muzanDemonKing" || skill.type === "himAbsoluteCharm"));
  }

  function isUltimateLockedByOther(fighter) {
    return game.activeUltimate.isActive && game.activeUltimate.ownerId && game.activeUltimate.ownerId !== fighter.id;
  }

  function acquireUltimateLock(fighter, skill) {
    if (!isUltimateSkill(skill)) return true;
    if (isUltimateLockedByOther(fighter)) return false;
    game.activeUltimate.ownerId = fighter.id;
    game.activeUltimate.ultimateId = `${fighter.id}:${skill.type}`;
    game.activeUltimate.isActive = true;
    return true;
  }

  function releaseUltimateLock(fighter, skill) {
    if (!isUltimateSkill(skill)) return;
    if (!game.activeUltimate.isActive) return;
    if (fighter && game.activeUltimate.ownerId !== fighter.id) return;
    if (
      fighter &&
      skill &&
      skill.type === "himAbsoluteCharm" &&
      fighter.himAbsoluteCharm &&
      getBattleNow() < (fighter.himAbsoluteCharm.endAt || 0)
    ) {
      return;
    }
    resetUltimateLock();
  }

  function resetUltimateLock() {
    game.activeUltimate.ownerId = null;
    game.activeUltimate.ultimateId = null;
    game.activeUltimate.isActive = false;
  }

  function getEffectiveSkillCooldown(fighter, skill) {
    const cooldown = Number(skill.cooldown) || 2500;
    if (fighter && fighter.aatroxUltimate && fighter.aatroxUltimate.active && skill.type === "darkinBlade") {
      return cooldown / 1.3;
    }
    if (fighter && fighter.maugaCage && fighter.maugaCage.active && skill.type === "maugaGuns") {
      return Math.min(cooldown, Number(fighter.maugaCage.gunRepeatDelay) || 1500);
    }
    if (fighter && fighter.ronaldoUltimate && fighter.ronaldoUltimate.active && (skill.type === "ronaldoFreeKick" || skill.type === "ronaldoHeader")) {
      return cooldown / (Number(fighter.ronaldoUltimate.cooldownSpeed) || 1.4);
    }
    if (fighter && isGojoDomainActive(fighter, getBattleNow()) && (skill.type === "gojoBlue" || skill.type === "gojoRed")) {
      return 2500;
    }
    return cooldown;
  }

  function getEffectiveSkillDelay(fighter, skill) {
    const baseDelay = skill && skill.type === "blueEyesNeutronBlast"
      ? clamp(Number(skill.roarDuration) || 900, 800, 1000)
      : Math.max(0, Number(skill && skill.delay) || 0);
    if (fighter && isGojoDomainActive(fighter, getBattleNow()) && skill && (skill.type === "gojoBlue" || skill.type === "gojoRed")) {
      return Math.max(0, baseDelay * 0.65);
    }
    if (fighter && isHimCharmed(fighter, getBattleNow()) && skill && isUltimateSkill(skill) && !isHimAbsoluteCharmed(fighter, getBattleNow())) {
      return baseDelay + 500;
    }
    return baseDelay;
  }

  function isRicoSkill(skill) {
    return !!(skill && (
      skill.type === "ricoBouncyShot" ||
      skill.type === "ricoTrickShot" ||
      skill.type === "ricoMultiBall" ||
      skill.type === "superBounceStorm"
    ));
  }

  function isMonkSkill(skill) {
    return !!(skill && (
      skill.type === "calmPalmStrike" ||
      skill.type === "monkMeditation" ||
      skill.type === "enlightenmentField"
    ));
  }

  function startSkillCast(fighter, opponent, skill, index, now) {
    if (game.battleEnding) return;
    if (isSkillSuppressedByConcept(fighter, skill, now)) return;
    if (isSkillBlockedByHimCharm(fighter, skill, now)) return;
    if (skill && skill.type === "muzanCellCollapse" && getMuzanBloodCount(opponent, fighter) <= 0) {
      addLog("세포 붕괴에는 무잔의 피가 필요합니다.", "skill");
      return;
    }
    if (skill && skill.type === "muzanDemonKing" && fighter.muzanUltimate && fighter.muzanUltimate.active) {
      return;
    }
    if (skill && skill.type === "blueEyesChaosDimension" && isBlueEyesChaosFieldActive(fighter, now)) {
      return;
    }
    if (skill && skill.type === "battlefieldCompression" && getActiveBattlefieldCompressionWall(fighter)) {
      return;
    }
    if (isUltimateSkill(skill) && !acquireUltimateLock(fighter, skill)) {
      return;
    }
    if (skill && skill.type === "enmaYamatoFlash") {
      positionEnmaYamatoCasterAtFarEdge(fighter, opponent);
    }
    const delay = getEffectiveSkillDelay(fighter, skill);
    fighter.skillState = {
      skill,
      index,
      phase: "delay",
      activateAt: now + delay,
      storedVx: fighter.vx,
      storedVy: fighter.vy,
      data: createSkillStateData(fighter, opponent, skill)
    };
    addSkillWarning(fighter, skill);
    if (skill && skill.type === "muzanNeuralShockwave") {
      fighter.vx *= 0.42;
      fighter.vy *= 0.42;
    } else {
      fighter.vx = 0;
      fighter.vy = 0;
    }
    fighter.nextSkillAt[index] = now + Math.max(500, getEffectiveSkillCooldown(fighter, skill));
    getFighterElement(fighter).classList.add("casting");
    if (skill.name) {
      addLog(`${fighter.name} 스킬 준비: ${getBlueEyesSkillName(skill)}`, "skill");
    }
    if (delay === 0) {
      activateSkill(fighter, opponent, now);
    }
  }

  function positionEnmaYamatoCasterAtFarEdge(fighter, opponent) {
    if (!fighter || !opponent) return;
    const size = game.arenaSize || 560;
    const radius = clamp(Number(fighter.radius) || game.fighterBaseRadius || 26, 1, size / 2);
    const min = radius;
    const max = Math.max(radius, size - radius);
    const candidates = [
      { x: min, y: min },
      { x: max, y: min },
      { x: min, y: max },
      { x: max, y: max },
      { x: min, y: clamp(opponent.y, min, max) },
      { x: max, y: clamp(opponent.y, min, max) },
      { x: clamp(opponent.x, min, max), y: min },
      { x: clamp(opponent.x, min, max), y: max }
    ];
    const previousX = fighter.x;
    const previousY = fighter.y;
    let best = candidates[0];
    let bestDistance = -Infinity;
    let bestMoveDistance = Infinity;
    candidates.forEach((candidate) => {
      const distanceFromOpponent = Math.hypot(candidate.x - opponent.x, candidate.y - opponent.y);
      const moveDistance = Math.hypot(candidate.x - previousX, candidate.y - previousY);
      if (distanceFromOpponent > bestDistance + 0.001 || (Math.abs(distanceFromOpponent - bestDistance) <= 0.001 && moveDistance < bestMoveDistance)) {
        best = candidate;
        bestDistance = distanceFromOpponent;
        bestMoveDistance = moveDistance;
      }
    });
    fighter.x = clamp(best.x, min, max);
    fighter.y = clamp(best.y, min, max);
    const element = getFighterElement(fighter);
    if (element) placeFighterElement(element, fighter);
    createEnmaYamatoRepositionTrail(previousX, previousY, fighter.x, fighter.y, radius);
  }

  function updateActiveSkillState(fighter, opponent, now) {
    if (!fighter.skillState) return;
    updateSkillWarning(fighter);
    if (fighter.skillState.phase === "active") {
      updateRunningSkill(fighter, opponent, now);
      return;
    }
    if (fighter.skillState.phase === "delay" && now >= fighter.skillState.activateAt) {
      activateSkill(fighter, opponent, now);
    }
  }

  function activateSkill(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;
    getFighterElement(fighter).classList.remove("casting");
    removeElement(state.data.warning);

    if (fighter.dead) return;
    if (isSkillSuppressedByConcept(fighter, state.skill, now)) {
      cancelFighterSkill(fighter);
      restoreStoredVelocity(fighter, state);
      startSkillRecovery(fighter, state.skill, now);
      return;
    }
    if (isSkillBlockedByHimCharm(fighter, state.skill, now)) {
      cancelFighterSkill(fighter);
      restoreStoredVelocity(fighter, state);
      startSkillRecovery(fighter, state.skill, now);
      return;
    }
    if (isFighterOutOfBattle(opponent) && state.skill.type !== "gasterDoomBarrage") {
      cancelFighterSkill(fighter);
      restoreStoredVelocity(fighter, state);
      startSkillRecovery(fighter, state.skill, now);
      return;
    }

    state.phase = "active";
    rememberRecentNormalSkillUse(fighter, state.skill);
    runSkillActions(fighter, opponent, state.skill, now);
  }

  function restoreStoredVelocity(fighter, state) {
    fighter.vx = state.storedVx;
    fighter.vy = state.storedVy;
    normalizeVelocity(fighter, getPixelSpeed(fighter));
  }

  function startSkillRecovery(fighter, skill, now) {
    const duration = getSkillRecoveryDuration(skill);
    fighter.skillState = null;
    fighter.recoveryUntil = now + duration;
    fighter.recoverySkill = skill;
    getFighterElement(fighter).classList.add("recovering");
  }

  function updateRecoveryState(fighter, now) {
    if (fighter.recoveryUntil && fighter.recoveryUntil <= now) {
      releaseUltimateLock(fighter, fighter.recoverySkill);
      fighter.recoveryUntil = 0;
      fighter.recoverySkill = null;
      getFighterElement(fighter).classList.remove("recovering");
    }
  }

  function getSkillRecoveryDuration(skill) {
    return Math.max(0, Number(skill.recovery) || 500);
  }

  function createSkillStateData(fighter, opponent, skill) {
    if (skill.type === "teleportWallStrike") {
      const wallRadius = fighter.radius * (Number(skill.wallRadiusRate) || 3.6);
      const target = getSafeCircleCenter(opponent.x, opponent.y, wallRadius);
      return {
        targetX: target.x,
        targetY: target.y
      };
    }

    if (skill.type === "bloodMoonSlash") {
      const direction = getOpponentDirection(fighter, opponent);
      return {
        dirX: direction.x,
        dirY: direction.y,
        angle: direction.angle
      };
    }

    if (skill.type === "chainsawChainGrab") {
      const direction = getOpponentDirection(fighter, opponent);
      return {
        dirX: direction.x,
        dirY: direction.y,
        angle: direction.angle,
        targetId: opponent && opponent.id,
        hitTargets: new Set(),
        effects: [],
        timers: [],
        attackId: `chainsaw-grab-${fighter.id}-${Math.round(getBattleNow())}`
      };
    }

    if (skill.type === "chainsawSawSpin") {
      return {
        effects: [],
        timers: []
      };
    }

    if (skill.type === "chainsawHellArena") {
      return {
        effects: [],
        timers: [],
        hitTargets: new Set(),
        targetId: opponent && opponent.id,
        attackId: `chainsaw-hell-${fighter.id}-${Math.round(getBattleNow())}`
      };
    }

    if (skill.type === "enmaYamatoFlash") {
      const direction = getOpponentDirection(fighter, opponent);
      const startX = fighter.x;
      const startY = fighter.y;
      const maxLength = game.arenaSize * (Number(skill.lengthRate) || 1.45);
      const length = getArenaRayLength(startX, startY, direction.x, direction.y, maxLength);
      const width = fighter.radius * (Number(skill.widthRate) || 6.2);
      return {
        originX: startX,
        originY: startY,
        casterX: fighter.x,
        casterY: fighter.y,
        ownerId: fighter.id,
        dirX: direction.x,
        dirY: direction.y,
        angle: direction.angle,
        length,
        width,
        crescentSize: Math.max(width * 1.82, fighter.radius * 6.8),
        hitTargets: new Set(),
        timers: []
      };
    }

    if (skill.type === "blueTelekinesis") {
      const range = game.arenaSize * (Number(skill.rangeRate) || 0.68);
      const distance = Math.hypot(opponent.x - fighter.x, opponent.y - fighter.y);
      return {
        targetInRangeAtCast: distance <= range,
        range
      };
    }

    if (skill.type === "ronaldoFreeKick") {
      const dx = opponent.x - fighter.x;
      const dy = opponent.y - fighter.y;
      const distance = Math.hypot(dx, dy) || 1;
      return {
        targetX: opponent.x,
        targetY: opponent.y,
        dirX: dx / distance,
        dirY: dy / distance,
        angle: Math.atan2(dy, dx)
      };
    }

    if (skill.type === "ronaldoHeader") {
      const travelTime = ((Number(skill.delay) || 500) + (Number(skill.airTime) || 450)) / 1000;
      const predicted = getSafeRonaldoLandingPoint(
        fighter,
        opponent.x + (opponent.vx || 0) * travelTime,
        opponent.y + (opponent.vy || 0) * travelTime
      );
      return {
        landingX: predicted.x,
        landingY: predicted.y
      };
    }

    if (skill.type === "oiiaAllOutAttack") {
      return {
        targetX: opponent.x,
        targetY: opponent.y,
        participantIds: getOiiaAllOutParticipants(fighter).map((source) => source.id),
        effects: [],
        timers: []
      };
    }

    if (skill.type === "muzanBlackBloodWhip") {
      return {
        attackId: `muzan-whip-${fighter.id}-${Math.round(getBattleNow())}`,
        effects: [],
        timers: [],
        hitCounts: new Map()
      };
    }

    if (skill.type === "muzanCellCollapse") {
      return {
        targetId: opponent.id,
        targetX: opponent.x,
        targetY: opponent.y,
        radius: game.arenaSize * (Number(skill.radiusRate) || 0.21),
        attackId: `muzan-collapse-${fighter.id}-${Math.round(getBattleNow())}`,
        effects: [],
        timers: []
      };
    }

    if (skill.type === "muzanNeuralShockwave") {
      return {
        originX: fighter.x,
        originY: fighter.y,
        radius: game.arenaSize * (Number(skill.radiusRate) || 0.56),
        attackId: `muzan-neural-${fighter.id}-${Math.round(getBattleNow())}`,
        effects: [],
        timers: [],
        pulseHits: [],
        disruptedTargets: new Set(),
        bloodGranted: false
      };
    }

    if (skill.type === "muzanDemonKing") {
      return {
        effects: [],
        timers: [],
        attackId: `muzan-ultimate-${fighter.id}-${Math.round(getBattleNow())}`
      };
    }

    if (skill.type === "gojoRed") {
      const direction = getOpponentDirection(fighter, opponent);
      const range = game.arenaSize * (Number(skill.rangeRate) || 0.88);
      return {
        targetId: opponent.id,
        dirX: direction.x,
        dirY: direction.y,
        angle: direction.angle,
        range,
        width: fighter.radius * (Number(skill.widthRate) || 1.75),
        hitTargets: new Set()
      };
    }

    if (skill.type === "ricoTrickShot") {
      return getRicoTrickAimData(fighter, opponent);
    }

    if (skill.type === "blueEyesTripleBurstStream") {
      const direction = getOpponentDirection(fighter, opponent);
      const rangeMultiplier = Number(skill.rangeMultiplier) || 2;
      return {
        dirX: direction.x,
        dirY: direction.y,
        angle: direction.angle,
        range: game.arenaSize * (Number(skill.rangeRate) || 1.35) * rangeMultiplier,
        rangeMultiplier,
        arcRadians: ((Number(skill.arcDegrees) || 180) * Math.PI) / 180
      };
    }

    if (skill.type === "blueEyesChaosDimension") {
      return {
        centerX: game.arenaSize / 2,
        centerY: game.arenaSize / 2,
        radius: game.arenaSize * (Number(skill.radiusRate) || 0.34)
      };
    }

    if (skill.type === "blueEyesNeutronBlast") {
      return getBlueEyesMeteorCastData(fighter, opponent, skill);
    }

    return {};
  }

  function getSafeCircleCenter(x, y, radius) {
    const fighterMargin = getLargestFighterRadius() + 4;
    const safeMargin = Math.min(Math.max(radius + fighterMargin, 0), game.arenaSize / 2 - 2);
    return {
      x: clamp(x, safeMargin, game.arenaSize - safeMargin),
      y: clamp(y, safeMargin, game.arenaSize - safeMargin)
    };
  }

  function getLargestFighterRadius() {
    return Object.values(game.fighters).reduce((largest, fighter) => Math.max(largest, fighter ? fighter.radius : 0), 0);
  }

  function runSkillActions(fighter, opponent, skill, now) {
    if (skill.type === "circleMultiSlash") {
      startCircleMultiSlash(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "teleportWallStrike") {
      useTeleportWallStrike(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "battlefieldCompression") {
      useBattlefieldCompression(fighter, skill, now);
      return;
    }

    if (skill.type === "himGazeLock") {
      startHimGazeLock(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "himForbiddenGesture") {
      startHimForbiddenGesture(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "himAbsoluteCharm") {
      startHimAbsoluteCharm(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "chainsawChainGrab") {
      startChainsawChainGrab(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "chainsawSawSpin") {
      activateChainsawSawSpin(fighter, skill, now);
      return;
    }

    if (skill.type === "chainsawHellArena") {
      startChainsawHellArena(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "lastSubwayRush") {
      startLastSubwayRush(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "bloodMoonSlash") {
      startBloodMoonSlash(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "enmaYamatoFlash") {
      startEnmaYamatoFlash(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "darkinBlade") {
      startDarkinBlade(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "infernalChains") {
      startInfernalChains(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "threeLegRampage") {
      startThreeLegRampage(fighter, skill, now);
      return;
    }

    if (skill.type === "deepSeaAmbush") {
      startDeepSeaAmbush(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "oiiaAllOutAttack") {
      startOiiaAllOutAttack(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "oiiaGreatSpin") {
      startOiiaGreatSpin(fighter, skill, now);
      return;
    }

    if (skill.type === "muzanBlackBloodWhip") {
      startMuzanBlackBloodWhip(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "muzanCellCollapse") {
      startMuzanCellCollapse(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "muzanNeuralShockwave") {
      startMuzanNeuralShockwave(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "muzanDemonKing") {
      startMuzanDemonKing(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "gojoBlue") {
      useGojoBlue(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "gojoRed") {
      fireGojoRed(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "gojoUnlimitedVoid") {
      startGojoUnlimitedVoid(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "gasterBlaster") {
      startGasterBlasterSkill(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "blueTelekinesis") {
      startBlueTelekinesis(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "gasterDoomBarrage") {
      startGasterDoomBarrage(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "worldEnder") {
      startWorldEnder(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "maugaGuns") {
      startMaugaGuns(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "maugaOverrun") {
      startMaugaOverrun(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "cageFight") {
      startMaugaCageFight(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "ronaldoFreeKick") {
      startRonaldoFreeKick(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "ronaldoHeader") {
      startRonaldoHeader(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "siuuuChampion") {
      startRonaldoUltimate(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "ricoBouncyShot") {
      startRicoBurst(fighter, opponent, skill, now, "basic");
      return;
    }

    if (skill.type === "ricoTrickShot") {
      startRicoBurst(fighter, opponent, skill, now, "trick");
      return;
    }

    if (skill.type === "ricoMultiBall") {
      startRicoMultiBall(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "superBounceStorm") {
      startRicoUltimate(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "calmPalmStrike") {
      startCalmPalmStrike(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "monkMeditation") {
      startMonkMeditation(fighter, skill, now);
      return;
    }

    if (skill.type === "enlightenmentField") {
      startMonkEnlightenment(fighter, skill, now);
      return;
    }

    if (skill.type === "blueEyesBurstStream") {
      startBlueEyesBurstStream(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "blueEyesUltimateBurst") {
      startBlueEyesUltimateBurst(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "blueEyesTripleHyperBurst") {
      startBlueEyesTripleHyperBurst(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "blueEyesWrathDestruction") {
      startBlueEyesWrathDestruction(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "blueEyesTripleBurstStream") {
      startBlueEyesTripleBurstStream(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "blueEyesChaosDimension") {
      startBlueEyesChaosDimension(fighter, opponent, skill, now);
      return;
    }

    if (skill.type === "blueEyesNeutronBlast") {
      startBlueEyesNeutronBlast(fighter, opponent, skill, now);
      return;
    }

    const actions = Array.isArray(skill.actions) ? skill.actions : [];
    applyCombatActions(fighter, opponent, actions, skill.name || "스킬");
    restoreStoredVelocity(fighter, fighter.skillState);
    startSkillRecovery(fighter, skill, now);
  }

  function updateRunningSkill(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;

    if (state.skill.type === "circleMultiSlash") {
      updateCircleMultiSlash(fighter, opponent, now);
    }

    if (state.skill.type === "bloodMoonSlash") {
      updateBloodMoonSlash(fighter, opponent, now);
    }

    if (state.skill.type === "enmaYamatoFlash") {
      updateEnmaYamatoFlash(fighter, now);
    }

    if (state.skill.type === "lastSubwayRush") {
      updateLastSubwayRush(fighter, opponent, now);
    }

    if (state.skill.type === "chainsawChainGrab") {
      updateChainsawChainGrab(fighter, opponent, now);
    }

    if (state.skill.type === "chainsawHellArena") {
      updateChainsawHellArenaSkill(fighter, opponent, now);
    }

    if (state.skill.type === "himForbiddenGesture") {
      updateHimForbiddenGesture(fighter, opponent, now);
    }

    if (state.skill.type === "darkinBlade") {
      updateDarkinBlade(fighter, opponent, now);
    }

    if (state.skill.type === "infernalChains") {
      updateInfernalChains(fighter, opponent, now);
    }

    if (state.skill.type === "threeLegRampage") {
      updateThreeLegRampage(fighter, now);
    }

    if (state.skill.type === "deepSeaAmbush") {
      updateDeepSeaAmbush(fighter, opponent, now);
    }

    if (state.skill.type === "gasterBlaster") {
      updateGasterBlasterSkill(fighter, opponent, now);
    }

    if (state.skill.type === "blueTelekinesis") {
      updateBlueTelekinesis(fighter, opponent, now);
    }

    if (state.skill.type === "gasterDoomBarrage") {
      updateGasterDoomBarrage(fighter, opponent, now);
    }

    if (state.skill.type === "maugaGuns") {
      updateMaugaGuns(fighter, opponent, now);
    }

    if (state.skill.type === "maugaOverrun") {
      updateMaugaOverrun(fighter, opponent, now);
    }

    if (state.skill.type === "ronaldoFreeKick") {
      updateRonaldoFreeKick(fighter, opponent, now);
    }

    if (state.skill.type === "ronaldoHeader") {
      updateRonaldoHeader(fighter, opponent, now);
    }

    if (state.skill.type === "ricoBouncyShot" || state.skill.type === "ricoTrickShot") {
      updateRicoBurst(fighter, opponent, now);
    }

    if (state.skill.type === "superBounceStorm") {
      updateRicoUltimateSkill(fighter, opponent, now);
    }

    if (state.skill.type === "monkMeditation") {
      updateMonkMeditationSkill(fighter, now);
    }

    if (state.skill.type === "enlightenmentField") {
      updateMonkEnlightenmentSkill(fighter, now);
    }

    if (state.skill.type === "blueEyesTripleHyperBurst") {
      updateBlueEyesTripleHyperBurst(fighter, opponent, now);
    }

    if (state.skill.type === "blueEyesWrathDestruction") {
      updateBlueEyesWrathDestruction(fighter, opponent, now);
    }

    if (state.skill.type === "blueEyesChaosDimension") {
      updateBlueEyesChaosDimension(fighter, opponent, now);
    }
  }

  function applyCombatActions(source, target, actions, label) {
    actions.forEach((action) => {
      if (action.type === "damage") {
        applyDamage(source, target, {
          label,
          bonusDamage: action.bonusDamage || 0,
          baseDamage: action.baseDamage,
          hits: action.hits || 1,
          damageReduction: action.damageReduction || 0
        });
      }

      if (action.type === "heal") {
        healFighter(source, action.amount || 0, label);
      }
    });
  }

  function cancelFighterSkill(fighter) {
    const activeSkill = fighter.skillState && fighter.skillState.skill;
    endWorldEnder(fighter, true, getBattleNow());
    endRonaldoUltimate(fighter, true, getBattleNow());
    endRicoUltimate(fighter, true, getBattleNow());
    endMonkEnlightenment(fighter, true, getBattleNow());
    if (fighter.skillState && fighter.skillState.skill && fighter.skillState.skill.type === "oiiaAllOutAttack") {
      clearOiiaAllOutWarnings(fighter.skillState);
    }
    if (fighter.skillState && fighter.skillState.skill && fighter.skillState.skill.type === "oiiaGreatSpin") {
      clearOiiaGreatSpinCharge(fighter.skillState);
    }
    endOiiaGreatSpin(fighter, true, getBattleNow());
    if (fighter.skillState && fighter.skillState.skill && isMuzanSkill(fighter.skillState.skill)) {
      clearMuzanSkillState(fighter, fighter.skillState);
    }
    endMuzanDemonKing(fighter, true, getBattleNow());
    if (fighter.skillState && fighter.skillState.skill && isGojoSkill(fighter.skillState.skill)) {
      clearGojoSkillState(fighter, fighter.skillState, true);
    }
    if (fighter.skillState && fighter.skillState.skill && fighter.skillState.skill.type === "deepSeaAmbush") {
      clearDeepSeaAmbush(fighter.skillState);
    }
    if (fighter.skillState && fighter.skillState.skill && fighter.skillState.skill.type === "darkinBlade") {
      clearDarkinBlade(fighter.skillState);
    }
    if (fighter.skillState && fighter.skillState.skill && fighter.skillState.skill.type === "infernalChains") {
      clearInfernalChains(fighter.skillState);
    }
    if (fighter.skillState && fighter.skillState.skill && fighter.skillState.skill.type === "lastSubwayRush") {
      clearLastSubwayRushState(fighter, fighter.skillState);
    }
    if (fighter.skillState && fighter.skillState.skill && isChainsawSkill(fighter.skillState.skill)) {
      clearChainsawSkillState(fighter, fighter.skillState);
    }
    if (fighter.skillState && fighter.skillState.skill && isHimSkill(fighter.skillState.skill)) {
      clearHimSkillState(fighter, fighter.skillState);
    }
    if (fighter.skillState && fighter.skillState.skill && fighter.skillState.skill.type === "enmaYamatoFlash") {
      clearEnmaYamatoFlashState(fighter.skillState);
    }
    if (fighter.skillState && fighter.skillState.skill && fighter.skillState.skill.type === "blueTelekinesis") {
      clearBlueTelekinesis(fighter.skillState);
    }
    if (fighter.skillState && fighter.skillState.skill && fighter.skillState.skill.type === "gasterDoomBarrage") {
      clearGasterDoomBarrage(fighter, fighter.skillState);
    }
    if (fighter.skillState && fighter.skillState.skill && fighter.skillState.skill.type === "maugaGuns") {
      clearMaugaGuns(fighter.skillState);
    }
    if (fighter.skillState && fighter.skillState.skill && fighter.skillState.skill.type === "maugaOverrun") {
      clearMaugaOverrun(fighter, fighter.skillState);
    }
    if (fighter.skillState && fighter.skillState.skill && (fighter.skillState.skill.type === "ronaldoFreeKick" || fighter.skillState.skill.type === "ronaldoHeader")) {
      clearRonaldoSkillState(fighter, fighter.skillState);
    }
    if (fighter.skillState && fighter.skillState.skill && isRicoSkill(fighter.skillState.skill)) {
      clearRicoSkillState(fighter, fighter.skillState);
    }
    if (fighter.skillState && fighter.skillState.skill && isMonkSkill(fighter.skillState.skill)) {
      clearMonkSkillState(fighter, fighter.skillState, true);
    }
    if (fighter.skillState && fighter.skillState.skill && isBlueEyesSkill(fighter.skillState.skill)) {
      clearBlueEyesSkillState(fighter, fighter.skillState);
    }
    if (fighter.skillState && fighter.skillState.data && fighter.skillState.data.effect) {
      removeElement(fighter.skillState.data.effect);
    }
    if (fighter.skillState && fighter.skillState.data && fighter.skillState.data.effects) {
      fighter.skillState.data.effects.forEach((effect) => removeElement(effect));
    }
    if (fighter.skillState && fighter.skillState.data && fighter.skillState.data.blasters) {
      fighter.skillState.data.blasters.forEach((blaster) => removeGasterBlaster(blaster));
    }
    if (fighter.skillState && fighter.skillState.data && fighter.skillState.data.afterimages) {
      fighter.skillState.data.afterimages.forEach((effect) => removeElement(effect));
    }
    if (fighter.skillState && fighter.skillState.data && fighter.skillState.data.trails) {
      fighter.skillState.data.trails.forEach((effect) => removeElement(effect));
    }
    if (fighter.skillState && fighter.skillState.data && fighter.skillState.data.timers) {
      fighter.skillState.data.timers.forEach((task) => {
        if (!task) return;
        task.cancelled = true;
        game.timeouts.delete(task);
      });
      fighter.skillState.data.timers = [];
    }
    if (fighter.skillState && fighter.skillState.data && fighter.skillState.data.warning) {
      removeElement(fighter.skillState.data.warning);
    }
    if (fighter.skillState && fighter.skillState.data && fighter.skillState.data.projectile) {
      removeElement(fighter.skillState.data.projectile);
    }
    if (fighter.skillState && fighter.skillState.data && fighter.skillState.data.charge) {
      removeElement(fighter.skillState.data.charge);
    }
    if (fighter.skillState && fighter.skillState.data && fighter.skillState.data.shout) {
      removeElement(fighter.skillState.data.shout);
    }
    if (fighter.skillState && fighter.skillState.data && fighter.skillState.data.targetMark) {
      removeElement(fighter.skillState.data.targetMark);
    }
    fighter.speedMultiplier = 1;
    fighter.slowMultiplier = 1;
    fighter.slowUntil = 0;
    removeElement(fighter.slowEffect);
    fighter.slowEffect = null;
    fighter.damageReduction = 0;
    fighter.healMultiplier = 1;
    fighter.maugaUnstoppable = false;
    fighter.shadowDashReadyAt = 0;
    fighter.shadowDashDamageSuppressUntil = 0;
    fighter.duelDefenseWallId = "";
    fighter.duelDefenseMultiplier = 1;
    removeElement(fighter.duelDefenseEffect);
    removeElement(fighter.duelDefenseLabel);
    fighter.duelDefenseEffect = null;
    fighter.duelDefenseLabel = null;
    releaseUltimateLock(fighter, activeSkill);
    releaseUltimateLock(fighter, fighter.recoverySkill);
    fighter.skillState = null;
    fighter.recoveryUntil = 0;
    fighter.recoverySkill = null;
    getFighterElement(fighter).classList.remove("casting", "recovering", "rampaging", "slowed", "stunned", "duel-defending", "sans-eye", "sans-dodging", "aatrox-ultimate", "chill-shielded", "chill-transformed", "ronaldo-kicking", "ronaldo-jump-ready", "ronaldo-airborne", "ronaldo-ultimate", "blue-eyes-evolved", "blue-eyes-invulnerable", "enma-yamato-caster", "enma-yamato-silhouette", "last-subway-rushing", "jarvan-natural-death", "oiia-spin-charging", "oiia-great-spin", "muzan-ultimate-active", "muzan-fatal-regenerating", "him-absolute-caster", "him-charmed", "him-absolute-charmed");
  }

  function addSkillWarning(fighter, skill) {
    const state = fighter.skillState;
    if (!state) return;

    if (skill.type === "circleMultiSlash") {
      const radius = getCircleSkillRadius(fighter, skill);
      state.data.warning = createCircleEffect(fighter.x, fighter.y, radius, "slash-warning");
    }

    if (skill.type === "teleportWallStrike") {
      const radius = fighter.radius * (Number(skill.attackRadiusRate) || 3.36);
      state.data.warning = createCircleEffect(state.data.targetX, state.data.targetY, radius, "jarvan-warning");
    }

    if (skill.type === "threeLegRampage") {
      state.data.warning = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.35, "rampage-warning");
    }

    if (skill.type === "chainsawChainGrab") {
      const range = game.arenaSize * (Number(skill.rangeRate) || 0.88) * getChainsawRangeMultiplier(fighter);
      state.data.previewLength = range;
      state.data.warning = createChainsawChainAim(fighter, state.data.angle || 0, range);
    }

    if (skill.type === "himGazeLock") {
      state.data.warning = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.34, "him-gaze-charge");
    }

    if (skill.type === "himForbiddenGesture") {
      const target = getOpposingFighter(fighter.side);
      state.data.warning = target ? createCircleEffect(target.x, target.y, target.radius * 1.35, "him-gesture-warning") : createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.2, "him-gesture-warning");
    }

    if (skill.type === "himAbsoluteCharm") {
      state.data.warning = createCircleEffect(game.arenaSize / 2, game.arenaSize / 2, game.arenaSize * 0.43, "him-absolute-warning");
    }

    if (skill.type === "chainsawSawSpin") {
      state.data.warning = createChainsawSawSpinWarning(fighter);
      state.data.effects = state.data.effects || [];
    }

    if (skill.type === "chainsawHellArena") {
      state.data.warning = createCircleEffect(game.arenaSize / 2, game.arenaSize / 2, fighter.radius * 2.5, "chainsaw-hell-warning");
      state.data.effects = state.data.effects || [];
    }

    if (skill.type === "bloodMoonSlash") {
      state.data.warning = createBloodMoonWarning(fighter, state.data, skill);
      state.data.charge = createBloodMoonChargeAura(fighter);
    }

    if (skill.type === "enmaYamatoFlash") {
      state.data.warning = createEnmaYamatoWarning(state.data);
      state.data.charge = createEnmaYamatoChargeAura(fighter);
      state.data.dim = createEnmaYamatoDim();
      state.data.title = createEnmaYamatoTitle();
      state.data.effects = state.data.effects || [];
      state.data.effects.push(state.data.charge, state.data.dim, state.data.title);
      state.data.highlightedTargets = getEnmaYamatoTargets(fighter, getOpposingFighter(fighter.side));
      const casterElement = getFighterElement(fighter);
      if (casterElement) casterElement.classList.add("enma-yamato-caster");
      state.data.highlightedTargets.forEach((target) => {
        const targetElement = getEntityElement(target) || getFighterElement(target);
        if (targetElement) targetElement.classList.add("enma-yamato-silhouette");
      });
    }

    if (skill.type === "oiiaAllOutAttack") {
      createOiiaAllOutWarnings(fighter, state, skill);
    }

    if (skill.type === "oiiaGreatSpin") {
      createOiiaGreatSpinCharge(fighter, state);
    }

    if (skill.type === "muzanBlackBloodWhip") {
      createMuzanWhipWarnings(fighter, state, skill);
    }

    if (skill.type === "muzanCellCollapse") {
      createMuzanCellCollapseWarning(fighter, state, skill);
    }

    if (skill.type === "muzanNeuralShockwave") {
      createMuzanNeuralCharge(fighter, state, skill);
    }

    if (skill.type === "muzanDemonKing") {
      createMuzanUltimateCharge(fighter, state);
    }

    if (skill.type === "gojoRed") {
      createGojoRedWarning(fighter, state, skill);
    }

    if (skill.type === "gojoUnlimitedVoid") {
      createGojoDomainWarning(fighter, state);
    }

    if (skill.type === "gasterBlaster") {
      state.data.warning = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.28, "sans-cast-aura");
      getFighterElement(fighter).classList.add("sans-eye");
    }

    if (skill.type === "blueTelekinesis") {
      state.data.warning = createCircleEffect(fighter.x, fighter.y, state.data.range || game.arenaSize * 0.68, "telekinesis-range-warning");
      state.data.targetMark = createCircleEffect(game.fighters[fighter.side === "A" ? "B" : "A"].x, game.fighters[fighter.side === "A" ? "B" : "A"].y, game.fighters[fighter.side === "A" ? "B" : "A"].radius * 1.45, "telekinesis-target-mark");
      getFighterElement(fighter).classList.add("sans-eye");
    }

    if (skill.type === "gasterDoomBarrage") {
      state.data.effects = state.data.effects || [];
      state.data.warning = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.55, "gaster-ultimate-charge");
      state.data.dim = createGasterUltimateDim();
      state.data.title = createGasterUltimateTitle(skill.name || "ULTIMATE");
      state.data.particles = createGasterUltimateParticles();
      state.data.effects.push(state.data.dim, state.data.title, state.data.particles);
      hideFighterForUltimate(fighter, state);
      getFighterElement(fighter).classList.add("sans-eye");
    }

    if (skill.type === "ronaldoFreeKick") {
      state.data.warning = createRonaldoFreeKickWarning(fighter, state.data);
      state.data.chargeBall = createRonaldoChargeBall(fighter, state.data);
      getFighterElement(fighter).classList.add("ronaldo-kicking");
    }

    if (skill.type === "ronaldoHeader") {
      const radius = getRonaldoHeaderRadius(skill);
      state.data.warning = createCircleEffect(state.data.landingX, state.data.landingY, radius, "ronaldo-header-warning");
      state.data.coreWarning = createCircleEffect(state.data.landingX, state.data.landingY, getRonaldoHeaderCoreRadius(fighter, skill, radius), "ronaldo-header-core-warning");
      state.data.shadow = createCircleEffect(state.data.landingX, state.data.landingY, fighter.radius * 0.72, "ronaldo-header-shadow");
      getFighterElement(fighter).classList.add("ronaldo-jump-ready");
    }

    if (skill.type === "ricoTrickShot") {
      state.data.warning = createRicoTrickWarning(fighter, state.data);
      state.data.reflectMark = createCircleEffect(state.data.reflectX, state.data.reflectY, Math.max(7, fighter.radius * 0.22), "rico-reflect-mark");
    }

    if (skill.type === "calmPalmStrike") {
      state.data.warning = createMonkPalmWarning(fighter, getOpponentDirection(fighter, getOpposingFighter(fighter.side)), skill);
      state.data.charge = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.2, "monk-palm-charge");
    }

    if (skill.type === "monkMeditation") {
      state.data.warning = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.35, "monk-meditation-charge");
    }

    if (skill.type === "blueEyesTripleBurstStream") {
      state.data.warning = createBlueEyesTripleBurstWarning(fighter, state.data, skill);
    }

    if (skill.type === "blueEyesChaosDimension") {
      state.data.warning = createBlueEyesChaosWarning(fighter, state.data, skill);
    }

    if (skill.type === "blueEyesNeutronBlast") {
      state.data.warning = createBlueEyesNeutronWarning(fighter, state.data, skill);
    }
  }

  function updateSkillWarning(fighter) {
    const state = fighter.skillState;
    if (!state || !state.data.warning) return;

    if (state.skill.type === "circleMultiSlash") {
      const radius = getCircleSkillRadius(fighter, state.skill);
      updateCircleEffect(state.data.warning, fighter.x, fighter.y, radius);
    }

    if (state.skill.type === "threeLegRampage") {
      updateCircleEffect(state.data.warning, fighter.x, fighter.y, fighter.radius * 1.35);
    }

    if (state.skill.type === "chainsawChainGrab") {
      const target = getOpposingFighter(fighter.side);
      if (target && !target.dead && !isFighterOutOfBattle(target)) {
        const direction = getOpponentDirection(fighter, target);
        state.data.dirX = direction.x;
        state.data.dirY = direction.y;
        state.data.angle = direction.angle;
      }
      updateChainsawPathEffect(state.data.warning, fighter.x, fighter.y, state.data.angle || 0, state.data.previewLength || game.arenaSize * 0.88, Math.max(10, fighter.radius * 0.36));
    }

    if (state.skill.type === "himGazeLock") {
      updateCircleEffect(state.data.warning, fighter.x, fighter.y, fighter.radius * 1.34);
    }

    if (state.skill.type === "himForbiddenGesture") {
      const target = getOpposingFighter(fighter.side);
      if (target && !target.dead) updateCircleEffect(state.data.warning, target.x, target.y, target.radius * 1.35);
    }

    if (state.skill.type === "himAbsoluteCharm") {
      updateCircleEffect(state.data.warning, game.arenaSize / 2, game.arenaSize / 2, game.arenaSize * 0.43);
    }

    if (state.skill.type === "chainsawSawSpin") {
      updateChainsawSawSpinWarning(state.data.warning, fighter);
    }

    if (state.skill.type === "bloodMoonSlash") {
      updateBloodMoonWarning(state.data.warning, fighter, state.data, state.skill);
      updateCircleEffect(state.data.charge, fighter.x, fighter.y, fighter.radius * 1.35);
    }

    if (state.skill.type === "enmaYamatoFlash") {
      updateEnmaYamatoWarning(state.data.warning, state.data);
      updateCircleEffect(state.data.charge, fighter.x, fighter.y, fighter.radius * 1.5);
    }

    if (state.skill.type === "oiiaAllOutAttack") {
      updateOiiaAllOutWarnings(fighter, state, state.skill);
    }

    if (state.skill.type === "muzanBlackBloodWhip") {
      updateMuzanWhipWarnings(fighter, state, state.skill);
    }

    if (state.skill.type === "muzanCellCollapse") {
      updateMuzanCellCollapseWarning(fighter, state);
    }

    if (state.skill.type === "muzanNeuralShockwave") {
      updateMuzanNeuralCharge(fighter, state);
    }

    if (state.skill.type === "muzanDemonKing") {
      updateMuzanUltimateCharge(fighter, state);
    }

    if (state.skill.type === "gojoRed") {
      updateGojoRedWarning(fighter, state);
    }

    if (state.skill.type === "gojoUnlimitedVoid") {
      updateGojoDomainWarning(fighter, state);
    }

    if (state.skill.type === "gasterBlaster") {
      updateCircleEffect(state.data.warning, fighter.x, fighter.y, fighter.radius * 1.28);
    }

    if (state.skill.type === "blueTelekinesis") {
      const opponent = game.fighters[fighter.side === "A" ? "B" : "A"];
      updateCircleEffect(state.data.warning, fighter.x, fighter.y, state.data.range || game.arenaSize * 0.68);
      updateCircleEffect(state.data.targetMark, opponent.x, opponent.y, opponent.radius * 1.45);
    }

    if (state.skill.type === "gasterDoomBarrage") {
      updateCircleEffect(state.data.warning, fighter.x, fighter.y, fighter.radius * 1.55);
    }

    if (state.skill.type === "ronaldoFreeKick") {
      updateRonaldoFreeKickWarning(state.data.warning, fighter, state.data);
      updateRonaldoChargeBall(state.data.chargeBall, fighter, state.data);
    }

    if (state.skill.type === "ricoTrickShot") {
      updateRicoTrickWarning(state.data.warning, fighter, state.data);
      if (state.data.reflectMark) updateCircleEffect(state.data.reflectMark, state.data.reflectX, state.data.reflectY, Math.max(7, fighter.radius * 0.22));
    }

    if (state.skill.type === "calmPalmStrike") {
      updateMonkPalmWarning(state.data.warning, fighter, getOpponentDirection(fighter, getOpposingFighter(fighter.side)), state.skill);
      updateCircleEffect(state.data.charge, fighter.x, fighter.y, fighter.radius * 1.2);
    }

    if (state.skill.type === "monkMeditation") {
      updateCircleEffect(state.data.warning, fighter.x, fighter.y, fighter.radius * 1.35);
    }

    if (state.skill.type === "blueEyesTripleBurstStream") {
      updateBlueEyesTripleBurstWarning(state.data.warning, fighter, state.data, state.skill);
    }

    if (state.skill.type === "blueEyesNeutronBlast") {
      updateBlueEyesNeutronWarning(state.data.warning, fighter, state.data, state.skill);
    }
  }

  function getCircleSkillRadius(fighter, skill) {
    const rawRadius = fighter.radius * (Number(skill.radiusRate) || 3.3);
    const maxRate = Number(skill.maxArenaRadiusRate) || 1;
    return Math.min(rawRadius, game.arenaSize * maxRate);
  }

  function startCircleMultiSlash(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    state.data.nextHitAt = now;
    state.data.hitsDone = 0;
    state.data.endAt = now + (Number(skill.duration) || 1400);
    state.data.effect = createCircleEffect(fighter.x, fighter.y, getCircleSkillRadius(fighter, skill), "hell-slash-field");
    addLog(`${fighter.name} 연속 참격 발동`, "skill");
  }

  function updateCircleMultiSlash(fighter, opponent, now) {
    const state = fighter.skillState;
    const skill = state.skill;
    const interval = Number(skill.hitInterval) || 200;
    const maxHits = Number(skill.hitCount) || 7;
    const radius = getCircleSkillRadius(fighter, skill);

    updateCircleEffect(state.data.effect, fighter.x, fighter.y, radius);

    while (state.data.hitsDone < maxHits && now >= state.data.nextHitAt) {
      state.data.hitsDone += 1;
      state.data.nextHitAt += interval;
      createSlashBurst(fighter, radius);
      if (isInCircleRange(fighter, opponent, radius)) {
        applyDamage(fighter, opponent, {
          label: skill.name,
          baseDamage: Number(skill.damage) || 4,
          ignoreDefense: true
        });
      } else {
        addLog(`${opponent.name}이 연속 참격 범위 밖으로 벗어남`, "skill");
      }
      damageEnemySummonsInCircle(fighter, fighter.x, fighter.y, radius, {
        label: skill.name,
        baseDamage: Number(skill.damage) || 4,
        ignoreDefense: true
      });
      if (opponent.dead) break;
    }

    if (state.data.hitsDone >= maxHits || now >= state.data.endAt || opponent.dead) {
      removeElement(state.data.effect);
      fighter.skillState = null;
      restoreStoredVelocity(fighter, state);
      startSkillRecovery(fighter, skill, now);
    }
  }

  function useTeleportWallStrike(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    const target = state.data;
    const attackRadius = fighter.radius * (Number(skill.attackRadiusRate) || 3.36);
    const wallRadius = fighter.radius * (Number(skill.wallRadiusRate) || 3.6);
    const x = target.targetX;
    const y = target.targetY;

    fighter.x = x;
    fighter.y = y;
    createTeleportBurst(x, y, attackRadius);

    if (isPointInCircle(opponent.x, opponent.y, target.targetX, target.targetY, attackRadius + opponent.radius * 0.35)) {
      applyDamage(fighter, opponent, {
        label: skill.name,
        baseDamage: Number(skill.damage) || 22,
        ignoreDefense: true
      });
    } else {
      addLog(`${opponent.name}이 경고 범위 밖으로 벗어남`, "skill");
    }
    damageEnemySummonsInCircle(fighter, target.targetX, target.targetY, attackRadius, {
      label: skill.name,
      baseDamage: Number(skill.damage) || 22,
      ignoreDefense: true
    });

    createTemporaryCircleWall(target.targetX, target.targetY, wallRadius, Number(skill.wallDuration) || 4000, Number(skill.wallFade) || 700, fighter);
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
    startSkillRecovery(fighter, skill, now);
  }

  function startLastSubwayRush(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    const data = state.data;
    const baseAngle = getLastSubwayInitialAngle(fighter, opponent);
    data.phase = "bounce";
    data.ownerId = fighter.id;
    data.attackId = `last-subway-${fighter.id}-${Math.round(now)}`;
    data.maxBounces = Math.max(1, Math.floor(Number(skill.bounceCount) || 6));
    data.bounces = 0;
    data.lastUpdateAt = now;
    data.lastBounceAt = -Infinity;
    data.compressionWallContacts = new Set();
    data.finalHit = false;
    data.effects = data.effects || [];
    data.speed = (game.arenaSize || 560) * 2.55;
    fighter.vx = Math.cos(baseAngle) * data.speed;
    fighter.vy = Math.sin(baseAngle) * data.speed;
    fighter.lastSubwayNoBodyUntil = now + 9000;
    const element = getFighterElement(fighter);
    if (element) element.classList.add("last-subway-rushing");
    data.title = createLastSubwayTitle();
    data.aura = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.55, "last-subway-aura");
    data.effects.push(data.title, data.aura);
    addLog(`${fighter.name} 궁극기: 종점 없는 막차`, "ultimate");
  }

  function updateLastSubwayRush(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;
    const data = state.data;
    if (fighter.dead || game.battleEnding || !opponent || opponent.dead || isFighterOutOfBattle(opponent)) {
      finishLastSubwayRush(fighter, state, now, false);
      return;
    }
    const elapsed = Math.max(0, Math.min((now - (data.lastUpdateAt || now)) / 1000, 0.05));
    data.lastUpdateAt = now;
    if (data.aura) updateCircleEffect(data.aura, fighter.x, fighter.y, fighter.radius * 1.55);
    if (data.phase === "bounce") {
      updateLastSubwayBouncePhase(fighter, opponent, state, elapsed, now);
      return;
    }
    if (data.phase === "dash") {
      updateLastSubwayDashPhase(fighter, opponent, state, elapsed, now);
      return;
    }
    if ((data.phase === "hit" || data.phase === "miss") && now >= (data.endAt || now)) {
      finishLastSubwayRush(fighter, state, now, true);
    }
  }

  function updateLastSubwayBouncePhase(fighter, opponent, state, dt, now) {
    const data = state.data;
    if (dt <= 0) return;
    const speed = Math.max(1, Math.hypot(fighter.vx, fighter.vy));
    const steps = Math.max(1, Math.ceil((speed * dt) / Math.max(4, fighter.radius * 0.38)));
    const stepDt = dt / steps;
    for (let i = 0; i < steps; i += 1) {
      const prevX = fighter.x;
      const prevY = fighter.y;
      fighter.x += fighter.vx * stepDt;
      fighter.y += fighter.vy * stepDt;
      const bounced = resolveLastSubwayArenaBounce(fighter, data, now);
      const objectBounced = resolveLastSubwayCompressionWallBounce(fighter, data, now, true);
      createLastSubwayRouteSegment(prevX, prevY, fighter.x, fighter.y, data, "last-subway-route-line");
      if ((bounced || objectBounced) && data.bounces >= data.maxBounces) {
        beginLastSubwayFinalDash(fighter, opponent, state.skill, data, now);
        break;
      }
    }
  }

  function resolveLastSubwayArenaBounce(fighter, data, now) {
    const size = game.arenaSize || 560;
    const r = fighter.radius || game.fighterBaseRadius || 26;
    let bounced = false;
    if (fighter.x - r < 0) {
      fighter.x = r;
      fighter.vx = Math.abs(fighter.vx);
      bounced = true;
    } else if (fighter.x + r > size) {
      fighter.x = size - r;
      fighter.vx = -Math.abs(fighter.vx);
      bounced = true;
    }
    if (fighter.y - r < 0) {
      fighter.y = r;
      fighter.vy = Math.abs(fighter.vy);
      bounced = true;
    } else if (fighter.y + r > size) {
      fighter.y = size - r;
      fighter.vy = -Math.abs(fighter.vy);
      bounced = true;
    }
    if (!bounced) return false;
    data.bounces += 1;
    data.lastBounceAt = now;
    data.speed = (data.speed || Math.hypot(fighter.vx, fighter.vy) || getPixelSpeed(fighter)) * 1.13;
    normalizeVelocity(fighter, data.speed);
    onWallBounce(fighter, now);
    createLastSubwayBounceEffect(fighter, data.bounces, data);
    if (els.arena) {
      els.arena.classList.add("shake");
      scheduleTimeout(() => els.arena && els.arena.classList.remove("shake"), 120 + data.bounces * 20);
    }
    return true;
  }

  function resolveLastSubwayCompressionWallBounce(fighter, data, now, countBounce) {
    if (!data.compressionWallContacts) data.compressionWallContacts = new Set();
    let bounced = false;
    game.arenaObjects.forEach((wall) => {
      if (bounced || wall.type !== "compressionWall" || wall.fadeStarted || now < (wall.activeAt || 0)) return;
      const collision = getCircleRectCollision(fighter.x, fighter.y, fighter.radius, wall);
      if (!collision) {
        data.compressionWallContacts.delete(wall.id);
        return;
      }
      const wasTouching = data.compressionWallContacts.has(wall.id);
      fighter.x += collision.normalX * (collision.overlap + 1);
      fighter.y += collision.normalY * (collision.overlap + 1);
      keepInsideArena(fighter);
      const velocityAlongNormal = fighter.vx * collision.normalX + fighter.vy * collision.normalY;
      if (velocityAlongNormal < 0) {
        fighter.vx -= 2 * velocityAlongNormal * collision.normalX;
        fighter.vy -= 2 * velocityAlongNormal * collision.normalY;
        data.speed = (data.speed || Math.hypot(fighter.vx, fighter.vy) || getPixelSpeed(fighter)) * 1.13;
        normalizeVelocity(fighter, data.speed);
        if (!wasTouching) {
          if (countBounce) data.bounces += 1;
          data.lastBounceAt = now;
          onWallBounce(fighter, now);
          createLastSubwayBounceEffect(fighter, data.bounces, data);
        }
        bounced = true;
      }
      data.compressionWallContacts.add(wall.id);
    });
    return bounced;
  }

  function beginLastSubwayFinalDash(fighter, opponent, skill, data, now) {
    const leadSeconds = 0.18;
    const targetX = clamp(opponent.x + (opponent.vx || 0) * leadSeconds, opponent.radius, game.arenaSize - opponent.radius);
    const targetY = clamp(opponent.y + (opponent.vy || 0) * leadSeconds, opponent.radius, game.arenaSize - opponent.radius);
    const dx = targetX - fighter.x;
    const dy = targetY - fighter.y;
    const distance = Math.hypot(dx, dy) || 1;
    data.phase = "dash";
    data.lastUpdateAt = now;
    data.dashStartedAt = now;
    data.dashEndAt = now + 1800;
    data.dashDirX = dx / distance;
    data.dashDirY = dy / distance;
    data.dashAngle = Math.atan2(dy, dx);
    data.dashSpeed = (game.arenaSize || 560) * 3.25;
    fighter.vx = data.dashDirX * data.dashSpeed;
    fighter.vy = data.dashDirY * data.dashSpeed;
    data.train = createLastSubwayTrainSilhouette(fighter, data);
    data.effects.push(data.train);
    addLog(`${fighter.name} 마지막 돌진`, "ultimate");
  }

  function updateLastSubwayDashPhase(fighter, opponent, state, dt, now) {
    const data = state.data;
    const skill = state.skill;
    if (dt <= 0) return;
    const speed = Math.max(1, Math.hypot(fighter.vx, fighter.vy));
    const steps = Math.max(1, Math.ceil((speed * dt) / Math.max(4, fighter.radius * 0.34)));
    const stepDt = dt / steps;
    for (let i = 0; i < steps; i += 1) {
      const prevX = fighter.x;
      const prevY = fighter.y;
      fighter.x += fighter.vx * stepDt;
      fighter.y += fighter.vy * stepDt;
      createLastSubwayRouteSegment(prevX, prevY, fighter.x, fighter.y, data, "last-subway-final-line");
      if (resolveLastSubwayCompressionWallBounce(fighter, data, now, false)) {
        missLastSubwayRush(fighter, state, now);
        return;
      }
      if (isLastSubwayFinalHit(fighter, opponent)) {
        applyLastSubwayFinalHit(fighter, opponent, skill, data, now);
        return;
      }
      if (clampLastSubwayToArena(fighter)) {
        missLastSubwayRush(fighter, state, now);
        return;
      }
    }
    if (data.train) updateLastSubwayTrainSilhouette(data.train, fighter, data);
    if (now >= (data.dashEndAt || now + 1)) {
      missLastSubwayRush(fighter, state, now);
    }
  }

  function isLastSubwayFinalHit(fighter, target) {
    if (!target || target.dead || isFighterOutOfBattle(target)) return false;
    return Math.hypot(target.x - fighter.x, target.y - fighter.y) <= fighter.radius + target.radius + fighter.radius * 0.42;
  }

  function applyLastSubwayFinalHit(fighter, target, skill, data, now) {
    if (data.finalHit) return;
    data.finalHit = true;
    const actual = applyDamage(fighter, target, {
      label: skill.name,
      baseDamage: Number(skill.damage) || 32,
      damageKind: "궁극기",
      attackId: data.attackId,
      hitId: `final-${target.id}`
    });
    if (actual > 0) {
      knockbackEntity(fighter, target, fighter.radius * 2.25);
      applyStunEffect(target, Number(skill.stunDuration) || 1500, now);
      createLastSubwayStunEffect(target, Number(skill.stunDuration) || 1500);
    }
    createLastSubwayArrivalEffect(target, data);
    fighter.vx = 0;
    fighter.vy = 0;
    data.phase = "hit";
    data.endAt = now + 360;
    if (els.arena) {
      els.arena.classList.add("shake");
      scheduleTimeout(() => els.arena && els.arena.classList.remove("shake"), 220);
    }
    addLog(actual > 0 ? `${target.name} 종점 도착` : `${target.name}이 막차 충격을 버팀`, "ultimate");
  }

  function missLastSubwayRush(fighter, state, now) {
    const data = state.data;
    if (data.phase === "miss") return;
    fighter.vx = 0;
    fighter.vy = 0;
    data.phase = "miss";
    data.endAt = now + (Number(state.skill.missRecovery) || 700);
    addLog(`${fighter.name} 종점 없는 막차 빗나감`, "skill");
  }

  function finishLastSubwayRush(fighter, state, now, withRecovery) {
    clearLastSubwayRushState(fighter, state);
    if (withRecovery) {
      restoreStoredVelocity(fighter, state);
      fighter.skillState = null;
      startSkillRecovery(fighter, state.skill, now);
    } else {
      fighter.skillState = null;
      releaseUltimateLock(fighter, state.skill);
    }
  }

  function clearLastSubwayRushState(fighter, state) {
    if (!state || !state.data) return;
    const data = state.data;
    if (data.effects) {
      data.effects.forEach((effect) => removeElement(effect));
      data.effects = [];
    }
    if (data.timers) {
      data.timers.forEach((task) => {
        if (!task) return;
        task.cancelled = true;
        game.timeouts.delete(task);
      });
      data.timers = [];
    }
    removeElement(data.title);
    removeElement(data.aura);
    removeElement(data.train);
    if (fighter) {
      fighter.lastSubwayNoBodyUntil = 0;
      const element = getFighterElement(fighter);
      if (element) element.classList.remove("last-subway-rushing");
    }
  }

  function triggerJarvanNaturalDeath(fighter, now = getBattleNow(), options = {}) {
    if (!fighter || fighter.dead || fighter.abilityType !== "jarvanTimedWall") return false;
    const trainingTest = !!options.trainingTest;
    if (!trainingTest && (game.trainingMode || game.battleEnding || game.finalBlow || fighter.naturalDeathTriggered)) return false;

    fighter.naturalDeathTriggered = true;
    cancelFighterSkill(fighter);
    fighter.vx = 0;
    fighter.vy = 0;
    fighter.lastSubwayNoBodyUntil = 0;
    clearLastSubwayRushState(fighter, fighter.skillState);
    createJarvanNaturalDeathVisual(fighter);
    startJarvanNaturalDeathHitStop(150);

    if (trainingTest) {
      fighter.naturalDeathTriggered = false;
      game.trainingStats.lastSkillName = "자연사 테스트";
      updateTrainingStatsUi(now);
      addLog(`${fighter.name} 자연사 테스트`, "skill");
      return true;
    }

    recordSystemFinalBlow(fighter, "자연사", fighter.currentHp);
    fighter.currentHp = 0;
    refreshOiiaSize(fighter);
    fighter.dead = true;
    cleanupFighterDeathState(fighter);
    updateStats(fighter.side, fighter);
    addLog(`${fighter.name}가 자연사로 패배`, "bad");
    return true;
  }

  function createJarvanNaturalDeathVisual(fighter) {
    if (!fighter || !els.skillLayer) return null;
    clearJarvanNaturalDeathVisual(fighter);
    const fighterElement = getFighterElement(fighter);
    if (fighterElement) fighterElement.classList.add("jarvan-natural-death");

    const effect = document.createElement("div");
    effect.className = "jarvan-natural-death-effect";
    effect.style.left = `${fighter.x}px`;
    effect.style.top = `${fighter.y}px`;
    effect.style.setProperty("--jarvan-radius", `${fighter.radius || game.fighterBaseRadius || 26}px`);

    const hourglass = document.createElement("span");
    hourglass.className = "jarvan-hourglass";
    hourglass.setAttribute("aria-hidden", "true");
    const sandTop = document.createElement("i");
    sandTop.className = "jarvan-hourglass-sand top";
    const sandBottom = document.createElement("i");
    sandBottom.className = "jarvan-hourglass-sand bottom";
    hourglass.append(sandTop, sandBottom);

    const label = document.createElement("strong");
    label.textContent = "자연사";

    const dust = document.createElement("span");
    dust.className = "jarvan-natural-dust";
    for (let i = 0; i < 12; i += 1) {
      const particle = document.createElement("em");
      const angle = (Math.PI * 2 * i) / 12;
      const distance = (fighter.radius || 26) * (0.65 + Math.random() * 0.6);
      particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--dy", `${Math.sin(angle) * distance * 0.45 - fighter.radius * 0.35}px`);
      particle.style.animationDelay = `${420 + Math.random() * 260}ms`;
      dust.appendChild(particle);
    }

    effect.append(hourglass, dust, label);
    els.skillLayer.appendChild(effect);

    const removeTimer = window.setTimeout(() => {
      if (fighterElement) fighterElement.classList.remove("jarvan-natural-death");
      fighter.naturalDeathEffect = null;
      removeElement(effect);
    }, 1680);
    effect.__cleanup = () => {
      window.clearTimeout(removeTimer);
      if (fighterElement) fighterElement.classList.remove("jarvan-natural-death");
      if (fighter.naturalDeathEffect === effect) fighter.naturalDeathEffect = null;
    };
    fighter.naturalDeathEffect = effect;
    createDustBurst(fighter.x, fighter.y, fighter.radius * 1.35);
    return effect;
  }

  function clearJarvanNaturalDeathVisual(fighter) {
    if (!fighter) return;
    removeElement(fighter.naturalDeathEffect);
    fighter.naturalDeathEffect = null;
    const element = fighter.side ? getFighterElement(fighter) : null;
    if (element) element.classList.remove("jarvan-natural-death");
  }

  function startJarvanNaturalDeathHitStop(duration = 150) {
    const stopMs = Math.max(120, Math.min(180, Number(duration) || 150));
    game.evolutionFreezeActive = true;
    game.evolutionFreezeUntilWall = Math.max(game.evolutionFreezeUntilWall || 0, performance.now() + stopMs);
    if (els.arena) els.arena.classList.add("evolution-freeze");
    syncCombatAnimationPlayback();
    window.setTimeout(() => {
      if (performance.now() < (game.evolutionFreezeUntilWall || 0)) return;
      game.evolutionFreezeActive = false;
      game.evolutionFreezeUntilWall = 0;
      if (els.arena) els.arena.classList.remove("evolution-freeze");
      syncCombatAnimationPlayback();
      if (game.phase === "running") ensureBattleLoopRunning();
    }, stopMs + 90);
  }

  function startBloodMoonSlash(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    const direction = {
      x: state.data.dirX || 1,
      y: state.data.dirY || 0,
      angle: Number.isFinite(state.data.angle) ? state.data.angle : 0
    };
    const length = game.arenaSize * (Number(skill.lengthRate) || 0.9);
    const width = fighter.radius * (Number(skill.widthRate) || 1.1);
    const speed = game.arenaSize * (Number(skill.speedRate) || 1.45);
    const crescentRadius = width * 2.05;
    state.data.originX = fighter.x + direction.x * (fighter.radius + crescentRadius * 0.25);
    state.data.originY = fighter.y + direction.y * (fighter.radius + crescentRadius * 0.25);
    state.data.ownerId = fighter.id;
    state.data.ownerSide = fighter.side;
    state.data.dirX = direction.x;
    state.data.dirY = direction.y;
    state.data.angle = direction.angle;
    state.data.length = length;
    state.data.width = width;
    state.data.speed = speed;
    state.data.traveled = 0;
    state.data.crescentRadius = crescentRadius;
    state.data.crescentThickness = Math.max(width * 0.36, fighter.radius * 0.24);
    state.data.hit = false;
    state.data.lastTrailAt = 0;
    state.data.lastUpdateAt = now;
    state.data.trails = [];
    removeElement(state.data.charge);
    state.data.charge = null;
    state.data.projectile = createBloodMoonCrescentFromData(state.data, "bloodmoon-crescent");
    createBloodMoonLaunchBurst(fighter);
    pulseArena();
    restoreStoredVelocity(fighter, state);
    fighter.vx = 0;
    fighter.vy = 0;
    addLog(`${fighter.name} 혈월 참격 발사`, "skill");
  }

  function updateBloodMoonSlash(fighter, opponent, now) {
    const state = fighter.skillState;
    const skill = state.skill;
    const data = state.data;
    const owner = getFighterById(data.ownerId) || fighter;
    const currentOpponent = getOpposingFighter(owner.side);
    const dt = Math.min((now - (data.lastUpdateAt || now)) / 1000, MAX_FRAME_STEP);
    data.lastUpdateAt = now;
    data.traveled += data.speed * dt;
    updateBloodMoonCrescentFromData(data.projectile, data);

    if (!data.lastTrailAt || now - data.lastTrailAt >= 90) {
      data.lastTrailAt = now;
      const trail = createBloodMoonCrescentFromData(data, "bloodmoon-crescent bloodmoon-trail-piece");
      data.trails.push(trail);
      scheduleTimeout(() => removeElement(trail), 360);
    }

    if (!data.hit && !currentOpponent.dead && isTargetInBloodMoonCrescent(data, currentOpponent)) {
      if (tryReflectProjectileAgainstTarget(currentOpponent, { kind: "bloodmoon", item: data, state }, owner, now)) {
        return;
      }
      data.hit = true;
      const damage = getBloodMoonDamage(owner, currentOpponent, skill);
      applyDamage(owner, currentOpponent, {
        label: skill.name,
        baseDamage: damage,
        ignoreDefense: true
      });
      applySlowEffect(currentOpponent, Number(skill.slowRate) || 0.25, Number(skill.slowDuration) || 2000, now);
      createBloodMoonHitEffect(currentOpponent);
    }
    damageEnemySummonsWithBloodMoon(owner, data, skill);

    if (data.traveled > data.length + data.crescentRadius || currentOpponent.dead || fighter.dead) {
      removeElement(data.projectile);
      fighter.skillState = null;
      restoreStoredVelocity(fighter, state);
      startSkillRecovery(fighter, skill, now);
    }
  }

  function startEnmaYamatoFlash(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    const data = state.data;
    data.ownerId = fighter.id;
    data.attackId = `enma-ultimate-${fighter.id}-${Math.round(now)}`;
    data.endAt = now + 760;
    data.hitTargets = data.hitTargets || new Set();
    data.effects = data.effects || [];
    data.timers = data.timers || [];

    removeElement(data.charge);
    data.charge = null;
    if (data.dim && data.dim.classList) data.dim.classList.add("firing");

    const line = getEnmaYamatoLineData(data);
    Object.assign(data, line);
    data.trail = createGasterLine(data.originX, data.originY, data.angle, data.length, data.width * 1.05, "enma-yamato-distortion-trail");
    data.crescent = createEnmaYamatoCrescent(data);
    data.effects.push(data.trail, data.crescent);

    const crackTask = scheduleTimeout(() => {
      if (fighter.skillState !== state || fighter.dead || game.battleEnding) return;
      const crack = createGasterLine(data.originX, data.originY, data.angle, data.length, Math.max(4, data.width * 0.18), "enma-yamato-crack");
      data.effects.push(crack);
      const burst = createCircleEffect(
        data.originX + data.dirX * data.length * 0.72,
        data.originY + data.dirY * data.length * 0.72,
        data.width * 1.55,
        "enma-yamato-crack-burst"
      );
      data.effects.push(burst);
    }, 150);
    data.timers.push(crackTask);

    const hitCount = damageEnmaYamatoTargets(fighter, opponent, skill, data, now);
    if (hitCount > 0) pulseArena();
    addLog(`${fighter.name} 염라참 · 황천일섬 발사`, "bad");
  }

  function updateEnmaYamatoFlash(fighter, now) {
    const state = fighter.skillState;
    if (!state) return;
    if (fighter.dead || now >= (state.data.endAt || now)) {
      clearEnmaYamatoFlashState(state);
      restoreStoredVelocity(fighter, state);
      fighter.skillState = null;
      startSkillRecovery(fighter, state.skill, now);
    }
  }

  function clearEnmaYamatoFlashState(state) {
    if (!state || !state.data) return;
    const data = state.data;
    const owner = data.ownerId ? getFighterById(data.ownerId) : null;
    const casterElement = owner ? getFighterElement(owner) : null;
    if (casterElement) casterElement.classList.remove("enma-yamato-caster");
    if (data.highlightedTargets) {
      data.highlightedTargets.forEach((target) => {
        const targetElement = getEntityElement(target) || getFighterElement(target);
        if (targetElement) targetElement.classList.remove("enma-yamato-silhouette");
      });
      data.highlightedTargets = [];
    }
    if (data.timers) {
      data.timers.forEach((task) => {
        if (!task) return;
        task.cancelled = true;
        game.timeouts.delete(task);
      });
      data.timers = [];
    }
    if (data.effects) {
      data.effects.forEach((effect) => removeElement(effect));
      data.effects = [];
    }
    removeElement(data.warning);
    removeElement(data.charge);
    removeElement(data.dim);
    removeElement(data.title);
    removeElement(data.slash);
    removeElement(data.crescent);
    removeElement(data.trail);
    data.warning = null;
    data.charge = null;
    data.dim = null;
    data.title = null;
    data.slash = null;
    data.crescent = null;
    data.trail = null;
  }

  function getEnmaYamatoLineData(data) {
    const originX = Number(data.originX);
    const originY = Number(data.originY);
    const dirX = Number(data.dirX);
    const dirY = Number(data.dirY);
    return {
      originX: Number.isFinite(originX) ? originX : 0,
      originY: Number.isFinite(originY) ? originY : 0,
      dirX: Number.isFinite(dirX) ? dirX : 1,
      dirY: Number.isFinite(dirY) ? dirY : 0,
      angle: Number.isFinite(data.angle) ? data.angle : 0,
      length: Math.max(1, Number(data.length) || game.arenaSize),
      width: Math.max(8, Number(data.width) || game.fighterBaseRadius)
    };
  }

  function damageEnmaYamatoTargets(fighter, opponent, skill, data, now) {
    let hitCount = 0;
    getEnmaYamatoTargets(fighter, opponent).forEach((target) => {
      if (!isTargetInEnmaYamatoLine(target, data)) return;
      if (data.hitTargets.has(target.id)) return;
      data.hitTargets.add(target.id);

      const preHp = Math.max(0, Number(target.currentHp) || 0);
      const shouldExecute = canEnmaYamatoExecute(target, preHp, skill);
      let actual = 0;
      if (shouldExecute) {
        if (!canEnmaYamatoExecuteConnect(fighter, target, skill, data)) return;
        actual = preHp;
      } else {
        actual = applyDamage(fighter, target, {
          label: skill.name,
          fixedDamage: getEnmaYamatoDamage(target, skill),
          damageKind: "궁극기",
          attackId: data.attackId,
          hitId: `slash-${target.id}`
        });
        if (actual <= 0) return;
      }
      hitCount += 1;
      createEnmaYamatoHitBurst(target);
      if (shouldExecute) {
        executeEnmaYamatoTarget(fighter, target, skill, data.attackId, preHp);
      }
    });
    void now;
    return hitCount;
  }

  function getEnmaYamatoTargets(fighter, opponent) {
    const targets = [];
    if (opponent && !opponent.dead && !opponent.removing && !isFighterOutOfBattle(opponent)) {
      targets.push(opponent);
    }
    getEnemySummons(fighter.side).forEach((summon) => {
      if (!summon || summon.dead || summon.removing || isFighterOutOfBattle(summon)) return;
      targets.push(summon);
    });
    return targets;
  }

  function isTargetInEnmaYamatoLine(target, data) {
    if (!target || target.dead || target.removing || isFighterOutOfBattle(target)) return false;
    const dx = target.x - data.originX;
    const dy = target.y - data.originY;
    const projection = dx * data.dirX + dy * data.dirY;
    if (projection < -target.radius * 0.35 || projection > data.length + target.radius * 0.35) return false;
    const perpendicular = Math.abs(dx * data.dirY - dy * data.dirX);
    return perpendicular <= data.width / 2 + target.radius * 0.62;
  }

  function getEnmaYamatoDamage(target, skill) {
    const rate = Number(skill.maxHpDamageRate) || 0.35;
    const maxHp = Math.max(1, Number(target.maxHp) || 1);
    return Math.max(1, Math.round(maxHp * rate));
  }

  function canEnmaYamatoExecute(target, preHp, skill) {
    if (!isMainBattleFighter(target)) return false;
    const threshold = Number(skill.executeThreshold) || 0.3;
    const maxHp = Math.max(1, Number(target.maxHp) || 1);
    return Math.max(0, Number(preHp) || 0) / maxHp <= threshold;
  }

  function canEnmaYamatoExecuteConnect(fighter, target, skill, data) {
    if (isFighterDamageSuppressed(target)) {
      if (isBlueEyesInvulnerable(target, getBattleNow())) {
        createBlueEyesInvulnerableBlock(target);
      }
      if (isOiiaGreatSpinActive(target, getBattleNow())) {
        createOiiaGreatSpinBlock(target);
      }
      return false;
    }
    if (!skill.ignoreBlind && isBlueEyesBlindActive(fighter, getBattleNow())) {
      createBlueEyesBlindMiss(fighter);
      addLog(`${fighter.name} 실명으로 공격 실패 (${skill.name})`, "skill");
      return false;
    }
    const options = {
      label: skill.name,
      damageKind: "궁극기",
      attackId: data.attackId,
      hitId: `execute-${target.id}`
    };
    if (trySansDodge(target, fighter, options)) return false;
    if (isChillShieldActive(target)) {
      createChillShieldBlock(target);
      return false;
    }
    return true;
  }

  function executeEnmaYamatoTarget(fighter, target, skill, attackId, preHp) {
    const label = "염라참 · 황천일섬 처형";
    createEnmaYamatoExecutionFlash();
    createEnmaYamatoExecutionMark(target);
    startBlueEyesEvolutionFreeze(150);

    if (game.finalBlow && game.finalBlow.defenderId === target.id) {
      game.finalBlow.displayLabel = label;
      game.finalBlow.kind = "궁극기";
      game.finalBlow.attackId = `${attackId}:execute`;
      addLog(`${target.name} ${label}`, "bad");
      return;
    }

    if (game.trainingMode && isTrainingDummy(target)) {
      target.currentHp = target.maxHp;
      target.dead = false;
      refreshOiiaSize(target);
      addLog(`${target.name} ${label} 테스트`, "bad");
      return;
    }

    const remainingHp = Math.max(0, Number(target.currentHp) || 0);
    recordFinalBlow(fighter, target, {
      label,
      finalBlowLabel: label,
      damageKind: "궁극기",
      attackId: `${attackId}:execute`
    }, remainingHp || preHp);
    target.currentHp = 0;
    refreshOiiaSize(target);
    target.dead = true;
    cleanupFighterDeathState(target);
    addLog(`${target.name} ${label}`, "bad");
    void skill;
  }

  function createEnmaYamatoHitBurst(target) {
    const burst = createCircleEffect(target.x, target.y, target.radius * 1.82, "enma-yamato-hit-burst");
    const angle = Math.random() * Math.PI;
    const crack = createGasterLine(
      target.x - Math.cos(angle) * target.radius * 1.15,
      target.y - Math.sin(angle) * target.radius * 1.15,
      angle,
      target.radius * 3.7,
      Math.max(4, target.radius * 0.18),
      "enma-yamato-local-crack"
    );
    scheduleTimeout(() => removeElement(burst), 360);
    scheduleTimeout(() => removeElement(crack), 520);
  }

  function getOpponentDirection(fighter, opponent) {
    const dx = opponent.x - fighter.x;
    const dy = opponent.y - fighter.y;
    const distance = Math.hypot(dx, dy) || 1;
    return {
      x: dx / distance,
      y: dy / distance,
      angle: Math.atan2(dy, dx)
    };
  }

  function getBloodMoonDamage(attacker, defender, skill) {
    const expectedCollisionDamage = Math.max(MIN_DAMAGE, Math.round(attacker.atk - defender.def));
    const bonus = Number(skill.damageBonus) || 3;
    const maxDamage = Number(skill.maxDamage) || 24;
    return clamp(expectedCollisionDamage + bonus, MIN_DAMAGE, maxDamage);
  }

  function isTargetInBloodMoonCrescent(data, target) {
    const samples = getBloodMoonCrescentSamples(data);
    return samples.some((point) => {
      const distance = Math.hypot(target.x - point.x, target.y - point.y);
      return distance <= point.radius + target.radius * 0.42;
    });
  }

  function getBloodMoonCrescentSamples(data) {
    const centerX = data.originX + data.dirX * data.traveled;
    const centerY = data.originY + data.dirY * data.traveled;
    const normalX = -data.dirY;
    const normalY = data.dirX;
    const radius = data.crescentRadius || data.width * 2;
    const sampleRadius = Math.max((data.crescentThickness || data.width * 0.36) * 0.52, 8);
    const samples = [];
    const count = 11;

    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const curveAngle = -1.12 + t * 2.24;
      const forward = Math.cos(curveAngle) * radius;
      const side = Math.sin(curveAngle) * radius;
      samples.push({
        x: centerX + data.dirX * forward + normalX * side,
        y: centerY + data.dirY * forward + normalY * side,
        radius: sampleRadius
      });
    }

    return samples;
  }

  function startDarkinBlade(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    state.data.strikeIndex = 0;
    state.data.current = null;
    state.data.nextStrikeAt = now;
    state.data.effects = [];
    state.data.shadowDashUsed = false;
    state.data.shadowDashCount = 0;
    state.data.shadowDashMaxCount = 3;
    state.data.shadowDashPendingTask = null;
    state.data.shadowDashEffects = [];
    state.data.impactEffects = [];
    state.data.effectTasks = [];
    state.data.attackIdBase = `darkin-${fighter.id}-${now.toFixed(3)}-${Math.random().toString(16).slice(2)}`;
    addLog(`${fighter.name} 다르킨의 검`, "skill");
  }

  function updateDarkinBlade(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;
    const data = state.data;
    if (fighter.dead || opponent.dead) {
      clearDarkinBlade(state);
      fighter.skillState = null;
      return;
    }

    if (!data.current && data.strikeIndex < 3 && now >= data.nextStrikeAt) {
      beginDarkinBladeStrike(fighter, opponent, state, now);
    }

    if (data.current) {
      updateAatroxShadowDash(fighter, opponent, data.current, state, now);
    }

    if (data.current && now >= data.current.impactAt) {
      resolveDarkinBladeStrike(fighter, opponent, state, data.current, now);
      data.current = null;
      data.strikeIndex += 1;
      if (data.strikeIndex >= 3) {
        clearDarkinBlade(state, { preserveImpact: true });
        restoreStoredVelocity(fighter, state);
        startSkillRecovery(fighter, state.skill, now);
        return;
      }
      data.nextStrikeAt = now + (Number(state.skill.strikeGap) || 400);
    }
  }

  function beginDarkinBladeStrike(fighter, opponent, state, now) {
    clearDarkinBladeStrikeVisuals(state, state.data.current);
    clearDarkinBladeEffectBucket(state, "impactEffects");
    clearDarkinBladeEffectBucket(state, "shadowDashEffects");
    cancelDarkinBladeEffectTasks(state);
    const strikeNumber = state.data.strikeIndex + 1;
    const direction = getOpponentDirection(fighter, opponent);
    const strike = createDarkinBladeStrikeData(fighter, state.skill, strikeNumber, direction, now);
    strike.attackId = `${state.data.attackIdBase}-${strikeNumber}`;
    strike.effects = createDarkinBladeWarning(strike);
    state.data.effects.push(...strike.effects);
    state.data.current = strike;
    maybeStartAatroxShadowDash(fighter, opponent, state, strike, now);
  }

  function createDarkinBladeStrikeData(fighter, skill, strikeNumber, direction, now) {
    const warningDuration = getDarkinBladeWarningDuration(fighter, skill, strikeNumber);
    const rangeScale = getAatroxRangeScale(fighter);
    const originX = fighter.x + direction.x * fighter.radius * 0.45;
    const originY = fighter.y + direction.y * fighter.radius * 0.45;
    const base = {
      strikeNumber,
      angle: direction.angle,
      dirX: direction.x,
      dirY: direction.y,
      originX,
      originY,
      centerX: fighter.x,
      centerY: fighter.y,
      impactAt: now + warningDuration,
      resolved: false,
      rangeScale
    };

    if (strikeNumber === 1) {
      const baseDamage = Number(skill.q1Damage) || 12;
      return {
        ...base,
        shape: "rect",
        length: game.arenaSize * (Number(skill.q1LengthRate) || 0.42) * rangeScale,
        width: fighter.radius * (Number(skill.q1WidthRate) || 1.28) * rangeScale,
        baseDamage,
        coreDamage: Number(skill.q1CoreDamage) || baseDamage * 2,
        healRate: Number(skill.q1HealRate) || 0.2,
        coreKind: "tip",
        coreStartRate: Number(skill.q1CoreStartRate) || 0.75
      };
    }

    if (strikeNumber === 2) {
      const baseDamage = Number(skill.q2Damage) || 13;
      const length = game.arenaSize * (Number(skill.q2LengthRate) || 0.3) * rangeScale;
      const startWidth = fighter.radius * (Number(skill.q2StartWidthRate) || 1.25) * rangeScale;
      const endWidth = fighter.radius * (Number(skill.q2WidthRate) || 3.3) * rangeScale;
      return {
        ...base,
        shape: "trapezoid",
        length,
        startWidth,
        endWidth,
        baseDamage,
        coreDamage: Number(skill.q2CoreDamage) || baseDamage * 2,
        healRate: Number(skill.q2HealRate) || 0.2,
        coreKind: "outer",
        coreStartRate: Number(skill.q2CoreStartRate) || 0.82
      };
    }

    const baseDamage = Number(skill.q3Damage) || 16;
    const radius = fighter.radius * (Number(skill.q3RadiusRate) || 3.2) * rangeScale;
    const forwardOffset = fighter.radius * 2.55 * rangeScale;
    return {
      ...base,
      shape: "circle",
      centerX: fighter.x + direction.x * forwardOffset,
      centerY: fighter.y + direction.y * forwardOffset,
      radius,
      coreRadius: radius * 0.35,
      forwardOffset,
      baseDamage,
      coreDamage: Number(skill.q3CoreDamage) || baseDamage * 2,
      healRate: Number(skill.q3HealRate) || 0.3,
      coreKind: "center"
    };
  }

  function getAatroxRangeScale(fighter) {
    return fighter && fighter.aatroxUltimate && fighter.aatroxUltimate.active ? 1.5 : 1;
  }

  function getDarkinBladeWarningDuration(fighter, skill, strikeNumber) {
    const key = strikeNumber === 3 ? "q3Warning" : `q${strikeNumber}Warning`;
    const fallback = strikeNumber === 3 ? 700 : 550;
    const multiplier = fighter.aatroxUltimate && fighter.aatroxUltimate.active ? 0.85 : 1;
    return (Number(skill[key]) || fallback) * multiplier;
  }

  function createDarkinBladeWarning(strike) {
    if (strike.shape === "circle") {
      const base = createCircleEffect(strike.centerX, strike.centerY, strike.radius, "aatrox-blade-warning circle");
      const core = markAatroxTrueRange(createCircleEffect(strike.centerX, strike.centerY, strike.coreRadius || strike.radius, "aatrox-blade-core circle center"));
      return [base, core];
    }

    if (strike.shape === "cone") {
      const base = createAatroxConeEffect(strike.centerX, strike.centerY, strike.angle, strike.radius, strike.arc, "aatrox-blade-warning cone", strike.coreStartRate);
      const core = markAatroxTrueRange(createAatroxConeEffect(strike.centerX, strike.centerY, strike.angle, strike.radius, strike.arc, "aatrox-blade-core cone", strike.coreStartRate));
      return [base, core];
    }

    if (strike.shape === "trapezoid") {
      const base = createAatroxTrapezoidEffect(
        strike.originX,
        strike.originY,
        strike.angle,
        strike.length,
        strike.startWidth,
        strike.endWidth,
        "aatrox-blade-warning trapezoid"
      );
      const coreStart = Number(strike.coreStartRate) || 0.82;
      const coreLength = strike.length * (1 - coreStart);
      const coreStartWidth = getAatroxTrapezoidWidthAt(strike, coreStart);
      const core = markAatroxTrueRange(createAatroxTrapezoidEffect(
        strike.originX + strike.dirX * strike.length * coreStart,
        strike.originY + strike.dirY * strike.length * coreStart,
        strike.angle,
        coreLength,
        coreStartWidth,
        strike.endWidth,
        "aatrox-blade-core trapezoid"
      ));
      return [base, core];
    }

    const effects = [createGasterLine(strike.originX, strike.originY, strike.angle, strike.length, strike.width, "aatrox-blade-warning")];
    if (strike.coreKind === "tip") {
      const coreStart = Number(strike.coreStartRate) || 0.75;
      const coreLength = strike.length * (1 - coreStart);
      effects.push(markAatroxTrueRange(createGasterLine(
        strike.originX + strike.dirX * strike.length * coreStart,
        strike.originY + strike.dirY * strike.length * coreStart,
        strike.angle,
        coreLength,
        strike.width * 1.05,
        "aatrox-blade-core"
      )));
    } else {
      const normalX = -strike.dirY;
      const normalY = strike.dirX;
      [-1, 1].forEach((side) => {
        effects.push(createGasterLine(
          strike.originX + normalX * strike.width * 0.32 * side,
          strike.originY + normalY * strike.width * 0.32 * side,
          strike.angle,
          strike.length,
          strike.width * 0.26,
          "aatrox-blade-core side"
        ));
      });
    }
    return effects;
  }

  function createAatroxConeEffect(x, y, angle, radius, arc, className, coreStartRate) {
    const element = document.createElement("div");
    element.className = `aatrox-cone-effect ${className}`;
    els.skillLayer.appendChild(element);
    updateAatroxConeEffect(element, x, y, angle, radius, arc, coreStartRate);
    return element;
  }

  function updateAatroxConeEffect(element, x, y, angle, radius, arc, coreStartRate) {
    if (!element) return;
    const safeArc = Number(arc) || degreesToRadians(62);
    const halfY = clamp(Math.tan(safeArc / 2) * 50, 4, 48);
    const trueStart = clamp(Number(coreStartRate) || 0.82, 0.55, 0.94);
    element.style.width = `${radius * 2}px`;
    element.style.height = `${radius * 2}px`;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.setProperty("--cone-top", `${50 - halfY}%`);
    element.style.setProperty("--cone-bottom", `${50 + halfY}%`);
    element.style.setProperty("--cone-half-angle", `${safeArc / 2}rad`);
    element.style.setProperty("--cone-half-angle-neg", `${-safeArc / 2}rad`);
    element.style.setProperty("--true-inner", `${50 * trueStart}%`);
    element.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
  }

  function markAatroxTrueRange(element) {
    if (!element) return element;
    element.dataset.trueRange = "true";
    return element;
  }

  function createAatroxTrapezoidEffect(originX, originY, angle, length, startWidth, endWidth, className) {
    const element = document.createElement("div");
    element.className = `aatrox-trapezoid-effect ${className}`;
    els.skillLayer.appendChild(element);
    updateAatroxTrapezoidEffect(element, originX, originY, angle, length, startWidth, endWidth);
    return element;
  }

  function updateAatroxTrapezoidEffect(element, originX, originY, angle, length, startWidth, endWidth) {
    if (!element) return;
    const safeLength = Math.max(1, Number(length) || 1);
    const safeEndWidth = Math.max(1, Number(endWidth) || 1);
    const safeStartWidth = clamp(Number(startWidth) || safeEndWidth * 0.4, 1, safeEndWidth);
    const centerX = originX + Math.cos(angle) * safeLength * 0.5;
    const centerY = originY + Math.sin(angle) * safeLength * 0.5;
    const startInset = clamp((1 - safeStartWidth / safeEndWidth) * 50, 0, 48);
    element.style.width = `${safeLength}px`;
    element.style.height = `${safeEndWidth}px`;
    element.style.left = `${centerX}px`;
    element.style.top = `${centerY}px`;
    element.style.setProperty("--trap-start-top", `${startInset}%`);
    element.style.setProperty("--trap-start-bottom", `${100 - startInset}%`);
    element.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
  }

  function getAatroxTrapezoidWidthAt(strike, rate) {
    const progress = clamp(Number(rate) || 0, 0, 1);
    return (Number(strike.startWidth) || 1) + ((Number(strike.endWidth) || 1) - (Number(strike.startWidth) || 1)) * progress;
  }

  function maybeStartAatroxShadowDash(fighter, opponent, state, strike, now, options = {}) {
    if (!fighter || !opponent || fighter.dead || opponent.dead || !state || !state.data || !strike) return;
    const dashCount = Number(state.data.shadowDashCount) || 0;
    const maxCount = Number(state.data.shadowDashMaxCount) || getAatroxShadowDashMaxCount(state.skill);
    if (dashCount >= maxCount) return;
    if (strike.shadowDashAttempted) return;
    if (strike.shadowDash && strike.shadowDash.active) return;
    const dashInfo = getAatroxShadowDashInfo(state.skill);
    if (!dashInfo) return;

    strike.shadowDashAttempted = true;
    const best = findBestAatroxShadowDashCandidate(fighter, opponent, strike, dashInfo.skill, {
      allowReposition: true
    }) || getAatroxFallbackDashCandidate(fighter, opponent, strike, dashInfo.skill);
    if (!best) return;

    startAatroxShadowDash(fighter, state, strike, dashInfo, best, now);
  }

  function getAatroxShadowDashMaxCount(darkinSkill) {
    return Math.max(1, Math.round(Number(darkinSkill && darkinSkill.shadowDashMaxCount) || 3));
  }

  function getAatroxShadowDashInfo(darkinSkill) {
    if (!darkinSkill) return null;
    return {
      skill: {
        dashDistanceRate: Number(darkinSkill.shadowDashDistanceRate) || 0.16,
        dashDuration: Number(darkinSkill.shadowDashDuration) || 200,
        cooldown: Number(darkinSkill.shadowDashCooldown) || 6500
      }
    };
  }

  function findBestAatroxShadowDashCandidate(fighter, opponent, strike, skill, options = {}) {
    const distance = game.arenaSize * (Number(skill.dashDistanceRate) || 0.16);
    const ideal = getAatroxTrueRangeDashCandidate(fighter, opponent, strike, skill);
    const directions = [
      [1, 0],
      [Math.SQRT1_2, Math.SQRT1_2],
      [0, 1],
      [-Math.SQRT1_2, Math.SQRT1_2],
      [-1, 0],
      [-Math.SQRT1_2, -Math.SQRT1_2],
      [0, -1],
      [Math.SQRT1_2, -Math.SQRT1_2]
    ];
    const currentScore = getAatroxShadowDashScore(strike, opponent, fighter.x, fighter.y, fighter.radius);
    if (currentScore.grade >= 2 && !options.allowReposition) return null;
    let best = null;
    const candidates = [];

    if (ideal) {
      candidates.push(ideal);
      const nudge = Math.max(fighter.radius * 0.7, game.arenaSize * 0.025);
      directions.forEach(([dx, dy]) => {
        candidates.push(getClampedShadowDashPoint(fighter, ideal.x + dx * nudge, ideal.y + dy * nudge));
      });
    }

    directions.forEach(([dx, dy]) => {
      candidates.push(getClampedShadowDashPoint(fighter, fighter.x + dx * distance, fighter.y + dy * distance));
    });

    candidates.forEach((end) => {
      if (!isAatroxShadowDashPathSafe(fighter, fighter.x, fighter.y, end.x, end.y)) return;
      if (Math.hypot(opponent.x - end.x, opponent.y - end.y) < fighter.radius * 0.85) return;
      const score = getAatroxShadowDashScore(strike, opponent, end.x, end.y, fighter.radius);
      const improved = score.grade > currentScore.grade || (
        options.allowReposition &&
        score.grade >= currentScore.grade &&
        score.score > currentScore.score + 1
      );
      if (!improved) return;
      if (!best || score.grade > best.grade || (score.grade === best.grade && score.score > best.score)) {
        best = { ...end, grade: score.grade, score: score.score, currentScore: currentScore.score };
      }
    });

    return best;
  }

  function getAatroxFallbackDashCandidate(fighter, opponent, strike, skill) {
    const end = getAatroxTrueRangeDashCandidate(fighter, opponent, strike, skill);
    if (!end || !isAatroxShadowDashPathSafe(fighter, fighter.x, fighter.y, end.x, end.y)) return null;
    if (Math.hypot(opponent.x - end.x, opponent.y - end.y) < fighter.radius * 0.85) return null;
    const score = getAatroxShadowDashScore(strike, opponent, end.x, end.y, fighter.radius);
    return { ...end, grade: score.grade, score: score.score };
  }

  function getAatroxTrueRangeDashCandidate(fighter, opponent, strike, skill) {
    if (!fighter || !opponent || !strike) return null;
    const maxDistance = game.arenaSize * (Number(skill && skill.dashDistanceRate) || 0.16);
    const dx = opponent.x - fighter.x;
    const dy = opponent.y - fighter.y;
    const length = Math.hypot(dx, dy);
    if (length < fighter.radius * 0.85) return null;
    const dirX = dx / length;
    const dirY = dy / length;
    const anchor = getAatroxTrueRangeAnchorDistance(strike, fighter.radius);
    let idealX = opponent.x - dirX * anchor;
    let idealY = opponent.y - dirY * anchor;
    const travel = Math.hypot(idealX - fighter.x, idealY - fighter.y);
    if (travel > maxDistance) {
      idealX = fighter.x + ((idealX - fighter.x) / travel) * maxDistance;
      idealY = fighter.y + ((idealY - fighter.y) / travel) * maxDistance;
    }
    return getClampedShadowDashPoint(fighter, idealX, idealY);
  }

  function getAatroxTrueRangeAnchorDistance(strike, fighterRadius) {
    if (!strike) return fighterRadius;
    if (strike.shape === "circle") {
      return Number(strike.forwardOffset) || fighterRadius * 2.55;
    }
    if (strike.shape === "trapezoid" || strike.coreKind === "tip") {
      const coreStart = Number(strike.coreStartRate) || (strike.shape === "trapezoid" ? 0.82 : 0.75);
      return fighterRadius * 0.45 + (Number(strike.length) || 0) * ((coreStart + 1) / 2);
    }
    return fighterRadius + (Number(strike.length) || Number(strike.radius) || fighterRadius) * 0.8;
  }

  function getAatroxShadowDashScore(strike, target, x, y, radius) {
    const candidate = getDarkinBladeStrikeAtPosition(strike, x, y, radius, target);
    if (candidate.shape === "circle") {
      const distance = Math.hypot(target.x - candidate.centerX, target.y - candidate.centerY);
      const inside = distance <= candidate.radius + target.radius * 0.38;
      if (!inside) {
        return { grade: 0, score: Math.max(0, 18 - Math.abs(distance - candidate.radius) / Math.max(1, target.radius)) };
      }
      if (candidate.coreKind === "center") {
        const coreDistance = candidate.coreRadius + target.radius * 0.25;
        if (distance <= coreDistance) {
          return { grade: 2, score: 100 - clamp(distance / Math.max(1, coreDistance), 0, 1) * 18 };
        }
        return { grade: 1, score: 52 - clamp((distance - coreDistance) / Math.max(1, candidate.radius - coreDistance), 0, 1) * 16 };
      }
      const coreStart = candidate.radius * (Number(candidate.coreStartRate) || 0.58);
      if (distance >= coreStart) {
        const ideal = candidate.radius * 0.82;
        const tolerance = Math.max(1, candidate.radius * 0.28);
        return { grade: 2, score: 100 - clamp(Math.abs(distance - ideal) / tolerance, 0, 1) * 28 };
      }
      return { grade: 1, score: 48 };
    }

    if (candidate.shape === "cone") {
      const dx = target.x - candidate.centerX;
      const dy = target.y - candidate.centerY;
      const distance = Math.hypot(dx, dy);
      const diff = Math.abs(normalizeAngle(Math.atan2(dy, dx) - candidate.angle));
      if (distance > candidate.radius + target.radius * 0.5 || diff > candidate.arc / 2) {
        const angleGap = Math.max(0, diff - candidate.arc / 2) * candidate.radius;
        const distanceGap = Math.max(0, distance - candidate.radius);
        return { grade: 0, score: Math.max(0, 20 - Math.hypot(angleGap, distanceGap) / Math.max(1, target.radius)) };
      }
      const coreStart = candidate.radius * (Number(candidate.coreStartRate) || 0.82);
      if (distance >= coreStart) {
        const ideal = (coreStart + candidate.radius) / 2;
        return { grade: 2, score: 100 - clamp(Math.abs(distance - ideal) / Math.max(1, candidate.radius - coreStart), 0, 1) * 24 };
      }
      return { grade: 1, score: 50 + (distance / Math.max(1, candidate.radius)) * 10 };
    }

    if (candidate.shape === "trapezoid") {
      const local = getRectLocalPosition(candidate, target);
      const hit = getAatroxTrapezoidLocalHit(candidate, local, target);
      if (!hit.inside) {
        const forwardGap = local.forward < 0 ? -local.forward : Math.max(0, local.forward - candidate.length);
        const progress = clamp(local.forward / Math.max(1, candidate.length), 0, 1);
        const sideLimit = getAatroxTrapezoidWidthAt(candidate, progress) / 2 + target.radius * 0.35;
        const sideGap = Math.max(0, Math.abs(local.side) - sideLimit);
        return { grade: 0, score: Math.max(0, 22 - Math.hypot(forwardGap, sideGap) / Math.max(1, target.radius)) };
      }
      if (hit.core) {
        const coreStart = candidate.length * (Number(candidate.coreStartRate) || 0.82);
        const idealForward = (coreStart + candidate.length) / 2;
        const forwardScore = 1 - clamp(Math.abs(local.forward - idealForward) / Math.max(1, candidate.length - coreStart), 0, 1);
        const progress = clamp(local.forward / Math.max(1, candidate.length), 0, 1);
        const sideLimit = getAatroxTrapezoidWidthAt(candidate, progress) / 2 + target.radius * 0.35;
        const sideScore = 1 - clamp(Math.abs(local.side) / Math.max(1, sideLimit), 0, 1);
        return { grade: 2, score: 100 * (0.72 * forwardScore + 0.28 * sideScore) };
      }
      return { grade: 1, score: 48 + clamp(local.forward / Math.max(1, candidate.length), 0, 1) * 12 };
    }

    const local = getRectLocalPosition(candidate, target);
    const sideLimit = candidate.width / 2 + target.radius * 0.35;
    const forwardInside = local.forward >= 0 && local.forward <= candidate.length;
    const sideInside = Math.abs(local.side) <= sideLimit;
    if (!forwardInside || !sideInside) {
      const forwardGap = local.forward < 0 ? -local.forward : Math.max(0, local.forward - candidate.length);
      const sideGap = Math.max(0, Math.abs(local.side) - sideLimit);
      return { grade: 0, score: Math.max(0, 18 - Math.hypot(forwardGap, sideGap) / Math.max(1, target.radius)) };
    }

    if (candidate.coreKind === "tip") {
      const coreStart = candidate.length * (Number(candidate.coreStartRate) || 0.75);
      if (local.forward >= coreStart) {
        const idealForward = (coreStart + candidate.length) / 2;
        const forwardScore = 1 - clamp(Math.abs(local.forward - idealForward) / Math.max(1, candidate.length * 0.08), 0, 1);
        const sideScore = 1 - clamp(Math.abs(local.side) / Math.max(1, sideLimit), 0, 1);
        return { grade: 2, score: 100 * (0.65 * forwardScore + 0.35 * sideScore) };
      }
      return { grade: 1, score: 48 };
    }

    const side = Math.abs(local.side);
    const coreSide = candidate.width * 0.24;
    if (side >= coreSide) {
      const idealSide = (coreSide + sideLimit) / 2;
      const sideScore = 1 - clamp(Math.abs(side - idealSide) / Math.max(1, sideLimit - coreSide), 0, 1);
      const forwardScore = 1 - clamp(Math.abs(local.forward - candidate.length / 2) / Math.max(1, candidate.length / 2), 0, 1);
      return { grade: 2, score: 100 * (0.68 * sideScore + 0.32 * forwardScore) };
    }
    return { grade: 1, score: 48 };
  }

  function getDarkinBladeStrikeAtPosition(strike, x, y, radius, target) {
    const candidate = { ...strike };
    if (target) {
      const dx = target.x - x;
      const dy = target.y - y;
      const distance = Math.hypot(dx, dy);
      if (distance >= radius * 0.9) {
        candidate.dirX = dx / distance;
        candidate.dirY = dy / distance;
        candidate.angle = Math.atan2(candidate.dirY, candidate.dirX);
      }
    }
    candidate.centerX = x + candidate.dirX * (Number(candidate.forwardOffset) || 0);
    candidate.centerY = y + candidate.dirY * (Number(candidate.forwardOffset) || 0);
    candidate.originX = x + candidate.dirX * radius * 0.45;
    candidate.originY = y + candidate.dirY * radius * 0.45;
    return candidate;
  }

  function getClampedShadowDashPoint(fighter, x, y) {
    return {
      x: clamp(x, fighter.radius, game.arenaSize - fighter.radius),
      y: clamp(y, fighter.radius, game.arenaSize - fighter.radius)
    };
  }

  function isAatroxShadowDashPathSafe(fighter, startX, startY, endX, endY) {
    const samples = 9;
    for (let i = 1; i <= samples; i += 1) {
      const t = i / samples;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;
      if (x - fighter.radius < 0 || x + fighter.radius > game.arenaSize || y - fighter.radius < 0 || y + fighter.radius > game.arenaSize) {
        return false;
      }
      const hitsWall = game.arenaObjects.some((object) => {
        if (object.type !== "circleWall" || object.fadeStarted) return false;
        return Math.abs(Math.hypot(x - object.x, y - object.y) - object.radius) < fighter.radius + 3;
      });
      if (hitsWall) return false;
    }
    return true;
  }

  function startAatroxShadowDash(fighter, state, strike, dashInfo, candidate, now) {
    const duration = Number(dashInfo.skill.dashDuration) || 200;
    state.data.shadowDashCount = (Number(state.data.shadowDashCount) || 0) + 1;
    state.data.shadowDashUsed = state.data.shadowDashCount >= (Number(state.data.shadowDashMaxCount) || getAatroxShadowDashMaxCount(state.skill));
    fighter.shadowDashReadyAt = now + (Number(dashInfo.skill.cooldown) || 6500);
    fighter.shadowDashDamageSuppressUntil = now + duration + 40;
    strike.shadowDash = {
      active: true,
      startAt: now,
      endAt: now + duration,
      startX: fighter.x,
      startY: fighter.y,
      endX: candidate.x,
      endY: candidate.y,
      lastTrailAt: 0
    };
    strike.impactAt = Math.max(strike.impactAt, now + duration + 70);
    createAatroxShadowDashTrail(fighter, state, strike, now, true);
    addLog(`${fighter.name} 그림자 돌진`, "skill");
  }

  function updateAatroxShadowDash(fighter, opponent, strike, state, now) {
    if (!strike || !strike.shadowDash || !strike.shadowDash.active) return;
    const dash = strike.shadowDash;
    const progress = clamp((now - dash.startAt) / Math.max(1, dash.endAt - dash.startAt), 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    fighter.x = dash.startX + (dash.endX - dash.startX) * eased;
    fighter.y = dash.startY + (dash.endY - dash.startY) * eased;
    keepInsideArena(fighter);
    separateEntityFromCircleWalls(fighter);
    updateDarkinBladeStrikePositionFromFighter(strike, fighter);
    updateDarkinBladeWarningEffects(strike);

    if (!dash.lastTrailAt || now - dash.lastTrailAt >= 58) {
      dash.lastTrailAt = now;
      createAatroxShadowDashTrail(fighter, state, strike, now, false);
    }

    if (progress >= 1) {
      strike.shadowDash.active = false;
      fighter.x = dash.endX;
      fighter.y = dash.endY;
      keepInsideArena(fighter);
      separateEntityFromCircleWalls(fighter);
      refreshDarkinBladeDirectionAfterDash(fighter, opponent, strike);
      updateDarkinBladeStrikePositionFromFighter(strike, fighter);
      updateDarkinBladeWarningEffects(strike);
      const impact = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.05, "aatrox-shadow-impact");
      state.data.shadowDashEffects.push(impact);
      scheduleDarkinBladeEffectRemoval(state, impact, 320);
    }
  }

  function updateDarkinBladeStrikePositionFromFighter(strike, fighter) {
    strike.centerX = fighter.x + strike.dirX * (Number(strike.forwardOffset) || 0);
    strike.centerY = fighter.y + strike.dirY * (Number(strike.forwardOffset) || 0);
    strike.originX = fighter.x + strike.dirX * fighter.radius * 0.45;
    strike.originY = fighter.y + strike.dirY * fighter.radius * 0.45;
  }

  function refreshDarkinBladeDirectionAfterDash(fighter, opponent, strike) {
    if (!fighter || !opponent || !strike || opponent.dead) return;
    const dx = opponent.x - fighter.x;
    const dy = opponent.y - fighter.y;
    const distance = Math.hypot(dx, dy);
    if (distance < fighter.radius * 0.9) return;
    strike.dirX = dx / distance;
    strike.dirY = dy / distance;
    strike.angle = Math.atan2(strike.dirY, strike.dirX);
  }

  function updateDarkinBladeWarningEffects(strike) {
    if (!strike || !strike.effects || !strike.effects.length) return;
    if (strike.shape === "circle") {
      updateCircleEffect(strike.effects[0], strike.centerX, strike.centerY, strike.radius);
      updateCircleEffect(strike.effects[1], strike.centerX, strike.centerY, strike.coreRadius || strike.radius);
      return;
    }

    if (strike.shape === "cone") {
      updateAatroxConeEffect(strike.effects[0], strike.centerX, strike.centerY, strike.angle, strike.radius, strike.arc, strike.coreStartRate);
      updateAatroxConeEffect(strike.effects[1], strike.centerX, strike.centerY, strike.angle, strike.radius, strike.arc, strike.coreStartRate);
      return;
    }

    if (strike.shape === "trapezoid") {
      updateAatroxTrapezoidEffect(strike.effects[0], strike.originX, strike.originY, strike.angle, strike.length, strike.startWidth, strike.endWidth);
      const coreStart = Number(strike.coreStartRate) || 0.82;
      updateAatroxTrapezoidEffect(
        strike.effects[1],
        strike.originX + strike.dirX * strike.length * coreStart,
        strike.originY + strike.dirY * strike.length * coreStart,
        strike.angle,
        strike.length * (1 - coreStart),
        getAatroxTrapezoidWidthAt(strike, coreStart),
        strike.endWidth
      );
      return;
    }

    updateGasterLine(strike.effects[0], strike.originX, strike.originY, strike.angle, strike.length, strike.width);
    if (strike.coreKind === "tip") {
      const coreStart = Number(strike.coreStartRate) || 0.75;
      const coreLength = strike.length * (1 - coreStart);
      updateGasterLine(
        strike.effects[1],
        strike.originX + strike.dirX * strike.length * coreStart,
        strike.originY + strike.dirY * strike.length * coreStart,
        strike.angle,
        coreLength,
        strike.width * 1.05
      );
      return;
    }

    const normalX = -strike.dirY;
    const normalY = strike.dirX;
    [-1, 1].forEach((side, index) => {
      updateGasterLine(
        strike.effects[index + 1],
        strike.originX + normalX * strike.width * 0.32 * side,
        strike.originY + normalY * strike.width * 0.32 * side,
        strike.angle,
        strike.length,
        strike.width * 0.26
      );
    });
  }

  function createAatroxShadowDashTrail(fighter, state, strike, now, includeCracks) {
    const trail = createCircleEffect(fighter.x, fighter.y, fighter.radius * 0.9, "aatrox-shadow-afterimage");
    state.data.shadowDashEffects.push(trail);
    scheduleDarkinBladeEffectRemoval(state, trail, 260);
    if (!includeCracks) return;
    const crack = createGasterLine(fighter.x, fighter.y, strike.angle, fighter.radius * 2.1, Math.max(4, fighter.radius * 0.16), "aatrox-shadow-crack");
    state.data.shadowDashEffects.push(crack);
    scheduleDarkinBladeEffectRemoval(state, crack, 340);
  }

  function resolveDarkinBladeStrike(fighter, opponent, state, strike, now) {
    clearDarkinBladeStrikeVisuals(state, strike);
    createDarkinBladeImpact(strike, state);
    pulseArena();

    getAatroxTargets(fighter, opponent).forEach((target) => {
      const hit = getDarkinBladeHit(strike, target);
      if (!hit.inside) return;
      const actualDamage = applyDamage(fighter, target, {
        label: state.skill.name,
        baseDamage: hit.core ? strike.coreDamage : strike.baseDamage,
        ignoreDefense: true,
        attackId: `${strike.attackId}:${target.id}`,
        hitId: "strike"
      });
      if (actualDamage <= 0) return;
      healFighter(fighter, actualDamage * strike.healRate, "Darkin");
      if (hit.core) {
        applyAatroxAirborneEffect(target, 350, now);
      }
      if (hit.core && strike.strikeNumber === 1) {
        knockbackEntity(fighter, target, fighter.radius * 0.85);
      }
      if (hit.core && strike.strikeNumber === 2) {
        applySlowEffect(target, 0.2, 1000, now);
      }
      if (hit.core && strike.strikeNumber === 3) {
        knockbackEntity(fighter, target, fighter.radius * 1.45);
      }
      if (target.isOiiaClone && (target.dead || target.currentHp <= 0)) {
        startOiiaSummonRemoval(target, "zero", now);
      }
    });
  }

  function createDarkinBladeImpact(strike, state) {
    const className = strike.strikeNumber === 3 ? "aatrox-blade-impact circle" : "aatrox-blade-impact";
    let effect;
    if (strike.shape === "circle") {
      effect = createCircleEffect(strike.centerX, strike.centerY, strike.radius, className);
    } else if (strike.shape === "cone") {
      effect = createAatroxConeEffect(strike.centerX, strike.centerY, strike.angle, strike.radius, strike.arc, "aatrox-blade-impact cone", strike.coreStartRate);
    } else if (strike.shape === "trapezoid") {
      effect = createAatroxTrapezoidEffect(strike.originX, strike.originY, strike.angle, strike.length, strike.startWidth, strike.endWidth, "aatrox-blade-impact trapezoid");
    } else {
      effect = createGasterLine(strike.originX, strike.originY, strike.angle, strike.length, strike.width, className);
    }
    addAatroxCracks(effect, strike.shape === "circle" ? 12 : 8);
    const cleanup = () => removeElement(effect);
    if (state && state.data) {
      state.data.impactEffects = state.data.impactEffects || [];
      state.data.impactEffects.push(effect);
      scheduleTimeout(cleanup, 420);
    } else {
      scheduleTimeout(cleanup, 420);
    }
    window.setTimeout(cleanup, 700);
  }

  function getDarkinBladeHit(strike, target) {
    if (!target || target.dead || target.removing || isFighterOutOfBattle(target)) return { inside: false, core: false };
    if (strike.shape === "circle") {
      const distance = Math.hypot(target.x - strike.centerX, target.y - strike.centerY);
      const inside = distance <= strike.radius + target.radius * 0.38;
      const core = inside && (
        strike.coreKind === "center"
          ? distance <= (strike.coreRadius || strike.radius * 0.35) + target.radius * 0.25
          : distance >= strike.radius * (Number(strike.coreStartRate) || 0.58)
      );
      return { inside, core };
    }

    if (strike.shape === "cone") {
      const dx = target.x - strike.centerX;
      const dy = target.y - strike.centerY;
      const distance = Math.hypot(dx, dy);
      if (distance > strike.radius + target.radius * 0.5) return { inside: false, core: false };
      const diff = Math.abs(normalizeAngle(Math.atan2(dy, dx) - strike.angle));
      const inside = diff <= strike.arc / 2;
      const core = inside && distance >= strike.radius * (Number(strike.coreStartRate) || 0.82);
      return { inside, core };
    }

    if (strike.shape === "trapezoid") {
      return getAatroxTrapezoidLocalHit(strike, getRectLocalPosition(strike, target), target);
    }

    const local = getRectLocalPosition(strike, target);
    const inside = local.forward >= 0 && local.forward <= strike.length && Math.abs(local.side) <= strike.width / 2 + target.radius * 0.35;
    if (!inside) return { inside: false, core: false };
    const core = strike.coreKind === "tip"
      ? local.forward >= strike.length * (Number(strike.coreStartRate) || 0.75)
      : Math.abs(local.side) >= strike.width * 0.24;
    return { inside: true, core };
  }

  function getAatroxTrapezoidLocalHit(strike, local, target) {
    const length = Math.max(1, Number(strike.length) || 1);
    const progress = local.forward / length;
    if (progress < 0 || progress > 1) return { inside: false, core: false };
    const width = getAatroxTrapezoidWidthAt(strike, progress);
    const sideLimit = width / 2 + target.radius * 0.35;
    const inside = Math.abs(local.side) <= sideLimit;
    if (!inside) return { inside: false, core: false };
    const core = local.forward >= length * (Number(strike.coreStartRate) || 0.82);
    return { inside: true, core };
  }

  function applyAatroxAirborneEffect(target, duration, now) {
    if (!target || target.dead || target.maugaUnstoppable) return false;
    if (tryGojoInfinityBlockStatus(target, "에어본", now)) return false;
    if (!isFighterStunned(target, now)) {
      target.storedStunVelocity = { vx: target.vx, vy: target.vy };
    }
    target.stunUntil = Math.max(target.stunUntil || 0, now + Math.max(0, Number(duration) || 350));
    target.vx = 0;
    target.vy = 0;
    const element = getFighterElement(target);
    if (element) element.classList.add("stunned");
    createAatroxAirborneVisual(target, Math.max(260, Number(duration) || 350));
    addLog(`${target.name} 에어본`, "skill");
    return true;
  }

  function createAatroxAirborneVisual(target, duration) {
    const fighterElement = target.isOiiaClone ? null : getFighterElement(target);
    const imageFrame = fighterElement && fighterElement.querySelector(".fighter-image-frame");
    if (imageFrame) {
      imageFrame.classList.remove("aatrox-airborne-lift");
      void imageFrame.offsetWidth;
      imageFrame.classList.add("aatrox-airborne-lift");
      scheduleTimeout(() => imageFrame.classList.remove("aatrox-airborne-lift"), duration + 80);
    }

    const shock = createCircleEffect(target.x, target.y + target.radius * 0.18, target.radius * 1.12, "aatrox-airborne-shock");
    const lines = createAatroxAirborneLines(target);
    const text = document.createElement("div");
    text.className = "aatrox-airborne-text";
    text.textContent = "에어본";
    text.style.left = `${target.x}px`;
    text.style.top = `${target.y - target.radius * 1.35}px`;
    els.skillLayer.appendChild(text);

    scheduleTimeout(() => removeElement(shock), Math.min(420, duration + 120));
    scheduleTimeout(() => removeElement(lines), Math.min(440, duration + 140));
    scheduleTimeout(() => removeElement(text), Math.min(620, duration + 240));
    scheduleTimeout(() => {
      const land = createCircleEffect(target.x, target.y + target.radius * 0.34, target.radius * 0.9, "aatrox-airborne-land");
      scheduleTimeout(() => removeElement(land), 260);
    }, Math.max(80, duration - 70));
  }

  function createAatroxAirborneLines(target) {
    const group = document.createElement("div");
    group.className = "aatrox-airborne-lines";
    group.style.left = `${target.x}px`;
    group.style.top = `${target.y}px`;
    const count = 6;
    for (let i = 0; i < count; i += 1) {
      const line = document.createElement("span");
      const offset = (i - (count - 1) / 2) * target.radius * 0.34;
      line.style.setProperty("--x", `${offset}px`);
      line.style.setProperty("--h", `${Math.max(16, target.radius * (0.85 + (i % 2) * 0.18))}px`);
      group.appendChild(line);
    }
    els.skillLayer.appendChild(group);
    return group;
  }

  function getRectLocalPosition(rect, target) {
    const dx = target.x - rect.originX;
    const dy = target.y - rect.originY;
    return {
      forward: dx * rect.dirX + dy * rect.dirY,
      side: dx * -rect.dirY + dy * rect.dirX
    };
  }

  function startInfernalChains(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    const direction = getOpponentDirection(fighter, opponent);
    const rangeScale = getAatroxRangeScale(fighter);
    const length = game.arenaSize * (Number(skill.rangeRate) || 1.05) * rangeScale;
    const width = fighter.radius * (Number(skill.widthRate) || 0.9) * rangeScale;
    state.data.phase = "charging";
    state.data.dirX = direction.x;
    state.data.dirY = direction.y;
    state.data.angle = direction.angle;
    state.data.originX = fighter.x + direction.x * fighter.radius * 0.5;
    state.data.originY = fighter.y + direction.y * fighter.radius * 0.5;
    state.data.length = length;
    state.data.width = width;
    state.data.launchAt = now + (Number(skill.warningDuration) || 600);
    state.data.projectileSpeed = game.arenaSize * (Number(skill.projectileSpeedRate) || 1.9);
    state.data.segmentLength = Math.max(fighter.radius * 3.2, game.arenaSize * 0.16);
    state.data.effects = [];
    state.data.attackId = `chains-${fighter.id}-${now.toFixed(3)}-${Math.random().toString(16).slice(2)}`;
    state.data.casterId = fighter.id;
    state.data.ownerId = fighter.id;
    state.data.ownerSide = fighter.side;
    state.data.rangeScale = rangeScale;
    state.data.charge = createCircleEffect(state.data.originX, state.data.originY, Math.max(width, fighter.radius * 0.45), "aatrox-chain-charge");
    state.data.effects.push(state.data.charge);
    addLog(`${fighter.name} 지옥사슬`, "skill");
  }

  function updateInfernalChains(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;
    const data = state.data;
    if (fighter.dead || opponent.dead) {
      clearInfernalChains(state);
      fighter.skillState = null;
      return;
    }

    if (data.phase === "charging" && now >= data.launchAt) {
      launchInfernalChainProjectile(fighter, state, now);
    }

    if (data.phase === "projectile") {
      updateInfernalChainProjectile(fighter, opponent, state, now);
    }

    if (data.phase === "zone") {
      const owner = getFighterById(data.ownerId) || fighter;
      updateInfernalChainZone(fighter, owner, getOpposingFighter(owner.side), state, now);
    }
  }

  function launchInfernalChainProjectile(fighter, state, now) {
    const data = state.data;
    removeElement(data.charge);
    data.charge = null;
    data.phase = "projectile";
    data.projectileStartAt = now;
    data.projectileDistance = 0;
    data.currentLength = Math.max(2, data.width);
    data.segmentStartDistance = 0;
    data.segmentX = data.originX;
    data.segmentY = data.originY;
    data.lastFragmentAt = 0;
    data.projectile = createGasterLine(data.originX, data.originY, data.angle, data.currentLength, data.width, "aatrox-chain-shot projectile");
    data.effects.push(data.projectile);
  }

  function updateInfernalChainProjectile(fighter, opponent, state, now) {
    const data = state.data;
    const elapsed = Math.max(0, (now - data.projectileStartAt) / 1000);
    data.projectileDistance = Math.min(data.length, elapsed * data.projectileSpeed);
    data.currentLength = clamp(data.projectileDistance, Math.max(4, data.width), data.segmentLength);
    data.segmentStartDistance = Math.max(0, data.projectileDistance - data.currentLength);
    data.segmentX = data.originX + data.dirX * data.segmentStartDistance;
    data.segmentY = data.originY + data.dirY * data.segmentStartDistance;
    updateGasterLine(data.projectile, data.segmentX, data.segmentY, data.angle, data.currentLength, data.width);

    if (!data.lastFragmentAt || now - data.lastFragmentAt >= 70) {
      data.lastFragmentAt = now;
      createInfernalChainFragment(data);
    }

    const owner = getFighterById(data.ownerId) || fighter;
    const ownerOpponent = getOpposingFighter(owner.side);
    const hitTarget = getInfernalChainProjectileHit(owner, ownerOpponent, data);
    if (hitTarget) {
      if (tryReflectProjectileAgainstTarget(hitTarget, { kind: "aatroxChain", item: data, state }, owner, now)) {
        return;
      }
      if (owner !== fighter) {
        resolveReflectedInfernalChainHit(fighter, owner, state, hitTarget, now);
        return;
      }
      resolveInfernalChainProjectileHit(fighter, opponent, state, hitTarget, now);
      return;
    }

    if (data.projectileDistance >= data.length) {
      finishInfernalChains(fighter, state, now);
    }
  }

  function getInfernalChainProjectileHit(fighter, opponent, data) {
    const targets = [opponent].concat(getEnemySummons(fighter.side));
    let closest = null;
    targets.forEach((target) => {
      if (!isTargetInInfernalChainProjectile(target, data)) return;
      const local = getRectLocalPosition({
        originX: data.segmentX,
        originY: data.segmentY,
        dirX: data.dirX,
        dirY: data.dirY
      }, target);
      if (!closest || local.forward < closest.forward) {
        closest = { target, forward: local.forward };
      }
    });
    return closest ? closest.target : null;
  }

  function isTargetInInfernalChainProjectile(target, data) {
    if (!target || target.dead || target.removing || isFighterOutOfBattle(target)) return false;
    const local = getRectLocalPosition({
      originX: data.segmentX,
      originY: data.segmentY,
      dirX: data.dirX,
      dirY: data.dirY
    }, target);
    return local.forward >= 0
      && local.forward <= data.currentLength
      && Math.abs(local.side) <= data.width / 2 + target.radius * 0.35;
  }

  function resolveInfernalChainProjectileHit(fighter, opponent, state, target, now) {
    const data = state.data;
    const skill = state.skill;
    removeElement(data.projectile);
    data.projectile = null;
    const actualDamage = applyDamage(fighter, target, {
      label: skill.name,
      baseDamage: Number(skill.initialDamage) || 8,
      ignoreDefense: true,
      attackId: `${data.attackId}:${target.id}`,
      hitId: "initial"
    });
    createInfernalChainHitSpark(target.x, target.y, data.width);

    if (target.isOiiaClone || target !== opponent || actualDamage <= 0 || opponent.dead) {
      finishInfernalChains(fighter, state, now);
      return;
    }

    data.phase = "zone";
    data.zoneX = opponent.x;
    data.zoneY = opponent.y;
    data.zoneRadius = game.arenaSize * (Number(skill.zoneRadiusRate) || 0.18) * 1.35 * (Number(data.rangeScale) || getAatroxRangeScale(fighter));
    data.zoneEndAt = now + (Number(skill.zoneDuration) || 1600);
    data.zone = createInfernalChainZone(data.zoneX, data.zoneY, data.zoneRadius);
    data.effects.push(data.zone);
  }

  function resolveReflectedInfernalChainHit(caster, owner, state, target, now) {
    const data = state.data;
    const skill = state.skill;
    removeElement(data.projectile);
    data.projectile = null;
    const actualDamage = applyDamage(owner, target, {
      label: skill.name,
      baseDamage: Number(skill.initialDamage) || 8,
      ignoreDefense: true,
      attackId: `${data.attackId}:reflected:${target.id}`,
      hitId: "initial"
    });
    createInfernalChainHitSpark(target.x, target.y, data.width);
    const ownerOpponent = getOpposingFighter(owner.side);
    if (target.isOiiaClone || target !== ownerOpponent || actualDamage <= 0 || ownerOpponent.dead) {
      finishInfernalChains(caster, state, now);
      return;
    }
    data.phase = "zone";
    data.zoneX = ownerOpponent.x;
    data.zoneY = ownerOpponent.y;
    data.zoneRadius = game.arenaSize * (Number(skill.zoneRadiusRate) || 0.18) * 1.35 * (Number(data.rangeScale) || getAatroxRangeScale(owner));
    data.zoneEndAt = now + (Number(skill.zoneDuration) || 1600);
    data.zone = createInfernalChainZone(data.zoneX, data.zoneY, data.zoneRadius);
    data.effects.push(data.zone);
  }

  function createInfernalChainFragment(data) {
    const travel = Math.random() * Math.max(1, data.currentLength);
    const offset = (Math.random() - 0.5) * data.width * 1.6;
    const x = data.segmentX + data.dirX * travel + -data.dirY * offset;
    const y = data.segmentY + data.dirY * travel + data.dirX * offset;
    const fragment = createGasterLine(
      x,
      y,
      data.angle + (Math.random() - 0.5) * 0.85,
      Math.max(7, data.width * (0.75 + Math.random() * 0.7)),
      Math.max(2, data.width * 0.18),
      "aatrox-chain-fragment"
    );
    scheduleTimeout(() => removeElement(fragment), 260);
  }

  function createInfernalChainHitSpark(x, y, width) {
    const spark = createCircleEffect(x, y, Math.max(10, width * 1.25), "aatrox-chain-hit");
    addAatroxCracks(spark, 5);
    scheduleTimeout(() => removeElement(spark), 320);
  }

  function updateInfernalChainZone(caster, owner, opponent, state, now) {
    const data = state.data;
    const skill = state.skill;
    const progress = clamp((now - (data.zoneEndAt - (Number(skill.zoneDuration) || 1600))) / (Number(skill.zoneDuration) || 1600), 0, 1);
    const radius = data.zoneRadius * (1 - progress * 0.42);
    updateCircleEffect(data.zone, data.zoneX, data.zoneY, radius);

    const inside = isPointInCircle(opponent.x, opponent.y, data.zoneX, data.zoneY, radius + opponent.radius * 0.25);
    if (!inside || opponent.dead || owner.dead) {
      finishInfernalChains(caster, state, now);
      return;
    }

    applySlowEffect(opponent, Number(skill.zoneSlowRate) || 0.25, 280, now);
    if (now < data.zoneEndAt) return;

    opponent.x += (data.zoneX - opponent.x) * 0.85;
    opponent.y += (data.zoneY - opponent.y) * 0.85;
    keepInsideArena(opponent);
    const actualDamage = applyDamage(owner, opponent, {
      label: `${skill.name} 끌어오기`,
      baseDamage: Number(skill.pullDamage) || 14,
      ignoreDefense: true,
      attackId: `${data.attackId}:${opponent.id}`,
      hitId: "pull"
    });
    if (actualDamage > 0) {
      createInfernalPullImpact(data.zoneX, data.zoneY, radius);
    }
    finishInfernalChains(caster, state, now);
  }

  function finishInfernalChains(fighter, state, now) {
    clearInfernalChains(state);
    restoreStoredVelocity(fighter, state);
    startSkillRecovery(fighter, state.skill, now);
  }

  function isTargetInAatroxLine(target, data) {
    if (!target || target.dead || target.removing || isFighterOutOfBattle(target)) return false;
    const local = getRectLocalPosition(data, target);
    return local.forward >= 0 && local.forward <= data.length && Math.abs(local.side) <= data.width / 2 + target.radius * 0.35;
  }

  function createInfernalChainZone(x, y, radius) {
    const zone = createCircleEffect(x, y, radius, "aatrox-chain-zone");
    const ring = document.createElement("span");
    ring.className = "aatrox-chain-ring";
    zone.appendChild(ring);
    return zone;
  }

  function createInfernalPullImpact(x, y, radius) {
    const effect = createCircleEffect(x, y, radius, "aatrox-chain-pull");
    addAatroxCracks(effect, 8);
    scheduleTimeout(() => removeElement(effect), 420);
  }

  function clearDarkinBlade(state, options = {}) {
    if (!state || !state.data) return;
    if (state.data.shadowDashPendingTask) {
      state.data.shadowDashPendingTask.cancelled = true;
      game.timeouts.delete(state.data.shadowDashPendingTask);
      state.data.shadowDashPendingTask = null;
    }
    if (state.data.current && state.data.current.shadowDash) {
      state.data.current.shadowDash.active = false;
      state.data.current.shadowDash = null;
    }
    cancelDarkinBladeEffectTasks(state);
    clearDarkinBladeEffectBucket(state, "shadowDashEffects");
    if (!options.preserveImpact) {
      clearDarkinBladeEffectBucket(state, "impactEffects");
    }
    clearDarkinBladeStrikeVisuals(state, state.data.current);
    clearDarkinBladeEffectBucket(state, "effects");
    state.data.current = null;
  }

  function clearDarkinBladeStrikeVisuals(state, strike) {
    if (!state || !state.data || !strike) return;
    if (strike.shadowDash) {
      strike.shadowDash.active = false;
      strike.shadowDash = null;
    }
    if (strike.effects && strike.effects.length) {
      strike.effects.forEach((effect) => removeElement(effect));
      state.data.effects = (state.data.effects || []).filter((effect) => !strike.effects.includes(effect));
      strike.effects = [];
    }
  }

  function clearDarkinBladeEffectBucket(state, key) {
    if (!state || !state.data || !Array.isArray(state.data[key])) return;
    state.data[key].forEach((effect) => removeElement(effect));
    state.data[key] = [];
  }

  function scheduleDarkinBladeEffectRemoval(state, element, delay) {
    const task = scheduleTimeout(() => {
      removeElement(element);
      if (state && state.data && Array.isArray(state.data.effectTasks)) {
        state.data.effectTasks = state.data.effectTasks.filter((item) => item !== task);
      }
    }, delay);
    if (state && state.data) {
      state.data.effectTasks = state.data.effectTasks || [];
      state.data.effectTasks.push(task);
    }
    return task;
  }

  function cancelDarkinBladeEffectTasks(state) {
    if (!state || !state.data || !Array.isArray(state.data.effectTasks)) return;
    state.data.effectTasks.forEach((task) => {
      if (!task) return;
      task.cancelled = true;
      game.timeouts.delete(task);
    });
    state.data.effectTasks = [];
  }

  function clearAatroxActiveSkillEffects(fighter) {
    if (!fighter || !fighter.skillState || !fighter.skillState.skill) return;
    if (fighter.skillState.skill.type === "darkinBlade") {
      clearDarkinBlade(fighter.skillState);
    }
    if (fighter.skillState.skill.type === "infernalChains") {
      clearInfernalChains(fighter.skillState);
    }
  }

  function clearInfernalChains(state) {
    if (!state || !state.data) return;
    if (state.data.effects) {
      state.data.effects.forEach((effect) => removeElement(effect));
      state.data.effects = [];
    }
    removeElement(state.data.warning);
    removeElement(state.data.charge);
    removeElement(state.data.projectile);
    removeElement(state.data.zone);
    state.data.warning = null;
    state.data.charge = null;
    state.data.projectile = null;
    state.data.zone = null;
  }

  function getAatroxTargets(fighter, opponent) {
    const targets = [];
    if (opponent && !opponent.dead && !isFighterOutOfBattle(opponent)) targets.push(opponent);
    getEnemySummons(fighter.side).forEach((summon) => {
      if (summon && !summon.dead && !summon.removing) targets.push(summon);
    });
    return targets;
  }

  function knockbackEntity(source, target, distance) {
    if (!source || !target || target.dead || target.removing || isFighterOutOfBattle(target)) return;
    if (target.maugaUnstoppable) return;
    if (tryGojoInfinityBlockStatus(target, "넉백", getBattleNow())) return;
    const finalDistance = target.abilityType === "himCharm" ? distance * (1 - HIM_STATUS_RESISTANCE) : distance;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = dx / length;
    const ny = dy / length;
    target.x += nx * finalDistance;
    target.y += ny * finalDistance;
    keepInsideArena(target);
    separateEntityFromCircleWalls(target);
    target.vx += nx * getPixelSpeed(target) * 0.45;
    target.vy += ny * getPixelSpeed(target) * 0.45;
    normalizeVelocity(target, getPixelSpeed(target));
  }

  function addAatroxCracks(effect, count) {
    if (!effect) return;
    for (let i = 0; i < count; i += 1) {
      const crack = document.createElement("span");
      crack.className = "aatrox-crack";
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const distance = 22 + Math.random() * 42;
      crack.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
      crack.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
      crack.style.setProperty("--r", `${angle}rad`);
      effect.appendChild(crack);
    }
  }

  function applySlowEffect(target, slowRate, duration, now) {
    if (target.dead) return;
    if (target.maugaUnstoppable) return;
    if (tryGojoInfinityBlockStatus(target, "둔화", now)) return;
    const multiplier = clamp(1 - slowRate, 0.2, 1);
    const baseDuration = Math.max(0, Number(duration) || 0);
    const finalDuration = target.abilityType === "himCharm" ? baseDuration * (1 - HIM_STATUS_RESISTANCE) : baseDuration;
    target.slowMultiplier = Math.min(target.slowMultiplier || 1, multiplier);
    target.slowUntil = Math.max(target.slowUntil || 0, now + finalDuration);
    if (!target.slowEffect) {
      target.slowEffect = createCircleEffect(target.x, target.y, target.radius * 1.08, "bloodmoon-slow-mark");
    }
    const element = getEntityElement(target);
    if (element) element.classList.add("slowed");
    normalizeVelocity(target, getPixelSpeed(target));
    addLog(`${target.name} 둔화`, "skill");
  }

  function applyBlueEyesDebuffs(source, target, skill, now = getBattleNow()) {
    if (!source || !target || target.dead || target.removing) return;
    const blindDuration = Math.max(0, Number(skill.blindDuration) || 10000);
    const burnDuration = Math.max(0, Number(skill.burnDuration) || 10000);
    target.blueEyesBlindUntil = Math.max(target.blueEyesBlindUntil || 0, now + blindDuration);
    target.blueEyesBurnUntil = Math.max(target.blueEyesBurnUntil || 0, now + burnDuration);
    target.blueEyesBurnDamage = Number(skill.burnDamage) || 2;
    target.blueEyesBurnInterval = Number(skill.burnInterval) || 1000;
    target.blueEyesBurnNextAt = now + target.blueEyesBurnInterval;
    target.blueEyesBurnOwnerId = source.id;
    updateBlueEyesStatusVisual(target, now);
    addLog(`${target.name} 실명 · 화상`, "bad");
  }

  function applyBlueEyesNeutronBurn(source, target, skill, now = getBattleNow(), durationOverride = null) {
    if (!source || !target || target.dead || target.removing) return;
    const duration = Math.max(0, Number.isFinite(Number(durationOverride)) ? Number(durationOverride) : (Number(skill.meteorFieldDuration) || 2000));
    const tickInterval = Math.max(250, Number(skill.burnInterval) || 500);
    const wasActive = target.blueEyesBurnUntil && now < target.blueEyesBurnUntil;
    target.blueEyesBurnUntil = Math.max(target.blueEyesBurnUntil || 0, now + duration);
    target.blueEyesBurnDamage = Number(skill.burnDamage) || 2;
    target.blueEyesBurnInterval = tickInterval;
    target.blueEyesBurnOwnerId = source.id;
    if (!wasActive || !target.blueEyesBurnNextAt || target.blueEyesBurnNextAt <= now) {
      target.blueEyesBurnNextAt = now + tickInterval;
    } else {
      target.blueEyesBurnNextAt = Math.min(target.blueEyesBurnNextAt, now + tickInterval);
    }
    updateBlueEyesStatusVisual(target, now);
  }

  function updateBlueEyesDebuffs(target, now) {
    if (!target) return;
    const blindActive = target.blueEyesBlindUntil && now < target.blueEyesBlindUntil;
    const burnActive = target.blueEyesBurnUntil && now < target.blueEyesBurnUntil;
    if (burnActive && !target.dead && now >= (target.blueEyesBurnNextAt || 0)) {
      const owner = getFighterById(target.blueEyesBurnOwnerId) || getOpposingFighter(target.side);
      target.blueEyesBurnNextAt = now + (Number(target.blueEyesBurnInterval) || 1000);
      if (owner && !owner.dead) {
        applyDamage(owner, target, {
          label: "뉴트론 블라스트 화상",
          fixedDamage: Number(target.blueEyesBurnDamage) || 2,
          ignoreDefense: true,
          ignoreBlind: true,
          isDot: true,
          damageKind: "지속 피해",
          attackId: `blue-neutron-burn-${owner.id}-${target.id}-${Math.floor(now)}`,
          hitId: "burn"
        });
      }
    }
    if (!blindActive && !burnActive) {
      clearBlueEyesDebuffs(target);
      return;
    }
    updateBlueEyesStatusVisual(target, now);
  }

  function clearBlueEyesDebuffs(target) {
    if (!target) return;
    target.blueEyesBlindUntil = 0;
    target.blueEyesBurnUntil = 0;
    target.blueEyesBurnNextAt = 0;
    target.blueEyesBurnDamage = 0;
    target.blueEyesBurnInterval = 0;
    target.blueEyesBurnOwnerId = "";
    removeElement(target.blueEyesStatusEffect);
    target.blueEyesStatusEffect = null;
    const element = getEntityElement(target);
    if (element) element.classList.remove("blue-eyes-blinded", "blue-eyes-burning");
  }

  function updateBlueEyesStatusVisual(target, now = getBattleNow()) {
    if (!target || target.dead || target.removing) {
      clearBlueEyesDebuffs(target);
      return;
    }
    const blindActive = target.blueEyesBlindUntil && now < target.blueEyesBlindUntil;
    const burnActive = target.blueEyesBurnUntil && now < target.blueEyesBurnUntil;
    const element = getEntityElement(target);
    if (element) {
      element.classList.toggle("blue-eyes-blinded", !!blindActive);
      element.classList.toggle("blue-eyes-burning", !!burnActive);
    }
    if (!blindActive && !burnActive) return;
    if (!target.blueEyesStatusEffect) {
      target.blueEyesStatusEffect = createCircleEffect(target.x, target.y - target.radius * 1.05, target.radius * 0.72, "blue-eyes-status-mark");
    }
    target.blueEyesStatusEffect.dataset.status = `${blindActive ? "실명" : ""}${blindActive && burnActive ? " " : ""}${burnActive ? "화상" : ""}`;
    updateCircleEffect(target.blueEyesStatusEffect, target.x, target.y - target.radius * 1.05, target.radius * 0.72);
  }

  function isBlueEyesBlindActive(target, now = getBattleNow()) {
    return !!(target && target.blueEyesBlindUntil && now < target.blueEyesBlindUntil);
  }

  function createBlueEyesBlindMiss(target) {
    if (!target) return;
    const effect = createCircleEffect(target.x, target.y - target.radius * 0.75, target.radius * 0.9, "blue-eyes-blind-miss");
    scheduleTimeout(() => removeElement(effect), 420);
  }

  function getEntityElement(entity) {
    if (!entity) return null;
    if (entity.isOiiaClone) return entity.element || null;
    return getFighterElement(entity);
  }

  function startThreeLegRampage(fighter, skill, now) {
    const state = fighter.skillState;
    const duration = Number(skill.duration) || 5000;
    const speedMultiplier = Number(skill.speedMultiplier) || 3;
    const damageReduction = clamp(Number(skill.damageReduction) || 0.5, 0, 0.95);

    state.data.endAt = now + duration;
    state.data.skillStacks = 0;
    state.data.lastAfterimageAt = 0;
    state.data.afterimages = [];
    state.data.effect = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.25, "rampage-shield");

    fighter.speedMultiplier = speedMultiplier;
    fighter.damageReduction = damageReduction;
    restoreStoredVelocity(fighter, state);
    getFighterElement(fighter).classList.add("rampaging");
    addLog(`${fighter.name} 삼족 폭주 발동`, "skill");
  }

  function updateThreeLegRampage(fighter, now) {
    const state = fighter.skillState;
    if (!state) return;

    updateCircleEffect(state.data.effect, fighter.x, fighter.y, fighter.radius * 1.25);

    const afterimageInterval = Number(state.skill.speedMultiplier) >= 3 ? 90 : 140;
    if (!state.data.lastAfterimageAt || now - state.data.lastAfterimageAt >= afterimageInterval) {
      state.data.lastAfterimageAt = now;
      const afterimage = createRampageAfterimage(fighter);
      state.data.afterimages.push(afterimage);
    }

    if (now >= state.data.endAt || fighter.dead) {
      endThreeLegRampage(fighter, now);
    }
  }

  function endThreeLegRampage(fighter, now) {
    const state = fighter.skillState;
    if (!state) return;

    const skill = state.skill;
    fighter.speedMultiplier = 1;
    fighter.damageReduction = 0;
    removeElement(state.data.effect);
    getFighterElement(fighter).classList.remove("rampaging");
    normalizeVelocity(fighter, getPixelSpeed(fighter));
    startSkillRecovery(fighter, skill, now);
    addLog(`${fighter.name} 삼족 폭주 종료`, "skill");
  }

  function startDeepSeaAmbush(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;

    const radius = game.arenaSize * (Number(skill.radiusRate) || 0.25);
    state.data.radius = radius;
    state.data.attacks = createDeepSeaAmbushPlan(skill, radius);
    state.data.attackIndex = 0;
    state.data.nextWarningAt = now;
    state.data.current = null;
    state.data.effects = [];
    state.data.attackIdBase = `deepsea-${fighter.id}-${now.toFixed(3)}-${Math.random().toString(16).slice(2)}`;
    restoreStoredVelocity(fighter, state);
    addLog(`${fighter.name} 심해의 습격 발동`, "skill");
  }

  function updateDeepSeaAmbush(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;

    const skill = state.skill;
    const data = state.data;
    if (fighter.dead || opponent.dead) {
      clearDeepSeaAmbush(state);
      fighter.skillState = null;
      return;
    }

    if (!data.current && data.attackIndex < data.attacks.length && now >= data.nextWarningAt) {
      beginDeepSeaAmbushWarning(fighter, state, now);
    }

    const current = data.current;
    if (!current) return;

    if (current.warning && now >= current.impactAt - 180) {
      current.warning.classList.add("priming");
    }

    if (!current.resolved && now >= current.impactAt) {
      current.resolved = true;
      resolveDeepSeaAmbushAttack(fighter, opponent, state, current, now);
      if (fighter.dead || opponent.dead) {
        clearDeepSeaAmbush(state);
        fighter.skillState = null;
        return;
      }
      data.attackIndex += 1;
      data.current = null;

      if (data.attackIndex >= data.attacks.length) {
        fighter.skillState = null;
        startSkillRecovery(fighter, skill, now);
        return;
      }

      data.nextWarningAt = now + (Number(skill.attackInterval) || 600);
    }
  }

  function beginDeepSeaAmbushWarning(fighter, state, now) {
    const data = state.data;
    const attack = data.attacks[data.attackIndex];
    if (!attack) return;

    const warningDuration = Number(state.skill.warningDuration) || 750;
    const warning = createDeepSeaWarning(attack.x, attack.y, data.radius);
    data.effects.push(warning);
    data.current = {
      ...attack,
      warning,
      impactAt: now + warningDuration,
      attackId: `${data.attackIdBase}-${data.attackIndex}`
    };
  }

  function resolveDeepSeaAmbushAttack(fighter, opponent, state, attack, now) {
    const skill = state.skill;
    removeElement(attack.warning);
    const bite = createDeepSeaBiteEffect(attack.x, attack.y, state.data.radius);
    state.data.effects.push(bite);
    scheduleTimeout(() => removeElement(bite), 680);
    pulseArena();

    let hitAny = false;
    const targets = getDeepSeaAmbushTargets(fighter, opponent, attack.x, attack.y, state.data.radius);
    targets.forEach((target) => {
      const actualDamage = applyDamage(fighter, target, {
        label: skill.name,
        baseDamage: Number(skill.damage) || 18,
        ignoreDefense: true,
        attackId: `${attack.attackId}:${target.id}`,
        hitId: "bite"
      });

      if (actualDamage > 0) {
        hitAny = true;
        applySlowEffect(target, Number(skill.slowRate) || 0.35, Number(skill.slowDuration) || 2500, now);
        if (target.isOiiaClone && (target.dead || target.currentHp <= 0)) {
          startOiiaSummonRemoval(target, "zero", now);
        }
      }
    });

    if (hitAny) {
      grantTralalaPermanentSpeed(fighter, Number(skill.stackSpeed) || 1, Number(skill.maxSpeed) || 50, now, "심해 적중");
    }
  }

  function getDeepSeaAmbushTargets(fighter, opponent, x, y, radius) {
    const targets = [];
    if (
      opponent &&
      !opponent.dead &&
      !isFighterOutOfBattle(opponent) &&
      isPointInCircle(opponent.x, opponent.y, x, y, radius + opponent.radius * 0.35)
    ) {
      targets.push(opponent);
    }

    getEnemySummons(fighter.side).forEach((summon) => {
      if (
        summon &&
        !summon.removing &&
        isPointInCircle(summon.x, summon.y, x, y, radius + summon.radius * 0.35)
      ) {
        targets.push(summon);
      }
    });
    return targets;
  }

  function createDeepSeaAmbushPlan(skill, radius) {
    const minCount = Math.max(1, Math.floor(Number(skill.minAttackCount) || Number(skill.attackCount) || 3));
    const maxCount = Math.max(minCount, Math.floor(Number(skill.maxAttackCount) || Number(skill.attackCount) || 5));
    const count = randomInt(minCount, maxCount);
    const attacks = [];
    const margin = radius + 6;

    for (let i = 0; i < count; i += 1) {
      attacks.push(findDeepSeaAmbushCenter(radius, attacks, margin));
    }

    return attacks;
  }

  function findDeepSeaAmbushCenter(radius, existing, margin) {
    for (let i = 0; i < 70; i += 1) {
      const x = margin + Math.random() * Math.max(1, game.arenaSize - margin * 2);
      const y = margin + Math.random() * Math.max(1, game.arenaSize - margin * 2);
      const separated = existing.every((attack) => Math.hypot(x - attack.x, y - attack.y) >= radius * 0.85);
      if (separated) return { x, y };
    }

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.min(game.arenaSize * 0.24, Math.max(radius * 0.95, 1));
    const x = clamp(game.arenaSize / 2 + Math.cos(angle) * distance, margin, game.arenaSize - margin);
    const y = clamp(game.arenaSize / 2 + Math.sin(angle) * distance, margin, game.arenaSize - margin);
    return { x, y };
  }

  function createDeepSeaWarning(x, y, radius) {
    const warning = createCircleEffect(x, y, radius, "deepsea-warning");
    for (let i = 0; i < 3; i += 1) {
      const ripple = document.createElement("span");
      ripple.className = "deepsea-ripple";
      ripple.style.animationDelay = `${i * 0.24}s`;
      warning.appendChild(ripple);
    }
    const shadow = document.createElement("span");
    shadow.className = "deepsea-shark-shadow";
    warning.appendChild(shadow);
    for (let i = 0; i < 10; i += 1) {
      const bubble = document.createElement("span");
      bubble.className = "deepsea-bubble";
      bubble.style.left = `${18 + Math.random() * 64}%`;
      bubble.style.top = `${58 + Math.random() * 30}%`;
      bubble.style.width = `${3 + Math.random() * 5}px`;
      bubble.style.height = bubble.style.width;
      bubble.style.animationDelay = `${Math.random() * 0.8}s`;
      warning.appendChild(bubble);
    }
    return warning;
  }

  function createDeepSeaBiteEffect(x, y, radius) {
    const bite = createCircleEffect(x, y, radius, "deepsea-bite");
    const head = document.createElement("span");
    head.className = "deepsea-shark-head";
    const upperJaw = document.createElement("span");
    upperJaw.className = "deepsea-jaw upper";
    const lowerJaw = document.createElement("span");
    lowerJaw.className = "deepsea-jaw lower";
    const splash = document.createElement("span");
    splash.className = "deepsea-splash";
    bite.append(head, upperJaw, lowerJaw, splash);
    return bite;
  }

  function clearDeepSeaAmbush(state) {
    if (!state || !state.data) return;
    if (state.data.current && state.data.current.warning) {
      removeElement(state.data.current.warning);
    }
    if (state.data.effects) {
      state.data.effects.forEach((effect) => removeElement(effect));
      state.data.effects = [];
    }
  }

  function clearLooseDeepSeaEffects() {
    els.skillLayer.querySelectorAll(".deepsea-warning, .deepsea-bite").forEach((element) => removeElement(element));
  }

  function startOiiaAllOutAttack(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    clearOiiaAllOutWarnings(state);
    const targetX = Number(state.data.targetX) || (opponent && opponent.x) || fighter.x;
    const targetY = Number(state.data.targetY) || (opponent && opponent.y) || fighter.y;
    const participants = getOiiaAllOutParticipants(fighter);
    const batchSize = 10;
    participants.forEach((source, index) => {
      const launch = () => {
        if (!fighter.dead && game.phase === "running" && source && !source.dead && !source.removing) {
          spawnOiiaVolleyProjectile(fighter, source, targetX, targetY, skill, getBattleNow(), index);
        }
      };
      if (index < batchSize) {
        launch();
      } else {
        const task = scheduleTimeout(launch, Math.floor(index / batchSize) * 18);
        state.data.timers = state.data.timers || [];
        state.data.timers.push(task);
      }
    });
    createOiiaVolleyReleaseEffect(fighter);
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
    startSkillRecovery(fighter, skill, now);
    addLog(`${fighter.name} 총공격: ${participants.length}개체 일제 사격`, "skill");
  }

  function getOwnedOiiaSummons(fighter) {
    return game.summons.filter((summon) => (
      summon &&
      summon.abilityType === "oiiaDivision" &&
      summon.ownerId === fighter.id &&
      summon.side === fighter.side &&
      !summon.dead &&
      !summon.removing
    ));
  }

  function findSummonById(id) {
    return game.summons.find((summon) => summon.id === id);
  }

  function getOiiaAllOutParticipants(fighter) {
    if (!fighter || fighter.dead) return [];
    return [fighter].concat(getOwnedOiiaSummons(fighter)).filter((source) => (
      source &&
      !source.dead &&
      !source.removing &&
      !isFighterOutOfBattle(source)
    ));
  }

  function createOiiaAllOutWarnings(fighter, state, skill) {
    if (!state || !state.data) return;
    clearOiiaAllOutWarnings(state);
    const participants = getOiiaAllOutParticipants(fighter);
    state.data.warning = document.createElement("div");
    state.data.warning.className = "oiia-volley-warning-root";
    els.skillLayer.appendChild(state.data.warning);
    state.data.oiiaWarnings = participants.map((source) => {
      const line = document.createElement("div");
      line.className = "oiia-volley-aim-line";
      const fan = document.createElement("div");
      fan.className = "oiia-volley-aim-fan";
      state.data.warning.append(line, fan);
      const warning = { sourceId: source.id, line, fan };
      updateOiiaAllOutWarningItem(warning, source, state.data, skill);
      return warning;
    });
  }

  function updateOiiaAllOutWarnings(fighter, state, skill) {
    if (!state || !state.data || !state.data.oiiaWarnings) return;
    state.data.oiiaWarnings.forEach((warning) => {
      const source = warning.sourceId === fighter.id ? fighter : findSummonById(warning.sourceId);
      if (!source || source.dead || source.removing) {
        removeElement(warning.line);
        removeElement(warning.fan);
        return;
      }
      updateOiiaAllOutWarningItem(warning, source, state.data, skill);
    });
  }

  function updateOiiaAllOutWarningItem(warning, source, data, skill) {
    if (!warning || !source || !data) return;
    const dx = (Number(data.targetX) || source.x) - source.x;
    const dy = (Number(data.targetY) || source.y) - source.y;
    const angle = Math.atan2(dy, dx);
    const range = Math.max(source.radius * 4, Math.hypot(dx, dy) + source.radius * 3);
    const fanWidth = range * Math.tan(degreesToRadians(Number(skill.spreadDegrees) || 8));
    warning.line.style.width = `${range}px`;
    warning.line.style.left = `${source.x}px`;
    warning.line.style.top = `${source.y}px`;
    warning.line.style.transform = `translate(0, -50%) rotate(${angle}rad)`;
    warning.fan.style.width = `${range}px`;
    warning.fan.style.height = `${Math.max(source.radius * 1.1, fanWidth * 2)}px`;
    warning.fan.style.left = `${source.x}px`;
    warning.fan.style.top = `${source.y}px`;
    warning.fan.style.transform = `translate(0, -50%) rotate(${angle}rad)`;
  }

  function clearOiiaAllOutWarnings(state) {
    if (!state || !state.data) return;
    if (state.data.oiiaWarnings) {
      state.data.oiiaWarnings.forEach((warning) => {
        removeElement(warning.line);
        removeElement(warning.fan);
      });
      state.data.oiiaWarnings = [];
    }
    removeElement(state.data.warning);
    state.data.warning = null;
  }

  function createOiiaGreatSpinCharge(fighter, state) {
    if (!state || !state.data) return;
    clearOiiaGreatSpinCharge(state);
    state.data.effects = state.data.effects || [];
    state.data.spinChargeFighterId = fighter.id;
    const charge = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.38, "oiia-great-spin-charge");
    const title = createOiiaGreatSpinTitle("대회전", 760);
    state.data.effects.push(charge, title);
    const element = getFighterElement(fighter);
    if (element) element.classList.add("oiia-spin-charging");
  }

  function clearOiiaGreatSpinCharge(state) {
    if (!state || !state.data) return;
    (state.data.effects || []).forEach((effect) => removeElement(effect));
    state.data.effects = [];
    if (state.data.spinChargeFighterId) {
      const fighter = getFighterById(state.data.spinChargeFighterId);
      if (fighter) {
        const element = getFighterElement(fighter);
        if (element) element.classList.remove("oiia-spin-charging");
      }
    }
    state.data.spinChargeFighterId = "";
  }

  function startOiiaGreatSpin(fighter, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    clearOiiaGreatSpinCharge(state);
    const duration = Math.max(1, Number(skill.duration) || 5000);
    fighter.oiiaGreatSpin = {
      active: true,
      skill,
      startedAt: now,
      endAt: now + duration,
      cloneContacts: new Set(),
      effects: [],
      lastBlockAt: 0
    };
    const shield = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.48, "oiia-great-spin-shield");
    const ring = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.86, "oiia-great-spin-ring");
    fighter.oiiaGreatSpin.effects.push(shield, ring);
    const element = getFighterElement(fighter);
    if (element) element.classList.add("oiia-great-spin");
    fighter.oiiaGreatSpin.effects.push(createOiiaGreatSpinTitle("궁극기 대회전", 980));
    createOiiaGreatSpinBurst(fighter);
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
    normalizeVelocity(fighter, getPixelSpeed(fighter));
    addLog(`${fighter.name} 대회전`, "ultimate");
  }

  function updateOiiaGreatSpinState(fighter, now) {
    if (!fighter || !fighter.oiiaGreatSpin) return;
    if (!isOiiaGreatSpinActive(fighter, now)) {
      endOiiaGreatSpin(fighter, fighter.dead || game.phase !== "running" || game.battleEnding, now);
      return;
    }
    updateOiiaGreatSpinVisuals(fighter);
  }

  function updateOiiaGreatSpinVisuals(fighter) {
    const state = fighter.oiiaGreatSpin;
    if (!state) return;
    const shieldRadius = fighter.radius * 1.48;
    const ringRadius = fighter.radius * 1.86;
    if (state.effects && state.effects[0]) updateCircleEffect(state.effects[0], fighter.x, fighter.y, shieldRadius);
    if (state.effects && state.effects[1]) updateCircleEffect(state.effects[1], fighter.x, fighter.y, ringRadius);
  }

  function endOiiaGreatSpin(fighter, interrupted = false, now = getBattleNow()) {
    if (!fighter || !fighter.oiiaGreatSpin) return;
    const state = fighter.oiiaGreatSpin;
    (state.effects || []).forEach((effect) => removeElement(effect));
    const element = getFighterElement(fighter);
    if (element) {
      element.classList.remove("oiia-great-spin", "oiia-spin-charging");
      element.style.removeProperty("--oiia-spin-progress");
    }
    fighter.oiiaGreatSpin = null;
    if (!interrupted) createOiiaGreatSpinFade(fighter);
    if (!interrupted && game.phase === "running" && !game.battleEnding && !fighter.dead) {
      startSkillRecovery(fighter, state.skill, now);
    } else {
      releaseUltimateLock(fighter, state.skill);
    }
  }

  function isOiiaGreatSpinActive(fighter, now = getBattleNow()) {
    return !!(
      fighter &&
      fighter.oiiaGreatSpin &&
      fighter.oiiaGreatSpin.active &&
      !fighter.dead &&
      !isPassiveSuppressedByConcept(fighter, now) &&
      now < fighter.oiiaGreatSpin.endAt
    );
  }

  function createOiiaGreatSpinBlock(fighter) {
    const state = fighter && fighter.oiiaGreatSpin;
    const now = getBattleNow();
    if (!state || now - (state.lastBlockAt || 0) < 90) return;
    state.lastBlockAt = now;
    const flash = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.55, "oiia-great-spin-block");
    scheduleTimeout(() => removeElement(flash), 220);
    updateOiiaGreatSpinVisuals(fighter);
  }

  function createOiiaGreatSpinTitle(text, duration = 900) {
    const title = document.createElement("div");
    title.className = "oiia-great-spin-title";
    title.textContent = text || "대회전";
    els.arena.appendChild(title);
    const task = scheduleTimeout(() => removeElement(title), duration);
    title.__cleanup = () => {
      task.cancelled = true;
      game.timeouts.delete(task);
    };
    return title;
  }

  function createOiiaGreatSpinBurst(fighter) {
    const burst = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.65, "oiia-great-spin-burst");
    scheduleTimeout(() => removeElement(burst), 420);
  }

  function createOiiaGreatSpinFade(fighter) {
    if (!fighter || fighter.dead || game.battleEnding) return;
    const fade = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.58, "oiia-great-spin-fade");
    scheduleTimeout(() => removeElement(fade), 360);
  }

  function createOiiaGreatSpinCloneCollisionEffect(x, y, radius) {
    const effect = createCircleEffect(x, y, Math.max(10, radius * 1.1), "oiia-great-spin-clone-collision");
    scheduleTimeout(() => removeElement(effect), 260);
  }

  function spawnOiiaVolleyProjectile(owner, source, targetX, targetY, skill, now, index = 0) {
    const baseAngle = Math.atan2(targetY - source.y, targetX - source.x);
    const spread = degreesToRadians(Number(skill.spreadDegrees) || 8);
    const angle = baseAngle + (Math.random() - 0.5) * spread * 2;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const radius = clamp((source.radius || owner.radius) * 0.18, 4, 9);
    const projectile = {
      id: `oiia-volley-${owner.id}-${now.toFixed(3)}-${index}-${Math.random().toString(16).slice(2)}`,
      ownerId: owner.id,
      ownerSide: owner.side,
      sourceId: source.id,
      sourceIsClone: !!source.isOiiaClone,
      x: source.x + dirX * ((source.radius || owner.radius) + radius + 1),
      y: source.y + dirY * ((source.radius || owner.radius) + radius + 1),
      dirX,
      dirY,
      angle,
      radius,
      speed: game.arenaSize * (Number(skill.projectileSpeedRate) || 1.45),
      bornAt: now,
      lastUpdateAt: now,
      expiresAt: now + (Number(skill.projectileLifetime) || 2600),
      damage: Math.max(1, Math.floor((Number(source.currentHp) || 0) / 4)),
      maxBounces: Math.max(0, Number(skill.maxBounces) || 1),
      bounceCount: 0,
      targetRecords: new Map(),
      attackId: `oiia-volley-${owner.id}-${now.toFixed(3)}-${index}`,
      element: null,
      trails: []
    };
    projectile.element = createOiiaVolleyProjectileElement(projectile);
    owner.oiiaProjectiles = owner.oiiaProjectiles || [];
    owner.oiiaProjectiles.push(projectile);
    createOiiaVolleyMuzzleEffect(source, angle);
    return projectile;
  }

  function updateOiiaProjectiles(fighter, now) {
    if (!fighter || !fighter.oiiaProjectiles || !fighter.oiiaProjectiles.length) return;
    if (fighter.dead || game.phase !== "running") {
      clearOiiaProjectiles(fighter);
      return;
    }
    const remaining = [];
    fighter.oiiaProjectiles.forEach((projectile) => {
      if (!projectile || projectile.removing) return;
      const dt = Math.min((now - (projectile.lastUpdateAt || now)) / 1000, MAX_FRAME_STEP);
      projectile.lastUpdateAt = now;
      const steps = clamp(Math.ceil((projectile.speed * dt) / Math.max(4, projectile.radius * 0.75)), 1, 32);
      const stepDt = dt / steps;
      for (let i = 0; i < steps; i += 1) {
        projectile.x += projectile.dirX * projectile.speed * stepDt;
        projectile.y += projectile.dirY * projectile.speed * stepDt;
        resolveOiiaVolleyArenaBounce(projectile, now);
        resolveOiiaVolleyObjectBounce(projectile, now);
        damageOiiaVolleyTargets(getFighterById(projectile.ownerId) || fighter, projectile, now);
        if (projectile.removing) break;
      }
      updateOiiaVolleyProjectileElement(projectile);
      maybeCreateOiiaVolleyTrail(projectile, now);
      if (!projectile.removing && now >= projectile.expiresAt) removeOiiaVolleyProjectile(projectile);
      if (!projectile.removing) remaining.push(projectile);
    });
    fighter.oiiaProjectiles = remaining;
  }

  function resolveOiiaVolleyArenaBounce(projectile, now) {
    let nx = 0;
    let ny = 0;
    if (projectile.x - projectile.radius < 0) {
      projectile.x = projectile.radius;
      nx += 1;
    } else if (projectile.x + projectile.radius > game.arenaSize) {
      projectile.x = game.arenaSize - projectile.radius;
      nx -= 1;
    }
    if (projectile.y - projectile.radius < 0) {
      projectile.y = projectile.radius;
      ny += 1;
    } else if (projectile.y + projectile.radius > game.arenaSize) {
      projectile.y = game.arenaSize - projectile.radius;
      ny -= 1;
    }
    if (!nx && !ny) return;
    const length = Math.hypot(nx, ny) || 1;
    reflectOiiaVolleyProjectile(projectile, nx / length, ny / length, now, "arena");
  }

  function resolveOiiaVolleyObjectBounce(projectile, now) {
    game.arenaObjects.forEach((object) => {
      if (!object || projectile.removing || object.fadeStarted) return;
      if (object.type === "compressionWall") {
        if (now < (object.activeAt || 0)) return;
        const collision = getCircleRectCollision(projectile.x, projectile.y, projectile.radius, object);
        if (!collision) return;
        projectile.x += collision.normalX * (collision.overlap + 0.5);
        projectile.y += collision.normalY * (collision.overlap + 0.5);
        keepOiiaVolleyInsideArena(projectile);
        reflectOiiaVolleyProjectile(projectile, collision.normalX, collision.normalY, now, object.id);
        return;
      }
      if (object.type !== "circleWall" && object.type !== "maugaCage") return;
      let dx = projectile.x - object.x;
      let dy = projectile.y - object.y;
      let distance = Math.hypot(dx, dy);
      if (!distance) {
        dx = projectile.dirX || 1;
        dy = projectile.dirY || 0;
        distance = Math.hypot(dx, dy) || 1;
      }
      const signedDistance = distance - object.radius;
      if (Math.abs(signedDistance) >= projectile.radius) return;
      const nx = dx / distance;
      const ny = dy / distance;
      const side = signedDistance >= 0 ? 1 : -1;
      projectile.x = object.x + nx * (object.radius + side * projectile.radius);
      projectile.y = object.y + ny * (object.radius + side * projectile.radius);
      keepOiiaVolleyInsideArena(projectile);
      reflectOiiaVolleyProjectile(projectile, nx * side, ny * side, now, object.id);
    });
  }

  function reflectOiiaVolleyProjectile(projectile, normalX, normalY, now, sourceId) {
    const dot = projectile.dirX * normalX + projectile.dirY * normalY;
    if (dot >= 0) return;
    const bounceKey = `${sourceId}:${projectile.bounceCount}`;
    if (projectile.lastBounceKey === bounceKey && now - (projectile.lastBounceAt || 0) < 40) return;
    projectile.dirX -= 2 * dot * normalX;
    projectile.dirY -= 2 * dot * normalY;
    const length = Math.hypot(projectile.dirX, projectile.dirY) || 1;
    projectile.dirX /= length;
    projectile.dirY /= length;
    projectile.angle = Math.atan2(projectile.dirY, projectile.dirX);
    projectile.bounceCount += 1;
    projectile.lastBounceAt = now;
    projectile.lastBounceKey = bounceKey;
    createOiiaVolleyBounceEffect(projectile);
    if (projectile.bounceCount > projectile.maxBounces) {
      removeOiiaVolleyProjectile(projectile);
    }
  }

  function keepOiiaVolleyInsideArena(projectile) {
    projectile.x = clamp(projectile.x, projectile.radius, game.arenaSize - projectile.radius);
    projectile.y = clamp(projectile.y, projectile.radius, game.arenaSize - projectile.radius);
  }

  function damageOiiaVolleyTargets(fighter, projectile, now) {
    getOiiaVolleyTargets(fighter).forEach((target) => {
      if (!target || target.dead || target.removing || isFighterOutOfBattle(target)) return;
      const key = getEntityContactKey(target);
      const record = getOiiaVolleyTargetRecord(projectile, key);
      const colliding = Math.hypot(target.x - projectile.x, target.y - projectile.y) <= target.radius + projectile.radius;
      if (!colliding) {
        record.isCurrentlyColliding = false;
        return;
      }
      if (record.hitCount > 0) return;
      if (record.isCurrentlyColliding) return;
      if (tryReflectProjectileAgainstTarget(target, { kind: "oiiaVolley", item: projectile }, fighter, now)) {
        record.isCurrentlyColliding = false;
        return;
      }
      record.isCurrentlyColliding = true;
      record.hitCount += 1;
      record.lastHitAt = now;
      const actual = applyDamage(fighter, target, {
        label: projectile.sourceIsClone ? "Oiia Cat 분신의 총공격" : "총공격",
        baseDamage: projectile.damage,
        ignoreDefense: true,
        ownerId: fighter.id,
        attackId: `${projectile.attackId}:${key}:${record.hitCount}`,
        hitId: "projectile"
      });
      if (actual > 0) {
        createOiiaVolleyHitEffect(target);
      }
    });
  }

  function getOiiaVolleyTargets(fighter) {
    const opponent = getOpposingFighter(fighter.side);
    const targets = [];
    if (opponent && !opponent.dead && !isFighterOutOfBattle(opponent)) targets.push(opponent);
    getEnemySummons(fighter.side).forEach((summon) => {
      if (summon && !summon.dead && !summon.removing) targets.push(summon);
    });
    return targets;
  }

  function getOiiaVolleyTargetRecord(projectile, key) {
    if (!projectile.targetRecords) projectile.targetRecords = new Map();
    if (!projectile.targetRecords.has(key)) {
      projectile.targetRecords.set(key, {
        hitCount: 0,
        lastHitAt: -Infinity,
        isCurrentlyColliding: false
      });
    }
    return projectile.targetRecords.get(key);
  }

  function createOiiaVolleyProjectileElement(projectile) {
    const element = document.createElement("div");
    element.className = projectile.sourceIsClone ? "oiia-volley-projectile clone-shot" : "oiia-volley-projectile body-shot";
    els.skillLayer.appendChild(element);
    updateOiiaVolleyProjectileElement({ ...projectile, element });
    return element;
  }

  function updateOiiaVolleyProjectileElement(projectile) {
    if (!projectile || !projectile.element) return;
    projectile.element.style.width = `${projectile.radius * 2.55}px`;
    projectile.element.style.height = `${projectile.radius * 1.38}px`;
    projectile.element.style.left = `${projectile.x}px`;
    projectile.element.style.top = `${projectile.y}px`;
    projectile.element.style.transform = `translate(-50%, -50%) rotate(${projectile.angle}rad)`;
  }

  function maybeCreateOiiaVolleyTrail(projectile, now) {
    if (!projectile || projectile.removing || now - (projectile.lastTrailAt || 0) < 80) return;
    projectile.lastTrailAt = now;
    if (!projectile.trails) projectile.trails = [];
    while (projectile.trails.length >= 3) removeElement(projectile.trails.shift());
    const trail = createGasterLine(
      projectile.x - projectile.dirX * projectile.radius * 1.2,
      projectile.y - projectile.dirY * projectile.radius * 1.2,
      projectile.angle,
      projectile.radius * 2.4,
      projectile.radius * 0.5,
      "oiia-volley-trail"
    );
    projectile.trails.push(trail);
    scheduleTimeout(() => {
      removeElement(trail);
      if (projectile.trails) {
        const index = projectile.trails.indexOf(trail);
        if (index >= 0) projectile.trails.splice(index, 1);
      }
    }, 220);
  }

  function removeOiiaVolleyProjectile(projectile) {
    if (!projectile || projectile.removing) return;
    projectile.removing = true;
    if (projectile.trails) projectile.trails.forEach((trail) => removeElement(trail));
    removeElement(projectile.element);
  }

  function clearOiiaProjectiles(fighter) {
    if (!fighter || !fighter.oiiaProjectiles) return;
    fighter.oiiaProjectiles.forEach((projectile) => removeOiiaVolleyProjectile(projectile));
    fighter.oiiaProjectiles = [];
  }

  function createOiiaVolleyMuzzleEffect(source, angle) {
    const flash = createGasterLine(source.x, source.y, angle, Math.max(12, source.radius * 1.1), Math.max(4, source.radius * 0.22), "oiia-volley-muzzle");
    scheduleTimeout(() => removeElement(flash), 180);
  }

  function createOiiaVolleyReleaseEffect(fighter) {
    const burst = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.45, "oiia-volley-release");
    scheduleTimeout(() => removeElement(burst), 420);
  }

  function createOiiaVolleyHitEffect(target) {
    const hit = createCircleEffect(target.x, target.y, target.radius * 0.78, "oiia-volley-hit");
    scheduleTimeout(() => removeElement(hit), 260);
  }

  function createOiiaVolleyBounceEffect(projectile) {
    const spark = createCircleEffect(projectile.x, projectile.y, projectile.radius * 1.45, "oiia-volley-bounce");
    scheduleTimeout(() => removeElement(spark), 220);
  }

  function isMuzanSkill(skill) {
    return !!(skill && (
      skill.type === "muzanBlackBloodWhip" ||
      skill.type === "muzanCellCollapse" ||
      skill.type === "muzanNeuralShockwave" ||
      skill.type === "muzanDemonKing"
    ));
  }

  function shouldStartMuzanSkillNow(fighter, opponent, skill, now) {
    if (!fighter || fighter.abilityType !== "muzanBiology" || !opponent || opponent.dead || isFighterOutOfBattle(opponent)) return false;
    const demonSkill = fighter.skills.find((item) => item.type === "muzanDemonKing");
    const demonIndex = fighter.skills.indexOf(demonSkill);
    const demonReady = demonSkill && demonIndex >= 0 && now >= (fighter.nextSkillAt[demonIndex] || 0) && !(fighter.muzanUltimate && fighter.muzanUltimate.active) && !isUltimateLockedByOther(fighter, demonSkill);
    if (skill.type !== "muzanDemonKing" && demonReady) return false;
    if (skill.type === "muzanDemonKing") {
      return !(fighter.muzanUltimate && fighter.muzanUltimate.active);
    }
    const collapseSkill = fighter.skills.find((item) => item.type === "muzanCellCollapse");
    const collapseIndex = fighter.skills.indexOf(collapseSkill);
    const collapseReady = collapseSkill && collapseIndex >= 0 && now >= (fighter.nextSkillAt[collapseIndex] || 0);
    const requiredStacks = game.trainingMode ? 1 : 2;
    const bloodCount = getMuzanBloodCount(opponent, fighter);
    if (skill.type !== "muzanCellCollapse" && collapseReady && bloodCount >= requiredStacks) return false;
    if (skill.type === "muzanCellCollapse") {
      return bloodCount >= requiredStacks;
    }
    const shockSkill = fighter.skills.find((item) => item.type === "muzanNeuralShockwave");
    const shockIndex = fighter.skills.indexOf(shockSkill);
    const shockReady = shockSkill && shockIndex >= 0 && now >= (fighter.nextSkillAt[shockIndex] || 0);
    const distance = Math.hypot(opponent.x - fighter.x, opponent.y - fighter.y);
    const shockRange = game.arenaSize * 0.48;
    if (skill.type !== "muzanNeuralShockwave" && shockReady && distance <= shockRange) return false;
    if (skill.type === "muzanNeuralShockwave") {
      return distance <= shockRange;
    }
    return true;
  }

  function getMuzanTargets(fighter) {
    const targets = [];
    const opponent = getOpposingFighter(fighter.side);
    if (opponent && !opponent.dead && !isFighterOutOfBattle(opponent)) targets.push(opponent);
    getEnemySummons(fighter.side).forEach((summon) => {
      if (summon && !summon.dead && !summon.removing) targets.push(summon);
    });
    return targets;
  }

  function getMuzanRecord(target, owner, create = false) {
    if (!target || !owner) return null;
    if (!target.muzanBloodRecords) {
      if (!create) return null;
      target.muzanBloodRecords = new Map();
    }
    const key = owner.id || owner.name || "muzan";
    let record = target.muzanBloodRecords.get(key);
    if (!record && create) {
      record = {
        ownerId: key,
        count: 0,
        lastHitAt: -Infinity,
        nextDecayAt: Infinity,
        effect: null
      };
      target.muzanBloodRecords.set(key, record);
    }
    return record || null;
  }

  function getMuzanBloodCount(target, owner) {
    const record = getMuzanRecord(target, owner, false);
    return record ? Math.max(0, Number(record.count) || 0) : 0;
  }

  function getMaxMuzanBloodCount(target) {
    if (!target || !target.muzanBloodRecords) return 0;
    let max = 0;
    target.muzanBloodRecords.forEach((record) => {
      max = Math.max(max, Number(record.count) || 0);
    });
    return max;
  }

  function getMuzanMaxBloodStacks(owner) {
    if (owner && owner.muzanUltimate && owner.muzanUltimate.active && getBattleNow() < owner.muzanUltimate.endAt) {
      return Number(owner.muzanUltimate.maxBloodStacks) || 7;
    }
    return 5;
  }

  function addMuzanBloodStack(owner, target, now = getBattleNow(), attackId = "") {
    if (!owner || owner.abilityType !== "muzanBiology" || !target || target.dead || target.currentHp <= 0 || target.side === owner.side) return 0;
    const record = getMuzanRecord(target, owner, true);
    const maxStacks = getMuzanMaxBloodStacks(owner);
    record.count = clamp((Number(record.count) || 0) + 1, 1, maxStacks);
    record.lastHitAt = now;
    record.nextDecayAt = now + MUZAN_BLOOD_DURATION_MS;
    record.lastAttackId = attackId || record.lastAttackId || "";
    updateMuzanBloodVisual(target);
    normalizeVelocity(target, getPixelSpeed(target));
    return record.count;
  }

  function removeMuzanBloodStacks(target, owner, amount = 999) {
    const record = getMuzanRecord(target, owner, false);
    if (!record) return 0;
    const removed = Math.min(Math.max(0, Number(amount) || 0), record.count);
    record.count -= removed;
    record.nextDecayAt = getBattleNow() + MUZAN_BLOOD_DECAY_MS;
    if (record.count <= 0) {
      clearMuzanBloodRecord(target, owner);
    } else {
      updateMuzanBloodVisual(target);
    }
    normalizeVelocity(target, getPixelSpeed(target));
    return removed;
  }

  function clearMuzanBloodRecord(target, owner) {
    if (!target || !target.muzanBloodRecords) return;
    const record = getMuzanRecord(target, owner, false);
    if (record) removeElement(record.effect);
    const key = owner && (owner.id || owner.name);
    if (key) target.muzanBloodRecords.delete(key);
    if (!target.muzanBloodRecords.size) {
      removeElement(target.muzanBloodEffect);
      target.muzanBloodEffect = null;
    }
  }

  function clearAllMuzanBloodRecords(target) {
    if (!target || !target.muzanBloodRecords) return;
    target.muzanBloodRecords.forEach((record) => removeElement(record.effect));
    target.muzanBloodRecords.clear();
    removeElement(target.muzanBloodEffect);
    target.muzanBloodEffect = null;
  }

  function updateMuzanBloodOnEntity(target, now) {
    if (!target || !target.muzanBloodRecords) return;
    if (target.dead || target.removing) {
      clearAllMuzanBloodRecords(target);
      return;
    }
    target.muzanBloodRecords.forEach((record, key) => {
      if (record.count <= 0) {
        target.muzanBloodRecords.delete(key);
        return;
      }
      if (now >= (record.nextDecayAt || Infinity)) {
        record.count -= 1;
        record.nextDecayAt = now + MUZAN_BLOOD_DECAY_MS;
      }
      if (record.count <= 0) {
        removeElement(record.effect);
        target.muzanBloodRecords.delete(key);
      }
    });
    updateMuzanBloodVisual(target);
  }

  function getMuzanBloodSpeedMultiplier(target) {
    const count = getMaxMuzanBloodCount(target);
    if (count <= 0) return 1;
    return clamp(1 - Math.min(5, count) * 0.03, 0.85, 1);
  }

  function getMuzanBloodHealMultiplier(target) {
    return getMaxMuzanBloodCount(target) >= 5 ? 0.5 : 1;
  }

  function updateMuzanBloodVisual(target) {
    if (!target) return;
    const count = getMaxMuzanBloodCount(target);
    if (count <= 0) {
      removeElement(target.muzanBloodEffect);
      target.muzanBloodEffect = null;
      return;
    }
    if (!target.muzanBloodEffect) {
      target.muzanBloodEffect = createCircleEffect(target.x, target.y - target.radius * 1.1, target.radius * 0.6, "muzan-blood-mark");
      target.muzanBloodEffect.textContent = "";
    }
    target.muzanBloodEffect.dataset.count = String(count);
    target.muzanBloodEffect.textContent = "●".repeat(Math.min(count, 7));
    updateCircleEffect(target.muzanBloodEffect, target.x, target.y - target.radius * 1.1, target.radius * 0.6);
  }

  function grantMuzanCell(fighter, amount) {
    if (!fighter || fighter.abilityType !== "muzanBiology" || fighter.muzanSunriseActive) return 0;
    const before = Number(fighter.muzanCellGauge) || 0;
    fighter.muzanCellGauge = clamp(before + Math.max(0, Number(amount) || 0), 0, fighter.muzanCellMax || MUZAN_CELL_MAX);
    updateMuzanArenaCellGauge(fighter);
    return fighter.muzanCellGauge - before;
  }

  function spendMuzanCell(fighter, amount) {
    if (!fighter || fighter.abilityType !== "muzanBiology") return 0;
    const before = Number(fighter.muzanCellGauge) || 0;
    const spent = Math.min(before, Math.max(0, Number(amount) || 0));
    fighter.muzanCellGauge = before - spent;
    updateMuzanArenaCellGauge(fighter);
    return spent;
  }

  function updateMuzanState(fighter, now) {
    if (!fighter || fighter.abilityType !== "muzanBiology") return;
    const dt = fighter.muzanLastPassiveAt ? clamp((now - fighter.muzanLastPassiveAt) / 1000, 0, 0.08) : 0;
    fighter.muzanLastPassiveAt = now;
    if (fighter.dead) return;

    if (!game.trainingMode && !fighter.muzanSunriseActive && getBattleElapsedMs(now) >= MUZAN_SUNRISE_TIME_MS) {
      startMuzanSunrise(fighter, now);
    }

    if (fighter.muzanSunriseActive) {
      updateMuzanSunrise(fighter, now, dt);
    } else if (!isMuzanFatalRegenerating(fighter, now)) {
      updateMuzanPassiveRegen(fighter, now, dt);
    }

    updateMuzanFatalRegen(fighter, now, dt);
    updateMuzanUltimateState(fighter, now);
    updateMuzanArenaCellGauge(fighter);
  }

  function updateMuzanPassiveRegen(fighter, now, dt) {
    if (dt <= 0 || fighter.currentHp >= fighter.maxHp) return;
    const unlimited = fighter.muzanUltimate && fighter.muzanUltimate.active && now < fighter.muzanUltimate.endAt;
    if (!unlimited && (Number(fighter.muzanCellGauge) || 0) <= 0) return;
    const recentlyHit = now - (fighter.muzanLastDamageAt || -Infinity) <= 1000;
    const healRate = fighter.maxHp * 0.02 * (recentlyHit ? 0.5 : 1);
    let healAmount = healRate * dt * getMuzanBloodHealMultiplier(fighter);
    if (!unlimited) {
      const cost = 8 * dt;
      const available = Number(fighter.muzanCellGauge) || 0;
      if (available < cost && cost > 0) healAmount *= available / cost;
      spendMuzanCell(fighter, cost);
    }
    if (healAmount > 0) {
      const before = fighter.currentHp;
      fighter.currentHp = Math.min(fighter.maxHp, fighter.currentHp + healAmount);
      if (Math.floor(before) !== Math.floor(fighter.currentHp)) refreshOiiaSize(fighter);
    }
  }

  function tryMuzanFatalRegeneration(defender, options, nextHp, now) {
    if (!defender || defender.abilityType !== "muzanBiology") return false;
    if (nextHp > 0 || defender.muzanFatalRegenUsed || defender.muzanSunriseActive) return false;
    if ((Number(defender.muzanCellGauge) || 0) < 50) return false;
    if (options.systemKill || options.ignoreMuzanFatalRegen || options.execute || options.execution) return false;
    defender.muzanFatalRegenUsed = true;
    spendMuzanCell(defender, 50);
    defender.currentHp = 1;
    defender.dead = false;
    defender.stunUntil = 0;
    defender.storedStunVelocity = null;
    defender.slowUntil = 0;
    defender.slowMultiplier = 1;
    defender.muzanFatalRegen = {
      endAt: now + 2000,
      totalHeal: defender.maxHp * 0.2,
      healed: 0
    };
    const element = getFighterElement(defender);
    if (element) element.classList.add("muzan-fatal-regenerating");
    removeElement(defender.slowEffect);
    defender.slowEffect = null;
    createMuzanFatalRegenEffect(defender);
    addLog(`${defender.name} 완전생물 치명상 재생`, "good");
    return true;
  }

  function isMuzanFatalRegenerating(fighter, now = getBattleNow()) {
    return !!(fighter && fighter.muzanFatalRegen && now < fighter.muzanFatalRegen.endAt);
  }

  function updateMuzanFatalRegen(fighter, now, dt) {
    const state = fighter.muzanFatalRegen;
    if (!state) return;
    const element = getFighterElement(fighter);
    if (element) element.classList.add("muzan-fatal-regenerating");
    const remainingHeal = Math.max(0, state.totalHeal - state.healed);
    const remainingTime = Math.max(1, state.endAt - now);
    const healAmount = Math.min(remainingHeal, (state.totalHeal / 2) * dt * getMuzanBloodHealMultiplier(fighter));
    if (healAmount > 0 && fighter.currentHp > 0) {
      const before = fighter.currentHp;
      fighter.currentHp = Math.min(fighter.maxHp, fighter.currentHp + healAmount);
      state.healed += fighter.currentHp - before;
    }
    if (now >= state.endAt || remainingTime <= 1 || state.healed >= state.totalHeal - 0.01 || fighter.dead) {
      fighter.muzanFatalRegen = null;
      if (element) element.classList.remove("muzan-fatal-regenerating");
    }
  }

  function createMuzanFatalRegenEffect(fighter) {
    const burst = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.65, "muzan-fatal-regen");
    for (let i = 0; i < 12; i += 1) {
      const line = createGasterLine(
        fighter.x + Math.cos((Math.PI * 2 * i) / 12) * fighter.radius * 1.6,
        fighter.y + Math.sin((Math.PI * 2 * i) / 12) * fighter.radius * 1.6,
        (Math.PI * 2 * i) / 12 + Math.PI,
        fighter.radius * 1.2,
        Math.max(3, fighter.radius * 0.08),
        "muzan-regen-vessel"
      );
      scheduleTimeout(() => removeElement(line), 560);
    }
    scheduleTimeout(() => removeElement(burst), 720);
  }

  function startMuzanSunrise(fighter, now) {
    if (!fighter || fighter.muzanSunriseActive) return;
    fighter.muzanSunriseActive = true;
    fighter.muzanSunriseNextAt = now;
    const effect = document.createElement("div");
    effect.className = "muzan-sunrise";
    els.skillLayer.appendChild(effect);
    fighter.muzanSunriseEffect = effect;
    addLog("일출이 시작되어 무잔의 재생이 멈췄습니다.", "bad");
  }

  function updateMuzanSunrise(fighter, now, dt) {
    if (fighter.muzanSunriseEffect) {
      fighter.muzanSunriseEffect.style.setProperty("--muzan-x", `${(fighter.x / Math.max(1, game.arenaSize)) * 100}%`);
      fighter.muzanSunriseEffect.style.setProperty("--muzan-y", `${(fighter.y / Math.max(1, game.arenaSize)) * 100}%`);
    }
    if (dt <= 0 || fighter.dead) return;
    const damage = fighter.maxHp * 0.015 * dt;
    if (damage > 0) {
      applyDamage(fighter, fighter, {
        label: "일출",
        fixedDamage: damage,
        ignoreDefense: true,
        ignoreDamageReduction: true,
        ignoreGojoInfinity: true,
        ignoreMuzanFatalRegen: true,
        isDot: true,
        damageKind: "시스템 피해",
        attackId: `muzan-sunrise-${fighter.id}`
      });
    }
  }

  function createMuzanWhipDefinition(angle, index = 0, count = 6, auto = false) {
    const side = index % 2 === 0 ? 1 : -1;
    const wobble = Math.sin((index + 1) * 1.73) * 0.22;
    return {
      angle,
      bend: side * (auto ? 0.16 : 0.24 + (index % 3) * 0.055) + wobble,
      counterBend: -side * (auto ? 0.08 : 0.13 + (index % 2) * 0.04),
      lengthScale: auto ? 0.94 + (index % 3) * 0.04 : 0.88 + (index % Math.max(1, count)) * 0.032,
      rootOffset: side * (auto ? 0.16 : 0.34 + (index % 2) * 0.16),
      frontLayer: index % 3 !== 1
    };
  }

  function getMuzanWhipPoints(fighter, definition, length, width) {
    const angle = definition.angle || 0;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const normalX = -dirY;
    const normalY = dirX;
    const rootDistance = fighter.radius * (definition.frontLayer ? 0.22 : -0.18);
    const rootOffset = fighter.radius * (definition.rootOffset || 0);
    const rootX = fighter.x + dirX * rootDistance + normalX * rootOffset;
    const rootY = fighter.y + dirY * rootDistance + normalY * rootOffset;
    const rayLength = getArenaRayLength(rootX, rootY, dirX, dirY, length * (definition.lengthScale || 1));
    const usableLength = clamp(rayLength, fighter.radius * 2.2, length * (definition.lengthScale || 1));
    const bend = usableLength * (definition.bend || 0);
    const counterBend = usableLength * (definition.counterBend || 0);
    const p0 = { x: rootX, y: rootY };
    const p1 = {
      x: rootX + dirX * usableLength * 0.28 + normalX * bend,
      y: rootY + dirY * usableLength * 0.28 + normalY * bend
    };
    const p2 = {
      x: rootX + dirX * usableLength * 0.72 + normalX * counterBend,
      y: rootY + dirY * usableLength * 0.72 + normalY * counterBend
    };
    const p3 = {
      x: rootX + dirX * usableLength + normalX * Math.sign(definition.bend || 1) * width * 0.5,
      y: rootY + dirY * usableLength + normalY * Math.sign(definition.bend || 1) * width * 0.5
    };
    return [p0, p1, p2, p3];
  }

  function getMuzanWhipPath(points) {
    const [p0, p1, p2, p3] = points;
    return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} C ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}, ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`;
  }

  function createMuzanWhipSvg(points, width, mode = "slash", auto = false, frontLayer = true) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${game.arenaSize} ${game.arenaSize}`);
    svg.classList.add("muzan-whip-svg", `muzan-whip-${mode}`, frontLayer ? "front" : "back");
    if (auto) svg.classList.add("auto");
    const pathData = getMuzanWhipPath(points);
    const createPath = (className, strokeWidth) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      path.setAttribute("pathLength", "1");
      path.setAttribute("stroke-width", String(strokeWidth));
      path.setAttribute("class", className);
      svg.appendChild(path);
      return path;
    };
    if (mode === "warning") {
      createPath("muzan-whip-warning-path", Math.max(2, width * 0.34));
      createPath("muzan-whip-warning-runner", Math.max(1.5, width * 0.16));
    } else if (mode === "ground") {
      createPath("muzan-whip-ground-path", Math.max(5, width * 0.65));
    } else {
      createPath("muzan-whip-outer-path", Math.max(7, width * (auto ? 1.2 : 1.55)));
      createPath("muzan-whip-body-path", Math.max(5, width * (auto ? 0.86 : 1.08)));
      createPath("muzan-whip-core-path", Math.max(2, width * 0.32));
      createPath("muzan-whip-tip-path", Math.max(1.5, width * 0.18));
    }
    els.skillLayer.appendChild(svg);
    return svg;
  }

  function updateMuzanWhipSvg(svg, points) {
    if (!svg) return;
    const pathData = getMuzanWhipPath(points);
    svg.querySelectorAll("path").forEach((path) => path.setAttribute("d", pathData));
  }

  function sampleCubic(points, segments = 18) {
    const [p0, p1, p2, p3] = points;
    const samples = [];
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const inv = 1 - t;
      samples.push({
        x: inv ** 3 * p0.x + 3 * inv ** 2 * t * p1.x + 3 * inv * t ** 2 * p2.x + t ** 3 * p3.x,
        y: inv ** 3 * p0.y + 3 * inv ** 2 * t * p1.y + 3 * inv * t ** 2 * p2.y + t ** 3 * p3.y
      });
    }
    return samples;
  }

  function distancePointToSegment(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const lengthSq = abx * abx + aby * aby || 1;
    const t = clamp(((px - ax) * abx + (py - ay) * aby) / lengthSq, 0, 1);
    const x = ax + abx * t;
    const y = ay + aby * t;
    return Math.hypot(px - x, py - y);
  }

  function isTargetNearMuzanCurve(target, points, width) {
    if (!target || target.dead || target.removing || isFighterOutOfBattle(target)) return false;
    const samples = sampleCubic(points, 20);
    const limit = width / 2 + target.radius * 0.62;
    for (let i = 1; i < samples.length; i += 1) {
      if (distancePointToSegment(target.x, target.y, samples[i - 1].x, samples[i - 1].y, samples[i].x, samples[i].y) <= limit) {
        return true;
      }
    }
    return false;
  }

  function createMuzanWhipWarnings(fighter, state, skill) {
    const count = Math.max(1, Math.floor(Number(skill.whipCount) || 6));
    const length = getMuzanWhipRange(fighter, skill);
    const width = fighter.radius * (Number(skill.widthRate) || 0.42);
    state.data.effects = state.data.effects || [];
    state.data.whipDefs = [];
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.PI / count;
      const definition = createMuzanWhipDefinition(angle, i, count, false);
      const points = getMuzanWhipPoints(fighter, definition, length, width);
      const warning = createMuzanWhipSvg(points, width, "warning", false, definition.frontLayer);
      warning.dataset.whipIndex = String(i);
      warning.__muzanWhipDef = definition;
      state.data.whipDefs.push(definition);
      state.data.effects.push(warning);
    }
    state.data.warning = state.data.effects[0] || null;
  }

  function updateMuzanWhipWarnings(fighter, state, skill) {
    const effects = (state.data && state.data.effects) || [];
    const length = getMuzanWhipRange(fighter, skill);
    const width = fighter.radius * (Number(skill.widthRate) || 0.42);
    effects.forEach((effect) => {
      if (!effect || !effect.classList || !effect.classList.contains("muzan-whip-svg")) return;
      const definition = effect.__muzanWhipDef;
      if (!definition) return;
      updateMuzanWhipSvg(effect, getMuzanWhipPoints(fighter, definition, length, width));
    });
  }

  function createMuzanCellCollapseWarning(fighter, state) {
    const target = getFighterById(state.data.targetId) || getOpposingFighter(fighter.side);
    const x = target ? target.x : state.data.targetX;
    const y = target ? target.y : state.data.targetY;
    state.data.warning = createMuzanCellCollapseEffect(x, y, state.data.radius, getMuzanBloodCount(target, fighter));
    state.data.charge = createCircleEffect(x, y, Math.max(10, state.data.radius * 0.16), "muzan-collapse-core");
    state.data.effects = state.data.effects || [];
    state.data.effects.push(state.data.warning, state.data.charge);
    const record = getMuzanRecord(target, fighter, false);
    if (record && record.effect) {
      record.effect.classList.add("collapse-lit");
      const timer = scheduleTimeout(() => record.effect && record.effect.classList.remove("collapse-lit"), 760);
      state.data.timers = state.data.timers || [];
      state.data.timers.push(timer);
    }
  }

  function updateMuzanCellCollapseWarning(fighter, state) {
    const target = getFighterById(state.data.targetId) || getOpposingFighter(fighter.side);
    if (!target) return;
    state.data.targetX = target.x;
    state.data.targetY = target.y;
    updateMuzanCellCollapseEffect(state.data.warning, target.x, target.y, state.data.radius);
    updateCircleEffect(state.data.charge, target.x, target.y, Math.max(10, state.data.radius * 0.16));
  }

  function createMuzanCellCollapseEffect(x, y, radius, stacks = 1) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${game.arenaSize} ${game.arenaSize}`);
    svg.classList.add("muzan-collapse-svg");
    svg.__veins = [];
    const veinCount = Math.max(8, Math.min(16, 8 + (Number(stacks) || 1) * 2));
    for (let i = 0; i < veinCount; i += 1) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("pathLength", "1");
      path.setAttribute("class", i % 3 === 0 ? "muzan-collapse-vein bright" : "muzan-collapse-vein");
      const angle = (Math.PI * 2 * i) / veinCount + Math.sin(i * 2.3) * 0.22;
      svg.__veins.push({ path, angle, jitter: 0.72 + (i % 4) * 0.13 });
      svg.appendChild(path);
    }
    els.skillLayer.appendChild(svg);
    updateMuzanCellCollapseEffect(svg, x, y, radius);
    return svg;
  }

  function updateMuzanCellCollapseEffect(svg, x, y, radius) {
    if (!svg || !svg.__veins) return;
    svg.__veins.forEach((item, index) => {
      const angle = item.angle;
      const outer = radius * (0.82 + (index % 3) * 0.08);
      const inner = radius * (0.14 + (index % 4) * 0.018);
      const mid = radius * 0.44;
      const sx = x + Math.cos(angle) * outer;
      const sy = y + Math.sin(angle) * outer;
      const ex = x + Math.cos(angle + 0.18) * inner;
      const ey = y + Math.sin(angle + 0.18) * inner;
      const normal = angle + Math.PI / 2;
      const cx1 = x + Math.cos(angle) * mid + Math.cos(normal) * radius * 0.16 * item.jitter;
      const cy1 = y + Math.sin(angle) * mid + Math.sin(normal) * radius * 0.16 * item.jitter;
      const cx2 = x + Math.cos(angle - 0.26) * radius * 0.28 - Math.cos(normal) * radius * 0.09;
      const cy2 = y + Math.sin(angle - 0.26) * radius * 0.28 - Math.sin(normal) * radius * 0.09;
      item.path.setAttribute("d", `M ${sx.toFixed(2)} ${sy.toFixed(2)} C ${cx1.toFixed(2)} ${cy1.toFixed(2)}, ${cx2.toFixed(2)} ${cy2.toFixed(2)}, ${ex.toFixed(2)} ${ey.toFixed(2)}`);
      item.path.setAttribute("stroke-width", String(Math.max(2, radius * (index % 3 === 0 ? 0.025 : 0.018))));
    });
  }

  function createMuzanUltimateCharge(fighter, state) {
    state.data.dim = createMuzanDim();
    state.data.charge = createMuzanDemonKingField(fighter);
    state.data.charge.classList.add("charging");
    state.data.warning = state.data.charge;
    state.data.title = createMuzanTitle("귀왕 해방", "무잔");
    state.data.effects = state.data.effects || [];
    state.data.effects.push(state.data.dim, state.data.charge, state.data.title);
  }

  function updateMuzanUltimateCharge(fighter, state) {
    updateMuzanDemonKingField(state.data.charge, fighter);
  }

  function createMuzanNeuralCharge(fighter, state, skill) {
    const radius = game.arenaSize * (Number(skill.radiusRate) || 0.56) * (fighter.muzanUltimate && fighter.muzanUltimate.active ? 1.2 : 1);
    state.data.warning = createCircleEffect(fighter.x, fighter.y, Math.max(fighter.radius * 1.2, radius * 0.18), "muzan-neural-charge");
    state.data.warning.style.setProperty("--neural-radius", `${radius}px`);
    state.data.effects = state.data.effects || [];
    state.data.effects.push(state.data.warning);
  }

  function updateMuzanNeuralCharge(fighter, state) {
    if (!state || !state.data || !state.data.warning) return;
    updateCircleEffect(state.data.warning, fighter.x, fighter.y, Math.max(fighter.radius * 1.2, (state.data.radius || game.arenaSize * 0.56) * 0.18));
  }

  function getMuzanWhipRange(fighter, skill) {
    const base = game.arenaSize * (Number(skill.radiusRate) || 0.42);
    const multiplier = fighter.muzanUltimate && fighter.muzanUltimate.active ? Number(fighter.muzanUltimate.whipRangeMultiplier) || 1.25 : 1;
    return base * multiplier;
  }

  function startMuzanBlackBloodWhip(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    const count = Math.max(1, Math.floor(Number(skill.whipCount) || 6));
    const interval = Number(skill.interval) || 85;
    const length = getMuzanWhipRange(fighter, skill);
    const width = fighter.radius * (Number(skill.widthRate) || 0.42);
    clearMuzanSkillVisuals(state);
    state.data.hitCounts = new Map();
    for (let i = 0; i < count; i += 1) {
      const timer = scheduleTimeout(() => {
        if (fighter.dead || !fighter.skillState || fighter.skillState !== state) return;
        const angle = (Math.PI * 2 * i) / count + Math.PI / count;
        fireMuzanWhip(fighter, skill, state.data, angle, length, width, i, false);
      }, i * interval);
      state.data.timers.push(timer);
    }
    state.data.timers.push(scheduleTimeout(() => {
      if (!fighter.skillState || fighter.skillState !== state) return;
      restoreStoredVelocity(fighter, state);
      fighter.skillState = null;
      startSkillRecovery(fighter, skill, getBattleNow());
    }, count * interval + 240));
    addLog(`${fighter.name} 흑혈 채찍`, "skill");
  }

  function fireMuzanWhip(fighter, skill, data, angle, length, width, index = 0, auto = false) {
    const definition = (data.whipDefs && data.whipDefs[index]) || createMuzanWhipDefinition(angle, index, Math.max(1, Number(skill.whipCount) || 6), auto);
    definition.angle = angle;
    const points = getMuzanWhipPoints(fighter, definition, length, width);
    const line = createMuzanWhipSvg(points, width * (auto ? 0.95 : 1.16), "slash", auto, definition.frontLayer);
    const crack = createMuzanWhipSvg(points, Math.max(5, width * 0.58), "ground", auto, false);
    scheduleTimeout(() => removeElement(line), auto ? 340 : 420);
    scheduleTimeout(() => removeElement(crack), 620);
    const attackId = `${data.attackId || "muzan-whip"}:${index}:${Math.round(getBattleNow())}`;
    const bundleHit = new Set();
    getMuzanTargets(fighter).forEach((target) => {
      if (!isTargetNearMuzanCurve(target, points, width + target.radius * 0.5)) return;
      const key = getEntityContactKey(target);
      const currentHits = data.hitCounts ? Number(data.hitCounts.get(key)) || 0 : 0;
      if (!auto && currentHits >= (Number(skill.maxHitsPerTarget) || 3)) return;
      const actual = applyDamage(fighter, target, {
        label: auto ? "귀왕 해방 채찍" : skill.name,
        baseDamage: auto ? Number(skill.autoWhipDamage) || 4 : Number(skill.damage) || 8,
        ignoreDefense: true,
        attackId,
        hitId: key,
        muzanSkillHit: !auto,
        skipMuzanBlood: auto && bundleHit.size > 0,
        muzanCellGain: auto ? 0 : 4
      });
      if (actual > 0) {
        if (auto && !bundleHit.size) addMuzanBloodStack(fighter, target, getBattleNow(), attackId);
        bundleHit.add(key);
        if (data.hitCounts) data.hitCounts.set(key, currentHits + 1);
        createMuzanHitEffect(target, angle);
        createMuzanWhipImpact(target, angle);
        if (!data.lastShakeAt || getBattleNow() - data.lastShakeAt > 150) {
          data.lastShakeAt = getBattleNow();
          if (els.arena) {
            els.arena.classList.add("shake");
            scheduleTimeout(() => els.arena && els.arena.classList.remove("shake"), auto ? 90 : 120);
          }
        }
      }
    });
  }

  function isTargetNearLine(target, startX, startY, angle, length, width) {
    if (!target || target.dead || target.removing || isFighterOutOfBattle(target)) return false;
    const dx = target.x - startX;
    const dy = target.y - startY;
    const forward = dx * Math.cos(angle) + dy * Math.sin(angle);
    if (forward < -target.radius * 0.5 || forward > length + target.radius * 0.5) return false;
    const side = Math.abs(-Math.sin(angle) * dx + Math.cos(angle) * dy);
    return side <= width / 2 + target.radius * 0.55;
  }

  function startMuzanCellCollapse(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    const target = getFighterById(state.data.targetId) || opponent;
    if (!target || target.dead || getMuzanBloodCount(target, fighter) <= 0) {
      if (typeof state.index === "number" && fighter.nextSkillAt) {
        fighter.nextSkillAt[state.index] = now;
      }
      clearMuzanSkillState(fighter, state);
      restoreStoredVelocity(fighter, state);
      fighter.skillState = null;
      return;
    }
    const stacks = getMuzanBloodCount(target, fighter);
    const damage = Math.min(Number(skill.damageCap) || 34, (Number(skill.baseDamage) || 14) + stacks * (Number(skill.damagePerStack) || 4));
    const removed = Math.min(Number(skill.maxConsumeStacks) || 2, stacks);
    const actual = applyDamage(fighter, target, {
      label: skill.name,
      baseDamage: damage,
      ignoreDefense: true,
      attackId: state.data.attackId,
      hitId: target.id,
      muzanSkillHit: true,
      skipMuzanBlood: true,
      muzanCellGain: 0
    });
    if (actual > 0) {
      const consumed = removeMuzanBloodStacks(target, fighter, removed);
      const healed = healFighter(fighter, consumed * (Number(skill.healPerStack) || 4), skill.name);
      grantMuzanCell(fighter, consumed * (Number(skill.cellPerStack) || 8));
      if (healed > 0) createHealEffect(fighter, healed);
      createMuzanCollapseImpact(target, fighter);
    }
    clearMuzanSkillState(fighter, state);
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
    startSkillRecovery(fighter, skill, now);
  }

  function startMuzanNeuralShockwave(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    clearMuzanSkillVisuals(state);
    state.phase = "active";
    state.data.pulseHits = [];
    state.data.disruptedTargets = new Set();
    state.data.bloodGranted = false;
    const waveCount = Math.max(1, Math.floor(Number(skill.waveCount) || 3));
    const interval = 170;
    for (let i = 0; i < waveCount; i += 1) {
      const timer = scheduleTimeout(() => {
        if (!fighter.skillState || fighter.skillState !== state || fighter.dead || game.battleEnding) return;
        emitMuzanNeuralPulse(fighter, skill, state.data, i);
      }, i * interval);
      state.data.timers.push(timer);
    }
    state.data.timers.push(scheduleTimeout(() => {
      if (!fighter.skillState || fighter.skillState !== state) return;
      clearMuzanSkillState(fighter, state);
      restoreStoredVelocity(fighter, state);
      fighter.skillState = null;
      startSkillRecovery(fighter, skill, getBattleNow());
    }, waveCount * interval + 560));
    addLog(`${fighter.name} 신경 파괴 충격파`, "skill");
  }

  function emitMuzanNeuralPulse(fighter, skill, data, pulseIndex) {
    const now = getBattleNow();
    const ultimateBoost = fighter.muzanUltimate && fighter.muzanUltimate.active && now < fighter.muzanUltimate.endAt ? 1.2 : 1;
    const radius = (game.arenaSize * (Number(skill.radiusRate) || 0.56)) * ultimateBoost;
    const wave = createCircleEffect(fighter.x, fighter.y, radius, `muzan-neural-wave ${ultimateBoost > 1 ? "boosted" : ""}`);
    wave.dataset.pulse = String(pulseIndex + 1);
    data.effects = data.effects || [];
    data.effects.push(wave);
    scheduleTimeout(() => removeElement(wave), 720);
    const hitSet = new Set();
    data.pulseHits[pulseIndex] = hitSet;
    getMuzanTargets(fighter).forEach((target) => {
      const key = getEntityContactKey(target);
      if (hitSet.has(key)) return;
      if (Math.hypot(target.x - fighter.x, target.y - fighter.y) > radius + target.radius * 0.45) return;
      hitSet.add(key);
      const actual = applyDamage(fighter, target, {
        label: skill.name,
        baseDamage: Number(skill.damage) || 6,
        ignoreDefense: true,
        attackId: `${data.attackId || "muzan-neural"}:${pulseIndex}`,
        hitId: `${key}:${pulseIndex}`,
        muzanSkillHit: true,
        skipMuzanBlood: data.bloodGranted,
        muzanCellGain: 4
      });
      if (actual > 0) {
        if (!data.bloodGranted) data.bloodGranted = true;
        if (!data.disruptedTargets.has(key)) {
          data.disruptedTargets.add(key);
          applyMuzanNeuralDisruption(fighter, target, skill, now);
        }
        createMuzanNeuralHitEffect(target);
      }
    });
  }

  function applyMuzanNeuralDisruption(source, target, skill, now) {
    if (!target || target.dead || target.removing || target.maugaUnstoppable) return false;
    if (tryGojoInfinityBlockStatus(target, "신경 교란", now)) return false;
    if (!isFighterStunned(target, now)) {
      target.storedStunVelocity = { vx: target.vx, vy: target.vy };
    }
    const stunDuration = Math.max(0, Number(skill.stunDuration) || 600);
    target.stunUntil = Math.max(target.stunUntil || 0, now + stunDuration);
    target.vx = 0;
    target.vy = 0;
    const slowDuration = Math.max(0, Number(skill.slowDuration) || 2000);
    const multiplier = clamp(1 - (Number(skill.slowRate) || 0.25), 0.2, 1);
    target.slowMultiplier = Math.min(target.slowMultiplier || 1, multiplier);
    target.slowUntil = Math.max(target.slowUntil || 0, now + slowDuration);
    target.muzanNeuralUntil = Math.max(target.muzanNeuralUntil || 0, now + Math.max(stunDuration, slowDuration));
    removeElement(target.slowEffect);
    target.slowEffect = createCircleEffect(target.x, target.y, target.radius * 1.16, "muzan-neural-slow");
    const element = getEntityElement(target);
    if (element) element.classList.add("stunned", "slowed");
    normalizeVelocity(target, getPixelSpeed(target));
    addLog(`${target.name} 신경 교란`, "skill");
    return true;
  }

  function startMuzanDemonKing(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    clearMuzanSkillVisuals(state);
    fighter.muzanCellGauge = fighter.muzanCellMax || MUZAN_CELL_MAX;
    fighter.stunUntil = 0;
    fighter.slowUntil = 0;
    fighter.slowMultiplier = 1;
    removeElement(fighter.slowEffect);
    fighter.slowEffect = null;
    const ultimate = {
      active: true,
      skill,
      endAt: now + (Number(skill.duration) || 6000),
      nextAutoAt: now + 220,
      autoIndex: 0,
      maxBloodStacks: Number(skill.maxBloodStacks) || 7,
      whipRangeMultiplier: Number(skill.whipRangeMultiplier) || 1.25,
      effects: []
    };
    fighter.muzanUltimate = ultimate;
    const element = getFighterElement(fighter);
    if (element) element.classList.add("muzan-ultimate-active");
    ultimate.effects.push(createMuzanDim(), createMuzanDemonKingField(fighter), createMuzanTitle("귀왕 해방", "무잔"));
    addLog(`${fighter.name} 귀왕 해방`, "ultimate");
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
  }

  function updateMuzanUltimateState(fighter, now) {
    const ultimate = fighter.muzanUltimate;
    if (!ultimate || !ultimate.active) return;
    if (fighter.dead || game.battleEnding) {
      endMuzanDemonKing(fighter, true, now);
      return;
    }
    if (ultimate.effects && ultimate.effects[1]) updateMuzanDemonKingField(ultimate.effects[1], fighter);
    while (now >= (ultimate.nextAutoAt || now + 1) && now < ultimate.endAt) {
      ultimate.nextAutoAt += Number(ultimate.skill.autoWhipInterval) || 550;
      const count = Math.random() < 0.45 ? 2 : 1;
      for (let i = 0; i < count; i += 1) {
        const targets = getMuzanTargets(fighter);
        const target = targets.length ? targets[(ultimate.autoIndex + i) % targets.length] : null;
        const baseAngle = target ? Math.atan2(target.y - fighter.y, target.x - fighter.x) : Math.random() * Math.PI * 2;
        const data = {
          attackId: `muzan-ultimate-auto-${fighter.id}-${ultimate.autoIndex++}`,
          hitCounts: new Map()
        };
        const angle = baseAngle + (Math.random() - 0.5) * 0.72;
        fireMuzanWhip(fighter, { ...ultimate.skill, damage: Number(ultimate.skill.autoWhipDamage) || 4, maxHitsPerTarget: 1 }, data, angle, getMuzanWhipRange(fighter, ultimate.skill), fighter.radius * 0.34, i, true);
      }
    }
    if (now >= ultimate.endAt) {
      endMuzanDemonKing(fighter, false, now);
    }
  }

  function endMuzanDemonKing(fighter, interrupted = false, now = getBattleNow()) {
    if (!fighter || !fighter.muzanUltimate) return;
    const ultimate = fighter.muzanUltimate;
    if (!interrupted && ultimate.active) {
      resolveMuzanUltimateFinale(fighter, ultimate.skill || {}, now);
    }
    (ultimate.effects || []).forEach((effect) => {
      if (!effect) return;
      if (!interrupted) {
        effect.classList.add("muzan-ending");
        scheduleTimeout(() => removeElement(effect), 420);
      } else {
        removeElement(effect);
      }
    });
    fighter.muzanUltimate = null;
    const element = getFighterElement(fighter);
    if (element) element.classList.remove("muzan-ultimate-active");
    releaseUltimateLock(fighter, ultimate.skill || { type: "muzanDemonKing", isUltimate: true });
    if (!interrupted && game.phase === "running" && !fighter.dead) {
      const skillIndex = fighter.skills.findIndex((skill) => skill.type === "muzanDemonKing");
      if (skillIndex >= 0) fighter.nextSkillAt[skillIndex] = now + getEffectiveSkillCooldown(fighter, fighter.skills[skillIndex]);
      startSkillRecovery(fighter, ultimate.skill || fighter.skills[skillIndex], now);
    }
  }

  function resolveMuzanUltimateFinale(fighter, skill, now) {
    getMuzanTargets(fighter).forEach((target) => {
      const stacks = getMuzanBloodCount(target, fighter);
      if (stacks <= 0) return;
      const damage = (Number(skill.endBaseDamage) || 10) + stacks * (Number(skill.endDamagePerStack) || 4);
      const actual = applyDamage(fighter, target, {
        label: "귀왕 해방 폭발",
        baseDamage: damage,
        ignoreDefense: true,
        attackId: `muzan-ultimate-finale-${fighter.id}-${target.id}`,
        hitId: target.id,
        muzanSkillHit: false,
        skipMuzanBlood: true,
        damageKind: "궁극기"
      });
      const removed = removeMuzanBloodStacks(target, fighter, 999);
      const healed = healFighter(fighter, removed * (Number(skill.endHealPerStack) || 3), "귀왕 해방 흡수");
      if (healed > 0) createHealEffect(fighter, healed);
      if (actual > 0) createMuzanCollapseImpact(target, fighter);
    });
  }

  function clearMuzanSkillVisuals(state) {
    if (!state || !state.data) return;
    removeElement(state.data.warning);
    removeElement(state.data.charge);
    removeElement(state.data.title);
    (state.data.effects || []).forEach((effect) => removeElement(effect));
    state.data.warning = null;
    state.data.charge = null;
    state.data.effects = [];
  }

  function clearMuzanSkillState(fighter, state) {
    if (!state || !state.data) return;
    clearMuzanSkillVisuals(state);
    (state.data.timers || []).forEach((timer) => {
      if (timer) timer.cancelled = true;
    });
    state.data.timers = [];
  }

  function resetMuzanState(fighter, clearBlood = false) {
    if (!fighter) return;
    if (fighter.skillState && fighter.skillState.skill && isMuzanSkill(fighter.skillState.skill)) {
      clearMuzanSkillState(fighter, fighter.skillState);
    }
    endMuzanDemonKing(fighter, true, getBattleNow());
    removeElement(fighter.muzanSunriseEffect);
    fighter.muzanSunriseEffect = null;
    fighter.muzanSunriseActive = false;
    fighter.muzanSunriseNextAt = 0;
    fighter.muzanFatalRegen = null;
    fighter.muzanLastPassiveAt = 0;
    fighter.muzanNeuralUntil = 0;
    const element = fighter.side ? getFighterElement(fighter) : null;
    if (element) element.classList.remove("muzan-ultimate-active", "muzan-fatal-regenerating");
    if (clearBlood) {
      Object.values(game.fighters).forEach((target) => clearAllMuzanBloodRecords(target));
      game.summons.forEach((summon) => clearAllMuzanBloodRecords(summon));
    }
  }

  function createMuzanHitEffect(target, angle = 0) {
    const effect = createCircleEffect(target.x, target.y, target.radius * 0.95, "muzan-hit-spark");
    effect.style.setProperty("--hit-angle", `${angle}rad`);
    scheduleTimeout(() => removeElement(effect), 260);
  }

  function createMuzanWhipImpact(target, angle = 0) {
    const shock = createCircleEffect(target.x, target.y, target.radius * 1.28, "muzan-whip-impact");
    shock.style.setProperty("--hit-angle", `${angle}rad`);
    scheduleTimeout(() => removeElement(shock), 380);
    const debris = createCircleEffect(target.x, target.y + target.radius * 0.28, target.radius * 1.05, "muzan-whip-debris");
    scheduleTimeout(() => removeElement(debris), 560);
  }

  function createMuzanNeuralHitEffect(target) {
    const effect = createCircleEffect(target.x, target.y, target.radius * 1.12, "muzan-neural-hit");
    scheduleTimeout(() => removeElement(effect), 520);
  }

  function createMuzanCollapseImpact(target, fighter) {
    const ring = createCircleEffect(target.x, target.y, target.radius * 1.55, "muzan-collapse-impact");
    const drain = createMuzanAbsorbStream(target.x, target.y, fighter.x, fighter.y, Math.max(4, target.radius * 0.18));
    scheduleTimeout(() => removeElement(ring), 420);
    scheduleTimeout(() => removeElement(drain), 520);
    if (els.arena) {
      els.arena.classList.add("shake");
      scheduleTimeout(() => els.arena && els.arena.classList.remove("shake"), 80);
    }
  }

  function createMuzanAbsorbStream(startX, startY, endX, endY, width) {
    const angle = Math.atan2(endY - startY, endX - startX);
    const distance = Math.hypot(endX - startX, endY - startY) || 1;
    const normalX = -Math.sin(angle);
    const normalY = Math.cos(angle);
    const points = [
      { x: startX, y: startY },
      { x: startX + Math.cos(angle) * distance * 0.28 + normalX * distance * 0.12, y: startY + Math.sin(angle) * distance * 0.28 + normalY * distance * 0.12 },
      { x: startX + Math.cos(angle) * distance * 0.72 - normalX * distance * 0.08, y: startY + Math.sin(angle) * distance * 0.72 - normalY * distance * 0.08 },
      { x: endX, y: endY }
    ];
    const svg = createMuzanWhipSvg(points, width, "absorb", false, true);
    svg.classList.add("muzan-absorb-stream");
    return svg;
  }

  function createMuzanDim() {
    const element = document.createElement("div");
    element.className = "muzan-ultimate-dim";
    els.skillLayer.appendChild(element);
    return element;
  }

  function createMuzanDemonKingField(fighter) {
    const field = document.createElement("div");
    field.className = "muzan-demon-field";
    field.innerHTML = `
      <div class="muzan-demon-eye"><span></span></div>
      <div class="muzan-demon-veins"></div>
      <div class="muzan-demon-tendrils">
        <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
      </div>
    `;
    els.skillLayer.appendChild(field);
    updateMuzanDemonKingField(field, fighter);
    return field;
  }

  function updateMuzanDemonKingField(field, fighter) {
    if (!field || !fighter) return;
    field.style.setProperty("--muzan-x", `${fighter.x}px`);
    field.style.setProperty("--muzan-y", `${fighter.y}px`);
    field.style.setProperty("--muzan-r", `${fighter.radius}px`);
  }

  function createMuzanTitle(line1, line2 = "") {
    const element = document.createElement("div");
    element.className = "muzan-title";
    element.innerHTML = line2 ? `<span>${line1}</span><strong>${line2}</strong>` : `<strong>${line1}</strong>`;
    els.skillLayer.appendChild(element);
    scheduleTimeout(() => removeElement(element), 1200);
    return element;
  }

  function isTargetMuzanBurnedBySunrise(target) {
    return target && target.abilityType === "muzanBiology" && target.muzanSunriseActive;
  }

  function startGasterBlasterSkill(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;

    state.data.summoned = 0;
    state.data.blasters = [];
    state.data.nextSummonAt = now;
    state.data.gasterBaseAngle = Math.random() * Math.PI * 2;
    state.data.endAt = now + (Number(skill.summonCount) || 3) * (Number(skill.summonInterval) || 500) + (Number(skill.warningDuration) || 650) + (Number(skill.beamDuration) || 900) + 500;
    getFighterElement(fighter).classList.add("sans-eye");
    fighter.vx = 0;
    fighter.vy = 0;
    addLog(`${fighter.name} 가스터 블래스터 전개`, "skill");
  }

  function updateGasterBlasterSkill(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;
    const skill = state.skill;
    if (isFighterOutOfBattle(opponent)) {
      state.data.blasters.forEach((blaster) => removeGasterBlaster(blaster));
      state.data.blasters = [];
      getFighterElement(fighter).classList.remove("sans-eye");
      fighter.skillState = null;
      restoreStoredVelocity(fighter, state);
      startSkillRecovery(fighter, skill, now);
      return;
    }
    const count = Number(skill.summonCount) || 3;
    const interval = Number(skill.summonInterval) || 500;

    while (state.data.summoned < count && now >= state.data.nextSummonAt) {
      state.data.summoned += 1;
      state.data.nextSummonAt += interval;
      state.data.blasters.push(createGasterBlaster(fighter, opponent, skill, state.data.summoned - 1, now, state.data.blasters, state.data.gasterBaseAngle));
    }

    state.data.blasters.forEach((blaster) => updateGasterBlaster(fighter, opponent, skill, blaster, now));
    state.data.blasters = state.data.blasters.filter((blaster) => {
      if (now < blaster.removeAt) return true;
      removeGasterBlaster(blaster);
      return false;
    });

    if ((opponent.dead || fighter.dead || (state.data.summoned >= count && state.data.blasters.length === 0) || now >= state.data.endAt)) {
      state.data.blasters.forEach((blaster) => removeGasterBlaster(blaster));
      state.data.blasters = [];
      getFighterElement(fighter).classList.remove("sans-eye");
      fighter.skillState = null;
      restoreStoredVelocity(fighter, state);
      startSkillRecovery(fighter, skill, now);
    }
  }

  function createGasterBlaster(fighter, opponent, skill, index, now, existingBlasters = [], baseAngle = Math.random() * Math.PI * 2) {
    const spawn = getGasterSpawnPoint(opponent, index, existingBlasters, baseAngle);
    const dx = opponent.x - spawn.x;
    const dy = opponent.y - spawn.y;
    const angle = Math.atan2(dy, dx);
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const mouth = getGasterMouthPoint(spawn.x, spawn.y, dirX, dirY);
    const length = getGasterBeamLengthToArenaEdge(mouth.x, mouth.y, dirX, dirY);
    const width = clamp(fighter.radius * (Number(skill.beamWidthRate) || 1.15) * GASTER_BEAM_WIDTH_SCALE, 39, 76);
    const warningDuration = Number(skill.warningDuration) || 650;
    const beamDuration = Number(skill.beamDuration) || 900;
    const blaster = {
      attackId: `gaster-${fighter.id}-${now.toFixed(3)}-${index}-${Math.random().toString(16).slice(2)}`,
      x: spawn.x,
      y: spawn.y,
      startX: mouth.x,
      startY: mouth.y,
      dirX,
      dirY,
      angle,
      length,
      width,
      warningEndAt: now + warningDuration,
      beamEndAt: now + warningDuration + beamDuration,
      removeAt: now + warningDuration + beamDuration + 360,
      nextTickAt: now + warningDuration,
      damageDone: 0,
      damageDoneByTarget: new Map(),
      hitIndex: 0,
      fired: false,
      element: createGasterBlasterElement(spawn.x, spawn.y, angle),
      warning: createGasterLine(mouth.x, mouth.y, angle, length, width, "gaster-warning"),
      beam: createGasterLine(mouth.x, mouth.y, angle, length, width, "gaster-beam")
    };
    blaster.beam.hidden = true;
    return blaster;
  }

  function getGasterSpawnPoint(target, index, existingBlasters = [], baseAngle = Math.random() * Math.PI * 2) {
    const bodyRadius = getGasterBodyRadius();
    const margin = bodyRadius + 4;
    const distance = clamp(game.arenaSize * 0.31, target.radius * 4.8 + bodyRadius, game.arenaSize * 0.44);
    for (let i = 0; i < 24; i += 1) {
      const directionStep = i === 0 ? 0 : Math.ceil(i / 2) * 0.24 * (i % 2 === 0 ? -1 : 1);
      const radiusStep = Math.floor(i / 6) * bodyRadius * 0.32;
      const angle = baseAngle + index * (Math.PI * 2 / 3) + directionStep;
      const x = clamp(target.x + Math.cos(angle) * (distance + radiusStep), margin, game.arenaSize - margin);
      const y = clamp(target.y + Math.sin(angle) * (distance + radiusStep), margin, game.arenaSize - margin);
      if (isGasterSpawnSafe(x, y, target, existingBlasters, bodyRadius)) return { x, y };
    }
    return {
      x: clamp(target.x + distance, margin, game.arenaSize - margin),
      y: clamp(target.y, margin, game.arenaSize - margin)
    };
  }

  function isGasterSpawnSafe(x, y, target, existingBlasters, bodyRadius) {
    const bodies = Object.values(game.fighters).concat(game.summons);
    const clearOfBodies = bodies.every((body) => {
      if (!body || body.dead || body.removing || isFighterOutOfBattle(body)) return true;
      const required = body === target ? body.radius + bodyRadius * 0.72 : body.radius + bodyRadius * 0.42;
      return Math.hypot(x - body.x, y - body.y) >= required;
    });
    if (!clearOfBodies) return false;

    const clearOfBlasters = existingBlasters.every((blaster) => {
      if (!blaster) return true;
      return Math.hypot(x - blaster.x, y - blaster.y) >= bodyRadius * 1.55;
    });
    if (!clearOfBlasters) return false;

    return game.arenaObjects.every((object) => {
      if (object.type !== "circleWall") return true;
      return Math.abs(Math.hypot(x - object.x, y - object.y) - object.radius) >= bodyRadius;
    });
  }

  function getGasterBodyRadius() {
    return Math.hypot(GASTER_BODY_WIDTH, GASTER_BODY_HEIGHT) / 2;
  }

  function getGasterMouthPoint(x, y, dirX, dirY) {
    return {
      x: x + dirX * GASTER_MOUTH_OFFSET,
      y: y + dirY * GASTER_MOUTH_OFFSET
    };
  }

  function getGasterBeamLengthToArenaEdge(x, y, dirX, dirY) {
    const distances = [];
    if (Math.abs(dirX) > 0.001) {
      distances.push(((dirX > 0 ? game.arenaSize : 0) - x) / dirX);
    }
    if (Math.abs(dirY) > 0.001) {
      distances.push(((dirY > 0 ? game.arenaSize : 0) - y) / dirY);
    }
    const positiveDistances = distances.filter((distance) => distance > 0);
    const edgeDistance = positiveDistances.length ? Math.min(...positiveDistances) : game.arenaSize;
    return Math.max(game.arenaSize * 0.25, edgeDistance + GASTER_BODY_WIDTH * 0.18);
  }

  function createGasterBlasterElement(x, y, angle, scale = 1) {
    const element = document.createElement("div");
    element.className = "gaster-blaster";
    element.dataset.scale = String(scale);
    element.innerHTML = [
      '<span class="gb-horn top"></span>',
      '<span class="gb-horn bottom"></span>',
      '<span class="gb-eye left"></span>',
      '<span class="gb-eye right"></span>',
      '<span class="gb-nose"></span>',
      '<span class="gb-mouth"></span>',
      '<span class="gb-energy"></span>'
    ].join("");
    els.skillLayer.appendChild(element);
    updateGasterElement(element, x, y, angle, scale);
    return element;
  }

  function updateGasterElement(element, x, y, angle, scale = null) {
    if (!element) return;
    const requestedScale = scale === null || typeof scale === "undefined"
      ? Number(element.dataset.scale)
      : Number(scale);
    const visualScale = Number.isFinite(requestedScale) && requestedScale > 0 ? requestedScale : 1;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.transform = `translate(-50%, -50%) rotate(${angle}rad) scale(${visualScale})`;
  }

  function createGasterLine(x, y, angle, length, width, className) {
    const element = document.createElement("div");
    element.className = `arena-line-effect ${className}`;
    els.skillLayer.appendChild(element);
    updateGasterLine(element, x, y, angle, length, width);
    return element;
  }

  function updateGasterLine(element, x, y, angle, length, width) {
    if (!element) return;
    const centerX = x + Math.cos(angle) * (length / 2);
    const centerY = y + Math.sin(angle) * (length / 2);
    element.style.width = `${length}px`;
    element.style.height = `${width}px`;
    element.style.left = `${centerX}px`;
    element.style.top = `${centerY}px`;
    element.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
  }

  function updateGasterBlaster(fighter, target, skill, blaster, now) {
    updateGasterElement(blaster.element, blaster.x, blaster.y, blaster.angle);
    updateGasterLine(blaster.warning, blaster.startX, blaster.startY, blaster.angle, blaster.length, blaster.width);
    updateGasterLine(blaster.beam, blaster.startX, blaster.startY, blaster.angle, blaster.length, blaster.width);

    if (!blaster.fired && now >= blaster.warningEndAt) {
      blaster.fired = true;
      blaster.element.classList.add("firing");
      removeElement(blaster.warning);
      blaster.warning = null;
      blaster.beam.hidden = false;
      pulseArena();
    }

    if (blaster.fired && now <= blaster.beamEndAt) {
      const targets = getGasterBeamTargets(fighter, target, now);
      targets.forEach((beamTarget) => {
        syncSansDodgeAttackContact(beamTarget, blaster.attackId, isTargetInBeam(beamTarget, blaster));
      });
      const tickInterval = Number(skill.tickInterval) || 150;
      while (now >= blaster.nextTickAt && blaster.nextTickAt < blaster.beamEndAt) {
        blaster.nextTickAt += tickInterval;
        blaster.hitIndex += 1;
        targets.forEach((beamTarget) => {
          if (isTargetInBeam(beamTarget, blaster)) {
            damageGasterBeamTarget(fighter, beamTarget, skill, blaster, blaster.attackId, `tick-${blaster.hitIndex}`, Number(skill.maxBeamDamage) || 15);
          }
        });
      }
    }

    if (now > blaster.beamEndAt) {
      syncSansDodgeAttackContact(target, blaster.attackId, false);
      getEnemySummons(fighter.side).forEach((summon) => syncSansDodgeAttackContact(summon, blaster.attackId, false));
      blaster.element.classList.add("fading");
      if (blaster.beam) blaster.beam.classList.add("fading");
    }
  }

  function getGasterBeamTargets(fighter, mainTarget, now = getBattleNow()) {
    const targets = [];
    if (mainTarget && !mainTarget.dead && !isFighterOutOfBattle(mainTarget)) {
      targets.push(mainTarget);
    }
    game.summons.forEach((summon) => {
      if (
        summon &&
        summon.side !== fighter.side &&
        summon.ownerId !== fighter.id &&
        !summon.dead &&
        !summon.removing &&
        summon.bornAt < now
      ) {
        targets.push(summon);
      }
    });
    return targets;
  }

  function damageGasterBeamTarget(fighter, target, skill, carrier, attackId, hitId, maxDamage) {
    if (!target || target.dead || target.removing) return 0;
    if (!carrier.damageDoneByTarget) {
      carrier.damageDoneByTarget = new Map();
    }
    const targetKey = target.id || `${target.side || "target"}-${target.name || ""}`;
    const currentDamage = carrier.damageDoneByTarget.get(targetKey) || 0;
    if (currentDamage >= maxDamage) return 0;
    const damage = Math.min(Number(skill.beamDamage) || 3, maxDamage - currentDamage);
    const actualDamage = applyDamage(fighter, target, {
      label: skill.name,
      baseDamage: damage,
      ignoreDefense: true,
      attackId: `${attackId}:${targetKey}`,
      hitId
    });
    carrier.damageDoneByTarget.set(targetKey, currentDamage + damage);
    if (actualDamage > 0) {
      createDamageNumber(target, actualDamage);
    }
    if (target.isOiiaClone && (target.dead || target.currentHp <= 0)) {
      startOiiaSummonRemoval(target, "zero", getBattleNow());
    }
    return actualDamage;
  }

  function isTargetInBeam(target, blaster) {
    if (!target || target.dead || isFighterOutOfBattle(target)) return false;
    const dx = target.x - blaster.startX;
    const dy = target.y - blaster.startY;
    const forward = dx * blaster.dirX + dy * blaster.dirY;
    const side = Math.abs(dx * -blaster.dirY + dy * blaster.dirX);
    return forward >= 0 && forward <= blaster.length && side <= blaster.width / 2 + target.radius * 0.45;
  }

  function removeGasterBlaster(blaster) {
    if (!blaster) return;
    removeElement(blaster.element);
    removeElement(blaster.warning);
    removeElement(blaster.beam);
    blaster.element = null;
    blaster.warning = null;
    blaster.beam = null;
  }

  function startWorldEnder(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;

    const duration = Number(skill.duration) || 7000;
    const recovery = Number(skill.recovery) || 900;
    const originalSizeMultiplier = fighter.sizeMultiplier || 1;
    fighter.aatroxUltimate = {
      active: true,
      skill,
      endAt: now + duration,
      recovery,
      originalAtk: fighter.atk,
      originalSpeedMultiplier: fighter.speedMultiplier || 1,
      originalHealMultiplier: fighter.healMultiplier || 1,
      originalSizeMultiplier,
      effects: []
    };

    fighter.sizeMultiplier = originalSizeMultiplier * (Number(skill.sizeMultiplier) || 1.12);
    fighter.radius = fighter.baseRadius * fighter.sizeMultiplier;
    keepInsideArena(fighter);
    fighter.speedMultiplier = (fighter.speedMultiplier || 1) * (Number(skill.speedMultiplier) || 1.35);
    fighter.atk = fighter.atk * (Number(skill.atkMultiplier) || 1.35);
    fighter.healMultiplier = (fighter.healMultiplier || 1) * (Number(skill.healMultiplier) || 1.7);
    accelerateDarkinBladeCooldown(fighter, now, Number(skill.bladeCooldownSpeed) || 1.3);

    const effects = fighter.aatroxUltimate.effects;
    effects.push(createAatroxUltimateDim());
    effects.push(createAatroxWings(fighter));
    effects.push(createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.55, "aatrox-world-aura"));
    createAatroxUltimateShockwave(fighter, opponent, skill, now);
    getFighterElement(fighter).classList.remove("casting");
    getFighterElement(fighter).classList.add("aatrox-ultimate");
    updateStats(fighter.side, fighter);
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
    addLog(`${fighter.name} 세계의 종결자`, "skill");
  }

  function updateWorldEnderState(fighter, now) {
    if (!fighter || !fighter.aatroxUltimate || !fighter.aatroxUltimate.active) return;
    const state = fighter.aatroxUltimate;
    updateAatroxUltimateEffects(fighter);
    if (fighter.dead || game.phase !== "running") {
      endWorldEnder(fighter, true, now);
      return;
    }
    if (now >= state.endAt) {
      endWorldEnder(fighter, false, now);
    }
  }

  function endWorldEnder(fighter, interrupted = false, now = getBattleNow()) {
    if (!fighter || !fighter.aatroxUltimate) return;
    const state = fighter.aatroxUltimate;
    const skill = state.skill;
    fighter.atk = state.originalAtk;
    fighter.speedMultiplier = state.originalSpeedMultiplier;
    fighter.healMultiplier = state.originalHealMultiplier;
    fighter.sizeMultiplier = state.originalSizeMultiplier;
    fighter.radius = fighter.baseRadius * (fighter.sizeMultiplier || 1);
    keepInsideArena(fighter);
    normalizeVelocity(fighter, getPixelSpeed(fighter));
    getFighterElement(fighter).classList.remove("aatrox-ultimate");

    if (state.effects) {
      state.effects.forEach((effect) => {
        if (!effect) return;
        if (interrupted) {
          removeElement(effect);
        } else {
          effect.classList.add("fading");
          scheduleTimeout(() => removeElement(effect), 520);
        }
      });
    }
    fighter.aatroxUltimate = null;
    updateStats(fighter.side, fighter);

    if (interrupted || game.phase !== "running" || fighter.dead) {
      releaseUltimateLock(fighter, skill);
      return;
    }

    startSkillRecovery(fighter, skill, now);
  }

  function accelerateDarkinBladeCooldown(fighter, now, speedRate) {
    const index = fighter.skills.findIndex((skill) => skill.type === "darkinBlade");
    if (index < 0) return;
    const readyAt = fighter.nextSkillAt[index] || 0;
    const remaining = readyAt - now;
    if (remaining > 0) {
      fighter.nextSkillAt[index] = now + remaining / Math.max(1, speedRate);
    }
  }

  function createAatroxUltimateShockwave(fighter, opponent, skill, now) {
    const radius = fighter.radius * (Number(skill.shockwaveRadiusRate) || 3.1);
    const shockwave = createCircleEffect(fighter.x, fighter.y, radius, "aatrox-world-shockwave");
    scheduleTimeout(() => removeElement(shockwave), 520);
    pulseArena();
    getAatroxTargets(fighter, opponent).forEach((target) => {
      if (!isPointInCircle(target.x, target.y, fighter.x, fighter.y, radius + target.radius * 0.35)) return;
      knockbackEntity(fighter, target, fighter.radius * 0.55);
      applySlowEffect(target, Number(skill.shockwaveSlowRate) || 0.2, Number(skill.shockwaveSlowDuration) || 1000, now);
    });
  }

  function createAatroxUltimateDim() {
    const element = document.createElement("div");
    element.className = "aatrox-ultimate-dim";
    els.skillLayer.appendChild(element);
    scheduleTimeout(() => element.classList.add("brief"), 420);
    return element;
  }

  function createAatroxWings(fighter) {
    const element = document.createElement("div");
    element.className = "aatrox-wings";
    const left = document.createElement("span");
    left.className = "wing left";
    const right = document.createElement("span");
    right.className = "wing right";
    element.append(left, right);
    for (let i = 0; i < 14; i += 1) {
      const feather = document.createElement("i");
      feather.style.left = `${20 + Math.random() * 60}%`;
      feather.style.top = `${10 + Math.random() * 70}%`;
      feather.style.animationDelay = `${Math.random() * 700}ms`;
      element.appendChild(feather);
    }
    els.skillLayer.appendChild(element);
    updateAatroxWingPosition(element, fighter);
    return element;
  }

  function updateAatroxUltimateEffects(fighter) {
    const state = fighter.aatroxUltimate;
    if (!state || !state.effects) return;
    state.effects.forEach((effect) => {
      if (!effect) return;
      if (effect.classList.contains("aatrox-wings")) {
        updateAatroxWingPosition(effect, fighter);
      }
      if (effect.classList.contains("aatrox-world-aura")) {
        updateCircleEffect(effect, fighter.x, fighter.y, fighter.radius * 1.55);
      }
    });
  }

  function updateAatroxWingPosition(element, fighter) {
    element.style.left = `${fighter.x}px`;
    element.style.top = `${fighter.y}px`;
    const scale = fighter.radius / Math.max(1, game.fighterBaseRadius);
    element.style.transform = `translate(-50%, -58%) scale(${scale})`;
  }

  function updateChillGuyState(fighter, now) {
    if (!fighter || fighter.abilityType !== "chillSun") return;
    if (fighter.dead || game.phase !== "running") {
      resetChillGuyState(fighter);
      return;
    }

    ensureChillSun(fighter, now);
    updateChillSunVisual(fighter);
    updateChillShield(fighter, now);

    if (!fighter.chillTransformed && fighter.currentHp <= fighter.maxHp * 0.3) {
      triggerChillTransformation(fighter, now);
    }

    if (now >= (fighter.chillNextSunTickAt || 0)) {
      fireChillSunWave(fighter, now);
    }
  }

  function ensureChillSun(fighter, now) {
    if (!fighter.chillSun) {
      const element = document.createElement("div");
      element.className = "chill-sun";
      element.innerHTML = '<span class="chill-sun-core"></span><span class="chill-sun-rays"></span>';
      els.skillLayer.appendChild(element);
      fighter.chillSun = { element };
    }
    fighter.chillNextSunTickAt = fighter.chillNextSunTickAt || now + getChillSunInterval(fighter);
  }

  function updateChillSunVisual(fighter) {
    if (!fighter.chillSun || !fighter.chillSun.element) return;
    const size = clamp(game.arenaSize * 0.18, 78, 120);
    const element = fighter.chillSun.element;
    element.classList.toggle("transformed", !!fighter.chillTransformed);
    element.style.left = `${game.arenaSize / 2}px`;
    element.style.top = `${game.arenaSize / 2}px`;
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
  }

  function getChillSunInterval(fighter) {
    return fighter && fighter.chillTransformed ? 700 : 1000;
  }

  function getChillSunDamage(fighter) {
    return fighter && fighter.chillTransformed ? 2 : 1;
  }

  function fireChillSunWave(fighter, now) {
    if (!fighter || fighter.dead) return;
    fighter.chillSunWaveIndex += 1;
    const damage = getChillSunDamage(fighter);
    const attackId = `chill-sun-${fighter.id}-${fighter.chillSunWaveIndex}`;
    createChillSunWave(fighter);

    const targets = getChillSunTargets(fighter).slice();
    targets.forEach((target) => {
      if (!target || target.dead || target.removing || isFighterOutOfBattle(target)) return;
      applyDamage(fighter, target, {
        label: "태양",
        fixedDamage: damage,
        ignoreDefense: true,
        attackId: `${attackId}:${target.id}`,
        hitId: "pulse"
      });
    });

    fighter.chillNextSunTickAt = now + getChillSunInterval(fighter);
  }

  function getChillSunTargets(fighter) {
    const enemySide = fighter.side === "A" ? "B" : "A";
    const targets = [];
    const opponent = game.fighters[enemySide];
    if (opponent && !opponent.dead && !isFighterOutOfBattle(opponent)) {
      targets.push(opponent);
    }
    game.summons.forEach((summon) => {
      if (
        summon &&
        summon.side !== fighter.side &&
        summon.ownerId !== fighter.id &&
        !summon.dead &&
        !summon.removing
      ) {
        targets.push(summon);
      }
    });
    return targets;
  }

  function createChillSunWave(fighter) {
    const className = fighter.chillTransformed ? "chill-sun-wave transformed" : "chill-sun-wave";
    const wave = createCircleEffect(game.arenaSize / 2, game.arenaSize / 2, game.arenaSize * 0.5, className);
    scheduleTimeout(() => removeElement(wave), 620);
  }

  function updateChillShield(fighter, now) {
    const active = isChillShieldActive(fighter, now);
    if (!active && now >= (fighter.chillNextShieldAt || 0)) {
      startChillShield(fighter, now);
    }

    if (isChillShieldActive(fighter, now)) {
      updateChillShieldVisual(fighter);
      return;
    }

    if (fighter.chillShieldEffect && !fighter.chillShieldFading) {
      endChillShieldVisual(fighter);
    }
  }

  function startChillShield(fighter, now) {
    const duration = fighter.chillTransformed ? 3000 : 2000;
    fighter.chillShieldUntil = now + duration;
    fighter.chillNextShieldAt = now + 10000;
    fighter.chillShieldFading = false;
    getFighterElement(fighter).classList.add("chill-shielded");
    updateChillShieldVisual(fighter);
    addLog(`${fighter.name} 느긋한 보호막`, "skill");
  }

  function updateChillShieldVisual(fighter) {
    if (!fighter.chillShieldEffect) {
      fighter.chillShieldEffect = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.34, getChillShieldClass(fighter));
    }
    fighter.chillShieldEffect.className = `arena-circle-effect ${getChillShieldClass(fighter)}`;
    updateCircleEffect(fighter.chillShieldEffect, fighter.x, fighter.y, fighter.radius * 1.34);
  }

  function getChillShieldClass(fighter) {
    return fighter.chillTransformed ? "chill-shield transformed" : "chill-shield";
  }

  function endChillShieldVisual(fighter) {
    if (!fighter.chillShieldEffect) return;
    fighter.chillShieldFading = true;
    fighter.chillShieldEffect.classList.add("fading");
    getFighterElement(fighter).classList.remove("chill-shielded");
    const effect = fighter.chillShieldEffect;
    scheduleTimeout(() => {
      removeElement(effect);
      if (fighter.chillShieldEffect === effect) {
        fighter.chillShieldEffect = null;
        fighter.chillShieldFading = false;
      }
    }, 280);
  }

  function isChillShieldActive(fighter, now = getBattleNow()) {
    return !!(
      fighter &&
      fighter.abilityType === "chillSun" &&
      !fighter.dead &&
      !isPassiveSuppressedByConcept(fighter, now) &&
      fighter.chillShieldUntil &&
      now < fighter.chillShieldUntil
    );
  }

  function createChillShieldBlock(fighter) {
    if (!fighter) return;
    const block = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.52, fighter.chillTransformed ? "chill-shield-block transformed" : "chill-shield-block");
    scheduleTimeout(() => removeElement(block), 320);
  }

  function triggerChillTransformation(fighter, now) {
    fighter.chillTransformed = true;
    fighter.chillNextSunTickAt = now + getChillSunInterval(fighter);
    if (isChillShieldActive(fighter, now)) {
      fighter.chillShieldUntil = Math.max(fighter.chillShieldUntil, now + 3000);
      updateChillShieldVisual(fighter);
    }
    getFighterElement(fighter).classList.add("chill-transformed");
    updateChillSunVisual(fighter);
    createChillTransformEffects(fighter);
    addLog(`${fighter.name} 돌변!`, "bad");
    updateStats(fighter.side, fighter);
  }

  function createChillTransformEffects(fighter) {
    const dim = document.createElement("div");
    dim.className = "chill-transform-dim";
    els.skillLayer.appendChild(dim);
    scheduleTimeout(() => removeElement(dim), 520);

    const burst = createCircleEffect(fighter.x, fighter.y, fighter.radius * 2.35, "chill-transform-burst");
    for (let i = 0; i < 14; i += 1) {
      const particle = document.createElement("span");
      particle.className = i % 3 === 0 ? "chill-smoke" : "chill-lightning";
      const angle = Math.random() * Math.PI * 2;
      const distance = fighter.radius * (1 + Math.random() * 1.25);
      particle.style.left = `${fighter.radius * 2.35 + Math.cos(angle) * distance}px`;
      particle.style.top = `${fighter.radius * 2.35 + Math.sin(angle) * distance}px`;
      particle.style.setProperty("--dx", `${Math.cos(angle) * 46}px`);
      particle.style.setProperty("--dy", `${Math.sin(angle) * 46}px`);
      burst.appendChild(particle);
    }
    scheduleTimeout(() => removeElement(burst), 700);
    createChillSunWave(fighter);
    pulseArena();
  }

  function resetChillGuyState(fighter) {
    if (!fighter) return;
    removeElement(fighter.chillSun && fighter.chillSun.element);
    removeElement(fighter.chillShieldEffect);
    fighter.chillSun = null;
    fighter.chillNextSunTickAt = 0;
    fighter.chillSunWaveIndex = 0;
    fighter.chillShieldUntil = 0;
    fighter.chillNextShieldAt = 0;
    fighter.chillShieldEffect = null;
    fighter.chillShieldFading = false;
    fighter.chillTransformed = false;
    const element = getFighterElement(fighter);
    if (element) {
      element.classList.remove("chill-shielded", "chill-transformed");
    }
  }

  function isBlueEyesFighter(fighter) {
    return !!(fighter && fighter.abilityType === "blueEyesFusion");
  }

  function isBlueEyesSkill(skill) {
    return !!(skill && (
      skill.type === "blueEyesBurstStream" ||
      skill.type === "blueEyesUltimateBurst" ||
      skill.type === "blueEyesTripleHyperBurst" ||
      skill.type === "blueEyesWrathDestruction" ||
      skill.type === "blueEyesTripleBurstStream" ||
      skill.type === "blueEyesChaosDimension" ||
      skill.type === "blueEyesNeutronBlast"
    ));
  }

  function isFighterStunned(fighter, now = getBattleNow()) {
    return !!(fighter && fighter.stunUntil && now < fighter.stunUntil);
  }

  function updateStunState(fighter, now) {
    if (!fighter || fighter.dead) return;
    const element = getFighterElement(fighter);
    if (isFighterStunned(fighter, now)) {
      fighter.vx = 0;
      fighter.vy = 0;
      if (element) element.classList.add("stunned");
      return;
    }
    if (fighter.storedStunVelocity) {
      fighter.vx = fighter.storedStunVelocity.vx;
      fighter.vy = fighter.storedStunVelocity.vy;
      fighter.storedStunVelocity = null;
      normalizeVelocity(fighter, getPixelSpeed(fighter));
    }
    if (element) element.classList.remove("stunned");
  }

  function applyStunEffect(target, duration, now = getBattleNow()) {
    if (!target || target.dead || target.maugaUnstoppable) return false;
    if (tryGojoInfinityBlockStatus(target, "기절", now)) return false;
    const baseDuration = Math.max(0, Number(duration) || 0);
    const finalDuration = target.abilityType === "himCharm" ? baseDuration * (1 - HIM_STATUS_RESISTANCE) : baseDuration;
    if (!isFighterStunned(target, now)) {
      target.storedStunVelocity = { vx: target.vx, vy: target.vy };
    }
    target.stunUntil = Math.max(target.stunUntil || 0, now + finalDuration);
    target.vx = 0;
    target.vy = 0;
    const element = getFighterElement(target);
    if (element) element.classList.add("stunned");
    const mark = createCircleEffect(target.x, target.y - target.radius * 0.9, target.radius * 0.72, "blue-eyes-stun-mark");
    scheduleTimeout(() => removeElement(mark), 760);
    addLog(`${target.name} 기절`, "skill");
    return true;
  }

  function getBlueEyesSkillName(skill) {
    const labels = {
      blueEyesTripleBurstStream: "트리플 버스트 스트림",
      blueEyesChaosDimension: "카오스 디멘션",
      blueEyesNeutronBlast: "뉴트론 블라스트"
    };
    return (skill && labels[skill.type]) || (skill && skill.name) || "푸른눈 스킬";
  }

  function clearBlueEyesStunVisual(target, visual) {
    if (!visual) return;
    removeElement(visual.ring);
    removeElement(visual.text);
    const element = getEntityElement(target) || getFighterElement(target);
    if (element) element.classList.remove("blue-eyes-stunned");
    if (target && target.blueEyesStunVisual === visual) target.blueEyesStunVisual = null;
  }

  function updateBlueEyesStunVisualPosition(target, visual) {
    if (!target || !visual) return;
    const ringTop = target.y - target.radius * 1.2;
    if (visual.ring) {
      visual.ring.style.left = `${target.x}px`;
      visual.ring.style.top = `${ringTop}px`;
      visual.ring.style.width = `${target.radius * 1.42}px`;
      visual.ring.style.height = `${target.radius * 0.54}px`;
    }
    if (visual.text) {
      visual.text.style.left = `${target.x}px`;
      visual.text.style.top = `${ringTop - target.radius * 0.56}px`;
    }
  }

  function createBlueEyesStunVisual(target, duration, now = getBattleNow()) {
    if (!target || !els.skillLayer) return null;
    if (target.blueEyesStunVisual) clearBlueEyesStunVisual(target, target.blueEyesStunVisual);
    const element = getEntityElement(target) || getFighterElement(target);
    if (element) element.classList.add("blue-eyes-stunned");
    const ring = document.createElement("div");
    ring.className = "blue-eyes-stun-orbit";
    ring.innerHTML = "<span></span><i></i><b></b>";
    const text = document.createElement("div");
    text.className = "blue-eyes-stun-text";
    text.textContent = "기절";
    els.skillLayer.append(ring, text);
    const visual = {
      ring,
      text,
      until: now + Math.max(0, Number(duration) || 0)
    };
    target.blueEyesStunVisual = visual;
    updateBlueEyesStunVisualPosition(target, visual);
    const tick = () => {
      if (!target || target.dead || target.blueEyesStunVisual !== visual || getBattleNow() >= visual.until) {
        clearBlueEyesStunVisual(target, visual);
        return;
      }
      updateBlueEyesStunVisualPosition(target, visual);
      scheduleTimeout(tick, 80);
    };
    scheduleTimeout(tick, 80);
    return visual;
  }

  function applyBlueEyesStun(fighter, target, duration, now = getBattleNow(), stunKey = "") {
    if (!target || target.dead) return false;
    if (stunKey) {
      target.blueEyesStunKeys = target.blueEyesStunKeys || new Set();
      if (target.blueEyesStunKeys.has(stunKey)) return false;
      target.blueEyesStunKeys.add(stunKey);
      scheduleTimeout(() => {
        if (target && target.blueEyesStunKeys) target.blueEyesStunKeys.delete(stunKey);
      }, Math.max(500, (Number(duration) || 0) + 1200));
    }
    const didStun = applyStunEffect(target, duration, now);
    if (didStun) createBlueEyesStunVisual(target, duration, now);
    return didStun;
  }

  function updateBlueEyesState(fighter, now) {
    if (!fighter) return;
    expireBlueEyesStolenBuffs(fighter, now);
    const element = isBlueEyesFighter(fighter) ? getFighterElement(fighter) : null;
    if (element) {
      element.classList.toggle("blue-eyes-evolved", !!fighter.blueEyesEvolved);
      element.classList.toggle("blue-eyes-invulnerable", isBlueEyesInvulnerable(fighter, now));
    }
    if (!isBlueEyesFighter(fighter) || fighter.dead) return;
    if (game.phase === "running" && !game.battleEnding && !fighter.blueEyesEvolved && !fighter.blueEyesEvolutionUsed) {
      tryBlueEyesLowHpEvolution(fighter, {}, Number(fighter.currentHp) || 0, now);
    }
    updateBlueEyesInvulnerableShield(fighter, now);
    updateBlueEyesFusionVisual(fighter);
  }

  function clearBlueEyesVisualState(fighter) {
    if (!fighter) return;
    clearBlueEyesChaosField(fighter);
    removeElement(fighter.blueEyesFusionRing);
    fighter.blueEyesFusionRing = null;
    (fighter.blueEyesVisualEffects || []).forEach((effect) => removeElement(effect));
    fighter.blueEyesVisualEffects = [];
    fighter.stunUntil = 0;
    fighter.storedStunVelocity = null;
    fighter.blueEyesInvulnerableUntil = 0;
    fighter.blueEyesAttackHasteUntil = 0;
    fighter.blueEyesStolenBuffs = [];
    fighter.blueEyesStolenSpeedMultiplier = 1;
    fighter.blueEyesStolenDamageReduction = 0;
    fighter.blueEyesStolenHealMultiplier = 1;
    fighter.blueEyesBlindUntil = 0;
    fighter.blueEyesBurnUntil = 0;
    fighter.blueEyesBurnNextAt = 0;
    fighter.blueEyesBurnDamage = 0;
    fighter.blueEyesBurnInterval = 0;
    fighter.blueEyesBurnOwnerId = "";
    fighter.blueEyesVisualToken = null;
    fighter.blueEyesLastShieldSparkAt = -Infinity;
    if (fighter.blueEyesStunVisual) clearBlueEyesStunVisual(fighter, fighter.blueEyesStunVisual);
    fighter.blueEyesStunKeys = null;
    removeElement(fighter.blueEyesStatusEffect);
    fighter.blueEyesStatusEffect = null;
    removeElement(fighter.blueEyesInvulnerableShield);
    fighter.blueEyesInvulnerableShield = null;
    const element = getFighterElement(fighter);
    if (element) {
      element.classList.remove("stunned", "blue-eyes-stunned", "blue-eyes-invulnerable", "blue-eyes-evolved", "blue-eyes-blinded", "blue-eyes-burning", "blue-eyes-neutron-lifting", "blue-eyes-roaring");
    }
  }

  function grantBlueEyesFusionStack(fighter, now) {
    if (!isBlueEyesFighter(fighter) || fighter.blueEyesEvolved || fighter.blueEyesEvolutionUsed || fighter.dead || game.phase !== "running") return;
    const maxStacks = fighter.blueEyesFusionMaxStacks || 3;
    const before = fighter.blueEyesFusionStacks || 0;
    const next = Math.min(maxStacks, before + 1);
    if (next === before) return;
    fighter.blueEyesFusionStacks = next;
    updateBlueEyesFusionVisual(fighter);
    createBlueEyesStackNumber(fighter, next, maxStacks);
    addLog(`${fighter.name} 궁극융합 스택 ${next}/${maxStacks}`, "skill");
    if (next >= maxStacks) {
      triggerBlueEyesEvolution(fighter, `궁극융합 ${maxStacks}스택`, now);
    }
  }

  function triggerBlueEyesEvolution(fighter, reason, now = getBattleNow(), pendingCurrentHp = null) {
    if (!isBlueEyesFighter(fighter) || fighter.blueEyesEvolved || fighter.blueEyesEvolutionUsed) return false;
    const preservedMaxHp = Math.max(1, Number(fighter.maxHp) || Number(fighter.data && fighter.data.hp) || 185);
    const currentHpSource = Number.isFinite(Number(pendingCurrentHp)) ? Number(pendingCurrentHp) : Number(fighter.currentHp);
    const preservedCurrentHp = clamp(currentHpSource || 1, 1, preservedMaxHp);
    if (fighter.skillState) {
      cancelFighterSkill(fighter);
    }
    fighter.recoveryUntil = 0;
    fighter.recoverySkill = null;
    fighter.blueEyesEvolved = true;
    fighter.blueEyesEvolutionUsed = true;
    fighter.blueEyesPendingUltimate = true;
    fighter.blueEyesFusionStacks = 0;
    removeElement(fighter.blueEyesFusionRing);
    fighter.blueEyesFusionRing = null;

    const stats = fighter.evolvedStats || {};
    fighter.name = fighter.evolvedName || "궁극의 푸른눈의 백룡";
    fighter.image = fighter.evolvedImage || fighter.image;
    fighter.maxHp = preservedMaxHp;
    fighter.currentHp = Math.min(preservedMaxHp, preservedCurrentHp + preservedMaxHp * 0.5);
    fighter.atk = Number(stats.atk) || fighter.atk;
    fighter.def = Number(stats.def) || fighter.def;
    fighter.speed = Number(stats.speed) || fighter.speed;
    fighter.skills = (fighter.evolvedSkills || []).map((skill) => ({ ...skill }));
    fighter.blueEyesInvulnerableUntil = now + 3000;
    resetBlueEyesSkillTimers(fighter, now, "blueEyesNeutronBlast");

    renderFighterFace(getFighterElement(fighter), fighter);
    renderSkillCards(fighter.side, fighter);
    updateStats(fighter.side, fighter);
    placeFighters();
    createBlueEyesEvolutionEffects(fighter, reason);
    ensureBattleLoopRunning();
    addLog(`${fighter.baseName || "푸른눈의 백룡"} → ${fighter.name} 진화! (${reason})`, "bad");
    return true;
  }

  function startBlueEyesEvolutionFreeze(duration = 120) {
    if (game.phase !== "running") return;
    game.evolutionFreezeActive = true;
    game.evolutionFreezeUntilWall = Math.max(game.evolutionFreezeUntilWall || 0, performance.now() + Math.max(90, Math.min(160, Number(duration) || 120)));
    if (els.arena) els.arena.classList.add("evolution-freeze");
    syncCombatAnimationPlayback();
    window.setTimeout(() => {
      if (game.phase !== "running") return;
      if (!game.evolutionFreezeActive) return;
      if (performance.now() < (game.evolutionFreezeUntilWall || 0)) return;
      game.evolutionFreezeActive = false;
      game.evolutionFreezeUntilWall = 0;
      if (els.arena) els.arena.classList.remove("evolution-freeze");
      syncCombatAnimationPlayback();
      ensureBattleLoopRunning();
    }, Math.max(180, Number(duration) + 80 || 220));
  }

  function resetBlueEyesSkillTimers(fighter, now, immediateType = "") {
    fighter.nextSkillAt = {};
    fighter.skills.forEach((skill, index) => {
      if (skill.type === immediateType) {
        fighter.nextSkillAt[index] = now;
        return;
      }
      const cooldown = getEffectiveSkillCooldown(fighter, skill);
      const initialCooldown = Number(skill.initialCooldown);
      fighter.nextSkillAt[index] = Number.isFinite(initialCooldown) && initialCooldown >= 0
        ? now + initialCooldown
        : now + 700 + cooldown * 0.22 * Math.random();
    });
  }

  function tryStartPendingBlueEyesUltimate(fighter, opponent, now) {
    if (!isBlueEyesFighter(fighter) || !fighter.blueEyesPendingUltimate) return false;
    const index = fighter.skills.findIndex((skill) => skill.type === "blueEyesNeutronBlast" || skill.type === "blueEyesUltimateBurst");
    if (index < 0) {
      fighter.blueEyesPendingUltimate = false;
      return false;
    }
    const skill = fighter.skills[index];
    if (isUltimateLockedByOther(fighter, skill)) return false;
    fighter.blueEyesPendingUltimate = false;
    startSkillCast(fighter, opponent, skill, index, now);
    return true;
  }

  function isBlueEyesInvulnerable(fighter, now = getBattleNow()) {
    return isBlueEyesFighter(fighter) && !isPassiveSuppressedByConcept(fighter, now) && fighter.blueEyesInvulnerableUntil && now < fighter.blueEyesInvulnerableUntil;
  }

  function hasBlueEyesAttackHaste(fighter, now = getBattleNow()) {
    return isBlueEyesFighter(fighter) && !isPassiveSuppressedByConcept(fighter, now) && fighter.blueEyesAttackHasteUntil && now < fighter.blueEyesAttackHasteUntil;
  }

  function tryBlueEyesUltimateCreature(defender, attacker, options, beforeHp, nextHp, now) {
    if (!isBlueEyesFighter(defender) || !defender.blueEyesEvolved || defender.blueEyesUltimateCreatureUsed) return false;
    if (nextHp > 0 || beforeHp > defender.maxHp * 0.2) return false;
    defender.blueEyesUltimateCreatureUsed = true;
    defender.blueEyesInvulnerableUntil = now + 1200;
    defender.blueEyesAttackHasteUntil = now + 2000;
    defender.currentHp = 1;
    createBlueEyesUltimateCreatureEffects(defender);
    addLog(`${defender.name} 강인! 무적! 최강!`, "good");
    return true;
  }

  function tryBlueEyesLowHpEvolution(defender, options, nextHp, now) {
    if (!isBlueEyesFighter(defender) || defender.blueEyesEvolved || defender.blueEyesEvolutionUsed || defender.dead) return false;
    if (options && (options.systemKill || options.finalBlowLabel || options.label === "염라참 · 황천일섬 처형")) return false;
    const maxHp = Math.max(1, Number(defender.maxHp) || Number(defender.data && defender.data.hp) || 185);
    if (nextHp > maxHp * 0.1) return false;
    return triggerBlueEyesEvolution(defender, "체력 10% 이하", now, Math.max(1, nextHp));
  }

  function updateBlueEyesFusionVisual(fighter) {
    if (!isBlueEyesFighter(fighter) || fighter.blueEyesEvolved || !(fighter.blueEyesFusionStacks > 0) || fighter.dead) {
      removeElement(fighter && fighter.blueEyesFusionRing);
      if (fighter) fighter.blueEyesFusionRing = null;
      return;
    }
    if (!fighter.blueEyesFusionRing) {
      fighter.blueEyesFusionRing = document.createElement("div");
      fighter.blueEyesFusionRing.className = "blue-eyes-fusion-ring";
      const maxStacks = fighter.blueEyesFusionMaxStacks || 3;
      for (let i = 0; i < maxStacks; i += 1) {
        const piece = document.createElement("span");
        piece.style.setProperty("--piece-rotate", `${(360 / maxStacks) * i}deg`);
        fighter.blueEyesFusionRing.appendChild(piece);
      }
      els.skillLayer.appendChild(fighter.blueEyesFusionRing);
    }
    fighter.blueEyesFusionRing.querySelectorAll("span").forEach((piece, index) => {
      piece.classList.toggle("active", index < fighter.blueEyesFusionStacks);
    });
    const size = fighter.radius * 3.1;
    fighter.blueEyesFusionRing.style.width = `${size}px`;
    fighter.blueEyesFusionRing.style.height = `${size}px`;
    fighter.blueEyesFusionRing.style.left = `${fighter.x - size / 2}px`;
    fighter.blueEyesFusionRing.style.top = `${fighter.y - size / 2}px`;
  }

  function createBlueEyesStackNumber(fighter, stack, maxStacks) {
    const text = document.createElement("div");
    text.className = "blue-eyes-stack-number";
    text.textContent = `[${stack}/${maxStacks}]`;
    text.style.left = `${fighter.x}px`;
    text.style.top = `${fighter.y - fighter.radius * 1.85}px`;
    els.skillLayer.appendChild(text);
    scheduleTimeout(() => removeElement(text), 720);
  }

  function trackBlueEyesEffect(fighter, element, duration = 900) {
    if (!element) return element;
    if (fighter) {
      if (!fighter.blueEyesVisualEffects) fighter.blueEyesVisualEffects = [];
      fighter.blueEyesVisualEffects.push(element);
    }
    scheduleTimeout(() => {
      removeElement(element);
      if (fighter && fighter.blueEyesVisualEffects) {
        fighter.blueEyesVisualEffects = fighter.blueEyesVisualEffects.filter((item) => item !== element);
      }
    }, duration);
    return element;
  }

  function clearBlueEyesTransientEffects(fighter) {
    if (!fighter) return;
    (fighter.blueEyesVisualEffects || []).forEach((effect) => removeElement(effect));
    fighter.blueEyesVisualEffects = [];
    fighter.blueEyesVisualToken = null;
  }

  function updateBlueEyesInvulnerableShield(fighter, now = getBattleNow()) {
    if (!isBlueEyesInvulnerable(fighter, now)) {
      removeElement(fighter.blueEyesInvulnerableShield);
      fighter.blueEyesInvulnerableShield = null;
      return;
    }
    if (!fighter.blueEyesInvulnerableShield) {
      fighter.blueEyesInvulnerableShield = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.28, "blue-eyes-evolution-shield");
    }
    updateCircleEffect(fighter.blueEyesInvulnerableShield, fighter.x, fighter.y, fighter.radius * 1.28);
  }

  function createBlueEyesInvulnerableBlock(fighter) {
    if (!fighter || !isBlueEyesInvulnerable(fighter)) return;
    const now = getBattleNow();
    if (now - (fighter.blueEyesLastShieldSparkAt || -Infinity) < 140) return;
    fighter.blueEyesLastShieldSparkAt = now;
    updateBlueEyesInvulnerableShield(fighter, now);
    const block = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.36, "blue-eyes-evolution-shield-block");
    trackBlueEyesEffect(fighter, block, 260);
  }

  function isBlueEyesChaosFieldActive(fighter, now = getBattleNow()) {
    const field = fighter && fighter.blueEyesChaosField;
    return !!(field && !field.cancelled && now < field.endAt);
  }

  function trackBlueEyesChaosFieldEffect(field, element) {
    if (!field || !element) return element;
    field.effects.push(element);
    return element;
  }

  function removeBlueEyesChaosFieldEffect(field, element) {
    removeElement(element);
    if (field && field.effects) {
      field.effects = field.effects.filter((item) => item !== element);
    }
  }

  function clearBlueEyesChaosField(fighter) {
    const field = fighter && fighter.blueEyesChaosField;
    if (!field) return;
    field.cancelled = true;
    (field.effects || []).forEach((effect) => removeElement(effect));
    field.effects = [];
    Object.values(game.fighters).concat(game.summons).forEach((target) => {
      const element = getEntityElement(target);
      if (element) element.classList.remove("blue-eyes-chaos-pulled");
    });
    fighter.blueEyesChaosField = null;
  }

  function pulseBlueEyesChaosField(fighter, field) {
    if (!fighter || !field || field.cancelled || fighter.blueEyesChaosField !== field || game.phase !== "running" || fighter.dead) return;
    const now = getBattleNow();
    if (now >= field.endAt) {
      finishBlueEyesChaosField(fighter, field);
      return;
    }
    const ring = createCircleEffect(field.centerX, field.centerY, field.radius * 1.08, "blue-eyes-chaos-inhale-ring");
    trackBlueEyesChaosFieldEffect(field, ring);
    scheduleTimeout(() => removeBlueEyesChaosFieldEffect(field, ring), 360);
    const opponent = getOpposingFighter(fighter.side);
    getBlueEyesTargets(fighter, opponent).forEach((target) => {
      const dx = field.centerX - target.x;
      const dy = field.centerY - target.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance > field.radius + target.radius) return;
      const pullRate = 0.11 + Math.max(0, 1 - distance / (field.radius + target.radius)) * 0.08;
      const pull = Math.min(distance, Math.max(fighter.radius * 0.18, distance * pullRate));
      target.x += (dx / distance) * pull;
      target.y += (dy / distance) * pull;
      target.vx = (target.vx || 0) * 0.62 + (dx / distance) * game.arenaSize * 0.07;
      target.vy = (target.vy || 0) * 0.62 + (dy / distance) * game.arenaSize * 0.07;
      clampEntityToArena(target);
      const element = getEntityElement(target);
      if (element) element.classList.add("blue-eyes-chaos-pulled");
    });
    scheduleTimeout(() => pulseBlueEyesChaosField(fighter, field), field.pulseInterval);
  }

  function finishBlueEyesChaosField(fighter, field) {
    if (!fighter || !field || field.cancelled || fighter.blueEyesChaosField !== field) return;
    field.cancelled = true;
    const opponent = getOpposingFighter(fighter.side);
    const skillName = getBlueEyesSkillName(field.skill);
    const blast = createCircleEffect(field.centerX, field.centerY, field.radius * 0.96, "blue-eyes-chaos-explosion");
    trackBlueEyesEffect(fighter, blast, 620);
    getBlueEyesTargets(fighter, opponent).forEach((target) => {
      const inside = Math.hypot(target.x - field.centerX, target.y - field.centerY) <= field.radius + target.radius * 0.55;
      if (!inside) return;
      const actual = applyDamage(fighter, target, {
        label: skillName,
        baseDamage: Number(field.skill.damage) || 26,
        defenseIgnoreRate: Number(field.skill.defenseIgnoreRate) || 0.5,
        damageKind: "스킬",
        attackId: field.attackId,
        hitId: `explosion-${target.id}`
      });
      if (actual > 0) {
        applyBlueEyesStun(fighter, target, Number(field.skill.stunDuration) || 3000, getBattleNow(), `${field.attackId}-stun-${target.id}`);
        knockbackEntity(fighter, target, fighter.radius * 0.42);
      }
    });
    pulseArena();
    clearBlueEyesChaosField(fighter);
  }

  function createBlueEyesFloatingText(fighter, text, className = "", duration = 760, offsetRate = 1.85) {
    if (!fighter || !text) return null;
    const element = document.createElement("div");
    element.className = `blue-eyes-floating-text ${className}`.trim();
    element.textContent = text;
    element.style.left = `${fighter.x}px`;
    element.style.top = `${fighter.y - fighter.radius * offsetRate}px`;
    els.skillLayer.appendChild(element);
    return trackBlueEyesEffect(fighter, element, duration);
  }

  function createBlueEyesScreenTitle(fighter, title, subtitle, duration = 920) {
    const element = document.createElement("div");
    element.className = "blue-eyes-screen-title";
    element.innerHTML = "";
    const titleEl = document.createElement("strong");
    titleEl.textContent = title;
    element.appendChild(titleEl);
    if (subtitle) {
      const subtitleEl = document.createElement("span");
      subtitleEl.textContent = subtitle;
      element.appendChild(subtitleEl);
    }
    els.skillLayer.appendChild(element);
    return trackBlueEyesEffect(fighter, element, duration);
  }

  function createBlueEyesHeadFlash(fighter, angleOffset, delay = 0) {
    if (!fighter) return;
    scheduleTimeout(() => {
      if (!fighter || fighter.dead || !isBlueEyesFighter(fighter)) return;
      const angle = Math.atan2(fighter.vy || 0, fighter.vx || 1) + angleOffset;
      const x = fighter.x + Math.cos(angle) * fighter.radius * 0.9;
      const y = fighter.y + Math.sin(angle) * fighter.radius * 0.9;
      const flash = createCircleEffect(x, y, fighter.radius * 0.64, "blue-eyes-head-flash");
      addBlueEyesParticles(flash, 5, "ultimate");
      trackBlueEyesEffect(fighter, flash, 360);
    }, delay);
  }

  function createBlueEyesOverlay(fighter, className, duration = 900) {
    const element = document.createElement("div");
    element.className = className;
    els.skillLayer.appendChild(element);
    return trackBlueEyesEffect(fighter, element, duration);
  }

  function createBlueEyesHeadPointEffect(fighter, direction, sideOffset, forwardOffset, size, className, duration = 620) {
    if (!fighter || !direction) return null;
    const x = fighter.x + direction.x * forwardOffset - direction.y * sideOffset;
    const y = fighter.y + direction.y * forwardOffset + direction.x * sideOffset;
    const effect = createCircleEffect(x, y, size, className);
    addBlueEyesParticles(effect, 6, "ultimate");
    trackBlueEyesEffect(fighter, effect, duration);
    return effect;
  }

  function createBlueEyesSlashLine(fighter, target, hitIndex) {
    if (!fighter || !target) return null;
    const base = Math.atan2(target.y - fighter.y, target.x - fighter.x);
    const offsets = [-0.62, 0.62, 0];
    const direction = {
      x: Math.cos(base + (offsets[hitIndex] || 0)),
      y: Math.sin(base + (offsets[hitIndex] || 0)),
      angle: base + (offsets[hitIndex] || 0)
    };
    const origin = hitIndex === 2 ? fighter : {
      x: fighter.x + Math.cos(base + offsets[hitIndex]) * fighter.radius * 0.8,
      y: fighter.y + Math.sin(base + offsets[hitIndex]) * fighter.radius * 0.8,
      radius: fighter.radius
    };
    return createBlueEyesLineEffect(origin, direction, Math.max(fighter.radius * 3.2, Math.hypot(target.x - fighter.x, target.y - fighter.y) + target.radius), fighter.radius * (hitIndex === 2 ? 0.62 : 0.44), `blue-eyes-triple-strike hit-${hitIndex + 1}`);
  }

  function createBlueEyesRageAura(fighter) {
    const aura = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.95, "blue-eyes-rage-aura");
    addBlueEyesParticles(aura, 12, "rage");
    scheduleTimeout(() => removeElement(aura), 620);
  }

  function createBlueEyesEvolutionEffects(fighter, reason) {
    clearBlueEyesTransientEffects(fighter);
    const flash = createCircleEffect(fighter.x, fighter.y, fighter.radius * 2.2, "blue-eyes-evolution-flash");
    trackBlueEyesEffect(fighter, flash, 420);
    createBlueEyesFloatingText(fighter, "진화", "evolution-reason", 520, 2.25);
    pulseArena();
  }

  function createBlueEyesUltimateCreatureEffects(fighter) {
    startBlueEyesEvolutionFreeze(100);
    const crack = document.createElement("div");
    crack.className = "blue-eyes-crack-screen";
    els.skillLayer.appendChild(crack);
    trackBlueEyesEffect(fighter, crack, 520);
    const armor = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.9, "blue-eyes-crystal-armor");
    addBlueEyesParticles(armor, 10, "crystal");
    trackBlueEyesEffect(fighter, armor, 820);
    const shield = createCircleEffect(fighter.x, fighter.y, fighter.radius * 2.35, "blue-eyes-invincible-shield");
    addBlueEyesParticles(shield, 12, "crystal");
    trackBlueEyesEffect(fighter, shield, 1220);
    const survival = createCircleEffect(fighter.x, fighter.y, fighter.radius * 2.85, "blue-eyes-survival-crystal");
    addBlueEyesParticles(survival, 18, "crystal");
    trackBlueEyesEffect(fighter, survival, 1180);
    createBlueEyesScreenTitle(fighter, "강인! 무적! 최강!", "", 1080);
    createBlueEyesFloatingText(fighter, "무적", "invulnerable", 1120, 2.25);
    scheduleTimeout(() => createBlueEyesFloatingText(fighter, "공격 속도 증가", "haste", 980, 2.9), 160);
    pulseArena();
  }

  function addBlueEyesParticles(container, count, tone) {
    if (!container) return;
    for (let i = 0; i < count; i += 1) {
      const particle = document.createElement("span");
      particle.className = `blue-eyes-particle ${tone}`;
      const angle = Math.random() * Math.PI * 2;
      const distance = 18 + Math.random() * 58;
      particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
      particle.style.animationDelay = `${Math.random() * 180}ms`;
      container.appendChild(particle);
    }
  }

  function startBlueEyesBurstStream(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    const direction = getOpponentDirection(fighter, opponent);
    const length = game.arenaSize * (Number(skill.rangeRate) || 1.15);
    const width = fighter.radius * (Number(skill.widthRate) || 1.24);
    const leftCharge = createCircleEffect(fighter.x - direction.y * fighter.radius * 0.72, fighter.y + direction.x * fighter.radius * 0.72, fighter.radius * 0.58, "blue-eyes-mouth-charge side");
    const rightCharge = createCircleEffect(fighter.x + direction.y * fighter.radius * 0.72, fighter.y - direction.x * fighter.radius * 0.72, fighter.radius * 0.58, "blue-eyes-mouth-charge side");
    const warning = createBlueEyesLineEffect(fighter, direction, length, Math.max(3, width * 0.18), "blue-eyes-burst-warning");
    const beam = createBlueEyesLineEffect(fighter, direction, length, width, "blue-eyes-burst-stream");
    const charge = createCircleEffect(fighter.x + direction.x * fighter.radius * 0.72, fighter.y + direction.y * fighter.radius * 0.72, fighter.radius * 0.72, "blue-eyes-mouth-charge");
    state.data.effects = [beam, charge, leftCharge, rightCharge, warning];
    createBlueEyesFloatingText(fighter, skill.name, "skill-cast", 640, 2.35);
    const targets = [opponent].concat(getEnemySummons(fighter.side));
    targets.forEach((target) => {
      if (!isTargetOnBlueEyesLine(fighter, target, direction, length, width)) return;
      const actual = applyDamage(fighter, target, {
        label: skill.name,
        baseDamage: Number(skill.damage) || 12,
        ignoreDefense: true,
        damageKind: "스킬",
        attackId: `blue-burst-${fighter.id}-${now.toFixed(2)}-${target.id}`
      });
      if (actual > 0) {
        createBlueEyesImpact(target, "burst");
      }
    });
    scheduleTimeout(() => {
      removeElement(beam);
      removeElement(charge);
      removeElement(leftCharge);
      removeElement(rightCharge);
      removeElement(warning);
    }, 360);
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
    startSkillRecovery(fighter, skill, now);
    addLog(`${fighter.name} 멸망의 폭렬 질풍탄`, "skill");
  }

  function startBlueEyesUltimateBurst(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    createBlueEyesUltimateBurstEffects(fighter, opponent);
    const removedBuffCount = purgeBlueEyesBuffs(opponent, now);
    if (removedBuffCount > 0) {
      createBlueEyesFloatingText(opponent, "보호막 파괴", "buff-break", 720, 2.1);
      createBlueEyesFloatingText(fighter, "궁극의 우뢰탄", "ultimate-cast", 820, 2.55);
    }
    applyDamage(fighter, opponent, {
      label: skill.name,
      baseDamage: Number(skill.damage) || 20,
      ignoreDefense: true,
      damageKind: "궁극기",
      attackId: `blue-ultimate-${fighter.id}-${now.toFixed(2)}`
    });
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
    startSkillRecovery(fighter, skill, now);
    addLog(`${fighter.name} 궁극의 우뢰탄`, "bad");
  }

  function createBlueEyesUltimateBurstEffects(fighter, opponent) {
    if (els.arena) {
      els.arena.classList.add("blue-eyes-ultimate-impact");
      scheduleTimeout(() => els.arena && els.arena.classList.remove("blue-eyes-ultimate-impact"), 760);
    }
    const flash = document.createElement("div");
    flash.className = "blue-eyes-ultimate-flash";
    els.skillLayer.appendChild(flash);
    trackBlueEyesEffect(fighter, flash, 480);
    const dim = createBlueEyesOverlay(fighter, "blue-eyes-ultimate-dim", 640);
    const storm = createCircleEffect((fighter.x + opponent.x) / 2, (fighter.y + opponent.y) / 2, game.arenaSize * 0.42, "blue-eyes-ultimate-storm");
    addBlueEyesParticles(storm, 20, "ultimate");
    trackBlueEyesEffect(fighter, storm, 720);
    const charge = createCircleEffect(fighter.x, fighter.y, fighter.radius * 2.05, "blue-eyes-ultimate-charge");
    addBlueEyesParticles(charge, 16, "ultimate");
    trackBlueEyesEffect(fighter, charge, 560);
    const direction = getOpponentDirection(fighter, opponent);
    [-0.95, 0, 0.95].forEach((side, index) => {
      createBlueEyesHeadPointEffect(fighter, direction, fighter.radius * side, fighter.radius * 0.78, fighter.radius * 0.86, `blue-eyes-ultimate-orb orb-${index + 1}`, 620);
    });
    const triangle = createCircleEffect(fighter.x + direction.x * fighter.radius * 0.72, fighter.y + direction.y * fighter.radius * 0.72, fighter.radius * 2.4, "blue-eyes-ultimate-triangle");
    trackBlueEyesEffect(fighter, triangle, 620);
    const warning = createBlueEyesLineEffect(fighter, direction, game.arenaSize * 1.08, fighter.radius * 0.22, "blue-eyes-ultimate-warning");
    trackBlueEyesEffect(fighter, warning, 500);
    for (let i = 0; i < 3; i += 1) {
      const angle = direction.angle + (i - 1) * 0.24;
      const direction = { x: Math.cos(angle), y: Math.sin(angle), angle };
      const beam = createBlueEyesLineEffect(fighter, direction, game.arenaSize * 1.2, fighter.radius * 0.72, "blue-eyes-ultimate-ray");
      trackBlueEyesEffect(fighter, beam, 420);
    }
    const merge = createCircleEffect(opponent.x, opponent.y, opponent.radius * 2.35, "blue-eyes-ultimate-merge");
    addBlueEyesParticles(merge, 14, "ultimate");
    trackBlueEyesEffect(fighter, merge, 760);
    const crack = createCircleEffect(opponent.x, opponent.y, opponent.radius * 3.15, "blue-eyes-ultimate-ground-crack");
    trackBlueEyesEffect(fighter, crack, 900);
    void dim;
    createBlueEyesScreenTitle(fighter, "궁극의 우뢰탄", "", 760);
    pulseArena();
    scheduleTimeout(() => pulseArena(), 80);
  }

  function startBlueEyesTripleHyperBurst(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    state.data.hitIndex = 0;
    state.data.nextHitAt = now;
    state.data.endAt = now + (Number(skill.hitInterval) || 260) * 3 + 240;
    state.data.hitDamages = [Number(skill.hit1Damage) || 5, Number(skill.hit2Damage) || 5, Number(skill.hit3Damage) || 8];
    createBlueEyesFloatingText(fighter, skill.name, "triple-cast", 640, 2.28);
    addLog(`${fighter.name} 트리플 하이퍼 버스트`, "skill");
  }

  function updateBlueEyesTripleHyperBurst(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state || !opponent || opponent.dead) {
      if (state) finishBlueEyesRunningSkill(fighter, state.skill, now);
      return;
    }
    const interval = Number(state.skill.hitInterval) || 260;
    if (state.data.hitIndex < 3 && now >= state.data.nextHitAt) {
      const hitIndex = state.data.hitIndex;
      const actual = applyDamage(fighter, opponent, {
        label: state.skill.name,
        baseDamage: state.data.hitDamages[hitIndex],
        ignoreDefense: true,
        damageKind: "스킬",
        attackId: `blue-triple-${fighter.id}-${state.activateAt}-hit-${hitIndex + 1}`,
        hitId: `triple-${hitIndex + 1}`
      });
      let didStun = false;
      if (actual > 0 && hitIndex === 2) {
        didStun = applyStunEffect(opponent, Number(state.skill.stunDuration) || 1400, now);
      }
      createBlueEyesTripleHitEffect(fighter, opponent, hitIndex, actual > 0, didStun);
      state.data.hitIndex += 1;
      state.data.nextHitAt = now + interval;
    }
    if (state.data.hitIndex >= 3 && now >= state.data.nextHitAt + 120) {
      finishBlueEyesRunningSkill(fighter, state.skill, now);
    }
  }

  function startBlueEyesWrathDestruction(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    const direction = getOpponentDirection(fighter, opponent);
    const speed = getPixelSpeed(fighter) * 2.35;
    state.data.endAt = now + (Number(skill.dashDuration) || 380);
    state.data.hit = false;
    fighter.vx = direction.x * speed;
    fighter.vy = direction.y * speed;
    const trail = createBlueEyesLineEffect(fighter, direction, fighter.radius * 3.4, fighter.radius * 0.84, "blue-eyes-wrath-trail");
    state.data.effects = [trail];
    scheduleTimeout(() => removeElement(trail), 420);
    createBlueEyesFloatingText(fighter, skill.name, "wrath-cast", 640, 2.28);
    const dashAura = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.55, "blue-eyes-wrath-dash-aura");
    trackBlueEyesEffect(fighter, dashAura, 480);
    addLog(`${fighter.name} 파멸의 분노`, "skill");
  }

  function updateBlueEyesWrathDestruction(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;
    const distance = opponent && !opponent.dead ? Math.hypot(opponent.x - fighter.x, opponent.y - fighter.y) : Infinity;
    if (!state.data.hit && opponent && !opponent.dead && (distance <= fighter.radius + opponent.radius + fighter.radius * 0.55 || now >= state.data.endAt)) {
      state.data.hit = true;
      const actual = applyDamage(fighter, opponent, {
        label: state.skill.name,
        baseDamage: Number(state.skill.damage) || 14,
        ignoreDefense: true,
        damageKind: "스킬",
        attackId: `blue-wrath-${fighter.id}-${state.activateAt}`
      });
      let stolenLabel = "";
      if (actual > 0) {
        stolenLabel = stealRandomBlueEyesBuff(fighter, opponent, Number(state.skill.stolenBuffDuration) || 5000, now);
      }
      createBlueEyesWrathImpact(fighter, opponent, stolenLabel);
      fighter.vx = 0;
      fighter.vy = 0;
      state.data.endAt = now + 160;
    }
    if (now >= state.data.endAt + 120) {
      finishBlueEyesRunningSkill(fighter, state.skill, now);
    }
  }

  function getBlueEyesTargets(fighter, opponent) {
    return [opponent]
      .concat(getEnemySummons(fighter.side))
      .filter((target) => target && !target.dead && !target.removing && !isFighterOutOfBattle(target));
  }

  function updateHimState(fighter, now = getBattleNow()) {
    if (!fighter || fighter.dead) return;
    if (fighter.abilityType === "himCharm") {
      updateHimAbsoluteCharmState(fighter, now);
      if (!isPassiveSuppressedByConcept(fighter, now)) {
        updateHimAura(fighter, now);
      }
    }
  }

  function updateHimAura(fighter, now) {
    const radius = game.arenaSize * HIM_CHARM_AURA_RADIUS_RATE;
    if (!fighter.himAuraEffect) {
      fighter.himAuraEffect = createCircleEffect(fighter.x, fighter.y, radius, "him-charm-aura");
    } else {
      updateCircleEffect(fighter.himAuraEffect, fighter.x, fighter.y, radius);
    }
    const lastAt = Number(fighter.himAuraLastAt) || now;
    fighter.himAuraLastAt = now;
    const dt = clamp((now - lastAt) / 1000, 0, 0.08);
    if (dt <= 0) return;
    getHimTargets(fighter).forEach((target) => {
      if (!target || target.dead || isFighterOutOfBattle(target)) return;
      if (isHimAbsoluteCharmed(target, now) || isHimCharmed(target, now)) return;
      const distance = Math.hypot(target.x - fighter.x, target.y - fighter.y);
      if (distance <= radius + target.radius) {
        addHimCharmGauge(fighter, target, HIM_CHARM_BUILD_PER_SECOND * dt, now, "매혹 오라");
        if (now - (target.himLastEyeMarkAt || 0) > 700) {
          target.himLastEyeMarkAt = now;
          createHimEyeMark(target);
        }
      }
    });
  }

  function getHimTargets(fighter) {
    const targets = [];
    const opponent = getOpposingFighter(fighter.side);
    if (opponent && !opponent.dead && !isFighterOutOfBattle(opponent)) targets.push(opponent);
    getEnemySummons(fighter.side).forEach((summon) => targets.push(summon));
    return targets;
  }

  function getHimCharmRecord(source, target, create = true) {
    if (!source || !target) return null;
    if (!target.himCharmBySource) target.himCharmBySource = new Map();
    let record = target.himCharmBySource.get(source.id);
    if (!record && create) {
      record = {
        sourceId: source.id,
        gauge: 0,
        charmedUntil: 0,
        absoluteUntil: 0,
        visual: null,
        absoluteVisual: null,
        lastPullAt: 0
      };
      target.himCharmBySource.set(source.id, record);
    }
    return record;
  }

  function addHimCharmGauge(source, target, amount, now = getBattleNow(), reason = "매혹") {
    if (!source || !target || source.dead || target.dead) return 0;
    const record = getHimCharmRecord(source, target, true);
    if (!record || now < (record.charmedUntil || 0) || now < (record.absoluteUntil || 0)) return record ? record.gauge || 0 : 0;
    record.gauge = clamp((Number(record.gauge) || 0) + Math.max(0, Number(amount) || 0), 0, HIM_CHARM_MAX);
    updateHimCharmStackVisual(target, record);
    createHimCharmGainEffect(target, record.gauge);
    if (record.gauge >= HIM_CHARM_MAX) {
      triggerHimCharm(source, target, record, now, reason);
    }
    return record.gauge;
  }

  function triggerHimCharm(source, target, record, now, reason = "매혹") {
    if (!record) return;
    record.gauge = 0;
    record.charmedUntil = Math.max(record.charmedUntil || 0, now + HIM_CHARM_DURATION);
    removeElement(record.visual);
    record.visual = createHimCharmTriggerEffect(target);
    updateHimCharmStackVisual(target, record);
    const element = getEntityElement(target);
    if (element) element.classList.add("him-charmed");
    addLog(`${target.name} 매혹 (${reason})`, "ultimate");
  }

  function applyHimAbsoluteCharm(source, target, skill, now = getBattleNow()) {
    if (!source || !target) return;
    const duration = Number(skill.duration) || HIM_ABSOLUTE_DURATION;
    const record = getHimCharmRecord(source, target, true);
    record.gauge = 0;
    record.charmedUntil = 0;
    record.absoluteUntil = Math.max(record.absoluteUntil || 0, now + duration);
    removeElement(record.visual);
    removeElement(record.absoluteVisual);
    record.absoluteVisual = createHimAbsoluteTargetEffect(target);
    updateHimCharmStackVisual(target, record);
    const element = getEntityElement(target);
    if (element) element.classList.add("him-absolute-charmed");
    addLog(`${target.name} 절대 매혹`, "ultimate");
  }

  function updateHimEffectsOnEntity(entity, now = getBattleNow()) {
    if (!entity || entity.dead || !entity.himCharmBySource) return;
    let bestRecord = null;
    let hasActive = false;
    entity.himCharmBySource.forEach((record, sourceId) => {
      const source = getFighterById(sourceId);
      const activeAbsolute = now < (record.absoluteUntil || 0);
      const activeCharm = now < (record.charmedUntil || 0);
      if (!source || source.dead || isFighterOutOfBattle(source)) {
        clearSingleHimCharmRecord(entity, sourceId, record);
        return;
      }
      if (activeAbsolute || activeCharm) {
        hasActive = true;
        if (record.visual) updateCircleEffect(record.visual, entity.x, entity.y, entity.radius * 1.55);
        if (record.absoluteVisual) updateCircleEffect(record.absoluteVisual, entity.x, entity.y, entity.radius * 1.75);
        applyHimCharmPull(entity, source, activeAbsolute ? 0.9 : 0.38, now, record);
      }
      if (!bestRecord || (record.gauge || 0) > (bestRecord.gauge || 0) || activeAbsolute || activeCharm) {
        bestRecord = record;
      }
      if (!activeCharm && !activeAbsolute && (record.gauge || 0) <= 0) {
        clearSingleHimCharmRecord(entity, sourceId, record);
      }
    });
    updateHimCharmStackVisual(entity, bestRecord);
    const element = getEntityElement(entity);
    if (element) {
      element.classList.toggle("him-charmed", isHimCharmed(entity, now));
      element.classList.toggle("him-absolute-charmed", isHimAbsoluteCharmed(entity, now));
    }
    if (!hasActive) normalizeVelocity(entity, getPixelSpeed(entity));
  }

  function applyHimCharmPull(target, source, strength, now, record) {
    if (!target || !source) return;
    const lastAt = Number(record.lastPullAt) || now;
    record.lastPullAt = now;
    const dt = clamp((now - lastAt) / 1000, 0, 0.08);
    if (dt <= 0) return;
    const dx = source.x - target.x;
    const dy = source.y - target.y;
    const distance = Math.hypot(dx, dy) || 1;
    const minDistance = source.radius + target.radius + 12;
    if (distance <= minDistance) return;
    const pull = Math.min(distance - minDistance, (game.arenaSize * 0.16) * strength * dt);
    target.x += (dx / distance) * pull;
    target.y += (dy / distance) * pull;
    target.vx += (dx / distance) * getPixelSpeed(target) * 0.08 * strength;
    target.vy += (dy / distance) * getPixelSpeed(target) * 0.08 * strength;
    keepInsideArena(target);
    normalizeVelocity(target, getPixelSpeed(target));
  }

  function isHimCharmed(fighter, now = getBattleNow()) {
    return !!getActiveHimRecord(fighter, now, false);
  }

  function isHimAbsoluteCharmed(fighter, now = getBattleNow()) {
    return !!getActiveHimRecord(fighter, now, true);
  }

  function getActiveHimRecord(fighter, now = getBattleNow(), absoluteOnly = false) {
    if (!fighter || !fighter.himCharmBySource) return null;
    let active = null;
    fighter.himCharmBySource.forEach((record) => {
      if (now < (record.absoluteUntil || 0)) active = record;
      if (!absoluteOnly && now < (record.charmedUntil || 0)) active = record;
    });
    return active;
  }

  function getHimCharmSpeedMultiplier(fighter, now = getBattleNow()) {
    if (isHimAbsoluteCharmed(fighter, now)) return 0.4;
    if (isHimCharmed(fighter, now)) return 0.6;
    return 1;
  }

  function isSkillBlockedByHimCharm(fighter, skill, now = getBattleNow()) {
    if (!fighter || !skill) return false;
    if (isHimAbsoluteCharmed(fighter, now)) return true;
    if (isHimCharmed(fighter, now) && !isUltimateSkill(skill)) return true;
    return false;
  }

  function getHimDamageReduction(fighter, now = getBattleNow()) {
    if (!fighter || fighter.abilityType !== "himCharm" || !fighter.himAbsoluteCharm) return 0;
    return now < (fighter.himAbsoluteCharm.endAt || 0) ? clamp(Number(fighter.himAbsoluteCharm.damageReduction) || 0.4, 0, 0.9) : 0;
  }

  function shouldStartHimSkillNow(fighter, opponent, skill, now) {
    if (!fighter || !opponent || opponent.dead || isFighterOutOfBattle(opponent)) return false;
    const distance = Math.hypot(opponent.x - fighter.x, opponent.y - fighter.y);
    if (skill.type === "himAbsoluteCharm") return !fighter.himAbsoluteCharm || now >= (fighter.himAbsoluteCharm.endAt || 0);
    if (skill.type === "himForbiddenGesture") return distance >= game.arenaSize * 0.28;
    if (skill.type === "himGazeLock") return distance <= game.arenaSize * (Number(skill.rangeRate) || 0.62) + opponent.radius;
    return true;
  }

  function startHimGazeLock(fighter, target, skill, now) {
    const range = game.arenaSize * (Number(skill.rangeRate) || 0.62);
    createHimGazeBeam(fighter, target);
    if (target && !target.dead && Math.hypot(target.x - fighter.x, target.y - fighter.y) <= range + target.radius) {
      const actual = applyDamage(fighter, target, {
        label: skill.name || "시선 고정",
        baseDamage: Number(skill.damage) || 20,
        attackId: `him-gaze-${fighter.id}-${Math.round(now)}`
      });
      applySlowEffect(target, Number(skill.slowRate) || 0.5, Number(skill.slowDuration) || 1200, now);
      addHimCharmGauge(fighter, target, Number(skill.charmGain) || 35, now, skill.name || "시선 고정");
      if (actual > 0) createHimEyeMark(target);
    }
    restoreStoredVelocity(fighter, fighter.skillState);
    startSkillRecovery(fighter, skill, now);
  }

  function startHimForbiddenGesture(fighter, target, skill, now) {
    const state = fighter.skillState;
    if (!state || !target) {
      startSkillRecovery(fighter, skill, now);
      return;
    }
    state.phase = "active";
    state.data.targetId = target.id;
    state.data.endAt = now + (Number(skill.pullDuration) || 800);
    state.data.minDistance = fighter.radius + target.radius + 12;
    state.data.effects = state.data.effects || [];
    state.data.chain = createHimGestureChain(fighter, target);
    state.data.effects.push(state.data.chain);
    addHimCharmGauge(fighter, target, Number(skill.charmGain) || 45, now, skill.name || "금단의 손짓");
    addLog(`${fighter.name} 금단의 손짓`, "skill");
  }

  function updateHimForbiddenGesture(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;
    const target = getFighterById(state.data.targetId) || opponent;
    if (!target || target.dead || now >= (state.data.endAt || 0)) {
      finishHimActiveSkill(fighter, state, now);
      return;
    }
    updateHimGestureChain(state.data.chain, fighter, target);
    const dx = fighter.x - target.x;
    const dy = fighter.y - target.y;
    const distance = Math.hypot(dx, dy) || 1;
    const minDistance = Number(state.data.minDistance) || (fighter.radius + target.radius + 12);
    if (distance > minDistance) {
      const pull = Math.min(distance - minDistance, game.arenaSize * 0.025);
      target.x += (dx / distance) * pull;
      target.y += (dy / distance) * pull;
      target.vx += (dx / distance) * getPixelSpeed(target) * 0.18;
      target.vy += (dy / distance) * getPixelSpeed(target) * 0.18;
      keepInsideArena(target);
      normalizeVelocity(target, getPixelSpeed(target));
    }
  }

  function startHimAbsoluteCharm(fighter, target, skill, now) {
    const duration = Number(skill.duration) || HIM_ABSOLUTE_DURATION;
    const effects = createHimAbsoluteField(fighter, target, duration);
    fighter.himAbsoluteCharm = {
      targetId: target && target.id,
      endAt: now + duration,
      damageReduction: Number(skill.damageReduction) || 0.4,
      effects
    };
    const element = getFighterElement(fighter);
    if (element) element.classList.add("him-absolute-caster");
    if (target && !target.dead) {
      applyDamage(fighter, target, {
        label: skill.name || "절대 매혹",
        baseDamage: Number(skill.damage) || 45,
        attackId: `him-absolute-${fighter.id}-${Math.round(now)}`
      });
      applyHimAbsoluteCharm(fighter, target, skill, now);
    }
    addLog(`${fighter.name} 절대 매혹 발동`, "ultimate");
    restoreStoredVelocity(fighter, fighter.skillState);
    startSkillRecovery(fighter, skill, now);
  }

  function updateHimAbsoluteCharmState(fighter, now) {
    const state = fighter.himAbsoluteCharm;
    if (!state) return;
    const target = getFighterById(state.targetId) || getOpposingFighter(fighter.side);
    (state.effects || []).forEach((effect) => {
      if (effect.classList && effect.classList.contains("him-absolute-eye")) updateCircleEffect(effect, fighter.x, fighter.y, fighter.radius * 2.35);
      if (effect.classList && effect.classList.contains("him-absolute-chain")) updateCircleEffect(effect, game.arenaSize / 2, game.arenaSize / 2, game.arenaSize * 0.44);
    });
    if (target && !target.dead) {
      applyHimCharmPull(target, fighter, 0.72, now, getHimCharmRecord(fighter, target, true));
    }
    if (now >= state.endAt || fighter.dead || game.phase !== "running") {
      endHimAbsoluteCharm(fighter);
    }
  }

  function endHimAbsoluteCharm(fighter) {
    if (!fighter || !fighter.himAbsoluteCharm) return;
    (fighter.himAbsoluteCharm.effects || []).forEach((effect) => removeElement(effect));
    fighter.himAbsoluteCharm = null;
    const element = getFighterElement(fighter);
    if (element) element.classList.remove("him-absolute-caster");
    releaseUltimateLock(fighter, { type: "himAbsoluteCharm", isUltimate: true });
  }

  function finishHimActiveSkill(fighter, state, now) {
    clearHimSkillState(fighter, state);
    restoreStoredVelocity(fighter, state);
    startSkillRecovery(fighter, state.skill, now);
  }

  function clearHimSkillState(fighter, state) {
    if (!state || !state.data) return;
    removeElement(state.data.warning);
    removeElement(state.data.chain);
    (state.data.effects || []).forEach((effect) => removeElement(effect));
    state.data.effects = [];
  }

  function resetHimState(fighter) {
    if (!fighter) return;
    if (fighter.skillState && fighter.skillState.skill && isHimSkill(fighter.skillState.skill)) {
      clearHimSkillState(fighter, fighter.skillState);
    }
    if (fighter.himCharmBySource) {
      fighter.himCharmBySource.forEach((record) => clearHimRecordEffects(record));
      fighter.himCharmBySource.clear();
    }
    removeElement(fighter.himAuraEffect);
    fighter.himAuraEffect = null;
    (fighter.himVisualEffects || []).forEach((effect) => removeElement(effect));
    fighter.himVisualEffects = [];
    removeElement(fighter.himCharmStackUi);
    fighter.himCharmStackUi = null;
    endHimAbsoluteCharm(fighter);
    fighter.himPull = null;
    const element = getEntityElement(fighter);
    if (element) element.classList.remove("him-charmed", "him-absolute-charmed", "him-absolute-caster");
  }

  function clearSingleHimCharmRecord(target, sourceId, record) {
    clearHimRecordEffects(record);
    if (target && target.himCharmBySource) target.himCharmBySource.delete(sourceId);
  }

  function clearHimRecordEffects(record) {
    if (!record) return;
    removeElement(record.visual);
    removeElement(record.absoluteVisual);
    record.visual = null;
    record.absoluteVisual = null;
  }

  function createHimGazeBeam(fighter, target) {
    if (!fighter || !target || !els.skillLayer) return null;
    const dx = target.x - fighter.x;
    const dy = target.y - fighter.y;
    const length = Math.hypot(dx, dy) || 1;
    const angle = Math.atan2(dy, dx);
    const beam = document.createElement("div");
    beam.className = "him-gaze-beam";
    beam.style.width = `${length}px`;
    beam.style.left = `${fighter.x}px`;
    beam.style.top = `${fighter.y}px`;
    beam.style.transform = `rotate(${angle}rad)`;
    els.skillLayer.appendChild(beam);
    scheduleTimeout(() => removeElement(beam), 420);
    const hit = createCircleEffect(target.x, target.y, target.radius * 1.2, "him-gaze-hit");
    scheduleTimeout(() => removeElement(hit), 460);
    return beam;
  }

  function createHimEyeMark(target) {
    if (!target) return null;
    const mark = createCircleEffect(target.x, target.y - target.radius * 1.05, target.radius * 0.62, "him-eye-mark");
    scheduleTimeout(() => removeElement(mark), 520);
    return mark;
  }

  function createHimCharmGainEffect(target, gauge) {
    if (!target || !els.skillLayer) return null;
    const burst = createCircleEffect(target.x, target.y, target.radius * (0.9 + clamp(gauge / HIM_CHARM_MAX, 0, 1) * 0.55), "him-charm-gain");
    scheduleTimeout(() => removeElement(burst), 360);
    return burst;
  }

  function createHimCharmTriggerEffect(target) {
    const effect = createCircleEffect(target.x, target.y, target.radius * 1.55, "him-charm-trigger");
    scheduleTimeout(() => removeElement(effect), HIM_CHARM_DURATION + 180);
    return effect;
  }

  function createHimAbsoluteTargetEffect(target) {
    const effect = createCircleEffect(target.x, target.y, target.radius * 1.75, "him-absolute-target");
    scheduleTimeout(() => removeElement(effect), HIM_ABSOLUTE_DURATION + 200);
    return effect;
  }

  function createHimGestureChain(fighter, target) {
    const chain = document.createElement("div");
    chain.className = "him-gesture-chain";
    els.skillLayer.appendChild(chain);
    updateHimGestureChain(chain, fighter, target);
    return chain;
  }

  function updateHimGestureChain(chain, fighter, target) {
    if (!chain || !fighter || !target) return;
    const dx = target.x - fighter.x;
    const dy = target.y - fighter.y;
    const length = Math.hypot(dx, dy) || 1;
    const angle = Math.atan2(dy, dx);
    chain.style.width = `${length}px`;
    chain.style.left = `${fighter.x}px`;
    chain.style.top = `${fighter.y}px`;
    chain.style.transform = `rotate(${angle}rad)`;
  }

  function createHimAbsoluteField(fighter, target, duration) {
    const effects = [];
    const dim = document.createElement("div");
    dim.className = "him-absolute-vignette";
    els.skillLayer.appendChild(dim);
    effects.push(dim);
    effects.push(createCircleEffect(fighter.x, fighter.y, fighter.radius * 2.35, "him-absolute-eye"));
    effects.push(createCircleEffect(game.arenaSize / 2, game.arenaSize / 2, game.arenaSize * 0.44, "him-absolute-chain"));
    if (target) effects.push(createCircleEffect(target.x, target.y, target.radius * 1.5, "him-absolute-target-ring"));
    scheduleTimeout(() => effects.forEach((effect) => effect && effect.classList && effect.classList.add("breaking")), Math.max(0, duration - 420));
    return effects;
  }

  function updateHimCharmStackVisual(target, record) {
    if (!target || !els.skillLayer) return;
    const now = getBattleNow();
    const gauge = record ? Number(record.gauge) || 0 : 0;
    const active = record && (gauge > 0 || now < (record.charmedUntil || 0) || now < (record.absoluteUntil || 0));
    if (!active) {
      removeElement(target.himCharmStackUi);
      target.himCharmStackUi = null;
      return;
    }
    if (!target.himCharmStackUi) {
      const ui = document.createElement("div");
      ui.className = "him-charm-stack-ui";
      const rings = document.createElement("span");
      rings.className = "him-charm-rings";
      const text = document.createElement("b");
      text.className = "him-charm-stack-text";
      ui.append(rings, text);
      els.skillLayer.appendChild(ui);
      target.himCharmStackUi = ui;
    }
    const stack = Math.min(5, Math.ceil(gauge / 20));
    const ui = target.himCharmStackUi;
    ui.style.left = `${target.x}px`;
    ui.style.top = `${target.y - target.radius * 1.65}px`;
    ui.querySelector(".him-charm-stack-text").textContent = now < (record.absoluteUntil || 0)
      ? "절대 매혹"
      : now < (record.charmedUntil || 0)
      ? "매혹"
      : `매혹 ×${stack}`;
    const rings = ui.querySelector(".him-charm-rings");
    rings.innerHTML = "";
    for (let i = 0; i < stack; i += 1) {
      const ring = document.createElement("i");
      ring.style.setProperty("--ring", `${i}`);
      rings.appendChild(ring);
    }
  }

  function tryHimBossRecovery(defender, hitOptions, nextHp, now = getBattleNow()) {
    if (!defender || defender.abilityType !== "himCharm" || defender.himBossRecoveryUsed || hitOptions.systemKill) return nextHp;
    if (nextHp > defender.maxHp * 0.3) return nextHp;
    defender.himBossRecoveryUsed = true;
    const recovered = Math.min(defender.maxHp, Math.max(0, nextHp) + HIM_BOSS_RECOVERY_HP);
    createHealEffect(defender, recovered - Math.max(0, nextHp));
    showHimBossText(defender, "매혹은 끝나지 않는다");
    addLog(`${defender.name} 매혹은 끝나지 않는다`, "ultimate");
    return recovered;
  }

  function showHimBossText(fighter, text) {
    if (!fighter || !els.skillLayer) return;
    const element = document.createElement("div");
    element.className = "him-boss-text";
    element.textContent = text;
    element.style.left = `${fighter.x}px`;
    element.style.top = `${fighter.y - fighter.radius * 2.25}px`;
    els.skillLayer.appendChild(element);
    scheduleTimeout(() => removeElement(element), 1100);
  }

  const CHAINSAW_EXTINCTION_MAX_STACKS = 3;
  const CHAINSAW_EXTINCTION_DURATION = 15000;
  const CHAINSAW_SUPPRESS_ULTIMATE = "__chainsaw_ultimate__";
  const CHAINSAW_SUPPRESS_PASSIVE = "__chainsaw_passive__";

  function isChainsawSkill(skill) {
    return !!(skill && (
      skill.type === "chainsawChainGrab" ||
      skill.type === "chainsawSawSpin" ||
      skill.type === "chainsawHellArena"
    ));
  }

  function isHimSkill(skill) {
    return !!(skill && (
      skill.type === "himGazeLock" ||
      skill.type === "himForbiddenGesture" ||
      skill.type === "himAbsoluteCharm"
    ));
  }

  function getChainsawSpeedMultiplier() {
    return 1;
  }

  function getChainsawRangeMultiplier() {
    return 1;
  }

  function updateChainsawState(fighter, now = getBattleNow()) {
    if (!fighter) return;
    updateConceptSuppressionState(fighter, now);
    if (fighter.abilityType === "chainsawDevil") {
      updateChainsawSawSpin(fighter, now);
      updateChainsawHellArena(fighter, now);
    }
    const element = getEntityElement(fighter);
    if (element) {
      element.classList.toggle("concept-suppressed-fighter", !!getActiveConceptSuppression(fighter, now));
      removeElement(element.querySelector(".mini-chainsaw"));
    }
  }

  function getChainsawExtinctionRecord(attacker, target, create = false) {
    if (!attacker || !target) return null;
    if (!target.chainsawExtinctionRecords) target.chainsawExtinctionRecords = new Map();
    let record = target.chainsawExtinctionRecords.get(attacker.id);
    if (!record && create) {
      record = {
        attackerId: attacker.id,
        attackerName: attacker.name || "체인소맨",
        stacks: 0,
        suppressedUntilByType: new Map(),
        lastStackBySource: new Map(),
        stackEffect: null
      };
      target.chainsawExtinctionRecords.set(attacker.id, record);
    }
    return record || null;
  }

  function getNormalSkillTypes(fighter) {
    if (!fighter || !Array.isArray(fighter.skills)) return [];
    return fighter.skills
      .filter((skill) => skill && !isUltimateSkill(skill) && !skill.linkedOnly)
      .map((skill) => skill.type);
  }

  function getUltimateSkillType(fighter) {
    const ultimate = fighter && Array.isArray(fighter.skills)
      ? fighter.skills.find((skill) => skill && isUltimateSkill(skill) && !skill.linkedOnly)
      : null;
    return ultimate ? ultimate.type : "";
  }

  function getSkillDisplayNameByType(fighter, type) {
    if (type === CHAINSAW_SUPPRESS_PASSIVE) return "패시브";
    if (type === CHAINSAW_SUPPRESS_ULTIMATE) {
      const ultimateType = getUltimateSkillType(fighter);
      const ultimateSkill = fighter && Array.isArray(fighter.skills)
        ? fighter.skills.find((item) => item && item.type === ultimateType)
        : null;
      return ultimateSkill ? getBlueEyesSkillName(ultimateSkill) : "궁극기";
    }
    const skill = fighter && Array.isArray(fighter.skills) ? fighter.skills.find((item) => item && item.type === type) : null;
    return skill ? getBlueEyesSkillName(skill) : String(type || "스킬");
  }

  function cleanupChainsawExtinctionRecords(target, now = getBattleNow()) {
    if (!target || !target.chainsawExtinctionRecords) return;
    target.chainsawExtinctionRecords.forEach((record, attackerId) => {
      if (record.suppressedUntilByType) {
        Array.from(record.suppressedUntilByType.keys()).forEach((type) => {
          if (now >= Number(record.suppressedUntilByType.get(type) || 0)) {
            record.suppressedUntilByType.delete(type);
          }
        });
      }
      if ((record.stacks || 0) <= 0 && (!record.suppressedUntilByType || record.suppressedUntilByType.size === 0)) {
        removeElement(record.stackEffect);
        target.chainsawExtinctionRecords.delete(attackerId);
      }
    });
  }

  function getChainsawMarksOnTarget(attacker, target) {
    const record = getChainsawExtinctionRecord(attacker, target, false);
    return record ? Math.max(0, Number(record.stacks) || 0) : 0;
  }

  function getTotalChainsawMarksOnTarget(target) {
    cleanupChainsawExtinctionRecords(target);
    if (!target || !target.chainsawExtinctionRecords || !target.chainsawExtinctionRecords.size) return 0;
    let total = 0;
    target.chainsawExtinctionRecords.forEach((record) => {
      total += Math.max(0, Number(record.stacks) || 0);
    });
    return total;
  }

  function addChainsawExtinctionStack(attacker, target, sourceId = "chainsaw", now = getBattleNow(), interval = 0) {
    if (!attacker || !target || attacker.dead || target.dead || attacker.abilityType !== "chainsawDevil") return 0;
    if (attacker === target || target.ownerId === attacker.id) return 0;
    const record = getChainsawExtinctionRecord(attacker, target, true);
    if (!record) return 0;
    const lastAt = Number(record.lastStackBySource.get(sourceId) || -Infinity);
    if (interval > 0 && now - lastAt < interval) return record.stacks;
    record.lastStackBySource.set(sourceId, now);
    record.stacks = clamp((Number(record.stacks) || 0) + 1, 0, CHAINSAW_EXTINCTION_MAX_STACKS);
    createChainsawExtinctionStackPulse(target, record.stacks);
    updateChainsawTargetMarkUi(target);
    if (record.stacks >= CHAINSAW_EXTINCTION_MAX_STACKS) {
      triggerChainsawExtinction(attacker, target, record, now);
    } else {
      addLog(`${target.name} 소멸 스택 ×${record.stacks}`, "ultimate");
    }
    return record.stacks;
  }

  function triggerChainsawExtinction(attacker, target, record, now = getBattleNow()) {
    if (!attacker || !target || !record) return false;
    const active = getActiveConceptSuppression(target, now);
    const suppressed = active && active.skillTypes ? active.skillTypes : new Set();
    const normalCandidates = getNormalSkillTypes(target).filter((type) => !suppressed.has(type));
    const ultimateType = getUltimateSkillType(target);
    const canSuppressUltimate = !!ultimateType && !(active && active.ultimate);
    const canSuppressPassive = !!target.abilityType && !(active && active.passive);
    record.stacks = 0;
    removeElement(record.stackEffect);
    record.stackEffect = null;
    let selectedType = "";
    if (normalCandidates.length) {
      selectedType = normalCandidates[Math.floor(Math.random() * normalCandidates.length)];
    } else if (canSuppressUltimate) {
      selectedType = CHAINSAW_SUPPRESS_ULTIMATE;
    } else if (canSuppressPassive) {
      selectedType = CHAINSAW_SUPPRESS_PASSIVE;
    } else {
      const extended = extendChainsawSuppressionDuration(target, now, 1000);
      updateChainsawTargetMarkUi(target);
      addLog(extended
        ? `${target.name} 소멸 지속시간 +1초`
        : `${target.name} 소멸 후보 없음`, extended ? "ultimate" : "skill");
      return extended;
    }
    if (!record.suppressedUntilByType) record.suppressedUntilByType = new Map();
    record.suppressedUntilByType.set(selectedType, now + CHAINSAW_EXTINCTION_DURATION);
    if (
      target.skillState &&
      target.skillState.skill &&
      (target.skillState.skill.type === selectedType || (selectedType === CHAINSAW_SUPPRESS_ULTIMATE && isUltimateSkill(target.skillState.skill)))
    ) {
      cancelFighterSkill(target);
    }
    createChainsawExtinctionTriggerEffect(target, selectedType);
    updateConceptSuppressionState(target, now);
    updateChainsawTargetMarkUi(target);
    const extinctionDamage = Math.max(1, (Number(target.maxHp) || 0) * 0.1);
    const actualDamage = applyDamage(attacker, target, {
      label: "소멸 피해",
      fixedDamage: extinctionDamage,
      damageKind: "패시브",
      attackId: `chainsaw-extinction-${attacker.id}-${target.id}-${Math.round(now)}`
    });
    if (actualDamage > 0) createChainsawExtinctionDamageText(target, actualDamage);
    addLog(`${target.name} ${getSkillDisplayNameByType(target, selectedType)} 소멸 15초`, "ultimate");
    return true;
  }

  function extendChainsawSuppressionDuration(target, now = getBattleNow(), amount = 1000) {
    if (!target || !target.chainsawExtinctionRecords) return false;
    let extended = false;
    target.chainsawExtinctionRecords.forEach((record) => {
      if (!record || !record.suppressedUntilByType) return;
      record.suppressedUntilByType.forEach((value, type) => {
        if (now < Number(value || 0)) {
          record.suppressedUntilByType.set(type, Number(value) + amount);
          extended = true;
        }
      });
    });
    if (extended) {
      updateConceptSuppressionState(target, now);
      updateChainsawTargetMarkUi(target);
      createChainsawExtinctionTriggerEffect(target);
    }
    return extended;
  }

  function clearChainsawMarksForOwner(ownerId) {
    if (!ownerId) return;
    Object.values(game.fighters).forEach((fighter) => {
      if (!fighter || !fighter.chainsawExtinctionRecords) return;
      const record = fighter.chainsawExtinctionRecords.get(ownerId);
      if (record) removeElement(record.stackEffect);
      fighter.chainsawExtinctionRecords.delete(ownerId);
      updateChainsawTargetMarkUi(fighter);
    });
    game.summons.forEach((summon) => {
      if (!summon || !summon.chainsawExtinctionRecords) return;
      const record = summon.chainsawExtinctionRecords.get(ownerId);
      if (record) removeElement(record.stackEffect);
      summon.chainsawExtinctionRecords.delete(ownerId);
      updateChainsawTargetMarkUi(summon);
    });
  }

  function handleChainsawBodyCollision(attacker, defender) {
    if (!attacker || !defender || attacker.dead || defender.dead) return;
    if (attacker.abilityType !== "chainsawDevil") return;
    if (!attacker.chainsawBodyContacts) attacker.chainsawBodyContacts = new Set();
    if (attacker.chainsawBodyContacts.has(defender.id)) return;
    attacker.chainsawBodyContacts.add(defender.id);
  }

  function rememberRecentNormalSkillUse() {}

  function shouldStartChainsawSkillNow(fighter, opponent, skill, now) {
    if (!fighter || !skill) return false;
    if (skill.type === "chainsawHellArena") return !!opponent && !opponent.dead && !fighter.chainsawHellArena;
    if (skill.type === "chainsawSawSpin") return !fighter.chainsawSpin || now >= fighter.chainsawSpin.endAt;
    if (skill.type === "chainsawChainGrab") return !!opponent && !opponent.dead && !isFighterOutOfBattle(opponent);
    return true;
  }

  function getChainsawSkillPriorityEntries(fighter) {
    if (!fighter || !Array.isArray(fighter.skills)) return [];
    const priority = ["chainsawHellArena", "chainsawSawSpin", "chainsawChainGrab"];
    const entries = [];
    priority.forEach((type) => {
      const index = fighter.skills.findIndex((skill) => skill && skill.type === type);
      if (index >= 0) entries.push({ skill: fighter.skills[index], index });
    });
    fighter.skills.forEach((skill, index) => {
      if (!skill || priority.includes(skill.type)) return;
      entries.push({ skill, index });
    });
    return entries;
  }

  function getActiveConceptSuppression(fighter, now = getBattleNow()) {
    cleanupChainsawExtinctionRecords(fighter, now);
    if (!fighter || !fighter.chainsawExtinctionRecords || !fighter.chainsawExtinctionRecords.size) return null;
    const skillTypes = new Set();
    let passive = false;
    let ultimate = false;
    let until = 0;
    fighter.chainsawExtinctionRecords.forEach((record) => {
      if (!record || !record.suppressedUntilByType) return;
      record.suppressedUntilByType.forEach((value, type) => {
        if (now < value) {
          if (type === CHAINSAW_SUPPRESS_PASSIVE) {
            passive = true;
          } else if (type === CHAINSAW_SUPPRESS_ULTIMATE) {
            ultimate = true;
          } else {
            skillTypes.add(type);
          }
          until = Math.max(until, value);
        }
      });
    });
    if (!skillTypes.size && !passive && !ultimate) return null;
    return { until, skillTypes, suppressedSkillIds: skillTypes, passive, ultimate, full: false };
  }

  function isSkillSuppressedByConcept(fighter, skill, now = getBattleNow()) {
    const state = getActiveConceptSuppression(fighter, now);
    return !!(state && skill && ((state.skillTypes && state.skillTypes.has(skill.type)) || (state.ultimate && isUltimateSkill(skill))));
  }

  function isPassiveSuppressedByConcept(fighter, now = getBattleNow()) {
    const state = getActiveConceptSuppression(fighter, now);
    return !!(state && (state.passive || state.full));
  }

  function isConceptFullySuppressed() {
    return false;
  }

  function updateConceptSuppressionState(fighter, now = getBattleNow()) {
    if (fighter && fighter.chainsawExtinctionRecords) {
      fighter.chainsawExtinctionRecords.forEach((record) => updateChainsawExtinctionStackVisual(fighter, record));
    }
    const state = getActiveConceptSuppression(fighter, now);
    const effect = fighter && fighter.chainsawSuppressionEffect;
    if (!state) {
      removeElement(effect);
      if (fighter) fighter.chainsawSuppressionEffect = null;
      const element = fighter && getEntityElement(fighter);
      if (element) {
        element.classList.remove("concept-suppressed-fighter");
        removeElement(element.querySelector(".concept-status-badge"));
      }
      return;
    }
    if (!effect) {
      fighter.chainsawSuppressionEffect = createChainsawExtinctionAura(fighter);
    } else {
      updateChainsawEntityEffect(effect, fighter, fighter.radius * 3.2, fighter.radius * 3.2);
    }
    const element = getEntityElement(fighter);
    if (element) {
      element.classList.add("concept-suppressed-fighter");
      let badge = element.querySelector(".concept-status-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "concept-status-badge";
        element.appendChild(badge);
      }
      badge.textContent = `소멸됨 ${formatAmount((state.until - now) / 1000)}초`;
    }
  }

  function applyConceptSuppression() {
    return false;
  }

  function clearConceptSuppression(fighter) {
    if (!fighter) return;
    if (fighter.chainsawExtinctionRecords) {
      fighter.chainsawExtinctionRecords.forEach((record) => {
        if (record && record.suppressedUntilByType) record.suppressedUntilByType.clear();
        if (record) {
          record.stacks = 0;
          removeElement(record.stackEffect);
          record.stackEffect = null;
        }
      });
      fighter.chainsawExtinctionRecords.clear();
    }
    removeElement(fighter.chainsawSuppressionEffect);
    fighter.chainsawSuppressionEffect = null;
    const element = getEntityElement(fighter);
    if (element) {
      element.classList.remove("concept-suppressed-fighter");
      removeElement(element.querySelector(".concept-status-badge"));
      removeElement(element.querySelector(".mini-chainsaw-mark"));
    }
  }

  function clearOwnedTemporaryObjects(owner) {
    if (!owner) return;
    game.arenaObjects.slice().forEach((object) => {
      if (!object || object.ownerId !== owner.id) return;
      removeElement(object.element);
      game.arenaObjects = game.arenaObjects.filter((item) => item !== object);
    });
    game.summons.slice().forEach((summon) => {
      if (!summon || summon.ownerId !== owner.id) return;
      removeElement(summon.element);
      summon.dead = true;
      summon.removing = true;
      game.summons = game.summons.filter((item) => item !== summon);
    });
    if (owner.ricoBullets) owner.ricoBullets.slice().forEach((bullet) => removeElement(bullet.element));
    owner.ricoBullets = [];
    if (owner.oiiaProjectiles) {
      owner.oiiaProjectiles.slice().forEach((projectile) => removeElement(projectile.element));
      owner.oiiaProjectiles = [];
    }
    if (owner.ronaldoBalls) {
      owner.ronaldoBalls.slice().forEach((ball) => removeElement(ball.element));
      owner.ronaldoBalls = [];
    }
    if (owner.gojoProjectiles) {
      owner.gojoProjectiles.slice().forEach((projectile) => removeElement(projectile.element));
      owner.gojoProjectiles = [];
    }
  }

  function startChainsawDash(fighter, opponent, skill, now) {
    clearInvalidChainsawEffectElements();
    const state = fighter.skillState;
    const data = state.data;
    const direction = opponent && !opponent.dead ? getOpponentDirection(fighter, opponent) : { x: data.dirX || 1, y: data.dirY || 0, angle: data.angle || 0 };
    const casterCenter = getChainsawEntityCenter(fighter, "ChainsawDash:caster");
    const targetCenter = getChainsawEntityCenter(opponent, "ChainsawDash:target");
    if (!casterCenter) {
      cancelFighterSkill(fighter);
      return;
    }
    if (false) {
      console.debug(`[ChainsawDash] casterCenter=(${Math.round(casterCenter.x)}, ${Math.round(casterCenter.y)}), targetCenter=${targetCenter ? `(${Math.round(targetCenter.x)}, ${Math.round(targetCenter.y)})` : "none"}, effectStart=(${Math.round(casterCenter.x)}, ${Math.round(casterCenter.y)})`);
      createChainsawDebugPoint("caster", casterCenter.x, casterCenter.y, "casterCenter");
      if (targetCenter) createChainsawDebugPoint("target", targetCenter.x, targetCenter.y, "targetCenter");
      createChainsawDebugPoint("start", casterCenter.x, casterCenter.y, "dashStart");
    }
    data.dirX = direction.x;
    data.dirY = direction.y;
    data.angle = direction.angle;
    const speed = getPixelSpeed(fighter) * 3.05;
    data.status = "dash";
    data.endAt = now + (Number(skill.dashDuration) || 620);
    data.lastTrailAt = 0;
    const targetDistance = opponent && !opponent.dead ? Math.hypot(opponent.x - fighter.x, opponent.y - fighter.y) : game.arenaSize * 0.56;
    data.maxDistance = clamp(targetDistance + fighter.radius * 2.4, fighter.radius * 4, game.arenaSize * 0.95);
    data.startX = casterCenter.x;
    data.startY = casterCenter.y;
    data.hitTargets = data.hitTargets || new Set();
    data.lastProbeX = casterCenter.x;
    data.lastProbeY = casterCenter.y;
    data.dashSpeed = speed;
    fighter.vx = direction.x * speed;
    fighter.vy = direction.y * speed;
    getFighterElement(fighter).classList.add("chainsaw-dashing");
    createChainsawIgnitionEffect(fighter);
    createChainsawDashAfterimage(fighter, data.angle);
    createChainsawSlashEffect(casterCenter.x, casterCenter.y, fighter.radius * 1.5, "dash-start");
  }

  function updateChainsawDash(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;
    const data = state.data;
    const skill = state.skill;
    if (now - (data.lastTrailAt || 0) > 80) {
      data.lastTrailAt = now;
      const center = getChainsawEntityCenter(fighter, "ChainsawDash:trail");
      const trail = center ? createChainsawGroundScar(center.x, center.y, Math.atan2(fighter.vy || data.dirY, fighter.vx || data.dirX), fighter.radius * 1.2) : null;
      data.trailEffects = data.trailEffects || [];
      if (trail) data.trailEffects.push(trail);
      createChainsawDashAfterimage(fighter, Math.atan2(fighter.vy || data.dirY, fighter.vx || data.dirX));
    }
    if (opponent && !opponent.dead) {
      const key = opponent.id;
      const hitRange = (fighter.radius + opponent.radius) * 1.2;
      const directHit = Math.hypot(opponent.x - fighter.x, opponent.y - fighter.y) <= hitRange;
      const pathHit = isChainsawTargetOnDashPath(data, fighter, opponent, hitRange);
      if (!data.hitTargets.has(key) && (directHit || pathHit)) {
        data.hitTargets.add(key);
        applyDamage(fighter, opponent, {
          label: "체인소맨",
          baseDamage: Number(skill.damage) || 18,
          chainsawHit: true,
          attackId: `${data.attackId}-${key}`
        });
        knockbackEntity(fighter, opponent, opponent.radius * (Number(skill.knockbackRate) || 1.25));
        const targetCenter = getChainsawEntityCenter(opponent, "ChainsawDash:hit-target");
        if (targetCenter) {
          createChainsawSlashEffect(targetCenter.x, targetCenter.y, opponent.radius * 1.9, "hit");
          createChainsawCircularFinisher(targetCenter.x, targetCenter.y, opponent.radius * 1.22);
        }
        data.endAt = Math.min(data.endAt, now + 80);
      const movedStartX = Number.isFinite(Number(data.startX)) ? Number(data.startX) : fighter.x;
      const movedStartY = Number.isFinite(Number(data.startY)) ? Number(data.startY) : fighter.y;
      const moved = Math.hypot(fighter.x - movedStartX, fighter.y - movedStartY);
      data.maxDistance = Math.min(data.maxDistance || game.arenaSize, moved + fighter.radius * 0.75);
      }
    }
    const startX = Number.isFinite(Number(data.startX)) ? Number(data.startX) : fighter.x;
    const startY = Number.isFinite(Number(data.startY)) ? Number(data.startY) : fighter.y;
    const movedDistance = Math.hypot(fighter.x - startX, fighter.y - startY);
    const touchedWall = isNearArenaWall(fighter);
    if (touchedWall && !data.wallScratched) {
      data.wallScratched = true;
      createChainsawWallImpact(fighter, Math.atan2(data.dirY || 0, data.dirX || 1));
      pulseArena();
    }
    if (now >= data.endAt || movedDistance >= (data.maxDistance || game.arenaSize) || touchedWall) {
      clearChainsawSkillState(fighter, state);
      restoreStoredVelocity(fighter, state);
      startSkillRecovery(fighter, skill, now);
      return;
    }
    updateChainsawDashProbe(data, fighter);
  }

  function startChainsawChainPull(fighter, opponent, skill, now) {
    clearInvalidChainsawEffectElements();
    const state = fighter.skillState;
    const data = state.data;
    const range = game.arenaSize * (Number(skill.rangeRate) || 0.92) * getChainsawRangeMultiplier(fighter, now);
    const distance = opponent ? Math.hypot(opponent.x - fighter.x, opponent.y - fighter.y) : Infinity;
    const rayLength = getArenaRayLength(fighter.x, fighter.y, data.dirX || 1, data.dirY || 0, range);
    const forcedMode = "";
    data.mode = forcedMode === "miss" ? "miss" : forcedMode === "wall" ? "wall" : forcedMode === "enemy" ? "enemy" : distance <= range ? "enemy" : "wall";
    data.phase = "launch";
    data.launchStartAt = now;
    data.launchEndAt = now + 220;
    data.pullDuration = Number(skill.pullDuration) || 520;
    data.anchorX = fighter.x + (data.dirX || 1) * rayLength;
    data.anchorY = fighter.y + (data.dirY || 0) * rayLength;
    if (data.mode === "enemy" && opponent) {
      data.anchorX = opponent.x;
      data.anchorY = opponent.y;
    } else if (data.mode === "miss") {
      data.anchorX = clamp(fighter.x + (data.dirX || 1) * range, fighter.radius, game.arenaSize - fighter.radius);
      data.anchorY = clamp(fighter.y + (data.dirY || 0) * range, fighter.radius, game.arenaSize - fighter.radius);
    }
    const arm = getChainsawArmPoint(fighter, data.anchorX, data.anchorY);
    if (!arm) {
      clearChainsawSkillState(fighter, state);
      restoreStoredVelocity(fighter, state);
      startSkillRecovery(fighter, skill, now);
      return;
    }
    data.tipX = arm.x;
    data.tipY = arm.y;
    data.endAt = data.launchEndAt + data.pullDuration;
    data.chainLine = createChainsawChainVisual();
    data.effects.push(data.chainLine);
  }

  function updateChainsawChainPull(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;
    const data = state.data;
    const skill = state.skill;
    if (data.phase === "launch") {
      const progress = clamp((now - data.launchStartAt) / Math.max(1, data.launchEndAt - data.launchStartAt), 0, 1);
      const targetX = data.mode === "enemy" && opponent && !opponent.dead ? opponent.x : data.anchorX;
      const targetY = data.mode === "enemy" && opponent && !opponent.dead ? opponent.y : data.anchorY;
      const arm = getChainsawArmPoint(fighter, targetX, targetY);
      if (!arm) {
        clearChainsawSkillState(fighter, state);
        restoreStoredVelocity(fighter, state);
        startSkillRecovery(fighter, skill, now);
        return;
      }
      data.tipX = arm.x + (targetX - arm.x) * progress;
      data.tipY = arm.y + (targetY - arm.y) * progress;
      if (now >= data.launchEndAt) {
        data.phase = data.mode === "enemy" ? "enemyPull" : data.mode === "wall" ? "wallPull" : "retracting";
        data.endAt = now + data.pullDuration;
        if (data.phase === "wallPull") {
          const dx = data.anchorX - fighter.x;
          const dy = data.anchorY - fighter.y;
          const distance = Math.hypot(dx, dy) || 1;
          const speed = getPixelSpeed(fighter) * 2.25;
          fighter.vx = (dx / distance) * speed;
          fighter.vy = (dy / distance) * speed;
          createChainsawHookAnchor(data.anchorX, data.anchorY, fighter.radius, "wall");
        } else if (data.phase === "enemyPull" && opponent) {
          const targetCenter = getChainsawEntityCenter(opponent, "ChainsawChain:anchor-target");
          if (targetCenter) createChainsawHookAnchor(targetCenter.x, targetCenter.y, opponent.radius, "enemy");
        }
      }
    }

    if (data.chainLine) {
      const targetX = data.phase === "launch" ? data.tipX : (data.mode === "enemy" && opponent ? opponent.x : data.anchorX);
      const targetY = data.phase === "launch" ? data.tipY : (data.mode === "enemy" && opponent ? opponent.y : data.anchorY);
      const arm = getChainsawArmPoint(fighter, targetX, targetY);
      if (arm) updateChainsawChainVisual(data.chainLine, arm.x, arm.y, targetX, targetY, data.phase !== "launch" && data.phase !== "retracting");
    }
    if (data.phase === "enemyPull" && opponent && !opponent.dead) {
      const direction = getChainsawPairDirection(fighter, opponent, data.angle || 0);
      const minDistance = getChainsawMinPullDistance(fighter, opponent);
      const remaining = direction.distance - minDistance;
      fighter.shadowDashDamageSuppressUntil = Math.max(fighter.shadowDashDamageSuppressUntil || 0, now + 90);
      opponent.shadowDashDamageSuppressUntil = Math.max(opponent.shadowDashDamageSuppressUntil || 0, now + 90);
      data.chainNoBodyUntil = now + 90;
      if (remaining <= 1 || now >= data.endAt) {
        beginChainsawChainFinisher(fighter, opponent, data, now);
        return;
      }
      const pull = Math.min(direction.distance * 0.08, getPixelSpeed(fighter) * 0.05, Math.max(0, remaining / 2));
      if (pull <= 0.12) {
        beginChainsawChainFinisher(fighter, opponent, data, now);
        return;
      }
      fighter.x += direction.x * pull;
      fighter.y += direction.y * pull;
      opponent.x -= direction.x * pull;
      opponent.y -= direction.y * pull;
      keepInsideArena(fighter);
      keepInsideArena(opponent);
      enforceChainsawMinDistance(fighter, opponent, minDistance, direction.x, direction.y);
      data.lastEffectX = (fighter.x + opponent.x) / 2;
      data.lastEffectY = (fighter.y + opponent.y) / 2;
    }
    if (data.phase === "wallPull") {
      const anchorX = Number.isFinite(Number(data.anchorX)) ? Number(data.anchorX) : fighter.x;
      const anchorY = Number.isFinite(Number(data.anchorY)) ? Number(data.anchorY) : fighter.y;
      const wallDistance = Math.hypot(anchorX - fighter.x, anchorY - fighter.y);
      if (wallDistance <= fighter.radius * 0.75 || now >= data.endAt) {
        data.phase = "swinging";
        data.swingStartAt = now;
        data.swingEndAt = now + 360;
        data.swingRadius = Math.max(fighter.radius * 1.6, Math.hypot(fighter.x - data.anchorX, fighter.y - data.anchorY));
        data.swingStartAngle = Math.atan2(fighter.y - data.anchorY, fighter.x - data.anchorX);
        const targetAngle = opponent && !opponent.dead ? Math.atan2(opponent.y - data.anchorY, opponent.x - data.anchorX) : data.swingStartAngle + Math.PI;
        const delta = Math.atan2(Math.sin(targetAngle - data.swingStartAngle), Math.cos(targetAngle - data.swingStartAngle));
        data.swingEndAngle = data.swingStartAngle + (Math.abs(delta) < 0.3 ? Math.sign(delta || 1) * Math.PI * 0.72 : delta * 0.9);
        fighter.vx = 0;
        fighter.vy = 0;
        const center = getChainsawEntityCenter(fighter, "ChainsawChain:wall-slash");
        if (center) createChainsawSlashEffect(center.x, center.y, fighter.radius * 1.8, "wall");
      }
      return;
    }
    if (data.phase === "swinging") {
      const progress = clamp((now - data.swingStartAt) / Math.max(1, data.swingEndAt - data.swingStartAt), 0, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      const angle = data.swingStartAngle + (data.swingEndAngle - data.swingStartAngle) * eased;
      fighter.x = clamp(data.anchorX + Math.cos(angle) * data.swingRadius, fighter.radius, game.arenaSize - fighter.radius);
      fighter.y = clamp(data.anchorY + Math.sin(angle) * data.swingRadius, fighter.radius, game.arenaSize - fighter.radius);
      if (now - (data.lastSwingScarAt || 0) > 90) {
        data.lastSwingScarAt = now;
        const center = getChainsawEntityCenter(fighter, "ChainsawChain:swing-scar");
        const scar = center ? createChainsawGroundScar(center.x, center.y, angle + Math.PI / 2, fighter.radius * 1.15) : null;
        if (scar) data.effects.push(scar);
      }
      if (now < data.swingEndAt) return;
      data.phase = "rebound";
      data.endAt = now + 340;
      if (opponent && !opponent.dead) {
        const direction = getOpponentDirection(fighter, opponent);
        const speed = getPixelSpeed(fighter) * 1.95;
        fighter.vx = direction.x * speed;
        fighter.vy = direction.y * speed;
      }
      return;
    }
    if (data.phase === "rebound") {
      // 벽 적중 후 튕겨 나가는 구간은 이동 연출만 담당한다.
      // 피해는 기존 본체 충돌 시스템에서만 처리되어 사슬 스킬 피해와 중복되지 않는다.
    }
    if (data.phase === "retracting") {
      if (now < data.endAt) return;
      createChainsawHookAnchor(data.anchorX, data.anchorY, fighter.radius, "miss");
      clearChainsawSkillState(fighter, state);
      restoreStoredVelocity(fighter, state);
      startSkillRecovery(fighter, skill, now);
      return;
    }
    if (data.phase === "finisher") {
      if (opponent && !opponent.dead) {
        const direction = getChainsawPairDirection(fighter, opponent, data.angle || 0);
        enforceChainsawMinDistance(fighter, opponent, getChainsawMinPullDistance(fighter, opponent), direction.x, direction.y);
        fighter.shadowDashDamageSuppressUntil = Math.max(fighter.shadowDashDamageSuppressUntil || 0, now + 80);
        opponent.shadowDashDamageSuppressUntil = Math.max(opponent.shadowDashDamageSuppressUntil || 0, now + 80);
      }
      if (!data.finisherDone && opponent && !opponent.dead) {
        finishChainsawChainHit(fighter, opponent, skill, data, now);
      }
      if (now < data.endAt) return;
      clearChainsawSkillState(fighter, state);
      restoreStoredVelocity(fighter, state);
      startSkillRecovery(fighter, skill, now);
      return;
    }
    if (now < data.endAt) return;
    if (data.phase === "enemyPull" && opponent && !opponent.dead) {
      beginChainsawChainFinisher(fighter, opponent, data, now);
      finishChainsawChainHit(fighter, opponent, skill, data, now);
      return;
    }
    if (data.phase === "finisher" && opponent && !opponent.dead) finishChainsawChainHit(fighter, opponent, skill, data, now);
    clearChainsawSkillState(fighter, state);
    startSkillRecovery(fighter, skill, now);
  }

  function useChainsawBloodStarter(fighter, skill, now) {
    clearInvalidChainsawEffectElements();
    const missing = Math.max(0, fighter.maxHp - fighter.currentHp);
    const amount = Math.max(Number(skill.minHeal) || 4, missing * (Number(skill.missingHpHealRate) || 0.2));
    const healed = healFighter(fighter, amount, "체인소맨 회복");
    if (healed > 0) {
      createChainsawSpark(fighter, "blood");
      createChainsawHealText(fighter, healed);
    }
    createChainsawIgnitionEffect(fighter);
    restoreStoredVelocity(fighter, fighter.skillState);
    startSkillRecovery(fighter, skill, now);
  }

  function startChainsawConceptEat(fighter, opponent, skill, now) {
    clearInvalidChainsawEffectElements();
    const state = fighter.skillState;
    const plan = getChainsawConceptPlan(fighter, opponent, now);
    if (!plan) {
      cancelFighterSkill(fighter);
      return;
    }
    const data = state.data;
    data.plan = plan;
    data.status = "회전 준비";
    data.startAt = now;
    data.endAt = now + 2600;
    data.nextDashAt = now + 280;
    data.dashIndex = 0;
    data.hitApplied = false;
    data.suppressionApplied = false;
    data.originalX = fighter.x;
    data.originalY = fighter.y;
    data.effects.push(createSkillTitle("궁극기", "지옥의 전장", "chainsaw-hell-title", 980));
    data.rotatingSaws = createChainsawConceptSaws(fighter);
    data.effects.push(data.rotatingSaws);
    fighter.vx = 0;
    fighter.vy = 0;
  }

  function updateChainsawConceptEat(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;
    const data = state.data;
    const skill = state.skill;
    updateChainsawConceptSaws(data.rotatingSaws, fighter, now, data.dashIndex || 0, data.status === "dashing");
    if (!opponent || opponent.dead || isFighterOutOfBattle(opponent)) {
      finishChainsawConceptEat(fighter, state, now, false);
      return;
    }
    if (data.status === "회전 준비" || data.status === "between") {
      fighter.vx = 0;
      fighter.vy = 0;
      if (now >= data.nextDashAt) {
        beginChainsawConceptDash(fighter, opponent, data, now);
      }
      return;
    }
    if (data.status === "dashing") {
      if (now - (data.lastTrailAt || 0) > 58) {
        data.lastTrailAt = now;
        const angle = Math.atan2(fighter.vy || data.dirY || 0, fighter.vx || data.dirX || 1);
        data.trailEffects = data.trailEffects || [];
        const center = getChainsawEntityCenter(fighter, "ChainsawUlt:trail");
        const scar = center ? createChainsawGroundScar(center.x, center.y, angle, fighter.radius * (data.dashIndex >= 3 ? 1.55 : 1.12)) : null;
        if (scar) data.trailEffects.push(scar);
        createChainsawDashAfterimage(fighter, angle);
      }
      const hitRange = fighter.radius + opponent.radius + 18;
      const distance = Math.hypot(opponent.x - fighter.x, opponent.y - fighter.y);
      const pathHit = isChainsawTargetOnDashPath(data, fighter, opponent, hitRange);
      if (data.dashIndex >= 3 && !data.hitApplied && (distance <= hitRange || pathHit)) {
        applyChainsawConceptFinalHit(fighter, opponent, skill, data, now);
      } else if (data.dashIndex < 3 && (distance <= hitRange || pathHit) && now - (data.lastConceptGrazeAt || 0) > 180) {
        data.lastConceptGrazeAt = now;
        const targetCenter = getChainsawEntityCenter(opponent, "ChainsawUlt:graze-target");
        if (targetCenter) createChainsawSlashEffect(targetCenter.x, targetCenter.y, opponent.radius * 1.65, "concept-graze");
        createChainsawSpark(opponent, "hit", 0.85);
      }
      const dashStartX = Number.isFinite(Number(data.dashStartX)) ? Number(data.dashStartX) : fighter.x;
      const dashStartY = Number.isFinite(Number(data.dashStartY)) ? Number(data.dashStartY) : fighter.y;
      const movedDistance = Math.hypot(fighter.x - dashStartX, fighter.y - dashStartY);
      const touchedWall = isNearArenaWall(fighter);
      if (touchedWall && !data.wallScratched) {
        data.wallScratched = true;
        createChainsawWallImpact(fighter, Math.atan2(data.dirY || 0, data.dirX || 1));
      }
      if (now >= data.dashEndAt || movedDistance >= (data.dashDistance || game.arenaSize) || touchedWall) {
        if (data.dashIndex >= 3 && !data.hitApplied) {
          applyChainsawConceptFinalHit(fighter, opponent, skill, data, now);
        }
        const direction = getChainsawPairDirection(fighter, opponent, data.angle || 0);
        enforceChainsawMinDistance(fighter, opponent, getChainsawMinPullDistance(fighter, opponent), direction.x, direction.y);
        fighter.vx = 0;
        fighter.vy = 0;
        if (data.dashIndex >= 3) {
          data.status = "ending";
          data.endAt = now + 280;
        } else {
          data.status = "between";
          data.nextDashAt = now + 145;
        }
        updateChainsawDashProbe(data, fighter);
        getFighterElement(fighter).classList.remove("chainsaw-dashing");
        if (data.rotatingSaws) data.rotatingSaws.classList.remove("dash-burst");
        return;
      }
      updateChainsawDashProbe(data, fighter);
      return;
    }
    if (data.status === "ending") {
      fighter.vx = 0;
      fighter.vy = 0;
      if (now >= data.endAt) finishChainsawConceptEat(fighter, state, now, true);
    }
  }

  function beginChainsawConceptDash(fighter, opponent, data, now) {
    if (!fighter || !opponent || !data) return;
    data.dashIndex = Math.min(3, (data.dashIndex || 0) + 1);
    const direction = getOpponentDirection(fighter, opponent);
    data.dirX = direction.x;
    data.dirY = direction.y;
    data.angle = direction.angle;
    data.status = "dashing";
    data.dashStartX = fighter.x;
    data.dashStartY = fighter.y;
    data.lastProbeX = fighter.x;
    data.lastProbeY = fighter.y;
    data.wallScratched = false;
    data.lastTrailAt = 0;
    const distance = Math.hypot(opponent.x - fighter.x, opponent.y - fighter.y);
    data.dashDistance = clamp(distance + fighter.radius * (data.dashIndex >= 3 ? 3.0 : 2.15), fighter.radius * 4.2, game.arenaSize * 0.96);
    data.dashEndAt = now + (data.dashIndex >= 3 ? 420 : 360);
    const speed = getPixelSpeed(fighter) * (data.dashIndex >= 3 ? 3.35 : 2.95 + data.dashIndex * 0.16);
    data.dashSpeed = speed;
    fighter.vx = direction.x * speed;
    fighter.vy = direction.y * speed;
    getFighterElement(fighter).classList.add("chainsaw-dashing");
      const center = getChainsawEntityCenter(fighter, "ChainsawUlt:dash-start");
      if (center) createChainsawSlashEffect(center.x, center.y, fighter.radius * (data.dashIndex >= 3 ? 2.15 : 1.55), data.dashIndex >= 3 ? "concept-final" : "concept-graze");
    createChainsawSpark(fighter, data.dashIndex >= 3 ? "hit" : "chain", 1 + data.dashIndex * 0.18);
    if (data.rotatingSaws) data.rotatingSaws.classList.add("dash-burst");
    const burstTimer = scheduleTimeout(() => {
      if (data.rotatingSaws) data.rotatingSaws.classList.remove("dash-burst");
    }, 220);
    data.timers = data.timers || [];
    data.timers.push(burstTimer);
  }

  function applyChainsawConceptFinalHit(fighter, opponent, skill, data, now) {
    if (!fighter || !opponent || !data || data.hitApplied) return;
    data.hitApplied = true;
    const plan = data.plan || getChainsawConceptPlan(fighter, opponent, now);
    if (!plan || getChainsawMarksOnTarget(fighter, opponent) < plan.cost) return;
    const actual = applyDamage(fighter, opponent, {
      label: "체인소맨 궁극기",
      baseDamage: plan.damage,
      skipChainsawMark: true,
      attackId: `${data.attackId}-${opponent.id}-final`
    });
    pulseArena();
    const targetCenter = getChainsawEntityCenter(opponent, "ChainsawUlt:final-target");
    if (targetCenter) createChainsawSlashEffect(targetCenter.x, targetCenter.y, opponent.radius * 3.1, "concept-hit");
    createChainsawConceptSealShred(fighter, opponent, plan);
    if (actual > 0 && applyConceptSuppression(fighter, opponent, plan, now)) {
      data.suppressionApplied = true;
      consumeChainsawMarks(fighter, opponent, plan.cost);
    }
    const direction = getChainsawPairDirection(fighter, opponent, data.angle || 0);
    enforceChainsawMinDistance(fighter, opponent, getChainsawMinPullDistance(fighter, opponent), direction.x, direction.y);
  }

  function finishChainsawConceptEat(fighter, state, now, applyRecovery) {
    if (!fighter || !state) return;
    clearChainsawSkillState(fighter, state);
    restoreStoredVelocity(fighter, state);
    if (applyRecovery) {
      startSkillRecovery(fighter, state.skill, now);
    } else {
      startSkillRecovery(fighter, state.skill, now);
    }
  }

  function clearChainsawSkillState(fighter, state) {
    if (!state || !state.data) return;
    removeElement(state.data.warning);
    removeElement(state.data.chainLine);
    if (state.data.effects) state.data.effects.forEach((effect) => removeElement(effect));
    if (state.data.trailEffects) state.data.trailEffects.forEach((effect) => removeElement(effect));
    if (state.data.timers) {
      state.data.timers.forEach((task) => {
        if (!task) return;
        task.cancelled = true;
        game.timeouts.delete(task);
      });
      state.data.timers = [];
    }
    const element = getFighterElement(fighter);
    if (element) element.classList.remove("chainsaw-dashing");
    clearInvalidChainsawEffectElements();
  }

  function resetChainsawState(fighter) {
    if (!fighter) return;
    clearConceptSuppression(fighter);
    if (fighter.skillState && fighter.skillState.skill && isChainsawSkill(fighter.skillState.skill)) clearChainsawSkillState(fighter, fighter.skillState);
    (fighter.chainsawTimers || []).forEach((timer) => {
      if (!timer) return;
      timer.cancelled = true;
      game.timeouts.delete(timer);
    });
    (fighter.chainsawEffects || []).forEach((effect) => removeElement(effect));
    fighter.chainsawTimers = [];
    fighter.chainsawEffects = [];
    clearChainsawMarksForOwner(fighter.id);
    fighter.chainsawRecentNormalSkills = [];
    if (fighter.chainsawBodyContacts) fighter.chainsawBodyContacts.clear();
    const element = getEntityElement(fighter);
    if (fighter.chainsawShredCleanupTask) {
      fighter.chainsawShredCleanupTask.cancelled = true;
      game.timeouts.delete(fighter.chainsawShredCleanupTask);
      fighter.chainsawShredCleanupTask = null;
    }
    fighter.chainsawShredUntil = 0;
    if (element) element.classList.remove("chainsaw-dashing", "concept-suppressed-fighter", "chainsaw-shredded");
    clearInvalidChainsawEffectElements();
  }

  function isNearArenaWall(fighter) {
    const margin = Math.max(2, fighter.radius * 0.12);
    return fighter.x <= fighter.radius + margin || fighter.x >= game.arenaSize - fighter.radius - margin || fighter.y <= fighter.radius + margin || fighter.y >= game.arenaSize - fighter.radius - margin;
  }

  function isValidChainsawCoord(value) {
    return Number.isFinite(Number(value));
  }

  function getChainsawEntityCenter(entity, label = "entity") {
    if (!entity || !isValidChainsawCoord(entity.x) || !isValidChainsawCoord(entity.y)) {
      warnChainsawCoord(label, entity && entity.x, entity && entity.y, "entity center unavailable");
      return null;
    }
    return { x: Number(entity.x), y: Number(entity.y) };
  }

  function warnChainsawCoord(label, x, y, reason = "invalid coordinate") {
    console.warn(`[ChainsawCoord] ${label}: ${reason}`, { x, y });
  }

  function createChainsawDebugPoint(kind, x, y, label = "") {
    return;
  }

  function getChainsawEffectPoint(label, x, y, width = 0, height = width, padding = 4, fallbackEntity = null) {
    let pointX = Number(x);
    let pointY = Number(y);
    if (!Number.isFinite(pointX) || !Number.isFinite(pointY)) {
      const fallback = getChainsawEntityCenter(fallbackEntity, `${label}:fallback`);
      if (!fallback) {
        warnChainsawCoord(label, x, y, "effect cancelled");
        return null;
      }
      warnChainsawCoord(label, x, y, "using caster center fallback");
      pointX = fallback.x;
      pointY = fallback.y;
    }
    const halfWidth = Math.min(Math.max(0, Number(width) / 2 || 0), Math.max(0, game.arenaSize / 2 - padding));
    const halfHeight = Math.min(Math.max(0, Number(height) / 2 || 0), Math.max(0, game.arenaSize / 2 - padding));
    const point = {
      x: clamp(pointX, halfWidth + padding, game.arenaSize - halfWidth - padding),
      y: clamp(pointY, halfHeight + padding, game.arenaSize - halfHeight - padding)
    };
    createChainsawDebugPoint(label && label.includes("target") ? "target" : label && label.includes("saw") ? "saw" : "effect", point.x, point.y, label);
    return point;
  }

  function clearInvalidChainsawEffectElements() {
    if (!els.skillLayer) return;
    Array.from(els.skillLayer.children).filter((element) => String(element.className || "").includes("chainsaw-")).forEach((element) => {
      const left = Number.parseFloat(element.style.left);
      const top = Number.parseFloat(element.style.top);
      if (!Number.isFinite(left) || !Number.isFinite(top) || (left <= 1 && top <= 1)) {
        removeElement(element);
      }
    });
  }

  function isChainsawTargetOnDashPath(data, fighter, target, range) {
    if (!data || !fighter || !target) return false;
    const fighterCenter = getChainsawEntityCenter(fighter, "ChainsawDash:path-caster");
    const targetCenter = getChainsawEntityCenter(target, "ChainsawDash:path-target");
    if (!fighterCenter || !targetCenter) return false;
    const startX = Number.isFinite(Number(data.lastProbeX)) ? Number(data.lastProbeX) : fighterCenter.x;
    const startY = Number.isFinite(Number(data.lastProbeY)) ? Number(data.lastProbeY) : fighterCenter.y;
    return distancePointToSegment(targetCenter.x, targetCenter.y, startX, startY, fighterCenter.x, fighterCenter.y) <= range;
  }

  function updateChainsawDashProbe(data, fighter) {
    if (!data || !fighter) return;
    const center = getChainsawEntityCenter(fighter, "ChainsawDash:probe");
    if (!center) return;
    data.lastProbeX = center.x;
    data.lastProbeY = center.y;
  }

  function getChainsawSafeEffectPoint(x, y, width = 0, height = width, padding = 4) {
    return getChainsawEffectPoint("chainsaw-safe", x, y, width, height, padding);
  }

  function getChainsawArmPoint(fighter, endX, endY) {
    const center = getChainsawEntityCenter(fighter, "chain-arm-caster");
    if (!center) return null;
    const targetX = isValidChainsawCoord(endX) ? Number(endX) : center.x;
    const targetY = isValidChainsawCoord(endY) ? Number(endY) : center.y;
    let dx = targetX - center.x;
    let dy = targetY - center.y;
    let length = Math.hypot(dx, dy);
    if (!length) {
      dx = fighter.vx || 1;
      dy = fighter.vy || 0;
      length = Math.hypot(dx, dy) || 1;
    }
    const dirX = dx / length;
    const dirY = dy / length;
    const sideBias = fighter.side === "B" ? -1 : 1;
    return {
      x: center.x + dirX * fighter.radius * 0.72 + (-dirY) * fighter.radius * 0.32 * sideBias,
      y: center.y + dirY * fighter.radius * 0.72 + dirX * fighter.radius * 0.32 * sideBias
    };
  }

  function getChainsawMinPullDistance(fighter, target) {
    if (!fighter || !target) return 0;
    return (Number(fighter.radius) || 0) + (Number(target.radius) || 0) + 14;
  }

  function getChainsawPairDirection(fighter, target, fallbackAngle = 0) {
    if (!fighter || !target) {
      return { x: Math.cos(fallbackAngle), y: Math.sin(fallbackAngle), distance: 0 };
    }
    let dx = target.x - fighter.x;
    let dy = target.y - fighter.y;
    let distance = Math.hypot(dx, dy);
    if (distance < 0.001) {
      dx = Math.cos(fallbackAngle || 0);
      dy = Math.sin(fallbackAngle || 0);
      distance = 1;
    }
    return { x: dx / distance, y: dy / distance, distance };
  }

  function enforceChainsawMinDistance(fighter, target, minDistance, dirX, dirY) {
    if (!fighter || !target || !Number.isFinite(minDistance) || minDistance <= 0) return;
    const current = Math.hypot(target.x - fighter.x, target.y - fighter.y);
    if (current >= minDistance - 0.25) return;
    const missing = (minDistance - current) / 2;
    const nx = Number.isFinite(dirX) ? dirX : 1;
    const ny = Number.isFinite(dirY) ? dirY : 0;
    fighter.x = clamp(fighter.x - nx * missing, fighter.radius, game.arenaSize - fighter.radius);
    fighter.y = clamp(fighter.y - ny * missing, fighter.radius, game.arenaSize - fighter.radius);
    target.x = clamp(target.x + nx * missing, target.radius, game.arenaSize - target.radius);
    target.y = clamp(target.y + ny * missing, target.radius, game.arenaSize - target.radius);
    const after = getChainsawPairDirection(fighter, target);
    const stillMissing = minDistance - after.distance;
    if (stillMissing > 0.5) {
      target.x = clamp(target.x + after.x * stillMissing, target.radius, game.arenaSize - target.radius);
      target.y = clamp(target.y + after.y * stillMissing, target.radius, game.arenaSize - target.radius);
    }
  }

  function getChainsawMoveRoom(entity, dirX, dirY) {
    if (!entity) return 0;
    const size = game.arenaSize || 0;
    const radius = Number(entity.radius) || 0;
    let room = Infinity;
    if (dirX > 0) room = Math.min(room, (size - radius - entity.x) / dirX);
    if (dirX < 0) room = Math.min(room, (radius - entity.x) / dirX);
    if (dirY > 0) room = Math.min(room, (size - radius - entity.y) / dirY);
    if (dirY < 0) room = Math.min(room, (radius - entity.y) / dirY);
    if (!Number.isFinite(room)) return Infinity;
    return Math.max(0, room);
  }

  function moveChainsawGrabPair(fighter, target, dirX, dirY, distance) {
    const total = Math.max(0, Number(distance) || 0);
    if (!fighter || !target || total <= 0) return;
    const fighterRoom = getChainsawMoveRoom(fighter, dirX, dirY);
    const targetRoom = getChainsawMoveRoom(target, -dirX, -dirY);
    let fighterMove = Math.min(total * 0.5, fighterRoom);
    let targetMove = Math.min(total * 0.5, targetRoom);
    let leftover = total - fighterMove - targetMove;
    if (leftover > 0.001) {
      const addToFighter = Math.min(leftover, Math.max(0, fighterRoom - fighterMove));
      fighterMove += addToFighter;
      leftover -= addToFighter;
    }
    if (leftover > 0.001) {
      const addToTarget = Math.min(leftover, Math.max(0, targetRoom - targetMove));
      targetMove += addToTarget;
    }
    fighter.x += dirX * fighterMove;
    fighter.y += dirY * fighterMove;
    target.x -= dirX * targetMove;
    target.y -= dirY * targetMove;
  }

  function beginChainsawChainFinisher(fighter, target, data, now) {
    if (!fighter || !target || !data || data.phase === "finisher") return;
    const direction = getChainsawPairDirection(fighter, target, data.angle || 0);
    const minDistance = getChainsawMinPullDistance(fighter, target);
    enforceChainsawMinDistance(fighter, target, minDistance, direction.x, direction.y);
    fighter.vx = 0;
    fighter.vy = 0;
    target.vx = 0;
    target.vy = 0;
    data.phase = "finisher";
    data.status = "마무리 절단";
    data.finisherStartAt = now;
    data.endAt = now + 260;
    data.finisherDone = false;
    data.chainNoBodyUntil = now + 340;
    data.lastEffectX = (fighter.x + target.x) / 2;
    data.lastEffectY = (fighter.y + target.y) / 2;
    fighter.shadowDashDamageSuppressUntil = Math.max(fighter.shadowDashDamageSuppressUntil || 0, now + 340);
    target.shadowDashDamageSuppressUntil = Math.max(target.shadowDashDamageSuppressUntil || 0, now + 340);
    createChainsawSpark(fighter, "chain", 1.15);
    data.effects.push(createChainsawGroundScar(data.lastEffectX, data.lastEffectY, Math.atan2(direction.y, direction.x), Math.max(fighter.radius, target.radius) * 1.3));
  }

  function finishChainsawChainHit(fighter, target, skill, data, now) {
    if (!fighter || !target || target.dead || !skill || !data || data.finisherDone) return;
    data.finisherDone = true;
    if (!data.hitTargets.has(target.id)) {
      data.hitTargets.add(target.id);
      applyDamage(fighter, target, {
        label: "사슬 견인",
        baseDamage: Number(skill.damage) || 18,
        chainsawHit: true,
        attackId: `${data.attackId}-${target.id}`
      });
      applySlowEffect(target, Number(skill.slowRate) || 0.2, Number(skill.slowDuration) || 1500, now);
      const direction = getChainsawPairDirection(fighter, target, data.angle || 0);
      target.vx += direction.x * getPixelSpeed(fighter) * 0.55;
      target.vy += direction.y * getPixelSpeed(fighter) * 0.55;
      const centerX = (fighter.x + target.x) / 2;
      const centerY = (fighter.y + target.y) / 2;
      data.lastEffectX = centerX;
      data.lastEffectY = centerY;
      createChainsawCircularFinisher(centerX, centerY, Math.max(fighter.radius, target.radius) * 2.45);
      const targetCenter = getChainsawEntityCenter(target, "ChainsawChain:finisher-target");
      if (targetCenter) createChainsawSlashEffect(targetCenter.x, targetCenter.y, target.radius * 1.55, "hit");
      createChainsawSpark(target, "hit", 1.05);
    }
  }

  function setChainsawEffectSize(element, width, height = width) {
    if (!element) return;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
  }

  function createChainsawEffectElement(className, html = "") {
    const element = document.createElement("div");
    element.className = className;
    element.innerHTML = html;
    els.skillLayer.appendChild(element);
    return element;
  }

  function updateChainsawPositionedElement(element, x, y, angle = 0, scale = 1) {
    if (!element) return false;
    if (!isValidChainsawCoord(x) || !isValidChainsawCoord(y)) {
      warnChainsawCoord(element.className || "chainsaw-position", x, y, "position update cancelled");
      removeElement(element);
      return false;
    }
    const safeAngle = Number.isFinite(Number(angle)) ? Number(angle) : 0;
    const safeScale = Number.isFinite(Number(scale)) ? Number(scale) : 1;
    element.style.left = `${Number(x)}px`;
    element.style.top = `${Number(y)}px`;
    element.style.transform = `translate(-50%, -50%) rotate(${safeAngle}rad) scale(${safeScale})`;
    return true;
  }

  function createChainsawSawHtml(teeth = 16) {
    const toothHtml = Array.from({ length: teeth }, (_, index) => `<i style="--i:${index};--n:${teeth}"></i>`).join("");
    return `<span class="chainsaw-saw-disc"><b></b>${toothHtml}</span>`;
  }

  function createChainsawDashWarning(fighter, angle, length, width) {
    const gears = Array.from({ length: 6 }, (_, index) => `<span class="path-gear" style="--i:${index}">${createChainsawSawHtml(12)}</span>`).join("");
    const element = createChainsawEffectElement("chainsaw-path-warning dash", `<span class="path-edge top"></span><span class="path-edge bottom"></span><span class="path-core"></span>${gears}`);
    const center = getChainsawEntityCenter(fighter, "ChainsawDash:warning");
    if (!center || !updateChainsawPathEffect(element, center.x, center.y, angle, length, width)) {
      removeElement(element);
      return null;
    }
    return element;
  }

  function createChainsawChainAim(fighter, angle, length) {
    const element = createChainsawEffectElement("chainsaw-path-warning chain-aim", `<span class="path-core"></span><span class="path-hook">${createChainsawSawHtml(12)}</span>`);
    const center = getChainsawEntityCenter(fighter, "ChainsawChain:aim");
    if (!center || !updateChainsawPathEffect(element, center.x, center.y, angle, length, Math.max(10, fighter.radius * 0.36))) {
      removeElement(element);
      return null;
    }
    return element;
  }

  function updateChainsawPathEffect(element, x, y, angle, length, width) {
    if (!element) return false;
    if (!isValidChainsawCoord(x) || !isValidChainsawCoord(y)) {
      warnChainsawCoord(element.className || "chainsaw-path", x, y, "path update cancelled");
      removeElement(element);
      return false;
    }
    const safeAngle = Number.isFinite(Number(angle)) ? Number(angle) : 0;
    const safeLength = Math.max(1, Number(length) || 1);
    const safeWidth = Math.max(1, Number(width) || 1);
    const centerX = Number(x) + Math.cos(safeAngle) * safeLength / 2;
    const centerY = Number(y) + Math.sin(safeAngle) * safeLength / 2;
    if (!isValidChainsawCoord(centerX) || !isValidChainsawCoord(centerY)) {
      warnChainsawCoord(element.className || "chainsaw-path", centerX, centerY, "path center invalid");
      removeElement(element);
      return false;
    }
    element.style.width = `${safeLength}px`;
    element.style.height = `${safeWidth}px`;
    element.style.left = `${centerX}px`;
    element.style.top = `${centerY}px`;
    element.style.setProperty("--path-length", `${safeLength}px`);
    element.style.setProperty("--path-width", `${safeWidth}px`);
    element.style.transform = `translate(-50%, -50%) rotate(${safeAngle}rad)`;
    return true;
  }

  function createChainsawChargeAura(fighter) {
    const element = createChainsawEffectElement("chainsaw-charge-aura metal", `${createChainsawSawHtml(14)}${createChainsawSawHtml(12)}${createChainsawSawHtml(10)}`);
    updateChainsawChargeAura(element, fighter);
    return element;
  }

  function updateChainsawChargeAura(element, fighter) {
    if (!element || !fighter) return;
    const center = getChainsawEntityCenter(fighter, "Chainsaw:charge-aura");
    if (!center) {
      removeElement(element);
      return;
    }
    const size = fighter.radius * 2.35;
    setChainsawEffectSize(element, size, size);
    updateChainsawPositionedElement(element, center.x, center.y, 0, 1);
  }

  function createChainsawStarterRig(fighter) {
    const element = createChainsawEffectElement("chainsaw-starter-rig", "<span class=\"starter-socket\"></span><span class=\"starter-cord\"></span><span class=\"starter-handle\"></span><span class=\"starter-smoke\"></span>");
    updateChainsawStarterRig(element, fighter);
    return element;
  }

  function updateChainsawStarterRig(element, fighter) {
    if (!element || !fighter) return;
    const center = getChainsawEntityCenter(fighter, "ChainsawBloodStarter:rig");
    if (!center) {
      removeElement(element);
      return;
    }
    const size = fighter.radius * 2.4;
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    updateChainsawPositionedElement(element, center.x, center.y + fighter.radius * 0.05, 0, 1);
  }

  function createChainsawIgnitionEffect(fighter) {
    const center = getChainsawEntityCenter(fighter, "Chainsaw:ignition");
    if (!center) return null;
    const element = createChainsawEffectElement("chainsaw-ignition", "<span class=\"ignition-spark\"></span><span class=\"ignition-smoke\"></span><span class=\"ignition-pull\"></span>");
    element.style.width = `${fighter.radius * 3.2}px`;
    element.style.height = `${fighter.radius * 3.2}px`;
    updateChainsawPositionedElement(element, center.x, center.y, 0, 1);
    scheduleTimeout(() => removeElement(element), 760);
    return element;
  }

  function createChainsawDashAfterimage(fighter, angle) {
    if (!fighter) return null;
    const center = getChainsawEntityCenter(fighter, "ChainsawDash:afterimage");
    if (!center) return null;
    const safeAngle = Number.isFinite(Number(angle)) ? Number(angle) : 0;
    const element = createChainsawEffectElement("chainsaw-dash-afterimage", `${createChainsawSawHtml(12)}<span class="metal-shadow"></span>`);
    element.style.width = `${fighter.radius * 2.4}px`;
    element.style.height = `${fighter.radius * 2.0}px`;
    updateChainsawPositionedElement(element, center.x - Math.cos(safeAngle) * fighter.radius * 0.85, center.y - Math.sin(safeAngle) * fighter.radius * 0.85, safeAngle, 1);
    scheduleTimeout(() => removeElement(element), 360);
    return element;
  }

  function createChainsawWallImpact(fighter, angle) {
    const center = getChainsawEntityCenter(fighter, "ChainsawDash:wall-impact");
    if (!center) return null;
    const element = createChainsawEffectElement("chainsaw-wall-impact", `${createChainsawSawHtml(14)}<span class="stone"></span><span class="stone second"></span><span class="spark"></span>`);
    element.style.width = `${fighter.radius * 3}px`;
    element.style.height = `${fighter.radius * 3}px`;
    updateChainsawPositionedElement(element, center.x, center.y, angle, 1);
    scheduleTimeout(() => removeElement(element), 520);
    return element;
  }

  function createChainsawCircularFinisher(x, y, radius) {
    const element = createChainsawEffectElement("chainsaw-circular-finisher", `${createChainsawSawHtml(18)}<span class="finisher-groove"></span><span class="finisher-debris"></span>`);
    setChainsawEffectSize(element, radius * 2, radius * 2);
    const point = getChainsawSafeEffectPoint(x, y, radius * 2, radius * 2, 2);
    if (!point) {
      removeElement(element);
      return null;
    }
    updateChainsawPositionedElement(element, point.x, point.y, 0, 1);
    scheduleTimeout(() => removeElement(element), 300);
    return element;
  }

  function createChainsawConceptCharge(fighter, target) {
    const element = createChainsawEffectElement("chainsaw-concept-charge", "<span class=\"concept-dim\"></span><span class=\"concept-sparks\"></span>");
    updateChainsawConceptCharge(element, fighter, target);
    return element;
  }

  function updateChainsawConceptCharge(element, fighter, target) {
    if (!element || !fighter) return;
    const fighterCenter = getChainsawEntityCenter(fighter, "ChainsawConceptCharge:caster");
    if (!fighterCenter) {
      removeElement(element);
      return;
    }
    const targetCenter = target && !target.dead ? getChainsawEntityCenter(target, "ChainsawConceptCharge:target") : fighterCenter;
    const tx = targetCenter ? targetCenter.x : fighterCenter.x;
    const ty = targetCenter ? targetCenter.y : fighterCenter.y;
    const cx = (fighterCenter.x + tx) / 2;
    const cy = (fighterCenter.y + ty) / 2;
    const size = Math.min(game.arenaSize * 0.68, Math.max(fighter.radius * 3.4, Math.hypot(tx - fighterCenter.x, ty - fighterCenter.y) + fighter.radius * 1.1));
    setChainsawEffectSize(element, size, size);
    const point = getChainsawSafeEffectPoint(cx, cy, size, size, 2);
    if (!point) {
      removeElement(element);
      return;
    }
    updateChainsawPositionedElement(element, point.x, point.y, 0, 1);
  }

  function createChainsawConceptGlyph(target, label, index = 0) {
    const center = getChainsawEntityCenter(target, "concept-glyph-target");
    if (!center) return null;
    const angle = -Math.PI / 2 + index * 0.85;
    const distance = target.radius * 1.95;
    const element = createChainsawEffectElement("chainsaw-concept-glyph", `<b>${label || "능력"}</b><span></span>`);
    const width = target.radius * 2.1;
    const height = target.radius * 0.72;
    setChainsawEffectSize(element, width, height);
    const point = getChainsawSafeEffectPoint(center.x + Math.cos(angle) * distance, center.y + Math.sin(angle) * distance, width, height, 4);
    if (!point) {
      removeElement(element);
      return null;
    }
    updateChainsawPositionedElement(element, point.x, point.y, angle + Math.PI / 2, 1);
    scheduleTimeout(() => removeElement(element), 860);
    return element;
  }

  function createChainsawRiftSlash(x, y, angle, length, width, tone = "") {
    const element = createChainsawEffectElement(`chainsaw-rift-slash ${tone}`, "<span class=\"rift-core\"></span><span class=\"rift-sparks\"></span>");
    const safeLength = Math.max(1, Number(length) || 1);
    const safeWidth = Math.max(1, Number(width) || 1);
    element.style.width = `${safeLength}px`;
    element.style.height = `${safeWidth}px`;
    const point = getChainsawSafeEffectPoint(x, y, safeLength, safeWidth, 2);
    if (!point) {
      removeElement(element);
      return null;
    }
    updateChainsawPositionedElement(element, point.x, point.y, angle, 1);
    scheduleTimeout(() => removeElement(element), 620);
    return element;
  }

  function createChainsawConceptSaws(fighter) {
    const element = createChainsawEffectElement("chainsaw-concept-saws", "<span class=\"concept-saw one\"><b></b><i></i></span><span class=\"concept-saw two\"><b></b><i></i></span><span class=\"concept-saw-sparks\"></span>");
    updateChainsawConceptSaws(element, fighter, getBattleNow(), 0, false);
    return element;
  }

  function updateChainsawConceptSaws(element, fighter, now = getBattleNow(), dashIndex = 0, dashing = false) {
    if (!element || !fighter) return;
    const center = getChainsawEntityCenter(fighter, "ChainsawUlt:saw-center");
    if (!center) {
      removeElement(element);
      return;
    }
    const size = fighter.radius * 4.05;
    const orbit = fighter.radius * 1.08;
    setChainsawEffectSize(element, size, size);
    updateChainsawPositionedElement(element, center.x, center.y, 0, 1);
    if (false && now - (Number(element.dataset.debugAt) || 0) > 260) {
      element.dataset.debugAt = String(now);
      console.debug(`[ChainsawUlt] sawCenter=(${Math.round(center.x)}, ${Math.round(center.y)}), fighterCenter=(${Math.round(center.x)}, ${Math.round(center.y)})`);
      createChainsawDebugPoint("saw", center.x, center.y, "sawCenter");
    }
    const spin = now * (0.008 + dashIndex * 0.0019) + (dashing ? 0.9 : 0);
    element.querySelectorAll(".concept-saw").forEach((saw, index) => {
      const angle = spin + index * Math.PI;
      const x = Math.cos(angle) * orbit;
      const y = Math.sin(angle) * orbit;
      saw.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${angle + Math.PI / 2}rad)`;
    });
    element.classList.toggle("final", dashIndex >= 3);
    element.classList.toggle("dashing", !!dashing);
  }

  function createChainsawConceptSealShred(fighter, target, plan) {
    const targetCenter = getChainsawEntityCenter(target, "concept-shred-target");
    if (!targetCenter) return null;
    const labels = plan && plan.full
      ? ["개념", "패시브", "궁극기"]
      : (plan && plan.skillTypes ? plan.skillTypes.map((type) => getSkillDisplayNameByType(target, type)) : ["스킬"]).concat(plan && plan.passive ? ["패시브"] : []);
    labels.slice(0, 3).forEach((label, index) => createChainsawConceptGlyph(target, label, index));
    const effect = createChainsawEffectElement("chainsaw-concept-shred", "<span class=\"shred-card\"></span><span class=\"shred-sparks\"></span><span class=\"shred-vacuum\"></span>");
    const size = Math.max(target.radius * 3.1, 74);
    setChainsawEffectSize(effect, size, size);
    const fighterCenter = getChainsawEntityCenter(fighter, "concept-shred-caster") || targetCenter;
    const angle = Math.atan2(fighterCenter.y - targetCenter.y, fighterCenter.x - targetCenter.x);
    const point = getChainsawSafeEffectPoint(targetCenter.x, targetCenter.y, size, size, 2);
    if (!point) {
      removeElement(effect);
      return null;
    }
    updateChainsawPositionedElement(effect, point.x, point.y, angle, 1);
    scheduleTimeout(() => removeElement(effect), 920);
    return effect;
  }

  function createChainsawChainVisual() {
    const links = Array.from({ length: 22 }, (_, index) => `<span class="chain-link ${index % 2 ? "odd" : "even"}"></span>`).join("");
    const element = createChainsawEffectElement("chainsaw-chain-visual", `<span class="chain-tension"></span>${links}<span class="chain-hook">${createChainsawSawHtml(12)}</span>`);
    return element;
  }

  function updateChainsawChainVisual(element, startX, startY, endX, endY, tense = false) {
    if (!element) return;
    if (![startX, startY, endX, endY].every(isValidChainsawCoord)) {
      warnChainsawCoord(element.className || "chainsaw-chain", startX, startY, "chain update cancelled");
      removeElement(element);
      return;
    }
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.max(1, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);
    element.style.left = `${startX}px`;
    element.style.top = `${startY}px`;
    element.style.width = `${length}px`;
    element.style.height = `${Math.max(18, Math.min(36, length * 0.08))}px`;
    element.style.transform = `translate(0, -50%) rotate(${angle}rad)`;
    element.classList.toggle("tense", !!tense);
    const links = element.querySelectorAll(".chain-link");
    links.forEach((link, index) => {
      const pct = links.length <= 1 ? 0 : index / (links.length - 1);
      link.style.left = `${pct * 100}%`;
      link.style.animationDelay = `${index * 24}ms`;
    });
  }

  function createChainsawHookAnchor(x, y, radius, tone = "") {
    const element = createChainsawEffectElement(`chainsaw-hook-anchor ${tone}`, createChainsawSawHtml(12));
    const size = Math.max(20, radius * 1.25);
    setChainsawEffectSize(element, size, size);
    const point = getChainsawSafeEffectPoint(x, y, size, size, 2);
    if (!point) {
      removeElement(element);
      return null;
    }
    updateChainsawPositionedElement(element, point.x, point.y, 0, 1);
    scheduleTimeout(() => removeElement(element), 760);
    return element;
  }

  function createChainsawGroundScar(x, y, angle, width) {
    const scar = createChainsawEffectElement("chainsaw-ground-scar", "<span class=\"scar-core\"></span><span class=\"scar-dust left\"></span><span class=\"scar-dust right\"></span>");
    const safeAngle = Number.isFinite(Number(angle)) ? Number(angle) : 0;
    const safeWidth = Math.max(1, Number(width) || 1);
    const length = safeWidth * 2.35;
    scar.style.width = `${length}px`;
    scar.style.height = `${Math.max(10, safeWidth * 0.58)}px`;
    const point = getChainsawSafeEffectPoint(Number(x) - Math.cos(safeAngle) * safeWidth * 0.3, Number(y) - Math.sin(safeAngle) * safeWidth * 0.3, length, Math.max(10, safeWidth * 0.58), 2);
    if (!point) {
      removeElement(scar);
      return null;
    }
    updateChainsawPositionedElement(scar, point.x, point.y, safeAngle, 1);
    scheduleTimeout(() => removeElement(scar), 880);
    return scar;
  }

  function createChainsawSlashEffect(x, y, radius, tone = "") {
    const effect = createChainsawEffectElement(`chainsaw-slash ${tone}`, createChainsawSawHtml(18));
    const size = radius * 2;
    setChainsawEffectSize(effect, size, size);
    const point = getChainsawSafeEffectPoint(x, y, size, size, 2);
    if (!point) {
      removeElement(effect);
      return null;
    }
    updateChainsawPositionedElement(effect, point.x, point.y, Math.random() * Math.PI, 1);
    scheduleTimeout(() => removeElement(effect), 520);
    return effect;
  }

  function createChainsawSpark(fighter, tone = "", scale = 1) {
    const center = getChainsawEntityCenter(fighter, `ChainsawSpark:${tone || "default"}`);
    if (!center) return null;
    const effect = createChainsawEffectElement(`chainsaw-spark ${tone}`, "<span></span><i></i><i></i><i></i><i></i>");
    const size = fighter.radius * Math.max(1, scale);
    setChainsawEffectSize(effect, size, size);
    updateChainsawPositionedElement(effect, center.x, center.y, Math.random() * Math.PI, 1);
    scheduleTimeout(() => removeElement(effect), 540);
    return effect;
  }

  function createChainsawHealText(fighter, amount) {
    if (!fighter || !els.skillLayer) return;
    const center = getChainsawEntityCenter(fighter, "ChainsawBloodStarter:heal-text");
    if (!center) return;
    const element = document.createElement("div");
    element.className = "floating-combat-text chainsaw-heal-text";
    element.textContent = `+${Math.round(amount)}`;
    element.style.left = `${center.x}px`;
    element.style.top = `${center.y - fighter.radius * 1.45}px`;
    els.skillLayer.appendChild(element);
    scheduleTimeout(() => removeElement(element), 760);
  }

  function createChainsawMarkGainEffect(fighter) {
    const center = getChainsawEntityCenter(fighter, "mark-gain-target");
    if (!center) return;
    const effect = createChainsawEffectElement("chainsaw-mark-gain", "<span class=\"mark-ring one\"></span><span class=\"mark-ring two\"></span><span class=\"mark-crack\"></span><span class=\"mark-shard\"></span>");
    const size = fighter.radius * 2.35;
    setChainsawEffectSize(effect, size, size);
    const point = getChainsawSafeEffectPoint(center.x, center.y - fighter.radius * 0.15, size, size, 2);
    if (!point) {
      removeElement(effect);
      return;
    }
    updateChainsawPositionedElement(effect, point.x, point.y, 0, 1);
    scheduleTimeout(() => removeElement(effect), 700);
  }

  function createChainsawMarkConsumeEffect(target) {
    const center = getChainsawEntityCenter(target, "mark-consume-target");
    if (!center) return;
    const effect = createChainsawEffectElement("chainsaw-mark-consume", "<span class=\"metal-fragment\"></span><span class=\"metal-fragment\"></span><span class=\"metal-fragment\"></span>");
    effect.style.width = `${target.radius * 3.6}px`;
    effect.style.height = `${target.radius * 3.6}px`;
    const point = getChainsawSafeEffectPoint(center.x, center.y - target.radius * 0.05, target.radius * 3.6, target.radius * 3.6, 2);
    if (!point) {
      removeElement(effect);
      return;
    }
    updateChainsawPositionedElement(effect, point.x, point.y, 0, 1);
    scheduleTimeout(() => removeElement(effect), 620);
  }

  function createSkillTitle(kicker, title, className = "", duration = 980) {
    const element = document.createElement("div");
    element.className = `skill-title-flash ${className}`;
    element.innerHTML = `<span>${kicker}</span><strong>${title}</strong>`;
    els.skillLayer.appendChild(element);
    scheduleTimeout(() => removeElement(element), duration);
    return element;
  }

  function ensureChainsawArenaGauge(element) {
    let gauge = element.querySelector(".mini-chainsaw");
    if (!gauge) {
      gauge = document.createElement("div");
      gauge.className = "mini-chainsaw";
      gauge.innerHTML = "<b>삭제</b><em></em><i></i>";
      element.appendChild(gauge);
    }
    return gauge;
  }

  function updateChainsawArenaGauge(fighter, now = getBattleNow()) {
    const element = fighter && getFighterElement(fighter);
    if (!element) return;
    removeElement(element.querySelector(".mini-chainsaw"));
  }

  function ensureChainsawTargetMarkGauge(element) {
    let gauge = element.querySelector(".mini-chainsaw-mark");
    if (!gauge) {
      gauge = document.createElement("div");
      gauge.className = "mini-chainsaw-mark";
      gauge.innerHTML = "<b></b><em></em>";
      element.appendChild(gauge);
    }
    return gauge;
  }

  function setChainsawTargetMarkGaugeContent(gauge, target) {
    if (!gauge) return;
    const total = getTotalChainsawMarksOnTarget(target);
    const topRecord = null;
    const text = gauge.querySelector("em");
    if (text) text.textContent = `×${total}`;
    gauge.title = topRecord ? `${topRecord.attackerName || "체인소맨"}의 소멸 스택 ${topRecord.marks}` : "소멸 스택";
    gauge.classList.toggle("danger", total >= CHAINSAW_EXTINCTION_MAX_STACKS);
  }

  function updateChainsawTargetMarkUi(target) {
    const element = target && getEntityElement(target);
    if (!element) return;
    const total = getTotalChainsawMarksOnTarget(target);
    const existing = element.querySelector(".mini-chainsaw-mark");
    if (total <= 0) {
      removeElement(existing);
      element.classList.remove("chainsaw-marked-danger");
      return;
    }
    element.classList.toggle("chainsaw-marked-danger", total >= CHAINSAW_EXTINCTION_MAX_STACKS);
    const gauge = ensureChainsawTargetMarkGauge(element);
    setChainsawTargetMarkGaugeContent(gauge, target);
    const size = (Number(target.radius) || game.fighterBaseRadius || 24) * 2;
    const barWidth = clamp(size * 1.18, 24, 92);
    gauge.style.width = `${barWidth}px`;
    gauge.style.left = `${(Number(target.radius) || 0)}px`;
    gauge.style.top = `${size + 14}px`;
  }

  function getChainsawCombatTargets(fighter) {
    if (!fighter) return [];
    const targets = [];
    Object.values(game.fighters).forEach((candidate) => {
      if (!candidate || candidate === fighter || candidate.dead || isFighterOutOfBattle(candidate)) return;
      targets.push(candidate);
    });
    game.summons.forEach((summon) => {
      if (!summon || summon.dead || summon.removing || summon.ownerId === fighter.id) return;
      targets.push(summon);
    });
    return targets;
  }

  function getChainsawSidePoint(fighter, angle, side) {
    const center = getChainsawEntityCenter(fighter, "chainsaw-side-point");
    if (!center) return null;
    const offset = Number(side) || 0;
    const perpX = -Math.sin(angle || 0);
    const perpY = Math.cos(angle || 0);
    return {
      x: center.x + Math.cos(angle || 0) * fighter.radius * 0.54 + perpX * fighter.radius * 0.42 * offset,
      y: center.y + Math.sin(angle || 0) * fighter.radius * 0.54 + perpY * fighter.radius * 0.42 * offset
    };
  }

  function startChainsawChainGrab(fighter, opponent, skill, now) {
    clearInvalidChainsawEffectElements();
    const state = fighter.skillState;
    if (!state || !opponent || opponent.dead || isFighterOutOfBattle(opponent)) {
      if (state) clearChainsawSkillState(fighter, state);
      cancelFighterSkill(fighter);
      return;
    }
    const data = state.data;
    const direction = getOpponentDirection(fighter, opponent);
    const range = game.arenaSize * (Number(skill.rangeRate) || 0.88);
    const distance = Math.hypot(opponent.x - fighter.x, opponent.y - fighter.y);
    data.dirX = direction.x;
    data.dirY = direction.y;
    data.angle = direction.angle;
    data.phase = "launch";
    data.startedAt = now;
    data.lastAt = now;
    data.launchEndAt = now + 220;
    data.endAt = now + (Number(skill.pullDuration) || 620) + 420;
    data.hit = distance <= range;
    data.hitTargets = data.hitTargets || new Set();
    data.effects = data.effects || [];
    data.timers = data.timers || [];
    data.chains = [
      createChainsawGrabChain(fighter, direction.angle, -1),
      createChainsawGrabChain(fighter, direction.angle, 1)
    ].filter(Boolean);
    data.effects.push(...data.chains);
    if (data.hit) {
      data.anchorTargetId = opponent.id;
    } else {
      data.anchorX = clamp(fighter.x + direction.x * range, fighter.radius, game.arenaSize - fighter.radius);
      data.anchorY = clamp(fighter.y + direction.y * range, fighter.radius, game.arenaSize - fighter.radius);
    }
    fighter.vx = 0;
    fighter.vy = 0;
  }

  function updateChainsawChainGrab(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;
    const data = state.data;
    const skill = state.skill;
    const dt = clamp((now - (data.lastAt || now)) / 1000, 0, 0.05);
    data.lastAt = now;
    const target = opponent && !opponent.dead && !isFighterOutOfBattle(opponent) ? opponent : null;
    const direction = target ? getOpponentDirection(fighter, target) : { x: data.dirX || 1, y: data.dirY || 0, angle: data.angle || 0 };
    data.dirX = direction.x;
    data.dirY = direction.y;
    data.angle = direction.angle;
    const launchProgress = clamp((now - (data.startedAt || now)) / Math.max(1, (data.launchEndAt || now) - (data.startedAt || now)), 0, 1);
    const anchorX = data.hit && target ? target.x : data.anchorX;
    const anchorY = data.hit && target ? target.y : data.anchorY;
    data.chains = data.chains || [];
    data.chains.forEach((chain, index) => {
      const side = index === 0 ? -1 : 1;
      const start = getChainsawSidePoint(fighter, direction.angle, side);
      if (!start) return;
      const tipX = start.x + ((anchorX || start.x) - start.x) * (data.phase === "launch" ? launchProgress : 1);
      const tipY = start.y + ((anchorY || start.y) - start.y) * (data.phase === "launch" ? launchProgress : 1);
      updateChainsawChainVisual(chain, start.x, start.y, tipX, tipY, data.phase === "pull");
    });
    if (data.phase === "launch" && now >= data.launchEndAt) {
      if (!data.hit || !target) {
        createChainsawHookAnchor(anchorX, anchorY, fighter.radius, "miss");
        data.phase = "retract";
        data.endAt = now + 180;
      } else {
        data.phase = "pull";
        data.endAt = now + (Number(skill.pullDuration) || 620);
        addChainsawExtinctionStack(fighter, target, `${data.attackId}-${target.id}-grab`, now, 0);
        createChainsawHookAnchor(target.x, target.y, target.radius, "enemy");
      }
      return;
    }
    if (data.phase === "pull" && target) {
      const pair = getChainsawPairDirection(fighter, target, data.angle || 0);
      const minDistance = getChainsawMinPullDistance(fighter, target);
      const remaining = pair.distance - minDistance;
      fighter.shadowDashDamageSuppressUntil = Math.max(fighter.shadowDashDamageSuppressUntil || 0, now + 100);
      target.shadowDashDamageSuppressUntil = Math.max(target.shadowDashDamageSuppressUntil || 0, now + 100);
      if (remaining <= 1 || now >= data.endAt) {
        enforceChainsawMinDistance(fighter, target, minDistance, pair.x, pair.y);
        const center = getChainsawEntityCenter(target, "chainsaw-grab-finish-target");
        if (center) createChainsawSparkAt(center.x, center.y, target.radius, "chain");
        finishChainsawActiveSkill(fighter, state, now);
        return;
      }
      const pullSpeed = getPixelSpeed(fighter) * 2.35;
      const pull = Math.min(remaining, pullSpeed * dt);
      moveChainsawGrabPair(fighter, target, pair.x, pair.y, pull);
      keepInsideArena(target);
      keepInsideArena(fighter);
      enforceChainsawMinDistance(fighter, target, minDistance, pair.x, pair.y);
      return;
    }
    if (now >= data.endAt) {
      finishChainsawActiveSkill(fighter, state, now);
    }
  }

  function activateChainsawSawSpin(fighter, skill, now) {
    clearChainsawSpin(fighter);
    const effect = createChainsawSawSpinEffect(fighter);
    const sawRadius = fighter.radius * 2;
    fighter.chainsawSpin = {
      skill,
      effect,
      endAt: now + (Number(skill.duration) || 7000),
      sawRadius,
      halfWidth: sawRadius,
      halfHeight: sawRadius,
      thickness: Math.max(8, fighter.radius * 0.35),
      tickAtByTarget: new Map(),
      attackId: `chainsaw-spin-${fighter.id}-${Math.round(now)}`
    };
    createChainsawSpark(fighter, "chain", 1.1);
    restoreStoredVelocity(fighter, fighter.skillState);
    startSkillRecovery(fighter, skill, now);
  }

  function updateChainsawSawSpin(fighter, now = getBattleNow()) {
    const spin = fighter && fighter.chainsawSpin;
    if (!fighter || !spin) return;
    if (fighter.dead || isFighterOutOfBattle(fighter) || now >= spin.endAt) {
      clearChainsawSpin(fighter);
      return;
    }
    spin.sawRadius = fighter.radius * 2;
    spin.halfWidth = spin.sawRadius;
    spin.halfHeight = spin.sawRadius;
    spin.thickness = Math.max(8, fighter.radius * 0.35);
    updateChainsawSawSpinVisual(fighter, spin, now);
    getChainsawCombatTargets(fighter).forEach((target) => {
      if (!isTargetOnChainsawSpinRect(fighter, target, spin)) return;
      enforceChainsawSawCollision(fighter, target, spin, now);
      const lastAt = Number(spin.tickAtByTarget.get(target.id) || -Infinity);
      const interval = Math.max(80, Number(spin.skill.tickInterval) || 150);
      if (now - lastAt < interval) return;
      spin.tickAtByTarget.set(target.id, now);
      const dealt = applyDamage(fighter, target, {
        label: "회전 톱날",
        fixedDamage: Number(spin.skill.tickDamage) || 1,
        damageKind: "스킬",
        isDot: true,
        attackId: `${spin.attackId}-${target.id}-${Math.floor(now / interval)}`
      });
      if (dealt > 0) {
        markChainsawShredded(target, now);
        createChainsawSparkAt(target.x, target.y, target.radius * 0.82, "hit");
      }
    });
  }

  function enforceChainsawSawCollision(fighter, target, spin, now = getBattleNow()) {
    if (!fighter || !target || !spin) return;
    const sawRadius = Number(spin.sawRadius) || Number(spin.halfWidth) || fighter.radius * 2;
    const minDistance = sawRadius + (Number(target.radius) || 0) * 0.72;
    let dx = target.x - fighter.x;
    let dy = target.y - fighter.y;
    let distance = Math.hypot(dx, dy);
    if (distance < 0.001) {
      dx = Math.cos(now * 0.01 || 0);
      dy = Math.sin(now * 0.01 || 0);
      distance = 1;
    }
    if (distance >= minDistance) return;
    const nx = dx / distance;
    const ny = dy / distance;
    target.x += nx * (minDistance - distance + 1);
    target.y += ny * (minDistance - distance + 1);
    keepInsideArena(target);
    const inwardVelocity = (target.vx || 0) * nx + (target.vy || 0) * ny;
    if (inwardVelocity < 0) {
      target.vx -= nx * inwardVelocity * 1.45;
      target.vy -= ny * inwardVelocity * 1.45;
    }
    target.vx += nx * 18;
    target.vy += ny * 18;
    markChainsawShredded(target, now);
  }

  function markChainsawShredded(target, now = getBattleNow()) {
    const element = target && getEntityElement(target);
    if (!element) return;
    target.chainsawShredUntil = Math.max(Number(target.chainsawShredUntil) || 0, now + 220);
    element.classList.add("chainsaw-shredded");
    if (target.chainsawShredCleanupTask && !target.chainsawShredCleanupTask.cancelled) return;
    const cleanup = () => {
      target.chainsawShredCleanupTask = null;
      if (getBattleNow() >= (Number(target.chainsawShredUntil) || 0) || target.dead || isFighterOutOfBattle(target)) {
        const currentElement = getEntityElement(target);
        if (currentElement) currentElement.classList.remove("chainsaw-shredded");
        return;
      }
      target.chainsawShredCleanupTask = scheduleTimeout(cleanup, 120);
    };
    target.chainsawShredCleanupTask = scheduleTimeout(cleanup, 140);
  }

  function startChainsawHellArena(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    clearChainsawHellArena(fighter);
    const data = state.data;
    data.phase = "center-dash";
    data.startedAt = now;
    data.dashEndAt = now + 420;
    data.centerX = game.arenaSize / 2;
    data.centerY = game.arenaSize / 2;
    data.hitTargets = data.hitTargets || new Set();
    data.effects = data.effects || [];
    data.effects.push(createSkillTitle("궁극기", "지옥의 전장", "chainsaw-hell-title", 980));
    data.effects.push(createChainsawHellChargeEffect(fighter));
    data.effects.push(createCircleEffect(data.centerX, data.centerY, fighter.radius * 2.65, "chainsaw-hell-center-warning"));
    const dx = data.centerX - fighter.x;
    const dy = data.centerY - fighter.y;
    const distance = Math.hypot(dx, dy) || 1;
    const speed = Math.max(getPixelSpeed(fighter) * 3.2, distance / 0.42);
    data.dashSpeed = speed;
    fighter.vx = (dx / distance) * speed;
    fighter.vy = (dy / distance) * speed;
    getFighterElement(fighter).classList.add("chainsaw-dashing");
  }

  function updateChainsawHellArenaSkill(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;
    const data = state.data;
    const skill = state.skill;
    updateChainsawEntityEffect(data.effects && data.effects[1], fighter, fighter.radius * 3.2, fighter.radius * 3.2);
    if (now - (data.lastDashScarAt || 0) > 60) {
      data.lastDashScarAt = now;
      createChainsawGroundScar(fighter.x, fighter.y, Math.atan2(fighter.vy || 0, fighter.vx || 1), fighter.radius * 1.08);
      createChainsawSparkAt(fighter.x, fighter.y, fighter.radius * 0.9, "chain");
    }
    if (data.phase !== "center-dash") {
      finishChainsawActiveSkill(fighter, state, now);
      return;
    }
    const distance = Math.hypot((data.centerX || game.arenaSize / 2) - fighter.x, (data.centerY || game.arenaSize / 2) - fighter.y);
    getChainsawCombatTargets(fighter).forEach((target) => {
      if (data.hitTargets.has(target.id)) return;
      if (Math.hypot(target.x - fighter.x, target.y - fighter.y) > fighter.radius + target.radius + 12) return;
      data.hitTargets.add(target.id);
      applyDamage(fighter, target, {
        label: "지옥의 전장 돌진",
        baseDamage: Number(skill.dashDamage) || 20,
        damageKind: "궁극기",
        attackId: `${data.attackId}-${target.id}-dash`
      });
      knockbackEntity(fighter, target, target.radius * 1.2);
      createChainsawSlashEffect(target.x, target.y, target.radius * 1.8, "hit");
    });
    if (now >= data.dashEndAt || distance <= fighter.radius * 0.8) {
      fighter.x = clamp(data.centerX || fighter.x, fighter.radius, game.arenaSize - fighter.radius);
      fighter.y = clamp(data.centerY || fighter.y, fighter.radius, game.arenaSize - fighter.radius);
      fighter.vx = 0;
      fighter.vy = 0;
      keepInsideArena(fighter);
      if (!data.centerImpactDone) {
        data.centerImpactDone = true;
        const impactRadius = fighter.radius * 2.65;
        getChainsawCombatTargets(fighter).forEach((target) => {
          if (Math.hypot(target.x - fighter.x, target.y - fighter.y) > impactRadius + target.radius * 0.5) return;
          applyDamage(fighter, target, {
            label: "지옥의 전장 착지",
            baseDamage: Number(skill.dashDamage) || 20,
            damageKind: "궁극기",
            attackId: `${data.attackId}-${target.id}-center`
          });
          knockbackEntity(fighter, target, target.radius * 1.05);
        });
        createChainsawSlashEffect(fighter.x, fighter.y, impactRadius, "hit");
        pulseArena();
      }
      activateChainsawHellArenaField(fighter, skill, now);
      finishChainsawActiveSkill(fighter, state, now);
    }
  }

  function activateChainsawHellArenaField(fighter, skill, now) {
    const effect = createChainsawHellArenaEffect(fighter);
    fighter.chainsawHellArena = {
      skill,
      effect,
      endAt: now + (Number(skill.duration) || 8000),
      wallWidth: Math.max(fighter.radius * 2, game.arenaSize * 0.075),
      wallDamageAtByTarget: new Map(),
      contactHealAtByTarget: new Map(),
      healAt: 0,
      attackId: `chainsaw-hell-wall-${fighter.id}-${Math.round(now)}`
    };
    updateChainsawHellArenaVisual(fighter.chainsawHellArena, now);
    pulseArena();
  }

  function updateChainsawHellArena(fighter, now = getBattleNow()) {
    const arena = fighter && fighter.chainsawHellArena;
    if (!fighter || !arena) return;
    if (fighter.dead || isFighterOutOfBattle(fighter) || now >= arena.endAt) {
      clearChainsawHellArena(fighter);
      return;
    }
    updateChainsawHellArenaVisual(arena, now);
    const wallWidth = Number(arena.wallWidth) || Math.max(fighter.radius * 2, game.arenaSize * 0.075);
    const damageInterval = Math.max(80, Number(arena.skill.wallTickInterval) || Number(arena.skill.wallStackInterval) || 150);
    getChainsawCombatTargets(fighter).forEach((target) => {
      if (Math.hypot(target.x - fighter.x, target.y - fighter.y) <= fighter.radius + target.radius + 4) {
        const lastHealAt = Number(arena.contactHealAtByTarget.get(target.id) || -Infinity);
        if (now - lastHealAt >= 500) {
          arena.contactHealAtByTarget.set(target.id, now);
          const healed = healFighter(fighter, 5, "지옥의 전장 접촉");
          if (healed > 0) createChainsawHealText(fighter, healed);
        }
      }
      const nearWall = target.x - target.radius <= wallWidth || target.x + target.radius >= game.arenaSize - wallWidth || target.y - target.radius <= wallWidth || target.y + target.radius >= game.arenaSize - wallWidth;
      if (!nearWall) return;
      markChainsawShredded(target, now);
      const lastDamageAt = Number(arena.wallDamageAtByTarget.get(target.id) || -Infinity);
      if (now - lastDamageAt >= damageInterval) {
        arena.wallDamageAtByTarget.set(target.id, now);
        const dealt = applyDamage(fighter, target, {
          label: "지옥의 전장 톱날",
          fixedDamage: Number(arena.skill.wallDps) || 1,
          damageKind: "궁극기",
          isDot: true,
          attackId: `${arena.attackId}-${target.id}-${Math.floor(now / damageInterval)}`
        });
        if (dealt > 0) {
          addChainsawExtinctionStack(fighter, target, `${arena.attackId}-${target.id}-wall-${Math.floor(now / damageInterval)}`, now, 0);
          createChainsawSparkAt(target.x, target.y, target.radius, "hit");
        }
      }
      const nx = target.x < game.arenaSize / 2 ? 1 : -1;
      const ny = target.y < game.arenaSize / 2 ? 1 : -1;
      if (target.x - target.radius <= wallWidth || target.x + target.radius >= game.arenaSize - wallWidth) target.x += nx * 5;
      if (target.y - target.radius <= wallWidth || target.y + target.radius >= game.arenaSize - wallWidth) target.y += ny * 5;
      keepInsideArena(target);
    });
    const casterNearWall = fighter.x - fighter.radius <= wallWidth || fighter.x + fighter.radius >= game.arenaSize - wallWidth || fighter.y - fighter.radius <= wallWidth || fighter.y + fighter.radius >= game.arenaSize - wallWidth;
    if (casterNearWall && now - (arena.healAt || 0) >= 500) {
      arena.healAt = now;
      const healed = healFighter(fighter, 5, "지옥의 전장 톱날");
      if (healed > 0) createChainsawHealText(fighter, healed);
    }
  }

  function finishChainsawActiveSkill(fighter, state, now) {
    if (!fighter || !state) return;
    clearChainsawSkillState(fighter, state);
    restoreStoredVelocity(fighter, state);
    startSkillRecovery(fighter, state.skill, now);
  }

  function clearChainsawSkillState(fighter, state) {
    if (!state || !state.data) return;
    removeElement(state.data.warning);
    removeElement(state.data.chainLine);
    if (state.data.chains) state.data.chains.forEach((effect) => removeElement(effect));
    if (state.data.effects) state.data.effects.forEach((effect) => removeElement(effect));
    if (state.data.trailEffects) state.data.trailEffects.forEach((effect) => removeElement(effect));
    if (state.data.timers) {
      state.data.timers.forEach((task) => {
        if (!task) return;
        task.cancelled = true;
        game.timeouts.delete(task);
      });
      state.data.timers = [];
    }
    const element = getFighterElement(fighter);
    if (element) element.classList.remove("chainsaw-dashing");
    clearInvalidChainsawEffectElements();
  }

  function resetChainsawState(fighter) {
    if (!fighter) return;
    clearConceptSuppression(fighter);
    if (fighter.skillState && fighter.skillState.skill && isChainsawSkill(fighter.skillState.skill)) clearChainsawSkillState(fighter, fighter.skillState);
    (fighter.chainsawTimers || []).forEach((timer) => {
      if (!timer) return;
      timer.cancelled = true;
      game.timeouts.delete(timer);
    });
    (fighter.chainsawEffects || []).forEach((effect) => removeElement(effect));
    fighter.chainsawTimers = [];
    fighter.chainsawEffects = [];
    clearChainsawSpin(fighter);
    clearChainsawHellArena(fighter);
    if (fighter.chainsawExtinctionRecords) {
      fighter.chainsawExtinctionRecords.forEach((record) => removeElement(record && record.stackEffect));
      fighter.chainsawExtinctionRecords.clear();
      updateChainsawTargetMarkUi(fighter);
    }
    clearChainsawMarksForOwner(fighter.id);
    if (fighter.chainsawBodyContacts) fighter.chainsawBodyContacts.clear();
    const element = getEntityElement(fighter);
    if (fighter.chainsawShredCleanupTask) {
      fighter.chainsawShredCleanupTask.cancelled = true;
      game.timeouts.delete(fighter.chainsawShredCleanupTask);
      fighter.chainsawShredCleanupTask = null;
    }
    fighter.chainsawShredUntil = 0;
    if (element) element.classList.remove("chainsaw-dashing", "concept-suppressed-fighter", "chainsaw-shredded");
    clearInvalidChainsawEffectElements();
  }

  function clearChainsawSpin(fighter) {
    if (!fighter || !fighter.chainsawSpin) return;
    removeElement(fighter.chainsawSpin.effect);
    fighter.chainsawSpin = null;
  }

  function clearChainsawHellArena(fighter) {
    if (!fighter || !fighter.chainsawHellArena) return;
    removeElement(fighter.chainsawHellArena.effect);
    fighter.chainsawHellArena = null;
  }

  function createChainsawSparkAt(x, y, radius, tone = "") {
    const effect = createChainsawEffectElement(`chainsaw-spark ${tone}`, "<span></span><i></i><i></i><i></i><i></i>");
    const size = Math.max(18, (Number(radius) || 18) * 1.35);
    setChainsawEffectSize(effect, size, size);
    const point = getChainsawSafeEffectPoint(x, y, size, size, 2);
    if (!point) {
      removeElement(effect);
      return null;
    }
    updateChainsawPositionedElement(effect, point.x, point.y, Math.random() * Math.PI, 1);
    scheduleTimeout(() => removeElement(effect), 540);
    return effect;
  }

  function createChainsawGrabChain(fighter, angle, side) {
    const chain = createChainsawChainVisual();
    chain.classList.add("grab");
    const start = getChainsawSidePoint(fighter, angle, side);
    if (!start) {
      removeElement(chain);
      return null;
    }
    updateChainsawChainVisual(chain, start.x, start.y, start.x + Math.cos(angle || 0) * 8, start.y + Math.sin(angle || 0) * 8, false);
    return chain;
  }

  function updateChainsawEntityEffect(element, entity, width, height = width) {
    if (!element || !entity) return false;
    const center = getChainsawEntityCenter(entity, "chainsaw-entity-effect");
    if (!center) {
      removeElement(element);
      return false;
    }
    setChainsawEffectSize(element, Math.max(1, Number(width) || 1), Math.max(1, Number(height) || Number(width) || 1));
    return updateChainsawPositionedElement(element, center.x, center.y, 0, 1);
  }

  function createChainsawSawSpinWarning(fighter) {
    const element = createChainsawEffectElement("chainsaw-spin-warning giant-warning", "<span class=\"spin-ring\"></span><span class=\"spin-sparks\"></span>");
    updateChainsawSawSpinWarning(element, fighter);
    return element;
  }

  function updateChainsawSawSpinWarning(element, fighter) {
    if (!element || !fighter) return;
    const sawRadius = fighter.radius * 2;
    const pad = fighter.radius * 0.55;
    updateChainsawEntityEffect(element, fighter, (sawRadius + pad) * 2, (sawRadius + pad) * 2);
    element.style.setProperty("--spin-saw-diameter", `${sawRadius * 2}px`);
    element.style.setProperty("--spin-pad", `${pad}px`);
  }

  function createChainsawSawSpinEffect(fighter) {
    const element = createChainsawEffectElement("chainsaw-spin-blades giant", `<span class="spin-ring"></span><span class="giant-saw">${createChainsawSawHtml(18)}</span><span class="spin-sparks"></span>`);
    updateChainsawSawSpinVisual(fighter, {
      effect: element,
      sawRadius: fighter.radius * 2,
      halfWidth: fighter.radius * 2,
      halfHeight: fighter.radius * 2,
      thickness: Math.max(8, fighter.radius * 0.35)
    }, getBattleNow());
    return element;
  }

  function getChainsawRectPerimeterPoint(progress, halfWidth, halfHeight) {
    const safeHalfWidth = Math.max(1, Number(halfWidth) || 1);
    const safeHalfHeight = Math.max(1, Number(halfHeight) || 1);
    const perimeter = 4 * (safeHalfWidth + safeHalfHeight);
    let distance = ((Number(progress) || 0) % 1 + 1) % 1 * perimeter;
    if (distance <= safeHalfWidth * 2) {
      const x = -safeHalfWidth + distance;
      return { x, y: -safeHalfHeight, angle: 0 };
    }
    distance -= safeHalfWidth * 2;
    if (distance <= safeHalfHeight * 2) {
      const y = -safeHalfHeight + distance;
      return { x: safeHalfWidth, y, angle: Math.PI / 2 };
    }
    distance -= safeHalfHeight * 2;
    if (distance <= safeHalfWidth * 2) {
      const x = safeHalfWidth - distance;
      return { x, y: safeHalfHeight, angle: Math.PI };
    }
    distance -= safeHalfWidth * 2;
    const y = safeHalfHeight - distance;
    return { x: -safeHalfWidth, y, angle: -Math.PI / 2 };
  }

  function updateChainsawSawSpinVisual(fighter, spin, now = getBattleNow()) {
    if (!fighter || !spin || !spin.effect) return;
    const sawRadius = Number(spin.sawRadius) || fighter.radius * 2;
    const pad = fighter.radius * 0.55;
    const width = (sawRadius + pad) * 2;
    const height = width;
    updateChainsawEntityEffect(spin.effect, fighter, width, height);
    spin.effect.style.setProperty("--spin-saw-diameter", `${sawRadius * 2}px`);
    spin.effect.style.setProperty("--spin-pad", `${pad}px`);
    const saw = spin.effect.querySelector(".giant-saw");
    if (saw) {
      const diameter = sawRadius * 2;
      saw.style.width = `${diameter}px`;
      saw.style.height = `${diameter}px`;
      saw.style.left = "50%";
      saw.style.top = "50%";
      saw.style.transform = `translate(-50%, -50%) rotate(${now * 0.016}rad)`;
    }
  }

  function isTargetOnChainsawSpinRect(fighter, target, spin) {
    if (!fighter || !target || !spin) return false;
    const sawRadius = Number(spin.sawRadius) || Number(spin.halfWidth) || fighter.radius * 2;
    const targetRadius = Number(target.radius) || 0;
    return Math.hypot(target.x - fighter.x, target.y - fighter.y) <= sawRadius + targetRadius * 0.7;
  }

  function createChainsawHellChargeEffect(fighter) {
    const element = createChainsawEffectElement("chainsaw-hell-charge", `${createChainsawSawHtml(18)}<span></span>`);
    updateChainsawEntityEffect(element, fighter, fighter.radius * 3.2, fighter.radius * 3.2);
    return element;
  }

  function createChainsawHellArenaEffect(fighter) {
    const saws = ["north", "south", "east", "west"].map((side) => (
      Array.from({ length: 18 }, (_, index) => `<span class="wall-saw ${side}" data-side="${side}" data-i="${index}">${createChainsawSawHtml(14)}</span>`).join("")
    )).join("");
    const element = createChainsawEffectElement("chainsaw-hell-arena", "<span class=\"hell-wall north\"></span><span class=\"hell-wall east\"></span><span class=\"hell-wall south\"></span><span class=\"hell-wall west\"></span><span class=\"hell-haze\"></span>" + saws);
    element.style.left = `${game.arenaSize / 2}px`;
    element.style.top = `${game.arenaSize / 2}px`;
    element.style.width = `${game.arenaSize}px`;
    element.style.height = `${game.arenaSize}px`;
    element.style.transform = "translate(-50%, -50%)";
    return element;
  }

  function updateChainsawHellArenaVisual(arena, now = getBattleNow()) {
    if (!arena || !arena.effect) return;
    arena.effect.style.left = `${game.arenaSize / 2}px`;
    arena.effect.style.top = `${game.arenaSize / 2}px`;
    arena.effect.style.width = `${game.arenaSize}px`;
    arena.effect.style.height = `${game.arenaSize}px`;
    const wallThickness = Number(arena.wallWidth) || Math.max(34, game.fighterBaseRadius * 2.1);
    arena.effect.style.setProperty("--hell-wall-thickness", `${wallThickness}px`);
    arena.effect.querySelectorAll(".wall-saw").forEach((saw) => {
      const side = saw.dataset.side || "north";
      const index = Number(saw.dataset.i) || 0;
      const count = 18;
      const size = clamp(wallThickness * 0.92, 28, 68);
      const forward = (now * 0.00082 + index / count) % 1;
      const reverse = ((-now * 0.00082 + index / count) % 1 + 1) % 1;
      const flow = index % 2 ? reverse : forward;
      let x = 0;
      let y = 0;
      let angle = 0;
      if (side === "north" || side === "south") {
        x = flow * game.arenaSize;
        y = side === "north" ? wallThickness * 0.5 : game.arenaSize - wallThickness * 0.5;
        angle = side === "north" ? 0 : Math.PI;
      } else {
        x = side === "west" ? wallThickness * 0.5 : game.arenaSize - wallThickness * 0.5;
        y = flow * game.arenaSize;
        angle = side === "west" ? Math.PI / 2 : -Math.PI / 2;
      }
      saw.style.width = `${size}px`;
      saw.style.height = `${size}px`;
      saw.style.left = `${x}px`;
      saw.style.top = `${y}px`;
      saw.style.transform = `translate(-50%, -50%) rotate(${angle + now * 0.012}rad)`;
    });
  }

  function createChainsawExtinctionStackPulse(target, stacks) {
    const center = getChainsawEntityCenter(target, "chainsaw-extinction-stack");
    if (!center) return null;
    const element = createChainsawEffectElement(`chainsaw-extinction-pulse stack-${stacks}`, "<span></span><span></span><span></span><span></span><span></span>");
    const size = target.radius * (2.2 + Math.min(5, stacks) * 0.16);
    setChainsawEffectSize(element, size, size);
    updateChainsawPositionedElement(element, center.x, center.y, 0, 1);
    scheduleTimeout(() => removeElement(element), 820);
    return element;
  }

  function updateChainsawExtinctionStackVisual(target, record) {
    if (!target || !record) return;
    const stacks = clamp(Math.floor(Number(record.stacks) || 0), 0, CHAINSAW_EXTINCTION_MAX_STACKS);
    if (stacks <= 0) {
      removeElement(record.stackEffect);
      record.stackEffect = null;
      return;
    }
    if (!record.stackEffect) {
      record.stackEffect = createChainsawEffectElement("chainsaw-extinction-stack", "<span></span><span></span><span></span><span></span><span></span>");
    }
    record.stackEffect.dataset.stacks = String(stacks);
    record.stackEffect.className = `chainsaw-extinction-stack stacks-${stacks}`;
    const size = target.radius * (2.45 + stacks * 0.12);
    updateChainsawEntityEffect(record.stackEffect, target, size, size);
  }

  function createChainsawExtinctionAura(target) {
    const element = createChainsawEffectElement("chainsaw-extinction-aura", "<span class=\"seal-ring\"></span><span class=\"seal-chain\"></span><span class=\"seal-x\"></span>");
    updateChainsawEntityEffect(element, target, target.radius * 3.1, target.radius * 3.1);
    return element;
  }

  function createChainsawExtinctionTriggerEffect(target) {
    const center = getChainsawEntityCenter(target, "chainsaw-extinction-trigger");
    if (!center) return null;
    const element = createChainsawEffectElement("chainsaw-extinction-trigger", "<span class=\"trigger-ring\"></span><span class=\"trigger-chain\"></span><b>소멸</b>");
    const size = target.radius * 4.1;
    setChainsawEffectSize(element, size, size);
    updateChainsawPositionedElement(element, center.x, center.y, 0, 1);
    scheduleTimeout(() => removeElement(element), 940);
    return element;
  }

  function createChainsawExtinctionDamageText(target, amount) {
    const center = getChainsawEntityCenter(target, "chainsaw-extinction-damage-text");
    if (!center || !els.skillLayer) return null;
    const element = document.createElement("div");
    element.className = "floating-combat-text chainsaw-extinction-damage-text";
    element.textContent = `-${formatAmount(amount)}`;
    element.style.left = `${center.x}px`;
    element.style.top = `${center.y - target.radius * 1.35}px`;
    els.skillLayer.appendChild(element);
    scheduleTimeout(() => removeElement(element), 900);
    return element;
  }

  function ensureChainsawTargetMarkGauge(element) {
    let gauge = element.querySelector(".mini-chainsaw-mark");
    if (!gauge) {
      gauge = document.createElement("div");
      gauge.className = "mini-chainsaw-mark extinction";
      gauge.innerHTML = "<b>소멸</b><em></em>";
      element.appendChild(gauge);
    }
    return gauge;
  }

  function setChainsawTargetMarkGaugeContent(gauge, target) {
    if (!gauge) return;
    const total = getTotalChainsawMarksOnTarget(target);
    const text = gauge.querySelector("em");
    if (text) text.textContent = `×${total}`;
    gauge.title = `소멸 스택 ${total}`;
    gauge.classList.toggle("danger", total >= CHAINSAW_EXTINCTION_MAX_STACKS);
  }

  function updateChainsawTargetMarkUi(target) {
    const element = target && getEntityElement(target);
    if (!element) return;
    const total = getTotalChainsawMarksOnTarget(target);
    const existing = element.querySelector(".mini-chainsaw-mark");
    if (total <= 0) {
      removeElement(existing);
      element.classList.remove("chainsaw-marked-danger");
      return;
    }
    element.classList.toggle("chainsaw-marked-danger", total >= CHAINSAW_EXTINCTION_MAX_STACKS);
    const gauge = ensureChainsawTargetMarkGauge(element);
    setChainsawTargetMarkGaugeContent(gauge, target);
    const size = (Number(target.radius) || game.fighterBaseRadius || 24) * 2;
    const barWidth = clamp(size * 1.28, 32, 104);
    gauge.style.width = `${barWidth}px`;
    gauge.style.left = `${(Number(target.radius) || 0)}px`;
    gauge.style.top = `${size + 14}px`;
  }

  function isGojoSkill(skill) {
    return !!(skill && (
      skill.type === "gojoBlue" ||
      skill.type === "gojoRed" ||
      skill.type === "gojoUnlimitedVoid"
    ));
  }

  function getGojoTargets(fighter) {
    const opponent = getOpposingFighter(fighter.side);
    return [opponent]
      .concat(getEnemySummons(fighter.side))
      .filter((target) => target && !target.dead && !target.removing && !isFighterOutOfBattle(target));
  }

  function isGojoInfinityCollapsed(fighter, now = getBattleNow()) {
    return !!(fighter && fighter.abilityType === "gojoInfinity" && fighter.gojoInfinityCollapsedUntil && now < fighter.gojoInfinityCollapsedUntil);
  }

  function isGojoDomainActive(fighter, now = getBattleNow()) {
    return !!(fighter && fighter.gojoDomain && fighter.gojoDomain.active && now < fighter.gojoDomain.endAt);
  }

  function isGojoInfinityAvailable(fighter, now = getBattleNow()) {
    return !!(
      fighter &&
      fighter.abilityType === "gojoInfinity" &&
      !fighter.dead &&
      !isFighterOutOfBattle(fighter) &&
      !isGojoInfinityCollapsed(fighter, now) &&
      ((fighter.gojoInfinityGauge || 0) > 0 || isGojoDomainActive(fighter, now))
    );
  }

  function isGojoDomainLocked(fighter, now = getBattleNow()) {
    return !!(fighter && fighter.gojoDomainLockedUntil && now < fighter.gojoDomainLockedUntil);
  }

  function tryGojoInfinityBlock(defender, attacker, options = {}) {
    const now = getBattleNow();
    if (
      !defender ||
      defender.abilityType !== "gojoInfinity" ||
      options.systemKill ||
      options.ignoreGojoInfinity ||
      isPassiveSuppressedByConcept(defender, now) ||
      !isGojoInfinityAvailable(defender, now)
    ) {
      return false;
    }
    const hits = Math.max(1, Math.floor(Number(options.hits) || 1));
    const damage = Math.max(0, calculateDamage(attacker, defender, options)) * hits;
    if (options.isDot) {
      defender.gojoInfinityLastBlockAt = now;
      if (now - (defender.gojoInfinityLastDotDrainAt || -Infinity) < GOJO_INFINITY_DOT_DRAIN_INTERVAL) {
        return true;
      }
      defender.gojoInfinityLastDotDrainAt = now;
    }
    consumeGojoInfinity(defender, Math.max(20, damage * 2), now, options.label || "피해");
    return true;
  }

  function tryGojoInfinityBlockStatus(target, label, now = getBattleNow()) {
    if (!target || target.abilityType !== "gojoInfinity" || isPassiveSuppressedByConcept(target, now) || !isGojoInfinityAvailable(target, now)) return false;
    consumeGojoInfinity(target, 20, now, label || "상태이상");
    return true;
  }

  function consumeGojoInfinity(fighter, cost, now, label) {
    if (!fighter || fighter.abilityType !== "gojoInfinity") return;
    fighter.gojoInfinityLastBlockAt = now;
    if (!isGojoDomainActive(fighter, now)) {
      fighter.gojoInfinityGauge = Math.max(0, (fighter.gojoInfinityGauge || 0) - Math.max(1, Number(cost) || 8));
    } else {
      fighter.gojoInfinityGauge = GOJO_INFINITY_MAX;
    }
    createGojoInfinityBlockEffect(fighter);
    if (!fighter.gojoInfinityLastLogAt || now - fighter.gojoInfinityLastLogAt > 420) {
      fighter.gojoInfinityLastLogAt = now;
      addLog(`${fighter.name} 무하한으로 ${label || "피해"} 차단`, "good");
    }
    if (!isGojoDomainActive(fighter, now) && fighter.gojoInfinityGauge <= 0) {
      collapseGojoInfinity(fighter, now);
    }
    updateGojoInfinityVisual(fighter, now);
  }

  function collapseGojoInfinity(fighter, now) {
    if (!fighter || fighter.abilityType !== "gojoInfinity") return;
    fighter.gojoInfinityGauge = 0;
    fighter.gojoInfinityCollapsedUntil = now + GOJO_INFINITY_COLLAPSE_MS;
    const element = getFighterElement(fighter);
    if (element) element.classList.add("gojo-infinity-collapsed");
    createGojoFloatingText(fighter, "무하한 붕괴", "collapse", 900);
    const burst = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.85, "gojo-infinity-collapse");
    scheduleTimeout(() => removeElement(burst), 620);
  }

  function updateGojoState(fighter, now) {
    if (!fighter) return;
    updateGojoMarksOnEntity(fighter, now);
    updateGojoPurpleProjectiles(fighter, now);
    updateGojoMaterialVisuals(fighter, now);
    updateGojoDomain(fighter, now);
    updateGojoDomainLockVisual(fighter, now);

    if (fighter.abilityType !== "gojoInfinity") return;
    if (!fighter.gojoInfinityLastUpdateAt) fighter.gojoInfinityLastUpdateAt = now;
    const dt = Math.max(0, now - fighter.gojoInfinityLastUpdateAt);
    fighter.gojoInfinityLastUpdateAt = now;

    if (isGojoDomainActive(fighter, now)) {
      fighter.gojoInfinityGauge = GOJO_INFINITY_MAX;
      fighter.gojoInfinityCollapsedUntil = 0;
    } else if (isGojoInfinityCollapsed(fighter, now)) {
      updateGojoInfinityVisual(fighter, now);
      return;
    } else if (fighter.gojoInfinityCollapsedUntil && now >= fighter.gojoInfinityCollapsedUntil) {
      fighter.gojoInfinityCollapsedUntil = 0;
      fighter.gojoInfinityGauge = Math.max(fighter.gojoInfinityGauge || 0, GOJO_INFINITY_RECOVER_GAUGE);
      const element = getFighterElement(fighter);
      if (element) element.classList.remove("gojo-infinity-collapsed");
      createGojoFloatingText(fighter, "무하한 복구", "recover", 760);
    }

    if ((fighter.gojoInfinityGauge || 0) < GOJO_INFINITY_MAX && now - (fighter.gojoInfinityLastBlockAt || -Infinity) >= GOJO_INFINITY_REGEN_DELAY) {
      fighter.gojoInfinityGauge = Math.min(GOJO_INFINITY_MAX, (fighter.gojoInfinityGauge || 0) + GOJO_INFINITY_REGEN_PER_SECOND * (dt / 1000));
    }
    updateGojoInfinityVisual(fighter, now);
  }

  function updateGojoInfinityVisual(fighter, now = getBattleNow()) {
    if (!fighter || fighter.abilityType !== "gojoInfinity") return;
    let effect = fighter.gojoInfinityEffect;
    if (!effect && !fighter.dead) {
      effect = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.22, "gojo-infinity-ring");
      fighter.gojoInfinityEffect = effect;
    }
    if (!effect) return;
    updateCircleEffect(effect, fighter.x, fighter.y, fighter.radius * 1.22);
    effect.classList.toggle("collapsed", isGojoInfinityCollapsed(fighter, now));
    effect.classList.toggle("domain", isGojoDomainActive(fighter, now));
    const rate = clamp((fighter.gojoInfinityGauge || 0) / GOJO_INFINITY_MAX, 0, 1);
    effect.classList.toggle("critical", !isGojoInfinityCollapsed(fighter, now) && rate <= 0.3);
    effect.style.setProperty("--gauge", `${rate}`);
    updateGojoArenaInfinityGauge(fighter, now);
  }

  function ensureGojoArenaInfinityGauge(element) {
    let gauge = element && element.querySelector(".mini-infinity");
    if (gauge) return gauge;
    if (!element) return null;
    gauge = document.createElement("span");
    gauge.className = "mini-infinity";
    gauge.innerHTML = "<b>무하한</b><em></em><i></i>";
    element.appendChild(gauge);
    return gauge;
  }

  function updateGojoArenaInfinityGauge(fighter, now = getBattleNow()) {
    if (!fighter) return;
    const element = getFighterElement(fighter);
    if (!element) return;
    if (fighter.abilityType !== "gojoInfinity") {
      removeElement(element.querySelector(".mini-infinity"));
      return;
    }
    const gauge = ensureGojoArenaInfinityGauge(element);
    if (!gauge) return;
    const rate = clamp((fighter.gojoInfinityGauge || 0) / GOJO_INFINITY_MAX, 0, 1);
    const fill = gauge.querySelector("i");
    const label = gauge.querySelector("b");
    const value = gauge.querySelector("em");
    const collapsed = isGojoInfinityCollapsed(fighter, now);
    if (label) label.textContent = "무하한";
    if (value) {
      value.textContent = collapsed
        ? `붕괴 ${Math.max(0, (fighter.gojoInfinityCollapsedUntil - now) / 1000).toFixed(1)}초`
        : `${Math.round(rate * 100)}%`;
    }
    if (fill) fill.style.transform = `scaleX(${collapsed ? 0 : rate})`;
    gauge.classList.toggle("collapsed", collapsed);
    gauge.classList.toggle("critical", !collapsed && rate <= 0.3);
    gauge.hidden = fighter.dead || isFighterOutOfBattle(fighter);
  }

  function ensureMuzanArenaCellGauge(element) {
    let gauge = element && element.querySelector(".mini-muzan-cell");
    if (gauge) return gauge;
    if (!element) return null;
    gauge = document.createElement("span");
    gauge.className = "mini-muzan-cell";
    gauge.innerHTML = "<b>세포</b><em></em><i></i>";
    element.appendChild(gauge);
    return gauge;
  }

  function updateMuzanArenaCellGauge(fighter) {
    if (!fighter || !fighter.side) return;
    const element = getFighterElement(fighter);
    if (!element) return;
    if (fighter.abilityType !== "muzanBiology") {
      removeElement(element.querySelector(".mini-muzan-cell"));
      return;
    }
    const gauge = ensureMuzanArenaCellGauge(element);
    if (!gauge) return;
    const max = fighter.muzanCellMax || MUZAN_CELL_MAX;
    const rate = clamp((fighter.muzanCellGauge || 0) / max, 0, 1);
    const fill = gauge.querySelector("i");
    const value = gauge.querySelector("em");
    if (value) value.textContent = `${Math.round(rate * 100)}%`;
    if (fill) fill.style.transform = `scaleX(${rate})`;
    gauge.classList.toggle("critical", rate <= 0.25);
    gauge.classList.toggle("sunrise", !!fighter.muzanSunriseActive);
    gauge.hidden = fighter.dead || isFighterOutOfBattle(fighter);
  }

  function createGojoInfinityBlockEffect(fighter) {
    const flash = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.45, "gojo-infinity-block");
    scheduleTimeout(() => removeElement(flash), 360);
    const element = getFighterElement(fighter);
    if (element) {
      element.classList.remove("gojo-infinity-flash");
      void element.offsetWidth;
      element.classList.add("gojo-infinity-flash");
      scheduleTimeout(() => element.classList.remove("gojo-infinity-flash"), 280);
    }
  }

  function createGojoFloatingText(fighter, text, tone = "default", duration = 700) {
    if (!fighter || !els.skillLayer) return null;
    const element = document.createElement("div");
    element.className = `gojo-floating-text ${tone}`;
    element.textContent = text;
    element.style.left = `${fighter.x}px`;
    element.style.top = `${fighter.y - fighter.radius * 1.55}px`;
    els.skillLayer.appendChild(element);
    scheduleTimeout(() => removeElement(element), duration);
    return element;
  }

  function addGojoTimer(fighter, timer) {
    if (!fighter || !timer) return timer;
    if (!fighter.gojoTimers) fighter.gojoTimers = [];
    fighter.gojoTimers.push(timer);
    return timer;
  }

  function cancelGojoTimers(fighter) {
    if (!fighter || !fighter.gojoTimers) return;
    fighter.gojoTimers.forEach((timer) => {
      if (timer) timer.cancelled = true;
    });
    fighter.gojoTimers = [];
  }

  function clearGojoSkillState(fighter, state) {
    if (!state || !state.data) return;
    ["warning", "charge", "domainWarning", "dim", "title", "effect", "beam"].forEach((key) => removeElement(state.data[key]));
    if (state.data.effects) state.data.effects.forEach((effect) => removeElement(effect));
    state.data.effects = [];
  }

  function resetGojoState(fighter, interrupted = false) {
    if (!fighter) return;
    clearGojoSkillState(fighter, fighter.skillState);
    cancelGojoTimers(fighter);
    removeElement(fighter.gojoInfinityEffect);
    fighter.gojoInfinityEffect = null;
    clearGojoDomain(fighter, interrupted);
    clearGojoDomainLock(fighter);
    clearGojoBlueMarksByOwner(fighter.id);
    clearGojoProjectileObjectsByOwner(fighter.id);
    clearGojoMaterialState(fighter);
    removeElement(fighter.gojoPurpleFusionEffect);
    fighter.gojoPurpleFusionEffect = null;
    if (fighter.gojoPurpleProjectiles) {
      fighter.gojoPurpleProjectiles.forEach((projectile) => removeElement(projectile.element));
      fighter.gojoPurpleProjectiles = [];
    }
    fighter.gojoInfinityCollapsedUntil = 0;
    fighter.gojoInfinityLastDotDrainAt = -Infinity;
    fighter.gojoInfinityLastBlockAt = -Infinity;
    fighter.gojoInfinityLastUpdateAt = 0;
    if (fighter.abilityType === "gojoInfinity") fighter.gojoInfinityGauge = GOJO_INFINITY_MAX;
    const element = getFighterElement(fighter);
    if (element) element.classList.remove("gojo-infinity-collapsed", "gojo-domain-caster", "gojo-infinity-flash");
  }

  function getGojoArenaPoint(x, y) {
    const size = game.arenaSize || 560;
    return {
      x: clamp(Number.isFinite(x) ? x : size / 2, 0, size),
      y: clamp(Number.isFinite(y) ? y : size / 2, 0, size)
    };
  }

  function createGojoCircleEffect(x, y, radius, className) {
    if (!els.skillLayer) return null;
    const element = document.createElement("div");
    element.className = `arena-circle-effect ${className}`;
    els.skillLayer.appendChild(element);
    updateGojoCircleEffect(element, x, y, radius);
    return element;
  }

  function createGojoFrontCircleEffect(x, y, radius, className) {
    if (!els.arena) return createGojoCircleEffect(x, y, radius, className);
    const element = document.createElement("div");
    element.className = `arena-circle-effect ${className}`;
    els.arena.appendChild(element);
    updateGojoCircleEffect(element, x, y, radius);
    return element;
  }

  function updateGojoCircleEffect(element, x, y, radius) {
    if (!element) return;
    const safeRadius = Math.max(1, Number(radius) || 1);
    element.style.width = `${safeRadius * 2}px`;
    element.style.height = `${safeRadius * 2}px`;
    element.style.left = `${Number(x) || 0}px`;
    element.style.top = `${Number(y) || 0}px`;
    element.style.transform = "translate(-50%, -50%)";
  }

  function removeGojoBlueObjectsByOwner(ownerId) {
    if (!ownerId) return;
    game.arenaObjects.slice().forEach((object) => {
      if (object.type === "gojoBlue" && object.ownerId === ownerId) {
        removeArenaObject(object);
      }
    });
  }

  function clearGojoProjectileObjectsByOwner(ownerId) {
    if (!ownerId) return;
    game.arenaObjects.slice().forEach((object) => {
      if (object.type === "gojoOrbProjectile" && object.ownerId === ownerId) {
        removeArenaObject(object);
      }
    });
  }

  function ensureGojoMaterials(fighter) {
    if (!fighter.gojoMaterials) {
      fighter.gojoMaterials = {
        blue: false,
        red: false,
        blueEffect: null,
        redEffect: null
      };
    }
    return fighter.gojoMaterials;
  }

  function collectGojoMaterial(fighter, kind, now) {
    if (!fighter || fighter.dead || game.battleEnding) return;
    const materials = ensureGojoMaterials(fighter);
    materials[kind] = true;
    const key = kind === "blue" ? "blueEffect" : "redEffect";
    if (!materials[key]) {
      materials[key] = createGojoFrontCircleEffect(fighter.x, fighter.y, fighter.radius * 0.38, `gojo-material-orb ${kind}`);
    }
    updateGojoMaterialVisuals(fighter, now);
    addLog(`${fighter.name} ${kind === "blue" ? "창" : "혁"} 재료 회수`, "skill");
    tryStartGojoPurpleFromMaterials(fighter, now);
  }

  function updateGojoMaterialVisuals(fighter, now = getBattleNow()) {
    if (!fighter || fighter.abilityType !== "gojoInfinity") return;
    const materials = ensureGojoMaterials(fighter);
    const bob = Math.sin(now / 260) * fighter.radius * 0.08;
    updateSingleGojoMaterialVisual(fighter, materials, "blue", -1, bob);
    updateSingleGojoMaterialVisual(fighter, materials, "red", 1, -bob);
  }

  function updateSingleGojoMaterialVisual(fighter, materials, kind, side, bob) {
    const active = !!materials[kind];
    const key = kind === "blue" ? "blueEffect" : "redEffect";
    if (!active) {
      removeElement(materials[key]);
      materials[key] = null;
      return;
    }
    if (!materials[key]) {
      materials[key] = createGojoFrontCircleEffect(fighter.x, fighter.y, fighter.radius * 0.38, `gojo-material-orb ${kind}`);
    }
    updateGojoCircleEffect(
      materials[key],
      fighter.x + side * fighter.radius * 1.05,
      fighter.y - fighter.radius * 0.82 + bob,
      fighter.radius * 0.38
    );
  }

  function clearGojoMaterialState(fighter) {
    if (!fighter) return;
    const materials = ensureGojoMaterials(fighter);
    removeElement(materials.blueEffect);
    removeElement(materials.redEffect);
    materials.blue = false;
    materials.red = false;
    materials.blueEffect = null;
    materials.redEffect = null;
    fighter.gojoPurpleFusionActive = false;
  }

  function consumeGojoMaterialsForPurple(fighter) {
    const materials = ensureGojoMaterials(fighter);
    removeElement(materials.blueEffect);
    removeElement(materials.redEffect);
    materials.blue = false;
    materials.red = false;
    materials.blueEffect = null;
    materials.redEffect = null;
  }

  function tryStartGojoPurpleFromMaterials(fighter, now) {
    if (!fighter || fighter.dead || game.battleEnding || fighter.gojoPurpleFusionActive) return false;
    const materials = ensureGojoMaterials(fighter);
    if (!materials.blue || !materials.red) return false;
    const target = getOpposingFighter(fighter.side);
    if (!target || target.dead || isFighterOutOfBattle(target)) return false;
    startGojoPurple(fighter, target, now);
    return true;
  }

  function useGojoBlue(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    if (!opponent || opponent.dead || isFighterOutOfBattle(opponent)) {
      restoreStoredVelocity(fighter, state);
      fighter.skillState = null;
      startSkillRecovery(fighter, skill, now);
      return;
    }
    launchGojoOrbProjectile(fighter, opponent, skill, "blue", now);
    createGojoFloatingText(fighter, "술식 순전 「창」", "blue", 720);
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
    startSkillRecovery(fighter, skill, now);
    addLog(`${fighter.name} 술식 순전 「창」 발사`, "skill");
  }

  function launchGojoOrbProjectile(fighter, opponent, skill, kind, now) {
    if (!fighter || !opponent || !skill) return null;
    const direction = getOpponentDirection(fighter, opponent);
    const radius = Math.max(fighter.radius * 0.44, game.arenaSize * 0.026);
    const auraRadius = kind === "blue"
      ? Math.max(fighter.radius * 2.1, game.arenaSize * 0.16)
      : Math.max(fighter.radius * 1.85, game.arenaSize * 0.13);
    const startDistance = fighter.radius + radius + 4;
    const object = {
      id: `gojo-${kind}-orb-${fighter.id}-${now.toFixed(3)}-${Math.random().toString(16).slice(2)}`,
      type: "gojoOrbProjectile",
      kind,
      ownerId: fighter.id,
      ownerSide: fighter.side,
      skill,
      x: clamp(fighter.x + direction.x * startDistance, radius, game.arenaSize - radius),
      y: clamp(fighter.y + direction.y * startDistance, radius, game.arenaSize - radius),
      vx: direction.x * game.arenaSize * (kind === "blue" ? 0.58 : 0.62),
      vy: direction.y * game.arenaSize * (kind === "blue" ? 0.58 : 0.62),
      angle: direction.angle,
      radius,
      auraRadius,
      createdAt: now,
      minRecoverAt: now + 620,
      returnAt: now + 1700,
      bounceCount: 0,
      lastAt: now,
      nextPulseAt: now + 180,
      tickInterval: kind === "blue" ? 520 : 480,
      directInterval: kind === "blue" ? 680 : 620,
      hitRecords: new Map(),
      directRecords: new Map(),
      fadeStartAt: Infinity,
      expiresAt: Infinity,
      element: createGojoOrbProjectileElement(kind, radius, auraRadius)
    };
    game.arenaObjects.push(object);
    updateGojoOrbProjectileElement(object);
    return object;
  }

  function createGojoOrbProjectileElement(kind, radius, auraRadius) {
    const element = document.createElement("div");
    element.className = `gojo-orb-projectile ${kind}`;
    element.innerHTML = "<span class=\"aura\"></span><span class=\"core\"></span><span class=\"shell\"></span><span class=\"trail\"></span>";
    els.skillLayer.appendChild(element);
    element.style.width = `${auraRadius * 2}px`;
    element.style.height = `${auraRadius * 2}px`;
    element.style.setProperty("--orb-size", `${radius * 2}px`);
    return element;
  }

  function updateGojoOrbProjectile(object, now) {
    if (!object || !object.element) return;
    const owner = getFighterById(object.ownerId);
    if (!owner || owner.dead || game.battleEnding) {
      removeArenaObject(object);
      return;
    }
    const dt = Math.min(MAX_FRAME_STEP, Math.max(0, (now - (object.lastAt || now)) / 1000));
    object.lastAt = now;
    const maxStep = Math.max(5, object.radius * 0.42);
    const distance = Math.hypot(object.vx || 0, object.vy || 0) * dt;
    const steps = clamp(Math.ceil(distance / maxStep), 1, 18);
    for (let i = 0; i < steps; i += 1) {
      bendGojoOrbTowardOwner(object, owner, now, dt / steps);
      object.x += object.vx * (dt / steps);
      object.y += object.vy * (dt / steps);
      resolveGojoOrbWallBounce(object, now);
      applyGojoOrbInfluence(owner, object, now);
      if (now >= object.minRecoverAt && Math.hypot(object.x - owner.x, object.y - owner.y) <= object.radius + owner.radius * 0.78) {
        collectGojoMaterial(owner, object.kind, now);
        createGojoOrbCollectEffect(owner, object.kind);
        removeArenaObject(object);
        return;
      }
    }
    if (now >= object.nextPulseAt) {
      object.nextPulseAt = now + 260;
      createGojoOrbPulseEffect(object);
    }
    object.angle = Math.atan2(object.vy || 0, object.vx || 1);
    updateGojoOrbProjectileElement(object);
  }

  function resolveGojoOrbWallBounce(object, now) {
    let bounced = false;
    if (object.x - object.radius < 0) {
      object.x = object.radius;
      object.vx = Math.abs(object.vx || 0);
      bounced = true;
    } else if (object.x + object.radius > game.arenaSize) {
      object.x = game.arenaSize - object.radius;
      object.vx = -Math.abs(object.vx || 0);
      bounced = true;
    }
    if (object.y - object.radius < 0) {
      object.y = object.radius;
      object.vy = Math.abs(object.vy || 0);
      bounced = true;
    } else if (object.y + object.radius > game.arenaSize) {
      object.y = game.arenaSize - object.radius;
      object.vy = -Math.abs(object.vy || 0);
      bounced = true;
    }
    if (bounced && now - (object.lastBounceEffectAt || -Infinity) > 120) {
      object.bounceCount = (object.bounceCount || 0) + 1;
      object.lastBounceEffectAt = now;
      createGojoOrbBounceEffect(object);
    }
  }

  function bendGojoOrbTowardOwner(object, owner, now, dt) {
    if (!object || !owner || now < object.returnAt || (object.bounceCount || 0) < 1) return;
    const dx = owner.x - object.x;
    const dy = owner.y - object.y;
    const distance = Math.hypot(dx, dy) || 1;
    const speed = Math.hypot(object.vx || 0, object.vy || 0) || game.arenaSize * 0.55;
    const steer = clamp(dt * 1.65, 0, 0.055);
    object.vx = object.vx * (1 - steer) + (dx / distance) * speed * steer;
    object.vy = object.vy * (1 - steer) + (dy / distance) * speed * steer;
    const nextSpeed = Math.hypot(object.vx || 0, object.vy || 0) || 1;
    object.vx = (object.vx / nextSpeed) * speed;
    object.vy = (object.vy / nextSpeed) * speed;
  }

  function applyGojoOrbInfluence(owner, object, now) {
    getGojoTargets(owner).forEach((target) => {
      const distance = Math.hypot(target.x - object.x, target.y - object.y);
      if (distance > object.auraRadius + target.radius * 0.45) return;
      if (object.kind === "blue") {
        pullTargetTowardPoint(target, object.x, object.y, Math.max(1.8, object.auraRadius * 0.016));
      } else {
        pushTargetFromPoint(target, object.x, object.y, Math.max(2.2, object.auraRadius * 0.02));
      }
      const lastTick = object.hitRecords.get(target.id) || -Infinity;
      if (now - lastTick >= object.tickInterval) {
        object.hitRecords.set(target.id, now);
        applyDamage(owner, target, {
          label: object.kind === "blue" ? "술식 순전 「창」" : "술식 반전 「혁」",
          baseDamage: object.kind === "blue" ? (Number(object.skill.pulseDamage) || 3) : Math.max(4, Math.round((Number(object.skill.damage) || 24) / 4)),
          damageKind: "스킬",
          attackId: `${object.id}-aura-${Math.floor(now / object.tickInterval)}`,
          hitId: target.id
        });
      }
      if (distance <= object.radius + target.radius * 0.72) {
        const lastDirect = object.directRecords.get(target.id) || -Infinity;
        if (now - lastDirect >= object.directInterval) {
          object.directRecords.set(target.id, now);
          applyDamage(owner, target, {
            label: object.kind === "blue" ? "술식 순전 「창」 직접 충돌" : "술식 반전 「혁」 직접 충돌",
            baseDamage: object.kind === "blue" ? (Number(object.skill.finalDamage) || 10) : (Number(object.skill.damage) || 24),
            damageKind: "스킬",
            attackId: `${object.id}-direct-${target.id}-${Math.floor(now / object.directInterval)}`,
            hitId: target.id
          });
          if (object.kind === "red") {
            const dx = target.x - object.x;
            const dy = target.y - object.y;
            const length = Math.hypot(dx, dy) || 1;
            knockbackEntityDirectional(owner, target, dx / length, dy / length, owner.radius * 1.15);
          }
          createGojoOrbHitSpark(object, target);
        }
      }
    });
  }

  function pushTargetFromPoint(target, x, y, distance) {
    if (!target || target.dead || target.removing || target.maugaUnstoppable) return;
    let dx = target.x - x;
    let dy = target.y - y;
    let length = Math.hypot(dx, dy);
    if (!length) {
      dx = target.vx || 1;
      dy = target.vy || 0;
      length = Math.hypot(dx, dy) || 1;
    }
    target.x += (dx / length) * distance;
    target.y += (dy / length) * distance;
    keepInsideArena(target);
    separateEntityFromCircleWalls(target);
    target.vx = (target.vx || 0) * 0.72 + (dx / length) * getPixelSpeed(target) * 0.22;
    target.vy = (target.vy || 0) * 0.72 + (dy / length) * getPixelSpeed(target) * 0.22;
    normalizeVelocity(target, getPixelSpeed(target));
  }

  function updateGojoOrbProjectileElement(object) {
    if (!object || !object.element) return;
    object.element.style.left = `${object.x}px`;
    object.element.style.top = `${object.y}px`;
    object.element.style.transform = `translate(-50%, -50%) rotate(${object.angle || 0}rad)`;
  }

  function createGojoOrbPulseEffect(object) {
    const effect = createGojoCircleEffect(object.x, object.y, object.auraRadius * 0.72, `gojo-orb-pulse ${object.kind}`);
    scheduleTimeout(() => removeElement(effect), 360);
  }

  function createGojoOrbBounceEffect(object) {
    const effect = createGojoCircleEffect(object.x, object.y, object.radius * 2.2, `gojo-orb-bounce ${object.kind}`);
    scheduleTimeout(() => removeElement(effect), 260);
  }

  function createGojoOrbHitSpark(object, target) {
    const effect = createGojoCircleEffect(target.x, target.y, target.radius * 1.15, `gojo-orb-hit ${object.kind}`);
    scheduleTimeout(() => removeElement(effect), 260);
  }

  function createGojoOrbCollectEffect(fighter, kind) {
    const side = kind === "blue" ? -1 : 1;
    const effect = createGojoFrontCircleEffect(fighter.x - (fighter.vy || 0) * 0 + side * fighter.radius * 0.82, fighter.y - fighter.radius * 0.34, fighter.radius * 0.92, `gojo-material-collect ${kind}`);
    scheduleTimeout(() => removeElement(effect), 380);
  }

  function createGojoBlueElement(x, y, radius) {
    const element = createGojoCircleEffect(x, y, radius, "gojo-blue-field warning");
    if (!element) return null;
    const particles = Array.from({ length: 9 }, (_, index) => {
      const angle = (index / 9) * Math.PI * 2 + (index % 2 ? 0.22 : -0.12);
      const distance = 38 + (index % 3) * 22;
      return `<i style="--px:${Math.cos(angle) * distance}%;--py:${Math.sin(angle) * distance}%;--rot:${angle}rad;--delay:${index * 0.08}s"></i>`;
    }).join("");
    element.innerHTML = [
      "<span class=\"warning-ring\"></span>",
      "<span class=\"distortion\"></span>",
      "<span class=\"core\"></span>",
      "<span class=\"ring ring-a\"></span>",
      "<span class=\"ring ring-b\"></span>",
      "<span class=\"ring ring-c\"></span>",
      `<span class=\"particles\">${particles}</span>`
    ].join("");
    return element;
  }

  function updateGojoBlueObject(object, now) {
    if (!object || !object.element) return;
    const owner = getFighterById(object.ownerId);
    if (!owner || owner.dead) return;
    updateGojoCircleEffect(object.element, object.x, object.y, object.radius);
    const active = now >= object.activeAt;
    const ending = now >= object.finalAt;
    object.element.classList.toggle("active", active && !ending);
    object.element.classList.toggle("warning", !active);
    object.element.classList.toggle("collapsing", ending);
    if (active) {
      const progress = clamp((now - object.activeAt) / Math.max(1, object.finalAt - object.activeAt), 0, 1);
      object.element.style.setProperty("--gojo-blue-progress", progress.toFixed(3));
    }
    if (now < object.activeAt) return;

    const interval = (object.finalAt - object.activeAt) / (object.pulseCount + 1);
    while (object.nextPulseIndex < object.pulseCount && now >= object.activeAt + interval * (object.nextPulseIndex + 1)) {
      applyGojoBluePulse(owner, object, object.nextPulseIndex, now);
      object.nextPulseIndex += 1;
    }
    if (!object.finalDone && now >= object.finalAt) {
      object.finalDone = true;
      applyGojoBlueFinal(owner, object, now);
    }
  }

  function applyGojoBluePulse(owner, object, pulseIndex, now) {
    createGojoBluePulseEffect(object.x, object.y, object.radius, pulseIndex);
    getGojoTargets(owner).forEach((target) => {
      if (Math.hypot(target.x - object.x, target.y - object.y) > object.radius + target.radius * 0.45) return;
      pullTargetTowardPoint(target, object.x, object.y, Math.max(4, object.radius * 0.075));
      createGojoBluePullTrail(target, object.x, object.y);
      applyDamage(owner, target, {
        label: "술식 순전 「창」",
        baseDamage: Number(object.skill.pulseDamage) || 3,
        damageKind: "스킬",
        attackId: `${object.id}-pulse-${pulseIndex}`,
        hitId: target.id
      });
    });
  }

  function applyGojoBlueFinal(owner, object, now) {
    createGojoBlueCollapseEffect(object.x, object.y, object.radius);
    getGojoTargets(owner).forEach((target) => {
      if (Math.hypot(target.x - object.x, target.y - object.y) > object.radius + target.radius * 0.55) return;
      const actual = applyDamage(owner, target, {
        label: "술식 순전 「창」 압축",
        baseDamage: Number(object.skill.finalDamage) || 10,
        damageKind: "스킬",
        attackId: `${object.id}-final`,
        hitId: target.id
      });
      if (actual > 0) createGojoBlueCollapseEffect(target.x, target.y, Math.max(target.radius * 1.2, object.radius * 0.16));
    });
  }

  function pullTargetTowardPoint(target, x, y, distance) {
    if (!target || target.dead || target.removing) return;
    const dx = x - target.x;
    const dy = y - target.y;
    const length = Math.hypot(dx, dy) || 1;
    const step = Math.min(distance, Math.max(0, length - target.radius * 0.35));
    target.x += (dx / length) * step;
    target.y += (dy / length) * step;
    keepInsideArena(target);
    separateEntityFromCircleWalls(target);
    normalizeVelocity(target, getPixelSpeed(target));
  }

  function createGojoBluePulseEffect(x, y, radius) {
    const pulse = createGojoCircleEffect(x, y, radius * 0.94, "gojo-blue-pulse");
    scheduleTimeout(() => removeElement(pulse), 360);
  }

  function createGojoBlueCollapseEffect(x, y, radius) {
    const effect = createGojoCircleEffect(x, y, radius * 0.72, "gojo-blue-collapse");
    scheduleTimeout(() => removeElement(effect), 420);
  }

  function createGojoBluePullTrail(target, centerX, centerY) {
    if (!target || !els.skillLayer) return;
    const dx = centerX - target.x;
    const dy = centerY - target.y;
    const length = Math.max(12, Math.min(Math.hypot(dx, dy), game.arenaSize * 0.22));
    const angle = Math.atan2(dy, dx);
    const trail = createGasterLine(target.x, target.y, angle, length, Math.max(3, target.radius * 0.16), "gojo-blue-pull-trail");
    scheduleTimeout(() => removeElement(trail), 240);
  }

  function addGojoBlueMark(target, owner, duration, now) {
    return null;
  }

  function updateGojoMarksOnEntity(entity, now = getBattleNow()) {
    if (!entity || !entity.gojoBlueMarks || !entity.gojoBlueMarks.size) return;
    Array.from(entity.gojoBlueMarks.entries()).forEach(([ownerId, mark]) => {
      removeElement(mark && mark.effect);
      entity.gojoBlueMarks.delete(ownerId);
    });
  }

  function consumeGojoBlueMark(target, owner, now = getBattleNow()) {
    return false;
  }

  function clearGojoBlueMarksByOwner(ownerId) {
    if (!ownerId) return;
    const targets = Object.values(game.fighters).concat(game.summons);
    targets.forEach((target) => {
      if (!target || !target.gojoBlueMarks) return;
      const mark = target.gojoBlueMarks.get(ownerId);
      if (mark) removeElement(mark.effect);
      target.gojoBlueMarks.delete(ownerId);
    });
  }

  function createGojoRedWarning(fighter, state, skill) {
    if (!state || !state.data) return null;
    const data = state.data;
    data.warning = createGasterLine(fighter.x, fighter.y, data.angle, data.range, data.width, "gojo-red-warning");
    data.charge = createGojoRedChargeEffect(fighter, data);
    data.effects = data.effects || [];
    return data.warning;
  }

  function updateGojoRedWarning(fighter, state) {
    if (!state || !state.data || !state.data.warning) return;
    const target = getFighterById(state.data.targetId) || getOpposingFighter(fighter.side);
    if (target && !target.dead && !isFighterOutOfBattle(target)) {
      const direction = getOpponentDirection(fighter, target);
      state.data.dirX = direction.x;
      state.data.dirY = direction.y;
      state.data.angle = direction.angle;
    }
    updateGasterLine(state.data.warning, fighter.x, fighter.y, state.data.angle, state.data.range, state.data.width);
    updateGojoRedChargeEffect(state.data.charge, fighter, state.data);
  }

  function fireGojoRed(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state || !state.data) return;
    const data = state.data;
    const currentTarget = getFighterById(data.targetId) || opponent;
    if (currentTarget && !currentTarget.dead && !isFighterOutOfBattle(currentTarget)) {
      const direction = getOpponentDirection(fighter, currentTarget);
      data.dirX = direction.x;
      data.dirY = direction.y;
      data.angle = direction.angle;
    }
    removeElement(data.warning);
    data.warning = null;
    removeElement(data.charge);
    data.charge = null;
    createGojoRedPressureEffect(fighter, data);
    launchGojoOrbProjectile(fighter, currentTarget || opponent, skill, "red", now);
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
    startSkillRecovery(fighter, skill, now);
    addLog(`${fighter.name} 술식 반전 「혁」 발사`, "skill");
  }

  function isTargetInGojoLine(target, originX, originY, dirX, dirY, length, width) {
    if (!target || target.dead || target.removing) return false;
    const dx = target.x - originX;
    const dy = target.y - originY;
    const forward = dx * dirX + dy * dirY;
    if (forward < -target.radius * 0.35 || forward > length + target.radius * 0.35) return false;
    const side = Math.abs(dx * -dirY + dy * dirX);
    return side <= width / 2 + target.radius * 0.65;
  }

  function knockbackEntityDirectional(source, target, dirX, dirY, distance) {
    if (!target || target.dead || target.removing || target.maugaUnstoppable) return;
    if (tryGojoInfinityBlockStatus(target, "넉백", getBattleNow())) return;
    const finalDistance = distance;
    target.x += dirX * finalDistance;
    target.y += dirY * finalDistance;
    keepInsideArena(target);
    separateEntityFromCircleWalls(target);
    target.vx += dirX * getPixelSpeed(target) * 0.55;
    target.vy += dirY * getPixelSpeed(target) * 0.55;
    normalizeVelocity(target, getPixelSpeed(target));
  }

  function createGojoRedImpact(target) {
    const effect = createCircleEffect(target.x, target.y, target.radius * 1.25, "gojo-red-impact");
    scheduleTimeout(() => removeElement(effect), 420);
  }

  function createGojoRedChargeEffect(fighter, data) {
    if (!fighter || !data) return null;
    const effect = createGojoCircleEffect(
      fighter.x + data.dirX * fighter.radius * 1.25,
      fighter.y + data.dirY * fighter.radius * 1.25,
      fighter.radius * 0.72,
      "gojo-red-charge"
    );
    if (effect) {
      effect.innerHTML = "<span></span><i></i>";
      updateGojoRedChargeEffect(effect, fighter, data);
    }
    return effect;
  }

  function updateGojoRedChargeEffect(effect, fighter, data) {
    if (!effect || !fighter || !data) return;
    updateGojoCircleEffect(
      effect,
      fighter.x + data.dirX * fighter.radius * 1.25,
      fighter.y + data.dirY * fighter.radius * 1.25,
      fighter.radius * 0.72
    );
    effect.style.setProperty("--gojo-red-angle", `${data.angle}rad`);
  }

  function createGojoRedPressureEffect(fighter, data) {
    if (!fighter || !data) return;
    for (let i = 0; i < 3; i += 1) {
      const wave = createGasterLine(
        fighter.x + data.dirX * fighter.radius * (1.2 + i * 0.32),
        fighter.y + data.dirY * fighter.radius * (1.2 + i * 0.32),
        data.angle,
        data.range * (0.72 + i * 0.11),
        data.width * (1.12 + i * 0.18),
        `gojo-red-pressure wave-${i + 1}`
      );
      scheduleTimeout(() => removeElement(wave), 360 + i * 50);
    }
  }

  function handleGojoRedWallCrash(target, now = getBattleNow()) {
    const crash = target && target.gojoRedWallCrash;
    if (!crash) return;
    if (now > crash.expiresAt || crash.hit) {
      target.gojoRedWallCrash = null;
      return;
    }
    const owner = getFighterById(crash.ownerId);
    if (!owner || owner.dead) {
      target.gojoRedWallCrash = null;
      return;
    }
    crash.hit = true;
    const actual = applyDamage(owner, target, {
      label: "술식 반전 「혁」 벽 충돌",
      fixedDamage: crash.damage,
      ignoreDefense: true,
      damageKind: "스킬",
      attackId: crash.attackId,
      hitId: target.id
    });
    if (actual > 0) applyStunEffect(target, crash.stunDuration, now);
    const effect = createCircleEffect(target.x, target.y, target.radius * 1.45, "gojo-red-wall-crash");
    scheduleTimeout(() => removeElement(effect), 440);
    target.gojoRedWallCrash = null;
  }

  function startGojoPurple(fighter, target, now) {
    if (!fighter || !target || fighter.dead || fighter.gojoPurpleFusionActive) return;
    fighter.gojoPurpleFusionActive = true;
    consumeGojoMaterialsForPurple(fighter);
    const direction = getOpponentDirection(fighter, target);
    const fusion = document.createElement("div");
    fusion.className = "gojo-purple-fusion material";
    fusion.innerHTML = [
      "<span class=\"blue\"></span>",
      "<span class=\"red\"></span>",
      "<span class=\"blue-trail\"></span>",
      "<span class=\"red-trail\"></span>",
      "<span class=\"cross\"></span>",
      "<span class=\"purple\"></span>",
      "<i class=\"spiral\"></i>",
      "<i class=\"distortion\"></i>",
      "<i class=\"charge-particles\"></i>"
    ].join("");
    fusion.style.left = `${fighter.x + direction.x * fighter.radius * 0.42}px`;
    fusion.style.top = `${fighter.y - fighter.radius * 0.62}px`;
    fusion.style.setProperty("--gojo-purple-size", `${fighter.radius}px`);
    (els.arena || els.skillLayer).appendChild(fusion);
    removeElement(fighter.gojoPurpleFusionEffect);
    fighter.gojoPurpleFusionEffect = fusion;
    addLog(`${fighter.name} 허식 「자」 융합`, "ultimate");
    createShortHitStop(90);
    addGojoTimer(fighter, scheduleTimeout(() => {
      removeElement(fusion);
      if (fighter.gojoPurpleFusionEffect === fusion) fighter.gojoPurpleFusionEffect = null;
      if (!fighter.dead && !game.battleEnding) {
        launchGojoPurple(fighter, target, getBattleNow());
      } else {
        fighter.gojoPurpleFusionActive = false;
      }
    }, 1500));
  }

  function launchGojoPurple(fighter, target, now) {
    const direction = getOpponentDirection(fighter, target);
    const radius = fighter.radius * 3.3;
    const projectile = {
      id: `gojo-purple-${fighter.id}-${now.toFixed(3)}-${Math.random().toString(16).slice(2)}`,
      ownerId: fighter.id,
      x: fighter.x + direction.x * (fighter.radius + radius * 0.35),
      y: fighter.y + direction.y * (fighter.radius + radius * 0.35),
      dirX: direction.x,
      dirY: direction.y,
      angle: direction.angle,
      radius,
      speed: game.arenaSize * 1.05,
      expiresAt: now + 1400,
      lastAt: now,
      lastScarAt: now,
      lastScarX: fighter.x + direction.x * fighter.radius * 0.5,
      lastScarY: fighter.y + direction.y * fighter.radius * 0.5,
      lastDebrisAt: now,
      hitTargets: new Set(),
      element: createGojoPurpleProjectileElement(radius)
    };
    fighter.gojoPurpleFusionActive = false;
    if (!fighter.gojoPurpleProjectiles) fighter.gojoPurpleProjectiles = [];
    fighter.gojoPurpleProjectiles.push(projectile);
    updateGojoPurpleElement(projectile);
    tryStartGojoPurpleFromMaterials(fighter, now);
  }

  function createGojoPurpleProjectileElement(radius) {
    const element = document.createElement("div");
    element.className = "gojo-purple-projectile";
    element.innerHTML = "<span class=\"field\"></span><span class=\"mass\"></span><span class=\"corona\"></span><i class=\"rift\"></i><i class=\"shock\"></i><b class=\"edge\"></b>";
    (els.arena || els.skillLayer).appendChild(element);
    element.style.width = `${radius * 2}px`;
    element.style.height = `${radius * 2}px`;
    return element;
  }

  function updateGojoPurpleProjectiles(fighter, now) {
    if (!fighter || !fighter.gojoPurpleProjectiles || !fighter.gojoPurpleProjectiles.length) return;
    fighter.gojoPurpleProjectiles.slice().forEach((projectile) => {
      const dt = Math.min(MAX_FRAME_STEP, Math.max(0, (now - (projectile.lastAt || now)) / 1000));
      projectile.lastAt = now;
      const maxStep = Math.max(8, projectile.radius * 0.45);
      const steps = clamp(Math.ceil((projectile.speed * dt) / maxStep), 1, 18);
      for (let i = 0; i < steps; i += 1) {
        projectile.x += projectile.dirX * projectile.speed * (dt / steps);
        projectile.y += projectile.dirY * projectile.speed * (dt / steps);
        damageGojoPurpleTargets(fighter, projectile, now);
      }
      if (now - (projectile.lastScarAt || 0) >= 72) {
        const fromX = Number.isFinite(projectile.lastScarX) ? projectile.lastScarX : projectile.x - projectile.dirX * projectile.radius;
        const fromY = Number.isFinite(projectile.lastScarY) ? projectile.lastScarY : projectile.y - projectile.dirY * projectile.radius;
        const dx = projectile.x - fromX;
        const dy = projectile.y - fromY;
        const distance = Math.hypot(dx, dy);
        const scarAngle = distance > 0.1 ? Math.atan2(dy, dx) : projectile.angle;
        const centerX = fromX + dx * 0.5;
        const centerY = fromY + dy * 0.5;
        projectile.lastScarAt = now;
        projectile.lastScarX = projectile.x;
        projectile.lastScarY = projectile.y;
        createGojoPurpleGroundScar(centerX, centerY, scarAngle, Math.max(projectile.radius * 1.45, distance + projectile.radius * 1.2), projectile.radius * 2);
        if (now - (projectile.lastDebrisAt || 0) >= 160) {
          projectile.lastDebrisAt = now;
          createGojoPurpleGroundDebris(centerX, centerY, scarAngle, projectile.radius);
        }
      }
      updateGojoPurpleElement(projectile);
      const out = projectile.x < -projectile.radius || projectile.y < -projectile.radius || projectile.x > game.arenaSize + projectile.radius || projectile.y > game.arenaSize + projectile.radius;
      if (now >= projectile.expiresAt || out) {
        removeElement(projectile.element);
        fighter.gojoPurpleProjectiles = fighter.gojoPurpleProjectiles.filter((item) => item !== projectile);
      }
    });
  }

  function updateGojoPurpleElement(projectile) {
    if (!projectile || !projectile.element) return;
    projectile.element.style.left = `${projectile.x}px`;
    projectile.element.style.top = `${projectile.y}px`;
    projectile.element.style.transform = `translate(-50%, -50%) rotate(${projectile.angle}rad)`;
  }

  function damageGojoPurpleTargets(fighter, projectile, now) {
    getGojoTargets(fighter).forEach((target) => {
      if (projectile.hitTargets.has(target.id)) return;
      if (Math.hypot(target.x - projectile.x, target.y - projectile.y) > projectile.radius + target.radius * 0.55) return;
      projectile.hitTargets.add(target.id);
      const actual = applyDamage(fighter, target, {
        label: "허식 「자」",
        baseDamage: 45,
        ignoreDefense: true,
        damageKind: "궁극기",
        attackId: projectile.id,
        hitId: target.id,
        displayLabel: "허식 「자」"
      });
      if (actual > 0) {
        knockbackEntityDirectional(fighter, target, projectile.dirX, projectile.dirY, fighter.radius * 2.4);
        applyStunEffect(target, 800, now);
        const spark = createCircleEffect(target.x, target.y, target.radius * 1.5, "gojo-purple-hit");
        scheduleTimeout(() => removeElement(spark), 420);
        createGojoPurpleFissure(target.x, target.y, projectile.angle);
      }
    });
  }

  function createGojoPurpleFissure(x, y, angle) {
    const fissure = createGasterLine(x, y, angle, game.arenaSize * 0.18, Math.max(8, game.fighterBaseRadius * 0.28), "gojo-purple-fissure");
    scheduleTimeout(() => removeElement(fissure), 620);
  }

  function createGojoPurpleGroundScar(x, y, angle, length, width) {
    const safeLength = Math.max(24, length);
    const startX = x - Math.cos(angle) * safeLength * 0.5;
    const startY = y - Math.sin(angle) * safeLength * 0.5;
    const scar = createGasterLine(startX, startY, angle, safeLength, Math.max(12, width || game.fighterBaseRadius), "gojo-purple-ground-scar");
    scheduleTimeout(() => removeElement(scar), 1200);
  }

  function createGojoPurpleGroundDebris(x, y, angle, radius) {
    const sideX = Math.cos(angle + Math.PI / 2);
    const sideY = Math.sin(angle + Math.PI / 2);
    const offset = Math.max(8, radius * 0.48);
    const debrisRadius = Math.max(14, radius * 0.28);
    createStoneDebris(x + sideX * offset, y + sideY * offset, debrisRadius, "gojo-purple-ground-debris", 5);
    createStoneDebris(x - sideX * offset, y - sideY * offset, debrisRadius, "gojo-purple-ground-debris", 5);
  }

  function createGojoDomainWarning(fighter, state) {
    if (!state || !state.data) return null;
    state.data.dim = document.createElement("div");
    state.data.dim.className = "gojo-domain-dim charging";
    state.data.dim.innerHTML = "<span class=\"prep-geometry\"></span><span class=\"prep-curve curve-a\"></span><span class=\"prep-curve curve-b\"></span>";
    state.data.title = createGojoDomainTitle("영역전개", "무량공처", "charging");
    els.skillLayer.append(state.data.dim, state.data.title);
    return state.data.dim;
  }

  function updateGojoDomainWarning() {
    return null;
  }

  function createGojoDomainTitle(kicker, title, extraClass = "") {
    const element = document.createElement("div");
    element.className = `gojo-domain-title ${extraClass}`;
    const small = document.createElement("span");
    small.textContent = kicker;
    const strong = document.createElement("strong");
    strong.textContent = title;
    element.append(small, strong);
    return element;
  }

  function startGojoUnlimitedVoid(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state || !opponent) return;
    clearGojoSkillState(fighter, state);
    cancelFighterSkill(opponent);
    const endAt = now + (Number(skill.duration) || 5000);
    const overlay = createGojoDomainOverlayElement();
    els.skillLayer.appendChild(overlay);
    const title = createGojoDomainTitle("영역전개", "무량공처", "active");
    els.skillLayer.appendChild(title);
    addGojoTimer(fighter, scheduleTimeout(() => removeElement(title), 1450));

    fighter.gojoDomain = {
      active: true,
      ownerId: fighter.id,
      opponentId: opponent.id,
      endAt,
      skill,
      overlay,
      title,
      finishApplied: false
    };
    fighter.gojoInfinityGauge = GOJO_INFINITY_MAX;
    fighter.gojoInfinityCollapsedUntil = 0;
    const casterElement = getFighterElement(fighter);
    if (casterElement) casterElement.classList.add("gojo-domain-caster");
    lockGojoDomainTarget(opponent, endAt);
    speedUpGojoDomainCooldowns(fighter, now);
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
    fighter.recoveryUntil = now + Math.min(650, getSkillRecoveryDuration(skill));
    fighter.recoverySkill = null;
    getFighterElement(fighter).classList.add("recovering");
    createShortHitStop(100);
    addLog(`${fighter.name} 영역전개 「무량공처」`, "ultimate");
  }

  function lockGojoDomainTarget(target, endAt) {
    if (!target || target.dead) return;
    if (!target.storedGojoDomainVelocity) {
      target.storedGojoDomainVelocity = { vx: target.vx || 0, vy: target.vy || 0 };
    }
    target.gojoDomainLockedUntil = Math.max(target.gojoDomainLockedUntil || 0, endAt);
    target.vx = 0;
    target.vy = 0;
    if (!target.gojoDomainLockEffect) {
      target.gojoDomainLockEffect = createCircleEffect(target.x, target.y, target.radius * 1.35, "gojo-domain-lock");
    }
    const element = getFighterElement(target);
    if (element) element.classList.add("gojo-domain-locked");
  }

  function clearGojoDomainLock(target) {
    if (!target) return;
    target.gojoDomainLockedUntil = 0;
    removeElement(target.gojoDomainLockEffect);
    target.gojoDomainLockEffect = null;
    if (target.storedGojoDomainVelocity && !target.dead && !target.removing && !isFighterStunned(target, getBattleNow())) {
      target.vx = target.storedGojoDomainVelocity.vx || 0;
      target.vy = target.storedGojoDomainVelocity.vy || 0;
      normalizeVelocity(target, getPixelSpeed(target));
    }
    target.storedGojoDomainVelocity = null;
    const element = getFighterElement(target);
    if (element) element.classList.remove("gojo-domain-locked");
  }

  function updateGojoDomainLockVisual(target, now) {
    if (!target || !target.gojoDomainLockEffect) return;
    if (!isGojoDomainLocked(target, now)) {
      clearGojoDomainLock(target);
      return;
    }
    target.vx = 0;
    target.vy = 0;
    updateCircleEffect(target.gojoDomainLockEffect, target.x, target.y, target.radius * 1.35);
  }

  function speedUpGojoDomainCooldowns(fighter, now) {
    if (!fighter || !fighter.skills) return;
    fighter.skills.forEach((skill, index) => {
      if (skill.type === "gojoBlue" || skill.type === "gojoRed") {
        fighter.nextSkillAt[index] = Math.min(fighter.nextSkillAt[index] || now, now + 2500);
      }
    });
  }

  function updateGojoDomain(fighter, now) {
    const domain = fighter && fighter.gojoDomain;
    if (!domain || !domain.active) return;
    const target = getFighterById(domain.opponentId);
    if (!target || target.dead || game.battleEnding || fighter.dead || now >= domain.endAt) {
      endGojoDomain(fighter, now, false);
      return;
    }
    lockGojoDomainTarget(target, domain.endAt);
    if (domain.overlay) domain.overlay.classList.toggle("ending", domain.endAt - now < 700);
  }

  function createGojoDomainOverlayElement() {
    const overlay = document.createElement("div");
    overlay.className = "gojo-domain-overlay active";
    overlay.innerHTML = [
      "<span class=\"void-depth depth-a\"></span>",
      "<span class=\"void-depth depth-b\"></span>",
      "<span class=\"void-depth depth-c\"></span>",
      "<span class=\"void-grid\"></span>",
      "<span class=\"void-curves\"></span>",
      "<span class=\"void-symbols\"></span>",
      "<span class=\"void-particles\"></span>",
      "<span class=\"void-crack\"></span>"
    ].join("");
    return overlay;
  }

  function endGojoDomain(fighter, now = getBattleNow(), interrupted = false) {
    const domain = fighter && fighter.gojoDomain;
    if (!domain) return;
    const target = getFighterById(domain.opponentId);
    if (!interrupted && target && !target.dead && !game.battleEnding && !domain.finishApplied) {
      domain.finishApplied = true;
      const actual = applyDamage(fighter, target, {
        label: "무량공처 종료",
        baseDamage: Number(domain.skill.finishDamage) || 18,
        damageKind: "궁극기",
        attackId: `gojo-domain-finish-${fighter.id}-${domain.endAt}`,
        hitId: target.id
      });
      if (actual > 0) applyStunEffect(target, Number(domain.skill.finishStunDuration) || 1000, now);
    }
    clearGojoDomain(fighter, interrupted);
  }

  function clearGojoDomain(fighter, immediate = true) {
    const domain = fighter && fighter.gojoDomain;
    if (!domain) return;
    if (domain.overlay) {
      if (immediate) {
        removeElement(domain.overlay);
      } else {
        const overlay = domain.overlay;
        overlay.classList.add("ending");
        scheduleTimeout(() => removeElement(overlay), 360);
      }
    }
    removeElement(domain.title);
    const target = getFighterById(domain.opponentId);
    clearGojoDomainLock(target);
    const casterElement = getFighterElement(fighter);
    if (casterElement) casterElement.classList.remove("gojo-domain-caster");
    releaseUltimateLock(fighter, domain.skill);
    fighter.gojoDomain = null;
  }

  function updateGojoInfinityBattleUi(card, fighter) {
    if (!card) return;
    let gauge = card.querySelector(".gojo-infinity-ui");
    if (gauge) gauge.remove();
    void fighter;
  }

  function createShortHitStop(duration) {
    const now = getBattleNow();
    game.hitStopUntil = Math.max(game.hitStopUntil || 0, now + Math.max(0, Number(duration) || 80));
  }

  function clampEntityToArena(entity) {
    if (!entity) return;
    const margin = Math.max(1, entity.radius || game.fighterBaseRadius || 26);
    entity.x = clamp(entity.x, margin, Math.max(margin, game.arenaSize - margin));
    entity.y = clamp(entity.y, margin, Math.max(margin, game.arenaSize - margin));
  }

  function normalizeAngleDelta(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
  }

  function createBlueEyesCastWarningGroup(fighter, className, title, subtitle = "") {
    const group = document.createElement("div");
    group.className = `blue-eyes-cast-warning ${className}`;
    group.innerHTML = "";
    const dim = document.createElement("div");
    dim.className = "blue-eyes-cast-dim";
    const label = document.createElement("div");
    label.className = "blue-eyes-cast-label";
    const titleEl = document.createElement("strong");
    titleEl.textContent = title || "";
    label.appendChild(titleEl);
    if (subtitle) {
      const subtitleEl = document.createElement("span");
      subtitleEl.textContent = subtitle;
      label.appendChild(subtitleEl);
    }
    group.append(dim, label);
    els.skillLayer.appendChild(group);
    return group;
  }

  function createBlueEyesGroupedLine(group, x, y, angle, length, width, className) {
    const element = document.createElement("div");
    element.className = `arena-line-effect ${className}`;
    group.appendChild(element);
    updateGasterLine(element, x, y, angle, length, width);
    return element;
  }

  function createBlueEyesGroupedCircle(group, x, y, radius, className) {
    const element = document.createElement("div");
    element.className = `arena-circle-effect ${className}`;
    group.appendChild(element);
    updateCircleEffect(element, x, y, radius);
    return element;
  }

  function createBlueEyesGroupedParticle(group, x, y, className) {
    const element = document.createElement("span");
    element.className = className;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    group.appendChild(element);
    return element;
  }

  function createBlueEyesChaosFragments(group, centerX, centerY, radius, count, active = false) {
    const fragments = [];
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + (i % 2 ? 0.18 : -0.12);
      const distance = radius * (0.38 + (i % 4) * 0.14);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const fragment = createBlueEyesGroupedParticle(group, x, y, `blue-eyes-chaos-fragment${active ? " active" : ""}`);
      fragment.style.setProperty("--tx", `${centerX - x}px`);
      fragment.style.setProperty("--ty", `${centerY - y}px`);
      fragment.style.setProperty("--spin", `${120 + i * 24}deg`);
      fragment.style.animationDelay = `${(i % 5) * 70}ms`;
      fragments.push(fragment);
    }
    return fragments;
  }

  function getBlueEyesMeteorCastData(fighter, opponent, skill) {
    const meteorCount = Math.max(1, Math.round(Number(skill.meteorCount) || 25));
    const impactRadius = Math.max(fighter.radius * 1.22, game.arenaSize * 0.048) * 2;
    const fieldRadius = impactRadius;
    const margin = Math.min(Math.max(impactRadius, fighter.radius), Math.max(1, game.arenaSize / 2 - 2));
    const usableSize = Math.max(1, game.arenaSize - margin * 2);
    const idealSpacing = game.arenaSize / Math.sqrt(Math.max(1, meteorCount));
    const minSpacing = Math.max(impactRadius * 0.85, Math.min(impactRadius * 1.35, idealSpacing * 0.72));
    const positions = [];
    for (let i = 0; i < meteorCount; i += 1) {
      let best = null;
      let bestNearest = -Infinity;
      for (let attempt = 0; attempt < 80; attempt += 1) {
        const candidate = {
          x: margin + Math.random() * usableSize,
          y: margin + Math.random() * usableSize
        };
        const nearest = positions.reduce((closest, point) => {
          return Math.min(closest, Math.hypot(candidate.x - point.x, candidate.y - point.y));
        }, Infinity);
        if (nearest >= minSpacing) {
          best = candidate;
          break;
        }
        if (nearest > bestNearest) {
          bestNearest = nearest;
          best = candidate;
        }
      }
      positions.push(best || {
        x: margin + Math.random() * usableSize,
        y: margin + Math.random() * usableSize
      });
    }
    return {
      meteorPositions: positions,
      impactRadius,
      fieldRadius
    };
  }

  function createBlueEyesMeteorWarning(x, y, radius, className = "blue-eyes-meteor-warning") {
    return createCircleEffect(x, y, radius, className);
  }

  function createBlueEyesMeteorFall(fighter, x, y, radius, index) {
    const meteor = createCircleEffect(x, y, radius * 0.62, "blue-eyes-meteor-fall");
    const angle = -Math.PI * 0.72 + index * 0.17;
    const distance = game.arenaSize * (0.35 + (index % 3) * 0.045);
    const startX = Math.cos(angle) * distance;
    const startY = -Math.abs(Math.sin(angle) * distance) - game.arenaSize * 0.18;
    const fallAngle = Math.atan2(-startY, -startX);
    meteor.style.setProperty("--meteor-start-x", `${startX}px`);
    meteor.style.setProperty("--meteor-start-y", `${startY}px`);
    meteor.style.setProperty("--meteor-angle", `${fallAngle}rad`);
    return trackBlueEyesEffect(fighter, meteor, 520);
  }

  function applyBlueEyesMeteorImpact(fighter, opponent, skill, x, y, radius, attackId) {
    const impactDamage = Number(skill.damage) || 35;
    getBlueEyesTargets(fighter, opponent).forEach((target) => {
      if (Math.hypot(target.x - x, target.y - y) > radius + target.radius * 0.55) return;
      applyDamage(fighter, target, {
        label: `${getBlueEyesSkillName(skill)} 운석`,
        baseDamage: impactDamage,
        ignoreSansDodge: true,
        ignoreBlind: true,
        damageKind: "궁극기",
        attackId,
        hitId: `impact-${target.id}`
      });
    });
  }

  function startBlueEyesMeteorBurnField(fighter, opponent, skill, x, y, radius, attackId, visualToken) {
    const field = createCircleEffect(x, y, radius, "blue-eyes-meteor-burn-field");
    const duration = Number(skill.meteorFieldDuration) || 2000;
    field.style.animationDuration = `${duration}ms`;
    trackBlueEyesEffect(fighter, field, duration);
    const tickInterval = Math.max(250, Number(skill.burnInterval) || 500);
    for (let elapsed = 0; elapsed < duration; elapsed += tickInterval) {
      scheduleTimeout(() => {
        if (game.phase !== "running" || fighter.dead || fighter.blueEyesVisualToken !== visualToken) return;
        getBlueEyesTargets(fighter, opponent).forEach((target) => {
          if (Math.hypot(target.x - x, target.y - y) > radius + target.radius * 0.45) return;
          applyBlueEyesNeutronBurn(fighter, target, skill, getBattleNow(), Math.max(tickInterval, duration - elapsed));
        });
      }, elapsed);
    }
    void attackId;
  }

  function getBlueEyesDirectionFromData(fighter, data) {
    const angle = Number.isFinite(data && data.angle) ? data.angle : Math.atan2(fighter.vy || 0, fighter.vx || 1);
    return {
      x: Math.cos(angle),
      y: Math.sin(angle),
      angle
    };
  }

  function getBlueEyesTripleBurstGeometry(fighter, data, skill) {
    const direction = getBlueEyesDirectionFromData(fighter, data || {});
    const rangeMultiplier = Number(data && data.rangeMultiplier) || Number(skill.rangeMultiplier) || 2;
    const range = Number(data && data.range) || game.arenaSize * (Number(skill.rangeRate) || 1.35) * rangeMultiplier;
    const offsets = [-0.7, 0, 0.7];
    const sideOffsets = [-fighter.radius * 1.72, 0, fighter.radius * 1.72];
    const forwardOffsets = [fighter.radius * 1.28, fighter.radius * 2.06, fighter.radius * 1.28];
    return offsets.map((offset, index) => {
      const angle = direction.angle + offset;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      const side = sideOffsets[index];
      const forward = forwardOffsets[index];
      const x = fighter.x + direction.x * forward - direction.y * side;
      const y = fighter.y + direction.y * forward + direction.x * side;
      const rayLength = getArenaRayLength(x, y, dirX, dirY, range);
      return {
        index,
        x,
        y,
        angle,
        dirX,
        dirY,
        maxLength: range,
        length: rayLength,
        width: fighter.radius * (index === 1 ? 1.56 : 1.38),
        visualWidth: Math.max(16, fighter.radius * (index === 1 ? 0.85 : 0.75)),
        core: index === 1
      };
    });
  }

  function getArenaRayLength(x, y, dirX, dirY, maxLength) {
    const candidates = [];
    if (dirX > 0) candidates.push((game.arenaSize - x) / dirX);
    if (dirX < 0) candidates.push((0 - x) / dirX);
    if (dirY > 0) candidates.push((game.arenaSize - y) / dirY);
    if (dirY < 0) candidates.push((0 - y) / dirY);
    const boundary = candidates
      .filter((value) => Number.isFinite(value) && value > 0)
      .reduce((best, value) => Math.min(best, value), maxLength);
    return clamp(boundary, 0, maxLength);
  }

  function getBlueEyesTripleBurstConvergence(fighter, opponent, beams) {
    const center = beams && beams[1];
    if (!center) return { x: fighter.x, y: fighter.y };
    const target = opponent && !opponent.dead ? opponent : null;
    const projected = target
      ? (target.x - center.x) * center.dirX + (target.y - center.y) * center.dirY
      : center.length * 0.62;
    const distance = clamp(Number(projected) || center.length * 0.62, fighter.radius * 4.2, center.length * 0.82);
    return {
      x: center.x + center.dirX * distance,
      y: center.y + center.dirY * distance
    };
  }

  function getBlueEyesTripleBurstFinalAngle(beam, convergence) {
    if (!beam) return 0;
    if (beam.index === 1 || !convergence) return beam.angle;
    return Math.atan2(convergence.y - beam.y, convergence.x - beam.x);
  }

  function getBlueEyesTripleBurstSweepSamples(beams, convergence) {
    if (!Array.isArray(beams) || !beams.length) return [];
    const samples = [];
    beams.forEach((beam) => {
      if (!beam) return;
      if (beam.index === 1) {
        samples.push({ ...beam, sample: 0, core: true });
        return;
      }
      const finalAngle = getBlueEyesTripleBurstFinalAngle(beam, convergence);
      const steps = 7;
      for (let i = 0; i < steps; i += 1) {
        const t = steps === 1 ? 1 : i / (steps - 1);
        const angle = beam.angle + normalizeAngleDelta(finalAngle - beam.angle) * t;
        samples.push({
          ...beam,
          angle,
          dirX: Math.cos(angle),
          dirY: Math.sin(angle),
          length: getArenaRayLength(beam.x, beam.y, Math.cos(angle), Math.sin(angle), beam.maxLength || beam.length),
          width: beam.width * (0.78 + t * 0.18),
          visualWidth: beam.visualWidth,
          core: false,
          sample: t
        });
      }
    });
    return samples;
  }

  function isTargetOnBlueEyesBeam(target, beam) {
    if (!target || !beam) return false;
    const dx = target.x - beam.x;
    const dy = target.y - beam.y;
    const projection = dx * beam.dirX + dy * beam.dirY;
    if (projection < -target.radius || projection > beam.length + target.radius) return false;
    const perpendicular = Math.abs(dx * beam.dirY - dy * beam.dirX);
    return perpendicular <= beam.width / 2 + target.radius * 0.72;
  }

  function createBlueEyesTripleBurstLaserSweepEffect(fighter, beams, convergence) {
    const container = document.createElement("div");
    container.className = "blue-eyes-triple-burst-lines";
    els.skillLayer.appendChild(container);
    convergence = convergence || getBlueEyesTripleBurstConvergence(fighter, getOpposingFighter(fighter.side), beams);
    const lines = beams.map((beam) => {
      const line = document.createElement("div");
      line.className = `arena-line-effect blue-eyes-triple-burst-beam beam-${beam.index + 1}`;
      container.appendChild(line);
      updateGasterLine(line, beam.x, beam.y, beam.angle, beam.length, beam.visualWidth);
      return line;
    });
    const startAt = performance.now();
    const duration = 600;
    let rafId = 0;
    const animate = (timestamp) => {
      const raw = clamp((timestamp - startAt) / duration, 0, 1);
      const eased = raw * raw * (3 - raw * 2);
      beams.forEach((beam, index) => {
        const line = lines[index];
        if (!line) return;
        const angle = beam.index === 1
          ? beam.angle
          : beam.angle + normalizeAngleDelta(getBlueEyesTripleBurstFinalAngle(beam, convergence) - beam.angle) * eased;
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);
        const length = getArenaRayLength(beam.x, beam.y, dirX, dirY, beam.maxLength || beam.length);
        updateGasterLine(line, beam.x, beam.y, angle, length, beam.visualWidth);
        line.style.filter = `brightness(${(1.08 + eased * 0.72).toFixed(2)}) saturate(${(1.05 + eased * 0.45).toFixed(2)})`;
        line.style.opacity = raw < 0.82 ? "1" : String(Math.max(0, 1 - (raw - 0.82) / 0.18));
      });
      if (raw < 1 && container.isConnected) {
        rafId = requestAnimationFrame(animate);
      }
    };
    rafId = requestAnimationFrame(animate);
    container.__cleanup = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    };
    return trackBlueEyesEffect(fighter, container, 660);
  }

  function createBlueEyesTripleBurstWarning(fighter, data, skill) {
    const group = createBlueEyesCastWarningGroup(fighter, "triple-burst charge-only", getBlueEyesSkillName(skill), "세 머리 에너지 충전");
    group.blueEyesOrbs = [];
    getBlueEyesTripleBurstGeometry(fighter, data, skill).forEach((beam) => {
      const orb = createBlueEyesGroupedCircle(group, beam.x, beam.y, fighter.radius * (beam.core ? 1.12 : 0.96), `blue-eyes-triple-burst-orb orb-${beam.index + 1}`);
      group.blueEyesOrbs.push(orb);
      for (let i = 0; i < 5; i += 1) {
        const angle = beam.angle + (Math.random() - 0.5) * Math.PI * 1.35;
        const distance = fighter.radius * (2.1 + Math.random() * 2.2);
        const particleX = beam.x + Math.cos(angle) * distance;
        const particleY = beam.y + Math.sin(angle) * distance;
        const particle = createBlueEyesGroupedParticle(group, particleX, particleY, "blue-eyes-triple-charge-particle");
        particle.style.setProperty("--tx", `${beam.x - particleX}px`);
        particle.style.setProperty("--ty", `${beam.y - particleY}px`);
        particle.style.animationDelay = `${(i * 70 + beam.index * 35)}ms`;
        if (i < 2) {
          const lightningAngle = Math.atan2(beam.y - particleY, beam.x - particleX);
          const lightningLength = Math.hypot(beam.x - particleX, beam.y - particleY);
          const lightning = createBlueEyesGroupedLine(group, particleX, particleY, lightningAngle, lightningLength, Math.max(2, fighter.radius * 0.08), "blue-eyes-triple-charge-lightning");
          lightning.style.animationDelay = `${(i * 90 + beam.index * 45)}ms`;
        }
      }
    });
    return group;
  }

  function updateBlueEyesTripleBurstWarning(group, fighter, data, skill) {
    if (!group) return;
    const beams = getBlueEyesTripleBurstGeometry(fighter, data, skill);
    beams.forEach((beam, index) => {
      updateCircleEffect(group.blueEyesOrbs && group.blueEyesOrbs[index], beam.x, beam.y, fighter.radius * (beam.core ? 1.12 : 0.96));
    });
  }

  function createBlueEyesChaosWarning(fighter, data, skill) {
    const group = createBlueEyesCastWarningGroup(fighter, "chaos-dimension", getBlueEyesSkillName(skill), "전장 중심 차원 붕괴");
    const x = Number(data.centerX) || game.arenaSize / 2;
    const y = Number(data.centerY) || game.arenaSize / 2;
    const radius = Number(data.radius) || game.arenaSize * (Number(skill.radiusRate) || 0.34);
    createBlueEyesGroupedCircle(group, x, y, radius, "blue-eyes-chaos-range");
    createBlueEyesGroupedCircle(group, x, y, radius * 0.2, "blue-eyes-chaos-warning-core");
    createBlueEyesChaosFragments(group, x, y, radius, 12);
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6 + Math.PI / 6;
      const startX = x + Math.cos(angle) * radius * 0.92;
      const startY = y + Math.sin(angle) * radius * 0.92;
      createBlueEyesGroupedLine(group, startX, startY, angle + Math.PI, radius * 0.58, Math.max(3, fighter.radius * 0.08), "blue-eyes-chaos-suction-line");
    }
    return group;
  }

  function createBlueEyesNeutronWarning(fighter, data, skill) {
    const group = document.createElement("div");
    group.className = "blue-eyes-cast-warning neutron-blast roar-only";
    const dim = document.createElement("div");
    dim.className = "blue-eyes-cast-dim";
    group.appendChild(dim);
    els.skillLayer.appendChild(group);
    group.blueEyesRoarWarning = createBlueEyesGroupedCircle(
      group,
      fighter.x,
      fighter.y,
      fighter.radius * 2.25,
      "blue-eyes-neutron-roar-preview"
    );
    const fighterElement = getFighterElement(fighter);
    if (fighterElement) fighterElement.classList.add("blue-eyes-roaring");
    const duration = clamp(Number(skill.roarDuration) || 900, 800, 1000);
    for (let i = 0; i < 4; i += 1) {
      scheduleTimeout(() => {
        if (!group.isConnected || game.phase !== "running" || fighter.dead) return;
        const wave = createBlueEyesGroupedCircle(
          group,
          fighter.x,
          fighter.y,
          fighter.radius * (2.2 + i * 0.88),
          "blue-eyes-neutron-roar-wave"
        );
        wave.style.animationDelay = `${i * 18}ms`;
      }, i * 145);
    }
    scheduleTimeout(() => {
      if (fighterElement) fighterElement.classList.remove("blue-eyes-roaring");
    }, duration);
    pulseArena();
    return group;
  }

  function updateBlueEyesNeutronWarning(group, fighter, data) {
    if (!group) return;
    if (group.blueEyesRoarWarning) {
      updateCircleEffect(group.blueEyesRoarWarning, fighter.x, fighter.y, fighter.radius * 2.25);
    }
  }

  function startBlueEyesTripleBurstStream(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    clearBlueEyesTransientEffects(fighter);
    fighter.blueEyesVisualToken = `${skill.type}-${now}`;
    const skillName = getBlueEyesSkillName(skill);
    const beams = getBlueEyesTripleBurstGeometry(fighter, state.data, skill);
    const convergence = getBlueEyesTripleBurstConvergence(fighter, opponent, beams);
    const hitSamples = getBlueEyesTripleBurstSweepSamples(beams, convergence);
    const effects = [createBlueEyesTripleBurstLaserSweepEffect(fighter, beams, convergence)];
    const dim = createBlueEyesOverlay(fighter, "blue-eyes-skill-dim brief", 720);
    state.data.effects = effects.concat(dim);

    getBlueEyesTargets(fighter, opponent).forEach((target) => {
      const hitBeams = hitSamples.filter((beam) => isTargetOnBlueEyesBeam(target, beam));
      if (!hitBeams.length) return;
      const mergedHit = Math.hypot(target.x - convergence.x, target.y - convergence.y) <= fighter.radius * 4.3 + target.radius;
      const hitBeamIndices = new Set(hitBeams.map((beam) => beam.index));
      const isCritical = hitBeamIndices.has(1) || hitBeamIndices.size >= 2 || mergedHit;
      const actual = applyDamage(fighter, target, {
        label: isCritical ? `${skillName} 중심부` : skillName,
        baseDamage: isCritical ? Number(skill.coreDamage) || 45 : Number(skill.damage) || 18,
        damageKind: "스킬",
        attackId: `blue-triple-burst-${fighter.id}-${now.toFixed(2)}-${target.id}`,
        hitId: isCritical ? "critical" : "outer"
      });
      if (actual > 0) {
        const impact = createCircleEffect(target.x, target.y, target.radius * (isCritical ? 1.72 : 1.34), "blue-eyes-triple-hit-spark");
        trackBlueEyesEffect(fighter, impact, 360);
        applyBlueEyesStun(fighter, target, Number(skill.stunDuration) || 2000, now, `triple-${fighter.id}-${now.toFixed(2)}-${target.id}`);
        if (isCritical) pulseArena();
      }
    });
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
    startSkillRecovery(fighter, skill, now);
    addLog(`${fighter.name} ${skillName}`, "skill");
  }

  function startBlueEyesChaosDimension(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    if (isBlueEyesChaosFieldActive(fighter, now)) {
      restoreStoredVelocity(fighter, state);
      fighter.skillState = null;
      return;
    }
    clearBlueEyesTransientEffects(fighter);
    fighter.blueEyesVisualToken = `${skill.type}-${now}`;
    const radius = Number(state.data.radius) || game.arenaSize * (Number(skill.radiusRate) || 0.34);
    const centerX = Number(state.data.centerX) || game.arenaSize / 2;
    const centerY = Number(state.data.centerY) || game.arenaSize / 2;
    const duration = Number(skill.pullDuration) || 1200;
    const field = {
      skill: { ...skill },
      centerX,
      centerY,
      radius,
      endAt: now + duration,
      pulseInterval: 160,
      cancelled: false,
      effects: [],
      attackId: `blue-chaos-field-${fighter.id}-${now.toFixed(2)}`
    };
    fighter.blueEyesChaosField = field;
    const dim = document.createElement("div");
    dim.className = "blue-eyes-skill-dim chaos";
    els.skillLayer.appendChild(dim);
    trackBlueEyesChaosFieldEffect(field, dim);
    scheduleTimeout(() => removeBlueEyesChaosFieldEffect(field, dim), duration);
    trackBlueEyesChaosFieldEffect(field, createCircleEffect(centerX, centerY, radius, "blue-eyes-chaos-range active"));
    trackBlueEyesChaosFieldEffect(field, createCircleEffect(centerX, centerY, radius * 0.22, "blue-eyes-chaos-core"));
    const fragmentGroup = document.createElement("div");
    fragmentGroup.className = "blue-eyes-chaos-fragment-layer active";
    els.skillLayer.appendChild(fragmentGroup);
    createBlueEyesChaosFragments(fragmentGroup, centerX, centerY, radius, 16, true);
    trackBlueEyesChaosFieldEffect(field, fragmentGroup);
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6 + Math.PI / 6;
      const startX = centerX + Math.cos(angle) * radius * 0.92;
      const startY = centerY + Math.sin(angle) * radius * 0.92;
      const line = createGasterLine(startX, startY, angle + Math.PI, radius * 0.62, Math.max(3, fighter.radius * 0.08), "blue-eyes-chaos-suction-line active");
      trackBlueEyesChaosFieldEffect(field, line);
    }
    pulseBlueEyesChaosField(fighter, field);
    scheduleTimeout(() => finishBlueEyesChaosField(fighter, field), duration);
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
    getFighterElement(fighter).classList.remove("casting", "recovering");
    addLog(`${fighter.name} ${getBlueEyesSkillName(skill)}`, "skill");
  }

  function updateBlueEyesChaosDimension(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;
    const data = state.data;
    const dt = Math.max(0, Math.min(0.06, (now - (data.lastUpdateAt || now)) / 1000));
    data.lastUpdateAt = now;
    if (!data.exploded && now >= (data.nextPullPulseAt || now)) {
      data.nextPullPulseAt = now + 160;
      const ring = createCircleEffect(data.centerX, data.centerY, data.radius * 1.08, "blue-eyes-chaos-inhale-ring");
      trackBlueEyesEffect(fighter, ring, 360);
      getBlueEyesTargets(fighter, opponent).forEach((target) => {
        const dx = data.centerX - target.x;
        const dy = data.centerY - target.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance > data.radius + target.radius) return;
        const pullRate = 0.11 + Math.max(0, 1 - distance / (data.radius + target.radius)) * 0.08;
        const pull = Math.min(distance, Math.max(fighter.radius * 0.18, distance * pullRate));
        target.x += (dx / distance) * pull;
        target.y += (dy / distance) * pull;
        target.vx = (target.vx || 0) * 0.62 + (dx / distance) * game.arenaSize * 0.07;
        target.vy = (target.vy || 0) * 0.62 + (dy / distance) * game.arenaSize * 0.07;
        clampEntityToArena(target);
        const element = getEntityElement(target);
        if (element) element.classList.add("blue-eyes-chaos-pulled");
      });
    }
    if (!data.compressed && now >= data.endAt - 260) {
      data.compressed = true;
      if (data.effects) {
        data.effects.forEach((effect) => {
          if (effect && effect.classList) effect.classList.add("blue-eyes-chaos-compressing");
        });
      }
    }
    if (!data.exploded && now >= data.endAt) {
      data.exploded = true;
      if (data.effects) {
        data.effects.forEach((effect) => removeElement(effect));
        data.effects = [];
      }
      const blast = createCircleEffect(data.centerX, data.centerY, data.radius * 0.96, "blue-eyes-chaos-explosion");
      trackBlueEyesEffect(fighter, blast, 620);
      getBlueEyesTargets(fighter, opponent).forEach((target) => {
        const inside = Math.hypot(target.x - data.centerX, target.y - data.centerY) <= data.radius + target.radius * 0.55;
        if (!inside) return;
        const actual = applyDamage(fighter, target, {
          label: getBlueEyesSkillName(state.skill),
          baseDamage: Number(state.skill.damage) || 26,
          defenseIgnoreRate: Number(state.skill.defenseIgnoreRate) || 0.5,
          damageKind: "스킬",
          attackId: `blue-chaos-${fighter.id}-${state.activateAt}-${target.id}`,
          hitId: "explosion"
        });
        if (actual > 0) {
          applyBlueEyesStun(fighter, target, Number(state.skill.stunDuration) || 3000, now, `legacy-chaos-${fighter.id}-${state.activateAt}-${target.id}`);
          knockbackEntity(fighter, target, fighter.radius * 0.42);
        }
      });
      pulseArena();
      data.endAt = now + 180;
    }
    if (data.exploded && now >= data.endAt) {
      getBlueEyesTargets(fighter, opponent).forEach((target) => {
        const element = getEntityElement(target);
        if (element) element.classList.remove("blue-eyes-chaos-pulled");
      });
      finishBlueEyesRunningSkill(fighter, state.skill, now);
    }
  }

  function createBlueEyesNeutronRoarEffect(fighter, skill, duration) {
    const effects = [];
    const fighterElement = getFighterElement(fighter);
    if (fighterElement) fighterElement.classList.add("blue-eyes-roaring");
    const dim = createBlueEyesOverlay(fighter, "blue-eyes-neutron-dim roar", duration + 420);
    effects.push(dim);
    for (let i = 0; i < 4; i += 1) {
      scheduleTimeout(() => {
        if (game.phase !== "running" || fighter.dead) return;
        const wave = createCircleEffect(
          fighter.x,
          fighter.y,
          fighter.radius * (2.2 + i * 0.88),
          "blue-eyes-neutron-roar-wave"
        );
        trackBlueEyesEffect(fighter, wave, 760);
      }, i * 150);
    }
    scheduleTimeout(() => {
      if (fighterElement) fighterElement.classList.remove("blue-eyes-roaring");
    }, duration);
    pulseArena();
    return effects;
  }

  function startBlueEyesNeutronBlast(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    clearBlueEyesTransientEffects(fighter);
    const visualToken = `${skill.type}-${now}`;
    fighter.blueEyesVisualToken = visualToken;
    const fighterElement = getFighterElement(fighter);
    if (fighterElement) fighterElement.classList.remove("blue-eyes-neutron-lifting", "blue-eyes-roaring");
    const positions = Array.isArray(state.data.meteorPositions) && state.data.meteorPositions.length
      ? state.data.meteorPositions
      : getBlueEyesMeteorCastData(fighter, opponent, skill).meteorPositions;
    const impactRadius = Number(state.data.impactRadius) || Math.max(fighter.radius * 1.22, game.arenaSize * 0.048) * 2;
    const fieldRadius = Number(state.data.fieldRadius) || impactRadius;
    const dropInterval = Math.max(55, Number(skill.meteorDropInterval) || 95);
    state.data.effects = [];
    positions.forEach((point, index) => {
      const dropDelay = index * dropInterval;
      const attackId = `blue-neutron-meteor-${fighter.id}-${now.toFixed(2)}-${index}`;
      scheduleTimeout(() => {
        if (game.phase !== "running" || fighter.dead || fighter.blueEyesVisualToken !== visualToken) return;
        const warning = createBlueEyesMeteorWarning(point.x, point.y, impactRadius, "blue-eyes-meteor-warning imminent");
        trackBlueEyesEffect(fighter, warning, 520);
        createBlueEyesMeteorFall(fighter, point.x, point.y, impactRadius, index);
      }, dropDelay);
      scheduleTimeout(() => {
        if (game.phase !== "running" || fighter.dead || fighter.blueEyesVisualToken !== visualToken) return;
        const impact = createCircleEffect(point.x, point.y, impactRadius, "blue-eyes-meteor-impact");
        trackBlueEyesEffect(fighter, impact, 520);
        applyBlueEyesMeteorImpact(fighter, opponent, skill, point.x, point.y, impactRadius, attackId);
        startBlueEyesMeteorBurnField(fighter, opponent, skill, point.x, point.y, fieldRadius, attackId, visualToken);
        if (index % 3 === 0) pulseArena();
      }, dropDelay + 420);
    });
    if (fighterElement) fighterElement.classList.remove("blue-eyes-roaring", "blue-eyes-neutron-lifting");
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
    startSkillRecovery(fighter, skill, now);
    fighter.recoveryUntil = Math.max(fighter.recoveryUntil || 0, now + positions.length * dropInterval + 560);
    addLog(`${fighter.name} ${getBlueEyesSkillName(skill)}`, "bad");
  }

  function finishBlueEyesRunningSkill(fighter, skill, now) {
    if (!fighter.skillState) return;
    restoreStoredVelocity(fighter, fighter.skillState);
    fighter.skillState = null;
    startSkillRecovery(fighter, skill, now);
  }

  function clearBlueEyesSkillState(fighter, state) {
    if (!state || !state.data) return;
    fighter.blueEyesVisualToken = null;
    const fighterElement = getFighterElement(fighter);
    if (fighterElement) fighterElement.classList.remove("blue-eyes-neutron-lifting");
    if (state.skill && state.skill.type === "blueEyesChaosDimension") {
      Object.values(game.fighters).concat(game.summons).forEach((target) => {
        const element = getEntityElement(target);
        if (element) element.classList.remove("blue-eyes-chaos-pulled");
      });
    }
    if (state.data.effects) {
      state.data.effects.forEach((effect) => removeElement(effect));
      state.data.effects = [];
    }
  }

  function createBlueEyesLineEffect(fighter, direction, length, width, className) {
    const element = document.createElement("div");
    element.className = `arena-line-effect ${className}`;
    const centerX = fighter.x + direction.x * (fighter.radius + length / 2);
    const centerY = fighter.y + direction.y * (fighter.radius + length / 2);
    element.style.width = `${length}px`;
    element.style.height = `${width}px`;
    element.style.left = `${centerX}px`;
    element.style.top = `${centerY}px`;
    element.style.transform = `translate(-50%, -50%) rotate(${direction.angle}rad)`;
    els.skillLayer.appendChild(element);
    return element;
  }

  function isTargetOnBlueEyesLine(fighter, target, direction, length, width) {
    if (!target || target.dead || target.removing || isFighterOutOfBattle(target)) return false;
    const dx = target.x - fighter.x;
    const dy = target.y - fighter.y;
    const projection = dx * direction.x + dy * direction.y;
    if (projection < -target.radius || projection > length + target.radius) return false;
    const perpendicular = Math.abs(dx * direction.y - dy * direction.x);
    return perpendicular <= width / 2 + target.radius * 0.72;
  }

  function createBlueEyesImpact(target, variant) {
    const effect = createCircleEffect(target.x, target.y, target.radius * 1.45, variant === "burst" ? "blue-eyes-burst-impact" : "blue-eyes-impact");
    addBlueEyesParticles(effect, 8, "impact");
    scheduleTimeout(() => removeElement(effect), 420);
  }

  function createBlueEyesTripleHitEffect(fighter, target, hitIndex, didHit = false, didStun = false) {
    const classes = ["blue-eyes-triple-left", "blue-eyes-triple-right", "blue-eyes-triple-center"];
    const effect = createCircleEffect(target.x, target.y, target.radius * (hitIndex === 2 ? 1.7 : 1.25), classes[hitIndex] || "blue-eyes-impact");
    trackBlueEyesEffect(fighter, effect, 460);
    const strike = createBlueEyesSlashLine(fighter, target, hitIndex);
    trackBlueEyesEffect(fighter, strike, 360);
    if (hitIndex === 1) {
      const jaw = createCircleEffect(target.x, target.y, target.radius * 2.05, "blue-eyes-triple-jaw");
      trackBlueEyesEffect(fighter, jaw, 520);
    }
    if (hitIndex === 2) {
      const blast = createCircleEffect(target.x, target.y, target.radius * 2.35, "blue-eyes-triple-breath-burst");
      addBlueEyesParticles(blast, 12, "ultimate");
      trackBlueEyesEffect(fighter, blast, 680);
    }
    createBlueEyesFloatingText(target, `${hitIndex + 1} HIT`, `hit-count hit-${hitIndex + 1}`, 620, 1.85);
    if (didHit && hitIndex === 2) {
      const ring = createCircleEffect(target.x, target.y, target.radius * 1.95, didStun ? "blue-eyes-stun-confirm" : "blue-eyes-triple-final-no-stun");
      addBlueEyesParticles(ring, didStun ? 10 : 5, didStun ? "ultimate" : "impact");
      trackBlueEyesEffect(fighter, ring, 760);
      if (didStun) {
        createBlueEyesFloatingText(target, "기절", "stun-text", 780, 2.35);
      }
    }
  }

  function createBlueEyesWrathImpact(fighter, target, stolenLabel = "") {
    const bite = createCircleEffect(target.x, target.y, target.radius * 1.75, "blue-eyes-wrath-bite");
    const drain = createBlueEyesLineEffect(target, getOpponentDirection(target, fighter), Math.hypot(fighter.x - target.x, fighter.y - target.y), target.radius * 0.34, "blue-eyes-wrath-drain");
    trackBlueEyesEffect(fighter, bite, 520);
    trackBlueEyesEffect(fighter, drain, 420);
    const shock = createCircleEffect(target.x, target.y, target.radius * 2.15, "blue-eyes-wrath-shock");
    trackBlueEyesEffect(fighter, shock, 520);
    const maw = createCircleEffect(target.x, target.y, target.radius * 2.55, "blue-eyes-wrath-maw");
    trackBlueEyesEffect(fighter, maw, 620);
    if (stolenLabel) {
      const siphon = createBlueEyesLineEffect(target, getOpponentDirection(target, fighter), Math.hypot(fighter.x - target.x, fighter.y - target.y), target.radius * 0.62, "blue-eyes-wrath-siphon");
      trackBlueEyesEffect(fighter, siphon, 720);
      createBlueEyesFloatingText(fighter, `버프 강탈\n${stolenLabel}`, "stolen-buff", 980, 2.55);
    }
  }

  function getBlueEyesBuffCandidates(target, now) {
    if (!target || target.dead) return [];
    const candidates = [];
    if (target.damageReduction && target.damageReduction > 0) {
      const value = clamp(target.damageReduction, 0.15, 0.45);
      candidates.push({
        label: "피해 감소",
        grantType: "reduction",
        grantValue: value,
        remove: () => { target.damageReduction = 0; }
      });
    }
    if (target.speedMultiplier && target.speedMultiplier > 1.02) {
      const value = clamp(target.speedMultiplier, 1.12, 1.35);
      candidates.push({
        label: "속도 강화",
        grantType: "speed",
        grantValue: value,
        remove: () => { target.speedMultiplier = 1; normalizeVelocity(target, getPixelSpeed(target)); }
      });
    }
    if (target.healMultiplier && target.healMultiplier > 1.02) {
      const value = clamp(target.healMultiplier, 1.12, 1.35);
      candidates.push({
        label: "회복 강화",
        grantType: "heal",
        grantValue: value,
        remove: () => { target.healMultiplier = 1; }
      });
    }
    if (target.maugaTempHp && target.maugaTempHp > 0) {
      candidates.push({
        label: "임시 체력",
        grantType: "reduction",
        grantValue: 0.22,
        remove: () => { target.maugaTempHp = 0; }
      });
    }
    if (isChillShieldActive(target, now)) {
      candidates.push({
        label: "보호막",
        grantType: "reduction",
        grantValue: 0.25,
        remove: () => { target.chillShieldUntil = 0; endChillShieldVisual(target); }
      });
    }
    if (target.aatroxUltimate && target.aatroxUltimate.active) {
      candidates.push({
        label: "궁극 강화",
        grantType: "speed",
        grantValue: 1.2,
        remove: () => endWorldEnder(target, true, now)
      });
    }
    if (target.ronaldoUltimate && target.ronaldoUltimate.active) {
      candidates.push({
        label: "챔피언 강화",
        grantType: "speed",
        grantValue: 1.2,
        remove: () => endRonaldoUltimate(target, true, now)
      });
    }
    if (target.ricoUltimate && target.ricoUltimate.active) {
      candidates.push({
        label: "탄환 강화",
        grantType: "speed",
        grantValue: 1.16,
        remove: () => endRicoUltimate(target, true, now)
      });
    }
    if (target.monkEnlightenment && target.monkEnlightenment.active) {
      candidates.push({
        label: "깨달음",
        grantType: "reduction",
        grantValue: 0.24,
        remove: () => endMonkEnlightenment(target, true, now)
      });
    }
    if (target.maugaHeartUntil && now < target.maugaHeartUntil) {
      candidates.push({
        label: "심장 과부하",
        grantType: "heal",
        grantValue: 1.25,
        remove: () => {
          target.maugaHeartUntil = 0;
          removeElement(target.maugaHeartEffect);
          target.maugaHeartEffect = null;
        }
      });
    }
    return candidates;
  }

  function purgeBlueEyesBuffs(target, now) {
    const candidates = getBlueEyesBuffCandidates(target, now);
    candidates.forEach((buff) => buff.remove());
    if (candidates.length) {
      createBlueEyesBuffShatter(target);
      addLog(`${target.name} 버프 해제`, "bad");
    }
    return candidates.length;
  }

  function stealRandomBlueEyesBuff(fighter, target, duration, now) {
    const candidates = getBlueEyesBuffCandidates(target, now);
    if (!candidates.length) return "";
    const buff = candidates[Math.floor(Math.random() * candidates.length)];
    buff.remove();
    addBlueEyesStolenBuff(fighter, buff.grantType, buff.grantValue, duration, buff.label, now);
    createBlueEyesBuffShatter(target);
    const aura = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.4, "blue-eyes-stolen-aura");
    trackBlueEyesEffect(fighter, aura, 620);
    addLog(`${fighter.name} ${target.name}의 ${buff.label} 강탈`, "good");
    return buff.label;
  }

  function addBlueEyesStolenBuff(fighter, type, value, duration, label, now) {
    fighter.blueEyesStolenBuffs.push({
      type,
      value,
      label,
      until: now + Math.max(0, Number(duration) || 5000)
    });
    recalculateBlueEyesStolenBuffs(fighter, now);
  }

  function expireBlueEyesStolenBuffs(fighter, now) {
    if (!fighter || !fighter.blueEyesStolenBuffs) return;
    const before = fighter.blueEyesStolenBuffs.length;
    fighter.blueEyesStolenBuffs = fighter.blueEyesStolenBuffs.filter((buff) => buff && now < buff.until);
    if (fighter.blueEyesStolenBuffs.length !== before) {
      recalculateBlueEyesStolenBuffs(fighter, now);
    }
  }

  function recalculateBlueEyesStolenBuffs(fighter, now) {
    const buffs = (fighter.blueEyesStolenBuffs || []).filter((buff) => buff && now < buff.until);
    fighter.blueEyesStolenSpeedMultiplier = buffs
      .filter((buff) => buff.type === "speed")
      .reduce((largest, buff) => Math.max(largest, Number(buff.value) || 1), 1);
    fighter.blueEyesStolenDamageReduction = buffs
      .filter((buff) => buff.type === "reduction")
      .reduce((largest, buff) => Math.max(largest, Number(buff.value) || 0), 0);
    fighter.blueEyesStolenHealMultiplier = buffs
      .filter((buff) => buff.type === "heal")
      .reduce((largest, buff) => Math.max(largest, Number(buff.value) || 1), 1);
    if (!fighter.dead) {
      normalizeVelocity(fighter, getPixelSpeed(fighter));
    }
  }

  function createBlueEyesBuffShatter(target) {
    if (!target) return;
    const shatter = createCircleEffect(target.x, target.y, target.radius * 1.5, "blue-eyes-buff-shatter");
    addBlueEyesParticles(shatter, 10, "shatter");
    scheduleTimeout(() => removeElement(shatter), 460);
  }

  function startMaugaGuns(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    const duration = Number(skill.duration) || 3000;
    state.data.endAt = now + duration;
    state.data.lastUpdateAt = now;
    state.data.bullets = [];
    state.data.shells = [];
    state.data.fireMode = "single";
    state.data.nextSingleAt = now;
    state.data.nextDualAt = now;
    state.data.lastSingleGun = "";
    state.data.singleGunStreak = 0;
    state.data.activeGun = "";
    state.data.activeGunUntil = 0;
    state.data.originalSpeedMultiplier = fighter.speedMultiplier || 1;
    fighter.speedMultiplier = (fighter.speedMultiplier || 1) * (1 - (Number(skill.moveSlowRate) || 0.25));
    ensureMaugaWeapons(fighter);
    getFighterElement(fighter).classList.add("mauga-firing");
    restoreStoredVelocity(fighter, state);
    addLog(`${fighter.name} 거니와 차차`, "skill");
  }

  function updateMaugaGuns(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;
    const data = state.data;
    if (fighter.dead || opponent.dead || game.phase !== "running") {
      finishMaugaGuns(fighter, now);
      return;
    }

    const dt = Math.max(0, Math.min(0.05, (now - (data.lastUpdateAt || now)) / 1000));
    data.lastUpdateAt = now;
    const target = chooseMaugaAimTarget(fighter, opponent);
    updateMaugaFireMode(fighter, target || opponent, data, now);
    updateMaugaAim(fighter, target || opponent, dt, fighter.maugaCage && fighter.maugaCage.active, data.fireMode);

    const fireInterval = getMaugaGunFireInterval(fighter, state.skill);
    if (data.fireMode === "dual") {
      if (now >= data.nextDualAt) {
        spawnMaugaBullet(fighter, state, "gunny", now, getMaugaBulletSpreadOffset("dual"));
        spawnMaugaBullet(fighter, state, "chacha", now, getMaugaBulletSpreadOffset("dual"));
        data.activeGun = "dual";
        data.activeGunUntil = now + Math.min(180, fireInterval);
        data.nextDualAt = now + fireInterval;
      }
    } else if (now >= data.nextSingleAt) {
      const gunType = chooseMaugaSingleGun(fighter, target || opponent, data, now);
      spawnMaugaBullet(fighter, state, gunType, now, getMaugaBulletSpreadOffset("single"));
      data.activeGun = gunType;
      data.activeGunUntil = now + Math.min(180, fireInterval);
      data.nextSingleAt = now + fireInterval;
    }
    updateMaugaFiringClasses(fighter, data, now);
    updateMaugaBullets(fighter, opponent, state, now, dt);

    if (now >= data.endAt) {
      finishMaugaGuns(fighter, now);
    }
  }

  function getMaugaGunFireInterval(fighter, skill) {
    const base = Number(skill.fireInterval) || 150;
    const multiplier = fighter.maugaCage && fighter.maugaCage.active
      ? Number(fighter.maugaCage.gunFireRateMultiplier) || 1.2
      : 1;
    return base / multiplier;
  }

  function updateMaugaFireMode(fighter, target, data, now) {
    const distance = target ? Math.hypot(target.x - fighter.x, target.y - fighter.y) : Infinity;
    const enterDistance = game.arenaSize * 0.2;
    const exitDistance = game.arenaSize * 0.23;
    const previousMode = data.fireMode || "single";
    let nextMode = previousMode;
    if (previousMode !== "dual" && distance <= enterDistance) {
      nextMode = "dual";
    } else if (previousMode === "dual" && distance >= exitDistance) {
      nextMode = "single";
    }
    if (nextMode !== previousMode) {
      data.fireMode = nextMode;
      data.activeGun = "";
      data.activeGunUntil = 0;
      if (nextMode === "dual") {
        data.nextDualAt = Math.max(now, Math.min(data.nextDualAt || now, now + 80));
      } else {
        data.nextSingleAt = Math.max(now, Math.min(data.nextSingleAt || now, now + 80));
      }
    }
  }

  function chooseMaugaSingleGun(fighter, target, data, now) {
    const burning = target && isMaugaBurning(target, fighter.id, now);
    const preferred = burning ? "chacha" : "gunny";
    const alternate = preferred === "gunny" ? "chacha" : "gunny";
    if (data.lastSingleGun && (data.singleGunStreak || 0) >= 2) {
      const forced = data.lastSingleGun === "gunny" ? "chacha" : "gunny";
      data.singleGunStreak = 1;
      data.lastSingleGun = forced;
      return forced;
    }
    let chosen = preferred;

    if (data.lastSingleGun === preferred) {
      chosen = data.singleGunStreak >= 2 || Math.random() < 0.42 ? alternate : preferred;
    } else if (data.lastSingleGun === alternate) {
      chosen = Math.random() < 0.68 ? preferred : alternate;
    }

    data.singleGunStreak = data.lastSingleGun === chosen ? (data.singleGunStreak || 0) + 1 : 1;
    data.lastSingleGun = chosen;
    return chosen;
  }

  function getMaugaBulletSpreadOffset(mode) {
    const min = mode === "dual" ? MAUGA_DUAL_GUN_SPREAD_MIN : MAUGA_SINGLE_GUN_SPREAD_MIN;
    const max = mode === "dual" ? MAUGA_DUAL_GUN_SPREAD_MAX : MAUGA_SINGLE_GUN_SPREAD_MAX;
    const magnitude = min + Math.random() * (max - min);
    const sign = Math.random() < 0.5 ? -1 : 1;
    return sign * magnitude * (Math.PI / 180);
  }

  function updateMaugaFiringClasses(fighter, data, now) {
    const element = getFighterElement(fighter);
    element.classList.remove("mauga-fire-gunny", "mauga-fire-chacha", "mauga-dual-fire");
    if ((data.activeGunUntil || 0) <= now) return;
    if (data.activeGun === "dual") {
      element.classList.add("mauga-dual-fire");
    } else if (data.activeGun === "gunny") {
      element.classList.add("mauga-fire-gunny");
    } else if (data.activeGun === "chacha") {
      element.classList.add("mauga-fire-chacha");
    }
  }

  function updateMaugaAim(fighter, opponent, dt, empowered = false, fireMode = "single") {
    const angles = getMaugaGunAngles(fighter);
    const target = chooseMaugaAimTarget(fighter, opponent);
    const desired = target ? Math.atan2(target.y - fighter.y, target.x - fighter.x) : Math.atan2(fighter.vy || 0, fighter.vx || 1);
    const baseTurnRate = fireMode === "dual" ? 5.6 : 7.2;
    const turnRate = (empowered ? baseTurnRate + 1.2 : baseTurnRate) * Math.max(0.005, dt);
    angles.gunny = rotateAngleToward(angles.gunny, desired, turnRate);
    angles.chacha = rotateAngleToward(angles.chacha, desired, turnRate);
  }

  function chooseMaugaAimTarget(fighter, opponent) {
    const targets = getMaugaTargets(fighter, opponent);
    let best = null;
    targets.forEach((target) => {
      const distance = Math.hypot(target.x - fighter.x, target.y - fighter.y);
      if (!best || distance < best.distance) best = { target, distance };
    });
    return best ? best.target : opponent;
  }

  function rotateAngleToward(current, target, maxStep) {
    let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (diff < -Math.PI) diff += Math.PI * 2;
    const step = clamp(diff, -maxStep, maxStep);
    return current + step;
  }

  function spawnMaugaBullet(fighter, state, gunType, now, angleOffset = 0) {
    const muzzle = getMaugaMuzzle(fighter, gunType);
    const angle = muzzle.angle + angleOffset;
    const speed = game.arenaSize * (gunType === "gunny" ? 1.55 : 1.42);
    const bullet = {
      id: `mauga-${gunType}-${fighter.id}-${now.toFixed(2)}-${Math.random().toString(16).slice(2)}`,
      type: gunType,
      x: muzzle.x,
      y: muzzle.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      radius: Math.max(3.5, fighter.radius * 0.11),
      bornAt: now,
      ownerId: fighter.id,
      ownerSide: fighter.side,
      attackId: `mauga-${gunType}-${fighter.id}-${now.toFixed(2)}-${Math.random().toString(16).slice(2)}`
    };
    bullet.element = createMaugaBulletElement(bullet);
    state.data.bullets.push(bullet);
    createMaugaMuzzleFlash(muzzle, gunType, fighter.maugaCage && fighter.maugaCage.active);
  }

  function updateMaugaBullets(fighter, opponent, state, now, dt) {
    const alive = [];
    state.data.bullets.forEach((bullet) => {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      updateMaugaBulletElement(bullet);
      if (isMaugaBulletOutOfArena(bullet) || now - bullet.bornAt > 1150) {
        removeElement(bullet.element);
        return;
      }
      const bulletOwner = getFighterById(bullet.ownerId) || fighter;
      const target = getMaugaBulletHitTarget(bulletOwner, getOpposingFighter(bulletOwner.side), bullet);
      if (target) {
        if (tryReflectProjectileAgainstTarget(target, { kind: "mauga", item: bullet, state }, bulletOwner, now)) {
          alive.push(bullet);
          return;
        }
        handleMaugaBulletHit(bulletOwner, target, state.skill, bullet, now);
        removeElement(bullet.element);
        return;
      }
      alive.push(bullet);
    });
    state.data.bullets = alive;
  }

  function handleMaugaBulletHit(fighter, target, skill, bullet, now) {
    if (bullet.type === "gunny") {
      const actual = applyDamage(fighter, target, {
        label: "거니",
        baseDamage: Number(skill.gunnyDamage) || 3,
        attackId: bullet.attackId,
        hitId: "hit"
      });
      if (actual > 0) {
        addMaugaIgniteStack(fighter, target, skill, now);
      }
      return;
    }

    const burning = isMaugaBurning(target, fighter.id, now);
    const baseDamage = Number(skill.chachaDamage) || 4;
    const actual = applyDamage(fighter, target, {
      label: burning ? "차차 치명타" : "차차",
      baseDamage: burning ? baseDamage * (Number(skill.chachaCritMultiplier) || 1.6) : baseDamage,
      attackId: bullet.attackId,
      hitId: "hit",
      maugaCritical: burning
    });
    if (burning && actual > 0) {
      createMaugaCriticalEffect(target, actual);
    }
  }

  function addMaugaIgniteStack(fighter, target, skill, now) {
    if (!target.maugaIgniteStacks) target.maugaIgniteStacks = new Map();
    const key = fighter.id;
    const current = target.maugaIgniteStacks.get(key) || { count: 0 };
    current.count += 1;
    current.lastAt = now;
    target.maugaIgniteStacks.set(key, current);
    if (current.count >= (Number(skill.burnHits) || 5)) {
      current.count = 0;
      applyMaugaBurn(fighter, target, skill, now);
    }
  }

  function applyMaugaBurn(fighter, target, skill, now) {
    if (!target.maugaBurns) target.maugaBurns = new Map();
    const duration = Number(skill.burnDuration) || 3000;
    let burn = target.maugaBurns.get(fighter.id);
    if (!burn) {
      burn = {
        ownerId: fighter.id,
        ownerSide: fighter.side,
        attackId: `mauga-burn-${fighter.id}-${target.id || target.side}-${Math.random().toString(16).slice(2)}`,
        nextTickAt: now + (Number(skill.burnTickInterval) || 500),
        tickInterval: Number(skill.burnTickInterval) || 500,
        tickDamage: Number(skill.burnTickDamage) || 2,
        effect: createMaugaBurnEffect(target)
      };
      target.maugaBurns.set(fighter.id, burn);
    }
    burn.until = now + duration;
    burn.owner = fighter;
    updateMaugaBurnVisual(target, burn);
  }

  function updateMaugaBurns(target, now) {
    if (!target || !target.maugaBurns || !target.maugaBurns.size) return;
    target.maugaBurns.forEach((burn, ownerId) => {
      const owner = burn.owner || getFighterById(ownerId);
      if (!owner || owner.dead || target.dead || target.removing || now >= burn.until) {
        removeMaugaBurn(target, ownerId, true);
        return;
      }
      burn.owner = owner;
      updateMaugaBurnVisual(target, burn);
      if (now >= burn.nextTickAt) {
        burn.nextTickAt = now + burn.tickInterval;
        const actual = applyDamage(owner, target, {
          label: "화상",
          fixedDamage: burn.tickDamage,
          attackId: `${burn.attackId}-${Math.floor(now / burn.tickInterval)}`,
          hitId: "tick"
        });
        if (actual > 0) {
          createDamageNumber(target, actual);
          pulseMaugaBurn(target, burn);
        }
      }
    });
  }

  function removeMaugaBurn(target, ownerId, fade = false) {
    if (!target || !target.maugaBurns) return;
    const burn = target.maugaBurns.get(ownerId);
    if (!burn) return;
    if (burn.effect) {
      if (fade) {
        burn.effect.classList.add("fading");
        scheduleTimeout(() => removeElement(burn.effect), 260);
      } else {
        removeElement(burn.effect);
      }
    }
    target.maugaBurns.delete(ownerId);
    if (target.maugaIgniteStacks) target.maugaIgniteStacks.delete(ownerId);
  }

  function clearMaugaBurns(target) {
    if (!target || !target.maugaBurns) return;
    Array.from(target.maugaBurns.keys()).forEach((ownerId) => removeMaugaBurn(target, ownerId, false));
    if (target.maugaIgniteStacks) target.maugaIgniteStacks.clear();
  }

  function isMaugaBurning(target, ownerId, now = getBattleNow()) {
    const burn = target && target.maugaBurns && target.maugaBurns.get(ownerId);
    return !!(burn && now < burn.until);
  }

  function startMaugaOverrun(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    const angle = Math.atan2(opponent.y - fighter.y, opponent.x - fighter.x);
    state.data.angle = angle;
    state.data.dirX = Math.cos(angle);
    state.data.dirY = Math.sin(angle);
    state.data.endAt = now + (Number(skill.maxDuration) || 1200);
    state.data.lastUpdateAt = now;
    state.data.hitChargeTargets = new Set();
    state.data.effects = [];
    state.data.originalDamageReduction = fighter.damageReduction || 0;
    fighter.damageReduction = Math.max(fighter.damageReduction || 0, Number(skill.damageReduction) || 0.35);
    fighter.maugaUnstoppable = true;
    getFighterElement(fighter).classList.add("mauga-overrun");
    addLog(`${fighter.name} 오버런`, "skill");
  }

  function updateMaugaOverrun(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;
    if (fighter.dead || opponent.dead || game.phase !== "running") {
      finishMaugaOverrun(fighter, now, false);
      return;
    }
    const data = state.data;
    const dt = Math.max(0, Math.min(0.05, (now - (data.lastUpdateAt || now)) / 1000));
    data.lastUpdateAt = now;
    const speed = game.arenaSize * 0.9;
    const nextX = fighter.x + data.dirX * speed * dt;
    const nextY = fighter.y + data.dirY * speed * dt;
    let shouldSlam = false;

    fighter.x = nextX;
    fighter.y = nextY;
    if (fighter.x - fighter.radius < 0 || fighter.x + fighter.radius > game.arenaSize || fighter.y - fighter.radius < 0 || fighter.y + fighter.radius > game.arenaSize) {
      shouldSlam = true;
    }
    keepInsideArena(fighter);
    if (isMaugaOverrunBlockedByArenaObject(fighter)) shouldSlam = true;
    createMaugaOverrunTrail(fighter, data);

    const target = getMaugaChargeContactTarget(fighter, opponent);
    if (target && !data.hitChargeTargets.has(target.id)) {
      data.hitChargeTargets.add(target.id);
      applyDamage(fighter, target, {
        label: "오버런",
        baseDamage: Number(state.skill.chargeDamage) || 8,
        attackId: `mauga-overrun-${fighter.id}-${target.id}`,
        hitId: "charge"
      });
      shouldSlam = true;
    }

    if (shouldSlam || now >= data.endAt) {
      finishMaugaOverrun(fighter, now, true);
    }
  }

  function finishMaugaOverrun(fighter, now, doSlam) {
    const state = fighter.skillState;
    if (!state) return;
    const skill = state.skill;
    if (doSlam) {
      performMaugaSlam(fighter, skill, now);
      startMaugaHeartOverload(fighter, skill, now);
    }
    clearMaugaOverrun(fighter, state);
    fighter.skillState = null;
    startSkillRecovery(fighter, skill, now);
  }

  function performMaugaSlam(fighter, skill, now) {
    const radius = fighter.radius * (Number(skill.slamRadiusRate) || 2.55);
    const impact = createCircleEffect(fighter.x, fighter.y, radius, "mauga-slam-impact");
    addAatroxCracks(impact, 10);
    scheduleTimeout(() => removeElement(impact), 520);
    pulseArena();
    getMaugaTargets(fighter, getOpposingFighter(fighter.side)).forEach((target) => {
      if (!isPointInCircle(target.x, target.y, fighter.x, fighter.y, radius + target.radius * 0.35)) return;
      const actual = applyDamage(fighter, target, {
        label: "오버런 내려찍기",
        baseDamage: Number(skill.slamDamage) || 18,
        attackId: `mauga-slam-${fighter.id}-${now.toFixed(1)}-${target.id}`,
        hitId: "slam",
        maugaHeartHeal: true,
        maugaHeartHealRate: Number(skill.heartHealRate) || 0.35
      });
      if (actual > 0) {
        createDamageNumber(target, actual);
        knockbackEntity(fighter, target, fighter.radius * 1.25);
      }
    });
  }

  function startMaugaHeartOverload(fighter, skill, now) {
    fighter.maugaHeartUntil = now + (Number(skill.heartDuration) || 3000);
    fighter.damageReduction = Math.max(fighter.damageReduction || 0, Number(skill.heartDamageReduction) || 0.25);
    if (!fighter.maugaHeartEffect) {
      fighter.maugaHeartEffect = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.35, "mauga-heart-overload");
    }
  }

  function canStartMaugaCageFight(fighter, opponent, skill) {
    if (!fighter || !opponent || fighter.dead || opponent.dead) return false;
    const radius = game.arenaSize * (Number(skill.radiusRate) || 0.32);
    return Math.hypot(opponent.x - fighter.x, opponent.y - fighter.y) <= radius - opponent.radius * 0.15;
  }

  function startMaugaCageFight(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    if (!canStartMaugaCageFight(fighter, opponent, skill)) {
      releaseUltimateLock(fighter, skill);
      fighter.skillState = null;
      restoreStoredVelocity(fighter, state);
      return;
    }
    const radius = game.arenaSize * (Number(skill.radiusRate) || 0.32);
    const endAt = now + (Number(skill.duration) || 6000);
    const cage = createMaugaCageObject(fighter, opponent, radius, endAt, skill);
    fighter.maugaCage = {
      active: true,
      skill,
      objectId: cage.id,
      endAt,
      gunFireRateMultiplier: Number(skill.gunFireRateMultiplier) || 1.2,
      gunRepeatDelay: Number(skill.gunRepeatDelay) || 1500
    };
    const gunIndex = fighter.skills.findIndex((item) => item.type === "maugaGuns");
    if (gunIndex >= 0) fighter.nextSkillAt[gunIndex] = now;
    getFighterElement(fighter).classList.add("mauga-cage-active");
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
    addLog(`${fighter.name} 케이지 파이트`, "skill");
  }

  function updateMaugaState(fighter, now) {
    if (!fighter) return;
    updateMaugaTemporaryHealth(fighter, now);
    updateMaugaHeartOverload(fighter, now);
    updateMaugaCageState(fighter, now);
  }

  function updateMaugaHeartOverload(fighter, now) {
    if (fighter.maugaHeartEffect) {
      updateCircleEffect(fighter.maugaHeartEffect, fighter.x, fighter.y, fighter.radius * 1.35);
    }
    if (fighter.maugaHeartUntil && now >= fighter.maugaHeartUntil) {
      fighter.maugaHeartUntil = 0;
      removeElement(fighter.maugaHeartEffect);
      fighter.maugaHeartEffect = null;
      if (!fighter.maugaUnstoppable) fighter.damageReduction = 0;
    }
  }

  function updateMaugaCageState(fighter, now) {
    if (!fighter.maugaCage || !fighter.maugaCage.active) return;
    const cage = getArenaObjectById(fighter.maugaCage.objectId);
    if (fighter.dead || game.phase !== "running" || !cage || now >= fighter.maugaCage.endAt) {
      endMaugaCageFight(fighter, false, now);
    }
  }

  function endMaugaCageFight(fighter, interrupted = false, now = getBattleNow()) {
    if (!fighter || !fighter.maugaCage) return;
    const state = fighter.maugaCage;
    const skill = state.skill;
    const cage = getArenaObjectById(state.objectId);
    if (cage) removeArenaObject(cage);
    fighter.maugaCage = null;
    getFighterElement(fighter).classList.remove("mauga-cage-active");
    if (interrupted || game.phase !== "running" || fighter.dead) {
      releaseUltimateLock(fighter, skill);
      return;
    }
    if (fighter.skillState) {
      scheduleTimeout(() => releaseUltimateLock(fighter, skill), getSkillRecoveryDuration(skill));
      return;
    }
    startSkillRecovery(fighter, skill, now);
  }

  function resetMaugaState(fighter) {
    if (!fighter) return;
    clearMaugaBurns(fighter);
    fighter.maugaTempHp = 0;
    fighter.maugaTempHpLastGainAt = 0;
    fighter.maugaTempHpLastDecayAt = 0;
    fighter.maugaUnstoppable = false;
    fighter.maugaHeartUntil = 0;
    removeElement(fighter.maugaHeartEffect);
    fighter.maugaHeartEffect = null;
    if (fighter.maugaCage) {
      endMaugaCageFight(fighter, true, getBattleNow());
    }
    const element = fighter.side ? getFighterElement(fighter) : null;
    if (element) {
      element.classList.remove("mauga-fighter", "mauga-firing", "mauga-fire-gunny", "mauga-fire-chacha", "mauga-dual-fire", "mauga-overrun", "mauga-cage-active");
    }
  }

  function getMaugaGunAngles(fighter) {
    if (!fighter.maugaGunAngles) {
      const angle = Math.atan2(fighter.vy || 0, fighter.vx || 1);
      fighter.maugaGunAngles = { gunny: angle, chacha: angle };
    }
    return fighter.maugaGunAngles;
  }

  function ensureMaugaWeapons(fighter) {
    if (!fighter || fighter.abilityType !== "maugaBerserker") return null;
    const element = getFighterElement(fighter);
    element.classList.add("mauga-fighter");
    let weapons = element.querySelector(".mauga-weapons");
    if (!weapons) {
      weapons = document.createElement("span");
      weapons.className = "mauga-weapons";
      weapons.innerHTML =
        '<span class="mauga-gun gunny"><i class="gun-body"></i><i class="gun-barrels"></i><i class="gun-muzzle"></i></span>' +
        '<span class="mauga-gun chacha"><i class="gun-body"></i><i class="gun-barrels"></i><i class="gun-muzzle"></i></span>';
      element.insertBefore(weapons, element.firstChild);
    }
    updateMaugaWeaponVisuals(fighter);
    return weapons;
  }

  function removeMaugaWeapons(element) {
    const weapons = element && element.querySelector(".mauga-weapons");
    removeElement(weapons);
    if (element) element.classList.remove("mauga-fighter", "mauga-firing", "mauga-fire-gunny", "mauga-fire-chacha", "mauga-dual-fire", "mauga-overrun", "mauga-cage-active");
  }

  function updateMaugaWeaponVisuals(fighter) {
    if (!fighter || fighter.abilityType !== "maugaBerserker") return;
    const element = getFighterElement(fighter);
    const weapons = element.querySelector(".mauga-weapons");
    if (!weapons) return;
    const angles = getMaugaGunAngles(fighter);
    ["gunny", "chacha"].forEach((gunType) => {
      const gun = weapons.querySelector("." + gunType);
      if (!gun) return;
      const offset = getMaugaGunOffset(fighter, gunType);
      gun.style.left = (fighter.radius + offset.x) + "px";
      gun.style.top = (fighter.radius + offset.y) + "px";
      gun.style.width = (fighter.radius * 1.18) + "px";
      gun.style.height = (fighter.radius * 0.42) + "px";
      gun.style.transform = "translate(-50%, -50%) rotate(" + angles[gunType] + "rad)";
    });
  }

  function getMaugaGunOffset(fighter, gunType) {
    const side = gunType === "gunny" ? -1 : 1;
    return {
      x: side * fighter.radius * 0.74,
      y: fighter.radius * (gunType === "gunny" ? -0.05 : 0.05)
    };
  }

  function getMaugaMuzzle(fighter, gunType) {
    const angles = getMaugaGunAngles(fighter);
    const angle = angles[gunType];
    const offset = getMaugaGunOffset(fighter, gunType);
    const barrel = fighter.radius * 0.84;
    return {
      x: fighter.x + offset.x + Math.cos(angle) * barrel,
      y: fighter.y + offset.y + Math.sin(angle) * barrel,
      angle
    };
  }

  function createMaugaBulletElement(bullet) {
    const element = document.createElement("div");
    element.className = `mauga-bullet ${bullet.type}`;
    els.skillLayer.appendChild(element);
    updateMaugaBulletElement({ ...bullet, element });
    return element;
  }

  function updateMaugaBulletElement(bullet) {
    if (!bullet.element) return;
    bullet.element.style.width = `${bullet.radius * 3.2}px`;
    bullet.element.style.height = `${bullet.radius * 1.45}px`;
    bullet.element.style.left = `${bullet.x}px`;
    bullet.element.style.top = `${bullet.y}px`;
    bullet.element.style.transform = `translate(-50%, -50%) rotate(${bullet.angle}rad)`;
  }

  function isMaugaBulletOutOfArena(bullet) {
    const margin = 28;
    return bullet.x < -margin || bullet.x > game.arenaSize + margin || bullet.y < -margin || bullet.y > game.arenaSize + margin;
  }

  function getMaugaTargets(fighter, opponent) {
    const targets = [];
    if (opponent && !opponent.dead && !isFighterOutOfBattle(opponent)) targets.push(opponent);
    getEnemySummons(fighter.side).forEach((summon) => {
      if (summon && !summon.dead && !summon.removing) targets.push(summon);
    });
    return targets;
  }

  function getMaugaBulletHitTarget(fighter, opponent, bullet) {
    let best = null;
    getMaugaTargets(fighter, opponent).forEach((target) => {
      const distance = Math.hypot(target.x - bullet.x, target.y - bullet.y);
      if (distance > target.radius + bullet.radius + 2) return;
      if (!best || distance < best.distance) best = { target, distance };
    });
    return best ? best.target : null;
  }

  function createMaugaMuzzleFlash(muzzle, gunType, empowered = false) {
    const flash = createCircleEffect(muzzle.x, muzzle.y, empowered ? 12 : 9, `mauga-muzzle-flash ${gunType}${empowered ? " empowered" : ""}`);
    scheduleTimeout(() => removeElement(flash), 180);
    const shell = createGasterLine(
      muzzle.x - Math.sin(muzzle.angle) * 8,
      muzzle.y + Math.cos(muzzle.angle) * 8,
      muzzle.angle + Math.PI * 0.5,
      8,
      3,
      gunType === "gunny" ? "mauga-shell hot" : "mauga-shell cool"
    );
    scheduleTimeout(() => removeElement(shell), 300);
  }

  function createMaugaCriticalEffect(target, amount) {
    const burst = createCircleEffect(target.x, target.y, target.radius * 1.12, "mauga-critical");
    scheduleTimeout(() => removeElement(burst), 360);
    const text = document.createElement("div");
    text.className = "floating-damage mauga-crit-number";
    text.textContent = `CRIT -${formatAmount(amount)}`;
    text.style.left = `${target.x}px`;
    text.style.top = `${target.y - target.radius - 20}px`;
    els.skillLayer.appendChild(text);
    scheduleTimeout(() => removeElement(text), 820);
  }

  function createMaugaBurnEffect(target) {
    const effect = document.createElement("span");
    effect.className = "mauga-burn";
    effect.innerHTML = '<span class="flame f1"></span><span class="flame f2"></span><span class="flame f3"></span><span class="smoke s1"></span><span class="smoke s2"></span>';
    const parent = getEntityElement(target);
    if (parent) {
      parent.appendChild(effect);
    } else {
      els.skillLayer.appendChild(effect);
    }
    updateMaugaBurnVisual(target, { effect });
    return effect;
  }

  function updateMaugaBurnVisual(target, burn) {
    if (!burn.effect) return;
    const parent = getEntityElement(target);
    if (parent && burn.effect.parentNode !== parent) {
      parent.appendChild(burn.effect);
    }
    const size = Math.max(24, target.radius * 2.34);
    burn.effect.style.width = `${size}px`;
    burn.effect.style.height = `${size}px`;
    burn.effect.style.left = "50%";
    burn.effect.style.top = "50%";
  }

  function pulseMaugaBurn(target, burn) {
    if (!burn.effect) return;
    burn.effect.classList.add("flaring");
    scheduleTimeout(() => burn.effect && burn.effect.classList.remove("flaring"), 180);
  }

  function absorbMaugaTemporaryHealth(defender, damage, now) {
    if (!defender || defender.abilityType !== "maugaBerserker" || !defender.maugaTempHp || damage <= 0) return 0;
    const absorbed = Math.min(defender.maugaTempHp, damage);
    defender.maugaTempHp = Math.max(0, defender.maugaTempHp - absorbed);
    defender.maugaTempHpLastDecayAt = now;
    createMaugaTempShieldHit(defender);
    updateStats(defender.side, defender);
    return absorbed;
  }

  function grantMaugaTemporaryHealth(fighter, amount, now) {
    if (!fighter || fighter.abilityType !== "maugaBerserker" || amount <= 0) return;
    const before = fighter.maugaTempHp || 0;
    fighter.maugaTempHp = Math.min(45, before + amount);
    fighter.maugaTempHpLastGainAt = now;
    fighter.maugaTempHpLastDecayAt = now;
    if (fighter.maugaTempHp > before) {
      const gain = fighter.maugaTempHp - before;
      const text = document.createElement("div");
      text.className = "floating-heal mauga-temp-gain";
      text.textContent = `+${formatAmount(gain)} 임시`;
      text.style.left = `${fighter.x}px`;
      text.style.top = `${fighter.y - fighter.radius - 18}px`;
      els.skillLayer.appendChild(text);
      scheduleTimeout(() => removeElement(text), 760);
      updateStats(fighter.side, fighter);
    }
  }

  function updateMaugaTemporaryHealth(fighter, now) {
    if (fighter.abilityType !== "maugaBerserker" || !fighter.maugaTempHp) return;
    if (!fighter.maugaTempHpLastDecayAt) fighter.maugaTempHpLastDecayAt = now;
    if (now - (fighter.maugaTempHpLastGainAt || 0) < 3000) return;
    const elapsed = Math.max(0, now - fighter.maugaTempHpLastDecayAt);
    fighter.maugaTempHpLastDecayAt = now;
    fighter.maugaTempHp = Math.max(0, fighter.maugaTempHp - elapsed * 0.015);
    updateStats(fighter.side, fighter);
  }

  function createMaugaTempShieldHit(fighter) {
    const hit = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.2, "mauga-temp-hit");
    scheduleTimeout(() => removeElement(hit), 260);
  }

  function createMaugaOverrunTrail(fighter, data) {
    const now = getBattleNow();
    if (data.lastTrailAt && now - data.lastTrailAt < 75) return;
    data.lastTrailAt = now;
    const trail = createCircleEffect(fighter.x, fighter.y, fighter.radius * 0.92, "mauga-overrun-trail");
    scheduleTimeout(() => removeElement(trail), 360);
  }

  function getMaugaChargeContactTarget(fighter, opponent) {
    return getMaugaTargets(fighter, opponent).find((target) => (
      Math.hypot(target.x - fighter.x, target.y - fighter.y) <= target.radius + fighter.radius * 0.88
    ));
  }

  function isMaugaOverrunBlockedByArenaObject(fighter) {
    return game.arenaObjects.some((object) => {
      if (object.type === "circleWall") {
        const distance = Math.abs(Math.hypot(fighter.x - object.x, fighter.y - object.y) - object.radius);
        if (distance < fighter.radius) {
          separateEntityFromCircleWalls(fighter);
          return true;
        }
      }
      if (object.type === "maugaCage") {
        const beforeX = fighter.x;
        const beforeY = fighter.y;
        resolveMaugaCageCollision(fighter, object);
        if (Math.hypot(beforeX - fighter.x, beforeY - fighter.y) > 0.5) return true;
      }
      return false;
    });
  }

  function clearMaugaGuns(state) {
    if (!state || !state.data) return;
    if (state.data.bullets) {
      state.data.bullets.forEach((bullet) => removeElement(bullet.element));
      state.data.bullets = [];
    }
    const fighter = Object.values(game.fighters).find((item) => item && item.skillState === state);
    if (fighter) {
      fighter.speedMultiplier = state.data.originalSpeedMultiplier || 1;
      getFighterElement(fighter).classList.remove("mauga-firing", "mauga-fire-gunny", "mauga-fire-chacha", "mauga-dual-fire");
      normalizeVelocity(fighter, getPixelSpeed(fighter));
    }
  }

  function finishMaugaGuns(fighter, now) {
    const state = fighter.skillState;
    if (!state) return;
    const skill = state.skill;
    const skillIndex = state.index;
    clearMaugaGuns(state);
    fighter.skillState = null;
    if (fighter.maugaCage && fighter.maugaCage.active && Number.isFinite(skillIndex)) {
      fighter.nextSkillAt[skillIndex] = now + (fighter.maugaCage.gunRepeatDelay || 1500);
    }
    startSkillRecovery(fighter, skill, now);
  }

  function clearMaugaOverrun(fighter, state) {
    if (!fighter || !state) return;
    fighter.damageReduction = state.data.originalDamageReduction || 0;
    fighter.maugaUnstoppable = false;
    getFighterElement(fighter).classList.remove("mauga-overrun");
    if (state.data.effects) {
      state.data.effects.forEach((effect) => removeElement(effect));
      state.data.effects = [];
    }
  }

  function createMaugaCageObject(fighter, opponent, radius, endAt, skill) {
    const element = createCircleEffect(fighter.x, fighter.y, radius, "mauga-cage");
    element.innerHTML = '<span class="cage-pillars"></span><span class="cage-chains"></span><span class="cage-fire"></span>';
    const object = {
      id: `mauga-cage-${fighter.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type: "maugaCage",
      ownerId: fighter.id,
      x: fighter.x,
      y: fighter.y,
      radius,
      element,
      insideIds: new Set([fighter.id]),
      fadeStartAt: endAt,
      expiresAt: endAt + 420,
      fadeStarted: false,
      skill
    };
    if (opponent && Math.hypot(opponent.x - object.x, opponent.y - object.y) <= radius - opponent.radius * 0.2) {
      object.insideIds.add(opponent.id);
    }
    game.summons.forEach((summon) => {
      if (summon.side !== fighter.side && Math.hypot(summon.x - object.x, summon.y - object.y) <= radius - summon.radius * 0.2) {
        object.insideIds.add(summon.id);
      }
    });
    game.arenaObjects.push(object);
    return object;
  }

  function getArenaObjectById(id) {
    return game.arenaObjects.find((object) => object.id === id);
  }

  function resolveMaugaCageCollision(entity, cage) {
    if (!entity || entity.dead || entity.removing || cage.fadeStarted) return;
    let dx = entity.x - cage.x;
    let dy = entity.y - cage.y;
    let distance = Math.hypot(dx, dy) || 1;
    if (distance === 0) {
      dx = entity.vx || 1;
      dy = entity.vy || 0;
      distance = Math.hypot(dx, dy) || 1;
    }
    const nx = dx / distance;
    const ny = dy / distance;
    const inside = cage.insideIds && cage.insideIds.has(entity.id);
    if (inside) {
      const maxDistance = cage.radius - entity.radius;
      if (distance > maxDistance) {
        entity.x = cage.x + nx * maxDistance;
        entity.y = cage.y + ny * maxDistance;
        reflectVelocityFromNormal(entity, nx, ny, true);
      }
      return;
    }
    const minDistance = cage.radius + entity.radius;
    if (distance < minDistance) {
      entity.x = cage.x + nx * minDistance;
      entity.y = cage.y + ny * minDistance;
      reflectVelocityFromNormal(entity, nx, ny, false);
    }
  }

  function reflectVelocityFromNormal(entity, nx, ny, keepInside) {
    const sign = keepInside ? 1 : -1;
    const velocityAlongNormal = entity.vx * nx + entity.vy * ny;
    if ((keepInside && velocityAlongNormal > 0) || (!keepInside && velocityAlongNormal < 0)) {
      entity.vx -= (1 + RESTITUTION) * velocityAlongNormal * nx;
      entity.vy -= (1 + RESTITUTION) * velocityAlongNormal * ny;
      normalizeVelocity(entity, getPixelSpeed(entity));
    } else if (sign) {
      normalizeVelocity(entity, getPixelSpeed(entity));
    }
  }

  function getFighterById(id) {
    return Object.values(game.fighters).find((fighter) => fighter && fighter.id === id);
  }

  function getRonaldoTargets(fighter, opponent) {
    const targets = [];
    if (opponent && !opponent.dead && !isFighterOutOfBattle(opponent)) targets.push(opponent);
    getEnemySummons(fighter.side).forEach((summon) => {
      if (summon && !summon.dead && !summon.removing) targets.push(summon);
    });
    return targets;
  }

  function getRonaldoFreeKickScale(fighter) {
    return fighter && fighter.ronaldoUltimate && fighter.ronaldoUltimate.active
      ? Number(fighter.ronaldoUltimate.freeKickScale) || 1.2
      : 1;
  }

  function getRonaldoFreeKickDamageMultiplier(fighter) {
    return fighter && fighter.ronaldoUltimate && fighter.ronaldoUltimate.active
      ? Number(fighter.ronaldoUltimate.freeKickDamageMultiplier) || 1.2
      : 1;
  }

  function createRonaldoFreeKickWarning(fighter, data) {
    const start = getRonaldoKickStartPoint(fighter, data);
    const length = getGasterBeamLengthToArenaEdge(start.x, start.y, data.dirX || 1, data.dirY || 0);
    return createGasterLine(start.x, start.y, data.angle || 0, length, Math.max(4, fighter.radius * 0.12), "ronaldo-kick-warning");
  }

  function updateRonaldoFreeKickWarning(element, fighter, data) {
    if (!element) return;
    const start = getRonaldoKickStartPoint(fighter, data);
    const length = getGasterBeamLengthToArenaEdge(start.x, start.y, data.dirX || 1, data.dirY || 0);
    updateGasterLine(element, start.x, start.y, data.angle || 0, length, Math.max(4, fighter.radius * 0.12));
  }

  function createRonaldoChargeBall(fighter, data) {
    const element = document.createElement("div");
    element.className = "ronaldo-ball charge";
    els.skillLayer.appendChild(element);
    updateRonaldoChargeBall(element, fighter, data);
    return element;
  }

  function updateRonaldoChargeBall(element, fighter, data) {
    if (!element) return;
    const point = getRonaldoKickStartPoint(fighter, data);
    const radius = fighter.radius * (Number((fighter.skillState && fighter.skillState.skill && fighter.skillState.skill.ballRadiusRate)) || 0.38) * getRonaldoFreeKickScale(fighter) * 1.18;
    element.style.width = `${radius * 2}px`;
    element.style.height = `${radius * 2}px`;
    element.style.left = `${point.x}px`;
    element.style.top = `${point.y}px`;
  }

  function getRonaldoKickStartPoint(fighter, data) {
    const dirX = data.dirX || Math.cos(data.angle || 0);
    const dirY = data.dirY || Math.sin(data.angle || 0);
    return {
      x: fighter.x + dirX * (fighter.radius * 1.22),
      y: fighter.y + dirY * (fighter.radius * 1.22)
    };
  }

  function startRonaldoFreeKick(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    const data = state.data;
    data.launchTotal = fighter.ronaldoUltimate && fighter.ronaldoUltimate.active ? 2 : 1;
    data.launchCount = 0;
    data.launchGap = 300;
    data.nextLaunchAt = now;
    getFighterElement(fighter).classList.remove("casting", "ronaldo-kicking");
    restoreStoredVelocity(fighter, state);
    launchRonaldoFreeKickBall(fighter, opponent, skill, state, now);
    addLog(`${fighter.name} 무회전 프리킥 발사`, "skill");
    if (data.launchCount >= data.launchTotal) {
      finishRonaldoFreeKick(fighter, state, now);
    }
  }

  function launchRonaldoFreeKickBall(fighter, opponent, skill, state, now) {
    if (!fighter || !opponent || fighter.dead || opponent.dead || !state || !state.data) return null;
    const data = state.data;
    const dx = opponent.x - fighter.x;
    const dy = opponent.y - fighter.y;
    const distance = Math.hypot(dx, dy) || 1;
    data.dirX = dx / distance;
    data.dirY = dy / distance;
    data.angle = Math.atan2(dy, dx);
    const start = getRonaldoKickStartPoint(fighter, data);
    const scale = getRonaldoFreeKickScale(fighter);
    const radius = fighter.radius * (Number(skill.ballRadiusRate) || 0.38) * scale * 1.18;
    const ball = {
      x: start.x,
      y: start.y,
      dirX: data.dirX,
      dirY: data.dirY,
      angle: data.angle,
      radius,
      speed: game.arenaSize * (Number(skill.projectileSpeedRate) || 2.15),
      skill,
      bornAt: now,
      expiresAt: now + 5000,
      lastUpdateAt: now,
      traveled: 0,
      bounceCount: 0,
      maxBounces: 4,
      ownerId: fighter.id,
      ownerSide: fighter.side,
      damageMultiplier: getRonaldoFreeKickDamageMultiplier(fighter),
      scale: getRonaldoFreeKickScale(fighter),
      attackId: `ronaldo-free-${fighter.id}-${now.toFixed(3)}-${data.launchCount || 0}-${Math.random().toString(16).slice(2)}`,
      targetRecords: new Map(),
      trails: [],
      lastTrailAt: now,
      element: createRonaldoBallElement(start.x, start.y, radius, data.angle, fighter.ronaldoUltimate && fighter.ronaldoUltimate.active)
    };
    fighter.ronaldoBalls = fighter.ronaldoBalls || [];
    fighter.ronaldoBalls.push(ball);
    removeElement(data.chargeBall);
    data.chargeBall = null;
    createRonaldoKickFlash(fighter);
    data.launchCount = (data.launchCount || 0) + 1;
    data.nextLaunchAt = now + (Number(data.launchGap) || 300);
    return ball;
  }

  function updateRonaldoFreeKick(fighter, opponent, now) {
    const state = fighter.skillState;
    if (state && state.data && state.data.launchTotal) {
      if (fighter.dead || !opponent || opponent.dead || game.phase !== "running") {
        clearRonaldoSkillState(fighter, state);
        fighter.skillState = null;
        return;
      }
      if ((state.data.launchCount || 0) < state.data.launchTotal && now >= (state.data.nextLaunchAt || now)) {
        launchRonaldoFreeKickBall(fighter, opponent, state.skill, state, now);
      }
      if ((state.data.launchCount || 0) >= state.data.launchTotal) {
        finishRonaldoFreeKick(fighter, state, now);
      }
      return;
    }
    if (!state || !state.data.projectile) return;
    const skill = state.skill;
    const ball = state.data.projectile;
    const dt = Math.min((now - (ball.lastUpdateAt || now)) / 1000, MAX_FRAME_STEP);
    ball.lastUpdateAt = now;
    ball.x += ball.dirX * ball.speed * dt;
    ball.y += ball.dirY * ball.speed * dt;
    ball.traveled += ball.speed * dt;
    updateRonaldoBallElement(ball);

    const hitTarget = getRonaldoTargets(fighter, opponent).find((target) => (
      Math.hypot(target.x - ball.x, target.y - ball.y) <= target.radius + ball.radius
    ));
    if (hitTarget) {
      resolveRonaldoFreeKickImpact(fighter, hitTarget, skill, ball, now);
      finishRonaldoFreeKick(fighter, state, now);
      return;
    }

    if (ball.x < -ball.radius || ball.x > game.arenaSize + ball.radius || ball.y < -ball.radius || ball.y > game.arenaSize + ball.radius || ball.traveled >= ball.maxTravel) {
      finishRonaldoFreeKick(fighter, state, now);
    }
  }

  function finishRonaldoFreeKick(fighter, state, now) {
    removeElement(state.data.projectile && state.data.projectile.element);
    removeElement(state.data.warning);
    state.data.projectile = null;
    state.data.warning = null;
    fighter.skillState = null;
    startSkillRecovery(fighter, state.skill, now);
  }

  function updateRonaldoProjectiles(fighter, now) {
    if (!fighter || !fighter.ronaldoBalls || !fighter.ronaldoBalls.length) return;
    if (fighter.dead || game.phase !== "running") {
      clearRonaldoBalls(fighter, false);
      return;
    }

    const remaining = [];
    fighter.ronaldoBalls.forEach((ball) => {
      if (!ball || ball.removing) return;
      const dt = Math.min((now - (ball.lastUpdateAt || now)) / 1000, MAX_FRAME_STEP);
      ball.lastUpdateAt = now;
      const stepDistance = Math.max(5, ball.radius * 0.42);
      const steps = clamp(Math.ceil((ball.speed * dt) / stepDistance), 1, 32);
      const stepDt = dt / steps;

      for (let i = 0; i < steps; i += 1) {
        ball.x += ball.dirX * ball.speed * stepDt;
        ball.y += ball.dirY * ball.speed * stepDt;
        ball.traveled += ball.speed * stepDt;
        resolveRonaldoBallArenaBounce(fighter, ball, now);
        resolveRonaldoBallCircleWallBounce(fighter, ball, now);
        damageRonaldoBallTargets(getFighterById(ball.ownerId) || fighter, ball, now);
        if (ball.removing) break;
      }

      updateRonaldoBallElement(ball);
      maybeCreateRonaldoBallTrail(ball, now);
      if (!ball.removing && now >= ball.expiresAt) {
        removeRonaldoBall(ball, true);
      }
      if (!ball.removing) remaining.push(ball);
    });
    fighter.ronaldoBalls = remaining;
  }

  function clearRonaldoBalls(fighter, fade = false) {
    if (!fighter || !fighter.ronaldoBalls) return;
    fighter.ronaldoBalls.forEach((ball) => removeRonaldoBall(ball, fade));
    fighter.ronaldoBalls = [];
  }

  function removeRonaldoBall(ball, fade = true) {
    if (!ball || ball.removing) return;
    ball.removing = true;
    if (ball.trails) {
      ball.trails.forEach((trail) => removeElement(trail));
      ball.trails = [];
    }
    if (!ball.element) return;
    if (fade) {
      ball.element.classList.add("fading");
      scheduleTimeout(() => removeElement(ball.element), 260);
    } else {
      removeElement(ball.element);
    }
  }

  function resolveRonaldoBallArenaBounce(fighter, ball, now) {
    let normalX = 0;
    let normalY = 0;
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      normalX += 1;
    } else if (ball.x + ball.radius > game.arenaSize) {
      ball.x = game.arenaSize - ball.radius;
      normalX -= 1;
    }
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      normalY += 1;
    } else if (ball.y + ball.radius > game.arenaSize) {
      ball.y = game.arenaSize - ball.radius;
      normalY -= 1;
    }
    if (!normalX && !normalY) return;
    const length = Math.hypot(normalX, normalY) || 1;
    reflectRonaldoBall(fighter, ball, normalX / length, normalY / length, now);
  }

  function resolveRonaldoBallCircleWallBounce(fighter, ball, now) {
    game.arenaObjects.forEach((wall) => {
      if (ball.removing || wall.fadeStarted) return;
      if (wall.type === "compressionWall") {
        if (now < (wall.activeAt || 0)) return;
        const collision = getCircleRectCollision(ball.x, ball.y, ball.radius, wall);
        if (!collision) return;
        ball.x += collision.normalX * (collision.overlap + 0.5);
        ball.y += collision.normalY * (collision.overlap + 0.5);
        keepRonaldoBallInsideArena(ball);
        const velocityAlongNormal = ball.dirX * collision.normalX + ball.dirY * collision.normalY;
        if (velocityAlongNormal < 0) {
          reflectRonaldoBall(fighter, ball, collision.normalX, collision.normalY, now);
        }
        return;
      }
      if (wall.type !== "circleWall") return;
      let dx = ball.x - wall.x;
      let dy = ball.y - wall.y;
      let distance = Math.hypot(dx, dy);
      if (distance === 0) {
        dx = ball.dirX || 1;
        dy = ball.dirY || 0;
        distance = Math.hypot(dx, dy) || 1;
      }
      const signedDistance = distance - wall.radius;
      if (Math.abs(signedDistance) >= ball.radius) return;
      const nx = dx / distance;
      const ny = dy / distance;
      const side = signedDistance >= 0 ? 1 : -1;
      const normalX = nx * side;
      const normalY = ny * side;
      const velocityAlongNormal = ball.dirX * normalX + ball.dirY * normalY;
      ball.x = wall.x + nx * (wall.radius + side * ball.radius);
      ball.y = wall.y + ny * (wall.radius + side * ball.radius);
      keepRonaldoBallInsideArena(ball);
      if (velocityAlongNormal < 0) {
        reflectRonaldoBall(fighter, ball, normalX, normalY, now);
      }
    });
  }

  function keepRonaldoBallInsideArena(ball) {
    ball.x = clamp(ball.x, ball.radius, game.arenaSize - ball.radius);
    ball.y = clamp(ball.y, ball.radius, game.arenaSize - ball.radius);
  }

  function reflectRonaldoBall(fighter, ball, normalX, normalY, now) {
    const dot = ball.dirX * normalX + ball.dirY * normalY;
    if (dot >= 0) return;
    ball.dirX -= 2 * dot * normalX;
    ball.dirY -= 2 * dot * normalY;
    const length = Math.hypot(ball.dirX, ball.dirY) || 1;
    ball.dirX /= length;
    ball.dirY /= length;
    ball.angle = Math.atan2(ball.dirY, ball.dirX);
    ball.speed *= 0.95;
    ball.bounceCount += 1;
    createRonaldoBallBounceEffect(ball);
    if (ball.bounceCount >= ball.maxBounces) {
      removeRonaldoBall(ball, true);
    }
  }

  function createRonaldoBallBounceEffect(ball) {
    const effect = createCircleEffect(ball.x, ball.y, ball.radius * 1.45, "ronaldo-ball-bounce");
    scheduleTimeout(() => removeElement(effect), 190);
  }

  function damageRonaldoBallTargets(fighter, ball, now) {
    const opponent = getOpposingFighter(fighter.side);
    getRonaldoTargets(fighter, opponent).forEach((target) => {
      if (!target || target.dead || target.removing || isFighterOutOfBattle(target)) return;
      const key = getRonaldoTargetKey(target);
      const record = getRonaldoBallTargetRecord(ball, key);
      const isColliding = Math.hypot(target.x - ball.x, target.y - ball.y) <= target.radius + ball.radius;
      if (!isColliding) {
        if (record.isCurrentlyColliding) {
          record.isCurrentlyColliding = false;
          record.hasSeparatedSinceLastHit = true;
        }
        return;
      }

      if (tryReflectProjectileAgainstTarget(target, { kind: "ronaldo", item: ball }, fighter, now)) {
        record.isCurrentlyColliding = false;
        record.hasSeparatedSinceLastHit = true;
        return;
      }

      const collisionStarted = !record.isCurrentlyColliding;
      record.isCurrentlyColliding = true;

      const firstHit = record.hitCount === 0;
      const rehitReady = now - record.lastHitAt >= RONALDO_FREEKICK_REHIT_MS;
      const bouncedSinceLastHit = ball.bounceCount > record.lastHitBounceCount;
      const canRehit = firstHit || record.hasSeparatedSinceLastHit || bouncedSinceLastHit || collisionStarted;
      if (!rehitReady || !canRehit) return;

      record.hitCount += 1;
      record.lastHitAt = now;
      record.lastHitBounceCount = ball.bounceCount;
      record.hasSeparatedSinceLastHit = false;
      resolveRonaldoFreeKickImpact(fighter, target, ball.skill || fighter.skills.find((skill) => skill.type === "ronaldoFreeKick") || {}, ball, now, record.hitCount);
    });
  }

  function getRonaldoBallTargetRecord(ball, key) {
    if (!ball.targetRecords) ball.targetRecords = new Map();
    if (!ball.targetRecords.has(key)) {
      ball.targetRecords.set(key, {
        hitCount: 0,
        lastHitAt: -Infinity,
        lastHitBounceCount: -1,
        isCurrentlyColliding: false,
        hasSeparatedSinceLastHit: true
      });
    }
    return ball.targetRecords.get(key);
  }

  function getRonaldoTargetKey(target) {
    return target.id || `${target.side || "target"}-${target.name || "unit"}`;
  }

  function resolveRonaldoFreeKickImpact(fighter, directTarget, skill, ball, now, hitIndex = 1) {
    const directKey = getRonaldoTargetKey(directTarget);
    const impactId = `${ball.attackId}:impact:${directKey}:${hitIndex}`;
    const damageMultiplier = Number(ball.damageMultiplier) || getRonaldoFreeKickDamageMultiplier(fighter);
    const directDamage = (Number(skill.damage) || 15.3) * damageMultiplier;
    const shockDamage = (Number(skill.shockwaveDamage) || 5.95) * damageMultiplier;
    const shockRadius = fighter.radius * (Number(skill.shockwaveRadiusRate) || 1.35) * (Number(ball.scale) || getRonaldoFreeKickScale(fighter));
    const directActual = applyDamage(fighter, directTarget, {
      label: skill.name || "무회전 프리킥",
      baseDamage: directDamage,
      ignoreDefense: true,
      attackId: `${impactId}:direct`,
      hitId: directKey
    });
    if (directActual > 0) {
      knockbackEntity(fighter, directTarget, fighter.radius * (Number(skill.knockbackRate) || 0.65));
    }

    const shock = createCircleEffect(ball.x, ball.y, shockRadius, "ronaldo-free-shockwave");
    scheduleTimeout(() => removeElement(shock), 420);
    pulseArena();
    const shockTargets = new Set();
    getRonaldoTargets(fighter, getOpposingFighter(fighter.side)).forEach((target) => {
      const key = getRonaldoTargetKey(target);
      if (shockTargets.has(key)) return;
      if (target === directTarget && directActual <= 0) return;
      if (!isPointInCircle(target.x, target.y, ball.x, ball.y, shockRadius + target.radius * 0.35)) return;
      shockTargets.add(key);
      applyDamage(fighter, target, {
        label: `${skill.name || "무회전 프리킥"} 충격파`,
        baseDamage: shockDamage,
        ignoreDefense: true,
        attackId: `${impactId}:shock:${key}`,
        hitId: "shock"
      });
    });
  }

  function createRonaldoBallElement(x, y, radius, angle, isUltimate = false) {
    const element = document.createElement("div");
    element.className = `ronaldo-ball projectile${isUltimate ? " ultimate" : ""}`;
    element.innerHTML = '<span></span>';
    els.arena.appendChild(element);
    updateRonaldoBallElement({ x, y, radius, angle, element, traveled: 0 });
    return element;
  }

  function updateRonaldoBallElement(ball) {
    if (!ball || !ball.element) return;
    ball.element.style.width = `${ball.radius * 2}px`;
    ball.element.style.height = `${ball.radius * 2}px`;
    ball.element.style.left = `${ball.x}px`;
    ball.element.style.top = `${ball.y}px`;
    ball.element.style.transform = `translate(-50%, -50%) rotate(${(ball.angle || 0) + (ball.traveled || 0) * 0.003}rad)`;
  }

  function maybeCreateRonaldoBallTrail(ball, now) {
    if (!ball || !ball.element || ball.removing) return;
    if (now - (ball.lastTrailAt || 0) < 70) return;
    ball.lastTrailAt = now;
    if (!ball.trails) ball.trails = [];
    while (ball.trails.length >= 5) {
      removeElement(ball.trails.shift());
    }
    const trail = document.createElement("div");
    trail.className = "ronaldo-ball-trail";
    const length = clamp(ball.radius * 2.6, 30, 78);
    const width = clamp(ball.radius * 0.48, 5, 13);
    const anchorX = ball.x - ball.dirX * ball.radius * 0.78;
    const anchorY = ball.y - ball.dirY * ball.radius * 0.78;
    trail.style.left = `${anchorX}px`;
    trail.style.top = `${anchorY}px`;
    trail.style.setProperty("--trail-length", `${length}px`);
    trail.style.setProperty("--trail-width", `${width}px`);
    trail.style.setProperty("--trail-angle", `${ball.angle || 0}rad`);
    els.arena.appendChild(trail);
    ball.trails.push(trail);
    scheduleTimeout(() => {
      removeElement(trail);
      if (ball.trails) {
        const index = ball.trails.indexOf(trail);
        if (index >= 0) ball.trails.splice(index, 1);
      }
    }, 240);
  }

  function createRonaldoKickFlash(fighter) {
    const flash = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.35, "ronaldo-kick-flash");
    scheduleTimeout(() => removeElement(flash), 320);
  }

  function getRonaldoHeaderRadius(skill) {
    return game.arenaSize * (Number(skill.radiusRate) || 0.2);
  }

  function getRonaldoHeaderCoreRadius(fighter, skill, radius = getRonaldoHeaderRadius(skill)) {
    const scale = fighter && fighter.ronaldoUltimate && fighter.ronaldoUltimate.active
      ? Number(fighter.ronaldoUltimate.headerCoreScale) || 1.2
      : 1;
    return radius * (Number(skill.coreRate) || 0.45) * scale;
  }

  function getSafeRonaldoLandingPoint(fighter, x, y) {
    const test = {
      id: fighter.id,
      x: clamp(x, fighter.radius, game.arenaSize - fighter.radius),
      y: clamp(y, fighter.radius, game.arenaSize - fighter.radius),
      radius: fighter.radius,
      vx: fighter.vx,
      vy: fighter.vy
    };
    game.arenaObjects.forEach((object) => {
      if (object.type === "maugaCage") {
        resolveMaugaCageCollision(test, object);
      }
    });
    separateEntityFromCircleWalls(test);
    keepInsideArena(test);
    return { x: test.x, y: test.y };
  }

  function startRonaldoHeader(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    const data = state.data;
    data.comboTotal = fighter.ronaldoUltimate && fighter.ronaldoUltimate.active ? 3 : 1;
    data.strikesDone = 0;
    data.comboGap = 350;
    data.attackIdBase = `ronaldo-header-${fighter.id}-${now.toFixed(3)}-${Math.random().toString(16).slice(2)}`;
    beginRonaldoHeaderLeap(fighter, state, now);
    addLog(`${fighter.name} 공중 지배`, "skill");
  }

  function beginRonaldoHeaderLeap(fighter, state, now) {
    const data = state.data;
    const skill = state.skill;
    data.waitingNext = false;
    data.startX = fighter.x;
    data.startY = fighter.y;
    data.startAt = now;
    data.impactAt = now + (Number(skill.airTime) || 450);
    data.effects = data.effects || [];
    data.effects.push(createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.2, "ronaldo-jump-ring"));
    getFighterElement(fighter).classList.remove("casting", "ronaldo-jump-ready");
    getFighterElement(fighter).classList.add("ronaldo-airborne");
    fighter.ronaldoAirborne = true;
    fighter.vx = 0;
    fighter.vy = 0;
  }

  function updateRonaldoHeader(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;
    const data = state.data;
    if (fighter.dead || !opponent || opponent.dead || game.phase !== "running") {
      clearRonaldoSkillState(fighter, state);
      fighter.skillState = null;
      return;
    }

    if (data.waitingNext) {
      if (now >= data.nextStrikeAt) {
        beginRonaldoHeaderLeap(fighter, state, now);
      }
      return;
    }

    const duration = Math.max(1, (data.impactAt || now) - (data.startAt || now));
    const progress = clamp((now - data.startAt) / duration, 0, 1);
    const ease = 1 - Math.pow(1 - progress, 2);
    fighter.x = data.startX + (data.landingX - data.startX) * ease;
    fighter.y = data.startY + (data.landingY - data.startY) * ease;
    const safePoint = getSafeRonaldoLandingPoint(fighter, fighter.x, fighter.y);
    fighter.x = safePoint.x;
    fighter.y = safePoint.y;
    updateCircleEffect(data.shadow, data.landingX, data.landingY, fighter.radius * (0.62 + progress * 0.18));

    if (now < data.impactAt) return;
    const finalPoint = getSafeRonaldoLandingPoint(fighter, data.landingX, data.landingY);
    fighter.x = finalPoint.x;
    fighter.y = finalPoint.y;
    fighter.ronaldoAirborne = false;
    getFighterElement(fighter).classList.remove("ronaldo-airborne");
    resolveRonaldoHeaderImpact(fighter, opponent, state.skill, now, data.strikesDone || 0);
    clearCurrentRonaldoHeaderVisuals(state);
    data.strikesDone = (data.strikesDone || 0) + 1;

    if (data.strikesDone >= (data.comboTotal || 1)) {
      restoreStoredVelocity(fighter, state);
      fighter.skillState = null;
      startSkillRecovery(fighter, state.skill, now);
      return;
    }

    queueNextRonaldoHeaderStrike(fighter, opponent, state, now);
  }

  function queueNextRonaldoHeaderStrike(fighter, opponent, state, now) {
    const data = state.data;
    const skill = state.skill;
    const gap = Number(data.comboGap) || 350;
    const travelTime = (gap + (Number(skill.airTime) || 450)) / 1000;
    const predicted = getSafeRonaldoLandingPoint(
      fighter,
      opponent.x + (opponent.vx || 0) * travelTime,
      opponent.y + (opponent.vy || 0) * travelTime
    );
    data.landingX = predicted.x;
    data.landingY = predicted.y;
    data.nextStrikeAt = now + gap;
    data.waitingNext = true;
    const radius = getRonaldoHeaderRadius(skill);
    data.warning = createCircleEffect(data.landingX, data.landingY, radius, "ronaldo-header-warning");
    data.coreWarning = createCircleEffect(data.landingX, data.landingY, getRonaldoHeaderCoreRadius(fighter, skill, radius), "ronaldo-header-core-warning");
    data.shadow = createCircleEffect(data.landingX, data.landingY, fighter.radius * 0.72, "ronaldo-header-shadow");
    getFighterElement(fighter).classList.add("ronaldo-jump-ready");
    fighter.vx = 0;
    fighter.vy = 0;
  }

  function clearCurrentRonaldoHeaderVisuals(state) {
    if (!state || !state.data) return;
    removeElement(state.data.warning);
    removeElement(state.data.coreWarning);
    removeElement(state.data.shadow);
    if (state.data.effects) state.data.effects.forEach((effect) => removeElement(effect));
    state.data.warning = null;
    state.data.coreWarning = null;
    state.data.shadow = null;
    state.data.effects = [];
  }

  function resolveRonaldoHeaderImpact(fighter, opponent, skill, now, strikeIndex = 0) {
    const radius = getRonaldoHeaderRadius(skill);
    const coreRadius = getRonaldoHeaderCoreRadius(fighter, skill, radius);
    const impact = createCircleEffect(fighter.x, fighter.y, radius, "ronaldo-header-impact");
    const core = createCircleEffect(fighter.x, fighter.y, coreRadius, "ronaldo-header-core-impact");
    scheduleTimeout(() => removeElement(impact), 520);
    scheduleTimeout(() => removeElement(core), 420);
    pulseArena();

    getRonaldoTargets(fighter, opponent).forEach((target) => {
      const distance = Math.hypot(target.x - fighter.x, target.y - fighter.y);
      if (distance > radius + target.radius * 0.35) return;
      const isCore = distance <= coreRadius + target.radius * 0.25;
      const actual = applyDamage(fighter, target, {
        label: skill.name,
        baseDamage: isCore ? Number(skill.coreDamage) || 19.55 : Number(skill.outerDamage) || 11.9,
        ignoreDefense: true,
        attackId: `ronaldo-header-${fighter.id}-${now.toFixed(2)}-${strikeIndex}-${target.id}`,
        hitId: isCore ? "core" : "outer"
      });
      if (actual > 0) {
        knockbackEntity(fighter, target, fighter.radius * (isCore ? 1.05 : 0.55));
        if (isCore) {
          applySlowEffect(target, Number(skill.slowRate) || 0.25, Number(skill.slowDuration) || 1500, now);
        }
      }
    });
  }

  function startRonaldoUltimate(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    fighter.ronaldoUltimate = {
      active: true,
      skill,
      endAt: now + (Number(skill.duration) || 6000),
      originalSpeedMultiplier: fighter.speedMultiplier || 1,
      collisionDamageMultiplier: Number(skill.collisionDamageMultiplier) || 1.25,
      cooldownSpeed: Number(skill.cooldownSpeed) || 1.4,
      freeKickScale: Number(skill.freeKickScale) || 1.2,
      freeKickDamageMultiplier: Number(skill.freeKickDamageMultiplier) || 1.2,
      headerCoreScale: Number(skill.headerCoreScale) || 1.2,
      effects: []
    };
    fighter.speedMultiplier = (fighter.speedMultiplier || 1) * (Number(skill.speedMultiplier) || 1.3);
    accelerateRonaldoSkillCooldowns(fighter, now, Number(skill.cooldownSpeed) || 1.4);
    resetRonaldoFreeKickCooldown(fighter, now);
    const effects = fighter.ronaldoUltimate.effects;
    effects.push(createRonaldoUltimateDim());
    effects.push(createRonaldoUltimateTitle(fighter));
    effects.push(createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.55, "ronaldo-ultimate-aura"));
    createRonaldoUltimateShockwave(fighter, opponent, skill, now);
    getFighterElement(fighter).classList.remove("casting");
    getFighterElement(fighter).classList.add("ronaldo-ultimate");
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
    normalizeVelocity(fighter, getPixelSpeed(fighter));
    addLog(`${fighter.name} SIUUU!`, "skill");
  }

  function updateRonaldoUltimateState(fighter, now) {
    if (!fighter || !fighter.ronaldoUltimate || !fighter.ronaldoUltimate.active) return;
    updateRonaldoVisuals(fighter);
    if (fighter.dead || game.phase !== "running") {
      endRonaldoUltimate(fighter, true, now);
      return;
    }
    if (now >= fighter.ronaldoUltimate.endAt) {
      endRonaldoUltimate(fighter, false, now);
    }
  }

  function endRonaldoUltimate(fighter, interrupted = false, now = getBattleNow()) {
    if (!fighter || !fighter.ronaldoUltimate) return;
    const state = fighter.ronaldoUltimate;
    const skill = state.skill;
    fighter.speedMultiplier = state.originalSpeedMultiplier || 1;
    normalizeVelocity(fighter, getPixelSpeed(fighter));
    getFighterElement(fighter).classList.remove("ronaldo-ultimate");
    if (state.effects) {
      state.effects.forEach((effect) => {
        if (!effect) return;
        if (interrupted) {
          removeElement(effect);
        } else {
          effect.classList.add("fading");
          scheduleTimeout(() => removeElement(effect), 520);
        }
      });
    }
    fighter.ronaldoUltimate = null;
    if (interrupted || game.phase !== "running" || fighter.dead) {
      releaseUltimateLock(fighter, skill);
      return;
    }
    startSkillRecovery(fighter, skill, now);
  }

  function resetRonaldoFreeKickCooldown(fighter, now) {
    const index = fighter.skills.findIndex((skill) => skill.type === "ronaldoFreeKick");
    if (index >= 0) fighter.nextSkillAt[index] = now;
  }

  function accelerateRonaldoSkillCooldowns(fighter, now, speedRate) {
    ["ronaldoFreeKick", "ronaldoHeader"].forEach((type) => {
      const index = fighter.skills.findIndex((skill) => skill.type === type);
      if (index < 0) return;
      const readyAt = fighter.nextSkillAt[index] || 0;
      const remaining = readyAt - now;
      if (remaining > 0) {
        fighter.nextSkillAt[index] = now + remaining / Math.max(1, speedRate);
      }
    });
  }

  function createRonaldoUltimateShockwave(fighter, opponent, skill, now) {
    const radius = game.arenaSize * (Number(skill.shockwaveRadiusRate) || 0.24);
    const shockwave = createCircleEffect(fighter.x, fighter.y, radius, "ronaldo-ultimate-shockwave");
    scheduleTimeout(() => removeElement(shockwave), 520);
    createRonaldoFlashParticles(fighter);
    pulseArena();
    getRonaldoTargets(fighter, opponent).forEach((target) => {
      if (!isPointInCircle(target.x, target.y, fighter.x, fighter.y, radius + target.radius * 0.35)) return;
      const actual = applyDamage(fighter, target, {
        label: skill.name,
        baseDamage: Number(skill.shockwaveDamage) || 8.5,
        ignoreDefense: true,
        attackId: `ronaldo-ult-${fighter.id}-${now.toFixed(2)}-${target.id}`,
        hitId: "shock"
      });
      if (actual > 0) {
        knockbackEntity(fighter, target, fighter.radius * 0.72);
        applySlowEffect(target, Number(skill.shockwaveSlowRate) || 0.2, Number(skill.shockwaveSlowDuration) || 1000, now);
      }
    });
  }

  function createRonaldoUltimateDim() {
    const element = document.createElement("div");
    element.className = "ronaldo-ultimate-dim";
    els.skillLayer.appendChild(element);
    scheduleTimeout(() => element.classList.add("brief"), 420);
    return element;
  }

  function createRonaldoUltimateTitle(fighter) {
    const element = document.createElement("div");
    element.className = "ronaldo-ultimate-title";
    element.textContent = "SIIIIUUUUU!";
    els.arena.appendChild(element);
    element.style.left = `${game.arenaSize / 2}px`;
    element.style.top = `${Math.max(42, game.arenaSize * 0.22)}px`;
    scheduleTimeout(() => removeElement(element), 2300);
    return element;
  }

  function createRonaldoFlashParticles(fighter) {
    for (let i = 0; i < 14; i += 1) {
      const particle = createCircleEffect(
        Math.random() * game.arenaSize,
        Math.random() * game.arenaSize,
        5 + Math.random() * 7,
        "ronaldo-flash-particle"
      );
      scheduleTimeout(() => removeElement(particle), 420);
    }
  }

  function updateRonaldoVisuals(fighter) {
    if (!fighter || !fighter.ronaldoUltimate || !fighter.ronaldoUltimate.active) return;
    const effects = fighter.ronaldoUltimate.effects || [];
    effects.forEach((effect) => {
      if (!effect) return;
      if (effect.classList.contains("ronaldo-ultimate-aura")) {
        updateCircleEffect(effect, fighter.x, fighter.y, fighter.radius * 1.55);
      }
    });
    if (!fighter.ronaldoUltimate.lastTrailAt || getBattleNow() - fighter.ronaldoUltimate.lastTrailAt > 260) {
      fighter.ronaldoUltimate.lastTrailAt = getBattleNow();
      const trail = createCircleEffect(fighter.x, fighter.y, fighter.radius * 0.88, "ronaldo-seven-trail");
      scheduleTimeout(() => removeElement(trail), 420);
    }
  }

  function clearRonaldoSkillState(fighter, state) {
    if (!state || !state.data) return;
    removeElement(state.data.warning);
    removeElement(state.data.coreWarning);
    removeElement(state.data.chargeBall);
    removeElement(state.data.shadow);
    if (state.data.projectile) removeElement(state.data.projectile.element);
    if (state.data.effects) state.data.effects.forEach((effect) => removeElement(effect));
    state.data.warning = null;
    state.data.coreWarning = null;
    state.data.chargeBall = null;
    state.data.shadow = null;
    state.data.projectile = null;
    state.data.effects = [];
    fighter.ronaldoAirborne = false;
    getFighterElement(fighter).classList.remove("ronaldo-kicking", "ronaldo-jump-ready", "ronaldo-airborne");
  }

  function resetRonaldoState(fighter) {
    if (!fighter) return;
    endRonaldoUltimate(fighter, true, getBattleNow());
    clearRonaldoBalls(fighter, false);
    fighter.ronaldoAirborne = false;
    const element = fighter.side ? getFighterElement(fighter) : null;
    if (element) {
      element.classList.remove("ronaldo-kicking", "ronaldo-jump-ready", "ronaldo-airborne", "ronaldo-ultimate");
    }
  }

  function shouldStartRicoSkillNow(fighter, opponent, skill, now) {
    if (!fighter || !opponent || opponent.dead || isFighterOutOfBattle(opponent)) return false;
    if (skill.type === "superBounceStorm") return true;

    const gadgetIndex = fighter.skills.findIndex((item) => item.type === "ricoMultiBall");
    const trickIndex = fighter.skills.findIndex((item) => item.type === "ricoTrickShot");
    const gadgetReady = gadgetIndex >= 0 && now >= (fighter.nextSkillAt[gadgetIndex] || 0);
    const trickReady = trickIndex >= 0 && now >= (fighter.nextSkillAt[trickIndex] || 0);
    const shouldGadget = shouldUseRicoMultiBall(fighter, opponent);
    const shouldTrick = isRicoTargetNearWall(opponent) || hasUsefulRicoTrickPath(fighter, opponent);

    if (skill.type === "ricoMultiBall") return shouldGadget;
    if (skill.type === "ricoTrickShot") return !shouldGadget && shouldTrick;
    if (skill.type === "ricoBouncyShot") return !(gadgetReady && shouldGadget) && !(trickReady && shouldTrick);
    return true;
  }

  function shouldUseRicoMultiBall(fighter, opponent) {
    const distance = Math.hypot(opponent.x - fighter.x, opponent.y - fighter.y);
    const close = distance <= game.arenaSize * 0.25;
    const nearbySummons = countEnemySummonsNear(fighter.side, fighter.x, fighter.y, game.arenaSize * 0.3) >= 3;
    return close || nearbySummons;
  }

  function isRicoTargetNearWall(target) {
    if (!target) return false;
    const margin = game.arenaSize * 0.16 + target.radius;
    if (target.x < margin || target.y < margin || target.x > game.arenaSize - margin || target.y > game.arenaSize - margin) return true;
    return game.arenaObjects.some((object) => (
      !object.fadeStarted &&
      (
        (object.type === "circleWall" && Math.abs(Math.hypot(target.x - object.x, target.y - object.y) - object.radius) <= margin) ||
        (object.type === "compressionWall" && getBattleNow() >= (object.activeAt || 0) && isPointNearCompressionWall(target.x, target.y, margin, object))
      )
    ));
  }

  function isPointNearCompressionWall(x, y, margin, wall) {
    if (!wall || wall.type !== "compressionWall") return false;
    const halfW = wall.width / 2;
    const halfH = wall.height / 2;
    return x >= wall.x - halfW - margin &&
      x <= wall.x + halfW + margin &&
      y >= wall.y - halfH - margin &&
      y <= wall.y + halfH + margin;
  }

  function hasUsefulRicoTrickPath(fighter, opponent) {
    const aim = getRicoTrickAimData(fighter, opponent);
    return !!(aim && aim.hasReflectPath);
  }

  function getRicoTrickAimData(fighter, opponent) {
    const direct = getRicoAimData(fighter, opponent);
    const candidates = getRicoArenaWallTrickCandidates(fighter, opponent).concat(getRicoCircleWallTrickCandidates(fighter, opponent));
    candidates.sort((a, b) => a.score - b.score);
    const best = candidates[0];
    if (!best) return { ...direct, reflectX: direct.startX + direct.dirX * fighter.radius * 2, reflectY: direct.startY + direct.dirY * fighter.radius * 2, hasReflectPath: false };
    return {
      dirX: best.dirX,
      dirY: best.dirY,
      angle: Math.atan2(best.dirY, best.dirX),
      reflectX: best.x,
      reflectY: best.y,
      startX: direct.startX,
      startY: direct.startY,
      hasReflectPath: true
    };
  }

  function getRicoAimData(fighter, target) {
    const targetX = target ? target.x : fighter.x + 1;
    const targetY = target ? target.y : fighter.y;
    const muzzle = getRicoMuzzle(fighter, Math.atan2(targetY - fighter.y, targetX - fighter.x));
    const dx = targetX - muzzle.x;
    const dy = targetY - muzzle.y;
    const distance = Math.hypot(dx, dy) || 1;
    return {
      startX: muzzle.x,
      startY: muzzle.y,
      dirX: dx / distance,
      dirY: dy / distance,
      angle: Math.atan2(dy, dx)
    };
  }

  function getRicoArenaWallTrickCandidates(fighter, target) {
    const size = game.arenaSize;
    const walls = [
      { axis: "y", value: 0, normalX: 0, normalY: 1, mirrorX: target.x, mirrorY: -target.y },
      { axis: "y", value: size, normalX: 0, normalY: -1, mirrorX: target.x, mirrorY: size * 2 - target.y },
      { axis: "x", value: 0, normalX: 1, normalY: 0, mirrorX: -target.x, mirrorY: target.y },
      { axis: "x", value: size, normalX: -1, normalY: 0, mirrorX: size * 2 - target.x, mirrorY: target.y }
    ];
    const candidates = [];
    walls.forEach((wall) => {
      const baseAngle = Math.atan2(wall.mirrorY - fighter.y, wall.mirrorX - fighter.x);
      const muzzle = getRicoMuzzle(fighter, baseAngle);
      const dx = wall.mirrorX - muzzle.x;
      const dy = wall.mirrorY - muzzle.y;
      const denom = wall.axis === "x" ? dx : dy;
      if (Math.abs(denom) < 0.001) return;
      const t = (wall.value - (wall.axis === "x" ? muzzle.x : muzzle.y)) / denom;
      if (t <= 0) return;
      const x = muzzle.x + dx * t;
      const y = muzzle.y + dy * t;
      if (x < 4 || x > size - 4 || y < 4 || y > size - 4) return;
      const length = Math.hypot(x - muzzle.x, y - muzzle.y) + Math.hypot(target.x - x, target.y - y);
      candidates.push({
        x,
        y,
        dirX: Math.cos(baseAngle),
        dirY: Math.sin(baseAngle),
        score: length
      });
    });
    return candidates;
  }

  function getRicoCircleWallTrickCandidates(fighter, target) {
    const candidates = [];
    game.arenaObjects.forEach((wall) => {
      if (wall.type !== "circleWall" || wall.fadeStarted) return;
      for (let i = 0; i < 20; i += 1) {
        const theta = (Math.PI * 2 * i) / 20;
        const x = wall.x + Math.cos(theta) * wall.radius;
        const y = wall.y + Math.sin(theta) * wall.radius;
        if (x < 0 || x > game.arenaSize || y < 0 || y > game.arenaSize) continue;
        const angle = Math.atan2(y - fighter.y, x - fighter.x);
        const muzzle = getRicoMuzzle(fighter, angle);
        const inLen = Math.hypot(x - muzzle.x, y - muzzle.y) || 1;
        const ix = (x - muzzle.x) / inLen;
        const iy = (y - muzzle.y) / inLen;
        const nx = (x - wall.x) / (wall.radius || 1);
        const ny = (y - wall.y) / (wall.radius || 1);
        const dot = ix * nx + iy * ny;
        const rx = ix - 2 * dot * nx;
        const ry = iy - 2 * dot * ny;
        const outLen = Math.hypot(target.x - x, target.y - y) || 1;
        const tx = (target.x - x) / outLen;
        const ty = (target.y - y) / outLen;
        const alignment = rx * tx + ry * ty;
        if (alignment < 0.94) continue;
        candidates.push({ x, y, dirX: ix, dirY: iy, score: inLen + outLen + (1 - alignment) * game.arenaSize });
      }
    });
    return candidates;
  }

  function startRicoBurst(fighter, opponent, skill, now, mode) {
    const state = fighter.skillState;
    if (!state) return;
    state.data.mode = mode;
    state.data.shotsFired = 0;
    state.data.nextShotAt = now;
    state.data.bulletCount = Number(skill.bulletCount) || (mode === "trick" ? 6 : 5);
    state.data.shotInterval = Number(skill.shotInterval) || 120;
    state.data.aim = mode === "trick" ? getRicoTrickAimData(fighter, opponent) : getRicoAimData(fighter, opponent);
    removeElement(state.data.warning);
    removeElement(state.data.reflectMark);
    state.data.warning = null;
    state.data.reflectMark = null;
    restoreStoredVelocity(fighter, state);
    addLog(`${fighter.name} ${skill.name}`, "skill");
  }

  function updateRicoBurst(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;
    const data = state.data;
    if (fighter.dead || !opponent || opponent.dead || game.phase !== "running") {
      clearRicoSkillState(fighter, state);
      fighter.skillState = null;
      return;
    }
    while ((data.shotsFired || 0) < data.bulletCount && now >= (data.nextShotAt || now)) {
      const baseAim = data.mode === "trick" ? data.aim : getRicoAimData(fighter, opponent);
      const spread = degreesToRadians(Number(state.skill.spreadDegrees) || 4) * (Math.random() * 2 - 1);
      spawnRicoBullet(fighter, state.skill, baseAim.angle + spread, now, data.mode);
      data.shotsFired += 1;
      data.nextShotAt = now + data.shotInterval;
    }
    if ((data.shotsFired || 0) >= data.bulletCount) {
      const skill = state.skill;
      fighter.skillState = null;
      startSkillRecovery(fighter, skill, now);
    }
  }

  function startRicoMultiBall(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    const count = Number(skill.bulletCount) || 12;
    const offset = Math.random() * Math.PI * 2;
    const spread = degreesToRadians(Number(skill.spreadDegrees) || 5);
    for (let i = 0; i < count; i += 1) {
      const angle = offset + (Math.PI * 2 * i) / count + (Math.random() * 2 - 1) * spread;
      spawnRicoBullet(fighter, skill, angle, now, "multi");
    }
    const burst = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.35, "rico-multiball-burst");
    scheduleTimeout(() => removeElement(burst), 360);
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
    startSkillRecovery(fighter, skill, now);
    addLog(`${fighter.name} 멀티볼 발사기`, "skill");
  }

  function startRicoUltimate(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    state.data.waveIndex = 0;
    state.data.nextWaveAt = now;
    state.data.endAt = now + (Number(skill.duration) || 4000);
    state.data.effects = [
      createRicoUltimateDim(),
      createRicoUltimateTitle(),
      createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.6, "rico-ultimate-aura")
    ];
    fighter.ricoUltimate = { active: true, skill, endAt: state.data.endAt, effects: state.data.effects };
    fighter.ricoUltimateHitTimes = new Map();
    restoreStoredVelocity(fighter, state);
    pulseArena();
    addLog(`${fighter.name} 슈퍼 바운스 폭풍`, "skill");
  }

  function updateRicoUltimateSkill(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state) return;
    const data = state.data;
    updateRicoUltimateVisuals(fighter);
    while ((data.waveIndex || 0) < (Number(state.skill.waveCount) || 4) && now >= (data.nextWaveAt || now)) {
      fireRicoUltimateWave(fighter, state.skill, now, data.waveIndex || 0);
      data.waveIndex += 1;
      data.nextWaveAt = now + (Number(state.skill.waveInterval) || 650);
    }
    if (now >= (data.endAt || now)) {
      const skill = state.skill;
      clearRicoSkillState(fighter, state, false);
      fighter.skillState = null;
      startSkillRecovery(fighter, skill, now);
    }
  }

  function fireRicoUltimateWave(fighter, skill, now, waveIndex) {
    const count = Number(skill.bulletsPerWave) || 8;
    const rotation = waveIndex * (Math.PI / Math.max(8, count * 2));
    for (let i = 0; i < count; i += 1) {
      const angle = rotation + (Math.PI * 2 * i) / count;
      spawnRicoBullet(fighter, skill, angle, now, "ultimate");
    }
    const wave = createCircleEffect(fighter.x, fighter.y, fighter.radius * (1.2 + waveIndex * 0.12), "rico-ultimate-wave");
    scheduleTimeout(() => removeElement(wave), 420);
  }

  function updateRicoUltimateState(fighter, now) {
    if (!fighter || !fighter.ricoUltimate || !fighter.ricoUltimate.active) return;
    updateRicoUltimateVisuals(fighter);
    if (fighter.dead || game.phase !== "running" || now >= fighter.ricoUltimate.endAt) {
      endRicoUltimate(fighter, false, now);
    }
  }

  function updateRicoUltimateVisuals(fighter) {
    const effects = fighter && fighter.ricoUltimate && fighter.ricoUltimate.effects || [];
    effects.forEach((effect) => {
      if (effect && effect.classList.contains("rico-ultimate-aura")) {
        updateCircleEffect(effect, fighter.x, fighter.y, fighter.radius * 1.6);
      }
    });
  }

  function endRicoUltimate(fighter, interrupted = false, now = getBattleNow()) {
    if (!fighter || !fighter.ricoUltimate) return;
    const skill = fighter.ricoUltimate.skill;
    const effects = fighter.ricoUltimate.effects || [];
    effects.forEach((effect) => {
      if (interrupted || game.phase !== "running" || fighter.dead) removeElement(effect);
      else {
        effect.classList.add("fading");
        scheduleTimeout(() => removeElement(effect), 420);
      }
    });
    fighter.ricoUltimate = null;
    fighter.ricoUltimateHitTimes = new Map();
    if (interrupted || game.phase !== "running" || fighter.dead) {
      releaseUltimateLock(fighter, skill);
    }
  }

  function spawnRicoBullet(fighter, skill, angle, now, mode) {
    const muzzle = getRicoMuzzle(fighter, angle);
    const bullet = {
      id: `rico-bullet-${fighter.id}-${now.toFixed(3)}-${Math.random().toString(16).slice(2)}`,
      ownerId: fighter.id,
      side: fighter.side,
      mode,
      x: muzzle.x,
      y: muzzle.y,
      dirX: Math.cos(angle),
      dirY: Math.sin(angle),
      angle,
      radius: clamp(fighter.radius * 0.17, 5, 8),
      speed: game.arenaSize * (Number(skill.speedRate) || 1.25),
      bornAt: now,
      lastUpdateAt: now,
      expiresAt: now + (Number(skill.lifetime) || 3000),
      baseDamage: Number(skill.damage) || 4,
      damageBonusRate: 0,
      damageGrowth: Number(skill.damageGrowth) || 0,
      maxDamageGrowth: Number(skill.maxDamageGrowth) || 0,
      speedGrowth: Number(skill.speedGrowth) || 0,
      maxBounces: Number(skill.maxBounces) || 3,
      bounceCount: 0,
      rehitCooldown: Number(skill.rehitCooldown) || RICO_BULLET_REHIT_MS,
      attackId: `rico-${mode}-${fighter.id}-${now.toFixed(3)}-${Math.random().toString(16).slice(2)}`,
      targetRecords: new Map(),
      cageInsideIds: getRicoBulletCageInsideIds(muzzle.x, muzzle.y),
      firstBounceSpeedGrowth: Number(skill.firstBounceSpeedGrowth) || 0,
      firstHitDamageBonus: Number(skill.firstHitDamageBonus) || 0,
      firstHitBonusAvailable: false,
      totalHits: 0,
      targetGlobalCooldown: Number(skill.targetGlobalCooldown) || 0,
      trails: []
    };
    bullet.element = createRicoBulletElement(bullet);
    fighter.ricoBullets = fighter.ricoBullets || [];
    fighter.ricoBullets.push(bullet);
    createRicoMuzzleFlash(muzzle, mode);
    return bullet;
  }

  function getRicoMuzzle(fighter, angle) {
    return {
      x: fighter.x + Math.cos(angle) * fighter.radius * 1.1,
      y: fighter.y + Math.sin(angle) * fighter.radius * 1.1,
      angle
    };
  }

  function getRicoBulletCageInsideIds(x, y) {
    const ids = new Set();
    game.arenaObjects.forEach((object) => {
      if (object.type === "maugaCage" && Math.hypot(x - object.x, y - object.y) <= object.radius) {
        ids.add(object.id);
      }
    });
    return ids;
  }

  function updateRicoProjectiles(fighter, now) {
    if (!fighter || !fighter.ricoBullets || !fighter.ricoBullets.length) return;
    if (fighter.dead || game.phase !== "running") {
      clearRicoBullets(fighter);
      return;
    }
    const remaining = [];
    fighter.ricoBullets.forEach((bullet) => {
      if (!bullet || bullet.removing) return;
      const dt = Math.min((now - (bullet.lastUpdateAt || now)) / 1000, MAX_FRAME_STEP);
      bullet.lastUpdateAt = now;
      const stepDistance = Math.max(4, bullet.radius * 0.75);
      const steps = clamp(Math.ceil((bullet.speed * dt) / stepDistance), 1, 36);
      const stepDt = dt / steps;
      for (let i = 0; i < steps; i += 1) {
        bullet.x += bullet.dirX * bullet.speed * stepDt;
        bullet.y += bullet.dirY * bullet.speed * stepDt;
        resolveRicoBulletArenaBounce(fighter, bullet, now);
        resolveRicoBulletObjectBounces(fighter, bullet, now);
        damageRicoBulletTargets(getFighterById(bullet.ownerId) || fighter, bullet, now);
        if (bullet.removing) break;
      }
      updateRicoBulletElement(bullet);
      maybeCreateRicoBulletTrail(bullet, now);
      if (!bullet.removing && now >= bullet.expiresAt) removeRicoBullet(bullet);
      if (!bullet.removing) remaining.push(bullet);
    });
    fighter.ricoBullets = remaining;
  }

  function resolveRicoBulletArenaBounce(fighter, bullet, now) {
    let nx = 0;
    let ny = 0;
    if (bullet.x - bullet.radius < 0) {
      bullet.x = bullet.radius;
      nx += 1;
    } else if (bullet.x + bullet.radius > game.arenaSize) {
      bullet.x = game.arenaSize - bullet.radius;
      nx -= 1;
    }
    if (bullet.y - bullet.radius < 0) {
      bullet.y = bullet.radius;
      ny += 1;
    } else if (bullet.y + bullet.radius > game.arenaSize) {
      bullet.y = game.arenaSize - bullet.radius;
      ny -= 1;
    }
    if (!nx && !ny) return;
    const length = Math.hypot(nx, ny) || 1;
    reflectRicoBullet(fighter, bullet, nx / length, ny / length, now, "wall");
  }

  function resolveRicoBulletObjectBounces(fighter, bullet, now) {
    game.arenaObjects.forEach((object) => {
      if (bullet.removing || object.fadeStarted) return;
      if (object.type === "compressionWall") {
        if (now < (object.activeAt || 0)) return;
        const collision = getCircleRectCollision(bullet.x, bullet.y, bullet.radius, object);
        if (!collision) return;
        bullet.x += collision.normalX * (collision.overlap + 0.5);
        bullet.y += collision.normalY * (collision.overlap + 0.5);
        keepRicoBulletInsideArena(bullet);
        reflectRicoBullet(fighter, bullet, collision.normalX, collision.normalY, now, object.id);
        return;
      }
      if (object.type !== "circleWall" && object.type !== "maugaCage") return;
      let dx = bullet.x - object.x;
      let dy = bullet.y - object.y;
      let distance = Math.hypot(dx, dy);
      if (distance === 0) {
        dx = bullet.dirX || 1;
        dy = bullet.dirY || 0;
        distance = Math.hypot(dx, dy) || 1;
      }
      const nx = dx / distance;
      const ny = dy / distance;
      const inside = object.type === "maugaCage" && bullet.cageInsideIds && bullet.cageInsideIds.has(object.id);
      const signedDistance = distance - object.radius;
      if (object.type === "circleWall") {
        if (Math.abs(signedDistance) >= bullet.radius) return;
        const side = signedDistance >= 0 ? 1 : -1;
        bullet.x = object.x + nx * (object.radius + side * bullet.radius);
        bullet.y = object.y + ny * (object.radius + side * bullet.radius);
        reflectRicoBullet(fighter, bullet, nx * side, ny * side, now, object.id);
        return;
      }
      const side = inside ? -1 : 1;
      if (Math.abs(signedDistance) >= bullet.radius) return;
      bullet.x = object.x + nx * (object.radius + side * bullet.radius);
      bullet.y = object.y + ny * (object.radius + side * bullet.radius);
      keepRicoBulletInsideArena(bullet);
      reflectRicoBullet(fighter, bullet, nx * side, ny * side, now, object.id);
    });
  }

  function reflectRicoBullet(fighter, bullet, normalX, normalY, now, sourceId) {
    const dot = bullet.dirX * normalX + bullet.dirY * normalY;
    if (dot >= 0) return;
    const contactKey = `${sourceId}:${bullet.bounceCount}`;
    if (bullet.lastBounceKey === contactKey && now - (bullet.lastBounceAt || 0) < 40) return;
    bullet.dirX -= 2 * dot * normalX;
    bullet.dirY -= 2 * dot * normalY;
    const length = Math.hypot(bullet.dirX, bullet.dirY) || 1;
    bullet.dirX /= length;
    bullet.dirY /= length;
    bullet.angle = Math.atan2(bullet.dirY, bullet.dirX);
    bullet.bounceCount += 1;
    bullet.lastBounceAt = now;
    bullet.lastBounceKey = contactKey;
    const isFirstBounce = bullet.bounceCount === 1 && bullet.firstBounceSpeedGrowth > 0;
    bullet.speed *= 1 + (isFirstBounce ? bullet.firstBounceSpeedGrowth : bullet.speedGrowth);
    if (bullet.damageGrowth > 0) {
      bullet.damageBonusRate = Math.min(bullet.maxDamageGrowth || 0, (bullet.damageBonusRate || 0) + bullet.damageGrowth);
    }
    if (isFirstBounce && bullet.firstHitDamageBonus > 0) bullet.firstHitBonusAvailable = true;
    createRicoBulletBounceEffect(bullet);
    if (bullet.bounceCount >= bullet.maxBounces) removeRicoBullet(bullet);
  }

  function keepRicoBulletInsideArena(bullet) {
    bullet.x = clamp(bullet.x, bullet.radius, game.arenaSize - bullet.radius);
    bullet.y = clamp(bullet.y, bullet.radius, game.arenaSize - bullet.radius);
  }

  function damageRicoBulletTargets(fighter, bullet, now) {
    getRicoTargets(fighter).forEach((target) => {
      if (!target || target.dead || target.removing || isFighterOutOfBattle(target)) return;
      const key = getRicoTargetKey(target);
      const record = getRicoBulletTargetRecord(bullet, key);
      const isColliding = Math.hypot(target.x - bullet.x, target.y - bullet.y) <= target.radius + bullet.radius;
      if (!isColliding) {
        if (record.isCurrentlyColliding) {
          record.isCurrentlyColliding = false;
          record.hasSeparatedSinceLastHit = true;
        }
        return;
      }
      if (tryReflectProjectileAgainstTarget(target, { kind: "rico", item: bullet }, fighter, now)) {
        record.isCurrentlyColliding = false;
        record.hasSeparatedSinceLastHit = true;
        return;
      }
      record.isCurrentlyColliding = true;
      const firstHit = record.hitCount === 0;
      const rehitReady = now - record.lastHitAt >= bullet.rehitCooldown;
      const bouncedSinceLastHit = bullet.bounceCount > record.lastHitBounceCount;
      if (!rehitReady || !(firstHit || record.hasSeparatedSinceLastHit || bouncedSinceLastHit)) return;
      if (bullet.targetGlobalCooldown) {
        const lastGlobalHit = fighter.ricoUltimateHitTimes && fighter.ricoUltimateHitTimes.get(key) || -Infinity;
        if (now - lastGlobalHit < bullet.targetGlobalCooldown) return;
        fighter.ricoUltimateHitTimes.set(key, now);
      }
      record.hitCount += 1;
      record.lastHitAt = now;
      record.lastHitBounceCount = bullet.bounceCount;
      record.hasSeparatedSinceLastHit = false;
      const bonus = bullet.firstHitBonusAvailable && bullet.totalHits === 0 ? bullet.firstHitDamageBonus : 0;
      const damage = bullet.baseDamage * (1 + (bullet.damageBonusRate || 0) + bonus);
      const actual = applyDamage(fighter, target, {
        label: getRicoBulletLabel(bullet),
        baseDamage: damage,
        ignoreDefense: true,
        attackId: `${bullet.attackId}:${key}:${record.hitCount}`,
        hitId: "bullet"
      });
      bullet.totalHits += 1;
      if (bullet.firstHitBonusAvailable) bullet.firstHitBonusAvailable = false;
      if (actual > 0 && target.isOiiaClone && target.currentHp <= 0) {
        startOiiaSummonRemoval(target, "zero", now);
      }
      createRicoBulletHitEffect(target, bullet);
    });
  }

  function getRicoBulletLabel(bullet) {
    if (bullet.mode === "trick") return "트릭 샷";
    if (bullet.mode === "multi") return "멀티볼";
    if (bullet.mode === "ultimate") return "슈퍼 바운스";
    return "통통탄";
  }

  function getRicoTargets(fighter) {
    const opponent = getOpposingFighter(fighter.side);
    const targets = [];
    if (opponent && !opponent.dead && !isFighterOutOfBattle(opponent)) targets.push(opponent);
    getEnemySummons(fighter.side).forEach((summon) => {
      if (summon && !summon.dead && !summon.removing) targets.push(summon);
    });
    return targets;
  }

  function getRicoTargetKey(target) {
    return target.id || `${target.side || "target"}-${target.name || "unit"}`;
  }

  function getRicoBulletTargetRecord(bullet, key) {
    if (!bullet.targetRecords) bullet.targetRecords = new Map();
    if (!bullet.targetRecords.has(key)) {
      bullet.targetRecords.set(key, {
        hitCount: 0,
        lastHitAt: -Infinity,
        lastHitBounceCount: -1,
        isCurrentlyColliding: false,
        hasSeparatedSinceLastHit: true
      });
    }
    return bullet.targetRecords.get(key);
  }

  function createRicoBulletElement(bullet) {
    const element = document.createElement("div");
    element.className = `rico-bullet ${bullet.mode || "basic"}`;
    els.skillLayer.appendChild(element);
    updateRicoBulletElement({ ...bullet, element });
    return element;
  }

  function updateRicoBulletElement(bullet) {
    if (!bullet || !bullet.element) return;
    bullet.element.style.width = `${bullet.radius * 2.7}px`;
    bullet.element.style.height = `${bullet.radius * 1.55}px`;
    bullet.element.style.left = `${bullet.x}px`;
    bullet.element.style.top = `${bullet.y}px`;
    bullet.element.style.transform = `translate(-50%, -50%) rotate(${bullet.angle}rad)`;
  }

  function maybeCreateRicoBulletTrail(bullet, now) {
    if (!bullet || bullet.removing || !bullet.element) return;
    if (now - (bullet.lastTrailAt || 0) < 90) return;
    bullet.lastTrailAt = now;
    if (!bullet.trails) bullet.trails = [];
    while (bullet.trails.length >= 3) removeElement(bullet.trails.shift());
    const trail = createGasterLine(bullet.x - bullet.dirX * bullet.radius * 1.4, bullet.y - bullet.dirY * bullet.radius * 1.4, bullet.angle, bullet.radius * 2.2, bullet.radius * 0.45, "rico-bullet-trail");
    bullet.trails.push(trail);
    scheduleTimeout(() => {
      removeElement(trail);
      if (bullet.trails) {
        const index = bullet.trails.indexOf(trail);
        if (index >= 0) bullet.trails.splice(index, 1);
      }
    }, 220);
  }

  function removeRicoBullet(bullet) {
    if (!bullet || bullet.removing) return;
    bullet.removing = true;
    if (bullet.trails) bullet.trails.forEach((trail) => removeElement(trail));
    removeElement(bullet.element);
  }

  function clearRicoBullets(fighter) {
    if (!fighter || !fighter.ricoBullets) return;
    fighter.ricoBullets.forEach((bullet) => removeRicoBullet(bullet));
    fighter.ricoBullets = [];
  }

  function createRicoMuzzleFlash(muzzle, mode) {
    const flash = createCircleEffect(muzzle.x, muzzle.y, mode === "ultimate" ? 10 : 7, `rico-muzzle-flash ${mode}`);
    scheduleTimeout(() => removeElement(flash), 180);
  }

  function createRicoBulletBounceEffect(bullet) {
    const effect = createCircleEffect(bullet.x, bullet.y, bullet.radius * 1.8, "rico-bounce-star");
    scheduleTimeout(() => removeElement(effect), 220);
  }

  function createRicoBulletHitEffect(target, bullet) {
    const effect = createCircleEffect(target.x, target.y, Math.max(8, bullet.radius * 1.6), "rico-hit-spark");
    scheduleTimeout(() => removeElement(effect), 220);
  }

  function createRicoTrickWarning(fighter, data) {
    const aim = data && Number.isFinite(data.reflectX) ? data : getRicoTrickAimData(fighter, getOpposingFighter(fighter.side));
    const start = getRicoMuzzle(fighter, aim.angle || 0);
    const length = Math.hypot(aim.reflectX - start.x, aim.reflectY - start.y);
    return createGasterLine(start.x, start.y, aim.angle || 0, length, Math.max(3, fighter.radius * 0.08), "rico-trick-warning");
  }

  function updateRicoTrickWarning(element, fighter, data) {
    if (!element || !data) return;
    const start = getRicoMuzzle(fighter, data.angle || 0);
    const length = Math.hypot(data.reflectX - start.x, data.reflectY - start.y);
    updateGasterLine(element, start.x, start.y, data.angle || 0, length, Math.max(3, fighter.radius * 0.08));
  }

  function createRicoUltimateDim() {
    const element = document.createElement("div");
    element.className = "rico-ultimate-dim";
    els.skillLayer.appendChild(element);
    scheduleTimeout(() => element.classList.add("brief"), 520);
    return element;
  }

  function createRicoUltimateTitle() {
    const element = document.createElement("div");
    element.className = "rico-ultimate-title";
    element.textContent = "SUPER BOUNCE!";
    els.arena.appendChild(element);
    element.style.left = `${game.arenaSize / 2}px`;
    element.style.top = `${Math.max(38, game.arenaSize * 0.2)}px`;
    scheduleTimeout(() => removeElement(element), 1900);
    return element;
  }

  function clearRicoSkillState(fighter, state, interrupted = true) {
    if (!state || !state.data) return;
    removeElement(state.data.warning);
    removeElement(state.data.reflectMark);
    if (state.data.effects) state.data.effects.forEach((effect) => removeElement(effect));
    state.data.warning = null;
    state.data.reflectMark = null;
    state.data.effects = [];
    if (state.skill && state.skill.type === "superBounceStorm") {
      endRicoUltimate(fighter, interrupted, getBattleNow());
    }
  }

  function resetRicoState(fighter) {
    if (!fighter) return;
    clearRicoBullets(fighter);
    endRicoUltimate(fighter, true, getBattleNow());
    fighter.ricoUltimateHitTimes = new Map();
  }

  function resetOiiaState(fighter) {
    if (!fighter) return;
    clearOiiaGreatSpinLooseTitles();
    if (fighter.skillState && fighter.skillState.skill && fighter.skillState.skill.type === "oiiaGreatSpin") {
      clearOiiaGreatSpinCharge(fighter.skillState);
    }
    endOiiaGreatSpin(fighter, true, getBattleNow());
    fighter.oiiaGreatSpin = null;
    clearOiiaProjectiles(fighter);
    if (fighter.oiiaCloneHealContacts) fighter.oiiaCloneHealContacts.clear();
    if (fighter.divisionWallContacts) fighter.divisionWallContacts.clear();
  }

  function shouldStartMonkSkillNow(fighter, opponent, skill, now) {
    if (!fighter || !opponent || opponent.dead || isFighterOutOfBattle(opponent)) return false;
    const distance = Math.hypot(opponent.x - fighter.x, opponent.y - fighter.y);
    const incoming = countIncomingProjectilesForMonk(fighter);
    const projectileEnemy = ["ricoBouncer", "maugaBerserker", "ronaldoChampion", "darkinSustain", "damageDrain"].includes(opponent.abilityType);
    if (skill.type === "enlightenmentField") {
      return !fighter.monkMeditationUntil && !fighter.monkEnlightenment && (incoming >= 2 || projectileEnemy);
    }
    if (skill.type === "monkMeditation") {
      return !fighter.monkEnlightenment && (incoming >= 1 || projectileEnemy);
    }
    if (skill.type === "calmPalmStrike") {
      return distance <= game.arenaSize * 0.36;
    }
    return true;
  }

  function countIncomingProjectilesForMonk(fighter) {
    if (!fighter || fighter.dead) return 0;
    let count = 0;
    getAllReflectableProjectiles().forEach((projectile) => {
      const owner = getProjectileOwner(projectile);
      if (!owner || owner.side === fighter.side) return;
      const radius = getProjectileRadius(projectile);
      if (Math.hypot(getProjectileX(projectile) - fighter.x, getProjectileY(projectile) - fighter.y) > game.arenaSize * 0.32 + radius) return;
      const dirX = Number(projectile.dirX);
      const dirY = Number(projectile.dirY);
      const vx = Number(projectile.vx);
      const vy = Number(projectile.vy);
      const moveX = Number.isFinite(dirX) ? dirX : (Number.isFinite(vx) ? vx : 0);
      const moveY = Number.isFinite(dirY) ? dirY : (Number.isFinite(vy) ? vy : 0);
      const towardX = fighter.x - getProjectileX(projectile);
      const towardY = fighter.y - getProjectileY(projectile);
      if (moveX * towardX + moveY * towardY > 0) count += 1;
    });
    return count;
  }

  function startCalmPalmStrike(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    const direction = getOpponentDirection(fighter, opponent);
    const range = game.arenaSize * (Number(skill.rangeRate) || 0.3);
    const arc = degreesToRadians(Number(skill.coneDegrees) || 86);
    removeElement(state.data.charge);
    state.data.charge = null;
    updateMonkPalmWarning(state.data.warning, fighter, direction, skill);
    createMonkPalmWave(fighter, direction, range);
    const targets = [opponent].concat(getEnemySummons(fighter.side));
    targets.forEach((target) => {
      if (!isTargetInMonkCone(fighter, target, direction.angle, range, arc)) return;
      const actual = applyDamage(fighter, target, {
        label: skill.name,
        baseDamage: Number(skill.damage) || 17,
        attackId: `monk-palm-${fighter.id}-${now.toFixed(2)}-${target.id}`,
        hitId: "palm"
      });
      if (actual > 0) {
        knockbackEntity(fighter, target, fighter.radius * (Number(skill.knockbackRate) || 1.45));
        target.monkWallCrash = {
          sourceId: fighter.id,
          damage: Number(skill.wallBonusDamage) || 6,
          expiresAt: now + (Number(skill.wallCrashDuration) || 900),
          attackId: `monk-wall-${fighter.id}-${now.toFixed(2)}-${target.id}`,
          applied: false
        };
        createCircleEffect(target.x, target.y, target.radius * 1.25, "monk-palm-hit");
      }
    });
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
    startSkillRecovery(fighter, skill, now);
    addLog(`${fighter.name} 평온의 일격`, "skill");
  }

  function isTargetInMonkCone(fighter, target, angle, range, arc) {
    if (!target || target.dead || target.removing || isFighterOutOfBattle(target)) return false;
    const dx = target.x - fighter.x;
    const dy = target.y - fighter.y;
    const distance = Math.hypot(dx, dy);
    if (distance > range + target.radius * 0.5) return false;
    const targetAngle = Math.atan2(dy, dx);
    const diff = Math.abs(normalizeAngle(targetAngle - angle));
    return diff <= arc / 2;
  }

  function startMonkMeditation(fighter, skill, now) {
    const state = fighter.skillState;
    const duration = Number(skill.duration) || 2000;
    state.data.endAt = now + duration;
    state.data.previousSpeedMultiplier = fighter.speedMultiplier || 1;
    fighter.monkMeditationUntil = state.data.endAt;
    fighter.speedMultiplier = (fighter.speedMultiplier || 1) * (1 - (Number(skill.speedSlowRate) || 0.35));
    fighter.monkMeditationEffect = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.38, "monk-meditation-field");
    getFighterElement(fighter).classList.add("monk-meditating");
    restoreStoredVelocity(fighter, state);
    addLog(`${fighter.name} 명상`, "skill");
  }

  function updateMonkMeditationSkill(fighter, now) {
    const state = fighter.skillState;
    if (!state) return;
    updateCircleEffect(fighter.monkMeditationEffect, fighter.x, fighter.y, fighter.radius * 1.38);
    if (fighter.dead || game.phase !== "running" || now >= (state.data.endAt || now)) {
      endMonkMeditation(fighter, state, now, fighter.dead || game.phase !== "running");
    }
  }

  function endMonkMeditation(fighter, state, now, interrupted = false) {
    if (!fighter) return;
    fighter.monkMeditationUntil = 0;
    removeElement(fighter.monkMeditationEffect);
    fighter.monkMeditationEffect = null;
    getFighterElement(fighter).classList.remove("monk-meditating");
    if (state && Number.isFinite(state.data.previousSpeedMultiplier)) {
      fighter.speedMultiplier = state.data.previousSpeedMultiplier;
      normalizeVelocity(fighter, getPixelSpeed(fighter));
    }
    if (state && fighter.skillState === state) {
      fighter.skillState = null;
      if (!interrupted) startSkillRecovery(fighter, state.skill, now);
    }
  }

  function startMonkEnlightenment(fighter, skill, now) {
    const state = fighter.skillState;
    const duration = Number(skill.duration) || 5000;
    const radius = game.arenaSize * (Number(skill.radiusRate) || 0.17);
    state.data.endAt = now + duration;
    state.data.previousSpeedMultiplier = fighter.speedMultiplier || 1;
    state.data.effects = [
      createCircleEffect(fighter.x, fighter.y, radius, "monk-enlightenment-field"),
      createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.55, "monk-mandala")
    ];
    state.data.title = createMonkUltimateTitle();
    fighter.monkEnlightenment = { active: true, radius, endAt: state.data.endAt, effects: state.data.effects, title: state.data.title, previousSpeedMultiplier: state.data.previousSpeedMultiplier };
    fighter.speedMultiplier = (fighter.speedMultiplier || 1) * (1 - (Number(skill.speedSlowRate) || 0.25));
    getFighterElement(fighter).classList.add("monk-enlightened");
    restoreStoredVelocity(fighter, state);
    pulseArena();
    addLog(`${fighter.name} 깨달음의 영역`, "skill");
  }

  function updateMonkEnlightenmentSkill(fighter, now) {
    const state = fighter.skillState;
    if (!state) return;
    updateMonkEnlightenmentVisuals(fighter);
    if (fighter.dead || game.phase !== "running" || now >= (state.data.endAt || now)) {
      const skill = state.skill;
      clearMonkSkillState(fighter, state, fighter.dead || game.phase !== "running");
      fighter.skillState = null;
      if (!fighter.dead && game.phase === "running") startSkillRecovery(fighter, skill, now);
      else releaseUltimateLock(fighter, skill);
    }
  }

  function updateMonkState(fighter, now) {
    if (!fighter || fighter.abilityType !== "monkReflector") return;
    if (fighter.dead || game.phase !== "running") {
      resetMonkState(fighter);
      return;
    }
    if (fighter.monkWallCrash && now >= fighter.monkWallCrash.expiresAt) {
      fighter.monkWallCrash = null;
    }
    if (fighter.monkMeditationUntil && now >= fighter.monkMeditationUntil && (!fighter.skillState || fighter.skillState.skill.type !== "monkMeditation")) {
      fighter.monkMeditationUntil = 0;
      removeElement(fighter.monkMeditationEffect);
      fighter.monkMeditationEffect = null;
      getFighterElement(fighter).classList.remove("monk-meditating");
    }
    if (fighter.monkMeditationUntil && fighter.monkMeditationEffect) {
      updateCircleEffect(fighter.monkMeditationEffect, fighter.x, fighter.y, fighter.radius * 1.38);
    }
    if (fighter.monkEnlightenment && fighter.monkEnlightenment.active) {
      updateMonkEnlightenmentVisuals(fighter);
    }
    if (hasMonkReflectActive(fighter, now)) {
      reflectProjectilesForMonk(fighter, now);
    }
  }

  function endMonkEnlightenment(fighter, interrupted = false, now = getBattleNow()) {
    if (!fighter || !fighter.monkEnlightenment) return;
    const skill = fighter.skills.find((item) => item.type === "enlightenmentField");
    const state = fighter.skillState && fighter.skillState.skill && fighter.skillState.skill.type === "enlightenmentField"
      ? fighter.skillState
      : null;
    const previousSpeed = state && Number.isFinite(state.data.previousSpeedMultiplier)
      ? state.data.previousSpeedMultiplier
      : fighter.monkEnlightenment && fighter.monkEnlightenment.previousSpeedMultiplier;
    clearMonkEnlightenmentVisuals(fighter, true);
    fighter.monkEnlightenment = null;
    getFighterElement(fighter).classList.remove("monk-enlightened");
    if (Number.isFinite(previousSpeed)) {
      fighter.speedMultiplier = previousSpeed;
      normalizeVelocity(fighter, getPixelSpeed(fighter));
    }
    if (interrupted && skill) releaseUltimateLock(fighter, skill);
  }

  function updateMonkEnlightenmentVisuals(fighter) {
    const ultimate = fighter && fighter.monkEnlightenment;
    if (!ultimate) return;
    const [field, mandala] = ultimate.effects || [];
    updateCircleEffect(field, fighter.x, fighter.y, ultimate.radius);
    updateCircleEffect(mandala, fighter.x, fighter.y, fighter.radius * 1.55);
  }

  function clearMonkEnlightenmentVisuals(fighter, fade = false) {
    const ultimate = fighter && fighter.monkEnlightenment;
    if (!ultimate) return;
    (ultimate.effects || []).forEach((effect) => {
      if (fade && effect) effect.classList.add("fading");
      scheduleTimeout(() => removeElement(effect), fade ? 280 : 0);
    });
    removeElement(ultimate.title);
  }

  function clearMonkSkillState(fighter, state, interrupted = true) {
    if (!state || !state.data) return;
    removeElement(state.data.warning);
    removeElement(state.data.charge);
    if (state.skill.type === "monkMeditation") {
      endMonkMeditation(fighter, state, getBattleNow(), interrupted);
    }
    if (state.skill.type === "enlightenmentField") {
      endMonkEnlightenment(fighter, interrupted, getBattleNow());
    }
  }

  function resetMonkState(fighter) {
    if (!fighter) return;
    fighter.monkComboCount = 0;
    fighter.monkLastComboAt = -Infinity;
    fighter.monkMeditationUntil = 0;
    removeElement(fighter.monkMeditationEffect);
    fighter.monkMeditationEffect = null;
    fighter.monkWallCrash = null;
    endMonkEnlightenment(fighter, true, getBattleNow());
    const element = getFighterElement(fighter);
    if (element) element.classList.remove("monk-meditating", "monk-enlightened");
  }

  function handleMonkComboCollision(fighter, target, now) {
    if (!fighter || !target || fighter.dead || target.dead || fighter.side === target.side || fighter.abilityType !== "monkReflector") return;
    if (now - (fighter.monkLastComboAt || -Infinity) < MONK_COMBO_INTERVAL_MS) return;
    fighter.monkLastComboAt = now;
    fighter.monkComboCount = ((fighter.monkComboCount || 0) % 3) + 1;
    if (fighter.monkComboCount < 3) return;
    fighter.monkComboCount = 0;
    const actual = applyDamage(fighter, target, {
      label: "연속 수련",
      fixedDamage: 5,
      attackId: `monk-combo-${fighter.id}-${now.toFixed(2)}-${target.id}`,
      hitId: "third"
    });
    if (actual > 0) {
      knockbackEntity(fighter, target, fighter.radius * 1.65);
      createMonkComboBurst(target);
      pulseArena();
    }
  }

  function handleMonkWallCrash(target, now) {
    const crash = target && target.monkWallCrash;
    if (!crash || crash.applied || now > crash.expiresAt) {
      if (target) target.monkWallCrash = null;
      return;
    }
    const source = getFighterById(crash.sourceId);
    if (!source || source.dead) {
      target.monkWallCrash = null;
      return;
    }
    crash.applied = true;
    applyDamage(source, target, {
      label: "평온의 일격 벽 충돌",
      baseDamage: crash.damage,
      ignoreDefense: true,
      attackId: crash.attackId,
      hitId: "wall"
    });
    createCircleEffect(target.x, target.y, target.radius * 1.35, "monk-wall-impact");
    pulseArena();
    target.monkWallCrash = null;
  }

  function hasMonkReflectActive(fighter, now = getBattleNow()) {
    return !!(
      fighter &&
      fighter.abilityType === "monkReflector" &&
      !fighter.dead &&
      !isFighterOutOfBattle(fighter) &&
      ((fighter.monkMeditationUntil && now < fighter.monkMeditationUntil) || (fighter.monkEnlightenment && fighter.monkEnlightenment.active && now < fighter.monkEnlightenment.endAt))
    );
  }

  function getMonkReflectRadius(fighter, now = getBattleNow()) {
    if (fighter.monkEnlightenment && fighter.monkEnlightenment.active && now < fighter.monkEnlightenment.endAt) {
      return fighter.monkEnlightenment.radius || game.arenaSize * 0.17;
    }
    return fighter.radius * 1.15;
  }

  function reflectProjectilesForMonk(monk, now) {
    getAllReflectableProjectiles().forEach((projectile) => {
      const owner = getProjectileOwner(projectile);
      if (!owner || owner.side === monk.side) return;
      const distance = Math.hypot(getProjectileX(projectile) - monk.x, getProjectileY(projectile) - monk.y);
      if (distance <= getMonkReflectRadius(monk, now) + getProjectileRadius(projectile)) {
        reflectProjectileByMonk(projectile, monk, owner, now);
      }
    });
  }

  function tryReflectProjectileAgainstTarget(target, projectile, owner, now = getBattleNow()) {
    if (!target || target.abilityType !== "monkReflector" || !hasMonkReflectActive(target, now)) return false;
    if (!owner || owner.side === target.side) return false;
    return reflectProjectileByMonk(projectile, target, owner, now);
  }

  function reflectProjectileByMonk(projectile, monk, owner, now) {
    if (!projectile || !monk || !owner || owner.side === monk.side) return false;
    const reflectItem = projectile.item || projectile;
    if (reflectItem.lastReflectorId === monk.id && now - (reflectItem.lastReflectTime || -Infinity) < MONK_REFLECT_LOCK_MS) return false;
    const px = getProjectileX(projectile);
    const py = getProjectileY(projectile);
    const oldOwner = owner;
    const dx = oldOwner.x - px;
    const dy = oldOwner.y - py;
    const length = Math.hypot(dx, dy) || 1;
    const dirX = dx / length;
    const dirY = dy / length;
    setProjectileDirection(projectile, dirX, dirY);
    const item = projectile.item || projectile;
    item.ownerId = monk.id;
    item.ownerSide = monk.side;
    item.lastReflectTime = now;
    item.lastReflectorId = monk.id;
    item.reflectionCount = (item.reflectionCount || 0) + 1;
    item.reflectedByMonk = true;
    if (item.element) item.element.classList.add("monk-reflected-projectile");
    pushProjectileOutsideReflector(projectile, monk, now);
    transferProjectileToOwnerContainer(projectile, monk);
    createMonkReflectFlash(px, py, projectile);
    addLog(`${monk.name} 투사체 반사`, "skill");
    return true;
  }

  function getAllReflectableProjectiles() {
    const items = [];
    Object.values(game.fighters).forEach((fighter) => {
      if (!fighter) return;
      (fighter.ricoBullets || []).forEach((bullet) => {
        if (!bullet.removing) items.push({ kind: "rico", item: bullet });
      });
      (fighter.oiiaProjectiles || []).forEach((projectile) => {
        if (!projectile.removing) items.push({ kind: "oiiaVolley", item: projectile });
      });
      (fighter.ronaldoBalls || []).forEach((ball) => {
        if (!ball.removing) items.push({ kind: "ronaldo", item: ball });
      });
      const state = fighter.skillState;
      if (state && state.skill && state.skill.type === "maugaGuns" && state.data && Array.isArray(state.data.bullets)) {
        state.data.bullets.forEach((bullet) => {
          if (!bullet.removing) items.push({ kind: "mauga", item: bullet, state });
        });
      }
      if (state && state.skill && state.skill.type === "bloodMoonSlash" && state.data && state.data.projectile && !state.data.hit) {
        items.push({ kind: "bloodmoon", item: state.data, state });
      }
      if (state && state.skill && state.skill.type === "infernalChains" && state.data && state.data.phase === "projectile" && state.data.projectile) {
        items.push({ kind: "aatroxChain", item: state.data, state });
      }
    });
    return items;
  }

  function getProjectileOwner(projectile) {
    const item = projectile.item || projectile;
    return getFighterById(item.ownerId || item.ownerID) || getFighterById(item.sourceId || "");
  }

  function getProjectileX(projectile) {
    const item = projectile.item || projectile;
    if (projectile.kind === "bloodmoon") return item.originX + (item.dirX || 0) * (item.traveled || 0);
    if (projectile.kind === "aatroxChain") return (item.segmentX || item.originX || 0) + (item.dirX || 0) * ((item.currentLength || 0) * 0.5);
    return Number(item.x) || 0;
  }

  function getProjectileY(projectile) {
    const item = projectile.item || projectile;
    if (projectile.kind === "bloodmoon") return item.originY + (item.dirY || 0) * (item.traveled || 0);
    if (projectile.kind === "aatroxChain") return (item.segmentY || item.originY || 0) + (item.dirY || 0) * ((item.currentLength || 0) * 0.5);
    return Number(item.y) || 0;
  }

  function getProjectileRadius(projectile) {
    const item = projectile.item || projectile;
    if (projectile.kind === "bloodmoon") return Math.max(item.crescentRadius || 0, item.width || 0);
    if (projectile.kind === "aatroxChain") return Math.max(4, Number(item.width) || 8);
    return Math.max(2, Number(item.radius) || 5);
  }

  function setProjectileDirection(projectile, dirX, dirY) {
    const item = projectile.item || projectile;
    const angle = Math.atan2(dirY, dirX);
    if (projectile.kind === "mauga") {
      const speed = Math.hypot(item.vx || 0, item.vy || 0) || game.arenaSize * 1.4;
      item.vx = dirX * speed;
      item.vy = dirY * speed;
      item.angle = angle;
      return;
    }
    if (projectile.kind === "bloodmoon") {
      const x = getProjectileX(projectile);
      const y = getProjectileY(projectile);
      item.originX = x;
      item.originY = y;
      item.dirX = dirX;
      item.dirY = dirY;
      item.angle = angle;
      item.traveled = 0;
      item.hit = false;
      item.hitSummons = new Set();
      return;
    }
    if (projectile.kind === "aatroxChain") {
      const x = getProjectileX(projectile);
      const y = getProjectileY(projectile);
      item.originX = x;
      item.originY = y;
      item.segmentX = x;
      item.segmentY = y;
      item.dirX = dirX;
      item.dirY = dirY;
      item.angle = angle;
      item.projectileStartAt = getBattleNow();
      item.projectileDistance = 0;
      item.currentLength = Math.max(2, item.width || 8);
      item.segmentStartDistance = 0;
      return;
    }
    item.dirX = dirX;
    item.dirY = dirY;
    item.angle = angle;
  }

  function pushProjectileOutsideReflector(projectile, monk, now) {
    const item = projectile.item || projectile;
    if (projectile.kind === "bloodmoon") return;
    let dx = getProjectileX(projectile) - monk.x;
    let dy = getProjectileY(projectile) - monk.y;
    let distance = Math.hypot(dx, dy);
    if (!distance) {
      dx = item.dirX || item.vx || 1;
      dy = item.dirY || item.vy || 0;
      distance = Math.hypot(dx, dy) || 1;
    }
    const radius = getMonkReflectRadius(monk, now) + getProjectileRadius(projectile) + 4;
    item.x = monk.x + (dx / distance) * radius;
    item.y = monk.y + (dy / distance) * radius;
  }

  function transferProjectileToOwnerContainer(projectile, monk) {
    // Projectiles stay in their existing update list; the reflected ownerId decides future damage targets.
  }

  function createMonkPalmWarning(fighter, direction, skill) {
    const element = document.createElement("div");
    element.className = "monk-palm-warning";
    els.skillLayer.appendChild(element);
    updateMonkPalmWarning(element, fighter, direction, skill);
    return element;
  }

  function updateMonkPalmWarning(element, fighter, direction, skill) {
    if (!element || !fighter || !direction) return;
    const range = game.arenaSize * (Number(skill.rangeRate) || 0.3);
    element.style.width = `${range}px`;
    element.style.height = `${range * 0.72}px`;
    element.style.left = `${fighter.x}px`;
    element.style.top = `${fighter.y}px`;
    element.style.transform = `translate(0, -50%) rotate(${direction.angle}rad)`;
  }

  function createMonkPalmWave(fighter, direction, range) {
    const wave = document.createElement("div");
    wave.className = "monk-palm-wave";
    wave.style.width = `${range}px`;
    wave.style.height = `${range * 0.74}px`;
    wave.style.left = `${fighter.x}px`;
    wave.style.top = `${fighter.y}px`;
    wave.style.transform = `translate(0, -50%) rotate(${direction.angle}rad)`;
    els.skillLayer.appendChild(wave);
    scheduleTimeout(() => removeElement(wave), 420);
  }

  function createMonkComboBurst(target) {
    const burst = createCircleEffect(target.x, target.y, target.radius * 1.65, "monk-combo-burst");
    scheduleTimeout(() => removeElement(burst), 420);
  }

  function createMonkReflectFlash(x, y, projectile) {
    const flash = createCircleEffect(x, y, Math.max(10, getProjectileRadius(projectile) * 1.75), "monk-reflect-flash");
    scheduleTimeout(() => removeElement(flash), 280);
  }

  function createMonkUltimateTitle() {
    const element = document.createElement("div");
    element.className = "monk-ultimate-title";
    element.textContent = "완전한 깨달음";
    els.arena.appendChild(element);
    scheduleTimeout(() => removeElement(element), 1800);
    return element;
  }

  function normalizeAngle(angle) {
    let value = angle;
    while (value > Math.PI) value -= Math.PI * 2;
    while (value < -Math.PI) value += Math.PI * 2;
    return value;
  }

  function degreesToRadians(degrees) {
    return (Number(degrees) || 0) * Math.PI / 180;
  }

  function startGasterDoomBarrage(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;

    state.data.patterns = shuffleDoomPatterns(["plus", "cross", "hash"]);
    state.data.patternIndex = 0;
    state.data.currentPattern = null;
    state.data.warningDuration = Number(skill.warningDuration) || 800;
    state.data.beamDuration = Number(skill.beamDuration) || 600;
    state.data.patternGap = Number(skill.patternGap) || 350;
    state.data.effects = state.data.effects || [];
    getFighterElement(fighter).classList.add("sans-eye");
    fighter.vx = 0;
    fighter.vy = 0;
    addLog(`${fighter.name} ${skill.name || "ULTIMATE"} 발동`, "skill");
    startGasterDoomPattern(fighter, skill, now);
  }

  function updateGasterDoomBarrage(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state || !state.data.currentPattern) return;
    const pattern = state.data.currentPattern;

    if (fighter.dead || opponent.dead) {
      endGasterDoomBarrage(fighter, now, true);
      return;
    }

    if (pattern.phase === "warning" && now >= pattern.fireAt) {
      fireGasterDoomPattern(pattern);
    }

    if (pattern.phase === "firing") {
      damageGasterDoomTarget(fighter, opponent, state.skill, pattern, now);
      if (now >= pattern.beamEndAt) {
        pattern.phase = "gap";
        pattern.cleanupAt = now + state.data.patternGap;
        fadeGasterDoomPattern(pattern);
      }
    }

    if (pattern.phase === "gap" && now >= pattern.cleanupAt) {
      clearGasterDoomPattern(pattern);
      state.data.currentPattern = null;
      state.data.patternIndex += 1;
      if (state.data.patternIndex >= state.data.patterns.length) {
        endGasterDoomBarrage(fighter, now, false);
        return;
      }
      startGasterDoomPattern(fighter, state.skill, now);
    }
  }

  function startGasterDoomPattern(fighter, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    const key = state.data.patterns[state.data.patternIndex];
    const finalPattern = state.data.patternIndex === state.data.patterns.length - 1;
    const beams = getGasterDoomBeams(key, getGasterDoomBeamWidth(key));
    const warnings = beams.map((beam) => createGasterDoomLine(beam, `gaster-warning gaster-ultimate-warning ${key === "hash" ? "hash" : ""}`));
    const blasters = beams.map((beam) => createGasterDoomBlaster(beam, finalPattern));
    state.data.currentPattern = {
      attackId: `doom-${fighter.id}-${key}-${now.toFixed(3)}-${Math.random().toString(16).slice(2)}`,
      key,
      label: getGasterDoomPatternLabel(key),
      phase: "warning",
      beams,
      warnings,
      beamElements: [],
      blasters,
      fireAt: now + state.data.warningDuration,
      beamEndAt: now + state.data.warningDuration + state.data.beamDuration,
      nextTickAt: now + state.data.warningDuration,
      damageDone: 0,
      damageDoneByTarget: new Map(),
      hitIndex: 0,
      finalPattern
    };
    addLog(`${fighter.name} 종말포화 ${getGasterDoomPatternLabel(key)} 패턴`, "skill");
  }

  function fireGasterDoomPattern(pattern) {
    pattern.phase = "firing";
    pattern.warnings.forEach((warning) => removeElement(warning));
    pattern.warnings = [];
    pattern.beamElements = pattern.beams.map((beam) => createGasterDoomLine(beam, `gaster-beam gaster-ultimate-beam ${pattern.finalPattern ? "final" : ""}`));
    pattern.blasters.forEach((blaster) => blaster.classList.add("firing"));
    createGasterUltimateFlash(pattern.finalPattern);
    pulseArena();
    if (pattern.finalPattern) {
      scheduleTimeout(() => pulseArena(), 90);
    }
  }

  function damageGasterDoomTarget(fighter, target, skill, pattern, now) {
    const tickInterval = Number(skill.tickInterval) || 150;
    const maxDamage = Number(skill.maxPatternDamage) || 16;
    const targets = getGasterBeamTargets(fighter, target, now);
    targets.forEach((beamTarget) => {
      syncSansDodgeAttackContact(beamTarget, pattern.attackId, isTargetInGasterDoomBeams(beamTarget, pattern.beams));
    });
    while (now >= pattern.nextTickAt && pattern.nextTickAt < pattern.beamEndAt) {
      pattern.nextTickAt += tickInterval;
      pattern.hitIndex += 1;
      targets.forEach((beamTarget) => {
        if (isTargetInGasterDoomBeams(beamTarget, pattern.beams)) {
          damageGasterBeamTarget(fighter, beamTarget, skill, pattern, pattern.attackId, `tick-${pattern.hitIndex}`, maxDamage);
        }
      });
    }
  }

  function endGasterDoomBarrage(fighter, now, interrupted) {
    const state = fighter.skillState;
    if (!state) return;
    const skill = state.skill;
    clearGasterDoomBarrage(fighter, state);
    fighter.skillState = null;
    const shouldReturn = !interrupted && !fighter.dead && game.phase === "running";
    if (shouldReturn) {
      restoreFighterFromUltimate(fighter, getOpposingFighter(fighter.side), now);
    }
    restoreStoredVelocity(fighter, state);
    if (!interrupted && !fighter.dead) {
      startSkillRecovery(fighter, skill, now);
    } else {
      releaseUltimateLock(fighter, skill);
    }
  }

  function clearGasterDoomBarrage(fighter, state) {
    if (!state || !state.data) return;
    clearGasterDoomPattern(state.data.currentPattern);
    state.data.currentPattern = null;
    if (state.data.effects) {
      state.data.effects.forEach((effect) => removeElement(effect));
      state.data.effects = [];
    }
    removeElement(state.data.dim);
    removeElement(state.data.title);
    removeElement(state.data.particles);
    state.data.dim = null;
    state.data.title = null;
    state.data.particles = null;
    if (fighter) {
      getFighterElement(fighter).classList.remove("sans-eye");
    }
  }

  function clearGasterDoomPattern(pattern) {
    if (!pattern) return;
    if (pattern.attackId) {
      Object.values(game.fighters).forEach((fighter) => syncSansDodgeAttackContact(fighter, pattern.attackId, false));
      game.summons.forEach((summon) => syncSansDodgeAttackContact(summon, pattern.attackId, false));
    }
    pattern.warnings.forEach((warning) => removeElement(warning));
    pattern.beamElements.forEach((beam) => removeElement(beam));
    pattern.blasters.forEach((blaster) => removeElement(blaster));
    pattern.warnings = [];
    pattern.beamElements = [];
    pattern.blasters = [];
  }

  function fadeGasterDoomPattern(pattern) {
    pattern.beamElements.forEach((beam) => beam.classList.add("fading"));
    pattern.blasters.forEach((blaster) => blaster.classList.add("fading"));
  }

  function shuffleDoomPatterns(patterns) {
    const shuffled = patterns.slice();
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }
    return shuffled;
  }

  function getGasterDoomPatternLabel(key) {
    if (key === "plus") return "+";
    if (key === "cross") return "횞";
    return "#";
  }

  function getGasterDoomBeamWidth(key) {
    const rate = key === "hash" ? 0.058 : 0.074;
    const maxWidth = key === "hash" ? 40 : 50;
    return clamp(game.arenaSize * rate, 30, maxWidth) * GASTER_ULTIMATE_BEAM_WIDTH_SCALE;
  }

  function getGasterDoomBeams(key, width) {
    const size = game.arenaSize;
    const center = size / 2;
    const thirdA = size * 0.36;
    const thirdB = size * 0.64;
    const diagonal = Math.hypot(size, size);

    if (key === "plus") {
      return [
        createGasterDoomBeam(0, center, 1, 0, size, width),
        createGasterDoomBeam(center, 0, 0, 1, size, width)
      ];
    }

    if (key === "cross") {
      return [
        createGasterDoomBeam(0, 0, Math.SQRT1_2, Math.SQRT1_2, diagonal, width),
        createGasterDoomBeam(size, 0, -Math.SQRT1_2, Math.SQRT1_2, diagonal, width)
      ];
    }

    return [
      createGasterDoomBeam(0, thirdA, 1, 0, size, width),
      createGasterDoomBeam(0, thirdB, 1, 0, size, width),
      createGasterDoomBeam(thirdA, 0, 0, 1, size, width),
      createGasterDoomBeam(thirdB, 0, 0, 1, size, width)
    ];
  }

  function createGasterDoomBeam(startX, startY, dirX, dirY, length, width) {
    return {
      startX,
      startY,
      dirX,
      dirY,
      angle: Math.atan2(dirY, dirX),
      length,
      width
    };
  }

  function createGasterDoomLine(beam, className) {
    return createGasterLine(beam.startX, beam.startY, beam.angle, beam.length, beam.width, className);
  }

  function createGasterDoomBlaster(beam, finalPattern) {
    const element = createGasterBlasterElement(
      beam.startX - beam.dirX * GASTER_MOUTH_OFFSET * GASTER_ULTIMATE_BLASTER_SCALE,
      beam.startY - beam.dirY * GASTER_MOUTH_OFFSET * GASTER_ULTIMATE_BLASTER_SCALE,
      beam.angle,
      GASTER_ULTIMATE_BLASTER_SCALE
    );
    element.classList.add("ultimate");
    if (finalPattern) {
      element.classList.add("final");
    }
    return element;
  }

  function isTargetInGasterDoomBeams(target, beams) {
    if (!target || target.dead || isFighterOutOfBattle(target)) return false;
    return beams.some((beam) => {
      const dx = target.x - beam.startX;
      const dy = target.y - beam.startY;
      const forward = dx * beam.dirX + dy * beam.dirY;
      const side = Math.abs(dx * -beam.dirY + dy * beam.dirX);
      return forward >= 0 && forward <= beam.length && side <= beam.width / 2 + target.radius * 0.35;
    });
  }

  function createGasterUltimateDim() {
    const element = document.createElement("div");
    element.className = "gaster-ultimate-dim";
    els.skillLayer.appendChild(element);
    return element;
  }

  function createGasterUltimateTitle(text) {
    const element = document.createElement("div");
    element.className = "gaster-ultimate-title";
    element.textContent = text || "ULTIMATE";
    els.skillLayer.appendChild(element);
    return element;
  }

  function createGasterUltimateParticles() {
    const element = document.createElement("div");
    element.className = "gaster-ultimate-particles";
    for (let i = 0; i < 28; i += 1) {
      const particle = document.createElement("span");
      particle.className = "gaster-ultimate-particle";
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 520}ms`;
      particle.style.setProperty("--drift", `${(Math.random() - 0.5) * 34}px`);
      element.appendChild(particle);
    }
    els.skillLayer.appendChild(element);
    return element;
  }

  function createGasterUltimateFlash(finalPattern) {
    const element = document.createElement("div");
    element.className = finalPattern ? "gaster-ultimate-flash final" : "gaster-ultimate-flash";
    els.skillLayer.appendChild(element);
    scheduleTimeout(() => removeElement(element), finalPattern ? 360 : 240);
  }

  function isFighterOutOfBattle(fighter) {
    return !!(fighter && fighter.isUltimateHidden);
  }

  function isFighterStabilizing(fighter, now = getBattleNow()) {
    return !!(fighter && fighter.ultimateStabilizeUntil && now < fighter.ultimateStabilizeUntil);
  }

  function isFighterCollisionSuppressed(fighter, now = getBattleNow()) {
    return isFighterOutOfBattle(fighter) || isFighterStabilizing(fighter, now) || !!(fighter && (fighter.ronaldoAirborne || (fighter.lastSubwayNoBodyUntil && now < fighter.lastSubwayNoBodyUntil)));
  }

  function isFighterDamageSuppressed(fighter) {
    return isFighterOutOfBattle(fighter) || isFighterStabilizing(fighter) || isBlueEyesInvulnerable(fighter, getBattleNow()) || isOiiaGreatSpinActive(fighter, getBattleNow());
  }

  function hideFighterForUltimate(fighter, state) {
    if (!fighter || fighter.isUltimateHidden) return;
    fighter.isUltimateHidden = true;
    fighter.ultimateStabilizeUntil = 0;
    fighter.ultimateStoredVelocity = { vx: fighter.vx, vy: fighter.vy };
    fighter.vx = 0;
    fighter.vy = 0;
    if (fighter.sansCollisionLocks) {
      fighter.sansCollisionLocks.clear();
    }
    if (fighter.sansAttackLocks) {
      fighter.sansAttackLocks.clear();
    }
    clearTelekinesisTarget(fighter);
    removeElement(fighter.slowEffect);
    fighter.slowEffect = null;
    const element = getFighterElement(fighter);
    element.classList.remove("ultimate-hidden", "ultimate-reappear");
    element.classList.add("ultimate-vanish");
    createSansUltimatePhaseEffect(fighter.x, fighter.y, fighter.radius * 1.35, "sans-ultimate-vanish-burst");
    if (state && state.data) {
      state.data.hiddenByUltimate = true;
    }
    scheduleTimeout(() => {
      if (!fighter.isUltimateHidden) return;
      element.classList.remove("ultimate-vanish");
      element.classList.add("ultimate-hidden");
    }, SANS_ULTIMATE_PHASE_MS);
  }

  function restoreFighterFromUltimate(fighter, opponent, now = getBattleNow()) {
    if (!fighter || !fighter.isUltimateHidden) return;
    const position = findSafeUltimateReturnPosition(fighter, opponent);
    if (position) {
      fighter.x = position.x;
      fighter.y = position.y;
    }
    keepInsideArena(fighter);
    if (fighter.ultimateStoredVelocity) {
      fighter.vx = fighter.ultimateStoredVelocity.vx;
      fighter.vy = fighter.ultimateStoredVelocity.vy;
      fighter.ultimateStoredVelocity = null;
    }
    fighter.isUltimateHidden = false;
    fighter.ultimateStabilizeUntil = now + ULTIMATE_RETURN_STABILIZE_MS;
    if (fighter.sansCollisionLocks) {
      fighter.sansCollisionLocks.clear();
    }
    if (fighter.sansAttackLocks) {
      fighter.sansAttackLocks.clear();
    }
    normalizeVelocity(fighter, getPixelSpeed(fighter));
    const element = getFighterElement(fighter);
    element.classList.remove("ultimate-hidden", "ultimate-vanish");
    element.classList.add("ultimate-reappear", "sans-eye");
    createSansUltimatePhaseEffect(fighter.x, fighter.y, fighter.radius * 1.25, "sans-ultimate-reappear-burst");
    scheduleTimeout(() => {
      element.classList.remove("ultimate-reappear");
      if (!fighter.skillState || fighter.skillState.skill.type !== "gasterDoomBarrage") {
        element.classList.remove("sans-eye");
      }
    }, SANS_ULTIMATE_PHASE_MS + 40);
  }

  function resetUltimateHiddenState(fighter) {
    if (!fighter) return;
    fighter.isUltimateHidden = false;
    fighter.ultimateStabilizeUntil = 0;
    fighter.ultimateStoredVelocity = null;
    if (fighter.sansAttackLocks) {
      fighter.sansAttackLocks.clear();
    }
    const element = getFighterElement(fighter);
    element.classList.remove("ultimate-hidden", "ultimate-vanish", "ultimate-reappear");
  }

  function findSafeUltimateReturnPosition(fighter, opponent) {
    const margin = fighter.radius + 5;
    let best = null;
    let bestScore = -Infinity;
    for (let i = 0; i < 120; i += 1) {
      const x = margin + Math.random() * Math.max(1, game.arenaSize - margin * 2);
      const y = margin + Math.random() * Math.max(1, game.arenaSize - margin * 2);
      const score = scoreUltimateReturnPosition(x, y, fighter, opponent);
      if (score >= fighter.radius + 18) {
        return { x, y };
      }
      if (score > bestScore) {
        bestScore = score;
        best = { x, y };
      }
    }
    if (best && bestScore > -Infinity) return best;
    return findSafeSansTeleportPosition(fighter, opponent) || {
      x: clamp(game.arenaSize * 0.5, margin, game.arenaSize - margin),
      y: clamp(game.arenaSize * 0.5, margin, game.arenaSize - margin)
    };
  }

  function scoreUltimateReturnPosition(x, y, fighter, opponent) {
    if (x - fighter.radius < 0 || x + fighter.radius > game.arenaSize || y - fighter.radius < 0 || y + fighter.radius > game.arenaSize) {
      return -Infinity;
    }

    let score = game.arenaSize;
    const bodies = [opponent].concat(game.summons);
    for (const body of bodies) {
      if (!body || body.dead || body.removing || isFighterOutOfBattle(body)) continue;
      const required = fighter.radius + body.radius + (body.isOiiaClone ? 9 : 14);
      const clearance = Math.hypot(x - body.x, y - body.y) - required;
      if (clearance < 0) return -Infinity;
      score = Math.min(score, clearance);
    }

    for (const object of game.arenaObjects) {
      if (object.type !== "circleWall" || object.fadeStarted) continue;
      const clearance = Math.abs(Math.hypot(x - object.x, y - object.y) - object.radius) - fighter.radius - 9;
      if (clearance < 0) return -Infinity;
      score = Math.min(score, clearance);
    }

    return score;
  }

  function createSansUltimatePhaseEffect(x, y, radius, className) {
    const effect = createCircleEffect(x, y, radius, className);
    for (let i = 0; i < 16; i += 1) {
      const particle = document.createElement("span");
      particle.className = i % 3 === 0 ? "sans-phase-bone" : "sans-phase-spark";
      const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.24;
      const distance = radius * (0.42 + Math.random() * 0.62);
      particle.style.left = `${radius + Math.cos(angle) * radius * 0.24}px`;
      particle.style.top = `${radius + Math.sin(angle) * radius * 0.24}px`;
      particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
      particle.style.setProperty("--spin", `${(Math.random() - 0.5) * 260}deg`);
      particle.style.animationDelay = `${Math.random() * 90}ms`;
      effect.appendChild(particle);
    }
    scheduleTimeout(() => removeElement(effect), 640);
    return effect;
  }

  function startBlueTelekinesis(fighter, opponent, skill, now) {
    const state = fighter.skillState;
    if (!state) return;
    const range = state.data.range || game.arenaSize * (Number(skill.rangeRate) || 0.68);
    const distance = Math.hypot(opponent.x - fighter.x, opponent.y - fighter.y);
    removeElement(state.data.warning);
    removeElement(state.data.targetMark);

    if (isFighterOutOfBattle(opponent) || !state.data.targetInRangeAtCast || distance > range + opponent.radius) {
      getFighterElement(fighter).classList.remove("sans-eye");
      fighter.skillState = null;
      restoreStoredVelocity(fighter, state);
      startSkillRecovery(fighter, skill, now);
      addLog(`${fighter.name} 염력 실패`, "skill");
      return;
    }

    const hitCount = randomInt(Number(skill.minHits) || 2, Number(skill.maxHits) || 5);
    state.data.target = opponent;
    state.data.totalHits = hitCount;
    state.data.hitsDone = 0;
    state.data.nextHitAt = now + 160;
    state.data.lastUpdateAt = now;
    state.data.effects = [];
    setTelekinesisTarget(opponent);
    getFighterElement(fighter).classList.add("sans-eye");
    getFighterElement(opponent).classList.add("telekinesis-held");
    state.data.holdEffect = createCircleEffect(opponent.x, opponent.y, opponent.radius * 1.55, "telekinesis-hold");
    state.data.effects.push(state.data.holdEffect);
    state.data.slamPoint = chooseTelekinesisSlamPoint(opponent);
    addLog(`${fighter.name} 염력 적중`, "skill");
  }

  function updateBlueTelekinesis(fighter, opponent, now) {
    const state = fighter.skillState;
    if (!state || !state.data.target) return;
    const target = state.data.target;
    if (fighter.dead || target.dead || isFighterOutOfBattle(target)) {
      finishBlueTelekinesis(fighter, now);
      return;
    }

    const dt = Math.min((now - (state.data.lastUpdateAt || now)) / 1000, MAX_FRAME_STEP);
    state.data.lastUpdateAt = now;
    updateCircleEffect(state.data.holdEffect, target.x, target.y, target.radius * 1.55);

    const point = state.data.slamPoint || chooseTelekinesisSlamPoint(target);
    const dx = point.x - target.x;
    const dy = point.y - target.y;
    const distance = Math.hypot(dx, dy) || 1;
    const speed = game.arenaSize * 2.95;
    const step = speed * dt;

    if (step >= distance || now >= state.data.nextHitAt + 520) {
      target.x = point.x;
      target.y = point.y;
      keepInsideArena(target);
      completeTelekinesisSlam(fighter, state, now);
    } else {
      target.x += (dx / distance) * step;
      target.y += (dy / distance) * step;
      keepInsideArena(target);
    }
  }

  function completeTelekinesisSlam(fighter, state, now) {
    const target = state.data.target;
    state.data.hitsDone += 1;
    const isFinal = state.data.hitsDone >= state.data.totalHits;
    const baseDamage = (Number(state.skill.hitDamage) || 5) + (isFinal ? Number(state.skill.finalBonusDamage) || 3 : 0);
    const actualDamage = applyDamage(fighter, target, {
      label: state.skill.name,
      baseDamage,
      ignoreDefense: true,
      ignoreDamageReduction: false
    });
    if (actualDamage > 0) {
      createDamageNumber(target, actualDamage);
    }
    createTelekinesisImpact(target, isFinal);
    pulseArena();

    if (isFinal || target.dead) {
      finishBlueTelekinesis(fighter, now);
      return;
    }

    state.data.slamPoint = chooseTelekinesisSlamPoint(target);
    state.data.nextHitAt = now + (Number(state.skill.slamInterval) || 360);
  }

  function finishBlueTelekinesis(fighter, now) {
    const state = fighter.skillState;
    if (!state) return;
    const skill = state.skill;
    clearBlueTelekinesis(state);
    getFighterElement(fighter).classList.remove("sans-eye");
    fighter.skillState = null;
    restoreStoredVelocity(fighter, state);
    startSkillRecovery(fighter, skill, now);
  }

  function setTelekinesisTarget(target) {
    if (!target) return;
    if (target.maugaUnstoppable) return;
    target.telekinesisControlled = true;
    target.storedTelekinesisVelocity = {
      vx: target.vx,
      vy: target.vy
    };
    target.vx = 0;
    target.vy = 0;
  }

  function clearBlueTelekinesis(state) {
    if (!state || !state.data) return;
    clearTelekinesisTarget(state.data.target);
    removeElement(state.data.holdEffect);
    removeElement(state.data.targetMark);
    if (state.data.effects) {
      state.data.effects.forEach((effect) => removeElement(effect));
      state.data.effects = [];
    }
  }

  function clearTelekinesisTarget(target) {
    if (!target) return;
    target.telekinesisControlled = false;
    if (target.storedTelekinesisVelocity) {
      target.vx = target.storedTelekinesisVelocity.vx;
      target.vy = target.storedTelekinesisVelocity.vy;
      target.storedTelekinesisVelocity = null;
      normalizeVelocity(target, getPixelSpeed(target));
    }
    getFighterElement(target).classList.remove("telekinesis-held");
  }

  function chooseTelekinesisSlamPoint(target) {
    const circleWalls = game.arenaObjects.filter((object) => object.type === "circleWall" && !object.fadeStarted);
    if (circleWalls.length && Math.random() < 0.35) {
      const wall = circleWalls[Math.floor(Math.random() * circleWalls.length)];
      const angle = Math.random() * Math.PI * 2;
      const side = Math.random() < 0.5 ? -1 : 1;
      return {
        x: clamp(wall.x + Math.cos(angle) * (wall.radius + side * target.radius), target.radius, game.arenaSize - target.radius),
        y: clamp(wall.y + Math.sin(angle) * (wall.radius + side * target.radius), target.radius, game.arenaSize - target.radius)
      };
    }

    const wallIndex = Math.floor(Math.random() * 4);
    if (wallIndex === 0) return { x: clamp(target.x + (Math.random() - 0.5) * game.arenaSize * 0.32, target.radius, game.arenaSize - target.radius), y: target.radius };
    if (wallIndex === 1) return { x: clamp(target.x + (Math.random() - 0.5) * game.arenaSize * 0.32, target.radius, game.arenaSize - target.radius), y: game.arenaSize - target.radius };
    if (wallIndex === 2) return { x: target.radius, y: clamp(target.y + (Math.random() - 0.5) * game.arenaSize * 0.32, target.radius, game.arenaSize - target.radius) };
    return { x: game.arenaSize - target.radius, y: clamp(target.y + (Math.random() - 0.5) * game.arenaSize * 0.32, target.radius, game.arenaSize - target.radius) };
  }

  function createTelekinesisImpact(target, isFinal) {
    const burst = createCircleEffect(target.x, target.y, target.radius * (isFinal ? 1.9 : 1.35), isFinal ? "telekinesis-impact final" : "telekinesis-impact");
    scheduleTimeout(() => removeElement(burst), isFinal ? 520 : 360);
  }

  function createCircleEffect(x, y, radius, className) {
    const element = document.createElement("div");
    element.className = `arena-circle-effect ${className}`;
    els.skillLayer.appendChild(element);
    updateCircleEffect(element, x, y, radius);
    return element;
  }

  function updateCircleEffect(element, x, y, radius) {
    if (!element) return;
    element.style.width = `${radius * 2}px`;
    element.style.height = `${radius * 2}px`;
    element.style.left = `${x - radius}px`;
    element.style.top = `${y - radius}px`;
  }

  function createBloodMoonWarning(fighter, data, skill) {
    const element = document.createElement("div");
    element.className = "arena-line-effect bloodmoon-warning";
    els.skillLayer.appendChild(element);
    updateBloodMoonWarning(element, fighter, data, skill);
    return element;
  }

  function updateBloodMoonWarning(element, fighter, data, skill) {
    if (!element) return;
    const direction = {
      x: data.dirX || 1,
      y: data.dirY || 0,
      angle: Number.isFinite(data.angle) ? data.angle : 0
    };
    const length = game.arenaSize * (Number(skill.lengthRate) || 0.9);
    const width = fighter.radius * (Number(skill.widthRate) || 1.1);
    const centerX = fighter.x + direction.x * (fighter.radius + length / 2);
    const centerY = fighter.y + direction.y * (fighter.radius + length / 2);
    element.style.width = `${length}px`;
    element.style.height = `${width}px`;
    element.style.left = `${centerX}px`;
    element.style.top = `${centerY}px`;
    element.style.transform = `translate(-50%, -50%) rotate(${direction.angle}rad)`;
  }

  function createEnmaYamatoWarning(data) {
    const element = document.createElement("div");
    element.className = "arena-line-effect enma-yamato-warning";
    els.skillLayer.appendChild(element);
    updateEnmaYamatoWarning(element, data);
    return element;
  }

  function updateEnmaYamatoWarning(element, data) {
    if (!element || !data) return;
    updateGasterLine(
      element,
      Number(data.originX) || 0,
      Number(data.originY) || 0,
      Number.isFinite(data.angle) ? data.angle : 0,
      Math.max(1, Number(data.length) || game.arenaSize),
      Math.max(8, Number(data.width) || game.fighterBaseRadius)
    );
  }

  function createEnmaYamatoChargeAura(fighter) {
    const aura = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.5, "enma-yamato-charge-aura");
    for (let i = 0; i < 12; i += 1) {
      const spark = document.createElement("span");
      spark.className = i % 2 === 0 ? "enma-yamato-charge-spark flame" : "enma-yamato-charge-spark lightning";
      const angle = Math.random() * Math.PI * 2;
      const distance = fighter.radius * (0.5 + Math.random() * 1.15);
      spark.style.left = `${fighter.radius * 1.5 + Math.cos(angle) * distance}px`;
      spark.style.top = `${fighter.radius * 1.5 + Math.sin(angle) * distance}px`;
      spark.style.animationDelay = `${Math.random() * 240}ms`;
      aura.appendChild(spark);
    }
    return aura;
  }

  function createEnmaYamatoDim() {
    const dim = document.createElement("div");
    dim.className = "enma-yamato-dim";
    els.skillLayer.appendChild(dim);
    return dim;
  }

  function createEnmaYamatoTitle() {
    const title = document.createElement("div");
    title.className = "enma-yamato-title";
    const kicker = document.createElement("span");
    kicker.textContent = "궁극기";
    const name = document.createElement("strong");
    name.textContent = "염라참 · 황천일섬";
    title.append(kicker, name);
    els.skillLayer.appendChild(title);
    return title;
  }

  function createEnmaYamatoRepositionTrail(fromX, fromY, toX, toY, radius) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.hypot(dx, dy);
    if (distance < 6) return null;
    const angle = Math.atan2(dy, dx);
    const trail = createGasterLine(fromX, fromY, angle, distance, Math.max(18, radius * 1.15), "enma-yamato-reposition-trail");
    scheduleTimeout(() => removeElement(trail), 280);
    return trail;
  }

  function createEnmaYamatoCrescent(data) {
    const element = document.createElement("div");
    element.className = "enma-yamato-crescent-flight";
    const size = Math.max(120, Number(data.crescentSize) || Number(data.width) * 1.82 || 160);
    element.style.left = `${data.originX}px`;
    element.style.top = `${data.originY}px`;
    element.style.width = `${size}px`;
    element.style.height = `${size * 1.32}px`;
    element.style.setProperty("--angle", `${data.angle}rad`);
    element.style.setProperty("--travel", `${Math.max(1, data.length)}px`);
    element.style.setProperty("--size", `${size}px`);
    const core = document.createElement("span");
    core.className = "enma-yamato-crescent-core";
    element.appendChild(core);
    els.skillLayer.appendChild(element);
    return element;
  }

  function createEnmaYamatoExecutionMark(target) {
    const mark = createCircleEffect(target.x, target.y, target.radius * 4.25, "enma-yamato-execution-mark");
    const text = document.createElement("span");
    text.textContent = "斬";
    mark.appendChild(text);
    window.setTimeout(() => removeElement(mark), 760);
    return mark;
  }

  function createEnmaYamatoExecutionFlash() {
    const flash = document.createElement("div");
    flash.className = "enma-yamato-execution-flash";
    els.skillLayer.appendChild(flash);
    window.setTimeout(() => removeElement(flash), 420);
    return flash;
  }

  function getLastSubwayInitialAngle(fighter, opponent) {
    const currentSpeed = Math.hypot(fighter.vx || 0, fighter.vy || 0);
    let angle = currentSpeed > 1
      ? Math.atan2(fighter.vy, fighter.vx)
      : Math.atan2(fighter.y - opponent.y, fighter.x - opponent.x);
    if (!Number.isFinite(angle)) angle = Math.random() * Math.PI * 2;
    angle += 0.42;
    if (Math.abs(Math.cos(angle)) < 0.18) angle += 0.24;
    if (Math.abs(Math.sin(angle)) < 0.18) angle += 0.24;
    return angle;
  }

  function clampLastSubwayToArena(fighter) {
    const size = game.arenaSize || 560;
    const r = fighter.radius || game.fighterBaseRadius || 26;
    let hit = false;
    if (fighter.x - r < 0) {
      fighter.x = r;
      hit = true;
    } else if (fighter.x + r > size) {
      fighter.x = size - r;
      hit = true;
    }
    if (fighter.y - r < 0) {
      fighter.y = r;
      hit = true;
    } else if (fighter.y + r > size) {
      fighter.y = size - r;
      hit = true;
    }
    return hit;
  }

  function createLastSubwayTitle() {
    const title = document.createElement("div");
    title.className = "last-subway-title";
    const kicker = document.createElement("span");
    kicker.textContent = "궁극기";
    const name = document.createElement("strong");
    name.textContent = "종점 없는 막차";
    title.append(kicker, name);
    els.skillLayer.appendChild(title);
    scheduleTimeout(() => removeElement(title), 920);
    return title;
  }

  function createLastSubwayRouteSegment(fromX, fromY, toX, toY, data, className) {
    const now = getBattleNow();
    if (data.lastTrailAt && now - data.lastTrailAt < 34) return null;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.hypot(dx, dy);
    if (distance < 5) return null;
    data.lastTrailAt = now;
    const line = createGasterLine(fromX, fromY, Math.atan2(dy, dx), distance, Math.max(5, game.fighterBaseRadius * 0.18), className);
    if (data.effects) data.effects.push(line);
    scheduleTimeout(() => removeElement(line), className === "last-subway-final-line" ? 520 : 420);
    return line;
  }

  function createLastSubwayBounceEffect(fighter, count, data) {
    const shock = createCircleEffect(fighter.x, fighter.y, fighter.radius * (1.45 + count * 0.18), "last-subway-bounce-shock");
    const number = document.createElement("span");
    number.textContent = String(count);
    shock.appendChild(number);
    if (data.effects) data.effects.push(shock);
    scheduleTimeout(() => removeElement(shock), 520);
    return shock;
  }

  function createLastSubwayTrainSilhouette(fighter, data) {
    const element = createGasterLine(
      fighter.x - data.dashDirX * fighter.radius * 5.2,
      fighter.y - data.dashDirY * fighter.radius * 5.2,
      data.dashAngle,
      fighter.radius * 8.2,
      fighter.radius * 2.7,
      "last-subway-train-silhouette"
    );
    return element;
  }

  function updateLastSubwayTrainSilhouette(element, fighter, data) {
    if (!element || !fighter || !data) return;
    updateGasterLine(
      element,
      fighter.x - data.dashDirX * fighter.radius * 5.2,
      fighter.y - data.dashDirY * fighter.radius * 5.2,
      data.dashAngle,
      fighter.radius * 8.2,
      fighter.radius * 2.7
    );
  }

  function createLastSubwayArrivalEffect(target, data) {
    const effect = createCircleEffect(target.x, target.y, target.radius * 2.45, "last-subway-arrival-impact");
    const text = document.createElement("span");
    text.textContent = "종점 도착";
    effect.appendChild(text);
    if (data && data.effects) data.effects.push(effect);
    scheduleTimeout(() => removeElement(effect), 720);
    return effect;
  }

  function createLastSubwayStunEffect(target, duration) {
    const effect = createCircleEffect(target.x, target.y - target.radius * 0.95, target.radius * 0.82, "last-subway-stun");
    const text = document.createElement("span");
    text.textContent = "기절";
    effect.appendChild(text);
    scheduleTimeout(() => removeElement(effect), Math.max(480, Number(duration) || 1500));
    return effect;
  }

  function createBloodMoonCrescentFromData(data, className) {
    const element = document.createElement("div");
    element.className = `arena-line-effect ${className}`;
    els.skillLayer.appendChild(element);
    updateBloodMoonCrescentFromData(element, data);
    return element;
  }

  function updateBloodMoonCrescentFromData(element, data) {
    if (!element) return;
    const centerX = data.originX + data.dirX * data.traveled;
    const centerY = data.originY + data.dirY * data.traveled;
    const radius = data.crescentRadius || data.width * 2;
    const blade = data.crescentThickness || data.width * 0.36;
    element.style.width = `${radius * 2}px`;
    element.style.height = `${radius * 2}px`;
    element.style.left = `${centerX}px`;
    element.style.top = `${centerY}px`;
    element.style.setProperty("--blade", `${blade}px`);
    element.style.transform = `translate(-50%, -50%) rotate(${data.angle}rad)`;
  }

  function createBloodMoonLine(fighter, direction, skill, className) {
    const data = {
      originX: fighter.x,
      originY: fighter.y,
      dirX: direction.x,
      dirY: direction.y,
      angle: direction.angle,
      traveled: 0,
      length: game.arenaSize * (Number(skill.lengthRate) || 0.9),
      width: fighter.radius * (Number(skill.widthRate) || 0.8)
    };
    return createBloodMoonLineFromData(data, className);
  }

  function createBloodMoonLineFromData(data, className) {
    const element = document.createElement("div");
    element.className = `arena-line-effect ${className}`;
    els.skillLayer.appendChild(element);
    updateBloodMoonLineFromData(element, data);
    return element;
  }

  function updateBloodMoonLine(element, fighter, direction, skill) {
    if (!element) return;
    const data = {
      originX: fighter.x,
      originY: fighter.y,
      dirX: direction.x,
      dirY: direction.y,
      angle: direction.angle,
      traveled: 0,
      length: game.arenaSize * (Number(skill.lengthRate) || 0.9),
      width: fighter.radius * (Number(skill.widthRate) || 0.8)
    };
    updateBloodMoonLineFromData(element, data);
  }

  function updateBloodMoonLineFromData(element, data) {
    if (!element) return;
    const centerDistance = data.traveled + data.length / 2;
    const centerX = data.originX + data.dirX * centerDistance;
    const centerY = data.originY + data.dirY * centerDistance;
    element.style.width = `${data.length}px`;
    element.style.height = `${data.width}px`;
    element.style.left = `${centerX}px`;
    element.style.top = `${centerY}px`;
    element.style.transform = `translate(-50%, -50%) rotate(${data.angle}rad)`;
  }

  function createSlashBurst(fighter, radius) {
    const burst = createCircleEffect(fighter.x, fighter.y, radius, "slash-burst");
    scheduleTimeout(() => removeElement(burst), 260);
  }

  function createTeleportBurst(x, y, radius) {
    const burst = createCircleEffect(x, y, radius, "teleport-burst");
    scheduleTimeout(() => removeElement(burst), 360);
  }

  function createHealEffect(fighter, amount) {
    const effect = document.createElement("div");
    effect.className = "floating-heal";
    effect.textContent = `+${formatAmount(amount)}`;
    effect.style.left = `${fighter.x}px`;
    effect.style.top = `${fighter.y - fighter.radius - 10}px`;
    els.skillLayer.appendChild(effect);
    scheduleTimeout(() => removeElement(effect), 760);
  }

  function createDustBurst(x, y, radius) {
    const burst = createCircleEffect(x, y, radius, "dust-burst");
    scheduleTimeout(() => removeElement(burst), 820);
  }

  function createSansDodgeEffect(x, y, radius, className) {
    const burst = createCircleEffect(x, y, radius * 1.35, className);
    for (let i = 0; i < 8; i += 1) {
      const particle = document.createElement("span");
      particle.className = "sans-dodge-particle";
      const angle = Math.random() * Math.PI * 2;
      const distance = radius * (0.55 + Math.random() * 1.1);
      particle.style.left = `${radius * 1.35 + Math.cos(angle) * distance}px`;
      particle.style.top = `${radius * 1.35 + Math.sin(angle) * distance}px`;
      particle.style.animationDelay = `${Math.random() * 80}ms`;
      burst.appendChild(particle);
    }
    scheduleTimeout(() => removeElement(burst), 420);
  }

  function createBloodMoonHitEffect(fighter) {
    const burst = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.15, "bloodmoon-hit");
    scheduleTimeout(() => removeElement(burst), 420);
  }

  function createBloodMoonChargeAura(fighter) {
    const aura = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.35, "bloodmoon-charge-aura");
    for (let i = 0; i < 10; i += 1) {
      const particle = document.createElement("span");
      particle.className = "bloodmoon-charge-particle";
      const angle = (Math.PI * 2 * i) / 10;
      const distance = fighter.radius * (1.25 + Math.random() * 0.45);
      particle.style.left = `${fighter.radius * 1.35 + Math.cos(angle) * distance}px`;
      particle.style.top = `${fighter.radius * 1.35 + Math.sin(angle) * distance}px`;
      particle.style.animationDelay = `${Math.random() * 300}ms`;
      aura.appendChild(particle);
    }
    return aura;
  }

  function createBloodMoonLaunchBurst(fighter) {
    const burst = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.55, "bloodmoon-launch-burst");
    scheduleTimeout(() => removeElement(burst), 260);
  }

  function pulseArena() {
    els.arena.classList.add("shake");
    scheduleTimeout(() => els.arena.classList.remove("shake"), 180);
  }

  function createRampageAfterimage(fighter) {
    const effect = createCircleEffect(fighter.x, fighter.y, fighter.radius * 0.95, "rampage-afterimage");
    scheduleTimeout(() => removeElement(effect), 420);
    return effect;
  }

  function createSpeedStackText(fighter, amount = 0.25) {
    const effect = document.createElement("div");
    effect.className = "speed-stack-text";
    effect.textContent = `속도 +${formatAmount(amount)} / 공격력 상승`;
    effect.style.left = `${fighter.x}px`;
    effect.style.top = `${fighter.y - fighter.radius - 16}px`;
    els.skillLayer.appendChild(effect);
    scheduleTimeout(() => removeElement(effect), 760);
  }

  function createAttackBoostText(fighter, text, isMax = false) {
    const effect = document.createElement("div");
    effect.className = `attack-boost-text${isMax ? " max" : ""}`;
    effect.textContent = text;
    effect.style.left = `${fighter.x}px`;
    effect.style.top = `${fighter.y - fighter.radius - 22}px`;
    els.skillLayer.appendChild(effect);
    scheduleTimeout(() => removeElement(effect), 760);
  }

  function handleOiiaDivision(entity, now) {
    if (!entity || entity.dead || entity.removing || entity.abilityType !== "oiiaDivision") return false;
    const owner = entity.isOiiaClone ? getFighterById(entity.ownerId) : entity;
    const cloneCount = getOwnedOiiaSummons(owner || entity).length;
    if (cloneCount >= OIIA_MAX_CLONES) {
      const targetClone = entity.isOiiaClone ? entity : getNearestOwnedOiiaClone(entity);
      if (targetClone) {
        strengthenOiiaClone(targetClone, now);
        return true;
      }
      return false;
    }
    const clone = createOiiaClone(entity, now);
    if (!clone) return false;
    createOiiaSpawnEffect(clone);
    return true;
  }

  function createOiiaClone(parent, now) {
    const hp = Math.max(1, Math.floor(parent.currentHp / 4));
    const baseRadius = getOiiaBaseRadius(parent);
    const cloneRadius = getOiiaRadiusForHp(hp, baseRadius);
    const position = findOiiaCloneSpawnPosition(parent, cloneRadius);
    if (!position) return null;

    const side = parent.side || parent.ownerSide;
    const clone = {
      id: `oiia-clone-${++game.summonCounter}`,
      type: "oiiaClone",
      isOiiaClone: true,
      side,
      ownerSide: side,
      ownerId: parent.ownerId || parent.id,
      name: "Oiia Cat 분신",
      abilityType: "oiiaDivision",
      maxHp: hp,
      currentHp: hp,
      atk: 1,
      def: 1,
      speed: Number(parent.speed) || Number(parent.data && parent.data.speed) || 4.8,
      baseRadius,
      oiiaBaseRadius: baseRadius,
      sizeScale: getOiiaSizeScaleForHp(hp),
      speedMultiplier: 1,
      slowMultiplier: 1,
      damageReduction: 0,
      radius: cloneRadius,
      x: position.x,
      y: position.y,
      vx: 0,
      vy: 0,
      wallHits: 0,
      divisionWallContacts: new Set(),
      contactTargetIds: new Set(),
      bornAt: now,
      canHitAt: now + OIIA_CLONE_GRACE_MS,
      lastBodyDamageAt: 0,
      removing: false,
      removeAt: 0,
      removeReason: "",
      dead: false,
      element: createOiiaCloneElement(side, parent)
    };

    const angle = Math.atan2(position.y - parent.y, position.x - parent.x) + (Math.random() - 0.5) * 0.8;
    setVelocityFromAngle(clone, Number.isFinite(angle) ? angle : Math.random() * Math.PI * 2, 1);
    game.summons.push(clone);
    placeSummonElement(clone);
    return clone;
  }

  function createOiiaCloneElement(side, parent) {
    const element = document.createElement("div");
    element.className = `oiia-clone clone-${String(side).toLowerCase()}`;
    const imageSrc = getOiiaCloneImageSource(parent);
    if (imageSrc) {
      const image = document.createElement("img");
      image.className = "oiia-clone-image";
      image.src = imageSrc;
      image.alt = "";
      image.draggable = false;
      image.onerror = () => {
        element.classList.remove("has-clone-image");
        removeElement(image);
      };
      element.classList.add("has-clone-image");
      element.appendChild(image);
    }
    const mark = document.createElement("span");
    mark.className = "oiia-clone-mark";
    mark.textContent = "O";
    const hp = document.createElement("span");
    hp.className = "summon-hp";
    const fill = document.createElement("i");
    hp.appendChild(fill);
    element.append(mark, hp);
    els.arena.appendChild(element);
    return element;
  }

  function getOiiaCloneImageSource(parent) {
    if (!parent) return "";
    const owner = parent.ownerId ? getFighterById(parent.ownerId) : null;
    return parent.image || (parent.data && parent.data.image) || (owner && (owner.image || (owner.data && owner.data.image))) || "";
  }

  function strengthenOiiaClone(clone, now) {
    if (!clone || !clone.isOiiaClone || clone.dead || clone.removing) return false;
    clone.maxHp *= 1.5;
    clone.currentHp *= 1.5;
    clone.strengthLevel = (Number(clone.strengthLevel) || 0) + 1;
    refreshOiiaSize(clone);
    if (clone.element) clone.element.classList.add("strengthened");
    createOiiaStrengthenEffect(clone);
    addLog(`${clone.name} 체력 50% 강화`, "good");
    return true;
  }

  function getNearestOwnedOiiaClone(owner) {
    let best = null;
    getOwnedOiiaSummons(owner).forEach((clone) => {
      const distance = Math.hypot(clone.x - owner.x, clone.y - owner.y);
      if (!best || distance < best.distance) best = { clone, distance };
    });
    return best ? best.clone : null;
  }

  function isOiiaEntity(entity) {
    return entity && entity.abilityType === "oiiaDivision";
  }

  function getOiiaBaseRadius(entity) {
    return Number(entity && (entity.oiiaBaseRadius || entity.baseRadius)) || game.fighterBaseRadius || 26;
  }

  function getOiiaSizeScaleForHp(hp) {
    const ratio = Math.max(0, Number(hp) || 0) / OIIA_REFERENCE_HP;
    return clamp(Math.sqrt(ratio), OIIA_MIN_SIZE_SCALE, OIIA_MAX_SIZE_SCALE);
  }

  function getOiiaRadiusForHp(hp, baseRadius) {
    return getOiiaBaseRadius({ oiiaBaseRadius: baseRadius }) * getOiiaSizeScaleForHp(hp);
  }

  function refreshOiiaSize(entity) {
    if (!isOiiaEntity(entity)) return;
    const previousRadius = entity.radius || getOiiaBaseRadius(entity);
    entity.sizeScale = getOiiaSizeScaleForHp(entity.currentHp);
    entity.radius = getOiiaBaseRadius(entity) * entity.sizeScale;
    if (Math.abs(previousRadius - entity.radius) > 0.01) {
      keepInsideArena(entity);
      separateEntityFromCircleWalls(entity);
    }
  }

  function separateEntityFromCircleWalls(entity) {
    if (!entity || !Number.isFinite(entity.radius)) return;
    game.arenaObjects.forEach((wall) => {
      if (wall.type !== "circleWall") return;
      let dx = entity.x - wall.x;
      let dy = entity.y - wall.y;
      let distance = Math.hypot(dx, dy);
      if (distance === 0) {
        dx = entity.vx || 1;
        dy = entity.vy || 0;
        distance = Math.hypot(dx, dy) || 1;
      }
      const signedDistance = distance - wall.radius;
      if (Math.abs(signedDistance) >= entity.radius) return;
      const side = signedDistance >= 0 ? 1 : -1;
      const targetDistance = wall.radius + side * entity.radius;
      entity.x = wall.x + (dx / distance) * targetDistance;
      entity.y = wall.y + (dy / distance) * targetDistance;
      keepInsideArena(entity);
    });
  }

  function findOiiaCloneSpawnPosition(parent, radius) {
    const baseAngle = Math.atan2(parent.vy || 0, parent.vx || 1);
    const startDistance = parent.radius + radius + 7;
    const rings = [startDistance, startDistance + radius + 8, startDistance + radius * 2 + 18];

    for (let ring = 0; ring < rings.length; ring += 1) {
      const distance = rings[ring];
      for (let i = 0; i < 18; i += 1) {
        const angle = baseAngle + (Math.PI * 2 * i) / 18 + ring * 0.33;
        const x = parent.x + Math.cos(angle) * distance;
        const y = parent.y + Math.sin(angle) * distance;
        if (isSafeOiiaClonePosition(x, y, radius, parent)) {
          return { x, y };
        }
      }
    }

    return null;
  }

  function isSafeOiiaClonePosition(x, y, radius, parent) {
    if (x - radius < 0 || x + radius > game.arenaSize || y - radius < 0 || y + radius > game.arenaSize) {
      return false;
    }

    const bodies = [game.fighters.A, game.fighters.B].concat(game.summons);
    for (const body of bodies) {
      if (!body || body.dead || isFighterOutOfBattle(body)) continue;
      const minDistance = radius + body.radius + (body === parent ? 6 : 4);
      if (Math.hypot(x - body.x, y - body.y) < minDistance) return false;
    }

    return game.arenaObjects.every((object) => {
      if (object.type !== "circleWall") return true;
      return Math.abs(Math.hypot(x - object.x, y - object.y) - object.radius) >= radius + 5;
    });
  }

  function createOiiaSpawnEffect(clone) {
    const burst = createCircleEffect(clone.x, clone.y, clone.radius * 1.35, "oiia-spawn");
    scheduleTimeout(() => removeElement(burst), 420);
  }

  function createOiiaStrengthenEffect(clone) {
    const pulse = createCircleEffect(clone.x, clone.y, clone.radius * 1.6, "oiia-strengthen");
    scheduleTimeout(() => removeElement(pulse), 520);
  }

  function createOiiaCloneHealEffect(clone, owner, healed) {
    const line = createGasterLine(
      clone.x,
      clone.y,
      Math.atan2(owner.y - clone.y, owner.x - clone.x),
      Math.max(10, Math.hypot(owner.x - clone.x, owner.y - clone.y)),
      Math.max(4, clone.radius * 0.28),
      "oiia-heal-link"
    );
    const aura = createCircleEffect(owner.x, owner.y, owner.radius * 1.22, "oiia-heal-aura");
    const text = document.createElement("div");
    text.className = "floating-heal oiia-clone-heal-text";
    text.textContent = `+${formatAmount(healed)}`;
    text.style.left = `${owner.x}px`;
    text.style.top = `${owner.y - owner.radius - 12}px`;
    els.skillLayer.appendChild(text);
    scheduleTimeout(() => removeElement(line), 320);
    scheduleTimeout(() => removeElement(aura), 520);
    scheduleTimeout(() => removeElement(text), 760);
  }

  function startOiiaSummonRemoval(summon, reason = "zero", now = getBattleNow(), target = null, damageAmount = 0) {
    if (!summon || summon.removing) return;
    summon.dead = true;
    summon.removing = true;
    summon.removeReason = reason;
    summon.removeAt = now + (OIIA_REMOVE_DURATIONS[reason] || OIIA_REMOVE_DURATIONS.zero);
    summon.vx = 0;
    summon.vy = 0;
    summon.slowMultiplier = 1;
    summon.slowUntil = 0;
    removeElement(summon.slowEffect);
    summon.slowEffect = null;
    clearMaugaBurns(summon);
    if (summon.divisionWallContacts) {
      summon.divisionWallContacts.clear();
    }
    if (summon.element) {
      summon.element.classList.add("removing", `remove-${reason}`);
      summon.element.classList.remove("slowed");
    }

    createOiiaZeroEffect(summon);
  }

  function clearSummonReferences(summon) {
    clearBlueEyesDebuffs(summon);
    game.arenaObjects.forEach((object) => {
      if (object.initialContactIds) {
        object.initialContactIds.delete(summon.id);
      }
    });
    if (summon.divisionWallContacts) {
      summon.divisionWallContacts.clear();
    }
    if (summon.contactTargetIds) {
      summon.contactTargetIds.clear();
    }
  }

  function createDamageNumber(target, amount) {
    const effect = document.createElement("div");
    effect.className = "floating-damage";
    effect.textContent = `-${formatAmount(amount)}`;
    effect.style.left = `${target.x}px`;
    effect.style.top = `${target.y - target.radius - 12}px`;
    els.skillLayer.appendChild(effect);
    scheduleTimeout(() => removeElement(effect), 760);
  }

  function createOiiaZeroEffect(clone) {
    const crack = createCircleEffect(clone.x, clone.y, clone.radius * 1.25, "oiia-zero");
    addOiiaFragments(crack, 6);
    scheduleTimeout(() => removeElement(crack), 520);
  }

  function createOiiaVanishEffect(clone) {
    startOiiaSummonRemoval(clone, "zero", getBattleNow());
  }

  function addOiiaFragments(effect, count) {
    for (let i = 0; i < count; i += 1) {
      const piece = document.createElement("span");
      piece.className = "oiia-fragment";
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const distance = 38 + Math.random() * 34;
      piece.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      piece.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
      piece.style.setProperty("--spin", `${(Math.random() - 0.5) * 220}deg`);
      piece.style.animationDelay = `${Math.random() * 80}ms`;
      effect.appendChild(piece);
    }
  }

  function createTemporaryCircleWall(x, y, radius, duration, fadeDuration, owner) {
    const element = createCircleEffect(x, y, radius, "temporary-circle-wall");
    decorateStoneWall(element, radius);
    createStoneDebris(x, y, radius, "stone-rise-dust", 18);
    const now = getBattleNow();
    const id = `wall-${now.toFixed(3)}-${Math.random().toString(16).slice(2)}`;
    const object = {
      type: "circleWall",
      id,
      x,
      y,
      radius,
      element,
      ownerSide: owner ? owner.side : "",
      ownerId: owner ? owner.id : "",
      initialContactIds: new Set(),
      expiresAt: now + duration,
      fadeStartAt: now + Math.max(0, duration - fadeDuration),
      fadeStarted: false
    };
    markInitialWallContacts(object);
    game.arenaObjects.push(object);
    scheduleTimeout(() => removeArenaObject(object), duration);
    return object;
  }

  function useBattlefieldCompression(fighter, skill, now) {
    const state = fighter.skillState;
    if (getActiveBattlefieldCompressionWall(fighter)) {
      restoreStoredVelocity(fighter, state);
      fighter.skillState = null;
      return;
    }
    const wall = createBattlefieldCompressionWall(fighter, skill, now);
    fighter.battlefieldCompressionWallId = wall ? wall.id : "";
    showBattlefieldCompressionTitle();
    restoreStoredVelocity(fighter, state);
    fighter.skillState = null;
    fighter.recoveryUntil = now + 80;
    fighter.recoverySkill = skill;
    getFighterElement(fighter).classList.remove("casting");
    addLog(`${fighter.name} 전장 압축`, "skill");
  }

  function createBattlefieldCompressionWall(owner, skill, now = getBattleNow()) {
    const size = game.arenaSize || 560;
    const thickness = clamp((owner.radius || game.fighterBaseRadius || 26) * (Number(skill.wallThicknessRate) || 0.9), owner.radius * 0.7, owner.radius * 1.05);
    const length = size;
    const directions = ["west", "east", "north", "south"];
    const side = directions[Math.floor(Math.random() * directions.length)];
    const isVertical = side === "west" || side === "east";
    const warningDelay = 500;
    const moveDuration = Math.max(250, Number(skill.moveDuration) || 800);
    const holdDuration = Math.max(500, Number(skill.duration) || 5000);
    const fadeDuration = 520;
    const id = `compression-wall-${owner.id}-${Math.round(now)}-${Math.random().toString(16).slice(2)}`;
    let startX = size / 2;
    let startY = size / 2;
    let endX = size / 2;
    let endY = size / 2;
    let dirX = 0;
    let dirY = 0;
    let width = isVertical ? thickness : length;
    let height = isVertical ? length : thickness;

    if (side === "west") {
      startX = thickness / 2;
      endX = size * 0.5 - thickness / 2;
      startY = size / 2;
      endY = size / 2;
      dirX = 1;
    } else if (side === "east") {
      startX = size - thickness / 2;
      endX = size * 0.5 + thickness / 2;
      startY = size / 2;
      endY = size / 2;
      dirX = -1;
    } else if (side === "north") {
      startX = size / 2;
      endX = size / 2;
      startY = thickness / 2;
      endY = size * 0.5 - thickness / 2;
      dirY = 1;
    } else {
      startX = size / 2;
      endX = size / 2;
      startY = size - thickness / 2;
      endY = size * 0.5 + thickness / 2;
      dirY = -1;
    }

    const element = document.createElement("div");
    element.className = `battlefield-compression-wall ${side} pending`;
    els.skillLayer.appendChild(element);
    const object = {
      type: "compressionWall",
      id,
      ownerSide: owner.side,
      ownerId: owner.id,
      direction: side,
      x: startX,
      y: startY,
      startX,
      startY,
      endX,
      endY,
      dirX,
      dirY,
      width,
      height,
      thickness,
      length,
      element,
      initialContactIds: new Set(),
      createdAt: now,
      activeAt: now + warningDelay,
      bornAt: now + warningDelay,
      movingUntil: now + warningDelay + moveDuration,
      fadeStartAt: now + warningDelay + moveDuration + holdDuration,
      expiresAt: now + warningDelay + moveDuration + holdDuration + fadeDuration,
      fadeStarted: false,
      lastDustAt: 0,
      stopEffectCreated: false
    };
    updateCompressionWallElement(object);
    createCompressionWarning(object);
    game.arenaObjects.push(object);
    scheduleTimeout(() => {
      if (!game.arenaObjects.includes(object)) return;
      markInitialCompressionWallContacts(object);
      if (object.element) object.element.classList.remove("pending");
      createStoneDebris(object.x, object.y, Math.max(object.thickness * 1.5, 22), "stone-rise-dust", 14);
    }, warningDelay);
    scheduleTimeout(() => removeArenaObject(object), warningDelay + moveDuration + holdDuration + fadeDuration + 60);
    return object;
  }

  function updateCompressionWallObject(object, now) {
    if (!object || object.type !== "compressionWall") return;
    if (now < object.activeAt) {
      updateCompressionWallElement(object);
      return;
    }
    if (object.element) object.element.classList.remove("pending");
    if (now < object.movingUntil) {
      const duration = Math.max(1, object.movingUntil - object.bornAt);
      const progress = clamp((now - object.bornAt) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 2.2);
      object.x = object.startX + (object.endX - object.startX) * eased;
      object.y = object.startY + (object.endY - object.startY) * eased;
      if (!object.lastDustAt || now - object.lastDustAt > 95) {
        object.lastDustAt = now;
        createCompressionMoveDust(object);
      }
    } else {
      object.x = object.endX;
      object.y = object.endY;
      if (!object.stopEffectCreated) {
        object.stopEffectCreated = true;
        createCompressionStopEffect(object);
      }
    }
    updateCompressionWallElement(object);
  }

  function updateCompressionWallElement(object) {
    if (!object || !object.element) return;
    object.element.style.width = `${object.width}px`;
    object.element.style.height = `${object.height}px`;
    object.element.style.left = `${object.x}px`;
    object.element.style.top = `${object.y}px`;
    object.element.style.transform = "translate(-50%, -50%)";
  }

  function createCompressionWarning(object) {
    const warning = document.createElement("div");
    warning.className = `battlefield-compression-warning ${object.direction}`;
    warning.style.width = `${object.width}px`;
    warning.style.height = `${object.height}px`;
    warning.style.left = `${object.startX}px`;
    warning.style.top = `${object.startY}px`;
    warning.style.transform = "translate(-50%, -50%)";
    els.skillLayer.appendChild(warning);
    scheduleTimeout(() => removeElement(warning), 520);
  }

  function showBattlefieldCompressionTitle() {
    const title = document.createElement("div");
    title.className = "battlefield-compression-title";
    title.textContent = "전장 압축";
    els.skillLayer.appendChild(title);
    scheduleTimeout(() => removeElement(title), 760);
  }

  function createCompressionMoveDust(object) {
    const radius = Math.max(object.thickness * 1.1, 16);
    const x = object.x - object.dirX * object.width * 0.5;
    const y = object.y - object.dirY * object.height * 0.5;
    createStoneDebris(x, y, radius, "compression-move-dust", 7);
  }

  function createCompressionStopEffect(object) {
    const radius = Math.max(object.thickness * 1.8, 24);
    createStoneDebris(object.x, object.y, radius, "stone-rise-dust", 16);
    if (els.arena) {
      els.arena.classList.add("shake");
      scheduleTimeout(() => els.arena && els.arena.classList.remove("shake"), 170);
    }
  }

  function createCompressionCollapseEffect(object) {
    const radius = Math.max(object.thickness * 2.2, 26);
    const pieces = Math.max(18, Math.round(object.length / 14));
    createStoneDebris(object.x, object.y, radius, "stone-collapse-dust", pieces);
  }

  function markInitialCompressionWallContacts(wall) {
    const bodies = [game.fighters.A, game.fighters.B].concat(game.summons);
    bodies.forEach((body) => {
      if (!body || body.dead || isFighterOutOfBattle(body)) return;
      if (getCircleRectCollision(body.x, body.y, body.radius, wall)) {
        wall.initialContactIds.add(body.id);
      }
    });
  }

  function getActiveBattlefieldCompressionWall(fighter) {
    if (!fighter) return null;
    return game.arenaObjects.find((object) => (
      object.type === "compressionWall" &&
      object.ownerId === fighter.id &&
      !object.fadeStarted
    )) || null;
  }

  function clearBattlefieldCompressionWall(fighter) {
    if (!fighter) return;
    game.arenaObjects.slice().forEach((object) => {
      if (object.type === "compressionWall" && object.ownerId === fighter.id) {
        removeArenaObject(object);
      }
    });
    fighter.battlefieldCompressionWallId = "";
  }

  function markInitialWallContacts(wall) {
    const bodies = [game.fighters.A, game.fighters.B].concat(game.summons);
    bodies.forEach((body) => {
      if (!body || body.dead || isFighterOutOfBattle(body)) return;
      if (Math.abs(Math.hypot(body.x - wall.x, body.y - wall.y) - wall.radius) < body.radius) {
        wall.initialContactIds.add(body.id);
      }
    });
  }

  function decorateStoneWall(element, radius) {
    const pieceCount = Math.round(clamp(radius / 3.7, 22, 34));
    for (let i = 0; i < pieceCount; i += 1) {
      const piece = document.createElement("span");
      piece.className = "wall-stone-piece";
      const angle = (Math.PI * 2 * i) / pieceCount + (Math.random() - 0.5) * 0.09;
      const ringRadius = radius * (0.96 + Math.random() * 0.06);
      const width = clamp(radius * (0.18 + Math.random() * 0.08), 16, 30);
      const height = clamp(radius * (0.1 + Math.random() * 0.05), 10, 19);
      const rotation = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.42;
      const brightness = 0.82 + Math.random() * 0.28;
      piece.style.width = `${width}px`;
      piece.style.height = `${height}px`;
      piece.style.left = `${radius + Math.cos(angle) * ringRadius}px`;
      piece.style.top = `${radius + Math.sin(angle) * ringRadius}px`;
      piece.style.transform = `translate(-50%, -50%) rotate(${rotation}rad)`;
      piece.style.filter = `brightness(${brightness})`;
      piece.style.animationDelay = `${Math.random() * 110}ms`;
      element.appendChild(piece);
    }
  }

  function createStoneDebris(x, y, radius, className, count) {
    const debris = document.createElement("div");
    debris.className = `stone-debris ${className}`;
    debris.style.width = `${radius * 2}px`;
    debris.style.height = `${radius * 2}px`;
    debris.style.left = `${x - radius}px`;
    debris.style.top = `${y - radius}px`;

    for (let i = 0; i < count; i += 1) {
      const chip = document.createElement("span");
      chip.className = "stone-chip";
      const angle = Math.random() * Math.PI * 2;
      const startDistance = radius * (0.78 + Math.random() * 0.3);
      const travel = radius * (0.08 + Math.random() * 0.18);
      const size = clamp(radius * (0.04 + Math.random() * 0.035), 4, 9);
      chip.style.width = `${size}px`;
      chip.style.height = `${size * (0.7 + Math.random() * 0.55)}px`;
      chip.style.left = `${radius + Math.cos(angle) * startDistance}px`;
      chip.style.top = `${radius + Math.sin(angle) * startDistance}px`;
      chip.style.setProperty("--dx", `${Math.cos(angle) * travel}px`);
      chip.style.setProperty("--dy", `${Math.sin(angle) * travel + (className === "stone-collapse-dust" ? 16 : -8)}px`);
      chip.style.setProperty("--spin", `${(Math.random() - 0.5) * 180}deg`);
      chip.style.animationDelay = `${Math.random() * 90}ms`;
      debris.appendChild(chip);
    }

    els.skillLayer.appendChild(debris);
    scheduleTimeout(() => removeElement(debris), className === "stone-collapse-dust" ? 920 : 720);
  }

  function removeArenaObject(object) {
    removeElement(object.element);
    Object.values(game.fighters).forEach((fighter) => {
      if (fighter && fighter.duelDefenseWallId === object.id) {
        clearJarvanDuelDefense(fighter);
      }
      if (fighter && fighter.skillWallContacts) {
        fighter.skillWallContacts.delete(object.id);
      }
      if (fighter && fighter.divisionWallContacts) {
        fighter.divisionWallContacts.delete(object.id);
      }
      if (fighter && fighter.maugaCage && fighter.maugaCage.objectId === object.id) {
        fighter.maugaCage = null;
        getFighterElement(fighter).classList.remove("mauga-cage-active");
      }
      if (fighter && fighter.battlefieldCompressionWallId === object.id) {
        fighter.battlefieldCompressionWallId = "";
      }
    });
    game.summons.forEach((summon) => {
      if (summon.divisionWallContacts) {
        summon.divisionWallContacts.delete(object.id);
      }
    });
    game.arenaObjects = game.arenaObjects.filter((item) => item !== object);
  }

  function moveFighter(fighter, dt, now) {
    if (fighter.dead) return;
    if (isFighterOutOfBattle(fighter)) return;
    if (isGojoDomainLocked(fighter, now)) return;
    if (isFighterStunned(fighter, now)) return;
    if (fighter.telekinesisControlled) return;
    if (fighter.skillState && !allowsMovementDuringSkill(fighter.skillState)) return;

    const motionRate = fighter.recoveryUntil > now ? RECOVERY_SPEED_RATE : 1;
    steerChainsawSawSpinApproach(fighter, now);
    fighter.x += fighter.vx * dt * motionRate;
    fighter.y += fighter.vy * dt * motionRate;
    const wallResult = resolveWallCollision(fighter, now);
    if (wallResult === "skill-stop") return;

    if (game.trainingMode && Math.hypot(fighter.vx || 0, fighter.vy || 0) < 0.01) return;
    normalizeVelocity(fighter, getMovementNormalizeSpeed(fighter));
  }

  function steerChainsawSawSpinApproach(fighter, now = getBattleNow()) {
    if (!fighter || fighter.abilityType !== "chainsawDevil") return;
    const spin = fighter.chainsawSpin;
    if (!spin || now >= spin.endAt) return;
    const target = getOpposingFighter(fighter.side);
    if (!target || target.dead || isFighterOutOfBattle(target)) return;
    const dx = target.x - fighter.x;
    const dy = target.y - fighter.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 1) return;
    const desiredRange = Math.max(
      fighter.radius + target.radius + 10,
      Math.max(Number(spin.halfWidth) || fighter.radius * 3.85, Number(spin.halfHeight) || fighter.radius * 2.75) * 0.86
    );
    if (distance <= desiredRange) return;
    const speed = getMovementNormalizeSpeed(fighter);
    const blend = 0.18;
    fighter.vx = fighter.vx * (1 - blend) + (dx / distance) * speed * blend;
    fighter.vy = fighter.vy * (1 - blend) + (dy / distance) * speed * blend;
  }

  function allowsMovementDuringSkill(skillState) {
    if (skillState && skillState.skill && skillState.skill.type === "muzanNeuralShockwave") return true;
    if (
      skillState &&
      skillState.phase === "active" &&
      skillState.skill &&
      skillState.skill.type === "chainsawHellArena" &&
      skillState.data &&
      skillState.data.phase === "center-dash"
    ) {
      return true;
    }
    return skillState.phase === "active" && (
      skillState.skill.type === "threeLegRampage" ||
      skillState.skill.type === "deepSeaAmbush" ||
      skillState.skill.type === "maugaGuns" ||
      skillState.skill.type === "maugaOverrun" ||
      skillState.skill.type === "ronaldoFreeKick" ||
      skillState.skill.type === "monkMeditation" ||
      skillState.skill.type === "enlightenmentField" ||
      skillState.skill.type === "blueEyesWrathDestruction"
    );
  }

  function getMovementNormalizeSpeed(fighter) {
    const state = fighter && fighter.skillState;
    if (
      state &&
      state.phase === "active" &&
      state.skill &&
      state.skill.type === "chainsawHellArena" &&
      state.data &&
      state.data.phase === "center-dash"
    ) {
      return Math.max(getPixelSpeed(fighter), Number(state.data && state.data.dashSpeed) || Math.hypot(fighter.vx || 0, fighter.vy || 0) || getPixelSpeed(fighter));
    }
    return getPixelSpeed(fighter);
  }

  function shouldClampSkillMovementAtArenaWall(fighter) {
    const state = fighter && fighter.skillState;
    if (!state || state.phase !== "active" || !state.skill) return false;
    return state.skill.type === "chainsawHellArena" && state.data && state.data.phase === "center-dash";
  }

  function clampSkillMovementAtArenaWall(fighter) {
    const size = game.arenaSize;
    let touched = false;
    if (fighter.x - fighter.radius < 0) {
      fighter.x = fighter.radius;
      touched = true;
    } else if (fighter.x + fighter.radius > size) {
      fighter.x = size - fighter.radius;
      touched = true;
    }
    if (fighter.y - fighter.radius < 0) {
      fighter.y = fighter.radius;
      touched = true;
    } else if (fighter.y + fighter.radius > size) {
      fighter.y = size - fighter.radius;
      touched = true;
    }
    if (!touched) return false;
    fighter.vx = 0;
    fighter.vy = 0;
    if (fighter.skillState && fighter.skillState.data) fighter.skillState.data.forcedWallStop = true;
    return true;
  }

  function resolveWallCollision(fighter, now = getBattleNow()) {
    if (shouldClampSkillMovementAtArenaWall(fighter) && clampSkillMovementAtArenaWall(fighter)) {
      return "skill-stop";
    }
    const size = game.arenaSize;
    let bounced = false;

    if (fighter.x - fighter.radius < 0) {
      fighter.x = fighter.radius;
      fighter.vx = Math.abs(fighter.vx);
      bounced = true;
    } else if (fighter.x + fighter.radius > size) {
      fighter.x = size - fighter.radius;
      fighter.vx = -Math.abs(fighter.vx);
      bounced = true;
    }

    if (fighter.y - fighter.radius < 0) {
      fighter.y = fighter.radius;
      fighter.vy = Math.abs(fighter.vy);
      bounced = true;
    } else if (fighter.y + fighter.radius > size) {
      fighter.y = size - fighter.radius;
      fighter.vy = -Math.abs(fighter.vy);
      bounced = true;
    }

    if (bounced) {
      onWallBounce(fighter, now);
      handleMonkWallCrash(fighter, now);
      handleGojoRedWallCrash(fighter, now);
    }
    return bounced;
  }

  function onWallBounce(fighter, now = getBattleNow()) {
    fighter.wallHits = (fighter.wallHits || 0) + 1;

    applyJarvanAttackGrowth(fighter, 2, "공격력 +2");
    handleOiiaDivision(fighter, now);
  }

  function applyJarvanAttackGrowth(fighter, amount, boostText) {
    if (fighter.abilityType !== "jarvanTimedWall") return false;
    const before = fighter.bonusAtkFromWalls;
    const baseAtk = Number(fighter.data.atk) || 0;
    const maxBonus = Math.max(0, JARVAN_MAX_ATK - baseAtk);
    if (before >= maxBonus) return false;
    fighter.bonusAtkFromWalls = Math.min(maxBonus, fighter.bonusAtkFromWalls + amount);
    fighter.atk = Math.min(JARVAN_MAX_ATK, baseAtk + fighter.bonusAtkFromWalls);
    if (fighter.bonusAtkFromWalls > before) {
      const reachedMax = before < maxBonus && fighter.bonusAtkFromWalls >= maxBonus;
      createAttackBoostText(fighter, reachedMax ? "공격력 최대치 84" : boostText, reachedMax);
      if (reachedMax) {
        addLog(`${fighter.name} 공격력 최대치 84`, "skill");
      }
      updateStats(fighter.side, fighter);
      return true;
    }
    return false;
  }

  function resolveCircleCollision(a, b, now) {
    if (isFighterCollisionSuppressed(a, now) || isFighterCollisionSuppressed(b, now)) {
      clearRampageCollisionContact(a, b);
      clearBlueEyesCollisionContact(a, b);
      return;
    }
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    let distance = Math.hypot(dx, dy);
    const minDistance = a.radius + b.radius;

    if (distance >= minDistance) {
      clearRampageCollisionContact(a, b);
      clearBlueEyesCollisionContact(a, b);
      return;
    }

    if (distance === 0) {
      distance = 0.001;
    }

    const nx = dx / distance;
    const ny = dy / distance;
    const overlap = minDistance - distance;

    // 겹친 만큼 서로 반대 방향으로 밀어내 끼임과 떨림을 줄입니다.
    a.x -= nx * overlap * 0.5;
    a.y -= ny * overlap * 0.5;
    b.x += nx * overlap * 0.5;
    b.y += ny * overlap * 0.5;
    keepInsideArena(a);
    keepInsideArena(b);

    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;
    const velocityAlongNormal = rvx * nx + rvy * ny;

    if (velocityAlongNormal < 0) {
      const massA = getMass(a);
      const massB = getMass(b);
      const impulse = (-(1 + RESTITUTION) * velocityAlongNormal) / (1 / massA + 1 / massB);
      const impulseX = impulse * nx;
      const impulseY = impulse * ny;
      a.vx -= impulseX / massA;
      a.vy -= impulseY / massA;
      b.vx += impulseX / massB;
      b.vy += impulseY / massB;
    }

    normalizeVelocity(a, getPixelSpeed(a));
    normalizeVelocity(b, getPixelSpeed(b));
    handleRampageCollisionStack(a, b, now);
    handleRampageCollisionStack(b, a, now);
    handleMonkComboCollision(a, b, now);
    handleMonkComboCollision(b, a, now);

    const bodyDamageCooldown = getBodyDamageCooldown(a, b, now);
    if (!a.telekinesisControlled && !b.telekinesisControlled && !isShadowDashBodyDamageSuppressed(a, now) && !isShadowDashBodyDamageSuppressed(b, now) && now - game.lastBodyDamageAt >= bodyDamageCooldown) {
      game.lastBodyDamageAt = now;
      const aDamage = applyDamage(a, b, {
        label: "충돌",
        isCollision: true,
        damageKind: "기본 충돌",
        attackId: `body-${a.id}-${b.id}-${Math.floor(now)}`
      });
      const bDamage = applyDamage(b, a, {
        label: "충돌",
        isCollision: true,
        damageKind: "기본 충돌",
        attackId: `body-${b.id}-${a.id}-${Math.floor(now)}`
      });
      grantBlueEyesBodyCollisionStack(a, b, aDamage, now);
      grantBlueEyesBodyCollisionStack(b, a, bDamage, now);
      handleChainsawBodyCollision(a, b, aDamage, now);
      handleChainsawBodyCollision(b, a, bDamage, now);
    }
  }

  function getBodyDamageCooldown(a, b, now) {
    return hasBlueEyesAttackHaste(a, now) || hasBlueEyesAttackHaste(b, now)
      ? Math.max(180, BODY_DAMAGE_COOLDOWN / 1.4)
      : BODY_DAMAGE_COOLDOWN;
  }

  function isMainBattleFighter(entity) {
    return !!(entity && !entity.isOiiaClone && (entity.side === "A" || entity.side === "B") && game.fighters[entity.side] === entity);
  }

  function grantBlueEyesBodyCollisionStack(attacker, defender, actualDamage, now) {
    if (actualDamage <= 0) return;
    if (!isMainBattleFighter(attacker) || !isMainBattleFighter(defender)) return;
    if (!isBlueEyesFighter(attacker) || attacker.blueEyesEvolved || attacker.blueEyesEvolutionUsed) return;
    if (!attacker.blueEyesBodyContactIds) attacker.blueEyesBodyContactIds = new Set();
    if (attacker.blueEyesBodyContactIds.has(defender.id)) return;
    attacker.blueEyesBodyContactIds.add(defender.id);
    grantBlueEyesFusionStack(attacker, now);
  }

  function clearBlueEyesCollisionContact(a, b) {
    if (a && a.blueEyesBodyContactIds) a.blueEyesBodyContactIds.delete(b && b.id);
    if (b && b.blueEyesBodyContactIds) b.blueEyesBodyContactIds.delete(a && a.id);
    if (a && a.chainsawBodyContacts) a.chainsawBodyContacts.delete(b && b.id);
    if (b && b.chainsawBodyContacts) b.chainsawBodyContacts.delete(a && a.id);
  }

  function isShadowDashBodyDamageSuppressed(fighter, now) {
    return !!(fighter && fighter.shadowDashDamageSuppressUntil && now < fighter.shadowDashDamageSuppressUntil);
  }

  function handleRampageCollisionStack(fighter, opponent, now) {
    const state = fighter.skillState;
    if (
      fighter.dead ||
      !opponent ||
      opponent.dead ||
      fighter.side === opponent.side ||
      fighter.abilityType !== "speedCollisionRamp" ||
      !state ||
      state.phase !== "active" ||
      state.skill.type !== "threeLegRampage"
    ) {
      return;
    }

    const skill = state.skill;
    const maxSkillStacks = Number(skill.maxSkillStacks) || 4;
    const maxRoundStacks = Number(skill.maxRoundStacks) || 999;
    const maxSpeed = Number(skill.maxSpeed) || 50;
    if (!fighter.rampageContactIds) {
      fighter.rampageContactIds = new Set();
    }
    if (fighter.rampageContactIds.has(opponent.id)) return;
    fighter.rampageContactIds.add(opponent.id);
    if ((state.data.skillStacks || 0) >= maxSkillStacks) return;
    if (fighter.roundSpeedStacks >= maxRoundStacks) return;
    if (fighter.speed >= maxSpeed) return;

    const stackSpeed = Number(skill.stackSpeed) || 1;
    const gained = grantTralalaPermanentSpeed(fighter, stackSpeed, maxSpeed, now, "폭주 충돌");
    if (gained) {
      state.data.skillStacks = (state.data.skillStacks || 0) + 1;
    }
  }

  function clearRampageCollisionContact(a, b) {
    if (a && a.rampageContactIds && b) {
      a.rampageContactIds.delete(b.id);
    }
    if (b && b.rampageContactIds && a) {
      b.rampageContactIds.delete(a.id);
    }
  }

  function grantTralalaPermanentSpeed(fighter, amount, maxSpeed, now, label) {
    if (!fighter || fighter.dead || fighter.abilityType !== "speedCollisionRamp") return false;
    const beforeSpeed = fighter.speed;
    fighter.speed = Math.min(maxSpeed, fighter.speed + Math.max(0, Number(amount) || 0));
    if (fighter.speed <= beforeSpeed) return false;

    const gained = fighter.speed - beforeSpeed;
    fighter.roundSpeedStacks += 1;
    fighter.lastRampageStackAt = now;
    normalizeVelocity(fighter, getPixelSpeed(fighter));
    createSpeedStackText(fighter, gained);
    updateStats(fighter.side, fighter);
    flashTralalaPanelStats(fighter);
    addLog(`${fighter.name} ${label}로 속도 +${formatAmount(gained)}`, "skill");
    return true;
  }

  function flashTralalaPanelStats(fighter) {
    const panel = fighter && els.panel[fighter.side];
    if (!panel) return;
    [panel.speed, panel.atk].forEach((element) => {
      if (!element) return;
      element.classList.remove("stat-flash");
      void element.offsetWidth;
      element.classList.add("stat-flash");
      scheduleTimeout(() => element.classList.remove("stat-flash"), 520);
    });
  }

  function getMass(fighter) {
    return 1 + fighter.maxHp / 180 + fighter.def / 18;
  }

  function updateArenaObjects(now) {
    game.arenaObjects.slice().forEach((object) => {
      if (object.type === "compressionWall") {
        updateCompressionWallObject(object, now);
      }
      if (object.type === "gojoBlue") {
        updateGojoBlueObject(object, now);
      }
      if (object.type === "gojoOrbProjectile") {
        updateGojoOrbProjectile(object, now);
      }
      if (now >= object.fadeStartAt) {
        if (!object.fadeStarted) {
          object.fadeStarted = true;
          object.element.classList.add("fading");
          if (object.type === "gojoBlue") {
            if (!object.finalDone) createGojoBlueCollapseEffect(object.x, object.y, object.radius);
          } else if (object.type === "compressionWall") {
            createCompressionCollapseEffect(object);
          } else {
            createStoneDebris(object.x, object.y, object.radius, "stone-collapse-dust", 22);
          }
          Object.values(game.fighters).forEach((fighter) => {
            if (fighter && fighter.duelDefenseWallId === object.id) {
              clearJarvanDuelDefense(fighter);
            }
            if (fighter && fighter.maugaCage && fighter.maugaCage.objectId === object.id) {
              fighter.maugaCage.active = false;
            }
          });
        }
      }
      if (now >= object.expiresAt) {
        removeArenaObject(object);
      }
    });
  }

  function resolveArenaObjectCollisions(fighter, now) {
    if (!fighter || fighter.dead || isFighterCollisionSuppressed(fighter, now)) return;
    game.arenaObjects.forEach((object) => {
      if (object.type === "circleWall") {
        resolveCircleWallCollision(fighter, object, now);
      }
      if (object.type === "compressionWall") {
        resolveCompressionWallCollision(fighter, object, now);
      }
      if (object.type === "maugaCage") {
        resolveMaugaCageCollision(fighter, object);
      }
    });
  }

  function resolveCircleWallCollision(fighter, wall, now) {
    let dx = fighter.x - wall.x;
    let dy = fighter.y - wall.y;
    let distance = Math.hypot(dx, dy);
    if (distance === 0) {
      dx = fighter.vx || 1;
      dy = fighter.vy || 0;
      distance = Math.hypot(dx, dy) || 1;
    }

    const nx = dx / distance;
    const ny = dy / distance;
    const signedDistance = distance - wall.radius;
    if (Math.abs(signedDistance) >= fighter.radius) {
      if (wall.initialContactIds) {
        wall.initialContactIds.delete(fighter.id);
      }
      clearSkillWallContact(fighter, wall);
      clearDivisionWallContact(fighter, wall);
      return;
    }

    const side = signedDistance >= 0 ? 1 : -1;
    const normalX = nx * side;
    const normalY = ny * side;
    const velocityAlongNormal = fighter.vx * normalX + fighter.vy * normalY;

    handleSkillWallAttackGrowth(fighter, wall, velocityAlongNormal < 0);
    handleOiiaCircleWallDivision(fighter, wall, velocityAlongNormal < 0, now);

    const targetDistance = Math.max(fighter.radius, wall.radius + side * fighter.radius);
    const correction = targetDistance - distance;
    fighter.x += nx * correction;
    fighter.y += ny * correction;
    keepInsideArena(fighter);

    if (velocityAlongNormal < 0) {
      fighter.vx -= (1 + RESTITUTION) * velocityAlongNormal * normalX;
      fighter.vy -= (1 + RESTITUTION) * velocityAlongNormal * normalY;
      normalizeVelocity(fighter, getPixelSpeed(fighter));
      handleMonkWallCrash(fighter, now);
    }
  }

  function resolveCompressionWallCollision(entity, wall, now) {
    if (!entity || !wall || wall.fadeStarted || now < (wall.activeAt || 0)) {
      clearCompressionWallContact(entity, wall);
      return;
    }
    const collision = getCircleRectCollision(entity.x, entity.y, entity.radius, wall);
    if (!collision) {
      if (wall.initialContactIds) wall.initialContactIds.delete(entity.id);
      clearCompressionWallContact(entity, wall);
      clearDivisionWallContact(entity, wall);
      return;
    }

    const moving = now < wall.movingUntil;
    let normalX = collision.normalX;
    let normalY = collision.normalY;
    if (moving && (wall.dirX || wall.dirY)) {
      normalX = wall.dirX || normalX;
      normalY = wall.dirY || normalY;
    }
    const velocityAlongNormal = (entity.vx || 0) * normalX + (entity.vy || 0) * normalY;
    const didBounce = moving || velocityAlongNormal < 0;

    handleCompressionWallPassive(entity, wall, didBounce, now);
    handleOiiaCompressionWallDivision(entity, wall, didBounce, now);

    const push = Math.max(0, collision.overlap) + 0.6;
    entity.x += normalX * push;
    entity.y += normalY * push;
    keepInsideArena(entity);
    keepCompressionWallEscapeSpace(entity, wall);

    if (didBounce) {
      if (moving) {
        const wallSpeed = Math.hypot(wall.endX - wall.startX, wall.endY - wall.startY) / Math.max(0.001, (wall.movingUntil - wall.bornAt) / 1000);
        entity.vx += normalX * wallSpeed * 0.18;
        entity.vy += normalY * wallSpeed * 0.18;
      } else if (velocityAlongNormal < 0) {
        entity.vx -= (1 + RESTITUTION) * velocityAlongNormal * normalX;
        entity.vy -= (1 + RESTITUTION) * velocityAlongNormal * normalY;
      }
      normalizeVelocity(entity, getPixelSpeed(entity));
      handleMonkWallCrash(entity, now);
    }
  }

  function getCircleRectCollision(x, y, radius, rect) {
    if (!rect || !Number.isFinite(rect.x) || !Number.isFinite(rect.y)) return null;
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;
    const left = rect.x - halfW;
    const right = rect.x + halfW;
    const top = rect.y - halfH;
    const bottom = rect.y + halfH;
    const closestX = clamp(x, left, right);
    const closestY = clamp(y, top, bottom);
    let dx = x - closestX;
    let dy = y - closestY;
    let distance = Math.hypot(dx, dy);

    if (distance > 0 && distance < radius) {
      return {
        normalX: dx / distance,
        normalY: dy / distance,
        overlap: radius - distance
      };
    }

    if (distance === 0 && x >= left && x <= right && y >= top && y <= bottom) {
      const distances = [
        { normalX: -1, normalY: 0, overlap: x - left + radius },
        { normalX: 1, normalY: 0, overlap: right - x + radius },
        { normalX: 0, normalY: -1, overlap: y - top + radius },
        { normalX: 0, normalY: 1, overlap: bottom - y + radius }
      ];
      return distances.reduce((best, item) => item.overlap < best.overlap ? item : best, distances[0]);
    }

    if (distance === 0) return null;
    return null;
  }

  function keepCompressionWallEscapeSpace(entity, wall) {
    if (!entity || !wall) return;
    const min = entity.radius;
    const max = game.arenaSize - entity.radius;
    entity.x = clamp(entity.x, min, max);
    entity.y = clamp(entity.y, min, max);
  }

  function handleCompressionWallPassive(entity, wall, didBounce, now) {
    if (!entity || entity.dead || entity.abilityType !== "jarvanTimedWall" || wall.fadeStarted) {
      clearCompressionWallContact(entity, wall);
      return;
    }
    if (!entity.skillWallContacts) entity.skillWallContacts = new Set();
    if (wall.initialContactIds && wall.initialContactIds.has(entity.id)) {
      entity.skillWallContacts.add(wall.id);
      return;
    }
    const wasTouching = entity.skillWallContacts.has(wall.id);
    if (!wasTouching && didBounce) {
      onWallBounce(entity, now);
    }
    entity.skillWallContacts.add(wall.id);
  }

  function clearCompressionWallContact(entity, wall) {
    if (entity && entity.skillWallContacts && wall) {
      entity.skillWallContacts.delete(wall.id);
    }
  }

  function handleOiiaCompressionWallDivision(entity, wall, didBounce, now) {
    if (!entity || entity.dead || entity.abilityType !== "oiiaDivision" || wall.fadeStarted) {
      clearDivisionWallContact(entity, wall);
      return;
    }
    if (!entity.divisionWallContacts) entity.divisionWallContacts = new Set();
    if (wall.initialContactIds && wall.initialContactIds.has(entity.id)) {
      entity.divisionWallContacts.add(wall.id);
      return;
    }
    const wasTouching = entity.divisionWallContacts.has(wall.id);
    if (!wasTouching && didBounce) {
      handleOiiaDivision(entity, now);
    }
    entity.divisionWallContacts.add(wall.id);
  }

  function handleSkillWallAttackGrowth(fighter, wall, didBounce) {
    if (
      fighter.abilityType !== "jarvanTimedWall" ||
      wall.ownerId !== fighter.id ||
      wall.fadeStarted
    ) {
      clearSkillWallContact(fighter, wall);
      return;
    }
    if (wall.initialContactIds && wall.initialContactIds.has(fighter.id)) {
      if (!fighter.skillWallContacts) fighter.skillWallContacts = new Set();
      fighter.skillWallContacts.add(wall.id);
      return;
    }

    if (!fighter.skillWallContacts) {
      fighter.skillWallContacts = new Set();
    }

    const wasTouching = fighter.skillWallContacts.has(wall.id);
    if (!wasTouching && didBounce) {
      applyJarvanAttackGrowth(fighter, 0.5, "공격력 +0.5");
    }
    fighter.skillWallContacts.add(wall.id);
  }

  function clearSkillWallContact(fighter, wall) {
    if (fighter && fighter.skillWallContacts) {
      fighter.skillWallContacts.delete(wall.id);
    }
  }

  function handleOiiaCircleWallDivision(entity, wall, didBounce, now) {
    if (!entity || entity.dead || entity.abilityType !== "oiiaDivision" || wall.fadeStarted) {
      clearDivisionWallContact(entity, wall);
      return;
    }
    if (wall.initialContactIds && wall.initialContactIds.has(entity.id)) {
      if (!entity.divisionWallContacts) entity.divisionWallContacts = new Set();
      entity.divisionWallContacts.add(wall.id);
      return;
    }

    if (!entity.divisionWallContacts) {
      entity.divisionWallContacts = new Set();
    }

    const wasTouching = entity.divisionWallContacts.has(wall.id);
    if (!wasTouching && didBounce) {
      handleOiiaDivision(entity, now);
    }
    entity.divisionWallContacts.add(wall.id);
  }

  function clearDivisionWallContact(entity, wall) {
    if (entity && entity.divisionWallContacts) {
      entity.divisionWallContacts.delete(wall.id);
    }
  }

  function updateJarvanDuelDefense(fighter) {
    if (!fighter || fighter.dead || fighter.abilityType !== "jarvanTimedWall") {
      clearJarvanDuelDefense(fighter);
      return false;
    }

    const wall = getActiveOwnDuelWall(fighter);
    if (!wall) {
      clearJarvanDuelDefense(fighter);
      return false;
    }

    fighter.duelDefenseWallId = wall.id;
    fighter.duelDefenseMultiplier = 0.25;
    getFighterElement(fighter).classList.add("duel-defending");
    if (!fighter.duelDefenseEffect) {
      fighter.duelDefenseEffect = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.28, "duel-defense-aura");
    }
    if (!fighter.duelDefenseLabel) {
      fighter.duelDefenseLabel = createDuelDefenseLabel(fighter);
    }
    updateDuelDefenseVisuals(fighter);
    return true;
  }

  function clearJarvanDuelDefense(fighter) {
    if (!fighter) return;
    fighter.duelDefenseWallId = "";
    fighter.duelDefenseMultiplier = 1;
    removeElement(fighter.duelDefenseEffect);
    removeElement(fighter.duelDefenseLabel);
    fighter.duelDefenseEffect = null;
    fighter.duelDefenseLabel = null;
    getFighterElement(fighter).classList.remove("duel-defending");
  }

  function getActiveOwnDuelWall(fighter) {
    return game.arenaObjects.find((wall) => (
      wall.type === "circleWall" &&
      wall.ownerId === fighter.id &&
      !wall.fadeStarted &&
      getBattleNow() < wall.fadeStartAt &&
      isPointInsideDuelWall(fighter, wall)
    ));
  }

  function isPointInsideDuelWall(fighter, wall) {
    return Math.hypot(fighter.x - wall.x, fighter.y - wall.y) <= wall.radius - fighter.radius * 0.25;
  }

  function getJarvanDuelDefenseReduction(defender) {
    if (!defender || defender.abilityType !== "jarvanTimedWall") return 0;
    return updateJarvanDuelDefense(defender) ? 0.75 : 0;
  }

  function createDuelDefenseLabel(fighter) {
    const label = document.createElement("div");
    label.className = "duel-defense-label";
    label.textContent = "결투장 방어";
    els.skillLayer.appendChild(label);
    updateDuelDefenseVisuals(fighter);
    return label;
  }

  function updateDuelDefenseVisuals(fighter) {
    if (!fighter) return;
    if (fighter.duelDefenseEffect) {
      updateCircleEffect(fighter.duelDefenseEffect, fighter.x, fighter.y, fighter.radius * 1.28);
    }
    if (fighter.duelDefenseLabel) {
      fighter.duelDefenseLabel.style.left = `${fighter.x}px`;
      fighter.duelDefenseLabel.style.top = `${fighter.y - fighter.radius - 22}px`;
    }
  }

  function createDuelDefenseDust(fighter) {
    const dust = createCircleEffect(fighter.x, fighter.y, fighter.radius * 1.08, "duel-defense-dust");
    scheduleTimeout(() => removeElement(dust), 360);
  }

  function isInCircleRange(source, target, radius) {
    if (!target || isFighterOutOfBattle(target)) return false;
    return isPointInCircle(target.x, target.y, source.x, source.y, radius + target.radius * 0.35);
  }

  function isPointInCircle(x, y, centerX, centerY, radius) {
    return Math.hypot(x - centerX, y - centerY) <= radius;
  }

  function getEnemySummons(side) {
    return game.summons.filter((summon) => !summon.dead && summon.side !== side);
  }

  function damageEnemySummonsInCircle(attacker, x, y, radius, damageOptions) {
    getEnemySummons(attacker.side).forEach((summon) => {
      if (isPointInCircle(summon.x, summon.y, x, y, radius + summon.radius * 0.35)) {
        applyDamage(attacker, summon, damageOptions);
        if (summon.dead || summon.currentHp <= 0) {
          createOiiaVanishEffect(summon);
        }
      }
    });
  }

  function damageEnemySummonsWithBloodMoon(attacker, data, skill) {
    if (!data.hitSummons) data.hitSummons = new Set();
    getEnemySummons(attacker.side).forEach((summon) => {
      if (data.hitSummons.has(summon.id)) return;
      if (!isTargetInBloodMoonCrescent(data, summon)) return;
      data.hitSummons.add(summon.id);
      applyDamage(attacker, summon, {
        label: skill.name,
        baseDamage: getBloodMoonDamage(attacker, summon, skill),
        ignoreDefense: true
      });
      if (summon.dead || summon.currentHp <= 0) {
        createBloodMoonHitEffect(summon);
        createOiiaVanishEffect(summon);
      }
    });
  }

  function calculateDamage(attacker, defender, options = {}) {
    if (Number.isFinite(options.fixedDamage)) {
      return applyBattlefieldDamageModifier(attacker, Math.max(0, Math.round(options.fixedDamage)), options);
    }

    if (
      isCollisionDamage(options) &&
      attacker.abilityType === "oiiaDivision" &&
      !attacker.isOiiaClone
    ) {
      return 1;
    }

    const baseDamage = Number.isFinite(options.baseDamage)
      ? options.baseDamage
      : attacker.atk + (Number(options.bonusDamage) || 0);
    const defenseIgnoreRate = clamp(Number(options.defenseIgnoreRate) || 0, 0, 1);
    const defense = options.ignoreDefense ? 0 : defender.def * (1 - defenseIgnoreRate);
    const collisionMultiplier = isCollisionDamage(options) ? getCollisionDamageMultiplier(attacker) : 1;
    const duelDefenseReduction = getJarvanDuelDefenseReduction(defender);
    const damageReduction = options.ignoreDamageReduction ? 0 : getTotalDamageReduction(defender, options, duelDefenseReduction);
    let reducedDamage = (baseDamage - defense) * collisionMultiplier * (1 - damageReduction);
    return applyBattlefieldDamageModifier(attacker, Math.max(MIN_DAMAGE, Math.round(reducedDamage)), options);
  }

  function applyBattlefieldDamageModifier(attacker, damage, options = {}) {
    if (options.ignoreBattlefieldDamageModifier) return damage;
    if (game.trainingMode) return damage;
    if (!game.currentBattlefield || game.currentBattlefield.id !== "desert") return damage;
    if (!attacker || (!attacker.side && !attacker.ownerSide)) return damage;
    const reduced = Math.round(Math.max(0, Number(damage) || 0) * DESERT_DAMAGE_MULTIPLIER);
    return Math.max(damage > 0 ? 1 : 0, reduced);
  }

  function isCollisionDamage(options) {
    return options.isCollision || options.label === "충돌";
  }

  function getCollisionDamageMultiplier(attacker) {
    let multiplier = 1;
    if (attacker.abilityType === "speedCollisionRamp") {
      const baseSpeed = Number(attacker.data.speed) || attacker.speed;
      const bonusSpeed = Math.max(0, attacker.speed - baseSpeed);
      const bonusRate = Math.min(1.2, bonusSpeed * 0.12);
      multiplier *= 1 + bonusRate;
    }
    if (attacker.abilityType === "ronaldoChampion" && attacker.ronaldoUltimate && attacker.ronaldoUltimate.active) {
      multiplier *= Number(attacker.ronaldoUltimate.collisionDamageMultiplier) || 1.25;
    }
    return multiplier;
  }

  function trySansDodge(defender, attacker, options) {
    if (
      !defender ||
      !attacker ||
      attacker === defender ||
      defender.abilityType !== "sansDodge" ||
      defender.dead ||
      isFighterOutOfBattle(defender) ||
      defender.isOiiaClone ||
      options.ignoreSansDodge
    ) {
      return false;
    }

    const now = getBattleNow();
    pruneSansDodgeLocks(defender, now);

    const attackKey = getSansDodgeAttackKey(attacker, options);
    if (attackKey) {
      const lock = getSansDodgeLock(defender, attacker, attackKey, options, now);
      if (lock) {
        return lock.dodged;
      }
    }

    const dodged = Math.random() < SANS_DODGE_CHANCE;
    if (attackKey) {
      lockSansAttack(defender, attacker, attackKey, options, now, dodged);
    }

    if (!dodged) {
      return false;
    }

    const fromX = defender.x;
    const fromY = defender.y;
    const position = findSafeSansTeleportPosition(defender, attacker);
    if (!position) return false;

    defender.lastSansDodgeAt = now;
    createSansDodgeEffect(fromX, fromY, defender.radius, "sans-dodge-before");
    defender.x = position.x;
    defender.y = position.y;
    setVelocityFromAngle(defender, Math.random() * Math.PI * 2);
    createSansDodgeEffect(defender.x, defender.y, defender.radius, "sans-dodge-after");
    getFighterElement(defender).classList.add("sans-dodging");
    scheduleTimeout(() => getFighterElement(defender).classList.remove("sans-dodging"), 240);
    addLog(`${defender.name} 순간이동 회피`, "skill");
    return true;
  }

  function getSansDodgeAttackKey(attacker, options) {
    if (options.attackId) return `attack:${options.attackId}:hit:${options.hitId || "single"}`;
    if (isCollisionDamage(options)) return `collision:${attacker.id}`;
    return "";
  }

  function getSansDodgeLock(defender, attacker, attackKey, options, now) {
    if (!defender.sansAttackLocks) {
      defender.sansAttackLocks = new Map();
    }
    const lock = defender.sansAttackLocks.get(attackKey);
    if (!lock) return null;

    if (lock.persistent) {
      lock.lastSeenAt = now;
      return lock;
    }

    if (isCollisionDamage(options)) {
      const distance = Math.hypot(defender.x - attacker.x, defender.y - attacker.y);
      const separated = distance > defender.radius + attacker.radius + 8;
      if (separated || now - lock.startedAt > SANS_DODGE_LOCK_MS) {
        defender.sansAttackLocks.delete(attackKey);
        return null;
      }
      return lock;
    }

    if (now - lock.startedAt > SANS_DODGE_LOCK_MS) {
      defender.sansAttackLocks.delete(attackKey);
      return null;
    }
    return lock;
  }

  function lockSansAttack(defender, attacker, attackKey, options, now, dodged) {
    if (!defender.sansAttackLocks) {
      defender.sansAttackLocks = new Map();
    }
    defender.sansAttackLocks.set(attackKey, {
      attackerId: attacker.id,
      dodged,
      persistent: !!options.persistentAttack,
      startedAt: now,
      lastSeenAt: now
    });
  }

  function syncSansDodgeAttackContact(target, attackId, isInside) {
    if (!target || target.abilityType !== "sansDodge" || !target.sansAttackLocks || !attackId) return;
    const attackKey = `attack:${attackId}:`;
    if (!isInside) {
      target.sansAttackLocks.forEach((lock, key) => {
        if (key.startsWith(attackKey)) {
          target.sansAttackLocks.delete(key);
        }
      });
      return;
    }
    const now = getBattleNow();
    target.sansAttackLocks.forEach((lock, key) => {
      if (key.startsWith(attackKey)) {
        lock.lastSeenAt = now;
      }
    });
  }

  function pruneSansDodgeLocks(defender, now) {
    if (!defender.sansAttackLocks) return;
    defender.sansAttackLocks.forEach((lock, key) => {
      const staleMs = lock.persistent ? SANS_PERSISTENT_ATTACK_STALE_MS : SANS_DODGE_LOCK_MS;
      if (now - (lock.lastSeenAt || lock.startedAt) > staleMs) {
        defender.sansAttackLocks.delete(key);
      }
    });
  }

  function findSafeSansTeleportPosition(fighter, opponent) {
    const margin = fighter.radius + 4;
    for (let i = 0; i < 70; i += 1) {
      const x = margin + Math.random() * Math.max(1, game.arenaSize - margin * 2);
      const y = margin + Math.random() * Math.max(1, game.arenaSize - margin * 2);
      if (isSafeSansTeleportPosition(x, y, fighter, opponent)) {
        return { x, y };
      }
    }
    return null;
  }

  function isSafeSansTeleportPosition(x, y, fighter, opponent) {
    if (x - fighter.radius < 0 || x + fighter.radius > game.arenaSize || y - fighter.radius < 0 || y + fighter.radius > game.arenaSize) {
      return false;
    }

    const bodies = [opponent].concat(game.summons);
    for (const body of bodies) {
      if (!body || body.dead || body.removing || isFighterOutOfBattle(body)) continue;
      if (Math.hypot(x - body.x, y - body.y) < fighter.radius + body.radius + 10) return false;
    }

    return game.arenaObjects.every((object) => {
      if (object.type !== "circleWall") return true;
      return Math.abs(Math.hypot(x - object.x, y - object.y) - object.radius) >= fighter.radius + 8;
    });
  }

  function getTotalDamageReduction(defender, options, extraReduction = 0) {
    const optionReduction = clamp(Number(options.damageReduction) || 0, 0, 0.95);
    const defenderReduction = clamp(Number(defender.damageReduction) || 0, 0, 0.95);
    const stolenReduction = clamp(Number(defender.blueEyesStolenDamageReduction) || 0, 0, 0.95);
    const himReduction = clamp(getHimDamageReduction(defender), 0, 0.95);
    const bonusReduction = clamp(Number(extraReduction) || 0, 0, 0.95);
    return 1 - (1 - optionReduction) * (1 - defenderReduction) * (1 - stolenReduction) * (1 - himReduction) * (1 - bonusReduction);
  }

  function getDamageSourceOwner(attacker, options = {}) {
    if (options.ownerId) {
      const optionOwner = getFighterById(options.ownerId);
      if (optionOwner) return optionOwner;
    }
    if (attacker && attacker.ownerId) {
      const owner = getFighterById(attacker.ownerId);
      if (owner) return owner;
    }
    return isMainBattleFighter(attacker) ? attacker : null;
  }

  function recordBattleDamageStats(attacker, defender, actualDamage, options = {}) {
    const amount = Math.max(0, Number(actualDamage) || 0);
    if (amount <= 0 || game.trainingMode) return;
    const owner = getDamageSourceOwner(attacker, options);
    if (isMainBattleFighter(owner)) {
      owner.damageDealt = Math.max(0, Number(owner.damageDealt) || 0) + amount;
    }
    if (isMainBattleFighter(defender)) {
      defender.damageTaken = Math.max(0, Number(defender.damageTaken) || 0) + amount;
    }
  }

  function getFinalBlowKind(attacker, options = {}, label = "") {
    if (options.systemKill) return "시스템 판정";
    if (options.damageKind) return options.damageKind;
    const text = String(label || "");
    const attackId = String(options.attackId || "");
    if (text.includes("화상") || options.isDot || (Number.isFinite(options.fixedDamage) && !isCollisionDamage(options))) return "지속 피해";
    if (text.includes("태양")) return "Chill Guy 태양";
    if (text.includes("벽 충돌")) return "벽 충돌";
    if ((attacker && attacker.isOiiaClone) || text.includes("분신")) return "분신 공격";
    if (isCollisionDamage(options)) return "기본 충돌";
    if (/ultimate|doom|world|cage|siuuu|storm|enlightenment|blue-ultimate|muzan-ultimate/i.test(attackId) || text.includes("궁극")) return "궁극기";
    if (text && text !== "피해") return "스킬";
    return "기본 공격";
  }

  function recordFinalBlow(attacker, defender, options = {}, actualDamage = 0) {
    if (game.finalBlow || !isMainBattleFighter(defender)) return;
    const label = options.finalBlowLabel || options.label || "피해";
    const owner = getDamageSourceOwner(attacker, options);
    const now = getBattleNow();
    const sequence = ++game.finalBlowCounter;
    game.finalBlow = {
      id: `final-${sequence}`,
      tickId: `${Math.round(now)}-${sequence}`,
      attackerId: attacker && attacker.id ? attacker.id : "",
      attackerName: attacker && attacker.name ? attacker.name : "",
      ownerId: owner && owner.id ? owner.id : "",
      ownerName: owner && owner.name ? owner.name : "",
      defenderId: defender.id,
      defenderName: defender.name,
      attackId: options.attackId || options.skillId || `${label}-${sequence}`,
      displayLabel: label,
      kind: getFinalBlowKind(attacker, options, label),
      actualDamage: Math.max(0, Number(actualDamage) || 0),
      time: now,
      happenedAt: performance.now()
    };
  }

  function recordSystemFinalBlow(defender, label = "시스템 판정", actualDamage = 0) {
    if (game.finalBlow || !isMainBattleFighter(defender)) return;
    const nextSequence = game.finalBlowCounter + 1;
    recordFinalBlow(null, defender, {
      label,
      systemKill: true,
      damageKind: "시스템 판정",
      attackId: `system-${nextSequence}`
    }, actualDamage);
  }

  function formatFinalBlowText(finalBlow) {
    if (!finalBlow) return "기록 없음";
    const defenderName = finalBlow.defenderName || "패배 캐릭터";
    const label = finalBlow.displayLabel || finalBlow.kind || "피해";
    const actorName = finalBlow.ownerName || finalBlow.attackerName || "";
    if (finalBlow.kind === "시스템 판정") {
      if (label === "자연사") {
        return `${defenderName}가 자연사로 패배`;
      }
      return `${defenderName} ${label}로 패배`;
    }
    if (actorName) {
      return `${actorName}의 ${label}에 의해 ${defenderName} 패배`;
    }
    return `${label}에 의해 ${defenderName} 패배`;
  }

  function applyDamage(attacker, defender, options = {}) {
    if (game.battleEnding || !attacker || !defender || attacker.dead || defender.dead) return 0;
    if (isFighterDamageSuppressed(defender) && !options.systemKill) {
      if (isBlueEyesInvulnerable(defender, getBattleNow())) {
        createBlueEyesInvulnerableBlock(defender);
      }
      if (isOiiaGreatSpinActive(defender, getBattleNow())) {
        createOiiaGreatSpinBlock(defender);
        if (defender.oiiaGreatSpin && getBattleNow() - (defender.oiiaGreatSpin.lastBlockLogAt || 0) > 450) {
          defender.oiiaGreatSpin.lastBlockLogAt = getBattleNow();
          addLog(`${defender.name} 대회전 보호막으로 피해 무효`, "good");
        }
      }
      return 0;
    }
    if (game.trainingMode && isTrainingDummy(attacker) && isCollisionDamage(options)) return 0;
    const label = options.label || "피해";
    if (!options.ignoreBlind && !options.isDot && !options.systemKill && isBlueEyesBlindActive(attacker, getBattleNow())) {
      createBlueEyesBlindMiss(attacker);
      addLog(`${attacker.name} 실명으로 공격 실패 (${label})`, "skill");
      return 0;
    }
    if (tryGojoInfinityBlock(defender, attacker, options)) {
      return 0;
    }
    const hits = Math.max(1, Math.floor(Number(options.hits) || 1));
    let totalDamage = 0;
    let actualDamage = 0;

    for (let i = 0; i < hits; i += 1) {
      const hitOptions = hits > 1 && !options.hitId
        ? { ...options, hitId: `hit-${i + 1}` }
        : options;
      if (trySansDodge(defender, attacker, hitOptions)) {
        continue;
      }
      if (!hitOptions.ignoreChillShield && isChillShieldActive(defender)) {
        createChillShieldBlock(defender);
        continue;
      }
      let damage = calculateDamage(attacker, defender, hitOptions);
      if (isMuzanFatalRegenerating(defender, getBattleNow()) && !hitOptions.systemKill && !hitOptions.ignoreMuzanFatalRegen) {
        damage = Math.max(0, Math.round(damage * 0.7));
      }
      const absorbedDamage = absorbMaugaTemporaryHealth(defender, damage, getBattleNow());
      const hpDamage = Math.max(0, damage - absorbedDamage);
      const beforeHp = defender.currentHp;
      totalDamage += damage;
      if (hpDamage > 0 && defender.abilityType === "gojoInfinity" && !hitOptions.systemKill) {
        defender.gojoInfinityLastBlockAt = getBattleNow();
      }
      let nextHp = Math.max(0, defender.currentHp - hpDamage);
      let lowHpEvolutionPreHealHp = null;
      if (hpDamage > 0 && tryBlueEyesLowHpEvolution(defender, hitOptions, nextHp, getBattleNow())) {
        lowHpEvolutionPreHealHp = nextHp;
        nextHp = defender.currentHp;
      }
      if (hpDamage > 0 && tryBlueEyesUltimateCreature(defender, attacker, hitOptions, beforeHp, nextHp, getBattleNow())) {
        nextHp = 1;
      }
      if (hpDamage > 0 && tryMuzanFatalRegeneration(defender, hitOptions, nextHp, getBattleNow())) {
        nextHp = defender.currentHp;
      }
      if (hpDamage > 0) {
        nextHp = tryHimBossRecovery(defender, hitOptions, nextHp, getBattleNow());
      }
      defender.currentHp = nextHp;
      const hpAfterDamageBeforeRecovery = Number.isFinite(lowHpEvolutionPreHealHp) ? lowHpEvolutionPreHealHp : defender.currentHp;
      const hitActualDamage = absorbedDamage + Math.max(0, beforeHp - hpAfterDamageBeforeRecovery);
      actualDamage += hitActualDamage;
      if (hitActualDamage > 0 && beforeHp > 0 && defender.currentHp <= 0) {
        recordFinalBlow(attacker, defender, hitOptions, hitActualDamage);
      }
      refreshOiiaSize(defender);
      if (defender.currentHp <= 0) break;
    }

    const hitText = hits > 1 ? ` x${hits}` : "";
    addLog(`${attacker.name} → ${defender.name} ${formatAmount(actualDamage)} 피해${hitText} (${label})`);
    recordBattleDamageStats(attacker, defender, actualDamage, options);

    if (actualDamage > 0 && defender.duelDefenseMultiplier === 0.25) {
      createDuelDefenseDust(defender);
    }

    applyDamagePassives(attacker, defender, actualDamage, options);

    if (game.trainingMode && isTrainingDummy(defender) && actualDamage > 0) {
      recordTrainingDamage(actualDamage, options.label || "피해");
    }

    if (game.trainingMode && isTrainingDummy(defender) && defender.currentHp <= 0) {
      defender.currentHp = defender.maxHp;
      defender.dead = false;
      refreshOiiaSize(defender);
      addLog("훈련장 허수아비 체력 자동 복구", "good");
      return actualDamage;
    }

    if (defender.currentHp <= 0) {
      defender.dead = true;
      if (defender.isOiiaClone) {
        startOiiaSummonRemoval(defender, "zero", getBattleNow());
      } else {
        cleanupFighterDeathState(defender);
      }
    }
    return actualDamage;
  }

  function applyDamagePassives(attacker, defender, actualDamage, options = {}) {
    if (actualDamage <= 0) return;
    if (defender && defender.abilityType === "muzanBiology" && !options.systemKill) {
      defender.muzanLastDamageAt = getBattleNow();
    }
    if (attacker && attacker.abilityType === "muzanBiology" && options.muzanSkillHit) {
      const cellGain = Object.prototype.hasOwnProperty.call(options, "muzanCellGain")
        ? Number(options.muzanCellGain) || 0
        : 4;
      grantMuzanCell(attacker, cellGain);
      if (!options.skipMuzanBlood) {
        addMuzanBloodStack(attacker, defender, getBattleNow(), options.attackId || options.label || "muzan");
      }
    }
    if (attacker.abilityType === "damageDrain") {
      const healAmount = actualDamage * 0.1;
      const healed = healFighter(attacker, healAmount, "피해 흡혈");
      if (healed > 0) {
        createHealEffect(attacker, healed);
      }
    }
    if (attacker.abilityType === "maugaBerserker" && options.maugaCritical) {
      grantMaugaTemporaryHealth(attacker, actualDamage * 0.3, getBattleNow());
    }
    if (attacker.abilityType === "maugaBerserker" && attacker.maugaHeartUntil && getBattleNow() < attacker.maugaHeartUntil && options.maugaHeartHeal) {
      const healed = healFighter(attacker, actualDamage * (Number(options.maugaHeartHealRate) || 0.35), "심장 과부하");
      if (healed > 0) createHealEffect(attacker, healed);
    }
  }

  function healFighter(target, amount, label = "회복") {
    if (target.dead) return 0;
    const healAmount = Math.max(0, Number(amount) || 0) * (target.healMultiplier || 1) * (target.blueEyesStolenHealMultiplier || 1) * getMuzanBloodHealMultiplier(target);
    if (healAmount <= 0) return 0;
    const before = target.currentHp;
    target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount);
    refreshOiiaSize(target);
    const actualHeal = target.currentHp - before;
    if (actualHeal > 0) {
      addLog(`${target.name} ${formatAmount(actualHeal)} 회복 (${label})`, "good");
    }
    return actualHeal;
  }

  function instantKill(target, label) {
    if (target.dead) return;
    recordSystemFinalBlow(target, label, target.currentHp);
    target.currentHp = 0;
    refreshOiiaSize(target);
    target.dead = true;
    if (target.isOiiaClone) {
      startOiiaSummonRemoval(target, "zero", getBattleNow());
    } else {
      cleanupFighterDeathState(target);
    }
    addLog(`${target.name} 즉사 (${label})`, "bad");
  }

  function cleanupFighterDeathState(fighter) {
    clearMaugaBurns(fighter);
    resetMaugaState(fighter);
    resetChillGuyState(fighter);
    resetRonaldoState(fighter);
    resetRicoState(fighter);
    resetOiiaState(fighter);
    resetMuzanState(fighter, true);
    resetMonkState(fighter);
    resetGojoState(fighter, true);
    resetChainsawState(fighter, true);
    resetHimState(fighter);
    clearAatroxActiveSkillEffects(fighter);
    clearBattlefieldCompressionWall(fighter);
    if (fighter.skillState && fighter.skillState.skill && fighter.skillState.skill.type === "lastSubwayRush") {
      clearLastSubwayRushState(fighter, fighter.skillState);
    }
    if (isBlueEyesFighter(fighter)) {
      clearBlueEyesVisualState(fighter);
    }
    endWorldEnder(fighter, true, getBattleNow());
    if (fighter.skillState && fighter.skillState.skill && isUltimateSkill(fighter.skillState.skill)) {
      releaseUltimateLock(fighter, fighter.skillState.skill);
    }
    if (fighter.recoverySkill && isUltimateSkill(fighter.recoverySkill)) {
      releaseUltimateLock(fighter, fighter.recoverySkill);
    }
  }

  function checkBattleEnd() {
    if (game.battleEnding) return;
    if (game.trainingMode) {
      reviveTrainingDummyIfNeeded();
      return;
    }
    const a = game.fighters.A;
    const b = game.fighters.B;
    if (!a.dead && !b.dead) return;

    let winnerSide;
    if (a.dead && b.dead) {
      winnerSide = a.currentHp >= b.currentHp ? "A" : "B";
    } else {
      winnerSide = a.dead ? "B" : "A";
    }

    beginBattleEnding(winnerSide);
  }

  function beginBattleEnding(winnerSide) {
    if (game.battleEnding || game.phase !== "running") return;
    const now = getBattleNow();
    const winner = game.fighters[winnerSide];
    const loserSide = winnerSide === "A" ? "B" : "A";
    const loser = game.fighters[loserSide];
    Object.values(game.fighters).forEach((fighter) => clearAatroxActiveSkillEffects(fighter));
    Object.values(game.fighters).forEach((fighter) => clearBattlefieldCompressionWall(fighter));
    Object.values(game.fighters).forEach((fighter) => resetGojoState(fighter, true));
    Object.values(game.fighters).forEach((fighter) => resetMuzanState(fighter, true));
    Object.values(game.fighters).forEach((fighter) => {
      if (fighter && fighter.skillState && fighter.skillState.skill && fighter.skillState.skill.type === "lastSubwayRush") {
        clearLastSubwayRushState(fighter, fighter.skillState);
      }
    });
    if (!game.finalBlow && loser) {
      recordSystemFinalBlow(loser, "전투 종료", 0);
    }
    game.battleEnding = true;
    game.pendingWinnerSide = winnerSide;
    stopBattleTimer(now);
    stopBattleLoop();
    clearScheduledTimers();
    game.phase = "ending";
    game.combatClock.paused = false;
    els.state.textContent = `${winner ? winner.name : winnerSide} 승리 연출`;
    syncCombatControlsUi();
    updateDevControls();
    playDefeatCinematic(winner, loser, game.finalBlow, () => endBattle(winnerSide));
  }

  function playDefeatCinematic(winner, loser, finalBlow, onComplete) {
    clearDefeatCinematicVisuals();
    if (!els.arena || !loser || loser.isOiiaClone) {
      game.cinematicTimer = window.setTimeout(onComplete, 0);
      return;
    }

    const originX = clamp((loser.x / Math.max(1, game.arenaSize)) * 100, 0, 100);
    const originY = clamp((loser.y / Math.max(1, game.arenaSize)) * 100, 0, 100);
    const panScale = 0.48;
    const panX = (game.arenaSize / 2 - loser.x) * panScale;
    const panY = (game.arenaSize / 2 - loser.y) * panScale;
    els.arena.style.setProperty("--defeat-origin-x", `${originX}%`);
    els.arena.style.setProperty("--defeat-origin-y", `${originY}%`);
    els.arena.style.setProperty("--defeat-pan-x", `${panX}px`);
    els.arena.style.setProperty("--defeat-pan-y", `${panY}px`);

    const overlay = document.createElement("div");
    overlay.className = "defeat-cinematic-overlay";
    const badge = document.createElement("div");
    badge.className = "defeat-final-blow-card";
    const title = document.createElement("span");
    title.textContent = "결정타";
    const body = document.createElement("strong");
    body.textContent = formatFinalBlowText(finalBlow);
    const detail = document.createElement("small");
    const damageText = finalBlow && finalBlow.actualDamage > 0 ? `실제 피해 ${formatAmount(finalBlow.actualDamage)}` : finalBlow && finalBlow.kind ? finalBlow.kind : "전투 종료";
    detail.textContent = damageText;
    badge.appendChild(title);
    badge.appendChild(body);
    badge.appendChild(detail);
    overlay.appendChild(badge);
    els.arena.appendChild(overlay);
    game.cinematicOverlay = overlay;

    const winnerElement = winner ? getFighterElement(winner) : null;
    const loserElement = getFighterElement(loser);
    if (winnerElement) winnerElement.classList.add("defeat-cinematic-winner");
    if (loserElement) loserElement.classList.add("defeat-cinematic-loser");
    els.arena.classList.add("defeat-cinematic-active");
    syncCombatAnimationPlayback();

    game.cinematicTimer = window.setTimeout(() => {
      clearDefeatCinematicVisuals();
      onComplete();
    }, DEFEAT_CINEMATIC_DURATION_MS);
  }

  function endBattle(winnerSide) {
    if (game.phase !== "running" && game.phase !== "ending") return;
    const finalBlow = game.finalBlow;
    clearDefeatCinematicVisuals();
    game.battleEnding = false;
    game.pendingWinnerSide = "";
    stopBattleTimer();
    stopBattleLoop();
    clearScheduledTimers();
    game.phase = "ended";
    game.combatClock.paused = false;
    Object.values(game.fighters).forEach((fighter) => {
      cancelFighterSkill(fighter);
    });
    clearRoundEffects();
    updateAllStats();

    const winner = game.fighters[winnerSide];
    const loserSide = winnerSide === "A" ? "B" : "A";
    const loser = game.fighters[loserSide];
    const betSide = game.lockedBet;
    const betFighter = game.fighters[betSide];
    const wonBet = game.lockedBet === winnerSide;
    const coinDelta = wonBet ? game.betValue : -game.betValue;
    const previousBest = game.best;
    if (wonBet) {
      game.coins += game.betValue;
      addLog(`승리: ${winner.name}. 승부 예측 성공 +${game.betValue} 전장 코인`, "good");
    } else {
      game.coins = Math.max(0, game.coins - game.betValue);
      addLog(`승리: ${winner.name}. 승부 예측 실패 -${game.betValue} 전장 코인`, "bad");
    }

    if (game.coins > game.best) {
      game.best = game.coins;
      saveBestScore(game.best);
    }
    game.sessionBest = Math.max(game.sessionBest || START_COINS, game.coins);

    updateTopUi();
    updateAllStats();

    const isGameOver = game.coins <= 0;
    const rankingAdded = isGameOver
      ? registerRankingIfNeeded({ gameOver: true })
      : false;

    if (isGameOver) {
      game.phase = "gameover";
      els.state.textContent = "게임 오버";
      if (els.nextButton) els.nextButton.textContent = "게임 오버";
      addLog("전장 코인이 모두 소진되었습니다.", "bad");
    } else {
      els.state.textContent = `${winnerSide} 승리`;
      if (els.nextButton) els.nextButton.textContent = "다음 라운드";
    }

    if (els.nextButton) els.nextButton.disabled = false;
    els.betAmount.disabled = false;
    showBattleResult({
      winner,
      loser,
      winnerSide,
      loserSide,
      betSide,
      betName: betFighter ? betFighter.name : "",
      wonBet,
      coinDelta,
      currentCoins: game.coins,
      gameOver: isGameOver,
      bestUpdated: game.best > previousBest,
      rankingAdded,
      elapsedMs: game.battleClock.elapsedMs,
      finalBlow,
      finalBlowText: formatFinalBlowText(finalBlow),
      winnerHpText: `${formatAmount(winner.currentHp)} / ${formatAmount(winner.maxHp)}`,
      winnerDamage: Math.max(0, Number(winner.damageDealt) || 0),
      loserDamage: Math.max(0, Number(loser.damageDealt) || 0)
    });
    updateDevControls();
    syncCombatControlsUi();
    syncCombatAnimationPlayback();
  }

  function showBattleResult(result) {
    if (!els.result.overlay) return;

    const winnerText = `${result.winner.name} 승리!`;
    const loserText = `${result.loser.name} 패배`;
    const coinText = `${result.coinDelta > 0 ? "+" : ""}${result.coinDelta} 전장 코인`;
    const betSideText = result.betSide ? `${result.betName} (${result.betSide})` : "없음";

    els.result.overlay.hidden = false;
    setScreenState("RESULT");
    els.result.panel.classList.toggle("success", result.wonBet);
    els.result.panel.classList.toggle("failure", !result.wonBet);
    els.result.kicker.textContent = result.gameOver ? "GAME OVER" : "WINNER";
    els.result.title.textContent = winnerText;
    els.result.loserName.textContent = loserText;
    els.result.betStatus.textContent = result.wonBet ? "예측 성공!" : "예측 실패";
    els.result.betTarget.textContent = betSideText;
    els.result.coinDelta.textContent = coinText;
    els.result.coinDelta.classList.remove("gain", "loss");
    els.result.coinDelta.classList.add(result.wonBet ? "gain" : "loss");
    els.result.coinTotal.textContent = `현재 전장 코인: ${result.currentCoins}`;
    if (els.result.winnerHp) {
      els.result.winnerHp.textContent = result.winnerHpText || "-";
    }
    if (els.result.damageTotal) {
      els.result.damageTotal.textContent = `${result.winner.name} ${formatAmount(result.winnerDamage || 0)} · ${result.loser.name} ${formatAmount(result.loserDamage || 0)}`;
    }
    if (els.result.battleTime) {
      els.result.battleTime.textContent = formatElapsedTime(result.elapsedMs || 0);
    }
    if (els.result.defeatCause) {
      els.result.defeatCause.textContent = result.finalBlowText || "기록 없음";
    }
    if (els.result.bestNote) {
      const notes = [result.bestUpdated ? "최고 기록 갱신!" : "최고 기록 유지"];
      if (result.gameOver && result.rankingAdded) notes.push("랭킹 등록 완료");
      if (result.gameOver && !result.rankingAdded && game.currentNickname) notes.push("랭킹 등록 조건 없음");
      els.result.bestNote.textContent = notes.join(" · ");
    }
    if (els.result.highlights) {
      els.result.highlights.hidden = true;
      els.result.highlights.innerHTML = "";
    }
    els.result.gameOver.hidden = !result.gameOver;
    if (els.result.nextButton) {
      els.result.nextButton.hidden = !!result.gameOver;
      els.result.nextButton.disabled = !!result.gameOver;
      els.result.nextButton.textContent = result.gameOver ? "게임 오버" : "다음 라운드";
    }
    if (els.result.restartButton) els.result.restartButton.hidden = false;
    renderResultPortrait(els.result.winnerPortrait, result.winner, result.winnerSide);
    renderResultPortrait(els.result.loserPortrait, result.loser, result.loserSide);

    getFighterElement(result.winner).classList.add("winner-glow");
    getFighterElement(result.loser).classList.add("defeated");
  }

  function renderResultPortrait(element, fighter, side) {
    if (!element || !fighter) return;
    renderBackgroundPortrait(element, fighter, side);
  }

  function hideResultOverlay() {
    if (els.result.overlay) {
      els.result.overlay.hidden = true;
    }
    if (game.screen === "RESULT" && (game.phase === "ended" || game.phase === "gameover")) {
      setScreenState("BATTLE");
    }
    Object.values(game.fighters).forEach((fighter) => {
      if (!fighter) return;
      getFighterElement(fighter).classList.remove("winner-glow", "defeated");
    });
  }

  function showResultBattleLog(event) {
    if (event) event.stopPropagation();
    hideResultOverlay();
    openBattleLog({ resetScroll: false });
  }

  function handleResultNextButton() {
    if (!els.result.nextButton || els.result.nextButton.disabled) return;
    els.result.nextButton.disabled = true;
    handleNextButton();
  }

  function handleNextButton() {
    if (game.phase === "gameover") {
      openNicknameScreen();
      return;
    }

    if (game.phase === "ended" || game.phase === "gameover") {
      startRound();
    }
  }

  function setupTrainingControls() {
    if (!els.training.panel) return;
    if (els.training.heal) els.training.heal.addEventListener("click", restoreTrainingHealth);
    if (els.training.cooldown) els.training.cooldown.addEventListener("click", resetTrainingCooldowns);
    if (els.training.cleanse) els.training.cleanse.addEventListener("click", cleanseTrainingStatuses);
    if (els.training.position) els.training.position.addEventListener("click", resetTrainingPositions);
    if (els.training.collision) els.training.collision.addEventListener("click", runTrainingCollisionOnce);
    if (els.training.reset) els.training.reset.addEventListener("click", resetTrainingBattle);
    if (els.training.exit) els.training.exit.addEventListener("click", exitTrainingMode);
  }

  function startTrainingMode() {
    if ((game.phase === "battlefield" || game.phase === "countdown" || game.phase === "running") && !game.trainingMode) return;
    const character = window.CHARACTERS[Number(els.dev.selectA.value)] || window.CHARACTERS[0];
    if (!character) return;
    closeDevLogin();
    prepareTrainingWithCharacter(character);
  }

  function prepareTrainingWithCharacter(character) {
    stopBattleLoop();
    clearScheduledTimers();
    resetBattleEndingState();
    hideResultOverlay();
    closeBattleLog({ resetScroll: true });
    clearRoundEffects();
    resetCombatControls();
    resetBattleTimer();

    game.trainingMode = true;
    clearTrainingCollisionTest();
    game.trainingCharacterIndex = window.CHARACTERS.findIndex((item) => item.id === character.id);
    game.currentNickname = "훈련장";
    game.rankingRegistered = true;
    game.devForcedGame = true;
    game.selectedBet = null;
    game.lockedBet = null;
    game.lastBodyDamageAt = 0;
    game.finalBlow = null;
    game.fighters.A = createFighterState(character, "A");
    game.fighters.B = createFighterState(TRAINING_DUMMY, "B");
    game.fighters.B.isTrainingDummy = true;
    game.fighters.B.radius = game.fighterBaseRadius || 36;
    game.fighters.B.baseRadius = game.fighterBaseRadius || 36;
    game.fighters.B.speed = 0;
    game.fighters.B.atk = 0;
    game.fighters.B.skills = [];
    game.fighters.B.currentHp = game.fighters.B.maxHp;

    els.log.innerHTML = "";
    game.phase = "running";
    setScreenState("BATTLE");
    measureArena();
    resetTrainingPositions();
    initializeSkillTimers(0);
    resetTrainingCooldowns(false);
    resetTrainingStats();
    renderCharacterPanels();
    renderSkillCardsForFighters();
    renderFighterFaces();
    placeFighters();
    updateAllStats();
    updateNicknameUi();
    updateTopUi();
    if (els.training.panel) els.training.panel.hidden = false;
    if (els.state) els.state.textContent = "훈련장";
    els.startButton.disabled = true;
    if (els.nextButton) els.nextButton.disabled = true;
    els.betA.disabled = true;
    els.betB.disabled = true;
    els.betAmount.disabled = true;
    game.combatClock.now = 0;
    game.combatClock.paused = false;
    game.combatClock.timeScale = 1;
    game.lastTime = performance.now();
    startBattleTimer(0);
    addLog(`${character.name} 훈련장 진입`, "skill");
    updateDevControls();
    syncCombatControlsUi();
    game.animationId = requestAnimationFrame(tick);
  }

  function resetTrainingBattle() {
    if (!game.trainingMode) return;
    clearTrainingCollisionTest();
    const character = (game.fighters.A && game.fighters.A.data) || window.CHARACTERS[game.trainingCharacterIndex] || window.CHARACTERS[0];
    prepareTrainingWithCharacter(character);
  }

  function exitTrainingMode() {
    if (!game.trainingMode) return;
    stopBattleLoop();
    clearTrainingCollisionTest();
    clearScheduledTimers();
    resetBattleEndingState();
    closeBattleLog({ resetScroll: true });
    clearRoundEffects();
    resetCombatControls();
    resetBattleTimer();
    game.trainingMode = false;
    game.rankingRegistered = false;
    game.devForcedGame = false;
    if (els.training.panel) els.training.panel.hidden = true;
    goToMainMenu();
  }

  function resetTrainingStats() {
    game.trainingStats.totalDamage = 0;
    game.trainingStats.lastDamage = 0;
    game.trainingStats.startedAt = game.combatClock.now || 0;
    game.trainingStats.lastSkillName = "스킬 대기";
    updateTrainingStatsUi(game.combatClock.now || 0);
  }

  function recordTrainingDamage(amount, label = "피해") {
    const value = Math.max(0, Number(amount) || 0);
    if (value <= 0) return;
    game.trainingStats.totalDamage += value;
    game.trainingStats.lastDamage = value;
    game.trainingStats.lastSkillName = label;
    updateTrainingStatsUi(getBattleNow());
  }

  function updateTrainingStatsUi(now = getBattleNow()) {
    if (!game.trainingMode || !els.training.panel) return;
    const elapsedSeconds = Math.max(0.1, (now - (game.trainingStats.startedAt || 0)) / 1000);
    if (els.training.selectedSkill) els.training.selectedSkill.textContent = game.trainingStats.lastSkillName || "스킬 대기";
    if (els.training.totalDamage) els.training.totalDamage.textContent = formatAmount(game.trainingStats.totalDamage);
    if (els.training.lastDamage) els.training.lastDamage.textContent = formatAmount(game.trainingStats.lastDamage);
    if (els.training.dps) els.training.dps.textContent = formatAmount(game.trainingStats.totalDamage / elapsedSeconds);
    syncTrainingCollisionButton();
  }

  function isTrainingDummy(entity) {
    return !!(entity && entity.isTrainingDummy);
  }

  function reviveTrainingDummyIfNeeded() {
    const dummy = game.fighters.B;
    if (!isTrainingDummy(dummy)) return;
    if (dummy.currentHp > 0 && !dummy.dead) return;
    dummy.dead = false;
    dummy.currentHp = dummy.maxHp;
    refreshOiiaSize(dummy);
  }

  function resetTrainingPositions() {
    if (!game.fighters.A || !game.fighters.B) return;
    clearTrainingCollisionTest();
    const size = game.arenaSize || 560;
    const a = game.fighters.A;
    const b = game.fighters.B;
    a.x = size * 0.28;
    a.y = size * 0.5;
    b.x = size * 0.72;
    b.y = size * 0.5;
    a.vx = 0;
    a.vy = 0;
    b.vx = 0;
    b.vy = 0;
    placeFighters();
  }

  function clearTrainingCollisionTest() {
    const state = game.trainingCollisionTest;
    if (!state) return;
    if (state.hitTask) {
      state.hitTask.cancelled = true;
      game.timeouts.delete(state.hitTask);
    }
    if (state.restoreTask) {
      state.restoreTask.cancelled = true;
      game.timeouts.delete(state.restoreTask);
    }
    state.active = false;
    state.hitTask = null;
    state.restoreTask = null;
    syncTrainingCollisionButton();
  }

  function syncTrainingCollisionButton() {
    if (!els.training || !els.training.collision) return;
    const fighter = game.fighters.A;
    const now = getBattleNow();
    const active = !!(game.trainingCollisionTest && game.trainingCollisionTest.active);
    const busy = !!(fighter && (fighter.skillState || fighter.recoveryUntil > now));
    const disabled = !game.trainingMode || active || busy || game.battleEnding;
    els.training.collision.disabled = disabled;
    els.training.collision.textContent = active ? "충돌 중" : "1회 충돌";
  }

  function runTrainingCollisionOnce() {
    if (!game.trainingMode || game.battleEnding) return;
    const fighter = game.fighters.A;
    const dummy = game.fighters.B;
    const now = getBattleNow();
    if (!fighter || !dummy || !isTrainingDummy(dummy)) return;
    if (game.trainingCollisionTest.active) return;
    if (fighter.skillState || fighter.recoveryUntil > now) {
      game.trainingStats.lastSkillName = "스킬 종료 후 충돌 가능";
      updateTrainingStatsUi(now);
      return;
    }

    const saved = {
      a: {
        x: fighter.x,
        y: fighter.y,
        vx: fighter.vx,
        vy: fighter.vy
      },
      b: {
        x: dummy.x,
        y: dummy.y,
        vx: dummy.vx,
        vy: dummy.vy,
        hp: dummy.currentHp,
        dead: dummy.dead
      },
      lastBodyDamageAt: game.lastBodyDamageAt
    };

    let dx = dummy.x - fighter.x;
    let dy = dummy.y - fighter.y;
    let distance = Math.hypot(dx, dy);
    if (!distance) {
      dx = 1;
      dy = 0;
      distance = 1;
    }
    const dirX = dx / distance;
    const dirY = dy / distance;
    const approachDistance = Math.min(distance * 0.48, game.arenaSize * 0.12);
    fighter.x = saved.a.x + dirX * approachDistance;
    fighter.y = saved.a.y + dirY * approachDistance;
    fighter.vx = dirX * getPixelSpeed(fighter) * 4;
    fighter.vy = dirY * getPixelSpeed(fighter) * 4;
    dummy.vx = 0;
    dummy.vy = 0;
    placeFighters();

    const state = game.trainingCollisionTest;
    state.active = true;
    game.trainingStats.lastSkillName = "1회 충돌 준비";
    updateTrainingStatsUi(now);

    state.hitTask = scheduleTimeout(() => {
      if (!game.trainingMode || !state.active || !game.fighters.A || !game.fighters.B) return;
      const hitNow = getBattleNow();
      const player = game.fighters.A;
      const target = game.fighters.B;
      clearBlueEyesCollisionContact(player, target);
      clearRampageCollisionContact(player, target);
      const overlapDistance = Math.max(1, player.radius + target.radius - 3);
      player.x = target.x - dirX * overlapDistance;
      player.y = target.y - dirY * overlapDistance;
      player.vx = dirX * getPixelSpeed(player) * 3.6;
      player.vy = dirY * getPixelSpeed(player) * 3.6;
      target.vx = 0;
      target.vy = 0;
      game.lastBodyDamageAt = hitNow - getBodyDamageCooldown(player, target, hitNow) - 1;
      resolveCircleCollision(player, target, hitNow);
      target.dead = false;
      target.currentHp = Math.max(1, saved.b.hp);
      refreshOiiaSize(target);
      game.trainingStats.lastSkillName = "1회 충돌 완료";
      updateAllStats();
      placeFighters();

      state.restoreTask = scheduleTimeout(() => {
        if (!game.trainingMode || !game.fighters.A || !game.fighters.B) {
          clearTrainingCollisionTest();
          return;
        }
        const restoredPlayer = game.fighters.A;
        const restoredDummy = game.fighters.B;
        restoredPlayer.x = saved.a.x;
        restoredPlayer.y = saved.a.y;
        restoredPlayer.vx = saved.a.vx;
        restoredPlayer.vy = saved.a.vy;
        restoredDummy.x = saved.b.x;
        restoredDummy.y = saved.b.y;
        restoredDummy.vx = saved.b.vx;
        restoredDummy.vy = saved.b.vy;
        restoredDummy.dead = saved.b.dead;
        restoredDummy.currentHp = Math.max(1, saved.b.hp);
        clearBlueEyesCollisionContact(restoredPlayer, restoredDummy);
        clearRampageCollisionContact(restoredPlayer, restoredDummy);
        game.lastBodyDamageAt = saved.lastBodyDamageAt;
        placeFighters();
        updateAllStats();
        state.active = false;
        state.hitTask = null;
        state.restoreTask = null;
        syncTrainingCollisionButton();
      }, 120);
    }, 80);
  }

  function runJarvanNaturalDeathTrainingTest() {
    if (!game.trainingMode || game.battleEnding) return;
    const fighter = game.fighters.A;
    const now = getBattleNow();
    if (!fighter || fighter.abilityType !== "jarvanTimedWall") return;
    if (fighter.naturalDeathEffect) return;
    if (fighter.skillState || fighter.recoveryUntil > now || game.trainingCollisionTest.active) {
      game.trainingStats.lastSkillName = "행동 종료 후 자연사 테스트 가능";
      updateTrainingStatsUi(now);
      return;
    }
    triggerJarvanNaturalDeath(fighter, now, { trainingTest: true });
  }

  function runMuzanTrainingAction(action) {
    if (!game.trainingMode || game.battleEnding) return;
    const fighter = game.fighters.A;
    const dummy = game.fighters.B;
    const now = getBattleNow();
    if (!fighter || fighter.abilityType !== "muzanBiology") return;
    if (action === "muzanCellFull") {
      fighter.muzanCellGauge = fighter.muzanCellMax || MUZAN_CELL_MAX;
      addLog("훈련장: 무잔 세포 100", "good");
    } else if (action === "muzanCellEmpty") {
      fighter.muzanCellGauge = 0;
      addLog("훈련장: 무잔 세포 0", "skill");
    } else if (action === "muzanBloodAdd") {
      addMuzanBloodStack(fighter, dummy, now, `training-muzan-blood-${Math.round(now)}`);
      addLog("훈련장: 허수아비 무잔의 피 +1", "skill");
    } else if (action === "muzanBloodReset") {
      clearMuzanBloodRecord(dummy, fighter);
      addLog("훈련장: 무잔의 피 초기화", "skill");
    } else if (action === "muzanFatalTest") {
      fighter.muzanCellGauge = Math.max(50, Number(fighter.muzanCellGauge) || 0);
      fighter.muzanFatalRegenUsed = false;
      applyDamage(dummy, fighter, {
        label: "치명상 재생 테스트",
        fixedDamage: fighter.currentHp + 10,
        ignoreDefense: true,
        ignoreDamageReduction: true,
        ignoreGojoInfinity: true,
        attackId: `training-muzan-fatal-${Math.round(now)}`
      });
    } else if (action === "muzanSunriseTest") {
      startMuzanSunrise(fighter, now);
      addLog("훈련장: 일출 테스트", "bad");
    }
    updateMuzanArenaCellGauge(fighter);
    updateTrainingStatsUi(now);
    updateAllStats();
  }

  function clearChainsawLooseEffects() {
    if (els.skillLayer) {
      els.skillLayer.querySelectorAll('[class*="chainsaw-"]').forEach((element) => removeElement(element));
    }
    Object.values(game.fighters).forEach((fighter) => {
      if (!fighter) return;
      removeElement(fighter.chainsawSuppressionEffect);
      fighter.chainsawSuppressionEffect = null;
      const element = getEntityElement(fighter);
      if (element) {
        element.classList.remove("chainsaw-dashing");
        if (!getActiveConceptSuppression(fighter, getBattleNow())) element.classList.remove("concept-suppressed-fighter");
      }
    });
  }

  function runChainsawTrainingAction(action) {
    if (!game.trainingMode || game.battleEnding) return;
    const fighter = game.fighters.A;
    const dummy = game.fighters.B;
    const now = getBattleNow();
    if (!fighter || fighter.abilityType !== "chainsawDevil") return;
    const typeMap = {
      chainsawCastGrab: "chainsawChainGrab",
      chainsawCastSpin: "chainsawSawSpin",
      chainsawCastHell: "chainsawHellArena"
    };
    if (typeMap[action]) {
      const index = fighter.skills.findIndex((skill) => skill.type === typeMap[action]);
      if (index >= 0 && !fighter.skillState) {
        fighter.nextSkillAt[index] = now;
        startSkillCast(fighter, dummy, fighter.skills[index], index, now);
      }
    }
    updateChainsawArenaGauge(fighter, now);
    updateTrainingStatsUi(now);
    updateAllStats();
  }

  function runHimTrainingAction(action) {
    if (!game.trainingMode || game.battleEnding) return;
    const fighter = game.fighters.A;
    const dummy = game.fighters.B;
    const now = getBattleNow();
    if (!fighter || fighter.abilityType !== "himCharm" || !dummy) return;
    if (action === "himCharmFull") {
      addHimCharmGauge(fighter, dummy, HIM_CHARM_MAX, now, "DEV 테스트");
      game.trainingStats.lastSkillName = "매혹 게이지 100";
    } else if (action === "himCastUltimate") {
      const index = fighter.skills.findIndex((skill) => skill.type === "himAbsoluteCharm");
      if (index >= 0 && !fighter.skillState) {
        fighter.nextSkillAt[index] = now;
        startSkillCast(fighter, dummy, fighter.skills[index], index, now);
      }
      game.trainingStats.lastSkillName = "절대 매혹 테스트";
    } else if (action === "himResetState") {
      resetHimState(fighter);
      resetHimState(dummy);
      game.trainingStats.lastSkillName = "HIM 상태 초기화";
      addLog("HIM 상태 초기화", "good");
    }
    updateTrainingStatsUi(now);
    updateAllStats();
  }

  function updateChainsawDevDebug() {
    if (els.training.panel) removeElement(els.training.panel.querySelector(".chainsaw-dev-debug"));
  }

  function restoreTrainingHealth() {
    if (!game.trainingMode) return;
    clearTrainingCollisionTest();
    Object.values(game.fighters).forEach((fighter) => {
      if (!fighter) return;
      fighter.dead = false;
      fighter.currentHp = fighter.maxHp;
      refreshOiiaSize(fighter);
      getFighterElement(fighter).classList.remove("defeated");
    });
    updateAllStats();
    addLog("훈련장 체력 회복", "good");
  }

  function resetTrainingCooldowns(logMessage = true) {
    if (!game.trainingMode || !game.fighters.A) return;
    const now = getBattleNow();
    game.fighters.A.nextSkillAt = {};
    game.fighters.A.skills.forEach((skill, index) => {
      game.fighters.A.nextSkillAt[index] = now;
    });
    game.fighters.A.recoveryUntil = 0;
    game.fighters.A.recoverySkill = null;
    getFighterElement(game.fighters.A).classList.remove("recovering");
    updateAllStats();
    if (logMessage) addLog("훈련장 쿨타임 초기화", "skill");
  }

  function cleanseTrainingStatuses() {
    if (!game.trainingMode) return;
    Object.values(game.fighters).forEach((fighter) => {
      if (!fighter) return;
      fighter.slowUntil = 0;
      fighter.slowMultiplier = 1;
      fighter.stunUntil = 0;
      fighter.muzanNeuralUntil = 0;
      fighter.damageReduction = 0;
      fighter.telekinesisControlled = false;
      clearMaugaBurns(fighter);
      clearBlueEyesDebuffs(fighter);
      clearAllMuzanBloodRecords(fighter);
      clearConceptSuppression(fighter);
      resetHimState(fighter);
      updateEntitySlowEffect(fighter, getBattleNow());
      updateStunState(fighter, getBattleNow());
    });
    updateAllStats();
    addLog("훈련장 상태이상 제거", "good");
  }

  function castTrainingSkill(index) {
    if (!game.trainingMode) return;
    const fighter = game.fighters.A;
    const dummy = game.fighters.B;
    const skill = fighter && fighter.skills[index];
    const now = getBattleNow();
    if (!fighter || !dummy || !skill) return;
    if (fighter.skillState || fighter.recoveryUntil > now) {
      game.trainingStats.lastSkillName = "시전 중입니다";
      updateTrainingStatsUi(now);
      return;
    }
    if (now < (fighter.nextSkillAt[index] || 0)) {
      game.trainingStats.lastSkillName = "쿨타임 대기";
      updateTrainingStatsUi(now);
      return;
    }
    if (!shouldStartSkillNow(fighter, dummy, skill, now)) {
      game.trainingStats.lastSkillName = skill.type === "battlefieldCompression"
        ? "압축벽 유지 중"
        : "사용 조건 대기";
      updateTrainingStatsUi(now);
      return;
    }
    if (isUltimateSkill(skill) && isUltimateLockedByOther(fighter, skill)) {
      game.trainingStats.lastSkillName = "궁극기 잠금 대기";
      updateTrainingStatsUi(now);
      return;
    }
    reviveTrainingDummyIfNeeded();
    resetTrainingPositions();
    game.trainingStats.lastSkillName = getBlueEyesSkillName(skill);
    updateTrainingStatsUi(now);
    startSkillCast(fighter, dummy, skill, index, now);
  }

  function setupDeveloperMode() {
    populateDevSelects();
    els.dev.trigger.addEventListener("click", openDevLogin);
    els.dev.loginClose.addEventListener("click", closeDevLogin);
    els.dev.codeSubmit.addEventListener("click", submitDevCode);
    els.dev.codeInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        submitDevCode();
      }
    });
    els.dev.panelClose.addEventListener("click", closeDevPanel);
    els.dev.closeMode.addEventListener("click", closeDevPanel);
    els.dev.applySelection.addEventListener("click", applyDevSelection);
    els.dev.trainingMode.addEventListener("click", startTrainingMode);
    els.dev.resetCurrent.addEventListener("click", resetCurrentDevPair);
    els.dev.randomPair.addEventListener("click", applyRandomDevPair);
    updateDevControls();
  }

  function populateDevSelects() {
    const options = window.CHARACTERS.map((character, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = character.name;
      return option;
    });

    els.dev.selectA.innerHTML = "";
    els.dev.selectB.innerHTML = "";
    options.forEach((option) => {
      els.dev.selectA.appendChild(option.cloneNode(true));
      els.dev.selectB.appendChild(option.cloneNode(true));
    });
  }

  function openDevLogin() {
    if (game.devMode) {
      openDevPanel();
      return;
    }
    els.dev.login.hidden = false;
    els.dev.trigger.setAttribute("aria-expanded", "true");
    els.dev.message.textContent = "";
    els.dev.codeInput.focus();
  }

  function closeDevLogin() {
    els.dev.login.hidden = true;
    els.dev.trigger.setAttribute("aria-expanded", "false");
    els.dev.codeInput.value = "";
    els.dev.message.textContent = "";
  }

  function submitDevCode() {
    const enteredCode = els.dev.codeInput.value.trim().toLowerCase();
    if (enteredCode === HIDDEN_HIM_CODE && applyHiddenHimOpponentCode()) {
      return;
    }
    if (enteredCode !== DEV_CODE) {
      els.dev.message.textContent = "개발자 코드가 올바르지 않습니다.";
      return;
    }

    closeDevLogin();
    openDevPanel();
    els.dev.codeInput.value = "";
  }

  function applyHiddenHimOpponentCode() {
    if (game.phase !== "betting" || game.trainingMode || !game.fighters.A || !game.fighters.B) {
      els.dev.message.textContent = "HIM 코드는 전투 시작 전 승부 예측 단계에서만 사용할 수 있습니다.";
      return false;
    }
    const him = findCharacterById("him");
    if (!him) {
      els.dev.message.textContent = "HIM 리소스를 찾을 수 없습니다.";
      console.warn("[HIM] hidden character data not found");
      return false;
    }
    const previousBet = game.selectedBet;
    const previousLockedBet = game.lockedBet;
    game.fighters.B = createFighterState(him, "B");
    game.selectedBet = previousBet;
    game.lockedBet = previousLockedBet;
    measureArena();
    resetPositions();
    renderCharacterPanels();
    renderSkillCardsForFighters();
    renderFighterFaces();
    placeFighters();
    updateAllStats();
    updateButtons();
    syncDevSelectsWithCurrentFighters();
    addLog("히든 상대 HIM 출현", "ultimate");
    els.dev.message.textContent = "히든 상대 HIM 출현";
    window.setTimeout(() => closeDevLogin(), 450);
    return true;
  }

  function findCharacterById(id) {
    return (window.CHARACTERS || []).find((character) => character && character.id === id) || null;
  }

  function openDevPanel() {
    game.devMode = true;
    syncDevSelectsWithCurrentFighters();
    els.dev.panel.hidden = false;
    els.dev.badge.hidden = false;
    updateDevControls();
  }

  function closeDevPanel() {
    game.devMode = false;
    els.dev.panel.hidden = true;
    els.dev.badge.hidden = true;
    closeDevLogin();
  }

  function syncDevSelectsWithCurrentFighters() {
    setDevSelectToCharacter(els.dev.selectA, game.fighters.A);
    setDevSelectToCharacter(els.dev.selectB, game.fighters.B);
  }

  function setDevSelectToCharacter(select, fighter) {
    if (!fighter) return;
    const index = window.CHARACTERS.findIndex((character) => character.id === fighter.data.id);
    if (index >= 0) {
      select.value = String(index);
    }
  }

  function updateDevControls() {
    if (!els.dev.applySelection) return;
    const isRunning = !game.trainingMode && (game.phase === "battlefield" || game.phase === "countdown" || game.phase === "running" || game.phase === "ending" || game.battleEnding);
    els.dev.applySelection.disabled = isRunning;
    els.dev.resetCurrent.disabled = isRunning;
    els.dev.randomPair.disabled = isRunning;
    if (els.dev.trainingMode) els.dev.trainingMode.disabled = isRunning;
    els.dev.note.textContent = isRunning
      ? "전투 중에는 상태 꼬임을 막기 위해 적용 버튼을 비활성화합니다."
      : game.trainingMode
      ? "훈련장 모드입니다. 스킬 카드를 클릭해 직접 시전할 수 있습니다."
      : "테스트용 메뉴입니다. 캐릭터 배치와 코인은 자동으로 바뀌지 않습니다.";
  }

  function applyDevSelection() {
    if (!game.trainingMode && (game.phase === "battlefield" || game.phase === "countdown" || game.phase === "running" || game.phase === "ending" || game.battleEnding)) return;
    const characterA = window.CHARACTERS[Number(els.dev.selectA.value)];
    const characterB = window.CHARACTERS[Number(els.dev.selectB.value)];
    if (!characterA || !characterB) return;
    game.devForcedGame = true;
    game.trainingMode = false;
    if (els.training.panel) els.training.panel.hidden = true;
    prepareFightWithCharacters(characterA, characterB, {
      clearLog: true,
      message: `개발자 선택 적용: ${characterA.name} vs ${characterB.name}`,
      tone: "skill"
    });
    syncDevSelectsWithCurrentFighters();
  }

  function resetCurrentDevPair() {
    if (!game.trainingMode && (game.phase === "battlefield" || game.phase === "countdown" || game.phase === "running" || game.phase === "ending" || game.battleEnding || !game.fighters.A || !game.fighters.B)) return;
    const characterA = game.fighters.A.data;
    const characterB = isTrainingDummy(game.fighters.B)
      ? window.CHARACTERS[Number(els.dev.selectB.value)] || window.CHARACTERS[1] || window.CHARACTERS[0]
      : game.fighters.B.data;
    game.devForcedGame = true;
    game.trainingMode = false;
    if (els.training.panel) els.training.panel.hidden = true;
    prepareFightWithCharacters(characterA, characterB, {
      clearLog: true,
      message: `현재 조합 초기화: ${characterA.name} vs ${characterB.name}`,
      tone: "skill"
    });
    syncDevSelectsWithCurrentFighters();
  }

  function applyRandomDevPair() {
    if (!game.trainingMode && (game.phase === "battlefield" || game.phase === "countdown" || game.phase === "running" || game.phase === "ending" || game.battleEnding)) return;
    const pair = pickRandomPair(window.CHARACTERS);
    game.devForcedGame = true;
    game.trainingMode = false;
    if (els.training.panel) els.training.panel.hidden = true;
    prepareFightWithCharacters(pair[0], pair[1], {
      clearLog: true,
      message: `개발자 랜덤 조합: ${pair[0].name} vs ${pair[1].name}`,
      tone: "skill"
    });
    syncDevSelectsWithCurrentFighters();
  }

  function renderCharacterPanels() {
    renderPanel("A", game.fighters.A);
    renderPanel("B", game.fighters.B);
  }

  function renderPanel(side, fighter) {
    const panel = els.panel[side];
    panel.name.textContent = fighter.name;
    panel.description.textContent = fighter.description;
    panel.ability.textContent = isBlueEyesFighter(fighter) && !fighter.blueEyesEvolved
      ? "???"
      : abilityLabels[fighter.abilityType] || "기본 충돌 전투";
    renderPortrait(panel.portrait, fighter);
  }

  function renderSkillCardsForFighters() {
    renderSkillCards("A", game.fighters.A);
    renderSkillCards("B", game.fighters.B);
  }

  function renderSkillCards(side, fighter) {
    const matchupContainer = els.matchupSkills[side];
    const battleContainer = els.battleSkills[side];
    [matchupContainer, battleContainer].forEach((container) => {
      if (!container || !fighter) return;
      container.innerHTML = "";
      container.scrollTop = 0;
      container.appendChild(createSkillCard(side, fighter, null, -1, container === battleContainer));
      fighter.skills.forEach((skill, index) => {
        container.appendChild(createSkillCard(side, fighter, skill, index, container === battleContainer));
      });
      if (game.trainingMode && side === "A" && container === battleContainer && fighter.abilityType === "jarvanTimedWall") {
        container.appendChild(createJarvanNaturalDeathTestCard(side));
      }
      if (game.trainingMode && side === "A" && container === battleContainer && fighter.abilityType === "muzanBiology") {
        [
          ["muzanCellFull", "세포 100", "세포 게이지를 가득 채움"],
          ["muzanCellEmpty", "세포 0", "세포 게이지를 비움"],
          ["muzanBloodAdd", "무잔의 피 +1", "허수아비에 1중첩 추가"],
          ["muzanBloodReset", "무잔의 피 초기화", "허수아비 중첩 제거"],
          ["muzanFatalTest", "치명상 재생 테스트", "세포 50 이상에서 체력 0 처리"],
          ["muzanSunriseTest", "일출 테스트", "훈련장 전용 일출 발동"]
        ].forEach(([action, title, summary]) => {
          container.appendChild(createMuzanTrainingActionCard(side, action, title, summary));
        });
      }
      if (game.trainingMode && side === "A" && container === battleContainer && fighter.abilityType === "chainsawDevil") {
        [
          ["chainsawCastGrab", "사슬 그랩 발동", "사슬 2개로 끌어오고 소멸 스택 +1"],
          ["chainsawCastSpin", "회전 톱날 발동", "7초 동안 거대한 회전톱날 전개"],
          ["chainsawCastHell", "지옥의 전장 발동", "중앙 돌진 후 사방 톱날 장벽"]
        ].forEach(([action, title, summary]) => {
          container.appendChild(createMuzanTrainingActionCard(side, action, title, summary));
        });
      }
      if (game.trainingMode && side === "A" && container === battleContainer && fighter.abilityType === "himCharm") {
        [
          ["himCharmFull", "매혹 게이지 100", "허수아비를 즉시 매혹 상태로 전환"],
          ["himCastUltimate", "절대 매혹 테스트", "HIM 궁극기 직접 발동"],
          ["himResetState", "HIM 상태 초기화", "매혹·궁극기 상태와 이펙트 제거"]
        ].forEach(([action, title, summary]) => {
          container.appendChild(createMuzanTrainingActionCard(side, action, title, summary));
        });
      }
      syncSkillListScrollState(container);
    });
  }

  function createMuzanTrainingActionCard(side, action, title, summary) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "skill-card compact training-muzan-card";
    card.dataset.side = side;
    card.dataset.skillIndex = "-99";
    card.dataset.trainingAction = action;
    const kindEl = document.createElement("span");
    kindEl.className = "skill-kind";
    kindEl.textContent = "개발자";
    const nameEl = document.createElement("strong");
    nameEl.textContent = title;
    const summaryEl = document.createElement("small");
    summaryEl.textContent = summary;
    const statusEl = document.createElement("span");
    statusEl.className = "skill-status ready";
    statusEl.textContent = "훈련장 전용";
    const cooldownEl = document.createElement("b");
    cooldownEl.className = "skill-cooldown";
    cooldownEl.textContent = "";
    const progressEl = document.createElement("span");
    progressEl.className = "skill-progress";
    progressEl.setAttribute("aria-hidden", "true");
    const progressFill = document.createElement("i");
    progressFill.className = "skill-progress-fill";
    progressEl.appendChild(progressFill);
    card.append(kindEl, nameEl, summaryEl, statusEl, cooldownEl, progressEl);
    return card;
  }

  function createJarvanNaturalDeathTestCard(side) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "skill-card compact training-natural-death-card";
    card.dataset.side = side;
    card.dataset.skillIndex = "-99";
    card.dataset.trainingAction = "jarvanNaturalDeath";

    const kindEl = document.createElement("span");
    kindEl.className = "skill-kind";
    kindEl.textContent = "개발자";
    const nameEl = document.createElement("strong");
    nameEl.textContent = "자연사 테스트";
    const summaryEl = document.createElement("small");
    summaryEl.textContent = "정해진 종점 연출 확인";
    const statusEl = document.createElement("span");
    statusEl.className = "skill-status ready";
    statusEl.textContent = "훈련장 전용";
    const cooldownEl = document.createElement("b");
    cooldownEl.className = "skill-cooldown";
    cooldownEl.textContent = "";
    const progressEl = document.createElement("span");
    progressEl.className = "skill-progress";
    progressEl.setAttribute("aria-hidden", "true");
    const progressFill = document.createElement("i");
    progressFill.className = "skill-progress-fill";
    progressEl.appendChild(progressFill);
    card.append(kindEl, nameEl, summaryEl, statusEl, cooldownEl, progressEl);
    card.title = "자연사 테스트 - 훈련장에서 결과 화면 없이 자연사 연출을 확인합니다.";
    return card;
  }

  function createSkillCard(side, fighter, skill, index, compact = false) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `skill-card${compact ? " compact" : ""}${skill && skill.isUltimate ? " ultimate" : ""}`;
    if (isBlueEyesFighter(fighter) && (!skill || isBlueEyesSkill(skill))) {
      card.classList.add("blue-eyes-skill");
    }
    card.dataset.side = side;
    card.dataset.skillIndex = String(index);
    const masked = isMaskedBlueEyesMatchupSkill(fighter, skill, index, compact);
    if (masked) {
      card.dataset.masked = "true";
    }
    const kind = getSkillKind(skill, index);
    const name = masked ? "???" : (skill ? getBlueEyesSkillName(skill) : getPassiveTitle(fighter));
    const summary = masked ? "???" : (skill ? getSkillSummary(skill) : abilityLabels[fighter.abilityType] || "기본 충돌 전투");
    card.innerHTML = "";
    const kindEl = document.createElement("span");
    kindEl.className = "skill-kind";
    kindEl.textContent = kind;
    const nameEl = document.createElement("strong");
    nameEl.textContent = name;
    const summaryEl = document.createElement("small");
    summaryEl.textContent = summary;
    const cooldownEl = document.createElement("b");
    cooldownEl.className = "skill-cooldown";
    cooldownEl.textContent = "";
    const statusEl = document.createElement("span");
    statusEl.className = "skill-status";
    statusEl.textContent = "";
    const progressEl = document.createElement("span");
    progressEl.className = "skill-progress";
    progressEl.setAttribute("aria-hidden", "true");
    const progressFill = document.createElement("i");
    progressFill.className = "skill-progress-fill";
    progressEl.appendChild(progressFill);
    card.append(kindEl, nameEl, summaryEl, statusEl, cooldownEl, progressEl);
    card.title = `${name} - ${summary}`;
    return card;
  }

  function isMaskedBlueEyesMatchupSkill(fighter, skill, index, compact) {
    return !compact && isBlueEyesFighter(fighter) && !fighter.blueEyesEvolved && !skill && index < 0;
  }

  function syncSkillListScrollState(container) {
    container.classList.toggle("is-scrollable", container.children.length > 4);
  }

  function getSkillKind(skill, index) {
    if (!skill || index < 0) return "패시브";
    return skill.isUltimate ? "궁극기" : "스킬";
  }

  function getPassiveTitle(fighter) {
    return passiveTitles[fighter.abilityType] || "고유 능력";
  }

  function getSkillSummary(skill) {
    if (skill && skill.type === "enmaYamatoFlash") {
      return "최대 체력 35% 고정 피해 · 체력 30% 이하 처형 · 쿨 24초";
    }
    if (skill && skill.type === "lastSubwayRush") {
      return "피해 32 · 기절 1.5초 · 벽 반사 6회";
    }
    if (skill && skill.type === "battlefieldCompression") {
      return "설치 5초 · 이동 0.8초 · 쿨 14초";
    }
    if (skill && skill.type === "oiiaAllOutAttack") {
      return "본체+분신 투사체 · 피해 현재 체력/4 · 쿨 12초";
    }
    if (skill && skill.type === "oiiaGreatSpin") {
      return "무적 5초 · 분신 충돌 활성화";
    }
    if (skill && skill.type === "chainsawChainGrab") {
      return "피해 없음 · 끌어오기 · 소멸 +1";
    }
    if (skill && skill.type === "chainsawSawSpin") {
      return "직사각형 경로 · 틱 피해 5 · 쿨 16초";
    }
    if (skill && skill.type === "chainsawHellArena") {
      return "돌진 20 · 벽 톱날 8초 · 쿨 30초";
    }
    if (skill && skill.type === "himGazeLock") {
      return "피해 20 · 둔화 1.2초 · 매혹 +35";
    }
    if (skill && skill.type === "himForbiddenGesture") {
      return "끌어오기 · 매혹 +45 · 쿨 11초";
    }
    if (skill && skill.type === "himAbsoluteCharm") {
      return "피해 45 · 절대 매혹 5초 · 쿨 25초";
    }
    if (skill && skill.type === "gojoBlue") {
      return "반사 투사체 · 지속 흡인 · 회수 시 파란 구체";
    }
    if (skill && skill.type === "gojoRed") {
      return "반사 투사체 · 지속 밀침 · 회수 시 빨간 구체";
    }
    if (skill && skill.type === "gojoUnlimitedVoid") {
      return "5초 행동 불가 · 창/혁 쿨 2.5초 · 종료 피해 18";
    }
    if (skill && skill.type === "muzanBlackBloodWhip") {
      return `6방향 · 피해 ${formatAmount(skill.damage)} · 쿨 ${formatMs(skill.cooldown)}`;
    }
    if (skill && skill.type === "muzanCellCollapse") {
      return `중첩 피해 · 최대 ${formatAmount(skill.damageCap)} · 쿨 ${formatMs(skill.cooldown)}`;
    }
    if (skill && skill.type === "muzanNeuralShockwave") {
      return `3파동 · 피해 ${formatAmount(skill.damage)}x3 · 신경 교란`;
    }
    if (skill && skill.type === "muzanDemonKing") {
      return `6초 해방 · 최대 7중첩 · 쿨 ${formatMs(skill.cooldown)}`;
    }
    if (skill && skill.type === "blueEyesTripleBurstStream") {
      return "1.5초 충전 · 외곽 18 · 중심 45 · 2초 기절";
    }
    if (skill && skill.type === "blueEyesChaosDimension") {
      return "1.3초 예고 · 1.2초 흡인 · 폭발 3초 기절";
    }
    if (skill && skill.type === "blueEyesNeutronBlast") {
      return "사자후 후 운석 25개 · 2초 화상 장판 · 쿨 20초";
    }
    const parts = [];
    const damage = getPrimaryDamageText(skill);
    if (damage) parts.push(damage);
    if (Number.isFinite(Number(skill.hitCount))) parts.push(`${skill.hitCount}회 타격`);
    if (Number.isFinite(Number(skill.bulletCount))) parts.push(`${skill.bulletCount}발`);
    if (Number.isFinite(Number(skill.summonCount))) parts.push(`${skill.summonCount}회 소환`);
    if (Number.isFinite(Number(skill.duration))) parts.push(`지속 ${formatMs(skill.duration)}`);
    if (Number.isFinite(Number(skill.cooldown))) parts.push(`쿨 ${formatMs(skill.cooldown)}`);
    if (Number.isFinite(Number(skill.initialCooldown))) parts.push(`첫 사용 ${formatMs(skill.initialCooldown)}`);
    return parts.slice(0, 3).join(" · ") || "특수 능력";
  }

  function getPrimaryDamageText(skill) {
    const damageKeys = [
      "damage",
      "beamDamage",
      "maxBeamDamage",
      "maxPatternDamage",
      "hitDamage",
      "finalBonusDamage",
      "hit1Damage",
      "hit2Damage",
      "hit3Damage",
      "q1Damage",
      "q1CoreDamage",
      "q2Damage",
      "q2CoreDamage",
      "q3Damage",
      "q3CoreDamage",
      "initialDamage",
      "pullDamage",
      "gunnyDamage",
      "chachaDamage",
      "chargeDamage",
      "slamDamage",
      "outerDamage",
      "coreDamage",
      "shockwaveDamage",
      "wallBonusDamage"
    ];
    const values = damageKeys
      .filter((key) => Number.isFinite(Number(skill[key])))
      .slice(0, 2)
      .map((key) => formatAmount(skill[key]));
    return values.length ? `피해 ${values.join("+")}` : "";
  }

  function formatMs(value) {
    const ms = Number(value);
    if (!Number.isFinite(ms)) return "";
    return ms >= 1000 ? `${formatAmount(ms / 1000)}초` : `${Math.round(ms)}ms`;
  }

  function handleSkillCardClick(event) {
    const card = event.target.closest(".skill-card");
    if (!card) return;
    const side = card.dataset.side;
    const fighter = game.fighters[side];
    if (!fighter) return;
    if (card.dataset.trainingAction === "jarvanNaturalDeath") {
      runJarvanNaturalDeathTrainingTest();
      return;
    }
    if (card.dataset.trainingAction && card.dataset.trainingAction.startsWith("muzan")) {
      runMuzanTrainingAction(card.dataset.trainingAction);
      return;
    }
    if (card.dataset.trainingAction && card.dataset.trainingAction.startsWith("chainsaw")) {
      runChainsawTrainingAction(card.dataset.trainingAction);
      return;
    }
    if (card.dataset.trainingAction && card.dataset.trainingAction.startsWith("him")) {
      runHimTrainingAction(card.dataset.trainingAction);
      return;
    }
    if (card.dataset.masked === "true") {
      openMaskedSkillPopup(side);
      return;
    }
    const index = Number(card.dataset.skillIndex);
    if (
      game.trainingMode &&
      side === "A" &&
      index >= 0 &&
      els.battleSkills.A &&
      els.battleSkills.A.contains(card)
    ) {
      castTrainingSkill(index);
      return;
    }
    const skill = index >= 0 ? fighter.skills[index] : null;
    openSkillPopup(fighter, skill, index, side);
  }

  function openMaskedSkillPopup(side) {
    if (!els.skillPopup.root) return;
    els.skillPopup.root.classList.remove("side-a", "side-b");
    els.skillPopup.root.classList.add(side === "B" ? "side-b" : "side-a");
    els.skillPopup.kind.textContent = "패시브";
    els.skillPopup.title.textContent = "???";
    els.skillPopup.description.textContent = "???";
    els.skillPopup.stats.innerHTML = "";
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = "정보";
    dd.textContent = "???";
    els.skillPopup.stats.append(dt, dd);
    els.skillPopup.root.hidden = false;
  }

  function openSkillPopup(fighter, skill, index, side) {
    if (!els.skillPopup.root) return;
    const kind = getSkillKind(skill, index);
    els.skillPopup.root.classList.remove("side-a", "side-b");
    els.skillPopup.root.classList.add(side === "B" ? "side-b" : "side-a");
    els.skillPopup.kind.textContent = kind;
    els.skillPopup.title.textContent = skill ? getBlueEyesSkillName(skill) : `${fighter.name} 패시브`;
    els.skillPopup.description.textContent = getSkillDescription(fighter, skill, index);
    els.skillPopup.stats.innerHTML = "";
    getSkillDetailRows(fighter, skill).forEach(([label, value]) => {
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      els.skillPopup.stats.append(dt, dd);
    });
    els.skillPopup.root.hidden = false;
  }

  function closeSkillPopup() {
    if (els.skillPopup && els.skillPopup.root) {
      els.skillPopup.root.hidden = true;
      els.skillPopup.root.classList.remove("side-a", "side-b");
    }
  }

  function getSkillDescription(fighter, skill, index) {
    if (!skill || index < 0) {
      return abilityLabels[fighter.abilityType] || "기본 충돌 전투";
    }
    const descriptions = {
      circleMultiSlash: "자기 중심 원형 범위 안의 대상을 여러 번 다시 판정해 베어냅니다.",
      bloodMoonSlash: "고정된 방향으로 검붉은 초승달 참격을 날리고 적중 대상에게 둔화를 겁니다.",
      enmaYamatoFlash: "전장 끝으로 이동해 1.2초 동안 검붉은 기운을 모은 뒤 고정 방향의 초대형 직사각형 참격을 날립니다. 체력 30% 이하 본체는 처형하고, 그 외 대상은 최대 체력 35%의 고정 피해를 받습니다.",
      teleportWallStrike: "상대 위치를 예고한 뒤 순간이동 공격을 하고 원형 돌벽을 생성합니다.",
      battlefieldCompression: "전장 끝에서 거대한 돌벽을 밀어 넣어 공간을 압축하고 충돌을 유도합니다. 설치 후 자르반은 바로 다른 행동을 할 수 있습니다.",
      lastSubwayRush: "벽을 6번 반사하며 속도를 올린 뒤, 상대의 현재 이동을 짧게 예측해 고정 방향으로 초고속 돌진합니다.",
      threeLegRampage: "일시적으로 폭주해 이동 속도를 크게 높이고 충돌할수록 라운드 속도를 성장시킵니다.",
      deepSeaAmbush: "무작위 위치의 물결 범위에서 상어 습격을 일으켜 피해와 감속을 줍니다.",
      oiiaAllOutAttack: "본체와 모든 분신이 상대 위치를 예고한 뒤 각자의 현재 체력에 비례한 파란 투사체를 일제히 발사합니다.",
      oiiaGreatSpin: "5초간 모든 피해를 무시하고 분신끼리 충돌해 증식합니다.",
      himGazeLock: "HIM이 보라색 시선 광선을 발사해 피해를 주고 둔화와 매혹 게이지를 적용합니다.",
      himForbiddenGesture: "HIM이 검붉은 사슬과 보라색 파동으로 상대를 자신 쪽으로 끌어오되 충돌 반지름 밖에서 멈춥니다.",
      himAbsoluteCharm: "전장을 보라색 눈과 사슬 원형진으로 덮고 상대의 스킬과 궁극기를 5초 동안 봉쇄합니다.",
      gojoBlue: "푸른 중력 투사체를 발사합니다. 전장 벽에서 반사되며 주변 적을 계속 끌어당기고, 고죠에게 돌아오면 허식 재료가 됩니다.",
      gojoRed: "붉은 반발 투사체를 발사합니다. 전장 벽에서 반사되며 주변 적을 계속 밀어내고, 고죠에게 돌아오면 허식 재료가 됩니다.",
      gojoUnlimitedVoid: "5초 동안 상대를 행동 불가 상태로 가두고 고죠의 창과 혁 쿨타임을 2.5초로 줄이는 궁극기입니다.",
      muzanBlackBloodWhip: "사방으로 휘어지는 검붉은 채찍 6개를 순차적으로 휘둘러 피해를 주고 무잔의 피를 중첩시킵니다.",
      muzanCellCollapse: "무잔의 피가 있는 대상 주변을 압축해 피해를 주고 중첩을 흡수해 체력과 세포를 회복합니다.",
      muzanNeuralShockwave: "육체에서 불규칙한 생체 충격파 3개를 방출해 피해를 주고 첫 적중 대상의 신경을 교란합니다.",
      muzanDemonKing: "6초 동안 재생과 채찍을 해방하고 최대 중첩을 7로 올립니다. 종료 시 남은 중첩을 폭발시킵니다.",
      darkinBlade: "세 가지 검격을 연속으로 사용하며 핵심 범위 적중 시 더 강한 피해와 회복을 얻습니다.",
      infernalChains: "검붉은 사슬 투사체로 상대를 묶고 탈출하지 못하면 끌어당깁니다.",
      worldEnder: "일정 시간 크기, 이동 속도, 공격력과 회복량이 증가하는 궁극기입니다.",
      maugaGuns: "거리와 화상 상태에 따라 거니와 차차를 번갈아 또는 동시에 발사합니다.",
      maugaOverrun: "상대 방향으로 돌진한 뒤 내려찍고 심장 과부하 상태에 들어갑니다.",
      cageFight: "마우가와 상대를 원형 장벽 안에 가두는 궁극기입니다.",
      ronaldoFreeKick: "축구공을 고정 방향으로 강하게 차며 벽 반사 후에도 재충돌 피해를 줄 수 있습니다.",
      ronaldoHeader: "예측 지점으로 도약해 원형 충격파와 중앙 핵심 피해를 줍니다.",
      siuuuChampion: "짧은 시간 호날두를 강화하고 프리킥과 공중 지배를 연속기로 바꿉니다.",
      superBounceStorm: "여러 파동의 반사 탄환을 전방위로 퍼뜨리는 궁극기입니다.",
      ricoMultiBall: "리코 중심에서 여러 방향으로 탄환을 발사합니다.",
      ricoTrickShot: "벽 반사 경로를 노려 상대를 맞히는 기술입니다.",
      ricoBouncyShot: "짧은 간격으로 벽 반사 탄환을 연속 발사합니다.",
      enlightenmentField: "수도자를 따라다니는 금색 영역으로 적 투사체를 완전 반사합니다.",
      monkMeditation: "짧은 명상 상태에서 닿는 적 투사체를 원래 공격자에게 되돌립니다.",
      calmPalmStrike: "전방 부채꼴 손바닥 파동으로 적을 밀어내고 벽 충돌 추가 피해를 노립니다.",
      gasterBlaster: "가스터 블래스터가 경고 후 고정 방향 빔을 발사합니다.",
      blueTelekinesis: "상대를 염력으로 붙잡아 벽에 반복 충돌시킵니다.",
      gasterDoomBarrage: "전장을 가로지르는 여러 빔 패턴을 순차 발사하는 궁극기입니다.",
      blueEyesBurstStream: "전장을 가르는 청백색 관통 브레스로 강한 단발 피해를 줍니다.",
      blueEyesUltimateBurst: "진화 직후 세 갈래 레이저를 합쳐 적의 강화 효과를 모두 깨고 큰 피해를 줍니다.",
      blueEyesTripleHyperBurst: "세 머리가 연속 공격하고 마지막 타격으로 상대를 짧게 기절시킵니다.",
      blueEyesWrathDestruction: "적에게 돌진해 강타하고 적의 강화 효과 하나를 빼앗습니다.",
      blueEyesTripleBurstStream: "1.5초 동안 세 머리가 청백색 에너지를 충전한 뒤 2배 넓어진 세 갈래 레이저를 발사합니다. 적중 대상은 2초 동안 기절합니다.",
      blueEyesChaosDimension: "전장 중심에 설치한 블랙홀이 단계적으로 적을 끌어당기고, 마지막 폭발에 맞은 대상은 3초 동안 기절합니다.",
      blueEyesNeutronBlast: "사자후로 청백색 충격파를 퍼뜨린 뒤 전장 전체에 25개의 운석을 순차 낙하시킵니다. 각 운석은 2초 화상 장판을 남깁니다."
    };
    return descriptions[skill.type] || "자동 전투 중 조건을 만족하면 발동하는 캐릭터 스킬입니다.";
  }

  function getSkillDetailRows(fighter, skill) {
    if (!skill) {
      return [
        ["캐릭터", fighter.name],
        ["능력 유형", abilityLabels[fighter.abilityType] || "기본 충돌 전투"],
        ["최대 체력", String(fighter.maxHp)],
        ["공격 / 방어 / 속도", `${formatAmount(fighter.atk)} / ${formatAmount(fighter.def)} / ${formatAmount(fighter.speed)}`]
      ];
    }
    const labelMap = {
      damage: "피해",
      baseDamage: "기본 피해",
      damagePerStack: "중첩당 피해",
      damageCap: "피해 상한",
      whipCount: "채찍 수",
      maxHitsPerTarget: "대상별 최대 적중",
      maxConsumeStacks: "최대 흡수 중첩",
      healPerStack: "중첩당 회복",
      cellPerStack: "중첩당 세포",
      waveCount: "충격파 수",
      stunDuration: "경직",
      slowDuration: "감속 지속",
      slowRate: "감속률",
      autoWhipDamage: "자동 채찍 피해",
      autoWhipInterval: "자동 채찍 간격",
      endBaseDamage: "종료 기본 피해",
      endDamagePerStack: "종료 중첩 피해",
      endHealPerStack: "종료 중첩 회복",
      maxBloodStacks: "최대 중첩",
      beamDamage: "틱 피해",
      maxBeamDamage: "최대 빔 피해",
      maxPatternDamage: "패턴 최대 피해",
      shockwaveDamage: "충격파 피해",
      criticalMultiplier: "중심부 치명타",
      defenseIgnoreRate: "방어 무시",
      burnDamage: "화상 피해",
      hitDamage: "충돌 피해",
      finalBonusDamage: "마지막 추가 피해",
      hit1Damage: "1타 피해",
      hit2Damage: "2타 피해",
      hit3Damage: "3타 피해",
      q1Damage: "1타 피해",
      q1CoreDamage: "1타 핵심 피해",
      q2Damage: "2타 피해",
      q2CoreDamage: "2타 핵심 피해",
      q3Damage: "3타 피해",
      q3CoreDamage: "3타 핵심 피해",
      initialDamage: "최초 피해",
      pullDamage: "끌어오기 피해",
      gunnyDamage: "거니 탄환 피해",
      chachaDamage: "차차 탄환 피해",
      chargeDamage: "돌진 피해",
      slamDamage: "내려찍기 피해",
      outerDamage: "바깥 피해",
      coreDamage: "중앙 피해",
      wallBonusDamage: "벽 충돌 추가 피해",
      maxHpDamageRate: "최대 체력 고정 피해",
      executeThreshold: "처형 체력 조건",
      hitCount: "타격 횟수",
      bounceCount: "벽 반사 횟수",
      bulletCount: "탄환 수",
      bulletsPerWave: "파동당 탄환",
      waveCount: "파동 수",
      summonCount: "소환 횟수",
      maxBounces: "최대 반사",
      delay: "선딜",
      warningDuration: "경고 시간",
      duration: "지속 시간",
      moveDuration: "이동 시간",
      wallLengthRate: "벽 길이",
      wallThicknessRate: "벽 두께",
      cooldown: "쿨타임",
      initialCooldown: "최초 대기",
      recovery: "후딜",
      slowRate: "감속률",
      slowDuration: "감속 지속",
      blindDuration: "실명 지속",
      burnDuration: "화상 지속",
      burnInterval: "화상 간격",
      stunDuration: "기절 지속",
      stolenBuffDuration: "강탈 지속",
      dashDuration: "돌진 시간",
      damageReduction: "피해 감소",
      speedMultiplier: "속도 배율",
      atkMultiplier: "공격 배율",
      healMultiplier: "회복 배율",
      chachaCritMultiplier: "치명타 배율"
    };
    const preferredKeys = Object.keys(labelMap);
    const rows = [];
    preferredKeys.forEach((key) => {
      if (!Number.isFinite(Number(skill[key])) && typeof skill[key] !== "boolean") return;
      rows.push([labelMap[key], formatSkillValue(key, skill[key])]);
    });
    if (skill.isUltimate) rows.unshift(["구분", "궁극기"]);
    return rows.length ? rows : [["구분", "스킬"], ["요약", getSkillSummary(skill)]];
  }

  function formatSkillValue(key, value) {
    if (typeof value === "boolean") return value ? "적용" : "미적용";
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value);
    if (/duration|cooldown|delay|interval|recovery|lifetime|warning/i.test(key)) {
      return formatMs(number);
    }
    if (/rate|slow|reduction|multiplier|scale|growth/i.test(key)) {
      if (key.toLowerCase().includes("multiplier")) return `${formatAmount(number)}배`;
      return `${formatAmount(number * 100)}%`;
    }
    return formatAmount(number);
  }

  function renderPortrait(container, fighter) {
    container.innerHTML = "";
    container.classList.remove("has-character-image", "character-image-fallback", "has-image", "image-error");
    const sources = getFighterImageSources(fighter);
    if (!sources.length) {
      container.textContent = "이미지 준비중";
      container.classList.add("character-image-fallback", "image-error");
      return;
    }
    const img = document.createElement("img");
    img.className = "matchup-character-image-img";
    img.alt = fighter.name;
    img.style.objectFit = getFighterImageFit(fighter, "matchup");
    img.style.objectPosition = getFighterImagePosition(fighter, "matchup");
    img.style.visibility = "hidden";
    loadImageWithFallback(img, fighter, sources, () => {
      container.classList.add("has-character-image", "has-image");
      container.classList.remove("character-image-fallback", "image-error");
      img.style.visibility = "visible";
    }, () => {
      img.remove();
      container.textContent = "이미지 준비중";
      container.classList.remove("has-character-image", "has-image");
      container.classList.add("character-image-fallback", "image-error");
    });
    container.appendChild(img);
  }

  function renderFighterFaces() {
    renderFighterFace(els.fighterA, game.fighters.A);
    renderFighterFace(els.fighterB, game.fighters.B);
  }

  function renderFighterFace(element, fighter) {
    const nameSpan = element.querySelector(".fighter-name");
    nameSpan.textContent = fighter.side;
    element.classList.remove("has-image", "has-character-image", "character-image-fallback", "casting", "recovering", "rampaging", "slowed", "stunned", "ultimate-hidden", "ultimate-vanish", "ultimate-reappear", "chill-shielded", "chill-transformed", "mauga-fighter", "mauga-firing", "mauga-fire-gunny", "mauga-fire-chacha", "mauga-dual-fire", "mauga-overrun", "mauga-cage-active", "ronaldo-kicking", "ronaldo-jump-ready", "ronaldo-airborne", "ronaldo-ultimate", "monk-meditating", "monk-enlightened", "blue-eyes-evolved", "blue-eyes-invulnerable", "last-subway-rushing", "oiia-spin-charging", "oiia-great-spin", "muzan-ultimate-active", "muzan-fatal-regenerating", "gojo-infinity-flash", "gojo-infinity-collapsed", "gojo-domain-caster", "gojo-domain-locked", "chainsaw-dashing", "chainsaw-shredded", "concept-suppressed-fighter", "him-absolute-caster", "him-charmed", "him-absolute-charmed");
    removeMaugaWeapons(element);
    element.style.backgroundImage = "";
    element.querySelectorAll(".fighter-image-frame, .fighter-image").forEach((node) => node.remove());
    const sources = getFighterImageSources(fighter);
    if (!sources.length) {
      element.classList.add("character-image-fallback");
    }
    if (sources.length) {
      const frame = document.createElement("span");
      frame.className = "fighter-image-frame";
      const img = document.createElement("img");
      img.className = "fighter-image fighter-sprite";
      img.alt = fighter.name;
      img.style.objectFit = getFighterImageFit(fighter, "fighter");
      img.style.objectPosition = getFighterImagePosition(fighter, "fighter");
      img.style.visibility = "hidden";
      loadImageWithFallback(img, fighter, sources, () => {
        img.style.visibility = "visible";
        element.classList.add("has-image", "has-character-image");
        element.classList.remove("character-image-fallback");
      }, () => {
        frame.remove();
        element.classList.remove("has-image", "has-character-image");
        element.classList.add("character-image-fallback");
      });
      frame.appendChild(img);
      element.insertBefore(frame, nameSpan);
    }
    if (fighter.abilityType === "maugaBerserker") {
      ensureMaugaWeapons(fighter);
    }
    if (fighter.abilityType === "blueEyesFusion" && fighter.blueEyesEvolved) {
      element.classList.add("blue-eyes-evolved");
    }
    if (getActiveConceptSuppression(fighter, getBattleNow())) {
      element.classList.add("concept-suppressed-fighter");
    }
  }

  function getFighterImageSources(fighter) {
    const primary = (fighter && fighter.image) || (fighter && fighter.data && fighter.data.image) || "";
    const fallback = (fighter && fighter.imageFallback) || (fighter && fighter.data && fighter.data.imageFallback) || "";
    return [primary, fallback].filter((src, index, array) => src && array.indexOf(src) === index);
  }

  function loadImageWithFallback(img, fighter, sources, onLoad, onFail, index = 0) {
    if (!sources[index]) {
      onFail && onFail();
      return;
    }
    const src = sources[index];
    img.onload = () => {
      onLoad && onLoad(src);
    };
    img.onerror = () => {
      warnImageLoadFailure(fighter, src);
      loadImageWithFallback(img, fighter, sources, onLoad, onFail, index + 1);
    };
    img.src = src;
  }

  function warnImageLoadFailure(fighter, src) {
    const key = `${fighter && fighter.name ? fighter.name : "unknown"}|${src}`;
    if (IMAGE_FAILURE_WARNINGS.has(key)) return;
    IMAGE_FAILURE_WARNINGS.add(key);
    console.warn(`캐릭터 이미지 로딩 실패: ${fighter && fighter.name ? fighter.name : "알 수 없음"} - ${src}`);
  }

  function getFighterImageFit(fighter, purpose = "default") {
    const specificKey = `${purpose}ImageFit`;
    return (
      (fighter && fighter[specificKey]) ||
      (fighter && fighter.data && fighter.data[specificKey]) ||
      (purpose === "fighter" && ((fighter && fighter.imageFit) || (fighter && fighter.data && fighter.data.imageFit))) ||
      "contain"
    );
  }

  function getFighterImagePosition(fighter, purpose = "default") {
    const specificKey = `${purpose}ImagePosition`;
    return (
      (fighter && fighter[specificKey]) ||
      (fighter && fighter.data && fighter.data[specificKey]) ||
      (purpose === "fighter" && ((fighter && fighter.imagePosition) || (fighter && fighter.data && fighter.data.imagePosition))) ||
      "center"
    );
  }

  function updateAllStats() {
    updateStats("A", game.fighters.A);
    updateStats("B", game.fighters.B);
  }

  function updateStats(side, fighter) {
    const panel = els.panel[side];
    const hpRate = clamp(fighter.currentHp / fighter.maxHp, 0, 1);
    panel.hpText.textContent = `${Math.ceil(fighter.currentHp)} / ${fighter.maxHp}`;
    panel.hpBar.style.width = `${hpRate * 100}%`;
    updateMaugaTempHealthBar(panel.hpBar.parentElement, fighter, hpRate);
    panel.def.textContent = String(Math.round(fighter.def));
    if (fighter.abilityType === "chillSun") {
      panel.ability.textContent = fighter.chillTransformed
        ? "돌변: 붉은 태양과 검붉은 보호막"
        : abilityLabels[fighter.abilityType] || "중앙 태양과 느긋한 보호막";
    }
    if (fighter.abilityType === "speedCollisionRamp") {
      panel.atk.textContent = String(getProjectedCollisionDamage(fighter));
      panel.speed.textContent = `${formatAmount(fighter.speed)} / ${formatAmount(getTralalaMaxPermanentSpeed(fighter))}`;
    } else {
      panel.atk.textContent = String(Math.round(fighter.atk));
      panel.speed.textContent = getEffectiveSpeed(fighter).toFixed(1);
    }
    const miniHp = side === "A" ? els.miniHpA : els.miniHpB;
    miniHp.style.width = `${hpRate * 100}%`;
    setHealthFillColor(miniHp, hpRate);
    updateMaugaTempHealthBar(miniHp.parentElement, fighter, hpRate);
    updateBattleHud(side, fighter, hpRate);
    updateBattleCharacterCard(side, fighter, hpRate);
    updateSkillCardsState(side, fighter);
  }

  function updateBattleHud(side, fighter, hpRate) {
    const hud = els.hud[side];
    if (!hud || !hud.name) return;
    hud.name.textContent = fighter.name;
    hud.hpText.textContent = `${Math.ceil(fighter.currentHp)} / ${fighter.maxHp}`;
    hud.hpBar.style.width = `${hpRate * 100}%`;
    setHealthFillColor(hud.hpBar, hpRate);
    updateMaugaTempHealthBar(hud.hpBar.parentElement, fighter, hpRate);
    renderHudPortrait(hud.portrait, fighter, side);
    renderStatusIcons(hud.status, fighter);
  }

  function renderHudPortrait(container, fighter, side) {
    if (!container || !fighter) return;
    renderBackgroundPortrait(container, fighter, side);
  }

  function renderBackgroundPortrait(container, fighter, side) {
    const sources = getFighterImageSources(fighter);
    const purpose = container.classList.contains("result-character-portrait") ? "result" : "hud";
    const fit = getFighterImageFit(fighter, purpose);
    const position = getFighterImagePosition(fighter, purpose);
    const key = `${purpose}|${fighter.id || fighter.name}|${sources.join("|")}|${fit}|${position}`;
    if (container.dataset.renderKey === key) return;
    container.dataset.renderKey = key;
    container.classList.remove("has-image", "has-character-image", "character-image-fallback", "image-error");
    container.style.backgroundImage = "";
    container.innerHTML = "";
    const placeholder = document.createElement("span");
    placeholder.className = "portrait-placeholder";
    placeholder.textContent = side;
    container.appendChild(placeholder);
    if (!sources.length) {
      container.classList.add("character-image-fallback", "image-error");
      return;
    }
    const img = document.createElement("img");
    img.className = purpose === "result" ? "result-character-portrait-image" : "battle-hud-avatar-image";
    img.alt = fighter.name;
    img.style.objectFit = fit;
    img.style.objectPosition = position;
    img.style.visibility = "hidden";
    loadImageWithFallback(img, fighter, sources, () => {
      if (container.dataset.renderKey !== key) return;
      container.classList.add("has-image", "has-character-image");
      container.classList.remove("character-image-fallback", "image-error");
      img.style.visibility = "visible";
      placeholder.hidden = true;
    }, () => {
      if (container.dataset.renderKey !== key) return;
      container.classList.remove("has-image", "has-character-image");
      container.classList.add("character-image-fallback", "image-error");
      placeholder.hidden = false;
      img.remove();
    });
    container.appendChild(img);
  }

  function updateBattleCharacterCard(side, fighter, hpRate) {
    const view = els.battlePortraits && els.battlePortraits[side];
    if (!view || !view.card || !fighter) return;
    if (view.name) view.name.textContent = fighter.name;
    if (view.hp) {
      view.hp.textContent = `${formatAmount(Math.max(0, fighter.currentHp))} / ${formatAmount(fighter.maxHp)}`;
    }
    if (view.hpBar) {
      view.hpBar.style.width = `${clamp(hpRate, 0, 1) * 100}%`;
      setHealthFillColor(view.hpBar, hpRate);
    }
    if (view.atk) {
      view.atk.textContent = fighter.abilityType === "speedCollisionRamp"
        ? String(getProjectedCollisionDamage(fighter))
        : String(Math.round(fighter.atk));
    }
    if (view.def) view.def.textContent = String(Math.round(fighter.def));
    if (view.speed) {
      view.speed.textContent = fighter.abilityType === "speedCollisionRamp"
        ? `${formatAmount(fighter.speed)} / ${formatAmount(getTralalaMaxPermanentSpeed(fighter))}`
        : getEffectiveSpeed(fighter).toFixed(1);
    }
    renderBattleCharacterPortrait(view.portrait, fighter, side);
    updateGojoInfinityBattleUi(view.card, fighter);
    const state = getBattleCharacterFrameState(fighter);
    view.card.classList.remove(
      "is-dead",
      "is-shielded",
      "is-ultimate",
      "is-transformed",
      "is-burning",
      "is-slowed",
      "is-casting"
    );
    state.classes.forEach((className) => view.card.classList.add(className));
    view.card.style.setProperty("--battle-hp-rate", String(clamp(hpRate, 0, 1)));
  }

  function renderBattleCharacterPortrait(container, fighter, side) {
    if (!container || !fighter) return;
    const sources = getFighterImageSources(fighter);
    const fit = getFighterImageFit(fighter, "portrait");
    const position = getFighterImagePosition(fighter, "portrait");
    const key = `${fighter.id || fighter.name}|${sources.join("|")}|${fit}|${position}`;
    if (container.dataset.renderKey === key) return;
    container.dataset.renderKey = key;
    container.innerHTML = "";
    container.classList.remove("has-image", "has-character-image", "character-image-fallback", "image-error");
    const initial = document.createElement("span");
    initial.className = "battle-portrait-initial";
    initial.textContent = getBattlePortraitInitial(fighter, side);
    const pending = document.createElement("small");
    pending.textContent = "이미지 준비 중";
    container.append(initial, pending);
    if (!sources.length) {
      container.classList.add("character-image-fallback", "image-error");
      return;
    }
    const img = document.createElement("img");
    img.className = "battle-side-portrait-image";
    img.alt = fighter.name;
    img.style.objectFit = fit;
    img.style.objectPosition = position;
    img.style.visibility = "hidden";
    loadImageWithFallback(img, fighter, sources, () => {
      if (container.dataset.renderKey !== key) return;
      container.classList.add("has-image", "has-character-image");
      container.classList.remove("character-image-fallback", "image-error");
      img.style.visibility = "visible";
      initial.hidden = true;
      pending.hidden = true;
    }, () => {
      if (container.dataset.renderKey !== key) return;
      container.classList.remove("has-image", "has-character-image");
      container.classList.add("character-image-fallback", "image-error");
      initial.hidden = false;
      pending.hidden = false;
      img.remove();
    });
    container.appendChild(img);
  }

  function getBattlePortraitInitial(fighter, side) {
    const name = String((fighter && fighter.name) || side || "").trim();
    return name ? Array.from(name)[0] : side;
  }

  function getBattleCharacterFrameState(fighter) {
    const now = getBattleNow();
    const labels = [];
    const classes = [];
    if (fighter.dead || fighter.currentHp <= 0) {
      labels.push("사망");
      classes.push("is-dead");
    }
    if (fighter.skillState && fighter.skillState.skill && isUltimateSkill(fighter.skillState.skill)) {
      labels.push("궁극기 사용 중");
      classes.push("is-ultimate");
    } else if (fighter.skillState && fighter.skillState.skill) {
      labels.push("스킬 사용 중");
      classes.push("is-casting");
    }
    if (fighter.chillShieldUntil && fighter.chillShieldUntil > now) {
      labels.push("보호막");
      classes.push("is-shielded");
    }
    if (fighter.chillTransformed) {
      labels.push("돌변");
      classes.push("is-transformed");
    }
    if (fighter.blueEyesEvolved) {
      labels.push("진화");
      classes.push("is-transformed");
    }
    if (isFighterStunned(fighter, now)) {
      labels.push("기절");
      classes.push("is-slowed");
    }
    if (isBlueEyesInvulnerable(fighter, now)) {
      labels.push("무적");
      classes.push("is-shielded");
    }
    if (isGojoInfinityAvailable(fighter, now)) {
      labels.push("무하한");
      classes.push("is-shielded");
    } else if (isGojoInfinityCollapsed(fighter, now)) {
      labels.push("무하한 붕괴");
      classes.push("is-burning");
    }
    if (isGojoDomainLocked(fighter, now)) {
      labels.push("행동 불가");
      classes.push("is-slowed");
    }
    if (fighter.muzanUltimate && fighter.muzanUltimate.active && now < fighter.muzanUltimate.endAt) {
      labels.push("귀왕 해방");
      classes.push("is-ultimate");
    }
    if (getActiveConceptSuppression(fighter, now)) {
      labels.push("개념 삭제");
      classes.push("is-burning");
    }
    if (isMuzanFatalRegenerating(fighter, now)) {
      labels.push("치명상 재생");
      classes.push("is-shielded");
    }
    const muzanBlood = getMaxMuzanBloodCount(fighter);
    if (muzanBlood > 0) {
      labels.push(`무잔의 피 ${muzanBlood}`);
      classes.push("is-slowed");
    }
    if (hasActiveMaugaBurn(fighter, now)) {
      labels.push("화상");
      classes.push("is-burning");
    }
    if (fighter.blueEyesBlindUntil && fighter.blueEyesBlindUntil > now) {
      labels.push("실명");
      classes.push("is-slowed");
    }
    if (fighter.blueEyesBurnUntil && fighter.blueEyesBurnUntil > now) {
      labels.push("화상");
      classes.push("is-burning");
    }
    if (fighter.slowMultiplier && fighter.slowMultiplier < 1) {
      labels.push("감속");
      classes.push("is-slowed");
    }
    return { labels: Array.from(new Set(labels)), classes: Array.from(new Set(classes)) };
  }

  function hasActiveMaugaBurn(target, now = getBattleNow()) {
    if (!target || !target.maugaBurns || !target.maugaBurns.size) return false;
    return Array.from(target.maugaBurns.values()).some((burn) => burn && now < burn.until);
  }

  function renderStatusIcons(container, fighter) {
    if (!container) return;
    const statuses = [];
    if (fighter.slowMultiplier && fighter.slowMultiplier < 1) statuses.push("감속");
    if (fighter.damageReduction && fighter.damageReduction > 0) statuses.push("방어");
    if (fighter.chillShieldUntil && fighter.chillShieldUntil > getBattleNow()) statuses.push("보호막");
    if (fighter.chillTransformed) statuses.push("돌변");
    if (fighter.blueEyesEvolved) statuses.push("진화");
    if (isFighterStunned(fighter, getBattleNow())) statuses.push("기절");
    if (isBlueEyesInvulnerable(fighter, getBattleNow())) statuses.push("무적");
    if (isGojoInfinityAvailable(fighter, getBattleNow())) statuses.push("무하한");
    if (isGojoInfinityCollapsed(fighter, getBattleNow())) statuses.push("붕괴");
    if (isGojoDomainLocked(fighter, getBattleNow())) statuses.push("무량공처");
    if (isHimAbsoluteCharmed(fighter, getBattleNow())) statuses.push("절대 매혹");
    else if (isHimCharmed(fighter, getBattleNow())) statuses.push("매혹");
    if (fighter.abilityType === "muzanBiology") statuses.push(`세포 ${Math.round(clamp((fighter.muzanCellGauge || 0) / (fighter.muzanCellMax || MUZAN_CELL_MAX), 0, 1) * 100)}%`);
    if (fighter.muzanUltimate && fighter.muzanUltimate.active && getBattleNow() < fighter.muzanUltimate.endAt) statuses.push("귀왕 해방");
    if (getActiveConceptSuppression(fighter, getBattleNow())) statuses.push("개념 삭제");
    if (isMuzanFatalRegenerating(fighter, getBattleNow())) statuses.push("재생");
    if (fighter.muzanNeuralUntil && fighter.muzanNeuralUntil > getBattleNow()) statuses.push("신경 교란");
    const bloodCount = getMaxMuzanBloodCount(fighter);
    if (bloodCount > 0) statuses.push(`피 ${bloodCount}`);
    if (fighter.blueEyesBlindUntil && fighter.blueEyesBlindUntil > getBattleNow()) statuses.push("실명");
    if (fighter.blueEyesBurnUntil && fighter.blueEyesBurnUntil > getBattleNow()) statuses.push("화상");
    if (isBlueEyesFighter(fighter) && !fighter.blueEyesEvolved && fighter.blueEyesFusionStacks > 0) {
      statuses.push(`${fighter.blueEyesFusionStacks}/${fighter.blueEyesFusionMaxStacks || 3}`);
    }
    if (fighter.maugaTempHp && fighter.maugaTempHp > 0) statuses.push("임시 체력");
    if (fighter.skillState && fighter.skillState.skill) {
      statuses.push(fighter.skillState.skill.isUltimate ? "궁극기" : "스킬");
    }
    container.innerHTML = "";
    statuses.slice(0, 4).forEach((status) => {
      const item = document.createElement("span");
      item.textContent = status;
      container.appendChild(item);
    });
  }

  function updateSkillCardsState(side, fighter) {
    const now = getBattleNow();
    [els.matchupSkills[side], els.battleSkills[side]].forEach((container) => {
      if (!container) return;
      container.querySelectorAll(".skill-card").forEach((card) => {
        const index = Number(card.dataset.skillIndex);
        const cooldown = card.querySelector(".skill-cooldown");
        const status = card.querySelector(".skill-status");
        const progress = card.querySelector(".skill-progress-fill");
        if (progress) progress.style.width = "0%";
        card.classList.remove("ready", "cooling", "active", "concept-suppressed", "arena-sealed");
        const suppression = getActiveConceptSuppression(fighter, now);
        if (index < 0) {
          if (card.dataset.masked === "true") {
            if (cooldown) cooldown.textContent = "???";
            if (status) status.textContent = "";
            if (progress) progress.style.width = "100%";
            card.classList.add("ready");
            return;
          }
          if (suppression && (suppression.passive || suppression.full)) {
            card.classList.add("concept-suppressed");
            if (cooldown) cooldown.textContent = `소멸됨 ${formatAmount((suppression.until - now) / 1000)}초`;
            if (status) status.textContent = "소멸됨";
            if (progress) progress.style.width = "100%";
            return;
          }
          if (cooldown) cooldown.textContent = "상시";
          if (status) status.textContent = "";
          if (progress) progress.style.width = "100%";
          card.classList.add("ready");
          return;
        }
        const skill = fighter.skills[index];
        if (skill && isSkillSealedByBattlefield(fighter, skill, index)) {
          card.classList.add("arena-sealed");
          if (cooldown) cooldown.textContent = "봉인됨";
          if (status) status.textContent = "전장 봉인";
          if (progress) progress.style.width = "100%";
          return;
        }
        if (skill && isSkillSuppressedByConcept(fighter, skill, now) && suppression) {
          card.classList.add("concept-suppressed");
          if (cooldown) cooldown.textContent = `소멸됨 ${formatAmount((suppression.until - now) / 1000)}초`;
          if (status) status.textContent = "소멸됨";
          if (progress) progress.style.width = "100%";
          return;
        }
        if (skill && isSkillBlockedByHimCharm(fighter, skill, now)) {
          card.classList.add("concept-suppressed");
          if (cooldown) cooldown.textContent = isHimAbsoluteCharmed(fighter, now) ? "절대 매혹" : "매혹";
          if (status) status.textContent = "사용 불가";
          if (progress) progress.style.width = "100%";
          return;
        }
        if (skill && skill.type === "muzanDemonKing" && fighter.muzanUltimate && fighter.muzanUltimate.active && now < fighter.muzanUltimate.endAt) {
          card.classList.add("active");
          if (cooldown) cooldown.textContent = "사용 중";
          if (status) status.textContent = "귀왕 해방";
          if (progress) {
            const duration = Number(skill.duration) || 6000;
            progress.style.width = `${clamp((fighter.muzanUltimate.endAt - now) / duration, 0, 1) * 100}%`;
          }
          return;
        }
        if (fighter.skillState && fighter.skillState.skill === skill) {
          card.classList.add("active");
          const preparing = fighter.skillState.phase === "delay";
          if (cooldown) cooldown.textContent = preparing ? "준비 중" : "사용 중";
          if (status) {
            const detail = fighter.skillState.data && fighter.skillState.data.status ? fighter.skillState.data.status : "";
            status.textContent = preparing ? "준비 중" : (detail ? `사용 중 · ${detail}` : "사용 중");
          }
          if (progress) progress.style.width = "100%";
          return;
        }
        const nextAt = fighter.nextSkillAt ? Number(fighter.nextSkillAt[index]) || 0 : 0;
        const remaining = Math.max(0, nextAt - now);
        if (remaining > 0 && game.phase === "running") {
          card.classList.add("cooling");
          const cooldownDuration = getEffectiveSkillCooldown(fighter, skill);
          const progressRate = cooldownDuration > 0 ? clamp(1 - remaining / cooldownDuration, 0, 1) : 0;
          if (cooldown) cooldown.textContent = `${formatAmount(remaining / 1000)}초`;
          if (status) status.textContent = "쿨타임";
          if (progress) progress.style.width = `${progressRate * 100}%`;
        } else {
          card.classList.add("ready");
          if (cooldown) cooldown.textContent = "준비 완료";
          if (status) status.textContent = "준비 완료";
          if (progress) progress.style.width = "100%";
        }
      });
    });
  }

  function getProjectedCollisionDamage(fighter) {
    const opponent = getOpposingFighter(fighter.side);
    if (opponent && !opponent.dead) {
      return calculateDamage(fighter, opponent, { isCollision: true });
    }
    const rawDamage = fighter.atk * getCollisionDamageMultiplier(fighter);
    return Math.max(MIN_DAMAGE, Math.round(rawDamage));
  }

  function getTralalaMaxPermanentSpeed(fighter) {
    if (!fighter || fighter.abilityType !== "speedCollisionRamp") return Number(fighter && fighter.speed) || 0;
    return fighter.skills.reduce((maxSpeed, skill) => (
      skill && Number(skill.maxSpeed) ? Math.max(maxSpeed, Number(skill.maxSpeed)) : maxSpeed
    ), 50);
  }

  function updateMaugaTempHealthBar(container, fighter, hpRate) {
    if (!container) return;
    let temp = container.querySelector(".mauga-temp-hp");
    if (fighter.abilityType !== "maugaBerserker" || !fighter.maugaTempHp) {
      removeElement(temp);
      return;
    }
    if (!temp) {
      temp = document.createElement("b");
      temp.className = "mauga-temp-hp";
      container.appendChild(temp);
    }
    const tempRate = clamp(fighter.maugaTempHp / fighter.maxHp, 0, 1);
    const visibleRate = Math.min(tempRate, 1 - hpRate);
    temp.style.left = `${hpRate * 100}%`;
    temp.style.width = `${visibleRate * 100}%`;
  }

  function updateTopUi() {
    els.coin.textContent = String(game.coins);
    els.best.textContent = String(game.best);
    if (els.menu.coin) els.menu.coin.textContent = String(game.coins);
    updateNicknameUi();
  }

  function placeFighters() {
    placeFighterElement(els.fighterA, game.fighters.A);
    placeFighterElement(els.fighterB, game.fighters.B);
  }

  function placeSummons() {
    game.summons.forEach((summon) => placeSummonElement(summon));
  }

  function placeSummonElement(summon) {
    if (!summon || !summon.element) return;
    const size = summon.radius * 2;
    summon.element.style.width = `${size}px`;
    summon.element.style.height = `${size}px`;
    summon.element.style.left = `${summon.x}px`;
    summon.element.style.top = `${summon.y}px`;
    const hp = summon.element.querySelector(".summon-hp");
    const fill = hp ? hp.querySelector("i") : null;
    if (hp && fill) {
      const hpRate = clamp(summon.currentHp / summon.maxHp, 0, 1);
      const barWidth = clamp(size * 1.22, 18, 70);
      const barHeight = 6;
      const gap = 2;
      const desiredCenterX = clamp(summon.x, barWidth / 2 + 2, game.arenaSize - barWidth / 2 - 2);
      const desiredTopY = clamp(summon.y + summon.radius + gap, 2, game.arenaSize - barHeight - 2);
      hp.style.width = `${barWidth}px`;
      hp.style.left = `${summon.radius + desiredCenterX - summon.x}px`;
      hp.style.top = `${desiredTopY - (summon.y - summon.radius)}px`;
      fill.style.width = `${hpRate * 100}%`;
      setHealthFillColor(fill, hpRate);
    }
    if (summon.slowEffect) {
      updateCircleEffect(summon.slowEffect, summon.x, summon.y, summon.radius * 1.08);
    }
    updateChainsawTargetMarkUi(summon);
  }

  function placeFighterElement(element, fighter) {
    if (!fighter) return;
    const size = fighter.radius * 2;
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    element.style.left = `${fighter.x}px`;
    element.style.top = `${fighter.y}px`;
    const miniHp = element.querySelector(".mini-hp");
    if (miniHp) {
      const barWidth = size * 1.18;
      const barHeight = 8;
      const gap = 4;
      const hasInfinityGauge = fighter.abilityType === "gojoInfinity";
      const hasMuzanCellGauge = fighter.abilityType === "muzanBiology";
      const hasChainsawGauge = false;
      const hasChainsawMarkGauge = getTotalChainsawMarksOnTarget(fighter) > 0;
      const infinityGap = 4;
      const infinityHeight = 12;
      const cellGap = 4;
      const cellHeight = 12;
      const chainsawGap = 4;
      const chainsawHeight = 26;
      const markGap = 3;
      const markHeight = 14;
      const extraReserve = (hasChainsawMarkGauge ? markGap + markHeight : 0) + (hasInfinityGauge ? infinityGap + infinityHeight : 0) + (hasMuzanCellGauge ? cellGap + cellHeight : 0) + (hasChainsawGauge ? chainsawGap + chainsawHeight : 0);
      const desiredCenterX = clamp(fighter.x, barWidth / 2 + 2, game.arenaSize - barWidth / 2 - 2);
      const desiredTopY = clamp(fighter.y + fighter.radius + gap, 2, game.arenaSize - barHeight - extraReserve - 2);
      miniHp.style.width = `${barWidth}px`;
      miniHp.style.left = `${fighter.radius + desiredCenterX - fighter.x}px`;
      miniHp.style.top = `${desiredTopY - (fighter.y - fighter.radius)}px`;
      let nextHudTop = desiredTopY - (fighter.y - fighter.radius) + barHeight;
      const chainsawMarkGauge = hasChainsawMarkGauge ? ensureChainsawTargetMarkGauge(element) : element.querySelector(".mini-chainsaw-mark");
      if (hasChainsawMarkGauge && chainsawMarkGauge) {
        const gaugeWidth = barWidth * 1.02;
        const topOffset = nextHudTop + markGap;
        chainsawMarkGauge.style.width = `${gaugeWidth}px`;
        chainsawMarkGauge.style.left = `${fighter.radius + desiredCenterX - fighter.x}px`;
        chainsawMarkGauge.style.top = `${topOffset}px`;
        setChainsawTargetMarkGaugeContent(chainsawMarkGauge, fighter);
        nextHudTop = topOffset + markHeight;
      } else {
        removeElement(chainsawMarkGauge);
      }
      const infinityGauge = hasInfinityGauge ? ensureGojoArenaInfinityGauge(element) : element.querySelector(".mini-infinity");
      if (hasInfinityGauge && infinityGauge) {
        const gaugeWidth = barWidth * 0.96;
        infinityGauge.style.width = `${gaugeWidth}px`;
        infinityGauge.style.left = `${fighter.radius + desiredCenterX - fighter.x}px`;
        infinityGauge.style.top = `${nextHudTop + infinityGap}px`;
        nextHudTop += infinityGap + infinityHeight;
        updateGojoArenaInfinityGauge(fighter);
      } else {
        removeElement(infinityGauge);
      }
      const muzanGauge = hasMuzanCellGauge ? ensureMuzanArenaCellGauge(element) : element.querySelector(".mini-muzan-cell");
      if (hasMuzanCellGauge && muzanGauge) {
        const gaugeWidth = barWidth * 0.96;
        const topOffset = nextHudTop + cellGap;
        muzanGauge.style.width = `${gaugeWidth}px`;
        muzanGauge.style.left = `${fighter.radius + desiredCenterX - fighter.x}px`;
        muzanGauge.style.top = `${topOffset}px`;
        nextHudTop += cellGap + cellHeight;
        updateMuzanArenaCellGauge(fighter);
      } else {
        removeElement(muzanGauge);
      }
      const chainsawGauge = hasChainsawGauge ? ensureChainsawArenaGauge(element) : element.querySelector(".mini-chainsaw");
      if (hasChainsawGauge && chainsawGauge) {
        const gaugeWidth = barWidth * 1.04;
        const topOffset = nextHudTop + chainsawGap;
        chainsawGauge.style.width = `${gaugeWidth}px`;
        chainsawGauge.style.left = `${fighter.radius + desiredCenterX - fighter.x}px`;
        chainsawGauge.style.top = `${topOffset}px`;
        updateChainsawArenaGauge(fighter);
      } else {
        removeElement(chainsawGauge);
      }
    }
    if (fighter.slowEffect) {
      updateCircleEffect(fighter.slowEffect, fighter.x, fighter.y, fighter.radius * 1.08);
    }
    updateDuelDefenseVisuals(fighter);
    updateMaugaWeaponVisuals(fighter);
    if (fighter.maugaHeartEffect) {
      updateCircleEffect(fighter.maugaHeartEffect, fighter.x, fighter.y, fighter.radius * 1.35);
    }
    updateBlueEyesFusionVisual(fighter);
    updateRonaldoVisuals(fighter);
    updateMaugaBurns(fighter, getBattleNow());
    updateOiiaGreatSpinVisuals(fighter);
  }

  function setHealthFillColor(fill, hpRate) {
    fill.classList.remove("hp-high", "hp-mid", "hp-low");
    if (hpRate > 0.6) {
      fill.classList.add("hp-high");
    } else if (hpRate > 0.3) {
      fill.classList.add("hp-mid");
    } else {
      fill.classList.add("hp-low");
    }
  }

  function keepInsideArena(fighter) {
    const size = game.arenaSize;
    fighter.x = clamp(fighter.x, fighter.radius, size - fighter.radius);
    fighter.y = clamp(fighter.y, fighter.radius, size - fighter.radius);
  }

  function normalizeVelocity(fighter, targetSpeed) {
    const current = Math.hypot(fighter.vx, fighter.vy);
    if (current < 0.01) {
      setVelocityFromAngle(fighter, Math.random() * Math.PI * 2);
      return;
    }
    fighter.vx = (fighter.vx / current) * targetSpeed;
    fighter.vy = (fighter.vy / current) * targetSpeed;
  }

  function getFighterElement(fighter) {
    return fighter.side === "A" ? els.fighterA : els.fighterB;
  }

  function addLog(message, tone) {
    const p = document.createElement("p");
    if (tone) p.className = tone;
    p.textContent = formatDisplayText(message);
    els.log.prepend(p);
    while (els.log.children.length > 120) {
      els.log.lastElementChild.remove();
    }
  }

  function toggleBattleLog(event) {
    event && event.stopPropagation && event.stopPropagation();
    if (game.battleEnding) return;
    if (!els.logPanel) return;
    const expanded = els.logPanel.classList.contains("expanded");
    if (expanded) closeBattleLog();
    else openBattleLog({ resetScroll: false });
  }

  function openBattleLog(options = {}) {
    if (!els.logPanel) return;
    els.logPanel.classList.add("expanded");
    els.logPanel.setAttribute("aria-expanded", "true");
    els.logPanel.setAttribute("aria-hidden", "false");
    if (els.logToggle) {
      els.logToggle.textContent = "로그 접기";
      els.logToggle.setAttribute("aria-expanded", "true");
    }
    if (options.resetScroll && els.log) {
      els.log.scrollTop = 0;
    }
  }

  function closeBattleLog(options = {}) {
    if (!els.logPanel) return;
    els.logPanel.classList.remove("expanded", "open", "active", "show");
    els.logPanel.style.display = "";
    els.logPanel.style.visibility = "";
    els.logPanel.style.opacity = "";
    els.logPanel.setAttribute("aria-expanded", "false");
    els.logPanel.setAttribute("aria-hidden", "false");
    if (els.logToggle) {
      els.logToggle.textContent = "전체 로그 보기";
      els.logToggle.setAttribute("aria-expanded", "false");
    }
    if (options.resetScroll && els.log) {
      els.log.scrollTop = 0;
    }
  }

  function handleGlobalKeydown(event) {
    if (event.key === "Escape") {
      closeBattleLog();
    }
  }

  function handleGlobalClick(event) {
    if (!els.logPanel || !els.logPanel.classList.contains("expanded")) return;
    if (els.logPanel.contains(event.target)) return;
    closeBattleLog();
  }

  function removeElement(element) {
    if (element && typeof element.__cleanup === "function") {
      try {
        element.__cleanup();
      } catch (error) {
        console.warn("effect cleanup failed", error);
      }
      element.__cleanup = null;
    }
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function randomInt(min, max) {
    const low = Math.ceil(Math.min(min, max));
    const high = Math.floor(Math.max(min, max));
    return low + Math.floor(Math.random() * (high - low + 1));
  }

  function formatAmount(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value);
    const nearestInteger = Math.round(number);
    if (Math.abs(number - nearestInteger) < 0.000001) {
      return String(nearestInteger);
    }
    const rounded = Math.round((number + Number.EPSILON) * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }

  function formatDisplayText(text) {
    return String(text).replace(/-?\d+\.\d{2,}/g, (match) => formatAmount(Number(match)));
  }

  function loadBestScore() {
    try {
      return Number(localStorage.getItem("bounceBetArenaBest")) || START_COINS;
    } catch (error) {
      return START_COINS;
    }
  }

  function saveBestScore(score) {
    try {
      localStorage.setItem("bounceBetArenaBest", String(score));
    } catch (error) {
      // 로컬 파일 환경에서 저장소가 막히면 현재 세션에서만 최고 기록을 표시합니다.
    }
  }
})();
