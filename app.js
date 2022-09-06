const body = document.querySelector("body");
const nameText = document.querySelector("#name-text");
const roomText = document.querySelector("#room-text");
const roomName = document.querySelector("#room-name");
let HOST = location.origin.replace(/^http/, "ws");
let ws = new WebSocket(HOST);
let user = null;
let currentRoomId = null;
ws.onmessage = (message) => {
    let res = JSON.parse(message.data);
    if (res.title === "createRoom") {
        roomText.value = res.data.roomId;
    } else if (res.title === "joinRoom") {
        user = {
            id: res.data.userId,
            name: res.data.userName,
        };
        currentRoomId = res.data.roomId;

        body.innerHTML = `
            <div class="chat-container">
            <header class="chat-header">
                <h1>Chatter</h1>
                <a href="javascript:void(0)" id="leave-room" class="btn">Leave Room</a>
            </header>
            <main class="chat-main">
                <div class="chat-sidebar">
                    <h3><i class="fas fa-comments"></i> Room Name:</h3>
                    <h2 id="room-name">${res.data.roomName}</h2>
                    <h3><i class="fas fa-users"></i> Users</h3>
                    <ul id="users">
                    </ul>
                </div>
                <div class="chat-messages">
                </div>
            </main>
            <div class="chat-form-container">
                <form id="chat-form" onSubmit="return false;">
                    <input
                        id="message-text"
                        type="text"
                        placeholder="Enter Message"
                        onkeydown = "if (event.keyCode == 13)
                        document.getElementById('send').click()"
                    />
                    <button type="button" id="send" class="btn" >
                        <i class="fas fa-paper-plane"></i> Send
                    </button>
                </form>
            </div>
        </div>
`;
        for (let i = 0; i < res.data.membersNames.length; i++) {
            const el = document.createElement("li");
            el.setAttribute("id", res.data.membersId[i]);
            el.innerHTML = res.data.membersNames[i];
            document.querySelector("#users").append(el);
        }
    } else if (res.title === "memberAdded") {
        const el = document.createElement("li");
        el.setAttribute("id", res.data.memberId);
        el.innerHTML = res.data.memberName;
        document.querySelector("#users").append(el);
    } else if (res.title === "sendMessage") {
        const messages = document.querySelector(".chat-messages");
        messages.innerHTML += `<div class="message">
                        <p class="meta">${
                            user.id === res.data.senderId
                                ? "me"
                                : res.data.senderName
                        } <span>${new Date(Date.now()).toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        })}</span></p>
                        <p class="text">
                            ${res.data.message}
                        </p>
                    </div>`;
    } else if (res.title === "restart") {
        window.location.reload();
    } else if (res.title === "leaveRoom") {
        document.getElementById(res.data.leavedUserId).remove();
        window.location.reload();
    } else if (res.title === "memberLeaved") {
        document.getElementById(res.data.leavedUserId).remove();
    } else if (res.title === "roomNotFound") {
        roomText.value = "";
        alert("Enter valid room Id!");
    }
};
body.addEventListener("click", (e) => {
    let clickedElement = e.target;
    if (clickedElement.id === "create-btn") {
        if (!roomName.value) return alert("Enter room name for creating!");
        ws.send(
            JSON.stringify({
                title: "createRoom",
                data: { roomName: roomName.value },
            })
        );
    } else if (clickedElement.id === "join-btn") {
        let roomId = document.querySelector("#room-text").value;
        if (!roomId) return alert("Enter valid room Id!");
        if (!nameText.value) return alert("Enter your name!");
        ws.send(
            JSON.stringify({
                title: "joinRoom",
                data: { roomId, userName: nameText.value },
            })
        );
    } else if (clickedElement.id === "send") {
        let message = document.querySelector("#message-text").value;
        console.log(message.split(" ").length);
        if (!message || message.split(" ").length - 1 === message.length)
            return;
        document.querySelector("#message-text").value = "";
        ws.send(
            JSON.stringify({
                title: "sendMessage",
                data: {
                    senderId: user.id,
                    senderName: user.name,
                    roomId: currentRoomId,
                    message,
                },
            })
        );
    } else if (clickedElement.id === "leave-room") {
        ws.send(
            JSON.stringify({
                title: "leaveRoom",
                data: { userId: user.id, currentRoomId },
            })
        );
    }
});
window.addEventListener("beforeunload", () => {
    ws.send(
        JSON.stringify({
            title: "leaveRoom",
            data: { userId: user.id, currentRoomId },
        })
    );
});
