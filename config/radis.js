const redis = require("redis");

const RedisConfig = {};
const RegxConfig = {
  index_tag: /<dl(.*?)class="tags">([\s\S]*?)<\/dl>/g
};

// Radis keys map
const CacheKeys = {
  index_tag: "index_tag_queue",
  tag_list: "tag_list_queue",
  taotu_list: "taotu_list",
  page_count: "page_count",
  page_detail: "page_detail_queue",
  img_download_url: "img_queue"
};

module.exports = {
  // 创建redis连接
  redisConn: redis.createClient({
    host: "127.0.0.1",
    port: "6379",
    auth_pass: "a123456"
  }),
  RedisConfig,
  RegxConfig,
  CacheKeys
};
