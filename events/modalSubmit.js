const { Events, MessageFlags, ChannelType, PermissionFlagsBits } = require('discord.js');
const ctfSchema = require('../models/ctf.js');
const { ctfAdmin } = require('../config.json');

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
            })


            await newCTF.save();

            await interaction.editReply({ content: `Created new CTF with id: \`${newCTF._id}\``, flags: MessageFlags.Ephemeral });
        }
    },
};