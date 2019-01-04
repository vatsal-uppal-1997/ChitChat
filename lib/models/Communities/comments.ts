import * as mongoose from "mongoose";
import { IUserProfile } from "../Users/user";
import { IPost } from "./post";

const comment = new mongoose.Schema({
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
        parentPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true
        },
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        },
        locked: {
            type: Boolean,
            required: true,
            default: false
        }
    },
    replies: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }],
        default: []
    }
});


export interface ICommentMeta {
    owner: mongoose.Types.ObjectId | IUserProfile;
    date: string;
    text: string;
    parentPost: mongoose.Types.ObjectId | IPost;
    locked?: boolean;
    parentComment?: mongoose.Types.ObjectId | IComments
}

export interface IComments extends mongoose.Document {
    meta: ICommentMeta;
    replies: mongoose.Types.ObjectId[] | IComments[];
}

export const commentModel:mongoose.Model<IComments> = mongoose.model<IComments>("Comment",comment);