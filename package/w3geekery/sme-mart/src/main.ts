// ⚠️ LOAD-BEARING SIDE-EFFECT IMPORT — MUST STAY FIRST. DO NOT REMOVE OR REORDER.
//
// Without it the app dies at module-eval time, before Angular bootstraps, with:
//   Uncaught TypeError: Cannot read properties of undefined (reading 'MESSAGE_KEY')
//     at CoreErrorLibrary.listKeys / CoreError.initWithLibrary
//
// Cause: CoreErrorLibrary builds a map of all 17 core error classes at module
// scope. 16 of them are reached only through errors/index.js, but CoreType.js:4
// deep-imports UnexpectedError directly from ./errors/UnexpectedError.js
// instead of the barrel. That direct edge makes esbuild place UnexpectedError
// in the *types* module cluster (next to DateTime), which evaluates AFTER
// CoreErrorLibrary. Its `var` binding is therefore still undefined when the map
// is built, the map bakes in `UnexpectedError: undefined`, and listKeys()
// throws dereferencing it.
//
// Importing the barrel here first forces errors/index.js — and so all 17
// classes — to be evaluated ahead of the library that captures them.
//
// Upstream fix is one line in @zerobias-org/types-core-js: CoreType.js should
// import from ./errors/index.js like PagedResults.js:3 does. Still present in
// 2.0.4 (we pin 2.0.3). Remove this import only after the package ships that
// change AND a production build is verified.
import '@zerobias-org/types-core-js';

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app.component';
import { DemoDataService } from './app/core/services/demo-data.service';

bootstrapApplication(App, appConfig)
  .then((appRef) => {
    // Expose demo seeder on window for dev console access
    (window as any).__seedDemoData = () => {
      const seeder = appRef.injector.get(DemoDataService);
      return seeder.seedAllDemoData();
    };
  })
  .catch((err) => console.error(err));
