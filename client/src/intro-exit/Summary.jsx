import React from "react";
import { useGame, usePlayer, usePlayers, useRound } from "@empirica/core/player/classic/react";
import  { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { useChat } from '../ChatContext'; 

export function Summary({next}) {

    const player = usePlayer();
    const game = useGame();
    const round = useRound();
    const players = usePlayers();
  
    const treatment = game.get("treatment");
  
    const {basicpay} = treatment;

    const roleIdentifier = player.get("role");
    const roundPoints = player.get("roundPoints") || 0;
    const cumulativePoints = player.get("cumulativePoints") || 0;
    const roundPointsHistory = game.get("RoundPointsHistory");
    const totalRounds = roundPointsHistory ? roundPointsHistory.length / 3 : 0;
    const currentPlayerRoundPoints = roundPointsHistory.filter(({ role }) => role === roleIdentifier);
    const roundScores = currentPlayerRoundPoints.map(({ totalPoints }) => totalPoints).join(" + ");
     
    useEffect(() => {
        // 假设游戏状态中保存的属性名为RoundPointsHistory
        const roundPointsHistory = game.get("RoundPointsHistory");
        
        const missingProposal = game.get("missingProposal")

        if (roundPointsHistory) {
          // 计算总轮数
          const totalRounds = roundPointsHistory.length;
          
          // 计算累积得分，并生成每轮得分的描述字符串
          let cumulativePoints = 0;
          const roundScores = roundPointsHistory.map(({ totalPoints }) => {
            cumulativePoints += totalPoints;
            return totalPoints;
          }).join(" + ");
    
          // 设置总结信息
          console.log(`In total you have earned £ ${roundScores} across ${totalRounds} rounds, for a total of ${cumulativePoints}.`);
          
          console.log(game.get("missingProposal"))    
          window.game = game;
        }
      }, [game]);

      

  
    const handleContinue = () => {
      player.stage.set("submit", true);
    };

    const returnText = roundScores>=0 ?
      <>You earned a bonus of £{roundScores} and a base payment of £{basicpay} for a total payment of £{parseFloat(basicpay) + parseFloat(roundScores)}.</>
      : <>Your bonus was negative, and so was set to zero.<br/><br/>  You earned a base payment of £{basicpay}</>
    
  
    return (
      <>{game&&(<div className="waiting-section">
        <h4>
 
          <br />
          {/* <p>In total you have earned £{roundScores} across {totalRounds} rounds, for a total bonus of ${cumulativePoints}  with basic payment £{basicpay}.</p> */}
          { game.get("missingProposal") ? <>No proposal was submitted in time.<br/><br/></> : <></>}
          { game.get("pass")  ? "" : <>The proposal did not pass.<br/><br/></> }
          {returnText}
          <br />
          <br/><p>Please press "OK" to acknowledge and continue.</p>
        </h4>
        <br />
        <Button handleClick={next} autoFocus >
        <p>OK</p>
        </Button>  
        {/* <Button handleClick={handleContinue}>OK</Button> */}
      </div>)}</>
    );
  }
  
  export default Summary;