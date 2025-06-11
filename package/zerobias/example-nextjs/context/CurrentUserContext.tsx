"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import ZerobiasAppService from '@/lib/zerobias'
import { UserProps, OrgProps } from '@/lib/types';
import { Loading } from '@/components/Loading';
import { useRouter } from 'next/navigation';
import { environment } from '@/lib/zerobias';

type CurrentUserContextType = {
  user: UserProps | null;
  org: OrgProps | null;
  loading: boolean;
};

export const CurrentUserContext = createContext<CurrentUserContextType>({
  user: null,
  org: null,
  loading: true,
});

export const useCurrentUser = () => useContext(CurrentUserContext);

export const CurrentUserProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserProps | null>(null);
  const [org, setOrg] = useState<OrgProps | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getPlatform = async () => {
      setLoading(loading => (true));
      try {
        const instance:ZerobiasAppService = await ZerobiasAppService.getInstance();
        if (instance) {
          console.log('currentUserContext getWhoAmI');

          instance
            .zerobiasClientApp
            .getWhoAmI()
            .subscribe((item:any) => {
              if (item) {
                setUser(user => (item as UserProps));
              } else {
                // window.location.href = `https://${environment.apiHostname}/login?next=${environment.localPortalOrigin}`;
//                router.push(`https://${environment.apiHostname}/login?next=${environment.localPortalOrigin}`)
              }
            });

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
        console.error('Failed to fetch user', error);
      } finally {
        setLoading(loading => (false));
      }
    };

    getPlatform();
  }, []);

  
  if (!loading && !user) {
    return (
      <Loading />
    )
  } else {

    return (
      <CurrentUserContext.Provider value={{ user, org, loading }}>
        {children}
      </CurrentUserContext.Provider>
    );
  }
}
