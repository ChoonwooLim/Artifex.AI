# Pop!_OS 자동 로그인 설정 PowerShell 스크립트

Write-Host "================================" -ForegroundColor Cyan
Write-Host " Pop!_OS 자동 로그인 설정 중..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Pop!_OS에 연결 중..." -ForegroundColor Yellow

# SSH 명령 실행 (패스워드 필요)
$sshCommand = @"
echo 'Jiyeon71391796!' | sudo -S bash ~/setup_autologin.sh
"@

# SSH 실행
ssh stevenlim@10.0.0.2 $sshCommand

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host " 설정 완료!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "다음 명령으로 재부팅하세요:" -ForegroundColor Yellow
Write-Host "ssh stevenlim@10.0.0.2 'sudo reboot'" -ForegroundColor White
Write-Host ""
Write-Host "재부팅 후:" -ForegroundColor Cyan
Write-Host "- 첫 번째 패스워드 (디스크 암호화): 여전히 입력 필요" -ForegroundColor White
Write-Host "- 두 번째 패스워드 (로그인): 자동으로 통과됩니다!" -ForegroundColor Green