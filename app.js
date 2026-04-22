const PROGRAMS = {
  standard: {
    id: "standard",
    title: "Evidence-Based Pike Routine (Standard)",
    meta: "2x/week, 3 rounds, 35–40 min",
    summaryBullets: [
      "3-second transition countdown around exercise changes",
      "Warm-up: 5 min light movement",
      "Main work: 3 rounds of Exercises 2–5",
      "Rest between exercises: 25s",
      "Rest between rounds: 105s",
      "Nerve glides: 2 sets/leg, 15 reps/set, 5s per rep, 30s rest between legs",
    ],
    transitionSeconds: 3,
    warmup: {
      seconds: 5 * 60,
      title: "Warm-up: light movement",
      meta: "5 minutes (walking, leg swings, cat-cows)",
    },
    rounds: 3,
    includeGastro: true,
    restBetweenExercisesSeconds: 25,
    restBetweenRoundsSeconds: 105,
    nerveGlides: {
      setsPerLeg: 2,
      repsPerSet: 15,
      repSeconds: 5,
      restBetweenLegsSeconds: 30,
    },
    gastro: {
      setsPerLeg: 2,
      contractSeconds: 6,
      holdSeconds: 25,
    },
    hamstring: {
      setsPerLeg: 2,
      isoSeconds: 30,
      passiveSeconds: 20,
    },
    pikeLifts: {
      sets: 2,
      reps: 10,
      upSeconds: 1,
      topHoldSeconds: 2,
      downSeconds: 3,
      restBetweenSetsSeconds: 40,
    },
    seatedPikeLoaded: {
      cycles: 2,
      contractSeconds: 8,
      holdSeconds: 40,
    },
  },

  postworkout: {
    id: "postworkout",
    title: "Post-Workout Pike Routine",
    meta: "3x/week, 2 rounds, 20–25 min",
    summaryBullets: [
      "3-second transition countdown around exercise changes",
      "Warm-up/transition: 2.5 min",
      "Main work: 2 rounds of Exercises 2–5",
      "Exercise 2: 90/90 hip switches (1 set/round, 4 switches, 20s each side)",
      "Rest between exercises: 18s",
      "Rest between rounds: 60s",
      "Nerve glides: 2 sets/leg, 12 reps/set, 5s per rep, 20s rest between legs",
    ],
    transitionSeconds: 3,
    warmup: {
      seconds: 150,
      title: "Warm-up/transition",
      meta: "Leg swings + cat-cows + gentle pike fold (already warm from workout)",
    },
    rounds: 2,
    includeGastro: false,
    includeHipSwitch: true,
    restBetweenExercisesSeconds: 18,
    restBetweenRoundsSeconds: 60,
    nerveGlides: {
      setsPerLeg: 2,
      repsPerSet: 12,
      repSeconds: 5,
      restBetweenLegsSeconds: 20,
    },
    hamstring: {
      setsPerLeg: 2,
      isoSeconds: 27,
      passiveSeconds: 18,
    },
    hipSwitch: {
      sets: 1,
      switchesPerSet: 4,
      holdPerSideSeconds: 20,
    },
    pikeLifts: {
      sets: 2,
      reps: 8,
      upSeconds: 1,
      topHoldSeconds: 2,
      downSeconds: 3,
      restBetweenSetsSeconds: 30,
    },
    seatedPikeLoaded: {
      cycles: 1,
      contractSeconds: 7,
      holdSeconds: 30,
    },
  },

  restday: {
    id: "restday",
    title: "Rest Day Hip Routine (Passive)",
    meta: "1x round, ~22 min",
    summaryBullets: [
      "Single round passive recovery flow",
      "No loading, no contract-relax",
      "Based on your rest-day-routine.html sequence",
      "Approximate duration: 22-23 minutes",
      "Covers psoas, hip capsule, hip flexors, adductors, and pike",
    ],
    transitionSeconds: 3,
    customFlow: [
      {
        key: "foam_psoas",
        title: "1) Foam roller psoas release",
        mode: "total",
        seconds: 180,
        meta: "3:00 total (both sides) - deep, slow pressure with controlled breathing",
      },
      {
        key: "knee_to_chest",
        title: "2) Supine knee-to-chest hold",
        mode: "perSide",
        secondsPerSide: 60,
        meta: "Passive hold",
      },
      {
        key: "figure4",
        title: "3) Figure-4 piriformis stretch",
        mode: "perSide",
        secondsPerSide: 75,
        meta: "Passive hold, flex top foot",
      },
      {
        key: "half_kneeling",
        title: "4) Half-kneeling hip flexor stretch",
        mode: "perSide",
        secondsPerSide: 90,
        meta: "Pelvic tuck, gentle forward drive",
      },
      {
        key: "low_lunge",
        title: "5) Low lunge / couch stretch",
        mode: "perSide",
        secondsPerSide: 90,
        meta: "Slow breathing, no bouncing",
      },
      {
        key: "passive_9090",
        title: "6) 90/90 passive hold",
        mode: "perSide",
        secondsPerSide: 120,
        meta: "Sit tall, fold gently over front shin",
      },
      {
        key: "butterfly",
        title: "7) Butterfly stretch",
        mode: "total",
        seconds: 120,
        meta: "2:00 total",
      },
      {
        key: "wide_fold",
        title: "8) Wide-legged forward fold",
        mode: "total",
        seconds: 90,
        meta: "1:30 total",
      },
      {
        key: "passive_pike",
        title: "9) Passive pike hold",
        mode: "total",
        seconds: 90,
        meta: "1:30 total",
      },
    ],
  },
};

