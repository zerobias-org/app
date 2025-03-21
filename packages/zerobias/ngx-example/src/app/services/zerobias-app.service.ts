import { Inject, Injectable } from '@angular/core';
import { ZbClientOrgIdService, ZerobiasClientApiService } from '@auditmation/ngx-zb-client-lib';
import { User, ServiceAccount, Org } from '@auditmation/module-auditmation-auditmation-dana';
import { BehaviorSubject } from 'rxjs';
import { Hostname, PagedResults, UUID } from '@auditmation/types-core-js';

@Injectable({
  providedIn: 'root'
})
export class ZerobiasAppService {

  private $whoAmI = new BehaviorSubject(null);
  private $org = new BehaviorSubject(null);
  public orgs = null;


  constructor(
    protected clientApi: ZerobiasClientApiService, 
    protected orgIdService: ZbClientOrgIdService,
    @Inject('environment') private environment: any
  ) { }
  /* 
  1. init function
    - init client api 
    - init app
      - get whoami
      - listOrgs()
      - getMyCurrentOrg() <-- identical to app service in portal
      - if have org, continue, 
        if not: 
          - take first/last orgId from listOrgs()
          - set org
          - getMyCurrentOrg() again after set org

  */
  public async init() {
    try {
      const clientInit = await this.clientApi.init();
      if( !clientInit ) {
        if( this.environment.isLocalDev ) {
          const error = new Error('Start the local portal app to init a user and get a cookie.');
          console.warn('Failed to initialize Auditmation Client APIs', error);
        } else {
          return Promise.reject('Failed to initialize Auditmation Client APIs')
        }
      }
      
      const appInit = await this.initApp();
      return appInit;
    } catch(error) {
      return Promise.reject(`Failed to initialize ${this.environment.app}`)
    }
  }

  public async initApp() {
    console.log(`Initializing Auditmation ${this.environment.app}...`);
    try{
      const whoAmI = await this.whoAmI();
      if( whoAmI ) {
        this.$whoAmI.next(whoAmI)
      } else {
        throw new Error('')
      }
      // this.danatagsService.init(); // start to gather tag types while app is initializing

      this.clientApi.danaClient.getOrgApi().listOrgs(1,150).then((orgs:PagedResults<Org>) => {
        this.orgs = orgs.items;
      }).catch((error) => {
        console.warn('Failed to init app.', error);
      });

      const org = await this.getMyCurrentOrg();
      if( org ) {
        this.$org.next(org);
      } else {
        // - take first/last orgId from listOrgs()
        const lastorg = this.orgs[-1];
        // - set org
        // do I use orgIdService or setOrg?
        this.orgIdService.setCurrrenOrgId(lastorg.id);
        this.setOrg(lastorg.id);
        // - getMyCurrentOrg() again after set org 
        const org = await this.getMyCurrentOrg();
        if (org) {
          this.$org.next(org);
        } else {
          throw new Error('unable to set org')
        }
      }
      return Promise.resolve();
    } catch(error) {
      return Promise.reject()
    }
  }

  public async setOrg(orgId:string|UUID) {
    return await this.clientApi.danaClient.getOrgApi().selectOrg(this.clientApi.toUUID(orgId), new Hostname(location.hostname)).then(() => {
      this.orgIdService.setCurrrenOrgId(orgId);
    });
  }

  public async whoAmI(): Promise<User | ServiceAccount> {
    return await this.clientApi.danaClient.getMeApi().whoAmI().then((whoAmI:any) => {
      if( whoAmI ) {
        // noop
      } else {
        this.notAuthorizedRedirect();
      }
      return whoAmI;
    }).catch((error) => {
      this.notAuthorizedRedirect();
    });
  }

  public async getMyCurrentOrg() {
    const orgId = this.orgIdService.getCurrentOrgId();
    if( orgId  ) {
      return await this.clientApi.danaClient.getOrgApi().getOrg(this.clientApi.toUUID(orgId)).then((org) => {
        return org;
      }).catch((error) => {
        console.warn('Failed to your org.', error);
      });
    } else {
      return await Promise.reject('No Org Id Found');
    }
  }

  public notAuthorizedRedirect() {
    // todo
  }

}
