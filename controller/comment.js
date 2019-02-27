const dataBase = require('../dataBase/dataBase.js');

async function searchCommentByProductId(ctx, next) { //商品评价查询
 
}
async function createComment(ctx, next) { //商品评价创建
    
}
async function getCommentList(ctx, next) { //订单评论查询
    let search = await dataBase.getCommentList();
   
    ctx.status = 200;
    ctx.body = {
        code: 0,
        msg: 'success',
        data: search
    }
}

module.exports = {
    searchCommentByProductId,
    createComment,
    getCommentList
};