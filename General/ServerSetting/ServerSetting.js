var http = require('http');
var serversettingJSFun = {};
serversettingJSFun.options = {
    host: 'localhost',
    port: '8080',
    path: '/webresources',
    method: 'GET',
    headers: {'Authorization': 'Basic ',
        'Accept': 'application/json',
        'Content-Type': 'application/json'}
};

serversettingJSFun.sethttpOption = function (host, port, path, method, user, pwd) {
    serversettingJSFun.options.host = host;
    serversettingJSFun.options.port = port;
    serversettingJSFun.options.path = path;
    serversettingJSFun.options.method = method;
    serversettingJSFun.options.headers.Authorization = 'Basic ' + new Buffer(user + ":" + pwd).toString('base64');
    return serversettingJSFun.options;
};

serversettingJSFun.submit = function (url, port, path, method, username, pwd, jsonStringData, res_success, res_error) {
    var options = this.sethttpOption(url, port, path, method, username, pwd);
    var req = http.request(options, function (response) {
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

module.exports = function (RED) {
    function credentialNode(config) {
        RED.nodes.createNode(this, config);
        this.susiaccess_name = config.susiaccess_name;
    }
    RED.nodes.registerType("credential", credentialNode, {
        credentials: {
            susiaccess_name: {type: "text"},
            token: {type: "text"},
            code: {type: "text"}
        }
    });

    function ServerSettingNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.status({});
        this.on('input', function (msg) {
            node.status({fill: "red", shape: "ring", text: "sending"});
            var url = config.url;
            var port = config.port;
            var location = config.location;
            var flag = config.flag;
            var encodestr = config.encodestr;
            var connectype = config.connectype;
            switch (connectype) {
                case 'oauth':
                    var credentials = RED.nodes.getCredentials(config.sa_credential);
                    if (typeof credentials === 'undefined') {
                        node.status({fill: "red", shape: "ring", text: "need authorized"});
                        return;
                    }
                    var code = credentials.code;
                    var token = credentials.token;
                    if (token === '') {
                        var callback = location.protocol + "//" + location.hostname + ":" + location.port;
                        serversettingJSFun.submit(url, port, '/webresources/Auth/token?grant_type=authorization_code&code=' + code + '&redirect_uri=' + callback + '/susiaccess-credentials/' + config.sa_credential + '/auth/callback', 'post', '', '', '', function (res_success) {
                            var data = JSON.parse(res_success);
                            //console.log(data.access_token);
                            var credentials = {};
                            credentials.susiaccess_name = config.sa_credential;
                            credentials.token = data.access_token;
                            credentials.code = code;
                            RED.nodes.addCredentials(credentials.susiaccess_name, credentials);
                            node.status({fill: "green", shape: "dot", text: 'done'});
                            token = data.access_token;
                            msg.token = token;
                            msg.url = url;
                            msg.port = port;
                            msg.flag = flag;
                            msg.connectype = connectype;
                            node.send(msg);
                        }, function (res_error) {
                            node.status({fill: "red", shape: "ring", text: res_error});
                        });
                    }
                    else {
                        //console.log(token);
                        node.status({fill: "green", shape: "dot", text: 'done'});
                        msg.token = token;
                        msg.url = url;
                        msg.port = port;
                        msg.flag = flag;
                        msg.connectype = connectype;
                        node.send(msg);
                    }
                    break;
                case 'basic':
                    node.status({fill: "green", shape: "dot", text: 'done'});
                    msg.url = url;
                    msg.port = port;
                    msg.flag = flag;
                    msg.encodestr = encodestr;
                    msg.connectype = connectype;
                    node.send(msg);
                    break;
            }
        });
    }

    RED.nodes.registerType("ServerSetting", ServerSettingNode);

    RED.httpAdmin.get('/credentials/susiaccess-credentials/:id/auth', function (req, res) {
        var resultitme = new Object();
        try {
            var credentials = RED.nodes.getCredentials(req.params.id);
            var code = credentials.code;
            resultitme.result = 'success';
            resultitme.code = code;
            res.send(JSON.stringify(resultitme));
        } catch (e) {
            resultitme.result = 'fail';
            res.send(JSON.stringify(resultitme));
        }
    });

    RED.httpAdmin.get('/susiaccess-credentials/:id/auth/callback', function (req, res) {
        var code = req.query.code;
        var error = req.query.error;
        if (typeof code !== 'undefined') {
            var credentials = {};
            credentials.susiaccess_name = req.params.id;
            credentials.code = code;
            credentials.token = '';
            RED.nodes.addCredentials(req.params.id, credentials);
            res.send('Authorized, please go back Node Red.');
        } else {
            res.send('Authorized fail, error.');
        }
    });
};