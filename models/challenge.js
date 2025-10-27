const {Schema, model} = require('mongoose');
const bcrypt = require('bcrypt');


let ctf = new Schema({
    ctfID: String,
    name: String,
    description: String,
    url: String,
    active: {
        type: Boolean,
        default: true,
    },
    author: String,
    flag: String,
    category: String
})

ctf.pre('save', async function (next) {
    if (!this.isModified('flag')) return next(); // only hash if changed
    this.flag = await bcrypt.hash(this.flag, 10);
    next();
})

module.exports = model('challSchema',  ctf);