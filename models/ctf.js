const { Schema, model } = require('mongoose');

const ctf = new Schema({
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
		leaderboard: {
		type: Map,
		of: Number,
		default: {},
	},
});

module.exports = model('ctfSchema', ctf);