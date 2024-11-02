
import React from "react";
import { useState, useEffect } from 'react';
import { Button } from "../components/Button";



function StrawPoll(props) {


    window.spcv = props.CurrentVote;

    const { WaitingMessage = 'Waiting for other players.',
        playerRole = props.playerRole,
        ...restProps } = props;

    const features = props.featureData === undefined ? undefined : props.featureData.features;
    var submittedData_informal = props.submissionData;



    const handleVoteSubmit = (vote) => {

        props.handleVoteSubmission(vote);
        return;

        if (vote === 1 && submissionInfo && Math.round(submissionInfo.totalBonus * 100) / 100 < 0) {

            alert("This proposal will earn you a negative bonus, you are not allowed to accept it. Note that if you do not reach agreement, you will still earn the base pay for this task.");
            // Do not submit the vote, allow reselection
        } else {
            // Proceed with submitting the vote as normal
            props.handleVoteSubmission(vote);
        }
    };







    // const handleVoteSubmit = (vote) => {

    //     props.handleVoteSubmission(vote);
    // };



    const getSubmittedFeaturesAndBonuses = () => {

        if (!submittedData_informal) {
            return null;
        }

        const currentPlayerRole = playerRole;

        const { decisions } = submittedData_informal;


        const featuresAndBonuses = features.reduce((acc, feature) => {
            if (decisions[feature.name]) {
                acc.push({
                    featureName: feature.name,
                    bonus: feature.bonus[currentPlayerRole] || 0
                });
            }
            return acc;
        }, []);

        const totalBonus = featuresAndBonuses.reduce((total, { bonus }) => total + bonus, 0);

        return {
            submitterRole: submittedData_informal.submitterRole,
            featuresAndBonuses,
            totalBonus
        };
    };

    const submissionInfo = getSubmittedFeaturesAndBonuses();

    props.onChangeTotalBonus(submissionInfo && Math.round(submissionInfo.totalBonus * 100) / 100)
    const selectedFeatureNames = submittedData_informal ? Object.keys(submittedData_informal.decisions).join(", ") : "No features selected";


    const desiredFeaturesForRole = features === undefined ? undefined :
        features
            .filter(feature => feature.bonus[playerRole] === 1)
            .map(feature => feature.name)
            .join(", ");


    const proposalForVote = submittedData_informal ?
        <>

            <div className="second-styled-table thead th">
                <table className="styled-table"  >
                    <thead>
                        <tr  >
                            <td colSpan="2" style={{ borderTop: '0px', borderRight: '0px', borderLeft: '0px', fontWeight: 'bold' }}>
                                Proposal by {submittedData_informal['submitterRole']}
                                <br />
                                <div className="total-points-display"> </div>

                            </td>
                        </tr>
                        <tr  >
                            <th>Feature</th>
                            <th>Included</th>
                            <th>Bonus</th>
                        </tr>
                    </thead>
                    {/*<tbody>
                {submissionInfo && submissionInfo.featuresAndBonuses.map(({ featureName, bonus }, index) => (
                    <tr key={index}>
                    <td>{featureName}</td>
                    <td>{bonus}</td>
                    </tr>
                ))}
                <tr>
                </tr>
                </tbody>*/}
                    <tbody>
                        {features.map((feature, index) => {
                            const isSelected = selectedFeatureNames.includes(feature.name); // 检查特性是否被选中
                            const isDesiredFeature = desiredFeaturesForRole.includes(feature.name);
                            // 根据当前玩家角色计算奖励
                            const bonusForCurrentPlayer = isSelected ? feature.bonus[playerRole] : "-";

                            return (
                                <tr key={index}>
                                    <td className={isDesiredFeature ? "selected-feature" : ""}>{feature.name}</td>
                                    <td>{isSelected ? <span>&#10003;</span> : <span>&nbsp;</span>}</td>
                                    <td>{bonusForCurrentPlayer}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>


            </div>



        </>
        :
        <>
            <div className="second-styled-table thead th">
                <table className="styled-table"  >
                    <thead>
                        <tr>
                            <td colSpan="2" style={{ borderTop: '0px', borderRight: '0px', borderLeft: '0px', fontWeight: 'bold' }}>
                                &lt;No Proposal Has Been Made Yet&gt;
                            </td>
                        </tr>
                        <tr>
                            <th>Product Features</th>
                            <th>Bonus</th>
                        </tr>
                    </thead>
                    <tbody>

                        <tr>
                            <td>-</td>
                            <td>-</td>
                        </tr>

                        <tr>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>


    return (
        <div className="table-container">
            {proposalForVote}
        </div>
    );
}


export default StrawPoll;