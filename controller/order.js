const dataBase = require('../dataBase/dataBase.js');
const {wechatApp} = require('../config');

async function searchOrderByopenid(ctx, next) {
    let openId = ctx.request.query.openId;
    if(!openId) {
        return;
    }
    let search = await dataBase.searchOrderByopenid(openId);
    console.log('订单列表', search);
    let details = await dataBase.getOrderDetails(search.order_id);
    console.log('^details^', details)
    search.orderDetailList = details;
    ctx.status = 200;
    ctx.body = {
        code: 0,
        msg: 'success',
        data: search
    }
}

async function createOrder(ctx, next) { //订单创建
    let data = ctx.request.body;
    if(!(data.userName || data.userAddress || data.userPhone || data.userOpenid || data.deliveryTime || data.items)) {
        return;
    }
    let items = data.items;
    let result = await dataBase.createOrder(data);
    console.log('#result#', items);
    items.forEach(function(item) {
        dataBase.insertOrderDetail(item.productId, item.productQuantity, result.insertId);
    })
    
    ctx.status = 200;
    ctx.body = {
        code: 0,
        msg: 'success',
        data: null
    }
    
}




async function orderPay(ctx, next) { //订单支付
    let data = ctx.request.body;
    if(!(data.userOpenid || data.orderId || data.total_fee || data.detail)) {
        return;
    }
//total_fee, userOpenid, detail, orderId 
    var apiUrl = "https://api.mch.weixin.qq.com/pay/unifiedorder";
    var total_fee = data.total_fee *100   //订单价格,单位是分
    var openid= data.userOpenid
    var detail = data.detail;
    var out_trade_no = data.out_trade_no; //订单号

    var timeStamp = createTimeStamp(); //时间节点
    var nonce_str = createNonceStr() + createTimeStamp(); //随机字符串
    var spbill_create_ip = get_client_ip(ctx); //请求ip
    var notify_url ='https://wangtingting.top:9006/buyer/notify';  
    var formData = "<xml>";
    formData += "<appid>"+wechatApp.appId+"</appid>"; //appid
    formData += "<mch_id>"+wechatApp.mch_id+"</mch_id>"; //商户号
    formData += "<nonce_str>"+nonce_str+"</nonce_str>"; //随机字符串
    formData += "<body>" + detail + "</body>"; //商品描述
    formData += "<notify_url>"+notify_url+"</notify_url>";
    formData += "<openid>" + openid + "</openid>";
    formData += "<out_trade_no>" + out_trade_no + "</out_trade_no>";//订单号
    formData += "<spbill_create_ip>"+spbill_create_ip+"</spbill_create_ip>";
    formData += "<total_fee>" + total_fee + "</total_fee>";
    formData += "<trade_type>JSAPI</trade_type>";
    formData += "<sign>" + paysignjsapi(wechatApp.appId,detail,wechatApp.mch_id,nonce_str,notify_url,openid,out_trade_no,spbill_create_ip,total_fee,'JSAPI') + "</sign>";
    formData += "</xml>";
    
   request({
        url: apiUrl,
        method: 'POST',
        body: formData
    },function (err, response, body) {
        if (!err && response.statusCode === 200){
            // console.log(body);
            var result_code = getXMLNodeValue('result_code', body.toString("utf-8"));
            var resultCode = result_code.split('[')[2].split(']')[0];
            if(resultCode === 'SUCCESS'){ 
                //成功
                var prepay_id = getXMLNodeValue('prepay_id', body.toString("utf-8")).split('[')[2].split(']')[0]; //获取到prepay_id
                //签名
                var _paySignjs = paysignjs(wechatApp.appId, nonce_str, 'prepay_id='+ prepay_id,'MD5',timeStamp);
                var args = {
                    appId: wechatApp.appId,
                    timeStamp: timeStamp,
                    nonceStr: nonce_str,
                    signType: "MD5",
                    package: prepay_id,
                    paySign: _paySignjs,
                    status:200
                };

                ctx.status = 200;
                ctx.body = {
                    code: 0,
                    msg: 'success',
                    data: args
                }

            }else{                         
                //失败
                var err_code_des = getXMLNodeValue('err_code_des',body.toString("utf-8"));
                var errDes = err_code_des.split('[')[2].split(']')[0];
               var errArg = {
                   status:400,
                   errMsg: errDes
               };

               ctx.status = 400;
               ctx.body = {
                   code: 0,
                   msg: 'success',
                   data: errArg
               }
            }
           
        }
    })



    await dataBase.orderPay(data.userOpenid, data.orderId);
    ctx.status = 200;
    ctx.body = {
        code: 0,
        msg: 'success',
        data: null
    }
}

async function notifypay(ctx, next) {
    console.log('@@@@@@@@@@@@@@@@@支付成功')
}

function paysignjs(appid, nonceStr, package, signType, timeStamp) {
    var ret = {
        appId: appid,
        nonceStr: nonceStr,
        package: package,
        signType: signType,
        timeStamp: timeStamp
    };
    var string = raw1(ret);
    string = string + '&key='+key;
    // console.log(string);
    var crypto = require('crypto');
    return crypto.createHash('md5').update(string, 'utf8').digest('hex');
}


var get_client_ip = function(req) {
    var ip = req.headers['x-forwarded-for'] ||
        req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress || '';
    if(ip.split(',').length>0){
        ip = ip.split(',')[0]
    }
    return ip;
};
//解析xml
function getXMLNodeValue(node_name, xml) {
    var tmp = xml.split("<" + node_name + ">");
    var _tmp = tmp[1].split("</" + node_name + ">");
    return _tmp[0];
}

// 随机字符串产生函数
function createNonceStr() {
    return Math.random().toString(36).substr(2, 15)
}
// 时间戳产生函数
function createTimeStamp() {
    return parseInt(new Date().getTime() / 1000) + ''
}

module.exports = {
    searchOrderByopenid,
    createOrder,
    orderPay,
    notifypay
};