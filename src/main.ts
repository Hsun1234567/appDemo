import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import App from './App.vue'

import zhCN from './i18n/zh-CN'
import enUS from './i18n/en-US'

export function createApp() {
  const app = createSSRApp(App)

  // Pinia 状态管理
  const pinia = createPinia()
  app.use(pinia)

  // vue-i18n 国际化
  const i18n = createI18n({
    legacy: false,
    locale: uni.getSystemInfoSync().language === 'en' ? 'en-US' : 'zh-CN',
    fallbackLocale: 'zh-CN',
    messages: {
      'zh-CN': zhCN,
      'en-US': enUS,
    },
  })
  app.use(i18n)

  return {
    app,
  }
}
