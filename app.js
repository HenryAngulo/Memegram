// Modulos y dependencias

var express = require('express');
var User = require('./models/user.js').User;
var session = require("express-session");
var router_app= require("./routes_app");
var session_middleware = require("./middlewares/session");
var methodOverride = require("method-override");
var formidable = require("express-formidable");
var RedisStore = require("connect-redis")(session);
var http = require("http");
var realtime = require("./realtime");

//Instancias

var app = express();
var server = http.Server(app);
var sessionMiddleware = session({
    store: new RedisStore({}),
    secret: "Habia una vez una palabra secreta para node",
    resave: false,
    saveUninitialized: false
});
  
realtime(server, sessionMiddleware);

app.use("/public", express.static('public'));


app.use(methodOverride("_method"));

app.set("view engine", "jade");


app.use(sessionMiddleware);

app.use(formidable({ keepExtensions: true}));

app.get('/', function(req,res){
    res.render("index");
});

app.get("/pong", function(req,res){
    res.render("pong");
})

app.get('/login', function(req,res){
    res.render('login');
});

app.get('/signup', function(req,res){
    User.find(function(err,doc){
        res.render('signup');
    });
});

app.post("/users", function(req, res){
    var user = new User({email:  req.fields.email, 
                                                password: req.fields.password,
                                                password_confirmation: req.fields.password_confirmation,
                                                username: req.fields.username
                                            });
    user.save().then(function(us){
        res.send("Guardamos el usuario exitosamente");
    }, function(err){
        if(err){
            console.log(String(err));
            res.send("No pudimos guardar el usuario");
        }
    });
});

app.post("/sessions", function(req,res){
    User.findOne({email: req.fields.email, password: req.fields.password}, function(err,user){   
        req.session.user_id = user._id;
        res.redirect("/app");
    });
});

app.use("/app", session_middleware);
app.use("/app", router_app);

server.listen(3000);