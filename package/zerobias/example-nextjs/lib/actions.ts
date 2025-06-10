'use client'
import { useRouter } from 'next/navigation'
import { ApiKey, InlineObject } from '@auditmation/module-auditmation-auditmation-dana';
import ZerobiasAppService from "@/lib/zerobias";
import { getFutureDate } from './utils';

export async function updateModuleForm(formData: FormData) {

}

export async function createApiKey(formData: FormData) {
  const router = useRouter();

  if (formData.get('action') === 'createApiKey') {

    if (formData.get('name') === '') { return; }

    const zbService = await ZerobiasAppService.getInstance();
    // createApiKey
    const inlineObject: InlineObject = {
      name: `${formData.get('name')}`,
      expiration: getFutureDate(10)
    };

        zbService.createApiKey(inlineObject).then((key: any) => {
          if (key) {
            formData.set('apiKey',key);
            navigator.clipboard.writeText(key.data).then(() => {
/*               const currentOrgId = this.orgIdService.getCurrentOrgId();
              this.apiKeyKeyForm.setValue(key.data);
              this.orgIdInput.setValue(currentOrgId);
              this.overlay.message = `Your API Key was successfully created, and was copied to your clipboard.`; */
            });
          }
        }).finally(() => {
          // this.overlay.actionProcessing = false;
        });


  }
  const paramsObject:any = {};
  for (let key of formData.keys()) {
    paramsObject[key] = formData.get(key);
  }

  if (formData.get('apiKey') !== '') {
    router.push(`/?${JSON.stringify(paramsObject)}`);
  } else {
    router.push(`/`)
  }
}

// export async function createSharedSessionKey(formData: FormData) {}