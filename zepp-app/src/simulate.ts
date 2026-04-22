import { app } from "./app";

// Minimal desktop simulation entrypoint for logic checks.

app.init();
app.actions.selectProgram("standard");
app.actions.start();

setTimeout(() => app.actions.pauseResume(), 1500);
setTimeout(() => app.actions.pauseResume(), 2800);
setTimeout(() => app.actions.next(), 4200);
setTimeout(() => app.actions.prev(), 5400);
setTimeout(() => app.destroy(), 7000);
