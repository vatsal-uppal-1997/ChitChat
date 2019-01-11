import {Request, Response} from "express";
import { LookUp } from "../../controllers/communities/hierarchy/LookUp";

export async function memberAcl(req:Request, res:Response, next) {
    if (req.user && req.user.id && req.user.role && req.user.email) {
        if (req.params && req.params.community) {
            console.log(`PATH : ${JSON.stringify(req.path, null, 2)}`);
            const reg = /^(\/[^\/]+\/)?join$/;
            const attatch = await LookUp.checkIfMember(req.user.id, req.params.community);
            res.locals.user = attatch;
            if (attatch === undefined)
                if (reg.test(req.path))
                    next();
                else
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