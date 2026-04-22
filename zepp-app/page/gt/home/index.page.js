import * as hmUI from "@zos/ui";
import { createTimer, stopTimer } from "@zos/timer";
import { getDeviceInfo } from "@zos/device";
import { localStorage } from "@zos/storage";
import { Vibrator, Buzzer } from "@zos/sensor";
import { setPageBrightTime, resetPageBrightTime, setWakeUpRelaunch } from "@zos/display";

const PROGRAMS = {
  standard: {
    id: "standard",
    title: "Standard",
    meta: "3 rounds",
    transitionSeconds: 3,
    warmup: { seconds: 300, title: "Warm-up", meta: "Light movement" },
    rounds: 3,
    includeGastro: true,
    includeHipSwitch: false,
    restBetweenExercisesSeconds: 25,
    restBetweenRoundsSeconds: 105,
    nerveGlides: { setsPerLeg: 2, repsPerSet: 15, repSeconds: 5, restBetweenLegsSeconds: 30 },
    gastro: { setsPerLeg: 2, contractSeconds: 6, holdSeconds: 25 },
    hamstring: { setsPerLeg: 2, isoSeconds: 30, passiveSeconds: 20 },
    pikeLifts: { sets: 2, reps: 10, upSeconds: 1, topHoldSeconds: 2, downSeconds: 3, restBetweenSetsSeconds: 40 },
    seatedPikeLoaded: { cycles: 2, contractSeconds: 8, holdSeconds: 40 },
  },
  postworkout: {
    id: "postworkout",
    title: "Post-workout",
    meta: "2 rounds",
    transitionSeconds: 3,
    warmup: { seconds: 150, title: "Warm-up", meta: "Short prep" },
    rounds: 2,
    includeGastro: false,
    includeHipSwitch: true,
    restBetweenExercisesSeconds: 18,
    restBetweenRoundsSeconds: 60,
    nerveGlides: { setsPerLeg: 2, repsPerSet: 12, repSeconds: 5, restBetweenLegsSeconds: 20 },
    hamstring: { setsPerLeg: 2, isoSeconds: 27, passiveSeconds: 18 },
    hipSwitch: { sets: 1, switchesPerSet: 4, holdPerSideSeconds: 20 },
    pikeLifts: { sets: 2, reps: 8, upSeconds: 1, topHoldSeconds: 2, downSeconds: 3, restBetweenSetsSeconds: 30 },
    seatedPikeLoaded: { cycles: 1, contractSeconds: 7, holdSeconds: 30 },
  },
  restday: {
    id: "restday",
    title: "Rest day",
    meta: "Passive",
    transitionSeconds: 3,
    customFlow: [
      { key: "foam_psoas", title: "Foam psoas", mode: "total", seconds: 180, meta: "3:00" },
      { key: "knee_to_chest", title: "Knee-to-chest", mode: "perSide", secondsPerSide: 60, meta: "Hold" },
      { key: "figure4", title: "Figure-4", mode: "perSide", secondsPerSide: 75, meta: "Hold" },
      { key: "half_kneeling", title: "Half-kneeling", mode: "perSide", secondsPerSide: 90, meta: "Hip flexor" },
      { key: "low_lunge", title: "Low lunge", mode: "perSide", secondsPerSide: 90, meta: "Breathe" },
      { key: "passive_9090", title: "90/90 hold", mode: "perSide", secondsPerSide: 120, meta: "Passive" },
      { key: "butterfly", title: "Butterfly", mode: "total", seconds: 120, meta: "2:00" },
      { key: "wide_fold", title: "Wide fold", mode: "total", seconds: 90, meta: "1:30" },
      { key: "passive_pike", title: "Passive pike", mode: "total", seconds: 90, meta: "1:30" },
    ],
  },
};

function sumSeconds(steps) {
  let total = 0;
  for (let i = 0; i < steps.length; i++) total += steps[i].seconds;
  return total;
}

function fmtMMSS(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  const mmStr = String(mm).padStart(2, "0");
  const ssStr = String(ss).padStart(2, "0");
  return `${mmStr}:${ssStr}`;
}

