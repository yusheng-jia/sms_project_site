const webpack = require('webpack');
const path  = require('path');

module.exports = {
  entry: {
    app:['jquery', 'popper.js', 'bootstrap','angular','ng-file-upload','js-sha1','./public/javascripts/main.js']
  },
  output: { //输出路径和文件名，使用path模块resolve方法将输出路径解析为绝对路径
      path: path.resolve(__dirname, "./dist/js"), //将js文件打包到dist/js的目录
      filename: "main.js" 
  }
  // plugins: [
	// 	new webpack.optimize.SplitChunksPlugin({
  //     commons: {
  //       name: "vendor",
  //       chunks: "initial",
  //       minChunks: 2
  //   }
  //   })
	// ]
}