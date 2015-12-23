var http = require('http');
var NoSQLQueryJSFun = {};
NoSQLQueryJSFun.options = {
    host: 'localhost',
    port: '8080',
    path: '/webresources',
    method: 'GET',
    headers: {'Authorization': 'Basic ',
        'Accept': 'application/json',
        'Content-Type': 'application/json'}
};

NoSQLQueryJSFun.sethttpOption = function (host, port, path, method, user, pwd) {
    NoSQLQueryJSFun.options.host = host;
    NoSQLQueryJSFun.options.port = port;
    NoSQLQueryJSFun.options.path = path;
    NoSQLQueryJSFun.options.method = method;
    NoSQLQueryJSFun.options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
    NoSQLQueryJSFun.options.headers.Accesstoken = '';
    return NoSQLQueryJSFun.options;
};

NoSQLQueryJSFun.sethttpOption_token = function (host, port, path, method, token) {
    NoSQLQueryJSFun.options.host = host;
    NoSQLQueryJSFun.options.port = port;
    NoSQLQueryJSFun.options.path = path;
    NoSQLQueryJSFun.options.method = method;
    NoSQLQueryJSFun.options.headers.Authorization = '';
    NoSQLQueryJSFun.options.headers.Accesstoken = 'Bearer ' + token;
    return NoSQLQueryJSFun.options;
};

NoSQLQueryJSFun.submit = function (url, port, path, method, username, pwd, jsonStringData, res_success, res_error) {
//    var options = this.sethttpOption(url, port, path, method, username, pwd);
    var req = http.request(NoSQLQueryJSFun.options, function (response) {
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

NoSQLQueryJSFun.getjsoncontentData = function (config) {
    var collectionname = config.collectionname;
    var projectnames = config.projectnames;
    var matchnames = config.matchnames;
    var skip = config.skip;
    var limit = config.limit;
    var sortnames = config.sortnames;
    var pipelineArray = [];    
    var objproject = new Object();
    for (var index in projectnames) {
        var projectname = projectnames[index].projectname;
        objproject[projectname] = 1;
    }
    var objmatch = new Object();
    var objoperator = new Object();
    for (var index in matchnames) {
        var matchname = matchnames[index].matchname;
        var operator = matchnames[index].operator;
        var value = matchnames[index].value;
        var type = matchnames[index].type;
        if (type === 'val')
            objoperator[operator] = parseFloat(value);
        else
            objoperator[operator] = value;
        objmatch[matchname] = objoperator;
    }
    var objsort = new Object();
    for (var index in sortnames) {
        var sortname = sortnames[index].sortname;
        var sorttype = sortnames[index].sorttype;
        if (sorttype === 'asc') {
            objsort[sortname] = 1;
        } else {
            objsort[sortname] = -1;
        }
    }
    var objpipelineListproject = new Object();
    if(projectnames.length !== 0){
        objpipelineListproject.$project = objproject;
        pipelineArray.push(objpipelineListproject);
    }        
    var objpipelineListmatch = new Object();
    if(matchnames.length !== 0){
        objpipelineListmatch.$match = objmatch;
        pipelineArray.push(objpipelineListmatch);
    }    
    
    if (!isNaN(parseInt(limit))) {
        var objpipelineListlimit = new Object();
        objpipelineListlimit.$limit = parseInt(limit);
        pipelineArray.push(objpipelineListlimit);
    }
    if (!isNaN(parseInt(skip))) {
        var objpipelineListskip = new Object();
        objpipelineListskip.$skip = parseInt(skip);
        pipelineArray.push(objpipelineListskip);
    }
    var objpipelineListsort = new Object();
    if(sortnames.length !== 0){
        objpipelineListsort.$sort = objsort;
        pipelineArray.push(objpipelineListsort);
    }    
    
    var objFields = new Object();
    objFields.collectionName = collectionname;
    objFields.pipelineList = pipelineArray;
    var objreq = new Object();
    objreq.request = objFields;
    return JSON.stringify(objreq);
};

module.exports = function (RED) {
    function NoSQLQueryNode(config) {
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
                        NoSQLQueryJSFun.options = NoSQLQueryJSFun.sethttpOption(url, port, '/webresources/NoSQLMgmt/qryData', 'post', username, pwd);
                        break;
                    case 'oauth':
                        NoSQLQueryJSFun.options = NoSQLQueryJSFun.sethttpOption_token(url, port, '/webresources/NoSQLMgmt/qryData', 'post', token);
                        break;
                }
            } else {
                if (typeof url === 'undefined' || typeof port === 'undefined' || typeof username === 'undefined' || typeof pwd === 'undefined' ||
                        url === '' || port === '' || username === '' || pwd === '') {
                    node.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                NoSQLQueryJSFun.options = NoSQLQueryJSFun.sethttpOption(url, port, '/webresources/NoSQLMgmt/qryData', 'post', username, pwd);
            }

            if (typeof msg.collectionname !== 'undefined' && msg.collectionname !== '')
                config.collectionname = msg.collectionname;

            if (typeof msg.projectnames !== 'undefined' && msg.projectnames !== '')
                config.projectnames = msg.projectnames;

            if (typeof msg.matchnames !== 'undefined' && msg.matchnames !== '')
                config.matchnames = msg.matchnames;

            if (typeof msg.skip !== 'undefined' && msg.skip !== '')
                config.skip = msg.skip;

            if (typeof msg.limit !== 'undefined' && msg.limit !== '')
                config.limit = msg.limit;
            if (typeof msg.sortnames !== 'undefined' && msg.sortnames !== '')
                config.sortnames = msg.sortnames;

            if (typeof config.collectionname === 'undefined' || config.collectionname === '') {
                node.status({fill: "red", shape: "ring", text: "miss collection name parameters"});
                return;
            }
            node.status({fill: "green", shape: "dot", text: 'sending'});
            NoSQLQueryJSFun.submit(url, port, '/webresources/NoSQLMgmt/qryData', 'post', username, pwd, NoSQLQueryJSFun.getjsoncontentData(config), function (res_success) {
                msg.payload = res_success;
                node.send(msg);
                node.status({fill: "green", shape: "dot", text: 'done'});
            }, function (res_error) {
                node.status({fill: "red", shape: "ring", text: res_error});
            });
        });
    }

    RED.nodes.registerType("NoSQLQuery", NoSQLQueryNode);
};