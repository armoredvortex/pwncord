const { SlashCommandBuilder } = require('discord.js');
const { ctfAdmin } = require('../../config.json');
const { MessageFlagsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const ctfSchema = require('../../models/ctf.js');
const { isValidObjectId } = require('mongoose');

module.exports = {
	data: new SlashCommandBuilder()
    .setName('getctf')
    .setDescription('Get information about a CTF')
    .addStringOption(option => {
        return option
        .setName("id")
        .setDescription("CTF id")
        .setRequired(true);
    }),
	async execute(interaction) {
		if (!interaction.member.roles.cache.find(r => r.id === ctfAdmin)) {
			interaction.reply({
				content: 'You\'re not autorized to run this command!',
				flags: MessageFlagsBitField.Flags.Ephemeral,
			});
		}
		else {
            const ctfId = interaction.options.data.find(r => r.name === 'id').value;

            if (!isValidObjectId(ctfId)) {
                return interaction.reply({ content: 'Invalid ID format', ephemeral: true });
            }

            try {
                const ctf = await ctfSchema.findById(ctfId);
                if(!ctf){
                    interaction.reply({content: 'Cannot find CTF with that ID', ephemeral: true});
                } 
                else {
                    const embed = new EmbedBuilder()
                    .setTitle(ctf.name)
                    .setDescription(ctf.description)
                    .setThumbnail(ctf.imageURL);

                    interaction.reply({embeds: [embed]});
                }
                    
            } catch {
                interaction.reply({content: 'There was an error fetching data', ephemeral: true});
            }
		}
	},
};