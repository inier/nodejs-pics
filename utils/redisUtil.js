// var Redis = require('ioredis');

const redis = require("redis");

function connect(RedisConfig) {
  // 创建redis连接
  const client = redis.createClient(RedisConfig);

  // Radis报错监听
  client.on("error", function(err) {
    console.log("Error " + err);

    return false;
  });

  return client;
}

module.exports = {
  client: null,
  init(RedisConfig = {}) {
    let instance = this.client;

    // 创建连接
    instance = connect(RedisConfig);

    instance.dbindex = RedisConfig.dbindex || 0;

    // 主要重写了一下三个方法。可以根据需要定义。
    const get = instance.get;
    const set = instance.set;
    const setex = instance.setex;

    instance.set = function(key, value, callback) {
      if (value !== undefined) {
        set.call(instance, key, JSON.stringify(value), callback);
      }
    };

    instance.get = function(key, callback) {
      get.call(instance, key, (err, val) => {
        if (err) {
          logger.warn("redis.get: ", key, err);
        }
        callback(null, JSON.parse(val));
      });
    };
    // 可以不用传递expires参数。在config文件里进行配置。
    instance.setex = function(key, value, callback) {
      if (value !== undefined) {
        setex.call(
          instance,
          key,
          config.cache.maxAge,
          JSON.stringify(value),
          callback
        );
      }
    };

    //写入redis  List形式的
    instance.writeRedisList = function(fields, filename) {
      try {
        //循环获取传过来的参数，找到redis 相关的。
        if (fields["key"]) {
          var json = "{";
          for (var s in fields) {
            if (s.indexOf("redis_") == 0) {
              json += "'" + s.substr(6) + "':'" + fields[s] + "',";
            }
          }

          //console.log('filename:'+filename);
          if (fields["path"] && filename) {
            json += "'Path':'" + fields["path"] + filename + "',";
          }

          if (json.length > 1) {
            json = json.substr(0, json.length - 1);
          }

          json += "}";

          if (fields["db_index"]) {
            this.dbindex = fields["db_index"];
          }

          instance.select(this.dbindex, function() {
            instance.rpush(fields["key"], json, function() {
              instance.quit();
            });
          });
        }

        return true;
      } catch (e) {
        console.log("redis error:" + e);
        return false;
      }
    };
    //从redis里删除
    instance.delItemFromRedisList = function(key, path, dbindex) {
      try {
        if (key && path) {
          if (dbindex) {
            this.dbindex = dbindex;
          }
          
          instance.select(this.dbindex, function() {
            instance.lrange(key, 0, -1, function(err, replies) {
              replies.forEach(function(reply, i) {
                console.log("    " + i + ": " + reply);
                if (reply.indexOf(path) > -1) {
                  instance.lrem(key, 0, reply, function() {
                    instance.quit();
                  });
                }
              });
            });
          });
        }

        return true;
      } catch (e) {
        console.log("redis error:" + e);
        return false;
      }
    };

    return instance;
  }
};
