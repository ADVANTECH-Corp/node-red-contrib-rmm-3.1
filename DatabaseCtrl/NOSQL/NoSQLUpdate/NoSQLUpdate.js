var http = require('http');
var NoSQLUpdateJSFun = {};
NoSQLUpdateJSFun.options = {
    host: 'localhost',
    port: '8080',
    path: '/webresources',
    method: 'GET',
    headers: {'Authorization': 'Basic ',
        'Accept': 'application/json',
        'Content-Type': 'application/json'}
};

NoSQLUpdateJSFun.sethttpOption = function (host, port, path, method, user, pwd) {
    NoSQLUpdateJSFun.options.host = host;
    NoSQLUpdateJSFun.options.port = port;
    NoSQLUpdateJSFun.options.path = path;
    NoSQLUpdateJSFun.options.method = method;
    NoSQLUpdateJSFun.options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
    NoSQLUpdateJSFun.options.headers.Accesstoken = '';
    return NoSQLUpdateJSFun.options;
};

NoSQLUpdateJSFun.sethttpOption_token = function (host, port, path, method, token) {
    NoSQLUpdateJSFun.options.host = host;
    NoSQLUpdateJSFun.options.port = port;
    NoSQLUpdateJSFun.options.path = path;
    NoSQLUpdateJSFun.options.method = method;
    NoSQLUpdateJSFun.options.headers.Authorization = '';
    NoSQLUpdateJSFun.options.headers.Accesstoken = 'Bearer ' + token;
    return NoSQLUpdateJSFun.options;
};

NoSQLUpdateJSFun.submit = function (url, port, path, method, username, pwd, jsonStringData, res_success, res_error) {
//    var options = this.sethttpOption(url, port, path, method, username, pwd);
    var req = http.request(NoSQLUpdateJSFun.options, function (response) {
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

NoSQLUpdateJSFun.getjsoncontentData = function (config) {
    var collectionname = config.collectionname;
    var condictions_op = config.cond_op;
    var conditions = config.conditions;
    var fields = config.fields;
    var condsArray = [];
    var objfieldsitem = new Object();
    for(var field in fields){
        var fieldname = fields[field].field;
        var value = fields[field].value;
        var type = fields[field].type;  
        if (type === 'val')
            objfieldsitem[fieldname] = parseFloat(value);
        else
            objfieldsitem[fieldname] = value;
    }
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
    objFields.fields = objfieldsitem;
    var objreq = new Object();
    objreq.request = objFields;
    return JSON.stringify(objreq);
};

module.exports = function (RED) {
    function NoSQLUpdateNode(config) {
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
                        NoSQLUpdateJSFun.options = NoSQLUpdateJSFun.sethttpOption(url, port, '/webresources/NoSQLMgmt/updateData', 'post', username, pwd);
                        break;
                    case 'oauth':
                        NoSQLUpdateJSFun.options = NoSQLUpdateJSFun.sethttpOption_token(url, port, '/webresources/NoSQLMgmt/updateData', 'post', token);
                        break;
                }
            } else {
                if (typeof url === 'undefined' || typeof port === 'undefined' || typeof username === 'undefined' || typeof pwd === 'undefined' ||
                        url === '' || port === '' || username === '' || pwd === '') {
                    node.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                NoSQLUpdateJSFun.options = NoSQLUpdateJSFun.sethttpOption(url, port, '/webresources/NoSQLMgmt/updateData', 'post', username, pwd);
            }

            if (typeof msg.collectionname !== 'undefined' && msg.collectionname !== '')
                config.collectionname = msg.collectionname;

            if (typeof msg.cond_op !== 'undefined' && msg.cond_op !== '')
                config.cond_op = msg.cond_op;

            if (typeof msg.conditions !== 'undefined' && msg.conditions !== '')
                config.conditions = msg.conditions;
            
            if (typeof msg.fields !== 'undefined' && msg.fields !== '')
                config.fields = msg.fields;

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
            if (typeof config.fields === 'undefined' || config.fields === '') {
                node.status({fill: "red", shape: "ring", text: "miss conditions parameters"});
                return;
            }
            node.status({fill: "green", shape: "dot", text: 'sending'});
            NoSQLUpdateJSFun.submit(url, port, '/webresources/NoSQLMgmt/updateData', 'post', username, pwd, NoSQLUpdateJSFun.getjsoncontentData(config), function (res_success) {
                msg.payload = res_success;
                node.send(msg);
                node.status({fill: "green", shape: "dot", text: 'done'});
            }, function (res_error) {
                node.status({fill: "red", shape: "ring", text: res_error});
            });
        });
    }

    RED.nodes.registerType("NoSQLUpdate", NoSQLUpdateNode);
};