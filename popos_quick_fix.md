# Pop!_OS 패스워드 2번 입력 문제 빠른 해결법

## 🎯 가장 간단한 해결법 (5분 소요)

### 방법 1: 자동 로그인 설정 (두 번째 패스워드만 생략)
SSH로 Pop!_OS 연결 후:

```bash
# 1. 설정 파일 열기
sudo nano /etc/gdm3/custom.conf

# 2. [daemon] 섹션 아래에 추가:
AutomaticLoginEnable = true
AutomaticLogin = stevenlim

# 3. 저장 (Ctrl+O, Enter, Ctrl+X)

# 4. 재부팅
sudo reboot
```

**결과**: 
- ✅ 첫 번째 패스워드(디스크): 여전히 입력
- ✅ 두 번째 패스워드(로그인): 자동 통과

---

## 🚀 고급 해결법 (두 패스워드 모두 생략)

### 방법 2: TPM 자동 복호화 (BIOS에서 TPM 2.0 필요)

```bash
# 1. TPM 확인
ls /sys/class/tpm/

# 2. TPM이 있다면 설정
sudo apt install systemd-cryptsetup
sudo systemd-cryptenroll --tpm2-device=auto --tpm2-pcrs=7 /dev/nvme0n1p3

# 3. crypttab 수정
sudo nano /etc/crypttab
# 라인 끝에 추가: ,tpm2-device=auto

# 4. 업데이트
sudo update-initramfs -u
sudo reboot
```

### 방법 3: 네트워크 부팅 (항상 네트워크 연결된 경우)

```bash
# Windows 머신을 Tang 서버로 사용
# 1. Pop!_OS에 Clevis 설치
sudo apt install clevis-luks

# 2. 바인딩 (패스워드 한 번 입력 필요)
sudo clevis luks bind -d /dev/nvme0n1p3 tang '{"url":"http://10.0.0.1:7500"}'

# 3. 재부팅
sudo reboot
```

---

## ⚡ 즉시 적용 가능한 임시 방법

### 빠른 재부팅 (패스워드 저장)
```bash
# .bashrc에 추가
echo "alias quickboot='echo Jiyeon71391796! | sudo -S reboot'" >> ~/.bashrc
source ~/.bashrc

# 사용: quickboot
```

### Wake-on-LAN 설정 (원격 부팅)
```bash
# Pop!_OS에서
sudo apt install ethtool
sudo ethtool -s enp5s0 wol g
echo 'SUBSYSTEM=="net", ACTION=="add", DRIVERS=="?*", ATTR{address}=="MAC주소", RUN+="/usr/sbin/ethtool -s $name wol g"' | sudo tee /etc/udev/rules.d/50-wol.rules

# Windows에서 원격 부팅
powershell -Command "Send-WakeOnLan -MacAddress 'XX:XX:XX:XX:XX:XX'"
```

---

## 🔒 보안 vs 편의성 트레이드오프

| 방법 | 보안성 | 편의성 | 추천도 |
|------|--------|--------|--------|
| 현재 상태 (2번 입력) | ⭐⭐⭐⭐⭐ | ⭐ | 보안 중요시 |
| 자동 로그인만 | ⭐⭐⭐⭐ | ⭐⭐⭐ | **균형 추천** |
| TPM 자동화 | ⭐⭐⭐ | ⭐⭐⭐⭐ | 현대적 방법 |
| 키파일 | ⭐⭐ | ⭐⭐⭐⭐⭐ | 집에서만 |
| 암호화 제거 | ⭐ | ⭐⭐⭐⭐⭐ | 비추천 |

---

## 📌 추천 설정

**집/사무실 고정 PC**: 자동 로그인 + TPM
**노트북**: 현재 상태 유지 (보안 중요)
**개발 서버**: 자동 로그인만

---

## 🆘 문제 발생 시

```bash
# 자동 로그인 취소
sudo nano /etc/gdm3/custom.conf
# AutomaticLoginEnable = false 로 변경

# TPM 제거
sudo systemd-cryptenroll --wipe-slot=tpm2 /dev/nvme0n1p3
```