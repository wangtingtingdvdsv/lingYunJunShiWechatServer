const mysql = require('mysql');
const config = require('../config');
var connection = mysql.createConnection(config);
connection.connect();


//通过productedId获取商品信息
async function getProductById(productedId) {
    let sql = `select * from dishes WHERE product_id='${productedId}'`;   
    let result = await query(sql);
    return result[0];
}

async function getProductList(sort) { //获取商品列表
    let sql = 'select * from dishes';
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
    getProductList,
    getProductById
};