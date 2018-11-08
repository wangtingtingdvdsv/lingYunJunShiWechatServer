/*
ALTER TABLE  usertable  modify  user_phone  varchar(32)  NULL; 更改表字段
*/
const mysql = require('mysql');
const config = require('../config');
var connection = mysql.createConnection(config);
connection.connect();

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

// async function insertUserAddressAndPhone(address, phone) {
//     var sql = `INSERT INTO usertable(user_address, user_phone) values ('${address}', '${phone}')`;
//     let result = await query(sql);
//     console.log('insert2', result);
// }

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
    modifyUserInfo
};