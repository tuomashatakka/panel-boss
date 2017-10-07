'use babel'
/** @jsx etch.dom */
// @flow

import { CompositeDisposable, Disposable, Emitter } from 'atom'
import etch from 'etch'
import MutationInterface, { INTERACT } from './MutationInterface'
import { isContainer, ancestorByTagName } from '../utils'

export default class DragHandler extends MutationInterface {

  element: HTMLElement
  root: Element
  previewClassName = 'boss boss-prop drag-preview'
  handleClassName = 'boss boss-handle drag-handle'

  constructor () {

    super()
    etch.initialize(this)

    this.onStart = () => {
      let { panel } = this
      this.initialContainer = panel
      this.toggleTargetPanel('hide')
      this.send(INTERACT.GRAB, { handler: this, initialContainer: this.initialContainer, panel })
    }
    this.onUpdate = () => {
      let { panel, view } = this
      this.send(INTERACT.DRAG, { handler: this, panel, view })
    }
    this.onEnd = () => {
      this.location = this.location
      this.toggleTargetPanel()
      atom.notifications.addInfo(this.panel.name + ' panel moved to ' + this.location)
    }
  }

  get quarter (): [number, PositionType | null] {
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

  get location (): PositionType | null {
    return this.quarter[1]
  }

  set location (targetArea: string | null) {

    let { panel, view } = this

    // Store the information about from which
    // atom-panel element the view is moved from
    let formerPanelElement = ancestorByTagName(view)

    // Check that the target the panel is going to
    // be moved into actually is a valid panel container
    if (isContainer(targetArea)) {

      // Add the panel as a new panel to correctly bind
      // atom's inner panel action event handlers

      atom.workspace.addPanel(targetArea, panel)
      this.send(INTERACT.DROP, { panel, view, handler: this, targetArea })

      // Remove the container after its contents
      // have been appended to a new host
      // formerPanelElement.remove()
    }

    // Finally, remove the preview element
    // from the DOM
    if (this.previewElement && this.previewElement.remove)
        this.previewElement.remove()
  }

  drawPreview () {
    let position = this.location
    let size = this.getPreviewSize()
    if (position)
      this.setPreviewPosition(position)
    this.setPreviewSize(size)
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