function buildWorkStepsForProgram(cfg) {
  const steps = [];
  const addWork = (exerciseKey, title, meta, seconds) => steps.push({ title, meta, seconds, kind: "work", exerciseKey });
  const addRest = (exerciseKey, title, meta, seconds) => steps.push({ title, meta, seconds, kind: "rest", exerciseKey });

  if (cfg.customFlow && Array.isArray(cfg.customFlow)) {
    const sides = ["Left", "Right"];
    for (let i = 0; i < cfg.customFlow.length; i++) {
      const item = cfg.customFlow[i];
      if (item.mode === "perSide") {
        for (let s = 0; s < sides.length; s++) {
          addWork(item.key, item.title, `${sides[s]} - ${item.meta}`, item.secondsPerSide);
        }
      } else {
        addWork(item.key, item.title, item.meta, item.seconds);
      }
    }
    addWork("done", "Done", "Session complete", 3);
    return steps;
  }

  addWork("warmup", cfg.warmup.title, cfg.warmup.meta, cfg.warmup.seconds);
  addWork("nerve_glides", "Nerve glides", "Prep", 3);

  const legs = ["Left", "Right"];
  for (let set = 1; set <= cfg.nerveGlides.setsPerLeg; set++) {
    for (let legIdx = 0; legIdx < legs.length; legIdx++) {
      for (let rep = 1; rep <= cfg.nerveGlides.repsPerSet; rep++) {
        addWork(
          "nerve_glides",
          "Nerve glides",
          `${legs[legIdx]} set ${set}/${cfg.nerveGlides.setsPerLeg} rep ${rep}/${cfg.nerveGlides.repsPerSet}`,
          cfg.nerveGlides.repSeconds
        );
      }
      const isLastSet = set === cfg.nerveGlides.setsPerLeg;
      const isLastLeg = legIdx === legs.length - 1;
      if (!(isLastSet && isLastLeg)) {
        addRest("rest_legs", "Rest", "Between legs", cfg.nerveGlides.restBetweenLegsSeconds);
      }
    }
  }

  for (let round = 1; round <= cfg.rounds; round++) {
    const blocks = [];

    if (cfg.includeGastro && cfg.gastro) {
      const block = [];
      for (let l = 0; l < legs.length; l++) {
        for (let set = 1; set <= cfg.gastro.setsPerLeg; set++) {
          block.push({ title: "Calf stretch", meta: `${legs[l]} contract`, seconds: cfg.gastro.contractSeconds, kind: "work", exerciseKey: "gastro" });
          block.push({ title: "Calf stretch", meta: `${legs[l]} hold`, seconds: cfg.gastro.holdSeconds, kind: "work", exerciseKey: "gastro" });
        }
      }
      blocks.push(block);
    }

    if (cfg.includeHipSwitch && cfg.hipSwitch) {
      const block = [];
      for (let set = 1; set <= cfg.hipSwitch.sets; set++) {
        for (let sw = 1; sw <= cfg.hipSwitch.switchesPerSet; sw++) {
          block.push({ title: "90/90 switches", meta: `L ${sw}/${cfg.hipSwitch.switchesPerSet}`, seconds: cfg.hipSwitch.holdPerSideSeconds, kind: "work", exerciseKey: "hip_switch_9090" });
          block.push({ title: "90/90 switches", meta: `R ${sw}/${cfg.hipSwitch.switchesPerSet}`, seconds: cfg.hipSwitch.holdPerSideSeconds, kind: "work", exerciseKey: "hip_switch_9090" });
        }
      }
      blocks.push(block);
    }

    {
      const block = [];
      for (let l = 0; l < legs.length; l++) {
        for (let set = 1; set <= cfg.hamstring.setsPerLeg; set++) {
          block.push({ title: "Hamstring", meta: `${legs[l]} iso`, seconds: cfg.hamstring.isoSeconds, kind: "work", exerciseKey: "hamstring" });
          block.push({ title: "Hamstring", meta: `${legs[l]} passive`, seconds: cfg.hamstring.passiveSeconds, kind: "work", exerciseKey: "hamstring" });
        }
      }
      blocks.push(block);
    }

    {
      const block = [];
      for (let set = 1; set <= cfg.pikeLifts.sets; set++) {
        for (let rep = 1; rep <= cfg.pikeLifts.reps; rep++) {
          block.push({ title: "Pike lifts", meta: `Set ${set}/${cfg.pikeLifts.sets} rep ${rep}/${cfg.pikeLifts.reps}`, seconds: cfg.pikeLifts.upSeconds + cfg.pikeLifts.topHoldSeconds + cfg.pikeLifts.downSeconds, kind: "work", exerciseKey: "pike_lifts" });
        }
        if (set !== cfg.pikeLifts.sets) {
          block.push({ title: "Rest", meta: "Between sets", seconds: cfg.pikeLifts.restBetweenSetsSeconds, kind: "rest", exerciseKey: "rest_sets" });
        }
      }
      blocks.push(block);
    }

    {
      const block = [];
      for (let cycle = 1; cycle <= cfg.seatedPikeLoaded.cycles; cycle++) {
        block.push({ title: "Seated pike", meta: `Cycle ${cycle} contract`, seconds: cfg.seatedPikeLoaded.contractSeconds, kind: "work", exerciseKey: "seated_pike" });
        block.push({ title: "Seated pike", meta: `Cycle ${cycle} hold`, seconds: cfg.seatedPikeLoaded.holdSeconds, kind: "work", exerciseKey: "seated_pike" });
      }
      blocks.push(block);
    }

    for (let i = 0; i < blocks.length; i++) {
      for (let j = 0; j < blocks[i].length; j++) steps.push(blocks[i][j]);
      if (i < blocks.length - 1) addRest("rest_exercises", "Rest", "Between exercises", cfg.restBetweenExercisesSeconds);
    }

    if (round !== cfg.rounds) addRest("rest_rounds", "Rest", "Between rounds", cfg.restBetweenRoundsSeconds);
  }

  addWork("done", "Done", "Session complete", 3);
  return steps;
}

