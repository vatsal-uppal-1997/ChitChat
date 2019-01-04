import { Request, Response } from "express";
import * as mongoose from "mongoose";
import { IUserProfile, userProfile } from "../../../models/Users/user";
import { communityModel, ICommunity, ICommunityMeta, PrivilegeActions, RequestActions } from "../../../models/Communities/community";
import { LookUp } from "./LookUp";
import { ICommunityStatusPair } from "../../../models/Communities/lookup";
import { status } from "../../../models/Communities/lookup";
import Post from "./Post";
import Comment from "./Comment";

export class Community {

    name: String;
    communityDocument: ICommunity;
    constructor(name: String) {
        this.name = name;
    }

    /**
     * Initialise a community object, by initiailising this.communityDocument
     */
    async init() {
        try {
            const getCommunity = await communityModel
                .findOne({ "meta.name": this.name });
            if (!getCommunity)
                throw Error(`${this.name} community does not exist`);
            this.communityDocument = getCommunity;
        } catch (err) {
            console.log(err);
        }
    }

    isCommunityStatusPair(check): check is ICommunityStatusPair {
        return (check && check.community && check.status);
    }
    /**
     * Get a basic listing of all communities
     * @param req request object
     * @param res response object
     */
    static async getBasicDetails(req: Request, res: Response) {
        try {
            const userComm = await LookUp.getCommunities(req.user.id);
            let exclude = [];
            userComm.memberOf.forEach((val) => {
                exclude.push(val.community);
            })
            console.log(exclude);
            let data = await communityModel.find({ _id: { $nin: exclude } })
                .select("meta");
            res.json(data);
        } catch (err) {
            res.status(500).json(err);
        }
    }
    /**
     * Static method to create a new community
     * @param req request object
     * @param res response object
     */
    static async createCommunity(req: Request, res: Response) {
        const isCommunityMeta = (check): check is ICommunityMeta => {
            return (check && check.session.id && check.body.name
                && check.file && check.body.description && check.body.isOpen);
        }
        const isValidReq = (check): boolean => {
            return (check && check.role === "community builder");
        }
        const data = {
            body: req.body,
            session: req.user,
            file: req.file
        }
        if (isValidReq(data.session)) {
            if (isCommunityMeta(data)) {
                try {
                    const insertDocument = new communityModel({
                        meta: {
                            owner: data.session.id,
                            name: data.body.name,
                            image: data.file.path,
                            description: data.body.description,
                            isOpen: data.body.isOpen
                        }
                    });
                    const newDoc = await insertDocument.save();
                    await LookUp.addCommunity(data.session.id, newDoc.id);
                    await LookUp.updateCommunity(data.session.id, newDoc.id, status.owner);
                    res.json(newDoc);
                } catch (err) {
                    res.status(422).json(err);
                }
            } else {
                res.status(400).send();
            }
        } else {
            res.status(401).send();
        }
    }

    /**
     * Method to fetch all posts in a community
     * @param req request object
     * @param res response object
     */
    async getCommunity(req: Request, res: Response) {
        try {
            this.communityDocument = await this.communityDocument
                .populate({path: "posts", model: "Post", populate: {path: "comments"}}).execPopulate();
            console.log(this.communityDocument);
            res.json(this.communityDocument.posts);
        } catch (err) {
            console.log(err);
            res.status(500).json(err);
        }
    }

    /**
     * Method to fetch community meta data. owner property is populated
     * @param req request object
     * @param res response object
     */
    async getDetails(req: Request, res: Response) {
        try {
            this.communityDocument = await this.communityDocument
                .populate({ path: "meta.owner", select: "name email role" });
            res.json(this.communityDocument.meta);
        } catch (err) {
            res.status(500).json(err);
        }
    }

    /**
     * Method to fetch members in a group
     * @param req request object
     * @param res response object
     */
    async getMembers(req: Request, res: Response) {
        try {
            this.communityDocument = await this.communityDocument
                .populate({ path: "members", select: "name email role" });
            res.json(this.communityDocument.members);
        } catch (err) {
            res.status(500).json(err);
        }
    }

