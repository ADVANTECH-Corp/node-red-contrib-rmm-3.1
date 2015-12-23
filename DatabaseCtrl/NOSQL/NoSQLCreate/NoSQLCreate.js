var http = require('http');
var NoSQLCreateJSFun = {};
NoSQLCreateJSFun.options = {
    host: 'localhost',
    port: '8080',
    path: '/webresources',
    method: 'GET',
    headers: {'Authorization': 'Basic ',
        'Accept': 'application/json',
        'Content-Type': 'application/json'}
};

NoSQLCreateJSFun.sethttpOption = function (host, port, path, method, user, pwd) {
    NoSQLCreateJSFun.options.host = host;
    NoSQLCreateJSFun.options.port = port;
    NoSQLCreateJSFun.options.path = path;
    NoSQLCreateJSFun.options.method = method;
    NoSQLCreateJSFun.options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
    NoSQLCreateJSFun.options.headers.Accesstoken = '';
    return NoSQLCreateJSFun.options;
};

NoSQLCreateJSFun.sethttpOption_token = function (host, port, path, method, token) {
    NoSQLCreateJSFun.options.host = host;
    NoSQLCreateJSFun.options.port = port;
    NoSQLCreateJSFun.options.path = path;
    NoSQLCreateJSFun.options.method = method;
    NoSQLCreateJSFun.options.headers.Authorization = '';
    NoSQLCreateJSFun.options.headers.Accesstoken = 'Bearer ' + token;
    return NoSQLCreateJSFun.options;
};

NoSQLCreateJSFun.submit = function (url, port, path, method, username, pwd, jsonStringData, res_success, res_error) {
//    var options = this.sethttpOption(url, port, path, method, username, pwd);
    var req = http.request(NoSQLCreateJSFun.options, function (response) {
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

NoSQLCreateJSFun.getjsoncontentData = function (config) {
    var collectionname = config.collectionname;
    var data = config.data;
    var objitem = new Object();
    var fieldArray = [];
    for (var index in data) {
        var fieldName = data[index].name;
        fieldArray.push({"@fieldName": "" + fieldName + ""});
    }
    objitem.item = fieldArray;
    var objfields = new Object();
    objfields.collectionName = {"@value": "" + collectionname + ""};
    objfields.indexFields = objitem;
    var objreq = new Object();
    objreq.request = objfields;
    return JSON.stringify(objreq);
};

module.exports = function (RED) {
    function NoSQLCreateNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.status({});
        this.on('input', function (msg) {
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
                        NoSQLCreateJSFun.options = NoSQLCreateJSFun.sethttpOption(url, port, '/webresources/NoSQLMgmt/createCollection', 'post', username, pwd);
                        break;
                    case 'oauth':
                        NoSQLCreateJSFun.options = NoSQLCreateJSFun.sethttpOption_token(url, port, '/webresources/NoSQLMgmt/createCollection', 'post', token);
                        break;
                }
            } else {
                if (typeof url === 'undefined' || typeof port === 'undefined' || typeof username === 'undefined' || typeof pwd === 'undefined' ||
                        url === '' || port === '' || username === '' || pwd === '') {
                    node.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                NoSQLCreateJSFun.options = NoSQLCreateJSFun.sethttpOption(url, port, '/webresources/NoSQLMgmt/createCollection', 'post', username, pwd);
            }
            if (typeof msg.collectionname !== 'undefined' && msg.collectionname !== '')
                config.collectionname = msg.collectionname;
            if (typeof msg.data !== 'undefined' && msg.data !== '')
                config.data = msg.data;
            if (typeof config.collectionname === 'undefined' || config.collectionname === '') {
                node.status({fill: "red", shape: "ring", text: "miss table name parameters"});
                return;
            }
            node.status({fill: "green", shape: "dot", text: 'sending'});
            NoSQLCreateJSFun.submit(url, port, '/webresources/NoSQLMgmt/createCollection', 'post', username, pwd, NoSQLCreateJSFun.getjsoncontentData(config), function (res_success) {
                msg.payload = res_success;
                node.send(msg);
                node.status({fill: "green", shape: "dot", text: 'done'});
            }, function (res_error) {
                node.status({fill: "red", shape: "ring", text: res_error});
            });
        });
    }

    RED.nodes.registerType("NoSQLCreate", NoSQLCreateNode);
};