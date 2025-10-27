const { ChannelType, PermissionFlagsBits, MessageFlagsBitField } = require('discord.js');
const ctfSchema = require('../models/ctf.js');
const { ctfAdmin, fallbackImg } = require('../config.json');

module.exports = async function updateLeaderboard(interaction) {
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

    const scoreboardEmbed = {
        title: `${ctfName} — Scoreboard`,
        description: ctfDescription,
        color: 0x00b0f4,
        fields: [{ name: 'Top Players', value: '*No solves yet*' }],
        thumbnail: { url: ctfImage ||  fallbackImg},
        timestamp: new Date(),
    };

    const scoreboardMessage = await scoreboard.send({ embeds: [scoreboardEmbed] });


    const newCTF = new ctfSchema({
        name: ctfName,
        imageURL: ctfImage || fallbackImg,
        description: ctfDescription,
        guildCategoryId: category.id,
        announcementsId: announcements.id,
        scoreboardMessageId: scoreboardMessage.id,
        scoreboardId: scoreboard.id,
        generalId: general.id,
        categories: [],
    });

    await newCTF.save();

    await interaction.editReply({ content: `Created new CTF with id: \`${newCTF._id}\``, flags: MessageFlagsBitField.Flags.Ephemeral });

};

