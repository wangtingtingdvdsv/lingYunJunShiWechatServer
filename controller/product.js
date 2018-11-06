const dishes = require('../dataBase/dishes.js');

var getProductList = async function(ctx, next) { //商品列表查询
    var sort = ctx.request.query.sort;
    let search = await dishes.getProductList(sort);
    console.log('商品列表', search);
    ctx.status = 200;
    ctx.body = {
        code: 0,
        msg: 'success',
        data: search
    }
}

var productSearchByKey = function(ctx, next) { //商品搜索查询

}

module.exports = {
    getProductList,
    productSearchByKey
};