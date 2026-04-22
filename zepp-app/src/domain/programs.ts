import { ProgramConfig } from "./types";

export const PROGRAMS: Record<string, ProgramConfig> = {
  standard: {
    id: "standard",
    title: "Evidence-Based Pike Routine (Standard)",
    meta: "2x/week, 3 rounds, 35-40 min",
    summaryBullets: [
      "Warm-up: 5 min",
      "3 rounds",
      "Rest between exercises: 25s",
      "Rest between rounds: 105s",
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
    meta: "3x/week, 2 rounds, 20-25 min",
    summaryBullets: [
      "Warm-up/transition: 2.5 min",
      "2 rounds",
      "Exercise 2: 90/90 hip switches",
      "Rest between exercises: 18s",
      "Rest between rounds: 60s",
    ],
    transitionSeconds: 3,
    warmup: {
      seconds: 150,
      title: "Warm-up/transition",
      meta: "Leg swings + cat-cows + gentle pike fold",
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
      "Single-round passive recovery flow",
      "No loading, no contract-relax",
      "Psoas, hip capsule, hip flexors, adductors, pike",
    ],
    transitionSeconds: 3,
    customFlow: [
      { key: "foam_psoas", title: "1) Foam roller psoas release", mode: "total", seconds: 180, meta: "3:00 total" },
      { key: "knee_to_chest", title: "2) Supine knee-to-chest hold", mode: "perSide", secondsPerSide: 60, meta: "Passive hold" },
      { key: "figure4", title: "3) Figure-4 piriformis stretch", mode: "perSide", secondsPerSide: 75, meta: "Passive hold" },
      { key: "half_kneeling", title: "4) Half-kneeling hip flexor stretch", mode: "perSide", secondsPerSide: 90, meta: "Pelvic tuck" },
      { key: "low_lunge", title: "5) Low lunge / couch stretch", mode: "perSide", secondsPerSide: 90, meta: "Slow breathing" },
      { key: "passive_9090", title: "6) 90/90 passive hold", mode: "perSide", secondsPerSide: 120, meta: "Passive hold" },
      { key: "butterfly", title: "7) Butterfly stretch", mode: "total", seconds: 120, meta: "2:00 total" },
      { key: "wide_fold", title: "8) Wide-legged forward fold", mode: "total", seconds: 90, meta: "1:30 total" },
      { key: "passive_pike", title: "9) Passive pike hold", mode: "total", seconds: 90, meta: "1:30 total" }
    ]
  }
};
