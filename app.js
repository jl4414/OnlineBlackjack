//jshint esversion: 6
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
const ejs = require('ejs');
app.set('view engine', 'ejs');
const deckOfCards = require("deck-o-cards");

var playerHand = [];
var playerHand2 = [];
var playerHand3 = [];
var dealerHand = [];
var options = [];
var bank = 100;
var bet = 0;

app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port 3000");
});

app.get("/", function (req, res) {
  if (playerHand.length == 0) {
    res.render("bet", {
      bank: bank,
      message: "",
    });
  } else {
    if (bet * 2 <= bank && playerHand[0].number == playerHand[1].number) {
      options = ["hit", "stand", "double", "split"];
    } else if (bet * 2 <= bank) {
      options = ["hit", "stand", "double"];
    } else {
      options = ["hit", "stand"];
    }
    res.render("index", {
      bet: bet,
      playerHand: playerHand,
      dealerHand: dealerHand,
      options: options,
      playerBestTotal: bestTotal(playerHand),
    });
  }
});

app.get("/split", function (req, res) {
  playerHand2 = [playerHand[1]];
  playerHand.pop();
  res.render("split", {
    title: "Hand 1",
    bet: bet,
    dealerHand: dealerHand,
    playerHand: playerHand,
    options: ["hit", "stand"],
    playerBestTotal: bestTotal(playerHand)
  })
})

app.get("/splithit", function (req, res) {
  playerHand = playerHand.concat(Array.from(deckOfCards.randomizedDeck()).slice(0, 1));
  if (sumHand(playerHand) > 21) {
    bank -= bet;
    res.render("split", {
      title: "You Busted!",
      bet: bet,
      playerHand: playerHand,
      dealerHand: dealerHand,
      options: ["Next"],
      playerBestTotal: bestTotal(playerHand),
    });
  } else {
    res.render("split", {
      title: "Hand 1",
      bet: bet,
      dealerHand: dealerHand,
      playerHand: playerHand,
      options: ["hit", "stand"],
      playerBestTotal: bestTotal(playerHand)
    })
  }
})

app.get("/splitNext", function (req, res) {
  if (playerHand3.length != 0) {
    res.redirect("/splitResult");
  } else {
    playerHand3 = playerHand;
    playerHand = playerHand2;
    playerHand.concat(Array.from(deckOfCards.randomizedDeck()).slice(0, 1));
    if (sumHand(playerHand) > 21) {
      bank -= bet;
      res.render("split", {
        title: "You Busted!",
        bet: bet,
        playerHand: playerHand,
        dealerHand: dealerHand,
        options: ["Next"],
        playerBestTotal: bestTotal(playerHand),
      });
    } else {
      res.render("split", {
        title: "Hand 2",
        bet: bet,
        dealerHand: dealerHand,
        playerHand: playerHand,
        options: ["hit", "stand"],
        playerBestTotal: bestTotal(playerHand)
      })
    }
  }
})

