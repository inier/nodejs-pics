module.exports = {
  //获取N 个随机字符
  generateMixed(n) {
    return Math.random()
      .toString(16)
      .substring(2, n + 2);
  }
};
