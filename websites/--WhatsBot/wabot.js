class Main {
    constructor(name, app, dir, log) {
        this.start(name, app, dir, log);
    }
    start(name, app, dir, log) {
        /*
         WHATSAPP FIX:
         https://stackoverflow.com/questions/74412474/cannot-login-to-whatsapp-web-js-by-puppeteer-error
        */
        require("dotenv").config();
        const { Client, LocalAuth } = require("whatsapp-web.js");
        const qrcode = require("qrcode-terminal");
        const wiki = require("wikipedia");
        const fs = require("fs");
        //=============================
        const port = 1111;
        const version = "1.0";
        const prefix = "!";
        const devId = "01143265444";
        //=============================
        checkIfFolderExists(__dirname + "/reports/");
        const client = new Client({
            puppeteer: {
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            },
        });

        client.on("qr", (qr) => {
            qrcode.generate(qr, { small: true });
        });

        client.on("ready", async () => {
            log(name, "bot is ready!");
            const chats = await client.getChats();
            log(name, `WhatsApp API connected.`);
            log(name, `Loaded ${chats.length} chats from whatsapp API`);
            sendMessageToUser(devId, "Connected!", false);
        });

        client.on("message", async (msg) => {
            try {
                let _args = msg.body.split(/ +/g);
                let args = _args.slice(1);
                let cmd = _args[0].slice(prefix.length).toLowerCase();
                if (cmd == "help")
                    return client.sendMessage(msg.from, getHelpMessage());
                if (cmd == "spam") {
                    if (!msg.id.remote.includes(devId))
                        return msg.reply(
                            `This command is currently not allowed for normal users.`
                        );
                    if (args.length < 4)
                        return client.sendMessage(msg.from, getHelpMessage());
                    let type =
                        args[0].toLowerCase() == "group" ? "@g.us" : "@c.us";
                    let message = "";
                    if (args[1].charAt(0) != "2" && type == "@c.us")
                        args[1] = "2" + args[1];
                    for (var a in args)
                        message +=
                            a >= 3
                                ? args[a] + (a != args.length - 1 ? " " : "")
                                : "";
                    let amount = 50;
                    try {
                        amount = parseInt(args[2]);
                    } catch (error) {
                        amount = 50;
                    }
                    for (let i = 0; i < amount; i++) {
                        try {
                            client.sendMessage(
                                args[1] + type,
                                message.replace("{num}", i + "")
                            );
                        } catch (error) {}
                    }
                    return client.sendMessage(
                        msg.from,
                        `Spam started on user [${args[1]}] ${amount} times.`
                    );
                }
                if (cmd == "send") {
                    if (!msg.id.remote.includes(devId))
                        return msg.reply(
                            `This command is currently not allowed for normal users.`
                        );
                    if (args.length < 3)
                        return client.sendMessage(msg.from, getHelpMessage());
                    let message = "";
                    let type =
                        args[0].toLowerCase() == "group" ? "@g.us" : "@c.us";
                    if (args[1].charAt(0) != "2" && type == "@c.us")
                        args[1] = "2" + args[1];
                    for (var a in args)
                        message +=
                            a >= 2
                                ? args[a] + (a != args.length - 1 ? " " : "")
                                : "";
                    try {
                        client.sendMessage(
                            args[1].includes(type) ? args[1] : args[1] + type,
                            message
                        );
                    } catch (error) {
                        client.sendMessage(
                            message.from,
                            `This user does not exist. or error eccoured while sending this message.`
                        );
                    }
                }
                if (cmd == "report") {
                    let report = args.join(" ");
                    let time = new Date().getTime();
                    client.sendMessage(
                        msg.from,
                        `Please wait while searching for a proper report.`
                    );
                    try {
                        var page = await wiki.page(report); // MUST BE HERE FOR THE CODE TO WORK PROPERLY - CATCH EXCEPTION SOONER
                        report = report.replaceAll(` `, "-");
                        let id = randomID();
                        sendReportDoneMessage(
                            `http://dev-adly.tk/reports/${report}_${id}`,
                            msg,
                            page,
                            await page.images(),
                            time
                        );
                        createFileWithContent(report, id, await page.content());
                    } catch (error) {
                        log(name, error);
                        client.sendMessage(
                            msg.from,
                            `Could not find the topic (*${report}*) in wikipedia.`
                        );
                    }
                }
                if (cmd == "!!!" && msg.id.remote.includes(`@g.us`))
                    return client.sendMessage(msg.author, getHelpMessage());
            } catch (error) {
                log(name, `error eccoured`);
                log(name, error);
            }
        });

        function createFileWithContent(report, id = randomID(), content) {
            fs.open(
                `${__dirname}/reports/${report}_${id}`,
                "w",
                function (err, file) {
                    if (err) throw err;
                    fs.writeFile(
                        `${__dirname}/reports/${report}_${id}`,
                        content,
                        (errr) => {
                            if (errr) throw errr;
                        }
                    );
                    return file;
                }
            );
        }

        function randomID() {
            return Math.random().toString(36).substr(2, 9);
        }

        function getHelpMessage() {
            return `Available commands of version [${version}]:\n*1-* ${prefix}spam [group/ private] [chat-id] [number-of-times] [message] - *Under development*\n*2-* ${prefix}send [group/ private] [chat-id] [message] - *Under development*\n*3-* ${prefix}report <title> - *Available*`;
        }

        function checkIfFolderExists(folder) {
            if (!fs.existsSync(folder)) fs.mkdirSync(folder);
        }

        function sendMessageToUser(user, message, bool = true) {
            try {
                if (client)
                    client.sendMessage(
                        (user.charAt(0) == "2" ? user : "2" + user) + "@c.us",
                        message
                    );
                if (bool) log(`sent '${message}' to '${user}' from JavaBotAPI`);
            } catch (error) {
                log(name, `Error while trying to send a whatsapp message.`);
                log(name, error);
            }
        }

        function sendReportDoneMessage(url, msg, page, images, time) {
            let urls = "";
            if (images.length > 0)
                for (var a in images)
                    urls +=
                        a < 10
                            ? `*${parseInt(a) + 1}-* ${images[a].url}` +
                              (a != images.length - 1 ? "\n" : "")
                            : "";
            client.sendMessage(
                msg.from,
                `Successfully done in ${
                    (new Date().getTime() - time) / 1000
                }seconds, here a direct link to your report text content:
          \n${url}\n\nHere's a direct link to a wikipedia website that got the report from:
        \n${page.fullurl}${
                    images.length > 0
                        ? `\n\nHere's a direct link to some photos that might help:\n\n${urls}`
                        : ""
                }`
            );
        }
        //================================================= [EXPREES SERVER EVENTS]

        app.get("/whatsapp", (req, res) => {
            log(name, req.query);
            sendMessageToUser(req.query.id, req.query.msg);
            return res.sendStatus(200);
        });

        app.get("/reports/:id", (req, res) => {
            fs.readFile(
                `${__dirname}/reports/${req.params.id}`,
                { encoding: "utf8" },
                (err, data) => {
                    return res.send(
                        err
                            ? "File was not found."
                            : data.replaceAll("\n", "<br />")
                    );
                }
            );
        });

        //================================================= [MYSQL FUNCTIONS]

        // async function postReportToMySQL(report, content) {
        //     await execute(
        //         `insert into \`pastes\` (\`title\`, \`content\`) values('${report}', '${content.replaceAll(
        //             "'",
        //             "/##/"
        //         )}')`
        //     );
        // }

        //=========================================================================

        client.initialize();
    }
}

module.exports = Main;
