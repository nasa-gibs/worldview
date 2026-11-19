const fs = require('fs')
const { globSync } = require('glob')
const MarkdownIt = require('markdown-it')
const shell = require('shelljs')
const console = require('console')

console.log('Converting markdown to html')
// html: the metadata markdown embeds raw HTML (<sup>, <br>, <a>) that must pass through
const md = new MarkdownIt({ html: true, linkify: false, typographer: false })

// Open links generated from markdown in a new window
const defaultLinkOpen = md.renderer.rules.link_open ||
  ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options, env, self))
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('target', '_blank')
  tokens[idx].attrSet('rel', 'noopener noreferrer')
  return defaultLinkOpen(tokens, idx, options, env, self)
}
const configFiles = globSync('build/options/config/metadata/**/*.md')
const aboutFiles = globSync('build/options/brand/about/*.md')
function convertMDtoHTML (mdFiles) {
  for (const mdFile of mdFiles) {
    const dest = mdFile.replace(/\.md$/, '.html')
    const markdown = fs.readFileSync(mdFile, { encoding: 'utf-8' })
    const html = md.render(markdown)
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
