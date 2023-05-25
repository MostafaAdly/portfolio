class Main {
    constructor(name, app, dir, log) {
        this.start(name, app, dir, log);
    }
    start(name, app, dir, log) {
        const express = require("express");
        const path = require("path");
        const bodyParser = require("body-parser");
        const fs = require("fs");
        const handlebars = require("hbs");
        const { v4: uuidv4 } = require("uuid");

        //https://stackoverflow.com/questions/71260330/how-can-i-get-data-from-handlebars-to-js-file-using-request-body-properties-insi

        //======================================== {VARIABLES}

        const split = "/#/";
        let forms = [];
        loadForms();

        //======================================== HELPING FUNCTIONs

        // CREATING DEFAULT FOLDERS
        let folders = ["saved-forms", "forms", "views", "views/css", "files"];
        for (var a in folders) createFolderIfDoesNotExist(folders[a]);

        handlebars.registerHelper("if_eq", (a, b) => {
            return a == b;
        });
        handlebars.registerHelper("random_uuid", () => {
            return uuidv4();
        });

        //========================================

        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));

        //========================================

        app.get("/forms/:id", (req, res) => {
            let form = getFormById(req.params.id);
            form.dir = dir;
            res.render(
                `${dir}/views/index`,
                replaceColorsIfAskedAsRandom(form)
            );
        });

        app.get("/forms", (req, res) => {
            res.send(
                "Please specify a form id <br /> such as: https://dev-adly.tk/forms/test"
            );
        });

        app.get("/files/:id", (req, res) => {
            return res.download(getFilePathWithName(req.params.id));
        });

        app.post("/received-forms/:id", (req, res) => {
            saveForm(req.body);
            res.render(`${dir}/views/close`, { dir: dir });
        });

        //========================================
        function getFilePathWithName(name) {
            return __dirname + "/files/" + name;
        }

        function getFormById(id) {
            let arr = forms.filter((a) => {
                if (a.id == id) return a;
            });
            return !arr.length ? {} : arr[0];
        }

        function ran(i) {
            return Math.floor(Math.random() * i);
        }

        function saveForm(form) {
            let saved = getFormById(form.id);
            if (!form || !form.id || !saved || !form.uuid || isEmpty(form))
                return;
            let arr = { uuid: form.uuid, id: form.id };
            let temp = {};
            for (const [key, value] of Object.entries(form))
                if (key.includes(split)) temp[key.split(split)[0]] = value;
                else temp[key] = value;
            form = temp;
            for (var a in saved.questions)
                if (form[saved.questions[a].questionId])
                    arr[saved.questions[a].title] =
                        form[saved.questions[a].questionId];
            if (arr && Object.keys(arr).length) {
                createFolderIfDoesNotExist(
                    `${__dirname}/saved-forms/${form.id}`
                );
                fs.open(
                    `${__dirname}/saved-forms/${form.id}/${form.uuid}.json`,
                    "w",
                    (err, file) => {
                        if (err) throw err;
                        try {
                            fs.writeFileSync(
                                `${__dirname}/saved-forms/${form.id}/${form.uuid}.json`,
                                JSON.stringify(arr)
                            );
                        } catch (err) {
                            log(name, err);
                        }
                    }
                );
            }
        }

        function createFolderIfDoesNotExist(folder) {
            try {
                fs.access(__dirname + "/" + folder, (err) => {
                    if (err) fs.mkdir(__dirname + "/" + folder, (err2) => {});
                });
            } catch (error) {}
        }

        function isEmpty(form) {
            for (const [key, value] of Object.entries(form))
                if (key && value && value.replaceAll(" ", "") != "")
                    return false;
            return true;
        }

        function loadForms() {
            forms = [];
            fs.readdir(`${__dirname}/forms/`, (err, dirs) => {
                if (err)
                    return log(name, `Unable to see directory ${__dirname}`);
                let i = 0;
                let interval = setInterval(() => {
                    if (i >= dirs.length) {
                        log(name, `Loaded ${forms.length} form`);
                        return clearInterval(interval);
                    }
                    let file = require(`./forms/${dirs[i]}`);
                    for (var a in file.questions)
                        file.questions[a].questionId = file.questions[a].title
                            .toLowerCase()
                            .replaceAll(" ", "-");
                    forms.push(file);
                    i++;
                }, 100);
            });
        }

        function replaceColorsIfAskedAsRandom(form) {
            if (form.colors == "ran")
                form.colors = [ran(255), ran(255), ran(255)];
            return form;
        }

        //========================================
    }
}
module.exports = Main;
