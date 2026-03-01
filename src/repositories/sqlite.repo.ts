/**
 * SQLite 仓库 - 报警记录与事件日志的持久化存储
 *
 * App 端使用 plus.sqlite 原生 API 操作 SQLite 数据库
 * H5 端降级为 uni.setStorage 实现
 */
import type { AlarmRecord, EventLog } from '@/models/types'

export interface ISQLiteRepository {
  init(): Promise<void>
  insertAlarmRecord(record: AlarmRecord): Promise<void>
  getAlarmRecords(page: number, pageSize: number): Promise<AlarmRecord[]>
  deleteAlarmRecords(ids: string[]): Promise<void>
  getAlarmRecordCount(): Promise<number>
  pruneAlarmRecords(maxCount: number): Promise<void>
  insertEventLog(log: EventLog): Promise<void>
  getEventLogs(page: number, pageSize: number): Promise<EventLog[]>
  clearEventLogs(): Promise<void>
  pruneEventLogs(maxCount: number): Promise<void>
}

const DB_NAME = 'safety_alarm'
const DB_PATH = '_doc/safety_alarm.db'

const ALARM_RECORDS_KEY = 'sqlite_alarm_records'
const EVENT_LOGS_KEY = 'sqlite_event_logs'

// ─── Helper: row → AlarmRecord ───
function rowToAlarmRecord(row: Record<string, unknown>): AlarmRecord {
  return {
    id: row.id as string,
    triggeredAt: row.triggered_at as number,
    location:
      row.latitude != null && row.longitude != null
        ? {
            latitude: row.latitude as number,
            longitude: row.longitude as number,
            address: (row.address as string) || undefined,
            timestamp: row.triggered_at as number,
          }
        : null,
    alarmMode: row.alarm_mode as AlarmRecord['alarmMode'],
    contactsNotified: JSON.parse(row.contacts_notified as string),
    stepResults: JSON.parse(row.step_results as string),
    deviceId: row.device_id as string,
  }
}

// ─── Helper: row → EventLog ───
function rowToEventLog(row: Record<string, unknown>): EventLog {
  return {
    id: row.id as string,
    timestamp: row.timestamp as number,
    eventType: row.event_type as EventLog['eventType'],
    description: row.description as string,
    deviceId: (row.device_id as string) || undefined,
  }
}

// ─── Helper: escape SQL string values ───
function esc(value: string | undefined | null): string {
  if (value == null) return 'NULL'
  return `'${String(value).replace(/'/g, "''")}'`
}

// ─── plus.sqlite promise wrappers ───

function openDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    plus.sqlite.openDatabase({
      name: DB_NAME,
      path: DB_PATH,
      success: () => resolve(),
      fail: (e: unknown) => reject(e),
    })
  })
}

function executeSql(sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    plus.sqlite.executeSql({
      name: DB_NAME,
      sql: [sql],
      success: () => resolve(),
      fail: (e: unknown) => reject(e),
    })
  })
}

function selectSql(sql: string): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    plus.sqlite.selectSql({
      name: DB_NAME,
      sql,
      success: (rows: Record<string, unknown>[]) => resolve(rows ?? []),
      fail: (e: unknown) => reject(e),
    })
  })
}

// ─── App 端 SQLite 实现 ───

const sqliteAppRepo: ISQLiteRepository = {
  async init(): Promise<void> {
    await openDatabase()
    await executeSql(
      `CREATE TABLE IF NOT EXISTS alarm_records (
        id TEXT PRIMARY KEY,
        triggered_at INTEGER NOT NULL,
        latitude REAL,
        longitude REAL,
        address TEXT,
        alarm_mode TEXT NOT NULL CHECK(alarm_mode IN ('full', 'silent', 'deterrent')),
        contacts_notified TEXT NOT NULL,
        step_results TEXT NOT NULL,
        device_id TEXT NOT NULL
      )`
    )
    await executeSql(
      `CREATE INDEX IF NOT EXISTS idx_alarm_records_time ON alarm_records(triggered_at DESC)`
    )
    await executeSql(
      `CREATE TABLE IF NOT EXISTS event_logs (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        description TEXT NOT NULL,
        device_id TEXT
      )`
    )
    await executeSql(
      `CREATE INDEX IF NOT EXISTS idx_event_logs_time ON event_logs(timestamp DESC)`
    )
  },

  async insertAlarmRecord(record: AlarmRecord): Promise<void> {
    const sql = `INSERT OR REPLACE INTO alarm_records
      (id, triggered_at, latitude, longitude, address, alarm_mode, contacts_notified, step_results, device_id)
      VALUES (
        ${esc(record.id)},
        ${record.triggeredAt},
        ${record.location?.latitude ?? 'NULL'},
        ${record.location?.longitude ?? 'NULL'},
        ${esc(record.location?.address)},
        ${esc(record.alarmMode)},
        ${esc(JSON.stringify(record.contactsNotified))},
        ${esc(JSON.stringify(record.stepResults))},
        ${esc(record.deviceId)}
      )`
    await executeSql(sql)
  },

  async getAlarmRecords(page: number, pageSize: number): Promise<AlarmRecord[]> {
    const offset = (page - 1) * pageSize
    const rows = await selectSql(
      `SELECT * FROM alarm_records ORDER BY triggered_at DESC LIMIT ${pageSize} OFFSET ${offset}`
    )
    return rows.map(rowToAlarmRecord)
  },

  async deleteAlarmRecords(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const inClause = ids.map((id) => esc(id)).join(',')
    await executeSql(`DELETE FROM alarm_records WHERE id IN (${inClause})`)
  },

  async getAlarmRecordCount(): Promise<number> {
    const rows = await selectSql(`SELECT COUNT(*) as cnt FROM alarm_records`)
    return (rows[0]?.cnt as number) ?? 0
  },

  async pruneAlarmRecords(maxCount: number): Promise<void> {
    await executeSql(
      `DELETE FROM alarm_records WHERE id NOT IN (
        SELECT id FROM alarm_records ORDER BY triggered_at DESC LIMIT ${maxCount}
      )`
    )
  },

  async insertEventLog(log: EventLog): Promise<void> {
    const sql = `INSERT OR REPLACE INTO event_logs
      (id, timestamp, event_type, description, device_id)
      VALUES (
        ${esc(log.id)},
        ${log.timestamp},
        ${esc(log.eventType)},
        ${esc(log.description)},
        ${esc(log.deviceId)}
      )`
    await executeSql(sql)
  },

  async getEventLogs(page: number, pageSize: number): Promise<EventLog[]> {
    const offset = (page - 1) * pageSize
    const rows = await selectSql(
      `SELECT * FROM event_logs ORDER BY timestamp DESC LIMIT ${pageSize} OFFSET ${offset}`
    )
    return rows.map(rowToEventLog)
  },

  async clearEventLogs(): Promise<void> {
    await executeSql(`DELETE FROM event_logs`)
  },

  async pruneEventLogs(maxCount: number): Promise<void> {
    await executeSql(
      `DELETE FROM event_logs WHERE id NOT IN (
        SELECT id FROM event_logs ORDER BY timestamp DESC LIMIT ${maxCount}
      )`
    )
  },
}

