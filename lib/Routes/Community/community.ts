import {Request, Response, Router} from "express";
import * as multer from "multer";
import {Community} from "../../controllers/communities/hierarchy/Community";
import {communityAcl} from "../../controllers/communities/communityAcl";
import {memberAcl} from "./memberAcl";
import GetCommunity from "../../controllers/communities/hierarchy/GetCommunity";
import { LookUp, userStates } from "../../controllers/communities/hierarchy/LookUp";

const routes = Router();
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function(req, file, cb) {
        cb(null, `${req.user.id}-${file.originalname}`)
    }
});
const fileFilter = function(req, file, cb) {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png")
        cb(null, true);
    cb(null, false);
}
const upload = multer({storage: storage, 
    limits: {
        fileSize: 1024*1024*5
    },
    fileFilter: fileFilter
});

/* 

    TODO /api/community/:community --> GET all posts --> POST post a new post --> DELETE delete community only admin
    TODO /api/community/:community/:post --> Get only :post --> PATCH edit post --> DELETE delete post
    TODO /api/community/:community/:post/replies --> GET replies to the post --> POST a new reply
    TODO /api/community/:community/:post/replies/:reply --> Get replies to :reply --> PATCH edit reply --> DELETE delete a reply
    TODO /api/community/:community/details/members --> GET all members
    TODO /api/community/:community/details/admins --> GET all admins 

    ------MANAGE A COMMUNITY
    
    TODO /api/community --> POST create a community
    TODO /api/community/:community/details --> GET community details --> PATCH edit details
    TODO /api/community/:community/join --> POST Add a member
    TODO /api/community/:community/leave --> POST leave group
    TODO /api/community/:community/members/:member --> GET member id
*/  

const asyncCommGetter = new GetCommunity();

/* All */

routes.get("/", async (req:Request, res:Response) => {
    Community.getBasicDetails(req, res);
});
routes.get("/joined",  async (req:Request, res:Response) => {
    const send = await LookUp.getCommunitiesOverload(req.user.id, userStates.joined);
    res.json(send);
});
routes.get("/requested", async (req:Request, res:Response) => {
    const send = await LookUp.getCommunitiesOverload(req.user.id, userStates.requested);
    res.json(send);
});

routes.post("/:community/join", memberAcl, async (req:Request, res:Response) => {
    const comm = await asyncCommGetter.getCommunity(req.params.community);
    comm.join(req, res);
});

/* Group members only */

routes.post("/:community/leave", memberAcl, async (req:Request, res:Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.leave(req, res);
})

routes.get("/:community", memberAcl, async (req:Request, res: Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.getCommunity(req, res);
});

routes.get("/:community/details", memberAcl, async (req:Request, res:Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.getDetails(req, res);
});

routes.get("/:community/details/members", memberAcl, async (req:Request, res:Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.getMembers(req, res);
});

routes.get("/:community/details/members/admins", memberAcl, async (req:Request, res:Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.getAdmins(req, res);
});

routes.post("/:community/details/members/:member/:action", memberAcl, async (req:Request, res:Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    if (req.params.action === "promote")
        data.promote(req, res);
    else if (req.params.action === "demote")
        data.demote(req, res);
    else
        res.status(400).send();
});

/* Posts relate routes */

routes.post("/:community", memberAcl, async (req:Request, res: Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.addPost(req, res);
});

routes.get("/:community/:post", memberAcl, async (req:Request, res:Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.getPost(req, res);
});

routes.patch("/:community/:post", memberAcl, async (req:Request, res:Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.editPost(req, res);
});

routes.delete("/:community/:post", memberAcl, async (req:Request, res:Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.deletePost(req, res);
});

routes.post("/:community/:post/comment", memberAcl, async (req:Request, res:Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.addComment(req, res);
});

routes.get("/:community/:post/comment/:comment", memberAcl, async (req:Request, res:Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.getReply(req, res);
});

routes.post("/:community/:post/comment/:comment", memberAcl, async (req:Request, res:Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.addReply(req, res);
});

/* --- */

routes.post("/", upload.single("image"), (req:Request, res:Response) => {
    Community.createCommunity(req, res);
});

routes.get("/my",  async (req:Request, res:Response) => {
    const send = await LookUp.getCommunitiesOverload(req.user.id, userStates.owner);
    res.json(send);
});

export default routes;