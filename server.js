var http = require("http");
var fs = require("fs");
// var ps = require("path");
// var util = require("util");
var querystring = require("querystring");

const HttpUtil = require("./utils/httpUtil");
const FileUtil = require("./utils/fileUtil");

const Upload = require("./upload");

const server = http.createServer(function(req, res) {
  const { url, method } = req;
  // 如果链接的路径带有 /api, 视为请求接口
  if ("/api".indexOf(url.split("/")[1]) >= 0) {
    if (method == "POST") {
      // 文件上传：上传监听
      Upload.registerUpload(req, res);
    } else if (method == "GET") {
      try {        
        var param = querystring.parse(url.split("?")[1]);

        // 文件上传文件：删除文件
        Upload.deleteFile(res, param);
      } catch (e) {
        HttpUtil.writeFalse(res, e, "GET 错误！");
      }
    } else {
      res.writeHead(404, { "content-type": "text/html;charset=utf-8" });
      res.end("0");
    }
  } else {
    const pathname = url.indexOf("?") >= 0 ? url.split("?")[0] : url;
    // 如果req.url未匹配以下路径，返回 404.html
    let tplPath = "tpls/404.html";

    // 如果链接的路径是 / 或者 /index 时，返回 index.html
    if ("/index.html".indexOf(pathname) >= 0) {
      tplPath = "tpls/index.html";
    }
    // 如果链接的路径是 /upload 时，返回 upload.html
    else if ("/upload.html".indexOf(pathname) >= 0) {
      tplPath = "tpls/upload.html";
    }
    // 如果链接的路径是 /login 时，返回 login.html
    else if ("/login.html".indexOf(pathname) >= 0) {
      tplPath = "tpls/login.html";
    }
    // 如果链接的路径是 /register 时，返回 register.html
    else if ("/register.html".indexOf(pathname) >= 0) {
      tplPath = "tpls/register.html";
    }

    FileUtil.readFile(tplPath).then(data => {
      res.end(data);
    });
  }
});

server.listen(8888);

console.log("OK, listening on http://localhost:" + 8888 + "/");
