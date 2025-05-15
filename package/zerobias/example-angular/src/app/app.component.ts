import { combineLatest, Subscription } from 'rxjs';
import { ToStringPipe } from './pipes/to-string.pipe';
import { CapitalizePipe } from './pipes/capitalize.pipe';
import { ArrayToStringPipe } from './pipes/array-to-string.pipe';
import { FormControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Component, Inject, OnDestroy, OnInit, Renderer2, ViewEncapsulation } from '@angular/core';

import { PagedResults, Duration } from '@auditmation/types-core-js';
import { ModuleSearch } from '@auditmation/module-auditmation-auditmation-store';
import { ProductExtended } from '@auditmation/module-auditmation-auditmation-portal';
import { ProductWithObjectCount } from '@auditmation/module-auditmation-auditmation-platform';
import { getZerobiasClientUrl } from '@auditmation/zb-client-lib-js/dist/lib/services/zerobias-client-api';
import { GithubClient, newGithub, Organization, OrganizationApi, Repository } from '@auditlogic/module-github-github-client-ts';
import { ZerobiasClientAppService, ZerobiasClientApiService, ZerobiasClientOrgIdService } from '@auditmation/ngx-zb-client-lib';
import { ConnectionListView, ScopeListView, SearchConnectionBody, SearchScopeBody, SortObject } from '@auditmation/module-auditmation-auditmation-hub';
import { Org, PKV, ServiceAccount, User, ApiKey, InlineObject, SharedSessionKey, CreateSharedSessionKeyBody } from '@auditmation/module-auditmation-auditmation-dana';

