const settings = require('./settings.json')
const request = require('sync-request')
const ical = require('node-ical')
const StringDecoder = require('string_decoder').StringDecoder
var decoder = new StringDecoder('utf8')

module.exports = {

   comming: function() {
        var calendar_str = ''
        var events = []
        var calendar_str = ''

        var res = request('GET', settings.calendar_url) //get calendar from url
        var calendar_str = decoder.write(res.getBody()) //convert byte array to string
        var data = ical.parseICS(calendar_str) //parse ical to json

        console.log(data)

        for (var k in data){ //create clean array from events
            if (data.hasOwnProperty(k)) {
                var ev = data[k]
                if(ev.start){ //check that the object indeed is an event and not some trash
                    events.push([ev.summary, ev.location, ev.start, ev.end])
                }
            }
        }

        events.sort(function(a, b){ return b[2] - a[2] }) //set events in time order (furthest in future first)

        i = 0
        var now = new Date()
        future_events = []
        while(events[i][2] > now){ //get only events that are in future
            future_events.push(events[i])
            i = i + 1
        }

        future_events.sort(function(a, b){ return a[2] - b[2] }) //reverse events order to show next events first (done with sort for future proofness)

        var output_str = 'Tapahtumia lähipäivinä: '
        var event_soon = false

        function print_time(time){
            minute_str = ''
            hour_str = ''
            if (time.getMinutes() != 0) { minute_str = ':' + time.getMinutes()}
            if (time.getHours() != 0) { hour_str = ' klo ' + time.getHours()}
            return time.getDate() + '.' + (time.getMonth() + 1) + '.' + hour_str + minute_str
        }

        if (future_events.length > 0){ //if we have events
            if (Math.abs(now - future_events[0][2]) < 172800000){ event_soon = true } //do we have the first event within 24 hours
            for (var i in future_events){ //iterate over all events and convert to string
                var e = future_events[i]
                place = e[1]
                start = print_time(e[2])
                end = ''
                if (e[3].getDate() != e[2].getDate()) { end = ' - ' + print_time(e[3])}
                if (place == undefined) { place = settings.default_location}
                output_str = output_str + '\n' + start + end + ' ' + e[0] + ' @ ' + place
            }
        }else{
            output_str = 'Ei tapahtumia lähipäivinä. Ilmoita tapahtumia http://kalenteri.speksi.fi'
        }

        return {"str": output_str, "event_soon": event_soon}
   }
}