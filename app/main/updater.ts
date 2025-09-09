import { app, dialog, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';

export class AppUpdater {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    // 개발 환경이나 app이 ready 되지 않은 상태에서는 업데이트 체크 비활성화
    if (process.env.NODE_ENV === 'development' || !app.isReady()) {
      return;
    }

    try {
      // 업데이트 서버 설정
      autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'artifex-ai',
        repo: 'artifex-studio',
        private: false,
      });

      // 자동 다운로드 비활성화 (사용자 확인 후 다운로드)
      autoUpdater.autoDownload = false;
      autoUpdater.autoInstallOnAppQuit = true;

      // 업데이트 이벤트 핸들러 설정
      this.setupEventHandlers();
    } catch (error) {
      console.error('[Updater] Failed to initialize:', error);
    }
  }

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  checkForUpdates() {
    autoUpdater.checkForUpdatesAndNotify();
  }

  private setupEventHandlers() {
    // 업데이트 체크 중
    autoUpdater.on('checking-for-update', () => {
      this.sendStatusToWindow('Checking for updates...');
    });

    // 업데이트 가능
    autoUpdater.on('update-available', (info) => {
      dialog.showMessageBox(this.mainWindow!, {
        type: 'info',
        title: 'Update Available',
        message: `A new version ${info.version} is available. Current version is ${app.getVersion()}.`,
        detail: 'Would you like to download it now?',
        buttons: ['Download', 'Later'],
        defaultId: 0,
        cancelId: 1,
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
    });

    // 업데이트 없음
    autoUpdater.on('update-not-available', () => {
      this.sendStatusToWindow('You are using the latest version.');
    });

    // 다운로드 진행률
    autoUpdater.on('download-progress', (progressObj) => {
      let message = `Download speed: ${this.formatBytes(progressObj.bytesPerSecond)}/s`;
      message += ` - Downloaded ${progressObj.percent.toFixed(2)}%`;
      message += ` (${this.formatBytes(progressObj.transferred)}/${this.formatBytes(progressObj.total)})`;
      
      this.sendStatusToWindow(message);
      
      // 프로그레스 바 업데이트
      if (this.mainWindow) {
        this.mainWindow.setProgressBar(progressObj.percent / 100);
      }
    });

    // 다운로드 완료
    autoUpdater.on('update-downloaded', (info) => {
      if (this.mainWindow) {
        this.mainWindow.setProgressBar(-1); // 프로그레스 바 제거
      }

      dialog.showMessageBox(this.mainWindow!, {
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded successfully.',
        detail: `Version ${info.version} has been downloaded and will be installed after restart.`,
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1,
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });

    // 에러 처리
    autoUpdater.on('error', (error) => {
      dialog.showErrorBox('Update Error', 
        `An error occurred while updating: ${error.message}`);
      
      if (this.mainWindow) {
        this.mainWindow.setProgressBar(-1); // 프로그레스 바 제거
      }
    });
  }

  private sendStatusToWindow(text: string) {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('update-status', text);
    }
    console.log(`[Updater] ${text}`);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// 싱글톤 인스턴스 - app.whenReady() 이후에 생성하도록 수정
let appUpdaterInstance: AppUpdater | null = null;

export function getAppUpdater(): AppUpdater {
  if (!appUpdaterInstance) {
    appUpdaterInstance = new AppUpdater();
  }
  return appUpdaterInstance;
}

export const appUpdater = appUpdaterInstance;