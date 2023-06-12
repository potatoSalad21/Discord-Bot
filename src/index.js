import dotenv from 'dotenv/config';

import { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } from 'discord.js';
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
        case "weather":
            const key = "mydMQm3856U8wJArv0M271oYAqiDQrE2";  // weather api key

            const city = interaction.options.get("city").value;

            // getting the city's key
            const cityLocation = await axios.get("http://dataservice.accuweather.com/locations/v1/cities/search", { params: { apikey: key, q: city } });
            const cityKey = cityLocation.data[0].Key;
            
            const weatherJson = await axios.get(`http://dataservice.accuweather.com/forecasts/v1/daily/5day/${cityKey}`, { params: { apikey: key } });
            const forecasts = weatherJson.data.DailyForecasts;
            let weeklyMsg = weatherJson.data.Headline.Text;

            const weatherEmbed = new EmbedBuilder()
                .setColor(0x8037b7)
                .setTitle("☀  Weather Report ")
                .setDescription(`[■]  __${weeklyMsg}__`)
                .setURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ&pp=ygUJcmljayByb2xs")
                .setThumbnail("https://download.logo.wine/logo/AccuWeather/AccuWeather-Logo.wine.png")
                .setTimestamp()
                .setFooter({ text: "[■]  by Accuweather", iconURL: "https://play-lh.googleusercontent.com/EgDT3XrIaJbhZjINCWsiqjzonzqve7LgAbim8kHXWgg6fZnQebqIWjE6UcGahJ6yugU" });
            
            for (let daily of forecasts) {
                const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                let date = new Date(daily.Date);
                let day = weekDays[date.getDay()];
                
                let dayIcon = daily.Day.IconPhrase;
                let nightIcon = daily.Night.IconPhrase;

                // Getting temperature and converting to celsius
                let maxTemp = (daily.Temperature.Maximum.Value - 32) * 5/9;
                let minTemp = (daily.Temperature.Minimum.Value - 32) * 5/9;

                weatherEmbed
                    .addFields(
                        { name: `[-O-] ***__${day}__***`, value: ` :sunrise:  _${dayIcon}_ - **${Math.round(maxTemp)}°C** \n :night_with_stars: _${nightIcon}_ - **${Math.round(minTemp)}°C**` },
                        { name: " ", value: " " }
                    )
            }

            interaction.reply({ embeds: [weatherEmbed] });
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

            const reply = await interaction.reply({
                content: meme,
                components: [memeButtons],
            });

            const collector = reply.createMessageComponentCollector();

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