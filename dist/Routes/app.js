"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const mongoStore = require("connect-mongo");
const session = require("express-session");
const passportConfig_1 = require("./passportConfig");
const aclConfig_1 = require("./aclConfig");
// Routes Imports
const user_1 = require("./User/user");
class App {
    constructor() {
        this.mongoUrl = 'mongodb://localhost/project';
        this.MongoStore = mongoStore(session);
        this.app = express();
        this.mongoConfig();
        this.config();
    }
    mongoConfig() {
        mongoose.set("runValidators", true);
        mongoose.connect(this.mongoUrl);
    }
    config() {
        // Meh....Boilerplate
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json());
        this.app.use(session({ secret: 'ayyyylmao!', resave: true, saveUninitialized: true, store: new this.MongoStore({ mongooseConnection: mongoose.connection }) }));
        this.app.use(passportConfig_1.default.initialize());
        this.app.use(passportConfig_1.default.session());
        // Routes Configeration
        this.app.use(aclConfig_1.default.authorize);
        this.app.use("/api/users", user_1.default);
    }
}
exports.default = new App().app;
//# sourceMappingURL=app.js.map