const { ActionRowBuilder, Events, MessageFlags, ChannelType, PermissionFlagsBits, MessageFlagsBitField, ButtonBuilder, ButtonStyle } = require('discord.js');
const ctfSchema = require('../models/ctf.js');
const { ctfAdmin } = require('../config.json');
const challSchema = require('../models/challenge.js');
const ctf = require('../models/ctf.js');
const bcrypt = require('bcrypt');
const userSolve = require('../models/userSolve.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isModalSubmit()) return;

		if (interaction.customId === 'createCTF') {
			await interaction.deferReply();
			const ctfName = interaction.fields.getTextInputValue('ctfNameInput');
			const ctfImage = interaction.fields.getTextInputValue('ctfImageInput');
			const ctfDescription = interaction.fields.getTextInputValue('ctfDescriptionInput');

			const category = await interaction.guild.channels.create({
				name: ctfName,
				type: ChannelType.GuildCategory,
			});

			const announcements = await interaction.guild.channels.create({
				name: 'announcements',
				type: ChannelType.GuildText,
				parent: category.id,
				topic: `${ctfName} updates and announcements`,
				permissionOverwrites: [
					{
						id: interaction.guild.roles.everyone,
						deny: [PermissionFlagsBits.SendMessages],
					},
					{
						id: ctfAdmin,
						allow: [PermissionFlagsBits.SendMessages],
					},
				],
			});

			const scoreboard = await interaction.guild.channels.create({
				name: 'scoreboard',
				type: ChannelType.GuildText,
				parent: category.id,
				topic: `${ctfName} scoreboard`,
				permissionOverwrites: [
					{
						id: interaction.guild.roles.everyone,
						deny: [PermissionFlagsBits.SendMessages],
					},
					{
						id: ctfAdmin,
						allow: [PermissionFlagsBits.SendMessages],
					},
				],
			});

			const general = await interaction.guild.channels.create({
				name: 'general',
				type: ChannelType.GuildText,
				parent: category.id,
				topic: `${ctfName} general`,
			});

			const newCTF = new ctfSchema({
				name: ctfName,
				imageURL: ctfImage,
				description: ctfDescription,
				guildCategoryId: category,
				announcementsId: announcements,
				scoreboardId: scoreboard,
				generalId: general,
				categories: [],
			});


			await newCTF.save();

			await interaction.editReply({ content: `Created new CTF with id: \`${newCTF._id}\``, flags: MessageFlags.Ephemeral });
		}

		if (interaction.customId.startsWith('addChallenge')) {
			// Use flags instead of deprecated `ephemeral`
			await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

			// Parse customId like: addChallenge_<ctfID>_<categoryName>
			const options = interaction.customId.split('|');
			const ctfID = options[1];
			const categoryName = options[2];
			const points = options[3];

			const challengeName = interaction.fields.getTextInputValue('challengeName');
			const description = interaction.fields.getTextInputValue('challengeDescription');
			const url = interaction.fields.getTextInputValue('challengeURL');
			const author = interaction.fields.getTextInputValue('challengeAuthor');
			const flag = interaction.fields.getTextInputValue('challengeFlag');

			const ctf = await ctfSchema.findById(ctfID);
			if (!ctf) return interaction.editReply('❌ Could not find associated CTF.');

			const parentCategory = interaction.guild.channels.cache.get(ctf.guildCategoryId.slice(2, -1));
			if (!parentCategory) { return interaction.editReply('⚠️ The CTF category no longer exists.'); }

			// Find the subcategory/channel inside the CTF
			const categoryChannel = interaction.guild.channels.cache.find(
				c =>
					c.parentId === parentCategory.id &&
					c.name.toLowerCase() === categoryName.toLowerCase(),
			);


			if (!categoryChannel) { return interaction.editReply(`⚠️ Category **${categoryName}** not found under ${ctf.name}.`); }


			// Save to DB
			const newChallenge = new challSchema({
				ctfID: ctf._id,
				name: challengeName,
				description,
				url,
				author,
				flag,
				points,
				category: categoryName,
			});

			await newChallenge.save();
			// Post challenge embed in that channel
			const embed = {
				title: `🧩 ${challengeName} - ${points} Point(s)`,
				description,
				color: 0x00b0f4,
				fields: [
					{ name: 'Author', value: author, inline: true },
					...(url ? [{ name: 'URL', value: `[Link](${url})`, inline: true }] : []),
				],
				footer: { text: `${ctf.name}` },
			};

			const button = new ButtonBuilder()
				.setCustomId('submit_' + newChallenge._id)
				.setLabel('Submit!')
				.setStyle(ButtonStyle.Primary);

			const row = new ActionRowBuilder().addComponents(button);

			await categoryChannel.send({ embeds: [embed], components: [row] });

			await interaction.editReply({
				content: `✅ Challenge **${challengeName}** created in ${categoryChannel}.`,
			});
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