// LM.ts
// Interaction with LM Studio and Ollama

const lmconfig = require("../data/config.json")
const http_er = require("../data/http-error-data.json")
let lmlogs = require("../data/logs.json") // fuck you typescript
const cmdTools = require("./cmd")

async function sendAi(sub: string, body: object, stream = false, method = "POST") {
    try {
        const url = new URL(lmconfig.api + "/" + sub)
        const streamHeader = stream ? "text/event-stream" : "application/json"
        const res = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Accept": streamHeader
            },
            body: (method != "GET") ? JSON.stringify(body) : null
        })

        if (!res.ok) {
            cmdTools.err(`LM Studio Status: ${res.status} | ${http_er[res.status] || "unknown status"}`)
        }

        return stream ? res.body : await res.json()
    } catch (error) {
        cmdTools.fatal(`Failed to fetch, the server is either down or unable to connect. Did you try turning it off and back on again?\n${error}`)
        return "ERROR"
    }
}

async function getIdealModel(preferred: string) {
    let prefer = preferred || lmconfig.model
    let models = await sendAi("models", null, false, "GET")
    let fallback = null
    cmdTools.debug(`Found model list. Searching for model '${prefer}'...`)
    if (models.error) {
        cmdTools.fatal("Unable to start due to models not loading. Full error: " + JSON.stringify(models.error))
    }
    for (let i of models.models) {
        if (prefer == "any" && i.size_bytes >= "1500000000" && i.type == "llm") { // if no specific model is specified, the auto search aims for one with >1.5GB (away from 2B and 1B models)
            cmdTools.debug(`Auto search found ${i.key}`)
            return i
        }else if (i.key == prefer && i.type == "llm") {
            cmdTools.debug(`Found model. Continuing...`) // ITS BLUE ITS BLUE
            return i
        }else if (i.type == "llm" && !fallback) {
            fallback = i
        }
    }
    if (prefer == "any") {
        cmdTools.fatal("No models to pick from!")
    }
    // Before confirming that it isn't there, check huggingface (by force)
    cmdTools.warn("Model not available, checking to see if it's on huggingface")
    let download = await sendAi("models/download", {
        model: prefer
    }, false)
    if (download.error) {
        cmdTools.debug("Yeah it ain't there. Using auto-detected fallback model " + fallback.key)
        return fallback
    } else {
        cmdTools.debug("LETS GOO IT EXISTS")
        models = await sendAi("models", null, false, "GET")
        return models.models.find(i => i.key = prefer)
    }
}

async function systemPrompt(systemPrompt, model) {
    cmdTools.log(`Injecting system prompt: ${systemPrompt}`)
    await sendAi("chat", {
        system_prompt: systemPrompt,
        model: model,
        input: "This message is just to input the system prompt. Please acknowledge by saying 'Ok.' and anothing else. Do not reason for too long.",
        context_length: lmconfig.contextLen || 8192
    }, false)
}

async function askAiStream(message:string, onChunk: Function, context = true, doStream: boolean = true, model: string) {
    // Is this the world's longest AI function? Let's find out!
    if (model) {
        cmdTools.debug("Using model " + model + " since used as input")
    }else{
        cmdTools.debug("Using model " + lmconfig.model + " since inputted in config")
    }

    if (typeof model === "object") {
        cmdTools.fatal("Nevermind, model is an object. Provide the MODEL NAME only.")
    }

    const payload = {
        model: model || lmconfig.model,
        stream: doStream,
        input: message,
        context_length: lmconfig.contextLen || 8192
    }

    if (doStream) {
        const stream = await sendAi("chat", payload, true)
        if (stream == "ERROR") {
            return "ERROR"
        }
        const reader = stream.getReader()
        const decoder = new TextDecoder()

        let full = ""

        while (true) {
            const { value, done } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n").filter(Boolean)

            for (const line of lines) {
                if (!line.startsWith("data:")) continue
                const data = line.replace("data:", "").trim()
                const json = JSON.parse(data)
                console.debug(json)
                if (json.type == "message.end") break
                const delta = json.content
                if (delta) {
                    full += delta
                    onChunk(full)
                }
            }
        }
        cmdTools.debug("Got full message: " + full)
        return full
    }else{
        cmdTools.log("Now waiting for the AI to generate, this may take a while if it's a large task")
        const res = await sendAi("chat", payload, false)
        if (res.error) {
            cmdTools.err("Error on LM Studio's end: " + JSON.stringify(res.error))
            return null
        }
        console.debug(res)
        if (onChunk) {
            onChunk(res.output.find(i => i.type = "message").content)
        }
        return res.output.find(i => i.type = "message").content
    }
}

module.exports = { askAiStream, getIdealModel, systemPrompt }