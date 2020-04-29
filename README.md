## 프로젝트 세팅

ormconfig-sample.json을 복사하여 ormconfig.json 설정

typeorm global 설치

> npm install typeorm -g

## 1. 프로젝트 실행

> npm start

ts-node-dev를 이용하여 실행하기 때문에 코드 수정 후 저장을 하는 경우 자동으로 재시작됩니다.


## 2. Database migration

첫 실행시 typeorm에서 테이블을 생성하기 위하여 서버를 한번 실행시켜야 합니다.

> npm start

> npm run migration:run
- InsertDefaultUser : admin/admin 계정 생성

## 3. Generate migration

> typeorm migration:create -n PostRefactoring

위 명령어를 통해 파일 생성 후 코드 입력