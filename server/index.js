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

function getPlayerState(game, playerID)
{
  if (game.player1 === playerID) return game.state.player1;
  else if (game.player2 === playerID) return game.state.player2;
}

function getOpponentState(game, playerID)
{
  if (game.player1 === playerID) return game.state.player2;
  else if (game.player2 === playerID) return game.state.player1;
}

function playerStateForClient(game, playerID)
{
  let state = getPlayerState(game, playerID);
  let stack1 = [], stack2 = [];
  if (state[10]) stack1.push(state[10]);
  if (state[11]) stack1.push(state[11]);
  if (state[12]) stack2.push(state[12]);
  if (state[13]) stack2.push(state[13]);

  return {
    turn: state.turn,
    color: state.color,
    deck: state.deck,
    1: state[1],
    2: state[2],
    3: state[3],
    4: state[4],
    5: state[5],
    6: state[6],
    7: state[7],
    8: state[8],
    9: state[9],
    stack1: stack1,
    stack2: stack2
  };
}

function opponentStateForClient(game, playerID)
{
  let state = getOpponentState(game, playerID);
  let stack1 = [], stack2 = [];
  if (state[10]) stack1.push(state[10]);
  if (state[11]) stack1.push(state[11]);
  if (state[12]) stack2.push(state[12]);
  if (state[13]) stack2.push(state[13]);

  return {
    turn: state.turn,
    color: state.color,
    deck: state.deck,
    1: !!state[1],
    2: !!state[2],
    3: !!state[3],
    4: !!state[4],
    5: !!state[5],
    6: !!state[6],
    7: !!state[7],
    8: !!state[8],
    9: !!state[9],
    stack1: stack1,
    stack2: stack2
  };
}

function getGameStateForClient(gameID, playerID)
{
  let game = games[gameID];
  //TODO: spectator
  return {
    player: playerStateForClient(game, playerID),
    opponent: opponentStateForClient(game, playerID)
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
      player2: undefined,
      state: {
        player1: {
          turn: true,
          color: 'red',
          deck: 15,
          1: red(1),
          2: black(2),
          3: red(3),
          4: black(4),
          5: red(5),
          6: black(6),
          7: red(7),
          8: black(8),
          9: red(9),
          10: 1,
          11: 2,
          12: 3,
          13: 4
        },
        player2: {
          turn: true,
          color: 'black',
          deck: 15,
          1: red(1),
          2: black(2),
          3: red(3),
          4: black(4),
          5: red(5),
          6: black(6),
          7: red(7),
          8: black(8),
          9: red(9),
          10: 1,
          11: 2,
          12: 3,
          13: 4
        }
      }
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
  socket.emit('update', getGameStateForClient(gameID, playerID));
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

  socket.on('target', function(obj) {
    let playerID = playerBySocketID[socket.id];
    if (!playerID) { return; }
    let game = gameByPlayerID[playerID];
    if (!game) { return; }

    let selected, sourceState;
    if (obj.selected > 13) {
      sourceState = getOpponentState(game, playerID);
      selected = card(sourceState[obj.selected - 13], sourceState.color);
      delete sourceState[obj.selected - 13];
    }
    else {
      sourceState = getPlayerState(game, playerID);
      if (obj.selected > 9) {
        selected = card(sourceState[obj.selected], sourceState.color);
      }
      else {
        selected = sourceState[obj.selected];
      }
      delete sourceState[obj.selected];
    }

    if (selected)
    {
      let destinationState;
      if (obj.destination > 13)
      {
        destinationState = getOpponentState(game, playerID);
        obj.destination -= 13;
      }
      else
      {
        destinationState = getPlayerState(game, playerID);
      }
      destinationState[obj.destination] = selected;
    }
    socket.emit('update', getGameStateForClient(game.id, playerID));
  });
});

http.listen(26794, function(){
  console.log('listening on *:26794');
});