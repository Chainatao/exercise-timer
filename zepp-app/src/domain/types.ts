export type StepKind = "work" | "rest" | "transition";

export interface Step {
  title: string;
  meta: string;
  seconds: number;
  kind: StepKind;
  exerciseKey: string;
}

export type CustomFlowMode = "perSide" | "total";

export interface CustomFlowItem {
  key: string;
  title: string;
  mode: CustomFlowMode;
  meta: string;
  seconds?: number;
  secondsPerSide?: number;
}

export interface ProgramConfig {
  id: string;
  title: string;
  meta: string;
  summaryBullets: string[];
  transitionSeconds: number;
  warmup?: {
    seconds: number;
    title: string;
    meta: string;
  };
  rounds?: number;
  includeGastro?: boolean;
  includeHipSwitch?: boolean;
  restBetweenExercisesSeconds?: number;
  restBetweenRoundsSeconds?: number;
  nerveGlides?: {
    setsPerLeg: number;
    repsPerSet: number;
    repSeconds: number;
    restBetweenLegsSeconds: number;
  };
  gastro?: {
    setsPerLeg: number;
    contractSeconds: number;
    holdSeconds: number;
  };
  hamstring?: {
    setsPerLeg: number;
    isoSeconds: number;
    passiveSeconds: number;
  };
  hipSwitch?: {
    sets: number;
    switchesPerSet: number;
    holdPerSideSeconds: number;
  };
  pikeLifts?: {
    sets: number;
    reps: number;
    upSeconds: number;
    topHoldSeconds: number;
    downSeconds: number;
    restBetweenSetsSeconds: number;
  };
  seatedPikeLoaded?: {
    cycles: number;
    contractSeconds: number;
    holdSeconds: number;
  };
  customFlow?: CustomFlowItem[];
}

export interface TimerSnapshot {
  running: boolean;
  paused: boolean;
  stepIdx: number;
  stepTotal: number;
  nowTitle: string;
  nowMeta: string;
  nextTitle: string;
  remainingStepSeconds: number;
  remainingSessionSeconds: number;
  stepProgress: number;
  sessionProgress: number;
}
