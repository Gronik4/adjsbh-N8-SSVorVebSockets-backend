const http = require('http');
const Koa = require('koa');
const WS = require('ws');
const fs = require('fs');
const uuid = require('uuid');

const app = new Koa();

const server = http.createServer(app.callback());
const wsServer = new WS.Server({server});
wsServer.on('connection', (user) => {
  
  user.on('message', (msg) => {
    const messString = fs.readFileSync('saving/messages.json');
    const onlineSt = fs.readFileSync('saving/online.json');
    // При подключении к серверу
    if(msg === 'start') {
      user.send(JSON.stringify(onlineSt));
      user.send(JSON.stringify(messString));
    } else {
      const parsMessClient = JSON.parse((msg));
    // При получении сообщения в чат 
      if(parsMessClient.mess) {
        const messObj = JSON.parse(messString);
        if(messObj.messages.length > 20) { messObj.messages.pop(); }
        messObj.messages.unshift(parsMessClient.mess);
        const saved = JSON.stringify(messObj, null, 2);
        fs.writeFileSync('saving/messages.json', saved);
        [...wsServer.clients].filter((item) => item.readyState === WS.OPEN).forEach((each) => each.send(msg));
      }
    // Если входит зарегистрированный user

      if(parsMessClient.entre) {
        const onlineOb = JSON.parse(onlineSt);
        onlineOb.onlines.push(parsMessClient.entre);
        const newOnlinSt = JSON.stringify(onlineOb, null, 2);
        fs.writeFileSync('saving/online.json', newOnlinSt);
        const postServer = {author: `Сервер`, mess: `Вернулся ${parsMessClient.entre.nik}. Привет! Заждались мы Вас!!`};
        const messObj = JSON.parse(messString);
        if(messObj.messages.length > 20) { messObj.messages.pop(); }
        messObj.messages.unshift(postServer);
        const saved = JSON.stringify(messObj, null, 2);
        fs.writeFileSync('saving/messages.json', saved);
        const greeting = JSON.stringify({mess: postServer});
        const userSt = JSON.stringify({onlin: parsMessClient.entre});
        [...wsServer.clients].filter((item) => item.readyState === WS.OPEN).forEach((each) =>{
          each.send(greeting);
          each.send(userSt); ;
        }); 
      }
    // Если user пытается регистрироваться
      if(parsMessClient.registered) {
        const regSt = fs.readFileSync('saving/registered.json');
        const regOb = JSON.parse(regSt);
        if(regOb.registered.find((item) => item.nik === parsMessClient.registered.nik)) {
          user.send('busy');
        } else {
          const userId = uuid.v4();
          const newUser = {nik: parsMessClient.registered.nik, id: userId};
          regOb.registered.push(newUser);
          const savReg = JSON.stringify(regOb, null, 2);
          fs.writeFileSync('saving/registered.json', savReg);
          const onRegistr = JSON.stringify({registered: newUser});
          user.send(onRegistr);
          const onlineOb = JSON.parse(onlineSt);
          onlineOb.onlines.push(newUser);
          const savOnline = JSON.stringify(onlineOb, null, 2);
          fs.writeFileSync('saving/online.json', savOnline);
          const postServer = {author: `Сервер`, mess: `К нам подключился ${parsMessClient.registered.nik}. Добро пожаловать!!`};
          const messObj = JSON.parse(messString);
          if(messObj.messages.length > 20) { messObj.messages.pop(); }
          messObj.messages.unshift(postServer);
          const saved = JSON.stringify(messObj, null, 2);
          fs.writeFileSync('saving/messages.json', saved);
          const greeting = JSON.stringify({mess: postServer});
          const newUserSt = JSON.stringify({onlin: newUser});
          [...wsServer.clients].filter((item) => item.readyState === WS.OPEN).forEach((each) =>{
            each.send(greeting);
            each.send(newUserSt);
          });
        }
      }
      //Если user уходит из чата
      if (parsMessClient.exit) {
        const onlineOb = JSON.parse(onlineSt);
        onlineOb.onlines.splice(onlineOb.onlines.indexOf(parsMessClient.exit), 1);
        const newOnlinSt = JSON.stringify(onlineOb, null, 2);
        fs.writeFileSync('saving/online.json', newOnlinSt);
        const postServer = {author: `Сервер`, mess: `Чат покинул ${parsMessClient.exit.nik}. До новых встреч!`};
        const messObj = JSON.parse(messString);
        if(messObj.messages.length > 20) { messObj.messages.pop(); }
        messObj.messages.unshift(postServer);
        const saved = JSON.stringify(messObj, null, 2);
        fs.writeFileSync('saving/messages.json', saved);
        const goodbye = JSON.stringify({mess: postServer});
        const leftmen = JSON.stringify(parsMessClient);
        [...wsServer.clients].filter((item) => item.readyState === WS.OPEN).forEach((each) =>{
          each.send(goodbye);
          each.send(leftmen); ;
        });
      }
    }
  });
})
server.listen(7999);
console.log('server listened on port 7999');
