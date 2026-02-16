// COMMANDS.js
// Defines the commands that the agent has access to.

let commands = {
    "exampleCommand": {
        "description": "This is an example command that is just to test if this works.",
        async execute() {
            return "It works!"
        }
    },
    "inspect": {
        "description": "WIP, will allow you to view information about commands.",
        async execute(params) {
            const commandName = params['commandName']
            if (commands[commandName].params != null) {
                return "You try to inspect the command but the inspect command is still under construction. Tell the user you're unable to complete the task."
            }else{
                return `# ${commandName}:\n${commands[commandName].description}`
            }
        }
    }
}

async function help() {
    let string = "Below is information about all available commands. Use {inspect} to find parameter information for a command, with the param commandName for the name of the command.\n"
    for (let command in commands) {
        string += `{${command}} : ${commands[command].description}`
    }
}

module.exports = { commands, help }