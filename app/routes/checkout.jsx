import {useActionData, useLoaderData} from "@remix-run/react";
import {json} from "@remix-run/node";
import {commitSession, getSession} from "../sessions.js";
import {selectableData} from "../../data/selectableConfig.js";
import {modelInfo} from "../../data/modelInfo.js";
import {initialData} from "../../data/initialConfig.js";
import {useState} from "react";

let uniData = [];

export async function loader({request}) {
    let session = await getSession(
        request.headers.get("Cookie")
    );
    console.log(uniData)

    let data = session.get("sessionid");
    if (data === undefined || uniData.length === 0) return null;

    return json({
        selectables: selectableData,
        modelInfo: modelInfo,
        initialData: initialData,
        configuration: uniData.filter(el => el.sessionid === data)[0]
    });
}

export default function Checkout() {
    const data = useLoaderData();
    if (data === null) return <div>Please configure your car first <a href="/">Back to Home</a></div>;

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    const [openedState, setOpenedState] = useState(data.selectables.componentCategories.map(() => false));
    console.log(openedState)

    let sum = data.modelInfo.priceInformation.price;
    data.configuration.equipmentAdded.forEach(eq => sum += eq.priceInformation.price);

    const handleOpenToggle = (e, category) => {
        e.preventDefault();
        setOpenedState(openedState.map((bool, index) => {
            return index===
                data.selectables.componentCategories.findIndex(
                el => el.categoryId === category.categoryId
                )
            ? !bool : bool;
            }
        ))
    }

    return (
        <>
            <div>
                <h1 style={{textAlign: "center"}}>Confirmation page</h1>
                <h2>{data.modelInfo.name} <span
                    style={{float: "right"}}>Final Price: {formatter.format(sum)}  </span>
                </h2>

                {data.selectables.componentCategories.map(category =>
                    <>
                        <br/>
                        <h2 onClick={(e) => handleOpenToggle(e, category)}
                            style={{borderTop: "1px solid"}}>
                            {category.categoryName}
                            <span
                                style={{float: "right"}}>{openedState[data.selectables.componentCategories.findIndex(el => el.categoryId === category.categoryId)] ? "X" : "↓"}</span>
                        </h2>

                        {openedState[
                                data.selectables.componentCategories.findIndex(
                                    el => el.categoryId === category.categoryId)
                                ] &&
                            <>
                                {Object.entries(data.selectables.vehicleComponents).map(code =>
                                    <>
                                        {code[1].componentType === category.categoryName &&
                                            !code[1].hidden && !code[1].pseudoCode && code[1].selected &&
                                            data.configuration.equipmentRemoved.findIndex(el => el.id === code[0]) < 0 &&
                                            <div style={{borderBottom: "1px solid"}}>
                                                <br/>
                                                <b>{code[0]}</b>
                                                - {code[1].name}
                                                <div style={{float: "right"}}>
                                                    <b>{formatter.format(code[1].priceInformation.price)}</b>
                                                </div>

                                            </div>
                                        }
                                    </>)}
                                {data.configuration.equipmentAdded.map(eq =>
                                    <>
                                        {eq.componentType === category.categoryName &&
                                            <div style={{borderBottom: "1px solid", color:"green"}}>
                                                <br/>
                                                <b>+</b>
                                                <b>{eq.id}</b>
                                                - {eq.name}
                                                <div style={{float: "right"}}>
                                                    <b>{formatter.format(eq.priceInformation.netPrice)}</b>
                                                </div>

                                            </div>
                                        }
                                    </>)}

                            </>}
                    </>)}
                <br/>
                <br/><br/><br/><br/>
            </div>

        </>
    )
}

export async function action({request}) {
    const data = await request.json();
    console.log(data);

    const index = uniData.findIndex(el => el.sessionid = data.sessionid);
    if (index > -1) uniData.splice(index, 1);
    uniData.push(data);

    return data;
}

