'use babel'
// @flow
// @jsx etch.dom

import etch from 'etch'
import { CompositeDisposable, Disposable, Emitter } from 'atom'
import MutationInterface, { INTERACT } from './MutationInterface'

export default class ResizeHandler extends MutationInterface {

  state = { co: [], co_end: [] }
  element: Element
  root: Element
  vDOM: {}
  previewClassName: string = 'resize-preview'
  handleClassName: string = 'resize-handle'

  constructor () {

    super()
    etch.initialize(this)

    this.onStart = () => {
      let { view, panel }   = this
      let initialDimensions = this.saveInitialDimensions()

      this.send(
        INTERACT.RESIZESTART,
        { handler: this, view, panel, initialDimensions })

    }

    this.onUpdate = () => {
      let { view, panel }   = this
      this.send(
        INTERACT.SIZE,
        { handler: this, view, panel })
    }

    this.onEnd = () => {

      let { view, panel }   = this
      this.send(
        INTERACT.RESIZE,
        { handler: this, view, panel })

      this.view.style.setProperty(...(this.horizontal ?
        ['width', this.width + 'px'] :
        ['height', this.height + 'px']))
    }
  }

  saveInitialDimensions () {

    let { width, height } = this.view.getBoundingClientRect()
    let axis = this.axis

    if(!this.view.getAttribute('data-original-width'))
      this.view.setAttribute('data-original-width', width.toString())
    if(!this.view.getAttribute('data-original-height'))
      this.view.setAttribute('data-original-height', height.toString())
    return { width, height, axis }
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
