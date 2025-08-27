# Wan2.2 Electron 앱 설정 가이드

## 1. 앱 실행
```bash
cd D:\XX-v01\app
npm start
```

## 2. 앱에서 설정할 항목

### Python 경로
- **Python Path**: `python` 또는 `C:\Users\choon\AppData\Local\Programs\Python\Python312\python.exe`
- "Validate Python" 버튼 클릭해서 확인

### Script 경로  
- **Script Path**: `D:\XX-v01\Wan2.2\generate.py`
- "Pick" 버튼으로 선택 가능

### 체크포인트 경로 (모델별)
- **TI2V-5B** (추천): `D:\XX-v01\Wan2.2-TI2V-5B`
- **T2V-A14B**: `D:\XX-v01\Wan2.2-T2V-A14B`
- **I2V-A14B**: `D:\XX-v01\Wan2.2-I2V-A14B`

### RTX 3090 최적 설정
- **Model**: TI2V-5B
- **Resolution**: 1280×704
- **Offload Model**: ✅ 체크
- **Convert Dtype**: ✅ 체크
- **T5 CPU**: ✅ 체크
- **Steps**: 20 (빠른 테스트) / 50 (고품질)
- **Length**: 3-5초 (테스트용)

## 3. 실행 순서
1. 앱 실행 (`npm start`)
2. Python 경로 설정 → Validate
3. Script 경로 설정 (generate.py)
4. Checkpoint 경로 설정 (Auto Detect 버튼 사용 가능)
5. 프롬프트 입력
6. Run 버튼 클릭

## 4. 예상 시간 (RTX 3090)
- TI2V-5B, 720P, 5초, 20 steps: 약 5-7분
- TI2V-5B, 720P, 5초, 50 steps: 약 9-12분

## 5. 문제 해결
- 로그 창에서 에러 확인
- GPU 메모리 부족: Steps 줄이기, Length 줄이기
- 모델 로딩 실패: 체크포인트 경로 확인