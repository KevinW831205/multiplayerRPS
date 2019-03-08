/*
    LOGIC
    player1 slot , player2 slot
    one user clicks player slot
    stops other user from clicking
    On player disconnect or choose to leave player spot
    stop game, open player spot again
    once both player slot filled allow ready button
    both ready begin game


    game play RPS logic
    have a timer
    hide opponent choice, opponent choose say they've finished choosing
    you make choice
    run RPS win logic
    display win lose tie

    chat logic,
    push an input to database
    on child added update chat log

*/



// Initialize Firebase
var config = {
    apiKey: "AIzaSyABH02hVAlW_qJ724uQi04NkC6rsMn6Dfs",
    authDomain: "upennmultiplayerrps.firebaseapp.com",
    databaseURL: "https://upennmultiplayerrps.firebaseio.com",
    projectId: "upennmultiplayerrps",
    storageBucket: "upennmultiplayerrps.appspot.com",
    messagingSenderId: "797738999352"
};
firebase.initializeApp(config);
var database = firebase.database();

var main = {
    // some gobal variables
    username: "",
    playing: false,     //if the user is playing  
    playingAs: "",      //player1 or player2
    opponent: "",       //if playing opponent
    sessionkey: "",     //not quite used yet
    stats: {
        win: 0,
        loss: 0,
        tie: 0,
    },

    createReadyBtn: function (appendLocation) {
        //after clicking start button have a ready button, both players must ready to play. 

        var readyBtn = $("<button>").text("ready");
        readyBtn.addClass("readyBtn")
        $(appendLocation).append(readyBtn);
        $(appendLocation).on("click", ".readyBtn", function () {
            //disabling button to prevent multiple clicks and change some values on firebase
            $(this).attr("disabled", true);
            database.ref("/players/" + main.playingAs).child("ready").set(true)
            database.ref("/players/" + main.playingAs).child("ready").onDisconnect().set(false)

        })
    },

    createStopBtn: function (appendLocation) {
        //after clicking start button have a stop playing button

        var stopBtn = $("<button>").text("Stop Playing");
        stopBtn.addClass("stopBtn")
        $(appendLocation).append(stopBtn)
        $(appendLocation).on("click", ".stopBtn", function () {
            $(this).parent().empty();
            database.ref("/players/" + main.playingAs).child("selected").set(false)
            database.ref("/players/" + main.playingAs).child("ready").set(false)
        })
    },

    createStartBtn: function (appendLocation) {
        //create start button user click to play and assign it's event listners
        var startBtn = $("<button>");
        var selected;
        playerid = appendLocation.attr("data-player");
        startBtn.addClass("startBtn")
        startBtn.attr("id", playerid + "startBtn");
        startBtn.text("Play as " + playerid)
        $(appendLocation).append(startBtn);
        $(appendLocation).on("click", "#" + playerid + "startBtn", function () {
            //only allow to play if not already playing and the player window hasn't been selected by other people
            if (!main.playing && !selected) {
                //assigning playwindow and your opponent
                main.playingAs = $(this).parent().attr("data-player");
                if (main.playingAs === "player1") {
                    main.opponent = "player2";
                } else if (main.playingAs === "player2") {
                    main.opponent = "player1"
                }

                //changing game window and some firebase properties
                $(this).hide()
                database.ref("/players/" + main.playingAs).child("playerName").set(main.username)
                database.ref("/players/" + main.playingAs).child("selected").set(true)
                main.playing = true;

                database.ref("/players/" + main.playingAs).child("selected").onDisconnect().set(false)
                database.ref("/players/" + main.playingAs).child("ready").set(false)

                //create ready button and modify opponents playBox display
                main.createReadyBtn($("#" + main.playingAs + "Box"))

                //Change opponent display
                $("#" + main.opponent + "startBtn").attr("disabled", true)
                var opponentText = $("<h3>").text("waiting on opponent")
                opponentText.addClass("opponentText")
                $("#" + main.opponent + "Box").append(opponentText)

            }
        });
    },

    nameChange: function () {
        //function to change user name
        var newName = $("#nameInput").val()
        $("#nameInput").val("")
        localStorage.setItem("username", newName)
        main.username = newName;
        $("#userName").text(main.username);

    }

}


// $("#player2startBtn").on("click", function () {
//     var p2selected;
//     database.ref("/players/player2").child("selected").once("value").then(function (snapshot) {
//         p2selected = snapshot.val();
//     })

