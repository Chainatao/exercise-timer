import { PROGRAMS } from "../domain/programs";
import { TimerEngine } from "../domain/timerEngine";
import type { ProgramConfig, TimerSnapshot } from "../domain/types";
import type { SignalService } from "../services/signal";

export interface UiAdapter {
  renderProgramTabs(programs: ProgramConfig[], activeProgramId: string, disabled: boolean): void;
  renderProgramDetails(program: ProgramConfig): void;
  renderSnapshot(snapshot: TimerSnapshot): void;
  setControlState(state: {
    running: boolean;
    paused: boolean;
    canPrev: boolean;
    canNext: boolean;
    canPause: boolean;
  }): void;
}

const engine = new TimerEngine();
let currentProgramKey: keyof typeof PROGRAMS = "standard";
let lastSignalKey = "";
let tickId: ReturnType<typeof setInterval> | null = null;
let lastTabRenderKey = "";
let lastProgramDetailKey = "";

function currentProgram(): ProgramConfig {
  return PROGRAMS[currentProgramKey];
}

function allPrograms(): ProgramConfig[] {
  return Object.values(PROGRAMS);
}

function formatNowSnapshot(nowMs: number): TimerSnapshot {
  return engine.getSnapshot(nowMs);
}

function applyControlState(ui: UiAdapter, snap: TimerSnapshot): void {
  ui.setControlState({
    running: snap.running,
    paused: snap.paused,
    canPrev: snap.running && !snap.paused && snap.stepIdx > 0,
    canNext: snap.running && !snap.paused,
    canPause: snap.running,
  });
}

function renderAll(ui: UiAdapter, nowMs: number): void {
  const snap = formatNowSnapshot(nowMs);
  const tabKey = `${currentProgram().id}:${snap.running}`;
  if (tabKey !== lastTabRenderKey) {
    lastTabRenderKey = tabKey;
    ui.renderProgramTabs(allPrograms(), currentProgram().id, snap.running);
  }

  const detailKey = currentProgram().id;
  if (detailKey !== lastProgramDetailKey) {
    lastProgramDetailKey = detailKey;
    ui.renderProgramDetails(currentProgram());
  }

  ui.renderSnapshot(snap);
  applyControlState(ui, snap);
}

function signalKey(snap: TimerSnapshot): string {
  const shownSecond = Math.ceil(snap.remainingStepSeconds);
  return `${snap.stepIdx}:${shownSecond}`;
}

function runTick(ui: UiAdapter, signal: SignalService, nowMs: number): void {
  engine.tick(nowMs);
  const snap = formatNowSnapshot(nowMs);

  if (engine.shouldSignalThreeTwoOne(nowMs)) {
    const key = signalKey(snap);
    if (key !== lastSignalKey) {
      lastSignalKey = key;
      signal.tick321();
    }
  }

  renderAll(ui, nowMs);
}

export function createAppController(ui: UiAdapter, signal: SignalService): {
  init: () => void;
  selectProgram: (id: string) => void;
  start: () => void;
  pauseResume: () => void;
  prev: () => void;
  next: () => void;
  dispose: () => void;
} {
  const ensureTickLoop = (): void => {
    if (tickId) return;
    tickId = setInterval(() => runTick(ui, signal, Date.now()), 120);
  };

  const stopTickLoop = (): void => {
    if (!tickId) return;
    clearInterval(tickId);
    tickId = null;
  };

  return {
    init: () => {
      renderAll(ui, Date.now());
      stopTickLoop();
      ensureTickLoop();
    },
    selectProgram: (id: string) => {
      const snap = formatNowSnapshot(Date.now());
      if (snap.running) return;
      if (!(id in PROGRAMS)) return;
      currentProgramKey = id as keyof typeof PROGRAMS;
      lastProgramDetailKey = "";
      lastTabRenderKey = "";
      renderAll(ui, Date.now());
    },
    start: () => {
      engine.start(currentProgram(), Date.now());
      lastSignalKey = "";
      lastTabRenderKey = "";
      ensureTickLoop();
      renderAll(ui, Date.now());
    },
    pauseResume: () => {
      const nowMs = Date.now();
      const snap = formatNowSnapshot(nowMs);
      if (!snap.running) return;
      if (snap.paused) engine.resume(nowMs);
      else engine.pause(nowMs);
      renderAll(ui, nowMs);
    },
    prev: () => {
      engine.prev(Date.now());
      lastSignalKey = "";
      renderAll(ui, Date.now());
    },
    next: () => {
      engine.next(Date.now());
      lastSignalKey = "";
      renderAll(ui, Date.now());
    },
    dispose: () => {
      stopTickLoop();
    },
  };
}
