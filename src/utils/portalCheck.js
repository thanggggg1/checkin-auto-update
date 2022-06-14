var CryptoJS = require("crypto-js");

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

export function getPwdChangeParams(f, b, e) {
  var d = "{userName:'" + f + "',password: '" + b + "',code: '" + e + "',}";
  var d = getAES(d);
  var a = encodeURIComponent(d);
  var c = new RegExp("%", "g");
  a = a.replace(c, ".");
  return a;
}