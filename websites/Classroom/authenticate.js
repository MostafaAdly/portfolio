class Authenticate {
    start(app, connection, dir) {
        require("dotenv").config();
        const express = require("express");
        const mysql = require("mysql");
        const session = require("express-session");
        const path = require("path");
        const bodyParser = require("body-parser");
        const homePage = "/classrooms";

        app.use(
            session({
                secret: "secret",
                resave: true,
                saveUninitialized: true,
            })
        );
        app.set("view engine", "hbs");
        app.use(bodyParser.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(express.static(path.join(__dirname, "views")));

        app.get(homePage + "/register", (req, res) => {
            if (req.session.loggedin) return res.redirect(homePage); // CHECK IF ALREADY AUTH-ed
            let err = req.session.message;
            if (err) req.session.message = null;
            res.render(`${dir}/views/register`, {
                error_message: err,
                homePage: homePage,
            });
        });
        app.get(homePage + "/login", (req, res) => {
            if (req.session.loggedin) return res.redirect(homePage); // CHECK IF ALREADY AUTH-ed
            let err = req.session.message;
            if (err) req.session.message = null;
            res.render(`${dir}/views/login`, {
                error_message: err,
                homePage: homePage,
            });
        });

        app.get(homePage + "/logout", (req, res) => {
            if (req.session.loggedin) {
                req.session.loggedin = null;
                req.session.email = null;
                req.session.message = null;
            }
            return res.redirect(homePage + "/login");
        });

        app.post("/auth", async (req, res) => {
            let username = req.body.username;
            let password = req.body.password;
            let email = req.body.email;
            if (username && password) {
                if (email != null) {
                    // CHECKING IF EMAIL EXISTS
                    var exists = await sql(
                        `select * from accounts where email='${email}'`
                    );
                    if (exists && exists.length) {
                        req.session.message = "Email already exists.";
                        return res.redirect(homePage + "/register");
                    }

                    // CHECKING IF EMAIL IS VALID
                    if (!isEmail(email)) {
                        req.session.message =
                            "The email you entered is not valid.";
                        return res.redirect(homePage + "/register");
                    }

                    // CHECKING IF PASSWORD IS VALID
                    if (password.length <= 4 || password.length >= 100) {
                        req.session.message =
                            "The password you entered is too short or too long.";
                        return res.redirect(homePage + "/register");
                    }

                    // REGISTERING
                    let rs = await sql(
                        `insert into \`accounts\` (\`username\`, \`password\`, \`email\`) values ('${username}', '${password}', '${email}')`
                    );
                    if (rs) {
                        req.session.loggedin = true;
                        req.session.email = email;
                        req.session.message = "Registered successfully.";
                        return res.redirect(homePage);
                    }
                } else {
                    // LOGGING IN
                    let rs = await sql(
                        "select * from `accounts` where username=? and password=?",
                        [username, password]
                    );
                    if (rs && rs.length) {
                        req.session.loggedin = true;
                        req.session.email = rs[0]["email"];
                        req.session.message = "Logged in successfully.";
                        return res.redirect(homePage);
                    }
                }
                req.session.message =
                    "The username or password you entered is not valid.";
                return res.redirect(
                    homePage + `/${email == null ? "login" : "register"}`
                );
            }
            req.session.message =
                "Some fields are empty, please make sure you're entering valid credentials.";
            res.redirect(homePage + "/login");
        });

        function isEmail(email) {
            return (
                email &&
                email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
            );
        }

        async function sql(query, arr = []) {
            return new Promise((res, rej) => {
                connection.query(query, arr, (err, rs, ff) => {
                    if (err) console.log(err);
                    if (err || rs.length <= 0) return res([]);
                    return res(rs);
                });
            });
        }
    }
}

module.exports = Authenticate;
