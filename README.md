nkk (npm proxy manager)
===



## Features

`nkk` 可以帮助你管理 proxy 地址列表，快速切换 npm 使用的 proxy。

`nkk` can help you manage proxies list, easy and fast switch between different proxies.


## Install
```
$ npm install -g nkk
```
## Usage

Usage: nkk [options] [command]
```
Commands:

ls                    List all the proxies
use <proxy>           Set npm config proxy to the selected proxy
add <proxy> <url>     Add one custom proxy
del <proxy>           Delete one custom proxy
test [proxy]          Show the response time for one or all proxies
stop                  Disable all proxies
help                  Print this help


Options:

-h, --help          output usage information
-V, --version       output the version number
    
```
## Example

- 添加代理：
```
$ nkk add myproxy1 http://user:pass@proxy-address:port

    add proxy "myproxy1" success

```
- 查看所有已添加的代理（当前使用的代理前面有 * 号）：
```
$ nkk ls

    myproxy1 -----  http://user:pass@proxy-address:port
  * myproxy2 -----  http://user2:pass2@proxy-address:port

```
- 使用某个代理：
```
$ nkk use myproxy1
     
    Proxy has been set to: "http://user:pass@proxy-address:port" !
     
  * myproxy1 -----  http://user:pass@proxy-address:port
    myproxy2 -----  http://user2:pass2@proxy-address:port
          
```
- 停止使用代理：
```
$ nkk stop

   Proxy has been set to disabled !

   myproxy1 -----  http://user:pass@proxy-address:port
   myproxy2 -----  http://user2:pass2@proxy-address:port
    
```
- 代理测速：
```
$ nkk test

   myproxy1 ---- 39ms
   myproxy2 --- Fetch Error

```
-  删除某个代理：
```
$ nkk del myproxy2

   delete proxy "myproxy2" success
     
   myproxy1 -----  http://user:pass@proxy-address:port

```

## License

MIT©[kakusiilong](https://github.com/kakusilong/nkk)
