// 跨裝置同步管理器
import { useSettingsStore } from '@/store/settingsStore'
import { useAppStore } from '@/store/appStore'

interface SyncResult {
  conflict?: boolean
  serverVersion?: number
  clientVersion?: number
  lastSyncAt?: string
  success?: boolean
  version?: number
  conflictResolved?: boolean
}

export class SyncManager {
  private static instance: SyncManager
  private isInitialized = false

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  // 初始化同步 - 在用戶登入後調用
  async initializeSync(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('Initializing cross-device sync...')

      // 並行載入設定和應用狀態
      await Promise.all([
        this.loadSettingsFromServer(),
        this.loadAppStateFromServer(),
      ])

      this.isInitialized = true
      console.log('Cross-device sync initialized successfully')

      // 設定定期同步（每5分鐘）
      this.setupPeriodicSync()

    } catch (error) {
      console.error('Failed to initialize sync:', error)
      // 不阻擋應用啟動，即使同步失敗
    }
  }

  // 載入設定從服務器
  private async loadSettingsFromServer(): Promise<void> {
    try {
      const settingsStore = useSettingsStore.getState()

      // 總是先從服務器載入最新資料
      await settingsStore.loadFromServer()

      // 如果本地有未同步的資料，嘗試合併
      if (settingsStore.lastSyncAt) {
        try {
          const syncResult = await settingsStore.syncToServer() as SyncResult
          if (syncResult?.conflict) {
            console.warn('Settings conflict detected after loading from server')
            // 重新從服務器載入以解決衝突
            await settingsStore.loadFromServer()
          }
        } catch (syncError) {
          console.warn('Failed to sync local settings to server:', syncError)
          // 同步失敗時保留服務器資料
        }
      }
    } catch (error) {
      console.warn('Failed to sync settings:', error)
      // 設定載入失敗不阻擋應用運行
    }
  }

  // 載入應用狀態從服務器
  private async loadAppStateFromServer(): Promise<void> {
    try {
      const appStore = useAppStore.getState()

      // 總是先從服務器載入最新資料
      await appStore.loadFromServer()

      // 如果本地有未同步的資料，嘗試合併
      if (appStore.lastSyncAt) {
        try {
          const syncResult = await appStore.syncToServer() as SyncResult
          if (syncResult?.conflict) {
            console.warn('App state conflict detected after loading from server')
            // 重新從服務器載入以解決衝突
            await appStore.loadFromServer()
          }
        } catch (syncError) {
          console.warn('Failed to sync local app state to server:', syncError)
          // 同步失敗時保留服務器資料
        }
      }
    } catch (error) {
      console.warn('Failed to sync app state:', error)
      // 應用狀態載入失敗不阻擋應用運行
    }
  }

  // 設定定期同步
  private setupPeriodicSync(): void {
    const SYNC_INTERVAL = 5 * 60 * 1000 // 5分鐘

    setInterval(async () => {
      try {
        const [settingsResult, appStateResult] = await Promise.all([
          useSettingsStore.getState().syncToServer(),
          useAppStore.getState().syncToServer(),
        ]) as [SyncResult, SyncResult]

        // 處理衝突 - 如果有衝突，自動載入服務器版本
        if (settingsResult?.conflict) {
          console.warn('Periodic sync: Settings conflict detected, loading from server')
          await useSettingsStore.getState().loadFromServer()
        }

        if (appStateResult?.conflict) {
          console.warn('Periodic sync: App state conflict detected, loading from server')
          await useAppStore.getState().loadFromServer()
        }

        console.log('Periodic sync completed')
      } catch (error) {
        console.warn('Periodic sync failed:', error)
      }
    }, SYNC_INTERVAL)
  }

  // 手動觸發完整同步
  async manualSync(): Promise<{ settingsConflict?: boolean; appStateConflict?: boolean }> {
    try {
      console.log('Manual sync started...')

      const [settingsResult, appStateResult] = await Promise.all([
        useSettingsStore.getState().syncToServer(),
        useAppStore.getState().syncToServer(),
      ]) as [SyncResult, SyncResult]

      // 處理衝突
      let settingsConflict = false
      let appStateConflict = false

      if (settingsResult?.conflict) {
        console.warn('Manual sync: Settings conflict detected')
        settingsConflict = true
      }

      if (appStateResult?.conflict) {
        console.warn('Manual sync: App state conflict detected')
        appStateConflict = true
      }

      console.log('Manual sync completed')
      return { settingsConflict, appStateConflict }
    } catch (error) {
      console.error('Manual sync failed:', error)
      throw error
    }
  }

  // 重置同步狀態（用於登出）
  async reset(): Promise<void> {
    try {
      console.log('Resetting sync and syncing data to server...')

      // 在登出前，嘗試同步所有本地數據到服務器
      await Promise.all([
        useSettingsStore.getState().syncToServer(),
        useAppStore.getState().syncToServer(),
      ])

      this.isInitialized = false
      console.log('Sync manager reset and data synced to server')
    } catch (error) {
      console.warn('Failed to sync data before logout:', error)
      // 即使同步失敗也要重置狀態
      this.isInitialized = false
    }
  }

  // 獲取同步狀態
  getSyncStatus(): {
    settingsStatus: string
    appStateStatus: string
    isInitialized: boolean
  } {
    const settingsStore = useSettingsStore.getState()
    const appStore = useAppStore.getState()

    return {
      settingsStatus: settingsStore.syncStatus,
      appStateStatus: appStore.syncStatus,
      isInitialized: this.isInitialized,
    }
  }
}

// 導出單例實例
export const syncManager = SyncManager.getInstance()

// 便捷函數
export const initializeSync = () => syncManager.initializeSync()
export const manualSync = () => syncManager.manualSync()
export const resetSync = () => syncManager.reset()
export const getSyncStatus = () => syncManager.getSyncStatus()
