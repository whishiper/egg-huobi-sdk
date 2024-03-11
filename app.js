'use strict';
const HuobiSdk = require('./lib/sdk');
module.exports = app => {
  // put before other core middlewares
  app.huobiSdk = HuobiSdk;
  // app.config.huobiSdk = HuobiSdk;

  // if security plugin enabled, and origin config is not provided, will only allow safe domains support CORS.
};
