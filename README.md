# Designer-Server
> ``Data Infuser`` / Designer-Server 프로젝트 입니다.

Data Infuser 프로젝트에서 REST API를 통해 파일 데이터, Database 정보를 통해 데이터를 API로 자동 변환을 해주는 기능을 맡는 모듈입니다.

모든 기능은 REST API 형태로 제공되어, 간단하게 사용 할 수 있습니다.

## Environment
 * nodeJS v12.16.3
 * MySQL 8.0.x

## Installation

 * ormconfig-sample.json을 복사하여 ormconfig.json 설정
 * property-sample.json을 복사하여 property.json 설정
 * typeorm global 설치
   > npm install typeorm -g
 * tsoa global 설치
   > npm install tsoa -g
 * package 설치
   > npm install

## Usage

임시 파일 업로드를 위한 디렉토리를 생성해야 합니다.

> mkdir upload

> npm start

ts-node-dev를 이용하여 실행하기 때문에 코드 수정 후 저장을 하는 경우 자동으로 재시작됩니다.

## How to run TEST

> npm test

test/ 디렉토리 밑에 테스트 코드 작성중입니다.

테스트와 관련된 파일은 test/filesForTest 디렉토리에 저장

테스트 코드는 mocha 와 chai를 이용하여 작성중에 있습니다.

mocha : https://mochajs.org/

chai : https://www.chaijs.com/

## Database migration

첫 실행시 typeorm에서 테이블을 생성하기 위하여 서버를 한번 실행시켜야 합니다.

> npm start

> npm run migration:run
- InsertDefaultUser : admin/admin 계정 생성

## Drop Schema

DB 구조가 변경되어 기존 사용하던 DB Schema와 맞지 않아 오류가 생기는 경우가 있습니다.

운영단계에서는 DB migration을 사용하는 것이 바람직하지만, 

개발 단계에서는 TypeOrm의 Sync를 사용하고 있기 때문에 DB migration을 사용하지 않고 있습니다.

> npm run schema:drop

명령어를 통하여 전체 table을 drop할 수 있습니다. 이후 3. database migration 을 다시 실행하면 됩니다.

## Generate migration

> typeorm migration:create -n PostRefactoring

위 명령어를 통해 파일 생성 후 코드 입력

## BUILD and RUN For Production env

ts-node를 운영으로 사용하기에는, 메모리 점유, deploy후 빌드 시간 등 적합하지 않은 부분들이 확인되어 js로 빌드 후 실행

> npm run build

./build 에 js로 빌드된 결과물이 저장됩니다.

배포시 js로 빌드된 프로젝트를 배포

## DEPLOY

> cp property-sample.json property-stage

스테이지용 property 파일 생성 후 값 설정

> npm run deploy-stage

* Stage 서버 접근 권한이 필요합니다.

## API Documentation

OAS 3.0 기준 문서를 아래 경로에서 확인 가능합니다.

/api-docs

## Meta

Promptechnology - [@Homepage](http://www.promptech.co.kr/) - [promptech@promptech.co.kr](promptech@promptech.co.kr)

프로젝트는 아파치 2.0 라이센스로 배포되었습니다. 자세한 사항은 ``LICENSE`` 파일을 확인해주세요.

Distributed under the Apache 2.0 license. See ``LICENSE`` for more information.

## Support
![alt text](http://wisepaip.org/assets/home/promptech-d8574a0910561aaea077bc759b1cf94c07baecc551f034ee9c7e830572d671de.png "Title Text")
