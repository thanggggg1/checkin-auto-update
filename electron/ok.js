var verCodeId = "inputVerCode";
$(function() {
  initVerCode();
});

function initVerCode() {
  getParamTodo(function(a) {
    if (a == null) {
      return;
    }
    window.verificationCodeOpen = a;
    if (a) {
      showVerCode(verCodeId);
    } else {
      hideVerCode(verCodeId);
    }
  });
}

function clickCheckCode(b) {
  var a = b.src;
  if (a.indexOf("?") == -1) {
    b.src = b.src + "?" + Math.random();
  } else {
    b.src = a.substr(0, a.indexOf("?"));
  }
}

function getParamTodo(a) {
  $.ajax({
    url: "/portalIsNeedVerificationCode.do", method: "get", success: function(b) {
      b = b.data.needVerCode;
      a(b);
    }
  });
}

function showVerCode(a) {
  $("#" + a).show();
}

function hideVerCode(a) {
  $("#" + a).hide();
}

function reloadVerCode() {
  $("#" + verCodeId + " img").click();
}

var pwdChangeParams;

function getPwdChangeParams(f, b, e) {
  var d = "{userName:'" + f + "',password: '" + b + "',code: '" + e + "',}";
  var d = getAES(d);
  var a = encodeURIComponent(d);
  var c = new RegExp("%", "g");
  a = a.replace(c, ".");
  $.ajax({
    url: "portalPwdEffectiveCheck.do", method: "post", async: false, data: { content: a }, success: function(g) {
      pwdChangeParams = g;
    }, error: function() {
      pwdChangeParams.data = null;
    }
  });
}

function isInitPassword(c, d, b) {
  if (pwdChangeParams != null && pwdChangeParams.data != null) {
    var a = pwdChangeParams.data.init;
    if (a != null && a != "" && (a || a == "true")) {
      DhxCommon.createWindow("portalInitPassword.do?userName=" + c + "^0^0^610^450^" + d);
    } else {
      if (b != null) {
        b();
      }
    }
  }
}

function isPasswordExpired(c, d, b) {
  if (pwdChangeParams != null && pwdChangeParams.data != null) {
    var a = pwdChangeParams.data.timeOut;
    if (a != null && a != "" && (a || a == "true")) {
      DhxCommon.createWindow("portalSystemSecurityChangePwd.do?userName=" + c + "^0^0^610^450^" + d);
    } else {
      if (b != null) {
        b();
      }
    }
  }
}

function isAchieveStrength(b, c, e, a) {
  var d = getStrengthByPwd(c);
  $.ajax({
    url: "/portalCheckStrength.do", method: "post", data: { strength: d }, async: false, success: function(f) {
      if (f == "true" || f == true) {
        a();
      } else {
        DhxCommon.createWindow("portalSystemSecurityStrengthChangePwd.do?userName=" + b + "^0^0^610^450^" + e);
      }
    }
  });
}

function getStrengthByPwd(a) {
  var c = [];
  var d = 0;
  if (a.length < 8) {
    return -1;
  }
  c[0] = new RegExp("[A-Z]");
  c[1] = new RegExp("[a-z]");
  c[2] = new RegExp("[0-9]");
  c[3] = new RegExp("[^0-9a-zA-Z]");
  for (var b = 0; b < c.length; b++) {
    if (c[b].test(a)) {
      d++;
    }
  }
  if (d >= 3) {
    return 2;
  }
  if (d <= 1) {
    return -1;
  }
  if (c[2].test(a) && c[1].test(a)) {
    return 0;
  }
  if (c[2].test(a) && c[0].test(a)) {
    return 0;
  }
  return 1;
}

function submitLoginForm(f) {
  var c = $("#username").val();
  var d = $("#password").val();
  var a = hex_md5(d);
  var b = $("#checkCode").val();
  var e = $("input[name='loginType']").val();
  setTimeout(function() {
    if (e == "PERS") {
      $("#userLoginForm").submit();
    } else {
      getPwdChangeParams(c, a, b);
      if (pwdChangeParams.data == undefined || pwdChangeParams.data == null) {
        $("#userLoginForm").submit();
        return;
      }
      var g = pwdChangeParams.data.checkPwd;
      if (g != undefined && g != null && (g == "true" || g)) {
        isInitPassword(c, f, function() {
          isPasswordExpired(c, f, function() {
            isAchieveStrength(c, d, f, function() {
              $("#userLoginForm").submit();
            });
          });
        });

      } else {
        $("#userLoginForm").submit();
      }
    }
  });
}

function submitWhithOutInit(f) {
  var c = $("#username").val();
  var d = $("#password").val();
  var a = hex_md5(d);
  var b = $("#checkCode").val();
  var e = $("input[name='loginType']").val();
  setTimeout(function() {
    if (e == "PERS") {
      $("#userLoginForm").submit();
    } else {
      getPwdChangeParams(c, a, b);
      var g = pwdChangeParams.data.checkPwd;
      if (g != undefined && g != null && (g == "true" || g)) {
        isPasswordExpired(c, f, function() {
          isAchieveStrength(c, d, f, function() {
            $("#userLoginForm").submit();
          });
        });

      } else {
        $("#userLoginForm").submit();
      }
    }
  });
}

function submitValidateTimeOut(a) {
  submitWhithOutInit(a);
}

function getAesString(e, b, a) {
  var c = CryptoJS.enc.Utf8.parse(b);
  var d = CryptoJS.AES.encrypt(e, c, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
  return d.toString();
}

function getAES(d) {
  var b = "0123456789ABCDEF";
  var a = "0123456789ABCDEF";
  var c = getAesString(d, b, a);
  return c;
}