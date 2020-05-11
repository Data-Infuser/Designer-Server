# KONG API Gateway Docker
 
## 실행 (하단의 Installation을 통해 1회 이상 실행한 경우)
```
docker run kong-database
docker run kong
docker run pantsel/konga
```

## KONG Installation:

### Reference:
* https://hub.docker.com/_/kong
* https://github.com/Kong/kong


### 1 . Docker Network 생성:
```
docker network create kong-net
```
생성된 kong-net 확인:
```
docker network ls
```

### 2 . Postgresql DB Container 시작:
 * Data 가 없는 DB deploy 시: `postgres:9.6`는 docker image name
 ```
 docker run -d -it --name kong-database \
        --network=kong-net \
        -p 5432:5432 \
        -e "POSTGRES_USER=kong" \
        -e "POSTGRES_PASSWORD=kong" \
        -e "POSTGRES_DB=kong" \
        postgres:9.6
 ```

### 3-1. Kong DB 생성 및 initial migration: 
 `*Data 백업된 postgresql이 아닐 경우에만 진행.`
 ```
 docker run --rm \
         --link kong-database:kong-database \
         --network=kong-net \
         -e "KONG_DATABASE=postgres" \
         -e "KONG_PG_HOST=kong-database" \
         -e "KONG_PG_USER=kong" \
         -e "KONG_PG_PASSWORD=kong" \
         kong kong migrations bootstrap
 ```

### 3-2. Kong Container 시작
 ```
 docker run -d --name kong \
     --network=kong-net \
     -e "KONG_DATABASE=postgres" \
     -e "KONG_PG_HOST=kong-database" \
     -e "KONG_PG_USER=kong" \
     -e "KONG_PG_PASSWORD=kong" \
     -e "KONG_PROXY_ACCESS_LOG=/dev/stdout" \
     -e "KONG_ADMIN_ACCESS_LOG=/dev/stdout" \
     -e "KONG_PROXY_ERROR_LOG=/dev/stderr" \
     -e "KONG_ADMIN_ERROR_LOG=/dev/stderr" \
     -e "KONG_ADMIN_LISTEN=0.0.0.0:8001, 0.0.0.0:8444 ssl" \
     -p 8000:8000 \
     -p 8443:8443 \
     -p 8001:8001 \
     -p 8444:8444 \
     kong:latest
 ```
### 4-1. KONGA DB initial migration:
 `**Data 백업된 postgresql이 아닐 경우에만 진행.`
 ```
 docker run --rm \
        --network=kong-net \
        pantsel/konga -c prepare -a postgres -u postgresql://kong@kong-database:5432/konga_db
 ```
### 4-2. KONGA Container 시작:
 ```
 docker run -p 1337:1337 \
         --network=kong-net \
         -e "DB_ADAPTER=postgres" \
         -e "DB_HOST=kong-database" \
         -e "DB_USER=kong" \
         -e "DB_PASSWORD=kong" \
         -e "DB_DATABASE=kong" \
         -e "KONGA_HOOK_TIMEOUT=120000" \
         -e "NODE_ENV=production" \
         --name konga \
         pantsel/konga
 ```
        