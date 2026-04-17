"use client";

import React from "react";
import { ThemeType } from "./Sidebar";

interface CategoryCard {
  id: string;
  title: string;
  icon: string;
  color: string;
  value: number | string;
  subtitle: string;
  trend?: { value: number; up: boolean };
  avatars?: string[];
}

interface CategoryCardsProps {
  cards: CategoryCard[];
  T: ThemeType;
}

export function CategoryCards({ cards, T }: CategoryCardsProps) {
  const colorMap: { [key: string]: string } = {
    pink: "rgba(255, 107, 153, 0.1)",
    orange: "rgba(255, 168, 79, 0.1)",
    purple: "rgba(167, 139, 250, 0.1)",
    green: "rgba(13, 245, 160, 0.1)",
    blue: "rgba(88, 180, 255, 0.1)",
  };

  const colorBorderMap: { [key: string]: string } = {
    pink: "rgba(255, 107, 153, 0.3)",
    orange: "rgba(255, 168, 79, 0.3)",
    purple: "rgba(167, 139, 250, 0.3)",
    green: "rgba(13, 245, 160, 0.3)",
    blue: "rgba(88, 180, 255, 0.3)",
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1.5rem",
        padding: "0 1.5rem",
      }}
    >
      {cards.map((card) => (
        <div
          key={card.id}
          style={{
            background: colorMap[card.color] || T.card,
            border: `1px solid ${colorBorderMap[card.color] || T.border}`,
            borderRadius: 20,
            padding: "1.5rem",
            cursor: "pointer",
            transition: "all 0.3s ease",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = "translateY(-4px)";
            el.style.boxShadow = `0 12px 24px ${colorMap[card.color]}`;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = "translateY(0)";
            el.style.boxShadow = "none";
          }}
        >
          {/* Icon badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `rgba(255,255,255,0.1)`,
              fontSize: 20,
              marginBottom: "1rem",
            }}
          >
            {card.icon}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: T.textPri,
              marginBottom: "0.5rem",
            }}
          >
            {card.title}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 12,
              color: T.textMut,
              marginBottom: "1rem",
            }}
          >
            {card.subtitle}
          </div>

          {/* Value */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: T.textPri,
              marginBottom: "1rem",
              letterSpacing: "-0.02em",
            }}
          >
            {card.value}
          </div>

          {/* Trend */}
          {card.trend && (
            <div
              style={{
                fontSize: 12,
                color: card.trend.up ? T.green : T.red,
                marginBottom: "1rem",
                fontWeight: 600,
              }}
            >
              {card.trend.up ? "↑" : "↓"} {Math.abs(card.trend.value)}%
            </div>
          )}

          {/* Avatars */}
          {card.avatars && card.avatars.length > 0 && (
            <div style={{ display: "flex", gap: "-8px", alignItems: "center" }}>
              {card.avatars.map((avatar, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: avatar,
                    border: `2px solid ${T.card}`,
                    marginLeft: idx > 0 ? "-8px" : "0",
                  }}
                />
              ))}
            </div>
          )}

          {/* Rating badge */}
          <div
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "rgba(255,255,255,0.15)",
              padding: "6px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              color: T.textPri,
              backdropFilter: "blur(10px)",
            }}
          >
            ★ 4.8
          </div>
        </div>
      ))}
    </div>
  );
}
