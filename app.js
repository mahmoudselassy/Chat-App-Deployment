const body = document.querySelector("body");
const nameText = document.querySelector("#name-text");
const roomText = document.querySelector("#room-text");
const roomName = document.querySelector("#room-name");
let HOST = location.origin.replace(/^http/, "ws");
let ws = new WebSocket(HOST);
let client = null;
let currentRoomId = null;
ws.onmessage = (message) => {
    let res = JSON.parse(message.data);
    if (res.title === "createRoom") {
        roomText.value = res.data.roomId;
    } else if (res.title === "joinRoom") {
        client = {
            clientId: res.data.clientId,
            clientName: res.data.clientName,
        };
        currentRoomId = res.data.roomId;

        body.innerHTML = `
            <div class="chat-container">
            <header class="chat-header">
                <h1>Chatter</h1>
                <a href="index.html" class="btn">Leave Room</a>
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
                <form id="chat-form">
                    <input
                        id="message-text"
                        type="text"
                        placeholder="Enter Message"
                        required
                    />
                    <button type="button" id="send" class="btn">
                        <i class="fas fa-paper-plane"></i> Send
                    </button>
                </form>
            </div>
        </div>
`;
        for (let memberName of res.data.membersNames) {
            const el = document.createElement("li");
            el.innerHTML = memberName;
            document.querySelector("#users").append(el);
        }
    } else if (res.title === "memberAdded") {
        const el = document.createElement("li");
        el.innerHTML = res.memberName;
        document.querySelector("#users").append(el);
    } else if (res.title === "sendMessage") {
        const messages = document.querySelector(".chat-messages");
        messages.innerHTML += `<div class="message">
                        <p class="meta">${
                            client.clientId === res.clientId
                                ? "me"
                                : res.senderName
                        } <span>${new Date(Date.now()).toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        })}</span></p>
                        <p class="text">
                            ${res.clientMessage}
                        </p>
                    </div>`;
    }
};
body.addEventListener("click", (e) => {
    let clickedElement = e.target;
    if (clickedElement.id === "create-btn") {
        if (!roomName.value) return alert("enter room name for creating!");
        ws.send(
            JSON.stringify({
                title: "createRoom",
                roomName: roomName.value,
            })
        );
    } else if (clickedElement.id === "join-btn") {
        ws.send(
            JSON.stringify({
                title: "joinRoom",
                roomId: document.querySelector("#room-text").value,
                name: nameText.value,
            })
        );
    } else if (clickedElement.id === "send") {
        let message = document.querySelector("#message-text").value;
        document.querySelector("#message-text").value = "";
        ws.send(
            JSON.stringify({
                title: "sendMessage",
                clientName: client.clientName,
                senderId: client.clientId,
                roomId: currentRoomId,
                message,
            })
        );
    }
});
setInterval(() => {
    window.location = "/";
    ws = new WebSocket(HOST);
    ws.send(
        JSON.stringify({
            title: "restart",
        })
    );
}, 60 * 60 * 1000);