function withTransitions(workSteps, transitionSeconds) {
  const out = [];
  out.push({ title: "Get ready", meta: `Starting in ${transitionSeconds}`, seconds: transitionSeconds, kind: "transition", exerciseKey: "transition" });

  for (let i = 0; i < workSteps.length; i++) {
    out.push(workSteps[i]);
    const next = workSteps[i + 1];
    if (!next) continue;
    const isExerciseChange = next.exerciseKey !== workSteps[i].exerciseKey;
    const nextIsRest = next.kind === "rest";
    if (isExerciseChange && !nextIsRest) {
      out.push({ title: "Next", meta: next.title, seconds: transitionSeconds, kind: "transition", exerciseKey: "transition" });
    }
  }
  return out;
}

const state = {
  programOrder: ["standard", "postworkout", "restday"],
  programIdx: 0,
  running: false,
  paused: false,
  steps: [],
  stepIdx: 0,
  stepStartMs: 0,
  stepEndMs: 0,
  totalSessionSeconds: 0,
  activeTransitionSeconds: 3,
  pauseStartedMs: 0,
  tickerId: 0,
  lastTickSignalKey: "",
  signalMode: 1, // 0 off, 1 vibration, 2 buzzer, 3 both
};

const STORAGE_KEY = "exercise_timer_runtime_v1";
const KEEP_AWAKE_MS = 2147483000;
const FORCE_RIGHT_NUDGE_PX = 36;

const sensorState = {
  vibrator: null,
  buzzer: null,
  buzzerSourceType: 0,
};

const layout = {
  width: 390,
  height: 450,
  contentX: 0,
  contentW: 390,
  contentShiftX: 0,
};

function currentProgram() {
  return PROGRAMS[state.programOrder[state.programIdx]];
}

function signalModeLabel(mode) {
  if (mode === 1) return "Signal: Vib";
  if (mode === 2) return "Signal: Buzz";
  if (mode === 3) return "Signal: Both";
  return "Signal: Off";
}

