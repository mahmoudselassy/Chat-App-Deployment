const http = require("http");
const WebSocketServer = require("websocket").server;
const httpServer = http.createServer((req, res) => {}).listen(5000);
let WebSocket = new WebSocketServer({
    httpServer,
});
let clients = new Map();
let rooms = new Map();
const createId = () => {
    function _p8(s) {
        var p = (Math.random().toString(16) + "000000000").substr(2, 8);
        return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
    }
    return _p8() + _p8(true) + _p8(true) + _p8();
};

WebSocket.on("request", (request) => {
    let connection = request.accept(null, request.origin);
    let client = { connection };
    connection.on("message", async (message) => {
        let res = JSON.parse(message.utf8Data);
        if (res.title === "createClient") {
            let clientId = createId();
            client.name = res.name;
            clients.set(clientId, client);
            connection.send(
                JSON.stringify({
                    title: "createClient",
                    data: { clientId, clientName: client.name },
                })
            );
        } else if (res.title === "createRoom") {
            let roomId = createId();
            rooms.set(roomId, new Array());
            connection.send(
                JSON.stringify({
                    title: "createRoom",
                    data: { roomId },
                })
            );
        } else if (res.title === "joinRoom") {
            const roomId = res.roomId;
            const clientId = res.clientId;
            let newArr = rooms.get(roomId);
            newArr.push(clientId);
            rooms.set(roomId, newArr);
            connection.send(
                JSON.stringify({
                    title: "joinRoom",
                })
            );
        } else if (res.title === "sendMessage") {
            const senderName = res.clientName;
            const clientMessage = res.message;
            const clientsInRoom = rooms.get(`${res.roomId}`);
            for (let clientId of clientsInRoom) {
                clients.get(clientId).connection.send(
                    JSON.stringify({
                        title: "sendMessage",
                        message: `${senderName}: ${clientMessage}`,
                    })
                );
            }
        }
    });
});