    /**
     * Method to fetch admins in a group
     * @param req request object 
     * @param res response object
     */
    async getAdmins(req: Request, res: Response) {
        try {
            this.communityDocument = await this.communityDocument
                .populate({ path: "admins", select: "name email role" });
            res.json(this.communityDocument.admins);
        } catch (err) {
            res.status(500).json(err);
        }
    }

    /**
     * Method to fetch requests for a community. Requests are POPULATED (only name, email and role) !
     * This method uses res.locals.user to check if the user is authorised to fetch requests.
     * @param req request object
     * @param res response object requires res.locals.user via middleware
     */
    async getRequests(req: Request, res: Response) {
        try {
            const userData = res.locals.user;
            if (this.isCommunityStatusPair(userData)) {
                if (userData.status === status.owner || userData.status === status.admin) {
                    this.communityDocument = await this.communityDocument
                        .populate({ path: "requests", select: "name email role" });
                    res.json(this.communityDocument.requests);
                } else {
                    res.status(401).send();
                }
            } else {
                res.status(401).send();
            }
        } catch (err) {
            res.status(500).json(err);
        }
    }

    /**
     * Utility method to check type of an object
     * @param check Object to check whether it is of type IUserProfile[]
     */
    isPopulated(check): check is IUserProfile[] {
        return (check &&
            check[0] &&
            check[0].name &&
            check[0].email &&
            check[0].role);
    }

    /**
     * Method to make a user join a community as a member. 
     * This method uses res.locals.user to check if the user already is a member of a group.
     * @param req request object
     * @param res response object res.locals.user is required !
     */
    async join(req: Request, res: Response) {
        try {
            const userData = res.locals.user;
            if (userData !== undefined)
                return res.status(400).send();
            if (this.communityDocument.meta.isOpen) {
                this.communityDocument =
                    await communityModel.findByIdAndUpdate(
                        this.communityDocument.id,
                        { $addToSet: { members: req.user.id } });
                LookUp.addCommunity(req.user.id, this.communityDocument.id);
            } else {
                this.communityDocument =
                    await communityModel.findByIdAndUpdate(
                        this.communityDocument.id,
                        { $addToSet: { requests: req.user.id } });
                LookUp.addCommunity(req.user.id, this.communityDocument.id);
                LookUp.updateCommunity(req.user.id, this.communityDocument.id, status.requested);
            }
        } catch (err) {
            res.status(500).json(err);
        }
    }
    /**
     * Method to make a user leave a community.
     * This method uses res.locals.user to check if the user already is a member of a group.
     * @param req request object
     * @param res response object res.locals.user is required !
     */
    async leave(req: Request, res: Response) {
        const userData = res.locals.user;
        if (this.isCommunityStatusPair(userData)) {
            try {
                switch (userData.status) {
                    case status.admin:
                        this.communityDocument = await communityModel.findByIdAndUpdate(
                            this.communityDocument.id,
                            { $pull: { admins: req.user.id } });
                        break;
                    case status.member:
                        this.communityDocument = await communityModel.findByIdAndUpdate(
                            this.communityDocument.id,
                            { $pull: { members: req.user.id } });
                        break;
                    default:
                        return res.status(400).send();
                }
                await LookUp.removeCommunity(req.user.id, this.communityDocument.id);
                res.json({ message: "community left" });
            } catch (err) {
                res.status(500).json(err);
            }
        } else {
            res.status(400).send();
        }
    }

