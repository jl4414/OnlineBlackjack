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
const e = require("express");

bank = 100;
bet = 0;
username = "jl4414";
playerHand1 = [];
playerHand2 = [];
dealerHand = [];
result = [];
options = [];
split = 0;

app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port 3000");
});

app.get("/", function(req, res){
  res.render("bet", {
    message:"",
    bank: bank,
    bet: bet,
  })
});

app.post("/bet", function(req, res){
  bet = Number(req.body.bet);
  if (bet > bank){
    bet = 0;
    res.render("bet", {
      message: "The bet must be smaller than the bank",
      bank: bank,
      bet: bet,
    })
  }
  else if (bet < 0) {
    bet = 0;
    res.render("bet", {
      message: "The bet must be larger than 0",
      bank: bank,
      bet: bet,
    })
  }
  else {
    res.redirect("/deal");
  }
});

app.get("/deal", function(req, res){
  // playerHand1 = randomDeal(2);
  playerHand1 = [{ number: 5, name: '5' , type: '♦️'}, { number: 5, name: '5' , type: '♦️'}]
  dealerHand = randomDeal(1);
  if (bet * 2 > bank){
    options = ["Hit", "Stand"];
  }
  else if (playerHand1[0].number == playerHand1[1].number){
    options = ["Hit", "Stand", "Double", "Split"];
  }
  else {
    options = ["Hit", "Stand", "Double"];
  }
  res.render("deal", {
    bank: bank,
    username: username,
    bet: bet,
    playerHand: playerHand1,
    dealerHand: dealerHand,
    playerBestTotal: bestTotal(playerHand1),
    dealerBestTotal: bestTotal(dealerHand),
    options: options,
  });
})

app.get("/hit", function(req, res){
  hand = [];
  if (split == 0){
    message = "";
    playerHand1 = playerHand1.concat(randomDeal(1));
    hand = playerHand1;
  }
  else if (split == 1){
    message = "Hand 1"
    playerHand1 = playerHand1.concat(randomDeal(1));
    hand = playerHand1;
  }
  else {
    message = "Hand 2"
    playerHand2 = playerHand2.concat(randomDeal(1));
    hand = playerHand2;
  }

  if (bestTotal(hand) < 22){
    res.render("hit", {
      message: message,
      bank: bank,
      username: username,
      newCard: hand[hand.length - 1],
      bet: bet,
      playerHand: hand,
      dealerHand: dealerHand,
      playerBestTotal: bestTotal(hand),
      dealerBestTotal: bestTotal(dealerHand),
      options: ["Hit", "Stand",]
    });
  }
  else {
    res.redirect("/bust")
  }
  
});

app.get("/bust", function(req, res){
  if (split == 0){
    message = "";
    hand = playerHand1;
    options = "Play Again"
  }
  else if (split == 1){
    message = "Hand 1";
    hand = playerHand1;
    options = "Next Hand"
  }
  else {
    message = "Hand 2";
    hand = playerHand2;
    options = "See Result";
  }

  bank -= bet;
  res.render("bust", {
    message: message,
    bank: bank,
    username: username,
    newCard: hand[hand.length - 1],
    bet: bet,
    playerHand: hand,
    dealerHand: dealerHand,
    playerBestTotal: bestTotal(hand),
    dealerBestTotal: bestTotal(dealerHand),
    options: options,
  });
})

app.get("/stand", function(req, res){
  if (split == 0){
    dealerHand = dealerHit(dealerHand);
    if (bestTotal(dealerHand) > 21){
      result = ["WIN", "win", bet];
      bank += bet;
    }
    else if (bestTotal(dealerHand) > bestTotal(playerHand1)){
      result = ["LOSE", "lose", bet];
      bank -= bet;
    }
    else if (bestTotal(dealerHand) < bestTotal(playerHand1)){
      result = ["WIN", "win", bet];
      bank += bet;
    }
    else {
      result = ["DRAW", "draw", 0];
    }
    res.render("compareToDealer", {
      bank: bank,
      result: result,
      username: username,
      newCard: playerHand1[playerHand1.length - 1],
      bet: bet,
      playerHand: playerHand1,
      dealerHand: dealerHand,
      playerBestTotal: bestTotal(playerHand1),
      dealerBestTotal: bestTotal(dealerHand),
      options: ["Play Again"]
    });
  }
  else if (split ==  1){
    res.redirect("/playAgain");
  } 
  else {
    res.redirect("/splitResults");
  }
  
});

app.get("/split", function(req, res){
  playerHand2 = [playerHand1[1]];
  playerHand1.pop();
  split++;
  res.redirect("/hit");
});

app.get("/playAgain", function(req, res){
  if (split == 0){
    res.redirect("/");
  }
  else if (split == 1){
    split++;
    res.redirect("/hit");
  }
  else {
    res.redirect("/splitResults");
  }
  
})

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

function betOutcome(playerHand, dealerHand, bet) {
  if (bestTotal(playerHand) > 21) {
    return (bet * -1);
  }
  else if (bestTotal(dealerHand > 21)) {
    return bet;
  }
  else {
    if (bestTotal(playerHand) == bestTotal(dealerHand)) {
      return 0;
    }
    else if (bestTotal(playerHand) < bestTotal(dealerHand)) {
      return (bet * -1);
    }
    else {
      return bet;
    }
  }
}

function randomDeal(amountOfCards) {
  deal = [];
  deal = Array.from(deckOfCards.randomizedDeck()).slice(0, amountOfCards);
  return deal;
}

function dealerHit(hand){
  while (bestTotal(hand) < 17) {
    hand = hand.concat(randomDeal(1));
  }
  return hand;
}
