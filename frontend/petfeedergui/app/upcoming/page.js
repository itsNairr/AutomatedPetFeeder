"use client";

import { useEffect, useState } from "react";

function Upcoming() {
  const [feedHash, setFeedHash] = useState(null);

  useEffect(() => {
    const eventSource = new EventSource("http://127.0.0.1:5000/stream");

    eventSource.onmessage = (event) => {
        if (!event.data || event.data.trim() === "") {
          console.error("Received empty data from server");
          return;
        }
        try {
          const updatedFeedHash = JSON.parse(event.data);
          console.log("Updated feedhash:", updatedFeedHash);
          setFeedHash(updatedFeedHash);
        } catch (err) {
          console.error("JSON parse error:", err.message);
        }
      };      

    eventSource.onerror = (error) => {
      console.error("Error with SSE connection:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close(); // Close the connection when the component unmounts
    };
  }, []);

  return (
    <>
    <div className="flex flex-col items-center justify-between h-screen font-sofia text-[25px] bg-[#002452] text-white">
      <div className="w-[100%] h-[20px] bg-[#F0B542]"></div>
      <h1>Upcoming Feed Times</h1>
      {feedHash && Object.keys(feedHash).length > 0 ? (
        <div>
          {Object.entries(feedHash).map(([time, [catName, kibble]]) => (
            <div key={time} className="my-2 flex flex-col w-[400px] justify-between">
              <div className="flex flex-row">
              <p><strong>Cat:</strong> {catName}</p>
              </div>
              <div className="flex flex-row justify-between">
              <p><strong>Time:</strong> {time}</p>
              <p><strong>Kibble:</strong> {kibble}</p>
              </div>
              <hr className="border-gray-500 my-2" />
            </div>
          ))}
        </div>
      ) : (
        <p>You have no upcoming feeding times!</p>
      )}
    </div>
  </>
  );
}

export default Upcoming;
