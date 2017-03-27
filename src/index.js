'use babel'

import Draggable from './Draggable.jsx'
import vDOM from './VirtualDOM'
// import consule from './dev'
import { CompositeDisposable } from 'atom'
import applyEZ from '../ezDOM/src'

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
