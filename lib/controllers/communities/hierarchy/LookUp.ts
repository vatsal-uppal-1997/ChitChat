import * as mongoose from "mongoose";
import { lookupModel, ICommunityStatusPair, status, ILookup } from "../../../models/Communities/lookup";
import {IUserProfile, userProfile} from "../../../models/Users/user";
import { communityModel, ICommunity, ICommunityMeta } from "../../../models/Communities/community";

export enum userStates {
    joined = "joined",
    owner = "owner",
    requested = "requested"
}
export class LookUp {

    static async addCommunity(userid:string, communityid:string) {
        const memberOf:ICommunityStatusPair = {
            community: new mongoose.Types.ObjectId(communityid),
            status: status.member
        };
        await lookupModel.findOneAndUpdate(
            {user: userid},
            {$addToSet: {memberOf}},
            {upsert: true});
    }

    static async getCommunitiesOverload(userid:string, type:userStates) {
        const communities:ILookup = await lookupModel.findOne({"user": userid}).populate("memberOf.community", "meta");
        switch(type) {
            case userStates.joined:
                const joined = communities.memberOf.filter(ele => ele.status !== status.requested && ele.status !== status.owner);
                return joined;
            case userStates.requested:
                const requested = communities.memberOf.filter(ele => ele.status === status.requested);
                return requested;
            case userStates.owner:
                const owner = communities.memberOf.filter(ele => ele.status === status.owner);
                console.log(owner);
                return owner;
        }
    }
    static async getCommunities(userid:string) {
        const communities:ILookup = await lookupModel.findOne({"user": userid});
        return communities;
    }

    static async checkIfMember(userid:string, communityid:string) {
        const lookupdoc = await lookupModel.findOne({"user":userid});
        if (!lookupdoc)
            throw Error("Un-Authorised Access");
        const memberOf = lookupdoc.memberOf
        const result = memberOf.find((val) => (val.community as mongoose.Types.ObjectId).equals(communityid))
        return result;
    }

    static async removeCommunity(userid:string, communityid:string) {
        const memberOf = {
            community: mongoose.Types.ObjectId(communityid)
        };
        await lookupModel.findOneAndUpdate(
            {user: userid},
            {$pull: {memberOf}}
        );
    }

    static async updateCommunity(userid:string, communityid:string, changeTo:status) {
        await lookupModel.update(
            {"user": userid, "memberOf.community": communityid},
            {"$set": {"memberOf.$.status": changeTo}});
    }
}

