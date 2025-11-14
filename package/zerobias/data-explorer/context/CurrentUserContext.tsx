"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import ZerobiasAppService from '@/lib/zerobias'
import { UserProps, OrgProps } from '@/lib/types';
import { Loading } from '@/components/Loading';


/**
 * This context wraps every page to provide user, org, loading, action, setOrg, and setAction to all child pages.
 * - user and org will be set by the zerobias api calls
 * - loading shows while user and org and being loaded
 * - action is used to show and hide forms
 * - setOrg can be used in any child component to change the Org in this context which cascades to all children.
 * - setAction can be used in any child component to set or unset an 'action', which we use to show/hide forms
**/
type CurrentUserContextType = {
  user: UserProps | null;
  org: OrgProps | null;
  loading: boolean;
  action: 'createApiKey' | 'createSharedSessionKey' | null;
  setOrg: any,
  setAction: any
};

export const CurrentUserContext = createContext<CurrentUserContextType>({
  user: null,
  org: null,
  loading: true,
  action: null,
  setOrg: ()=>{},
  setAction: ()=>{}
});

// useCurrentUser can be imported into any child component where you might need the context variables
export const useCurrentUser = () => useContext(CurrentUserContext);

export const CurrentUserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProps | null>(null);
  const [org, setOrg] = useState<OrgProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'createApiKey'|'createSharedSessionKey'|null>(null);

  useEffect(() => {
    console.log('CurrentUserContext: useEffect triggered');

    const getPlatform = async () => {
      console.log('CurrentUserContext: Starting getPlatform');
      setLoading(loading => (true));
      try {
        const instance:ZerobiasAppService = await ZerobiasAppService.getInstance();
        console.log('CurrentUserContext: Got ZerobiasAppService instance');
        if (instance) {
          console.log('CurrentUserContext: Subscribing to getWhoAmI');

          // get current user
          instance
            .zerobiasClientApp
            .getWhoAmI()
            .subscribe((item:any) => {
              console.log('CurrentUserContext: getWhoAmI returned:', item ? 'User data' : 'null');
              if (item) {
                setUser(user => (item as UserProps));
              }
            });

          console.log('CurrentUserContext: Subscribing to getCurrentOrg');

          // get current org
          instance
            .zerobiasClientApp
            .getCurrentOrg()
            .subscribe((item:any) => {
              console.log('CurrentUserContext: getCurrentOrg returned:', item ? 'Org data' : 'null');
              if (item) {
                setOrg(org => (item as OrgProps));
              }
            });
        }
      } catch(error) {
        console.error('CurrentUserContext: Failed to fetch User or Org', error);
      } finally {
        console.log('CurrentUserContext: Setting loading to false');
        setLoading(loading => (false));
      }
    };

    getPlatform();
  }, []);

  
  if (loading && !user) {
    return (
      <Loading />
    )
  } else {
    return (
      <CurrentUserContext.Provider value={{ user, org, loading, action, setOrg, setAction }}>
        {children}
      </CurrentUserContext.Provider>
    );
  }
}
