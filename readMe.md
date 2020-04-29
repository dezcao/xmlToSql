### xmlToSql
```
백엔드를 본격적으로 구성하기 전에 sql 관련 부분을 별도로 구현.
```
- 의존 library :  mysql2, xmldoc
- 작업내용 :  xml에 쿼리별 id를 부여하고 if, foreach, choose, include를 구현하였다.
- 작업이유 : string으로 쿼리를 전달하면 쿼리 재사용이 어려웠다. 동적인 사용도 아쉽다.
- 개선 필요한 점 : 객체뿐 아니라 배열로도 받기, include의 include