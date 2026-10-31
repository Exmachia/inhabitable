import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ícono para la pantalla de inicio del iPhone: la misma barda de tabiques del favicon, con el último sin poner. */
export default function AppleIcon() {
  const t = (x: number, y: number, w: number, hueco = false) => (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: 28, borderRadius: 5, background: hueco ? "transparent" : "#c2502b", border: hueco ? "6px solid #c2502b" : "none" }} />
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#1c1a17", position: "relative", display: "flex" }}>
        {t(28, 40, 56)}{t(96, 40, 56)}
        {t(28, 78, 22)}{t(62, 78, 56)}{t(130, 78, 22)}
        {t(28, 116, 56)}{t(96, 116, 56, true)}
      </div>
    ),
    size,
  );
}
