var Imagen = require("../models/imagenes");

module.exports = function(imagen,req,res){
    if(req.method === "GET" && req.path.indexOf("editar") < 0){
        return true;
    }
    if(!imagen.creator){return false;}
    if(imagen.creator._id.toString() === res.locals.user._id.toString()){
        return true;
    }

    return false;
}