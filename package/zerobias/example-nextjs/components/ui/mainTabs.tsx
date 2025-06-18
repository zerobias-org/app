"use client"
import { useRouter } from 'next/navigation';
import { JSX, Suspense, useState } from 'react';
import ProductsDemo from '../demos/ProductsDemo';
import ModuleDemo from '../demos/ModuleDemo';
import PkvDemo from '../demos/PKV';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import { usePathname } from 'next/navigation'
import { DemoTabs } from '@/lib/types';
import { Loading } from '../Loading';

export default function MainTabs() {
  const [content, setContent] = useState<JSX.Element>();
  const [selectedTab, setSelectedTab] = useState(0);

  const router = useRouter();
  const pathname = usePathname();
  const pathsArray = pathname.split('/');

  // path tells us which tab we're on, default to PRODUCTS_DEMO
  let path = pathsArray[1] ? pathsArray[1] : DemoTabs.PRODUCTS_DEMO;

  const onTabChange = (ix:number, lastix:number, event:Event) => {
    // react tabs --> onSelect: (index: number, lastIndex: number, event: Event) => ?boolean
    const demoTab = ix === 0 ? DemoTabs.PRODUCTS_DEMO : ix === 1 ? DemoTabs.MODULE_DEMO : DemoTabs.PKV_DEMO;
    router.push(`/${demoTab}`); // navigate to new tab
    // setSelectedTab(ix);
  } 

  // keeping panels empty except for current tab to speed up loading
  const setTabPanels = () => {
    if (content === undefined) { // only if content hasn't been set - anti-loop
      switch(path) {
        case DemoTabs.PRODUCTS_DEMO:
          setSelectedTab(0);
          setContent((content) => (<><TabPanel><ProductsDemo/></TabPanel><TabPanel></TabPanel><TabPanel></TabPanel></>));
          break;
        case DemoTabs.MODULE_DEMO:
          setSelectedTab(1);
          setContent((content) => (<><TabPanel></TabPanel><TabPanel><ModuleDemo/></TabPanel><TabPanel></TabPanel></>));
          break;
        case DemoTabs.PKV_DEMO:
          setSelectedTab(2);
          setContent((content) => (<><TabPanel></TabPanel><TabPanel></TabPanel><TabPanel><PkvDemo/></TabPanel></>));
          break;
      }
    }
  }

  setTabPanels();

  return (

    <Tabs selectedIndex={selectedTab} onSelect={onTabChange}>

      <TabList>
        <Tab>Products Demo</Tab>
        <Tab>Module Demo</Tab>
        <Tab>PKV Demo</Tab>
      </TabList>

      <Suspense fallback={(<Loading />)}>
        {content}
      </Suspense>

    </Tabs>


  )


}