module.exports = {
  writeFalse(res, e, msg) {
    res.writeHead(200, { "content-type": "text/html;charset=utf-8" });
    if (msg) {
      res.end(msg);
    } else {
      res.end("0");
    }
    e && console.log("" + e);
  },
  writeApiOk(res, e, msg) {
    res.writeHead(200, {
      "Access-Control-Allow-Headers": "X-Requested-With",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PUT,POST,GET,DELETE,OPTIONS",
      "X-Powered-By": " 3.2.1",
      "content-type": "application/json;charset=utf-8"
    });
    if (msg) {
      res.end(JSON.stringify(msg));
    } else {
      res.end("0");
    }
    e && console.log("" + e);
  }
};
