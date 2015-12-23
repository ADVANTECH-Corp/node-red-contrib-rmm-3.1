var http = require('http');
var SQLQueryJSFun = {};
SQLQueryJSFun.options = {
    host: 'localhost',
    port: '8080',
    path: '/webresources',
    method: 'GET',
    headers: {'Authorization': 'Basic ',
        'Accept': 'application/json',
        'Content-Type': 'application/json'}
};

SQLQueryJSFun.sethttpOption = function (host, port, path, method, user, pwd) {
    SQLQueryJSFun.options.host = host;
    SQLQueryJSFun.options.port = port;
    SQLQueryJSFun.options.path = path;
    SQLQueryJSFun.options.method = method;
    SQLQueryJSFun.options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
    SQLQueryJSFun.options.headers.Accesstoken = '';
    return SQLQueryJSFun.options;
};

SQLQueryJSFun.sethttpOption_token = function (host, port, path, method, token) {
    SQLQueryJSFun.options.host = host;
    SQLQueryJSFun.options.port = port;
    SQLQueryJSFun.options.path = path;
    SQLQueryJSFun.options.method = method;
    SQLQueryJSFun.options.headers.Authorization = '';
    SQLQueryJSFun.options.headers.Accesstoken = 'Bearer ' + token;
    return SQLQueryJSFun.options;
};

SQLQueryJSFun.submit = function (url, port, path, method, username, pwd, jsonStringData, res_success, res_error) {
//    var options = this.sethttpOption(url, port, path, method, username, pwd);
    var req = http.request(SQLQueryJSFun.options, function (response) {
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

SQLQueryJSFun.getjsoncontentData = function (config) {
    var tablename = config.tablename;
    var selectFields = config.selectFields;
    var condictions_op = config.cond_op;
    var condictions = config.conditions;
    var offset = config.offset;
    var limit = config.limit;
    var orderBy = config.orderby;
    var objselectfielditem = new Object();
    var fieldArray = [];
    for (var index = 0; index < selectFields.length; index++) {
        var fieldName = selectFields[index].name;
        var checked = selectFields[index].checked;
        if (checked)
            fieldArray.push({"@tableField": "" + tablename + "." + fieldName + ""});
    }
    var cond_op = {"@value": "" + condictions_op + ""};
    var objcondsitem = new Object();
    var condsArray = [];
    for (var index = 0; index < condictions.length; index++) {
        var fieldName = condictions[index].name;
        var operator = condictions[index].op;
        var operatorchar;
        var value = condictions[index].value;
        if (operator === 'equ') {
            operatorchar = '=';
        } else if (operator === 'notequ') {
            operatorchar = '!=';
        } else if (operator === 'less') {
            operatorchar = '<';
        } else if (operator === 'lessequ') {
            operatorchar = '<=';
        } else if (operator === 'large') {
            operatorchar = '>';
        } else if (operator === 'largeequ') {
            operatorchar = '>=';
        } else {
            operatorchar = operator;
        }
        condsArray.push({
            "@tableField": "" + tablename + "." + fieldName + "",
            "@operator": "" + operatorchar + "",
            "@value": "" + value + ""
        });
    }
    var objordersitem = new Object();
    var ordersArray = [];
    for (var index = 0; index < orderBy.length; index++) {
        var fieldName = orderBy[index].name;
        var type = orderBy[index].type;
        ordersArray.push({"@tableField": "" + tablename + "." + fieldName + "",
            "@value": "" + type + ""});
    }
    objselectfielditem.item = fieldArray;
    objcondsitem.item = condsArray;
    objordersitem.item = ordersArray;
    var objFields = new Object();
    if (selectFields.length !== 0)
        objFields.selectFields = objselectfielditem;
    objFields.condictions_op = cond_op;
    if (condictions.length !== 0)
        objFields.condictions = objcondsitem;
    if (offset !== '')
        objFields.offset = {"@value": "" + offset + ""};
    if (limit !== '')
        objFields.limit = {"@value": "" + limit + ""};
    if (orderBy.length !== 0)
        objFields.orderBy = objordersitem;
    var objreq = new Object();
    objreq.request = objFields;
    return JSON.stringify(objreq);
};

module.exports = function (RED) {
    function SQLQueryNode(config) {
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
                        SQLQueryJSFun.options = SQLQueryJSFun.sethttpOption(url, port, '/webresources/SQLMgmt/qryData', 'post', username, pwd);
                        break;
                    case 'oauth':
                        SQLQueryJSFun.options = SQLQueryJSFun.sethttpOption_token(url, port, '/webresources/SQLMgmt/qryData', 'post', token);
                        break;
                }
            } else {
                if (typeof url === 'undefined' || typeof port === 'undefined' || typeof username === 'undefined' || typeof pwd === 'undefined' ||
                        url === '' || port === '' || username === '' || pwd === '') {
                    node.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                SQLQueryJSFun.options = SQLQueryJSFun.sethttpOption(url, port, '/webresources/SQLMgmt/qryData', 'post', username, pwd);
            }

            if (typeof msg.tablename !== 'undefined' && msg.tablename !== '')
                config.tablename = msg.tablename;

            if (typeof msg.selectFields !== 'undefined' && msg.selectFields !== '')
                config.selectFields = msg.selectFields;
            
            if (typeof msg.cond_op !== 'undefined' && msg.cond_op !== '')
                config.cond_op = msg.cond_op;

            if (typeof msg.conditions !== 'undefined' && msg.conditions !== '')
                config.conditions = msg.conditions;
            
            if (typeof config.selectFields === 'undefined' || config.selectFields === '') {
                node.status({fill: "red", shape: "ring", text: "miss selectFields parameters"});
                return;
            }
            
            if (typeof config.cond_op === 'undefined' || config.cond_op === '') {
                node.status({fill: "red", shape: "ring", text: "miss cond_op parameters"});
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

            SQLQueryJSFun.submit(url, port, '/webresources/SQLMgmt/qryData', 'post', username, pwd, SQLQueryJSFun.getjsoncontentData(config), function (res_success) {
                msg.payload = res_success;
                node.send(msg);
                node.status({fill: "green", shape: "dot", text: 'done'});
            }, function (res_error) {
                node.status({fill: "red", shape: "ring", text: res_error});
            });
        });
    }

    RED.nodes.registerType("SQLQuery", SQLQueryNode);
};