function initLayout() {
  let info = null;
  try {
    info = getDeviceInfo();
  } catch (_err) {
    info = null;
  }

  const w = info && info.width ? info.width : 390;
  const h = info && info.height ? info.height : 450;
  // Round screens on some devices have effectively asymmetric touch-safe bounds,
  // so we keep a stronger inset and a small right bias.
  const safeInset = Math.max(34, Math.floor(w * 0.11));

  layout.width = w;
  layout.height = h;
  layout.contentW = Math.max(230, Math.min(w - safeInset * 2, 286));
  layout.contentShiftX = FORCE_RIGHT_NUDGE_PX;
  layout.contentX = Math.floor((w - layout.contentW) / 2) + layout.contentShiftX;

  // Clamp inside the screen bounds.
  if (layout.contentX < 0) layout.contentX = 0;
  if (layout.contentX + layout.contentW > w) {
    layout.contentX = Math.max(0, w - layout.contentW);
  }
}

function applyKeepAwake() {
  try {
    setWakeUpRelaunch(true);
  } catch (_err) {
    // Optional behavior.
  }

  try {
    setPageBrightTime({ brightTime: KEEP_AWAKE_MS });
  } catch (_err) {
    // Ignore if unsupported.
  }
}

function clearKeepAwake() {
  try {
    resetPageBrightTime();
  } catch (_err) {
    // Ignore if unsupported.
  }
}

function initSensors() {
  try {
    sensorState.vibrator = new Vibrator();
  } catch (_err) {
    sensorState.vibrator = null;
  }

  try {
    sensorState.buzzer = new Buzzer();
    const src = sensorState.buzzer.getSourceType();
    sensorState.buzzerSourceType = src && src.OPERATE ? src.OPERATE : 0;
  } catch (_err) {
    sensorState.buzzer = null;
    sensorState.buzzerSourceType = 0;
  }
}

const ui = {
  countdown: null,
  program: null,
  nowTitle: null,
  nowMeta: null,
  nextTitle: null,
  footer: null,
  signalBtn: null,
  pauseBtn: null,
};

function setText(widget, text) {
  if (!widget) return;
  widget.setProperty(hmUI.prop.TEXT, String(text));
}

function renderIdle() {
  const p = currentProgram();
  setText(ui.countdown, "00:00");
  setText(ui.program, `${p.title} (${p.meta})`);
  setText(ui.nowTitle, "Ready");
  setText(ui.nowMeta, "Press Start");
  setText(ui.nextTitle, "Next: -");
  setText(ui.footer, "Step 0/0");
  setText(ui.signalBtn, signalModeLabel(state.signalMode));
}

function saveRuntimeState() {
  const payload = {
    v: 1,
    savedAtMs: Date.now(),
    programIdx: state.programIdx,
    running: state.running,
    paused: state.paused,
    steps: state.steps,
    stepIdx: state.stepIdx,
    stepStartMs: state.stepStartMs,
    stepEndMs: state.stepEndMs,
    totalSessionSeconds: state.totalSessionSeconds,
    activeTransitionSeconds: state.activeTransitionSeconds,
    pauseStartedMs: state.pauseStartedMs,
    signalMode: state.signalMode,
    lastTickSignalKey: state.lastTickSignalKey,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (_err) {
    // Ignore storage write failures.
  }
}

function advanceToTime(nowMs) {
  while (state.running && !state.paused && state.stepIdx < state.steps.length && nowMs >= state.stepEndMs - 10) {
    state.stepIdx += 1;
    if (state.stepIdx >= state.steps.length) {
      finish();
      break;
    }
    state.stepStartMs = state.stepEndMs;
    state.stepEndMs = state.stepStartMs + state.steps[state.stepIdx].seconds * 1000;
  }
}

function restoreRuntimeState() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY, "");
  } catch (_err) {
    raw = "";
  }
  if (!raw || typeof raw !== "string") return;

  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch (_err) {
    parsed = null;
  }
  if (!parsed || parsed.v !== 1) return;

  state.programIdx = typeof parsed.programIdx === "number" ? parsed.programIdx % state.programOrder.length : 0;
  state.running = !!parsed.running;
  state.paused = !!parsed.paused;
  state.steps = Array.isArray(parsed.steps) ? parsed.steps : [];
  state.stepIdx = typeof parsed.stepIdx === "number" ? parsed.stepIdx : 0;
  state.stepStartMs = typeof parsed.stepStartMs === "number" ? parsed.stepStartMs : 0;
  state.stepEndMs = typeof parsed.stepEndMs === "number" ? parsed.stepEndMs : 0;
  state.totalSessionSeconds = typeof parsed.totalSessionSeconds === "number" ? parsed.totalSessionSeconds : 0;
  state.activeTransitionSeconds = typeof parsed.activeTransitionSeconds === "number" ? parsed.activeTransitionSeconds : 3;
  state.pauseStartedMs = typeof parsed.pauseStartedMs === "number" ? parsed.pauseStartedMs : 0;
  state.signalMode = typeof parsed.signalMode === "number" ? parsed.signalMode : 1;
  state.lastTickSignalKey = typeof parsed.lastTickSignalKey === "string" ? parsed.lastTickSignalKey : "";

  if (!state.running || !state.steps.length || state.stepIdx >= state.steps.length) {
    state.running = false;
    state.paused = false;
    return;
  }

  const nowMs = Date.now();
  if (!state.paused) {
    advanceToTime(nowMs);
  }
}

