import React, { useEffect, useRef, useState, useMemo } from "react";
import { useGame, usePlayer } from "@empirica/core/player/classic/react";
import DailyIframe from "@daily-co/daily-js";

export default function VideoChat({ playerId, gameId, roundId }) {
  const localVideoRef = useRef();
  const callObjectRef = useRef(null);

  const game = useGame();
  const player = usePlayer();

  const roomUrl = game?.get("roomUrl");
  const [remoteStreams, setRemoteStreams] = useState({});
  const [participantNames, setParticipantNames] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);


  // const [roomUrl, setRoomUrl] = useState(null);

  // Self-sustaining poll that doesn't depend on game reactivity
  // useEffect(() => {
  //   console.log("start polling")
  //   const pollForRoomUrl = () => {
  //     console.log("poll")
  //     console.log(`game url: ${game?.get("roomUrl")}`)
  //     const currentRoomUrl = game?.get("roomUrl");
  //     if (currentRoomUrl && currentRoomUrl !== roomUrl) {
  //       setRoomUrl(currentRoomUrl);
  //       return; // Stop polling once found
  //     }
  //     // Schedule next poll
  //     setTimeout(pollForRoomUrl, 1000);
  //   };
    
  //   // Start polling immediately
  //   pollForRoomUrl();
  // }, []); // Empty deps - runs once and sustains itself

  // Prevents "Duplicate DailyIframe instances are not allowed" in dev
  const Daily = useMemo(() => {
    if (typeof window !== "undefined") {
      // Reuse the same DailyIframe instance across hot reloads
      const lib = window.DailyIframe || DailyIframe;
      if (!window.DailyIframe) window.DailyIframe = lib;
      return lib;
    }
    return DailyIframe;
  }, []);

  useEffect(() => {
    console.log("VideoChat effect running. roomUrl:", roomUrl);
    if (!roomUrl) return;

    // Reuse an existing call object if one already exists 
    let callObject = Daily.getCallInstance?.() || null;
    if (!callObject) {
      console.log("Creating Daily call object.");
      callObject = Daily.createCallObject();
 
    } else {
      console.log("Reusing existing Daily call object.");
    }

    callObjectRef.current = callObject;

    // --- Handlers ---
    const handleJoined = async () => {
      console.log("Joined meeting.");
      const participants = callObject.participants();
      const local = participants.local;

    // Debug: Log all participant data
    console.log("handling join")
    console.log("All participants:", participants);
     console.log("Local participant user_name:", participants.local?.user_name);

      if (local) {
        setParticipantNames((prev) => ({
          ...prev,
          [local.session_id]: local.user_name ?? "You",
        }));
      }

      try {
        await callObject.startRecording({
          type: "cloud",
            layout: {
              preset: 'custom',
              composition_params: {
                'videoSettings.showParticipantLabels': true,
                // 'videoSettings.labels.fontFamily': 'Exo',
                // 'videoSettings.labels.fontWeight': '500',
                // 'videoSettings.labels.fontSize_pct': 100,
                // 'videoSettings.labels.color': 'white',
                // 'videoSettings.labels.strokeColor': 'rgba(0, 0, 0, 0.9)'
              },
            },  
        });
        setIsRecording(true);
        console.log("Recording started in Daily Cloud.");
      } catch (err) {
        console.error("Failed to start recording:", err);
      }
    };

    const handleTrackStarted = (ev) => {
      console.log("Track started:", ev);
      const { participant, track } = ev;
      if (track.kind !== "video") return;

      if (participant.local) {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = new MediaStream([track]);
        }
      } else {
        setRemoteStreams((prev) => ({
          ...prev,
          [participant.session_id]: new MediaStream([track]),
        }));
        if (participant.user_name) {
          setParticipantNames((prev) => ({
            ...prev,
            [participant.session_id]: participant.user_name,
          }));
        }
      }
    };

    const handleParticipantLeft = (ev) => {
      console.log("Participant left:", ev);
      const { session_id } = ev.participant;
      setRemoteStreams((prev) => {
        const updated = { ...prev };
        delete updated[session_id];
        return updated;
      });
      setParticipantNames((prev) => {
        const updated = { ...prev };
        delete updated[session_id];
        return updated;
      });
    };

    const handleLeftMeeting = async () => {
      console.log("Left meeting.");
      if (isRecording) {
        try {
          await callObject.stopRecording();
          console.log("Recording stopped and saved in Daily Cloud.");
        } catch (err) {
          console.error("Failed to stop recording:", err);
        }
      }
    };

    // Attach listeners (and be sure to remove them in cleanup)
    callObject.on("joined-meeting", handleJoined);
    callObject.on("track-started", handleTrackStarted);
    callObject.on("participant-left", handleParticipantLeft);
    callObject.on("left-meeting", handleLeftMeeting);

    // Join only if not already joining/joined
    // Join with retry logic
    const joinWithRetry = async (attempt = 1) => {
      console.log("tryin to join")
      const state = callObject.meetingState?.();
      if (state === "joining" || state === "joined") {
        console.log("Already in meeting state:", state);
        return;
      }
      
      try {
        console.log(`Joining meeting at: ${roomUrl} (attempt ${attempt})`);
        console.log(`Player name: ${player.get("role")}`)
        await callObject.join({ 
          url: roomUrl
          , userName: player.get("role")
         });
      } catch (error) {
        console.error(`Join attempt ${attempt} failed:`, error);
        if (attempt < 10) {
          setTimeout(() => joinWithRetry(attempt + 1), 2000);
        } else {
          console.error("Max join attempts reached");
        }
      }
    };

    console.log("join with retry")
    joinWithRetry();

    // Cleanup on unmount or roomUrl change
    return () => {
      console.log("Cleaning up Daily call listeners and leaving room.");
      try {
        callObject.off("joined-meeting", handleJoined);
        callObject.off("track-started", handleTrackStarted);
        callObject.off("participant-left", handleParticipantLeft);
        callObject.off("left-meeting", handleLeftMeeting);
      } catch {}

      // Leave the meeting, but DO NOT destroy the DailyIframe library
      callObject.leave?.();
    };
  }, [roomUrl, Daily]);

    const RemoteVideo = ({ stream, name }) => {
        const ref = useRef();
        useEffect(() => {
        if (ref.current && stream && ref.current.srcObject !== stream) {
            ref.current.srcObject = stream;
        }
        }, [stream]);

        return (
            <div style={{ textAlign: "center" }}>
                <video
                ref={ref}
                autoPlay
                playsInline
                style={{ width: "500px", border: "2px solid blue" }}
                />
                <div style={{ marginTop: "5px", fontWeight: "bold" }}>{name}</div>
            </div>
        );
    };

    const totalVideos = 1 + Object.keys(remoteStreams).length; // local + remotes
    const maxHeight = Math.min(80 / totalVideos, 25); // Distribute 80vh among videos, cap at 25vh each


    if (!roomUrl) {
      return <div>Setting up video room...</div>;
    }
    return (
        <div>
            {/* Recording Indicator */}
            {isRecording && (
            <div className="mb-4 font-bold">● Recording in progress</div>
            )}

            {/* Video Grid */}
            <div
            className="grid gap-3"
            style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                alignItems: "start",
            }}
            >
            {/* Local video */}
            <div className="text-center" style={{ overflow: "visible" }}>
                <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full rounded border bg-black"
                style={{
                    maxHeight: `${maxHeight}vh`,
                    aspectRatio: "16 / 9",
                    objectFit: "contain",
                    objectPosition: "center",
                    padding: "6px",
                    boxSizing: "border-box",
                }}
                />
                <div className="mt-1 font-semibold">You</div>
            </div>

            {/* Remote participants */}
            {Object.entries(remoteStreams).map(([id, stream]) => (
                <div key={id} className="text-center" style={{ overflow: "visible" }}>
                <video
                    autoPlay
                    playsInline
                    className="w-full rounded border bg-black"
                    style={{
                        maxHeight: `${maxHeight}vh`,
                        aspectRatio: "16 / 9",
                        objectFit: "contain",
                        objectPosition: "center",
                        padding: "6px",
                        boxSizing: "border-box",
                    }}
                    ref={(el) => {
                    if (el && stream && el.srcObject !== stream) {
                        el.srcObject = stream;
                    }
                    }}
                />
                <div className="mt-1 font-semibold">
                    {participantNames[id] || "Participant"}
                </div>
                </div>
            ))}
            </div>
        </div>
    );

}