"use client"
import Image from "next/image";
import { useEffect, useState } from "react";
import { ProductExtended } from '@auditmation/module-auditmation-auditmation-portal';
import ZerobiasAppService from "@/lib/zerobias";
import { CurrentUserContext, useCurrentUser } from '@/context/CurrentUserContext';

interface ProductProps {
  products: ProductExtended[]
  currentPage: number
  pageSize: number
  loading: boolean
}

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
      return (<tbody><tr><td colSpan={5}>loading</td></tr></tbody>);
    } else if(state.products?.length === 0) {
      return (<tbody><tr><td colSpan={5}>products not loaded</td></tr></tbody>);
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
      return (
        <tbody>{content}</tbody>
      )
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
        // setState(state => ({ ...state, loading: false }));
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

                  {ProductsTable()}

              </table>
        

    {/*       <Pagination>
            <PaginationContent>
              <PaginationItem hidden={state.currentPage == 1 || state.loading}>
                <PaginationPrevious
                  onClick={() => setState({ ...state, loading: true, currentPage: state.currentPage - 1 })} href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">{state.currentPage}</PaginationLink>
              </PaginationItem>
              <PaginationItem hidden={state.loading}>
                <PaginationNext href="#" onClick={() => setState({ ...state, loading: true, currentPage: state.currentPage + 1 })} />
              </PaginationItem>
            </PaginationContent>
          </Pagination> */}
        </div>
      </div>

  )
}

export default ProductsDemo
