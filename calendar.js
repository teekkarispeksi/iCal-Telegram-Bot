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

        var res = request('GET', settings.calendar_url) //get calendar from url
        var calendar_str = decoder.write(res.getBody()) //convert byte array to string
        var data = ical.parseICS(calendar_str) //parse ical to json

        for (var k in data){ //create clean array from events
            if (data.hasOwnProperty(k)) {
                var ev = data[k]
                if(ev.start){ //check that the object indeed is an event and not some trash
                    events.push([ev.summary, ev.start, ev.location])
                }
            }
        }

        events.sort(function(a, b){ return b[1] - a[1] }) //set events in time order (furthest in future first)

        i = 0
        var now = new Date()
        future_events = []
        while(events[i][1] > now){ //get only events that are in future
            future_events.push(events[i])
            i = i + 1
        }

        future_events.sort(function(a, b){ return a[1] - b[1] }) //reverse events order to show next events first (done with sort for future proofness)

        var output_str = 'Tapahtumia lähipäivinä: '
        var event_soon = false
        if (future_events.length > 0){ //if we have events
            if (Math.abs(now - future_events[0][1]) < 172800000){ event_soon = true } //do we have the first event within 24 hours
            for (var i in future_events){ //iterate over all events and convert to string
                var e = future_events[i]
                minute_str = ''
                place = e[2]
                if (!place) { place = settings.default_location}
                if (e[1].getMinutes() != 0) { minute_str = ':' + e[1].getMinutes()} //make the minutes string here to make next line less crowded
                output_str = output_str + '\n' + e[1].getDate() + '.' + (e[1].getMonth() + 1) + '. klo ' + e[1].getHours() + minute_str + ' ' + e[0] + ' @ ' + e[2]
            }
        }else{
            output_str = 'Ei tapahtumia lähipäivinä. Ilmoita tapahtumia http://kalenteri.speksi.fi'
        }

        return {"str": output_str, "event_soon": event_soon}
   }
}