function startStep(nowMs) {
  const step = state.steps[state.stepIdx];
  state.stepStartMs = nowMs;
  state.stepEndMs = nowMs + step.seconds * 1000;
}

function remainingPlannedSeconds(nowMs) {
  if (!state.steps.length) return 0;
  const thisStepRemain = Math.max(0, (state.stepEndMs - nowMs) / 1000);
  let after = 0;
  for (let i = state.stepIdx + 1; i < state.steps.length; i++) after += state.steps[i].seconds;
  return thisStepRemain + after;
}

function completedPlannedSeconds(nowMs) {
  if (!state.steps.length) return 0;
  const current = state.steps[state.stepIdx];
  const remain = Math.max(0, (state.stepEndMs - nowMs) / 1000);
  const elapsedInStep = Math.min(current.seconds, Math.max(0, current.seconds - remain));
  let before = 0;
  for (let i = 0; i < state.stepIdx; i++) before += state.steps[i].seconds;
  return before + elapsedInStep;
}

function stopLoop() {
  if (!state.tickerId) return;
  stopTimer(state.tickerId);
  state.tickerId = 0;
}

function startLoop() {
  stopLoop();
  state.tickerId = createTimer(0, 200, tick);
}

function triggerTickSignal(signalKey) {
  if (signalKey === state.lastTickSignalKey) return;
  state.lastTickSignalKey = signalKey;

  if (state.signalMode === 1 || state.signalMode === 3) {
    try {
      sensorState.vibrator && sensorState.vibrator.start();
    } catch (_err) {
      // Ignore unsupported vibration on device.
    }
  }

  if (state.signalMode === 2 || state.signalMode === 3) {
    try {
      if (sensorState.buzzer && sensorState.buzzerSourceType && sensorState.buzzer.isEnabled()) {
        sensorState.buzzer.start(sensorState.buzzerSourceType, 0);
      }
    } catch (_err) {
      // Ignore unsupported buzzer on device.
    }
  }
}

function finish() {
  stopLoop();
  state.running = false;
  state.paused = false;
  state.lastTickSignalKey = "";
  setText(ui.countdown, "00:00");
  setText(ui.nowTitle, "Done");
  setText(ui.nowMeta, "Session complete");
  setText(ui.nextTitle, "Next: -");
  setText(ui.footer, `Step ${state.steps.length}/${state.steps.length}`);
  setText(ui.pauseBtn, "Pause");
  saveRuntimeState();
}

function resetSessionToIdle() {
  stopLoop();
  state.running = false;
  state.paused = false;
  state.steps = [];
  state.stepIdx = 0;
  state.stepStartMs = 0;
  state.stepEndMs = 0;
  state.totalSessionSeconds = 0;
  state.pauseStartedMs = 0;
  state.lastTickSignalKey = "";
  setText(ui.pauseBtn, "Pause");
  renderIdle();
  saveRuntimeState();
}

function moveNext(nowMs) {
  state.stepIdx += 1;
  if (state.stepIdx >= state.steps.length) {
    finish();
    return;
  }
  startStep(nowMs);
}

