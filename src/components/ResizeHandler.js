'use babel'
// @flow
// @jsx etch.dom

import { CompositeDisposable, Disposable, Emitter } from 'atom'
import etch from 'etch'
import MutationInterface from './MutationInterface'

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

    this.onStart = () => this.saveInitialDimensions()
    this.onEnd = () => this.view.style.setProperty(...(this.horizontal ?
      ['width', this.width + 'px'] :
      ['height', this.height + 'px']))
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
      className={this.handleClassName}>
      </div>
    )
  }
}
