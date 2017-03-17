'use strict';

const decoder = new TextDecoder('utf-8');
let serviceUuid = '00001234-0000-1000-8000-00805f9b34fb';
let dateUuid = '00001234-0001-1000-8000-00805f9b34fb';
let nameUuid = '00001234-0002-1000-8000-00805f9b34fb';
let commentUuid = '00001234-0003-1000-8000-00805f9b34fb';
let users = [];

class User {
    constructor() {
        this.id = '';
        this.chat = {date: '', name: '', comment: ''};
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

        user.chat.date.addEventListener('characteristicvaluechanged', handleNotifications);
        user.chat.name.addEventListener('characteristicvaluechanged', handleNotifications);
        user.chat.comment.addEventListener('characteristicvaluechanged', handleNotifications);

        users.push(user);

    } catch(error) {
        console.log(error);
    }
}

/* This function will be called when `readValue` resolves and
 * characteristic value changes since `characteristicvaluechanged` event
 * listener has been added. */
async function handleNotifications(event) {
    let id = event.target.service.device.id;
    for (var i= 0, len=users.length; i<len; i++) {
        let user = users[i];
        if (user.id == id) {
            let date = await user.chat.date.readValue();
            let name = await user.chat.name.readValue();
            let comment = await user.chat.comment.readValue();
            date = decoder.decode(date);
            name = decoder.decode(name);
            comment = decoder.decode(comment);
            addComment(date, name, comment);
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

// Begin BLE Scanning
document.querySelector('#startScannig').addEventListener('click', function(event) {
  event.stopPropagation();
  event.preventDefault();
  connectDeviceAndCacheCharacteristics();
});