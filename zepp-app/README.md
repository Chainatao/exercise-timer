# Zepp OS Exercise Timer (WIP)

This folder contains the in-progress Zepp OS port of the web exercise timer.

## Current status
- Ported domain logic to TypeScript:
  - Program definitions (Standard, Post-Workout, Rest Day)
  - Step generation
  - Transition insertion logic
  - Timer state machine (start/pause/resume/prev/next/tick)
- Added app controller + UI adapter layer:
   - Tabs/program selection state
   - Control-state derivation (start/pause/prev/next)
   - Tick loop + 3-2-1 signal hooks
- Added Zepp-facing page scaffold with placeholder adapter methods.

## Tooling
Node and npm are available.

Project-local Zepp tooling installed:
- `@zeppos/zeus-cli`
- `@zeppos/device-types`

Run with npm scripts (`zeus` is local to this folder):
- `npm run zepp:status`
- `npm run zepp:dev`
- `npm run zepp:preview`
- `npm run zepp:build`

Note: On this machine, `zeus init` currently fails with `devicesData is not a function`.
This appears to be a tooling/runtime issue in the current environment, not in app code.

## Next commands
1. Install dependencies:
   - `npm install`
2. Type-check logic:
   - `npm run check`
3. Run local simulation:
   - `npm run simulate`
4. Use Zepp CLI scripts:
   - `npm run zepp:status`
   - `npm run zepp:dev`

## Structure
- `src/domain/types.ts` - shared types
- `src/domain/programs.ts` - program data
- `src/domain/stepBuilder.ts` - step generation
- `src/domain/timerEngine.ts` - timer state machine
- `src/pages/main.ts` - app controller + UI adapter contract
- `src/pages/zeppMain.ts` - Zepp page scaffold + handlers
- `src/services/signal.ts` - signal implementations (noop/console/Zepp vibration)
- `src/app.ts` - bootstrap shim for runtime binding

## Next implementation step
Replace `ConsoleUiAdapter` in `src/pages/zeppMain.ts` with real Zepp `hmUI` widgets:
- Program tabs (3 buttons)
- Big countdown text
- Current/next text blocks
- Step/session progress bars
- Controls (Prev/Pause/Next/Start)
