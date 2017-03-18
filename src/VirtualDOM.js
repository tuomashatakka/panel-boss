'use babel'
/** @flow */
/** @jsx etch.dom */

import { CompositeDisposable, Disposable, Emitter } from 'atom'
import etch from 'etch'
import ResizeHandler from './components/ResizeHandler'
import DragHandler from './components/DragHandler'

let _containers

export default class VirtualDOM extends Emitter {

  constructor () {

    super()
    this.refs = this.createHandlerInstances()
    this.bindMouseEnter = this.bindMouseEnter.bind(this)
    this.subscriptions = this.registerPanelChangeObservers()
  }

  createHandlerInstances () {
    return {
      resize: new ResizeHandler(),
      drag: new DragHandler(),
    }
  }

  bindMouseEnter (panel: AtomPanelType) {

    let view = atom.views.getView(panel)
        view = view && view.element ? view.element : view

    let callback = e => Object.keys(this.refs).forEach(ref =>
      this.refs[ref].panel = !this.refs[ref].state.mutating ? panel : null)
    let attach = () => view.addEventListener('mouseenter', callback)
    let remove = () => view.removeEventListener('mouseenter', callback)

    attach()
    return new Disposable(() => remove())
  }

  registerPanelChangeObservers () {
    let subscriptions = new CompositeDisposable()

    this.panels.forEach(panel =>
      subscriptions.add(this.bindMouseEnter(panel)))

    this.containers.forEach(container =>
      subscriptions.add(container.onDidAddPanel(({panel}) => this.bindMouseEnter(panel))))

    return subscriptions
  }

  get containers () {

    if (_containers)
      return _containers

    let { panelContainers } = atom.workspace
    let { left, right, top, bottom } = panelContainers

    _containers = { left, right, top, bottom }
    _containers.forEach = function(fnc) {
      return (['left', 'right', 'top', 'bottom']).forEach(dir => {
        let container = _containers[dir]
        fnc(container)
        return container
      })
    }

    return _containers
  }

  get containerNames (): Array<string> {
    return ['left', 'right', 'top', 'bottom']
  }

  get panels (): Array<AtomPanelType> {
    return this.containerNames.reduce((panels, container) =>
      panels.concat(atom.workspace.getPanels(container)), [])
  }

  getResizeAxisForPanel (panel: AtomPanelType): string {

    let axises = this.containers
    const search = ({panels}) =>
      panels.find(item => item === item)

    for (let dir in axises)
      if (search(axises[dir]))
        return dir.toString()
    return 'unknown'
  }

  destroy () {
    for (let ref in this.refs) {
      this.refs[ref].destroy()
    }
    this.subscriptions.dispose()
  }

}
