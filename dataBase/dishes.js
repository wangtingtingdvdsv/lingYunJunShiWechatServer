const mysql = require('mysql');
const config = require('../config');
const picTable = require('./productPicTable.js');
var connection = mysql.createConnection(config);
connection.connect();


//通过productedId获取商品信息
async function getProductById(categoryId) {
    console.log('id', categoryId);
    let sql = `select * from dishes WHERE category_type ='${categoryId}'`;   
    let result = await query(sql);
    console.log('**', result);

    if(result && result[0]) {
        for(let i = 0; i < result.length; i++) {
            let pics = await picTable.getProductPic(result[i].product_id );
            
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