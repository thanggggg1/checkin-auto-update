export function isXML(xmlStr){
  var parseXml;

  if (typeof window.DOMParser != "undefined") {
    parseXml = function(xmlStr) {
      return (new window.DOMParser()).parseFromString(xmlStr, "text/xml");
    };
  } else if (typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM")) {
    parseXml = function(xmlStr) {
      var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
      xmlDoc.async = "false";
      xmlDoc.loadXML(xmlStr);
      return xmlDoc;
    };
  } else {
    return false;
  }

  try {
    parseXml(xmlStr);
  } catch (e) {
    return false;
  }
  return true;
}