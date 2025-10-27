const { ActionRowBuilder, Events, MessageFlags, ChannelType, PermissionFlagsBits, MessageFlagsBitField, ButtonBuilder, ButtonStyle } = require('discord.js');
const ctfSchema = require('../models/ctf.js');
const { ctfAdmin } = require('../config.json');
const challSchema = require('../models/challenge.js');
const ctf = require('../models/ctf.js');
const bcrypt = require('bcrypt');
const userSolve = require('../models/userSolve.js');
const updateLeaderboard = require('../utils/updateLeaderboard.js');
const createCTF  = require('../utils/createCTF.js');
const addChallenge = require('../utils/addChallenge.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isModalSubmit()) return;

		if (interaction.customId === 'createCTF') {
			createCTF(interaction);
		}

		if (interaction.customId.startsWith('addChallenge')) {
			addChallenge(interaction);
		}

		if (interaction.customId.startsWith('submit')) {
			try {
				await interaction.deferReply({ ephemeral: true }); // close modal safely

				const challengeId = interaction.customId.split('_')[1];
				const chall = await challSchema.findById(challengeId);
				if (!chall) {
					return await interaction.editReply({
						content: '⚠️ Challenge not found.',
					});
				}

				const userFlag = interaction.fields.getTextInputValue('flag').trim();
				const isCorrect = await bcrypt.compare(userFlag, chall.flag);

				if (!isCorrect) {
					return await interaction.editReply({
						content: '❌ Wrong flag, try again!',
					});
				}

				// --- Check and update userSolve ---
				let solveDoc = await userSolve.findOne({ userId: interaction.user.id });

				if (!solveDoc) {
					solveDoc = new userSolve({ userId: interaction.user.id, solvedChallenges: [] });
				}

				const alreadySolved = solveDoc.solvedChallenges.some(
					(id) => id.toString() === challengeId
				);

				if (alreadySolved) {
					return await interaction.editReply({
						content: '✅ You already solved this challenge!',
					});
				}

				// Add challenge to solved list
				solveDoc.solvedChallenges.push(challengeId);
				await solveDoc.save();

				// --- Optional: Update leaderboard ---
				await ctfSchema.updateOne(
					{ _id: chall.ctfID },
					{ $inc: { [`leaderboard.${interaction.user.id}`]: chall.points } }
				);

				await interaction.editReply({
					content: `✅ Correct flag! You earned **${chall.points} points**.`,
				});

				await updateLeaderboard(interaction.client, chall.ctfID);
			} catch (err) {
				console.error('Error verifying flag:', err);
				if (interaction.deferred || interaction.replied) {
					await interaction.editReply({
						content: '⚠️ Something went wrong while checking your flag.',
					});
				} else {
					await interaction.reply({
						content: '⚠️ Something went wrong while checking your flag.',
						ephemeral: true,
					});
				}
			}
		}

	},
};