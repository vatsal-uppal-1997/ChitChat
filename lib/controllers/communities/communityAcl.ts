import {Request, Response} from "express";
import { LookUp } from "./hierarchy/LookUp";

export async function communityAcl(req:Request, res:Response, next) {
    if (req.user && req.user.id && req.user.role && req.user.email) {
        if (req.params && req.params.community) {
            console.log(req.path);
            const attatch = await LookUp.checkIfMember(req.user.id, req.params.community);
            res.locals.user = attatch;
            if (attatch === undefined)
                res.status(401).send();
            else
                next();
        } else {
            next();
        }        
    } else {
        res.status(401).send();
    }
}