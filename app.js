var crypto = require('crypto')
var swarm = require('discovery-swarm')
var defaults = require('dat-swarm-defaults')
var readline = require('readline')
var portastic = require('portastic');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var peers = {}
var myId = crypto.randomBytes(32)
console.log('Your ID is: ' + myId.toString('hex'))

var config = defaults({
  id: myId
})

var sw = swarm(config);

async function chat() {
  var options = {
    min : 7555,
    max : 12000
}; //these are the ranges of ports available for hosting the app

try {
var ports = await portastic.find(options);
var port = ports[0]
sw.listen(port)
console.log(`Listening on port ${port}`);
sw.join('chat');
} catch (err) {
    console.error('Error finding port or initializing swarm:', err);
  }

sw.on('connection', function(conn, info) {
    var peerId = info.id.toString('hex')
    console.log(`New user joined the chat: ${peerId}`)
    if (info.initiator) {
        conn.setKeepAlive(true, 60 * 60 * 24 * 7 * 1000)
    }

    conn.on('data', function(data) {
        console.log(
            data.toString()
        );
    })

    conn.on('close', function() {
        for (var id in peers) {
            peers[id].conn.write(myId.toString('hex') + " left the chat")
        }
    })

    if (!(peerId in peers)) {
        peers[peerId] = {}
    }
    peers[peerId].conn = conn
})

rl.on('line', function(message) {
    for (var id in peers) {
        peers[id].conn.write(myId.toString('hex') + ": " + message)
    }
});
}
chat();