const cmd = require("./cmd")
const pkg = require("../package.json")

console.log("   /‾\\  /‾\\")
console.log("   | |  | |")
console.log("   | |  | |");
console.log("   \\_/  \\_/")
console.log("")
console.log(" \\‾\\_____ ")
console.log("  \\______/     \n                 DAIV Haptic | Version", pkg.version)

cmd.log("Importing modules, please wait..")
const fs = require("fs")
cmd.log(`Loaded FS with version ${fs.version}`)
const path = require("path")
const express = require("express")
cmd.log(`Loaded Express with version ${express.version}`)
const os = require("os")
cmd.log(`Loaded OS with version ${os.version}`)

const config = require("../data/config.json")
cmd.debug("Got settings from config.json succesfully.")
const ollama = require("./lm")

cmd.log("All modules loaded! Starting up agent now...")

// Build logs if not present
var logs:Object[] = require("../data/logs.json")

function refreshLogs(){
    logs = require("../data/logs.json")
}
async function refreshModel() {
    let idealModel = await ollama.getIdealModel()
    cmd.log("We got the model, it's " + idealModel.key)
    return idealModel.key
}
async function grabCutoff() {
    let cutoffDate = await ollama.askAiStream(`What is your knowledge cutoff date? Please provide in the following format: MM/YY, eg 11/23 for November 2023. Don't include any punctuation, prefixes, or suffixes, just provide the date and the date only.`, null, false, false, model)
    cmd.debug("Cutoff date is: " + cutoffDate)
    return cutoffDate
}
let model;
async function load() {
    model = await ollama.getIdealModel()
    model = model.key
    await ollama.systemPrompt("You are DAIV Haptic, an AI agent created by NonaSoft. You are made to handle everyday tasks and help your user (or 'human') at tasks like searching the web, compiling long documents, searching through the system for files, etc. You are built with security in mind, so not all of these features will be available unless the user says it is ok. A reminder that you are in Pre-ALPHA development, meaning lots of bugs will be present around your software. If any bugs do occur, you'll be notified and instructed to tell tell the user what failed. Also, avoid thinking for too long because otherwise some stuff might break. Keep your message on one line..", model)
    await ollama.systemPrompt(`THE FOLLOWING ARE THE SETTINGS FOR YOU CONFIGURATION: ${JSON.stringify(config)}`, model)
    await ollama.systemPrompt(`You have the ability to use commands, if you want to use them, the syntax is {"command":"name of the command","params":{"any requires params go":"here"}}. Commands are referred in system instructions and commands via {command-name}. For a list of commands, use {help}.`, model)
    const cutoffDate = grabCutoff()
}
load()

const app = express()
const port = config.port || 4275

app.get(`/`, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'web.html'));
})

app.get("/api/chat", async (req, res) => {
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.setHeader("Content-Type", "object/event-stream")
  res.flushHeaders()

  const msg = req.query.msg
  cmd.log("Got message: " + msg)

  let commandsUsed = []
  let aim = ""
  await ollama.askAiStream(`Message from user: ${msg}`,async function(totalSoFar) {
    aim = totalSoFar
  },true,true,model)
  res.write({
    message: "Generating...",
    commandsUsed
  })
  try {
    while (JSON.parse(aim).command) {
      const { commands, help } = require("./commands")
      const command = JSON.parse(aim).command
      if (command == "help") {
        aim = await ollama.askAiStream(`Responding to command {help}: ${help()}`,null,true,true,model)
      } else if (commands[command]) {
        cmd.info("AI is using command " + command)
        aim = await ollama.askAiStream(`Responding to command {${command}}: ${commands[command].execute(JSON.parse(aim).params || null)}`,null,true,true,model)
      } else {
        aim = await ollama.askAiStream(`Command not found: ${command}`,null,true,true,model)
      }
      commandsUsed.push(command)
      res.write({
        message: "Using commands...",
        commandsUsed
      })
    }
  } catch {}
  res.write({
    message: aim,
    commandsUsed
  })
  res.end()
  cmd.log("Sent back: " + aim)
})


app.listen(port, () => {
    const interfaces = os.networkInterfaces();
      let address = '127.0.0.1'; // default ip
      for (const name in interfaces) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            address = iface.address;
          }
        }
      }
    cmd.log(`Web UI started on http://${address}:${port} succesfully.`)
})