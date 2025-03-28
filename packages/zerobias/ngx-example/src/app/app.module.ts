import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { APP_BASE_HREF, PlatformLocation } from '@angular/common';
import { ZerobiasAppService } from '@auditmation/ngx-zb-client-lib';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AppRoutingModule, FormsModule, ReactiveFormsModule],
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
      deps: [ZerobiasAppService],
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
