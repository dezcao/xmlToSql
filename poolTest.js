// let Pool = require('./pool.js');
const mysql = require('mysql2');
let xmldoc = require('./xmldoc_1.1.0.js');
let config = {
    host: 'localhost',
    user: 'root',
    database: 'test',
    password: '1111',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}
const connection = mysql.createConnection(config);
connection.config.namedPlaceholders = true;

var fileName = 'user.xml';
var sqlId = 'getUserTest';
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
            { name: 'Song Hye Gyo', age: 38 },
            { name: 'Seo Hyeon', age: 28 },
            { name: 'IU', age: 18 },
            { name: 'park', age: 48 }
        ]
    }
}

async function test() {
    let query = await xmldoc.queryParser(fileName, sqlId, queryParam);
    console.log(query);
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

test();


