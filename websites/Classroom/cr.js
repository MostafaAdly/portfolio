// ======================================================[CONFIGS]
const mysqlDB = require("./mysql.json");
// ======================================================[CONSTRUCTORS]
const Classroom = require("./constructors/classroom.js");
const Student = require("./constructors/student.js");
const Teacher = require("./constructors/teacher.js");
// ======================================================[DATABASE]
let classroomsDB = require(`./database/classrooms.json`);
let teachersDB = require(`./database/teachers.json`);
let studentsDB = require(`./database/students.json`);
// ======================================================[VARIABLES]
const host = "https://dev-adly.tk"; // "http://103.252.91.38:1001";
let connection;
let authenticate = require("./authenticate.js");

// ======================================================[MAIN CLASS - HANDLER]
class Main {
    constructor(name, app, dir, log) {
        this.classrooms = {};
        this.teachers = {};
        this.students = {};
        this.name = name;
        this.log = log;
        this.MySQL_Connection();
        this.load();
        log(name, `==================[LOADING]==================`);
        log(name, `Loaded 'authenticate.js'`);
        log(name, `Loaded ${Object.keys(this.classrooms).length} classrooms`);
        log(name, `Loaded ${Object.keys(this.teachers).length} teachers`);
        log(name, `Loaded ${Object.keys(this.students).length} students`);
        log(name, `=============================================`);
        this.start(name, app, dir, log);
    }
    start(name, app, dir, log) {
        require("dotenv").config({ path: `${dir}/.env` });
        const express = require("express");
        const handlebars = require("hbs");
        const mysql = require("mysql");
        const path = require("path");
        const homePage = "/classrooms";
        const defaultProfilePicture =
            "https://cdn-icons-png.flaticon.com/512/219/219983.png";

        connection = mysql.createConnection({
            host: process.env.HOST,
            user: process.env.USER,
            password: process.env.PASS,
            database: process.env.DATABASE,
        });

        this.load_authenticate(app, connection, dir);

        // ======================================================[HandleBars-Helpers FUNCTIONS]

        handlebars.registerHelper("getImageById", (id) => {
            return (
                getUser(id)?.image ||
                "https://www.socialsciencespace.com/wp-content/uploads/student-3500990_960_720_opt.jpg"
            ).replace("{dir}", dir);
        });

        handlebars.registerHelper("getNameById", (id) => {
            return (getUser(id) || { name: id }).name;
        });

        handlebars.registerHelper("getCommentsCount", (classroom, postId) => {
            return Object.keys(
                (getPost(classroom, postId) || { comments: {} }).comments
            ).length;
        });

        handlebars.registerHelper("isTeacher", (id) => {
            return isTeacher(id);
        });

        handlebars.registerHelper("breaklines", function (text) {
            text = handlebars.Utils.escapeExpression(text);
            text = text.replace(/(\r\n|\n|\r)/gm, "<br>");
            return new handlebars.SafeString(text);
        });

        app.use((req, res, next) => {
            // SESSION CHECK
            if (req.url.includes(homePage) && !req.session.loggedin)
                return res.redirect(homePage + "/login");
            next();
        });

        // ======================================================[GET/POST METHODS]

        app.get(homePage + "/:id", async (req, res) => {
            let classroom = getClassroomById(req.params.id);
            if (!classroom) return res.send("class room was not found");
            classroom.homePage = homePage;
            return res.render(`${dir}/views/classroom`, {
                dir: dir,
                classroom: classroom,
                session: await getUserData(req.session.email),
            });
        });

        app.get(homePage, (req, res) => {
            return res.render(`${dir}/views/main`, {
                dir: dir,
                classes: [
                    {
                        name: "Mathematics",
                        link: host + `${homePage}/math-class-id`,
                    },
                    {
                        name: "English 102",
                        link: host + `${homePage}/english-class-id`,
                    },
                ],
            });
        });

        // ======================================================[STAND-BY FUNCTIONS]

        const getUserData = async (email) => {
            let data = {};
            if (email) {
                let rs = await this.MySQL_Query(
                    `select * from accounts where email='${email}'`
                );
                if (rs && rs.length) {
                    let userdata;
                    try {
                        userdata = JSON.parse(rs[0]["data"]);
                    } catch (error) {}
                    data = {
                        username: rs[0]["username"],
                        image: userdata ? userdata.image : null,
                        email: email,
                    };
                }
            }
            if (!data.image) data.image = defaultProfilePicture;
            return data;
        };

        const getClassroomById = (id) => {
            return this.classrooms[id];
        };

        const getUser = (id) => {
            return this.teachers[id] || this.students[id] || undefined;
        };

        const getPost = (classroom, postId) => {
            return this.classrooms[classroom]?.posts[postId] || undefined;
        };

        const isTeacher = (id) => {
            return this.teachers[id] != null;
        };

        const isStudent = (id) => {
            return this.students[id] != null;
        };
    }
    load() {
        for (var a in classroomsDB) {
            let newClassroom = new Classroom(classroomsDB[a]); // LOADING CLASSROOMS
            this.classrooms[classroomsDB[a].id] = newClassroom;
        }
        for (var a in teachersDB) {
            let newTeacher = new Teacher(teachersDB[a]); // LOADING TEACHERS
            this.teachers[teachersDB[a].email] = newTeacher;
        }
        for (var a in studentsDB) {
            let newStudent = new Student(studentsDB[a]); // LOADING STUDENTS
            this.students[studentsDB[a].email] = newStudent;
        }
    }
    MySQL_Connection() {
        if (!mysqlDB.enabled) {
            this.log(
                this.name,
                `MySQL connection is disabled, connecting to local database.`
            );
            return false;
        }
    }
    async MySQL_Query(query, arr = []) {
        return new Promise((res, rej) => {
            connection.query(query, arr, (err, rs, ff) => {
                if (err) this.log(this.name, err);
                if (err || rs.length <= 0) return res([]);
                return res(rs);
            });
        });
    }
    log(msg) {
        return (
            msg &&
            console.log(
                `[${new Date().toLocaleTimeString()}] [${this.name}]: ${msg}`
            )
        );
    }
    load_authenticate(app, con, dir) {
        authenticate = new authenticate().start(app, con, dir);
    }
}

module.exports = Main;
