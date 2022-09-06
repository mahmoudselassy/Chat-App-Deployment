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
let users = new Map();
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
    let userId = createId();
    let user = { connection, id: userId };
    connection.on("message", async (message) => {
        let res = JSON.parse(message.utf8Data);
        if (res.title === "createRoom") {
            let roomId = createId();
            rooms.set(roomId, {
                name: res.data.roomName,
                members: new Array(),
            });
            connection.send(
                JSON.stringify({
                    title: "createRoom",
                    data: { roomId },
                })
            );
        } else if (res.title === "joinRoom") {
            const roomId = res.data.roomId;
            if (!rooms.has(roomId)) {
                connection.send(
                    JSON.stringify({
                        title: "roomNotFound",
                    })
                );
                return;
            }
            user.name = res.data.userName;
            users.set(userId, user);
            let members = rooms.get(roomId).members;
            let roomName = rooms.get(roomId).name;
            members.push(userId);
            let membersNames = [];
            for (let memberId of members) {
                membersNames.push(users.get(memberId).name);
            }
            rooms.set(roomId, { name: roomName, members });
            connection.send(
                JSON.stringify({
                    title: "joinRoom",
                    data: {
                        userId: user.id,
                        userName: user.name,
                        roomId,
                        roomName,
                        membersId: members,
                        membersNames,
                    },
                })
            );
            const usersInRoom = rooms.get(roomId).members;
            for (let userId of usersInRoom) {
                if (userId !== user.id)
                    users.get(userId).connection.send(
                        JSON.stringify({
                            title: "memberAdded",
                            data: {
                                memberName: membersNames.at(-1),
                                memberId: members.at(-1),
                            },
                        })
                    );
            }
        } else if (res.title === "sendMessage") {
            const usersInRoom = rooms.get(res.data.roomId).members;
            for (let user of usersInRoom) {
                users.get(user).connection.send(
                    JSON.stringify({
                        title: "sendMessage",
                        data: {
                            senderId: res.data.senderId,
                            senderName: res.data.senderName,
                            message: res.data.message,
                        },
                    })
                );
            }
        } else if (res.title === "leaveRoom") {
            let members = rooms.get(res.data.currentRoomId).members;
            let roomName = rooms.get(res.data.currentRoomId).name;
            let newMembers = members.filter(function (e) {
                return e !== res.data.userId;
            });
            if (newMembers.length === 0) {
                rooms.delete(res.data.currentRoomId);
                connection.send(
                    JSON.stringify({
                        title: "leaveRoom",
                        data: { leavedUserId: res.data.userId },
                    })
                );
                connection.close();
            }
            rooms.set(res.data.currentRoomId, {
                name: roomName,
                members: newMembers,
            });
            connection.send(
                JSON.stringify({
                    title: "leaveRoom",
                    data: { leavedUserId: res.data.userId },
                })
            );
            for (let memberId of members) {
                users.get(memberId).connection.send(
                    JSON.stringify({
                        title: "memberLeaved",
                        data: {
                            leavedUserId: res.data.userId,
                        },
                    })
                );
            }
        }
    });
    setInterval(() => {
        for (let user of users.values()) {
            user.connection.send(
                JSON.stringify({
                    title: "restart",
                })
            );
        }
        users = new Map();
        rooms = new Map();
    }, 60 * 60 * 1000);
});
