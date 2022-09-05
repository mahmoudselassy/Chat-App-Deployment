const PORT = process.env.PORT || 5000;
const WebSocketServer = require("websocket").server;
const express = require("express");
const app = express();
const server = app.listen(PORT);
app.get("/", (req, res) => {
    res.sendFile("/index.html", { root: __dirname });
});
app.use(express.static(__dirname));
let WebSocket = new WebSocketServer({
    httpServer: server,
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
    let clientId = createId();
    let client = { connection, clientId };
    connection.on("message", async (message) => {
        let res = JSON.parse(message.utf8Data);
        if (res.title === "createRoom") {
            let roomId = createId();
            rooms.set(roomId, { name: res.roomName, members: new Array() });
            connection.send(
                JSON.stringify({
                    title: "createRoom",
                    data: { roomId },
                })
            );
        } else if (res.title === "joinRoom") {
            const roomId = res.roomId;
            client.name = res.name;
            clients.set(clientId, client);
            let members = rooms.get(roomId).members;
            let roomName = rooms.get(roomId).name;
            members.push(clientId);
            let membersNames = [];
            for (let memberId of members) {
                membersNames.push(clients.get(memberId).name);
            }
            rooms.set(roomId, { name: roomName, members });
            connection.send(
                JSON.stringify({
                    title: "joinRoom",
                    data: {
                        clientId,
                        clientName: client.name,
                        roomId,
                        roomName,
                        membersNames,
                    },
                })
            );
            const clientsInRoom = rooms.get(roomId).members;
            for (let clientId of clientsInRoom) {
                if (clientId !== client.clientId)
                    clients.get(clientId).connection.send(
                        JSON.stringify({
                            title: "memberAdded",
                            memberName: membersNames.at(-1),
                        })
                    );
            }
        } else if (res.title === "sendMessage") {
            const senderName = res.clientName;
            const clientMessage = res.message;
            const clientsInRoom = rooms.get(res.roomId).members;
            for (let id of clientsInRoom) {
                clients.get(id).connection.send(
                    JSON.stringify({
                        title: "sendMessage",
                        clientId: res.senderId,
                        senderName: senderName,
                        clientMessage: clientMessage,
                    })
                );
            }
        } else if (res.title === "restart") {
            clients = new Map();
            rooms = new Map();
            connection = null;
            client = null;
        }
    });
});
