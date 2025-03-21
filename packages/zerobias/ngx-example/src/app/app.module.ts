import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { APP_BASE_HREF, PlatformLocation } from '@angular/common';
import { ZerobiasClientApiService } from '@auditmation/ngx-zb-client-lib';
import { ZerobiasAppService } from './services/zerobias-app.service';


@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AppRoutingModule],
  exports: [],
  providers: [
    { provide: 'environment', useValue: environment },
    {
      provide: APP_BASE_HREF,
      useFactory: (s: PlatformLocation) => s.getBaseHrefFromDOM(),
      deps: [PlatformLocation],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      deps: [ZerobiasClientApiService],
      multi: true
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {

}

function initializeAppFactory(zerobiasAppService: ZerobiasAppService) { // <<--- zerbias-app service calls client api init
  return () => zerobiasAppService.init().then(() => {
    console.log('ZerobiasAppService initialized');
  });
}
