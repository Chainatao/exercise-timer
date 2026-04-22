import {
  initZeppPage,
  onDestroy,
  onNext,
  onPauseResume,
  onPrev,
  onSelectProgram,
  onStart,
} from "./pages/zeppMain";

// App bootstrap shim. In Zepp runtime, bind these handlers to hmUI buttons/events.

export const app = {
  init: initZeppPage,
  destroy: onDestroy,
  actions: {
    start: onStart,
    pauseResume: onPauseResume,
    prev: onPrev,
    next: onNext,
    selectProgram: onSelectProgram,
  },
};
