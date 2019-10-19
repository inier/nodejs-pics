const restify = require("restify-clients");
// const request = require("request");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3047.4 Safari/537.36";

const sourceBaseUrl = "www.mzitu.com";

const RemoteConfig = {
  host: "https://" + sourceBaseUrl,
  zhuanti: "https://" + sourceBaseUrl + "/zhuanti/",
  page: "https://" + sourceBaseUrl + "/page/"
};

// token为服务端所需
const token = "4F39500149264DE474AA8FA4C67379D1";

// 请求头
const RequestHeaders = {
  "User-Agent": UA,
  Host: sourceBaseUrl
  // token:
};

//网站来源
const webClient = restify.createStringClient({
  url: "https://" + sourceBaseUrl,
  headers: RequestHeaders
});

//服务端api配置
const serverApiClient = restify.createStringClient({
  url: "http://localhost:8080",
  //url: 'http://192.168.99.100:81',
  headers: RequestHeaders
});

module.exports = {   
  RequestHeaders,
  webClient,
  serverApiClient,
  RemoteConfig
};
