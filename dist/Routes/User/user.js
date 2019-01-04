"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const userController_1 = require("../../controllers/user/userController");
const passportConfig_1 = require("../passportConfig");
const routes = express.Router();
/*
    GET : GET USER DATA
    POST : CREATE NEW USER
    PUT : UPDATE A USER
    DELETE : DELETE A USER

    A LOGGED IN USER CAN :-

        1. GET HIS PROFILE DATA (GET)
        2. UPDATE HIS PROFILE DATA (EXCLUDING EMAIL) (PATCH)
        3. GROUP MEMBERSHIP
            3.1 OWN A GROUP (IF COMMUNITY BUILDER)
            3.2 MANAGE A GROUP

    AN ADMIN CAN :-

        1. GET HIS PROFILE DATA
        2. UPDATE HIS PROFILE DATA
        3. CREATE A PROFILE (ONLY BASE INFO)
        4. UPDATE OTHER PROFILES (ONLY EMAIL AND PASSWORD)
        5. REMOVE OTHER PROFILES
        6. ACTIVATE OR DE-ACTIVATE PROFILES
        7. GROUP MEMBERSHIP
            6.1 CHANGE NAME AND ACTIVATE/DEACTIVATE A COMMUNITY
            6.2 BE A MEMBER OF A COMMUNITY

*/
console.log(typeof userController_1.default.getUser("community builder"));
routes.post("/auth", passportConfig_1.default.authenticate("local", {}), function (req, res) {
    res.json(req.user);
}); // Authenticate a user
routes.get("/:role/:email/profile", userController_1.default.getProfile);
routes.patch("/:role/:email/profile", userController_1.default.updateProfile);
routes.patch("/:role/:email/account", userController_1.default.updateAccount);
routes.post("/confirm", userController_1.default.insertProfile);
routes.put("/:role/:email", userController_1.default.addProfile);
// routes.delete("/:role/:email", UserController.deleteProfile);
exports.default = routes;
//# sourceMappingURL=user.js.map