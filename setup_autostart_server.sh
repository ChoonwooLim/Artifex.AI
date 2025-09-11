#!/bin/bash
# Pop!_OS 서버 자동 시작 설정 스크립트

echo "======================================"
echo " PopOS Worker 서버 자동 시작 설정"
echo "======================================"
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 서버 파일 확인
echo -e "${YELLOW}1. 서버 파일 확인...${NC}"
if [ -f ~/popos_worker.py ]; then
    echo -e "${GREEN}✓ popos_worker.py 발견${NC}"
else
    echo -e "${RED}✗ popos_worker.py 없음!${NC}"
    echo "서버 파일을 먼저 생성하세요"
    exit 1
fi

# 2. systemd 서비스 설치 (가장 안정적)
setup_systemd() {
    echo -e "${YELLOW}systemd 서비스로 설치 중...${NC}"
    
    # 서비스 파일 복사
    sudo cp ~/popos-worker.service /etc/systemd/system/
    
    # 권한 설정
    sudo chmod 644 /etc/systemd/system/popos-worker.service
    
    # systemd 데몬 리로드
    sudo systemctl daemon-reload
    
    # 서비스 활성화 (부팅 시 자동 시작)
    sudo systemctl enable popos-worker.service
    
    # 서비스 시작
    sudo systemctl start popos-worker.service
    
    # 상태 확인
    sleep 2
    if sudo systemctl is-active --quiet popos-worker.service; then
        echo -e "${GREEN}✓ 서비스 실행 중!${NC}"
        sudo systemctl status popos-worker.service --no-pager | head -10
    else
        echo -e "${RED}✗ 서비스 시작 실패${NC}"
        sudo journalctl -u popos-worker.service --no-pager | tail -20
    fi
}

# 3. crontab 방법 (간단함)
setup_crontab() {
    echo -e "${YELLOW}crontab으로 설치 중...${NC}"
    
    # 기존 crontab 백업
    crontab -l > /tmp/crontab.backup 2>/dev/null
    
    # 중복 확인
    if crontab -l 2>/dev/null | grep -q "popos_worker.py"; then
        echo -e "${YELLOW}이미 crontab에 등록됨${NC}"
    else
        # 새 항목 추가
        (crontab -l 2>/dev/null; echo "@reboot /usr/bin/python3 /home/stevenlim/popos_worker.py > /home/stevenlim/popos_worker.log 2>&1 &") | crontab -
        echo -e "${GREEN}✓ crontab에 추가됨${NC}"
    fi
    
    # 확인
    echo "현재 crontab:"
    crontab -l | grep popos_worker
}

# 4. 사용자 자동 시작 (GUI 로그인 필요)
setup_autostart() {
    echo -e "${YELLOW}사용자 자동 시작으로 설치 중...${NC}"
    
    # 자동 시작 디렉토리 생성
    mkdir -p ~/.config/autostart
    
    # Desktop 파일 생성
    cat > ~/.config/autostart/popos-worker.desktop << EOF
[Desktop Entry]
Type=Application
Name=PopOS GPU Worker
Exec=/usr/bin/python3 /home/stevenlim/popos_worker.py
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF
    
    echo -e "${GREEN}✓ 자동 시작 등록됨${NC}"
}

# 메뉴 표시
echo ""
echo "설치 방법을 선택하세요:"
echo "1) systemd 서비스 (권장 - 가장 안정적)"
echo "2) crontab @reboot (간단함)"
echo "3) 사용자 자동 시작 (GUI 필요)"
echo "4) 모두 설치"
echo ""
read -p "선택 [1-4]: " choice

case $choice in
    1) setup_systemd ;;
    2) setup_crontab ;;
    3) setup_autostart ;;
    4) 
        setup_systemd
        setup_crontab
        setup_autostart
        ;;
    *) echo "잘못된 선택"; exit 1 ;;
esac

echo ""
echo "======================================"
echo -e "${GREEN} 설정 완료!${NC}"
echo "======================================"
echo ""
echo "유용한 명령어:"
echo "  서비스 상태: sudo systemctl status popos-worker"
echo "  서비스 중지: sudo systemctl stop popos-worker"
echo "  서비스 시작: sudo systemctl start popos-worker"
echo "  서비스 재시작: sudo systemctl restart popos-worker"
echo "  로그 확인: sudo journalctl -u popos-worker -f"
echo "  자동 시작 해제: sudo systemctl disable popos-worker"
echo ""
echo "재부팅 후 자동으로 서버가 시작됩니다!"