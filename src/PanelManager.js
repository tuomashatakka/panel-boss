'use babel'
// @flow
// @jsx etch.dom

import etch from 'etch'
import { CompositeDisposable, Disposable, Emitter } from 'atom'
import { INTERACT, PACKAGE_NAME, DEFAULT_SIZE, SCHEMA } from './constants'
import { getPanelDefaultSize } from './utils'

let _panel

export default class PanelManager {

  elements: Element
  state: StateType = {}
  subscriptions: CompositeDisposable
  panelRegistry: Array<Panel>

  constructor () {

    this.subscriptions = new CompositeDisposable()

    new Promise((resolve) => (function check () {

      if(window.vDOM)
        resolve()
      setTimeout(() => check(), 300)

    })())
    .then(() =>

      vDOM.listen('panelBOSS', ({ data }) =>
        this.handleAction(data.eventName, data)))

    etch.initialize(this)
  }

  handleAction (action, data) {

    let mgr = this
    if (action === 'panelDrop') {

      let { handler } = data
      let { horizontal, view } = handler
      let { width, height } = view.getBoundingClientRect()
      let prop  = horizontal ? 'width' : 'height'
      let proc  = horizontal ? 'height' : 'width'
      let val   = (Math.min(width, height))
      val = ((val === 0 ? getPanelDefaultSize() : val) || '').toString() + 'px'

      view.style.setProperty(proc, null)
      view.style.setProperty(prop, val)
      atom.notifications.addInfo([
        "width, height: ", width, height,
        "setting", prop, "to", val].join(' '))
    }
  }



  get panel () {

    if (_panel)
      return _panel

    let props = {
      mutating: false,
      item:     this.element,
      show:     () => this.element.classList.add('open'),
      hide:     () => this.element.classList.remove('open'),
    }

    _panel = atom.workspace.addHeaderPanel(props)
    return _panel
  }

  set panel (panel: AtomPanelType) {
    _panel = panel ? panel : _panel
  }

  update () {}

  render () {
    return <div>Panel manager.....</div>
  }

  destroy () {
    this.subscriptions.dispose()
  }

}
