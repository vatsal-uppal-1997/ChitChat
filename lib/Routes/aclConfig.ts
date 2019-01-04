import * as acl from "express-acl";

// routes.post("/auth", passport.authenticate("local", {}), function(req:express.Request, res:express.Response){
//     res.json(req.user);
// }); // Authenticate a user
// routes.get("/:role/:email/profile", UserController.getProfile);
// routes.patch("/:role/:email/profile", UserController.updateProfile);
// routes.patch("/:role/:email/account", UserController.updateAccount);
// routes.post("/confirm", UserController.insertProfile);
// routes.put("/:role/:email", UserController.addProfile);

const options = {
    yml: true,
    filename: 'nacl.yml',
    path: 'config',
    baseUrl: 'api',
    decodedObjectName: 'user',
    defaultRole: 'guest'
  };

acl.config(options);

export default acl;