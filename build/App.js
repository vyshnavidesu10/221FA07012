import React, { useState } from "react";
import { Routes, Route, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { log, getLogs } from "./logger";


const urlDB = JSON.parse(localStorage.getItem("urlDB") || "{}");
const statsDB = JSON.parse(localStorage.getItem("statsDB") || "{}");

const containerStyle = {
  maxWidth: "600px",
  margin: "20px auto",
  padding: "20px",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  backgroundColor: "#f9f9f9",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};

const headingStyle = {
  fontSize: "1.8rem",
  marginBottom: "20px",
  textAlign: "center",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  marginBottom: "15px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  fontSize: "1rem",
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "600",
};

const buttonHoverStyle = {
  backgroundColor: "#0056b3",
};

const shortLinkStyle = {
  marginTop: "15px",
  padding: "10px",
  backgroundColor: "#e6ffed",
  border: "1px solid #4caf50",
  borderRadius: "4px",
  textAlign: "center",
};

const errorStyle = {
  color: "#dc3545",
  textAlign: "center",
  margin: "20px 0",
};

const statsBlockStyle = {
  marginBottom: "30px",
  padding: "15px",
  backgroundColor: "#fff",
  borderRadius: "6px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
};

const statsTitleStyle = {
  marginBottom: "8px",
  fontWeight: "700",
  color: "#333",
};

const logPreStyle = {
  backgroundColor: "#222",
  color: "#eee",
  padding: "15px",
  borderRadius: "6px",
  maxHeight: "200px",
  overflowY: "auto",
  fontSize: "0.85rem",
  whiteSpace: "pre-wrap",
};

function Shortener() {
  const [url, setUrl] = useState("");
  const [custom, setCustom] = useState("");
  const [validity, setValidity] = useState("");
  const [shortLink, setShortLink] = useState("");
  const [isHover, setIsHover] = useState(false);

  const createShortUrl = () => {
    if (!url) return;

    let code = custom || uuidv4().slice(0, 6);
    if (urlDB[code]) {
      alert("Shortcode already exists! Choose another.");
      return;
    }

    const expiry = new Date(
      Date.now() + (validity ? validity * 60000 : 30 * 60000)
    );

    urlDB[code] = { longUrl: url, expiry };
    statsDB[code] = { clicks: [], total: 0 };

   
    localStorage.setItem("urlDB", JSON.stringify(urlDB));
    localStorage.setItem("statsDB", JSON.stringify(statsDB));

    const shortUrl = `${window.location.origin}/${code}`;
    setShortLink(shortUrl);

    log(`Created short link ${shortUrl} → ${url}`);
  };

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}> URL Shortener</h1>
      <input
        style={inputStyle}
        placeholder="Enter long URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <input
        style={inputStyle}
        placeholder="Custom shortcode (optional)"
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
      />
      <input
        style={inputStyle}
        placeholder="Validity in minutes (default 30)"
        value={validity}
        type="number"
        onChange={(e) => setValidity(e.target.value)}
      />
      <button
        style={isHover ? { ...buttonStyle, ...buttonHoverStyle } : buttonStyle}
        onClick={createShortUrl}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      >
        Shorten
      </button>
      {shortLink && (
        <p style={shortLinkStyle}>
           Short URL:{" "}
          <a href={shortLink} target="_blank" rel="noopener noreferrer">
            {shortLink}
          </a>
        </p>
      )}
    </div>
  );
}

function Redirector() {
  const { code } = useParams();

  if (!urlDB[code]) {
    return <h2 style={errorStyle}> Invalid or expired short link</h2>;
  }

  const entry = urlDB[code];
  if (new Date() > entry.expiry) {
    return <h2 style={errorStyle}> This link has expired</h2>;
  }

  statsDB[code].total += 1;
  statsDB[code].clicks.push({
    timestamp: new Date().toISOString(),
    referrer: document.referrer || "Direct",
    location: "Approx-IP-Location", 
  });

 
  localStorage.setItem("statsDB", JSON.stringify(statsDB));

  log(`Redirected from ${code} → ${entry.longUrl}`);

  window.location.href = entry.longUrl;
  return <p>Redirecting...</p>;
}

function Stats() {
  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}> URL Statistics</h1>
      {Object.keys(statsDB).length === 0 ? (
        <p>No stats available.</p>
      ) : (
        Object.entries(statsDB).map(([code, data]) => (
          <div key={code} style={statsBlockStyle}>
            <h3 style={statsTitleStyle}>
              Short URL: {window.location.origin}/{code}
            </h3>
            <p>Total Clicks: {data.total}</p>
            <ul>
              {data.clicks.map((c, i) => (
                <li key={i}>
                  {c.timestamp} | {c.referrer} | {c.location}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
      <h2> Logs</h2>
      <pre style={logPreStyle}>{JSON.stringify(getLogs(), null, 2)}</pre>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Shortener />} />
      <Route path="/stats" element={<Stats />} />
      <Route path="/:code" element={<Redirector />} />
    </Routes>
  );
}
