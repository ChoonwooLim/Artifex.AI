; Custom NSIS script for Artifex AI Studio installer

!macro customInit
  ; Check for Python installation
  nsExec::ExecToStack '"python" "--version"'
  Pop $0
  Pop $1
  ${If} $0 != 0
    MessageBox MB_YESNO "Python is not installed. Artifex AI Studio requires Python 3.10 or higher.$\n$\nWould you like to download Python now?" IDYES download_python
    Goto skip_python
    download_python:
      ExecShell "open" "https://www.python.org/downloads/"
    skip_python:
  ${EndIf}

  ; Check for CUDA
  IfFileExists "$PROGRAMFILES\NVIDIA GPU Computing Toolkit\CUDA\v12.4\bin\nvcc.exe" cuda_found cuda_not_found
  cuda_not_found:
    MessageBox MB_ICONINFORMATION "CUDA 12.4 is recommended for optimal performance.$\n$\nYou can install it later from NVIDIA website."
  cuda_found:
!macroend

!macro customInstall
  ; Create Python virtual environment
  DetailPrint "Setting up Python environment..."
  nsExec::ExecToLog '"$INSTDIR\resources\wan22\setup_venv.bat"'
  
  ; Set environment variables
  DetailPrint "Setting environment variables..."
  WriteRegStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "WAN_FORCE_FP16" "1"
  WriteRegStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "WAN_COMPILE" "1"
  WriteRegStr HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "PYTORCH_CUDA_ALLOC_CONF" "expandable_segments:True"
  
  ; Notify system of environment variable changes
  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=5000
  
  ; Create additional shortcuts
  CreateShortcut "$DESKTOP\Artifex AI Studio.lnk" "$INSTDIR\Artifex AI Studio.exe" "" "$INSTDIR\resources\app\icon.ico"
  CreateDirectory "$SMPROGRAMS\Artifex AI Studio"
  CreateShortcut "$SMPROGRAMS\Artifex AI Studio\Artifex AI Studio.lnk" "$INSTDIR\Artifex AI Studio.exe"
  CreateShortcut "$SMPROGRAMS\Artifex AI Studio\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
!macroend

!macro customUnInstall
  ; Remove environment variables
  DeleteRegValue HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "WAN_FORCE_FP16"
  DeleteRegValue HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "WAN_COMPILE"
  DeleteRegValue HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment" "PYTORCH_CUDA_ALLOC_CONF"
  
  ; Remove shortcuts
  Delete "$DESKTOP\Artifex AI Studio.lnk"
  RMDir /r "$SMPROGRAMS\Artifex AI Studio"
  
  ; Clean up Python virtual environment
  RMDir /r "$INSTDIR\resources\wan22\venv"
!macroend

!macro customInstallMode
  ; Force per-machine installation for all users
  StrCpy $installMode "all"
!macroend