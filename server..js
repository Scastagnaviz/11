const session = require("express-session");
const express = require("express");
const handlebars = require("express-handlebars");
const routes = require("./src/routes/routes");
const UserModel = require("./src/models/usuarios");
const { fork } = require('child_process');
//const TwitterUserModel = require("./src/models/twitterUsuario");
//const mongoStore = require('connect-mongo')
const { TIEMPO_EXPIRACION,secret } = require("./src/config/globals");
const { validatePass } = require("./src/utils/passValidator");
const { createHash } = require("./src/utils/hashGenerator");

const { isValidObjectId, connect } = require("mongoose");
const dotenv = require('dotenv')
dotenv.config();
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
//const TwitterStrategy = require("passport-twitter").Strategy;
//const bCrypt = require("bcrypt");
const mongoose = require("mongoose");
//const twitterUsuario = require("./src/models/twitterUsuario");

const parseArgs = require('minimist');

const app = express();

///////////////////////////////////////////////////////


app.use(
    session({
        secret: 'san',
        cookie: {
            httpOnly: false,
            secure: false,
            maxAge: parseInt(TIEMPO_EXPIRACION),
        },
        rolling: true,
        resave: true,
        saveUninitialized: true,
    })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

app.engine(
    "hbs",
    handlebars.engine({
        extname: ".hbs",
        defaultLayout: "index.hbs",
        layoutsDir: __dirname + "/src/views/layouts",
        partialsDir: __dirname + "/src/views/partials/",
        runtimeOptions: {
            allowProtoPropertiesByDefault: true,
            allowProtoMethodsByDefault: true,
        },
    })
);

app.set("view engine", "hbs");
app.set("views", "./src/views");
app.use(express.static(__dirname + "/public"));

passport.use(
    "login",
    new LocalStrategy((username, password, done) => {
        UserModel.findOne({ username: username }, (err, user) => {
            if (err) {
                return done(err);
            }
            if (!user) {
                console.log("User not found with username" + username);
                return done(null, false);
            }
            if (!validatePass(user, password)) {
                console.log("invalid password");
                return done, false;
            }

            return done(null, user);
        });
    })
);

passport.use(
    "signup",
    new LocalStrategy({ passReqToCallback: true }, (req,username,password, done) => {
        UserModel.findOne({username:username}, (err, user) => {
            if (err) {
                console.log("Error de signup" + err);
                return done(err);
            }
            if (user) {
                console.log("Usuario ya existente");
                return done(null, false);
            }
            console.log(req.body);

            const newUser = {
               username:username,
                password: createHash(password),
            };
            console.log(newUser);

            UserModel.create(newUser, (err, userWithId) => {
                if (err) {
                    console.log("Error in Saving user: " + err);
                    return done(err);
                }
                console.log(userWithId);
                console.log("Registro Existoso");
                return done(null, userWithId);
            });
        });
    })
);

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser((id, done) => {
    UserModel.findById(id, done);
});


///////////////////////////////////////////


app.get("/", routes.getRoot);
////
app.get("/login", routes.getLogin);
app.post(
    "/login",
    passport.authenticate("login", { failureRedirect: "/faillogin" }),
    routes.postLogin
);
app.get("/faillogin", routes.getFailLogin);

////
app.get('/signup', routes.getSignup);
app.post('/signup', passport.authenticate('signup',
 { failureRedirect: "/failsignup" }
 ), routes.postSignup);
app.get('/failsignup', routes.getFailSignup);

app.get("/logout", routes.getLogout);
////
app.get("/profile", routes.getProfile);

app.get("/ruta-protegida", routes.checkAuthentication, (req, res) => {
    res.render("protected");
});
app.get("/info", routes.getInfo);



app.get("/random", (req,res)=>{
    // let numeros=0;
    // if(req.query.n){
    //     numeros= req.query.n;
    // }else{numeros=100000000}
    
    app.on('request', (req, res) => {

          const randoms = fork('./randoms.js')
           randoms.send('start');
            randoms.on('message', sum => {
                res.end(`La suma es ${sum}`)
        })
    
    })
});


app.get("*", routes.failRoute);




const options = {default:{puerto: "8080"},alias: {  p: 'puerto', _: 'otros' }}


const args =parseArgs(process.argv.slice(2),options);
PORT=args.puerto;
console.log(PORT);
const server = app.listen(PORT, () => {
    console.log("Server on port "+PORT);
});

server.on("error", (error) => console.log("Error en el servidor"));