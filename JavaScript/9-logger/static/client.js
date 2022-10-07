'use strict';

// const socket = new WebSocket('ws://127.0.0.1:8001/');

const scaffold = (url, structure) => {
  const api = {};
  const services = Object.keys(structure);

  // const socketReq = (serviceName, methodName, args) => {
  //   new Promise((resolve) => {
  //     const packet = { name: serviceName, method: methodName, args };
  //     socket.send(JSON.stringify(packet));
  //     socket.onmessage = (event) => {
  //       const data = JSON.parse(event.data);
  //       resolve(data);
  //     };
  //   });
  // };

  const httpReq = async (serviceName, methodName, args) => {
    const methodArgs = structure[serviceName][methodName];
    let computedUrl = `${url}/${serviceName}/${methodName}`;
    let body;

    for (let index = 0; index < args.length; index++) {
      const methodArg = methodArgs[index];
      const arg = args[index];

      if (methodArg === 'id' || methodArg === 'mask') {
        computedUrl += `/${arg}`;
      } else {
        body = arg;
      }
    }

    return fetch(computedUrl, {
      method: 'POST',
      body,
    }).then((res) => res.json());
  };

  for (const serviceName of services) {
    api[serviceName] = {};
    const service = structure[serviceName];
    const methods = Object.keys(service);
    for (const methodName of methods) {
      api[serviceName][methodName] = (...args) => httpReq(serviceName, methodName, args);
    }
  }
  return api;
};

const api = scaffold('http://localhost:8001', {
  user: {
    create: ['record'],
    read: ['id'],
    update: ['id', 'record'],
    delete: ['id'],
    find: ['mask'],
  },
  country: {
    read: ['id'],
    delete: ['id'],
    find: ['mask'],
  },
});

// socket.addEventListener('open', async () => {
//   const data = await api.user.read(3);
//   console.dir({ data });
// });

(async () => {
  const data = await api.user.read(3);
  console.dir({ data });

  const data2 = await api.user.find('ad%');
  console.dir({ data2 });
})();
