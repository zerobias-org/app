const proxyConfig ={
  "/api/*": {
    "target": "https://ci.zerobias.com/api",
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
  "/session": {
    "target": "wss://ci.zerobias.com/api/session",
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