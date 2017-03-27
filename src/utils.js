'use babel'
// @flow

import { PACKAGE_NAME, SCHEMA, CONTAINERS, CONTAINER_TAG } from './constants'
import { Disposable } from 'atom'


/**
 * Checks whether the given name is a valid panel container or not
 *
 * @method isContainer
 * @param  {string}    name Name for the container that should be validated
 * @return Boolean          true if the given string is valid, false otherwise
 */

export function isContainer (name: string | void): boolean {
  return CONTAINERS.indexOf(name || '') > -1
}


/**
 * Get the DOM view for the given panel
 *
 * @method getView
 * @param  {Panel}  panel Panel from which the view is resolved
 * @return {Element}      HTMLElement describing the found view
 */

export function getView (panel: AtomPanelType): HTMLElement {
     let view  = atom.views.getView(panel)
  return view && view.element ? view.element : view
}


export function getPanelDefaultSize () {
  return atom.config.get(`${PACKAGE_NAME}.${SCHEMA.DEFAULT_SIZE}`)
}



export function getContainer (position: PositionType | null): HTMLElement | null {
  if (!position)
    return null
  let container = document.querySelector(`atom-panel-container.${position}`)
  return (container && container.tagName === CONTAINER_TAG) ? container : null
}


/**
 * Binds an event listener to the given element and returns a Disposable
 * which removes said element's bound listener on its disposal.
 *
 * @method bindDisposableEvent
 * @param  {string}            e        Name for the event that should be bound
 * @param  {Element}           el       The element the listener is bound into
 * @param  {Function}          callback Event listener callback
 * @return {Disposable}                 A Disposable object with removeEventListener
 *                                      as its disposal action
 */

export function bindDisposableEvent (e, el, callback) {

  let attach = () => el.addEventListener(e, callback)
  let remove = () => el.removeEventListener(e, callback)
  attach()
  return new Disposable(() => remove())

}


/**
 * Parse mouse x and y coordinates from an event object
 *
 * @method positionFromEvent
 * @param  {Event}
 * @return {Array}   2-dimensional coordinates as an array
 */

export function positionFromEvent ({ clientX: x=0, clientY: y=0 }): Array<number> {
  return [ x, y ]
}


/**
 * Find the closest ancestor with the provided tag name
 *
 * @method ancestorByTagName
 * @return {HTMLElement}
 */

export const ancestorByTagName = (el: HTMLElement, tagName: string = 'ATOM-PANEL'): HTMLElement | null =>
  !el ? null : el.tagName !== tagName ? ancestorByTagName(el.parentElement, tagName) : el
