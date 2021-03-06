
import * as express from "express";
import * as namespace from "./userClasses";
import * as winston from "winston";
// routes.post("/auth", passport.authenticate("local", {}), function(req:express.Request, res:express.Response){
//     res.json(req.user);
// }); // Authenticate a user
// routes.get("/:role/:email/profile", UserController.getProfile);
// routes.patch("/:role/:email/profile", UserController.updateProfile);
// routes.patch("/:role/:email/account", UserController.updateAccount);
// routes.post("/confirm", UserController.insertProfile);
// routes.put("/:role/:email", UserController.addProfile);
// function sessionExists(type: any) {
//     console.log(JSON.stringify(this));
//     return (target: any, key, descriptor) => {
//         let originalMethod = descriptor.value;
//         console.log(JSON.stringify(this) + " " + JSON.stringify(target) + " " + key);
//         descriptor.value = function (...args: any[]) {
//             const req: express.Request = args[0];
//             const res: express.Response = args[1];
//             let result;
//             if (req.user && req.user.role && req.user.id && req.user.email) {
//                 return originalMethod.apply(this, args);
//             } else {
//                 target.logger.warn("Invalid Request, session not created");
//                 res.status(400).send();
//             }
//             return null;
//         }
//         return descriptor;
//     }
// }
class UserController {
    userClasses: { "user": namespace.userOperations.user; "community builder": namespace.userOperations.user; "admin": namespace.userOperations.admin; };
    getUser: (type: string) => any;
    constructor() {
        this.userClasses = {
            "user": new namespace.userOperations.user(),
            "community builder": new namespace.userOperations.communityBuilder(),
            "admin": new namespace.userOperations.admin()
        }
        this.getUser = (type: string) => this.userClasses[type];
    }
    //@sessionExists(this)
    public getProfile(req: express.Request, res: express.Response) {
        const user = this.getUser(req.user.role);
        user.getProfile(req, res);
    }
   // @sessionExists(this)
    public updateProfile(req: express.Request, res: express.Response) {
        const user = this.getUser(req.user.role);
        user.updateProfile(req, res);
    }
    //@sessionExists(this)
    public updateAccount(req: express.Request, res: express.Response) {
        const user = this.getUser(req.user.role);
        user.updateAccount(req, res);
    }
    //@sessionExists(this)
    public insertProfile(req: express.Request, res: express.Response) {
        console.log(Object.getOwnPropertyNames(this)+" "+Object.getOwnPropertyNames(Object.getPrototypeOf(this)))
        const user = this.getUser("user");
        user.insertProfile(req, res);
    }
    //@sessionExists(this)
    public addProfile(req: express.Request, res: express.Response) {
        const user = this.getUser(req.user.role);
        user.addProfile(req, res);
    }

}
// function sessionExists(target: UserController, key: string, descriptor: TypedPropertyDescriptor<Function>) {
//     return {
//         value: function (...args: any[]) {
//             const req: express.Request = args[0];
//             const res: express.Response = args[1];
//             let result = undefined;
//             console.log("Target ="+JSON.stringify(this));
//             if (req.user && req.user.role && req.user.id && req.user.email) {
//                 return descriptor.value.apply(target, [req, res]);
//             } else {
//                 target.logger.warn("Invalid Request, session not created");
//                 res.status(400).send();
//             }
//             return result;
//         }
//     }
// }

export default (new UserController());
