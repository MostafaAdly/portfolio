class Student {
    constructor(database) {
        this.name = database.name;
        this.email = database.email;
        this.image = database.image;
    }
    load(connection) {
        // TODO: load from mysql or json file
    }
}

module.exports = Student;
