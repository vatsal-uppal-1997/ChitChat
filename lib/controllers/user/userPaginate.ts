import {accountModel, IAccount} from "../../models/Users/account";
import * as express from "express";
import { PaginateResult } from "mongoose";
import { IUserProfile } from "models/Users/user";

interface validSession {
    id: string;
    email: string;
    role: string;
}
interface validBody {
    page: number;
}
interface validRequest {
    session: validSession;
    body: validBody;
}

function isValid(req: any): req is validRequest {
    if (req.session && req.session.role && req.session.email && req.session.id && req.body && req.body.page) {
        if (req.session.role === "admin")
            return true;        
    }
    return false; 
}

function isUserProfile(user: any): user is IUserProfile {
    return (user.email && user.phone && user.city);
}

export default function paginate(req:express.Request, res:express.Response) {
    const newReq = {session: {...req.user}, body: {...req.body}};
    console.log(newReq);
    console.log("paginate request : "+JSON.stringify(req.body));
    if (isValid(newReq)) {
        const options = {
            page : newReq.body.page,
            populate : "user",
            limit : 5,
            lean : true
        }
        accountModel.paginate({email:{$ne: newReq.session.email}}, options, function(err, result){
            if (err)
                return console.log(err);
            let data = result.docs.filter(function(value:IAccount) {
                if (isUserProfile(value.user))
                    return value.user.email !== newReq.session.email;
                else
                    return false;
            }).map(function(value:IAccount, index: number) {
                if (isUserProfile(value.user)) {
                    return {key: index, email: value.user.email, phone: value.user.phone, city: value.user.city, role: value.role, "status": value.isActive, "confirmed": value.isconfirmed}
                }
            });
            console.log(JSON.stringify(data, null, 2));
            res.json({total: result.total, users: data});
        })
    } else {
        return res.status(401).send();
    }
}