const api_n = "https://tt.wx.coomaan.com/sms_n_account";
const api_m = "https://tt.wx.coomaan.com/sms_m_account";
const guard_api = "http://tt.api.coomaan.com/coomaan/sms_check";
const guard_api_v2 = "https://tt.api.coomaan.com/coomaan/sms_check_v2";
const clientId = "CM001";
const secret = "07d69c9689a5e44f4904dd885dc411f0";

var app = angular.module("app", ['ngFileUpload'])

app.controller("main", function ($scope, $interval, $http, Upload) {
  $scope.status = "start";
  $scope.status_text = "其它";
  $scope.phoneStatus = [];
  $scope.types = ["M", "N"];
  $scope.guardTpyes = ["营销短信", "行业短信"];
  $scope.progress = 0;
  $scope.showProcess = false;
  $scope.processTimer = null;
  var vm = $scope.vm = {};
  vm.value = 0;
  vm.style = 'bg-success';
  vm.showLabel = true;
  vm.striped = true;

  function isPoneAvailable() {
    var myreg = /^[1][3,4,5,7,8][0-9]{9}$/;
    if (!myreg.test($scope.receiver_number)) {
      return false;
    } else {
      return true;
    }
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

  $scope.singleJudge = () => {
    // if(!isPoneAvailable()){
    //   alert("输入正确的号码")
    //   return;
    // }
    $scope.status_text = ""
    $scope.phoneStatus = [];
    if ($scope.message == "" || $scope.message == undefined) {
      alert("输入内容不能为空")
      return;
    }


    var type = $scope.coomaanTpye == "行业短信" ? 1 : 2;
    var time = Math.round(new Date / 1000);
    var hash = sha1(clientId + time + secret);



    $http({
      url: guard_api_v2,
      method: 'POST',
      data: {
        "client_id": clientId,
        "timestamp": time,
        "sign": hash,
        "port_type": type,
        "content": $scope.message,
        "sender": "1064567851",
        "receiver": $scope.receiver_number,
      }
    }).then(res => {
      console.log("成功了: " + JSON.stringify(res.data))
      if(res.data.status == "11"){
        $scope.status = "no"
        $scope.status_text = "存在号码异常"
        return;
      }
      var data = res.data.data;
      for(let index in data){
        var tempPhoneStatus = {"status":"","text":""}
        switch (data[index].status) {
          case 300:
            $scope.status = "no"
            $scope.status_text = "违法分类，不能发送"
            break;
          case 400:
            $scope.status = "no"
            $scope.status_text = "诈骗分类，不能发送"
            break;
          case 500:
            $scope.status = "no"
            $scope.status_text = "广告分类，不能发送"
            break;
          case 600:
            $scope.status = "no"
            $scope.status_text = "其它原因不下发"
            break;
          case 1:
            $scope.status = "yes"
            $scope.status_text = "信息都正常，可发送"
            break;
          case -1:
            $scope.status = "chat"
            $scope.status_text = "未知，未探测到"
            break;
          default:
            $scope.status = "chat"
            $scope.status_text = "未知，未探测到"
            break;
          }
        if(data[index].phonenumstatus == 1){
          tempPhoneStatus.status = "yes";
          tempPhoneStatus.text = data[index].receiver + " - " + "号码正常"
          $scope.phoneStatus.push(tempPhoneStatus)
        }else{
          tempPhoneStatus.status = "no";
          tempPhoneStatus.text = data[index].receiver + " - " + "号码异常"
          $scope.phoneStatus.push(tempPhoneStatus)
        }
        
      }
    }, error => {
      console.log("报错了")
      console.log(error)
    })

  }

  $scope.submit = () => {
    if ($scope.showProcess) {
      alert("已在进行中")
    } else {
      if ($scope.form2.file.$valid && $scope.file) {
        uploadFile($scope.file);
      } else {
        alert("文件格式不对")
      }
    }
  };

  $scope.$on("$destroy", function () {
    $interval.cancel($scope.processTimer);
  });

  var uploadFile = file => {
    console.log("file : " + file)
    var type = "营销短信";
    if ($scope.multiTpye == "营销短信") {
      type = "营销短信";
    } else {
      type = "行业短信";
    }
    Upload.upload({
      url: '/file-upload',
      data: { file: file, 'type': type }
    }).then(function (resp) {
      $scope.vm.value = 0
      $scope.showProcess = true
      console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
      $scope.processTimer = $interval(checkStatus, 1000)
    }, function (resp) {
      console.log('Error status: ' + resp.status);
    }, function (evt) {
      var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
      console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
    });
  };

  var checkStatus = () => {
    $http.get('/file_status').then(res => {
      $scope.vm.value = parseInt(res.data.status * 100)
      if ($scope.vm.value == 100) {
        if ($scope.processTimer != null) {
          $interval.cancel($scope.processTimer);
          $scope.showProcess = false
        }
      }
    }, error => {
      console.log("获取进度出错 " + error)
      if ($scope.processTimer != null) {
        $interval.cancel($scope.processTimer);
      }
    })
  }
})