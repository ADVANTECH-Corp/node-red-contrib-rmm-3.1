var http = require('http');
var LongPollingJSFun = {};
LongPollingJSFun.eventid = 0;
LongPollingJSFun.pending = false;
LongPollingJSFun.deplyed = true;
LongPollingJSFun.options = {
    host: 'localhost',
    port: '8080',
    path: '/webresources',
    method: 'GET',
    headers: {'Authorization': 'Basic ',
        'Accept': 'application/json',
        'Content-Type': 'application/json'}
};

LongPollingJSFun.sethttpOption = function (host, port, path, method, user, pwd) {
    LongPollingJSFun.options.host = host;
    LongPollingJSFun.options.port = port;
    LongPollingJSFun.options.path = path;
    LongPollingJSFun.options.method = method;
    LongPollingJSFun.options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
    LongPollingJSFun.options.headers.Accesstoken = '';
    return LongPollingJSFun.options;
};

LongPollingJSFun.sethttpOption_token = function (host, port, path, method, token) {
    LongPollingJSFun.options.host = host;
    LongPollingJSFun.options.port = port;
    LongPollingJSFun.options.path = path;
    LongPollingJSFun.options.method = method;
    LongPollingJSFun.options.headers.Authorization = '';
    LongPollingJSFun.options.headers.Accesstoken = 'Bearer ' + token;
    return LongPollingJSFun.options;
};

LongPollingJSFun.submit = function (url, port, path, method, username, pwd, jsonStringData, res_success, res_error) {
//    var options = this.sethttpOption(url, port, path, method, username, pwd);
    var req = http.request(LongPollingJSFun.options, function (response) {
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

LongPollingJSFun.getjsoncontentData = function () {
    var objitem = new Object();
    objitem.item = {"@name": "lasteventid", "@value": "" + LongPollingJSFun.eventid + ""};
    var objreq = new Object();
    objreq.request = objitem;
    return JSON.stringify(objreq);
};
module.exports = function (RED) {
    function LongPollingNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.on('close', function(){
//            LongPollingJSFun.eventid = 0;
//            LongPollingJSFun.pending = false;
            LongPollingJSFun.deplyed = true;
            node.status({});
        });
        this.on('input', function (msg) {
            if (LongPollingJSFun.pending)
                return;
            LongPollingJSFun.deplyed = false;
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
                switch (connectype) {
                    case 'basic':
                        var decoder = new Buffer(encodestr, 'base64').toString();
                        username = decoder.split("$")[0];
                        pwd = decoder.split("$")[1];
                        LongPollingJSFun.options = LongPollingJSFun.sethttpOption(url, port, '/webresources/EventMgmt/long-polling/', 'post', username, pwd);
                        break;
                    case 'oauth':
                        LongPollingJSFun.options = LongPollingJSFun.sethttpOption_token(url, port, '/webresources/EventMgmt/long-polling/', 'post', token);
                        break;
                }
            } else {
                if (typeof url === 'undefined' || typeof port === 'undefined' || typeof username === 'undefined' || typeof pwd === 'undefined' ||
                        url === '' || port === '' || username === '' || pwd === '') {
                    statusNode.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                LongPollingJSFun.options = LongPollingJSFun.sethttpOption(url, port, '/webresources/EventMgmt/long-polling/', 'post', username, pwd);
            }
            statusNode.status({fill: "green", shape: "ring", text: "pending"});
            LongPollingJSFun.pending = true;
            longpolling(node, msg, url, port, username, pwd, statusNode);
        });
    }

    function longpolling(node, msg, url, port, username, pwd, statusNode) {        
        LongPollingJSFun.submit(url, port, '/webresources/EventMgmt/long-polling/', 'post', username, pwd, LongPollingJSFun.getjsoncontentData(), function (res_success) {
            try {
                var obj = JSON.parse(res_success);
                var length = parseInt(obj['result']['item'].length);
                for (var index = 0; index < length; index++) {
                    msg.payload = obj['result']['item'][index];
                    node.send(msg);
                    LongPollingJSFun.eventid = obj['result']['item'][index]['eventID'];
                }
            } catch (e) {
            }
            
            if(!LongPollingJSFun.deplyed){
//                LongPollingJSFun.pending = false;
//                LongPollingJSFun.deplyed = true;
                longpolling(node, msg, url, port, username, pwd, statusNode);
            }else{
                LongPollingJSFun.eventid = 0;
                LongPollingJSFun.pending = false;
            }
        }, function (res_error) {
            statusNode.status({fill: "red", shape: "ring", text: res_error});
//            LongPollingJSFun.pending = false;
        });
    }
    ;


    RED.nodes.registerType("LongPolling", LongPollingNode);
};