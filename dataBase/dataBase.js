const config = require("../config").config;
const mysql = require('mysql');
var connection = mysql.createConnection(config);

connection.connect();

setInterval(function () {
    connection.query('SELECT 1');
}, 5000);


connection.on('error', 
function (err) {
  if (err) {
    // 如果是连接断开，自动重新连接
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log("***连接1**");
      connection.connect();
    } else {
      console.log("***连接2**");
      console.error(err.stack || err);
    }
  }
});
/*category */
async function getAllCategory() {
    let sql = 'select * from category';
    let result = await query(sql);
    return result;
}
/* comment*/

async function getCommentList() {
    let sql = 'select * from comment';
    let result = await query(sql);
    return result;
}

/*orderDetails */

async function insertOrderDetail(productId, productQuantity, orderId) { //插入订单详情
    let product = await getProductById(productId);
    console.log('&&-------------product', product);
    let sql = `INSERT INTO orderDetails(order_id, product_id , product_name, product_price,product_quantity, seller_phone) values ('${orderId}', '${productId}', '${product.product_name}', '${product.product_price}','${productQuantity}', '${product.seller_phone}')`;
   console.log('sql:', sql);
    let result = await query(sql);
    return result;
} 

async function getOrderDetails(orderId) { //获取订单详情
    let sql = `select * from orderDetails WHERE order_id ='${orderId}'`;
    let result = await query(sql);
    return result;
} 

/*orderSummary */


async function searchOrderByopenid(openId) {
    let sql = `select * from orderSummary  WHERE user_openid='${openId}'`;
    let result = await query(sql);
    return result[0];
} 
async function createOrder(data){
    let sql = `INSERT INTO orderSummary(order_amount, user_name , user_address ,  user_phone ,  user_openid, delivery_time, pay_status) values ('${data.orderAmount}','${data.userName}', '${data.userAddress}', '${data.userPhone}','${data.userOpenid}', '${data.deliveryTime}', '${data.payStatus}')`;
    let result = await query(sql);
    return result;
}

async function orderPay(userOpenid, orderId){//订单支付
    let sql = `UPDATE orderSummary SET  pay_status='1' WHERE  order_id ='${orderId}' AND user_openid='${userOpenid}'`;
    console.log('sql', sql);
    let result = await query(sql);
    return result;
}

/*product */



//通过关键字查询商品
async function getProductBykey(key) {
  
    let sql = `select * from product where product_name like '%${key}%'`;
    let result = await query(sql);
  
    //console.log('**', result);

    if(result) {
        for(let i = 0; i < result.length; i++) {
            let pics = await getProductPic(result[i].product_id );
            
            result[i].pics = pics;
        }
    }
    return result;
}

//通过categoryId获取商品信息
async function getProductById(categoryId) {
    console.log('id', categoryId);
    let sql = `select * from product WHERE category_type ='${categoryId}'`;   
    let result = await query(sql);
    //console.log('**', result);

    if(result && result[0]) {
        for(let i = 0; i < result.length; i++) {
            let pics = await getProductPic(result[i].product_id );
            
            result[i].pics = pics;
        }
    }
    return result;
}

async function getProductList(categorys) { //获取商品列表

    for(let i = 0; i < categorys.length; i++) {
        let products = await getProductById(categorys[i].category_id);
        if(products) {
            categorys[i].products = products;
            console.log('products', products);
        }
        
       
    }
    console.log('categorys', categorys);
    return categorys;
}
/*productPicTable */

async function getProductPic(productId) {
    let sql = `select * from product_pic where productId = ${productId}`;
    let result = await query(sql);
    return result;
}

/*userTable*/
async function insertUser(data) {
    let dataInfo = await searchUser(data.openId);
    if(dataInfo.length != 0) {
        console.log(await searchUser(data.openId));
        return;//已经插入过了
    }
    var sql = `INSERT INTO usertable( user_name , user_openid, user_icon, user_gender) values ('${data.nickName}', '${data.openId}', '${data.avatarUrl}','${data.gender}')`;
    let result = await query(sql);
    return result;
}

async function modifyUserInfo(data){
    sql = `UPDATE usertable SET user_name='${data.userName}',  user_gender='${data.userGender}', user_phone='${data.userPhone}' WHERE user_openid ='${data.openId}'`;
    let result = await query(sql);
    return result;
}

async function searchUser(openId){
    var  sql = `SELECT * from usertable WHERE user_openid='${openId}'`;
    let result = await query(sql);
    return result;
}

async function query(sql) {
    return await new Promise((resolve, reject) => {
        connection.query(sql, ( err, result) => {
            if ( err ) {
                reject( err )
            } else {
               resolve(result);
               //console.log("r", result);
            }
        })  
    })
} 

module.exports = {
    insertUser, 
   // insertUserAddressAndPhone,
    searchUser,
    modifyUserInfo,
    getProductPic,
    getProductList,
    getProductById,
    getProductBykey,
    searchOrderByopenid,
    createOrder,
    orderPay,
    insertOrderDetail,
    getOrderDetails,
    getCommentList,
    getAllCategory
};