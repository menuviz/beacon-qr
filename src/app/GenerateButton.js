"use client";

import { useFormStatus } from "react-dom";

export default function GenerateButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Generating..." : "Generate"}
    </button>
  );
}
