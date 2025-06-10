"use client"

import MainTabs from "@/components/ui/mainTabs";
import CreateApiKeyForm from "@/components/forms/createApiKeyForm";
import AppToolbar from "@/components/ui/appToolbar";

export default function Home() {
  
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
