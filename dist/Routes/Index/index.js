"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const userController_1 = require("../../controllers/userController");
const userController_2 = require("../../controllers/userController");
const routes = express.Router();
/*
    GET : GET USER DATA
    POST : CREATE NEW USER
    PUT : UPDATE A USER
    DELETE : DELETE A USER
*/
routes.get("/", userController_1.default.readAll);
routes.get("/:email", userController_1.default.read);
routes.post("/", userController_1.default.create);
routes.post("/auth/:email", userController_1.default.authenticate);
routes.put("/:type/:email", userController_1.default.update);
routes.put("/promote/:to/:email", userController_2.default.promote);
routes.delete("/:email", (req, res) => {
    res.send({
        "message": "TODO DELETE USER"
    });
});
exports.default = routes;
//# sourceMappingURL=index.js.map