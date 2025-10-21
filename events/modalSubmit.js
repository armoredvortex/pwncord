const { Events, MessageFlags } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isModalSubmit()) return;
        
        if (interaction.customId === 'createCTF') {
		    await interaction.reply({ content: 'Your submission was received successfully!', flags: MessageFlags.Ephemeral });
	    }
    },
};