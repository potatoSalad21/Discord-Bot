import { REST, Routes, ApplicationCommandOptionType } from 'discord.js';

import dotenv from 'dotenv/config';

const commands = [
    {
        name: "ping",
        description: "Replies with Pong",
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
                description: "Target of the Joke",
                type: ApplicationCommandOptionType.User,
            }
        ],
    },

    {
        name: "weather",
        description: "Posts the 5day Weather Forecast for a Specified City.",
        options: [
            {
                name: "city",
                description: "City to look up",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
    
    {
        name: "caption",
        description: "Puts the Specified Caption Above the Image",
        options: [
            {
                name: "image",
                description: "Image to caption",
                type: ApplicationCommandOptionType.Attachment,
                required: true,
            },

            {
                name: "caption",
                description: "Caption to use",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },

    {
        name: "join",
        description: "Joins your Voice Channel",
    },
    
    {
        name: "leave",
        description: "Leaves the VC (if it's connected to it)",
    },

    {
        name: "define",
        description: "Get the definition of a phrase from different dictionaries",
        options: [
            {
                name: "dictionary",
                description: "Dictionary that will be used for a lookup",
                type: ApplicationCommandOptionType.String,
                choices: [
                    {
                        name: "merriam-webster",
                        value: "webster",
                    },

                    {
                        name: "urban-dictionary",
                        value: "urban",
                    },
                ],
                required: true,
            },

            {
                name: "phrase",
                description: "A phrase to define",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

try {
    console.log("Registering Slash (/) Commands!");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });

    console.log("Slash (/) Commands Registered Successfully!");
} catch (error) {
    console.error(error);
}