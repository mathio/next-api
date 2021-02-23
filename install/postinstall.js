const fs = require('fs')
const path = require('path')
const process = require('process')

const lstat = (path) => {
  try {
    return fs.lstatSync(path)
  } catch (e) {}
}
const isDir = (path) => {
  const stat = lstat(path)
  return stat && stat.isDirectory()
}
const isFile = (path) => {
  const stat = lstat(path)
  return stat && stat.isFile()
}
const log = (...params) => console.log('-----', ...params)

const installPaths = ['./src/pages', './pages']

const hostProjectDir = process.env.INIT_CWD
const moduleDir = path.resolve(__dirname, '..')

if (hostProjectDir === moduleDir) {
  log('Not installing as a dependency, API installation skipped')
  return
}

const installationSourceFile = path.join(moduleDir, './install/template.js')

log('Installing next-api')
log('Destination:', hostProjectDir)
log('Source:', installationSourceFile)

let installed = false
let alreadyInstalledFile = null

installPaths.forEach((installDir) => {
  if (!installed && !alreadyInstalledFile) {
    const pagesDir = path.join(hostProjectDir, installDir)
    const pagesDirExists = isDir(pagesDir)

    if (pagesDirExists) {
      const apiDir = path.join(pagesDir, 'api')
      const apiDirExists = isDir(apiDir)

      const installFile = path.join(apiDir, '[collection].js')
      const isInstalled = isFile(installFile)

      if (!isInstalled) {
        if (!apiDirExists) {
          fs.mkdirSync(apiDir)
        }

        fs.copyFileSync(installationSourceFile, installFile)
        log(`Installed to ${installFile}`)
        installed = true
      } else {
        alreadyInstalledFile = installFile
      }
    }
  }
})

if (alreadyInstalledFile) {
  log(`Automatic installation failed. ${alreadyInstalledFile} already exists.`)
  log('Please make sure your [colletion.js] is correct.')
} else if (!installed) {
  log(`Automatic installation failed. Directories ${installPaths.join(' or ')} do not exist.`)
  log('Please create [colletion.js] manually.')
}
