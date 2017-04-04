'use strict';

const decoder = new TextDecoder('utf-8');
let serviceUuid = '00001234-0000-1000-8000-00805f9b34fb';
let dateUuid = '00001234-0001-1000-8000-00805f9b34fb';
let nameUuid = '00001234-0002-1000-8000-00805f9b34fb';
let commentUuid = '00001234-0003-1000-8000-00805f9b34fb';
let users = [];

/**
 * Web Speech API
 */
var synthes = new SpeechSynthesisUtterance();
var voices = window.speechSynthesis.getVoices();
synthes.voice = voices[7]; // 7:Google 日本人 ja-JP
synthes.volume = 1.0; // 音量 min 0 ~ max 1
synthes.rate = 1.0; // 速度 min 0 ~ max 10
synthes.pitch = 1.0; // 音程 min 0 ~ max 2
synthes.lang = 'ja-JP'; // en-US or ja-JP

class User {
    constructor() {
        this.id = '';
        this.chat = {date: '', name: '', comment: ''};
        this.chatValue = {date: '', name: '', comment: ''};
    }
}

async function connectDeviceAndCacheCharacteristics() {
    try {
        let user = new User();

        console.log('Requesting Bluetooth Device...');
        const device = await navigator.bluetooth.requestDevice({
            filters: [{services: [serviceUuid],}]
        });
        device.addEventListener('gattserverdisconnected', onDisconnected);

        console.log('Connecting to GATT Server...');
        const server = await device.gatt.connect();
        user.id = server.device.id;

        console.log('Getting Service...');
        const service = await server.getPrimaryService(serviceUuid);

        console.log('Getting Characteristic...');
        user.chat.date = await service.getCharacteristic(dateUuid);
        user.chat.name = await service.getCharacteristic(nameUuid);
        user.chat.comment = await service.getCharacteristic(commentUuid);

        console.log('Starting Notifications...');
        await user.chat.date.startNotifications();
        await user.chat.name.startNotifications();
        await user.chat.comment.startNotifications();

        user.chat.date.addEventListener('characteristicvaluechanged', handleDateNotifications);
        user.chat.name.addEventListener('characteristicvaluechanged', handleNameNotifications);
        user.chat.comment.addEventListener('characteristicvaluechanged', handleCommentNotifications);

        let dateValue = await user.chat.date.readValue();
        let nameValue = await user.chat.name.readValue();
        let commentValue = await user.chat.comment.readValue();
        user.chatValue.date = decoder.decode(dateValue);
        user.chatValue.name = decoder.decode(nameValue);
        user.chatValue.comment = decoder.decode(commentValue);

        users.push(user);

    } catch(error) {
        console.log(error);
    }
}

/* This function will be called when `readValue` resolves and
 * characteristic value changes since `characteristicvaluechanged` event
 * listener has been added. */
function handleDateNotifications(event) {
    console.log("date");
    let id = event.target.service.device.id;
    let date = decoder.decode(event.target.value);
    for (var i= 0, len=users.length; i<len; i++) {
        let user = users[i];
        if (user.id == id) {
            user.chatValue.date = date;
        }
    }
}

function handleNameNotifications(event) {
    console.log("name");
    let id = event.target.service.device.id;
    let name = decoder.decode(event.target.value);
    for (var i= 0, len=users.length; i<len; i++) {
        let user = users[i];
        if (user.id == id) {
            user.chatValue.name = name;
        }
    }
}

function handleCommentNotifications(event) {
    console.log("comment");
    let id = event.target.service.device.id;
    let comment = decoder.decode(event.target.value);
    for (var i= 0, len=users.length; i<len; i++) {
        let user = users[i];
        if (user.id == id) {
            user.chatValue.comment = comment;

            let date = user.chatValue.date;
            let name = user.chatValue.name;
            addComment(date, name, comment);
            voice(comment);
        }
    }
}

function onDisconnected() {
    console.log('Bluetooth Device disconnected...');
}

// コメントを画面に追加する
function addComment(date, name, comment) {
    console.log(date);
    console.log(name);
    console.log(comment);
    let fragment = document.createDocumentFragment();
    let $div = document.createElement('div');
    $div.setAttribute('class', 'commentballoon mb10');
    let $dl = document.createElement('dl');
    let $dt_date = document.createElement('dt');
    let $dt_date_text = document.createTextNode("日付:");
    $dt_date.appendChild($dt_date_text);
    let $dt_name = document.createElement('dt');
    let $dt_name_text = document.createTextNode("名前:");
    $dt_name.appendChild($dt_name_text);
    let $dt_comment = document.createElement('dt');
    let $dt_comment_text = document.createTextNode("コメント:");
    $dt_comment.appendChild($dt_comment_text);
    // 個別設定
    let $dd_date = document.createElement('dd');
    let $dd_date_text = document.createTextNode(date);
    $dd_date.appendChild($dd_date_text);
    let $dd_name = document.createElement('dd');
    let $dd_name_text = document.createTextNode(name);
    $dd_name.appendChild($dd_name_text);
    let $dd_comment = document.createElement('dd');
    let $dd_comment_text = document.createTextNode(comment);
    $dd_comment.appendChild($dd_comment_text);
    // fragmentに追加
    fragment.appendChild($dt_date);
    fragment.appendChild($dd_date);
    fragment.appendChild($dt_name);
    fragment.appendChild($dd_name);
    fragment.appendChild($dt_comment);
    fragment.appendChild($dd_comment);
    // $dlに追加
    $dl.appendChild(fragment);
    // $divに追加
    $div.appendChild($dl);
    document.querySelector('.commentList').append($div);
}

function voice(comment) {
    synthes.text = comment;
    window.speechSynthesis.speak(synthes);
}

// Begin BLE Scanning
document.querySelector('#startScannig').addEventListener('click', function(event) {
  event.stopPropagation();
  event.preventDefault();
  connectDeviceAndCacheCharacteristics();
});