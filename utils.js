var crypto = require('crypto')

function WXBizDataCrypt(appId, sessionKey) {
  this.appId = appId
  this.sessionKey = sessionKey
}
WXBizDataCrypt.prototype.decryptData = function (encryptedData, iv) {
  // base64 decode
  var sessionKey = new Buffer(this.sessionKey, 'base64')
  encryptedData = new Buffer(encryptedData, 'base64')
  iv = new Buffer(iv, 'base64')

  try {
     // 解密
    var decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, iv)
    // 设置自动 padding 为 true，删除填充补位
    decipher.setAutoPadding(true)
    var decoded = decipher.update(encryptedData, 'binary', 'utf8')
    decoded += decipher.final('utf8')
    decoded = JSON.parse(decoded)
  } catch (err) {
    throw new Error('Illegal buffer')
  }
  if (decoded.watermark.appid !== this.appId) {
    throw new Error('Illegal Buffer')
  }
  return decoded
}

function getfromData(appId, detail, mch_id, nonce_str,notify_url, openid, out_trade_no, spbill_create_ip, total_fee) {
  var formData = "<xml>";
  formData += "<appid>"+appId+"</appid>"; //appid
  formData += "<body>" + detail + "</body>"; //商品描述
  formData += "<mch_id>"+mch_id+"</mch_id>"; //商户号
  formData += "<nonce_str>"+nonce_str+"</nonce_str>"; //随机字符串
  formData += "<notify_url>"+notify_url+"</notify_url>";
  formData += "<openid>" + openid + "</openid>";
  formData += "<out_trade_no>" + out_trade_no + "</out_trade_no>";//订单号
  formData += "<spbill_create_ip>"+spbill_create_ip+"</spbill_create_ip>";
  formData += "<total_fee>" + total_fee + "</total_fee>";
  formData += "<trade_type>JSAPI</trade_type>";
  formData += "<sign>" + paysignjsapi(appId,detail,mch_id,nonce_str,notify_url,openid,out_trade_no,spbill_create_ip,total_fee,'JSAPI') + "</sign>";
  formData += "</xml>";
  return formData;
}

module.exports = {
    WXBizDataCrypt, 
    getfromData
}
