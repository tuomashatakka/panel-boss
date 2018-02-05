'use babel'
/** @jsx etch.dom */
// @flow

import { Emitter } from 'atom'
import { positionFromEvent, ancestorByTagName, getContainer, getView } from '../utils'
import { CONTAINERS } from '../constants'

type ClassListMethodType = 'add' | 'remove' | 'toggle';
type PositionType = 'left' | 'right' | 'top' | 'bottom';


/**
 * Panel reordering actions map
 * @type {Object}
 */

export const INTERACT = {
  RESIZESTART:  'panelResizeStart',
  RESIZE:       'panelResize',
  SIZE:         'panelResizeEnd',
  GRAB:         'panelGrab',
  DRAG:         'panelDrag',
  DROP:         'panelDrop',
}


let _panelContent


export default class MutationInterface extends Emitter {

  _root:            any
  _panel:           AtomPanelType
  handleClassName:  string
  previewClassName: string
  previewElement:   HTMLElement
  element:          HTMLElement
  onStart:          Function | void
  onEnd:            Function | void
  onMutate:         Function
  updateState:      Function
  onMutationBegin:  Function
  onMutationFinish: Function
  position:         PositionType | null
  state: { co:      CoordType | void,
           co_end:  CoordType,
           diff?:   Array<number> }

  constructor () {
    super()
    this.format()
    this.onMutationBegin = this.onMutationBegin.bind(this)
    this.onMutationFinish = this.onMutationFinish.bind(this)
    this.onMutate = this.onMutate.bind(this)
    this.updateState = this.updateState.bind(this)
    this.state = {
      co:     [ 0, 0 ],
      co_end: [ 0, 0 ],
      diff:   [ 0, 0 ] }
  }

  show () {
    this.view.addClass('open')
    this.view.removeClass('collapsed')
  }
  hide () {
    this.view.removeClass('open')
    this.view.addClass('collapsed')
  }

  send (message: string, data: {} = {}, ...flags: Array<string>) {
    this.emit(message, data)
    if (flags.indexOf('private') === -1)
      vDOM.broadcast(message, data)
  }

  get location (): PositionType | null {
    if (this.position)
      return this.position
    let cls = getView(this.panel).classList
    this.position = CONTAINERS.find(container => cls.contains(container)) || null
    return this.position
  }

  get horizontal (): bool { return this.location === 'left' || this.location === 'right' }
  get vertical (): bool { return this.location === 'top' || this.location === 'bottom' }
  get inversed (): bool { return this.location === 'right' || this.location === 'bottom' }
  get axis (): 'width' | 'height' { return this.horizontal ? 'width' : 'height' }

  // get anchor (): { position: string, amount: number } {
  //   // right panels
  //   let rect = this.view.getBoundingClientRect()
  //   let position = this.location
  //   let amount = rect[position]
  //   if (this.inversed)
  //     amount = window['inner' + (this.horizontal ? 'Width' : 'Height')] - amount
  //   return { position, amount }
  // }

  get width (): number {
    // right panels
    let { width } = this.view.getBoundingClientRect()
    let [ x, y ] = this.state.diff
    let pos = this.location

    if (pos === 'left')
      width += x
    else if (pos === 'right')
      width -= x

    return width
  }

  get height (): number {
    // right panels
    let { height } = this.view.getBoundingClientRect()
    let [ x, y ] = this.state.diff
    let pos = this.location

    if (pos === 'top')
      height += y
    else if (pos === 'bottom')
      height -= y

    return height
  }

  get view (): HTMLElement {
    if (this._panel._item)
      return this._panel._item
    return this._root || atom.views.getView(this._root)
  }

  get panel (): AtomPanelType {
    return this._panel
  }

  set panel (panel: AtomPanelType) {

    if (!panel)
      return
    let root = panel.getItem ? panel.getItem() : atom.views.getView(panel)

    this.position = null
    this._panel   = panel
    this._root    = root ? root.element || root : null
    let grandparent = ancestorByTagName(this._root)
    if (grandparent)
        grandparent.appendChild(this.element)
  }

  updateState (props: {}={}) {
    this.state = { ...this.state, ...props }
  }

