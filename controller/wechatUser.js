const axios = require('axios');
const {WXBizDataCrypt} = require('../utils.js');
const dataBase = require('../dataBase/dataBase.js');
const {wechatApp} = require('../config');




var modifyUserInfo = async function(ctx, next) {//信息修改接口
    let data = ctx.request.body;
 
    dataBase.modifyUserInfo(data)
    ctx.status = 200;
    ctx.body = {
        code: 0,
        msg: 'success',
        data: null
    }
}

var searchUserInfo = async function(ctx, next) { //信息查询接口
    let openId = ctx.query.openId;
    let search = await dataBase.searchUser(openId);
    ctx.status = 200;
    ctx.body = {
        code: 0,
        msg: 'success',
        data: search
    }
}

var login = async function (ctx, next) {  //登录接口
    var encryptedData = ctx.query.encryptedData;
    var code = ctx.query.code;
    var iv = ctx.query.iv;
    console.log('*********************%%%%code', code);
    var data = await getOpenIdAndSessionKey(code);
    console.log('======================data', data.data);
    let openid = data.data.openid;
    let session_key = data.data.session_key;


    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@', openid);
    console.log('$$$$$$$$$$$$$$$$$$$$$$$$$', session_key);
    let pc = new WXBizDataCrypt(wechatApp.appId, session_key)
    console.log('^^^^^^^^^^^^^^^^^^^^^');
    let info = pc.decryptData(encryptedData , iv)
    console.log('******************************', info);

    var result = await dataBase.insertUser(info)



    var search = await dataBase.searchUser(openid)
    ctx.status = 200;
      
        ctx.body = {
            code: 0,
            msg: 'success',
            data: search
        }
}

async function getOpenIdAndSessionKey(code, encryptedData, iv) {
    return await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
            grant_type: 'authorization_code',  
            appid: wechatApp.appId, //小程序的唯一标识
            secret: wechatApp.secret, //小程序的app secret
            js_code: code // code
        }
        })
      

}

module.exports = {
    login,
    searchUserInfo,
    modifyUserInfo
};