module.exports = function (RED) {
    var http = require('http');
    var options = {
        host: 'localhost',
        port: '8080',
        path: '/webresources',
        method: 'GET',
        headers: {'Authorization': 'Basic ',
            'Accept': 'application/json',
            'Content-Type': 'application/json'}
    };

    function HDDMonitorNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.status({});
        this.on('input', function (msg) {
            node.status({fill: "red", shape: "ring", text: "sending"});
            var url = msg.url;
            var port = msg.port;
            var username = msg.username;
            var pwd = msg.pwd;
            var flag = msg.flag;
            var encodestr = msg.encodestr;
            var token = msg.token;
            var connectype = msg.connectype;
            if (flag === 'encode') {
                if (typeof url === 'undefined' || typeof port === 'undefined' || url === '' || port === '') {
                    node.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                switch (connectype) {
                    case 'basic':
                        var decoder = new Buffer(encodestr, 'base64').toString();
                        username = decoder.split("$")[0];
                        pwd = decoder.split("$")[1];
                        options = sethttpOption(url, port, '/webresources/DeviceCtl/getDeviceData', 'post', username, pwd);
                        break;
                    case 'oauth':
                        options = sethttpOption_token(url, port, '/webresources/DeviceCtl/getDeviceData', 'post', token);
                        break;
                }
            } else {
                if (typeof url === 'undefined' || typeof port === 'undefined' || typeof username === 'undefined' || typeof pwd === 'undefined' ||
                        url === '' || port === '' || username === '' || pwd === '') {
                    node.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                options = sethttpOption(url, port, '/webresources/DeviceCtl/getDeviceData', 'post', username, pwd);
            }

            if (typeof msg.deviceid !== 'undefined' && msg.deviceid !== '')
                config.deviceid = msg.deviceid;
            node.status({fill: "red", shape: "ring", text: "sending"});
            var obj = new Object();
            obj.agentId = config.deviceid;
            obj.handler = 'HDDMonitor';
            var objreq = new Object();
            objreq.request = obj;
            var jsonString = JSON.stringify(objreq);


            var req = http.request(options, function (response) {
                var str = '';
                response.on('data', function (chunk) {
                    str += chunk;
                });
                response.on('end', function () {
                    msg.payload = str;
                    node.send(msg);
                    node.status({fill: "green", shape: "dot", text: "done"});
                });
            }).on('error', function (error) {
                node.status({fill: "red", shape: "ring", text: error.errno});
            });
            req.write(jsonString);
            req.end();
        });
    }

    function sethttpOption(host, port, path, method, user, pwd)
    {
        options.host = host;
        options.port = port;
        options.path = path;
        options.method = method;
        options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
        return options;
    }
    
    function sethttpOption_token(host, port, path, method, token)
    {
        options.host = host;
        options.port = port;
        options.path = path;
        options.method = method;
        options.headers.Authorization = '';
        options.headers.Accesstoken = 'Bearer ' + token;
        return options;
    }

    RED.nodes.registerType("HDDMonitor", HDDMonitorNode);
};