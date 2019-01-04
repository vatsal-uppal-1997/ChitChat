import {Request, Response, Router} from "express";
import * as multer from "multer";
import {Community} from "../../controllers/communities/hierarchy/Community";
import {communityAcl} from "../../controllers/communities/communityAcl";
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

/* Group members only */


routes.get("/:community", async (req:Request, res: Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.getCommunity(req, res);
});

/* Posts relate routes */

routes.post("/:community", async (req:Request, res: Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.addPost(req, res);
});

routes.get("/:community/:post", async (req:Request, res:Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.getPost(req, res);
});

routes.patch("/:community/:post", async (req:Request, res:Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.editPost(req, res);
});

routes.delete("/:community/:post", async (req:Request, res:Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.deletePost(req, res);
});

routes.post("/:community/:post/comment", async (req:Request, res:Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.addComment(req, res);
});

routes.get("/:community/:post/comment/:comment", async (req:Request, res:Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.getReply(req, res);
});

routes.post("/:community/:post/comment/:comment", async (req:Request, res:Response) => {
    const data = await asyncCommGetter.getCommunity(req.params.community);
    data.addReply(req, res);
});
/* --- */



routes.get("/my",  async (req:Request, res:Response) => {
    const send = await LookUp.getCommunitiesOverload(req.user.id, userStates.owner);
    res.json(send);
});

routes.get("/:community/join", communityAcl, async (req:Request, res:Response) => {
    const comm = await asyncCommGetter.getCommunity(req.params.community);
    comm.join(req, res);
});



routes.get("/:community", communityAcl, async (req:Request, res:Response) => {
    const comm = await asyncCommGetter.getCommunity(req.params.community);
    comm.getCommunity(req, res);
})


routes.post("/", upload.single("image"), (req:Request, res:Response) => {
    Community.createCommunity(req, res);
})


export default routes;