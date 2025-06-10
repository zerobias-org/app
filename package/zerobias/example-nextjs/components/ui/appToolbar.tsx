import Image from "next/image";
import MainMenu from "./mainMenu";
import { Suspense } from "react";
import { Loading } from "../Loading";

export default function AppToolbar() {
  return (
    <div className="toolbar">

      <div className="app-bar">
        <Image src="https://cdn.zerobias.com/static/images/zerobias/zerobias_white.svg" alt="ZeroBias" height="28" width="145" />
        <h1>ZeroBias Client API Demo</h1>
        <span className="flexFill"></span>
        <Suspense fallback={<Loading />}>
          <MainMenu/>
        </Suspense>

      </div>
      <div className="zerobias-bar"></div>
    </div>
  )
}