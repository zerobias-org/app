'use server'
import { redirect } from 'next/navigation'

export async function createApiKey(formData: FormData) {
  let apiKey = '';

  if (formData.get('name')) {

    // createApiKey

      if (this.overlay.actionLabel === 'Close') {
        this.onCloseOverlayClick();
      } else {
        this.overlay.actionProcessing = true;
        this.createApiKey(this.apiKeyFormGroup.value).then((key: any) => {
          if (key) {
            this.overlay.actionLabel = 'Close';
            this.overlay.actionButtonColor = 'primary';
            this.overlay.showCancel = false;
            navigator.clipboard.writeText(key.data).then(() => {
              const currentOrgId = this.orgIdService.getCurrentOrgId();
              this.apiKeyKeyForm.setValue(key.data);
              this.orgIdInput.setValue(currentOrgId);
              this.overlay.message = `Your API Key was successfully created, and was copied to your clipboard.`;
            });
          }
        }).finally(() => {
          this.overlay.actionProcessing = false;
        });
      }







    apiKey = '';
  }

  if (apiKey !== '') {
    redirect(`/?key=${apiKey}`)
  }
}

// export async function createSharedSessionKey(formData: FormData) {}