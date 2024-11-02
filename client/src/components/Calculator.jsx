

import React from "react";
import { useState, useEffect, useContext, useRef } from 'react';
import { Button } from "../components/Button";
import CustomModal from "../stages/Modal";
import { ScrollContext } from "../components/ScrollContext";

function Calculator(props) {

    //const totalPoints = 100

    const { propSelectedFeatures = {},
        displaySubmit = true,
        handleOptionChange = () => { },
        featureData = {},
        ...restProps } = props;

    const [totalPoints, setTotalPoints] = useState(0);


    const codeSectionRef = useRef(null);

    const scrollToCodeSection = () => {
        if (codeSectionRef.current) {
            codeSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };


    const features = props.featureData === undefined ? props.featureData : props.featureData.features;

    const [selectedFeatures, setSelectedFeatures] = useState(propSelectedFeatures);

    const playerRole = props.playerRole;

    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const desiredFeaturesForRole = features
        .filter(feature => feature.bonus[playerRole] > 0)
        .map(feature => feature.name)
        .join(", ");

    const localHandleOptionChange = featureName => {
        console.log('select', selectedFeatures)
        setSelectedFeatures(prev => {
            const newState = { ...prev, [featureName]: !prev[featureName] };
            handleOptionChange(newState)
            return newState;
        });
    };

    const calculateTotal = props.calculatePoints

    const handleSubmitProposal = (event) => {

        event.preventDefault();

        if (codeSectionRef.current) {
            codeSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }

        const choices = features.reduce((choices, feature) => {
            if (selectedFeatures[feature.name]) {
                choices[feature.name] = feature.bonus[playerRole];
            }
            return choices;
        }, {});

        // if nothign selected, alert and do nothing
        if (!Object.values(selectedFeatures).some(value => value === true)) {
            setModalMessage(
                "You must propose at least one feature to include in your product"
            );
            setShowModal(true);
            console.log("stop!")
            return;
        }

        //const selectedFeatureNames = Object.keys(selectedFeatures).filter(feature => selectedFeatures[feature]);

        const submission_data = {
            decisions: choices,
            submitterRole: props.roleName,
            informalVote: [],
            formalVote: []
        };

        props.handleProposalSubmission(submission_data);


    };


    useEffect(() => {
        setTotalPoints(calculateTotal(selectedFeatures));

    }, [selectedFeatures]);


    const calculatorBody = <>
        {features.map((feature, index) => {
            const isDesiredFeature = desiredFeaturesForRole.includes(feature.name);
            return (
                <tr key={index}>
                    <td className={isDesiredFeature ? "selected-feature" : ""}>{feature.name}</td>
                    <td>
                        <input
                            type="checkbox"
                            checked={selectedFeatures[feature.name] || false}
                            onChange={() => localHandleOptionChange(feature.name)}
                        />
                    </td>
                    <td>
                        {selectedFeatures[feature.name] ?
                            <strong>{feature.bonus[playerRole]}</strong>
                            :
                            <div style={{ color: "#888888" }}>{feature.bonus[playerRole]}</div>
                        }
                    </td>
                </tr>
            );
        })}
    </>


    const renderCalculator =

        <>
            <table className="styled-table">
                <thead>
                    <tr>
                        <td colSpan="3" style={{ borderTop: '0px', borderRight: '0px', borderLeft: '0px', fontWeight: 'bold' }}>
                            {props.roleName} (you) - Scoring Calculator
                        </td>
                    </tr>
                    <tr style={{ backgroundColor: 'lightblue' }}>
                        <th>Product Features</th>
                        <th>Include</th>
                        <th>Bonus</th>
                    </tr>
                </thead>
                <tbody>
                    {calculatorBody}
                </tbody>
            </table>

            <div className="total-points-display">
                Total Bonus: ${Math.round(totalPoints * 100) / 100}
            </div>
            {props.displaySubmit && (
                <div className="button-container">

                    <button onClick={handleSubmitProposal}
                        className="submit-button"
                    >
                        Submit for Informal Vote
                    </button>
                    <CustomModal show={showModal} handleClose={handleCloseModal} message={modalMessage} />

                </div>
            )}

        </>

    return (
        <div className="table-wrapper">
            {renderCalculator}
            <div>
                {/* <button onClick={scrollToCodeSection}>scrollToCodeSection</button> */}
                <pre
                    ref={codeSectionRef}
                    style={{
                        padding: '40px',
                        background: '#FFFFFF',
                        color: '#fff',
                        borderRadius: '5px',
                    }}
                >
                    {``}
                </pre>
            </div>

        </div>
    );
}

export default Calculator;
