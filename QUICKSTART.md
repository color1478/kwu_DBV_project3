# 빠른 시작 가이드

## 1단계: Docker Compose로 MySQL 시작

```bash
docker-compose up -d
```

MySQL이 시작되면 `db/init/` 디렉토리의 SQL 파일들이 자동으로 실행됩니다.

## 2단계: 백엔드 설정

```bash
cd server
cp env.example .env
npm install
npm run dev
```

백엔드는 `http://localhost:3001`에서 실행됩니다.

## 3단계: 프론트엔드 설정 (새 터미널)

```bash
cd client
cp .env.example .env.local
npm install
npm run dev
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

## 4단계: 접속

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:3001
- Adminer (DB 관리): http://localhost:8080

## 기본 계정

시드 데이터에는 다음 계정이 포함되어 있지만, 비밀번호 해시가 실제 bcrypt 해시가 아닐 수 있습니다.

**권장**: 회원가입을 통해 새 계정을 만드세요.

또는 MySQL에 접속하여 비밀번호를 업데이트:

```sql
-- 비밀번호 해시 생성 (Node.js에서)
-- node server/scripts/generate-password-hash.js password123

-- MySQL에서 업데이트
UPDATE users SET password_hash = '생성된_해시' WHERE email = 'admin@ddarungi.com';
```

## 문제 해결

### 포트 충돌
- MySQL (3306), 백엔드 (3001), 프론트엔드 (3000), Adminer (8080) 포트가 사용 중이면 변경하세요.

### MySQL 연결 오류
```bash
docker logs ddarungi-mysql
docker-compose restart mysql
```

### 의존성 설치 오류
```bash
# Node.js 버전 확인 (v18 이상 권장)
node --version

# npm 캐시 클리어
npm cache clean --force
```

