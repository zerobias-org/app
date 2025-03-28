import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { APP_BASE_HREF, PlatformLocation } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { environment } from '../environments/environment';
import { ZerobiasAppService } from '@auditmation/ngx-zb-client-lib';
/* 
  some of what you can do with `ZerobiasAppService`:
    get org: current org from cookie or localStorage
    get whoAmI: current user
    get requestError
    get responseError
    setOrg
    selectOrg: change current org to another if user is member of multiple orgs
    onLogout: handle logout actions
*/
@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AppRoutingModule, FormsModule, ReactiveFormsModule],
  exports: [],
  providers: [
    { provide: 'environment', useValue: environment }, // contains variables for env
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
