var express = require("express");
var Imagen = require("./models/imagenes");
var fs = require("fs");
var imageFinder = require("./middlewares/find_image");
var redis = require("redis");

var router = express.Router();
var client = redis.createClient();

router.get("/", function(req,res){
        Imagen.find({}).populate("creator").exec( function(err, imagenes){
            if(err){
                res.redirect("/app");
                console.log(err);
            }else{
                res.render("app/home", {imagenes: imagenes});
            }
        });
});

router.get("/imagenes/new", function(req,res){
    res.render("app/imagenes/new");
}); 
router.all("/imagenes/:id*", imageFinder);

router.get("/imagenes/:id/editar", function(req,res){
    res.render("app/imagenes/edit");
});

router.route("/imagenes/:id")
    .get(function(req,res){ 
        client.publish("images", res.locals.imagen.toString());
        res.render("app/imagenes/show"); 
    })
    .put(function(req,res){
        res.locals.imagen.tittle = req.fields.tittle;
        res.locals.imagen.save().then(function(imagen){
            res.render("app/imagenes/show");
        }, function(err, imagen){
            res.redirect("/app/imagenes/"+req.params.id+"/editar");
            console.log(err);
        });
    })
    .delete(function(req,res){
        Imagen.findOneAndRemove({_id: req.params.id}, function(err){
            if(!err){
                res.redirect("/app/imagenes");
            }
            else{
                console.log(err);
                res.redirect("/app/imagenes/"+req.params.id);
            }
        });
    });

router.route("/imagenes")
    .get(function(req,res){
        Imagen.find({}, function(err, imagenes){
            if(err){
                res.redirect("/app");
                console.log(err);
                return;
            }
            res.render("app/imagenes/index", {imagenes: imagenes});
        })
    })
    .post(function(req,res){
        var extension = req.files.archivo.name.split(".").pop();
        var data = {
            tittle: req.fields.tittle,
            creator: res.locals.user._id,
            extension: extension
        };
        var imagen = new Imagen(data);
        imagen.save().then(function(imagen){
                var imgJSON = {
                    "id": imagen._id,
                    "tittle": imagen.tittle,
                    "extension": imagen.extension
                };
                client.publish("images", JSON.stringify(imgJSON));
                fs.rename(req.files.archivo.path, "public/imagenes/"+imagen._id+"."+extension);
                res.redirect("./imagenes/"+imagen._id);
            },
            function(err){
                if(err){
                res.send("Hubo un error al guardar la imagen");
                console.log(err);
                 }
            });
    });
router.route("/logout").get(function(req,res){
    if(!req.session.user_id){
        res.redirect("/login");
    }
    else{
        req.session.user_id = null;
        res.redirect("/");
    }
})

module.exports = router;