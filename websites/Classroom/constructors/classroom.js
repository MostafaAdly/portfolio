class Classroom {
    constructor(database) {
        this.id = database.id;
        this.name = database.name;
        this.description = database.description;
        this.image = database.image;
        this.posts = database.posts;
    }
}

module.exports = Classroom;
