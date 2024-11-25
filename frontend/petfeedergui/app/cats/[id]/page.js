"use client";

import { useState, use, useEffect } from "react";
import { redirect } from "next/navigation";
import { IoArrowBack } from "react-icons/io5";
import { MdDeleteForever } from "react-icons/md";
import Link from "next/link";

function EditCats({ params }) {
  const [cat, setCat] = useState(null);
  const [breed, setBreed] = useState(null);
  const [val, setVal] = useState("Edit cat details.");
  const [showConfirm, setShowConfirm] = useState(false);

  const { id } = use(params);
  useEffect(() => {
    const getData = async () => {
      const response = await fetch(
        `http://127.0.0.1:5000/subscribe/cats/${id}`
      );
      const data = await response.json();
      console.log(data);
      setBreed(Object.keys(data)[0]); // Key (breed)
      setCat(Object.values(data)[0]); // Value (name)
    };
    getData();
  }, []);

  const handleDelete = async () => {
    try {
      setShowConfirm(false)
      setVal("Deleting...");
      const res = await fetch(`http://127.0.0.1:5000/delete/cat/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const data = await res.json();
        setVal(data.message);
        document.getElementById("update").style.display = "none";
        setTimeout(() => {
          redirect("/cats");
        }, 2000);
      } else {
        setVal(data.message);
        document.getElementById("val").style.color = "#eb3434";
      }
    } catch (error) {
      console.log(data.message);
      setVal(data.message);
      document.getElementById("val").style.color = "#eb3434";
    }
  };


  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission
  
    const form = event.target;
    
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    document.getElementById("update").style.display = "none";
    setVal("Processing...");
    try {
      const res = await fetch(`http://127.0.0.1:5000/upload/cat/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cat, breed }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log(data.message);
        setCat(null);
        setBreed(null);
        setVal(data.message);
        document.getElementById("val").style.color = "#34eb55";
        setTimeout(() => {
          redirect("/cats");
        }, 2000);
      } else {
        console.log(data.message);
        setVal(data.message);
        document.getElementById("val").style.color = "#eb3434";
        document.getElementById("update").style.display = "block";
      }
    } catch (error) {
      console.log(error);
      setVal("Error! Please try again.");
      document.getElementById("update").style.display = "block";
    }
  };

  return (
    <>
      <div className="w-[100%] h-[20px] bg-[#F0B542]"></div>
      <div className="w-[100%] bg-[#002452] text-[25px] text-white flex flex-row p-3 items-center justify-between">
        <Link
          href={"/cats"}
          className="font-bold flex flex-row items-center gap-1"
        >
          <IoArrowBack />
          Back
        </Link>
        <button
          onClick={() => setShowConfirm(true)}
          className="font-bold flex flex-row items-center gap-1"
        >
          Delete <MdDeleteForever />
        </button>
        {showConfirm && (
          <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white text-black p-5 rounded-lg text-center">
              <p>Are you sure you want to delete this cat? Any schedules associated will be deleted too.</p>
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
      <div className="flex flex-col font-semibold items-center xs:pt-5 justify-center xs:justify-start h-screen font-sofia text-[25px] bg-[#002452] text-white">
        <form>
          <div className="flex flex-col items-center">
            <div id="val" className="text-center">{val}</div>
            <label className="mt-5 text-center">
              Select the cat breed <br/>(MAX: 1 Cat per breed):
            </label>
            <select
              id="breed"
              name="breed"
              required
              className="bg-transparent text-center rounded-lg text-white mt-1"
              onChange={(e) => setBreed(e.target.value)}
              value={breed || ""}
            >
              <option className="text-black bg-transparent" value="">
                Select
              </option>
              <option className="text-black bg-transparent" value="Abyssinian">
                Abyssinian
              </option>
              <option className="text-black bg-transparent" value="Bengal">
                Bengal
              </option>
              <option className="text-black bg-transparent" value="Birman">
                Birman
              </option>
              <option
                className="text-black bg-transparent"
                value="British-Shorthair"
              >
                British-Shorthair
              </option>
              <option
                className="text-black bg-transparent"
                value="Egyptian-Mau"
              >
                Egyptian-Mau
              </option>
              <option className="text-black bg-transparent" value="Maine-Coon">
                Maine-Coon
              </option>
              <option className="text-black bg-transparent" value="Persian">
                Persian
              </option>
              <option className="text-black bg-transparent" value="Ragdoll">
                Ragdoll
              </option>
              <option
                className="text-black bg-transparent"
                value="Russian-Blue"
              >
                Russian-Blue
              </option>
              <option className="text-black bg-transparent" value="Siamese">
                Siamese
              </option>
              <option className="text-black bg-transparent" value="Sphynx">
                Sphynx
              </option>
              <option className="text-black bg-transparent" value="Bombay">
                Bombay
              </option>
            </select>
            <label className="mt-5">Enter the cat's name:</label>
            <input
              type="text"
              className="border-2 border-white w-[50%] h-[40px] bg-transparent text-center rounded-lg mt-1"
              required
              onChange={(e) => setCat(e.target.value)}
              value={cat || ""}
            />
            {cat && breed && (
              <button
                id="update"
                onClick={handleSubmit}
                className="bg-[#b90e31] w-[50%] h-[40px] mt-5 rounded-lg"
              >
                Update
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}

export default EditCats;
