import React, { useEffect, useState } from "react";
import axios from "axios";
import PriceChart from "../components/PriceChart";

export default function Results() {
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    const local = localStorage.getItem("lastResults");
    if (local) setSaved(JSON.parse(local));
  }, []);

  return (
    <div>
      <h2>Results</h2>
      {saved ? (
        <>
          <h3>{saved.symbol}</h3>
          <PriceChart data={saved.results} />
          <pre>{JSON.stringify(saved.results.slice(-20), null, 2)}</pre>
        </>
      ) : (
        <p>No saved results in localStorage. Run a prediction first.</p>
      )}
      <hr/>
      <h4>Recent predictions from server</h4>
      <ServerRecent />
    </div>
  );
}

function ServerRecent() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    axios.get("http://localhost:5000/api/predictions")
      .then(r => setItems(r.data))
      .catch(() => setItems([]));
  }, []);
  return items.length ? (
    <ul>{items.map(it => <li key={it._id}>{it.symbol} — {new Date(it.createdAt).toLocaleString()}</li>)}</ul>
  ) : <p>No recent predictions from server (or server not running).</p>
}
