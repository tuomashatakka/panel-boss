'use babel'
// @flow
// @jsx etch.dom

import etch from 'etch'
import { CompositeDisposable, Disposable, Emitter } from 'atom'
import { INTERACT } from './components/MutationInterface'

let _panel


export default class PanelManager {


  constructor () {
    this.subscriptions = new CompositeDisposable()
    etch.initialize(this)
  }


  get panel () {

    if (_panel)
      return _panel

    let props = {
      mutating: false,
      item:     this.element,
      show:     () => this.element.classList.add('open'),
      hide:     () => this.element.classList.remove('open'),
    }

    _panel = atom.workspace.addHeaderPanel(props)
    return _panel
  }


  update () {}

  render () {

    return <div>Panel manager.....</div>
  }

  destroy () {
    this.subscriptions.dispose()
  }
}
