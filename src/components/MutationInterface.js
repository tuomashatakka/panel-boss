'use babel'
// @flow
import { Emitter } from 'atom'

/**
 * Parse mouse x and y coordinates from an event object
 *
 * @method coord
 * @param  {Event}
 * @return {Array}   2-dimensional coordinates as an array
 */

const coord = ({ clientX: x=0, clientY: y=0 }) => {
  return [ x, y ]
}

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


/**
 * Find the closest ancestor with the provided tag name
 * @method ancestor
 * @return {Element}
 */

export const ancestor: Element | null = (el: Element, tagName: string = 'ATOM-PANEL') =>
  !el ? null : el.tagName !== tagName ? ancestor(el.parentElement, tagName) : el

let _containers

export default class MutationInterface extends Emitter {

  _root: any
  _panel: AtomPanelType

  handleClassName: string
  previewClassName: string
  position: string|null
  previewElement: Element
  element: HTMLElement
  state: {
    co: Array<number>,
    co_end: Array<number>,
    diff?: Array<number>|void,
  }

  send (message, data={}, ...flags) {
    this.emit(message, data)
    console.log(message)
    if (flags.indexOf('private') === -1)
      vDOM.broadcast(message, data)
  }

  get axis (): string {
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

  get horizontal (): bool { return this.axis === 'left' || this.axis === 'right' }
  get vertical (): bool {   return this.axis === 'top' || this.axis === 'bottom' }
  get inversed (): bool {   return this.axis === 'right' || this.axis === 'bottom' }

  get anchor (): { position: string, amount: number } {
    // right panels
    let rect = this.view.getBoundingClientRect()
    let position = this.axis
    let amount = rect[position]
    if (this.inversed)
      amount = window['inner' + (this.horizontal ? 'Width' : 'Height')] - amount
    return { position, amount }
  }

  get width (): number {
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

  get height (): number {
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

  get view (): HTMLElement {
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
    ancestor(this._root).appendChild(this.element)
  }

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
      diff:   [ 0, 0 ]
    }
  }

  updateState (props: {}={}) {
    this.state = { ...this.state, ...props }
  }

  get preview (): Element {

    if (!this.previewElement) {
      this.previewElement = document.createElement('atom-panel')
      this.previewElement.classList.add('mutation-preview')
      this.previewElement.classList.add(this.previewClassName)
    }

    if (this.panel && !this.previewElement.parentElement)
      ancestor(atom.views.getView(this.panel), 'ATOM-PANEL-CONTAINER')
        .appendChild(this.previewElement)

    return this.previewElement

  }

  update () {

  }

  drawPreview () {

    let { amount, position } = this.anchor
    this.preview.setAttribute('style', `
      width: ${this.width}px;
      height: ${this.height}px;
      ${position}: ${amount}px; `)
  }

  async onMutate (event: MouseEvent) {

    let co_end = coord(event)
    let [xc, yc] = co_end
    let { co: [ x, y ]} = this.state
    let diff = [ xc - x, yc - y ]
    this.updateState({ co_end, diff })
    this.drawPreview()

    return typeof this.onUpdate === 'function' ? this.onUpdate() : null
  }

  onMutationBegin (event: MouseEvent) {

    let co = coord(event)
    let co_end = [ 0, 0 ]

    this.updateState({ co, co_end, mutating: true })
    this.view.style.setProperty('opacity', '0.4')
    document.addEventListener('mousemove', this.onMutate)
    document.addEventListener('mouseup', this.onMutationFinish)
    document.documentElement.classList.add('panel-boss-active')

    return typeof this.onStart === 'function' ? this.onStart() : null
  }

  onMutationFinish (event: MouseEvent) {

    this.preview.remove()
    this.updateState({ mutating: false })
    this.view.style.setProperty('opacity', '1')
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

}
