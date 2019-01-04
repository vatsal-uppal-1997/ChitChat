import * as mongoose from "mongoose";
import * as bcrypt from "bcrypt";
import { IUser, IUserProfile } from "./user";
import * as mongoosePaginate from "mongoose-paginate";

const account = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    role: {
        type: String,
        lowercase: true,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true
    }, 
    password: {
        type: String,
        required: true
    },
    isconfirmed: {
        type: Boolean,
        default: false,
        required: true
    }
});
account.plugin(mongoosePaginate);
function hashNSave(account: mongoose.Document, cb:((err: Error)=>void)):void{
    bcrypt.genSalt(10, function(err: Error, salt: string):void {
        if (err)
            return cb(err);
        bcrypt.hash(account.get("password"), salt, function(err: Error, hash: string){
            if (err)
                return cb(err);
            account.set("password", hash);
            cb(null);
        });
    });
}

// Hash the password before "saving"
account.pre("save", function(next){
    let account = this;
    if (!account.isModified("password")) // if password is already hashed do nothing
        return next();
    hashNSave(account, function(err:Error){
        if (err)
            return next(err);
        next();
    });    
});

account.methods.checkPassword = function (toCheck:string, cb:(err:Error, result:boolean)=>void):void {
    const passwordHashed = this.get("password"); // get current HASHED password
    bcrypt.compare(toCheck, passwordHashed, function(err:Error, res:boolean) {
        if (err)
            return cb(err, false);
        cb(null, res); // return True or False to the callback
    });
}

// Validate role 
account.path("role").validate(function(role: string): boolean {
    if (role !== "user" && role !== "admin" && role !== "community builder")
        return false;
    return true;
}, "Invalid Phone Number");

export interface IAccount extends mongoose.Document {
    user: mongoose.Types.ObjectId | IUserProfile;
    role: string;
    isActive: boolean;
    password: string;
    isconfirmed: boolean;
    checkPassword: (toCheck:string, cb:(err:Error, result:boolean)=>void) => void;
}

interface paginateEnabled<T extends mongoose.Document> extends mongoose.PaginateModel<T> {}

export const accountModel:paginateEnabled<IAccount> = mongoose.model<IAccount>("Account",account) as paginateEnabled<IAccount>;