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

enum CommunityRequestActions {
    accept = "accept",
    reject = "reject"
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

    async addUser(args) {
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
            return newUser.id;
        } catch (err) {
            throw err;
        }
    }

    async editUser(args) {
        const uid: string = args.uid;
        const newData: UserEditables = args.newData;
        if (!this.debug && mongoose.Types.ObjectId(uid).equals(this.request.user.id))
            throw new AuthenticationError("Authentication failed");
        try {
            const updatedUser = await userProfile.findByIdAndUpdate(uid, newData, { new: true });
            return updatedUser.id;
        } catch (err) {
            throw err;
        }
    }

    async changeUserPassword(args) {
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

    async editAccount(args) {
        const uid: string = args.uid;
        const newData: Account = args.newData;
        console.log(newData);
        if (!this.debug && this.request.user.role.includes(UsertTypes.admin))
            throw new AuthenticationError("Authentication failed");
        try {
            let userAccount = null;
            userAccount = await accountModel.findOneAndUpdate({ user: uid }, newData, { new: true });
            return userAccount.id;
        } catch (err) {
            throw err;
        }
    }

    async addCommunity(args) {
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
            return community.id;
        } catch (err) {
            throw err;
        }
    }

    async editCommunity(args) {
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
                .findById(cid);
            const newMeta = Object.assign(community.meta, newData);
            await communityModel
                .findByIdAndUpdate(cid,
                    { meta: newMeta },
                    { new: true });
            return community.id;
        } catch (err) {
            throw err;
        }
    }

    async joinCommunity(args) {
        const cid: string = args.cid;
        const member: string = args.member;
        const override = args.override === undefined ? false : args.override;
        if (!this.debug && (this.request.user.id === member || override))
            throw new AuthenticationError("Authentication failed");
        try {
            await communityModel
                .findById(cid)
                .exec()
                .then(async (val: ICommunity) => {
                    if (val.meta.isOpen || override) {
                        if (!override)
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
                        else
                            await userProfile
                                .findById(member)
                                .exec()
                                .then(async (profile) => {
                                    for (let i of profile.memberOf)
                                        if (i.community.toString() === cid) {
                                            i.status = status.member;
                                            break;
                                        }
                                    await profile.save();
                                })
                        await communityModel
                            .findByIdAndUpdate(cid,
                                {
                                    "$addToSet": {
                                        members: member
                                    }
                                });
                    } else {
                        await userProfile
                            .findByIdAndUpdate(member,
                                {
                                    "$addToSet": {
                                        memberOf: {
                                            community: cid,
                                            status: status.requested
                                        }
                                    }
                                });
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

    async removeCommunityMember(args) {
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

    async isRequestingUserAdmin(communityId: string) {
        if (this.debug)
            return true;
        const profile = await userProfile.findById(this.request.user.id);
        for (let i of profile.memberOf)
            if (i.community.toString() === communityId && i.status === status.admin)
                return true;
        return false;
    }

    async requestCommunityActions(args) {
        const cid: string = args.cid;
        const member: string = args.member;
        const action: CommunityRequestActions = args.action;
        const isAdmin = await this.isRequestingUserAdmin(cid);
        if (!this.debug && (this.request.user.role.includes(UsertTypes.communitybuilder) || isAdmin))
            throw new AuthenticationError("Authentication failed");
        try {
            const community = await communityModel.findById(cid);
            if (community.meta.isOpen === true)
                throw new Error("Cannot accept or reject requests in an open community");
            await communityModel.findByIdAndUpdate(cid, {
                "$pull": {
                    requests: member
                }
            });
            if (action === CommunityRequestActions.accept) {
                const fakeArgs = {
                    cid,
                    member,
                    override: true
                }
                this.joinCommunity(fakeArgs);
            } else {
                await userProfile
                    .findByIdAndUpdate(member,
                        {
                            "$pull": {
                                memberOf: {
                                    community: cid
                                }
                            }
                        });
            }
            return true;
        } catch (err) {
            throw err;
        }
    }
}
