const { Schema, model } = require('mongoose');

const userSolve = new Schema({
	userId: String,
	solvedChallenges: [{
		type: Schema.Types.ObjectId,
		ref: 'challSchema',
	}],
});

module.exports = model('userSolve', userSolve);
