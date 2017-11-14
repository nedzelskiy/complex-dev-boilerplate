const serverBrowserRestarter = io('[serverUrl]', {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax : 5000,
    reconnectionAttempts: Infinity
});

serverBrowserRestarter.on('message', message => {
    console.log('got a new message from server-browser-restarter:',message);
    message.text && console.log(message.text);
    (message.type === 'browser-refresh') && document.location.reload();
});

serverBrowserRestarter.on('disconnect', () => {
    console.log('disconnected with live reload!');
});

serverBrowserRestarter.on('connect', () => {
    console.log('connected to live reload!');
});

serverBrowserRestarter.on('reconnect', (attemptNumber) => {
    console.log(`reconnected after ${ attemptNumber } attempts!`);
    serverBrowserRestarter.send({
        'type': 'browser-refresh'
    });
});