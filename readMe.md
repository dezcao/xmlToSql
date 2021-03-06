### xmlToSql
```
백엔드를 본격적으로 구성하기 전에 sql parser 구현.

database config 적용하거나 해당 부분 주석처리 후에 다음을 실행. 
node poolTest.js
```
- library :  mysql2, xmldoc
- 작업내용 :  xml에 쿼리별 id를 부여하고 if, foreach, choose, include를 구현하였다.
- 작업이유 : string으로 쿼리를 전달하면 쿼리 재사용이 어려웠다. 동적인 사용도 아쉽다.

#### 1.1.0
- library :  mysql2, xmldoc
- 작업내용 : xml에 쿼리별 id를 부여하고 if, foreach, choose, include를 구현.

#### 2.2.2
- Array 가능
- include 기능확장
- 버그픽스 객체키로 호출할때 스트링 값을 바꾸지 않도록
- eval 제거 : https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/eval
```
eval을 절대 사용하지 말 것!
eval()은 인자로 받은 코드를 caller의 권한으로 수행하는 위험한 함수입니다. 

악의적인 영향을 받았을 수 있는 문자열을 eval()로 실행한다면, 
당신의 웹페이지나 확장 프로그램의 권한으로 사용자의 기기에서 악의적인 코드를 수행하는 결과를 초래할 수 있습니다. 

또한, 제3자 코드가 eval()이 호출된 위치의 스코프를 볼 수 있으며, 
이를 이용해 비슷한 함수인 Function으로는 실현할 수 없는 공격이 가능합니다.

또한 최신 JS 엔진에서 여러 코드 구조를 최적화하는 것과 달리 
eval()은 JS 인터프리터를 사용해야 하기 때문에 다른 대안들보다 느립니다.

추가로, 최신 JavaScript 인터프리터는 자바스크립트를 기계 코드로 변환합니다. 
즉, 변수명의 개념이 완전히 없어집니다. 

그러나 eval을 사용하면 브라우저는 기계 코드에 해당 변수가 있는지 확인하고 
값을 대입하기 위해 길고 무거운 변수명 검색을 수행해야 합니다. 

또한 eval()을 통해 자료형 변경 등 변수에 변화가 일어날 수 있으며, 
브라우저는 이에 대응하기 위해 기계 코드를 재작성해야 합니다.
```

### 사용예
```
<select id="getUser">
	SELECT * FROM user
	<if test="user_id == 1">
		WHERE user_id = :user_id
		<if test="company.id == 'x' and company.name">
			AND company_id = :company.id
		</if>
		<if test="1 == 1 ">
			AND condition = 'type1'
		</if>
		<if test="girl">
			AND girl.friends[0].age == 38
		</if>
		<choose>
			<when test="user_name == 'xxx'">
				AND user_name = :user_name
			</when>
			<when test="company.name != 'Tiang Wei'">
				AND 'when Tiang Weei' == 'Tiang Wei'
			</when>
			<otherwise>
				<if test="company.id == 'x' and company.name">
					AND company_id = 'x'
				</if>
					AND company_type = 'xType'
			</otherwise>
		</choose>
		<foreach item="item" index="index" collection="girl.friends" open="AND (" separator="," close=")">
			#{ item.name }, #{ item.pan[0].name }
			<if test="item.name == 'IU'">
				, iu age is #{ item.age }
			</if>
		</foreach>
	</if>

	<include refid="tailQuery">
		<property name="orderByColumn" value="user_id"/>
		<property name="direction" value="ASC"/>
		<property name="start" value="pagination.start"/>
		<property name="end" value="pagination.end"/>
	</include>			
</select>
```

