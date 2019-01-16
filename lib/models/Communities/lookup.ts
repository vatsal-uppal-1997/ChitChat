// import * as mongoose from "mongoose";
// import { IUserProfile } from "../Users/user";
// import { ICommunity } from "./community";

// const lookup = new mongoose.Schema({
//     user: {
//         type: mongoose.Types.ObjectId,
//         ref: "User"
//     },
//     memberOf: {
//         type: [ 
//             {
//                 community: {
//                     type: mongoose.Types.ObjectId,
//                     ref: "Community"
//                 },

//                 status: {
//                     type: String,
//                     enum: ["admin", "member", "owner", "requested"],
//                     default: "member"
//                 }
//             }
//         ],
//         default: []
//     }
// });

// export enum status {
//     admin = "admin",
//     member = "member",
//     owner = "owner",
//     requested = "requested"
// }


// export interface ILookup extends mongoose.Document {
//     user: mongoose.Types.ObjectId | IUserProfile;
//     memberOf: ICommunityStatusPair[];
// }

// export const lookupModel: mongoose.Model<ILookup> = mongoose.model<ILookup>("Lookup", lookup);