//jshint esversion: 6
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const db = require(__dirname + "/db");

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
username = "dummy";
playerHand1 = [];
playerHand2 = [];
dealerHand = [];
result = [];
options = [];
split = 0;


//Database operations
db.connect('mongodb+srv://jasaro:test@cluster0.9mu9m.mongodb.net/onlineBlackjack?retryWrites=true&w=majority');
var handLog = {
  username: String,
  bank: Number,
  bet: Number,
  intialPlayerDeal: Array,
  initialDealerDeal: Array,
  playerActions: [],
  finalDealerDeal: Array,
  outcome: Number,
}

handSchema = mongoose.Schema(handLog);
var Hand = mongoose.model('Hand', handSchema);



//Calls
app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port 3000");
});

//Renders homepage with place to enter bet
app.get("/", function(req, res){
  bet = 0;
  res.render("bet", {
    message:"",
    bank: bank,
    bet: bet,
  })
});

//Resets the bank account to 100 and redirects back to homepage
app.get("/reset", function(req, res){
  bank = 100;
  res.redirect("/");
});


//Validates the bet that is entered on the homepage. If not valid, returns to homepage with error. If valid, redirects to deal
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
    handLog.username = username;
    handLog.bank = bank;
    handLog.bet = bet;
    res.redirect("/deal");
  }
});

