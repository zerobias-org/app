import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { APP_BASE_HREF, JsonPipe, PlatformLocation } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { environment } from '../environments/environment';
import { CapitalizePipe } from './pipes/capitalize.pipe';
import { ArrayToStringPipe } from './pipes/array-to-string.pipe';
import { ZerobiasClientAppService } from '@auditmation/ngx-zb-client-lib';
import { ToStringPipe } from './pipes/to-string.pipe';

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
  declarations: [AppComponent, CapitalizePipe, ArrayToStringPipe, ToStringPipe],
  imports: [BrowserModule, BrowserAnimationsModule, AppRoutingModule, FormsModule, ReactiveFormsModule],
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
      deps: [ZerobiasClientAppService],
      multi: true
    },
    CapitalizePipe,
    ArrayToStringPipe,
    ToStringPipe,
    JsonPipe
  ],
  bootstrap: [AppComponent],
})
export class AppModule {

}

function initializeAppFactory(zerobiasAppService: ZerobiasClientAppService) { // <<--- zerobias-app service calls client api init
  return () => zerobiasAppService.init().then(() => {
    console.log('ZerobiasAppService initialized');
  });
}
