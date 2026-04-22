import type { ProgramConfig, TimerSnapshot } from "../domain/types";
import type { UiAdapter } from "./main";

// Minimal hmUI adapter scaffold for Zepp runtime.
// Uses loose typing so this file can compile without Zepp SDK typings installed.

type HmUiRuntime = {
  createWidget: (widgetType: unknown, options: Record<string, unknown>) => any;
  widget?: {
    TEXT?: unknown;
    FILL_RECT?: unknown;
    BUTTON?: unknown;
  };
  prop?: {
    TEXT?: unknown;
    MORE?: unknown;
  };
};

function runtime(): HmUiRuntime | null {
  const g = globalThis as unknown as { hmUI?: HmUiRuntime };
  return g.hmUI ?? null;
}

function fmtMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export class ZeppHmUiAdapter implements UiAdapter {
  private ready = false;
  private nowText: any = null;
  private metaText: any = null;
  private countdownText: any = null;
  private nextText: any = null;
  private stepBar: any = null;
  private sessionBar: any = null;
  private tabs: Array<{ id: string; btn: any }> = [];
  private pauseBtn: any = null;
  private prevBtn: any = null;
  private nextBtn: any = null;

  constructor(private handlers: {
    onSelectProgram: (id: string) => void;
    onStart: () => void;
    onPauseResume: () => void;
    onPrev: () => void;
    onNext: () => void;
  }) {}

  mount(): void {
    const hm = runtime();
    if (!hm || !hm.widget) return;
    const widget = hm.widget;

    // Countdown (hero)
    this.countdownText = hm.createWidget(widget.TEXT, {
      x: 0,
      y: 20,
      w: 390,
      h: 64,
      text: "00:00",
      text_size: 56,
      align_h: 2,
      align_v: 1,
    });

    // Program tabs (3 compact buttons)
    const tabDefs = [
      { id: "standard", text: "Std" },
      { id: "postworkout", text: "Post" },
      { id: "restday", text: "Rest" },
    ];
    tabDefs.forEach((tab, i) => {
      const btn = hm.createWidget(widget.BUTTON, {
        x: 18 + i * 118,
        y: 92,
        w: 108,
        h: 32,
        text: tab.text,
        click_func: () => this.handlers.onSelectProgram(tab.id),
      });
      this.tabs.push({ id: tab.id, btn });
    });

    this.nowText = hm.createWidget(widget.TEXT, {
      x: 16,
      y: 132,
      w: 358,
      h: 52,
      text: "Ready",
      text_size: 28,
      align_h: 0,
      align_v: 1,
    });

    this.metaText = hm.createWidget(widget.TEXT, {
      x: 16,
      y: 184,
      w: 358,
      h: 40,
      text: "Press Start",
      text_size: 16,
      align_h: 0,
      align_v: 0,
    });

    this.nextText = hm.createWidget(widget.TEXT, {
      x: 16,
      y: 232,
      w: 358,
      h: 36,
      text: "Next: -",
      text_size: 14,
      align_h: 0,
      align_v: 1,
    });

    // Progress bars
    hm.createWidget(widget.FILL_RECT, { x: 16, y: 274, w: 358, h: 8, color: 0x333333 });
    hm.createWidget(widget.FILL_RECT, { x: 16, y: 290, w: 358, h: 8, color: 0x333333 });
    this.stepBar = hm.createWidget(widget.FILL_RECT, { x: 16, y: 274, w: 0, h: 8, color: 0x57d7ff });
    this.sessionBar = hm.createWidget(widget.FILL_RECT, { x: 16, y: 290, w: 0, h: 8, color: 0x8cff66 });

    // Controls
    hm.createWidget(widget.BUTTON, {
      x: 16,
      y: 308,
      w: 84,
      h: 38,
      text: "Start",
      click_func: this.handlers.onStart,
    });

    this.prevBtn = hm.createWidget(widget.BUTTON, {
      x: 108,
      y: 308,
      w: 84,
      h: 38,
      text: "Prev",
      click_func: this.handlers.onPrev,
    });

    this.pauseBtn = hm.createWidget(widget.BUTTON, {
      x: 200,
      y: 308,
      w: 84,
      h: 38,
      text: "Pause",
      click_func: this.handlers.onPauseResume,
    });

    this.nextBtn = hm.createWidget(widget.BUTTON, {
      x: 292,
      y: 308,
      w: 84,
      h: 38,
      text: "Next",
      click_func: this.handlers.onNext,
    });

    this.ready = true;
  }

  renderProgramTabs(programs: ProgramConfig[], activeProgramId: string, disabled: boolean): void {
    if (!this.ready) return;
    for (const tab of this.tabs) {
      const active = tab.id === activeProgramId;
      tab.btn?.setProperty?.(1, {
        text: active ? `${tab.id.slice(0, 1).toUpperCase()}${tab.id.slice(1, 3)}*` : tab.id.slice(0, 4),
        color: active ? 0x57d7ff : 0xffffff,
        enable: !disabled,
      });
    }
    // Keep linter happy about unused param in this scaffold.
    void programs;
  }

  renderProgramDetails(program: ProgramConfig): void {
    if (!this.ready) return;
    this.metaText?.setProperty?.(1, {
      text: `${program.title} | ${program.meta}`,
    });
  }

  renderSnapshot(snapshot: TimerSnapshot): void {
    if (!this.ready) return;
    this.countdownText?.setProperty?.(1, { text: fmtMMSS(snapshot.remainingStepSeconds) });
    this.nowText?.setProperty?.(1, { text: snapshot.nowTitle });
    this.nextText?.setProperty?.(1, { text: `Next: ${snapshot.nextTitle}` });

    const maxW = 358;
    this.stepBar?.setProperty?.(2, { w: Math.max(0, Math.min(maxW, Math.round(maxW * snapshot.stepProgress))) });
    this.sessionBar?.setProperty?.(2, { w: Math.max(0, Math.min(maxW, Math.round(maxW * snapshot.sessionProgress))) });
  }

  setControlState(state: { running: boolean; paused: boolean; canPrev: boolean; canNext: boolean; canPause: boolean; }): void {
    if (!this.ready) return;
    this.prevBtn?.setProperty?.(1, { enable: state.canPrev });
    this.nextBtn?.setProperty?.(1, { enable: state.canNext });
    this.pauseBtn?.setProperty?.(1, { enable: state.canPause, text: state.paused ? "Resume" : "Pause" });
  }
}
