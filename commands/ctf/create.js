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
				.setLabel('Name of the CTF?')
				.setStyle(TextInputStyle.Short);

			const ctfImageInput = new TextInputBuilder()
				.setCustomId('ctfImageInput')
				.setLabel('Link to CTF image')
				.setStyle(TextInputStyle.Short)
				.setRequired(false);

			const ctfDescriptionInput = new TextInputBuilder()
				.setCustomId('ctfDescriptionInput')
				.setLabel('Description of the CTF?')
				.setStyle(TextInputStyle.Paragraph);

			const firstActionRow = new ActionRowBuilder().addComponents(ctfNameInput);
			const secondActionRow = new ActionRowBuilder().addComponents(ctfImageInput);
			const thirdActionRow = new ActionRowBuilder().addComponents(ctfDescriptionInput);

			modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

			await interaction.showModal(modal);
		}
	},
};