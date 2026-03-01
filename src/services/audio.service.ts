/**
 * 音频服务
 * 使用 uni.createInnerAudioContext 实现报警音效播放和模拟来电音频播放。
 */

/** 音频服务接口 */
export interface IAudioService {
  /** 播放报警音效（循环） */
  playAlarmSound(): void
  /** 停止报警音效 */
  stopAlarmSound(): void
  /** 播放模拟来电铃声（循环） */
  playRingtone(): void
  /** 停止模拟来电铃声 */
  stopRingtone(): void
  /** 播放模拟通话音频（单次） */
  playCallAudio(): void
  /** 停止模拟通话音频 */
  stopCallAudio(): void
  /** 销毁所有音频上下文，释放资源 */
  destroy(): void
}

/** 报警音效路径 */
const ALARM_SOUND_SRC = '/static/audio/alarm.mp3'
/** 来电铃声路径 */
const RINGTONE_SRC = '/static/audio/ringtone.mp3'
/** 模拟通话音频路径 */
const CALL_AUDIO_SRC = '/static/audio/call.mp3'

export class AudioService implements IAudioService {
  private alarmCtx: UniApp.InnerAudioContext | null = null
  private ringtoneCtx: UniApp.InnerAudioContext | null = null
  private callCtx: UniApp.InnerAudioContext | null = null

  playAlarmSound(): void {
    try {
      this.stopAlarmSound()
      this.alarmCtx = uni.createInnerAudioContext()
      this.alarmCtx.src = ALARM_SOUND_SRC
      this.alarmCtx.loop = true
      this.alarmCtx.onError((err) => {
        console.error('[Audio] 报警音效播放失败:', err)
      })
      this.alarmCtx.play()
      console.log('[Audio] 开始播放报警音效')
    } catch (err: any) {
      console.error('[Audio] 播放报警音效异常:', err?.message ?? err)
    }
  }

  stopAlarmSound(): void {
    if (this.alarmCtx) {
      this.alarmCtx.stop()
      this.alarmCtx.destroy()
      this.alarmCtx = null
      console.log('[Audio] 停止报警音效')
    }
  }

  playRingtone(): void {
    try {
      this.stopRingtone()
      this.ringtoneCtx = uni.createInnerAudioContext()
      this.ringtoneCtx.src = RINGTONE_SRC
      this.ringtoneCtx.loop = true
      this.ringtoneCtx.onError((err) => {
        console.error('[Audio] 来电铃声播放失败:', err)
      })
      this.ringtoneCtx.play()
      console.log('[Audio] 开始播放来电铃声')
    } catch (err: any) {
      console.error('[Audio] 播放来电铃声异常:', err?.message ?? err)
    }
  }

  stopRingtone(): void {
    if (this.ringtoneCtx) {
      this.ringtoneCtx.stop()
      this.ringtoneCtx.destroy()
      this.ringtoneCtx = null
      console.log('[Audio] 停止来电铃声')
    }
  }

  playCallAudio(): void {
    try {
      this.stopCallAudio()
      this.callCtx = uni.createInnerAudioContext()
      this.callCtx.src = CALL_AUDIO_SRC
      this.callCtx.loop = false
      this.callCtx.onError((err) => {
        console.error('[Audio] 通话音频播放失败:', err)
      })
      this.callCtx.play()
      console.log('[Audio] 开始播放通话音频')
    } catch (err: any) {
      console.error('[Audio] 播放通话音频异常:', err?.message ?? err)
    }
  }

  stopCallAudio(): void {
    if (this.callCtx) {
      this.callCtx.stop()
      this.callCtx.destroy()
      this.callCtx = null
      console.log('[Audio] 停止通话音频')
    }
  }

  destroy(): void {
    this.stopAlarmSound()
    this.stopRingtone()
    this.stopCallAudio()
    console.log('[Audio] 所有音频上下文已销毁')
  }
}
