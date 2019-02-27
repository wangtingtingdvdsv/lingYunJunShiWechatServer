
const dataBase = require('../dataBase/dataBase.js');
const {wechatApp} = require('../config');
var crypto = require('crypto');
var request = require('request');

async function searchOrderByopenid(ctx, next) {
    let openId = ctx.request.query.openId;
    if(!openId) {
        return;
    }
    let search = await dataBase.searchOrderByopenid(openId);

    let details = await dataBase.getOrderDetails(search.order_id);

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
    var out_trade_no = getWxPayOrdrID(); //订单号

    var timeStamp = createTimeStamp(); //时间节点
    var nonce_str = createNonceStr() + createTimeStamp(); //随机字符串
    var spbill_create_ip = get_client_ip(ctx); //请求ip
    var notify_url ='https://wangtingting.top:9006/buyer/notify';  
    var formData = "<xml>";
    formData += "<appid>"+wechatApp.appId+"</appid>"; //appid
    formData += "<body>" + detail + "</body>"; //商品描述
    formData += "<mch_id>"+wechatApp.mch_id+"</mch_id>"; //商户号
    formData += "<nonce_str>"+nonce_str+"</nonce_str>"; //随机字符串

    formData += "<notify_url>"+notify_url+"</notify_url>";
    formData += "<openid>" + openid + "</openid>";
    formData += "<out_trade_no>" + out_trade_no + "</out_trade_no>";//订单号
    formData += "<spbill_create_ip>"+spbill_create_ip+"</spbill_create_ip>";
    formData += "<total_fee>" + total_fee + "</total_fee>";
    formData += "<trade_type>JSAPI</trade_type>";
    formData += "<sign>" + paysignjsapi(wechatApp.appId,detail,wechatApp.mch_id,nonce_str,notify_url,openid,out_trade_no,spbill_create_ip,total_fee,'JSAPI') + "</sign>";
    formData += "</xml>";
    console.log('formData', formData);
   request({
        url: apiUrl,
        method: 'POST',
        body: formData
    },function (err, response, body) {
        console.log('body', body);
        if (!err && response.statusCode === 200){
            console.log('@@@@@@@', body.toString("utf-8"));
          


              
                    // var result_code = getXMLNodeValue('result_code', body.toString("utf-8"));
                    // var resultCode = result_code.split('[')[2].split(']')[0];
                    // if(resultCode === 'SUCCESS'){ 
                    //     //成功
                    //     var prepay_id = getXMLNodeValue('prepay_id', body.toString("utf-8")).split('[')[2].split(']')[0]; //获取到prepay_id
                    //     //签名
                    //     var _paySignjs = paysignjs(wechatApp.appId, nonce_str, 'prepay_id='+ prepay_id,'MD5',timeStamp);
                    //     var args = {
                    //         appId: wechatApp.appId,
                    //         timeStamp: timeStamp,
                    //         nonceStr: nonce_str,
                    //         signType: "MD5",
                    //         package: prepay_id,
                    //         paySign: _paySignjs,
                    //         status:200
                    //     };
                    // }
                 
          
                    ctx.status = 200;
                    ctx.body = {
                        code: 0,
                        msg: 'success',
                        data: null
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
    console.log('$', tmp[1]);
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

function getWxPayOrdrID(){
    var myDate = new Date();
    var year = myDate.getFullYear();
    var mouth = myDate.getMonth() + 1;
    var day = myDate.getDate();
    var hour = myDate.getHours();
    var minute = myDate.getMinutes();
    var second = myDate.getSeconds();
    var msecond = myDate.getMilliseconds(); //获取当前毫秒数(0-999)
    if(mouth < 10){ /*月份小于10  就在前面加个0*/
        mouth = String(String(0) + String(mouth));
    }
    if(day < 10){ /*日期小于10  就在前面加个0*/
        day = String(String(0) + String(day));
    }
    if(hour < 10){ /*时小于10  就在前面加个0*/
        hour = String(String(0) + String(hour));
    }
    if(minute < 10){ /*分小于10  就在前面加个0*/
        minute = String(String(0) + String(minute));
    }
    if(second < 10){ /*秒小于10  就在前面加个0*/
        second = String(String(0) + String(second));
    }
    if (msecond < 10) {
        msecond = String(String(00) + String(second));
    } else if(msecond >= 10 && msecond < 100){
        msecond = String(String(0) + String(second));
    }

    var currentDate = String(year) + String(mouth) + String(day) + String(hour) + String(minute) + String(second) + String(msecond);
    return currentDate;
}

function paysignjsapi(appid,body,mch_id,nonce_str,notify_url,openid,out_trade_no,spbill_create_ip,total_fee,trade_type) {
    var ret = {
        appid: appid,
        body: body,
        mch_id: mch_id,
        nonce_str: nonce_str,
        notify_url: notify_url,
        openid: openid,
        out_trade_no: out_trade_no,
        spbill_create_ip: spbill_create_ip,
        total_fee: total_fee,
        trade_type: trade_type
    };
    var string = raw(ret);
    string = string + '&key='+ wechatApp.key;
    console.log('string', string);
    var sign = crypto.createHash('md5').update(string, 'utf8').digest('hex');
    return sign.toUpperCase()
}
function raw1(args) {
    var keys = Object.keys(args);
    keys = keys.sort()
    var newArgs = {};
    keys.forEach(function(key) {
        newArgs[key] = args[key];
    });

    var string = '';
    for(var k in newArgs) {
        string += '&' + k + '=' + newArgs[k];
    }
    string = string.substr(1);
    return string;
}

function raw(args) {
    var keys = Object.keys(args);
    keys = keys.sort();
    var newArgs = {};
    keys.forEach(function(key) {
        newArgs[key.toLowerCase()] = args[key];
    });
    var string = '';
    for(var k in newArgs) {
        string += '&' + k + '=' + newArgs[k];
    }
    string = string.substr(1);
    return string;
}

module.exports = {
    searchOrderByopenid,
    createOrder,
    orderPay,
    notifypay
};