import * as express from "express";
import { userModel, userProfile, IUser, IUserProfile } from "../../models/Users/user";
import { accountModel, IAccount } from "../../models/Users/account";
import * as winston from "winston";

export namespace userOperations {
    export interface standardSession {
        id: string;
        email: string;
        role: string;
    }
    export interface standardParam {
        role: string;
        email: string;
    }
    export interface processedRequest {
        params: standardParam;
        session: standardSession;
        body: any;
    };
    const logger = winston.createLogger({
        level: 'debug',
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        transports: [new winston.transports.Console()]
    });
    /**
  * A utility function to check if provided objects have the same keys
  * @param objects An object array to be checked if they have same keys
  */
    function objectsHaveSameKeys(...objects): boolean {
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
    function checkRequestFormat(req: express.Request, compareWith: any, stripExtra = true, disableBodyCheck = false): processedRequest {
        let newReq: processedRequest = { session: req.user, params: req.params, body: req.body };
        const dummyParam: standardParam = { role: "", email: "" };
        const dummySession: standardSession = { id: "", email: "", role: "" };
        if (stripExtra) {
            let newBody = {};
            const keys = Object.keys(compareWith);
            logger.info("checkRequestFormat : Stripping request of unnecessory fields: Before: " + JSON.stringify(newReq.body));
            for (var i = 0; i < keys.length; i++)
                if (newReq.body.hasOwnProperty(keys[i]))
                    newBody[keys[i]] = newReq.body[keys[i]];
            newReq.body = newBody;
            logger.info("checkRequestFormat : Stripping request of unnecessory fields: After: " + JSON.stringify(newReq.body));
        } else {
            newReq.body = req.body;
        }
        console.log(req.params+" "+req.path);
        if (objectsHaveSameKeys(newReq.session, dummySession) &&
            (req.path === "/confirm" || objectsHaveSameKeys(newReq.params, dummyParam)) &&
            (disableBodyCheck || objectsHaveSameKeys(newReq.body, compareWith))) {
            return newReq;
        } else {
            return null;
        }
    }

    /**
     * Formats a requst correctly for use in user methods
     * 
     * @param compareWith define the structure an object must have - Pass a dummy object
     * @param stripExtra If true - strips any extra attributes that are not defined in param compareWith - default true
     * @param disableBodyCheck  If true - disable comparison between param compareWith and param req
     */
    function requestDecorator(compareWith: any, stripExtra = true, disableBodyCheck = true) {
        return function (target: any, key: string | symbol, descriptor: TypedPropertyDescriptor<Function>) {
            return {
                value: function (...args: any[]) {
                    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(target)));
                    const req: express.Request = args[0];
                    const res: express.Response = args[1];
                    //const newReq = target.checkRequestFormat(req, compareWith, stripExtra, disableBodyCheck);
                    const newReq = checkRequestFormat(req, compareWith, stripExtra, disableBodyCheck);
                    console.log("newReq is " + newReq);
                    if (newReq === null)
                        return target.handleError(res, "Bad Request", 400);
                    logger.info("Received a " + req.method + " request at : " + req.originalUrl + " Having Data : " + JSON.stringify(newReq));
                    const returns = descriptor.value.apply(target, [newReq, res]);
                    return returns;
                }
            }
        }
    }
    export abstract class userType {
        /**Confirm a user's profile*/
        @requestDecorator({ name: "", gender: "", dateOfBirth: "", interests: "", description: "" })
        insertProfile(newReq: express.Request, res: express.Response): void {
            // const newReq = this.checkRequestFormat(req, { name: "", gender: "", dateOfBirth: "", interests: "", description: "" });
            // if (newReq === null)
            //     return this.handleError(res, "Malformed Request", 400);
            const validateType = function (user: IUserProfile | any): user is IUserProfile {
                return (user && user.email && typeof user.phone === "number");
            }
            const context = this;
            userProfile.findById(newReq.session.id, function(err:any, data:IUserProfile){
                if (err || !data)
                    context.handleError(res, "An error occurred while getting profile in insertProfile function", 422);
                data = Object.assign(data, newReq.body);
                data.save(function(err, resp:IUserProfile){
                    accountModel.findOneAndUpdate({user: data.id},{isconfirmed:true} ,function(err:any, acc:IAccount){
                        if (err)
                            return context.handleError(res, "An error occurred while updating account in insertProfile function", 422);
                        res.json({...resp["_doc"], role: acc.role});
                    });
                })
            });
        }

        handleError(res: express.Response, message: string, code: number) {
            const userMessage: string = "Generic User: " + message;
            switch (code) {
                case 400:
                case 401:
                case 404: {
                    logger.warn(userMessage);
                    break;
                }
                case 422: {
                    logger.error(userMessage);
                    break;
                }
                default: {
                    logger.info(userMessage);
                }
            }
            res.status(code).send();
        }
        /**Adds a new base profile to the database - ONLY ADMIN  */
        abstract addProfile(req: express.Request, res: express.Response): void;
        /**Gets a profile consisting of all user's personnel details except his password. 
         * If user is trying to see some other profile provides only basic non-disclosing information.
        */
        abstract getProfile(req: express.Request, res: express.Response): void;
        /**Upates a user's profile*/
        abstract updateProfile(req: express.Request, res: express.Response): void;
        /**Update a user's account*/
        abstract updateAccount(req: express.Request, res: express.Response): void;
    }

    export abstract class nonAdmin extends userType {
        message: string;
        constructor(message: string) {
            super();
            this.message = message;
        } 
        handleError(res: express.Response, message: string, code: number) {
            const userMessage: string = this.message + message;
            switch (code) {
                case 400:
                case 401:
                case 404: {
                    logger.warn(userMessage);
                    break;
                }
                case 422: {
                    logger.error(userMessage);
                    break;
                }
                default: {
                    logger.info(userMessage);
                }
            }
            res.status(code).send();
        }
        addProfile(req: express.Request, res: express.Response): void {
            return this.handleError(res, "Unauthorised cannot access addProfile", 401);
        }
        /**Gets a profile consisting of all user's personnel details except his password. 
        * If user is trying to see some other profile provides only basic non-disclosing information.*/
        @requestDecorator({})
        getProfile(newReq: express.Request, res: express.Response): void {
            // const newReq = this.checkRequestFormat(req, {});
            // if (newReq === null)
            //     return this.handleError(res, "Malformed Request", 400);
            const context = this;
            console.log(newReq);
            if (newReq.params.role === newReq.session.role && newReq.params.email === newReq.session.email)
                userProfile.findById(newReq.session.id, function (err: any, data: IUserProfile) {
                    if (err)
                        return context.handleError(res, "An error occured while getting a profile by id in getProfile method", 422);
                    res.json(data);
                });
            else
                userProfile.findOne({ email: newReq.params.email }, function (err: any, data: IUserProfile) {
                    if (err)
                        return context.handleError(res, "An error occured while getting a profile by id in getProfile method", 422);
                    if (!data)
                        return context.handleError(res, "Account not found - getProfile", 422);
                    accountModel.findOne({ user: data.id }, function (err: any, role: IAccount) {
                        if (err)
                            return context.handleError(res, "An error occured while getting an account by user in getProfile method", 422);
                        if (newReq.params.role !== role.role)
                            return context.handleError(res, "Requested role does not match received role", 400);
                        res.json({ "email": data.email, "name": data.name, "dateOfBirth": data.dateOfBirth, "gender": data.gender, "interests": data.interests, "description": data.description });
                    });
                });
        }
        /**Upates a user's profile */
        @requestDecorator({ name: "", gender: "", dateOfBirth: "", interests: ["xyz"], description: "", city: "", phone: ""}, true, true)
        updateProfile(newReq: express.Request, res: express.Response): void {
            // const newReq = this.checkRequestFormat(req, { name: "", gender: "", dateOfBirth: "", interests: ["xyz"] }, true, true);
            // if (newReq === null)
            //     return this.handleError(res, "Malformed Request", 400);
            if (newReq.body.email)
                return this.handleError(res, "User cannot update email", 401);
            userProfile.findByIdAndUpdate(newReq.session.id, newReq.body, { new: true, runValidators: true }, function (err: any, data: IUserProfile) {
                if (err)
                    return this.handleError(res, "An error occured while updating an account by id in updateProfile method", 422);
                res.json(data);
            });
        }
        /**Update a user's account*/
        @requestDecorator({ password: "" })
        updateAccount(newReq: express.Request, res: express.Response): void {
            // const newReq = this.checkRequestFormat(req, { password: "" });
            // if (newReq === null)
            //     return this.handleError(res, "Malformed Request", 400);
            const context = this;
            if (newReq.params.role !== newReq.session.role || newReq.params.email !== newReq.session.email) {
                return this.handleError(res, "Unauthorized Access to Resource updateAccount", 401);
            }
            accountModel.findOne({ user: newReq.session.id }, function (err: any, acc: IAccount) {
                if (err)
                    return context.handleError(res, "An error occured while finding an account in updateAccount method", 422);
                if (!acc) {
                    return context.handleError(res, "Account not found - updateAccount", 404);
                }
                acc.password = newReq.body.password;
                acc.save(function (err: any, product: IAccount) {
                    if (err)
                        return this.handleError(res, "An error occured while saving an account in updateAccount method", 422);
                    res.json({ message: "password changed" });
                });
            });
        }
    }
    export class user extends nonAdmin {
        constructor() {
            super("User: ");
        }
    }

    export class communityBuilder extends nonAdmin {
        constructor() {
            super("Community Builder: ");
        }
    }

    export class admin extends userType {
        handleError(res: express.Response, message: string, code: number) {
            const userMessage: string = "Admin: " + message;
            switch (code) {
                case 400:
                case 401: {
                    logger.warn(userMessage);
                    break;
                }
                case 422: {
                    logger.error(userMessage);
                    break;
                }
                default: {
                    logger.info(userMessage);
                }
            }
            res.status(code).send();
        }
        /**Adds a new base profile to the database*/
        @requestDecorator({ phone: "", city: "", password: ""})
        addProfile(newReq: express.Request, res: express.Response): void {
            // const newReq = this.checkRequestFormat(req, { phone: "", city: "" });
            // if (newReq === null)
            //     return this.handleError(res, "Malformed Request", 400);
            const context = this;
            const insert = new userModel({
                email: newReq.params.email,
                phone: newReq.body.phone,
                city: newReq.body.city
            });
            insert.save(function (err: any, doc: IUser) {
                if (err)
                    return context.handleError(res, "An error occured while saving a new user in addProfile method", 422);
                const account = new accountModel({
                    user: doc,
                    role: newReq.params.role,
                    isactive: true,
                    password: newReq.body.password
                });
                account.save(function (err, product: IAccount) {
                    console.log(err);
                    if (err)
                        return context.handleError(res, "An error occured while saving a new account in addProfile method", 422);
                    res.json({ profile: doc, account: product });
                })
            });
        }
        @requestDecorator({})
        getProfile(newReq: express.Request, res: express.Response): void {
            //const newReq = this.checkRequestFormat(req, {});
            const context = this;
            if (newReq.session.email === newReq.params.email && newReq.session.role === newReq.params.role) {
                userProfile.findById(newReq.session.id, function(err:any, data:IUserProfile){
                    if (err)
                        context.handleError(res, "Error occured in getProfile while fetching by id", 422);
                    res.json(data);
                });
                return;
            }
            userModel.findOne({"email" : newReq.params.email}, function (err: any, data: IUser) {
                console.log(err);
                if (err) 
                    return context.handleError(res, "An error occured in userModel findOne in getProfile method", 422);
                accountModel.findOne({ user: data.id, role: newReq.params.role }, function (err: any, acc: IAccount) {
                    if (err)
                        return context.handleError(res, "An error occured in accountModel findOne in gotProfile method", 422);

                    if (!acc)
                        return res.json({ message: "Account not found" });
                    res.json({ "user": data, "account": { "role": acc.role, "isActive": acc.isActive, "isConfirmed": acc.isconfirmed } });
                });
            });
        }
        @requestDecorator({}, false, true)
        updateProfile(newReq: express.Request, res: express.Response): void {
            const context = this;
            if (newReq.params.role === newReq.session.role && newReq.params.email === newReq.session.email) {
                userProfile.findByIdAndUpdate(newReq.session.id, newReq.body, { new: true, runValidators: true }, function (err: any, data: IUserProfile) {
                    res.json(data);
                });
            } else {
                userProfile.findOne({ email: newReq.params.email }, function (err: any, data: IUserProfile) {
                    if (err || !data)
                        return context.handleError(res, "An error occured in userProfile findOne in userProfile method", 422);
                    accountModel.findOne({ user: data.id }, function (err: any, acc: IAccount) {
                        if (err || !acc)
                            return context.handleError(res, "An error occured in accountModel findOne in userProfile method", 422);
                        if (!acc || acc.role !== newReq.params.role) {
                            if (err)
                                return context.handleError(res, "User with provided email and role combination not found - userProfile", 404);
                        }
                        userModel.findByIdAndUpdate(data.id, newReq.body, { new: true, runValidators: true }, function (err: any, data: IUser) {
                            if (err)
                                return context.handleError(res, "An error occured in userModel findByIdAndUpdate in userProfile method", 422);
                            res.json(data);
                        });
                    })
                });
            }
        }
        @requestDecorator({user:"", role:"", isActive:"", password:"", isconfirmed:""}, true, true)
        updateAccount(newReq: express.Request, res: express.Response): void {
            if (newReq.params.role === newReq.session.role && newReq.params.email === newReq.session.email)
                accountModel.findOne({user: newReq.session.id}, function (err: any, data: IAccount) {
                    if (err) {
                        console.log(err);
                        return res.status(422).send();
                    }
                    data = Object.assign(data, newReq.body);
                    data.save(function(err:any, product:IAccount) {
                        if (err) {
                            console.log(err);
                            return res.status(422).send();
                        }
                        res.json({message: "Account Updated !"});
                    });
                });
            else
                userModel.findOne({ email: newReq.params.email }, function (err: any, data: IUser) {
                    if (err) {
                        console.log(err);
                        return res.status(422).send();
                    }
                    accountModel.findOne({ user: data.id }, function (err: any, acc: IAccount) {
                        if (err) {
                            console.log(err);
                            return res.status(422).send();
                        }
                        acc = Object.assign(acc, newReq.body);
                        acc.save(function (err: any, product: IAccount) {
                            if (err) {
                                console.log(err);
                                return res.status(422).send();
                            }
                            return res.status(200).send();
                        });
                    });
                });
        }
    }
}