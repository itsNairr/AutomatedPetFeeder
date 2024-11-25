"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import Link from "next/link";
import { GrPowerReset } from "react-icons/gr";

function AddSchedule() {
  const [schedule, setSchedule] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });
  const [name, setName] = useState(null);
  const [catHash, setCatHash] = useState({});
  const [val, setVal] = useState("Submit");

  const handleAddFeedingTime = (day) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: [...prev[day], { time: "", kibble: "", status: "On Time" }],
    }));
  };

  const handleTimeChange = (day, index, value) => {
    const updatedDay = [...schedule[day]];
    updatedDay[index].time = value;
    setSchedule((prev) => ({ ...prev, [day]: updatedDay }));
  };

  const handleKibbleChange = (day, index, value) => {
    const updatedDay = [...schedule[day]];
    updatedDay[index].kibble = value;
    setSchedule((prev) => ({ ...prev, [day]: updatedDay }));
  };

  useEffect(() => {
    const getData = async () => {
      const response = await fetch("http://127.0.0.1:5000/subscribe/cats");
      const data = await response.json();
      console.log(data);
      setCatHash(data);
    };
    getData();
  }, []);

  const handleReset = () => {
    setSchedule({
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    });
    setName(null);
    setVal("Submit");
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission
  
    const form = event.target;
    
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    setVal("Processing...");
    document.getElementById("submit").disabled = true;
    try {
      const res = await fetch("http://127.0.0.1:5000/upload/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ schedule, name }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log(data.message);
        setVal(data.message);
        document.getElementById("submit").style.backgroundColor = "#34eb55";
        setTimeout(() => {
          setName(null);
          setSchedule({
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
            Sunday: [],
          });
          redirect("/schedules");
        }, 2000);
      } else {
        setVal(data.message);
        setTimeout(() => { 
          setVal("Submit");
          document.getElementById("submit").disabled = false;
        }, 2000);
      }
    } catch (error) {
      console.log(error);
      setVal("Error! Please try again.");
      setTimeout(() => { 
        setVal("Submit");
        document.getElementById("submit").disabled = false;
      }, 2000);
    }
  };

  return (
    <>
      <div className="w-[100%] h-[20px] bg-[#F0B542]"></div>
      <div className="w-[100%] bg-[#002452] text-[25px] text-white flex justify-between flex-row p-3 items-center">
        <Link
          href={"/schedules"}
          className="font-bold flex flex-row items-center gap-1"
        >
          <IoArrowBack />
          Back
        </Link>
        <button className="font-bold flex flex-row items-center gap-1"
        onClick={handleReset}>
          Reset <GrPowerReset />
        </button>
      </div>
      <div className="flex flex-col font-semibold xs:pt-5 xs:justify-start min-h-screen max-h-full font-sofia text-[25px] bg-[#002452] text-white">
        <div className="text-center mb-5">
          Create your Schedule!
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-5">
            <label className="mt-5 text-center">Select yout cat</label>
            <div className="flex flex-row justify-center">
              <select
                id="breed"
                name="breed"
                value={name || ""}
                required
                className="bg-transparent text-center rounded-lg text-white mt-1"
                onChange={(e) => setName(e.target.value)}
              >
                <option className="text-black bg-transparent" value="">
                  Select
                </option>
                {catHash &&
                  Object.entries(catHash).map(([breed, cat]) => (
                    <option
                      key={breed}
                      value={cat}
                      className="text-black bg-transparent"
                    >
                      {cat}
                    </option>
                  ))}
              </select>
            </div>

            {name &&
              Object.keys(schedule).map((day) => (
                <div
                  key={day}
                  className="bg-[#003366] p-3 rounded-lg flex flex-col justify-center mx-3"
                >
                  <h3 className="text-center text-[25px]">{day}</h3>
                  {schedule[day].map((feeding, index) => (
                    <div key={index} className="flex gap-3 mt-3 justify-center">
                      <input
                        type="time"
                        required
                        value={feeding.time}
                        onChange={(e) =>
                          handleTimeChange(day, index, e.target.value)
                        }
                        className="bg-transparent text-white border-b-2 border-white focus:outline-none"
                      />
                      <input
                        type="number"
                        required
                        placeholder="Kibble (Max 60)"
                        value={feeding.kibble}
                        onChange={(e) =>
                          handleKibbleChange(day, index, e.target.value)
                        }
                        className="bg-transparent text-white border-b-2 border-white focus:outline-none"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddFeedingTime(day)}
                    className="text-white px-4 py-2 rounded-lg mt-3 text-[20px] flex flex-row items-center gap-2 justify-center"
                  >
                    Add Time <FaPlus />
                  </button>
                </div>
              ))}
          </div>
          <div className="w-full flex justify-center mb-5">
            {name && (
              <button
                id="submit"
                type="submit"
                onClick={handleSubmit}
                className="bg-[#b90e31] text-white px-6 py-2 mt-5 rounded-lg"
              >
                {val}
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}

export default AddSchedule;
