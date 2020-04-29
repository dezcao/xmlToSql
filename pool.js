// 작성중...
let xmldoc = require('./xmldoc_1.1.0.js');
const mysql = require('mysql2');
// conn.beginTransaction(CB);
// conn.commit(); : Transcation 변경 확정
// conn.rollback(); : Transcation 복구
class Pool {
	constructor(confing) {
		mysql.escape();
		const pool = mysql.createPool(confing);
		this.pool = pool.promise();
	}
	
	get pool () {
		return this.pool;
	}

	async doQueryFile (fileName, sqlId, queryParam) {
		let query = await xmldoc.queryParser(fileName, sqlId, queryParam);
		console.log(query);
		
		let connection  = await this.pool.getConnection();
		connection.config.namedPlaceholders = true;
		let result = await connection.query(query, queryParam);
		console.log(result);

		return result;
	}
}
module.exports = Pool;
// export default 이름없이 내보내기. 
// - import 시 괄호가 없어도 값이 저절로 저장된다. 변수명도 마음대로 받아오기 가능.
//   하나의 모듈에서는 한개의 export default만 가능하다.
// // 기본 내보내기
// export default function() {}
// // 기본 클래스 내보내기
// export default class {}

// Module.exports 모듈 객체에 담아서 보내면 이름 변경 x, 변경하려면 as를 붙여야 한다.
//  - 모듈이란 관련된 코드들을 하나의 코드 단위로 캡슐화 하는 것.
//    exports 와 module.exports 가 같은 객체를 참조한다. 따라서 다음은 같다.
// 예) exports.이름, module.exports 내부에서 선언한 이름
// exports.sayHelloInEnglish = function() {
// 	return "HELLO";
// };
// module.exports = {
// 	sayHelloInEnglish: function() {
// 		return "HELLO";
// 	}
// };
// 외부에서 require를 사용해서 내보낸 함수들을 받아줄 수 있게된다.