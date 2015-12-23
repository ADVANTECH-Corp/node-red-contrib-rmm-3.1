module.exports = function (RED) {
    function WSRetrieveNode(config) {
        var WebSocket = require('ws');
        var http = require('http');
        var websocketJSFun = {};
        websocketJSFun.eventid = 0;
        var ws = null;
        RED.nodes.createNode(this, config);
        var node = this;
        node.status({});
        this.on('close',function(){
            if (ws !== null) {
                try {
                    ws.close();
                    ws = null;
                } catch (e) {
                }
            }
        });
        this.on('input', function (msg) {
            if (ws !== null)
                return;
            var url = msg.url;
            var port = msg.port;
            var username = msg.username;
            var pwd = msg.pwd;
            var statusNode = this;
            var flag = msg.flag;
            var encodestr = msg.encodestr;
            var token = msg.token;
            var connectype = msg.connectype;
            var authbase64;

            if (flag === 'encode') {
                if (typeof url === 'undefined' || typeof port === 'undefined' || url === '' || port === '') {
                    statusNode.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                if (connectype === 'basic') {
                    var decoder = new Buffer(encodestr, 'base64').toString();
                    username = decoder.split("$")[0];
                    pwd = decoder.split("$")[1];
                    authbase64 = new Buffer(username + ":" + pwd).toString('base64');
                } else {
                    authbase64 = token;
                }

            } else {
                if (typeof url === 'undefined' || typeof port === 'undefined' || typeof username === 'undefined' || typeof pwd === 'undefined' ||
                        url === '' || port === '' || username === '' || pwd === '') {
                    statusNode.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                authbase64 = new Buffer(username + ":" + pwd).toString('base64');
            }

            var address = 'ws://' + url + ':' + port + '/websocket/' + authbase64 + '/' + websocketJSFun.eventid;
            if (ws !== null) {
                try {
                    ws.close();
                } catch (e) {
                }
            }
            statusNode.status({fill: "red", shape: "ring", text: "connecting"});
            ws = new WebSocket(address);            
            ws.on('open', function () {
                statusNode.status({fill: "green", shape: "dot", text: "connected"});
            });
            ws.on('error', function () {
                ws.close();
                ws = null;
                statusNode.status({fill: "red", shape: "ring", text: "error"});
            });
            ws.on('close', function () {                
                ws = null;
                statusNode.status({fill: "green", shape: "dot", text: "disconnected"});
            });
            ws.on('message', function (message) {
                msg.payload = message;
                node.send(msg);
            });
        });
    }

    RED.nodes.registerType("WSRetrieve", WSRetrieveNode);
};