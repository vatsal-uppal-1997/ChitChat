import * as mongoose from "mongoose";
import * as mongoosePaginate from "mongoose-paginate";
import { IUserProfile } from "../Users/user";
import {IPost} from "./post";
/*
    A community has :-

        -Name -> required
        -Description -> required
        -Admins -> required
        -isOpen -> true or false
        -requests -> required is isOpen === false
        -Members -> required but empty by default
        -Posts -> required but empty by default

*/ 
const community = new mongoose.Schema({
    meta: {
        owner: {
            required: true,
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        name: {
            required: true,
            unique: true,
            type: String
        },
        image: {
            required: true,
            type: String
        },
        description: {
            required: true,
            type: String
        },
        isOpen: {
            required: true,
            type: Boolean
        }
    },
    admins: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }], 
        default: []
    },
    members: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }], 
        default: []
    },
    requests: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }], 
        default: []
    },
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    }]
});

community.plugin(mongoosePaginate);

export enum Privileges {
    admin = "admin",
    member = "member",
    request = "request"
}
/**
 * Returns a users privileges in a community 
 * @param userId ID of the user to get priviledges of
 * @param cb callback returns a result of type Privileges enum
 */
community.methods.getType = function(userId:string, cb:(err:Error, result:Privileges)=>void) {
    const admins = this.admins;
    const requests = this.requests;
    for (let i of requests) {
        if (i === userId)
            return cb(undefined,Privileges.request);
    }
    for (let i of admins) {
        if (i === userId)
            return cb(undefined,Privileges.admin);
    }
    return Privileges.member;
}

export enum RequestActions {
    accept = "accept",
    reject = "reject"
}
/**
 * Accepts or Rejects a request
 * @param userId id of the user to accept or reject request of
 * @param action action of type enum RequestActions either accept or reject
 */
community.methods.handleRequest = function(userId:string, action:RequestActions) {
    switch(action) {
        case RequestActions.accept: 
            this.members.push(userId);
        case RequestActions.reject:
            this.requests = this.requests.filter(function(element) {
                return element !== userId;
            });
            break;
    }
}

export enum PrivilegeActions {
    promote = "promote",
    demote = "demote"
}
/**
 * Promotes or Demotes a user 
 * Warning Please check if user IS a member of the community
 * @param userId Id of the user to promote or demote
 * @param action action to perform of type PriviledgeActions
 */
community.methods.handlePrivileges = function(userId:string, action:PrivilegeActions) {
    switch(action) {
        case PrivilegeActions.promote:
            this.admins.push(userId);
            this.members.filter(function(element) {
                return element !== userId;
            })
            break;
        case PrivilegeActions.demote:
            this.members.push(userId);
            this.admins.filter(function(element){
                return element !== userId;
            })
            break;
    }
}



export interface ICommunityMeta {
    owner: mongoose.Types.ObjectId | IUserProfile,
    name: string;
    image: string;
    description: string;
    isOpen: boolean;
}

export interface ICommunity extends mongoose.Document {
    meta: ICommunityMeta;
    admins: mongoose.Types.ObjectId[] | IUserProfile[];
    members: mongoose.Types.ObjectId[] | IUserProfile[];
    requests: mongoose.Types.ObjectId[] | IUserProfile[];
    posts: mongoose.Types.ObjectId[] | IPost[];
    getType: (userId:string, cb:(err:Error, result:Privileges)=>void) => void;
    handleRequest: (userId:string, action:RequestActions) => void;
    handlePrivileges: (userId:string, action:PrivilegeActions) => void;
}

interface paginateEnabled<T extends mongoose.Document> extends mongoose.PaginateModel<T> {}

export const communityModel:paginateEnabled<ICommunity> = mongoose.model<ICommunity>("Community", community);