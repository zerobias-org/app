"use client"
import Link from "next/link";
import { Suspense } from "react";
import { Montserrat } from "next/font/google";
import AppToolbar from "@/components/ui/appToolbar";
import CreateApiKeyForm from "@/components/forms/FormCreateApiKey";
import { ShoppingCart, Blocks, ListCollapse } from 'lucide-react';
import CreateSharedSessionKeyForm from "@/components/forms/FormCreateSharedSecret";
import { useCurrentUser } from "@/context/CurrentUserContext";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});
  
export default function Home() {
  const { action, setAction } = useCurrentUser();

  return (
    <>
      <AppToolbar/>

      <div className="content-wrapper flexColumn gap16 demo-items-wrapper">
        <h2>Demos</h2>

        <div className="demo-items">
          
          <div className="demo-item">
            <div className="item-header">
              <Link href={'/products-demo'}><ShoppingCart size={24} /><span className="item-title">Products List Demo</span></Link>
            </div>
            <div className={`${montserrat.className} item-subtitle`}>
              <p>This example shows the use of our Catalog API <code>zerobiasClientApi.portalClient.getProductApi().search()</code> endpoint to get a list of products from the ZeroBias Catalog.</p>
            </div>
            <div className="item-actions">
              <button className="launch-btn"><Link href={'/products-demo'}><span className="launch">Launch</span></Link></button>
            </div>
          </div>

          <div className="demo-item">
            <div className="item-header">
              <Link href={'/module-demo'}><Blocks size={24} /><span className="item-title">Module Usage Demo</span></Link>
            </div>
            <div className={`${montserrat.className} item-subtitle`}>
              <p>This example shows the use of our GitHub Module to make calls to retrieve a list of <i>your</i> organization's GitHub Repositories.</p>
            </div>
            <div className="item-actions">
              <button className="launch-btn"><Link href={'/module-demo'}><span className="launch">Launch</span></Link></button>
            </div>
          </div>

          <div className="demo-item">
            <div className="item-header">
              <Link href={'/pkv-demo'}><ListCollapse size={24} /><span className="item-title">PKV Demo</span></Link>
            </div>
            <div className={`${montserrat.className} item-subtitle`}>
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

      <div className={`modal ${action === 'createApiKey' ? 'show-modal' : ''}`}>
        <Suspense>
          <CreateApiKeyForm />
        </Suspense>
      </div>

      <div className={`modal ${action === 'createSharedSessionKey' ? 'show-modal' : ''}`}>
        <Suspense>
          <CreateSharedSessionKeyForm />
        </Suspense>
      </div>

    </>
  )

}
