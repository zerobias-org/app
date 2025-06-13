"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import { useCurrentUser } from '@/context/CurrentUserContext';
import { OrgOption } from '@/lib/types';
import ZerobiasAppService from "@/lib/zerobias";
import { PagedResults } from "@auditmation/types-core-js";
import { Org } from '@auditmation/module-auditmation-auditmation-dana';


export default function MainMenu() {
  // console.log('loading MainMenu');
  const router = useRouter();
  const { user, org, loading, action, setOrg, setAction } = useCurrentUser();
  const [selectedOrg, setSelectedOrg] = useState<Org>();
  const [orgs, setOrgs] = useState<Org[] | null>([]);
  const [menuActive, setMenuActive] = useState(false);
  const [apiEnabled, setApiEnabled] = useState(false);

  const [orgOptions, setOrgOptions] = useState<OrgOption[]>([{
      value: '', 
      label: 'loading'
    }]);

/*   const handleChange = (event) => {
    const value = event.target.value
    subFunc(value)
  }
 */

  const showApiKeyForm = () => {
    setAction((action:string) => ('createApiKey'));
    console.log('showApiKeyForm action: ',action);
    setMenuActive((menuActive) => (false));
  }

  const toggleSharedSessionKeyForm = () => {
    // show hide api key form
  }

  const onLogoutClick = async () => {
    try {
      const instance = await ZerobiasAppService.getInstance();
      if (instance) {
        await instance
        .zerobiasClientApi
        .danaClient
        .getMeApi()
        .logout();
      }
    } catch(error:any) {
      console.log('error message: ',error.message);
      console.log('error stack: ',error.stack);
    }
/*   
    zbService.zerobiasClientApi.danaClient
      ?.getMeApi()
      .logoutGet()
      .then((data) => {
        console.log("logout")
        console.log(data);
        console.log("******")
      });
      */
  } 

  const onOrgChange = async (option:any) => {
    console.log('changed: ',option);
    const found = orgs?.find(el => option.value === el.id.toString());
    if (found) {
      setSelectedOrg(selectedOrg => (found));
      setOrg((org:any) => (selectedOrg))
    }

    const instance = await ZerobiasAppService.getInstance();
    if (instance) {
      instance.zerobiasClientApp.selectOrg(found);
    }
  }

  const orgSelect = () => {
    if (loading) {
      return ('loading...');
    } else {
      return (
        <div suppressHydrationWarning>
          <Select
            placeholder="Select Organization..."
            className="org-selector"
            classNamePrefix="select"
            name="selectOrg"
            value={{value:org?.id.toString(),label:org?.name}}
            onChange={(e) => onOrgChange(e)}
            options={orgOptions}
          />
        </div>
      )
    }

  }

  useEffect(() => {

    const getPlatform = async () => {
      try {

        const instance = await ZerobiasAppService.getInstance();

        if (instance) {
          setApiEnabled(apiEnabled => (instance.enable));

          try {
            await instance
            .zerobiasClientApi
            .danaClient
            ?.getOrgApi()
            .listOrgs()
            .then((pagedResults: PagedResults<Org>) => {
              if (pagedResults?.items?.length > 0) {
                setOrgs(orgs => (pagedResults.items));
              
                const options:OrgOption[] = pagedResults.items.map((item: Org) => {
                  return { value: item.id.toString(), label: item.name };
                }); 
                setOrgOptions(orgOptions => (options));
            
              }
              
            });

          } catch(error) {
            console.warn('orgs warning: ',error);
          }

        }

      } catch(error) {
        console.error('Failed to get orgs: ', error);
      }
    };

    getPlatform();
  }, []);


  const BuildMenu = () => {
      return (

        <div className="auditmation-user">
          <div className={menuActive ? 'auditmation-user-tooltip active' : 'auditmation-user-tooltip'}>


            <div className="top-summary menu-toggle" onClick={() => { setMenuActive(!menuActive) }}>
              <div className="org-user">
                <h3 className="username">{ user?.name }</h3>
                <h4 className="orgname">{ org?.name }</h4>
              </div>
              <div className="user-avatar">
                <div className="auditmation-avatar medium default">

                    <div className="avatar-wrapper">
                      <div className="avatar-initials">
                        {user?.name ? user.name.charAt(0).toUpperCase() : ''}
                      </div>
                    </div>
                  
                </div>
              </div>
            </div>
            <div className="tooltiptext" onClick={() => {}}>
          
              <div className="menu-open-panel">

                <div className="main-org-user">
                  <div className="avatar-wrapper x-large">

                      <div className="avatar-initials">
                        {user?.name ? user?.name.charAt(0) : ''}
                      </div>

                  </div>

                  <div className="user-info">
                    <span className="user-name">{user?.name}</span>
                    <span className="user-email secondary-text"> {user?.emails[0]} </span>
                  </div>
                </div>


                <div className="main-menu flexColumn" >
                  <hr className="small" />
                  <div className="menu-item">

                    <div className="nf-organization-switcher">
                      {orgSelect()}
                    </div>

                  </div>
                  <hr className="small" />
                  <span className="menu-item clickable" onClick={() => showApiKeyForm()}>Create New API Key</span>
                  <span className="menu-item clickable" onClick={() => toggleSharedSessionKeyForm()}>Share Session</span>
                  <span className="menu-item clickable" onClick={() => onLogoutClick()}>Sign Out</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      )
    }



  return BuildMenu()

}
