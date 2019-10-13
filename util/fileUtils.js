const fs = require("fs");
const path = require("path");
const url = require("url");

module.exports = {
  parseUri(uri) {
    let filePath = url.parse(uri).path;
    let tmp = filePath.split("/");
    return {
      filename: tmp.pop(),
      filepath: tmp.join("/")
    };
  },
  checkDir(dirPath) {
    let mode = 777;
    if (!fs.existsSync(dirPath)) {
      let tmp;
      dirPath.split("/").forEach(function(dirname) {
        if (tmp) {
          tmp = path.join(tmp, dirname);
        } else {
          tmp = dirname;
        }
        if (!fs.existsSync(tmp)) {
          if (!fs.mkdirSync(tmp, mode)) {
            return false;
          }
        }
      });
    }
    return true;
  },
  mkdirsSync(dirPath, mode) {
    if (!fs.existsSync(dirPath)) {
      let tmp;
      dirPath.split("/").forEach(function(dirname) {
        if (tmp) {
          tmp = path.join(tmp, dirname);
        } else {
          tmp = dirname;
        }
        console.log(tmp);
        if (!fs.existsSync(tmp)) {
          if (!fs.mkdirSync(tmp, mode)) {
            return false;
          }
        }
      });
    }
    return true;
  }
};
