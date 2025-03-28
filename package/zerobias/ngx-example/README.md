# Example Angular App

This app is an example Angular v17.1.3 app that shows:

    1. how to use the Zerobias Client API to interact with the Zerobias Platform
    2. how to use a Zerobias Module to interact with a product via the Zerobias Platform

There are many helpful comments in the code itself, so as you familiarize yourself with the code, also closely read the code comments.

## Key Info

1. [The Zerobias Client Library](#the-zerobias-client-library)
2. [Using `ZerobiasAppService` and `APP_INITIALIZER`](#using-zerobiasappservice)
3. [Make Calls Using the Zerobias Client Library](#make-calls-using-the-zerobias-client-library)
4. [Including and Making Calls Using a Zerobias Module](#including-and-making-calls-using-a-zerobias-module)

### The Zerobias Client Library

The first step is to use the `@auditmation/ngx-zb-client-lib` in your project.  This will pull in all of the services and APIs you will need in order to interact with our platform and enable you to use modules to interact with your products.

You will see in the `package.json` at the root of our example project, under `dependencies` we have included this package:

```
  "dependencies": {
    ...
    "@auditmation/ngx-zb-client-lib": "^0.0.30",
    ...
  }
```

After you run `npm install` you will see the code under `node_modules/@auditmation/ngx-zb-client-lib`.  Now you have all of the services and APIs you will need for deep integration with the Zerobias platform.


### Using `ZerobiasAppService`

Included within the `@auditmation/ngx-zb-client-lib` is the `ZerobiasAppService`.  We initialize this example app using the `ZerobiasAppService`,  which contains code that will give you several tools to use for interacting with the platform e.g. logging in, logging out, setting and enforcing session time limits, etc.  You may end up using many or most of these tools.

Learn more in `src/app/app.module.ts`  
      


### How to Make Calls Using the Zerobias Client Library

Next we will use several of the client APIs to interact with the Zerobias Platform.  You can follow along by opening the `src/app/app.component.ts` and `src/app/app.component.html` files where we have written additional comments which you can learn more from.

In `src/app/app.component.ts` we import all of the types and modules that what we will be using.

We inject the clients we will use in the constructor, as well as the `environment` variables:
``` 
  constructor(
    protected clientApi: ZerobiasClientApiService,
    protected zerobiasAppService: ZerobiasAppService,
    @Inject('environment') private environment: any
  ) {}
```

Learn more by reading through the code and comments in `src/app/app.component.ts`

### Including and Making Calls Using a Zerobias Module

For our demo, we'll be using our Github Module to interact with Github through the Platform, by first including it as a dependency in our `package.json`:

```
  "dependencies": {
    ...
    "@auditlogic/module-github-github-client-ts": "^6.3.11",
    ...
  }
```

After `npm install` is run you will see this module code in `node_modules/@auditlogic/module-github-github-client-ts`.  This module will give you all of the tools you will need in order to interact with Github through one of your own Connections.  **Please Note:** You will need to have a working Connection in the Zerobias Platform as a prerequisite for this portion of the demo to work, as this module will utilize that Connection via the Platform.

Learn more by reading through the code and comments in `src/app/app.component.ts`
