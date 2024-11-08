const http = require("http")
const { type } = require("os")
const Socket = require("websocket").server
const port = process.env.PORT || 3000;
const server = http.createServer(() => { })
server.listen(port,'0.0.0.0', () => {
    console.log("server started on port 3000")
})

const websocket = new Socket({ httpServer: server })

const users = []

websocket.on('request', (req) => {
    const connection = req.accept()

    connection.on('message', (message) => {
        const data = JSON.parse(message.utf8Data)
        console.log(data)
        const user = findUser(data.name)

        switch (data.type) {
            case "store_user":
                if (user != null) {
                    connection.send(JSON.stringify({
                        type: 'user already exists'
                    }))
                    return
                }
                const newUser = {
                    name: data.name, conn: connection
                }
                users.push(newUser)
                break

            case "start_call":
                let userToCall = findUser(data.target)

                if (userToCall) {
                    connection.send(JSON.stringify({
                        type: "call_response", data: "user is ready for call"
                    }))
                } else {
                    connection.send(JSON.stringify({
                        type: "call_response", data: "user is not online"
                    }))
                }
                break

            case "create_offer":
                let userToReceiverOffer = findUser(data.target)
                if (userToReceiverOffer) {
                    userToReceiverOffer.conn.send(JSON.stringify({
                        type: "offer_received",
                        name: data.name,
                        data: data.data.sdp,
                        isAudioOnly: data.isAudioOnly
                    }))
                }
                break

            case "create_answer":
                let userToReceiverAnswer = findUser(data.target)
                if (userToReceiverAnswer) {
                    userToReceiverAnswer.conn.send(JSON.stringify({
                        type: "answer_received",
                        name: data.name,
                        data: data.data.sdp,
                        isAudioOnly: data.isAudioOnly
                    }))
                }
                break

            case "ice_candidate":
                let userToReceiverIceCandidate = findUser(data.target)
                if (userToReceiverIceCandidate) {
                    userToReceiverIceCandidate.conn.send(JSON.stringify({
                        type: "ice_candidate",
                        name: data.name,
                        data: {
                            sdpMLineIndex: data.data.sdpMLineIndex,
                            sdpMid: data.data.sdpMid,
                            sdpCandidate: data.data.sdpCandidate
                        },
                        isAudioOnly: data.isAudioOnly
                    }))
                }

                break
            case "end_call":
                let userToNotifyEndCall = findUser(data.target)
                if (userToNotifyEndCall) {
                    userToNotifyEndCall.conn.send(JSON.stringify({
                        type: "call_ended",
                        name: data.name
                    }))
                }
                break
        }
    })

    connection.on('close', () => {
        users.forEach(user => {
            if (user.conn === connection) {
                users.splice(users.indexOf(user), 1)
            }
        })
    })
})

const findUser = username => {
    for (let i = 0; i < users.length; i++) {
        if (users[i].name === username)
            return users[i]
    }
}