'use strict';

const CryptoJS = require('crypto-js');
const moment = require('moment');
const HmacSHA256 = require('crypto-js/hmac-sha256');
const http = require('./httpClient');

const URL_HUOBI_PRO = 'api.huobi.br.com'; // 正式地址使用api.huobipro.com
// const URL_HUOBI_PRO = 'api.huobi.pro'; //备用地址

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36'
};
const DEFAULT_OPTIONS = {
  method: 'GET',
  baseurl: URL_HUOBI_PRO
};
// function get_auth() {
//   const sign = config.huobi.trade_password;
//   const md5 = CryptoJS.MD5(sign)
//     .toString()
//     .toLowerCase();
//   const ret = encodeURIComponent(
//     JSON.stringify({
//       assetPwd: md5,
//     })
//   );
//   return ret;
// }
function mergeQuery(query) {
  if (!query) {
    return null;
  }
  // 由于火币api中存在'aa-bb'类型的字段 约定好将query中aa_bb转为aa-bb @fsg 2019.05.31
  Object.keys(query).forEach(item => {
    if (item.includes('_')) {
      query[item.replace(/_/g, '-')] = query[item];
      Reflect.deleteProperty(query, item);
    }
  });
  return query;
}

function sign_sha({ method, baseurl, path, data, secretKey }) {
  const pars = [];
  for (const item in data) {
    pars.push(item + '=' + encodeURIComponent(data[item]));
  }
  let p = pars.sort().join('&');
  const meta = [method, baseurl, path, p].join('\n');
  // console.log(meta);
  const hash = HmacSHA256(meta, secretKey);
  const osig = CryptoJS.enc.Base64.stringify(hash);
  const Signature = encodeURIComponent(osig);
  // console.log(`Signature: ${Signature}`);
  p += `&Signature=${Signature}`;
  return p;
}

function getBody(accessKey) {
  return {
    AccessKeyId: accessKey,
    SignatureMethod: 'HmacSHA256',
    SignatureVersion: 2,
    Timestamp: moment.utc().format('YYYY-MM-DDTHH:mm:ss')
  };
}

async function call_api(method, path, payload, body) {
  return new Promise((resolve, reject) => {
    const url = `https://${URL_HUOBI_PRO}${path}?${payload}`;
    const headers = DEFAULT_HEADERS;
    // headers.AuthData = get_auth();
    const op = {
      GET: async () => {
        try {
          const res = await http.request(url, {
            headers
          });
          resolve(res);
        } catch (ex) {
          console.error(path, '异常', ex);
          reject(ex);
        }
      },
      POST: async () => {
        try {
          const res = await http.request(url, {
            headers,
            method: 'POST',
            body: JSON.stringify(body)
          });
          resolve(res);
        } catch (ex) {
          console.error(path, '异常', ex);
          reject(ex);
        }
      }
    };
    op[method]();
  });
}
class Hbsdk {
  // 查询用户的所有账户状态 OK
  account(query) {
    const path = '/v1/account/accounts';
    const { accessKey, secretKey } = query;
    const body = getBody(accessKey);
    const payload = sign_sha(
      Object.assign({}, DEFAULT_OPTIONS, {
        path,
        data: body,
        secretKey
      })
    );
    return call_api('GET', path, payload, body);
  }
  // 查询指定账户余额 OK
  async balance(query, params) {
    const { account_id } = params;
    const { accessKey, secretKey } = query;
    const path = `/v1/account/accounts/${account_id}/balance`;
    const body = getBody(accessKey);
    const payload = sign_sha(
      Object.assign({}, DEFAULT_OPTIONS, {
        path,
        data: body,
        secretKey
      })
    );
    return call_api('GET', path, payload, body);
  }
  // 获取所有当前帐号下未成交订单 ok
  open_orders(query) {
    const path = '/v1/order/openOrders';
    const { accessKey, secretKey } = query;
    const body = getBody(accessKey);
    Object.assign(body, mergeQuery(query));
    const payload = sign_sha(
      Object.assign({}, DEFAULT_OPTIONS, {
        path,
        data: body,
        secretKey
      })
    );
    return call_api('GET', path, payload, body);
  }
  // 查询用户当前成交、历史成交 OK
  order_matchresults(query) {
    const path = '/v1/order/matchresults';
    const { accessKey, secretKey } = query;
    const body = getBody(accessKey);
    Object.assign(body, mergeQuery(query));
    const payload = sign_sha(
      Object.assign({}, DEFAULT_OPTIONS, {
        path,
        data: body,
        secretKey
      })
    );

    return call_api('GET', path, payload, body);
  }
  // 根据order-id查询订单的成交明细 OK
  order_matchresults_detail(query, params) {
    const { order_id } = params;
    const { accessKey, secretKey } = query;
    const path = `/v1/order/orders/${order_id}/matchresults`;
    const body = getBody(accessKey);
    const payload = sign_sha(
      Object.assign({}, DEFAULT_OPTIONS, {
        path,
        data: body,
        secretKey
      })
    );
    return call_api('GET', path, payload, body);
  }
  // 查询某个订单详情 ok
  order_detail(query, params) {
    const { order_id } = params;
    const { accessKey, secretKey } = query;
    const path = `/v1/order/orders/${order_id}`;
    const body = getBody(accessKey);
    const payload = sign_sha(
      Object.assign({}, DEFAULT_OPTIONS, {
        path,
        data: body,
        secretKey
      })
    );
    return call_api('GET', path, payload, body);
  }
  // 查询当前委托、历史委托 ok
  orders(query) {
    const path = '/v1/order/orders';
    const { accessKey, secretKey } = query;
    const body = getBody(accessKey);
    Object.assign(body, mergeQuery(query));
    const payload = sign_sha(
      Object.assign({}, DEFAULT_OPTIONS, {
        path,
        data: body,
        secretKey
      })
    );

    return call_api('GET', path, payload, body);
  }
  // 查询用户48小时内历史订单 ok
  history(query) {
    const path = '/v1/order/history';
    const { accessKey, secretKey } = query;
    const body = getBody(accessKey);
    Object.assign(body, mergeQuery(query));
    const payload = sign_sha(
      Object.assign({}, DEFAULT_OPTIONS, {
        path,
        data: body,
        secretKey
      })
    );
    return call_api('GET', path, payload, body);
  }
  // 查询当前成交、历史成交 ok
  matchresults(query) {
    const path = '/v1/order/matchresults';
    const { accessKey, secretKey } = query;
    const body = getBody(accessKey);
    Object.assign(body, mergeQuery(query));
    const payload = sign_sha(
      Object.assign({}, DEFAULT_OPTIONS, {
        path,
        data: body,
        secretKey
      })
    );
    return call_api('GET', path, payload, body);
  }
  // 下单 ok
  order_place(query) {
    const path = '/v1/order/orders/place';
    const { accessKey, secretKey } = query;
    const body = getBody(accessKey);
    const payload = sign_sha(
      Object.assign({}, DEFAULT_OPTIONS, {
        path,
        data: body,
        method: 'POST',
        secretKey
      })
    );
    Object.assign(body, mergeQuery(query));
    // console.log('body', body, mergeQuery(query));
    return call_api('POST', path, payload, body);
  }
}
const HbSdkSingleTon = (function() {
  let st;
  return function() {
    if (!st) {
      st = new Hbsdk();
    }
    return st;
  };
})()();
module.exports = HbSdkSingleTon;
