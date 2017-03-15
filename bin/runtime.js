/** @flow */
/** @babel */
/** @jsx etch.dom */
const { realpathSync } = require('fs')
const { sep }          = require('path')

const path = realpathSync('.')
const dir = path.split(sep).splice(-1)
const markdownEmphasis = new RegExp(/\n\*([\w\s]+)\*\n/gi)

module.exports = {
  path, dir, markdownEmphasis
}
