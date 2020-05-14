var shortid = require('shortid');
var SimpleSignalServer = require('simple-signal-server');
const server = require('http').createServer();
const io = require('socket.io')(server, { serveClient: false }) // create a socket.io server

var signal = new SimpleSignalServer(io);

signal.on('discover', (request) => {
    // bounce back discovery messages
    request.discover(request.socket.id, {});
});

var saskChannel = [],
    hubPeerID = '';

io.on('connection', function(socket) {
    // If hub joins the channel then we set its details and 
    // give it the details of all the peers it should link up with
    socket.on('hub-join', function(msg) {
        hubPeerID = socket.id;
        console.log('hub has joined and is ready');
    });

    // If a peer wants to join the network
    socket.on('peer-join', function(msg) {
        let customID = shortid.generate();
        // let everyone else know that a new peer has joined the channel 
        socket.broadcast.emit('peer-join', customID);
        console.log(customID, 'joined channel');
        socket.emit('notify', {
            customID,
            hubPeerID,
            peerList: [...saskChannel]
        });
    });

    socket.on('peer-left', function(peerCustomID) {
        console.log(peerCustomID, 'left channel');
    });
});


server.listen(8082, async() => {
    console.log('socket server ready');
    // code block to open the hub on a headless version of chrome
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({});
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:8083/hub/index.html');
});