"use client"
import Image from "next/image";
import { useEffect, useState } from "react";
import { ProductExtended } from '@auditmation/module-auditmation-auditmation-portal';

import ZerobiasAppService from "@/lib/zerobias";
import MainMenu from "@/components/ui/mainMenu";
import CreateApiKeyForm from "@/components/forms/createApiKeyForm";

export default function Page() {






  return (
    <div className="outer-wrap">
      <MainMenu/>

      <CreateApiKeyForm />

    </div>
  )



}
