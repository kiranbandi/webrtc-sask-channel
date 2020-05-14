/*global $*/
import io from 'socket.io-client';
import SimpleSignalClient from './custom-signal';

window.csvData = [];
window.systemInfo = [];

// for extended options go to https://www.html5rocks.com/en/tutorials/webrtc/datachannels/
var dataChannelOptions = {
    ordered: false, // do not guarantee order
    //maxRetransmitTime: 0,    // in milliseconds, 
    reliable: false, // reliability is controlled by maxRetransmitTime or maxRetransmits parameters. 
    // For TCP keep them commented and for UDP assign them value 0. default value 65535.
    maxRetransmits: 0, // can't be used maxRetransmitTime and maxRetransmits both
}

// setup the socket.io connection
const socket = io('192.168.0.66:8082');
// construct the webrtc signalling client and pass in the channel options
const signalClient = new SimpleSignalClient(socket, { dataChannelOptions });

// Join the channel and and then let the signalling  client know that you are ready
signalClient.discover('join');
signalClient.once('discover', () => {
    socket.emit('hub-join');
    // get a list of peers and initiate connection with each one of them
    socket.on('notify', (response) => { response.peers.forEach(p => { connectToPeer(p) }) })
        // If a peer joins the channel after the hub has joined the channel
        // then accept the connection from it and start listening for data 
    signalClient.on('request', async(request) => {
        console.log('accepting new request from peer to connect');
        const { peer, metadata } = await request.accept();
        console.log('connected to peer - ', metadata.customID);
        listenToPeer(peer);
    })
})

