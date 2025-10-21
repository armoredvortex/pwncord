const { SlashCommandBuilder } = require('discord.js');
const { ctfAdmin } = require('../../config.json');
const { MessageFlagsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('create').setDescription('Create a new CTF'),
	async execute(interaction) {
		if (!interaction.member.roles.cache.find(r => r.id === ctfAdmin)) {
			interaction.reply({
				content: 'You\'re not autorized to run this command!',
				flags: MessageFlagsBitField.Flags.Ephemeral,
			});
		}
		else {
		const modal = new ModalBuilder().setCustomId('createCTF').setTitle('Create a new CTF');

		const ctfNameInput = new TextInputBuilder()
			.setCustomId('ctfNameInput')
			.setLabel("What's the name of the CTF?")
			.setStyle(TextInputStyle.Short);

		const ctfDescriptionInput = new TextInputBuilder()
			.setCustomId('ctfDescriptionInput')
			.setLabel("What's the description of the CTF?")
			.setStyle(TextInputStyle.Paragraph);

		const firstActionRow = new ActionRowBuilder().addComponents(ctfNameInput);
		const secondActionRow = new ActionRowBuilder().addComponents(ctfDescriptionInput);

		modal.addComponents(firstActionRow, secondActionRow);

		await interaction.showModal(modal); 
		}
	},
};