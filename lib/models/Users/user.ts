import * as mongoose from "mongoose";
import * as bcrypt from "bcrypt"; // For hashing password
import { ICommunity } from "../Communities/community";


// email, phone, city, password, role
const user = new mongoose.Schema({
    image: {
        type: String
    },
    email: {
        required: true,
        unique: true, 
        type: String,
    },
    phone: {
        required: true,
        unique: true, 
        type: Number,
    },
    city: {
        required: true,
        lowercase: true,
        type: String,
    },
    name : {
        type: String,
    },
    gender : {
        enum: ["male", "female"],
        lowercase: true,
        type: String,
    },
    dateOfBirth: {
        type: String,
    },
    description: {
        maxlength: 280,
        type: String,
    },
    interests: {
        type: [String],
    },
    invitations: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Community"
            }
        ],
        default: []
    },
    memberOf: {
        type: [ 
            {
                _id: false,
                community: {
                    type: mongoose.Types.ObjectId,
                    ref: "Community"
                },

                status: {
                    type: String,
                    enum: ["admin", "member", "owner", "requested"],
                    default: "member"
                }
            }
        ],
        default: []
    }
});

// Validate email
user.path("email").validate(function (val: string): boolean {
    // REGEX to validate email
    const expression = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
    return expression.test(val.toLowerCase());
}, "Invalid Email Address");

// Validate phone number 
user.path("phone").validate(function(val: number): boolean {
    // REGEX to validate phone number
    const expression = /^\d{10}$/;
    return expression.test(val.toString());
}, "Invalid Phone Number");

export enum status {
    admin = "admin",
    member = "member",
    owner = "owner",
    requested = "requested"
}

export interface ICommunityStatusPair {
    community: mongoose.Types.ObjectId | ICommunity,
    status: status
}

export interface ICommunityStatusPair {
    community: mongoose.Types.ObjectId | ICommunity,
    status: status
}

// Base User
export interface IUser extends mongoose.Document {
    
    email: string;
    phone: number;
    city: string;

}

// User with profile filled
export interface IUserProfile extends IUser {
    
    image?: string;
    name: string;
    gender: string;
    dateOfBirth: string;
    description: string;
    interests: string[];
    invitations: mongoose.Types.ObjectId | ICommunity;
    memberOf: ICommunityStatusPair[]; 

}

export const userModel: mongoose.Model<IUser> = mongoose.model<IUser>("User", user);
export const userProfile: mongoose.Model<IUserProfile> = mongoose.model<IUserProfile>("User", user);
