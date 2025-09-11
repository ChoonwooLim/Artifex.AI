# PopOS Worker 연결 문제 해결 가이드

## 🔴 재부팅 후 연결이 안 되는 경우

### 즉시 해결 방법
```batch
# 1. 서버 수동 실행
start_worker.bat

# 또는
python popos_worker_local.py
```

### 자동 시작 설정
```batch
# 관리자 권한으로 실행
setup_autostart.bat
```

## 🟡 일반적인 문제와 해결법

### 1. **서버가 실행되지 않음**
**증상**: `ERR_CONNECTION_REFUSED` 오류
**해결**:
- `start_worker.bat` 실행
- 또는 터미널에서: `python popos_worker_local.py`

### 2. **포트 8000이 이미 사용 중**
**증상**: `[Errno 10048] Only one usage of each socket address`
**해결**:
```batch
# 포트 사용 프로세스 찾기
netstat -ano | findstr :8000

# 프로세스 종료 (PID를 실제 값으로 변경)
taskkill /F /PID <PID>
```

### 3. **방화벽이 차단함**
**증상**: 서버는 실행되지만 연결 안 됨
**해결**:
```batch
# 관리자 권한으로 실행
netsh advfirewall firewall add rule name="PopOS Worker" dir=in action=allow protocol=TCP localport=8000
```

### 4. **Python이 설치되지 않음**
**증상**: `'python' is not recognized`
**해결**:
- Python 3.8+ 설치: https://python.org
- PATH에 Python 추가

### 5. **WSL 네트워크 문제**
**증상**: WSL 사용 시 연결 문제
**해결**:
```batch
# WSL 재시작
wsl --shutdown
wsl

# Windows에서 WSL IP 확인
wsl hostname -I
```

## 🔧 진단 도구

### 빠른 진단
```batch
diagnose_connection.bat
```

### 수동 확인
```batch
# 1. 포트 확인
netstat -an | findstr :8000

# 2. Python 확인
python --version

# 3. 방화벽 확인
netsh advfirewall firewall show rule name="PopOS Worker"

# 4. 서버 테스트
curl http://localhost:8000/
```

## 📝 체크리스트

재부팅 후 확인 사항:
- [ ] `start_worker.bat` 실행했는가?
- [ ] 포트 8000이 열려있는가?
- [ ] 방화벽 규칙이 있는가?
- [ ] Python이 PATH에 있는가?
- [ ] localhost:8000에 접속되는가?

## 🚀 영구 해결책

### 옵션 1: 시작 프로그램에 추가
1. `Win + R` → `shell:startup`
2. `start_worker.bat` 바로가기 생성

### 옵션 2: 작업 스케줄러
1. `setup_autostart.bat` 관리자 실행
2. 옵션 3 선택 (Scheduled Task)

### 옵션 3: Windows 서비스
1. `pip install pywin32`
2. `python worker_service.py install`
3. `net start PopOSWorker`

## 💡 팁

- **개발 중**: 수동 실행 권장 (로그 확인 가능)
- **프로덕션**: 자동 시작 설정 권장
- **디버깅**: `diagnose_connection.bat` 사용

## 🆘 여전히 안 되는 경우

1. Windows 재시작
2. 바이러스 백신 임시 비활성화
3. 다른 포트 사용:
   ```python
   # popos_worker_local.py 수정
   port = 8001  # 8000 대신
   ```
4. 로그 확인:
   ```batch
   python popos_worker_local.py > server.log 2>&1
   ```