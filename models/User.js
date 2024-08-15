const mongoose = require("mongoose");

const ExerciseSchema = mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
})

const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    exercises: [ExerciseSchema]
})

const UserModel = mongoose.model("users", UserSchema);


module.exports = UserModel;