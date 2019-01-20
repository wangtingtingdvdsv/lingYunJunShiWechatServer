const dataBase = require('../dataBase/dataBase.js');

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
    if(!(data.userOpenid || data.orderId)) {
        return;
    }
    await dataBase.orderPay(data.userOpenid, data.orderId);
    ctx.status = 200;
    ctx.body = {
        code: 0,
        msg: 'success',
        data: null
    }
}

module.exports = {
    searchOrderByopenid,
    createOrder,
    orderPay
};