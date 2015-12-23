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

    function HDDDataNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.status({});
        this.on('input', function (msg) {
            var url = msg.url;
            var port = msg.port;
            var username = msg.username;
            var pwd = msg.pwd;
            var statusNode = this;
            var flag = msg.flag;
            var encodestr = msg.encodestr;
            var token = msg.token;
            var connectype = msg.connectype;
            if (flag === 'encode') {
                if (typeof url === 'undefined' || typeof port === 'undefined' || url === '' || port === '') {
                    statusNode.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                switch(connectype){
                    case 'basic':
                        var decoder = new Buffer(encodestr, 'base64').toString();
                        username = decoder.split("$")[0];
                        pwd = decoder.split("$")[1];                        
                        options = sethttpOption(url, port, '/webresources/HWMonitorMgmt/getHDDData/' + config.deviceid, 'get', username, pwd);
                        break;
                    case 'oauth':
                        options = sethttpOption_token(url, port, '/webresources/HWMonitorMgmt/getHDDData/' + config.deviceid, 'get', token);
                        break;
                }
            } else {
                if (typeof url === 'undefined' || typeof port === 'undefined' || typeof username === 'undefined' || typeof pwd === 'undefined' ||
                        url === '' || port === '' || username === '' || pwd === '') {
                    statusNode.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                options = sethttpOption(url, port, '/webresources/HWMonitorMgmt/getHDDData/' + config.deviceid, 'get', username, pwd);
            }

            if (typeof msg.deviceid !== 'undefined' && msg.deviceid !== '')
                config.deviceid = msg.deviceid;

            statusNode.status({fill: "red", shape: "ring", text: "sending"});
            
            http.request(options, function (response) {
                var str = '';
                response.on('data', function (chunk) {
                    str += chunk;
                });
                response.on('end', function () {
//                    console.log(str);
                    msg.payload = str;
                    node.send(msg);
                    statusNode.status({fill: "green", shape: "dot", text: "done"});
                });
            }).on('error', function (error) {
                statusNode.status({fill: "red", shape: "ring", text: error.errno});
            }).end();
        });
    }

    function sethttpOption(host, port, path, method, user, pwd)
    {
        options.host = host;
        options.port = port;
        options.path = path;
        options.method = method;
        options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
        options.headers.Accesstoken = '';
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

    RED.nodes.registerType("HDDData", HDDDataNode);
};