"use strict";

/**
 * 采集某网站整站图集
 */
const http = require("http");
const querystring = require("querystring");
const log4js = require("log4js"); // log框架
const cheerio = require("cheerio"); // node版jquery
const process = require("process"); // 线程处理
const download = require("download"); // download模块基于got

const FileUtil = require("./utils/fileUtil");

const loggerConfig = require("./logconf.json");
log4js.configure(loggerConfig);
const logger = log4js.getLogger();

const {
  redisClient,
  RedisConfig,
  RegxConfig,
  CacheKeys
} = require("./config/spider-redis");

const {
  RequestHeaders,
  webClient,
  serverApiClient,
  RemoteConfig
} = require("./config/spider-sourceSite");

const ServerApi = {
  DocumentAdd: "/Document_add.action",
  PictureAdd: "/Picture_add.action",
  // 获取上一次的采集对象,这个作为增量采集的标识
  DocumentLast: "/Document_last.action",
  // 验证图集是否被采集过了
  DocumentCheck: "/Document_check.action"
};

let SpiderIDLE = {
  start: false,
  index_success: false,
  img_page_success: false,
  img_down_success: false,
  img_taotu_success: false,
  // BASE_PATH: "../storage/download",
  BASE_PATH: "./download",
  IMAGE_FOLDER: "images",
  THUMB_FOLDER: "banner"
};

// 全站采集器
const Spider = {
  start: function() {
    webClient.get("/zhuanti/", function(err, req, res, data) {
      if (err) {
        return err;
      }
      let $ = cheerio.load(data);
      $(".postlist .tags dd").each(function(index, item) {
        let $this = $(this);
        let tag = {};
        tag.title = $this.find("img").attr("alt");
        tag.banner = $this.find("img").attr("src");
        tag.url = $this.find("a").attr("href");
        //pop进入队列
        redisClient.rpush(CacheKeys.index_tag, JSON.stringify(tag), function(
          err,
          reply
        ) {
          logger.warn(err, reply);
        });
      });
    });
  },
  // 1.获取首页,获取首页有多少个pageCount
  getPageList: function(callback) {
    webClient.get("/", function(err, req, res, data) {
      if (err) {
        return err;
      }
      let $ = cheerio.load(data);
      $(".nav-links a[class='page-numbers']").each(function(index, item) {
        let $this = $(this);
        //pop进入队列
        let html = $this.html();
        let page = html.match(/\d+/);
        if (parseInt(page)) {
          redisClient.getset(CacheKeys.page_count, page);
        }
      });
      redisClient.get(CacheKeys.page_count, function(err, reply) {
        callback(reply);
      });
    });
  },
  // 2.加入套图页面数据,就是套图的数据
  getImgPage: function(callback) {
    redisClient.decr(CacheKeys.page_count, function(err, reply) {
      if (err || !reply) {
        return false;
      }

      if (parseInt(reply) <= 1) {
        logger.info("页面套图数据，已采集完毕!!!!");
        SpiderIDLE.img_page_success = true;
        return false;
      }
      logger.info(`开始采集页面:${reply}`);

      //采集这个页面
      webClient.get(`/page/${reply}/`, function(err, req, res, data) {
        if (err || !data) {
          return false;
        }

        let $ = cheerio.load(data);

        $(".postlist #pins li").each(function(index, item) {
          let $this = $(this);
          let document = {
            title: "",
            url: "",
            remote_path: "/",
            content: "",
            page_num: "",
            category_id: "",
            create_time: "",
            update_time: "",
            good_count: 0,
            view_count: 0,
            remote_id: 0
          };

          document.create_time = $this.find(".time").html();
          document.view_count = Math.random() * 1000000;
          document.title = $this.find("img").attr("alt");
          document.url = $this.find("a").attr("href");
          document.remote_id = document.url.match(/\d+/)[0];
          document.remote_path = "/" + document.remote_id;
          document.content = $this.find("img").attr("data-original");
          document.category_id = reply;
          document.page_num = reply;

          //加入队列
          //TODO 写入gateway接口
          redisClient.rpush(
            CacheKeys.page_detail,
            JSON.stringify(document),
            function(err, reply) {
              setTimeout(() => {
                callback(document);
              }, 1000);
            }
          );
        });
      });
    });
  },
  // 3.采集套图具体图片，就是套图数量的数据
  getTaoTuImgs: function(callback) {
    redisClient.lpop(CacheKeys.page_detail, function(err, reply) {
      if (err || !reply) {
        return;
      }

      let document = JSON.parse(reply);
      let rePath = (document.remote_path = "/" + document.url.match(/\d+/)[0]);

      logger.debug("PATH:", rePath);

      webClient.get(rePath, function(err, req, res, data) {
        if (err || !data) {
          return;
        }

        let $ = cheerio.load(data);
        let pageCount = $(".main .pagenavi a span")
          .eq(-2)
          .html();

        document.detail_count = pageCount;

        //动态生成链接图片链接
        logger.info(
          `------------- 获取套图：${document.category_id},${pageCount}张 -------------`
        );

        for (let i = 2; i <= pageCount; i++) {
          let img = {
            category_id: document.category_id,
            img_url: document.url + "/" + i,
            remote_id: document.remote_id,
            remote_path: document.remote_path + "/" + i
          };

          //这里可能直接push了10张图进去
          redisClient.rpush(
            CacheKeys.img_download_url,
            JSON.stringify(img),
            function(err, reply) {
              logger.info(`+ 套图：${img.remote_path}`, err || "");
            }
          );
        }
      });
    });
  },
  // 4.具体下载
  downloadYY: function(callback) {
    const that = this;
    //下载图片
    redisClient.lpop(CacheKeys.img_download_url, (err, reply) => {
      if (err || !reply) {
        return false;
      }

      let img = JSON.parse(reply);

      webClient.get(img.remote_path, (err, req, res, data) => {
        if (err || !data) {
          err && logger.warn(err);
          return;
        }

        const $ = cheerio.load(data);

        //找到图片并且下载
        const urlImg = $(".main .main-image img").attr("src");
        img.url_img = urlImg;
        img.path = `/${img.category_id}/`;

        const fileDetail = FileUtil.parseUri(urlImg);
        const savePath = `${SpiderIDLE.BASE_PATH}/${SpiderIDLE.IMAGE_FOLDER}/${img.category_id}${fileDetail.filepath}`;
        const imgReferer = img.img_url;

        img.location = `/${SpiderIDLE.IMAGE_FOLDER}/${img.category_id}${fileDetail.filepath}/${fileDetail.filename}`;

        that.downloadImage(urlImg, savePath, imgReferer).then(({ status }) => {
          if (status) {
            logger.info("↓ Image:", urlImg, ", path:", img.location);
            callback && callback(img);
          }
        });
      });
    });
  },
  /**
   * 图片下载
   * @param {String} urlImg 图片url
   * @param {String} savePath 本地保存地址
   * @param {String} imgReferer 用于突破防盗链
   */
  downloadImage: (urlImg, savePath, imgReferer) => {
    FileUtil.checkDir(savePath);

    return download(urlImg, savePath, {
      headers: {
        ["referer"]: imgReferer
      }
    })
      .then(function() {
        return { status: true };
      })
      .catch(err => {
        logger.warn(err);
        return { status: false };
      });
  },
  // 清除Redis缓存
  clearRedis: () => {
    redisClient.flushdb(function(err) {
      logger.info(`============= clear Redis cache success! ==============`);
      err && logger.warn(err);
    });
  }
};

