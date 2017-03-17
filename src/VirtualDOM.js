'use babel'
/** @flow */
/** @jsx etch.dom */

import { CompositeDisposable, Disposable, Emitter } from 'atom'
import etch from 'etch'

type AtomPanelType = {
  item: Element,
  getItem: () => Element
};

type CoordType = [ number, number ];

type DimensionsType = {
  width: number,
  height: number,
  delta: CoordType
};


export const INTERACT = {
  MOVE: 'move',
  RESIZE: 'resize',
}

const coord = ({ clientX: x=0, clientY: y=0, z=0 }) => {
  return [ x, y, z ]
}

let _preview, _containers
class MutationInterface {

  _root: Element
  _panel: AtomPanelType
  position: string

  get axis () {
    if (this.position)
      return this.position
    let cls = atom.views.getView(this.panel).classList
    this.position = cls.contains('right') ? 'right' :
                    cls.contains('left') ? 'left' :
                    cls.contains('top') ? 'top' :
                    cls.contains('bottom') ? 'bottom' :
                    'unknown'
    return this.position
  }

  get horizontal () { return this.axis === 'left' || this.axis === 'right' }
  get vertical () {   return this.axis === 'top' || this.axis === 'bottom' }
  get inversed () {   return this.axis === 'right' || this.axis === 'bottom' }

  get anchor () {
    // right panels
    let rect = this.view.getBoundingClientRect()
    let position = this.axis
    let amount = rect[position]
    if (this.inversed)
      amount = window['inner' + (this.horizontal ? 'Width' : 'Height')] - amount

    let x = amount
    let y = amount
    return { x, y, position, amount }
  }

  get width () {
    // right panels
    let { width } = this.view.getBoundingClientRect()
    let [ x, y ] = this.state.diff
    let pos = this.axis

    if (pos === 'left')
      width += x
    else if (pos === 'right')
      width -= x

    return width
  }

  get height () {
    // right panels
    let { height } = this.view.getBoundingClientRect()
    let [ x, y ] = this.state.diff
    let pos = this.axis

    if (pos === 'top')
      height += y
    else if (pos === 'bottom')
      height -= y

    return height
  }

  get view () {
    return this._root || atom.views.getView(this._root)
  }

  get panel () {
    return this._panel
    // return this.element .parentElement
  }

  set panel (panel: AtomPanelType) {

    let root = panel.getItem ? panel.getItem() : atom.views.getView(panel)

    if (root && root.element)
      root = root.element
    this.position = null
    this._panel = panel
    this._root = root

    let el = root
    while (el.tagName !== 'ATOM-PANEL') {
      el = el.parentElement
    }
    el.appendChild(this.element)
  }

  constructor() {
    this.onMutationBegin = this.onMutationBegin.bind(this)
    this.onMutationFinish = this.onMutationFinish.bind(this)
    this.onMutate = this.onMutate.bind(this)
    this.updateState = this.updateState.bind(this)
    this.element = null
    this.state = {
      co:     [ 0, 0 ],
      co_end: [ 0, 0 ],
      diff:   [ 0, 0 ]
    }
  }

  updateState (props={}) {
    this.state = { ...this.state, ...props }
  }

  get preview (): Element {

    if (!_preview) {
      _preview = document.createElement('atom-panel')
      _preview.classList.add('mutation-preview')
      _preview.classList.add(this.previewClassName)
    }

    let parent = _preview.parentElement
    if (this.panel && !parent) {
      parent = atom.views.getView(this.panel)
      while (parent.tagName !== 'ATOM-PANEL-CONTAINER') {
        parent = parent.parentElement
        if (!parent) break
      }
      parent.appendChild(_preview)
    }
    return _preview

  }

  drawPreview () {

    let { amount, position } = this.anchor
    console.log(this.width, this.height, position, amount)
    this.preview.setAttribute('style', `
      width: ${this.width}px;
      height: ${this.height}px;
      ${position}: ${amount}px; `)
  }

  async onMutate (event) {

    let co_end = coord(event)
    let [xc, yc] = co_end
    let { co: [ x, y ]} = this.state
    let diff = [ xc - x, yc - y ]
    this.updateState({ co_end, diff })
    this.drawPreview()
    if (this.quarter)
      console.log("drag", this.quarter)
  }

  onMutationBegin (event) {

    let co = coord(event)
    let co_end = [ 0, 0 ]
    this.updateState({ co, co_end, mutating: true })
    this.view.style.setProperty('opacity', 0.4)

    document.addEventListener('mousemove', this.onMutate)
    document.addEventListener('mouseup', this.onMutationFinish)
    if (typeof this.onStart === 'function')
      this.onStart()
  }

