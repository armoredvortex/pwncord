const {Schema, model} = require('mongoose');

let ctf = new Schema({
    name: String,
    imageURL: String,
    description: String,
})

module.exports = model('ctfSchema',  ctf);