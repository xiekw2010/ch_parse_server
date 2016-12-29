## 为什么要有这个项目

parse_server & parse_dashboard 很好, 但是对一些中国的服务支持的没那么好, 另外他俩本来也没有结合在一起, 这里把他们俩结合在一起用了。

这个项目旨在解决一些中国定制化的服务。目前解决的有:

1. 使用国内的 JPush 来推送安卓的消息

2. 七牛 的 cdn 存储等等

3. 线上的 https 网站问题

## 怎么启动

1. 启动本地 mongo 服务, --dbpath 可以不选择加

```mongod --storageEngine wiredTiger --dbpath /data_server --port 27117```

如果出错, 可能要改一下文件夹的权限, 改成谁都可以读写

2. 修改一些项目的属性 ./server/server.js 里的一些常量, 比如 appId, masterkey, push 的配置等等

```npm install```

```npm start```

开始跑服务, 同时拥有数据服务和 dashboard 界面服务

## docker 部署

打包本地的 server

```docker build --rm -t ch_parse_server .```

开启数据库服务

```docker run -d -v /data_server/:/data/db -p 27117:27117 --name parse_mongo mongo --port 27117```

开启 docker 服务


```docker run -d --name china_parse -p 8080:8080 --link=parse_mongo:mongodb -it ch_parse_server```

这里涉及到的数据库端口以及 parse-server 端口根据你的不同情况来定。


## 常用命令

### 干掉某些端口的进程

lsof -iTCP:27017 -sTCP:LISTEN

kill -9 PID

### docker 不同环境问题

// 调试多个 ENV 的时候
docker run --rm  -it  -e PUSH_ENV="dev" \
-e NODE_ENV='dev' \
-p 8080:8080 \
ch_parse_server
