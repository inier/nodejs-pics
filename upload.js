// 文件上传模块：
// 说明：
// POST时，系统一定要传递的参数有 url,path,key,db_index
// GET时, del=filepath,path格式/123/23/23/sdf.jpg   .需要传递del,key,dbindex

var fs = require("fs");
var formidable = require("formidable");

const CommonUtil = require("./utils/commonUtil");
const FileUtil = require("./utils/fileUtil");
const HttpUtil = require("./utils/httpUtil");
const { redisClient, basePath, tempPath } = require("./config/upload-config");

module.exports = {
  // 注册上传监听
  registerUpload(req, res) {
    var form = new formidable.IncomingForm(),
      files = new Array(),
      File = null,
      fields = new Array();

    form.uploadDir = tempPath;
    form.encoding = "utf-8";
    form.maxFieldsSize = 5 * 1024 * 1024;
    form.keepExtensions = false;
    form
      .on("field", function(field, value) {
        try {
          fields[field] = value;
        } catch (e) {
          HttpUtil.writeFalse(res, e, "onfield error");
        }
      })
      .on("file", function(field, file) {
        try {
          files[field] = file;
          File = file;
        } catch (e) {
          HttpUtil.writeFalse(res, e, "onfile error!");
        }
      })
      .on("end", function() {
        try {
          if (fields["path"] && File.size > 0) {
            if (fields["filesize"] && File.size > fields["filesize"]) {
              fs.unlink(File.path, function(err) {});
              HttpUtil.writeApiOk(res, "", {
                result: "9",
                err: "文件大小超过限制！"
              });
            } else {
              var descPath = basePath + fields["path"];

              FileUtil.mkdirs(descPath, 0755, function() {
                var rnd = CommonUtil.generateMixed(6);
                var filename =
                  rnd + File.name.substr(File.name.lastIndexOf("."));
                fs.rename(File.path, descPath + "/" + filename, function(err) {
                  console.log(err + "");
                });
                redisClient.writeRedisList(fields, filename);
              });

              if (fields["url"]) {
                res.writeHead(302, { Location: fields["url"] });
                res.end("0");
              } else {
                HttpUtil.writeApiOk(res, "", { result: "0" });
              }
            }
          }
        } catch (e) {
          //console.log(e);
          HttpUtil.writeApiOk(res, e, { result: "3", err: "上传文件出错!" });
        }
      })
      .on("error", function(err) {
        //console.log(err+'');
        HttpUtil.writeApiOk(res, err, { result: "3", err: "上传文件出错!" });
      });

    try {
      form.parse(req);
    } catch (e) {
      //console.log(e);
      HttpUtil.writeFalse(res, e, "form.parse error");
    }
  },
  //删除文件
  deleteFile(res, para = {}) {
    if (para.del && para.key) {
      const path = basePath + para.del;

      fs.unlink(path, function(err) {
        if (err) {
          HttpUtil.writeApiOk(res, "", { result: "404" });
        } else {
          //删除redis
          redisClient.delItemFromRedisList(para.key, para.del, para.dbindex);

          HttpUtil.writeApiOk(res, "", { result: "0" });
        }
      });
    }
  }
};
