import React from "react";
import { useStage, useGame, usePlayer, usePlayers, useRound } from "@empirica/core/player/classic/react";
import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { useChat } from '../ChatContext';

export function Summary({ next }) {
  

  const player = usePlayer();
  const game = useGame();
  const stage = useStage();
  const round = useRound();
  const players = usePlayers();
  const treatment = game.get("treatment");
  const { basicpay } = treatment;
  
  const proposalHistory = game.get("proposalHistory");
 
  let returnText="Waiting for other players.."

  window.game=game;
  window.round=round;
  window.stagename=stage.get("name")
  window.treatment=treatment
  window.player=player

  if(stage.get("name") == "Round Summary" && (round.get("index")+1)==treatment.numRounds) {

    const totalBonus = player.get("bonus").reduce((sum, item) => sum + item.bonus, 0);
    const basePay = treatment.basicpay
    const totalPay = totalBonus + basePay

    const roundBonusHtml = "<u>Round Bonuses</u><br/>" +
      player.get("bonus")
        .map(item => "Product: " + item.round + "<br/>Round Bonus: £" +item.bonus)
        .join("<br/><br/>")

    return(<>
      <div className="waiting-section">
        <br/><br/>
        <b>The game is over!  Thank you for participating.</b>
        <br/>You have earned £{totalPay} in total.
        <br/><br/>This includes a base payment of: £{basePay}
        <br/><br/>And the following round bonuses...
        <br/><br/>
        <span dangerouslySetInnerHTML={{__html: roundBonusHtml}} />
      </div>
    </>)

  }

  const votingBlock = 
    <>
      <div className="container">
        <div className="waiting-section">
          <div className="loader"></div>
          <div>Other parties are still voting. Once votes are in and tallied, the results will be shown.</div>
        </div>
      </div>
    </>

  returnText="TBD"

  if(stage.get("name")=="Submit Formal Vote" || stage.get("name")=="Formal Vote") {
    returnText = votingBlock
  } 

  return (
    returnText
  );
}

export default Summary;