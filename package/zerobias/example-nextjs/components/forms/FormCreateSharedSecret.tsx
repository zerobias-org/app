import { JSX, useState } from "react";
import { ClipboardCopy } from "lucide-react";
import { useCurrentUser } from "@/context/CurrentUserContext";
import { minutesToDuration } from "@/lib/utils";
import { Duration } from '@auditmation/types-core-js';
import { SharedSessionKey, CreateSharedSessionKeyBody } from '@auditmation/module-auditmation-auditmation-dana';
import ZerobiasAppService from "@/lib/zerobias";

export default function CreateSharedSessionKeyForm() {
  const DEFAULT_MINUTES = 60;
  
  const { user, org, loading, action, setAction } = useCurrentUser();
  
  const [sharedSessionKey, setSharedSessionKey] =  useState<SharedSessionKey|null>(null);
  const [expireMinutes, setExpireMinutes] = useState<number>(DEFAULT_MINUTES);
  const [dialogMessage,setDialogMessage] = useState<JSX.Element>(<></>);


  const onCopyKey = () => {
    if (sharedSessionKey) {
      navigator.clipboard
        .writeText(sharedSessionKey.key)
        .then(() => {
          setDialogMessage(<span>copied to clipboard</span>);
        });
    }
  }

  const handleSubmit = async (event:any) => {
    event.preventDefault();
    console.log('eent: ',event);

    if (event.type === 'submit') {
      const formData = new FormData(event.target);
      if (formData.has('expireMinutes') && (formData.get('expireMinutes') !== '')) {

        setExpireMinutes((expireMinutes) => (Number(formData.get('expireMinutes'))));
        const key = await createSharedSessionKey(Number(formData.get('expireMinutes')));
        
        if (key !== undefined) {
          setSharedSessionKey((sharedSessionKey) => (key));
        }

      }
    }
  }

  const createSharedSessionKey = async (minutes?: number): Promise<SharedSessionKey|undefined> => {
    const createSharedSessionKeyBody: CreateSharedSessionKeyBody = {};
    createSharedSessionKeyBody.expiration  = minutes ? new Duration(minutesToDuration(minutes)) : new Duration('PT1440M'); // 24 hr default

    try{
      const instance = await ZerobiasAppService.getInstance();
      if (instance) {
        return await instance
          .zerobiasClientApi
          .danaClient
          .getMeApi()
          .createSharedSessionKey(createSharedSessionKeyBody);
      }
    } catch(error:any) {
      console.log(error.message);
      setDialogMessage(<span>Failed to create Shared Session Key: <span className="warn">{error.message}</span></span>)
      Promise.reject();
    }
  }

  const onCancel = () => {
    onResetForm();
    setAction((action:string) => (''));
  }

  const onResetForm = () => {
    setDialogMessage((dialogMessage) => (<></>));
    setSharedSessionKey((sharedSessionKey) => (null));
    setExpireMinutes((expireMinutes) => (DEFAULT_MINUTES));
  }
  

  const renderForm = () => {
    if(sharedSessionKey !== null) {
      return (
        <>
          <form onSubmit={handleSubmit} name="sharedSessionKeyForm" className="zb-form show-key-fields">
            <div className="form-body">
              <div className="form-field-wrap">
                <span className="label">Expires</span>
                <input type="text" defaultValue={sharedSessionKey ? sharedSessionKey.expiration.toString() : ''} placeholder="" autoComplete="off" readOnly />
              </div>
              
              <div className="form-field-wrap">
                <span className="label">Shared Session Key</span>
                <input placeholder="" autoComplete="off" readOnly defaultValue={sharedSessionKey ? sharedSessionKey.key : ''}/>
                <button onClick={onCopyKey} type="button">
                  <span><ClipboardCopy /></span>
                </button>
              </div>

              <div className={dialogMessage ? "dialog-message show-message" : "dialog-message"}>{ dialogMessage }</div>

            </div>
            <div className="form-actions flexRow">
                <button className="cancel-button" type="reset" onClick={onCancel}>Cancel</button>
                <button className="close-button" type="button">Close</button>
            </div>
          </form>
        </>
      )
    } else {

      return (
        <>

            <form onSubmit={handleSubmit} name="sharedSessionKeyForm" className="zb-form">
              <div className="form-body">
                <div className="form-field-wrap">
                    <span className="label">Expiration (in Minutes)</span>
                    <input name="expireMinutes" type="number" defaultValue={expireMinutes} placeholder="" autoComplete="off" />
                    <span className="hint lh-34">Number of Minutes this key and shared session will be active.</span>
                </div>


                <div className={dialogMessage ? "dialog-message show-message" : "dialog-message"}>{ dialogMessage }</div>

              </div>

              <div className="form-actions flexRow">
                <button className="cancel-button" type="reset" onClick={onCancel}>Cancel</button>
                <button className="submit-button" type="submit">Create</button>
              </div>
            </form>
        </>
      )
    }
  }


  
  return(
    <>
      <div className="modal-form-wrap">
        <div className="modal-form-wrap-inner">
          <div className="modal-header">
            <h2>Create Shared Session Key</h2>
            <p>Use this form to create a Shared Session Key, which allows someone else to operate this website on your behalf for a limited period of time.</p>
          </div>

          {renderForm()}

        </div>
      </div>
    </>
  )
  
}