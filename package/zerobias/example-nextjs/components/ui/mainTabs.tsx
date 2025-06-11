"use client"
import { useState } from 'react';
import ProductsDemo from '../demos/ProductsDemo';
import ModuleDemo from '../demos/ModuleDemo';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

export default function MainTabs() {
  // console.log('loading MainTabs');
  const [selectedTab, setSelectedTab] = useState('products');

  const onRadioChange = (tab = 'products') => {
    setSelectedTab(selectedTab => (tab));

  } 

  return (

    <Tabs>
      <TabList>
        <Tab onClick={() => {setSelectedTab(selectedTab => ('products'))}}>Products</Tab>
        <Tab onClick={() => {setSelectedTab(selectedTab => ('module'))}}>Module</Tab>
        <Tab onClick={() => {setSelectedTab(selectedTab => ('pkv'))}}>PKV</Tab>
      </TabList>
      <TabPanel>

          <ProductsDemo />

      </TabPanel>
      <TabPanel>

          <ModuleDemo />

      </TabPanel>
      <TabPanel>Content for Tab 3</TabPanel>
    </Tabs>


    /* 
    <ul className="tabs" role="tablist">
      <li>
          <input type="radio" name="tabs" id="tab-products"  checked={selectedTab === 'products' ? true : false} onChange={() => {onRadioChange('products')}} />
          <label htmlFor="tab-products" 
            role="tab" 
            aria-selected="true" 
            aria-controls="products-tab-panel" 
            tabIndex={0}>Products</label>
          <div id="products-tab-content" 
            className="tab-content" 
            role="tabpanel" 
            aria-labelledby="products" 
            aria-hidden="false">
            <ProductsDemo />
          </div>
      </li>
      <li>
          <input type="radio" name="tabs" id="tab-module" checked={selectedTab === 'module' ? true : false} onChange={() => {onRadioChange('module')}} />
          <label htmlFor="tab-module"
            role="tab" 
            aria-selected="false" 
            aria-controls="module-tab-panel" 
            tabIndex={1}>Module</label>
          <div id="module-tab-content" 
            className="tab-content"
            role="tabpanel" 
            aria-labelledby="module" 
            aria-hidden="true">
            <ModuleDemo />
          </div>
      </li>
    </ul> */
  )


}