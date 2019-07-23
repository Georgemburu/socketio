const http = require('http'),
    path = require('path'),
    fs = require('fs'),
    port = 3000;


function handleRequests(req,res){
    console.log('req=>',req.url)
    if(req.url==='/'|| req.url===''){
        fs.createReadStream(path.join(__dirname,'index.html')).pipe(res)

    }
}

const server = http.createServer(handleRequests);
const io = require('socket.io').listen(server);
let connectedSockets = []
io.on('connection',(socket)=>{
    console.log('user connected',socket.id)
    if(!connectedSockets.includes(socket)){
        connectedSockets.push(socket)
    }
    socket.on('disconnect',()=>{
        console.log('user disconnected',socket.id)
        connectedSockets.splice(connectedSockets.indexOf(socket),1)
        io.emit('usersLoggedIn',connectedSockets.length)
    })

    // chat
    socket.on('chat message',(msg)=>{
        console.log(socket.id,msg)
        io.emit('broadCastMsg',{username:socket.username,message:msg})
    })
    socket.on('username',(username)=>{
        if(connectedSockets.includes(socket)){
            connectedSockets.splice(connectedSockets.indexOf(socket),1) 
        }
        socket.username = username;
        connectedSockets.push(socket)
        io.emit('successLogin',socket.username)
        io.emit('usersLoggedIn',connectedSockets.length)
    })
    
    socket.on('typing',(bool)=>{
        if(bool){
            socket.broadcast.emit('displayTyping',{username:socket.username})
        }else {
            io.emit('remove_displayTyping',{username:socket.username})

        }
    })
    socket.on('getOnlineUsers',()=>{
        let users = []
        connectedSockets.forEach((user)=>{
            users.push({
                username:user.username,
                id:user.id
            })
        })
        io.emit('showOnlineUsers',JSON.stringify(users))
    })

})

server.listen(port)
console.log('server running on port '+port)