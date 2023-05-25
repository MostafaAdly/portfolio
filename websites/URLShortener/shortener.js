class Main {
    constructor(name, app, dir, log) {
        this.start(name, app, dir, log);
    }
    start(name, app, dir, log) {
        const URL = require("url").URL;
        const fs = require("fs");

        // ====================================== VARIABLES
        let config = require("./config.json");
        let shortenedURL = `https://dev-adly.tk/urlshortener/`;
        let changed = false;

        setInterval(() => {
            if (changed == true) {
                saveConfig(config);
                changed = false;
            }
        }, 1000 * 60 * 3);

        // ====================================== EXPRESS FUNCTIONS
        if (!config || !config.urls) return;

        app.get("/urlshortener", (req, res) => {
            return res.render(`${dir}/views/index`, {
                name: "M.Adly URLShortener",
                urls: Object.keys(config.urls).length,
                dir: dir,
            });
        });

        app.get("/urlshortener/:id", (req, res) => {
            let id = req.params.id;
            if (!id) return res.sendStatus(404);
            let url = getUrlByID(req.params.id);
            if (!url)
                return res.render(`${dir}/views/show-message`, {
                    message: "This url does not exist.",
                    dir: dir,
                });
            return res.status(301).redirect(url);
        });

        app.post("/shortenurl", (req, res) => {
            if (isValidURL(req.body.url)) {
                let id = getIdByURL(req.body.url) || randomID();
                if (!doesExist(id)) {
                    changed = true;
                    config.urls[id] = req.body.url;
                }
                return res.render(`${dir}/views/show-message`, {
                    message: "URL has been shortened successfully.",
                    url: `${shortenedURL}${id}`,
                    dir: dir,
                });
            }
            return res.render(`${dir}/views/show-message`, {
                message: "This is not a valid url.",
                dir: dir,
            });
        });

        // ======================================= FUNCTIONS

        function doesExist(id) {
            return id && config.urls[id];
        }

        function getIdByURL(url) {
            let id;
            for (const [key, value] of Object.entries(config.urls))
                if (value == url) {
                    id = key;
                    break;
                }
            return id;
        }

        function getUrlByID(id) {
            return doesExist(id) ? config.urls[id] : null;
        }

        function saveConfig() {
            fs.writeFile(
                `${__dirname}/config.json`,
                JSON.stringify(config, null, 2),
                (err) => {
                    if (err) throw err;
                }
            );
        }

        function isValidURL(url) {
            try {
                new URL(url);
                return true;
            } catch (err) {
                return false;
            }
        }

        function randomID() {
            return Math.random().toString(36).substr(2, 9);
        }

        log(name, `Loaded ${Object.keys(config.urls).length} from config.json`);
    }
}

module.exports = Main;
