"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const account = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
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
function hashNSave(account, cb) {
    bcrypt.genSalt(10, function (err, salt) {
        if (err)
            return cb(err);
        bcrypt.hash(account.get("password"), salt, function (err, hash) {
            if (err)
                return cb(err);
            account.set("password", hash);
            cb(null);
        });
    });
}
// Hash the password before "saving"
account.pre("save", function (next) {
    let account = this;
    if (!account.isModified("password")) // if password is already hashed do nothing
        return next();
    hashNSave(account, function (err) {
        if (err)
            return next(err);
        next();
    });
});
account.methods.checkPassword = function (toCheck, cb) {
    const passwordHashed = this.get("password"); // get current HASHED password
    bcrypt.compare(toCheck, passwordHashed, function (err, res) {
        if (err)
            return cb(err, false);
        cb(null, res); // return True or False to the callback
    });
};
// Validate role 
account.path("role").validate(function (role) {
    if (role !== "user" && role !== "admin" && role !== "community builder")
        return false;
    return true;
}, "Invalid Phone Number");
exports.accountModel = mongoose.model("Account", account);
//# sourceMappingURL=account.js.map