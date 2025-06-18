"use client"

import AppToolbar from "@/components/ui/appToolbar";
import CreateApiKeyForm from "@/components/forms/FormCreateApiKey";
import CreateSharedSessionKeyForm from "@/components/forms/FormCreateSharedSecret";
import { useCurrentUser } from "@/context/CurrentUserContext";
import { Suspense } from "react";
import { X, ShoppingCart, Blocks, ListCollapse } from 'lucide-react';
import Link from "next/link";

export default function Home() {
  const { user, org, loading, action, setAction } = useCurrentUser();

  const onCloseModal = () => {
    // hide form
    setAction((action:string) => (''));
  }

  return (
    <>
      <AppToolbar/>
      
      <div className="content-wrap">
        <div className="content-wrapper flexColumn gap16 demo-items-wrapper">
          <h2>Demos</h2>

          <div className="demo-item">
            <div className="item-header">
              <Link href={'/products-demo'}><ShoppingCart size={40} /><span className="item-title">Products List Demo</span></Link>
            </div>
            <div className="item-subtitle">
              <p>This example shows the use of our Catalog API <code>zerobiasClientApi.portalClient.getProductApi().search()</code> endpoint to get a list of products from the ZeroBias Catalog.</p>
            </div>
            <div className="item-actions">
              <button className="launch-btn"><Link href={'/products-demo'}><span className="launch">Launch</span></Link></button>
            </div>
          </div>

          <div className="demo-item">
            <div className="item-header">
              <Link href={'/module-demo'}><Blocks size={40} /><span className="item-title">Module Usage Demo</span></Link>
            </div>
            <div className="item-subtitle">
              <p>This example shows the use of our GitHub Module to make calls to retrieve a list of <i>your</i> organization's GitHub Repositories.</p>
            </div>
            <div className="item-actions">
              <button className="launch-btn"><Link href={'/module-demo'}><span className="launch">Launch</span></Link></button>
            </div>
          </div>

          <div className="demo-item">
            <div className="item-header">
              <Link href={'/pkv-demo'}><ListCollapse size={40} /><span className="item-title">PKV Demo</span></Link>
            </div>
            <div className="item-subtitle">
              <p>This example shows the use of our Principal Key-Value API <code>zerobiasClientApi.danaClient.getPkvApi()</code> endpoints to manipulate the storage of key-value pairs</p>
            </div>
            <div className="item-actions">
              <button className="launch-btn"><Link href={'/pkv-demo'}><span className="launch">Launch</span></Link></button>
            </div>
          </div>

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
          <CreateSharedSessionKeyForm />
        </Suspense>
      </div>


    </>
  );

}
