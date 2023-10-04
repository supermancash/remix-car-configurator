//import mercedes from '$lib/assets/mercedes.jpeg';
import {selectableData} from "../../data/selectableConfig.js";
import {modelInfo} from "../../data/modelInfo.js";
import {useLoaderData} from "@remix-run/react";
import React, {useState, useEffect} from "react";
import {getSession, commitSession} from "../sessions";
import {createSession, json} from "@remix-run/node";
import * as crypto from "crypto";

export async function loader({request}) {
    let session = await getSession(
        request.headers.get("Cookie")
    );

    let data = session.get("sessionid");
    if (data === undefined) data = crypto.randomUUID();
    session.set("sessionid", data);
    const cookie = await commitSession(session);
    console.log(data)

    return json({selectables: selectableData, modelInfo: modelInfo, sessionid: data}, {
            headers: {
                "Set-Cookie": cookie,
            }
        }
    );
}

export default function Index() {
    const {modelInfo, selectables, sessionid} = useLoaderData();

    console.log("========")
    console.log(sessionid)

    const [equipmentAdded, setEquipmentAdded] = useState([]);
    const [equipmentRemoved, setEquipmentRemoved] = useState([]);

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    const handleCheckBoxChange = (e, code, category) => {
        const equipmentAddedCopy = [...equipmentAdded];
        const equipmentRemovedCopy = [...equipmentRemoved];

        if (code.selected && !e.currentTarget.checked) {
            if (category.cardinality === "EXACTLY_ONE") {
                alert("You must choose at least one type of " + category.categoryName);
                return document.getElementById(code.id).checked = true;
            }
            equipmentRemovedCopy.push(code);
        }

        if (code.selected && e.currentTarget.checked) {
            if (category.cardinality === "EXACTLY_ONE") {
                const index = equipmentAddedCopy.findIndex(el => el.componentType === category.categoryName);
                if (index > -1) {
                    document.getElementById(equipmentAddedCopy[index].id).checked = false
                    equipmentAddedCopy.splice(index, 1);
                }
            }
            equipmentRemovedCopy.splice(equipmentRemovedCopy.indexOf(code), 1);
        }


        if (!code.selected && e.currentTarget.checked) {
            if (category.cardinality === "EXACTLY_ONE") {
                const index = equipmentAddedCopy.findIndex(el => el.componentType === category.categoryName);
                if (index > -1) document.getElementById(equipmentAddedCopy.splice(index, 1)[0].id).checked = false;
                if (index === -1) {
                    equipmentRemovedCopy.push(Object.entries(selectables.vehicleComponents).filter(
                        el => el[1].selected === true && category.categoryName === el[1].componentType)[0][1]);
                    document.getElementById(
                        Object.entries(selectables.vehicleComponents).filter(
                            el => el[1].selected === true && category.categoryName === el[1].componentType)[0][0]
                    ).checked = false;
                }
            }
            equipmentAddedCopy.push(code);
        }

        if (!code.selected && !e.currentTarget.checked) {
            if (category.cardinality === "EXACTLY_ONE") {
                document.getElementById(
                    Object.entries(selectables.vehicleComponents).filter(
                        el => el[1].selected === true && category.categoryName === el[1].componentType)[0][0]
                ).checked = true;
                equipmentRemovedCopy.splice(
                    equipmentRemovedCopy.indexOf(el => el.componentType === category.categoryName),
                    1);
            }
            equipmentAddedCopy.splice(equipmentAddedCopy.findIndex(el => el.id === code.id), 1);
        }

        setEquipmentAdded(equipmentAddedCopy);
        setEquipmentRemoved(equipmentRemovedCopy);
    }

    const handleProceed = async (e) => {
        e.preventDefault();
        await fetch('/checkout', {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({
                sessionid: sessionid,
                equipmentAdded: equipmentAdded,
                equipmentRemoved: equipmentRemoved
            })
        });
        window.location = "/checkout";
    }


    return (
        <div>
            <h1 style={{textAlign: "center"}}>Configuration page</h1>
            <div style={{margin: "auto", width: "50%", textAlign: "center"}}>
                <h3
                    key={"test"}>
                    Powered by
                    <span style={{
                        backgroundImage: "linear-gradient(to left, violet, indigo, blue, green, yellow, orange, red)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent"
                    }}>
                        {" Remix"}
                    </span>
                </h3>
            </div>


            <img style={{width: "90vw", display: "block", marginLeft: "auto", marginRight: "auto"}}
                 src="/mercedes.jpeg" alt="Picture of a mercedes"/>
            <h1>{modelInfo.name}</h1>
            {selectables.componentCategories.map((category, index) =>
                <div key={index}>
                    <br/>
                    <h2>{category.categoryName}</h2>
                    {Object.entries(selectables.vehicleComponents).map((code, index) =>
                        <div key={index}>
                            {(code[1].componentType === category.categoryName && !code[1].hidden && !code[1].pseudoCode)
                                &&
                                <div style={{borderBottom: "1px solid"}}>
                                    <br/>
                                    <b>{code[0]}</b>
                                    - {code[1].name}
                                    <div style={{float: "right"}}>
                                        <b>{formatter.format(code[1].priceInformation.price)}</b>
                                        <input
                                            type="checkbox"
                                            id={code[0]}
                                            defaultChecked={(code[1].selected && !equipmentRemoved.some((el) => el.id === code[1].id))
                                                || equipmentAdded.some((el) => el.id === code[1].id)
                                            }
                                            onClick={(e) => handleCheckBoxChange(e, code[1], category)}
                                        />
                                    </div>
                                </div>
                            }
                        </div>
                    )}
                </div>
            )}
            <br/>
            <div>{JSON.stringify(
                sessionid
            )}</div>
            <br/>
            <button style={{float: "right"}} onClick={(e) => handleProceed(e)}>Proceed to Checkout</button>
            <br/><br/><br/><br/>
        </div>
    );
}
