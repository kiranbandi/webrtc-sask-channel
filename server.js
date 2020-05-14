var SimpleSignalServer = require('simple-signal-server');
const fs = require('fs').promises;
const moment = require('moment');
const server = require('http').createServer();
const io = require('socket.io')(server, { serveClient: false, 'sync disconnect on unload': true })
var signal = new SimpleSignalServer(io);
// bounce back discovery messages , This is being used by signalling code so dont modify here
signal.on('discover', (request) => { request.discover(request.socket.id, {}) });

var currentPeerID = '',
    isChannelFree = true,
    hubPeerID = '',
    myInterval;

io.on('connection', function(socket) {
    // when hub joins the channel store its peerID so that it can be sent to other peers
    socket.on('hub-join', function(msg) {
        hubPeerID = socket.id
    });
    // If a peer wants to join the network
    socket.on('participant-ready', function(msg) {
        // when a peer joins for the first time we check if the channel is free
        // if the channel is free we notify the peer that it is all okay and send him his ID
        if (isChannelFree) {
            isChannelFree = false;
            currentPeerID = socket.id;
            socket.emit('all-okay', { 'customID': socket.id })
        } else { socket.emit('server-busy') }
    });

    // if a peer has already joined the network we wait for his questionaire data
    socket.on('system-info', function(message) {
        // after we get this data we store it in file and now start sending data in chunks
        fs.writeFile(__dirname + '/logs/' + currentPeerID + "-sytem-info-" + getTimeStamp() + ".txt", message)
            .then(() => {
                // Here we are now ready to start bursting data on to the UI peer

                // initialize message rates
                // var message_rates = [0, 5, 10, 20, 40];
                var message_rates = [0, 5];
                var message_rates_length = message_rates.length;
                var message_rates_index = 0;

                // initialize message sizes
                // var message_sizes = ["_11111111111111111111111111111111111111111111111111", "_1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111", "_111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111", "_111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111", "_11111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111", "_111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111"];
                // var message_sizes_label = ["50bytes", "100bytes", "150bytes", "300bytes", "500bytes", "1kbyte"];
                var message_sizes = ["_11111111111111111111111111111111111111111111111111", "_1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111"];
                var message_sizes_label = ["50bytes", "100bytes"];
                var message_sizes_index = 0;
                var message_sizes_length = message_sizes.length;

                var interval = message_rates[message_rates_index];

                //var interval = 100;
                var interval_flag = 0;
                var i = 0;
                Filename = __dirname + '/logs/socket/' + currentPeerID + '_' + message_sizes_label[message_sizes_index].concat('_', message_rates[message_rates_index], 'ms_', new Date().getMonth(), '_', new Date().getDate(), '_', new Date().getHours(), '_', new Date().getMinutes(), '_', new Date().getSeconds(), '.txt');

                fs.appendFile(Filename, socket.handshake.address + ' Time: ', (err) => {
                    if (err) throw err;
                });
                fs.appendFile(Filename, (new Date()).toString() + '\n', (err) => {
                    if (err) throw err;
                });
                myInterval = setInterval(send_message, interval);

                function send_message() {

                    if (interval_flag == 1) {
                        Filename = __dirname + '/logs/socket/' + currentPeerID + '_' + message_sizes_label[message_sizes_index].concat('_', message_rates[message_rates_index], 'ms_', new Date().getMonth(), '_', new Date().getDate(), '_', new Date().getHours(), '_', new Date().getMinutes(), '_', new Date().getSeconds(), '.txt');
                        interval_flag = 0;
                    }
                    var messageToBeSent = i + message_sizes[message_sizes_index];
                    interval = message_rates[message_rates_index];
                    console.log(interval);

                    //var messageToBeSent = i + "_11111";
                    socket.emit('sent-from-server', messageToBeSent);
                    var save_sent = 'Server: ' + messageToBeSent + '_' + new Date().getTime() + '_' + message_sizes_label[message_sizes_index] + '_' + message_rates[message_rates_index] + '\n';
                    //fs.appendFile('datafile.txt', save_sent, (err) => {
                    fs.appendFile(Filename, save_sent, (err) => {
                        if (err) throw err;
                    });

                    i += 1;
                    console.log(i);
                    if ((i % 1000) == 0) {
                        message_sizes_index = message_sizes_index + 1;
                        interval = interval + 20000;
                        interval_flag = 1;
                        //Filename = message_sizes_label[message_sizes_index].concat('_', message_rates[message_rates_index], 'ms_', new Date(). getMonth(), '_', new Date().getDate(), '_', new Date().getHours(), '_', new Date().getMinutes(), '_', new Date().getSeconds(), '.txt');
                        if (message_sizes_index == message_sizes_length) {
                            message_rates_index = message_rates_index + 1;
                            message_sizes_index = 0;
                            //test_file = message_sizes_label[message_sizes_index] + message_rates[message_rates_index]
                        }


                        if (i == (message_rates_length * message_sizes_length * 1000)) {
                            console.log('All done');
                            socket.emit('start-webrtc', { hubPeerID });
                        }

                    }
                    clearInterval(myInterval);
                    if (i < (message_rates_length * message_sizes_length * 1000)) {
                        // if (i < 5000) {
                        myInterval = setInterval(send_message, interval);
                    }
                }
            })
    })


    socket.on('return-to-server', function(message) {
        var save_return = currentPeerID + '_' + message + '_ _ _' + new Date().getTime() + '\n';
        fs.appendFile(Filename, save_return, (err) => {
            if (err) throw err;
        });
    });


    // When a UI disconnects we reset the currentPeerID back to empty 
    // and channel free flag to true so that  other UIs
    //  can connect to it and start their experiment 
    socket.on('disconnect', function() {
        if (socket.id == currentPeerID) {
            currentPeerID = '';
            isChannelFree = true;
        }
        // Also clear the interval to stop sending any data 
        clearInterval(myInterval);
    });
});


// start the hub server by opening it one a headless chrome instance
server.listen(8082, async() => {
    console.log('socket server ready');
    // code block to open the hub on a headless version of chrome
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ dumpio: true });
    const page = await browser.newPage();


    const a = await page._client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: __dirname + "\\logs\\webrtc\\" });
    debugger;
    await page.goto('http://127.0.0.1:8083/hub/index.html');

});
// function to get formatted time stamp
function getTimeStamp() { return moment(new Date()).format('dd-mm-yyyy') }