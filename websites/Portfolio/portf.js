class Main {
    constructor(name, app, dir, log) {
        this.start(name, app, dir, log);
    }
    start(name, app, dir, log) {
        const express = require(`express`);
        const path = require("path");
        const fs = require("fs");
        const host = "dev-adly.tk";
        const countryIP = require("geoip-country");

        //=============================== [SOCIAL MEDIAS]
        const discordLink = "https://discord.gg/pNdECB3zVm";
        const cicDiscordlink = "https://discord.gg/ee5DmbSq4W";
        const instagramLink = "https://instagram.com/mostafa.adly.amar";
        const githubLink = "https://github.com/MostafaAdly";
        const profilePicture = `${dir}/views/img/profilePicture.png`;
        //=============================== [VARIABLES]
        let files;
        let usedUrls = [];
        //========================================

        app.set("view engine", "hbs");

        loadUsedUrls();
        refreshProjects();
        setInterval(() => {
            refreshProjects();
        }, 1000 * 60 * 60);
        //================================ [PAGES]
        app.get(`/`, (req, res) => {
            if (req.url != "/") return;
            let ip =
                req.headers["x-forwarded-for"] || req.connection.remoteAddress;
            log(
                name,
                `got a 'get' connection from [${ip}] ["${
                    countryIP.lookup(ip).country || "NOT FOUND"
                }"]`
            );
            res.render(`${dir}/views/index`, {
                page: "Home - Portfolio",
                name: "Mostafa Adly",
                city: "Egypt, Giza",
                age: "20",
                projects: files,
                dir: dir,
                media: [
                    {
                        name: "DISCORD",
                        link: `http://${host}/discord`,
                        picture: `/views/images/discord.svg`,
                    },
                    {
                        name: "INSTAGRAM",
                        link: `http://${host}/instagram`,
                        picture: `/views/images/instagram.svg`,
                    },
                    {
                        name: "GITHUB",
                        link: `http://${host}/github`,
                        picture: `/views/images/github.svg`,
                    },
                ],
                skills: [
                    {
                        name: "Java",
                        amount: 98,
                    },
                    {
                        name: "NodeJS",
                        amount: 93,
                    },
                    {
                        name: "Python",
                        amount: 85,
                    },
                    {
                        name: "HTML",
                        amount: 80,
                    },
                    {
                        name: "CSS",
                        amount: 66,
                    },
                ],
                services: [
                    {
                        name: "Web Development",
                        description: "..",
                    },
                    {
                        name: "Java Development",
                        description: "..",
                    },
                    {
                        name: "NodeJS Development",
                        description: "..",
                    },
                    {
                        name: "Discord Development",
                        description: "..",
                    },
                    {
                        name: "M.C. BukkitAPI Development",
                        description: "..",
                    },
                    {
                        name: "M.C. BungeeAPI Development",
                        description: "..",
                    },
                    {
                        name: "Apps Development",
                        description: "..",
                    },
                    {
                        name: "Telegram/WhatsApp Development",
                        description: "..",
                    },
                    {
                        name: "Desktop Apps Development",
                        description: "..",
                    },
                ],
                experiences: [
                    {
                        name: "WORKS COMPLETED",
                        amount: 181,
                        box: "counter-box",
                        class: "ion-checkmark-round",
                    },
                    {
                        name: "YEARS OF EXPERIENCE",
                        amount: 4.8,
                        box: "counter-box pt-4 pt-md-0",
                        class: "ion-ios-calendar-outline",
                    },
                    {
                        name: "TOTAL CLIENTS",
                        amount: 94,
                        box: "counter-box pt-4 pt-md-0",
                        class: "ion-ios-people",
                    },
                    {
                        name: "AGE",
                        amount: new Date().getFullYear() - 2002,
                        box: "counter-box pt-4 pt-md-0",
                        class: "ion-ribbon-a",
                    },
                ],
                pfp: profilePicture,
            });
        });

        app.get("/download/:id", (req, res) => {
            let file = getFilePathById(req.params.id);
            if (!file) return res.send("File was not found.");
            res.download(file);
        });
        app.get("/discord", (req, res) => {
            res.status(301).redirect(discordLink);
        });

        app.get("/cic", (req, res) => {
            res.status(301).redirect(cicDiscordlink);
        });

        app.get("/instagram", (req, res) => {
            res.status(301).redirect(instagramLink);
        });

        app.get("/github", (req, res) => {
            res.status(301).redirect(githubLink);
        });
        app.get("*", (req, res) => {
            res.status(301).redirect("/");
        });
        //========================================
        function getFirstNDigitsAfterDot(num, digits) {
            num = `${num}`;
            return num == null || num == 0 || digits <= 0
                ? num
                : Number(num.split(".")[0]) +
                      Number("0." + num.split(".")[1].slice(0, digits));
        }
        function getFilePathById(id) {
            if (!files) return;
            for (var a in files) if (files[a].name == id) return files[a].path;
            return null;
        }
        function loadUsedUrls() {
            fs.readdir(`${__dirname}/../`, (err, dir) => {
                for (var a in dir) {
                    if (dir[a].includes("--")) continue;
                    let config = require(`../${dir[a]}/config.json`);
                    if (!config || !config.usedUrls) continue;
                    for (var b in config.usedUrls)
                        usedUrls.push(config.usedUrls[b].toLowerCase());
                }
                log(name, `Loaded ${usedUrls.length} used URLS.`);
            });
        }

        function refreshProjects() {
            let p = `${__dirname}/available-projects-to-download`;
            files = [];
            fs.readdir(p, (err, dirs) => {
                if (err) return log(name, `Unable to see directory ${dirname}`);
                log(name, `Loading projects`);
                let b = 0;
                let dirsAmount = 0;
                for (var a in dirs) if (!dirs[a].includes(".")) dirsAmount++;
                let intv = setInterval(() => {
                    if (!fs.lstatSync(`${p}/${dirs[b]}`).isDirectory()) return;
                    fs.readdir(`${p}/${dirs[b]}`, (err, docs) => {
                        if (err) return log(name, err);
                        let config;
                        try {
                            config = require(`${p}/${dirs[b]}/config.json`);
                        } catch (error) {}
                        let fileSize =
                            fs.statSync(`${p}/${dirs[b]}/${config.filename}`)[
                                "size"
                            ] / 1024;
                        files.push({
                            name: config.name,
                            path: `${p}/${dirs[b]}/${config.filename}`,
                            languages: config.languages,
                            time: config.time || "9 Mar. 2020",
                            image: config.image,
                            size: `${
                                fileSize > 1000
                                    ? getFirstNDigitsAfterDot(
                                          fileSize / 1024,
                                          2
                                      ) + ` MB`
                                    : getFirstNDigitsAfterDot(fileSize, 2) +
                                      ` KB`
                            }`,
                        });
                        if (b >= dirsAmount - 1) {
                            log(
                                name,
                                `Projects list refreshed: ${
                                    !files ? 0 : files.length
                                } projects available`
                            );
                            return clearInterval(intv);
                        }
                        b++;
                    });
                }, 200);
            });
        }

        //========================================
    }
}

module.exports = Main;
