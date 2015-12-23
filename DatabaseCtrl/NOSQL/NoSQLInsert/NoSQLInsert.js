var http = require('http');
var NoSQLInsertJSFun = {};
NoSQLInsertJSFun.options = {
    host: 'localhost',
    port: '8080',
    path: '/webresources',
    method: 'GET',
    headers: {'Authorization': 'Basic ',
        'Accept': 'application/json',
        'Content-Type': 'application/json'}
};

NoSQLInsertJSFun.sethttpOption = function (host, port, path, method, user, pwd) {
    NoSQLInsertJSFun.options.host = host;
    NoSQLInsertJSFun.options.port = port;
    NoSQLInsertJSFun.options.path = path;
    NoSQLInsertJSFun.options.method = method;
    NoSQLInsertJSFun.options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
    NoSQLInsertJSFun.options.headers.Accesstoken = '';
    return NoSQLInsertJSFun.options;
};

NoSQLInsertJSFun.sethttpOption_token = function (host, port, path, method, token) {
    NoSQLInsertJSFun.options.host = host;
    NoSQLInsertJSFun.options.port = port;
    NoSQLInsertJSFun.options.path = path;
    NoSQLInsertJSFun.options.method = method;
    NoSQLInsertJSFun.options.headers.Authorization = '';
    NoSQLInsertJSFun.options.headers.Accesstoken = 'Bearer ' + token;
    return NoSQLInsertJSFun.options;
};

NoSQLInsertJSFun.submit = function (url, port, path, method, username, pwd, jsonStringData, res_success, res_error) {
//    var options = this.sethttpOption(url, port, path, method, username, pwd);
    var req = http.request(NoSQLInsertJSFun.options, function (response) {
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

NoSQLInsertJSFun.getjsoncontentData = function (config) {
    var collectionname = config.collectionname;
    var data = config.data;
    var fieldArray = [];
    var str = '';
    var objval = new Object();
    for (var index in data) { 
        var colName = data[index].colname;
        var value = data[index].value;
        var type = data[index].type;        
        str = str + '"' + colName + '" : ' + value;
        str = str + ',';
        if(type === 'val')
            objval[colName] = parseFloat(value);
        else
            objval[colName] = value;
    }

    fieldArray.push(objval);
    var objfields = new Object();
    objfields.collectionName = collectionname;
    objfields.data = fieldArray;
    var objreq = new Object();
    objreq.request = objfields;
    return JSON.stringify(objreq);
};

module.exports = function (RED) {
    function NoSQLInsertNode(config) {
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
                        NoSQLInsertJSFun.options = NoSQLInsertJSFun.sethttpOption(url, port, '/webresources/NoSQLMgmt/insertData', 'post', username, pwd);
                        break;
                    case 'oauth':
                        NoSQLInsertJSFun.options = NoSQLInsertJSFun.sethttpOption_token(url, port, '/webresources/NoSQLMgmt/insertData', 'post', token);
                        break;
                }
            } else {
                if (typeof url === 'undefined' || typeof port === 'undefined' || typeof username === 'undefined' || typeof pwd === 'undefined' ||
                        url === '' || port === '' || username === '' || pwd === '') {
                    node.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                NoSQLInsertJSFun.options = NoSQLInsertJSFun.sethttpOption(url, port, '/webresources/NoSQLMgmt/insertData', 'post', username, pwd);
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
            NoSQLInsertJSFun.submit(url, port, '/webresources/NoSQLMgmt/insertData', 'post', username, pwd, NoSQLInsertJSFun.getjsoncontentData(config), function (res_success) {
                msg.payload = res_success;
                node.send(msg);
                node.status({fill: "green", shape: "dot", text: 'done'});
            }, function (res_error) {
                node.status({fill: "red", shape: "ring", text: res_error});
            });
        });
    }

    RED.nodes.registerType("NoSQLInsert", NoSQLInsertNode);
};