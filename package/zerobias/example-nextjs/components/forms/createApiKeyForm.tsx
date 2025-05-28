'use server'
import { useRouter } from "next/router";
import { createApiKey } from '@/lib/actions';
import Form from 'next/form'

export default async function CreateApiKeyForm() {

  const router = useRouter();
  const { query } = router;
  const action = query.action ? query.action : '';
  const name = query.name ? query.name : '';
  const apiKey = query.apiKey ? query.apiKey : '';
  const orgId = query.orgId ? query.orgId : '';
  
  const formData = new FormData();
  let dialogMessage = '';

  formData.set('action', `${action}`);

  if (name !== '') 
    formData.set('name', `${name}`);

  if (apiKey !== '') {
    formData.set('apiKey', `${apiKey}`);
    dialogMessage = 'Your API Key was successfully created, and was copied to your clipboard.';
  }

  if (orgId !== '') 
    formData.set('orgId', `${orgId}`);

  if (action !== 'createApiKey') {
    return;
  }

  const onClose = () => {
    // hide form
  }

  const hasKey = (key: string): boolean => {
    return key && key !== '' ? true : false;
  }

  const buildFields = () => {
    if (apiKey !== '') {
      return KeyFields();
    } else {
      return NameField();
    }
  }

  const NameField = () => {
    return (
      <Form action={createApiKey}>
        <div className="form-field-wrap">
          <span className="label">API Key Name</span>
          <input value="{formData.name}" placeholder="" autoComplete="off" />
        </div>

        <div className="dialog-message">{ dialogMessage }</div>

        <button type='submit'>Create</button>
      </Form>
    )
  }

  const KeyFields = () => {
    return (

        <Form action="{createApiKey}">
          <div className="form-field-wrap">
            <span className="label">Organization ID</span>
            <input name="orgId" placeholder="" autoComplete="off" readOnly />
          </div>
        
          <div className="form-field-wrap">
            <span className="label">API Key</span>
            <input name="apiKey" placeholder="" autoComplete="off" readOnly />
          </div>

          <div className="dialog-message">{ dialogMessage }</div>

          <button onClick={() => onClose()}>Close</button>
        </Form>

    )
  }

  return buildFields();

}
