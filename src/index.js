'use babel'

import Draggable from './Draggable.jsx'
import vDOM from './VirtualDOM'
// import consule from './dev'
import { CompositeDisposable } from 'atom'

export default {

  panelBossView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    atom.notifications.addInfo('PanelBOSS>init')
    const dom = new vDOM()
    console.log(dom)
    this.panelBossView = state.panelBossViewState;
    this.modalPanel = atom.workspace.addModalPanel({
      item: document.createElement('div'),
      visible: false
    })
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'panel-boss:toggle': () => this.toggle()
    }))
  },

  deactivate() {
    this.modalPanel.destroy()
    this.subscriptions.dispose()
  },

  serialize() {
    return {}
  },

  toggle() {
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
