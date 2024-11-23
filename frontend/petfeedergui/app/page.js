"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MdOutlineArrowForwardIos } from "react-icons/md";

export default function Home() {
  const [status, setStatus] = useState("Disconnected");
  const [breed, setBreed] = useState(null);
  const [kibble, setKibble] = useState(null);
  const [time, setTime] = useState(null);
  const [data, setData] = useState(null);
  const [val, setVal] = useState("Welcome! Let's feed your Cat!");

  useEffect(() => {
    const getData = async () => {
      const response = await fetch("http://127.0.0.1:5000/");
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
      <div className="flex flex-col items-center justify-between h-screen font-sofia font-bold text-[25px] bg-[#002452]">
        <div className="w-[100%] h-[20px] bg-[#F0B542]"></div>
        <div className="flex flex-col items-center text-white">
          <div className="w-[100%] text-center text-[25px] font-sofia font-bold flex flex-row justify-center items-center gap-5">
            {status}
            <span id="pulse" className="text-[40px] red-pulse">
              •
            </span>
          </div>
          <div className="text-[35px] xs:text-[30px] text-center">MREN 318 Group 10 Presents:</div>
          <div className="font-bold text-[35px] xs:text-[25px] w-[80%] text-center mb-5">
            The iAshtray V1.0
          </div>
          <div className="text[25px] text-[#F0B542] mb-5">
            By: Hari, Koa, and Salma
          </div>
          <Link className="flex flex-row items-center gap-3" href={"/cats"}>
            View Your Cats <MdOutlineArrowForwardIos />
          </Link>
          <Link className="flex flex-row items-center gap-3" href={"/upcoming"}>
            View Your Schedules <MdOutlineArrowForwardIos />
          </Link>
          <Link className="flex flex-row items-center gap-3" href={"/upcoming"}>
            View Pet Feeder Status <MdOutlineArrowForwardIos />
          </Link>
        </div>
        <div className="w-[100%] h-[20px] bg-[#F0B542]"></div>
      </div>
    </>
  );
}
