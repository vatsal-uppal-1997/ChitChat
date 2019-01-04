"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("models/Users/user");
const account_1 = require("models/Users/account");
// TODO IMPLEMENT FUNCTIONALITY FOR MEMEBEROF, OWNEROF AND MANAGES
class UserController {
    addProfile(req, res) {
        const insertData = { email: req.body.email, phone: req.body.phone, city: req.body.city };
        const insert = new user_1.userModel({
            email: req.params.email,
            phone: req.body.phone,
            city: req.body.city
        });
        insert.save(function (err, doc) {
            // user role isactive password
            if (err) {
                res.status(422).send();
                return console.log(err);
            }
            const account = new account_1.accountModel({
                user: doc,
                role: req.params.role,
                isactive: true,
                password: req.body.password
            });
            account.save(function (err, product) {
                if (err) {
                    res.status(422).send();
                    return console.log(err);
                }
                res.json({ profile: doc, account: product });
            });
        });
    }
    getProfile(req, res) {
        const sessionData = req.user;
        switch (req.user.role) {
            case "admin": {
                user_1.userModel.findOne(req.params.email, function (err, data) {
                    if (err) {
                        res.status(422).send();
                        return console.log(err);
                    }
                    account_1.accountModel.findOne({ user: data.id, role: req.params.role }, function (err, acc) {
                        if (err) {
                            res.status(422).send();
                            return console.log(err);
                        }
                        if (!acc)
                            return res.json({ message: "Account not found" });
                        res.json({ "user": data, "account": { "role": acc.role, "isActive": acc.isActive, "isConfirmed": acc.isconfirmed } });
                    });
                });
            }
            default: {
                if (req.params.role === sessionData.role && req.params.email === sessionData.email)
                    user_1.userProfile.findById(sessionData.id, function (err, data) {
                        if (err) {
                            res.status(422).send();
                            return console.log(err);
                        }
                        res.json(data);
                    });
                else
                    user_1.userProfile.findOne({ email: req.params.email }, function (err, data) {
                        if (err) {
                            res.status(422).send();
                            return console.log(err);
                        }
                        res.json({ "email": data.email, "name": data.name, "dateOfBirth": data.dateOfBirth, "gender": data.gender, "interests": data.interests, "description": data.description });
                    });
            }
        }
    }
    updateProfile(req, res) {
        const sessionData = req.user;
        switch (sessionData.role) {
            case "user":
            case "community builder": {
                if (req.body.email) {
                    res.status(401).send();
                    break;
                }
                user_1.userProfile.findByIdAndUpdate(sessionData.id, req.body, { new: true, runValidators: true }, function (err, data) {
                    if (err) {
                        res.status(422).send();
                        return console.log(err);
                    }
                    console.log(req.body);
                    res.json(data);
                });
                break;
            }
            case "admin": {
                const sessionRole = sessionData.role;
                const sessionId = sessionData.id;
                const sessionEmail = sessionData.email;
                const paramRole = req.params.role;
                const paramEmail = req.params.email;
                if (paramRole === sessionRole && paramEmail === sessionEmail) {
                    user_1.userProfile.findByIdAndUpdate(sessionId, req.body, { new: true, runValidators: true }, function (err, data) {
                        res.json(data);
                    });
                }
                else {
                    user_1.userProfile.findOne({ email: paramEmail }, function (err, data) {
                        if (err) {
                            console.log(err);
                            return res.status(422).send();
                        }
                        account_1.accountModel.findOne({ user: data.id }, function (err, acc) {
                            if (err) {
                                console.log(err);
                                return res.status(422).send();
                            }
                            if (!acc || acc.role !== paramRole) {
                                return res.status(422).send();
                            }
                            user_1.userModel.findByIdAndUpdate(data.id, req.body, { new: true, runValidators: true }, function (err, data) {
                                if (err) {
                                    console.log(err);
                                    return res.status(422).send();
                                }
                                res.json(data);
                            });
                        });
                    });
                }
            }
            default: {
                res.status(400).send();
            }
        }
    }
    insertProfile(req, res) {
        const sessionData = req.user;
        const requiredProps = ["name", "gender", "dateOfBirth", "description", "interests"];
        let reqBody = req.body;
        for (var i = 0; i < requiredProps.length; i++)
            if (!reqBody.hasOwnProperty(requiredProps[i])) {
                res.status(400).send();
                return;
            }
        user_1.userProfile.findById(sessionData.id, function (err, data) {
            if (err) {
                res.status(422).send();
                return console.log(err);
            }
            data = Object.assign(data, reqBody);
            data.save(function (err, product) {
                if (err) {
                    res.status(422).send();
                    return console.log(err);
                }
                account_1.accountModel.findOne({ user: sessionData.id }, function (err, resp) {
                    resp.isconfirmed = true;
                    resp.save(function (err, acc) {
                        if (err) {
                            res.status(422).send();
                            return console.log(err);
                        }
                        res.json(product);
                    });
                });
            });
            ;
        });
    }
    updateAccount(req, res) {
        const sessionData = req.user;
        switch (req.user.role) {
            case "user":
            case "community builder": {
                if (req.params.role !== sessionData.role || req.params.email !== sessionData.email) {
                    res.status(422).send();
                    return;
                }
                account_1.accountModel.findOne({ user: sessionData.id }, function (err, acc) {
                    if (err) {
                        console.log(err);
                        return res.status(422).send;
                    }
                    if (!acc) {
                        return res.status(400).send();
                    }
                    acc.password = req.body.password;
                    acc.save(function (err, product) {
                        if (err) {
                            console.log(err);
                            return res.status(422).send();
                        }
                        res.json({ message: "password changed" });
                    });
                });
                break;
            }
            case "admin": {
                if (req.params.role === sessionData.role && req.params.email === sessionData.email)
                    account_1.accountModel.findByIdAndUpdate(sessionData.id, req.body, { new: true, runValidators: true }, function (err, data) {
                        if (err) {
                            console.log(err);
                            return res.status(422).send();
                        }
                        res.json(data);
                    });
                else
                    user_1.userModel.findOne({ email: req.params.email }, function (err, data) {
                        if (err) {
                            console.log(err);
                            return res.status(422).send();
                        }
                        account_1.accountModel.findOne({ user: data.id }, function (err, acc) {
                            if (err) {
                                console.log(err);
                                return res.status(422).send();
                            }
                            acc = Object.assign(acc, req.body);
                            acc.save(function (err, product) {
                                if (err) {
                                    console.log(err);
                                    return res.status(422).send();
                                }
                            });
                        });
                    });
            }
        }
    }
}
exports.default = new UserController();
//# sourceMappingURL=userControllerOld.js.map