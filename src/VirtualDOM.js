'use babel'

import { Emitter } from 'atom'

export default class VirtualDOM extends Emitter {

  constructor () {
    this.observePanelChanges()
    this.updatePanels()
  }

  updatePanels () {
    for (let panel in this.panels) {
      this.decoratePanel(panel)
    }
  }

  decoratePanel (panel) {
    consule.log(panel)
  }

  observePanelChanges () {
    // TODO
  }

  get containers () {
    let { panelContainers } atom.workspace
    let { left, right, top, bottom } = panelContainers
    return { left, right, top, bottom }
  }

  get panels () {
    let left = atom.workspace.getLeftPanels()
    let right = atom.workspace.getRightPanels()
    let top = atom.workspace.getTopPanels()
    let bottom = atom.workspace.getBottomPanels()
    return [ ...left, ...right, ...top, ...bottom ]
  }

}
