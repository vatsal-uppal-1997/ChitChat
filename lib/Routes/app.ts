import * as express from "express";
import * as bodyParser from "body-parser";
import * as mongoose from "mongoose";
import * as mongoStore from "connect-mongo";
import * as session from "express-session";
import passport from "./passportConfig";
import {schema} from "../models/GraphQlSchema";
import {QueryResolverUser} from "../Controllers/Resolvers/Query/QueryResolverUser";
import * as graphqlHTTP from "express-graphql";


class App {
    public app: express.Application;
    public mongoUrl: string = 'mongodb://localhost/project'; 
    public MongoStore = mongoStore(session);
    constructor() {
        this.app = express();
        this.mongoConfig();
        this.config();
    }
    private mongoConfig(): void {
        mongoose.set("runValidators", true);
        mongoose.connect(this.mongoUrl);
    }
    private config(): void 
    {
        // Meh....Boilerplate
        this.app.use(bodyParser.urlencoded({extended : true}));
        this.app.use(bodyParser.json());
        this.app.use(session({secret: 'ayyyylmao!',resave: false,saveUninitialized: false, store: new this.MongoStore({ mongooseConnection: mongoose.connection })}));
        this.app.use(passport.initialize());
        this.app.use(passport.session());
        this.app.use(express.static('uploads'))
        this.app.use("/graphql", graphqlHTTP(async (req, res, graphQLParams): Promise<graphqlHTTP.OptionsData> => ({
            schema: schema,
            rootValue: new QueryResolverUser(req),
            graphiql: true
        })));
    }
}

export default new App().app;