//jshint esversion: 6
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: true
}));
const ejs = require('ejs');
app.set('view engine', 'ejs');
const deckOfCards = require("deck-o-cards");

var playerHand = [];
var dealerHand = [];
var options = [];
var bank = 100;
var bet = 0;

app.listen(process.env.PORT || 3000, function() {
  console.log("Listening on port 3000");
});

app.get("/", function(req, res) {
  if (playerHand.length == 0) {
    res.render("bet", {
      bank: bank,
      message: "",
    });
  } else {
    if (bet * 2 <= bank && dealerHand[0].number == dealerHand[1].number) {
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

app.get("/double", function(req, res){
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




app.post("/bet", function(req, res) {
  bet = Number(req.body.bet);
  if (bet > bank || bet < 0) {
    res.render("bet", {
      bank: bank,
      message: "Bet must be between 0 and " + bank,
    });
  } else {
    playerHand = Array.from(deckOfCards.randomizedDeck()).slice(0, 2);
    dealerHand = Array.from(deckOfCards.randomizedDeck()).slice(0, 2);
    res.redirect("/");
  }


});

app.get("/hit", function(req, res) {
  playerHand = playerHand.concat(Array.from(deckOfCards.randomizedDeck()).slice(0, 1));
  if (sumHand(playerHand) > 21) {
    bank -= bet;
    res.render("final", {
      title: "You Busted!",
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

app.get("/stand", function(req, res) {
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

app.get("/again", function(req, res) {
  bet = 0;
  playerHand = [];
  dealerHand = [];
  res.redirect("/");
});









function sumHand(hand) {
  sum = 0;
  hand.forEach(function(item) {
    sum += item.number;
  });
  return sum;
}

function bestTotal(hand) {
  aces = 0;
  total = 0;
  hand.forEach(function(item) {
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
