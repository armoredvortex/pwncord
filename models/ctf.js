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
    guildCategoryId: String,
    announcementsId: String,
    scoreboardId: String,
    generalId: String,
    categories: [String],
})

// For a CTF there should be the following channels:
// #annoouncements
// #scoreboard
// #general
// # [#category-1, #category-2, ...];


module.exports = model('ctfSchema',  ctf);