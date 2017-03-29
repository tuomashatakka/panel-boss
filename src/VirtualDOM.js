'use babel'
// @flow
// @jsx etch.dom

import { CompositeDisposable, Disposable, Emitter } from 'atom';
import { bindDisposableEvent, getView } from './utils'
import etch from 'etch'
import ResizeHandler from './components/ResizeHandler'
import DragHandler from './components/DragHandler'
import PanelManager from './PanelManager'

import { isArray, assertElement } from '../node_modules/ez-dom/src/assert'

const broadcastTransmission: Event = (data) => {
  let evt = new Event('panelBOSS')
  evt.data = data
  return evt }

let _containers

const ATTRS_MAP = {
  className: function (cls) {
    if (cls.constructor.name)
      return this.addClass(...cls)
    return this.addClass(...(cls.split(/(s+)/)))
  }
}

function setProps (attrs={}) {
  for (let attr in attrs) {
    if (ATTRS_MAP[attr])
      ATTRS_MAP[attr].call(this, attrs[attr])
    else
      this.setAttribute(attr, attrs[attr])
  }
  return this
}

let elem = (type, attr, ...children) => {

  let el = document.createElement(type)
  if (attr && attr.constructor.name === 'Object')
    return setProps.call(el, attr)

  children.unshift(attr)
  el.append(...children.map(c => assertElement(c)))
  return el
}

// Events
class EventInterface extends Emitter {
  listen (event, dispatch) {
    this.on(event, )
  }
}


function listen (el, eventName, callback) {

  let remove = () => el.removeEventListener(eventName, fnc)
  let add    = () => el.addEventListener(eventName, fnc)
  let fnc    = (e) => {
    var result = callback.call(el, e, remove)
    // remove()
    return result
  }
  add()
  return remove

}


HTMLElement.prototype.listen = function (name, c) {
  return listen(this, name, c)
}



export default class VirtualDOM extends Emitter {


  constructor () {

    super()
    this.bindMouseEnter = this.bindMouseEnter.bind(this)
    this.panels.forEach(o => this.createToggle(o))

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

  createToggle (o) {

    let close = elem('div', {
      className: ['boss', 'btn', 'close-panel']
    })

    console.log(pr)

    let view = getView(o)
    let pr = close.listen('click', () => view.classList.toggle('collapse'))
    let items = view.childNodes || []
    let exists = items && [...items].reduce((t, c) => t || c.classList.contains('boss'), false)
    if (exists) items.forEach(c => {
      console.warn(c)
      if (c.classList.contains('boss'))
        c.remove()
    })
    // if (!exists && view.append)
    //   view.append(close)
    view.append(close)

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
