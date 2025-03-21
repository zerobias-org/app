import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ZerobiasClientApiService } from '@auditmation/ngx-zb-client-lib';
import { PagedResults } from '@auditmation/types-core-js';
import { ProductExtended } from '@auditmation/module-auditmation-auditmation-portal';
import { ConnectionListView, SearchConnectionBody } from '@auditmation/module-auditmation-auditmation-hub';
import { Org } from '@auditmation/module-auditmation-auditmation-dana';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {

  public products: ProductExtended[] = [];
  public githubProduct: ProductExtended;
  public connections: ConnectionListView[] = [];
  public currentOrg: Org;

  constructor(
    protected clientApi: ZerobiasClientApiService
  ) {}

  public ngOnInit(): void {
    this.getProducts();
  }

  public getCurrentOrg() {
    // from user/org switcher
    // this.currentOrg
  }


  /* 
  1.  catalog example:  box list of 5 products w/ logo  <--- make API calls to US
  2.  module example:   box, <--- make API calls to modules
    select org - already have org <--- the org is already set here; or do I give them a subset of orgs that the user belongs to?
    select connection (github) to get target <--- hubClient.getConnectionApi().search
    select scope <-- set to default scope
    params: as needed (org)
    call list repository on connection
    show list of repos

    auditlogic module
  */
    
  public getProducts() {
    this.clientApi.portalClient.getProductApi().search({}, 1, 5, null).then((pagedResults:PagedResults<ProductExtended>) => {
      this.products = pagedResults.items;
    });

    this.clientApi.portalClient.getProductApi().search({packageCode:'github.github'}, 1, 1).then((pagedResults:PagedResults<ProductExtended>) => {
      this.githubProduct = pagedResults.items[0];
    });
  }

  public getConnections() {
    if (this.currentOrg) {
      const searchConnectionBody: SearchConnectionBody = {
        products: [this.githubProduct.id],
        // orgs: [this.currentOrg.id]
      };
      /*  
          name'?: string;
          'description'?: string;
          'statuses'?: Array<ConnectionOperationalStatusDef>;
          'orgs'?: Array<UUID>;
          'nodes'?: Array<UUID>;
          'boundaryIds'?: Array<UUID>;
          'boundaries'?: Array<UUID>;
          'products'?: Array<UUID>; <--- github get product to get product Id
          'modules'?: Array<UUID>;
      */
      this.clientApi.hubClient.getConnectionApi().search(searchConnectionBody, 1, 5, null).then((pagedResults:PagedResults<ConnectionListView>) => {
        this.connections = pagedResults.items;
      });
    }
  }

  public connectionChanged() {
    //
  }

}
