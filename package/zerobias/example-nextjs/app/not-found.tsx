"use client"
import Link from 'next/link'
import { X } from 'lucide-react'
import { Suspense } from 'react'
import AppToolbar from '@/components/ui/appToolbar'
import { useCurrentUser } from '@/context/CurrentUserContext'
import CreateApiKeyForm from '@/components/forms/FormCreateApiKey'
import CreateSharedSessionKeyForm from '@/components/forms/FormCreateSharedSecret'

export default function NotFound() {

  const { user, org, loading, action, setAction } = useCurrentUser();

  const onCloseModal = () => {
    // hide form
    setAction((action:string) => (''));
  }
  
  return(
    <>
      <AppToolbar/>
    
      <div className="content-wrapper flexColumn gap16 content-padding">
        <h2>Not Found</h2>
        <p>Could not find requested resource</p>
        <Link href={'/'}>Return Home</Link>
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
