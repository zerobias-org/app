"use client"

import MainTabs from "@/components/ui/mainTabs";
import CreateApiKeyForm from "@/components/forms/createApiKeyForm";
import AppToolbar from "@/components/ui/appToolbar";
import { useCurrentUser } from "@/context/CurrentUserContext";

export default function Home() {
  const { user, org, loading } = useCurrentUser();

  if (!loading && !user) {
    console.log('PEBCAK');
  }
    return (
      <>
          <AppToolbar/>
          
          <CreateApiKeyForm />

          <div className="content-wrap">
            <div className="content-wrapper flex-column gap16 main-tabs-wrapper">
              <MainTabs />
            </div>
          </div>

        <footer>
        
        </footer>
      </>
    );

}
