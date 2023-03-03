const fs = require('fs')
const { globSync } = require('glob')
const showdown = require('showdown')
const shell = require('shelljs')
const console = require('console')

console.log('Converting markdown to html')
const converter = new showdown.Converter({
  openLinksInNewWindow: true,
  // don't require escaping underscores in the middle of a word
  literalMidWordUnderscores: true
})
const configFiles = globSync('build/options/config/metadata/**/*.md')
const aboutFiles = globSync('build/options/brand/about/*.md')
function convertMDtoHTML (mdFiles) {
  for (const mdFile of mdFiles) {
    const dest = mdFile.replace(/\.md$/, '.html')
    const markdown = fs.readFileSync(mdFile, { encoding: 'utf-8' })
    const html = converter.makeHtml(markdown)
    fs.writeFileSync(dest, html)
  }
}
convertMDtoHTML(configFiles)
convertMDtoHTML(aboutFiles)

// Remove the markdown files from the build since they've been converted to HTML
shell.rm('-rf', 'build/options/config/metadata/**/*.md')
shell.rm('-rf', 'build/options/brand/about/*.md')

console.log('Copying options to web directory')
shell.cp('-r', 'build/options/config', 'web')
shell.cp('-r', 'build/options/brand', 'web')
shell.cp('-r', 'build/options/brand.json', 'web/brand')
