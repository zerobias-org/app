"use client"

import ZerobiasAppService from '@/lib/zerobias'
import { useEffect, useState } from "react";
import { User } from '@auditmation/module-auditmation-auditmation-dana';


export default function MainMenu() {
  const [user, setUser] = useState<User>()

  let zbService:ZerobiasAppService;

  // let currentOrg: Org = null;
  // let currentUser: ServiceAccount | (object & User) = null;
  // let me: ServiceAccount | (object & User) = null;

  const getPlatform = async () => {
    try {
      zbService = await ZerobiasAppService.getInstance();
      zbService.zerobiasClientApp
      .getWhoAmI()
      .subscribe((item) => {
        if (item) {
          setUser(item as User)
        }
      });
    } catch (error) {
      console.error(error)
    }  

  }

  const toggleApiKeyForm = () => {
    // show hide api key form
  }

  const toggleSharedSessionKeyForm = () => {
    // show hide api key form
  }

  const onLogoutClick = async () => {
    zbService.zerobiasClientApi.danaClient
      ?.getMeApi()
      .logoutGet()
      .then((data) => {
        console.log("logout")
        console.log(data);
        console.log("******")
      });
  
  }

  const BuildMenu = () => {
      useEffect(() => {
        getPlatform()
      })
      return (
        <div className="menu-wrap">
          <div className="current-user-wrap">
            {user?.name}
          </div>
          <div className="current-org-wrap">
            <select name="org-selector">
              <option>org</option>
            </select>
          </div>
          <ul className="main-menu">
            <li>
              <span onClick={() => toggleApiKeyForm()}>Create Api Key</span>
            </li>
            <li>
              <span onClick={() => toggleSharedSessionKeyForm()}>Share Session</span>
            </li>
            <li>
              <span onClick={() => onLogoutClick()}>Logout</span>
            </li>
          </ul>
        </div>
      )
    }



  return BuildMenu();

}