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
        this.characteristic = {date: '', name: '', comment: ''};
        this.characteristicValue = {date: '', name: '', comment: ''};
    }
}

function connectDeviceAndCacheCharacteristics() {

    let user = new User();

    console.log('Requesting Bluetooth Device...');
    navigator.bluetooth.requestDevice({
        filters: [{services: [serviceUuid],}]
    })
    .then(device => {
        device.addEventListener('gattserverdisconnected', onDisconnected);
        return device.gatt.connect();
    })
    .then(server => {
        user.id = server.device.id;
        return server.getPrimaryService(serviceUuid);
    })
    .then(service => {
        return Promise.all([
            service.getCharacteristic(dateUuid),
            service.getCharacteristic(nameUuid),
            service.getCharacteristic(commentUuid),
        ]);
    })
    .then(characteristics => {
        user.characteristic.date = characteristics[0];
        user.characteristic.name = characteristics[1];
        user.characteristic.comment = characteristics[2];

        console.log('Starting Notifications...');
        user.characteristic.date.startNotifications();
        user.characteristic.name.startNotifications();
        user.characteristic.comment.startNotifications();
        user.characteristic.date.addEventListener('characteristicvaluechanged', handleDateNotifications);
        user.characteristic.name.addEventListener('characteristicvaluechanged', handleNameNotifications);
        user.characteristic.comment.addEventListener('characteristicvaluechanged', handleCommentNotifications);

        return Promise.all([
            user.characteristic.date.readValue(),
            user.characteristic.name.readValue(),
            user.characteristic.comment.readValue(),
        ]);
    })
    .then(values => {
        user.characteristicValue.date = decoder.decode(values[0]);
        user.characteristicValue.name = decoder.decode(values[1]);
        user.characteristicValue.comment = decoder.decode(values[2]);

        users.push(user);
    })
}

/* This function will be called when `readValue` resolves and
 * characteristic value changes since `characteristicvaluechanged` event
 * listener has been added. */
function handleDateNotifications(event) {
    let id = event.target.service.device.id;
    let date = decoder.decode(event.target.value);
    for (var i= 0, len=users.length; i<len; i++) {
        let user = users[i];
        if (user.id == id) {
            user.characteristicValue.date = date;
        }
    }
}

function handleNameNotifications(event) {
    let id = event.target.service.device.id;
    let name = decoder.decode(event.target.value);
    for (var i= 0, len=users.length; i<len; i++) {
        let user = users[i];
        if (user.id == id) {
            user.characteristicValue.name = name;
        }
    }
}

function handleCommentNotifications(event) {
    let id = event.target.service.device.id;
    let comment = decoder.decode(event.target.value);
    for (var i= 0, len=users.length; i<len; i++) {
        let user = users[i];
        if (user.id == id) {
            user.characteristicValue.comment = comment;

            let date = user.characteristicValue.date;
            let name = user.characteristicValue.name;
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