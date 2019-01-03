const calendar = require('./calendar')
const settings = require('./settings.json')
const TelegramBot = require('node-telegram-bot-api')
const cron = require('node-cron');

const bot = new TelegramBot(settings.bot_token, {polling: true});

bot.onText(/\/events/, (msg, match) => { //respond to a /events command with event listing
   
    chatId = msg.chat.id;
    resp = calendar.comming()

    bot.sendMessage(chatId, resp.str);
});

cron.schedule('0 10 * * *', () => { //set node-cron to trigger at 10am. GMT (13 or 14 in FIN time) 
    console.log('Sending daily updates')
    resp = calendar.comming()
    now = new Date()

    if(now.getDate() % 4 == 0 || resp.event_soon){ //send updates every 4th day or if an event is comming within 24 hours
        console.log('Sending updates based on day number: ' + (now.getDate() % 3 == 0) + ' and event soon: ' + resp.event_soon)
        for (var index in settings.send_updates){ //send updates to each predefined Telegram chat
            bot.sendMessage(settings.send_updates[index], resp.str);
        }
    }
})

console.log('Bot running...')