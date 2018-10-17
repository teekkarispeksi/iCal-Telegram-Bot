const settings = require('./settings.json')
const request = require('sync-request')
const ical = require('ical')
const StringDecoder = require('string_decoder').StringDecoder
var decoder = new StringDecoder('utf8');

module.exports = {

   comming: function() {
        var calendar_str = ''
        var events = []
        var calendar_str = ''

        var res = request('GET', settings.calendar_url)
        var calendar_str = decoder.write(res.getBody())
        var data = ical.parseICS(calendar_str)

        for (var k in data){
            if (data.hasOwnProperty(k)) {
                var ev = data[k]
                if(ev.start){
                    events.push([ev.summary, ev.start, ev.location])
                }
            }
        }

        events.sort(function(a, b){ return b[1] - a[1] })

        i = 0
        var now = new Date()
        future_events = []
        while(events[i][1] > now){
            future_events.push(events[i])
            i = i + 1
        }

        future_events.sort(function(a, b){ return a[1] - b[1] })

        var output_str = 'Tapahtumia lähipäivinä: '
        if (future_events.length > 0){
            for (var i in future_events){
                var e = future_events[i]
                minute_str = ''
                if (e[1].getMinutes() != 0) { minute_str = ':' + e[1].getMinutes()}
                output_str = output_str + '\n' + e[1].getDate() + '.' + (e[1].getMonth() + 1) + '. ' + u'\U0001F551' + e[1].getHours() + minute_str + ' ' + e[0] + ' @ ' + e[2]
            }
        }else{
            output_str = 'Ei tapahtumia lähipäivinä. Ilmoita tapahtumia http://kalenteri.speksi.fi'
        }

        return output_str
   }
}