  get preview (): HTMLElement {

    if (!this.previewElement) {
      this.previewElement = document.createElement('atom-panel')
      this.previewElement.classList.add('mutation-preview', ...this.previewClassName.split(/\s+/))
      this.previewElement.appendChild(this.getPanelContent())
    }
    else
      this.previewElement.classList.remove('left', 'right', 'top', 'bottom')

    if (this.panel && !this.previewElement.parentElement) {
      let cont = getContainer(this.location)
      let index = getView(this.panel)
      if (index.parentElement !== this.previewElement.parentElement)
        index = null
      cont.insert(this.previewElement, index)
    }

    this.previewElement.addClass(this.position)
    return this.previewElement

  }

  getPanelDimensions () {
    let style = getComputedStyle(this.view)
    return { width: style.width, height: style.height }
  }

  getPanelPosition (): PositionType {
    let cls = atom.views.getView(this.panel).classList
    return CONTAINERS.find(container => cls.contains(container)) || null
  }

  getPanelContent (): HTMLElement {
    if (!_panelContent) {
      let el = document.createElement('div')
      el.innerHTML = this.view.innerHTML || ''
      el.setAttribute('style', 'width: 100%; height: 100%; overflow: hidden;')
      _panelContent = el
    }
    return _panelContent
  }

  getPreviewSize () {
    let minSize = 200
    let { width, height } = this.getPanelDimensions()
    let size  = this.horizontal ? parseInt(width) : parseInt(height)
    if (isNaN(size))
      size = minSize
    return size < minSize ? minSize : size
  }

  async setPreviewSize (size: number) {
    let { axis } = this
    this.preview.style.setProperty('width', 'auto')
    this.preview.style.setProperty('height', 'auto')
    this.preview.style.setProperty(axis, size.toString() + 'px')
    let view      = getView(this.panel)
    let container = getContainer(this.location)
    let child   = false
    console.warn(view.parentElement.classList.contains(this.location))
    if (!view.parentElement.classList.contains(this.location))
      container.append(this.preview)
  }

  setPreviewPosition (position: PositionType | null) {

    position = position || this.location

    this.preview.classList.remove('left', 'right', 'top', 'bottom')
    this.preview.classList.add(position)
  }

  drawPreview () {
    this.setPreviewSize(this.getPreviewSize())
  }

  toggleTargetPanel (action: ClassListMethodType) {
    let view = ancestorByTagName(this.view)
    let state = view.classList.contains('mutating')

    view.classList.add('mutating')
    view.style.setProperty('opacity', action === 'opaque' ? '0.4' : '1')

    if (action === 'hide')
      view.classList.add('hidden')
    else
      view.classList.remove('mutating', 'hidden')
  }

  async onMutate (event: MouseEvent) {

    let co_end = positionFromEvent(event)
    let [xc, yc] = co_end
    let { co: [ x, y ]} = this.state
    let diff = [ xc - x, yc - y ]

    this.updateState({ co_end, diff })
    this.drawPreview()

    return typeof this.onUpdate === 'function' ? this.onUpdate() : null
  }

  onMutationBegin (event: MouseEvent) {

    let co      = positionFromEvent(event)
    let co_end  = [ 0, 0 ]
    let view    = getView(this.panel)

    view.parentElement.insert(this.preview, view)
    this.updateState({ co, co_end, mutating: true, diff: [0, 0] })
    this.drawPreview()
    document.addEventListener('mousemove', this.onMutate)
    document.addEventListener('mouseup', this.onMutationFinish)
    document.documentElement.classList.add('panel-boss-active')

    return typeof this.onStart === 'function' ? this.onStart() : null
  }

  onMutationFinish (event: MouseEvent) {
    this.preview.remove()
    _panelContent = null
    this.previewElement = null
    this.updateState({ mutating: false })

    document.removeEventListener('mousemove', this.onMutate)
    document.removeEventListener('mouseup', this.onMutationFinish)
    document.documentElement.classList.remove('panel-boss-active')

    return typeof this.onEnd === 'function' ? this.onEnd() : null
  }

  destroy () {
    let elements = document.querySelectorAll(this.handleClassName)
    if (this.element)
      this.element.remove()
    return Array.from(elements).forEach(el => el.remove())
  }

  format () {
    this.destroy()
  }

  update () {

  }

}
