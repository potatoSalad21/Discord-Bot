import dotenv from 'dotenv/config';

import { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus, entersState, createAudioPlayer, AudioPlayerStatus, createAudioResource, NoSubscriberBehavior, StreamType } from '@discordjs/voice';
import Canvas from "@napi-rs/canvas";
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs, { createReadStream } from "fs";


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

client.once("ready", async () => {
    console.log("The bot hath awakened..");
});

const getMeme = async () => {
    let meme;
    try {
        const data = (await axios.get("https://meme-api.com/gimme")).data;
        meme = data.url;
    } catch (err) {
        meme = ":bangbang: [API Error] Couldn't get the meme.";
    }
    return meme;
};

const getHtml = async (url) => {
    const { data: html } = await axios.get(url);
    return html;
};

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
        case "caption":
            const image = interaction.options.get("image").attachment.url;

            // creating Canvas
            const canvas = Canvas.createCanvas(500, 400);
            const context = canvas.getContext("2d");

            const background = await Canvas.loadImage(image); 
            context.drawImage(background, 0, 100, canvas.width, canvas.height - 100); // drawing the inputted image

            context.fillStyle = "white";
            context.fillRect(0, 0, canvas.width, 100);

            // converting canvas to png
            const attachment = new AttachmentBuilder(await canvas.encode("png"), { name: "image.png" }); 

            interaction.reply({ files: [attachment] });

            break;
        case "join":
            if (!interaction.member.voice.channelId) {
                interaction.reply(":bangbang: You're not Connected to a VC.");
            }

            const voiceConnection = joinVoiceChannel({
                channelId: interaction.member.voice.channelId,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            voiceConnection.on(VoiceConnectionStatus.Ready, () => {
                interaction.reply("all ready!");
            });
            
            voiceConnection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
                try {
                    await Promise.race([
                        entersState(voiceConnection, VoiceConnectionStatus.Signalling, 5_000),
                        entersState(voiceConnection, VoiceConnectionStatus.Connecting, 5_000),
                    ]);
                } catch (err) {
                    voiceConnection.destroy();
                }
            });

            break;
        case "leave":
            try {
                getVoiceConnection(interaction.guildId).destroy();
                interaction.reply("*fades*");
            } catch (err) {
                interaction.reply(":bangbang: Bot is Not Connected to a VC.");
            }
            
            break;
        case "weather":
            const city = interaction.options.get("city").value;
            const weatherEmbed = new EmbedBuilder();           

            try {
                // getting the city's key
                const cityLocation = await axios.get("http://dataservice.accuweather.com/locations/v1/cities/search", { params: { apikey: process.env.WEATHER_KEY, q: city } });
                const cityKey = cityLocation.data[0].Key;

                const weatherJson = await axios.get(`http://dataservice.accuweather.com/forecasts/v1/daily/5day/${cityKey}`, { params: { apikey: process.env.WEATHER_KEY } });
                const forecasts = weatherJson.data.DailyForecasts;
                let weeklyMsg = weatherJson.data.Headline.Text;

                weatherEmbed
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

                weatherEmbed.addFields(
                    { name: `[-O-] ***__${day}__***`, value: ` :sunrise:  _${dayIcon}_ - **${Math.round(maxTemp)}°C** \n :night_with_stars: _${nightIcon}_ - **${Math.round(minTemp)}°C**` },
                    { name: " ", value: " " }
                );
            }
            } catch (err) {
                weatherEmbed.setTitle(":bangbang: Location was not found!");
            }

            interaction.reply({ embeds: [weatherEmbed] });
            break;
        case "define":
            const phrase = interaction.options.get("phrase").value;
            const dict = interaction.options.get("dictionary").value;

            const dictEmbed = new EmbedBuilder();

            if (dict === "urban") {
                const url = `https://www.urbandictionary.com/define.php?term=${phrase}`;
                
                try {
                    const html = await getHtml(url);
                    
                    // parsing the html with cheerio
                    const $ = cheerio.load(html);
                    const phrasePanel = $(".definition:first");
                    const definition = phrasePanel.find(".break-words.meaning.mb-4").text();
                    const example = phrasePanel.find(".break-words.example.italic.mb-4").text();
    
                    dictEmbed
                        .setColor(0x5865F2)
                        .setTitle(`**${phrase}**`)
                        .setAuthor({ name: "Urban Dictionary", iconURL: "https://boost.space/wp-content/uploads/2022/06/urban-dictionary.png" })
                        .setThumbnail("https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Urban_Dictionary_logo.svg/512px-Urban_Dictionary_logo.svg.png?20180302232617")
                        .addFields(
                            { name: "Definition:", value: `**__${definition}__**` },
                            { name: "Example:", value: `**__${example}__**` }
                        )
                        .setTimestamp();
                } catch (err) {
                    dictEmbed.setTitle(":bangbang: Phrase was not found!");
                }
            } else if (dict === "webster") {
                const url = `https://www.merriam-webster.com/dictionary/${phrase.replace(" ", "%20")}`;

                try {
                    dictEmbed
                        .setColor(0x6577E6)
                        .setTitle(`**${phrase}**`)
                        .setThumbnail("https://cdn-icons-png.flaticon.com/512/1754/1754168.png")
                        .setAuthor({ name: "Merriam-Webster", iconURL: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Merriam-Webster_logo.svg/1024px-Merriam-Webster_logo.svg.png" })
                        .setTimestamp();

                    const html = await getHtml(url);

                    const $ = cheerio.load(html);
                    $("div.entry-word-section-container").each((i, element) => {
                        const speechPart = $(element).find("h2 .important-blue-link").text(); 
                        let definitions = "";
                        $(".dtText").each((i, element) => {
                            if (i > 3) return false;
                
                            definitions += $(element).text().replace(":", "►") + "\n";
                        });
                        
                        dictEmbed.addFields(
                            { name: `__${speechPart}__`, value: definitions }
                        );
                    });
                } catch (error) {
                    dictEmbed.setTitle(":bangbang: Phrase was not found!");
                }
            }

            interaction.reply({ embeds: [dictEmbed] });
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