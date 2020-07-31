export class EventEmitter {
  private events: { [key: string]: Function[] } = {}

  public on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  public remove(event: string, listener: Function) {
    if (this.events[event]) {
      const index = this.events[event].indexOf(listener)
      if (~index) {
        this.events[event].splice(index, 1)
      }
    }
  }

  public emit(event: string) {
    const events = this.events[event]
    if (events) {
      events.forEach(func => func())
    }
  }
}
