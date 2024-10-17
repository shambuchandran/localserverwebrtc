const http = require("http")
const Socket = require("websocket").server
const server = http.createServer(() => { })

server.listen(3000, () => {
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
                    let userToReceiverOffer= findUser(data.target)
                    if(userToReceiverOffer){
                        userToReceiverOffer.conn.send(JSON.stringify({
                            type: "offer_received",
                            name: data.name,
                            data: data.data.sdp
                        }))
                    }
                break

                case "create_answer":
                    let userToReceiverAnswer= findUser(data.target)
                    if(userToReceiverAnswer){
                        userToReceiverAnswer.conn.send(JSON.stringify({
                            type: "answer_received",
                            name: data.name,
                            data: data.data.sdp
                        }))
                    }
                break  
                
                case "ice_candidate":
                    let userToReceiverIceCandidate=findUser(data.target)
                    if(userToReceiverIceCandidate){
                        userToReceiverIceCandidate.conn.send(JSON.stringify({
                            type: "ice_candidate",
                            name: data.name,
                            data:{
                                sdpMLineIndex:data.data.sdpMLineIndex,
                                sdpMid:data.data.sdpMid,
                                sdpCandidate:data.data.sdpCandidate
                            }
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