'use babel'
// @flow

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

const coord = ({ clientX: x=0, clientY: y=0 }) => {
  return [ x, y ]
}

export const INTERACT = {
  MOVE: 'move',
  RESIZE: 'resize',
}

export const ancestor = (el: Element, tagName: string = 'ATOM-PANEL'): Element => {
  while(el.tagName !== tagName)
    el = el.parentElement
  return el
}

let _containers

export default class MutationInterface {

  _root: Element|null
  _panel: AtomPanelType

  handleClassName: string
  previewClassName: string
  position: string|null
  previewElement: Element
  element: Element
  state: {
    co: Array<number>,
    co_end: Array<number>,
    diff: Array<number>,
  }

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

  get view (): HTMLElement {
    return this._root || atom.views.getView(this._root)
  }

  get panel (): AtomPanelType {
    return this._panel
  }

  set panel (panel: AtomPanelType) {

    let root = panel.getItem ? panel.getItem() : atom.views.getView(panel)

    this.position = null
    this._panel   = panel
    this._root    = root ? root.element || root : null

    ancestor(this._root).appendChild(this.element)
  }

  constructor() {
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

  drawPreview () {

    let { amount, position } = this.anchor
    console.log(this.width, this.height, position, amount)
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
    if (this.quarter)
      console.log("drag", this.quarter)
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
    console.log("etsh", this)
    this.destroy()
  }

}