//增量采集器 TODO version2.0
const IncSpider = {
  run: function(callback) {}
};

const SpiderTimer = setInterval(function() {
  if (SpiderIDLE.start !== true) {
    return false;
  }
  if (SpiderIDLE.img_page_success !== true) {
    Spider.getImgPage(function(document) {
      const urlImg = document.content;

      // 1.下载到本地进行存储
      const fileDetail = FileUtil.parseUri(urlImg);
      const savePath = `${SpiderIDLE.BASE_PATH}/${SpiderIDLE.THUMB_FOLDER}${fileDetail.filepath}`;
      const imgReferer = document.url;

      Spider.downloadImage(urlImg, savePath, imgReferer).then(({ status }) => {
        if (status) {
          logger.info("↓ Thumb:", urlImg, ", path:", savePath);
        }
      });

      // 2.提交给服务器,这个只是页面的
      document.content = `/${SpiderIDLE.THUMB_FOLDER}${fileDetail.filepath}/${fileDetail.filename}`;
      document.view_count = parseInt(document.view_count);
      // TODO 服务端
    });
  }
  Spider.downloadYY(function(picture) {
    // TODO 服务端
  });
  Spider.getTaoTuImgs(function(document) {
    // TODO 服务端
  });
}, 100);

Spider.getPageList(function(count) {
  logger.info(`================= 采集页面总数：${count} =================`);
  SpiderIDLE.start = true;
});

// pm2 exit
process.on("exit", function() {
  Spider.clearRedis();
  redisClient.end(true);
  clearInterval(SpiderTimer);
});
