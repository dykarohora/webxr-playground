import { EventEmitter } from './EventEmitter'

export class Clock extends EventEmitter {
  private isRunning: boolean

  public constructor() {
    super()
    this.isRunning = true

    this.tick = this.tick.bind(this)
    this.tick()

    if(window) {
      window.onblur = () => {
        this.stop()
        console.info('Clock stopped')
      }

      window.onfocus = () => {
        this.start()
        console.info('Clock resumed')
      }
    }
  }

  public tick() {
    if(this.isRunning) {
      this.emit('tick')
    }
    requestAnimationFrame(this.tick)
  }

  public start() {
    this.isRunning = true
  }

  public stop() {
    this.isRunning = false
  }
}
