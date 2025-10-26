const { SlashCommandBuilder } = require('discord.js');
const { ctfAdmin, fallbackImg } = require('../../config.json');
const { MessageFlagsBitField, EmbedBuilder } = require('discord.js');
const ctfSchema = require('../../models/ctf.js');
const { isValidObjectId } = require('mongoose');

module.exports = {
	data: new SlashCommandBuilder()
    .setName('getctf')
    .setDescription('Get information about a CTF')
    .addStringOption(option => 
        option
        .setName("id")
        .setDescription("CTF id")
        .setAutocomplete(true)
        .setRequired(true)
    ),
	async execute(interaction) {
		if (!interaction.member.roles.cache.find(r => r.id === ctfAdmin)) {
			interaction.reply({
				content: 'You\'re not autorized to run this command!',
				flags: MessageFlagsBitField.Flags.Ephemeral,
			});
		}
		else {
            await interaction.deferReply();
            const ctfId = interaction.options.getString('id');
            if (!isValidObjectId(ctfId)) {
                return interaction.editReply({ content: 'Invalid ID format', flags: MessageFlagsBitField.Flags.Ephemeral});
            }

            try {
                const ctf = await ctfSchema.findById(ctfId);
                if(!ctf){
                    interaction.editReply({content: 'Cannot find CTF with that ID', flags: MessageFlagsBitField.Flags.Ephemeral});
                } 
                else {
                    const embed = createCTFEmbed(ctf);

                    interaction.editReply({embeds: [embed]});
                }
                    
            } catch {
                interaction.editReply({content: 'There was an error fetching data', flags: MessageFlagsBitField.Flags.Ephemeral});
            }
		}
	},
    async autocomplete(interaction) {
            const focusedValue = interaction.options.getFocused();
    
            try {
                const ctfs = await ctfSchema.find();
                const filtered = ctfs.filter(c =>
                    c.name.toLowerCase().includes(focusedValue.toLowerCase())
                );
    
                await interaction.respond(
                    filtered.slice(0, 25).map(c => ({
                        name: `${c.name} — ${c._id.toString()}`, // small suffix for uniqueness
                        value: c._id,
                    }))
                );
            } catch (err) {
                console.error('Autocomplete error:', err);
            }
        },
};

function createCTFEmbed(ctf) {
    const embed = new EmbedBuilder()
        .setColor(ctf.active ? 0x00b050 : 0xb00020) 
        .setTitle(`🏁 ${ctf.name || 'Unnamed CTF'}`)
        .setDescription(ctf.description || '*No description provided.*')
        .setThumbnail(
            ctf.imageURL && ctf.imageURL.startsWith('http')
                ? ctf.imageURL
                : fallbackImg
        )
        .addFields(
            {
                name: '📢 Announcements',
                value: ctf.announcementsId ? `${ctf.announcementsId}` : 'Not created',
                inline: true,
            },
            {
                name: '💬 General',
                value: ctf.generalId ? `${ctf.generalId}` : 'Not created',
                inline: true,
            },
            {
                name: '🏆 Scoreboard',
                value: ctf.scoreboardId ? `${ctf.scoreboardId}` : 'Not created',
                inline: true,
            },
            {
                name: '📑 Categories',
                value:
                    ctf.categories?.length
                        ? ctf.categories.map(c => `• ${c}`).join('\n')
                        : 'No categories added yet.',
                inline: false,
            },
            {
                name: 'Status',
                value: ctf.active ? '**Active** ✅' : '**Inactive** 🔴',
                inline: false,
            }
        )
        .setFooter({
            text: `pwncord • ${new Date().toLocaleDateString()}`,
        });

    return embed;
}
