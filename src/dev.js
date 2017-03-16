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

  let item = document.querySelector('dev-console') ||
             document.createElement('dev-console')
  let className = 'dev-console'
  item.classList.add('padded')
  item.style.width = '360px'

  if (!item.firstElementChild)
    item.appendChild(document.createElement('code'))

  window.consule = {//window.consule || {

    item,
    getPanel: () => window.consule.panel ||
      document.querySelector('atom-panel.dev-console') ||
      window.atom.workspace.addRightPanel({ item: window.consule.item, className }),

    clear: function () {
      window.consule.item.firstElementChild.innerHTML = ''
    },

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
            value = `<div class='indent'>${value} ${arrayClose}</div>`
            key = col ? `${key}${sep}` : ''
          }
          let indent = make('div', 'indent')
          indent.appendChild(make('span', 'key', key))
          indent.appendChild(make(el, 'value ' + type, value))
          return indent
        }
        const recurse = (obj={}, z=0, depthLimit=1) => {

          let accr = ''
          if (z > depthLimit)
            return ''

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
        let args = [...arguments]
        console.log(args)
        for (let arg of args) {
          let el = document.createElement('section')
          el.innerHTML = recurse(arg, 0, 1)//, maxRecursionDepth)
          // el.addEventListener('click', e => {
          //   consule.log(...arg)
          // })
          log.appendChild(el)
        }
        window.consule.item.firstElementChild.appendChild(log)
      }
      catch (e) {
        console.log("consule.log.error.message.lol ->", e)
      }
    },
  }



  if (!document.querySelector('atom-panel.dev-console')) {
    consule.getPanel().onclickHandler = consule.item.addEventListener('click', logCollapseHandler, true )
  }
  return consule
}


window.consule = getConsule()
window.consule.clear()
export default window.consule