function getFutureDate(addYears:number) {
  const date = new Date();
  const year = date.getFullYear() + addYears;
  const newDate = new Date();
  newDate.setFullYear(year);
  return newDate;
}

  /*
    // basic outline of this demo
    1. catalog example:  section, list of 5 products w/ logo
    2. module example:   section, <--- use auditlogic module for github
      select a Zerobias org 
      select a Connection (for github product) to get target <--- hubClient.getConnectionApi().search
        TODO: if creating a connection (future path) go to oauth page
      select scope <-- set to default scope if only 1 - hubClient.getScopeApi().search()
      call list github orgs on connection
      show list of repos by org
  */


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [CapitalizePipe,ArrayToStringPipe,ToStringPipe],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit, OnDestroy {

  private subscriptions = new Subscription();
  private readonly DEFAULT_MINUTES: number = 60;
  
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private bodyClickListener = ()=>{};

  public loading = false;
  /* 
  SearchProductBody {
      'productServiceFilter'?: SearchProductBody.ProductServiceFilterEnumDef;
      'name'?: string;
      'description'?: string;
      'search'?: string | null;
      'code'?: string;
      'packageCode'?: string;
      'vendor'?: string;
      'suite'?: string;
      'vendors'?: Array<UUID>;
      'suites'?: Array<UUID>;
      'statuses'?: Array<VspStatusEnumDef>;
      'segments'?: Array<UUID>;
      'factoryTypes'?: Array<FactoryTypeEnumDef>;
      'hostingTypes'?: Array<HostingTypeEnumDef>;
  */
  public productsPageStateExample = { count: 0, searchProductBody: null, pageNumber: 1, pageSize: 5, sort: {active: 'name', direction: 'asc'} };

  // Zerobias client library and modules give us many strongly typed interfaces!
  public orgs: Org[] = [];
  public githubOrgs: Organization[] = [];
  public currentOrg: Org = null;
  public currentUser: any = null;
  public me: ServiceAccount | (object & User) = null;
  public products: ProductExtended[] | ProductWithObjectCount[] = [];
  public githubProduct: ProductExtended;
  public connections: ConnectionListView[] = [];
  public selectedConnection: ConnectionListView;
  public scopes: ScopeListView[] = [];
  public selectedScope: ScopeListView;
  public selectedGithubOrg: Organization;
  public githubRepos: Repository[];
  public pagedKvPairs: PKV[] = [];
  public showAddPkv = false;
  public pkvPageToken = null;

  public toggle = false;
  public previousUrl = null;
  public overlay = {
    active: false,
    showAction: false,
    showCancel: true,
    actionLabel: '',
    action: '', // createApiKey or createSharedSessionKey
    title: '',
    message: '',
    actionProcessing: false,
    actionDisabled: true,
    actionButtonColor: 'primary', // 'warn', 'success', 'primary'
  }

  // github client Module 
  public githubClient: GithubClient;

  // FormGroup for html selectors 
  public formGroup: UntypedFormGroup = new UntypedFormGroup({
    org: new UntypedFormControl(null),
    product: new UntypedFormControl(null),
    connection: new UntypedFormControl(null),
    scope: new UntypedFormControl(null),
    githubOrg: new UntypedFormControl(null),
  });

  // FormGroup for pKV
  public kvFormGroup: UntypedFormGroup = new UntypedFormGroup({
    key: new FormControl<string>(null, Validators.required),
    value: new UntypedFormControl(null, Validators.required),
  });

  // create api key formGroup
  public apiKeyFormGroup = new UntypedFormGroup({
    'name': new UntypedFormControl(),
    'expiration': new UntypedFormControl(getFutureDate(10)),
  });
  public apiKeyKeyForm = new UntypedFormControl();
  public orgIdInput = new UntypedFormControl();

  // create shared session key
  public sharedSessionFormGroup = new UntypedFormGroup({
    expireMinutes: new FormControl<number>(this.DEFAULT_MINUTES)
  });
  public sharedSessionKeyForm = new FormControl<string>(null);
  public sharedSessionKey = null;

  public productsPageNumbers = [1];
  public productsLastPage = null;

  constructor(
    private renderer: Renderer2,
    protected clientApi: ZerobiasClientApiService,
    protected zerobiasAppService: ZerobiasClientAppService,
    protected orgIdService: ZerobiasClientOrgIdService,
    @Inject('environment') private environment: any
  ) {}

  public ngOnInit(): void {
    this.loading = true;

    // for Product List demo block, calls to Zerobias Catalog
    this.getProducts();
    this.listPkvs();

    // for Zerobias Org selector
    this.subscriptions.add(this.zerobiasAppService.getOrgs().subscribe((orgs: Org[]) => {
      this.orgs = orgs;
    }));

    // subscribe to the Org and WhoAmI observables; 
    // combineLatest since we need both at the same time so 
    // this runs when either org or whoAmI changes i.e. changing Zerobias Org
    this.subscriptions.add(combineLatest(
      [this.zerobiasAppService.getWhoAmI(), this.zerobiasAppService.getCurrentOrg()]).subscribe(([whoAmI, org]:any[]) => {
        console.log('whoAmI', whoAmI);
      this.me = whoAmI;
      this.currentUser = whoAmI;
      this.currentOrg = org;
      
      // set the org formcontrol value
      this.formGroup.get('org').setValue(org, {emitEvent: false});
      const safeName = `${whoAmI.name}_Api_Key`.replace('-','_');
      this.apiKeyFormGroup.get('name').setValue(safeName, {emitEvent: false});
      
      if (whoAmI && org) {
        if (this.githubProduct) {
          this.getConnections();
        } else {
          this.getGithubProduct().then((githubProduct) => {
            this.githubProduct = githubProduct;
            this.formGroup.get('product').setValue(githubProduct, {emitEvent: false});
            this.formGroup.get('product').disable(); // we're only using github for this demo - not changeable

            // update list of Connections
            this.getConnections();
          });
        }
      }
    }));

    // listen for Org select changes
    this.subscriptions.add(this.formGroup.get('org').valueChanges.subscribe((org:Org) => {
      // console.log('org change', org);

      // this will cascade and update our observables whoami and org
      if (org.id && (org.id.toString() !== this.currentOrg.id.toString())) {
        this.zerobiasAppService.selectOrg(org);
        this.formGroup.get('connection').setValue(null, {emitEvent: false});
        this.formGroup.get('scope').setValue(null, {emitEvent: false});
      }
    }));

    // listen for Connection select changes
    this.subscriptions.add(this.formGroup.get('connection').valueChanges.subscribe((connection: ConnectionListView) => {
      console.log('Connection change', connection);

      if (connection.id && (connection.id.toString() !== this.selectedConnection?.id.toString())) {
        this.selectedConnection = connection;
        this.formGroup.get('scope').setValue(null, {emitEvent: false});
        
        // get Scopes for this Connection
        this.getConnectionScopes();
      }
    }));

    // listen for Connection SCOPE select changes
    this.subscriptions.add(this.formGroup.get('scope').valueChanges.subscribe((scope: ScopeListView) => {
      console.log('scope change', scope);

      if (scope.id && (scope.id.toString() !== this.selectedScope?.id.toString())) {
        this.selectedScope = scope;

        // get Github orgs using this scope
        this.getGithubOrgs();
      }
    }));

    // listen for Github Org select changes
    this.subscriptions.add(this.formGroup.get('githubOrg').valueChanges.subscribe((githubOrg: Organization) => {
      console.log('githubOrg change', githubOrg);

      if (githubOrg.id && (githubOrg.id.toString() !== this.selectedGithubOrg?.id.toString())) {
        this.selectedGithubOrg = githubOrg;
        // get repos for this Github org
        this.listRepositories();
      }
    }));

  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public toggleUserClick(e) {
    e.stopPropagation();
  }

  public setOrg(e, org: any) {
    e.stopPropagation();
    this.zerobiasAppService.selectOrg(org);
  }

  public onActionClick() {
    console.log('click action');

    if (this.overlay.action === 'createApiKey') {

      // createApiKey

      if (this.overlay.actionLabel === 'Close') {
        this.onCloseOverlayClick();
      } else {
        this.overlay.actionProcessing = true;
        this.createApiKey(this.apiKeyFormGroup.value).then((key: any) => {
          if (key) {
            this.overlay.actionLabel = 'Close';
            this.overlay.actionButtonColor = 'primary';
            this.overlay.showCancel = false;
            navigator.clipboard.writeText(key.data).then(() => {
              const currentOrgId = this.orgIdService.getCurrentOrgId();
              this.apiKeyKeyForm.setValue(key.data);
              this.orgIdInput.setValue(currentOrgId);
              this.overlay.message = `Your API Key was successfully created, and was copied to your clipboard.`;
            });
          }
        }).finally(() => {
          this.overlay.actionProcessing = false;
        });
      }
      
    } else if(this.overlay.action === 'createSharedSessionKey') {
      
      // createSharedSessionKey

      if (this.sharedSessionKeyForm.value) {
        this.onCloseOverlayClick();
      } else {
        const expireMinutes = this.sharedSessionFormGroup.get('expireMinutes').value;
        const duration = new Duration(this.minutesToDuration(expireMinutes));
        if (expireMinutes) {
          this.createSharedSessionKey(duration).then((sharedSessionKey: SharedSessionKey) => {
            if (sharedSessionKey) {
              this.sharedSessionKey = sharedSessionKey;
              this.sharedSessionKeyForm.setValue(sharedSessionKey.key.toUpperCase());
            }
          })
        }
      }
    }
  }

  public onShareSessionClick() {
    this.overlay.action = 'createSharedSessionKey';
    this.overlay.actionLabel = 'Create';
    this.overlay.title = 'Create Shared Session Key';
    this.overlay.active = true;
    this.overlay.showAction = true;
    this.overlay.actionDisabled = false;
    this.overlay.actionButtonColor = 'success';

  }

  public onCreateApiKeyClick() {
    this.overlay.action = 'createApiKey';
    this.overlay.actionLabel = 'Create';
    this.overlay.title = 'Create API Key';
    this.overlay.active = true;
    this.overlay.showAction = true;
    this.overlay.actionDisabled = false;
    this.overlay.actionButtonColor = 'success';
    this.overlay.message = '';
  }

  public onCloseOverlayClick() {
    this.overlay.action = '';
    this.overlay.active = false;
    this.overlay.actionDisabled = true;
  }

  public onToggle(ev = null) {
    if (ev) {
      ev.stopPropagation();
    }
    this.toggle = !this.toggle;
    if (this.toggle) {
      this.bodyClickListener = this.renderer.listen('body', 'click', (event) => {
        this.onToggle(event);
      });
    } else {
      this.bodyClickListener();
    }
  }

  public compareObjects(object1: any, object2: any) {
    return object1 && object2 && object1.id.toString() === object2.id.toString();
  }

  public getProducts(pageNum = null) {
    if (pageNum) {
      // user requests specific page from pagination
      this.productsPageStateExample.pageNumber = pageNum;
    }
    this.clientApi.portalClient.getProductApi()
      .search({},this.productsPageStateExample.pageNumber, this.productsPageStateExample.pageSize, this.productsPageStateExample.sort )
      .then((pagedResults:PagedResults<ProductExtended>) => {
        if (pagedResults.items.length > 0) {
          if (!this.productsPageNumbers.includes(pagedResults.pageNumber)) {
            this.productsPageNumbers.push(pagedResults.pageNumber); // page we're on
            // console.log('productsPageNumbers: ',this.productsPageNumbers);
            this.productsPageNumbers = this.productsPageNumbers.sort();
          }
          this.productsPageStateExample.count = pagedResults.items.length;
          this.products = pagedResults.items;
        } else {
          // no more products pages, current page is 'last page'
          this.productsLastPage = this.productsPageStateExample.pageNumber;
        }
      })  
  }

  public onPageChange(e) {
    if (e.target.className.includes('next')) {
      this.productsPageStateExample.pageNumber = this.productsPageStateExample.pageNumber + 1;
    } else if(e.target.className.includes('prev')) {
      if (this.productsPageStateExample.pageNumber > 1) {
        this.productsPageStateExample.pageNumber = this.productsPageStateExample.pageNumber - 1;
      }
    }
    this.getProducts();
  }

  public async getGithubProduct() {
    return this.clientApi.portalClient.getProductApi().search({packageCode: 'github.github'}, 1, 1).then((pagedResults:PagedResults<ProductExtended>) => {
      return pagedResults.items[0];
    });
  }

  public async getConnections() {
    // don't bother unless we have a githubProduct
    if (this.githubProduct) {
      this.loading = true;

      // find list of Module ids that use Github Product
      const moduleIds = await this.clientApi.storeClient.getModuleApi().search({products: [this.githubProduct.id]}, 1, 50, null).then((pagedResults:PagedResults<ModuleSearch>) => {
        return pagedResults.items.map(el => el.id);
      });

      // next use hubClient Connection API search to find Connections that use the Github Module
      /* 
      SearchConnectionBody {
          'name'?: string;
          'description'?: string;
          'statuses'?: Array<ConnectionOperationalStatusDef>;
          'orgs'?: Array<UUID>;
          'nodes'?: Array<UUID>;
          'boundaryIds'?: Array<UUID>;
          'boundaries'?: Array<UUID>;
          'products'?: Array<UUID>;
          'modules'?: Array<UUID>; <--- we'll use this one to find Connections that use the Github module 
      */
      const searchConnectionBody: SearchConnectionBody = {
        modules: moduleIds,
      };
      this.clientApi.hubClient.getConnectionApi().search(searchConnectionBody, 1, 50, null).then((pagedResults:PagedResults<ConnectionListView>) => {
        this.connections = pagedResults.items.length > 0 ? pagedResults.items : [];
      }).finally(() => {
        this.loading = false;
      });
    }
  }

  public getConnectionScopes() {
    this.loading = true;
    /* 
    SearchScopeBody {
        'name'?: string;
        'description'?: string;
        'statuses'?: Array<ConnectionOperationalStatusDef>;
        'adminStatuses'?: Array<AdminStatusDef>;
        'connections'?: Array<UUID>;                <--- this is our property for this search call
        'boundaries'?: Array<UUID>;
        'deployments'?: Array<UUID>;
        'nodes'?: Array<UUID>;
        'orgs'?: Array<UUID>;
        'modules'?: Array<UUID>;

    SortObject {
        'active'?: string; // column name
        'direction'?: string; // asc, desc
    */

    const searchScopeBody: SearchScopeBody = {
      connections: [this.selectedConnection.id],
    };
    
    this.clientApi.hubClient.getScopeApi().search(searchScopeBody, 1, 50, new SortObject('name', 'asc')).then((pagedResults:PagedResults<ScopeListView>) => {
      this.scopes = pagedResults.items.length > 0 ? pagedResults.items : [];
      if (this.scopes.length === 1) {
        // if only one scope go ahead and select it by setting value of `scope` formControl
        this.formGroup.get('scope').setValue(this.scopes[0]);
      } else {
        this.loading = false;
      }
    })
  }

  public async getGithubOrgs() {
    this.loading = true;
    this.githubClient = newGithub(); // type GithubClient
    const hubConnectionProfile = {
      server: getZerobiasClientUrl('hub', this.environment.isLocalDev),
      targetId: this.clientApi.toUUID(this.selectedScope.id)  // <--- connection ID if one scope OR scope ID if multi-scope
    }
    // console.log('hubConnectionProfile: ',hubConnectionProfile);

    // get GITHUB orgs
    this.githubClient.connect(hubConnectionProfile).then(async () => {
      
      await this.githubClient.getOrganizationApi().listMyOrganizations(1,5).then((pagedResults: PagedResults<Organization>) => {
        this.githubOrgs = pagedResults.items.length > 0 ? pagedResults.items : [];
        // console.log('github orgs', pagedResults.items);
      }).finally(() => {
        this.loading = false;
      });
    });
  }

  public onLogoutClick() {
    const logoutUrl = this.getLogoutUrl();
    location.href = logoutUrl;
  }

  public getLogoutUrl() {
    if( this.environment.isLocalDev ) {
      return 'http://'+location.host+'/api/dana/api/v2/me/session/logout';
    } else {
      return 'https://'+location.host+'/api/dana/api/v2/me/session/logout';
    }
  }

  public addKvPair() {
    if (this.kvFormGroup.valid) {
      const value = JSON.parse(this.kvFormGroup.get('value').value);
      const pkv: PKV = {
        key: this.kvFormGroup.get('key').value,
        value: value
      }
      this.clientApi.danaClient.getPkvApi().upsertPrincipalKeyValue(null,pkv).then((pkv:PKV) => {
        console.log('pkv created: ',PKV);
        // reset form
        this.kvFormGroup.get('key').setValue('', {emitEvent: false});
        this.kvFormGroup.get('value').setValue('', {emitEvent: false});
        this.listPkvs();
      });
    }
  }

  public listPkvs() {
    /* 
      [
        {
          "key": "string",
          "value": {
            "additionalProp1": {}
          }
        }
      ]
    */
    this.clientApi.danaClient.getPkvApi().listPrincipalKeyValues(null, this.pkvPageToken ? this.pkvPageToken : null, 50).then((pagedResults: PagedResults<PKV>) => {
      if (pagedResults) {
        this.pkvPageToken = pagedResults.pageToken ? pagedResults.pageToken : null;
        this.pagedKvPairs = pagedResults.items;
      }
    });
  }

  public onCopy(field) {
    navigator.clipboard
      .writeText(this[field].value ? this[field].value : '')
      .then(() => {
        this.overlay.message = 'copied to clipboard';
      });
  }

  public getCurrentOrgId() {
    return this.orgIdService.getCurrentOrgId();
  }

  private async createApiKey(inlineObject?: InlineObject): Promise<ApiKey & object> {
    try{
      return await this.clientApi.danaClient.getMeApi().createApiKey(inlineObject)
    } catch(error) {
      console.warn(error);
      this.overlay.message = `The generation of the new API Key failed. Please contact Support.`;
    }
  }
  
  private listRepositories() {
    /* 
      githubClient.getOrganizationApi().listRepositories(
        organizationName: string, 
        type?: OrganizationApi.TypeEnumDef, 
        sort?: OrganizationApi.SortEnumDef, 
        direction?: OrganizationApi.DirectionEnumDef, 
        pageNumber?: number, 
        pageSize?: number
      ) 
    */
    this.loading = true;
    this.githubClient.getOrganizationApi().listRepositories(
      this.selectedGithubOrg?.name,
      OrganizationApi.TypeEnum.All,
      OrganizationApi.SortEnum.FullName,
      OrganizationApi.DirectionEnum.Asc,
      1,
      25
    ).then((pagedResults: PagedResults<Repository>) => {
      this.githubRepos = pagedResults.items.length > 0 ? pagedResults.items : [];
      // console.log('repos', pagedResults.items);
    }).finally(() => {
      this.loading = false;
    });
  }

  private minutesToDuration(minutes:number) {
    return `PT${minutes}M`;
  }

  private async createSharedSessionKey(expiration?: Duration): Promise<SharedSessionKey> {
    const createSharedSessionKeyBody: CreateSharedSessionKeyBody = {};
    createSharedSessionKeyBody.expiration  = expiration ? expiration : new Duration('PT1440M'); // 24 hr default
    try{
      return await this.clientApi.danaClient.getMeApi().createSharedSessionKey(createSharedSessionKeyBody);
    } catch(error) {
      console.warn(error);
      this.overlay.message = 'Failed to create Shared Session Key';
    }
  }

}
