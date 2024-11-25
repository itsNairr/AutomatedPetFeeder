"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaEdit, FaPlus } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import { MdOutlineArrowForwardIos } from "react-icons/md";

function Schedules() {
  const [scheduleHash, setScheduleHash] = useState(null);

  useEffect(() => {
    const getData = async () => {
      const response = await fetch("http://127.0.0.1:5000/subscribe/schedules");
      const data = await response.json();
      console.log(data);
      setScheduleHash(data);
    };
    getData();
  }, []);

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
      <div className="flex flex-col items-center h-screen font-sofia text-[25px] bg-[#002452] text-white">
      <div className="font-bold mb-3 xs:pt-5">Schedules Overview</div>
        {scheduleHash && Object.keys(scheduleHash).length > 0 ? (
          <div>
            {Object.entries(scheduleHash).map(([name]) => (
              <div
                key={name}
                className="my-2 flex flex-col w-[400px] justify-between xs:px-5"
              >
                <div className="flex flex-row items-center">
                  <Link className="flex flex-row items-center gap-2" href={`/schedules/edit/${name}`}>
                    <strong>{name}'s</strong> Schedule<MdOutlineArrowForwardIos />
                  </Link>
                </div>
                <hr className="border-gray-500 my-2" />
              </div>
            ))}
          </div>
        ) : (
          <span className="flex flex-row xs:flex-col gap-1 text-center">
            You have no schedules added!{" "}
            <Link
              className="flex flex-row items-center justify-center gap-1 hover:underline"
              href={"/schedules/addschedule"}
            >
              Click here to add <FaPlus />
            </Link>
          </span>
        )}
      </div>
    </>
  );
}

export default Schedules;
