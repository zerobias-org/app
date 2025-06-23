"use client"
import { X } from 'lucide-react';
import { Suspense } from "react";
import MainTabs from "@/components/ui/mainTabs";
import AppToolbar from "@/components/ui/appToolbar";
import { useCurrentUser } from "@/context/CurrentUserContext";
import CreateApiKeyForm from "@/components/forms/FormCreateApiKey";
import CreateSharedSessionKeyForm from "@/components/forms/FormCreateSharedSecret";


export default function PkvDemoPage() {
  const { action, setAction } = useCurrentUser();

  const onCloseModal = () => {
    // hide modal
    setAction((action:string) => (''));
  }

  return(
    <>
      <AppToolbar/>
      
      <div className="content-wrapper flexColumn gap16 main-tabs-wrapper">
        <MainTabs />
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
          <CreateSharedSessionKeyForm />
        </Suspense>
      </div>
    </>
  )
}
