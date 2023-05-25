class Main {
    constructor(name, app, dir, log) {
        this.start(name, app, dir, log);
    }
    start(name, app, dir, log) {
        const fs = require("fs");
        const express = require("express");

        // ====================================== VARIABLES
        let config = require("./config.json");

        // ====================================== Express
        app.use(express.json());

        app.get("/file-download/:id", (req, res) => {
            let id = req.params.id;
            let file = `${__dirname}/uploads/${id}`;
            if (!file) return res.send("File was not found.");
            res.download(file);
        });

        app.post("/file-uploader", (req, res) => {
            let strBuffer = req.body?.file;
            const failed = { status: "failed" };
            try {
                if (strBuffer) {
                    let buffer = Buffer.from(strBuffer, "base64url");
                    let filename = req.body.filename;
                    if (!buffer || !filename) return res.json(failed);
                    saveFile(filename, buffer);
                    return res.json({ status: "saved" });
                }
            } catch (error) {
                console.log(error?.message);
            }
            res.json(failed);
        });

        function saveFile(filename, buffer) {
            fs.writeFile(`${__dirname}/uploads/${filename}`, buffer, (err) => {
                if (err) return console.error(err);
            });
        }

        log(name, `Loaded FileUploaderAPI`);
    }
}

module.exports = Main;