//     if (!main.playing && !p2selected) {
//         database.ref("/players/player2").child("selected").set(true)
//         main.playing = true;
//         main.playingAs = "player2"
//         database.ref("/players/" + main.playingAs).child("selected").onDisconnect().set(false)
//         database.ref("/players/" + main.playingAs).child("ready").set(false)
//         main.createReadyBtn($("#player2Box"))
//     }
// });


var game = {
    initiated: false,

    start: function (gameWindow) {
        //initiate game and generate game window wtih choices
        var rock = $("<button>").text("rock");
        rock.addClass("choiceBtn");
        rock.attr("data-choice", "rock");
        var paper = $("<button>").text("paper");
        paper.addClass("choiceBtn");
        paper.attr("data-choice", "paper");

        var scissor = $("<button>").text("scissor");
        scissor.addClass("choiceBtn");
        scissor.attr("data-choice", "scissor");

        var confirmBtn = $("<button>").text("confirm")
        confirmBtn.addClass("confirmBtn");

        var newP = $("<p>").addClass("confirmText");


        gameWindow.empty();
        gameWindow.append(rock, paper, scissor)


        $(".choiceBtn").on("click", function () {
            //When choice is chosen ask for confirm
            database.ref("/players/" + main.playingAs).child("choice").set($(this).attr("data-choice"));
            newP.text("You Chosen " + $(this).text())
            gameWindow.append(newP)
            gameWindow.append(confirmBtn)

        });

        $(gameWindow).on("click", ".confirmBtn", function () {
            //Confirm Choice and save value to database
            database.ref("/players/" + main.playingAs).child("confirm").set(true);
            $(this).parent().children($(".choiceBtn")).attr("disabled", true);
            $(this).attr("disabled", true);
        });
    },

    winCheck(p1c, p2c) {
        //RPS logic
        var resultText = $("<p>").addClass("resultText")
        if (p1c === p2c) {
            main.stats.tie++;
            resultText.text("Your Opponent Choose " + p1c + " Tie")
            $("#" + main.playingAs + "Box").append(resultText)

        }
        else if ((p1c === "rock" && p2c === "scissor") || (p1c === "scissor" && p2c === "paper") || (p1c === "paper" && p2c === "rock")) {
            if (main.playingAs === "player1") {
                main.stats.win++;
                resultText.text("Your Opponent Choose " + p2c + " Win")
                $("#" + main.playingAs + "Box").append(resultText)

            } else {
                main.stats.loss++;
                resultText.text("Your Opponent Choose " + p2c + " Lose")
                $("#" + main.playingAs + "Box").append(resultText)

            }

        }
        else {
            if (main.playingAs === "player2") {
                main.stats.win++;
                resultText.text("Your Opponent Choose " + p1c + " Win")
                $("#" + main.playingAs + "Box").append(resultText)

            } else {
                main.stats.loss++;
                resultText.text("Your Opponent Choose " + p1c + " Lose")
                $("#" + main.playingAs + "Box").append(resultText)
            }
        }
        //start resetting game and update stats
        game.statsUpdate();
        database.ref("/players/" + main.playingAs).child("confirm").set(false);
        setTimeout(game.reset, 5000)
    },


    statsUpdate: function () {
        //update stats and store locally
        $("#winCount").text(main.stats.win)
        $("#lossCount").text(main.stats.loss)
        $("#tieCount").text(main.stats.tie)
        localStorage.setItem("stats", JSON.stringify(main.stats))
    },

    reset: function () {
        //reset game
        $(".playerBox").empty()
        main.playingAs = "";
        main.playing = false;
        database.ref("/players/player1").child("selected").set(false)
        database.ref("/players/player1").child("ready").set(false)
        database.ref("/players/player2").child("selected").set(false)
        database.ref("/players/player2").child("ready").set(false)
        main.createStartBtn($("#player1Box"));
        main.createStartBtn($("#player2Box"));

    }
}

var chat = {
    // chatting functions
    submit: function () {
        inputText = $("#chatInput").val()
        database.ref("/chat").push(main.username + ": " + inputText);
        $("#chatInput").val("")
    }
}

//debugging commands

// database.ref().set({})

// database.ref("/players").set({
//     player1: {
//         selected: false,
//     },
//     player2: {
//         selected: false,
//     },
// })



