const { TextInputBuilder, TextInputStyle } = require('discord.js');
const { ActionRowBuilder } = require('discord.js');
const { ModalBuilder } = require('discord.js');
const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if(!interaction.isButton()) return;

        if (interaction.customId.startsWith('submit')) {
            const modal = new ModalBuilder()
                .setCustomId(interaction.customId)
                .setTitle('Submit Flag!');
            
            const flagInput = new TextInputBuilder()
                .setCustomId('flag')
                .setLabel('Enter the flag')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            
            modal.addComponents(new ActionRowBuilder().addComponents(flagInput))

            return interaction.showModal(modal);
        }
    },
};