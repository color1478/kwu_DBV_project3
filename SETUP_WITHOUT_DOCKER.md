# Docker 없이 실행하는 방법

## 1단계: MySQL 8.0 설치

1. MySQL 공식 사이트에서 MySQL 8.0 다운로드 및 설치
   - https://dev.mysql.com/downloads/mysql/
   - Windows용 MySQL Installer 다운로드

2. 설치 시 다음 설정:
   - Root 비밀번호 설정 (기억해두세요)
   - Port: 3306 (기본값)
   - Windows Service로 설치

## 2단계: 데이터베이스 및 사용자 생성

MySQL에 접속 (MySQL Workbench 또는 명령줄):

```sql
-- 데이터베이스 생성
CREATE DATABASE ddarungi_db;

-- 사용자 생성
CREATE USER 'ddarungi_user'@'localhost' IDENTIFIED BY 'ddarungi_pass';

-- 권한 부여
GRANT ALL PRIVILEGES ON ddarungi_db.* TO 'ddarungi_user'@'localhost';
FLUSH PRIVILEGES;
```

## 3단계: 스키마 및 시드 데이터 실행

MySQL Workbench에서 또는 명령줄에서:

```bash
# 명령줄 사용 시
mysql -u ddarungi_user -p ddarungi_db < db/init/01_schema.sql
mysql -u ddarungi_user -p ddarungi_db < db/init/02_seed.sql
```

또는 MySQL Workbench에서:
1. `db/init/01_schema.sql` 파일 열기
2. 실행 (Execute)
3. `db/init/02_seed.sql` 파일 열기
4. 실행 (Execute)

## 4단계: 백엔드 서버 시작

```powershell
cd server
npm run dev
```

## 5단계: 프론트엔드 서버 시작 (새 터미널)

```powershell
cd client
npm run dev
```

## 접속

- 프론트엔드: http://localhost:3000
- 백엔드: http://localhost:3001

## 문제 해결

### MySQL 연결 오류

`server/.env` 파일 확인:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=ddarungi_user
DB_PASSWORD=ddarungi_pass
DB_NAME=ddarungi_db
```

### 포트 3306이 이미 사용 중인 경우

MySQL이 다른 포트를 사용한다면 `.env` 파일의 `DB_PORT`를 변경하세요.

