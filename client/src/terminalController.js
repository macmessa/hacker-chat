import ComponentsBuilder from "./components.js";
import { constants } from './constants.js'

const {
  MESSAGE_SENT, 
  MESSAGE_RECEIVED,
  ACTIVITYLOG_UPDATED,
  STATUS_UPDATED
} = constants.events.app

export default class TerminalController {
  #usersCollors = new Map()

  constructor() {}

  #pickCollor() {
    return `#${Math.random().toString(16).slice(-6)}-fg`
  }

  #getUserCollor(userName) {
    if (this.#usersCollors.has(userName))
      return this.#usersCollors.get(userName)
    
    const collor = this.#pickCollor()
    this.#usersCollors.set(userName, collor)

    return collor
  }

  #onInputReceived(eventEmitter) {
    return function() {
      const message = this.getValue()
      console.log(message)
      this.clearValue()
    }
  }

  #onMessageReceived({ screen, chat }) {
    return msg => {
      const { userName, message } = msg
      const collor = this.#getUserCollor(userName)

      chat.addItem(`{${collor}}{bold}${userName}{/}: ${message}`)

      screen.render()
    }
  }

  #onMessageSent({ screen, chat }) {
    return msg => {
      screen.render()
    }
  }

  #onLogChanged({ screen, activityLog }) {
    return msg => {
      const [ userName ] = msg.split(/\s/)
      const collor = this.#getUserCollor(userName)
      activityLog.addItem(`{${collor}}{bold}${msg.toString()}{/}`)

      screen.render()
    }
  }

  #onStatusChanged({ screen, status }) {
    return users => {
      const { content } = status.items.shift()
      status.clearItems()
      status.addItem(content)

      users.forEach(userName => {
        const collor = this.#getUserCollor(userName)
        status.addItem(`{${collor}}{bold}${userName}{/}`)
      })

      screen.render()
    }
  }

  #registerEvents(eventEmitter, components) {
    eventEmitter
      .on(MESSAGE_SENT, this.#onMessageSent(components))
      .on(MESSAGE_RECEIVED, this.#onMessageReceived(components))
      .on(ACTIVITYLOG_UPDATED, this.#onLogChanged(components))
      .on(STATUS_UPDATED, this.#onStatusChanged(components))
  }

  async initializaTable(eventEmitter) {
    async function delay(duration) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(), duration);
      })
    }  
    
    const components = new ComponentsBuilder()
      .setScreen({ title: 'HackerChat - Semana JS Expert' })
      .setLayoutComponent()
      .setInputComponent(this.#onInputReceived(eventEmitter))
      .setChatComponent()
      .setActivityLogComponent()
      .setStatusComponent()
      .build()
    
      this.#registerEvents(eventEmitter, components)

      components.input.focus()
      components.screen.render()

      const users = ['marco']
      await delay(1000)
      eventEmitter.emit(STATUS_UPDATED, users)
      await delay(1000)
      users.push('ingridy')
      eventEmitter.emit(STATUS_UPDATED, users)
      await delay(1000)
      users.push('logan', 'mew')
      eventEmitter.emit(STATUS_UPDATED, users)
      await delay(1000)
      users.push('mayron')
      eventEmitter.emit(STATUS_UPDATED, users)
      await delay(1000)
      eventEmitter.emit(MESSAGE_RECEIVED, { message: 'teste', userName: 'marco' })
  }
}