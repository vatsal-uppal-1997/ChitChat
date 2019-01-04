import * as mongoose from "mongoose";
import { ICommunity, communityModel } from "../../../models/Communities/community";
import { IPost, postModel, IPostMeta } from "../../../models/Communities/post";
import { commentModel, ICommentMeta, IComments } from "../../../models/Communities/comments";
import Post from "./Post";
import { IUserProfile } from "../../../models/Users/user";

export interface IPartialCommentMeta {
    owner: mongoose.Types.ObjectId | IUserProfile,
    date: string;
    text: string;
}
class Comment {

    static async addComment(communityDocument: ICommunity, postid: string, comment: ICommentMeta) {
        if (Post.isPostsPopulated(communityDocument.posts)) {
            const check = communityDocument.posts.find(ele => ele.id === postid);
            if (!check)
                throw Error("Post not found");
        } else {
            const check = communityDocument.posts.find(ele => ele.equals(postid));
            if (!check)
                throw Error("Post not found");
        }
        const newComment = new commentModel({
            meta: comment
        });
        await newComment.save();
        await postModel.findByIdAndUpdate(postid, { $addToSet: { comments: newComment.id } });
        return communityDocument;
    }

    static isCommentMeta(check): check is ICommentMeta {
        return (check &&
            check.owner &&
            check.date &&
            check.text &&
            check.parentPost);
    }

    static isPartialCommentMeta(check): check is IPartialCommentMeta {
        return (check &&
            check.owner &&
            check.date &&
            check.text);
    }
    
    static async addReply(communityDocument: ICommunity, post: string, parentCommentid: string, comment: IPartialCommentMeta) {
        const parentComment = await commentModel.findOne({"_id": parentCommentid, "meta.parentPost": post});
        const commentMeta: ICommentMeta = { ...comment, parentPost: parentComment.meta.parentPost, parentComment: parentComment.id };
        const reply = new commentModel({ meta: commentMeta });
        await reply.save();
        await commentModel.findByIdAndUpdate(parentComment.id, { $addToSet: { replies: reply.id } });
        return communityDocument;
    }

    static async getReply(parentPost:string, commentId: string) {
        const comment = await commentModel.findOne({"_id":commentId, "meta.parentPost": parentPost})
            .populate("replies").exec();
        return comment.replies as IComments[];
    }

    static async editComment(commentId: string, text: string) {
        const comment = await commentModel.findById(commentId);
        if (!comment.meta.locked)
            await commentModel.findByIdAndUpdate(commentId, { "$set": { "meta.text": text } });
        else
            throw Error("Comment is locked");
    }

    static async deleteComment(commentId: string) {
        const comment = await commentModel.findById(commentId);
        if (!comment.meta.locked) {
            comment.meta.text = "[deleted]";
            comment.meta.locked = true;
            await comment.save();
        } else {
            throw Error("Comment is locked");
        }
    }
}

export default Comment;