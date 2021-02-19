var mongoose = require("mongoose");
 
function connect(url) {
    mongoose.connect(url, function(err){
        if (err){
            throw err;
        }
    
        console.log("Succesfully connected to onlineBlackjack")
    });
}

function createSchema(schema) {
    return mongoose.schema(schema);
}

function uploadHand(hand, model) {
    var upload = new model(hand);
    upload.save(function(err){
        if (err){
            throw err;
        }
        console.log("Succesfully uploaded hand")
    });
}

exports.connect = connect;
exports.createSchema = createSchema;
exports.uploadHand = uploadHand;
