"use client"
import Image from "next/image";
import { useEffect, useState } from "react";
import { ProductExtended } from '@auditmation/module-auditmation-auditmation-portal';

//import Cookies from "js-cookie"
import ZerobiasAppService from "@/lib/zerobias";
import MainMenu from "@/components/ui/mainMenu";

interface ProductProps {
  products: ProductExtended[]
  currentPage: number
  pageSize: number
  loading: boolean
}

const Products = () => {
  const [state, setState] = useState<ProductProps>({
    products: [],
    currentPage: 1,
    pageSize: 4,
    loading: true
  })


  const getPlatform = async () => {
    try {
      const zbService = await ZerobiasAppService.getInstance();
      console.log(state.currentPage)
      const productResult = await zbService.getProducts(state.currentPage, state.pageSize)
      setState({ ...state, products: productResult, loading: false })
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    getPlatform()
  }, [state.currentPage])
  return (
    <div className="container">
      <MainMenu />

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
              {
                state.products.map((product, idx) => (
                  <tr key={idx} className="product-item">
                    <td className="product-logo">
                      <Image src="{ product.logo.toString() }" alt="{ product.name }" />
                    </td>
                    <td className="product-name">{ product.name }</td>
                    <td className="product-description">{ product.description }</td>
                    <td className="product-packageCode">{ product.packageCode }</td>
                    <td className="product-status">{ product.status.toString() }</td>
                  </tr>
                ))
              }
            </tbody>
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

export default Products
