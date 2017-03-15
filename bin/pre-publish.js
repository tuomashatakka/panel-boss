/** @flow */
/** @babel */
/** @jsx etch.dom */

const { resolve } = require('path')
const { readFileSync, writeFileSync, realpathSync } = require('fs')
const { path, markdownEmphasis } = require('./runtime')
const package = require('../package.json')
const p = d => `${path}/${d}`


function getDescription () {
  let readme = readFileSync(p('README.md'), 'utf8')
  return markdownEmphasis.exec(readme)[1]
}


function overwritePackageProps (props={}) {

  // Replace the given properties for the package
  for (let prop in props) {
    package[prop] = props[prop]
  }

  // JSON encode
  let output = JSON.stringify(package, null, 4)

  // Print the content to be output
  console.log("output to package.json:", output)

  // Check that the output is valid json
  if(JSON.parse(output))
    writeFileSync(p('package.json'), output, 'utf8')

}


function __main() {

  let description = getDescription()
  let properties = {
    description }

  overwritePackageProps(properties)

}

__main()
