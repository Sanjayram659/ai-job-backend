import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";

import "./App.css";

function App() {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/applications")
      .then(res => res.json())
      .then(data => setApps(data || []))
      .catch(err => console.log(err));
  }, []);

  // ===============================
  // 📊 ATS CHART DATA
  // ===============================
  const atsData = apps.map((a, i) => ({
    name: `Job ${i + 1}`,
    ats: a.ats || 0
  }));

  // ===============================
  // 📊 STATUS COUNTS
  // ===============================
  const applied = apps.filter(a => a.status === "Applied").length;

  const interviews = apps.filter(
    a => a.status === "Interview"
  ).length;

  const rejected = apps.filter(
    a => a.status === "Rejected"
  ).length;

  const pieData = [
    { name: "Applied", value: applied },
    { name: "Interview", value: interviews },
    { name: "Rejected", value: rejected }
  ];

  const COLORS = ["#007bff", "#28a745", "#dc3545"];

  // ===============================
  // 📊 DAILY APPLICATION COUNT
  // ===============================
  const dailyMap = {};

  apps.forEach(app => {
    const day = new Date(app.date).toLocaleDateString();

    if (!dailyMap[day]) {
      dailyMap[day] = 0;
    }

    dailyMap[day]++;
  });

  const dailyData = Object.keys(dailyMap).map(day => ({
    day,
    count: dailyMap[day]
  }));

  return (
    <div className="app">

      <h1>🤖 AI Job Assistant Dashboard</h1>

      {/* ===============================
      📈 TOP STATS
      =============================== */}
      <div className="stats">

        <div className="card">
          <h2>{apps.length}</h2>
          <p>Total Applications</p>
        </div>

        <div className="card blue">
          <h2>{applied}</h2>
          <p>Applied</p>
        </div>

        <div className="card green">
          <h2>{interviews}</h2>
          <p>Interviews</p>
        </div>

        <div className="card red">
          <h2>{rejected}</h2>
          <p>Rejected</p>
        </div>

      </div>

      {/* ===============================
      📈 CHARTS
      =============================== */}
      <div className="charts">

        {/* ATS LINE CHART */}
        <div className="chartCard">

          <h3>📈 ATS Scores</h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={atsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="ats"
                stroke="#007bff"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>

        </div>

        {/* PIE CHART */}
        <div className="chartCard">

          <h3>📊 Application Status</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                outerRadius={100}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

        </div>

      </div>

      {/* ===============================
      📊 BAR CHART
      =============================== */}
      <div className="chartCard">

        <h3>🚀 Daily Applications</h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#28a745" />
          </BarChart>
        </ResponsiveContainer>

      </div>

      {/* ===============================
      📋 TABLE
      =============================== */}
      <div className="tableCard">

        <h3>📋 Applications</h3>

        <table>

          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Status</th>
              <th>ATS</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {apps.map((a, i) => (
              <tr key={i}>
                <td>{a.company || "N/A"}</td>
                <td>{a.role || "N/A"}</td>
                <td>{a.status || "Applied"}</td>
                <td>{a.ats || "N/A"}</td>
                <td>
                  {new Date(a.date).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>

        </table>

      </div>

    </div>
  );
}

export default App;