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
  previewClassName: string = 'boss boss-prop resize-preview'
  handleClassName: string = 'boss boss-handle resize-handle'

  constructor () {

    super()
    etch.initialize(this)

    this.onStart = () => {
      let { view, panel }   = this
      let initialDimensions = this.saveInitialDimensions()
      this.toggleTargetPanel('hide')
      this.send(
        INTERACT.RESIZESTART,
        { handler: this, view, panel, initialDimensions })

    }

    this.onUpdate = () => {
      let { view, panel } = this
      this.send(
        INTERACT.RESIZE,
        { handler: this, view, panel })
    }

    this.onEnd = () => {
      let { view, panel } = this
      this._originalDimensions = {}
      this.toggleTargetPanel('show')
      this.send(
        INTERACT.SIZE,
        { handler: this, view, panel })
      this.view.style.setProperty(...(this.horizontal ?
        ['width', this.width + 'px'] :
        ['height', this.height + 'px']))
    }
  }

  drawPreview () {
    let { width: dx, height: dy } = this
    let { width, height } = this._originalDimensions || {width: dx, height: dy }
    this.preview.setAttribute('style', `
      width: ${width + dx}px;
      height: ${height + dy}px `)
  }

  saveInitialDimensions () {

    let { width, height } = this.view.getBoundingClientRect()
    let axis = this.location

    this._originalDimensions = { width, height }
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
