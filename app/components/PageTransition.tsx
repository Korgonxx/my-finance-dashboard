"use client";

import React, { ReactNode, useEffect, useState } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div style={{
      opacity: isVisible ? 1 : 0,
      transition: "opacity 150ms ease-in-out",
    }}>
      {children}
    </div>
  );
}
