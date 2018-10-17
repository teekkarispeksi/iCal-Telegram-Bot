const calendar = require('./calendar')
const settings = require('./settings.json')
const TelegramBot = require('node-telegram-bot-api')
const cron = require('node-cron');

const bot = new TelegramBot(settings.bot_token, {polling: true});

bot.onText(/\/today/, (msg, match) => {
   
    const chatId = msg.chat.id;
    resp = calendar.comming()

    bot.sendMessage(chatId, resp);
});

cron.schedule('0 10 * * *', () => {
    console.log('Sending daily updates')
    msg = calendar.comming()

    for (var index in settings.send_updates){
        bot.sendMessage(settings.send_updates[index], msg);
    }
})

console.log('Bot running...')