"use client";

import { useState, useEffect, use } from "react";
import { redirect } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import Link from "next/link";
import { GrPowerReset } from "react-icons/gr";
import { MdDeleteForever } from "react-icons/md";

function EditSchedule({ params }) {
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
  const [val, setVal] = useState("Save Changes");

  const [showConfirm, setShowConfirm] = useState(false);

  const { id } = use(params);

  useEffect(() => {
    const getData = async () => {
      const response = await fetch(
        `http://127.0.0.1:5000/subscribe/schedules/${id}`
      );
      const data = await response.json();
      console.log(data);
      setName(Object.keys(data)[0]); // Key (name)
      setSchedule(Object.values(data)[0]); // Value (schedule)
    };
    getData();
  }, []);

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
    setVal("Submit");
  };

  const handleDelete = async () => {
    try {
      setShowConfirm(false)
      document.getElementById("submit").disabled = true;
      setVal("Deleting...");
      const res = await fetch(`http://127.0.0.1:5000/delete/schedule/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const data = await res.json();
        setVal(data.message);
        document.getElementById("submit").style.backgroundColor = "#34eb55";
        setTimeout(() => {
          redirect("/schedules");
        }, 2000);
      } else {
        setVal(data.message);
        setTimeout(() => {
          setVal("Save Changes");
          document.getElementById("submit").disabled = false;
        }, 2000);
      }
    } catch (error) {
      console.log(data.message);
      setVal(data.message);
      setTimeout(() => {
        setVal("Save Changes");
        document.getElementById("submit").disabled = false;
      }, 2000);
    }
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
      const res = await fetch(`http://127.0.0.1:5000/upload/schedule/${id}`, {
        method: "PUT",
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

  if (!schedule) {
    return (
      <div className="text-center text-white text-2xl">Loading schedule...</div>
    );
  }

  return (
    <>
      <div className="w-[100%] bg-[#002452] text-[25px] text-white flex justify-between p-3">
        <Link href={"/schedules"} className="font-bold flex items-center gap-1">
          <IoArrowBack /> Back
        </Link>
        <button
          onClick={() => setShowConfirm(true)}
          className="font-bold flex flex-row items-center gap-1"
        >
          Delete <MdDeleteForever />
        </button>
        <button
          className="font-bold flex flex-row items-center gap-1"
          onClick={handleReset}
        >
          Reset <GrPowerReset />
        </button>
        {showConfirm && (
          <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white text-black p-5 rounded-lg text-center">
              <p>
                Are you sure you want to delete this schedule?
              </p>
              <div className="mt-4 flex justify-around">
                <button
                  onClick={handleDelete}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="bg-gray-300 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col font-semibold min-h-screen bg-[#002452] text-white text-[25px]">
        <div className="text-center mb-5 text-[25px] xs:pt-5">
          Edit {name}'s Schedule
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-5">
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <div
                key={day}
                className="bg-[#003366] p-3 rounded-lg mx-3 text-[25px] flex flex-col justify-center items-center"
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
                      className="bg-transparent text-white border-b-2 border-white"
                    />
                    <input
                      type="number"
                      required
                      placeholder="Kibble (Max 60)"
                      value={feeding.kibble}
                      onChange={(e) =>
                        handleKibbleChange(day, index, e.target.value)
                      }
                      className="bg-transparent text-white border-b-2 border-white xs:w-[60%]"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddFeedingTime(day)}
                  className="text-white px-4 py-2 mt-3 text-[20px] flex items-center gap-2"
                >
                  Add Time <FaPlus />
                </button>
              </div>
            ))}
          </div>
          <div className="w-full flex justify-center mb-5">
            <button
              id="submit"
              type="submit"
              className="bg-[#b90e31] text-white px-6 py-2 mt-5 mx-3 rounded-lg"
            >
              {val}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default EditSchedule;
