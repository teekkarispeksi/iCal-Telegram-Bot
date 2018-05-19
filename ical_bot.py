# -*- coding: utf-8 -*-
import urllib, urllib2
from threading import Timer
import datetime
import json, time
from httplib import HTTPSConnection, HTTPConnection
import sys
import globalConfig, customEnv #our own globalConfig.py and customEnv.py files
sys.path
sys.path.append('lib')
url = "api.telegram.org"
bot = customEnv.bot_url
offset = 0
activeCalendarContent = False

calendar_chats = globalConfig.default_chats #list of chats requested updates more added with /activate
calendar_url = customEnv.ical_url
calendar_publish_hour = globalConfig.publish_hour #when hour starts we send the messages
calendar_publish_minute = globalConfig.publish_minute

def log(msg):
    print msg
    with open('speksi_bot.log', 'a') as filename:
        filename.write(datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + ': ' + msg + '\n')

def getUpdates():
    conn = HTTPSConnection(url)
    conn.request("GET", bot + "getUpdates?offset=" + str(offset))
    try:
        res = json.loads(conn.getresponse().read())
    except:
        return []
    conn.close()
    return res

def sendMessage(id, msgStr):
    conn = HTTPSConnection(url)
    conn.request("GET", bot + "sendMessage?chat_id=" + str(id) + "&text=" + msgStr + "&disable_web_page_preview=true")
    res = conn.getresponse().read()
    conn.close()

def parse_calendar_updates():
    reponse = urllib2.urlopen(calendar_url)
    data = reponse.read().split('BEGIN:VEVENT')
    events = []
    for item in data[1:]:
        #print(item)
        start = datetime.datetime.now()
        if (item.find('DTSTART;VALUE=DATE:') != -1):
            splace = item.find('DTSTART;VALUE=DATE:') + len('DTSTART;VALUE=DATE:')
            start = datetime.datetime.strptime(item[splace:splace+8], "%Y%m%d")
        else: 
            splace = item.find('DTSTART;TZID=Europe/Helsinki:') + len('DTSTART;TZID=Europe/Helsinki:')
            start = datetime.datetime.strptime(item[splace:splace+15], "%Y%m%dT%H%M%S")
        eplace = item.find('SUMMARY:') + len('SUMMARY:')
        eplaceend = item.find('\n', eplace)
        name = item[eplace:eplaceend]
        events.append([start, name])

    events.sort(key=lambda event: event[0])

    events_print = []
    for event in events:
        s = event[0] - datetime.datetime.now()
        if (s.days < 0):
            continue
        if (s.days * 86400 + s.seconds > 86400 * 7):
            break
        events_print.append(event)

    daynames = globalConfig.lang['DAYNAMES']
    msg_str = "Tapahtumia lähipäivinä:\n" if (len(events_print) > 0) else "Ei tapahtumia lähipäivinä. Ilmoita tapahtumia: http://kalenteri.speksi.fi"
    if (len(events_print) > 0):
        activeCalendarContent = True
    else:
        activeCalendarContent = False
    for event in events_print:
        daynum = int(event[0].strftime('%w'))
        msg_str = msg_str + daynames[daynum] + event[0].strftime(' klo %H:%M ') + event[1] + "\n"
    return urllib.quote(msg_str)

def send_calendar_updates():
    time = datetime.datetime.now()
    if (time.hour == calendar_publish_hour and time.minute == calendar_publish_minute):
        content = parse_calendar_updates()
        if activeCalendarContent or time.weekday() == 1:
            for chat in calendar_chats:
                sendMessage(chat, content)
    Timer(60.0, send_calendar_updates).start()

send_calendar_updates()


def parseRequest(req, chat_id):
    if (req == "/today"):
        return [parse_calendar_updates()]
    elif (req == "/activate"):
        if chat_id not in calendar_chats:
            calendar_chats.append(chat_id)
            log('Chat ' + str(chat_id) + ' joined.')
            return ['Päivitykset lähetään joka päivä kello ' + str(calendar_publish_hour) + ':' + str(calendar_publish_minute)]
    elif (req == "/stop"):
        if chat_id in calendar_chats:
            calendar_chats.remove(chat_id)
            return ['Et saa enää päivityksiä']
    return []


while(True):
    msg = getUpdates()
    try:
        msg = msg['result']
        if (len(msg) != 0):
            offset = msg[-1]['update_id']
            msg.pop(0)
            for message in msg:
                try:
                    req = message['message']['text']
                except:
                    continue
                chatId = message['message']['chat']['id']
                res = parseRequest(req, chatId)
                for msg in res:
                    sendMessage(chatId, msg)
    except:
        continue

    time.sleep(10)
