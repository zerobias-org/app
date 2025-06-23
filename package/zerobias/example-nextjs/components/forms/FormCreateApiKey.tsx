'use client'

import { X } from 'lucide-react';
import { ActionType } from '@/lib/types';
import { getFutureDate } from '@/lib/utils';
import ZerobiasAppService from '@/lib/zerobias';
import { JSX, useEffect, useState } from 'react';
import { useCurrentUser } from '@/context/CurrentUserContext';
import { ApiKey, InlineObject } from '@auditmation/module-auditmation-auditmation-dana';

export default function CreateApiKeyForm() {
  const [actionButtonLabel, setActionButtonLabel] = useState<'Create'|'Close'>('Create');
  const [content, setContent] = useState<JSX.Element|null>(null);

  const [apiKeyName, setApiKeyName] = useState<string>('');
  const [apiKey, setApiKey] = useState<ApiKey & any|null>(null);
  const [orgId, setOrgId] = useState<string>('');
  const [dialogMessage, setDialogMessage] = useState<JSX.Element|null>();
  
  const { user, org, loading, action, setAction } = useCurrentUser();

  const closeModal = () => {
    // hide modal
    setAction((action:ActionType) => (null));
    resetForm();
  }

  const onCancel = () => {
    closeModal();
  }

  const resetForm = () => {
    setActionButtonLabel((actionButtonLabel) => ('Create'));
    setApiKeyName((apiKeyName) => (''));
    setApiKey((apiKey:any) => (null));
    setOrgId((orgId) => (''));
    setDialogMessage((dialogMessage) => (null));
  }

  const onChangeName = (event:any) => {
    event.preventDefault();
    setApiKeyName((name:string) => (`${event.target.value}`));
  }

  const KeyFields = ():JSX.Element => {

    if (user && org && (apiKeyName === '')) {
      const safeUsername = user.name.replace(' ','_');
      const safeOrgname = org.name.replace(' ','_');
      const safeName = `${safeUsername}_${safeOrgname}_API_Key`;
      // console.log('safeNamae: ',safeName);

      setApiKeyName((apiKeyName) => (safeName));

    }

    if (apiKey !== null) {
      setActionButtonLabel(actionButtonLabel => ('Close'));
      return (
        <form onSubmit={handleSubmit} name="apiKeyForm" className="zb-form show-key-fields">

          <div className="form-body">
            <div className="form-field-wrap name-field">
              <span className="label">API Key Name</span>
              <input defaultValue={apiKeyName} name="name" placeholder="" autoComplete="off" readOnly />
            </div>

            <div className="form-field-wrap key-field">
              <span className="label">Organization ID</span>
              <input defaultValue={orgId} name="orgId" placeholder="" autoComplete="off" readOnly />
            </div>
          
            <div className="form-field-wrap key-field">
              <span className="label">API Key</span>
              <input name="apiKey" defaultValue={apiKey ? apiKey.data : ''} placeholder="" autoComplete="off" readOnly />
            </div>

            <div className={dialogMessage ? "dialog-message show-message" : "dialog-message"}>{ dialogMessage }</div>
          </div>

          <div className="form-actions flexRow">
            <button className="cancel-button" onClick={onCancel}>Cancel</button>
            <button className="submit-button" type="submit">{actionButtonLabel}</button>
          </div>

        </form>
      )
    } else {

      return (
        <form onSubmit={handleSubmit} name="apiKeyForm" className="zb-form">

          <div className="form-body">
            <div className="form-field-wrap name-field">
              <span className="label">API Key Name</span>
              <input defaultValue={apiKeyName} onChange={onChangeName} name="name" placeholder="" autoComplete="off" />
            </div>

            <div className={dialogMessage ? "dialog-message show-message" : "dialog-message"}>{ dialogMessage }</div>

          </div>

          <div className="form-actions flexRow">
            <button className="cancel-button" type="reset" onClick={onCancel}>Cancel</button>
            <button className="submit-button" type="submit">{actionButtonLabel}</button>
          </div>

        </form>
      )
    }
  }


  const getApiKey = async () => {
    const instance = await ZerobiasAppService.getInstance();

    if (apiKeyName) {
      const inlineObject: InlineObject = {
        name: apiKeyName,
        expiration: getFutureDate(10)
      };

      try{
        await instance
          .zerobiasClientApi
          .danaClient
          .getMeApi()
          .createApiKey(inlineObject).then((key: ApiKey & any) => {
            if (key) {
              /* 
                ApiKey & object (any):
                {
                  "id": "ab9c69db-450f-5ff6-8399-463e82f14611",
                  "ownerId": "52d1058e-d615-5efb-a137-fc40cef9bc82",
                  "name": "Roughneck-Admin_Auditmation_Operations_API_Key",
                  "type": "API_KEY",
                  "created": "2025-06-13T16:29:19.210Z",
                  "updated": "2025-06-13T16:29:19.210Z",
                  "expiration": "2035-06-13T16:29:17.827Z",
                  "data": "4065feaa-5f98-4f38-8e01-c6909af19b0c"
                }
              */
            
              setApiKey((apiKey:ApiKey & any) => (key));

              navigator.clipboard.writeText(key.data).then(() => {
                const currentOrgId:string = instance.zerobiasOrgId.getCurrentOrgId();
                if (currentOrgId) {
                  setOrgId((orgId:string) => (currentOrgId));
                }
                const message = 'Your API Key was successfully created, and was copied to your clipboard.';
                setDialogMessage(dialogMessage => (<p className="success">{message}</p>));
              });
            }
          });
      } catch(error:any) {
        const message = `The generation of the new API Key failed with this message:`;
        setDialogMessage(dialogMessage => (<p className="warn">{message}<br />{error.message}</p>));
        console.log(dialogMessage, error);
      } finally {
        renderContent();
      }
    }
  }

  const handleSubmit = async (event:any) => {
    event.preventDefault();
    if (event.type === 'submit') {
      if (apiKey) {
        // we've already got one 
        closeModal();
      } else {
        await getApiKey();
      }
    }
  }

  const renderContent = () => {
    const freshContent = KeyFields();
    if (content !== freshContent) {
      setContent((content) => (freshContent));
    }
  }

  useEffect(() => {
    renderContent();
  }, [apiKeyName, apiKey, orgId, actionButtonLabel, dialogMessage])
  return (
    <>
      <span className="close" onClick={closeModal}><X/></span>
      <div className="modal-form-wrap">
        <div className="modal-form-wrap-inner">
          <div className="modal-header">
            <h2>Create New API Key</h2>
            <p>Use this form to create an API Key for programmatically accessing our APIs in your own custom code.</p>
          </div>

          { content }

        </div>
      </div>
    </>
  )
}
