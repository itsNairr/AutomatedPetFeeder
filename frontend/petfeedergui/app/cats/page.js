"use client";

import { useEffect, useState } from "react";
import { FaEdit, FaPlus } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import Link from "next/link";

function Cats() {
  const [catHash, setCatHash] = useState(null);

  useEffect(() => {
    const getData = async () => {
      const response = await fetch("http://127.0.0.1:5000/subscribe/cats");
      const data = await response.json();
      console.log(data);
      setCatHash(data);
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
          href={"/cats/addcat"}
          className="font-bold flex flex-row items-center gap-1"
        >
          Add <FaPlus />
        </Link>
      </div>
      <div className="flex flex-col items-center justify-center xs:justify-start xs:pt-5 h-screen font-sofia text-[25px] bg-[#002452] text-white">
        <div className="font-bold mb-3">Cats Overview</div>
        {catHash && Object.keys(catHash).length > 0 ? (
          <div>
            {Object.entries(catHash).map(([breed, cat]) => (
              <div
                key={breed}
                className="my-2 flex flex-col w-[400px] justify-between xs:px-5"
              >
                <div className="flex flex-row justify-between items-center">
                  <span>
                    <strong>Name:</strong> {cat}
                  </span>
                  <Link href={`/cats/${breed}`}>
                    <FaEdit />
                  </Link>
                </div>
                <div className="flex flex-row">
                  <span>
                    <strong>Breed:</strong> {breed}
                  </span>
                </div>
                <hr className="border-gray-500 my-2" />
              </div>
            ))}
          </div>
        ) : (
          <span className="flex flex-row xs:flex-col gap-1 text-center">
            You have no cats added!{" "}
            <Link
              className="flex flex-row items-center justify-center gap-1 hover:underline"
              href={"/cats/addcat"}
            >
              Click here to add <FaPlus />
            </Link>
          </span>
        )}
      </div>
      <div className="w-[100%] h-[20px] bg-[#F0B542]"></div>
    </>
  );
}

export default Cats;
