'use client'
import { useSearchParams } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { createApiKey } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import Form from 'next/form'

export default function CreateApiKeyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = useFormStatus();

  const formData = new FormData();
  let dialogMessage = '';

  [ 'action', 'name', 'apiKey', 'orgId'].forEach(item => {
    if (searchParams.has(item)) {
      formData.set(item, `${searchParams.get(item)}`);
    } else {
      formData.set(item, '');
    }
  });
  
  if (formData.get('apiKey') !== '') {
    dialogMessage = 'Your API Key was successfully created, and was copied to your clipboard.';
  }

  if (formData.get('action') !== 'createApiKey') {
    return;
  }

  const onNameChange = () => {
    return '';
  }

  const onClose = () => {
    // hide form
    router.push('/');
  }

  const buildFields = () => {
    if (formData.get('apiKey') !== '') {
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
          <input value={`${formData.get('name')}`} onChange={onNameChange} placeholder="" autoComplete="off" />
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

  return (
    <div className="create-api-key-form-wrap">
      <div className="api-key-form">
        { 
          buildFields()
        }
      </div>
    </div>
  )
}
