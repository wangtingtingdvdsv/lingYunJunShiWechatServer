
const dataBase = require('../dataBase/dataBase.js');
const Util = require('../utils.js')
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
 async function  orderPay(ctx,next) { //订单支付
    let data = ctx.request.body;
    if(!(data.userOpenid || data.orderId || data.total_fee || data.detail)) {
        ctx.status = 400;
        ctx.body = '参数不齐全';
        return;
    }
//total_fee, userOpenid, detail, orderId 
    var apiUrl = "https://api.mch.weixin.qq.com/pay/unifiedorder";
    var total_fee = data.total_fee *100   //订单价格,单位是分
    var openid= data.userOpenid
    var detail = data.detail;
    var out_trade_no = Util.getWxPayOrdrID(); //订单号
    var timeStamp = Util.createTimeStamp(); //时间节点
    var nonce_str = Util.createNonceStr() + Util.createTimeStamp(); //随机字符串
    var spbill_create_ip = Util.get_client_ip(ctx); //请求ip
    var notify_url ='https://wangtingting.top:9006/buyer/notify';  
    let formData = Util.getfromData(wechatApp.appId, detail, wechatApp.mch_id, nonce_str,notify_url, openid, out_trade_no, spbill_create_ip, total_fee)
    let resultData;
    let status = 200;
    await new Promise(function(resolve, reject){
        request({
            url: apiUrl,
            method: 'POST',
            body: formData
        },function (err, response, body) {
            if (!err && response.statusCode === 200){
                var result_code = Util.getXMLNodeValue('result_code', body.toString("utf-8"));
                var resultCode = result_code.split('[')[2].split(']')[0];
                resolve(dealPaymentSuccessful(resultCode, body, nonce_str, timeStamp))
            }else{                         
                var err_code_des = Util.getXMLNodeValue('err_code_des',body.toString("utf-8"));
                var errDes = err_code_des.split('[')[2].split(']')[0];
                status = 400
                resolve(errDes);
            }
        })
    }).then(function(data) {
        resultData = data;
    })
    await dataBase.orderPay(data.userOpenid, data.orderId);
    ctx.status = status;
    ctx.body = resultData
}

function dealPaymentSuccessful(resultCode, body, nonce_str, timeStamp){           
    if(resultCode === 'SUCCESS'){ 
        //成功
        var prepay_id = Util.getXMLNodeValue('prepay_id', body.toString("utf-8")).split('[')[2].split(']')[0]; //获取到prepay_id
        //签名
        var _paySignjs = Util.paysignjs(wechatApp.appId, nonce_str, 'prepay_id='+ prepay_id,'MD5',timeStamp);
        var args = {
            appId: wechatApp.appId,
            timeStamp: timeStamp,
            nonceStr: nonce_str,
            signType: "MD5",
            package: prepay_id,
            paySign: _paySignjs,
            status:200
        };
        return args;
    }
}
async function notifypay(ctx, next) {
    console.log('@@@@@@@@@@@@@@@@@支付成功')
}

module.exports = {
    searchOrderByopenid,
    createOrder,
    orderPay,
    notifypay
};