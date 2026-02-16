
function log(message) {
    console.log(`(ℹ︎) ${message}`)
}

function warn(message) {
    console.log('\x1b[33m%s\x1b[0m',`(⚠︎) ${message}`)
}

function err(message) {
    console.log('\x1b[31m%s\x1b[0m',`(X) ${message}`)
}

function debug(message) {
    if (require("../data/config.json").debug) {
        console.log('\x1b[34m%s\x1b[0m',`(🧑‍💻) ${message}`)

    }
}

function fatal(message) {
    console.log('\x1b[31m%s\x1b[0m',`(⛔︎) ${message}`)
    console.log(`Stopping DAIV Haptic.`)
    process.exit(1)
}

function msg(message) {
    console.log(`(🤖) ${message}`)
}

module.exports = { log, warn, err, debug, msg, fatal }