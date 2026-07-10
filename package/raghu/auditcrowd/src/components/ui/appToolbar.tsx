import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import MainMenu from "./mainMenu";

export default function AppToolbar() {
  return (
    <div className="toolbar">
      <div className="ac-topbar">
        <Link href={"/"} className="ac-logo">
          <span className="mark">
            <ShieldCheck />
          </span>
          <span>
            <b>Audit</b>
            <span className="grad">Crowd</span>
          </span>
        </Link>

        <span className="spacer" />

        <nav className="ac-nav">
          <Link href={"/"} className="active">Dashboard</Link>
          <Link href={"/"}>Engagements</Link>
          <Link href={"/"}>Trust Center</Link>
        </nav>

        <MainMenu />
      </div>
    </div>
  );
}