// if a peer connection is successful then listen for data from the peer
// and relay it on to everyone else
function listenToPeer(peer) {
    //var message = "TEST MESSAGE";
    //console.log(message);
    //var peer_list = signalClient.peers();
    //console.log(peer_list);

    peer.on('data', (message) => {

        //signalClient.peers().forEach(p => { 
        //console.log(message);
        var parseMessage = JSON.parse(message);
        //console.log(parseMessage.dataType);
        if (parseMessage.dataType == 'initiatorFlag') {
            //p.send(message)
            //console.log(parseMessage.remoteID);
            var dataType = "SendToPeer";
            //var sendMessage = "1111111111";
            //console.log(dataType + ' - ' + sendMessage);

            var peer_list = signalClient.peers();
            console.log("length: " + peer_list.length);
            //console.log(peer_list);
            //console.log(peer_list[0]);

            var message_rates = [0, 5, 10, 20, 40];
            var message_rates_length = message_rates.length;
            console.log(message_rates_length);
            var message_rates_index = 0;


            var message_sizes = ["_11111111111111111111111111111111111111111111111111", "_1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111", "_111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111", "_111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111", "_11111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111", "_111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111"];
            var message_sizes_label = ["50bytes", "100bytes", "150bytes", "300bytes", "500bytes", "1kbyte"];
            var message_sizes_index = 0;
            var message_sizes_length = message_sizes.length;
            console.log(message_sizes_length);

            var interval = message_rates[message_rates_index];
            //var test_interval;
            //var transmission_rate = [0, 5, 10, 20, 40];

            //for( var payload=0; payload<2; payload++){

            //var m = message_size[payload];
            //console.log(m);
            //for(var rate = 0; rate <5; rate ++){

            var i = 0;
            //var r = transmission_rate[rate];
            //console.log(r);
            var myInterval = setInterval(send_message, interval);

            function send_message() {
                //const sendMessage = i+"_11111111111111111111111111111111111111111111111111"; // 50 bytes
                //console.log(sendMessage);
                var sendMessage = i + message_sizes[message_sizes_index];
                interval = message_rates[message_rates_index];
                console.log(interval);
                //test_interval = message_rates[1];
                //console.log(sendMessage);
                peer_list[0].send(JSON.stringify({ dataType, sendMessage, 'remoteID': parseMessage.remoteID }))



                //peer_list[1].send(JSON.stringify({ dataType, sendMessage, 'remoteID': parseMessage.remoteID }))
                //signalClient.peers().send(JSON.stringify({ dataType, sendMessage, 'remoteID': parseMessage.remoteID }))

                //signalClient.peers().forEach(p => { 
                //	p.send(JSON.stringify({ dataType, sendMessage, 'remoteID': parseMessage.remoteID })); 
                //	//p.send({ dataType, sendMessage, 'remoteID': parseMessage.remoteID });
                //	console.log("sending to hub");
                //	});


                //console.log("Send: "+sendMessage);
                //window.csvData.push(parseMessage.remoteID + ':' + sendMessage + '_' + new Date().getTime()); 
                window.csvData.push('Server:' + sendMessage + '_' + new Date().getTime() + '_' + message_sizes_label[message_sizes_index] + '_' + message_rates[message_rates_index]);

                i += 1;

                console.log(i);
                if ((i % 1000) == 0) {
                    //i=0;
                    //dataType = "Flag";
                    //var thxMessage = "Experiment Ended !!. Thank you";
                    //peer_list[0].send(JSON.stringify({ dataType, thxMessage, 'remoteID': parseMessage.remoteID }))
                    Savedelay(message_sizes_label[message_sizes_index], message_rates[message_rates_index]);
                    console.log("message_size_index before save: " + message_sizes_label[message_sizes_index]);
                    //saveFile(message_sizes_label[message_sizes_index], message_rates[message_rates_index]);
                    //signalClient.discover('leave-' + currentID);
                    //setTimeout(saveFile(message_sizes_label[message_sizes_index], message_rates[message_rates_index]), 10000);

                    //window.csvData = [];
                    message_sizes_index = message_sizes_index + 1;
                    interval = interval + 15000;
                    //console.log("interval: "+interval);
                    //

                    if (message_sizes_index == message_sizes_length) {
                        message_rates_index = message_rates_index + 1;
                        message_sizes_index = 0;

                    }


                    if (i == (message_rates_length * message_sizes_length * 1000)) {
                        dataType = "Flag";
                        var thxMessage = "Experiment Ended !!. Thank you !! Please close the browser tab";
                        peer_list[0].send(JSON.stringify({ dataType, thxMessage, 'remoteID': parseMessage.remoteID }))
                            //clearInterval(myInterval);
                    }
                }

                clearInterval(myInterval);

                if (i < (message_rates_length * message_sizes_length * 1000)) {
                    myInterval = setInterval(send_message, interval);
                }

            }


            //},test_interval);
            //}, message_rates[message_rates_index]);
            //}, interval);

            //}
            //}


        }
        if (parseMessage.dataType == 'backToHub') {
            //console.log("back from hub");
            //console.log("Receive: "+parseMessage.payload);
            window.csvData.push(parseMessage.remoteID + ':' + parseMessage.payload + '_ _ _' + new Date().getTime());


        }


        if (parseMessage.dataType == 'systemInfo') {
            console.log("System Info: " + parseMessage.payload);
            window.systemInfo.push(parseMessage.payload);
            systemInfoFile();
            //console.log("Receive: "+parseMessage.payload);
            //window.csvData.push(parseMessage.remoteID + ':' + parseMessage.payload + '_ _ _' + new Date().getTime()); 


        }


        //console.log(parseMessage);
        //console.log(parseMessage.payload);
        //console.log(parseMessage.dataType);

        //}) 
    });
    peer.on('close', () => { debugger })
}

// connect to peer
async function connectToPeer(peerInfo) {
    const peerCustomID = peerInfo.customID;
    try {
        console.log('trying to connect to peer - ', peerCustomID);
        const { peer } = await signalClient.connect(peerInfo.peerID);
        console.log('connected to peer - ', peerCustomID);
        listenToPeer(peer);
    } catch (err) {
        console.log('failed to connect to peer - ', peerCustomID);
    }
}

function Savedelay(s, r) {
    var saveInterval = setInterval(function() {
        saveFile(s, r);
        clearInterval(saveInterval);
    }, 10000);

}


function saveFile(sizes, rates) {
    console.log("Sizes: " + sizes);
    var csvData = window.csvData;
    var csvContent = "data:text/csv;charset=utf-8," + csvData.join("\n"),
        encodedUri = encodeURI(csvContent),
        link = document.createElement("a"),
        timeStamp = (new Date()).toString().split("GMT")[0];
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", sizes + '_' + rates + '_' + 'csv_export' + "-" + timeStamp + ".csv");
    link.click();

    window.csvData = [];

}

function systemInfoFile() {
    var systemInfo = window.systemInfo;
    var systemInfoContent = "data:text/csv;charset=utf-8," + systemInfo.join("\n"),
        encodedUri = encodeURI(systemInfoContent),
        link = document.createElement("a"),
        timeStamp1 = (new Date()).toString().split("GMT")[0];
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", 'systemInfo_export' + "-" + timeStamp1 + ".txt");
    link.click();

    window.systemInfo = [];
}