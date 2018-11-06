const mysql = require('mysql');
const config = require('../config');
const dishesTable = require('./dishes');
var connection = mysql.createConnection(config);
connection.connect();

async function insertOrderDetail(productId, productQuantity, orderId) { //插入订单详情
    let product = await dishesTable.getProductById(productId);
    console.log('product', product);
    let sql = `INSERT INTO orderdetails(order_id, product_id , product_name, product_icon, product_price,product_quantity, seller_phone) values ('${orderId}', '${productId}', '${product.product_name}','${product.product_icon}', '${product.product_price}','${productQuantity}', '${product.seller_phone}')`;
   console.log('sql:', sql);
    let result = await query(sql);
    return result;
} 

async function getOrderDetails(orderId) { //获取订单详情
    let sql = `select * from orderdetails WHERE order_id ='${orderId}'`;
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
    insertOrderDetail,
    getOrderDetails
};