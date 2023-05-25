const express = require("express");
const app = new express();
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const handlebars = require("hbs");
const { v4: uuidv4 } = require("uuid");
const port = 1000;

//https://stackoverflow.com/questions/71260330/how-can-i-get-data-from-handlebars-to-js-file-using-request-body-properties-insi

//======================================== {VARIABLES}

const split = "/#/";
let forms = [];
loadForms();

//======================================== HELPING FUNCTIONs

// CREATING DEFAULT FOLDERS
let folders = ["saved-forms", "forms", "views", "views/css"];
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
app.use(express.static(path.join(__dirname, "/")));
app.set("view engine", "hbs");

//========================================
app.get("/forms/:id", (req, res) => {
    res.render(
        "index",
        replaceColorsIfAskedAsRandom(getFormById(req.params.id))
    );
});

app.get("/forms", (req, res) => {
    res.send(
        "Please specify a form id <br /> such as: https://dev-adly.tk/forms/test"
    );
});

app.post("/received-forms/:id", (req, res) => {
    saveForm(req.body);
    res.render("close");
});

app.get("*", (req, res) => {
    res.send(":(");
});

//========================================
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
    if (!form || !form.id || !saved || !form.uuid || isEmpty(form)) return;
    let arr = { uuid: form.uuid, id: form.id };
    let temp = {};
    for ([key, value] of Object.entries(form))
        if (key.includes(split)) temp[key.split(split)[0]] = value;
        else temp[key] = value;
    form = temp;
    for (var a in saved.questions)
        if (form[saved.questions[a].questionId])
            arr[saved.questions[a].title] = form[saved.questions[a].questionId];
    if (arr && Object.keys(arr).length) {
        createFolderIfDoesNotExist(`saved-forms/${form.id}`);
        fs.open(
            `saved-forms/${form.id}/${form.uuid}.json`,
            "w",
            (err, file) => {
                if (err) throw err;
                try {
                    fs.writeFileSync(
                        `saved-forms/${form.id}/${form.uuid}.json`,
                        JSON.stringify(arr)
                    );
                } catch (err) {
                    console.log(err);
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
    for ([key, value] of Object.entries(form))
        if (value != null && value.replaceAll(" ", "") != "") return false;
    return true;
}

function loadForms() {
    forms = [];
    fs.readdir(`forms/`, (err, dirs) => {
        if (err) return console.log(`Unable to see directory ${__dirname}`);
        let i = 0;
        let interval = setInterval(() => {
            if (i >= dirs.length) return clearInterval(interval);
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
    if (form.colors == "ran") form.colors = [ran(255), ran(255), ran(255)];
    return form;
}

//========================================
app.listen(port, console.log(`Listening in ${port}`));
