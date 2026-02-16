
function log(message) {
    console.log(`(ℹ︎) ${message}`)
}

function warn(message) {
    console.log(`(⚠︎) ${message}`)
}

function err(message) {
    console.log(`(X) ${message}`)
}

function debug(message) {
    if (require("../data/config.json").debug) {
        console.log(`(🧑‍💻) ${message}`)
    }
}

function fatal(message) {
    console.log(`(⛔︎) ${message}`)
    console.log(`Stopping DAIV Haptic.`)
    process.exit(1)
}

function msg(message) {
    console.log(`(🤖) ${message}`)
}

module.exports = { log, warn, err, debug, msg, fatal }