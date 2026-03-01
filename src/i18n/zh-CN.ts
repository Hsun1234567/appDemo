export default {
  // 底部导航栏
  tab: {
    home: '首页',
    device: '设备',
    settings: '设置',
    profile: '我的',
  },

  // 通用文本
  common: {
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    back: '返回',
    retry: '重试',
    loading: '加载中...',
    success: '操作成功',
    error: '操作失败',
    search: '搜索',
    clear: '清除',
    close: '关闭',
    done: '完成',
    noData: '暂无数据',
    loadMore: '加载更多',
    selectAll: '全选',
    batchDelete: '批量删除',
    tip: '提示',
    warning: '警告',
    unknown: '未知',
  },

  // 首页
  home: {
    title: '智能安全报警器',
    deviceStatus: '设备状态',
    connected: '已连接',
    disconnected: '未连接',
    connecting: '连接中',
    noDevice: '未配对设备',
    currentMode: '当前报警模式',
    sosButton: 'SOS 紧急求助',
    sosConfirm: '确定要触发紧急报警吗？',
    safetyTimer: '安全计时器',
    timerRunning: '计时中',
    timerRemaining: '剩余时间',
    timerNotRunning: '未启动',
    quickActions: '快捷操作',
    startTimer: '启动计时',
    fakeCall: '模拟来电',
  },

  // 设备管理页
  device: {
    title: '设备管理',
    scanButton: '扫描设备',
    scanning: '扫描中...',
    stopScan: '停止扫描',
    scanTimeout: '未发现设备',
    scanTimeoutTip: '扫描超时，未发现附近的报警器设备',
    deviceFound: '发现设备',
    signalStrength: '信号强度',
    pair: '配对',
    pairing: '配对中...',
    pairSuccess: '配对成功',
    pairFailed: '配对失败',
    pairFailedTip: '设备配对失败，请重试',
    maxDevices: '已达到最大配对数量（3个）',
    pairedDevices: '已配对设备',
    noPairedDevices: '暂无已配对设备',
    deviceDetail: '设备详情',
    connectionState: '连接状态',
    battery: '电量',
    batteryUnknown: '电量未知',
    lowBattery: '低电量警告',
    lowBatteryTip: '设备电量低于20%，请及时充电',
    firmwareVersion: '固件版本',
    firmwareUnknown: '未知版本',
    reconnect: '手动重连',
    reconnecting: '重连中...',
    reconnectFailed: '重连失败',
    reconnectFailedTip: '自动重连失败，请手动重连',
    removeDevice: '移除设备',
    removeDeviceConfirm: '确定要移除该设备吗？移除后需要重新配对。',
    bleNotEnabled: '蓝牙未开启',
    bleNotEnabledTip: '请开启蓝牙后重试',
    pairedAt: '配对时间',
  },

  // 设置页
  settings: {
    title: '安全设置',
    // 紧急联系人
    emergencyContacts: '紧急联系人',
    contactName: '姓名',
    contactPhone: '手机号码',
    contactNamePlaceholder: '请输入联系人姓名',
    contactPhonePlaceholder: '请输入11位手机号码',
    addContact: '添加联系人',
    editContact: '编辑联系人',
    deleteContact: '删除联系人',
    deleteContactConfirm: '确定要删除该联系人吗？',
    maxContacts: '最多添加5个紧急联系人',
    noContacts: '暂无紧急联系人',
    invalidPhone: '手机号码格式错误',
    invalidPhoneTip: '请输入正确的11位手机号码',
    contactSaved: '联系人已保存',
    noContactsWarning: '请先添加至少一个紧急联系人',

    // 报警短信模板
    alarmTemplate: '报警短信模板',
    editTemplate: '编辑模板',
    templatePlaceholder: '请输入报警短信内容',
    templateLength: '字符数',
    templateMaxLength: '模板长度不能超过200个字符',
    insertVariable: '插入变量',
    variableGPS: 'GPS位置',
    variableTime: '时间',
    variableUserName: '用户名',
    templateGPSTip: '建议包含位置信息以便他人定位',
    templateSaved: '模板已保存',
    defaultTemplate: '【紧急求助】我正处于危险中，当前位置：{GPS位置}，请立即联系我或报警。',
    resetTemplate: '恢复默认模板',
    resetTemplateConfirm: '确定要恢复默认模板吗？当前模板将被覆盖。',

    // 报警模式
    alarmMode: '报警模式',
    modeFull: '完整模式',
    modeFullDesc: '声光报警 + 发送短信 + 拨打电话',
    modeSilent: '静默模式',
    modeSilentDesc: '仅发送短信，不拨打电话，不触发声光',
    modeDeterrent: '震慑模式',
    modeDeterrentDesc: '仅本地声光报警，不发送远程通知',
    modeSaved: '报警模式已切换',

    // 安全计时器
    safetyTimer: '安全计时器',
    timerPresets: '预设时长',
    timerCustom: '自定义时长',
    timer15min: '15分钟',
    timer30min: '30分钟',
    timer1h: '1小时',
    timer2h: '2小时',
    timerStart: '启动计时器',
    timerCancel: '取消计时',
    timerCancelConfirm: '确定要取消安全计时器吗？',
    timerStarted: '安全计时器已启动',
    timerCancelled: '安全计时器已取消',
    timerExpiringSoon: '安全计时器即将到期',
    timerExpiringSoonTip: '安全计时器将在5分钟内到期，如安全请及时取消',
    timerExpired: '安全计时器已到期，正在触发报警',
    customMinutes: '分钟',

    // 模拟来电
    fakeCall: '模拟来电',
    fakeCallDelay: '延迟时间',
    fakeCallImmediate: '立即',
    fakeCall30s: '30秒',
    fakeCall1min: '1分钟',
    fakeCall5min: '5分钟',
    fakeCallCallerName: '来电人名称',
    fakeCallCallerNamePlaceholder: '请输入来电人名称',
    fakeCallTrigger: '触发模拟来电',
    fakeCallScheduled: '模拟来电已安排',
  },

  // 我的页面
  profile: {
    title: '我的',
    // 报警历史
    alarmHistory: '报警历史记录',
    noAlarmRecords: '暂无报警记录',
    deleteRecord: '删除记录',
    deleteRecordConfirm: '确定要删除该报警记录吗？',
    batchDeleteConfirm: '确定要删除选中的 {count} 条报警记录吗？',
    recordDeleted: '记录已删除',

    // 事件日志
    eventLogs: '设备事件日志',
    noEventLogs: '暂无事件日志',
    clearLogs: '清除日志',
    clearLogsConfirm: '确定要清除所有事件日志吗？此操作不可恢复。',
    logsCleared: '日志已清除',

    // 备份恢复
    backupRestore: '备份与恢复',
    exportBackup: '导出备份',
    importBackup: '导入备份',
    exportSuccess: '备份文件已导出',
    exportFailed: '备份导出失败',
    importSuccess: '设置已恢复',
    importFailed: '导入失败',
    invalidBackupFile: '备份文件无效',
    invalidBackupFileTip: '所选文件格式不正确或数据不完整',
    restoreConfirm: '恢复将覆盖当前所有设置，是否继续？',

    // 语言切换
    language: '语言设置',
    languageChinese: '中文',
    languageEnglish: 'English',
    languageSwitched: '语言已切换',

    // 安全知识库
    knowledgeBase: '安全知识库',

    // 关于
    about: '关于',
    version: '版本',
  },

  // 报警详情页
  alarmDetail: {
    title: '报警详情',
    triggerTime: '触发时间',
    location: '位置信息',
    locationUnavailable: '位置获取失败',
    latitude: '纬度',
    longitude: '经度',
    address: '地址',
    alarmMode: '报警模式',
    contactsNotified: '通知的联系人',
    noContactsNotified: '未通知联系人',
    stepResults: '执行步骤',
    stepSuccess: '成功',
    stepFailed: '失败',
    stepGPS: '获取GPS位置',
    stepReadContacts: '读取联系人',
    stepSendSMS: '发送短信',
    stepMakeCall: '拨打电话',
    stepSaveRecord: '保存记录',
    stepNotification: '发送通知',
    deviceId: '触发设备',
    failureReason: '失败原因',
  },

  // 模拟来电页
  fakeCall: {
    title: '模拟来电',
    incomingCall: '来电',
    answer: '接听',
    decline: '挂断',
    calling: '通话中...',
    callEnded: '通话结束',
  },

  // 安全知识库页
  knowledge: {
    title: '安全知识库',
    searchPlaceholder: '搜索安全知识...',
    noResults: '未找到相关文章',
    categoryAll: '全部',
    categoryTravel: '出行安全',
    categoryHome: '居家安全',
    categoryEmergency: '应急自救',
    articleCount: '{count} 篇文章',
  },

  // 组件文本
  components: {
    // DeviceCard
    deviceCard: {
      connected: '已连接',
      disconnected: '已断开',
      connecting: '连接中',
      battery: '电量 {percent}%',
      signal: '信号 {rssi}dBm',
    },
    // ContactItem
    contactItem: {
      call: '拨打',
      edit: '编辑',
      delete: '删除',
    },
    // AlarmRecordItem
    alarmRecordItem: {
      modeFull: '完整模式',
      modeSilent: '静默模式',
      modeDeterrent: '震慑模式',
      locationUnknown: '位置未知',
      viewDetail: '查看详情',
    },
    // CountdownTimer
    countdownTimer: {
      hours: '时',
      minutes: '分',
      seconds: '秒',
      expired: '已到期',
    },
  },

  // 报警模式名称（通用）
  alarmMode: {
    full: '完整模式',
    silent: '静默模式',
    deterrent: '震慑模式',
  },

  // 事件类型名称
  eventType: {
    ble_connected: '蓝牙已连接',
    ble_disconnected: '蓝牙已断开',
    ble_reconnect_attempt: '蓝牙重连尝试',
    battery_change: '电量变化',
    alarm_triggered: '报警触发',
    firmware_read: '固件版本读取',
  },

  // 连接状态
  connectionState: {
    connected: '已连接',
    disconnected: '已断开',
    connecting: '连接中',
  },

  // 错误消息
  errors: {
    networkError: '网络错误',
    bluetoothNotAvailable: '蓝牙不可用',
    bluetoothNotEnabled: '请开启蓝牙',
    locationPermissionDenied: '定位权限被拒绝',
    locationFailed: '定位失败',
    smsFailed: '短信发送失败',
    callFailed: '电话拨打失败',
    storageFull: '存储空间不足',
    storageError: '存储错误',
    permissionDenied: '权限被拒绝',
    permissionDeniedTip: '请在系统设置中授予相关权限',
    unknownError: '未知错误',
  },

  // 确认对话框
  dialogs: {
    deleteTitle: '确认删除',
    clearTitle: '确认清除',
    restoreTitle: '确认恢复',
    alarmTitle: '确认报警',
    cancelTimerTitle: '取消计时器',
  },

  // 空状态
  empty: {
    noDevices: '暂无设备',
    noDevicesTip: '点击扫描按钮搜索附近的报警器',
    noContacts: '暂无联系人',
    noContactsTip: '添加紧急联系人以启用报警功能',
    noRecords: '暂无记录',
    noRecordsTip: '报警记录将在此处显示',
    noLogs: '暂无日志',
    noLogsTip: '设备事件日志将在此处显示',
    noArticles: '暂无文章',
    noSearchResults: '未找到匹配的结果',
  },
}
