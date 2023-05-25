class Teacher {
    constructor(database) {
        this.email = database.email;
        this.name = database.name;
        this.image = database.image;
    }
    load(connection) {
        // TODO: load from mysql or json file
    }
}

module.exports = Teacher;