//Deals two cards to the player and one card to the dealer. Renders the correct options out of (Hit, Stand, Double, Split) depending on bank value and card values
app.get("/deal", function(req, res){
  playerHand1 = randomDeal(2);
  dealerHand = randomDeal(1);

  // Forced double:
  // playerHand1 = [{ number: 7, name: '7', type: '❤️'}, { number: 7, name: '7', type: '❤️'},]

  handLog.intialPlayerDeal = playerHand1;
  handLog.initialDealerDeal = dealerHand;

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

//Deals a card to the player. Renders a message if in split about the hand number (1 or 2). If the card results in a bust, redirects to the bust page
app.get("/hit", function(req, res){
  
  hand = [];
  if (split == 0){
    message = "";
    playerHand1 = playerHand1.concat(randomDeal(1));
    handLog.playerActions.push("H");
    handLog.playerActions.push(bestTotal(playerHand1));
    hand = playerHand1;
  }
  else if (split == 1){
    message = "Hand 1"
    playerHand1 = playerHand1.concat(randomDeal(1));
    hand = playerHand1;
    splitLog1.playerActions.push("H");
    splitLog1.playerActions.push(bestTotal(playerHand1));
  }
  else {
    message = "Hand 2"
    playerHand2 = playerHand2.concat(randomDeal(1));
    hand = playerHand2;
    splitLog2.playerActions.push("H");
    splitLog2.playerActions.push(bestTotal(playerHand2));
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

//Renders the bust page. Depending on if in a split or not, options change and message changes.
app.get("/bust", function(req, res){
  if (split == 0){
    message = "";
    result = normalMessage(playerHand1, dealerHand, bet);
    hand = playerHand1;
    options = "Play Again"
    bank -= bet;
    handLog.playerActions.push("B");
    handLog.outcome = betOutcome(playerHand1, dealerHand, bet) / bet;
    handLog.finalDealerDeal = dealerHand;
    db.uploadHand(handLog, Hand);
    handLog.playerActions = [];
  }
  else if (split == 1){
    message = "Hand 1";
    hand = playerHand1;
    result = normalMessage(playerHand1, dealerHand, bet);
    options = "Next Hand"
    splitLog1.playerActions.push("B");
  }
  else {
    message = "Hand 2";
    hand = playerHand2;
    result = normalMessage(playerHand2, dealerHand, bet);
    options = "See Result";
    splitLog2.playerActions.push("B");
  }
  
  res.render("bust", {
    message: message,
    bank: bank,
    username: username,
    newCard: hand[hand.length - 1],
    result: result,
    playerHand: hand,
    dealerHand: dealerHand,
    playerBestTotal: bestTotal(hand),
    dealerBestTotal: bestTotal(dealerHand),
    options: options,
  });
})

//If in normal hand, redirects to a compareToDealer page. If in split, moves to next or renders splitResult page
app.get("/stand", function(req, res){
  if (split == 0){
    if (handLog.playerActions[0] != "D") {
      handLog.playerActions.push("S");
    }
    dealerHand = dealerHit(dealerHand);
    result = normalMessage(playerHand1, dealerHand, bet);
    bank += betOutcome(playerHand1, dealerHand, bet);
    handLog.outcome = betOutcome(playerHand1, dealerHand, bet) / bet;
    handLog.finalDealerDeal = dealerHand;
    db.uploadHand(handLog, Hand);
    handLog.playerActions = [];
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
    splitLog1.playerActions.push("S");
    res.redirect("/playAgain");
  } 
  else {
    splitLog2.playerActions.push("S");
    res.redirect("/splitResults"); 
  }
  
});

//Split results. If both hands bust, go to special double bust page. If not, render messages for both hands and change bank to reflect results
app.get("/splitResults", function(req, res){
split = 0;
dealerHand = dealerHit(dealerHand);
splitLog1.finalDealerDeal = dealerHand;
splitLog2.finalDealerDeal = dealerHand;
splitLog1.outcome = betOutcome(playerHand1, dealerHand, bet, 1)/bet;
splitLog2.outcome = betOutcome(playerHand2, dealerHand, bet, 2)/bet;
db.uploadHand(splitLog1, Hand);
db.uploadHand(splitLog2, Hand);
splitLog1.playerActions = [];
splitLog2.playerActions = [];

if (bestTotal(playerHand1) > 21 && bestTotal(playerHand2) > 21 ){
  bank -= bet * 2;
  res.render("doubleBust", {
    playerHand1: playerHand1,
    playerHand2: playerHand2,
    playerBestTotal1: bestTotal(playerHand1),
    playerBestTotal2: bestTotal(playerHand2),
    bet: bet * 2,
    options: ["Play Again"]
  })
}
else {
  result1 = splitMessage(playerHand1, dealerHand, bet, 1);
  result2 = splitMessage(playerHand2, dealerHand, bet, 2);
  bank += (betOutcome(playerHand1, dealerHand, bet) + betOutcome(playerHand2, dealerHand, bet));
  res.render("splitResult", {
    bank: bank,
    username: username,
    bet: bet,
    playerHand1: playerHand1,
    playerHand2: playerHand2,
    result1: result1,
    result2: result2,
    dealerHand: dealerHand,
    playerBestTotal1: bestTotal(playerHand1),
    playerBestTotal2: bestTotal(playerHand2),
    dealerBestTotal: bestTotal(dealerHand),
    options: ["Play Again"],
  })
} 
});

//Splits the playes hand into two hands, and increments the split operator which controls messages on the hit and bust pages
app.get("/split", function(req, res){
  handLog.playerActions.push("Sp");
  handLog.outcome = 0;
  handLog.finalDealerDeal = [];
  db.uploadHand(handLog, Hand);

  playerHand2 = [playerHand1[1]];
  playerHand1.pop();
  split++;
  
  
  handLog.playerActions = [];
  splitLog1 = JSON.parse(JSON.stringify(handLog));
  splitLog2 = JSON.parse(JSON.stringify(handLog));
  splitLog1.initialDealerDeal = playerHand1;
  splitLog2.initialDealerDeal = playerHand2;


  res.redirect("/hit");
});

//this is the most confusing one. /playagain is the default route option for options on the bust and compare to dealer pages and normally restarts the game. 
//However, in splits, playAgain redirects to further pages becuase the game is essentially played twice before restarting.
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

//Doubles the bet, adds a card, and immediatly assesses whether it is a bust. If not, redirects immediatly to compare to dealer
app.get("/double", function (req, res){
  bet = bet * 2;
  playerHand1 = playerHand1.concat(randomDeal(1));
  handLog.playerActions.push("D");
  if (bestTotal(playerHand1) > 21){
    res.redirect("/bust");
  }
  else {
    res.redirect("/stand");
  }
});


//Functions

//Returns the sum of a players hand, assuming aces count as zero
function sumHand(hand) {
  sum = 0;
  hand.forEach(function (item) {
    sum += item.number;
  });
  return sum;
}

//Accounting for possibility that aces can count as 11, returns the total that is closest to 21
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

//Compares playerHand and dealerHand and returns the outcome of bet (postive, negative, or zero if draw)
function betOutcome(playerHand, dealerHand, bet) {
  if (bestTotal(playerHand) > 21) {
    return (bet * -1);
  }
  else if (bestTotal(dealerHand) >  21) {
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

//Returns an array of random cards of length amountOfCards
function randomDeal(amountOfCards) {
  deal = [];
  deal = Array.from(deckOfCards.randomizedDeck()).slice(0, amountOfCards);
  return deal;
}

//Takes the dealers hand and hits it until the best total is 17
function dealerHit(hand){
  while (bestTotal(hand) < 17) {
    hand = hand.concat(randomDeal(1));
  }
  return hand;
}

//Returns a custom message based on outcomes of hand and the hand number in a split
function splitMessage(playerHand, dealerHand, bet, handNumber){
  
  if (bestTotal(playerHand) > 21){
    return "Hand " + handNumber + " busted - you lose $" + bet;
  }
  else if (bestTotal(dealerHand) > 21) {
    return "Dealer busted - you win $" + bet;
  }
  else if (bestTotal(playerHand) > bestTotal(dealerHand)){
    return "Hand " + handNumber + " beat the dealer - you win $" + bet;
  }
  else if (bestTotal(playerHand) < bestTotal(dealerHand)) {
    return "Hand " + handNumber + " lost to the dealer - you lose $" + bet;
  }
  else {
    return "Hand " + handNumber + " drew to the dealer";
  }
}

//Returns a custom message based on hand result
function normalMessage(playerHand, dealerHand, bet){
  if (bestTotal(playerHand) > 21){
    return "You busted - you lose $" + bet;
  }
  else if (bestTotal(dealerHand) > 21) {
    return "Dealer busted - you win $" + bet;
  }
  else if (bestTotal(playerHand) > bestTotal(dealerHand)){
    return "You beat the dealer - you win $" + bet;
  }
  else if (bestTotal(playerHand) < bestTotal(dealerHand)) {
    return "You lost to the dealer - you lose $" + bet;
  }
  else {
    return "You drew to the dealer";
  }
}