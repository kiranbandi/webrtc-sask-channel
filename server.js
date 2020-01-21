const io = require('socket.io')() // create a socket.io server
var SimpleSignalServer = require('simple-signal-server')
var signal = new SimpleSignalServer(io)

// here we hardcode some fixed rooms, but you could easily create them dynamically
const rooms = {
    'sask': new Set()
}

const saskChannel = new Set();

// when a peer starts, it will request a list of all peers 
signal.on('discover', (request) => {
    const custom_message = request.discoveryData;
    // Peer is initiating a new request and wants a list of all peers
    if (custom_message == 'join') {
        console.log(request.socket.id, 'joined channel');
        saskChannel.add(request.socket.id) // add peer to channel
        request.discover(request.socket.id, { peers: Array.from(saskChannel) })
    } else if (custom_message == 'leave') {
        // if peer was already in a room
        console.log(request.socket.id, 'left channel')
        saskChannel.delete(request.socket.id) // remove peer from channel
    }
})

io.listen(8080)