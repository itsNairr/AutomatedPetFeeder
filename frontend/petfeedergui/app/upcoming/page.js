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
    <div>
      <h1>Upcoming Feed Times</h1>
      <pre>{feedHash ? JSON.stringify(feedHash, null, 2) : "No data yet"}</pre>
    </div>
  );
}

export default Upcoming;
