import { REST, Routes, ApplicationCommandOptionType } from 'discord.js';

import dotenv from 'dotenv';
dotenv.config();

const commands = [
    {
        name: "ping",
        description: "replies with Pong",
    },

    {
        name: "meme",
        description: "Posts a random meme from Reddit",
    },

    {
        name: "joemama",
        description: "Sends a random Joemama:tm: joke",
        options: [
            {
                name: "target",
                description: "target of the joke",
                type: ApplicationCommandOptionType.User,
            }
        ],
    },
]

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

try {
    console.log("Registering Slash (/) Commands!");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });

    console.log("Slash (/) Commands Registered Successfully!");
} catch (error) {
    console.error(error);
}