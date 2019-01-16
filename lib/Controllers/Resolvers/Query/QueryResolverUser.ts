import { Request, Response } from "express";
import * as mongoose from "mongoose";
import { userModel, userProfile, IUserProfile, IUser, ICommunityStatusPair, status } from "../../../models/Users/user";
import { accountModel, IAccount } from "../../../models/Users/account";
import { ICommunityMeta, communityModel, ICommunity } from "../../../models/Communities/community";

mongoose.Types.ObjectId.prototype.valueOf = function () {
    return this.toString();
}

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
// TODO Populate fields
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
        const uid: string = args.uid;
        const newData: UserEditables = args.newData;
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
        const uid: string = args.uid;
        const password = args.password;
        if (!this.debug && mongoose.Types.ObjectId(uid).equals(this.request.user.id))
            throw new AuthenticationError("Authentication failed");
        try {
            const userAccount = await accountModel.findOne({ user: uid });
            userAccount.password = password;
            await userAccount.save();
            return true;
        } catch (err) {
            throw err;
        }
    }

    async editAccount(args): Promise<IAccount> {
        const uid: string = args.uid;
        const newData: Account = args.newData;
        console.log(newData);
        if (!this.debug && this.request.user.role.includes(UsertTypes.admin))
            throw new AuthenticationError("Authentication failed");
        try {
            let userAccount = null;
            userAccount = await accountModel.findOneAndUpdate({ user: uid }, newData, { new: true });
            return userAccount;
        } catch (err) {
            throw err;
        }
    }

    async addCommunity(args): Promise<ICommunity> {
        const communityDetails: ICommunityMeta = args.communityDetails;
        console.log(communityDetails);
        if (!this.debug && this.request.user.role.includes(UsertTypes.communitybuilder))
            throw new AuthenticationError("Authentication failed");
        try {
            if (this.debug)
                communityDetails.owner = mongoose.Types.ObjectId("5c2371644a0ed72e90b0ad1e");
            else
                communityDetails.owner = this.request.user.id;
            const community = new communityModel({ meta: communityDetails });
            await community.save();
            return community;
        } catch (err) {
            throw err;
        }
    }

    async editCommunity(args): Promise<ICommunity> {
        const cid: string = args.cid;
        const newData: ICommunityMeta = args.newData;
        if (!this.debug && this.request.user.role.includes(UsertTypes.communitybuilder))
            throw new AuthenticationError("Authentication failed");
        try {
            if (this.debug)
                newData.owner = mongoose.Types.ObjectId("5c2371644a0ed72e90b0ad1e");
            else
                newData.owner = this.request.user.id;
            const community = await communityModel
                .findByIdAndUpdate(cid,
                    { meta: newData },
                    { new: true });
            return community;
        } catch (err) {
            throw err;
        }
    }

    async joinCommunity(args): Promise<boolean> {
        const cid: string = args.cid;
        const member: string = args.member;
        if (!this.debug && this.request.user.id === member)
            throw new AuthenticationError("Authentication failed");
        try {
            await communityModel
                .findById(cid)
                .exec()
                .then(async (val: ICommunity) => {
                    if (val.meta.isOpen) {
                        await userProfile
                            .findByIdAndUpdate(member,
                                {
                                    "$addToSet": {
                                        memberOf: {
                                            community: cid,
                                            status: status.member
                                        }
                                    }
                                });
                        await communityModel
                            .findByIdAndUpdate(cid,
                                {
                                    "$addToSet": {
                                        members: member
                                    }
                                });
                    } else {
                        await communityModel
                            .findByIdAndUpdate(cid,
                                {
                                    "$addToSet": {
                                        requests: member
                                    }
                                });
                    }
                });
            return true;
        } catch (err) {
            throw err;
        }
    }

    async removeCommunityMember(args): Promise<boolean> {
        const cid: string = args.cid;
        const member: string = args.member;
        if (!this.debug && (this.request.user.role === UsertTypes.communitybuilder || this.request.user.id === member))
            throw new AuthenticationError("Authentication failed");
        try {
            await userProfile
                .findByIdAndUpdate(member,
                    {
                        "$pull": {
                            memberOf: {
                                community: cid
                            }
                        }
                    });
            await communityModel
                .findByIdAndUpdate(cid,
                    {
                        "$pull": {
                            members: member,
                            admins: member
                        }
                    });
            return true;
        } catch (err) {
            throw err;
        }
    }

    async makeCommunityAdmin(args) {
        const cid: string = args.cid;
        const member: string = args.member;
        if (!this.debug && this.request.user.role.includes(UsertTypes.communitybuilder))
            throw new AuthenticationError("Authentication failed");
        try {
            const communityOld = await communityModel
                .findById(cid);
            const communityNew = await communityModel
                .findByIdAndUpdate(cid,
                    {
                        "$pull": {
                            members: member
                        }
                    },
                    {
                        new: true
                    });
            if (communityOld.members.length != communityNew.members.length) {
                await communityModel
                    .findByIdAndUpdate(cid,
                        {
                            "$addToSet": {
                                admins: member
                            }
                        });
                await userProfile
                    .findById(member)
                    .exec()
                    .then(async (profile) => {
                        for (let i of profile.memberOf) {
                            if (i.community.toString() === cid)
                                i.status = status.admin;
                        }
                        await profile.save();
                    });
            } else {
                throw new Error("User is not a member");
            }
            return true;
        } catch (err) {
            throw err;
        }
    }

    async removeCommunityAdmin(args) {
        const cid: string = args.cid;
        const member: string = args.member;
        if (!this.debug && this.request.user.role.includes(UsertTypes.communitybuilder))
            throw new AuthenticationError("Authentication failed");
        try {
            const communityOld = await communityModel
                .findById(cid);
            const communityNew = await communityModel
                .findByIdAndUpdate(cid,
                    {
                        "$pull": {
                            admins: member
                        }
                    },
                    {
                        new: true
                    });
            if (communityOld.admins.length != communityNew.admins.length) {
                await communityModel
                    .findByIdAndUpdate(cid,
                        {
                            "$addToSet": {
                                members: member
                            }
                        });
                await userProfile
                    .findById(member)
                    .exec()
                    .then(async (profile) => {
                        for (let i of profile.memberOf) {
                            if (i.community.toString() === cid)
                                i.status = status.member;
                        }
                        await profile.save();
                    });
            } else {
                throw new Error("User is not an admin");
            }
            return true;
        } catch (err) {
            throw err;
        }
    }
}
