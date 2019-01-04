"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../../models/Users/user");
const account_1 = require("../../models/Users/account");
var userOperations;
(function (userOperations) {
    ;
    /**
     * Formats a requst correctly for use in user methods
     *
     * @param compareWith define the structure an object must have - Pass a dummy object
     * @param stripExtra If true - strips any extra attributes that are not defined in param compareWith - default true
     * @param disableBodyCheck  If true - disable comparison between param compareWith and param req
     */
    function requestDecorator(compareWith, stripExtra = true, disableBodyCheck = true) {
        return function (target, key, descriptor) {
            return {
                value: function (...args) {
                    const req = args[0];
                    const res = args[1];
                    const newReq = target.checkRequestFormat(req, compareWith, stripExtra, disableBodyCheck);
                    if (newReq === null)
                        return target.handleError(res, "Bad Request", 400);
                    target.logger.info("Received a " + req.method + " request at : " + req.originalUrl + " Having Data : " + newReq);
                    const returns = descriptor.value.apply(target, [newReq, res]);
                    return returns;
                }
            };
        };
    }
    class userType {
        constructor(logger) {
            this.logger = logger;
        }
        /**
         * A utility function to check if provided objects have the same keys
         * @param objects An object array to be checked if they have same keys
         */
        objectsHaveSameKeys(...objects) {
            const allKeys = objects.reduce((keys, object) => keys.concat(Object.keys(object)), []);
            const union = new Set(allKeys);
            return objects.every(object => union.size === Object.keys(object).length);
        }
        /**
         * Type checks a request and returns a clean strongly typed processRequest object or null
         * NOTE - If you dont want to match an object with compare with make stripExtra and disableBodyCheck false
         * @param req Request object to clean
         * @param compareWith define the structure an object must have - Pass a dummy object
         * @param stripExtra If true - strips any extra attributes that are not defined in param compareWith - default true
         * @param disableBodyCheck  If true - disable comparison between param compareWith and param req
         */
        checkRequestFormat(req, compareWith, stripExtra = true, disableBodyCheck = false) {
            let newReq = { session: req.user, params: req.params, body: req.body };
            const dummyParam = { role: "", email: "" };
            const dummySession = { id: "", email: "", role: "" };
            if (stripExtra) {
                let newBody = {};
                const keys = Object.keys(compareWith);
                this.logger.info("checkRequestFormat : Stripping request of unnecessory fields: Before: " + newReq.body);
                for (var i = 0; i < keys.length; i++)
                    if (newReq.body.hasOwnProperty(keys[i]))
                        newBody[keys[i]] = newReq.body[keys[i]];
                newReq.body = newBody;
                this.logger.info("checkRequestFormat : Stripping request of unnecessory fields: After: " + newReq.body);
            }
            else {
                newReq.body = req.body;
            }
            if (this.objectsHaveSameKeys(newReq.session, dummySession) &&
                this.objectsHaveSameKeys(newReq.params, dummyParam) &&
                (disableBodyCheck || this.objectsHaveSameKeys(newReq.body, compareWith))) {
                return newReq;
            }
            else {
                return null;
            }
        }
        /**Confirm a user's profile*/
        insertProfile(newReq, res) {
            // const newReq = this.checkRequestFormat(req, { name: "", gender: "", dateOfBirth: "", interests: "", description: "" });
            // if (newReq === null)
            //     return this.handleError(res, "Malformed Request", 400);
            const validateType = function (user) {
                return (user && user.gender && typeof user.gender === "string");
            };
            const context = this;
            account_1.accountModel.findOne({ user: newReq.session.id }).populate("user").exec(function (err, data) {
                if (err)
                    return context.handleError(res, "An error occured while finding an account in insertProfile method", 422);
                if (validateType(data.user)) {
                    data.user = Object.assign({}, data.user, newReq.body);
                    data.isconfirmed = true;
                    data.save(function (err, resp) {
                        if (err)
                            return context.handleError(res, "An error occured while davin an account object in insertProfile method", 422);
                        res.json(data.user);
                    });
                }
            });
        }
    }
    __decorate([
        requestDecorator({ name: "", gender: "", dateOfBirth: "", interests: "", description: "" })
    ], userType.prototype, "insertProfile", null);
    userOperations.userType = userType;
    class nonAdmin extends userType {
        addProfile(req, res) {
            return this.handleError(res, "Unauthorised cannot access addProfile", 401);
        }
        /**Gets a profile consisting of all user's personnel details except his password.
        * If user is trying to see some other profile provides only basic non-disclosing information.*/
        getProfile(newReq, res) {
            // const newReq = this.checkRequestFormat(req, {});
            // if (newReq === null)
            //     return this.handleError(res, "Malformed Request", 400);
            if (newReq.params.role === newReq.session.role && newReq.params.email === newReq.session.email)
                user_1.userProfile.findById(newReq.session.id, function (err, data) {
                    if (err)
                        return this.handleError(res, "An error occured while getting a profile by id in getProfile method", 422);
                    res.json(data);
                });
            else
                user_1.userProfile.findOne({ email: newReq.params.email }, function (err, data) {
                    if (err)
                        return this.handleError(res, "An error occured while getting a profile by id in getProfile method", 422);
                    if (!data)
                        return this.handleError(res, "Account not found - getProfile", 422);
                    account_1.accountModel.findOne({ user: data.id }, function (err, role) {
                        if (err)
                            return this.handleError(res, "An error occured while getting an account by user in getProfile method", 422);
                        if (newReq.params.role !== role.role)
                            return this.handleError(res, "Requested role does not match received role", 400);
                        res.json({ "email": data.email, "name": data.name, "dateOfBirth": data.dateOfBirth, "gender": data.gender, "interests": data.interests, "description": data.description });
                    });
                });
        }
        /**Upates a user's profile */
        updateProfile(newReq, res) {
            // const newReq = this.checkRequestFormat(req, { name: "", gender: "", dateOfBirth: "", interests: ["xyz"] }, true, true);
            // if (newReq === null)
            //     return this.handleError(res, "Malformed Request", 400);
            if (newReq.body.email)
                return this.handleError(res, "User cannot update email", 401);
            user_1.userProfile.findByIdAndUpdate(newReq.session.id, newReq.body, { new: true, runValidators: true }, function (err, data) {
                if (err)
                    return this.handleError(res, "An error occured while updating an account by id in updateProfile method", 422);
                res.json(data);
            });
        }
        /**Update a user's account*/
        updateAccount(newReq, res) {
            // const newReq = this.checkRequestFormat(req, { password: "" });
            // if (newReq === null)
            //     return this.handleError(res, "Malformed Request", 400);
            if (newReq.params.role !== newReq.session.role || newReq.params.email !== newReq.session.email) {
                return this.handleError(res, "Unauthorized Access to Resource updateAccount", 401);
            }
            account_1.accountModel.findOne({ user: newReq.session.id }, function (err, acc) {
                if (err)
                    return this.handleError(res, "An error occured while finding an account in updateAccount method", 422);
                if (!acc) {
                    return this.handleError(res, "Account not found - updateAccount", 404);
                }
                acc.password = newReq.body.password;
                acc.save(function (err, product) {
                    if (err)
                        return this.handleError(res, "An error occured while saving an account in updateAccount method", 422);
                    res.json({ message: "password changed" });
                });
            });
        }
    }
    __decorate([
        requestDecorator({})
    ], nonAdmin.prototype, "getProfile", null);
    __decorate([
        requestDecorator({ name: "", gender: "", dateOfBirth: "", interests: ["xyz"] }, true, true)
    ], nonAdmin.prototype, "updateProfile", null);
    __decorate([
        requestDecorator({ password: "" })
    ], nonAdmin.prototype, "updateAccount", null);
    userOperations.nonAdmin = nonAdmin;
    class user extends nonAdmin {
        handleError(res, message, code) {
            const userMessage = "User: " + message;
            switch (code) {
                case 400:
                case 401:
                case 404: {
                    super.logger.warn(userMessage);
                    break;
                }
                case 422: {
                    super.logger.error(userMessage);
                    break;
                }
                default: {
                    super.logger.info(userMessage);
                }
            }
            res.status(code).send();
        }
    }
    userOperations.user = user;
    class communityBuilder extends nonAdmin {
        handleError(res, message, code) {
            const userMessage = "Community Builder: " + message;
            switch (code) {
                case 400:
                case 401: {
                    super.logger.warn(userMessage);
                    break;
                }
                case 422: {
                    super.logger.error(userMessage);
                    break;
                }
                default: {
                    super.logger.info(userMessage);
                }
            }
            res.status(code).send();
        }
    }
    userOperations.communityBuilder = communityBuilder;
    class admin extends userType {
        handleError(res, message, code) {
            const userMessage = "Admin: " + message;
            switch (code) {
                case 400:
                case 401: {
                    super.logger.warn(userMessage);
                    break;
                }
                case 422: {
                    super.logger.error(userMessage);
                    break;
                }
                default: {
                    super.logger.info(userMessage);
                }
            }
            res.status(code).send();
        }
        /**Adds a new base profile to the database*/
        addProfile(newReq, res) {
            // const newReq = this.checkRequestFormat(req, { phone: "", city: "" });
            // if (newReq === null)
            //     return this.handleError(res, "Malformed Request", 400);
            const context = this;
            const insert = new user_1.userModel({
                email: newReq.params.email,
                phone: newReq.body.phone,
                city: newReq.body.city
            });
            insert.save(function (err, doc) {
                if (err)
                    return context.handleError(res, "An error occured while saving a new user in addProfile method", 422);
                const account = new account_1.accountModel({
                    user: doc,
                    role: newReq.params.role,
                    isactive: true,
                    password: newReq.body.password
                });
                account.save(function (err, product) {
                    if (err)
                        return context.handleError(res, "An error occured while saving a new account in addProfile method", 422);
                    res.json({ profile: doc, account: product });
                });
            });
        }
        getProfile(newReq, res) {
            //const newReq = this.checkRequestFormat(req, {});
            const context = this;
            user_1.userModel.findOne(newReq.params.email, function (err, data) {
                if (err)
                    return context.handleError(res, "An error occured in userModel findOne in gotProfile method", 422);
                account_1.accountModel.findOne({ user: data.id, role: newReq.params.role }, function (err, acc) {
                    if (err)
                        return context.handleError(res, "An error occured in accountModel findOne in gotProfile method", 422);
                    if (!acc)
                        return res.json({ message: "Account not found" });
                    res.json({ "user": data, "account": { "role": acc.role, "isActive": acc.isActive, "isConfirmed": acc.isconfirmed } });
                });
            });
        }
        updateProfile(newReq, res) {
            const context = this;
            if (newReq.params.role === newReq.session.role && newReq.params.email === newReq.session.email) {
                user_1.userProfile.findByIdAndUpdate(newReq.session.id, newReq.body, { new: true, runValidators: true }, function (err, data) {
                    res.json(data);
                });
            }
            else {
                user_1.userProfile.findOne({ email: newReq.params.email }, function (err, data) {
                    if (err)
                        return context.handleError(res, "An error occured in userProfile findOne in userProfile method", 422);
                    account_1.accountModel.findOne({ user: data.id }, function (err, acc) {
                        if (err)
                            return context.handleError(res, "An error occured in accountModel findOne in userProfile method", 422);
                        if (!acc || acc.role !== newReq.params.role) {
                            if (err)
                                return context.handleError(res, "User with provided email and role combination not found - userProfile", 404);
                        }
                        user_1.userModel.findByIdAndUpdate(data.id, newReq.body, { new: true, runValidators: true }, function (err, data) {
                            if (err)
                                return context.handleError(res, "An error occured in userModel findByIdAndUpdate in userProfile method", 422);
                            res.json(data);
                        });
                    });
                });
            }
        }
        updateAccount(newReq, res) {
            if (newReq.params.role === newReq.session.role && newReq.params.email === newReq.session.email)
                account_1.accountModel.findByIdAndUpdate(newReq.session.id, newReq.body, { new: true, runValidators: true }, function (err, data) {
                    if (err) {
                        console.log(err);
                        return res.status(422).send();
                    }
                    res.json(data);
                });
            else
                user_1.userModel.findOne({ email: newReq.params.email }, function (err, data) {
                    if (err) {
                        console.log(err);
                        return res.status(422).send();
                    }
                    account_1.accountModel.findOne({ user: data.id }, function (err, acc) {
                        if (err) {
                            console.log(err);
                            return res.status(422).send();
                        }
                        acc = Object.assign(acc, newReq.body);
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
    __decorate([
        requestDecorator({ phone: "", city: "" })
    ], admin.prototype, "addProfile", null);
    __decorate([
        requestDecorator({})
    ], admin.prototype, "getProfile", null);
    __decorate([
        requestDecorator({}, false, true)
    ], admin.prototype, "updateProfile", null);
    __decorate([
        requestDecorator({}, false, true)
    ], admin.prototype, "updateAccount", null);
    userOperations.admin = admin;
})(userOperations = exports.userOperations || (exports.userOperations = {}));
//# sourceMappingURL=userClasses.js.map