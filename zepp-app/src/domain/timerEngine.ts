import { ProgramConfig, Step, TimerSnapshot } from "./types";
import { buildWorkStepsForProgram, sumSeconds, withTransitions } from "./stepBuilder";

export class TimerEngine {
  private steps: Step[] = [];
  private stepIdx = 0;
  private running = false;
  private paused = false;
  private pauseStartedMs = 0;
  private stepStartMs = 0;
  private stepEndMs = 0;
  private totalSessionSeconds = 0;
  private activeTransitionSeconds = 3;

  private remainingPlannedSeconds(nowMs: number): number {
    if (!this.steps.length) return 0;
    const step = this.steps[this.stepIdx];
    const stepRemainingSec = Math.max(0, (this.stepEndMs - nowMs) / 1000);
    const after = this.steps.slice(this.stepIdx + 1);
    return stepRemainingSec + sumSeconds(after);
  }

  private completedPlannedSeconds(nowMs: number): number {
    if (!this.steps.length) return 0;
    const step = this.steps[this.stepIdx];
    const stepRemainingSec = Math.max(0, (this.stepEndMs - nowMs) / 1000);
    const elapsedInStep = Math.min(step.seconds, Math.max(0, step.seconds - stepRemainingSec));
    return sumSeconds(this.steps.slice(0, this.stepIdx)) + elapsedInStep;
  }

  private startStep(nowMs: number): void {
    const step = this.steps[this.stepIdx];
    this.stepStartMs = nowMs;
    this.stepEndMs = nowMs + step.seconds * 1000;
  }

  start(program: ProgramConfig, nowMs: number): void {
    const work = buildWorkStepsForProgram(program);
    this.activeTransitionSeconds = program.transitionSeconds;
    this.steps = withTransitions(work, this.activeTransitionSeconds);
    this.stepIdx = 0;
    this.running = true;
    this.paused = false;
    this.pauseStartedMs = 0;
    this.totalSessionSeconds = sumSeconds(this.steps);
    this.startStep(nowMs);
  }

  pause(nowMs: number): void {
    if (!this.running || this.paused) return;
    this.paused = true;
    this.pauseStartedMs = nowMs;
  }

  resume(nowMs: number): void {
    if (!this.running || !this.paused) return;
    const delta = Math.max(0, nowMs - this.pauseStartedMs);
    this.stepStartMs += delta;
    this.stepEndMs += delta;
    this.pauseStartedMs = 0;
    this.paused = false;
  }

  next(nowMs: number): void {
    if (!this.running || this.paused) return;
    this.stepIdx += 1;
    if (this.stepIdx >= this.steps.length) {
      this.finish();
      return;
    }
    this.startStep(nowMs);
  }

  prev(nowMs: number): void {
    if (!this.running || this.paused || this.stepIdx <= 0) return;
    this.stepIdx -= 1;
    this.startStep(nowMs);
  }

  tick(nowMs: number): boolean {
    if (!this.running || this.paused) return false;
    if (nowMs >= this.stepEndMs - 10) {
      this.next(nowMs);
      return true;
    }
    return false;
  }

  shouldSignalThreeTwoOne(nowMs: number): boolean {
    if (!this.running || this.paused || !this.steps.length) return false;
    const step = this.steps[this.stepIdx];
    const shownSecond = Math.ceil(Math.max(0, (this.stepEndMs - nowMs) / 1000));
    const next = this.steps[this.stepIdx + 1];
    const sameExerciseNext = !!next && next.kind !== "transition" && next.exerciseKey === step.exerciseKey;
    const shouldBeep = step.kind === "transition" || sameExerciseNext;
    return shouldBeep && shownSecond > 0 && shownSecond <= this.activeTransitionSeconds;
  }

  getSnapshot(nowMs: number): TimerSnapshot {
    if (!this.steps.length) {
      return {
        running: false,
        paused: false,
        stepIdx: 0,
        stepTotal: 0,
        nowTitle: "Ready",
        nowMeta: "Press Start",
        nextTitle: "-",
        remainingStepSeconds: 0,
        remainingSessionSeconds: 0,
        stepProgress: 0,
        sessionProgress: 0,
      };
    }

    const step = this.steps[this.stepIdx];
    const remainingStepSeconds = Math.max(0, (this.stepEndMs - nowMs) / 1000);
    const remainingSessionSeconds = Math.max(0, this.remainingPlannedSeconds(nowMs));

    const stepDurationMs = Math.max(1, this.stepEndMs - this.stepStartMs);
    const stepProgress = Math.min(1, Math.max(0, (nowMs - this.stepStartMs) / stepDurationMs));

    const safeTotal = Math.max(1, this.totalSessionSeconds);
    const sessionProgress = Math.min(1, Math.max(0, this.completedPlannedSeconds(nowMs) / safeTotal));

    const next = this.steps[this.stepIdx + 1];

    return {
      running: this.running,
      paused: this.paused,
      stepIdx: this.stepIdx,
      stepTotal: this.steps.length,
      nowTitle: step?.title ?? "Done",
      nowMeta: step?.meta ?? "",
      nextTitle: next ? `${next.title} - ${next.meta}` : "-",
      remainingStepSeconds,
      remainingSessionSeconds,
      stepProgress,
      sessionProgress,
    };
  }

  private finish(): void {
    this.running = false;
    this.paused = false;
  }
}
