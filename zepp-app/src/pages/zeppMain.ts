import { createAppController, type UiAdapter } from "./main";
import { PROGRAMS } from "../domain/programs";
import type { ProgramConfig, TimerSnapshot } from "../domain/types";
import { ConsoleSignalService, ZeppVibrationSignalService } from "../services/signal";
import { ZeppHmUiAdapter } from "./zeppHmUiAdapter";

// NOTE:
// This is a Zepp-facing page scaffold. Replace console-backed methods with
// hmUI widget creation/update code for your target device resolution.

class ConsoleUiAdapter implements UiAdapter {
  private lastProgramId = "";
  private lastNow = "";

  renderProgramTabs(programs: ProgramConfig[], activeProgramId: string, disabled: boolean): void {
    const key = `${activeProgramId}:${disabled}`;
    if (key === this.lastProgramId) return;
    this.lastProgramId = key;
    const names = programs.map((p) => (p.id === activeProgramId ? `[${p.title}]` : p.title)).join(" | ");
    console.log(`[tabs${disabled ? " disabled" : ""}] ${names}`);
  }

  renderProgramDetails(program: ProgramConfig): void {
    console.log(`[program] ${program.title} - ${program.meta}`);
  }

  renderSnapshot(snapshot: TimerSnapshot): void {
    const nowStr = `${snapshot.nowTitle} :: ${Math.ceil(snapshot.remainingStepSeconds)}s`;
    if (nowStr === this.lastNow) return;
    this.lastNow = nowStr;

    console.log(
      `[now] ${snapshot.nowTitle} | rem=${Math.ceil(snapshot.remainingStepSeconds)}s | total=${Math.ceil(snapshot.remainingSessionSeconds)}s | step ${snapshot.stepIdx + 1}/${snapshot.stepTotal}`
    );
  }

  setControlState(state: {
    running: boolean;
    paused: boolean;
    canPrev: boolean;
    canNext: boolean;
    canPause: boolean;
  }): void {
    console.log(
      `[controls] running=${state.running} paused=${state.paused} prev=${state.canPrev} next=${state.canNext} pause=${state.canPause}`
    );
  }
}

let runtimeControllerRef:
  | ReturnType<typeof createAppController>
  | null = null;

function hasHmUiRuntime(): boolean {
  const g = globalThis as unknown as { hmUI?: unknown };
  return !!g.hmUI;
}

function createRuntimeController() {
  if (hasHmUiRuntime()) {
    const ui = new ZeppHmUiAdapter({
      onSelectProgram: (id) => runtimeControllerRef?.selectProgram(id),
      onStart: () => runtimeControllerRef?.start(),
      onPauseResume: () => runtimeControllerRef?.pauseResume(),
      onPrev: () => runtimeControllerRef?.prev(),
      onNext: () => runtimeControllerRef?.next(),
    });
    ui.mount();
    return createAppController(ui, new ZeppVibrationSignalService());
  }

  return createAppController(new ConsoleUiAdapter(), new ConsoleSignalService());
}

const runtimeController = createRuntimeController();
runtimeControllerRef = runtimeController;

export function initZeppPage(): void {
  runtimeController.init();
}

export function onSelectProgram(id: keyof typeof PROGRAMS): void {
  runtimeController.selectProgram(id);
}

export function onStart(): void {
  runtimeController.start();
}

export function onPauseResume(): void {
  runtimeController.pauseResume();
}

export function onPrev(): void {
  runtimeController.prev();
}

export function onNext(): void {
  runtimeController.next();
}

export function onDestroy(): void {
  runtimeController.dispose();
}
