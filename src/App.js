import React, { useEffect, useState } from "react";

const API_URL = "YOUR_GAS_WEB_APP_URL"; // paste your GAS URL

function App() {
  const [data, setData] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  // FETCH DATA
  const loadData = () => {
    fetch(API_URL)
      .then(res => res.json())
      .then(res => setData(res))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadData();
  }, []);

  // SEND DATA
  const submitData = async () => {
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ name, amount }),
    });

    setName("");
    setAmount("");
    loadData();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>My React + GAS App</h1>

      <input
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <input
        placeholder="Amount"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />

      <button onClick={submitData}>Submit</button>

      <h2>Data:</h2>
      <ul>
        {data.map((item, index) => (
          <li key={index}>
            {item.name} - {item.amount}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;