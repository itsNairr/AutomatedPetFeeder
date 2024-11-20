'use client'
import { useState, useEffect } from "react";

export default function Home() {

  const [status, setStatus] = useState("Disconnected");
  const [breed, setBreed] = useState(null);
  const [kible, setKible] = useState(null);
  const [time, setTime] = useState(null);
  const [data, setData] = useState(null);
  const [val, setVal] = useState("Hey!")
  
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

  
  const handleSubmit = async (event) => {
    event.preventDefault();
    document.getElementById("feed").style.display = "none";
    setVal("Processing...");
    console.log(JSON.stringify(models));
    try {
      const res = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ breed, kible, time }),
      });
      const data = await res.json();
      console.log(data.message);
      setVal(data.message);
    } catch (error) {
      console.log(error);
    }
  };

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
        <div className="text-[35px]">MREN 318 Group 10 Presents:</div>
        <div className="font-bold text-[35px] w-[40%] text-center mb-5">
         The Pet Feeder GUI
        </div>
        <div className="text[25px] text-[#F0B542]">
          By: Hari, Koa, and Salma
        </div>
        <form>
          <div className="flex flex-col items-center">
            <div className="text-[25px] font-sofia font-bold mt-5">Feed Your Cat!</div>
            <label className="mt-5">Select the cat breed:</label>
            <select
                id="breed"
                name="breed"
                required
                className="bg-transparent text-center rounded-lg text-white mt-1"
                onChange={(e) => setBreed(e.target.value)}
              >
                <option className="text-black bg-transparent" value="">Select</option>
                <option className="text-black bg-transparent" value="3">Garfield</option>
                <option className="text-black bg-transparent" value="6">Meow Meow</option>
                <option className="text-black bg-transparent" value="9">Goatsy</option>
                <option className="text-black bg-transparent" value="12">Angle</option>
              </select>
            {breed &&
            <>
            <label className="mt-5">Enter the amount of Kibble:</label>
            <input
              type="number"
              className="border-2 border-white w-[50%] h-[40px] bg-transparent text-center rounded-lg mt-1"
              required
              onChange={(e) => setKible(e.target.value)}
            />
            {kible &&
            <>
            <label className="mt-5">Select a time:</label>
            <input 
              type="time" 
              id="time"
              required
              className="bg-transparent text-center rounded-lg text-white mt-1"
              onChange={(e) => setTime(e.target.value)}
              />
            </>
            }
            {time && kible && breed && <button id="feed" onClick={handleSubmit} className="bg-[#b90e31] w-[50%] h-[40px] mt-5 rounded-lg">Feed</button>}
            </>
            }
          </div>
        </form>
        </div>
        <div className="w-[100%] h-[20px] bg-[#F0B542]"></div>
        </div>
        
    </>
  );
}
