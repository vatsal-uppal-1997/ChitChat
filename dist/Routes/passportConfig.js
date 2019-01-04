"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport = require("passport");
const passportStrat = require("passport-local");
const user_1 = require("../models/Users/user");
const account_1 = require("../models/Users/account");
const LocalStrategy = passportStrat.Strategy;
passport.use(new LocalStrategy(function (email, password, done) {
    console.log("called");
    if (!email || !password)
        return done(new Error());
    user_1.userModel.findOne({ email: email }, function (err, res) {
        account_1.accountModel.findOne({ user: res }, function (err, resAcc) {
            if (err)
                return done(err);
            if (!resAcc)
                return done(null, false);
            resAcc.checkPassword(password, function (err, result) {
                console.log("error : " + err + " result : " + result + " email : " + email + " password : " + password);
                if (err)
                    return done(err);
                if (!result)
                    return done(null, result);
                if (!resAcc.isActive)
                    return done(null, false);
                let role;
                if (resAcc.isconfirmed === false)
                    role = "confirm";
                else
                    role = resAcc.role;
                done(null, { id: res.id, email: res.email, role: role });
            });
        });
    });
}));
passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    user_1.userModel.findById(id, function (err, user) {
        if (err)
            return done(err);
        account_1.accountModel.findOne({ user: id }, function (err, res) {
            if (err)
                return done(err);
            let role;
            if (res.isconfirmed === false)
                role = "confirm";
            else
                role = res.role;
            done(null, { id: user.id, email: user.email, role: role });
        });
    });
});
exports.default = passport;
//# sourceMappingURL=passportConfig.js.map