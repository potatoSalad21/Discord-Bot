import dotenv from 'dotenv/config';

import { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import axios from 'axios';
import fs from "fs";


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.on("ready", async (c) => {
    console.log("The bot hath awakened..");
});

const getMeme = async () => {
    const data = (await axios.get("https://meme-api.com/gimme")).data;
    let meme = data.url;
    return meme;
}

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand) return;

    switch (interaction.commandName) {
        case "ping":
            await interaction.reply("Pong :ping_pong:");
            break;
        case "joemama":
            const target = interaction.options.get("target");

            const data = fs.readFileSync("../jokes.json", "utf-8");
            let jokes = JSON.parse(data);
            let randomJoke = jokes.at(Math.floor(Math.random() * 979));

            if (!target) {
                interaction.reply(randomJoke);
            } else {
                interaction.reply(`<@${target.value}>, ${randomJoke}`);
            }
            break;
        case "meme":
            let meme = await getMeme();

            const next = new ButtonBuilder()
                .setCustomId("next")
                .setLabel("Next")
                .setStyle(ButtonStyle.Success);

            const cancel = new ButtonBuilder()
                .setCustomId("cancel")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Danger);

            const memeButtons = new ActionRowBuilder()
                .addComponents(cancel, next);

            const response = await interaction.reply({
                content: meme,
                components: [memeButtons],
            });

            const collector = response.createMessageComponentCollector();

            collector.on("collect", async i => {
                if (!interaction.isButton) return;

                if (i.customId === "next") {
                    meme = await getMeme();
        
                    await i.update({ 
                        content: meme, 
                        components: [memeButtons] 
                    });
                } else if (i.customId === "cancel") {
                    await interaction.deleteReply();
                }
            });
            break;
        
    }
});

client.login(process.env.DISCORD_TOKEN);