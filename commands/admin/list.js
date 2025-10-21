const { SlashCommandBuilder } = require('discord.js');
const { ctfAdmin } = require('../../config.json');
const { MessageFlagsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const ctfSchema = require('../../models/ctf.js');
const { isValidObjectId } = require('mongoose');

module.exports = {
	data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('Get list of CTFs'),
	async execute(interaction) {
		if (!interaction.member.roles.cache.find(r => r.id === ctfAdmin)) {
			interaction.reply({
				content: 'You\'re not autorized to run this command!',
				flags: MessageFlagsBitField.Flags.Ephemeral,
			});
		}
		else {

            try {
                const activeCTFs = await ctfSchema.find({active: true});
                const inactiveCTFs = await ctfSchema.find({active: false});

                if(!activeCTFs && !inactiveCTFs){
                    interaction.reply({content: 'No CTFs were found.', flags: MessageFlagsBitField.Flags.Ephemeral});
                } 
                else {
                    let desc = "";

                    if(activeCTFs.length != 0){
                        desc += "**Active CTFs**\n";
                        for(let i=0; i < activeCTFs.length; i++){
                            desc += `**${i+1}**. \u00A0\u00A0\u00A0\u00A0 ${activeCTFs[i].name} \u00A0\u00A0\u00A0\u00A0 \`${activeCTFs[i]._id}\`\n`;
                        }
                        desc += '\n';
                    }

                    if(inactiveCTFs.length != 0){
                        desc += "**Inactive CTFs**\n";
                        for(let i=0; i < inactiveCTFs.length; i++){
                            desc += `**${i+1}**. \u00A0\u00A0\u00A0\u00A0 ${inactiveCTFs[i].name} \u00A0\u00A0\u00A0\u00A0 \`${inactiveCTFs[i]._id}\`\n`;
                        }
                    }

                    const embed = new EmbedBuilder()
                    .setTitle("List of all CTFs")
                    .setDescription(desc);
                    interaction.reply({embeds: [embed]});
                }
                    
            } catch {
                interaction.reply({content: 'There was an error fetching data', flags: MessageFlagsBitField.Flags.Ephemeral});
            }
		}
	},
};