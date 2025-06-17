import Image from "next/image";
import MainMenu from "./mainMenu";
import Link from "next/link";

export default function AppToolbar() {
  return (
    <div className="toolbar">

      <div className="app-bar">
        <Link href={'/'}><Image src="https://cdn.zerobias.com/static/images/zerobias/zerobias_white.svg" alt="ZeroBias" height="28" width="145" /></Link>
        <h1>ZeroBias Client API Demo</h1>
        <span className="flexFill"></span>

          <MainMenu/>


      </div>
      <div className="zerobias-bar"></div>
    </div>
  )
}