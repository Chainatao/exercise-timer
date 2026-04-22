export interface SignalService {
  tick321(): void;
}

export class NoopSignalService implements SignalService {
  tick321(): void {
    // Intentionally empty for non-device environments.
  }
}

export class ConsoleSignalService implements SignalService {
  private lastAt = 0;

  tick321(): void {
    const now = Date.now();
    if (now - this.lastAt < 120) return;
    this.lastAt = now;
    // Useful during simulator / desktop validation.
    console.log("[signal] 3-2-1 tick");
  }
}

export class ZeppVibrationSignalService implements SignalService {
  private lastAt = 0;

  tick321(): void {
    const now = Date.now();
    if (now - this.lastAt < 120) return;
    this.lastAt = now;

    // Zepp-specific runtime API is injected in page adapter.
    // Using safe optional checks keeps this file type-checkable off-device.
    const anyGlobal = globalThis as unknown as {
      vibrate?: { start?: (arg: unknown) => void };
      hmSensor?: { createSensor?: (t: number) => { vibrate?: (ms: number) => void } };
    };

    if (anyGlobal.vibrate?.start) {
      anyGlobal.vibrate.start({ mode: 0 });
      return;
    }

    const sensor = anyGlobal.hmSensor?.createSensor?.(0);
    if (sensor?.vibrate) {
      sensor.vibrate(100);
    }
  }
}
