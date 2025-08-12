import React, { useState } from "react";
import axios from "axios";
import PriceChart from "../components/PriceChart";

export default function Predict() {
  const [symbol, setSymbol] = useState("RELIANCE.NS");
  const [start, setStart] = useState("2020-01-01");
  const [end, setEnd] = useState("2024-01-01");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/predict", { symbol, start, end });
      setResults(res.data);
      // save cache locally for results page
      localStorage.setItem("lastResults", JSON.stringify(res.data));
    } catch (err) {
      alert(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2>Predict</h2>
      <form onSubmit={submit}>
        <input value={symbol} onChange={(e)=>setSymbol(e.target.value)} />
        <input type="date" value={start} onChange={(e)=>setStart(e.target.value)} />
        <input type="date" value={end} onChange={(e)=>setEnd(e.target.value)} />
        <button disabled={loading}>{loading ? "Running..." : "Run"}</button>
      </form>

      {results && results.results?.length > 0 && (
        <>
          <h3>Results (last items)</h3>
          <PriceChart data={results.results} />
          <table>
            <thead><tr><th>Actual</th><th>Predicted</th><th>Rec</th></tr></thead>
            <tbody>
              {results.results.slice(-10).map((r, i) => (
                <tr key={i}>
                  <td>{r.actual.toFixed(2)}</td>
                  <td>{r.predicted.toFixed(2)}</td>
                  <td>{r.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
