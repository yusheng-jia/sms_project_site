var express = require('express');
var xlsx  = require("node-xlsx")
var fs = require('fs');
var http = require("http")
var sha1 = require("js-sha1")
var sms_headers = ["类型","语料","status"];

const sms_options = {
  hostname: '47.103.44.86',  
  path: '/coomaan/sms_check_v2',  
  method: 'POST', 
  headers: {  
      'Content-Type': 'application/json; charset=UTF-8'  
  }
}

const clientId = "CM001";
const secret = "07d69c9689a5e44f4904dd885dc411f0";

var options = sms_options;

var path = "uploads";

var fileTpye = "xls";

var array = [];
var curIndex = 0;
var smsType = 1;

/** 文件处理 */
function handleFile(){
  fs.readdir(path, function(err,files){
    if (err) return console.log(err);
    files.forEach(function (file) {
      var curPath = path + "/" + file;
      if(fileTpye == 'text/csv'){
        array = handleCsvFile(curPath);
      }else{
        var obj = xlsx.parse(curPath);
        array = obj[0].data;
      }
      postGuardMain(0)
     })
  })  
}

/** csv文件处理 */
function handleCsvFile(file){
  console.log("csvFile: " + file);
  var tempArray = [];
  var data = fs.readFileSync(file);
  var row = data.toString().split("\n");
  for(var i=0; i<row.length; i++){
    tempArray.push(row[i].split(","));
  }
  return tempArray;
}

function getMoble() {
  var prefixArray = new Array("130", "131", "132", "133", "135", "137", "138", "170", "187", "189");
  var i = parseInt(10 * Math.random());
  var prefix = prefixArray[i];
  for (var j = 0; j < 8; j++) {
    prefix = prefix + Math.floor(Math.random() * 10);
  }
  return prefix;
}


/** 网络请求: 短信拦截 */
var postGuardMain = index =>{
  curIndex = index - 1;
  if(index >= array.length){
    exportExcelFile(sms_headers,"sms_result.xlsx");
    return;
  }
  var currentText = array[index][1];
  console.log("index: " + index +" text: " + currentText);
  var time = Math.round(new Date/1000);
  var hash = sha1(clientId + time + secret);
  var receiver = Math.random
  var content = JSON.stringify({
    "client_id": clientId,
    "timestamp": time,
    "sign":hash,
    "port_type":smsType,
    "content":currentText,
    "sender":"1064567851",
    "receiver": getMoble()
  });

  var req = http.request(sms_options, res =>{
    res.setEncoding('utf8');
    res.on('data', body =>{
      try {
        var obj = eval("("+body+")"); 
        console.log('BODY: ' + obj.data); 
        array[index].push(obj.data[0].status);
      } catch (error) {
        
      }
    })
    res.on('end' ,() =>{
      postGuardMain(index + 1)
    })
  })
  req.on('error', function (e) {  
    console.log('problem with request: ' + e.message);  
  }) 
  //请求
  req.write(content);
  
  req.end();
  
}

/**  文件下载 */
function downFile(req, res, next){
  res.download("./sms_result.xlsx");
}


/** 生成文件操作 */
function exportExcelFile(headers,fileName){
  console.log("exportExcelFile")
  var data = array;
  data.unshift(headers);
  var buffer = xlsx.build([{name: "smsSheet", data: data}]);
  fs.writeFile(fileName, buffer, 'binary',function(err){
    if(err){
      console.log("生成excel文件出错:" + err);
      return false;
    }
    curIndex = curIndex + 1;
  })
  // fs.writeFileSync('sms_result.xlsx', buffer, 'binary');
}

/** 传过来的文件 */
function uploadFile(req, res){
  console.log("前端传过来的tpye: " + req.body.type);
  array = [];
  fileTpye = req.files.file.type;
  options = sms_options;
  if(req.body.type == "行业短信"){
    smsType = 1;
  }else{
    smsType = 2;
  }
  console.log("options : " + options);
  newPath = req.files.file.path;
  console.log(newPath);
  curIndex = 0;
  res.send({ret_code: '0'});
  handleFilePre(newPath);
}

/** 文件预处理，删除临时文件 */
function handleFilePre(newPath){
  fs.readdir(path, function(err,files){
    if (err) return console.log(err);
    files.forEach(function (file) {
      var curPath = path + "/" + file;
      if(curPath != newPath){
        fs.unlinkSync(curPath);
      } 
     })
     handleFile();
  })
}

/** 获取进度 */
function fileStatus(req,res){
  var percentage = 0
  if(array.length == 0){
    percentage = 0;
  }
  else{
    percentage = curIndex/array.length;
  }
  console.log("percentage : " + percentage.toFixed(2));
  res.send({ret_code: '0', status: percentage.toFixed(2)});
};

module.exports = {
  downFile:downFile,
  uploadFile:uploadFile,
  fileStatus:fileStatus
}