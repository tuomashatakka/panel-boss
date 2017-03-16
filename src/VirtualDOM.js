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


const develop = () => {
  // console.clear()
  // atom.packages.getLoadedPackage('tree-view').activationPromise.then(e => {
  //
  //   console.log(vDOM.panels)
  //   console.log(vDOM.panels.find(o => o.name === 'Tree View'))
  //
  //   atom.views.getView(
  //     vDOM.panels
  //     .find(o => o.name === 'Tree View'))
  //     .appendChild(vDOM.refs.resize.element)
  // })
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
    this._panel = panel
    let root = panel.getItem ? panel.getItem() : atom.views.getView(panel)
    if (root && root.element)
      root = root.element
    root.appendChild(this.element)
    this.position = null
    this._root = root
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
    }
    let parent = _preview.parentElement
    if (this.panel && !parent) {
      parent = atom.views.getView(this.panel)
      while (!parent.tagName === 'ATOM-PANEL-CONTAINER') {
        parent = parent.parentElement
        if (!parent) break
      }
      parent.appendChild(_preview)
    }
    return _preview
  }

  drawPreview () {

    let { amount, position } = this.anchor
    this.preview.setAttribute('style', `
      width: ${this.width}px;
      height: ${this.height}px;
      ${position}: ${amount}px;
      `)
  }

  async onMutate (event) {

    let co_end = coord(event)
    let [xc, yc] = co_end
    let { co: [ x, y ]} = this.state
    let diff = [ xc - x, yc - y ]
    this.updateState({ co_end, diff })
    this.drawPreview()
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

  get clientRect () {
    return this.view.getBoundingClientRect()
  }

  get dimensions () {
    let { width, height } = this.clientRect
    return { width, height }
  }

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
    let { width, height } = this.clientRect
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

export default class VirtualDOM extends Emitter {

  constructor () {
    super()
    this.updatePanels()
    window.vDOM = this
    this.refs = {
      resize: new ResizeHandler(),
    }

    // FIXME: DEBUG
    develop()
    this.observePanelChanges = this.observePanelChanges.bind(this)
    this.subscriptions = this.registerPanelChangeObservers()
  }

  updatePanels () {
    for (let panel of this.panels) {
      this.decoratePanel(panel)
    }
  }

  decoratePanel (panel: AtomPanelType) {
    console.log(panel)
  }

  observePanelChanges (panel: AtomPanelType) {

    console.log(panel) // FIXME: Remove

    let view = atom.views.getView(panel)
        view = view && view.element ? view.element : view
    let ref = this.refs.resize
    let callback = e => !ref.state.mutating ? ref.panel = panel : null
    let attach = () => view.addEventListener('mouseenter', callback)
    let remove = () => view.removeEventListener('mouseenter', callback)
    attach()
    return new Disposable(remove)

  }

  registerPanelChangeObservers () {

    let subscriptions = new CompositeDisposable()
    let containers = this.containers

    this.panels.forEach(panel =>
      subscriptions.add(this.observePanelChanges(panel)))

    containers.forEach(container =>
      subscriptions.add(container.onDidAddPanel(({panel}) => this.observePanelChanges(panel))))

    return subscriptions
  }

  get containers () {
    if (_containers)
      return _containers
    let { panelContainers } = atom.workspace
    let { left, right, top, bottom } = panelContainers
    _containers = { left, right, top, bottom }
    _containers.forEach = function(fnc) {
      fnc = fnc.bind(_containers)
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
