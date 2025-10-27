const { MessageFlagsBitField, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const ctfSchema = require('../models/ctf.js');
const challSchema = require('../models/challenge.js');

module.exports = async function addChallenge(interaction) {
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

	const parentCategory = interaction.guild.channels.cache.get(ctf.guildCategoryId);
	if (!parentCategory) { return interaction.editReply('⚠️ The CTF category no longer exists.'); }

	// Find the subcategory/channel inside the CTF
	const categoryChannel = interaction.guild.channels.cache.find(
		c =>
			c.parentId === parentCategory.id &&
            c.name.toLowerCase() === categoryName.toLowerCase(),
	);


	if (!categoryChannel) { return interaction.editReply(`⚠️ Category **${categoryName}** not found under ${ctf.name}.`); }

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

	const challMessage = await categoryChannel.send('Adding Challenge...');

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
		messageId: challMessage,
	});

	const button = new ButtonBuilder()
		.setCustomId('submit_' + newChallenge._id)
		.setLabel('Submit!')
		.setStyle(ButtonStyle.Primary);

	const row = new ActionRowBuilder().addComponents(button);

	challMessage.edit({ content: null, embeds: [embed], components: [row] });
	// const challMessage = await categoryChannel.send({ embeds: [embed], components: [row] });


	await newChallenge.save();

	await interaction.editReply({
		content: `✅ Challenge **${challengeName}** created in ${categoryChannel}.`,
	});
};