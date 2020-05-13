# API Generator

## 개발 환경
 * nodeJS v12.16.3
 * MySQL 8.0.x

## 프로젝트 세팅

 * ormconfig-sample.json을 복사하여 ormconfig.json 설정
 * property-sample.json을 복사하여 property.json 설정
 * typeorm global 설치
   > npm install typeorm -g
 * package 설치
   > npm install

## 1. 프로젝트 실행

임시 파일 업로드를 위한 디렉토리를 생성해야 합니다.

> mkdir upload

> npm start

ts-node-dev를 이용하여 실행하기 때문에 코드 수정 후 저장을 하는 경우 자동으로 재시작됩니다.

## 2. test 실행

> npm test

test/ 디렉토리 밑에 테스트 코드 작성중입니다.

테스트와 관련된 파일은 test/filesForTest 디렉토리에 저장

테스트 코드는 mocha 와 chai를 이용하여 작성중에 있습니다.

mocha : https://mochajs.org/

chai : https://www.chaijs.com/

## 3. Database migration

첫 실행시 typeorm에서 테이블을 생성하기 위하여 서버를 한번 실행시켜야 합니다.

> npm start

> npm run migration:run
- InsertDefaultUser : admin/admin 계정 생성

## 4. Generate migration

> typeorm migration:create -n PostRefactoring

위 명령어를 통해 파일 생성 후 코드 입력