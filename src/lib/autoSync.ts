export type AutoSyncTask = () => Promise<void>

interface AutoSyncOptions {
  delay?: number
  taskName?: string
}

export function createAutoSyncScheduler(task: AutoSyncTask, options: AutoSyncOptions = {}) {
  const { delay = 800, taskName = 'auto-sync' } = options

  let timeout: ReturnType<typeof setTimeout> | null = null
  let inFlight = false
  let pending = false

  const run = async () => {
    timeout = null

    if (inFlight) {
      pending = true
      return
    }

    inFlight = true
    pending = false
    try {
      await task()
    } catch (error) {
      console.error(`[${taskName}] failed:`, error)
    } finally {
      inFlight = false
      if (pending) {
        schedule()
      }
    }
  }

  const schedule = () => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(run, delay)
  }

  return () => {
    pending = true
    schedule()
  }
}
