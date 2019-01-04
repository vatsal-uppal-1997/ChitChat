import * as express from "express";
import * as nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
	service : "gmail",
	auth : {
		user : "vatsal.uppal@gmail.com",
		pass : "gwvjddizzhmxvlqd"
	}
});

const mail = {
	from : "vatsal.uppal@gmail.com",
	to : "",
	subject : "Chit Chat - Admin",
	text : ""
};


interface validSession {
    id: string;
    email: string;
    role: string;
}
interface validBody {
    to: string;
    body: string;
}
interface validRequest {
    session: validSession;
    body: validBody;
}

function isValid(req: any): req is validRequest {
    if (req.session && req.session.role && req.session.email && req.session.id && req.body && req.body.body && req.body.to) {
        if (req.session.role === "admin")
            return true;        
    }
    return false; 
}

function sendMail(req: express.Request, res: express.Response) {
    const newReq = {session: {...req.user}, body: {...req.body}};
    if (isValid(newReq)) {
        mail.to = newReq.body.to;
        mail.text = newReq.body.body;
        transporter.sendMail(mail, function(err:Error, info: any) {
            if (err) {
                console.log(err);
            } else {
                console.log("Mail sent !");
                res.json({message: "Mail sent !"});
            }
        })
    } else {
        res.status(401).send();
    }
}

export default sendMail;