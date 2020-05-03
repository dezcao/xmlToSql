// let Pool = require('./pool.js');
const mysql = require('mysql2');
let xmldoc = require('./xmldoc_2.2.2.js');
let config = {
    host: 'localhost',
    user: 'root',
    database: 'test',
    password: '1111',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}


var fileName = 'user.xml';
var sqlId = 'getUserTest'; // getUser
var queryParam = {
    user_id: 1,
    user_name: 'jaepl',
    company: {
        id: 'x',
        name: 'Tiang Wei'
    },
    pagination: {
        start: 1,
        end: 10
    },
    girl: {
        friends: [
            { name: 'Song Hye Gyo', age: 38 , pan: [ {name: 'goo', age: 15}, {name: 'park', age: 25} ]},
            { name: 'Seo Hyeon', age: 28, pan: [ {name: 'goo2', age: 19}, {name: 'park2', age: 25} ] },
            { name: 'IU', age: 18, pan: [ {name: 'goo3', age: 16}, {name: 'park3', age: 25} ] },
            { name: 'park', age: 48, pan: [ {name: 'goo4', age: 17}, {name: 'park4', age: 25} ] }
        ]
    }
}

async function test() {
    let query = await xmldoc.queryParser(fileName, sqlId, queryParam);
    const connection = mysql.createConnection(config);
    connection.config.namedPlaceholders = true;
    connection.query(
        query,
        queryParam,
        function(err, results, fields) {
          console.log(results); // results contains rows returned by server
        }
    );
}

test().catch(err => {
    console.error(err);
});