    /**
     * Promotes a member to admin
     * NOTE --> 
     * REQUIRED URL PATTERN /api/community/:community/members/:member/:action (where :member is the member id)
     * REQUIRED req.body.status (where status is admin, member or owner)
     * @param req request object
     * @param res response object
     */
    async promote(req: Request, res: Response) {
        if (req.params && req.params.member && req.params.action && req.body && req.body.status) {
            if (req.body.status === status.member) {
                try {
                    const communityDocument = await communityModel.findById(this.communityDocument.id);
                    const lenBefore = this.communityDocument.members.length;
                    communityDocument.members = (communityDocument.members as mongoose.Types.ObjectId[]).filter((ele) => (!ele.equals(req.body.status)));
                    const lenAfter = this.communityDocument.members.length;
                    if (lenBefore === lenAfter)
                        return res.status(400).send();
                    (communityDocument.admins as mongoose.Types.ObjectId[]).push(mongoose.Types.ObjectId(req.params.member));
                    this.communityDocument = await communityDocument.save();
                    LookUp.updateCommunity(req.params.member, this.communityDocument.id, status.admin);
                } catch (err) {
                    res.status(500).json(err);
                }
            } else {
                res.status(400).send();
            }
        } else {
            res.status(400).send();
        }
    }

    /**
     * Demotes an admin to member
     * NOTE --> 
     * REQUIRED URL PATTERN /api/community/:community/members/:member/demote (where :member is the member id)
     * REQUIRED req.body.status (where status is admin, member or owner)
     * @param req request object
     * @param res response object
     */
    async demote(req: Request, res: Response) {
        if (req.params && req.params.member && req.params.action && req.body && req.body.status) {
            if (req.body.status === status.admin) {
                try {
                    const communityDocument = await communityModel.findById(this.communityDocument.id);
                    const lenBefore = this.communityDocument.admins.length;
                    communityDocument.admins = (communityDocument.admins as mongoose.Types.ObjectId[]).filter((ele) => (!ele.equals(req.body.status)));
                    const lenAfter = this.communityDocument.admins.length;
                    if (lenBefore === lenAfter)
                        return res.status(400).send();
                    (communityDocument.members as mongoose.Types.ObjectId[]).push(mongoose.Types.ObjectId(req.params.member));
                    this.communityDocument = await communityDocument.save();
                    LookUp.updateCommunity(req.params.member, this.communityDocument.id, status.member);
                } catch (err) {
                    res.status(500).json(err);
                }
            } else {
                res.status(400).send();
            }
        } else {
            res.status(400).send();
        }
    }

    /**
     * Accept or Reject a request, requires req.body.requestId, action 
     * @param req request object
     * @param res response object
     */
    async request(req: Request, res: Response) {
        const userData = res.locals.user;
        if (this.isCommunityStatusPair(userData)) {
            try {
                if (userData.status === status.owner || userData.status === status.admin) {
                    const communityDocument = await communityModel.findById(this.communityDocument.id);
                    const initialLength = communityDocument.requests.length;
                    communityDocument.requests = (communityDocument.requests as mongoose.Types.ObjectId[])
                        .filter(ele => ele !== req.body.requestId);
                    if (initialLength !== communityDocument.requests.length) {
                        if (req.body.action === RequestActions.accept) {
                            (communityDocument.members as mongoose.Types.ObjectId[]).push(req.body.requestId);
                            this.communityDocument = await communityDocument.save();
                            await LookUp.updateCommunity(req.body.requestId, this.communityDocument.id, status.member);
                            res.status(200).json({ message: "request accepted" });
                        } else {
                            await LookUp.removeCommunity(req.body.requestId, this.communityDocument.id);
                            res.status(200).json({ message: "request rejected" });
                        }
                    } else {
                        res.status(400).json({ message: "request does not exists" });
                    }
                } else {
                    res.status(401).send();
                }
            } catch (err) {
                res.status(500).json(err);
            }
        } else {
            res.status(401).send();
        }
    }

    /**
     * Add a new post to the community
     * @param req req object expects owner, date, text
     * @param res response object
     */
    async addPost(req: Request, res: Response) {
        let postMeta = { ...req.body };
        postMeta.locked = false;
        console.log(postMeta);
        try {
            if (Post.isPostMeta(postMeta)) {
                try {
                    this.communityDocument = await Post.addPost(this.communityDocument, postMeta);
                    console.log(this.communityDocument);
                    res.status(200).json({ message: "post added" });
                } catch (err) {
                    res.status(500).json(err);
                }
            } else {
                res.status(400).send();
            }
        } catch (err) {
            res.status(500).json(err);
        }
    }