function renderRunningState(nowMs) {
  const step = state.steps[state.stepIdx];
  const remainingStepSeconds = Math.max(0, (state.stepEndMs - nowMs) / 1000);
  const remainingSessionSeconds = Math.max(0, remainingPlannedSeconds(nowMs));

  setText(ui.countdown, fmtMMSS(remainingStepSeconds));
  setText(ui.nowTitle, step.title);
  setText(ui.nowMeta, step.meta);
  const next = state.steps[state.stepIdx + 1];
  setText(ui.nextTitle, `Next: ${next ? next.title : "-"}`);

  const done = Math.floor(completedPlannedSeconds(nowMs));
  const total = Math.max(1, state.totalSessionSeconds);
  setText(ui.footer, `Step ${state.stepIdx + 1}/${state.steps.length}  ${fmtMMSS(remainingSessionSeconds)} left  ${Math.round((done / total) * 100)}%`);

  return { remainingStepSeconds };
}

function tick() {
  if (!state.running || state.paused) return;
  const nowMs = Date.now();
  const { remainingStepSeconds } = renderRunningState(nowMs);
  const step = state.steps[state.stepIdx];
  const next = state.steps[state.stepIdx + 1];

  const shownSecond = Math.ceil(remainingStepSeconds);
  const sameExerciseNext = !!next && next.kind !== "transition" && next.exerciseKey === step.exerciseKey;
  const shouldSignal = step.kind === "transition" || sameExerciseNext;
  if (shouldSignal && shownSecond > 0 && shownSecond <= state.activeTransitionSeconds) {
    const signalKey = `${state.stepIdx}:${shownSecond}`;
    triggerTickSignal(signalKey);
  }

  if (nowMs >= state.stepEndMs - 10) {
    moveNext(nowMs);
    state.lastTickSignalKey = "";
  }

  saveRuntimeState();
}

function startRun() {
  const program = currentProgram();
  const work = buildWorkStepsForProgram(program);
  state.activeTransitionSeconds = program.transitionSeconds;
  state.steps = withTransitions(work, state.activeTransitionSeconds);
  state.totalSessionSeconds = sumSeconds(state.steps);
  state.stepIdx = 0;
  state.running = true;
  state.paused = false;
  state.lastTickSignalKey = "";
  const nowMs = Date.now();
  startStep(nowMs);
  tick();
  startLoop();
  setText(ui.pauseBtn, "Pause");
  saveRuntimeState();
}

function togglePause() {
  if (!state.running) return;
  if (!state.paused) {
    state.paused = true;
    state.pauseStartedMs = Date.now();
    stopLoop();
    setText(ui.nowMeta, "Paused");
    setText(ui.pauseBtn, "Resume");
    saveRuntimeState();
    return;
  }

  const nowMs = Date.now();
  const delta = Math.max(0, nowMs - state.pauseStartedMs);
  state.stepStartMs += delta;
  state.stepEndMs += delta;
  state.paused = false;
  state.lastTickSignalKey = "";
  setText(ui.pauseBtn, "Pause");
  tick();
  startLoop();
  saveRuntimeState();
}

function stepPrev() {
  if (!state.running || state.paused || state.stepIdx <= 0) return;
  state.stepIdx -= 1;
  state.lastTickSignalKey = "";
  startStep(Date.now());
  tick();
  saveRuntimeState();
}

function stepNext() {
  if (!state.running || state.paused) return;
  state.lastTickSignalKey = "";
  moveNext(Date.now());
  tick();
  saveRuntimeState();
}

function cycleProgram() {
  if (state.running && !state.paused) return;

  // If paused, pressing Program cancels current run and returns to idle first.
  if (state.paused) {
    resetSessionToIdle();
  }

  state.programIdx = (state.programIdx + 1) % state.programOrder.length;
  renderIdle();
  saveRuntimeState();
}

function cycleSignalMode() {
  state.signalMode = (state.signalMode + 1) % 4;
  setText(ui.signalBtn, signalModeLabel(state.signalMode));
  saveRuntimeState();
}

