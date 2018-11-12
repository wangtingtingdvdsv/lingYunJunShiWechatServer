const dishes = require('../dataBase/dishes.js');
const category = require('../dataBase/categorytable.js');

var getProductList = async function(ctx, next) { //商品列表查询
    var sort = ctx.request.query.sort;
    let categoryTable = await category.getAllCategory();
    let search = await dishes.getProductList(categoryTable);
    console.log('商品列表', search);
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

var productSearchByKey = function(ctx, next) { //商品搜索查询

}

module.exports = {
    getProductList,
    productSearchByKey
};