# MySQL 연결 오류 해결 방법

## 문제: "Unable to connect to 127.0.0.1:3306"

MySQL 서비스가 중지되어 있습니다. 다음 방법으로 해결하세요.

## 해결 방법 1: 관리자 권한으로 서비스 시작

### PowerShell을 관리자 권한으로 실행:
1. Windows 키 누르기
2. "PowerShell" 검색
3. "Windows PowerShell" 우클릭 → "관리자 권한으로 실행"
4. 다음 명령 실행:

```powershell
cd C:\Users\이제호\Desktop\DBV-project3
Start-Service -Name "DBMySQL80"
```

### 또는 서비스 관리자에서:
1. Windows 키 + R
2. `services.msc` 입력
3. "MySQL80" 또는 "DBMySQL80" 찾기
4. 우클릭 → "시작"

## 해결 방법 2: MySQL 명령줄로 직접 시작

관리자 권한 PowerShell에서:

```powershell
# MySQL 설치 경로로 이동 (일반적으로)
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"

# MySQL 서버 시작
.\mysqld.exe --install
net start MySQL80
```

## 해결 방법 3: MySQL Workbench에서 연결 설정 확인

1. MySQL Workbench 실행
2. 좌측 "MySQL Connections"에서 연결 설정 확인
3. Connection Method를 "Standard (TCP/IP)"로 설정
4. Hostname: `127.0.0.1` 또는 `localhost`
5. Port: `3306`
6. Username: `root` (또는 설치 시 설정한 사용자)
7. Password: 설치 시 설정한 비밀번호

## 해결 방법 4: MySQL 재설치 (최후의 수단)

만약 위 방법이 모두 실패하면:
1. MySQL 완전 제거
2. MySQL 8.0 재설치
3. 설치 시 Windows Service로 등록 확인

## 확인 방법

서비스가 시작되면:

```powershell
Get-Service -Name "*mysql*"
```

Status가 "Running"이어야 합니다.

## 연결 테스트

MySQL Workbench에서:
- Host: `127.0.0.1` 또는 `localhost`
- Port: `3306`
- Username: `root`
- Password: 설치 시 설정한 비밀번호

