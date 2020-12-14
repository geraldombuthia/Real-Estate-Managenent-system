const express = require("express");
const ejs = require("ejs");
const multer = require("multer");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const mongodb = require("mongodb");
const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const methodOverride = require("method-override");
const passport = require("passport");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const app = express();

app.set("view engine", "ejs");

app.use(helmet());
app.use("/assets", express.static(process.cwd() + "/assets"));
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: "troubled",
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
}));

app.use(passport.initialize());
app.use(passport.session());

MongoClient.connect(
    "mongodb+srv://geraldo1:a@cluster0.fgzgp.mongodb.net/Rems?retryWrites=true&w=majority",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
    (err, client) => {
        if (err) {
            console.log(err)
            res.sendFile(process.cwd() + "/views/error.html");
        } else {
            app.route("/").get((req, res) => {
                res.render("./index");

            });
            app.route("/listing").get((req, res) => {
                res.render("./listing");
            });
            app.route("/property").get((req, res) => {
                res.render("./property-single");
            });
            app.route("/about").get((req, res) => {
                res.render("./about");
            });
            app.route("/contact").get((req, res) => {
                res.render("./contact");
            });
            app.route("/sell").get((req, res) => {
                res.render("./signup");
            });
            app.route("/signup").post((req, res) => {
                const { name, email, password, password2 } = req.body;
                let error = [];
                if (password !== password2) {
                    error.push({ msg: "Passwords don't match" })
                } 
                if (error.length > 0) {
                    res.render("signup", {
                        error: error,
                        name: name,
                        email: email,
                        password: password,
                        password2: password2
                    })
                } else {
                    client
                        .db("test")
                        .collection("users")
                        .findOne(
                            { email: email },
                            (err, doc) => {
                                if (err) {
                                    res.render("./error");
                                    
                                } else if(doc) {
                                    error.push({ msg: "Email already exists" })
                                    //try make the error messages to be dispayed....
                                    console.log(error)
                                    console.log(doc + " email")
                                    res.render("signup", {
                                        error: error,
                                        name: name,
                                        email: email,
                                        password: password,
                                        password2: password2 });
                                } else {
                                    
                                    const hash = bcrypt.hashSync(password, 12);
                                    client.db("test").collection("users").insertOne({
                                        name,
                                        email,
                                        password: hash,
                                        dateOfJoin: Date.now()
                                    }, (err, doc) => {
                                            if (err) {
                                                res.render("./error.ejs")
                                            } else {
                                                console.log(doc.ops)
                                                res.render("./login")
                                            }
                                    })
                                }
                            }
                        );
                }
                const user = {
                    name,
                    email,
                    password,
                    password2,
                    dateOfJoin: Date.now()
                }
                console.log(user);
            })
            app.route("/login").get((req, res) => {
                res.render("./login")
            }).post((req, res) => {
                console.log("Login")
                passport.authenticate('local', {
                    successRedirect: './dashboard',
                    failureRedirect: './login',
                });
                console.log("success");
            })
            app.route("/profile").get((req, res) => {
                res.send("THis is the profile")
            });
            app.route('/logout').get((req, res) => {
                req.logout();
                res.redirect('/');
            });
            passport.serializeUser(function (user, done) {
                done(null, user._id);
            });

            passport.deserializeUser(function (id, done) {
                client.db("test").collection("users").findById({
                    _id: new ObjectID(id)
                }, (err, user) => {
                        done(err, user);
                        console.log(user);
                });
            });
            passport.use(new LocalStrategy((email, password, done) => {
                console.log(email)
                client.db("test").collection("users").findOne({usernameField: "email"},{ email : email }, (err, user) => {
                        console.log('User ' + email + ' attempted to log in.');
                        if (err) { return done(err); }
                        if (!user) { return done(null, false); }
                        if (!bcrypt.CompareSync(password, user.password)) { return done(null, false); }
                        return done(null, user);
                    });
                }
            ));
        }
    }
);


app.listen(process.env.PORT || 3000, () => {
    console.log("Listening");
});