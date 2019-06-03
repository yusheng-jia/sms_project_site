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

  $scope.singleJudge = () => {
    if ($scope.message == "" || $scope.message == undefined) {
      alert("输入内容不能为空")
      return;
    }

    var type = $scope.coomaanTpye == "行业短信"?1:2;
    var time = Math.round(new Date / 1000);
    var hash = sha1(clientId+time+secret);

    $http({
      url: guard_api_v2,
      method: 'POST',
      data: {
        "client_id": clientId,
        "timestamp": time,
        "sign":hash,
        "port_type": type,
        "content": $scope.message,
        "sender": "3333",
        "receiver": "3333"
      }
    }).then(res => {
      console.log("成功了: " + JSON.stringify(res.data))
      var status = res.data.data.status
      switch (status) {
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