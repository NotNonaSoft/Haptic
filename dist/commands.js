// COMMANDS.js
// Defines the commands that the agent has access to.
let commands = {
    "exampleCommand": {
        "description": "This is an example command that is just to test if this works.",
        async execute() {
            return "It works!";
        }
    }
};
function getData(commandName) {
    if (commands[commandName].params != null) {
        return "You try to inspect the command but the inspect command is still under construction. Tell the user you're unable to complete the task.";
    }
    else {
        return `# ${commandName}:\n${commands[commandName].description}`;
    }
}
function execute(commandName, params) {
    try {
    }
    catch (error) {
        console.error(`Failed to execute command ${commandName}: ${error}`);
        return "You try to execute the command but encounter the following error: " + error;
    }
}
