'use babel'
/** @flow */
/** @jsx etch.dom */

import { CompositeDisposable, Disposable, Emitter } from 'atom'
import { bindDisposableEvent, getView } from './utils'
import etch from 'etch'
import ResizeHandler from './components/ResizeHandler'
import DragHandler from './components/DragHandler'
import PanelManager from './PanelManager'

const broadcastTransmission: Event = (data) => {
  let evt = new Event('panelBOSS')
  evt.data = data
  return evt }
let _containers

export default class VirtualDOM extends Emitter {


  constructor () {

    super()
    this.bindMouseEnter = this.bindMouseEnter.bind(this)
    this.panels.forEach(o => {
      let close = document.createElement('div')
      close.addClass('boss', 'btn', 'close-panel')
      let exists = false
      let view = getView(o)
      let items = view.children
      if (items && items.forEach)
        o.forEach(child => {
        if (child.classList.has('boss'))
          exists = true
      })

      if (!exists && view.appendChild)
        view.appendChild(close)

    })

    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(this.createHandlerInstances())
    this.subscriptions.add(this.registerPanelChangeObservers())
  }

  createHandlerInstances () {
    this.refs = {
      manager:  new PanelManager(),
      resize:   new ResizeHandler(),
      drag:     new DragHandler() }

    return new Disposable(() => {
      for (let ref in this.refs) {
        this.refs[ref].destroy()
      }
    })
  }

  bindMouseEnter (panel: AtomPanelType) {

    let view = getView(panel)
    let callback = e => Object.keys(this.refs).forEach(ref =>
      this.refs[ref].panel = !this.refs[ref].state.mutating ? panel : null)

    return bindDisposableEvent('mouseenter', view, callback)
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


/**
 * Get a list of customizable panel containers' names
 *
 * @getter containerNames
 * @return Array
 */

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


  broadcast (eventName, data={}, view=document) {
    let event = broadcastTransmission({ eventName, ...data })
    view.dispatchEvent(event)
  }

  listen (eventName, callback, view=document) {
    let sub = bindDisposableEvent(eventName, view, callback)
    this.subscriptions.add(sub)
    return sub
  }

  destroy () {
    this.subscriptions.dispose()
  }

}
