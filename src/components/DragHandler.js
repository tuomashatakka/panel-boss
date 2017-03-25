'use babel'
// @flow
// @jsx etch.dom

import { CompositeDisposable, Disposable, Emitter } from 'atom'
import etch from 'etch'
import MutationInterface, { ancestor, INTERACT } from './MutationInterface'

export default class DragHandler extends MutationInterface {

  element: Element
  root: Element
  previewClassName = 'drag-preview'
  handleClassName = 'drag-handle'

  constructor () {

    super()
    etch.initialize(this)

    this.onStart = () => {
      let { panel } = this
      this.initialContainer = panel
      this.send(INTERACT.GRAB, { handler: this, initialContainer: this.initialContainer, panel })
    }
    this.onUpdate = () => {
      let { panel, view } = this
      this.send(INTERACT.DRAG, { handler: this, panel, view })
    }
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

    let { panel, view } = this

    // Store the current container to memory
    let deprecatedAtomPanelElement = ancestor(view)

    // Add the panel as a new panel to correctly bind
    // atom's inner panel action event handlers
    atom.workspace.addPanel(targetArea, this.panel)
    this.send(
      INTERACT.DROP,
      { panel, view, handler: this, targetArea })

    // Remove the container after its contents
    // have been appended to a new host, as well
    // as the preview panel element
    deprecatedAtomPanelElement.remove()
    this.previewElement.remove()
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

  render () {
    return (
      <div
      onMouseDown={this.onMutationBegin}
      className={this.handleClassName}>
      </div>
    )
  }
}
