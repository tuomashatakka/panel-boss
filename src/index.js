'use babel'
// @flow
// @jsx etch.dom

import vDOM from './VirtualDOM'
// import consule from './dev'
import { CompositeDisposable } from 'atom'
import applyEZ from '../node_modules/ez-dom/src'

export default {

  activate(state) {
    applyEZ()
    atom.notifications.addInfo('PanelBOSS>init')
    this.createVDOM()
  },

  deactivate() {
    atom.notifications.addInfo('PanelBOSS>deactivate')
    this.removeVDOM()
  },

  removeVDOM () {
    if (window.vDOM)
      window.vDOM.destroy()
  },

  createVDOM () {
    this.removeVDOM()
    window.vDOM = new vDOM()
  },

  serialize() {
    return {}
  }

}