  onMutationFinish (event) {

    this.preview.remove()
    this.view.style.setProperty('opacity', 1)
    this.updateState({ mutating: false })

    document.removeEventListener('mousemove', this.onMutate)
    document.removeEventListener('mouseup', this.onMutationFinish)
    if (typeof this.onEnd === 'function')
      this.onEnd()
  }

}


class ResizeHandler extends MutationInterface {

  state = { co: [], co_end: [] }
  element: Element
  root: Element
  vDOM: {}
  previewClassName: string = 'resize-preview'

  constructor () {
    super()
    etch.initialize(this)
    this.onStart = () => this.saveInitialDimensions()
    this.onEnd = () => {
      if (this.horizontal)
        this.view.style.setProperty('width', this.width + 'px')
      if (this.vertical)
        this.view.style.setProperty('height', this.height + 'px')
    }
  }

  saveInitialDimensions () {
    let { width, height } = this.view.getBoundingClientRect()
    let axis = this.axis
    if(!this.view.getAttribute('data-original-width'))
      this.view.setAttribute('data-original-width', width.toString())
    if(!this.view.getAttribute('data-original-height'))
      this.view.setAttribute('data-original-height', height.toString())
  }

  /**
   * Update the etch properties
   * @method update
   */

  update () {

  }

  render () {
    return (
      <div
      onMouseDown={this.onMutationBegin}
      className='resize-handle'>
      </div>
    )
  }
}

class DragHandler extends MutationInterface {

  state = { co: [], co_end: [] }
  element: Element
  root: Element
  vDOM: {}
  previewClassName: string = 'drag-preview'

  constructor () {
    super()
    etch.initialize(this)
    this.onStart = () => this.initialContainer = this.panel
    this.onEnd = () => {
      this.axis = this.position
    }
    console.log(this)
  }

  get quarter (): [number, string|null] {
    let { co_end: [ x, y ]} = this.state
    let w = window.innerWidth
    let h = window.innerHeight
    let bounds  = [
      [y / h,       'top'],
      [x / w,       'left'],
      [(w - x) / w, 'right'],
      [(h - y) / h, 'bottom'],
    ]
    return bounds.reduce((sum, iter) => {
       let [val, ]  = iter
       let [cmp, ]   = sum
       return (val > cmp) ? sum : iter
    }, [1, null])
  }

  get axis () {
    this.position = this.quarter[1]
    this.preview.classList.remove('left')
    this.preview.classList.remove('right')
    this.preview.classList.remove('top')
    this.preview.classList.remove('bottom')
    this.preview.classList.add(this.position)
    return this.position
  }

  set axis (target: string) {
    atom.workspace.addPanel(target, this.panel)
  }

  get anchor () {
    return { position: this.axis, amount: 0 }
  }

  get width () {
    if (this.vertical)
      return window.innerWidth
    let { width } = this.view.getBoundingClientRect()
    return width
  }

  get height () {
    if (this.horizontal)
      return window.innerHeight
    let { height } = this.view.getBoundingClientRect()
    return height
  }

  /**
   * Update the etch properties
   * @method update
   */

  update () {

  }

  render () {
    return (
      <div
      onMouseDown={this.onMutationBegin}
      className='drag-handle'>
      </div>
    )
  }
}


export default class VirtualDOM extends Emitter {

  constructor () {
    super()
    window.vDOM = this

    this.refs = {
      resize: new ResizeHandler(),
      drag: new DragHandler(),
    }

    this.bindMouseEnter = this.bindMouseEnter.bind(this)
    this.subscriptions = this.registerPanelChangeObservers()
  }

  bindMouseEnter (panel: AtomPanelType) {

    let view = atom.views.getView(panel)
        view = view && view.element ? view.element : view
    let ref = this.refs.resize
    let dref = this.refs.drag
    let callback = e => {
      if(!ref.state.mutating) ref.panel = panel
      if(!dref.state.mutating) dref.panel = panel
    }
    let attach = () => view.addEventListener('mouseenter', callback)
    let remove = () => view.removeEventListener('mouseenter', callback)

    attach()
    return new Disposable(remove)
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

  get panels (): Array<AtomPanelType> {
    let left = atom.workspace.getLeftPanels()
    let right = atom.workspace.getRightPanels()
    let top = atom.workspace.getTopPanels()
    let bottom = atom.workspace.getBottomPanels()
    return [ ...left, ...right, ...top, ...bottom ]
  }

  getResizeAxisForPanel (panel: AtomPanelType): string {

    let axises = this.containers
    const search = ({panels}) =>
      panels.find(item => {
        console.log(item, panel)
        return item === item
      })

    for (let dir in axises) {
      console.info("axis", dir)
      if (search(axises[dir])) {
        return dir.toString()
      }
    }

    return 'unknown'
  }

  destroy () {
    for (let ref in this.refs) {
      ref.remove()
      ref.destroy()
    }
    this.subscriptions.dispose()
  }

}
