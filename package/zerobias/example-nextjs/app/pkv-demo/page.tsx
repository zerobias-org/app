"use client"
import MainTabs from "@/components/ui/mainTabs";
import AppToolbar from "@/components/ui/appToolbar";
import CreateApiKeyForm from "@/components/forms/FormCreateApiKey";
import CreateSharedSessionKeyForm from "@/components/forms/FormCreateSharedSecret";
import { useCurrentUser } from "@/context/CurrentUserContext";
import { Suspense, useEffect } from "react";
import { X } from 'lucide-react';

import { usePathname } from 'next/navigation'


export default function PkvDemoPage() {

  const pathname = usePathname();
  const { user, org, loading, action, setAction } = useCurrentUser();

  const onCloseModal = () => {
    // hide form
    setAction((action:string) => (''));
  }



  return(
    <>
      <AppToolbar/>
      
      <div className="content-wrap">
        <div className="content-wrapper flexColumn gap16 main-tabs-wrapper">
          <MainTabs />
        </div>
      </div>

      <footer>
      
      </footer>

      <div className={action === 'createApiKey' ? 'modal show-modal' : 'modal'}>
        <span className="close" onClick={onCloseModal}><X/></span>
        <Suspense>
          <CreateApiKeyForm />
        </Suspense>
      </div>

      <div className={action === 'createSharedSessionKey' ? 'modal show-modal' : 'modal'}>
        <span className="close" onClick={onCloseModal}><X/></span>
        <Suspense>
{/*           <CreateSharedSessionKeyForm /> */}
        </Suspense>
      </div>

    
    
    </>
  )



}


