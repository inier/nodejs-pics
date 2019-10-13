const url = require("url");
const fs = require("fs");
// const { request } = require("http2-wrapper"); // got 支持http/2
const download = require("download");  // download模块基于got

const FileUtils = require("./util/fileUtils");

let res = url.parse(
  "http://i.meizitu.net/thumbs/2013/06/26926_20140711w1811_236.jpg"
);

let pat = res.pathname.split("/");
pat.pop();
console.log(pat.join("/"));
download(
  "http://i.meizitu.net/thumbs/2013/06/26926_20140711w1811_236.jpg"
).then(data => {
  FileUtils.mkdirsSync("." + res.pathname, 777);
  fs.writeFileSync(`./download${res.pathname}`, data);
});

console.log(res);

// 测试突破防盗链是否OK
let SpiderIDLE = {
  start: false,
  index_success: false,
  img_page_success: false,
  img_down_success: false,
  img_taotu_success: false,
  // BASE_PATH: "../storage/download",
  BASE_PATH: "./download"
};

function testDownload(urlImg = "") {
  if (urlImg) {
    // 1.下载到本地进行存储
    let fileDetail = FileUtils.parseUri(urlImg);
    let savePath = SpiderIDLE.BASE_PATH + "/images" + fileDetail.filepath;

    FileUtils.checkDir(savePath);
    download(urlImg, savePath, {
      headers: {
        ["referer"]: "https://www.mzitu.com/205968/2"
      }
    }).then(function() {
      console.log("DownloadThumbsImg:", urlImg, "SavePath:", savePath);
    });
  }
}
testDownload("https://i5.meizitu.net/2013/06/2013061116hoijygng5j4.jpg");
