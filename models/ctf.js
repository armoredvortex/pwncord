const {Schema, model} = require('mongoose');
const { type } = require('os');

let ctf = new Schema({
    name: String,
    imageURL: String,
    description: String,
    active: {
        type: Boolean,
        default: true,
    },
})

module.exports = model('ctfSchema',  ctf);