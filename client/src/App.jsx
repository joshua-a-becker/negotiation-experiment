import { EmpiricaClassic } from "@empirica/core/player/classic";
import { EmpiricaContext } from "@empirica/core/player/classic/react";
import { EmpiricaMenu, EmpiricaParticipant } from "@empirica/core/player/react";
import React from "react";
import { ChatProvider } from "./ChatContext";
import { Game } from "./Game";
import { AutoPlayerIdForm } from "./autoPlayerIdForm";
import { ExitSurvey } from "./intro-exit/ExitSurvey";
import { Introduction1 } from "./intro-exit/Introduction1";
import { Introduction2 } from "./intro-exit/Introduction2";
import { MyConsent } from "./intro-exit/MyConsent.jsx";
import { Sorry } from "./intro-exit/Sorry";
import { Summary } from "./intro-exit/Summary";
import { Walkthrough } from "./intro-exit/Walkthrough";
import { WaitingPage } from "./intro-exit/WaitingPage";

import {
  useGame,
  usePlayer,
  usePlayers,
  useRound,
  useStage,
} from "@empirica/core/player/classic/react";

export default function App() {

  const player = usePlayer();
  const players = usePlayers();
  const round = useRound();
  const stage = useStage();
  const game = useGame();

  const urlParams = new URLSearchParams(window.location.search);
  const playerKey = urlParams.get("participantKey") || "";
  const skipIntro = urlParams.get("skipIntro");
  const { protocol, host } = window.location;
  const url = `${protocol}//${host}/query`;

  const styles = {
    invalidURLStyle : {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '24px',
      color: '#333'
    }
  }

  function introSteps({ game, player }) {
    if (skipIntro) return [];
    //if(isDevelopment) return [WaitingPage];
    //return [Walkthrough, WaitingPage];
    //return [MyConsent];
    return [MyConsent, Introduction1, Introduction2, Walkthrough, WaitingPage];

  }

  function exitSteps({ game, player, round }) {

    if (game.get("goendTriggered") === true) {
      return [ExitSurvey];
    }

    if (player.get("ended") === "game failed" || player.get("ended") === "game terminated" || player.get("ended") === "no more games") {
      return [Sorry, ExitSurvey];
    }

    return [ExitSurvey];
  }

  const paramsObj = Object.fromEntries(urlParams?.entries());

  const playerIdFromUrl = paramsObj?.playerId || "undefined";

  if (playerIdFromUrl == "undefined") {
    return (
      // this should return an error page
      <div style={styles.invalidURLStyle}>
        You have arrived here via an invalid URL. 
      </div>
    )
  }

  return (
    <EmpiricaParticipant url={url} ns={playerIdFromUrl} modeFunc={EmpiricaClassic}>
      <ChatProvider>
        <div className="h-screen relative">
          <EmpiricaMenu position="bottom-left" />
          <div className="h-full ">
            <EmpiricaContext playerCreate={AutoPlayerIdForm} introSteps={introSteps} exitSteps={exitSteps} disableConsent={true}>
              <Game />
            </EmpiricaContext>
          </div>
        </div>
      </ChatProvider>
    </EmpiricaParticipant>
  );
}
