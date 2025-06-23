"use client"
import { JSX, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Select from 'react-select';
import ZerobiasAppService from "@/lib/zerobias";
import { OrgProps, SelectOptionType } from "@/lib/types";
import { getZerobiasClientUrl } from "@auditmation/zb-client-lib-js";
import { ProductExtended } from '@auditmation/module-auditmation-auditmation-portal';
import { ModuleSearch } from '@auditmation/module-auditmation-auditmation-store';
import { useCurrentUser } from "@/context/CurrentUserContext";
import { PagedResults } from "@auditmation/types-core-js";
import { ConnectionListView, ScopeListView, SearchConnectionBody, SearchScopeBody, SortObject } from '@auditmation/module-auditmation-auditmation-hub';
import { GithubClient, newGithub, Organization, OrganizationApi, Repository } from '@auditlogic/module-github-github-client-ts';
import { Loading } from "../Loading";

export default function ModuleDemo() {
  const router = useRouter();
  const { user, org, loading } = useCurrentUser();
  const [currentOrg, setCurrentOrg] = useState<OrgProps|null>(org);
  const [apiErrorMessage, setApiErrorMessage] = useState<JSX.Element>(<></>)
  const [product, setProduct] = useState<ProductExtended>();
  let githubProduct:ProductExtended|null = null;

  const [loadingConnections, setLoadingConnections] = useState(false);
  const [connections, setConnections] = useState<ConnectionListView[]|null>([]);
  const [connection, setConnection] = useState<ConnectionListView|null>(null);
  const [connectionOptions, setConnectionOptions] = useState<SelectOptionType[]>([{value: '', label: 'loading connection options'}]);

  let connectionScopes: ScopeListView[] = [];
  const [loadingScopes, setLoadingScopes] = useState(false);
  const [scope, setScope] = useState<ScopeListView|null>();
  const [scopeOptions, setScopeOptions] = useState<SelectOptionType[]>([{value: '', label: 'loading connection scope options'}]);

  let githubClient:GithubClient|null = null;
  const [loadingGithubOrgs, setLoadingGithubOrgs] = useState(false);
  const [githubOrg, setGithubOrg] = useState<Organization|null>();
  const [githubOrgs, setGithubOrgs] = useState<Organization[]|null>([]);
  const [githubOrgOptions, setGithubOrgOptions] = useState<SelectOptionType[]>([{value: '', label: 'loading GitHub Org options'}]);

  const [loadingGithubRepos, setLoadingGithubRepos] = useState(false);
  const [githubRepos, setGithubRepos] = useState<Repository[]>([]);

  const GithubRepos = () => {
    if (loading || loadingGithubRepos) {
      return (<Loading />);
    } else {
      return (
        <>
          <table className="table repo-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Default Branch</th>
                <th>Last Pushed</th>
              </tr>
            </thead>
            <tbody>
              {

                githubRepos?.map((repo:Repository) => {
                  return (
                    <tr>
                      <td className="repo-name">{ repo.name }</td>
                      <td className="repo-description">{ repo.description }</td>
                      <td className="repo-defaultBranch">{ repo.defaultBranch }</td>
                    </tr>
                  )
                })

              }
            </tbody>
          </table>
        </>
      )
    }
  }


  const ProductSelect = () => {
    if (loading) {
      return (<Loading />);
    } else {
      return (
        <div className="select-wrapper">
          <Select
            placeholder="Select Product..."
            className="product-selector themed-select"
            classNamePrefix="select"
            name="selectProduct"
            isDisabled={true}
            isClearable={false}
            value={{value: product?.id.toString(),label: product?.name}}
            options={[{value: product?.id.toString(),label: product?.name}]}
          />
        </div>
      )
    }
  }

  const ConnectionSelect = () => {
    if (loading) {
      return (<Loading />);
    } else {
      return (
        <div className="select-wrapper">
          <Select
            placeholder="Select Connection..."
            className="connection-selector themed-select"
            classNamePrefix="select"
            name="selectConnection"
            isLoading={loadingConnections}
            isDisabled={connectionOptions?.length === 0}
            onChange={(singleValue) => (onChangeConnection(singleValue))}
            value={[{value: connection?.id.toString(),label: connection?.name}]}
            options={connectionOptions}
          />
        </div>
      )
    }
  }


  const onChangeConnection = async (item:any) => {
    console.log('connection change triggered', item);
    if (item?.value) {
      // not blank
      const found = connections?.find((el:ConnectionListView) => {
        return el.id.toString() === item.value;
      });
      console.log('found connection? ',found);
      if (found) {
        setConnection(connection => (found));
        getConnectionScopes(found);
      }
    } else {
      setConnection(connection => (null));
      setScope(scope => (null));
      setGithubOrg(githubOrg => (null));
    }
  }

  const ScopeSelect = () => {
    if (loading) {
      return (<Loading />);
    } else {
      return (
        <div className="select-wrapper">
          <Select
            placeholder="Select Scope..."
            className="scope-selector themed-select"
            classNamePrefix="select"
            name="selectScope"
            isLoading={loadingScopes}
            isDisabled={scopeOptions?.length === 0 || !scopeOptions}
            onChange={(singleValue) => (onChangeScope(singleValue))}
            value={[{value: scope?.id.toString(),label: scope?.name}]}
            options={scopeOptions}
          />
        </div>
      )
    }
  }

  const onChangeScope = async (item:any) => {
    console.log('scope change triggered', item);
    if (item?.value) {
      // not blank
      const found = connectionScopes.find((el:ScopeListView) => {
        return el.id.toString() === item.value;
      });
      if (found) {
        setScope((found) => (found));
        getGithubOrgs(found);
      }
    } else {
      //
      setScope(scope => (null));
      setGithubOrg(githubOrg => (null));
    }
  }


  const GithubOrgSelect = () => {
    if (loading) {
      return (<Loading />);
    } else {
      return (
        <div className="select-wrapper">
          <Select
            placeholder="Select GitHub Org..."
            className="github-org-selector themed-select"
            classNamePrefix="select"
            name="selectGithubOrg"
            isLoading={loadingGithubOrgs}
            isDisabled={githubOrgOptions.length === 0}
            onChange={(singleValue) => (onChangeGithubOrg(singleValue))}
            value={[{value: githubOrg?.id.toString(),label: githubOrg?.name}]}
            options={githubOrgOptions}
          />
        </div>
      )
    }
  }

  const onChangeGithubOrg = async (item:any) => {
    console.log('githubOrg change triggered', item);
    if (item?.value) {
      console.log('githubOrg item: ',item);
      // not blank
      const found = githubOrgs?.find((el:Organization) => {
        return el.id.toString() === item.value;
      });
      console.log('found githubOrg? ', found);
      if (found) {
        setGithubOrg(githubOrg => (found));
        getRepositories(found);
      }
    }
  }

  const getRepositories = async (org: Organization) => {
    try {
      setLoadingGithubRepos(loadingGithubRepos => (true));
      const instance = await ZerobiasAppService.getInstance();

      if (instance) {
        githubClient = newGithub(); // type GithubClient
        const hubConnectionProfile = {
          // path?: string, isApiURL?: boolean, isLocalDev?: boolean, directToDev?: boolean
          server: getZerobiasClientUrl('hub', true, instance.environment.isLocalDev),
          targetId: instance.zerobiasClientApi.toUUID(scope?.id)  // <--- connection ID if one scope OR scope ID if multi-scope
        }

        // get GITHUB orgs
        githubClient.connect(hubConnectionProfile).then(async () => {
          await githubClient?.getOrganizationApi().listRepositories(
            org.name,
            OrganizationApi.TypeEnum.All,
            OrganizationApi.SortEnum.FullName,
            OrganizationApi.DirectionEnum.Asc,
            1,
            25
          ).then((pagedResults: PagedResults<Repository>) => {
            const repos = pagedResults.items.length > 0 ? pagedResults.items : [];
            setGithubRepos(githubRepos => (repos));
            console.log('repos', pagedResults.items);
          }).finally(() => {
            setLoadingGithubRepos(loadingGithubRepos => (false));
          });
        });
      }
    } catch(error:any) {
      console.log('error getting repos: ',error);
      setApiErrorMessage(() => (<><p className="warn">error getting repos: </p><pre>{error.message}</pre></>));
    }
  }

  const getGithubOrgs = async (scope:ScopeListView) => {

    try {
      setLoadingGithubOrgs(loadingGithubOrgs => (true));
      const instance = await ZerobiasAppService.getInstance();

      if (instance) {
        githubClient = newGithub(); // type GithubClient
        const hubConnectionProfile = {
          // path?: string, isApiURL?: boolean, isLocalDev?: boolean, directToDev?: boolean
          server: getZerobiasClientUrl('hub', true, instance.environment.isLocalDev),
          targetId: instance.zerobiasClientApi.toUUID(scope.id)  // <--- connection ID if one scope OR scope ID if multi-scope
        }

        try {
          // get GITHUB orgs
          await githubClient.connect(hubConnectionProfile).then(async () => {
            try {
              await githubClient?.getOrganizationApi().listMyOrganizations(1,5).then((pagedResults: PagedResults<Organization>) => {
                const githubOrgItems = pagedResults.items.length > 0 ? pagedResults.items : [];
                // console.log('githubOrgItems: ',githubOrgItems);
                setGithubOrgs(githubOrgs => (githubOrgItems));
                
                const options = [{value:'',label: 'Select Github Organization'}];

                githubOrgItems.forEach(el => {
                  options.push({value: el.id.toString(), label: el.name});
                });
                // console.log('githubOrg options: ',options);

                setGithubOrgOptions(githubOrgOptions => (options));
              }).finally(() => {
                setLoadingGithubOrgs(loadingGithubOrgs => (false));
              });
            } catch(e:any) {
              console.log('error listing Github Orgs: ',e);
              setApiErrorMessage(() => (<><p className="warn">error listing Github Orgs: </p><pre>{e.message}</pre></>));
            } finally {
              setLoadingGithubOrgs(loadingGithubOrgs => (false));
            }
          });
        } catch(err:any) {
          console.log('error connecting githubClient: ',err);
          setApiErrorMessage(() => (<><p className="warn">error connecting githubClient: </p><pre>{err.message}</pre></>));
        } finally {
          setLoadingGithubOrgs(loadingGithubOrgs => (false));
        }
      }
    } catch(error:any) {
      console.log('error getting zerobias instance: ',error);
      setApiErrorMessage(() => (<><p className="warn">error getting zerobias instance: </p><pre>{error.message}</pre></>));
    } finally {
      setLoadingGithubOrgs(loadingGithubOrgs => (false));
    }
  }

  const getConnectionScopes = async (connection:ConnectionListView) => {
    try {
      setLoadingScopes(loadingScopes => (true));
      const instance = await ZerobiasAppService.getInstance();

      if (instance) {

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

        if (connection) {
          const searchScopeBody: SearchScopeBody = {
            connections: [connection.id],
          };

          instance.zerobiasClientApi
            .hubClient
            .getScopeApi()
            .search(searchScopeBody, 1, 50, new SortObject('name', 'asc'))
            .then((pagedResults:PagedResults<ScopeListView>) => {
              connectionScopes = pagedResults.items.length > 0 ? pagedResults.items : [];
              const scopeItems = [{value: '', label: 'Select Connection Scope'}];

              if (connectionScopes.length === 1) {

                // if only one scope go ahead and select it by setting value of `scope` formControl
                const scopeItem:ScopeListView = connectionScopes[0];
                scopeItems.push({value: scopeItem.id.toString(), label: scopeItem.name});
                setScope(scope => (scopeItem));

                // go ahead and make next call
                getGithubOrgs(scopeItem);

              } else if (connectionScopes.length > 1) {
                connectionScopes.forEach(el => {
                  scopeItems.push({value: el.id.toString(), label: el.name});
                });
              }

              setScopeOptions(scopeOptions => (scopeItems));
              setLoadingScopes(loadingScopes => (false));
            })
        }
      }

    } catch(error:any) {
      console.log('error getting connection scopes: ',error);
      setApiErrorMessage(() => (<><p className="warn">error getting connection scopes: </p><pre>{error.message}</pre></>));
    }
    
  }

  const getConnections = async () => {
    setLoadingConnections((loadingConnections) => (true));
    
    const gitHubProductItem = product ? product : githubProduct;
    if (!gitHubProductItem) { 
      setLoadingConnections((loadingConnections) => (false));
      return; 
    }

    try {

      const instance = await ZerobiasAppService.getInstance();

      if (instance) {
        const moduleIds = await instance.zerobiasClientApi
          .storeClient
          .getModuleApi()
          .search({products: [gitHubProductItem.id]}, 1, 50).then((pagedResults:PagedResults<ModuleSearch>) => {
            return pagedResults.items.map(el => el.id);
          });

        console.log('moduleIds: ',moduleIds);

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

        instance.zerobiasClientApi
          .hubClient
          .getConnectionApi()
          .search(searchConnectionBody, 1, 50)
          .then((pagedResults:PagedResults<ConnectionListView>) => {
            const items:ConnectionListView[] = pagedResults.items.length > 0 ? pagedResults.items : [];
            const options = [{value: '', label: 'Select a Connection'}];
            setConnections(connections => (items));
            if (items && items.length > 0) {
              items?.forEach(el => {
                options.push({value: el.id.toString(), label: el.name});
              });

              setConnectionOptions((connectionOptions) => (options));
            } else {
              setConnectionOptions((connectionOptions) => ([{value: '', label: 'No Connections were found.'}]))
              setApiErrorMessage(() => (<><p className="warn">No Connections were found</p></>));
            }
        }).finally(() => {
          setLoadingConnections((loadingConnections) => (false));
        });

      }
    } catch(error:any) {
      console.log('error listing connections: ',error);
      setApiErrorMessage(() => (<><p className="warn">error listing connections: </p><pre>{error.message}</pre></>));
    }

    
  }

  const getPlatform = async () => {

    try {
      const instance = await ZerobiasAppService.getInstance();

      if (instance) {
        // get the Github product
        if (!product) {
          await instance.zerobiasClientApi.portalClient.getProductApi()
            .search({packageCode: 'github.github'}, 1, 1)
            .then(async (pagedResults:PagedResults<ProductExtended>) => {
              if (pagedResults.items?.length > 0) {
                const gitHubProductItem:ProductExtended = pagedResults.items[0];
                if (gitHubProductItem) {
                  setProduct((product) => (gitHubProductItem));
                  githubProduct = gitHubProductItem;

                  // now get connections using this product
                  // first, find list of Module ids that use Github Product
                  await getConnections();
                }
              }
            });
          }
      };

    } catch (error) {
      console.error(error)
    }

  }

  const resetSelects = () => {
    setConnections((connections) => ([]));
    setConnection((connection) => (null));
    setConnectionOptions(() => ([{value: '', label: 'loading connection options'}]));
    setScope((scope) => (null));
    setScopeOptions((scopeOptions) => ([{value: '', label: 'loading connection scope options'}]));
    setGithubOrg((githubOrg) => (null));
    setGithubOrgs((githubOrgs) => ([]));
    setGithubOrgOptions((githubOrgOptions) => ([{value: '', label: 'loading GitHub Org options'}]));
    setGithubRepos((githubRepos) => ([]));
    setApiErrorMessage((apiErrorMessage) => (<></>));
  }


  useEffect(() => {

    const checkIfOrgChanged = async () => {
      if (org && currentOrg && (org.id.toString() !== currentOrg.id.toString())) {
        console.log('org changed...');
        resetSelects();
        await getConnections();
      }
    }

    checkIfOrgChanged();
    getPlatform()
  }, [user, org, loading, product])
  return (
    <div className="demo-item">
      <h2 className="text-3xl font-bold">Module Usage Example</h2>
      <p>This example will use our GitHub Module to make calls to retrieve a list of your organization's GitHub Repositories.</p>

      <div className="dual-container">
        <div className="container-left">

          { /*<!-- Select ZeroBias Organization -->*/ }
          <section>
            <h3>
              Selected ZeroBias Platform Organization: <br />
              { org?.name }
            </h3>
          </section>

          { /*<!-- Select Product: Github -->*/ }
          <section className="flexCol">
            <h3>Select Product </h3>
            { ProductSelect() }
          </section>

          { /*<!-- Select Connection -->*/ }

          <section>
            <h3>Select Connection <span>({`${connections && connections?.length > 0 ? connections.length : 0}`})</span></h3>
            { ConnectionSelect() }
          </section>

          { /*<!-- Select Connection Scope if applicable -->*/ }
          <section>
            <h3>Select Scope <span>({`${connectionScopes && connectionScopes?.length > 0 ? connectionScopes.length : 0}`})</span></h3>
            { ScopeSelect() }
          </section>
          { /*<!-- Select Select Github Org -->*/ }

          <section>
            <h3>Select Github Org <span>({`${githubOrgs && githubOrgs?.length > 0 ? githubOrgs.length : 0}`})</span></h3>
            { GithubOrgSelect() }
          </section>

        </div>

        <div className="container-right">
          <div className="pb-300">{apiErrorMessage}</div>
        </div>
      </div>
      
      { /*<!-- List Github Repos for Github Org -->*/ }
      <section>
        <h3>List of Repositories for Selected Github Org (limit 25) <span>({`${githubRepos && githubRepos?.length > 0 ? githubRepos.length : 0}`})</span></h3>
        { GithubRepos() }
      </section>

    </div>
  );
}