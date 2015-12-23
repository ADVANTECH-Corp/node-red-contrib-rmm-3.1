var http = require('http');
var SQLCreateJSFun = {};
SQLCreateJSFun.options = {
    host: 'localhost',
    port: '8080',
    path: '/webresources',
    method: 'GET',
    headers: {'Authorization': 'Basic ',
        'Accept': 'application/json',
        'Content-Type': 'application/json'}
};

SQLCreateJSFun.sethttpOption = function (host, port, path, method, user, pwd) {
    SQLCreateJSFun.options.host = host;
    SQLCreateJSFun.options.port = port;
    SQLCreateJSFun.options.path = path;
    SQLCreateJSFun.options.method = method;
    SQLCreateJSFun.options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
    SQLCreateJSFun.options.headers.Accesstoken = '';
    return SQLCreateJSFun.options;
};

SQLCreateJSFun.sethttpOption_token = function (host, port, path, method, token) {
    SQLCreateJSFun.options.host = host;
    SQLCreateJSFun.options.port = port;
    SQLCreateJSFun.options.path = path;
    SQLCreateJSFun.options.method = method;
    SQLCreateJSFun.options.headers.Authorization = '';
    SQLCreateJSFun.options.headers.Accesstoken = 'Bearer ' + token;
    return SQLCreateJSFun.options;
};

SQLCreateJSFun.submit = function (url, port, path, method, username, pwd, jsonStringData, res_success, res_error) {
//    var options = this.sethttpOption(url, port, path, method, username, pwd);
    var req = http.request(SQLCreateJSFun.options, function (response) {
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

SQLCreateJSFun.getjsoncontentData = function (config) {
    var tablename = config.tablename;
    var data = config.data;
    var objitem = new Object();
    var fieldArray = [];
    for (var index = 0; index < data.length; index++) {
        var fieldName = data[index].name;
        var fieldType = data[index].type;
        var length = data[index].length;
        var allowNULL = data[index].allownull;
        if (fieldType === 'character')
            fieldArray.push({"@fieldName": "" + fieldName + "", "@fieldType": "" + fieldType + "", "@length": "" + length + "", "@allowNULL": "" + allowNULL + ""});
        else
            fieldArray.push({"@fieldName": "" + fieldName + "", "@fieldType": "" + fieldType + "", "@allowNULL": "" + allowNULL + ""});
    }
    objitem.item = fieldArray;
    var objfields = new Object();
    objfields.tableName = {"@value": "" + tablename + ""};
    objfields.fields = objitem;
    var objreq = new Object();
    objreq.request = objfields;
    return JSON.stringify(objreq);
};

module.exports = function (RED) {
    function SQLCreateNode(config) {
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
                        SQLCreateJSFun.options = SQLCreateJSFun.sethttpOption(url, port, '/webresources/SQLMgmt/createTable', 'post', username, pwd);
                        break;
                    case 'oauth':
                        SQLCreateJSFun.options = SQLCreateJSFun.sethttpOption_token(url, port, '/webresources/SQLMgmt/createTable', 'post', token);
                        break;
                }
            } else {
                if (typeof url === 'undefined' || typeof port === 'undefined' || typeof username === 'undefined' || typeof pwd === 'undefined' ||
                        url === '' || port === '' || username === '' || pwd === '') {
                    node.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                SQLCreateJSFun.options = SQLCreateJSFun.sethttpOption(url, port, '/webresources/SQLMgmt/createTable', 'post', username, pwd);
            }
            if (typeof msg.tablename !== 'undefined' && msg.tablename !== '')
                config.tablename = msg.tablename;
            if (typeof msg.fields !== 'undefined' && msg.fields !== '')
                config.data = msg.fields;
            if (typeof config.tablename === 'undefined' || config.tablename === '') {
                node.status({fill: "red", shape: "ring", text: "miss table name parameters"});
                return;
            }
            SQLCreateJSFun.submit(url, port, '/webresources/SQLMgmt/createTable', 'post', username, pwd, SQLCreateJSFun.getjsoncontentData(config), function (res_success) {
                msg.payload = res_success;
                node.send(msg);
                node.status({fill: "green", shape: "dot", text: 'done'});
            }, function (res_error) {
                node.status({fill: "red", shape: "ring", text: res_error});
            });
        });
    }

    RED.nodes.registerType("SQLCreate", SQLCreateNode);
};