// ─── H5 端 Storage 降级实现 ───

function getStorageData<T>(key: string): Promise<T[]> {
  return new Promise((resolve) => {
    uni.getStorage({
      key,
      success: (res) => resolve((res.data as T[]) ?? []),
      fail: () => resolve([]),
    })
  })
}

function setStorageData<T>(key: string, data: T[]): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.setStorage({
      key,
      data,
      success: () => resolve(),
      fail: (err) => reject(err),
    })
  })
}

const sqliteH5Repo: ISQLiteRepository = {
  async init(): Promise<void> {
    // H5 端无需初始化数据库，Storage 自动可用
  },

  async insertAlarmRecord(record: AlarmRecord): Promise<void> {
    const records = await getStorageData<AlarmRecord>(ALARM_RECORDS_KEY)
    const idx = records.findIndex((r) => r.id === record.id)
    if (idx >= 0) {
      records[idx] = record
    } else {
      records.push(record)
    }
    await setStorageData(ALARM_RECORDS_KEY, records)
  },

  async getAlarmRecords(page: number, pageSize: number): Promise<AlarmRecord[]> {
    const records = await getStorageData<AlarmRecord>(ALARM_RECORDS_KEY)
    records.sort((a, b) => b.triggeredAt - a.triggeredAt)
    const offset = (page - 1) * pageSize
    return records.slice(offset, offset + pageSize)
  },

  async deleteAlarmRecords(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    const records = await getStorageData<AlarmRecord>(ALARM_RECORDS_KEY)
    await setStorageData(
      ALARM_RECORDS_KEY,
      records.filter((r) => !idSet.has(r.id))
    )
  },

  async getAlarmRecordCount(): Promise<number> {
    const records = await getStorageData<AlarmRecord>(ALARM_RECORDS_KEY)
    return records.length
  },

  async pruneAlarmRecords(maxCount: number): Promise<void> {
    const records = await getStorageData<AlarmRecord>(ALARM_RECORDS_KEY)
    if (records.length <= maxCount) return
    records.sort((a, b) => b.triggeredAt - a.triggeredAt)
    await setStorageData(ALARM_RECORDS_KEY, records.slice(0, maxCount))
  },

  async insertEventLog(log: EventLog): Promise<void> {
    const logs = await getStorageData<EventLog>(EVENT_LOGS_KEY)
    const idx = logs.findIndex((l) => l.id === log.id)
    if (idx >= 0) {
      logs[idx] = log
    } else {
      logs.push(log)
    }
    await setStorageData(EVENT_LOGS_KEY, logs)
  },

  async getEventLogs(page: number, pageSize: number): Promise<EventLog[]> {
    const logs = await getStorageData<EventLog>(EVENT_LOGS_KEY)
    logs.sort((a, b) => b.timestamp - a.timestamp)
    const offset = (page - 1) * pageSize
    return logs.slice(offset, offset + pageSize)
  },

  async clearEventLogs(): Promise<void> {
    await setStorageData(EVENT_LOGS_KEY, [])
  },

  async pruneEventLogs(maxCount: number): Promise<void> {
    const logs = await getStorageData<EventLog>(EVENT_LOGS_KEY)
    if (logs.length <= maxCount) return
    logs.sort((a, b) => b.timestamp - a.timestamp)
    await setStorageData(EVENT_LOGS_KEY, logs.slice(0, maxCount))
  },
}

// ─── 导出：根据平台自动选择实现 ───

function isAppPlus(): boolean {
  return typeof plus !== 'undefined' && plus.sqlite != null
}

export const sqliteRepository: ISQLiteRepository = isAppPlus()
  ? sqliteAppRepo
  : sqliteH5Repo