    /**
     * Get a post specified by id
     * @param req req objects expects req.params.post
     * @param res response object
     */
    async getPost(req: Request, res: Response) {
        if (req.params && req.params.post) {
            try {
                const post = await Post.getPost(this.communityDocument, req.params.post);
                res.json(post);
            } catch (err) {
                res.status(500).json(err);
            }
        } else {
            res.status(400).send();
        }
    }

    /**
     * Edit a post specified by id
     * @param req req object expects req.params.post and req.body.text
     * @param res res object
     */
    async editPost(req: Request, res: Response) {
        if (req.params && req.params.post && req.body && req.body.text) {
            try {
                this.communityDocument = await Post.editPost(this.communityDocument, req.params.post, req.body.text);
                res.status(200).json({ message: "post edited" });
            } catch (err) {
                res.status(500).json(err);
            }
        } else {
            res.status(400).send();
        }
    }

    /**
     * Delete a post
     * @param req req object expects req.params.post
     * @param res response object
     */
    async deletePost(req: Request, res: Response) {
        if (req.params && req.params.post) {
            try {
                this.communityDocument = await Post.deletePost(this.communityDocument, req.params.post);
                res.status(200).json({ message: "post deleted" });
            } catch (err) {
                console.log(err);
                res.status(500).json(err);
            }
        } else {
            res.status(400).send();
        }
    }

    /**
     * Add a comment to req.params.post
     * @param req req object expects req.params.post and date and text in req.body
     * @param res response object
     */
    async addComment(req: Request, res: Response) {
        let commentMeta = {...req.body};
        commentMeta.owner = req.user.id;
        commentMeta.parentPost = req.params.post;
        if (Comment.isCommentMeta(commentMeta)) {
            try {
                this.communityDocument = await Comment.addComment(this.communityDocument, req.params.post, commentMeta);
                res.json({ message: "comment added" });
            } catch (err) {
                console.log(err);
                res.status(500).send();
            }
        } else {
            res.status(400).send();
        }
    }


    /**
     * Add a reply to req.params.comment
     * @param req req object expects req.params.comment and date and text in req.body
     * @param res response object
     */
    async addReply(req: Request, res: Response) {
        const commentMeta = {...req.body};
        commentMeta.owner = req.user.id;
        if (Comment.isPartialCommentMeta(commentMeta) && req.params && req.params.comment && req.params.post) {
            try {
                this.communityDocument = await Comment.addReply(this.communityDocument, req.params.post, req.params.comment, commentMeta);
                res.json({ message: "comment added" });
            } catch (err) {
                console.log(err);
                res.status(500).send();
            }
        } else {
            res.status(400).send();
        }
    }

    /**
     * get reply to req.params.comment
     * @param req req object expects req.params.comment
     * @param res response object
     */
    async getReply(req: Request, res: Response) {
        if (req.params && req.params.post && req.params.comment) {
            try {
                const replies = await Comment.getReply(req.params.post, req.params.comment);
                res.json(replies);
            } catch (err) {
                res.status(500).send();
            }
        } else {
            res.json(400).send();
        }
    }

    /**
     * edit a comment specified by req.params.comment
     * @param req req object expects req.params.comment && req.body.text
     * @param res response object
     */
    async editComment(req: Request, res: Response) {
        if (req.params && req.params.comment && req.body && req.body.text) {
            try {
                await Comment.editComment(req.params.comment, req.body.text);
                res.json({ message: "comment edited" });
            } catch (err) {
                res.status(500).send();
            }
        } else {
            res.json(400).send();
        }
    }

    /**
     * delete a comment specified by req.params.comment
     * @param req req object expects req.params.comment
     * @param res response object
     */
    async deleteComment(req: Request, res: Response) {
        if (req.params && req.params.comment) {
            try {
                await Comment.deleteComment(req.params.comment);
                res.json({ message: "comment deleted" });
            } catch (err) {
                res.status(500).send();
            }
        } else {
            res.json(400).send();
        }
    }
}