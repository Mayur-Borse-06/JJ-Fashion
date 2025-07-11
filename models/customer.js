const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const customerSchema = new Schema({
    name: String,
    email: {
        type: String,
        required: true,
        unique: true,
    },                      // Unique - use this as "username" for passport
    address: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
})

customerSchema.plugin(passportLocalMongoose, {usernameField: 'email'});

module.exports = mongoose.model("Customer", customerSchema);