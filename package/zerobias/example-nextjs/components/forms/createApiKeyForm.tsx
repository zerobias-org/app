'use client'
import { useSearchParams } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { createApiKey } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import Form from 'next/form'
import { Suspense, useEffect } from 'react';
import { Loading } from '../Loading';

export default function CreateApiKeyForm() {
  let dialogMessage = '';
  const router = useRouter();
  const formData = new FormData();
  
  const onNameChange = () => {
    return '';
  }

  const onClose = () => {
    // hide form
    router.push('/');
  }
  
  const setupParams = async () => {

    const searchParams = useSearchParams();
    const status = useFormStatus();

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

  }

  const buildFields = async () => {
    const content = formData.get('apiKey') !== '' ? (KeyFields()) : (NameField());
    return (
      <Suspense fallback={<Loading />}>
        {content}
      </Suspense>
    )

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

  useEffect(() => {
    setupParams(), []
  });

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
