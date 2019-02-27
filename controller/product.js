const dataBase = require('../dataBase/dataBase.js');

var getProductList = async function(ctx, next) { //商品列表查询
    var sort = ctx.request.query.sort;
    let category = await dataBase.getAllCategory();
    let search = await dataBase.getProductList(category);
    
    let products = search.filter(function(categoryProducts) {
        return categoryProducts.products;
    })
    ctx.status = 200;
    ctx.body = {
        code: 0,
        msg: 'success',
        data: products
    }
}

var productSearchByKey = async function(ctx, next) { //商品搜索查询
 
    let key = ctx.request.query.key;
 
    if(key == '') {
        return;
    }
    let products = await dataBase.getProductBykey(key);

    ctx.status = 200;
    ctx.body = {
        code: 0,
        msg: 'success',
        data: products
    }
}

module.exports = {
    getProductList,
    productSearchByKey
};