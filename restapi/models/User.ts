const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    solidURL:{
        type:String,
        require: true
    },
    username:{
        type:String,
        require: true
    },
    score:{
        type:Number,
        required: false
    }
});

module.exports = mongoose.model("User", userSchema);