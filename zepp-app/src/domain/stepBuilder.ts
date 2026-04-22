import { ProgramConfig, Step } from "./types";

export function sumSeconds(steps: Step[]): number {
  return steps.reduce((acc, s) => acc + s.seconds, 0);
}

export function buildWorkStepsForProgram(cfg: ProgramConfig): Step[] {
  const steps: Step[] = [];
  const addWork = (exerciseKey: string, title: string, meta: string, seconds: number) =>
    steps.push({ title, meta, seconds, kind: "work", exerciseKey });
  const addRest = (exerciseKey: string, title: string, meta: string, seconds: number) =>
    steps.push({ title, meta, seconds, kind: "rest", exerciseKey });

  if (cfg.customFlow && Array.isArray(cfg.customFlow)) {
    const sides = ["Left", "Right"];
    for (const item of cfg.customFlow) {
      if (item.mode === "perSide") {
        for (const side of sides) {
          addWork(item.key, item.title, `${side} side - ${item.meta}`, item.secondsPerSide ?? 0);
        }
      } else {
        addWork(item.key, item.title, item.meta, item.seconds ?? 0);
      }
    }
    addWork("done", "Done", "Session complete", 3);
    return steps;
  }

  if (!cfg.warmup || !cfg.nerveGlides || !cfg.hamstring || !cfg.pikeLifts || !cfg.seatedPikeLoaded || !cfg.rounds) {
    throw new Error(`Program ${cfg.id} missing required blocks`);
  }

  addWork("warmup", cfg.warmup.title, cfg.warmup.meta, cfg.warmup.seconds);
  addWork(
    "nerve_glides",
    "Neural prep: Supine Sciatic Nerve Glides",
    `DONE ONCE - ${cfg.nerveGlides.setsPerLeg} sets/leg - ${cfg.nerveGlides.repsPerSet} reps/set`,
    3
  );

  const legs = ["Left", "Right"];
  for (let set = 1; set <= cfg.nerveGlides.setsPerLeg; set++) {
    for (let legIdx = 0; legIdx < legs.length; legIdx++) {
      const leg = legs[legIdx];
      for (let rep = 1; rep <= cfg.nerveGlides.repsPerSet; rep++) {
        addWork(
          "nerve_glides",
          "Nerve glides",
          `${leg} leg - Set ${set}/${cfg.nerveGlides.setsPerLeg} - Rep ${rep}/${cfg.nerveGlides.repsPerSet}`,
          cfg.nerveGlides.repSeconds
        );
      }
      const isLastSet = set === cfg.nerveGlides.setsPerLeg;
      const isLastLeg = legIdx === legs.length - 1;
      if (!(isLastSet && isLastLeg)) {
        addRest("rest_legs", "Rest", `Rest between legs (${cfg.nerveGlides.restBetweenLegsSeconds}s)`, cfg.nerveGlides.restBetweenLegsSeconds);
      }
    }
  }

  for (let round = 1; round <= cfg.rounds; round++) {
    const blocks: Step[][] = [];

    if (cfg.includeGastro && cfg.gastro) {
      const b: Step[] = [];
      for (const leg of legs) {
        for (let set = 1; set <= cfg.gastro.setsPerLeg; set++) {
          b.push({ title: "2) Standing straight-leg calf stretch (PIR)", meta: `Round ${round}/${cfg.rounds} - ${leg} - Set ${set}/${cfg.gastro.setsPerLeg} - Contract`, seconds: cfg.gastro.contractSeconds, kind: "work", exerciseKey: "gastro" });
          b.push({ title: "2) Standing straight-leg calf stretch (PIR)", meta: `Round ${round}/${cfg.rounds} - ${leg} - Set ${set}/${cfg.gastro.setsPerLeg} - Hold`, seconds: cfg.gastro.holdSeconds, kind: "work", exerciseKey: "gastro" });
        }
      }
      blocks.push(b);
    }

    if (cfg.includeHipSwitch && cfg.hipSwitch) {
      const b: Step[] = [];
      for (let set = 1; set <= cfg.hipSwitch.sets; set++) {
        for (let sw = 1; sw <= cfg.hipSwitch.switchesPerSet; sw++) {
          b.push({ title: "2) 90/90 Hip Switches", meta: `Round ${round}/${cfg.rounds} - Set ${set}/${cfg.hipSwitch.sets} - Switch ${sw}/${cfg.hipSwitch.switchesPerSet} - Left`, seconds: cfg.hipSwitch.holdPerSideSeconds, kind: "work", exerciseKey: "hip_switch_9090" });
          b.push({ title: "2) 90/90 Hip Switches", meta: `Round ${round}/${cfg.rounds} - Set ${set}/${cfg.hipSwitch.sets} - Switch ${sw}/${cfg.hipSwitch.switchesPerSet} - Right`, seconds: cfg.hipSwitch.holdPerSideSeconds, kind: "work", exerciseKey: "hip_switch_9090" });
        }
      }
      blocks.push(b);
    }

    {
      const b: Step[] = [];
      for (const leg of legs) {
        for (let set = 1; set <= cfg.hamstring.setsPerLeg; set++) {
          b.push({ title: "3) Supine hamstring iso + stretch", meta: `Round ${round}/${cfg.rounds} - ${leg} - Set ${set}/${cfg.hamstring.setsPerLeg} - Isometric`, seconds: cfg.hamstring.isoSeconds, kind: "work", exerciseKey: "hamstring" });
          b.push({ title: "3) Supine hamstring iso + stretch", meta: `Round ${round}/${cfg.rounds} - ${leg} - Set ${set}/${cfg.hamstring.setsPerLeg} - Passive`, seconds: cfg.hamstring.passiveSeconds, kind: "work", exerciseKey: "hamstring" });
        }
      }
      blocks.push(b);
    }

    {
      const b: Step[] = [];
      for (let set = 1; set <= cfg.pikeLifts.sets; set++) {
        for (let rep = 1; rep <= cfg.pikeLifts.reps; rep++) {
          b.push({
            title: "4) Seated pike active leg lifts",
            meta: `Round ${round}/${cfg.rounds} - Set ${set}/${cfg.pikeLifts.sets} - Rep ${rep}/${cfg.pikeLifts.reps}`,
            seconds: cfg.pikeLifts.upSeconds + cfg.pikeLifts.topHoldSeconds + cfg.pikeLifts.downSeconds,
            kind: "work",
            exerciseKey: "pike_lifts",
          });
        }
        if (set !== cfg.pikeLifts.sets) {
          b.push({ title: "Rest", meta: `Between sets (${cfg.pikeLifts.restBetweenSetsSeconds}s)`, seconds: cfg.pikeLifts.restBetweenSetsSeconds, kind: "rest", exerciseKey: "rest_sets" });
        }
      }
      blocks.push(b);
    }

    {
      const b: Step[] = [];
      const exerciseNumber = cfg.includeGastro ? "5" : "5";
      for (let cycle = 1; cycle <= cfg.seatedPikeLoaded.cycles; cycle++) {
        b.push({ title: `${exerciseNumber}) Seated pike loaded progressive`, meta: `Round ${round}/${cfg.rounds} - Cycle ${cycle}/${cfg.seatedPikeLoaded.cycles} - Contract`, seconds: cfg.seatedPikeLoaded.contractSeconds, kind: "work", exerciseKey: "seated_pike" });
        b.push({ title: `${exerciseNumber}) Seated pike loaded progressive`, meta: `Round ${round}/${cfg.rounds} - Cycle ${cycle}/${cfg.seatedPikeLoaded.cycles} - Hold`, seconds: cfg.seatedPikeLoaded.holdSeconds, kind: "work", exerciseKey: "seated_pike" });
      }
      blocks.push(b);
    }

    for (let i = 0; i < blocks.length; i++) {
      steps.push(...blocks[i]);
      if (i < blocks.length - 1) {
        addRest("rest_exercises", "Rest", `Between exercises (${cfg.restBetweenExercisesSeconds ?? 0}s)`, cfg.restBetweenExercisesSeconds ?? 0);
      }
    }

    if (round !== cfg.rounds) {
      addRest("rest_rounds", "Rest", `Between rounds (${cfg.restBetweenRoundsSeconds ?? 0}s)`, cfg.restBetweenRoundsSeconds ?? 0);
    }
  }

  addWork("done", "Done", "Session complete", 3);
  return steps;
}

export function withTransitions(workSteps: Step[], transitionSeconds: number): Step[] {
  const out: Step[] = [];
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
    if (!next) continue;

    const isExerciseChange = next.exerciseKey !== workSteps[i].exerciseKey;
    const nextIsRest = next.kind === "rest";
    if (isExerciseChange && !nextIsRest) {
      out.push({
        title: "Next",
        meta: `Next starts in ${transitionSeconds}s - ${next.title}`,
        seconds: transitionSeconds,
        kind: "transition",
        exerciseKey: "transition",
      });
    }
  }

  return out;
}
