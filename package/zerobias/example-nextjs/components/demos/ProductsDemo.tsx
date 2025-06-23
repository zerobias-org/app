"use client"
import Image from "next/image";
import { useEffect, useState } from "react";
import ZerobiasAppService from "@/lib/zerobias";
import { useCurrentUser } from '@/context/CurrentUserContext';
import { ProductProps } from "@/lib/types";

const ProductsDemo = () => {
  const { user, org, loading } = useCurrentUser();
  const [state, setState] = useState<ProductProps>({
    products: [],
    currentPage: 1,
    pageSize: 5,
    loading: true
  })

  const ProductsTable = () => {
    if (loading || state.loading) {
      return (<tr><td colSpan={5}>loading</td></tr>);
    } else if(state.products?.length === 0) {
      return (<tr><td colSpan={5}>products not loaded</td></tr>);
    } else {
      const content = state.products?.map((product, idx) => (
        <tr key={idx} className="product-item">
          <td className="product-logo">
            <Image width="50" src={ product.logo ? product.logo.toString() : '' } alt={ product.name } height="30" />
          </td>
          <td className="product-name">{ product.name }</td>
          <td className="product-description">{ product.description }</td>
          <td className="product-packageCode">{ product.packageCode }</td>
          <td className="product-status">{ product.status.toString() }</td>
        </tr>
      ))
      return content
    }
  }

  useEffect(() => {

    const getPlatform = async () => {
      try {
        const instance:ZerobiasAppService = await ZerobiasAppService.getInstance();
        if (instance) {
          await instance.zerobiasClientApi.portalClient.getProductApi().search({}, state.currentPage, state.pageSize, undefined).then((productResult) => {
            setState(state => ({ ...state, products: productResult.items, loading: false }));
          });
        };
      } catch (error:any) {
        console.log(error.message)
        console.log(error.stack)
      } 
    }
    
    getPlatform()
  }, [state.currentPage])
  return (

        <div className="container">

            <div className="demo-item flex flex-col">
              <h2>Catalog Products Example</h2>
              <p>This example calls the ZeroBias Catalog API <code>clientApi.portalClient.getProductApi().search()</code> endpoint to get a list of 5 products from the ZeroBias Catalog</p>
              
              <table className="table">
                <thead>
                <tr className="product-item">
                  <th>Logo</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Package Code</th>
                  <th>Status</th>
                </tr>
                </thead>
                <tbody>
                  {ProductsTable()}
                </tbody>
              </table>
        
        </div>
      </div>

  )
}

export default ProductsDemo
