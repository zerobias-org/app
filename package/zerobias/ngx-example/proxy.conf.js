const proxyConfig ={
  "/cc/api/*": {
    "target": "https://api.zerobias.com/cc/api",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/cc/api": ""
    },
    "logLevel": "info",
    "headers": {
      "Authorization": "APIKey " + process.env.API_KEY,
    }
  },
  "/api/*": {
    "target": "https://api.zerobias.com/api",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/api": ""
    },
    "logLevel": "debug",
    "headers": {
      "Authorization": "APIKey " + process.env.API_KEY,
    }
  },
  "/platform/*": {
    "target": "https://api.zerobias.com/platform",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/platform": ""
    },
    "logLevel": "debug",
    "headers": {
      "Authorization": "APIKey " + process.env.API_KEY,
    }
  },
  "/cc/graphql/*": {
    "target": "https://api.zerobias.com/cc/graphql",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/cc/graphql": ""
    },
    "logLevel": "info",
    "headers": {
      "Authorization": "APIKey " + process.env.API_KEY,
    }
  },
  "/graphql/*": {
    "target": "https://api.zerobias.com/graphql",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/graphql": ""
    },
    "logLevel": "info",
    "headers": {
      "Authorization": "APIKey " + process.env.API_KEY,
    }
  },
  "/card/*": {
    "target": "https://api.zerobias.com/card",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/card": ""
    },
    "logLevel": "info",
    "headers": {
      "Authorization": "APIKey " + process.env.API_KEY,
    }
  },
  "/file-service/*": {
    "target": "https://api.zerobias.com/file-service",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/file-service": ""
    },
    "logLevel": "info",
    "headers": {
      "Authorization": "APIKey " + process.env.API_KEY,
    }
  },
  "/store/*": {
    "target": "https://api.zerobias.com/store",
    "secure": true,
    "changeOrigin": true,
    "logLevel": "debug",
    "pathRewrite": {
      "^/store": ""
    },
    "headers": {
      "Authorization": "APIKey " + process.env.API_KEY,
    }
  },
  "/hub/*": {
    "target": "https://api.zerobias.com/hub",
    "secure": true,
    "changeOrigin": true,
    "logLevel": "debug",
    "pathRewrite": {
      "^/hub": ""
    },
    "headers": {
      "Authorization": "APIKey " + process.env.API_KEY,
    }
  },
  "/dana/api/v2/*": {
    "target": "https://api.zerobias.com/dana/api/v2",
    "secure": true,
    "changeOrigin": true,
    "logLevel": "debug",
    "pathRewrite": {
      "^/dana/api/v2/": ""
    },
    "headers": {
      "Authorization": "APIKey " + process.env.API_KEY,
    },
    "cookieDomainRewrite": {
      "*": ""
    }
  },
  "/dana/api/v1/*": {
    "target": "https://api.zerobias.com/dana/api/v2",
    "secure": true,
    "changeOrigin": true,
    "logLevel": "debug",
    "pathRewrite": {
      "^/dana/api/v1/": ""
    },
    "headers": {
      "Authorization": "APIKey " + process.env.API_KEY,
    },
    "cookieDomainRewrite": {
      "*": ""
    }
  },
  "/card/*": {
    "target": "https://api.zerobias.com/card",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/card": ""
    },
    "logLevel": "info",
    "headers": {
      "Authorization": "APIKey " + process.env.API_KEY,
    }
  },
  "/portal/*": {
    "target": "https://api.zerobias.com/portal",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/portal": ""
    },
    "logLevel": "info",
    "headers": {
      "Authorization": "APIKey " + process.env.API_KEY,
    }
  },
  "/events/*": {
    "target": "https://api.zerobias.com/events",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/events": ""
    },
    "logLevel": "info",
    "headers": {
      "Authorization": "APIKey " + process.env.API_KEY,
    }
  },
  "/session": {
    "target": "wss://api.ci.zerobias.com/session",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/session": ""
    },
    "logLevel": "info",
    "ws": true
  }
}
module.exports = proxyConfig;
