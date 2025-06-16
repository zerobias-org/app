import ZerobiasAppService from "@/lib/zerobias";
import { useEffect, useState } from "react";
import { PagedResults } from '@auditmation/types-core-js';
import { PKV } from '@auditmation/module-auditmation-auditmation-dana';


export default function PkvDemo() {

  const [loading, setLoading] = useState(false);
  const [showAddPkv, setShowAddPkv] = useState(false);
  const [pagedKvPairs, setPagedKvPairs] = useState<PKV[]>([]);
  const [pkvPageToken, setPkvPageToken] = useState<string|undefined>();

  const kvFormGroup = new FormData();

  const initForm = () => {
    ['action','key','value'].forEach(el => {
      kvFormGroup.set(el,el === 'action' ? 'addPkvPair':'');
    });
  }

  const handleSubmit = async (event:any) => {
    event.preventDefault();

    if (event.type !== 'submit') {
      return;
    }
    const formData = new FormData(event.target);

    if (
      !(formData.has('key') && formData.get('key') !== '' &&
      formData.has('value') && formData.get('value') !== '')
    ) {
      return;
    }

    setLoading((loading) => (true));

    console.log('formData: ',formData);

    try {
      const instance:ZerobiasAppService = await ZerobiasAppService.getInstance();

      if (instance) {

        const pkv: PKV = {
          key: `${formData.get('key')}`,
          value: JSON.parse(`${formData.get('value')}`)
        }

        await instance
          .zerobiasClientApi
          .danaClient
          .getPkvApi()
          .upsertPrincipalKeyValue(undefined,pkv).then(async (pkv:PKV) => {
            console.log('pkv created: ',pkv);
            // reset form
            kvFormGroup.set('key','');
            kvFormGroup.set('value','');

            const token:string|undefined = pkvPageToken ? pkvPageToken : undefined;

            await instance
              .zerobiasClientApi
              .danaClient
              .getPkvApi()
              .listPrincipalKeyValues(undefined, token, 50)
              .then((pagedResults: PagedResults<PKV>) => {
                if (pagedResults) {
                  const pageToken:string|undefined = pagedResults.pageToken ? pagedResults.pageToken : token ? token : undefined;
                  setPkvPageToken(pkvPageToken => (pageToken));

                  const items:PKV[] = pagedResults.items.length > 0 ? pagedResults.items : [];
                  setPagedKvPairs(pagedKvPairs => (items));
                }
              });
          });
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };


  const toggleShowAddPkv = () => {
    setShowAddPkv(showAddPkv ? false : true);
    if (showAddPkv) {
      initForm();
    }
  }

  const PkvPairsList = () => {
    // const items:string[] = [];
    //         <ul className="list" role="list">

    if (pagedKvPairs && pagedKvPairs.length > 0) {
      const items = pagedKvPairs?.map((item:PKV, idx:number) => {
        return (<li key={idx}><div className="text-wrapper flexRow gap4">
              <span className="label colon flexRow">
                  <span>{item.key}</span>
              </span>
              <span className="text">
                {JSON.stringify(item.value)}
              </span> 
            </div></li>);
      });
      return (
        <ul className="list" role="list">
          { items }
        </ul>
      )
    } else {
      return (<></>)
    }
  }

  const AddButton = () => {
    if (showAddPkv) { 
      return (<button onClick={(e) => {e.preventDefault(); toggleShowAddPkv()}}>hide</button>)
    } else {
      return (<button onClick={(e) => {e.preventDefault(); toggleShowAddPkv()}}>+ add</button>)
    } 
  }

  useEffect(() => {

    const getPlatform = async () => {

      try {
        const instance:ZerobiasAppService = await ZerobiasAppService.getInstance();

        if (instance) {
          const token:string|undefined = pkvPageToken ? pkvPageToken : undefined;

          await instance.zerobiasClientApi
            .danaClient
            .getPkvApi()
            .listPrincipalKeyValues(undefined, token, 50)
            .then((pagedResults: PagedResults<PKV>) => {
              if (pagedResults) {
                const pageToken:string|undefined = pagedResults.pageToken ? pagedResults.pageToken : token ? token : undefined;
                setPkvPageToken(pkvPageToken => (pageToken));

                const items:PKV[] = pagedResults.items.length > 0 ? pagedResults.items : [];
                setPagedKvPairs(pagedKvPairs => (items));
              }
            });
        }

      } catch (error:any) {
        console.log(error.message)
        console.log(error.stack)
      } 
    }
    
    getPlatform()
  }, [])



  return (
    <div className="pkv-demo">

      <h2>Principal Key-Value Example</h2>
      <p>This example calls the ZeroBias Principal Key-Value API <code>clientApi.danaClient.getPkvApi()</code> endpoint to manipulate the storage of key-value pairs</p>
      
      {AddButton()}

      <div className={showAddPkv ? 'show-form pkv-form-wrapper' : 'pkv-form-wrapper'}>
        <form onSubmit={handleSubmit} className="pkv-form">

          <hr className="small" />

          <h3>Create KV Pair</h3>
          <div className="new-pkv-form flexColumn gap4">

            <div className="flexRow gap16">

              <div className="form-field-wrap">
                <span className="label">Key:</span>
                <div>
                  <input name="key" className="mw-150" defaultValue={`${kvFormGroup.has('key') ? kvFormGroup.get('key') : ''}`} placeholder="" autoComplete="off" />
                </div>
              </div>

              <div className="form-field-wrap">
                <span className="label">Value:</span>
                <textarea name="value" className="textarea-default" placeholder="{}" autoComplete="off" defaultValue={kvFormGroup.has('value') ? kvFormGroup.get('value')?.toString() : ''}></textarea>
              </div>

              <div className="example-obj">
                <h5>Example Value: </h5>
                <textarea name="example-obj" className="textarea-default overflowHidden b-0" defaultValue={`{
    "value": {
      "additionalProp1": {}
    }
  }`} readOnly>

                </textarea>
              </div>
            </div>
            <div>
              <button type='submit'>Create</button>
            </div>

          </div>
          <hr className="small" />
        </form>
      </div>
      <div className="pkv-container">
        { PkvPairsList() }
      </div>
    </div>
  )



}