Page({
  onInit() {
    console.log("home page init");
    initLayout();
    initSensors();
    restoreRuntimeState();
    applyKeepAwake();
  },
  build() {
    const x = layout.contentX;
    const w = layout.contentW;
    const yTop = Math.max(12, Math.floor((layout.height - 360) / 2));

    ui.countdown = hmUI.createWidget(hmUI.widget.TEXT, {
      text: "00:00",
      x,
      y: yTop,
      w,
      h: 72,
      color: 0xffffff,
      text_size: 58,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });

    ui.program = hmUI.createWidget(hmUI.widget.TEXT, {
      text: "Program",
      x,
      y: yTop + 78,
      w,
      h: 34,
      color: 0x83d6ff,
      text_size: 20,
      align_h: hmUI.align.CENTER_H,
    });

    ui.nowTitle = hmUI.createWidget(hmUI.widget.TEXT, {
      text: "Ready",
      x,
      y: yTop + 116,
      w,
      h: 42,
      color: 0xffffff,
      text_size: 30,
      align_h: hmUI.align.CENTER_H,
    });

    ui.nowMeta = hmUI.createWidget(hmUI.widget.TEXT, {
      text: "Press Start",
      x,
      y: yTop + 156,
      w,
      h: 62,
      color: 0xaeb6bf,
      text_size: 18,
      align_h: hmUI.align.CENTER_H,
    });

    ui.nextTitle = hmUI.createWidget(hmUI.widget.TEXT, {
      text: "Next: -",
      x,
      y: yTop + 222,
      w,
      h: 30,
      color: 0xc7d0db,
      text_size: 18,
      align_h: hmUI.align.CENTER_H,
    });

    ui.footer = hmUI.createWidget(hmUI.widget.TEXT, {
      text: "Step 0/0",
      x,
      y: yTop + 252,
      w,
      h: 26,
      color: 0x8d99a6,
      text_size: 16,
      align_h: hmUI.align.CENTER_H,
    });

    const gap = 8;
    const topBtnW = Math.floor((w - gap * 2) / 3);
    const topBtnsX = x;

    hmUI.createWidget(hmUI.widget.BUTTON, {
      text: "Program",
      x: topBtnsX,
      y: yTop + 286,
      w: topBtnW,
      h: 38,
      click_func: cycleProgram,
    });

    hmUI.createWidget(hmUI.widget.BUTTON, {
      text: "Start",
      x: topBtnsX + topBtnW + gap,
      y: yTop + 286,
      w: topBtnW,
      h: 38,
      click_func: startRun,
    });

    ui.pauseBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
      text: "Pause",
      x: topBtnsX + (topBtnW + gap) * 2,
      y: yTop + 286,
      w: topBtnW,
      h: 38,
      click_func: togglePause,
    });

    const botBtnW = Math.floor((w - gap * 2) / 3);
    const botY = yTop + 328;

    hmUI.createWidget(hmUI.widget.BUTTON, {
      text: "Prev",
      x,
      y: botY,
      w: botBtnW,
      h: 38,
      click_func: stepPrev,
    });

    hmUI.createWidget(hmUI.widget.BUTTON, {
      text: "Next",
      x: x + botBtnW + gap,
      y: botY,
      w: botBtnW,
      h: 38,
      click_func: stepNext,
    });

    ui.signalBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
      text: signalModeLabel(state.signalMode),
      x: x + (botBtnW + gap) * 2,
      y: botY,
      w: botBtnW,
      h: 38,
      click_func: cycleSignalMode,
    });

    if (state.running) {
      const nowMs = Date.now();
      if (!state.paused) {
        advanceToTime(nowMs);
        tick();
        startLoop();
      } else {
        renderRunningState(nowMs);
        setText(ui.nowMeta, "Paused");
        setText(ui.pauseBtn, "Resume");
      }
    } else {
      renderIdle();
    }
  },
  onShow() {
    applyKeepAwake();
    if (!state.running) return;
    if (!state.paused) {
      advanceToTime(Date.now());
      tick();
      startLoop();
    } else {
      renderRunningState(Date.now());
      setText(ui.nowMeta, "Paused");
      setText(ui.pauseBtn, "Resume");
    }
  },
  onHide() {
    // App timeline is persisted and catches up from wall-clock on return.
    stopLoop();
    saveRuntimeState();
    clearKeepAwake();
  },
  onDestroy() {
    stopLoop();
    saveRuntimeState();
    clearKeepAwake();
    console.log("home page destroy");
  },
});
