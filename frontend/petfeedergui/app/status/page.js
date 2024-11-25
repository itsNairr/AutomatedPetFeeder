"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaPlus } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";

function Status() {
  const [schedules, setSchedules] = useState({});
  const [groupedByDay, setGroupedByDay] = useState({});

  useEffect(() => {
    const eventSource = new EventSource(
      "http://127.0.0.1:5000/stream/schedule"
    );

    eventSource.onmessage = (event) => {
      const updatedSchedules = JSON.parse(event.data);
      setSchedules(updatedSchedules);
      groupSchedulesByDay(updatedSchedules);
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Helper function to group feedings by day
  const groupSchedulesByDay = (schedules) => {
    const dayGroups = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    // Iterate over each cat and their schedule
    Object.entries(schedules).forEach(([catName, schedule]) => {
      Object.entries(schedule).forEach(([day, feedings]) => {
        if (feedings.length > 0) {
          dayGroups[day] = [
            ...dayGroups[day],
            ...feedings.map((feeding) => ({ ...feeding, catName })),
          ];
        }
      });
    });

    setGroupedByDay(dayGroups);
  };

  return (
    <>
      <div className="w-[100%] h-[20px] bg-[#F0B542]"></div>
      <div className="w-[100%] bg-[#002452] text-[25px] text-white flex flex-row justify-between p-3 items-center">
        <Link href={"/"} className="font-bold flex flex-row items-center gap-1">
          <IoArrowBack />
          Back
        </Link>
        <Link
          href={"/schedules/addschedule"}
          className="font-bold flex flex-row items-center gap-1"
        >
          Add <FaPlus />
        </Link>
      </div>
      <div className="flex flex-col items-center min-h-screen font-sofia text-[25px] bg-[#002452] text-white w-full">
        <div className="font-bold mb-3 xs:pt-5">Schedules Overview</div>
        <div className="flex flex-col items-center w-full gap-4 p-4">
          {Object.entries(groupedByDay).map(([day, feedings]) => (
            <div key={day} className="w-full bg-[#003366] p-5 rounded-lg">
              <h3 className="text-center text-[25px] font-bold mb-3">{day}</h3>
              {feedings.length > 0 ? (
                feedings.map((feeding, index) => (
                  <div
                    key={index}
                    className="p-4 mb-3 bg-[#004488] rounded flex flex-col"
                  >
                    <span className="font-bold">{feeding.catName}</span>
                    <div className="font-semibold">
                      Time: <span className="font-normal">{feeding.time}</span>
                    </div>
                    <div className="font-semibold">
                      Kibble:{" "}
                      <span className="font-normal">{feeding.kibble}</span>
                    </div>
                    <div className="font-semibold flex flex-row items-center gap-1">
                      Status:{" "}
                      <span className="font-normal">{feeding.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-200 text-center">
                  No feedings scheduled.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Status;
