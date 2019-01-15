import * as passport from "passport";
import * as passportStrat from "passport-local";
import {userModel, IUser} from "../models/Users/user";
import {accountModel, IAccount} from "../models/Users/account";


const LocalStrategy = passportStrat.Strategy;

passport.use(new LocalStrategy(
    function(email, password, done) {
        console.log("called : "+email+" "+password);
        if (!email || !password)
            return done(new Error());
        userModel.findOne({email: email}, function(err:any, res:IUser){
            accountModel.findOne({user: res}, function(err:any, resAcc:IAccount){
                if (err)
                    return done(err);
                if (!resAcc)
                    return done(null, false);
                resAcc.checkPassword(password, function (err:Error, result:boolean) {
                    console.log("error : "+err+" result : "+result+" email : "+email+" password : "+password);
                    if (err)
                        return done(err);
                    if (!result)
                        return done(null, result);
                    if (!resAcc.isActive)
                        return done(null, false);
                    let role: string;
                    if (resAcc.isConfirmed === false)
                        role = "confirm";
                    else
                        role = resAcc.role
                    done(null, {id: res.id, email: res.email, role: role});
                })
            });
        });        
    }
));

passport.serializeUser(function(user:IUser, done) {
    done(null, user.id);
});
   
passport.deserializeUser(function(id, done) {
    userModel.findById(id, function (err:Error, user:IUser) {
        if (err)
            return done(err);
        console.log(user);
        accountModel.findOne({user: user.id}, function(err:Error, res:IAccount){
            if (err)
                return done(err);
            let role:string;
            if (res.isConfirmed === false)
                role = "confirm";
            else
                role = res.role
            done(null, {id: user.id, email: user.email, role: role});
        })
    });
});

export default passport;