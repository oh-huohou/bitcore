#!/usr/bin/env node
import io from 'socket.io';
import logger from '../lib/logger';

const DEFAULT_PORT = 3380;

const opts = {
  port: parseInt(process.argv[2]) || DEFAULT_PORT
};

//这是一个使用Socket.IO构建的消息代理服务器，它允许多个客户端连接到同一个服务器，并通过服务器转发消息。
const server = io(opts.port.toString());
server.on('connection', socket => {
  socket.on('msg', data => {
    //当接收到msg事件时，服务器通过server.emit()函数将消息转发给所有连接的客户端。
    server.emit('msg', data);
  });
});

logger.info('Message broker server listening on port ' + opts.port);
