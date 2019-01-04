"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const namespace = require("./userClasses");
const winston = require("winston");
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
    constructor() {
        this.logger = winston.createLogger({
            level: 'debug',
            format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
            transports: [new winston.transports.Console()]
        });
        this.userClasses = {
            "user": new namespace.userOperations.user(this.logger),
            "community builder": new namespace.userOperations.communityBuilder(this.logger),
            "admin": new namespace.userOperations.admin(this.logger)
        };
    }
    getUser(type) {
        console.log("GOT REQUEST NIGGA");
        return this.userClasses[type];
    }
    //@sessionExists(this)
    getProfile(req, res) {
        const user = this.getUser(req.user.role);
        user.getProfile(req, res);
    }
    // @sessionExists(this)
    updateProfile(req, res) {
        console.log(this);
        const user = this.getUser(req.user.role);
        user.updateProfile(req, res);
    }
    //@sessionExists(this)
    updateAccount(req, res) {
        const user = this.getUser(req.user.role);
        user.updateAccount(req, res);
    }
    //@sessionExists(this)
    insertProfile(req, res) {
        const user = this.getUser(req.user.role);
        user.insertProfile(req, res);
    }
    //@sessionExists(this)
    addProfile(req, res) {
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
exports.default = new UserController();
//# sourceMappingURL=userController.js.map