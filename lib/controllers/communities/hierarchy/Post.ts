import { ICommunity, communityModel } from "../../../models/Communities/community";
import { IPost, postModel, IPostMeta } from "../../../models/Communities/post";
import { commentModel } from "../../../models/Communities/comments";

class Post {

    static isPostsPopulated(check): check is IPost[] {
        return (check && 
            check[0] &&
            check[0].meta &&
            check[0].meta.owner &&
            check[0].meta.date &&
            check[0].meta.text);
    }

    static isPostMeta(check): check is IPostMeta {
        return (check &&
            check.hasOwnProperty("owner") &&
            check.hasOwnProperty("date") &&
            check.hasOwnProperty("text") &&
            check.hasOwnProperty("locked"));
    }

    static async addPost(communityDocument:ICommunity, content: IPostMeta) {
        const toAdd = new postModel({
            meta: content
        });
        const post = await toAdd.save();
        const newCommunityDocument = await communityModel.findByIdAndUpdate(communityDocument.id, 
        {$addToSet: {posts: post}}, {new: true});
        // if (this.isPostsPopulated(communityDocument.posts))
        //     communityDocument.posts.push(post);
        // else
        //     communityDocument.posts.push(post.id);
        // const newDoc = await communityDocument.save();
        return newCommunityDocument;
    }

    static async getPost(communityDocument:ICommunity, id:string) {
        if (this.isPostsPopulated(communityDocument.posts)) {
            const check = communityDocument.posts.find(ele => ele.id === id);
            if (!check)
                throw Error("Post not found");
        } else {
            const check = communityDocument.posts.find(ele => ele.equals(id));
            if (!check)
                throw Error("Post not found");
        }
        const post = await postModel.findById(id).populate("comments").exec();
        return post;
    }

    static async editPost(communityDocument:ICommunity, id:string, text:string) {
        if (this.isPostsPopulated(communityDocument.posts)) {
            const check = communityDocument.posts.find(ele => ele.id === id);
            if (!check)
                throw Error("Post not found");
        } else {
            const check = communityDocument.posts.find(ele => ele.equals(id));
            if (!check)
                throw Error("Post not found");
        }
        const post = await postModel.findById(id);
        if (post.meta.locked === true)
            throw Error("Post is locked");
        post.meta.text = text;
        await post.save();
        communityDocument = await communityModel.findById(communityDocument.id);
        return communityDocument;
    }

    static async deletePost(communityDocument:ICommunity, id:string) {
        if (this.isPostsPopulated(communityDocument.posts)) {
            const check = communityDocument.posts.find(ele => ele.id === id);
            if (!check)
                throw Error("Post not found");
        } else {
            const check = communityDocument.posts.find(ele => ele.equals(id));
            if (!check)
                throw Error("Post not found");
        }
        const post = await postModel.findById(id);
        post.meta.locked = true;
        post.meta.text = "[deleted]";
        await post.save();
        communityDocument = await communityModel.findById(communityDocument.id);
        return communityDocument;
    }

}

export default Post;