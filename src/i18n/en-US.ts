export default {
  // Tab bar
  tab: {
    home: 'Home',
    device: 'Device',
    settings: 'Settings',
    profile: 'Profile',
  },

  // Common text
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    back: 'Back',
    retry: 'Retry',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    search: 'Search',
    clear: 'Clear',
    close: 'Close',
    done: 'Done',
    noData: 'No Data',
    loadMore: 'Load More',
    selectAll: 'Select All',
    batchDelete: 'Batch Delete',
    tip: 'Tip',
    warning: 'Warning',
    unknown: 'Unknown',
  },

  // Home page
  home: {
    title: 'Smart Safety Alarm',
    deviceStatus: 'Device Status',
    connected: 'Connected',
    disconnected: 'Disconnected',
    connecting: 'Connecting',
    noDevice: 'No Paired Device',
    currentMode: 'Current Alarm Mode',
    sosButton: 'SOS Emergency',
    sosConfirm: 'Are you sure you want to trigger an emergency alarm?',
    safetyTimer: 'Safety Timer',
    timerRunning: 'Running',
    timerRemaining: 'Time Remaining',
    timerNotRunning: 'Not Started',
    quickActions: 'Quick Actions',
    startTimer: 'Start Timer',
    fakeCall: 'Fake Call',
  },

  // Device management page
  device: {
    title: 'Device Management',
    scanButton: 'Scan Devices',
    scanning: 'Scanning...',
    stopScan: 'Stop Scan',
    scanTimeout: 'No Devices Found',
    scanTimeoutTip: 'Scan timed out. No alarm devices found nearby.',
    deviceFound: 'Device Found',
    signalStrength: 'Signal Strength',
    pair: 'Pair',
    pairing: 'Pairing...',
    pairSuccess: 'Paired Successfully',
    pairFailed: 'Pairing Failed',
    pairFailedTip: 'Device pairing failed. Please try again.',
    maxDevices: 'Maximum paired devices reached (3)',
    pairedDevices: 'Paired Devices',
    noPairedDevices: 'No Paired Devices',
    deviceDetail: 'Device Details',
    connectionState: 'Connection Status',
    battery: 'Battery',
    batteryUnknown: 'Battery Unknown',
    lowBattery: 'Low Battery Warning',
    lowBatteryTip: 'Device battery is below 20%. Please charge soon.',
    firmwareVersion: 'Firmware Version',
    firmwareUnknown: 'Unknown Version',
    reconnect: 'Reconnect',
    reconnecting: 'Reconnecting...',
    reconnectFailed: 'Reconnect Failed',
    reconnectFailedTip: 'Auto-reconnect failed. Please reconnect manually.',
    removeDevice: 'Remove Device',
    removeDeviceConfirm: 'Are you sure you want to remove this device? You will need to pair again.',
    bleNotEnabled: 'Bluetooth Not Enabled',
    bleNotEnabledTip: 'Please enable Bluetooth and try again.',
    pairedAt: 'Paired At',
  },

  // Settings page
  settings: {
    title: 'Safety Settings',
    // Emergency contacts
    emergencyContacts: 'Emergency Contacts',
    contactName: 'Name',
    contactPhone: 'Phone Number',
    contactNamePlaceholder: 'Enter contact name',
    contactPhonePlaceholder: 'Enter 11-digit phone number',
    addContact: 'Add Contact',
    editContact: 'Edit Contact',
    deleteContact: 'Delete Contact',
    deleteContactConfirm: 'Are you sure you want to delete this contact?',
    maxContacts: 'Maximum 5 emergency contacts',
    noContacts: 'No Emergency Contacts',
    invalidPhone: 'Invalid Phone Number',
    invalidPhoneTip: 'Please enter a valid 11-digit phone number.',
    contactSaved: 'Contact Saved',
    noContactsWarning: 'Please add at least one emergency contact first.',

    // Alarm SMS template
    alarmTemplate: 'Alarm SMS Template',
    editTemplate: 'Edit Template',
    templatePlaceholder: 'Enter alarm SMS content',
    templateLength: 'Characters',
    templateMaxLength: 'Template cannot exceed 200 characters.',
    insertVariable: 'Insert Variable',
    variableGPS: 'GPS Location',
    variableTime: 'Time',
    variableUserName: 'Username',
    templateGPSTip: 'It is recommended to include location info for others to locate you.',
    templateSaved: 'Template Saved',
    defaultTemplate: '[EMERGENCY] I am in danger. My current location: {GPS Location}. Please contact me or call the police immediately.',
    resetTemplate: 'Reset to Default',
    resetTemplateConfirm: 'Are you sure you want to reset to the default template? The current template will be overwritten.',

    // Alarm mode
    alarmMode: 'Alarm Mode',
    modeFull: 'Full Mode',
    modeFullDesc: 'Sound & light alarm + Send SMS + Make calls',
    modeSilent: 'Silent Mode',
    modeSilentDesc: 'Send SMS only. No calls, no sound or light.',
    modeDeterrent: 'Deterrent Mode',
    modeDeterrentDesc: 'Local sound & light alarm only. No remote notifications.',
    modeSaved: 'Alarm mode switched',

    // Safety timer
    safetyTimer: 'Safety Timer',
    timerPresets: 'Preset Duration',
    timerCustom: 'Custom Duration',
    timer15min: '15 min',
    timer30min: '30 min',
    timer1h: '1 hour',
    timer2h: '2 hours',
    timerStart: 'Start Timer',
    timerCancel: 'Cancel Timer',
    timerCancelConfirm: 'Are you sure you want to cancel the safety timer?',
    timerStarted: 'Safety timer started',
    timerCancelled: 'Safety timer cancelled',
    timerExpiringSoon: 'Safety timer expiring soon',
    timerExpiringSoonTip: 'Safety timer will expire in 5 minutes. Cancel if you are safe.',
    timerExpired: 'Safety timer expired. Triggering alarm.',
    customMinutes: 'minutes',

    // Fake call
    fakeCall: 'Fake Call',
    fakeCallDelay: 'Delay',
    fakeCallImmediate: 'Immediate',
    fakeCall30s: '30 sec',
    fakeCall1min: '1 min',
    fakeCall5min: '5 min',
    fakeCallCallerName: 'Caller Name',
    fakeCallCallerNamePlaceholder: 'Enter caller name',
    fakeCallTrigger: 'Trigger Fake Call',
    fakeCallScheduled: 'Fake call scheduled',
  },

  // Profile page
  profile: {
    title: 'Profile',
    // Alarm history
    alarmHistory: 'Alarm History',
    noAlarmRecords: 'No Alarm Records',
    deleteRecord: 'Delete Record',
    deleteRecordConfirm: 'Are you sure you want to delete this alarm record?',
    batchDeleteConfirm: 'Are you sure you want to delete the selected {count} alarm records?',
    recordDeleted: 'Record deleted',

    // Event logs
    eventLogs: 'Device Event Logs',
    noEventLogs: 'No Event Logs',
    clearLogs: 'Clear Logs',
    clearLogsConfirm: 'Are you sure you want to clear all event logs? This action cannot be undone.',
    logsCleared: 'Logs cleared',

    // Backup & restore
    backupRestore: 'Backup & Restore',
    exportBackup: 'Export Backup',
    importBackup: 'Import Backup',
    exportSuccess: 'Backup file exported',
    exportFailed: 'Backup export failed',
    importSuccess: 'Settings restored',
    importFailed: 'Import failed',
    invalidBackupFile: 'Invalid Backup File',
    invalidBackupFileTip: 'The selected file has an incorrect format or incomplete data.',
    restoreConfirm: 'Restoring will overwrite all current settings. Continue?',

    // Language switch
    language: 'Language',
    languageChinese: '中文',
    languageEnglish: 'English',
    languageSwitched: 'Language switched',

    // Knowledge base
    knowledgeBase: 'Safety Knowledge Base',

    // About
    about: 'About',
    version: 'Version',
  },

  // Alarm detail page
  alarmDetail: {
    title: 'Alarm Details',
    triggerTime: 'Trigger Time',
    location: 'Location',
    locationUnavailable: 'Location Unavailable',
    latitude: 'Latitude',
    longitude: 'Longitude',
    address: 'Address',
    alarmMode: 'Alarm Mode',
    contactsNotified: 'Contacts Notified',
    noContactsNotified: 'No Contacts Notified',
    stepResults: 'Execution Steps',
    stepSuccess: 'Success',
    stepFailed: 'Failed',
    stepGPS: 'Get GPS Location',
    stepReadContacts: 'Read Contacts',
    stepSendSMS: 'Send SMS',
    stepMakeCall: 'Make Call',
    stepSaveRecord: 'Save Record',
    stepNotification: 'Send Notification',
    deviceId: 'Trigger Device',
    failureReason: 'Failure Reason',
  },

  // Fake call page
  fakeCall: {
    title: 'Fake Call',
    incomingCall: 'Incoming Call',
    answer: 'Answer',
    decline: 'Decline',
    calling: 'On Call...',
    callEnded: 'Call Ended',
  },

  // Knowledge base page
  knowledge: {
    title: 'Safety Knowledge Base',
    searchPlaceholder: 'Search safety knowledge...',
    noResults: 'No articles found',
    categoryAll: 'All',
    categoryTravel: 'Travel Safety',
    categoryHome: 'Home Safety',
    categoryEmergency: 'Emergency Rescue',
    articleCount: '{count} articles',
  },

  // Component text
  components: {
    // DeviceCard
    deviceCard: {
      connected: 'Connected',
      disconnected: 'Disconnected',
      connecting: 'Connecting',
      battery: 'Battery {percent}%',
      signal: 'Signal {rssi}dBm',
    },
    // ContactItem
    contactItem: {
      call: 'Call',
      edit: 'Edit',
      delete: 'Delete',
    },
    // AlarmRecordItem
    alarmRecordItem: {
      modeFull: 'Full Mode',
      modeSilent: 'Silent Mode',
      modeDeterrent: 'Deterrent Mode',
      locationUnknown: 'Location Unknown',
      viewDetail: 'View Details',
    },
    // CountdownTimer
    countdownTimer: {
      hours: 'h',
      minutes: 'm',
      seconds: 's',
      expired: 'Expired',
    },
  },

  // Alarm mode names (shared)
  alarmMode: {
    full: 'Full Mode',
    silent: 'Silent Mode',
    deterrent: 'Deterrent Mode',
  },

  // Event type names
  eventType: {
    ble_connected: 'Bluetooth Connected',
    ble_disconnected: 'Bluetooth Disconnected',
    ble_reconnect_attempt: 'Bluetooth Reconnect Attempt',
    battery_change: 'Battery Change',
    alarm_triggered: 'Alarm Triggered',
    firmware_read: 'Firmware Version Read',
  },

  // Connection state
  connectionState: {
    connected: 'Connected',
    disconnected: 'Disconnected',
    connecting: 'Connecting',
  },

  // Error messages
  errors: {
    networkError: 'Network Error',
    bluetoothNotAvailable: 'Bluetooth Not Available',
    bluetoothNotEnabled: 'Please Enable Bluetooth',
    locationPermissionDenied: 'Location Permission Denied',
    locationFailed: 'Location Failed',
    smsFailed: 'SMS Sending Failed',
    callFailed: 'Call Failed',
    storageFull: 'Storage Full',
    storageError: 'Storage Error',
    permissionDenied: 'Permission Denied',
    permissionDeniedTip: 'Please grant the required permissions in system settings.',
    unknownError: 'Unknown Error',
  },

  // Confirmation dialogs
  dialogs: {
    deleteTitle: 'Confirm Delete',
    clearTitle: 'Confirm Clear',
    restoreTitle: 'Confirm Restore',
    alarmTitle: 'Confirm Alarm',
    cancelTimerTitle: 'Cancel Timer',
  },

  // Empty states
  empty: {
    noDevices: 'No Devices',
    noDevicesTip: 'Tap scan to search for nearby alarm devices.',
    noContacts: 'No Contacts',
    noContactsTip: 'Add emergency contacts to enable alarm features.',
    noRecords: 'No Records',
    noRecordsTip: 'Alarm records will appear here.',
    noLogs: 'No Logs',
    noLogsTip: 'Device event logs will appear here.',
    noArticles: 'No Articles',
    noSearchResults: 'No matching results found.',
  },
}
