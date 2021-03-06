const calendar = require('./calendar')
const settings = require('./settings.json')
const TelegramBot = require('node-telegram-bot-api')
const cron = require('node-cron')

const bot = new TelegramBot(settings.bot_token, {polling: true})

bot.onText(/\/tapahtumat/g, (msg, match) => { //respond to a /events command with event listing
   
    chatId = msg.chat.id
    resp = calendar.comming()

    bot.sendMessage(chatId, resp.str)
})

function dateString(time){
    return Math.floor(time / 86400000) + ' päivää, ' + Math.floor((time % 86400000) / 3600000) + ' tuntia ja ' + Math.floor((time % 3600000) / 60000) + ' minuuttia'
}

bot.onText(/\/enskari/g, (msg, match) => { 
   
    chatId = msg.chat.id
    now = new Date()
    target = new Date('2020-03-19T16:00:00')
    left = target - now
    resp = 'Aikaa enskariin: ' + dateString(left) + '.'

    bot.sendMessage(chatId, 'Tietäspä koska se on...')
})

bot.onText(/kaato|Kaato|kaado|Kaado/g, (msg, match) => { 

    chatId = msg.chat.id
    vikanaytos = new Date('2019-04-15T22:15:00')
    now = new Date()
    
    if (now > vikanaytos) {
        target = new Date('2020-05-24T16:00:00')
        left = target - now
        resp = 'Aikaa kaatoon: ' + dateString(left) + '.'
    }else{
        resp = 'Jos nyt kuitenkin ne näytökset ensin...'
    }


    bot.sendMessage(chatId, resp)
})

cron.schedule('0 10 * * *', () => { //set node-cron to trigger at 10am. GMT (13 or 14 in FIN time) 
    console.log('Sending daily updates')
    resp = calendar.comming()
    now = new Date()

    if(now.getDate() % 4 == 0 || resp.event_soon){ //send updates every 4th day or if an event is comming within 24 hours
        console.log('Sending updates based on day number: ' + (now.getDate() % 3 == 0) + ' and event soon: ' + resp.event_soon)
        for (var index in settings.send_updates){ //send updates to each predefined Telegram chat
            bot.sendMessage(settings.send_updates[index], resp.str)
        }
    }
})

console.log('Bot running...')