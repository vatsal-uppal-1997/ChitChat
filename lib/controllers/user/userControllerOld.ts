import * as express from "express";

import {Model} from "mongoose";

import {userModel, userProfile, IUser, IUserProfile} from "models/Users/user";
import {accountModel, IAccount} from "models/Users/account";
// TODO IMPLEMENT FUNCTIONALITY FOR MEMEBEROF, OWNEROF AND MANAGES
class UserController {
   public addProfile(req:express.Request, res:express.Response) {
       const insertData = {email: req.body.email, phone: req.body.phone, city: req.body.city};
       const insert = new userModel({
           email: req.params.email,
           phone: req.body.phone,
           city: req.body.city
       });
       insert.save(function(err: any, doc: IUser){
           // user role isactive password
           if(err) {
                res.status(422).send();
                return console.log(err);
           }
           const account = new accountModel({
               user: doc,
               role: req.params.role,
               isactive: true,
               password: req.body.password
           });
           account.save(function(err, product: IAccount) {
                if (err) {
                    res.status(422).send();
                    return console.log(err);
                }
                res.json({profile: doc, account: product});
           })
       });
   }
   public getProfile(req:express.Request, res:express.Response) {
       const sessionData = req.user;
        switch(req.user.role) {
            case "admin": {
                userModel.findOne(req.params.email, function(err: any, data: IUser){
                    if (err) {
                        res.status(422).send();
                        return console.log(err);
                    }
                    accountModel.findOne({user: data.id, role: req.params.role}, function(err: any, acc: IAccount){
                        if (err) {
                            res.status(422).send();
                            return console.log(err);
                        }
                        if (!acc) 
                            return res.json({message: "Account not found"});
                        res.json({"user": data, "account":{"role":acc.role,"isActive":acc.isActive,"isConfirmed":acc.isconfirmed}});
                    });
                });
            }
            default: {
                if (req.params.role === sessionData.role && req.params.email === sessionData.email)
                    userProfile.findById(sessionData.id, function(err: any, data:IUserProfile){
                        if (err) {
                            res.status(422).send();
                            return console.log(err);
                        }
                        res.json(data);
                    });
                else
                    userProfile.findOne({email: req.params.email}, function(err:any, data:IUserProfile){
                        if (err) {
                            res.status(422).send();
                            return console.log(err);
                        }
                        res.json({"email":data.email,"name":data.name,"dateOfBirth":data.dateOfBirth,"gender":data.gender, "interests":data.interests, "description":data.description});
                    });
            }
        }
   }
   public updateProfile(req:express.Request, res:express.Response) {
       const sessionData = req.user;
       switch(sessionData.role) {
            case "user":
            case "community builder": {
                if (req.body.email) {
                    res.status(401).send();
                    break;
                }
                userProfile.findByIdAndUpdate(sessionData.id, req.body,{new: true, runValidators: true},function(err: any, data: IUserProfile){
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
                    userProfile.findByIdAndUpdate(sessionId, req.body, {new: true, runValidators: true}, function(err:any, data: IUserProfile){
                        res.json(data);
                    });
                } else {
                    userProfile.findOne({email: paramEmail}, function(err:any, data:IUserProfile){
                        if (err) {
                            console.log(err);
                            return res.status(422).send();
                        }
                        accountModel.findOne({user: data.id}, function(err: any, acc: IAccount){
                            if (err) {
                                console.log(err);
                                return res.status(422).send();
                            }
                            if (!acc || acc.role !== paramRole) {
                                return res.status(422).send();
                            }
                            userModel.findByIdAndUpdate(data.id, req.body, {new : true, runValidators: true}, function(err: any, data: IUser){
                                if (err) {
                                    console.log(err);
                                    return res.status(422).send();
                                }
                                res.json(data);
                            });
                        })
                    });
                }
            }
            default: {
                res.status(400).send();
            }
       }
   }
   public insertProfile(req:express.Request, res:express.Response) {
       interface IReqBody {
           name:string;
           gender:string;
           dateOfBirth:string;
           description:string;
           interests:string[];
       }
       const sessionData = req.user;
       const requiredProps = ["name","gender","dateOfBirth","description","interests"];
       let reqBody: IReqBody = req.body;
       for (var i=0; i<requiredProps.length; i++)
            if (!reqBody.hasOwnProperty(requiredProps[i])) {
                res.status(400).send();
                return;
            }
       userProfile.findById(sessionData.id, function(err: any, data: IUserProfile){
           if (err) {
               res.status(422).send();
               return console.log(err);
           }
           data = Object.assign(data, reqBody);
           data.save(function(err:any, product: IUserProfile){
               if (err) {
                   res.status(422).send();
                   return console.log(err);
               }
               accountModel.findOne({user: sessionData.id}, function(err:any, resp:IAccount){
                    resp.isconfirmed = true;
                    resp.save(function(err:any, acc:IAccount){
                        if (err) {
                            res.status(422).send();
                            return console.log(err);
                        }
                        res.json(product);
                    });
               });
           });;
       });
   }
   public updateAccount(req:express.Request, res:express.Response) {
        const sessionData = req.user;
        switch (req.user.role) {
            case "user":
            case "community builder": {
                if (req.params.role !== sessionData.role || req.params.email !== sessionData.email) {
                    res.status(422).send();
                    return;
                }
                accountModel.findOne({user: sessionData.id}, function(err: any, acc:IAccount){
                    if (err) {
                        console.log(err);
                        return res.status(422).send;
                    }
                    if (!acc) {
                        return res.status(400).send();
                    }
                    acc.password = req.body.password;
                    acc.save(function(err: any, product: IAccount){
                        if (err){
                            console.log(err);
                            return res.status(422).send();
                        }
                        res.json({message: "password changed"});
                    });
                });
                break;               
            }
            case "admin": {
                if (req.params.role === sessionData.role && req.params.email === sessionData.email)
                    accountModel.findByIdAndUpdate(sessionData.id, req.body, {new: true, runValidators: true}, function(err:any, data: IAccount){
                        if (err) {
                            console.log(err);
                            return res.status(422).send();
                        }
                        res.json(data);
                    });
                else 
                    userModel.findOne({email: req.params.email}, function(err:any, data: IUser){
                        if (err) {
                            console.log(err);
                            return res.status(422).send();
                        }
                        accountModel.findOne({user: data.id}, function(err:any, acc: IAccount){
                            if (err) {
                                console.log(err);
                                return res.status(422).send();
                            }
                            acc = Object.assign(acc, req.body);
                            acc.save(function(err:any, product:IAccount){
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

export default new UserController();