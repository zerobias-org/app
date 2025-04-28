"use client"
import { useEffect, useState } from "react";
import { ProductExtended } from '@auditmation/module-auditmation-auditmation-portal';
import {
  Pagination,
  PaginationContent,

  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
//import Cookies from "js-cookie"
import ZerobiasApiServices from "@/lib/zerobias";


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
    loading: false
  })


  const getPlatafom = async () => {
    try {

      const zbService = ZerobiasApiServices.instance
      console.log(state.currentPage)
      const productResult = await zbService.getProducts(state.currentPage, state.pageSize)
      setState({ ...state, products: productResult, loading: false })

      await zbService.getFinding()
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    //Cookies.set('dana-org-id', "a85cb8c3-b841-5e01-9ed6-f1fd669c94ef")
    getPlatafom()
  }, [state.currentPage])
  return (
    <div className="container flex flex-col">
      <div className="grid grid-cols-4 mt-4 gap-4">
        {
          state.products.map((item, idx) => (
            <Card key={idx} >
              <CardHeader>
                <img className="w-40 h-36" alt="" src={item.logo?.href} />
              </CardHeader>
              <CardContent className="w">
                <CardTitle>{item.name}</CardTitle>
                <div>
                  {item.description}
                </div>
                <div>{item.status.toString()}</div>
              </CardContent>
            </Card>
          ))
        }

      </div>
      <Pagination>
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
      </Pagination>
    </div>
  )
}

export default Products
