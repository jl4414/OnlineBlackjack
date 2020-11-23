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

bank = 100;
username = "jl4414";

app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port 3000");
});

app.get("/", function(req, res){
  res.render("deal", {
    bank: bank,
    username: username,
    bet: 5,
    playerHand: [{ number: 2, name: 'two', type: '♠️' }, { number: 9, name: 'nine', type: '♦️' },],
    dealerHand: [{ number: 2, name: 'two', type: '♠️' }],
    bestTotal: bestTotal([{ number: 2, name: 'two', type: '♠️' }, { number: 9, name: 'nine', type: '♦️' },]),
    options: ["Hit", "Stand", "Double", "Split"]
  });
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
