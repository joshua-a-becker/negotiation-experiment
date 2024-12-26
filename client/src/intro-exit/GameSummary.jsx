import React from "react";
import { useStage, useGame, usePlayer, usePlayers, useRound } from "@empirica/core/player/classic/react";
import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { useChat } from '../ChatContext';

export function GameSummary({ next }) {
  

  const player = usePlayer();
  const game = useGame();
  const stage = useStage();
  const round = useRound();
  const players = usePlayers();
  const treatment = game.get("treatment");
  const { basicpay } = treatment;
  
  const proposalHistory = game.get("proposalHistory");
 
  let returnText="Waiting for other players.."


  window.player = player;

    const totalBonus = parseFloat(player.get("bonus").reduce((sum, item) => sum + item.bonus, 0));
    const basePay = parseFloat(treatment.basicpay)
    const totalPay = totalBonus + basePay


    window.basePay=basePay
    window.totalPay = totalPay

    const roundBonusHtml = "<u>Round Bonuses</u><br/>" +
      player.get("bonus")
        .map(item => "Product: " + item.round + "<br/>Round Bonus: £" +item.bonus)
        .join("<br/><br/>")

    return(<>
      <div className="waiting-section">
        <br/><br/>
        <b>The game is over!  Thank you for participating.</b>
        <br/>You have earned £{parseFloat(totalPay).toFixed(2)} in total.
        <br/><br/>This includes a base payment of: £{parseFloat(basePay).toFixed(2)}
        <br/><br/>And the following round bonuses...
        <br/><br/>
        <span dangerouslySetInnerHTML={{__html: roundBonusHtml}} />
               <br/><br/><Button handleClick={next} autoFocus >
                  <p>Click to Finish</p>
                </Button>  
      </div>
    </>)

}

export default GameSummary;