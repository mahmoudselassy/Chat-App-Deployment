const body = document.querySelector("body");
const nameText = document.querySelector("#name-text");
let ws = new WebSocket("ws://localhost:5000");
let client = null;
let currentRoomId = null;
ws.onmessage = (message) => {
    let res = JSON.parse(message.data);
    if (res.title === "createClient") {
        client = res.data;
        body.innerHTML = `<h1>Welcome يا عثل</h1>
        <label for="room-text">Enter Room Id :</label>
        <input id="room-text" type="text" />
        <button id="join-btn">Join Room</button>
        <br />
        <button style="margin-top: 20px" id="create-btn">create Room</button>`;
    } else if (res.title === "createRoom") {
        body.innerHTML += `<h3 style="color:green;">Room Created Successfully!</h3>
                        <h4>Room Id : ${res.data.roomId}</h4>`;
    } else if (res.title === "joinRoom") {
        body.innerHTML = `
          <ul>
    </ul>
    <input id="message-text" placeholder="message">
    <button id="send">Send</button>`;
    } else if (res.title === "sendMessage") {
        const el = document.createElement("li");
        el.innerHTML = res.message;
        document.querySelector("ul").appendChild(el);
    }
};
body.addEventListener("click", (e) => {
    let clickedElement = e.target;
    if (clickedElement.id === "name-btn") {
        ws.send(
            JSON.stringify({
                title: "createClient",
                name: nameText.value,
            })
        );
    } else if (clickedElement.id === "create-btn") {
        ws.send(
            JSON.stringify({
                title: "createRoom",
            })
        );
    } else if (clickedElement.id === "join-btn") {
        currentRoomId = document.querySelector("#room-text").value;
        ws.send(
            JSON.stringify({
                title: "joinRoom",
                clientId: client.clientId,
                roomId: currentRoomId,
            })
        );
    } else if (clickedElement.id === "send") {
        let message = document.querySelector("#message-text").value;
        ws.send(
            JSON.stringify({
                title: "sendMessage",
                clientName: client.clientName,
                roomId: currentRoomId,
                message,
            })
        );
    }
});
