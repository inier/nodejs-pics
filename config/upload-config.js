/**
 * 使用node.js +redis 作为服务端，提供图片上传存储服务
 */
const RedisUtil = require("../utils/redisUtil");

//自定义参数区
var basePath = "f:/workspace/nodejs/nodejs-pics/upload/"; //上传的根路径
var tempPath = "f:/workspace/nodejs/nodejs-pics/temp/";

// redis服务器信息
const RedisConfig = {
  host: "127.0.0.1",
  port: "6379",
  auth_pass: "a123456",
  dbindex: 5,
};

const RegxConfig = {
  index_tag: /<dl(.*?)class="tags">([\s\S]*?)<\/dl>/g
};


const redisClient = RedisUtil.init(RedisConfig);

module.exports = {
  redisClient,
  basePath,
  tempPath,
};
