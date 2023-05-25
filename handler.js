const express = require("express");
const fs = require("fs");
const colors = require("colors");
const path = require("path");
const app = express();
const port = 80;
const scripts = {};

app.use(express.static(path.join(__dirname, "/")));
app.set("views", `${__dirname}`);

// ===========================================
loadScripts();
function loadScripts() {
    // LOADING PORTFOLIO LAST TO FIX THE WILDCARD '*' OVERRIDE
    let overrideScript = "Portfolio";
    fs.readdir("websites/", (err, dir) => {
        if (err) throw err;
        for (var a in dir) {
            try {
                if (
                    !dir[a].includes("--") &&
                    dir[a].toLowerCase() != overrideScript.toLowerCase()
                )
                    runScript(
                        dir[a],
                        require(`./websites/${dir[a]}/config.json`)
                    );
            } catch (error) {
                log(error);
            }
        }

        try {
            runScript(
                overrideScript,
                require(`./websites/${overrideScript}/config.json`)
            );
        } catch (error) {
            log(
                `${overrideScript} did not load beacause it was not found or it is disabled.`
            );
        }
    });
}

function runScript(path, config) {
    if (!path || !config || !config.script || !config.name) return;
    try {
        scripts[config.name] = config["console-color"];
        new (require(`./websites/${path}/${config.script}`))(
            config.name,
            app,
            `websites/${path}`,
            log
        );
    } catch (error) {
        console.log(error);
    }
}
// ===========================================

function log(name, msg, isError = false) {
    let color = scripts[name] || "white";
    return (
        msg &&
        console.log(
            `[${new Date().toLocaleTimeString().gray}] [${
                isError ? name.red : name[color]
            }]: ${msg}`
        )
    );
}

// ===========================================
app.listen(port, log(`Listening on port [${port}]`));
