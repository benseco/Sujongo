var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var games = {};
var gameByPlayerID = {};
var socketByPlayerID = {};
var playerBySocketID = {}

function chat(gameID, type, obj)
{
  io.in(gameID).emit(type, obj);
}

function red(value) { return card(value,'red'); }
function black(value) { return card(value,'black'); }
function card(value, color) { return {value: value, color: color}; }

function getGameData()
{
  return {
    player: {
      turn: true,
      1:red(3),
      2:red(3),
      3:black(3),
      4:black(5),
      //5:0,
      //6:0,
      7:red(7),
      //8:0,
      //9:0,
      deck:15,
      stack1: [3,4],
      stack2: [1],
      color:'red'
    },
    opponent: {
      1:true,
      //2:false,
      3:true,
      4:true,
      5:true,
      //6:false,
      //7:false,
      8:true,
      //9:false,
      deck:15,
      stack1: [],
      stack2: [2,9],
      color:'black'
    }
  };
}

function joinGame(socket, gameID, playerID)
{
  socket.join(gameID);

  if (!games[gameID])
  {
    games[gameID] = {
      id: gameID,
      player1: undefined,
      player2: undefined
    }
  }
  let game = games[gameID];
  if (!game.player1 || game.player1 == playerID)
  {
    game.player1 = playerID;
    chat(gameID, 'sys', playerID + " joined game " + gameID + " as player 1."); 
  }
  else if (!game.player2 || game.player2 == playerID)
  {
    game.player2 = playerID;
    chat(gameID, 'sys', playerID + " joined game " + gameID + " as player 2.");
  }
  else
  {
    chat(gameID, 'sys', playerID + " joined game " + gameID + " as spectator.");
  }

  gameByPlayerID[playerID] = game;
  socket.emit('update', getGameData(gameID, playerID));
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('disconnect', function()
  {
    console.log('Socket ' + socket.id + ' disconnected (Player ' + playerBySocketID[socket.id] + ')');
    delete socketByPlayerID[playerBySocketID[socket.id]];
    delete playerBySocketID[socket.id];
  });

  socket.on('join', function(playerID, gameID){
    playerBySocketID[socket.id] = playerID;
    socketByPlayerID[playerID] = socket.id;
    socket.leaveAll();
    joinGame(socket, gameID, playerID);
  });

  socket.on('chat', function(message){
    let playerID = playerBySocketID[socket.id];
    if (!playerID) { return; }
    let game = gameByPlayerID[playerID];
    if (!game) { return; }
    chat(game.id, 'chat', {
      sender: playerID,
      msg: message
    });
  });

  socket.on('draw', function() {
    socket.emit('drawn', red(6));
  });
});

http.listen(26794, function(){
  console.log('listening on *:26794');
});