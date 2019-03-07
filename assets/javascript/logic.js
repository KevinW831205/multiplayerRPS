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
    playing: false,
    playingAs: "",
    opponent: "",
    sessionkey: "",
    win: 0,
    loss: 0,
    tie: 0,

    createReadyBtn: function (appendLocation) {
        //after clicking start button have a ready button, both players must ready to play. 

        var readyBtn = $("<button>").text("ready");
        readyBtn.addClass("readyBtn")
        $(appendLocation).append(readyBtn);

        $(appendLocation).on("click", ".readyBtn", function () {
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

        var startBtn = $("<button>");
        var selected;
        playerid = appendLocation.attr("data-player");
        startBtn.attr("id", playerid + "startBtn");
        startBtn.text("Play as " + playerid)
        $(appendLocation).append(startBtn);
        $(appendLocation).on("click", "#" + playerid + "startBtn", function () {


            if (!main.playing && !selected) {
                main.playingAs = $(this).parent().attr("data-player");
                if (main.playingAs === "player1") {
                    main.opponent = "player2";
                } else if (main.playingAs === "player2") {
                    main.opponent = "player1"
                }


                database.ref("/players/" + main.playingAs).child("selected").set(true)
                main.playing = true;

                database.ref("/players/" + main.playingAs).child("selected").onDisconnect().set(false)
                database.ref("/players/" + main.playingAs).child("ready").set(false)

                //create ready button and modify opponents playBox display
                main.createReadyBtn($("#" + main.playingAs + "Box"))

                //currently opponent display only at empty
                $("#" + main.opponent + "Box").empty()
            }
        });
    },


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
        rock.attr("data-choice", "r");
        var paper = $("<button>").text("paper");
        paper.addClass("choiceBtn");
        paper.attr("data-choice", "p");

        var scissor = $("<button>").text("scissor");
        scissor.addClass("choiceBtn");
        scissor.attr("data-choice", "s");

        var confirmBtn = $("<button>").text("confirm")
        confirmBtn.addClass("confirmBtn");

        gameWindow.empty();
        gameWindow.append(rock, paper, scissor)

        $(".choiceBtn").on("click", function () {
            //When choice is chosen ask for confirm
            database.ref("/players/" + main.playingAs).child("choice").set($(this).attr("data-choice"));
            gameWindow.append("You Chosen " + $(this).text())
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
        if (p1c === p2c) {
            main.tie++;
            $("#" + main.playingAs + "Box").append("tie")

        }
        else if ((p1c === "r" && p2c === "s") || (p1c === "s" && p2c === "p") || (p1c === "p" && p2c === "r")) {
            if (main.playingAs === "player1") {
                main.win++
                $("#" + main.playingAs + "Box").append("win")

            } else {
                main.loss++
                $("#" + main.playingAs + "Box").append("loss")

            }

        }
        else {
            if (main.playingAs === "player2") {
                main.win++
                $("#" + main.playingAs + "Box").append("win")

            } else {
                main.loss++
                $("#" + main.playingAs + "Box").append("loss")
            }
        }
        //start resetting game
        database.ref("/players/" + main.playingAs).child("confirm").set(false);
        setTimeout(game.reset, 5000)
    },

    reset: function () {
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
    submit: function () {
        inputText = $("#chatInput").val()+"<br>"
        database.ref("/chat").push(inputText);
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
        console.log(snapshot.numChildren());
    });

    database.ref("/players").on("value", function (snapshot) {
        var p1state
        var p2state
        p1state = snapshot.val().player1
        p2state = snapshot.val().player2
        if (p1state.ready && p2state.ready) {
            database.ref("/game").child("initiated").set(true);
            game.initiated = true;
        } else {
            database.ref("/game").child("initiated").set(false);
        }

        database.ref("/game").child("initiated").once("value").then(function (snapshot) {
            if (p1state.confirm && p2state.confirm && snapshot.val()) {
                game.winCheck(p1state.choice, p2state.choice)
            }
        })

        if (p1state.selected) {
            $("#player1startBtn").attr("disabled", true)
            $("#player1startBtn").text("Player1 is being played")

        }
        if (p2state.selected) {
            $("#player2startBtn").attr("disabled", true)
            $("#player2startBtn").text("Player2 is being played")

        }
    })

    database.ref("/game").on("value", function (snapshot) {
        if (snapshot.val().initiated) {
            if (main.playing) {
                game.start($("#" + main.playingAs + "Box"))

            } else {
                game.start($("#player1Box"));
                game.start($("#player2Box"));
            }
        }
    })

    database.ref("/chat").on("child_added", function (snapshot) {
        $("#chatLog").append(snapshot.val())
    });


    $("#chatSubmit").on("click", function (event) {
        event.preventDefault();
        console.log(1);
        chat.submit();
    })

    main.createStartBtn($("#player1Box"));
    main.createStartBtn($("#player2Box"));


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



