#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var program = require('commander');
var npm = require('npm');
var ini = require('ini');
var echo = require('node-echo');
var extend = require('extend');
var async = require('async');
var request = require('request');
var only = require('only');

var PKG = require('../package.json');
var proxies = require('./proxies.json');
var NKKRC = path.join(process.env.HOME, '.nkkrc');

program
    .version(PKG.version);

program
    .command('ls')
    .description('List all the proxies')
    .action(onList);

program
    .command('current')
    .description('Show current proxy ')
    .action(showCurrent);

program
    .command('stop')
    .description('Disable npm proxy')
    .action(onDisable);

program
    .command('use <proxy>')
    .description('Change npm proxy to selected proxy')
    .action(onUse);

program
    .command('add <proxy> <url>')
    .description('Add one custom proxy')
    .action(onAdd);

program
    .command('del <proxy>')
    .description('Delete one custom proxy')
    .action(onDel);

program
    .command('test [proxy]')
    .description('Show response time for specific or all proxies')
    .action(onTest);

program
    .command('help')
    .description('Print this help')
    .action(function () {
        program.outputHelp();
    });

program
    .parse(process.argv);

if (process.argv.length === 2) {
    program.outputHelp();
}else if(process.argv.length > 2){
    var p = process.argv[2];
    if(p!=='ls' && p!=='use' && p!=='add' && p!=='del' && p!=='test' && p!=='current' && p!=='stop' && p!=='help'){
        program.outputHelp();
    }
}

/*//////////////// cmd methods /////////////////*/

function onList() {
    getCurrentProxy(function(cur) {
        var info = [''];
        var allProxies = getAllProxy();
        Object.keys(allProxies).forEach(function(key) {
            var item = allProxies[key];
            var prefix = item.proxy === decodeURIComponent(cur) ? ' * ' : '   ';
            info.push(' '+ prefix + key + line(key, 8) + item.proxy);
        });
        //info.push('');
        printMsg(info);
    });
}

function showCurrent() {
    getCurrentProxy(function(cur) {
        var allProxies = getAllProxy();
        Object.keys(allProxies).forEach(function(key) {
            var item = allProxies[key];
            if (item.proxy === decodeURIComponent(cur)) {
                printMsg([key]);
                //return;
            }
        });
    });
}

function onDisable(){
    npm.load(function (err) {
        if (err) return exit(err);
        npm.commands.config(['del', 'proxy'], function (err) {
            if (err) return exit(err);
            console.log('                        ');
            printMsg(['    Proxy has been set to disabled !']);
            onList();
        })
    });
}

function onUse(name) {
    var allProxies = getAllProxy();
    if (allProxies.hasOwnProperty(name)) {
        var proxy = allProxies[name];
        npm.load(function (err) {
            if (err) return exit(err);
            npm.commands.config(['set', 'proxy', proxy.proxy], function (err) {
                if (err) return exit(err);
                console.log('                        ');
                var newR = npm.config.get('proxy');
                printMsg(['    Proxy has been set to: "' + newR +'" !']);
                onList();
            })
        });
    } else {
        printMsg(['','    Not find proxy: "' + name +'" !']);
        onList();
    }
}

function onDel(name) {
    var customProxies = getCustomProxy();
    if (!customProxies.hasOwnProperty(name)) return;
    getCurrentProxy(function(cur) {
        if (cur === customProxies[name].proxy) {
            onUse('');
        }
        delete customProxies[name];
        setCustomProxy(customProxies, function(err) {
            if (err) return exit(err);
            console.log('                        ');
            printMsg(['','    delete proxy "' + name + '" success !']);
            onList();
        });
    });
}

function onAdd(name, url) {
    var customProxies = getCustomProxy();
    if (customProxies.hasOwnProperty(name)) {
        printMsg(['','    proxy ' + name + ' has already existed !']);
        //return;
    }else if(IsURL(url)) {
        var config = customProxies[name] = {};
        //if (url[url.length - 1] !== '/') url += '/'; // ensure url end with /
        config.proxy = url;
        setCustomProxy(customProxies, function (err) {
            if (err) return exit(err);
            printMsg(['', '    add proxy "' + name + '" success !']);
            onList();
        });
    }
}

function onTest(proxy) {
    var allProxies = getAllProxy();

    var toTest;

    if (proxy) {
        if (!allProxies.hasOwnProperty(proxy)) {
            return;
        }
        toTest = only(allProxies, proxy);
    } else {
        toTest = allProxies;
    }

    async.map(Object.keys(toTest), function(name, cbk) {
        var proxy = toTest[name];
        var start = +new Date();
        request(proxy.proxy + 'pedding', function(error) {
            cbk(null, {
                name: name,
                proxy: proxy.proxy,
                time: (+new Date() - start),
                error: !!error
            });
        });
    }, function(err, results) {
        getCurrentProxy(function(cur) {
            var msg = [''];
            results.forEach(function(result) {
                var prefix = result.proxy === decodeURIComponent(cur) ? ' * ' : '   ';
                var suffix = result.error ? 'Fetch Error' : result.time + 'ms';
                msg.push(prefix + result.name + line(result.name, 8) + suffix);
            });
            msg.push('');
            printMsg(msg);
        });
    });
}



/*//////////////// helper methods /////////////////*/

/*
 * get current proxy
 */
function getCurrentProxy(cbk) {
    npm.load(function(err) {
        if (err) return exit(err);
        cbk(npm.config.get('proxy'));
    });
}

function getCustomProxy() {
    return fs.existsSync(NKKRC) ? ini.parse(fs.readFileSync(NKKRC, 'utf-8')) : {};
}

function setCustomProxy(config, cbk) {
    echo(ini.stringify(config), '>', NKKRC, cbk);
}

function getAllProxy() {
    return extend({}, proxies, getCustomProxy());
}

function printErr(err) {
    console.error('an error occured: ' + err);
}

function printMsg(infos) {
    infos.forEach(function(info) {
        console.log(info);
    });
}

/*
 * print message & exit
 */
function exit(err) {
    printErr(err);
    process.exit(1);
}

function line(str, len) {
    var line = new Array(Math.max(1, len - str.length)).join('-');
    return ' ' + line + ' ';
}

function IsURL(str_url){
    var isValid = false;
    var strRegex = ""
        +"^((https|http)?://)"
        + "(([0-9].)[0-9]" // IP形式的URL- 199.194.52.184
        + "|" // 允许IP和DOMAIN（域名）
        + "([0-9a-z_!~*'()-]+.)*" // 域名-
        + "([0-9a-z][0-9a-z-])?[0-9a-z]." // 二级域名
        + "[a-z])" // first level domain- .com or .museum
        + "(:[0-9])?"; // 端口- :80
    var re=new RegExp(strRegex);
    //re.test()
    if (re.test(str_url)){
        isValid = true;
    }else{
        printMsg(['', '    error: "'+ str_url +'" is not a valid proxy url !']);
        isValid = false;
    }
    return (function(){return isValid;})();
}