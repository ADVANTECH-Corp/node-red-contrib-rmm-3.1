var http = require('http');
var SensorGetJSFun = {};
SensorGetJSFun.options = {
    host: 'localhost',
    port: '8080',
    path: '/webresources',
    method: 'GET',
    headers: {'Authorization': 'Basic ',
        'Accept': 'application/json',
        'Content-Type': 'application/json'}
};

SensorGetJSFun.sethttpOption = function (host, port, path, method, user, pwd) {
    SensorGetJSFun.options.host = host;
    SensorGetJSFun.options.port = port;
    SensorGetJSFun.options.path = path;
    SensorGetJSFun.options.method = method;
    SensorGetJSFun.options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
    SensorGetJSFun.options.headers.Accesstoken = '';
    return SensorGetJSFun.options;
};

SensorGetJSFun.sethttpOption_token = function (host, port, path, method, token) {
    SensorGetJSFun.options.host = host;
    SensorGetJSFun.options.port = port;
    SensorGetJSFun.options.path = path;
    SensorGetJSFun.options.method = method;
    SensorGetJSFun.options.headers.Authorization = '';
    SensorGetJSFun.options.headers.Accesstoken = 'Bearer ' + token;
    return SensorGetJSFun.options;
};

SensorGetJSFun.submit = function (url, port, path, method, username, pwd, jsonStringData, res_success, res_error) {
    //var options = this.sethttpOption(url, port, path, method, username, pwd);
    var req = http.request(SensorGetJSFun.options, function (response) {
        var str = '';
        response.on('data', function (chunk) {
            str += chunk;
        });
        response.on('end', function () {
            res_success(str);
        });
    }).on('error', function (error) {
        res_error(error.errno);
    });
    if (method !== 'get')
        req.write(jsonStringData);
    req.end();
};

SensorGetJSFun.getjsoncontentData = function (config) {
    var deviceid = config.deviceid;
    var objitem = new Object();
    objitem.agentId = deviceid;
    objitem.handler = 'SUSIControl';
    var objreq = new Object();
    objreq.request = objitem;
    return JSON.stringify(objreq);
};
module.exports = function (RED) {
    function SensorGetNode(config) {
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
            var token = msg.token;
            var connectype = msg.connectype;
            var encodestr = msg.encodestr;
            if (flag === 'encode') {
                if (typeof url === 'undefined' || typeof port === 'undefined' || url === '' || port === '') {
                    node.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                switch(connectype){
                    case 'basic':
                        var decoder = new Buffer(encodestr, 'base64').toString();
                        username = decoder.split("$")[0];
                        pwd = decoder.split("$")[1];                        
                        SensorGetJSFun.options = SensorGetJSFun.sethttpOption(url, port, '/webresources/DeviceCtl/getSensorID', 'post', username, pwd);
                        break;
                    case 'oauth':
                        SensorGetJSFun.options = SensorGetJSFun.sethttpOption_token(url, port, '/webresources/DeviceCtl/getSensorID', 'post', token);
                        break;
                }
            } else {
                if (typeof url === 'undefined' || typeof port === 'undefined' || typeof username === 'undefined' || typeof pwd === 'undefined' ||
                        url === '' || port === '' || username === '' || pwd === '') {
                    node.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                SensorGetJSFun.options = SensorGetJSFun.sethttpOption(url, port, '/webresources/DeviceCtl/getSensorID', 'post', username, pwd);
            }

            if (typeof msg.deviceid !== 'undefined' && msg.deviceid !== '')
                config.deviceid = msg.deviceid;
            node.status({fill: "red", shape: "ring", text: "sending"});

            SensorGetJSFun.submit(url, port, '/webresources/DeviceCtl/getSensorID', 'post', username, pwd, SensorGetJSFun.getjsoncontentData(config), function (res_success) {
                msg.payload = res_success;
                node.send(msg);
                node.status({fill: "green", shape: "dot", text: 'done'});
            }, function (res_error) {
                node.status({fill: "red", shape: "ring", text: res_error});
            });
        });
    }

    RED.nodes.registerType("SensorGet", SensorGetNode);
};