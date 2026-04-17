"use client";

import React from "react";
import { ThemeType } from "./Sidebar";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface ProfileSidebarProps {
  userName: string;
  userAvatar: string;
  stats: {
    friends: number;
    activity: number;
    activityLabel: string;
  };
  chartData: Array<{ name: string; value: number }>;
  T: ThemeType;
}

export function ProfileSidebar({ userName, userAvatar, stats, chartData, T }: ProfileSidebarProps) {
  return (
    <div
      style={{
        width: 320,
        background: T.sidebar,
        border: `1px solid ${T.border}`,
        borderLeft: `1px solid ${T.border}`,
        borderRadius: 20,
        padding: "1.5rem",
        margin: "1.5rem",
        height: "fit-content",
        position: "sticky",
        top: 16,
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
      {/* Profile header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: `linear-gradient(135deg, #a78bfa, #f5ff5e)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 600,
            color: "#000",
            flexShrink: 0,
          }}
        >
          {userAvatar}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.textPri }}>
            {userName}
          </div>
          <div style={{ fontSize: 12, color: T.textMut }}>
            Verified user
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "1rem" }}>
        <div
          style={{
            flex: 1,
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 12, color: T.textMut, marginBottom: "0.5rem" }}>
            Friends
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.textPri }}>
            {stats.friends}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 12, color: T.textMut, marginBottom: "0.5rem" }}>
            Activity
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.green }}>
            {stats.activity}h
          </div>
        </div>
      </div>

      {/* Activity label */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: 12, color: T.textMut }}>Status:</span>
        <span
          style={{
            fontSize: 12,
            color: T.green,
            fontWeight: 600,
            background: `rgba(13, 245, 160, 0.1)`,
            padding: "4px 12px",
            borderRadius: 12,
          }}
        >
          {stats.activityLabel}
        </span>
      </div>

      {/* Chart */}
      {chartData && chartData.length > 0 && (
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: "1rem",
            height: 200,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri, marginBottom: "1rem" }}>
            Activity Overview
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chartData}>
              <Bar dataKey="value" fill={T.yellow} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Courses section */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.textPri, marginBottom: "1rem" }}>
          My Courses
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2].map((idx) => (
            <div
              key={idx}
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = T.borderHov;
                e.currentTarget.style.background = T.card2;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.background = T.card;
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: `linear-gradient(135deg, ${idx === 1 ? "#ff6b99" : "#ffa84f"}, ${idx === 1 ? "#ff8fb3" : "#ffc299"})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  flexShrink: 0,
                  color: "#000",
                  fontWeight: 600,
                }}
              >
                📚
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>
                  {idx === 1 ? "Web Dev" : "Finance"}
                </div>
                <div style={{ fontSize: 11, color: T.textMut }}>
                  {idx === 1 ? "220 students" : "180 students"}
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.yellow }}>
                4.8 ★
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
