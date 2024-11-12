'use client'
import { useState, useEffect } from "react";

export default function Home() {

  const [status, setStatus] = useState("Disconnected");
  
  useEffect(() => {
    const getData = async () => {
      const response = await fetch("http://localhost:5000/");
      const data = await response.json();
      console.log(data.status);
      setStatus(data.status);
    };
    getData();
  }, []);

  useEffect(() => {
    if (status === "Connected") {
      document.getElementById("pulse").classList.add("green-pulse");
      document.getElementById("pulse").classList.remove("red-pulse");
    }
  }, [status]);
  return (
    <>
      <div className="w-[100%] h-[10px] bg-[#F0B542]"></div>
      <div className="w-[100%] text-center mt-3 text-[25px] font-sofia font-bold flex flex-row justify-center items-center gap-5">
        {status}
        <span id="pulse" className="text-[40px] red-pulse">
          •
        </span>
      </div>
      <div className="flex flex-col items-center  min-h-screen max-h-full font-sofia font-bold text-[25px]">
        <div className="text-[35px]">MREN 318 Group 10 Presents:</div>
        <div className="font-bold text-[35px] w-[40%] text-center mb-5">
         The Pet Feeder GUI
        </div>
        </div>
    </>
  );
}
