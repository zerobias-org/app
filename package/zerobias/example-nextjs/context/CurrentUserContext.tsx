"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import ZerobiasAppService from '@/lib/zerobias'
import { UserProps, OrgProps } from '@/lib/types';
import { Org } from '@auditmation/module-auditmation-auditmation-dana';

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
  const [user, setUser] = useState<UserProps | null>(null);
  const [org, setOrg] = useState<OrgProps | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getPlatform = async () => {
      setLoading(loading => (true));
      try {
        const instance:ZerobiasAppService = await ZerobiasAppService.getInstance();
        if (instance) {
          instance
            .zerobiasClientApp
            .getWhoAmI()
            .subscribe((item) => {
              if (item) {
                setUser(user => (item as UserProps));
              }
            });

          instance
            .zerobiasClientApp
            .getCurrentOrg()
            .subscribe((item) => {
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

  

  return (
    <CurrentUserContext.Provider value={{ user, org, loading }}>
      {children}
    </CurrentUserContext.Provider>
  );
};
