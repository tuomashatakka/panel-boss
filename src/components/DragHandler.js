'use babel'
// @flow
// @jsx etch.dom

import { CompositeDisposable, Disposable, Emitter } from 'atom'
import etch from 'etch'
import MutationInterface, { ancestor } from './MutationInterface'

export default class DragHandler extends MutationInterface {

  element: Element
  root: Element
  previewClassName = 'drag-preview'
  handleClassName = 'drag-handle'

  constructor () {

    super()
    etch.initialize(this)

    this.onStart = () => this.initialContainer = this.panel
    this.onEnd = () => {
      this.axis = this.position
      atom.notifications.addInfo(this.panel.name + ' panel moved to ' + this.position)
    }
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
    return bounds.reduce((cur, cmp) => (cmp[0] > cur[0]) ? cur : cmp, [1, null])
  }

  get axis (): string {
    this.position = this.quarter[1]
    let preview = this.preview
    preview.classList.remove('left')
    preview.classList.remove('right')
    preview.classList.remove('top')
    preview.classList.remove('bottom')
    preview.classList.add(this.position)
    return this.position
  }

  set axis (targetArea: string) {
    console.log(this.panel, this.view, this.preview)
    ancestor(this.view).remove()
    this.previewElement.remove()
    atom.workspace.addPanel(targetArea, this.panel)
  }

  get anchor (): { position: string, amount: number } {
    return { position: this.axis, amount: 0 }
  }

  get width (): number {
    if (this.vertical)
      return window.innerWidth
    let { width } = this.view.getBoundingClientRect()
    return width
  }

  get height (): number {
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
      className={this.handleClassName}>
      </div>
    )
  }
}