app.get("/splitResult", function (req, res) {
  if (bestTotal(playerHand) > 21 && bestTotal(playerHand3) > 21) {
    res.render("splitfinal", {
      title: "Both bust!",
      bet: bet * 2,
      bank: bank,
      dealerHand: dealerHand,
      playerHand3: playerHand3,
      playerHand2: playerHand,
      player3BestTotal: bestTotal(playerHand3),
      player2BestTotal: bestTotal(playerHand),
      dealerBestTotal: bestTotal(dealerHand),

    })
  }
  else if (bestTotal(playerHand) < 21 || bestTotal(playerHand3) < 21) {
    while (bestTotal(dealerHand) < 17) {
      dealerHand = dealerHand.concat(Array.from(deckOfCards.randomizedDeck()).slice(0, 1));
    }
    if (bestTotal(dealerHand) > bestTotal(playerHand) && bestTotal(dealerHand) > bestTotal(playerHand3)) {
      bank -= bet * 2,
        res.render("splitfinal", {
          title: "Both lose!",
          bet: bet * 2,
          bank: bank,
          dealerHand: dealerHand,
          playerHand3: playerHand3,
          playerHand2: playerHand,
          player3BestTotal: bestTotal(playerHand3),
          player2BestTotal: bestTotal(playerHand),
          dealerBestTotal: bestTotal(dealerHand),
        })
    }
    else if (bestTotal(dealerHand) < bestTotal(playerHand) && bestTotal(dealerHand) < bestTotal(playerHand3) && bestTotal(playerHand) < 22 && bestTotal(playerHand3) < 22) {
      bank += bet * 2,
      res.render("splitfinal", {
        title: "Both win!",
        bet: bet * 2,
        bank: bank,
        dealerHand: dealerHand,
        playerHand3: playerHand3,
        playerHand2: playerHand,
        player3BestTotal: bestTotal(playerHand3),
        player2BestTotal: bestTotal(playerHand),
        dealerBestTotal: bestTotal(dealerHand),
      })
    }
    else if (bestTotal(dealerHand) < bestTotal(playerHand) && bestTotal(dealerHand) > bestTotal(playerHand3) && bestTotal(playerHand) < 22 && bestTotal(playerHand3) < 22){
      bank += bet,
      res.render("splitfinal", {
        title: "Win one, lose one!",
        bet: bet * 2,
        bank: bank,
        dealerHand: dealerHand,
        playerHand3: playerHand3,
        playerHand2: playerHand,
        player3BestTotal: bestTotal(playerHand3),
        player2BestTotal: bestTotal(playerHand),
        dealerBestTotal: bestTotal(dealerHand),
      })
    }
    else if (bestTotal(dealerHand) > bestTotal(playerHand) && bestTotal(dealerHand) < bestTotal(playerHand3) && bestTotal(playerHand) < 22 && bestTotal(playerHand3) < 22){
      bank += bet,
      res.render("splitfinal", {
        title: "Win one, lose one!",
        bet: bet * 2,
        bank: bank,
        dealerHand: dealerHand,
        playerHand3: playerHand3,
        playerHand2: playerHand,
        player3BestTotal: bestTotal(playerHand3),
        player2BestTotal: bestTotal(playerHand),
        dealerBestTotal: bestTotal(dealerHand),
      })
    }
    
  }

  app.get("/double", function (req, res) {
    bet = bet * 2;
    playerHand = playerHand.concat(Array.from(deckOfCards.randomizedDeck()).slice(0, 1));
    if (sumHand(playerHand) > 21) {
      bank -= bet;
      res.render("final", {
        title: "You Busted",
        bet: "",
        bank: bank,
        playerHand: playerHand,
        dealerHand: dealerHand,
        playerBestTotal: bestTotal(playerHand),
        dealerBestTotal: bestTotal(dealerHand),
      });
    } else {
      res.redirect("/stand");
    }
  });

  app.post("/bet", function (req, res) {
    bet = Number(req.body.bet);
    if (bet > bank || bet < 0) {
      res.render("bet", {
        bank: bank,
        message: "Bet must be between 0 and " + bank,
      });
    } else {
      // playerHand = Array.from(deckOfCards.randomizedDeck()).slice(0, 2);
      playerHand = [{ number: 2, name: 'two', type: '♠️' }, { number: 2, name: 'two', type: '❤️' }];
      dealerHand = Array.from(deckOfCards.randomizedDeck()).slice(0, 2);
      res.redirect("/");
    }


  });

  app.get("/hit", function (req, res) {
    playerHand = playerHand.concat(Array.from(deckOfCards.randomizedDeck()).slice(0, 1));
    if (sumHand(playerHand) > 21) {
      bank -= bet;
      res.render("final", {
        title: "You Busted",
        bank: bank,
        bet: "",
        playerHand: playerHand,
        dealerHand: dealerHand,
        playerBestTotal: bestTotal(playerHand),
        dealerBestTotal: bestTotal(dealerHand),
      });
    } else {
      res.render("index", {
        bet: bet,
        playerHand: playerHand,
        dealerHand: dealerHand,
        options: ["hit", "stand"],
        playerBestTotal: bestTotal(playerHand),
      });
    }
  });

  app.get("/stand", function (req, res) {
    while (bestTotal(dealerHand) < 17) {
      dealerHand = dealerHand.concat(Array.from(deckOfCards.randomizedDeck()).slice(0, 1));
    }

    if (bestTotal(dealerHand) == bestTotal(playerHand)) {
      res.render("final", {
        title: "You pushed",
        bet: "",
        bank: bank,
        playerHand: playerHand,
        dealerHand: dealerHand,
        playerBestTotal: bestTotal(playerHand),
        dealerBestTotal: bestTotal(dealerHand),
      });
    } else if ((bestTotal(dealerHand) > bestTotal(playerHand)) && bestTotal(dealerHand) < 22) {
      bank -= bet;
      res.render("final", {
        title: "You lost",
        bet: "$" + bet,
        bank: bank,
        playerHand: playerHand,
        dealerHand: dealerHand,
        playerBestTotal: bestTotal(playerHand),
        dealerBestTotal: bestTotal(dealerHand),
      });
    } else {
      bank += bet;
      res.render("final", {
        title: "You won",
        bet: "$" + bet,
        bank: bank,
        playerHand: playerHand,
        dealerHand: dealerHand,
        playerBestTotal: bestTotal(playerHand),
        dealerBestTotal: bestTotal(dealerHand),
      });
    }
  });

  app.get("/again", function (req, res) {
    bet = 0;
    playerHand = [];
    dealerHand = [];
    res.redirect("/");
  });

  function sumHand(hand) {
    sum = 0;
    hand.forEach(function (item) {
      sum += item.number;
    });
    return sum;
  }
  function bestTotal(hand) {
    aces = 0;
    total = 0;
    hand.forEach(function (item) {
      if (item.number == 1) {
        aces += 1;
      } else {
        total += item.number;
      }
    });
    if (sumHand(hand) > 21) {
      return sumHand(hand);
    } else if (aces == 1) {
      if (total + 11 < 22) {
        return total + 11;
      } else {
        return sumHand(hand);
      }
    } else if (aces > 1) {
      if (total + 11 + (aces - 1) < 22) {
        return total + 11 + (aces - 1);
      } else {
        return total + aces;
      }
    } else {
      return sumHand(hand);
    }
  }
