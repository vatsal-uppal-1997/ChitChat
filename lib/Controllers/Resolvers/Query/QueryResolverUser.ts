import { Request, Response } from "express";
import * as mongoose from "mongoose";
import { userModel, userProfile, IUserProfile, IUser, } from "../../../models/Users/user";
import { accountModel, IAccount } from "../../../models/Users/account";
import { ICommunityMeta, communityModel, ICommunity } from "../../../models/Communities/community";

enum UsertTypes {
    admin = "admin",
    user = "user",
    communitybuilder = "communitybuilder"
}
interface UserAddables {
    email: string;
    phone: number;
    city: string;
    role: string;
    password: string;
}

interface UserEditables {
    image: string;
    phone: number;
    city: string;
    name: string;
    gender: string;
    dateOfBirth: string;
    description: string;
}

interface Account {
    _id: string;
    user: string;
    role: UsertTypes;
    isActive: boolean;
    isConfirmed: boolean;
}

class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = "Authentication Error";
    }
}

export class QueryResolverUser {
    request: Request;
    debug: boolean;
    constructor(request: Request, debug = true) {
        this.request = request;
        this.debug = debug;
    }

    async addUser(args): Promise<IUser> {
        if (!this.debug && this.request.user.role.includes(UsertTypes.admin))
            throw new AuthenticationError("Only admin can add a user");
        const userDetails: UserAddables = args.userDetails;
        console.log(userDetails);
        const user = new userModel({
            email: userDetails.email,
            phone: Number(userDetails.phone),
            city: userDetails.city
        });
        const account = new accountModel({
            user: user.id,
            role: userDetails.role,
            isActive: true,
            password: userDetails.password,
            isConfirmed: false
        });
        try {
            const newUser = await user.save();
            await account.save();
            return newUser;
        } catch (err) {
            throw err;
        }
    }

    async editUser(args): Promise<IUserProfile> {
        const uid:string = args.uid;
        const newData:UserEditables = args.newData;
        if (!this.debug && mongoose.Types.ObjectId(uid).equals(this.request.user.id))
            throw new AuthenticationError("Authentication failed");
        try {
            const updatedUser = await userProfile.findByIdAndUpdate(uid, newData, { new: true });
            return updatedUser;
        } catch (err) {
            throw err;
        }
    }

    async changeUserPassword(args): Promise<boolean> {
        const uid:string = args.uid;
        const password = args.password;
        if (!this.debug && mongoose.Types.ObjectId(uid).equals(this.request.user.id))
            throw new AuthenticationError("Authentication failed");
        try {
            const userAccount = await accountModel.findOne({user: uid});
            userAccount.password = password;
            await userAccount.save();
            return true;
        } catch (err) {
            throw err;
        }
    }

    async editAccount(args): Promise<IAccount> {
        const uid:string = args.uid;
        const newData:Account = args.newData;
        console.log(newData);
        if (!this.debug && this.request.user.role.includes(UsertTypes.admin))
            throw new AuthenticationError("Authentication failed");
        try {
            let userAccount = null;
            userAccount = await accountModel.findOneAndUpdate({user: uid}, newData, { new: true });
            return userAccount;
        } catch (err) {
            throw err;
        }
    }

    async addCommunity(args): Promise<ICommunity> {
        const communityDetails: ICommunityMeta = args.communityDetails;
        if (!this.debug && this.request.user.role.includes(UsertTypes.communitybuilder))
            throw new AuthenticationError("Authentication failed");
        try {
            communityDetails.owner = this.request.user.id;
            const community = new communityModel(communityDetails);
            await community.save();
            return community;
        } catch (err) {
            throw err;
        }
    }

    async editCommunity(args): Promise<ICommunity> {
        const cid:string = args.cid;
        const newData:ICommunityMeta = args.newData;
        if (!this.debug && this.request.user.role.includes(UsertTypes.communitybuilder))
            throw new AuthenticationError("Authentication failed");
        try {
            newData.owner = this.request.user.id;
            const community = await communityModel.findByIdAndUpdate(cid, newData);
            return community;
        } catch (err) {
            throw err;
        }
    }
}
