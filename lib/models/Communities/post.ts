import * as mongoose from "mongoose";
import { IUserProfile } from "../Users/user";
import {IComments} from "./comments";

const post = new mongoose.Schema({
    meta: {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        date: {
            type: String,
            required: true
        },
        text: {
            type: String,
            required: true
        },
        locked: {
            type: Boolean,
            required: true,
            default: false
        }
    },
    comments: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }],
        default: []
    }
})

export interface IPostMeta {
    owner: mongoose.Schema.Types.ObjectId | IUserProfile,
    date: string;
    text: string;
    locked: boolean;
}
export interface IPost extends mongoose.Document {
    meta: IPostMeta;
    comments: mongoose.Schema.Types.ObjectId[] | IComments[];
}

export const postModel:mongoose.Model<IPost> = mongoose.model<IPost>("Post",post);