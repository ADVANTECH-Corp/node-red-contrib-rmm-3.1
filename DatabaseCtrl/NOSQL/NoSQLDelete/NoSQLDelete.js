var http = require('http');
var NoSQLDeleteJSFun = {};
NoSQLDeleteJSFun.options = {
    host: 'localhost',
    port: '8080',
    path: '/webresources',
    method: 'GET',
    headers: {'Authorization': 'Basic ',
        'Accept': 'application/json',
        'Content-Type': 'application/json'}
};

NoSQLDeleteJSFun.sethttpOption = function (host, port, path, method, user, pwd) {
    NoSQLDeleteJSFun.options.host = host;
    NoSQLDeleteJSFun.options.port = port;
    NoSQLDeleteJSFun.options.path = path;
    NoSQLDeleteJSFun.options.method = method;
    NoSQLDeleteJSFun.options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
    NoSQLDeleteJSFun.options.headers.Accesstoken = '';
    return NoSQLDeleteJSFun.options;
};

NoSQLDeleteJSFun.sethttpOption_token = function (host, port, path, method, token) {
    NoSQLDeleteJSFun.options.host = host;
    NoSQLDeleteJSFun.options.port = port;
    NoSQLDeleteJSFun.options.path = path;
    NoSQLDeleteJSFun.options.method = method;
    NoSQLDeleteJSFun.options.headers.Authorization = '';
    NoSQLDeleteJSFun.options.headers.Accesstoken = 'Bearer ' + token;
    return NoSQLDeleteJSFun.options;
};

NoSQLDeleteJSFun.submit = function (url, port, path, method, username, pwd, jsonStringData, res_success, res_error) {
//    var options = this.sethttpOption(url, port, path, method, username, pwd);
    var req = http.request(NoSQLDeleteJSFun.options, function (response) {
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

NoSQLDeleteJSFun.getjsoncontentData = function (config) {
    var collectionname = config.collectionname;
    var condictions_op = config.cond_op;
    var conditions = config.conditions;
    var condsArray = [];
    for (var cond in conditions) {        
        var objcondsitem = new Object();
        var objsubcondition = new Object();
        var itemsArray = [];
        var colname = conditions[cond].colname;
        var operator = conditions[cond].operator;
        var value = conditions[cond].value;
        var type = conditions[cond].type;
        objcondsitem.field = colname;
        objcondsitem.operator = operator;
        if (type === 'val')
            objcondsitem.value = parseFloat(value);
        else
            objcondsitem.value = value;
        itemsArray.push(objcondsitem);
        objsubcondition.subCondiction = itemsArray;
        condsArray.push(objsubcondition);
    }

    var objFields = new Object();
    objFields.collectionName = collectionname;
    objFields.condictions_op = condictions_op;
    objFields.condiction = condsArray;
    var objreq = new Object();
    objreq.request = objFields;
    return JSON.stringify(objreq);
};

module.exports = function (RED) {
    function NoSQLDeleteNode(config) {
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
                        NoSQLDeleteJSFun.options = NoSQLDeleteJSFun.sethttpOption(url, port, '/webresources/NoSQLMgmt/delData', 'post', username, pwd);
                        break;
                    case 'oauth':
                        NoSQLDeleteJSFun.options = NoSQLDeleteJSFun.sethttpOption_token(url, port, '/webresources/NoSQLMgmt/delData', 'post', token);
                        break;
                }
            } else {
                if (typeof url === 'undefined' || typeof port === 'undefined' || typeof username === 'undefined' || typeof pwd === 'undefined' ||
                        url === '' || port === '' || username === '' || pwd === '') {
                    node.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                NoSQLDeleteJSFun.options = NoSQLDeleteJSFun.sethttpOption(url, port, '/webresources/NoSQLMgmt/delData', 'post', username, pwd);
            }

            if (typeof msg.collectionname !== 'undefined' && msg.collectionname !== '')
                config.collectionname = msg.collectionname;

            if (typeof msg.cond_op !== 'undefined' && msg.cond_op !== '')
                config.cond_op = msg.cond_op;

            if (typeof msg.conditions !== 'undefined' && msg.conditions !== '')
                config.conditions = msg.conditions;

            if (typeof config.collectionname === 'undefined' || config.collectionname === '') {
                node.status({fill: "red", shape: "ring", text: "miss table name parameters"});
                return;
            }
            if (typeof config.cond_op === 'undefined' || config.cond_op === '') {
                node.status({fill: "red", shape: "ring", text: "miss cond_op parameters"});
                return;
            }
            if (typeof config.conditions === 'undefined' || config.conditions === '') {
                node.status({fill: "red", shape: "ring", text: "miss conditions parameters"});
                return;
            }
            node.status({fill: "green", shape: "dot", text: 'sending'});
            NoSQLDeleteJSFun.submit(url, port, '/webresources/NoSQLMgmt/delData', 'post', username, pwd, NoSQLDeleteJSFun.getjsoncontentData(config), function (res_success) {
                msg.payload = res_success;
                node.send(msg);
                node.status({fill: "green", shape: "dot", text: 'done'});
            }, function (res_error) {
                node.status({fill: "red", shape: "ring", text: res_error});
            });
        });
    }

    RED.nodes.registerType("NoSQLDelete", NoSQLDeleteNode);
};