/**
 * @typedef {Object} Step
 * @property {string} title
 * @property {string} meta
 * @property {number} seconds
 * @property {"work"|"rest"|"transition"} kind
 * @property {string} exerciseKey
 */

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatMMSS(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${pad2(mm)}:${pad2(ss)}`;
}

function sumSeconds(steps) {
  return steps.reduce((acc, s) => acc + s.seconds, 0);
}

function buildWorkStepsForProgram(cfg) {
  /** @type {Step[]} */
  const steps = [];
  const addWork = (exerciseKey, title, meta, seconds) =>
    steps.push({ title, meta, seconds, kind: "work", exerciseKey });
  const addRest = (exerciseKey, title, meta, seconds) =>
    steps.push({ title, meta, seconds, kind: "rest", exerciseKey });

  if (cfg.customFlow && Array.isArray(cfg.customFlow)) {
    const sides = ["Left", "Right"];

    for (const item of cfg.customFlow) {
      if (item.mode === "perSide") {
        for (const side of sides) {
          addWork(
            item.key,
            item.title,
            `${side} side - ${item.meta}`,
            item.secondsPerSide
          );
        }
      } else {
        addWork(item.key, item.title, item.meta, item.seconds);
      }
    }

    addWork("done", "Done", "Session complete", 3);
    return steps;
  }

  addWork("warmup", cfg.warmup.title, cfg.warmup.meta, cfg.warmup.seconds);

  addWork(
    "nerve_glides",
    "Neural prep: Supine Sciatic Nerve Glides",
    `DONE ONCE • ${cfg.nerveGlides.setsPerLeg} sets/leg • ${cfg.nerveGlides.repsPerSet} reps/set`,
    3
  );

  const legs = ["Left", "Right"];

  // Alternate legs between sets: Left set 1 -> Right set 1 -> Left set 2 -> Right set 2 ...
  for (let set = 1; set <= cfg.nerveGlides.setsPerLeg; set++) {
    for (let legIdx = 0; legIdx < legs.length; legIdx++) {
      const leg = legs[legIdx];
      for (let rep = 1; rep <= cfg.nerveGlides.repsPerSet; rep++) {
        addWork(
          "nerve_glides",
          "Nerve glides",
          `${leg} leg • Set ${set}/${cfg.nerveGlides.setsPerLeg} • Rep ${rep}/${cfg.nerveGlides.repsPerSet} • Both directions (smooth, pain-free)`,
          cfg.nerveGlides.repSeconds
        );
      }

      const isLastSet = set === cfg.nerveGlides.setsPerLeg;
      const isLastLeg = legIdx === legs.length - 1;
      if (!(isLastSet && isLastLeg)) {
        addRest(
          "rest_legs",
          "Rest",
          `Rest between legs (${cfg.nerveGlides.restBetweenLegsSeconds}s)`,
          cfg.nerveGlides.restBetweenLegsSeconds
        );
      }
    }
  }

  const addGastroBlock = (round) => {
    for (const leg of legs) {
      for (let set = 1; set <= cfg.gastro.setsPerLeg; set++) {
        addWork(
          "gastro",
          "2) Standing straight-leg calf stretch (PIR)",
          `Round ${round}/${cfg.rounds} • ${leg} leg • Set ${set}/${cfg.gastro.setsPerLeg} • Contract (press ball of foot)`,
          cfg.gastro.contractSeconds
        );
        addWork(
          "gastro",
          "2) Standing straight-leg calf stretch (PIR)",
          `Round ${round}/${cfg.rounds} • ${leg} leg • Set ${set}/${cfg.gastro.setsPerLeg} • Hold deeper stretch`,
          cfg.gastro.holdSeconds
        );
      }
    }
  };

  const addHamstringBlock = (round) => {
    for (const leg of legs) {
      for (let set = 1; set <= cfg.hamstring.setsPerLeg; set++) {
        addWork(
          "hamstring",
          "3) Supine hamstring iso + stretch",
          `Round ${round}/${cfg.rounds} • ${leg} leg • Set ${set}/${cfg.hamstring.setsPerLeg} • Isometric push (50–60%)`,
          cfg.hamstring.isoSeconds
        );
        addWork(
          "hamstring",
          "3) Supine hamstring iso + stretch",
          `Round ${round}/${cfg.rounds} • ${leg} leg • Set ${set}/${cfg.hamstring.setsPerLeg} • Passive stretch`,
          cfg.hamstring.passiveSeconds
        );
      }
    }
  };

  const addHipSwitchBlock = (round) => {
    const sets = cfg.hipSwitch?.sets ?? 1;
    const switchesPerSet = cfg.hipSwitch?.switchesPerSet ?? 3;
    const holdPerSideSeconds = cfg.hipSwitch?.holdPerSideSeconds ?? 20;

    for (let set = 1; set <= sets; set++) {
      for (let sw = 1; sw <= switchesPerSet; sw++) {
        addWork(
          "hip_switch_9090",
          "2) 90/90 Hip Switches",
          `Round ${round}/${cfg.rounds} • Set ${set}/${sets} • Switch ${sw}/${switchesPerSet} • Left side hold (sit tall, hinge forward)`,
          holdPerSideSeconds
        );
        addWork(
          "hip_switch_9090",
          "2) 90/90 Hip Switches",
          `Round ${round}/${cfg.rounds} • Set ${set}/${sets} • Switch ${sw}/${switchesPerSet} • Right side hold (sit tall, hinge forward)`,
          holdPerSideSeconds
        );
      }
    }
  };

  const addPikeLiftsBlock = (round) => {
    for (let set = 1; set <= cfg.pikeLifts.sets; set++) {
      for (let rep = 1; rep <= cfg.pikeLifts.reps; rep++) {
        addWork(
          "pike_lifts",
          "4) Seated pike active leg lifts",
          `Round ${round}/${cfg.rounds} • Set ${set}/${cfg.pikeLifts.sets} • Rep ${rep}/${cfg.pikeLifts.reps} • Up ${cfg.pikeLifts.upSeconds}s + hold ${cfg.pikeLifts.topHoldSeconds}s + down ${cfg.pikeLifts.downSeconds}s`,
          cfg.pikeLifts.upSeconds + cfg.pikeLifts.topHoldSeconds + cfg.pikeLifts.downSeconds
        );
      }
      if (set !== cfg.pikeLifts.sets) {
        addRest(
          "rest_sets",
          "Rest",
          `Between sets (${cfg.pikeLifts.restBetweenSetsSeconds}s)`,
          cfg.pikeLifts.restBetweenSetsSeconds
        );
      }
    }
  };

  const addSeatedPikeBlock = (round) => {
    const exerciseNumber = "5";
    for (let cycle = 1; cycle <= cfg.seatedPikeLoaded.cycles; cycle++) {
      addWork(
        "seated_pike",
        `${exerciseNumber}) Seated pike loaded progressive`,
        `Round ${round}/${cfg.rounds} • Cycle ${cycle}/${cfg.seatedPikeLoaded.cycles} • Contract hip flexors + quads`,
        cfg.seatedPikeLoaded.contractSeconds
      );
      addWork(
        "seated_pike",
        `${exerciseNumber}) Seated pike loaded progressive`,
        `Round ${round}/${cfg.rounds} • Cycle ${cycle}/${cfg.seatedPikeLoaded.cycles} • Fold deeper + breathe`,
        cfg.seatedPikeLoaded.holdSeconds
      );
    }
  };

  for (let round = 1; round <= cfg.rounds; round++) {
    /** @type {Array<(round: number) => void>} */
    const roundBlocks = [];
    if (cfg.includeGastro) roundBlocks.push(addGastroBlock);
    if (cfg.includeHipSwitch) roundBlocks.push(addHipSwitchBlock);
    roundBlocks.push(addHamstringBlock, addPikeLiftsBlock, addSeatedPikeBlock);

    for (let i = 0; i < roundBlocks.length; i++) {
      roundBlocks[i](round);
      if (i < roundBlocks.length - 1) {
        addRest(
          "rest_exercises",
          "Rest",
          `Between exercises (${cfg.restBetweenExercisesSeconds}s)`,
          cfg.restBetweenExercisesSeconds
        );
      }
    }

    if (round !== cfg.rounds) {
      addRest(
        "rest_rounds",
        "Rest",
        `Between rounds (${cfg.restBetweenRoundsSeconds}s)`,
        cfg.restBetweenRoundsSeconds
      );
    }
  }

  addWork("done", "Done", "Session complete", 3);
  return steps;
}

function withTransitions(workSteps, transitionSeconds) {
  /** @type {Step[]} */
  const out = [];

  out.push({
    title: "Get ready",
    meta: `Starting in ${transitionSeconds}s`,
    seconds: transitionSeconds,
    kind: "transition",
    exerciseKey: "transition",
  });

  for (let i = 0; i < workSteps.length; i++) {
    out.push(workSteps[i]);

    const next = workSteps[i + 1];
    if (next) {
      // Separate transition only for exercise changes, not for rest, and not same exercise continuation.
      const isExerciseChange = next.exerciseKey !== workSteps[i].exerciseKey;
      const nextIsRest = next.kind === "rest";
      if (isExerciseChange && !nextIsRest) {
        out.push({
          title: "Next",
          meta: `Next starts in ${transitionSeconds}s • ${next.title}`,
          seconds: transitionSeconds,
          kind: "transition",
          exerciseKey: "transition",
        });
      }
    }
  }

  return out;
}

const ui = {
  startBtn: document.getElementById("startBtn"),
  prevBtn: document.getElementById("prevBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  nextBtn: document.getElementById("nextBtn"),
  nowTitle: document.getElementById("nowTitle"),
  nowMeta: document.getElementById("nowMeta"),
  countdown: document.getElementById("countdown"),
  nextTitle: document.getElementById("nextTitle"),
  stepBar: document.getElementById("stepBar"),
  sessionBar: document.getElementById("sessionBar"),
  stepIndex: document.getElementById("stepIndex"),
  stepTotal: document.getElementById("stepTotal"),
  totalLeft: document.getElementById("totalLeft"),
  programName: document.getElementById("programName"),
  programMeta: document.getElementById("programMeta"),
  programDefaults: document.getElementById("programDefaults"),
  programTabs: Array.from(document.querySelectorAll("[data-program]")),
};

let currentProgramKey = "standard";
let activeTransitionSeconds = 3;

let steps = [];
let stepIdx = 0;
let running = false;
let tickTimer = null;

let paused = false;
let pauseStartedMs = 0;

let stepStartMs = 0;
let stepEndMs = 0;
let totalSessionSeconds = 0;

let audioCtx = null;
let lastTickSoundKey = null;

function ensureAudioReady() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}

function playTickSound() {
  if (!audioCtx || audioCtx.state !== "running") return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.value = 0.04;

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const t0 = audioCtx.currentTime;
  osc.start(t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(0.04, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
  osc.stop(t0 + 0.07);

  osc.onended = () => {
    try {
      osc.disconnect();
      gain.disconnect();
    } catch {
      // ignore
    }
  };
}

function setBars(stepProgress, sessionProgress) {
  ui.stepBar.style.width = `${Math.min(100, Math.max(0, stepProgress * 100))}%`;
  ui.sessionBar.style.width = `${Math.min(100, Math.max(0, sessionProgress * 100))}%`;
}

function setNow(step, remainingSec) {
  ui.nowTitle.textContent = step?.title ?? "Done";
  ui.nowMeta.textContent = step?.meta ?? "";
  ui.countdown.textContent = formatMMSS(remainingSec);
}

function setNext() {
  const next = steps[stepIdx + 1];
  ui.nextTitle.textContent = next ? `${next.title} — ${next.meta}` : "—";
}

function renderStaticCounts() {
  ui.stepTotal.textContent = String(steps.length);
  ui.stepIndex.textContent = String(Math.min(steps.length, stepIdx + 1));
}

function startStep(nowMs) {
  const step = steps[stepIdx];
  stepStartMs = nowMs;
  stepEndMs = nowMs + step.seconds * 1000;
  renderStaticCounts();
  setNext();
}

function remainingPlannedSeconds(nowMs) {
  if (!steps.length) return 0;
  const step = steps[stepIdx];
  const stepRemainingSec = Math.max(0, (stepEndMs - nowMs) / 1000);
  const after = steps.slice(stepIdx + 1);
  return stepRemainingSec + sumSeconds(after);
}

function completedPlannedSeconds(nowMs) {
  if (!steps.length) return 0;
  const step = steps[stepIdx];
  const stepRemainingSec = Math.max(0, (stepEndMs - nowMs) / 1000);
  const elapsedInStep = Math.min(step.seconds, Math.max(0, step.seconds - stepRemainingSec));
  return sumSeconds(steps.slice(0, stepIdx)) + elapsedInStep;
}

function updateProgramTabs() {
  ui.programTabs.forEach((btn) => {
    const isActive = btn.dataset.program === currentProgramKey;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
    btn.disabled = running;
  });
}

function updateNavButtons() {
  const canNav = running && !paused;
  ui.prevBtn.disabled = !canNav || stepIdx <= 0;
  ui.nextBtn.disabled = !canNav;
  ui.pauseBtn.disabled = !running;
  ui.pauseBtn.textContent = paused ? "Resume" : "Pause";
}

function renderProgramDetails() {
  const program = PROGRAMS[currentProgramKey];
  ui.programName.textContent = program.title;
  ui.programMeta.textContent = program.meta;

  ui.programDefaults.innerHTML = "";
  for (const line of program.summaryBullets) {
    const li = document.createElement("li");
    li.textContent = line;
    ui.programDefaults.appendChild(li);
  }
}

function resetIdleDisplay() {
  if (running) return;
  ui.nowTitle.textContent = "Ready";
  ui.nowMeta.textContent = `Selected: ${PROGRAMS[currentProgramKey].title}. Press Start when you’re set.`;
  ui.countdown.textContent = "00:00";
  ui.nextTitle.textContent = "—";
  ui.stepIndex.textContent = "0";
  ui.stepTotal.textContent = "0";
  ui.totalLeft.textContent = "00:00";
  setBars(0, 0);
  ui.startBtn.textContent = "Start";
  updateNavButtons();
}

function selectProgram(programKey) {
  if (!PROGRAMS[programKey]) return;
  if (running) return;

  currentProgramKey = programKey;
  activeTransitionSeconds = PROGRAMS[currentProgramKey].transitionSeconds;
  updateProgramTabs();
  renderProgramDetails();
  resetIdleDisplay();
}

function finish() {
  running = false;
  paused = false;
  pauseStartedMs = 0;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  ui.startBtn.disabled = false;
  ui.startBtn.textContent = "Restart";
  ui.prevBtn.disabled = true;
  ui.pauseBtn.disabled = true;
  ui.nextBtn.disabled = true;
  ui.nowTitle.textContent = "Done";
  ui.nowMeta.textContent = "Session complete.";
  ui.countdown.textContent = "00:00";
  ui.nextTitle.textContent = "—";
  setBars(1, 1);
  ui.stepIndex.textContent = String(steps.length);
  ui.totalLeft.textContent = "00:00";
  updateProgramTabs();
}

function moveNextStep(nowMs) {
  stepIdx += 1;
  if (stepIdx >= steps.length) {
    finish();
    return;
  }
  startStep(nowMs);
  updateNavButtons();
}

function jumpToStep(newIdx, nowMs) {
  stepIdx = Math.min(Math.max(0, newIdx), Math.max(0, steps.length - 1));
  startStep(nowMs);
  lastTickSoundKey = null;
  updateNavButtons();
}

function pause() {
  if (!running || paused) return;
  paused = true;
  pauseStartedMs = Date.now();
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  updateNavButtons();
}

function resume() {
  if (!running || !paused) return;
  const nowMs = Date.now();
  const delta = Math.max(0, nowMs - pauseStartedMs);

  stepStartMs += delta;
  stepEndMs += delta;

  paused = false;
  pauseStartedMs = 0;
  lastTickSoundKey = null;
  updateNavButtons();

  tick();
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(tick, 120);
}

function tick() {
  if (!running || paused) return;

  const nowMs = Date.now();
  const step = steps[stepIdx];

  const stepRemainingSec = Math.max(0, (stepEndMs - nowMs) / 1000);
  const sessionRemainingSec = Math.max(0, remainingPlannedSeconds(nowMs));

  const stepDurationMs = Math.max(1, stepEndMs - stepStartMs);
  const stepProgress = Math.min(1, Math.max(0, (nowMs - stepStartMs) / stepDurationMs));

  const safeTotal = Math.max(1, totalSessionSeconds);
  const sessionProgress = Math.min(1, Math.max(0, completedPlannedSeconds(nowMs) / safeTotal));

  setNow(step, stepRemainingSec);
  ui.totalLeft.textContent = formatMMSS(sessionRemainingSec);
  setBars(stepProgress, sessionProgress);
  updateNavButtons();

  // Sound: only for the 3-2-1 countdown.
  // - If there's a separate transition step, beep there.
  // - If next step is same exercise, beep in the last 3 seconds of current step.
  const shownSecond = Math.ceil(stepRemainingSec);
  const soundKey = `${stepIdx}:${shownSecond}`;
  const next = steps[stepIdx + 1];
  const sameExerciseNext = next && next.kind !== "transition" && next.exerciseKey === step.exerciseKey;
  const shouldBeep = step.kind === "transition" || sameExerciseNext;
  if (
    shouldBeep &&
    shownSecond > 0 &&
    shownSecond <= activeTransitionSeconds &&
    soundKey !== lastTickSoundKey
  ) {
    lastTickSoundKey = soundKey;
    playTickSound();
  }

  if (nowMs >= stepEndMs - 10) {
    moveNextStep(nowMs);
  }
}

function start() {
  ensureAudioReady();
  const program = PROGRAMS[currentProgramKey];
  const work = buildWorkStepsForProgram(program);

  activeTransitionSeconds = program.transitionSeconds;
  steps = withTransitions(work, activeTransitionSeconds);

  stepIdx = 0;
  running = true;
  paused = false;
  pauseStartedMs = 0;
  lastTickSoundKey = null;

  totalSessionSeconds = sumSeconds(steps);

  ui.startBtn.disabled = true;
  ui.startBtn.textContent = "Running…";

  const nowMs = Date.now();
  startStep(nowMs);
  tick();

  updateProgramTabs();

  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(tick, 120);
}

ui.startBtn.addEventListener("click", () => {
  start();
});

ui.nextBtn.addEventListener("click", () => {
  ensureAudioReady();
  if (!running || paused) return;
  lastTickSoundKey = null;
  moveNextStep(Date.now());
  tick();
});

ui.prevBtn.addEventListener("click", () => {
  ensureAudioReady();
  if (!running || paused) return;
  if (stepIdx <= 0) return;
  jumpToStep(stepIdx - 1, Date.now());
  tick();
});

ui.pauseBtn.addEventListener("click", () => {
  ensureAudioReady();
  if (!running) return;
  if (paused) resume();
  else pause();
});

for (const btn of ui.programTabs) {
  btn.addEventListener("click", () => {
    selectProgram(btn.dataset.program || "");
  });
}

// Initial view
selectProgram(currentProgramKey);
ui.prevBtn.disabled = true;
ui.pauseBtn.disabled = true;
ui.nextBtn.disabled = true;
