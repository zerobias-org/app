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
