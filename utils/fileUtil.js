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
  readFile(fPath) {
    // 使用 path.join 拼接路径
    filePath = path.join(__dirname, fPath);
    return new Promise(function(resolve, reject) {
      fs.readFile(fPath, "utf-8", (err, data) => {
        // 使用 fs.readFile 读取 html 文件, callback 有两个参数，一个是 err,一个是 data
        // err：错误警告
        // data：读取到的数据
        // 如果出现错误就抛出 err，没出错就把 html 页面返回给浏览器
        if (err) {
          throw err;
          // return reject(err);
        }
        resolve(data);
      });
    });
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
  },
  mkdirs: function(dirPath, mode, callback) {
    const that = this;
    fs.exists(dirPath, function(exists) {
      if (exists) {
        callback(dirPath);
      } else {
        //尝试创建父目录，然后再创建当前目录
        that.mkdirs(path.dirname(dirPath), mode, function() {
          fs.mkdir(dirPath, mode, callback);
        });
      }
    });
  },
  //文件base64进行加密
  base64_encode(path) {
    var bitmap = fs.readFileSync(path);
    return new Buffer(bitmap).toString("base64");
  },
  unlinkFile(path) {
    fs.unlinkSync(path, function(e) {
      if (!e) {
        return true;
      }
      return false;
    });
  }
};
