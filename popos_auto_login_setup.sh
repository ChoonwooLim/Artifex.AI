#!/bin/bash
# Pop!_OS 자동 로그인 설정 스크립트
# SSH로 Pop!_OS에 연결 후 실행

echo "=================================="
echo " Pop!_OS 자동 부팅 설정 도구"
echo "=================================="
echo ""

# 옵션 1: 사용자 자동 로그인만 설정 (권장)
setup_auto_login() {
    echo "1. 자동 로그인 설정 중..."
    
    # GDM 자동 로그인 설정
    sudo tee /etc/gdm3/custom.conf > /dev/null << 'EOF'
[daemon]
# Enabling automatic login
AutomaticLoginEnable = true
AutomaticLogin = stevenlim

# Enabling timed login
TimedLoginEnable = true
TimedLogin = stevenlim
TimedLoginDelay = 3

[security]

[xdmcp]

[chooser]

[debug]
EOF

    echo "✓ GDM 자동 로그인 설정 완료"
}

# 옵션 2: TPM 기반 디스크 자동 복호화 (TPM 2.0 필요)
setup_tpm_unlock() {
    echo "2. TPM 자동 복호화 설정 확인..."
    
    # TPM 확인
    if [ -d /sys/class/tpm/tpm0 ]; then
        echo "✓ TPM 2.0 감지됨"
        
        # systemd-cryptenroll 설치
        sudo apt-get update
        sudo apt-get install -y systemd-cryptsetup
        
        # TPM에 키 등록
        echo "TPM에 복호화 키 등록..."
        echo "다음 명령어를 실행하세요:"
        echo "sudo systemd-cryptenroll --tpm2-device=auto /dev/nvme0n1p3"
        echo ""
        echo "그 다음 /etc/crypttab 파일을 수정:"
        echo "sudo nano /etc/crypttab"
        echo "추가: tpm2-device=auto,tpm2-pcrs=7"
    else
        echo "✗ TPM이 없거나 비활성화됨"
        echo "  BIOS에서 TPM 2.0을 활성화하세요"
    fi
}

# 옵션 3: 키파일 방식 (보안 낮음, 간편함)
setup_keyfile_unlock() {
    echo "3. 키파일 자동 복호화 설정..."
    echo "⚠️  경고: 보안이 약해집니다!"
    
    # 키파일 생성
    sudo dd if=/dev/urandom of=/root/keyfile bs=512 count=4
    sudo chmod 600 /root/keyfile
    
    echo "키파일을 LUKS에 추가..."
    echo "다음 명령어 실행 후 현재 패스워드 입력:"
    echo "sudo cryptsetup luksAddKey /dev/nvme0n1p3 /root/keyfile"
    echo ""
    echo "/etc/crypttab 수정:"
    echo "cryptdata UUID=xxx none luks,discard"
    echo "를 다음으로 변경:"
    echo "cryptdata UUID=xxx /root/keyfile luks,discard"
    
    echo ""
    echo "initramfs 업데이트:"
    echo "sudo update-initramfs -u"
}

# 옵션 4: Clevis (네트워크 기반)
setup_clevis() {
    echo "4. Clevis 네트워크 자동 복호화..."
    
    sudo apt-get update
    sudo apt-get install -y clevis clevis-luks clevis-initramfs
    
    echo "Tang 서버가 필요합니다 (별도 서버)"
    echo "설정 방법:"
    echo "sudo clevis luks bind -d /dev/nvme0n1p3 tang '{\"url\":\"http://tang-server\"}'"
}

# 현재 설정 확인
check_current_setup() {
    echo "현재 설정 확인..."
    echo ""
    
    # 암호화된 디스크 확인
    echo "암호화된 디스크:"
    lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT | grep -E "crypt|luks"
    echo ""
    
    # 자동 로그인 상태
    echo "자동 로그인 상태:"
    if grep -q "AutomaticLoginEnable = true" /etc/gdm3/custom.conf 2>/dev/null; then
        echo "✓ 자동 로그인 활성화됨"
    else
        echo "✗ 자동 로그인 비활성화됨"
    fi
    echo ""
}

# 메인 메뉴
echo "선택하세요:"
echo "1) 자동 로그인만 설정 (두 번째 패스워드 생략) - 권장"
echo "2) TPM 자동 복호화 (첫 번째 패스워드 생략)"
echo "3) 키파일 자동 복호화 (보안 주의)"
echo "4) Clevis 네트워크 복호화"
echo "5) 현재 설정 확인"
echo "6) 종료"
echo ""
read -p "선택 [1-6]: " choice

case $choice in
    1) setup_auto_login ;;
    2) setup_tpm_unlock ;;
    3) setup_keyfile_unlock ;;
    4) setup_clevis ;;
    5) check_current_setup ;;
    6) exit 0 ;;
    *) echo "잘못된 선택" ;;
esac

echo ""
echo "=================================="
echo "설정 완료!"
echo "재부팅 후 적용됩니다: sudo reboot"
echo "=================================="