# ZeroBias Client API Demo App 
## Example NextJS App

  1 - Clone the `package/zerobias/example-nextjs` app to get started.
  
  2 - Generate an API key from the Zerobias Platform (Production) user menu.
 
  3 - In your local dev environment, `export ZB_TOKEN='your api key to the zerobias platform'`
 
  4 - Run `npm install` _after_ you have exported `ZB_TOKEN` so the .npmrc file will have your API key, otherwise you will not be able to install the required ZeroBias NPM packages.

  5 - Generate an API key from whichever ZeroBias Platform environment you will want your local dev environment to use for data.  For example, if you want your dev environment to make API calls and use the data you have on our QA platform, generate an API Key from the QA platform, then export that API key in your local environment like `export NEXT_PUBLIC_API_KEY='api key you want to get data from'`.  If you will be using data from the Production platform, you can use the same API key you generated from step 2 above. The `NEXT_PUBLIC_API_KEY` environment variable will be used within the demo app and added as an Authorization header to API calls.  *This will only work in your local dev environment*.

  6 - create a `.env.development` file in the `example-nextjs` folder with the following contents, edited as needed.  :

    // .env.development
```JSON
NEXT_PUBLIC_IS_LOCAL_DEV=true
NEXT_PUBLIC_PRODUCTION=false
NEXT_PUBLIC_LOCAL_PORTAL_ORIGIN=http://localhost:3000/
NEXT_PUBLIC_API_HOSTNAME=app.zerobias.com 
NEXT_PUBLIC_ENV=dev
```

    Note: Change `NEXT_PUBLIC_API_HOSTNAME` to whichever platform you generated your API key from e.g. `qa.zerobias.com` for the QA environment, or `app.zerobias.com` for the Production environment.

  7 - Run `npm run dev` to start the local dev server.
  
  8 - In your web browser, navigate to `http://localhost:3000/`
