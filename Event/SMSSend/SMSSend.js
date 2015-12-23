var http = require('http');
var SMSSendJSFun = {};
SMSSendJSFun.options = {
    host: 'localhost',
    port: '8080',
    path: '/webresources',
    method: 'GET',
    headers: {'Authorization': 'Basic ',
        'Accept': 'application/json',
        'Content-Type': 'application/json'}
};

SMSSendJSFun.sethttpOption = function (host, port, path, method, user, pwd) {
    SMSSendJSFun.options.host = host;
    SMSSendJSFun.options.port = port;
    SMSSendJSFun.options.path = path;
    SMSSendJSFun.options.method = method;
    SMSSendJSFun.options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
    SMSSendJSFun.options.headers.Accesstoken = '';
    return SMSSendJSFun.options;
};

SMSSendJSFun.sethttpOption_token = function (host, port, path, method, token) {
    SMSSendJSFun.options.host = host;
    SMSSendJSFun.options.port = port;
    SMSSendJSFun.options.path = path;
    SMSSendJSFun.options.method = method;
    SMSSendJSFun.options.headers.Authorization = '';
    SMSSendJSFun.options.headers.Accesstoken = 'Bearer ' + token;
    return SMSSendJSFun.options;
};

SMSSendJSFun.submit = function (url, port, path, method, username, pwd, jsonStringData, res_success, res_error) {
//    var options = this.sethttpOption(url, port, path, method, username, pwd);
    var req = http.request(SMSSendJSFun.options, function (response) {
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

SMSSendJSFun.getjsoncontentData = function (config, smsaccount, encryptpwd) {
    var smsapi = config.smsapi;
    var smsaccount = smsaccount;
    var smspwd = encryptpwd;
    var smsphone = config.smsphone;
    var smscontent = config.smscontent;
    var objitem = new Object();
    objitem.phone = smsphone;
    objitem.content = smscontent;
    objitem.sms_apiid = smsapi;
    objitem.sms_account = smsaccount;
    objitem.sms_passwd = smspwd;
    var objreq = new Object();
    objreq.request = objitem;
    return JSON.stringify(objreq);
};
module.exports = function (RED) {
    function SMSSendNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.status({});
        this.on('input', function (msg) {
            var url = msg.url;
            var port = msg.port;
            var username = msg.username;
            var pwd = msg.pwd;
            //var smspwd = config.smspwd;
            var smsencodestr = config.smsencodestr;
            var smsdecoder = new Buffer(smsencodestr, 'base64').toString();
            var smsaccount = smsdecoder.split("$")[0];
            var smspwd = smsdecoder.split("$")[1];
            var statusNode = this;
            var flag = msg.flag;
            var encodestr = msg.encodestr;
            var token = msg.token;
            var connectype = msg.connectype;

            if (typeof msg.smsapi !== 'undefined' && msg.smsapi !== '')
                config.smsapi = msg.smsapi;
            if (typeof msg.smsaccount !== 'undefined' && msg.smsaccount !== '')
                smsaccount = msg.smsaccount;
            if (typeof msg.smspwd !== 'undefined' && msg.smspwd !== '')
                smspwd = msg.smspwd;
            if (typeof msg.smsphone !== 'undefined' && msg.smsphone !== '')
                config.smsphone = msg.smsphone;
            if (typeof msg.smscontent !== 'undefined' && msg.smscontent !== '')
                config.smscontent = msg.smscontent;

            if (smspwd === '') {
                statusNode.status({fill: "red", shape: "ring", text: "miss smspwd parameters"});
                return;
            }
            statusNode.status({fill: "red", shape: "ring", text: "sending"});
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
                        SMSSendJSFun.options = SMSSendJSFun.sethttpOption(url, port, '/webresources/APIInfoMgmt/getEncryptPwd/' + smspwd, 'get', username, pwd);
                        break;
                    case 'oauth':
                        SMSSendJSFun.options = SMSSendJSFun.sethttpOption_token(url, port, '/webresources/APIInfoMgmt/getEncryptPwd/' + smspwd, 'get', token);
                        break;
                }
            } else {
                if (typeof url === 'undefined' || typeof port === 'undefined' || typeof username === 'undefined' || typeof pwd === 'undefined' ||
                        url === '' || port === '' || username === '' || pwd === '') {
                    statusNode.status({fill: "red", shape: "ring", text: "miss server parameters"});
                    return;
                }
                SMSSendJSFun.options = SMSSendJSFun.sethttpOption(url, port, '/webresources/APIInfoMgmt/getEncryptPwd/' + smspwd, 'get', username, pwd);
            }
            SMSSendJSFun.submit(url, port, '/webresources/APIInfoMgmt/getEncryptPwd/' + smspwd, 'get', username, pwd, '', function (res_success) {
                try {
                    if (flag === 'encode') {
                        switch (connectype) {
                            case 'basic':
                                var decoder = new Buffer(encodestr, 'base64').toString();
                                username = decoder.split("$")[0];
                                pwd = decoder.split("$")[1];
                                SMSSendJSFun.options = SMSSendJSFun.sethttpOption(url, port, '/webresources/MsgNotify/sendSMS', 'post', username, pwd);
                                break;
                            case 'oauth':
                                SMSSendJSFun.options = SMSSendJSFun.sethttpOption_token(url, port, '/webresources/MsgNotify/sendSMS', 'post', token);
                                break;
                        }
                    } else {
                        SMSSendJSFun.options = SMSSendJSFun.sethttpOption(url, port, '/webresources/MsgNotify/sendSMS', 'post', username, pwd);
                    }
                    var obj = JSON.parse(res_success);
                    SMSSendJSFun.submit(url, port, '/webresources/MsgNotify/sendSMS', 'post', username, pwd, SMSSendJSFun.getjsoncontentData(config, smsaccount, obj['result']['encryptPwd']), function (send_success) {
                        msg.payload = send_success;
                        node.send(msg);
                        statusNode.status({fill: "green", shape: "dot", text: "done"});
                    }, function (send_error) {
                        statusNode.status({fill: "red", shape: "ring", text: send_error});
                    });
                } catch (e) {
                    statusNode.status({fill: "red", shape: "ring", text: 'parse fail'});
                }
            }, function (res_error) {
                statusNode.status({fill: "red", shape: "ring", text: res_error});
            });
        });
    }

    RED.nodes.registerType("SMSSend", SMSSendNode);
};