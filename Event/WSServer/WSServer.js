module.exports = function (RED) {
    var WebSocketServer = require('ws').Server;
    var wss = new WebSocketServer({port: 9876,host: '0.0.0.0'});
    wss.on('connection', function (ws) {
        ws.on('message', function (message) {
            console.log('received: %s', message);
        });

        ws.on('close', function () {
            console.log('websocket close');
        });
        
        ws.on('error', function () {
            console.log('websocket error');
        });
        
        console.log('connection: ', ws.upgradeReq.connection.remoteAddress);
    });

    wss.broadcast = function broadcast(data) {
        wss.clients.forEach(function each(client) {
            client.send(data);
        });
    };
    function WSServerNode(config) {

        RED.nodes.createNode(this, config);        
        this.on('input', function (msg) {
            wss.broadcast(msg.payload.toString());
        });
    }

    RED.nodes.registerType("WSServer", WSServerNode);
};