$(document).ready(function () {
    //grabbing some values from local storage, username and stats
    if (localStorage.getItem("username") == null) {
        localStorage.setItem("username", "randomUser")
    } else {
        main.username = localStorage.getItem("username");
        $("#userName").text(main.username);

    }

    if (localStorage.getItem("stats") !== null) {
        main.stats = JSON.parse(localStorage.getItem("stats"));
        console.log(localStorage.getItem("stats"))
        game.statsUpdate();
    }

    //connections on database
    var connectedRef = database.ref(".info/connected");
    var connectionsRef = database.ref("/connections");

    // When the client's connection state changes...
    connectedRef.on("value", function (snap) {
        // If they are connected..
        if (snap.val()) {
            // Add user to the connections list.
            var con = connectionsRef.push(true);
            // Remove user from the connection list when they disconnect.
            con.onDisconnect().remove();
        }
    });

    database.ref(connectionsRef).on("child_added", function (snapshot) {
        main.sessionkey = snapshot.key
    });
    // When first loaded or when the connections list changes...
    connectionsRef.on("value", function (snapshot) {
        // Display the viewer count in the html.
        // The number of online users is the number of children in the connections list.
        // console.log(snapshot.numChildren());
    });

    database.ref("/players").on("value", function (snapshot) {
        //changes to player status values: player selected, ready choice etc. and store the status values
        var p1state
        var p2state
        p1state = snapshot.val().player1
        p2state = snapshot.val().player2

        //if both player are ready initiate game
        if (p1state.ready && p2state.ready) {
            database.ref("/game").child("initiated").set(true);
            game.initiated = true;
        } else {
            database.ref("/game").child("initiated").set(false);
        }


        database.ref("/game").child("initiated").once("value").then(function (snapshot) {
        //when player confirm their choices in the game check if both player confirmed to initiate win check
            if (p1state.confirm && p2state.confirm && snapshot.val()) {
                game.winCheck(p1state.choice, p2state.choice)
            }
        })

        //disabling start button for other people if player is playing
        if (p1state.selected) {
            $("#player1startBtn").attr("disabled", true)
            $("#player1startBtn").text("Player1 is played by " + p1state.playerName)

        }
        if (p2state.selected) {
            $("#player2startBtn").attr("disabled", true)
            $("#player2startBtn").text("Player2 is played by " + p2state.playerName)

        }
    })

    database.ref("/game").on("value", function (snapshot) {
        //if game started and player on disconnect will restart the player selection
        if (snapshot.val().initiated) {
            if (main.playing) {
                game.start($("#" + main.playingAs + "Box"))
            } else {
            }
        }
    })

    database.ref("/game").child("initiated").on("value", function (snapshot) {
        // disconnect and game began
        if (!snapshot.val()) {
            $(".playerBox").empty()
            main.createStartBtn($("#player1Box"));
            main.createStartBtn($("#player2Box"));
        }
    })


    database.ref("/chat").on("child_added", function (snapshot) {
        //chat box
        var textlog = $("<p>").text(snapshot.val())
        $("#chatLog").append(textlog)
    });

    //name change and check box
    $("#chatSubmit").on("click", function (event) {
        event.preventDefault();
        chat.submit();
    })

    $("#nameSubmit").on("click", function (event) {
        event.preventDefault();
        main.nameChange();
    })

    //initial start of game
    main.reset();



    // $(document).on("click","#player1startBtn", function () {
    //     var p1selected;
    //     database.ref("/players/player1").child("selected").once("value").then(function (snapshot) {
    //         p1selected = snapshot.val();
    //     })
    //     if (!main.playing && !p1selected) {
    //         database.ref("/players/player1").child("selected").set(true)
    //         main.playing = true;
    //         main.playingAs = "player1"
    //         database.ref("/players/" + main.playingAs).child("selected").onDisconnect().set(false)
    //         database.ref("/players/" + main.playingAs).child("ready").set(false)
    //         main.createReadyBtn($("#player1Box"))
    //     }
    // });


    // $("#player2startBtn").on("click", function () {
    //     var p2selected;
    //     database.ref("/players/player2").child("selected").once("value").then(function (snapshot) {
    //         p2selected = snapshot.val();
    //     })

    //     if (!main.playing && !p2selected) {
    //         database.ref("/players/player2").child("selected").set(true)
    //         main.playing = true;
    //         main.playingAs = "player2"
    //         database.ref("/players/" + main.playingAs).child("selected").onDisconnect().set(false)
    //         database.ref("/players/" + main.playingAs).child("ready").set(false)
    //         main.createReadyBtn($("#player2Box"))
    //     }
    // });

});



