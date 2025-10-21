const { Events, MessageFlags } = require('discord.js');
const ctfSchema = require('../models/ctf.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isModalSubmit()) return;
        
        if (interaction.customId === 'createCTF') {
            const ctfName = interaction.fields.getTextInputValue('ctfNameInput');
            const ctfImage = interaction.fields.getTextInputValue('ctfImageInput');
            const ctfDescription = interaction.fields.getTextInputValue('ctfDescriptionInput');
            
            const newCTF = new ctfSchema({
                name: ctfName,
                imageURL: ctfImage,
                description: ctfDescription,
            })

            await newCTF.save();

		    await interaction.reply({ content: `Created new CTF with id: \`${newCTF._id}\``, flags: MessageFlags.Ephemeral });
	    }
    },
};