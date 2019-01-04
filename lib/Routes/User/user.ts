import * as express from "express";
import UserController from "../../controllers/user/userController";
import userPaginate from "../../controllers/user/userPaginate";
import sendMail from "../../controllers/user/adminMail";
import passport from "../passportConfig";

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
routes.post("/auth", passport.authenticate("local", {}), function(req:express.Request, res:express.Response){
    res.json(req.user);
}); // Authenticate a user
routes.get("/:role/:email/profile", function(req:express.Request, res:express.Response){UserController.getProfile(req,res)});
routes.patch("/:role/:email/profile", function(req:express.Request, res:express.Response){UserController.updateProfile(req,res)});
routes.patch("/:role/:email/account", function(req:express.Request, res:express.Response){UserController.updateAccount(req,res)});
routes.post("/logout", function(req:express.Request, res:express.Response){
    req.logout();
    res.json({"message":"logged out"});
});
routes.post("/confirm", function(req:express.Request, res:express.Response){UserController.insertProfile(req,res)});
routes.put("/:role/:email", function(req:express.Request, res:express.Response){UserController.addProfile(req,res)});
// routes.delete("/:role/:email", UserController.deleteProfile);

// Misc

routes.get("/loggedIn", function(req:express.Request, res:express.Response){
    if (req.user && req.user.id && req.user.email && req.user.role) {
        res.json({...req.user, loggedIn: true});
    } else {
        res.json({loggedIn: false});
    }
})

routes.post("/all", userPaginate);
routes.post("/mail", sendMail);

export default routes;

