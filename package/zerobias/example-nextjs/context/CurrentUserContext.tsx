"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import ZerobiasAppService from '@/lib/zerobias'
import { UserProps, OrgProps } from '@/lib/types';
import { Loading } from '@/components/Loading';
import { useRouter } from 'next/navigation';
/* 
This context wraps every page to provide user, org, loading, action, setOrg, and setAction to all child pages.
*/
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

// useCurrentUser can be imported wherever you need the context variables
export const useCurrentUser = () => useContext(CurrentUserContext);

export const CurrentUserProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserProps | null>(null);
  const [org, setOrg] = useState<OrgProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'createApiKey'|'createSharedSessionKey'|null>(null);

  useEffect(() => {
    const getPlatform = async () => {
      setLoading(loading => (true));
      try {
        const instance:ZerobiasAppService = await ZerobiasAppService.getInstance();
        if (instance) {
          // console.log('currentUserContext --> getWhoAmI');

          // get current user
          instance
            .zerobiasClientApp
            .getWhoAmI()
            .subscribe((item:any) => {
              if (item) {
                setUser(user => (item as UserProps));
              }
            });

          // get current org
          instance
            .zerobiasClientApp
            .getCurrentOrg()
            .subscribe((item:any) => {
              if (item) {
                setOrg(org => (item as OrgProps));
              }
            });
        }
      } catch(error) {
        console.error('Failed to fetch User or Org', error);
      } finally {
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
