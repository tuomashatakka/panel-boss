'use babel'
// @flow

function getProps (obj={}) {
  let attrs = []
  for (let attr in obj) {
    if (attr === 'prototype' || attr.startsWith('__'))
      continue
    attrs.push(obj[attr])
  }
  return attrs
}

function make (tag, cls, content='') {
  let el = document.createElement(tag || 'div')
  el.setAttribute('class', cls || '')
  el.innerHTML = content
  return el
}

function logCollapseHandler ({ target }) {
  let el = target
  if (el.classList.contains('open') || el.parentElement.classList.contains('open')) {
    el.classList.remove('open')
    el.parentElement.classList.remove('open')
    return
  }
  while (el.parentElement.tagName !== 'ARTICLE') {
    el = el.parentElement
    el.classList.add('open')
  }
}

function getConsule () {
  window.consule = {//window.consule || {
    log: function() {
      try {
        let log = document.createElement('article')
        const delim = val => `<span class='sep'>${val}</span>`
        const arrayOpen = delim('[')
        const arrayClose = delim(']')
        const sep = delim(': ')
        const maxRecursionDepth = 4
        let currentDepth = 0

        const parse = (key, value, type): HTMLElement => {
          let el = 'div'
          if(type === 'object') {
            key = `${key}${sep}`
          }
          else if(type === 'array') {
            value = `<div class='indent'>${arrayOpen} ${value} ${arrayClose}</div>`
            key = `${key}${sep}`
          }
          else {
            let col = isNaN(parseInt(key))
            el = 'span'
            key = col ? `${key}${sep}` : ''
          }
          let indent = make('div', 'indent')
          indent.appendChild(make('span', 'key', key))
          indent.appendChild(make(el, 'value ' + type, value))
          return indent
        }
        const recurse = (obj={}, z=0, depthLimit=1) => {
          let accr = ''
          console.log(z, depthLimit)
          if (z > maxRecursionDepth)
            return obj.toString()
          for (let key in obj) {
            let att = obj[key]
            if (!att)
              continue
            let type = att.constructor ? att.constructor.name.toLowerCase() : 'undefined'
            let value = typeof att === 'object' ? recurse(att, z + 1, depthLimit) : att
            accr += parse(key, value, type).innerHTML
          }
          return accr
        }
        let content = ''
        for (const arg of [...arguments]) {
          let el = document.createElement('section')
          el.innerHTML = recurse(arguments, 0, 0)//, maxRecursionDepth)
          el.addEventListener('click', e => {
            consule.log(...arg)
          })
          log.appendChild(el)
        }
        window.consule.item.firstElementChild.appendChild(log)
      }
      catch (e) {
        console.log("consule.log.error.message.lol ->", e)
      }
    }
  }

  let item = document.querySelector('dev-console') ||
             document.createElement('dev-console')
  let className = 'dev-console'
  item.classList.add('padded')
  item.style.width = '360px'

  if (!item.firstElementChild)
    item.appendChild(document.createElement('code'))

  console.log(item)
  consule.panel = consule.panel || atom.workspace.addRightPanel({ item, className })
  if (!document.querySelector('atom-panel.dev-console')) {
    // consule.panel.item.removeEventListener('click', logCollapseHandler)
    consule.panel.onclickHandler = consule.panel.item.addEventListener('click', logCollapseHandler, true )
  }
  consule.item = consule.panel.item
  return consule
}
window.consule = getConsule()
export default window.consule
