import CSVReader from "./csvread";
import React, { useEffect } from "react";

export default function IowaGames() {
    const [data, setData] = React.useState("")
    const handleUpload = d => {
        setData(d)
    }
    useEffect(() => {
        console.log(data)
    }, [data])
    return (
        <div className='games'>
            <h1>TODO Games Code</h1>
            <CSVReader parentCallback={handleUpload}/>
        </div>
    )
}