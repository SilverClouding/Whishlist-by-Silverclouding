import { useState, useEffect, useMemo } from "react";
import { useLoaderData, useRevalidator } from "react-router";
import { authenticate } from "../shopify.server";
import { getAnalyticsHistory } from "../db.wishlist.server";
import { resolveLocale, getAdminTranslations } from "../i18n.server";

const monthKey = () => new Date().toISOString().slice(0, 7);

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const month = monthKey();
  const history = await getAnalyticsHistory(session.shop, month);
  const locale = resolveLocale(request, session);
  const t = getAdminTranslations(locale).activity;
  return { month, history, t };
};

export default function WishlistOverview() {
  const { month, history, t } = useLoaderData();
  const revalidator = useRevalidator();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    const timer = window.setInterval(() => revalidator.revalidate(), 10000);
    return () => window.clearInterval(timer);
  }, [revalidator]);

  // Aggregate stats
  const { totalAdds, totalRemoves, netAdds, peakDay, maxVal } = useMemo(() => {
    let adds = 0;
    let removes = 0;
    let peak = { day: null, adds: 0 };
    let highest = 0;

    for (const entry of history) {
      adds += entry.adds;
      removes += entry.removes;
      if (entry.adds > peak.adds) {
        peak = { day: entry.day, adds: entry.adds };
      }
      highest = Math.max(highest, entry.adds, entry.removes);
    }

    return {
      totalAdds: adds,
      totalRemoves: removes,
      netAdds: adds - removes,
      peakDay: peak.day ? peak : null,
      maxVal: Math.max(highest, 5),
    };
  }, [history]);

  // SVG Chart dimensions
  const svgWidth = 840;
  const svgHeight = 280;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 45;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  // Nicely rounded upper bound for Y-axis
  const yTicks = 4;
  const yStep = Math.ceil(maxVal / yTicks);
  const yMax = yStep * yTicks;

  const getY = (val) => paddingTop + plotHeight - (val / yMax) * plotHeight;

  // Format date helper: "2026-10-15" -> "Oct 15"
  const formatDateLabel = (isoDate) => {
    if (!isoDate) return "";
    try {
      const parts = isoDate.split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
      return isoDate;
    } catch {
      return isoDate;
    }
  };

  const activeEntry = hoveredIndex !== null && history[hoveredIndex] ? history[hoveredIndex] : null;

  return (
    <s-page heading={t?.heading || "Wishlist activity"}>
      <s-stack direction="block" gap="large">

        {/* ── Metric Summary Cards ── */}
        <s-grid
          gridTemplateColumns="@container (inline-size <= 500px) 1fr 1fr, 1fr 1fr 1fr 1fr"
          gap="base"
        >
          <s-box border="base" borderRadius="base" padding="base" background="subdued">
            <s-grid gap="small-200">
              <s-text color="subdued">{(t?.total_saves || "Total saves ({month})").replace("{month}", month)}</s-text>
              <s-heading>{totalAdds.toLocaleString()}</s-heading>
              <s-text tone="success">{t?.product_additions || "Product additions"}</s-text>
            </s-grid>
          </s-box>

          <s-box border="base" borderRadius="base" padding="base" background="subdued">
            <s-grid gap="small-200">
              <s-text color="subdued">{t?.total_removals || "Total removals"}</s-text>
              <s-heading>{totalRemoves.toLocaleString()}</s-heading>
              <s-text color="subdued">{t?.removed_by_shoppers || "Removed by shoppers"}</s-text>
            </s-grid>
          </s-box>

          <s-box border="base" borderRadius="base" padding="base" background="subdued">
            <s-grid gap="small-200">
              <s-text color="subdued">{t?.net_growth || "Net wishlist growth"}</s-text>
              <s-heading>{(netAdds >= 0 ? "+" : "") + netAdds.toLocaleString()}</s-heading>
              <s-text tone={netAdds >= 0 ? "success" : "critical"}>
                {netAdds >= 0 ? (t?.positive_growth || "Positive growth") : (t?.declining_items || "Declining items")}
              </s-text>
            </s-grid>
          </s-box>

          <s-box border="base" borderRadius="base" padding="base" background="subdued">
            <s-grid gap="small-200">
              <s-text color="subdued">{t?.peak_day || "Peak day"}</s-text>
              <s-heading>{peakDay ? peakDay.adds.toLocaleString() : "—"}</s-heading>
              <s-text color="subdued">
                {peakDay ? formatDateLabel(peakDay.day) : (t?.no_saves_yet || "No saves yet")}
              </s-text>
            </s-grid>
          </s-box>
        </s-grid>

        {/* ── Interactive Activity Graph ── */}
        <s-section heading={(t?.daily_activity || "Daily activity · {month}").replace("{month}", month)}>
          {history.length === 0 ? (
            <s-box border="base" borderRadius="base" padding="large">
              <s-stack direction="block" gap="base" alignItems="center">
                <s-banner tone="info" heading={t?.no_activity_title || "No activity recorded yet for this month"}>
                  {t?.no_activity_desc || "As shoppers save and remove products on your storefront, real-time daily activity graphs will plot here."}
                </s-banner>
              </s-stack>
            </s-box>
          ) : (
            <s-box border="base" borderRadius="base" padding="base" background="subdued">
              {/* Header with Legend and Active Tooltip */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  marginBottom: "16px",
                  gap: "12px",
                }}
              >
                {/* Legend */}
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: "12px",
                        height: "12px",
                        borderRadius: "3px",
                        background: "#008060",
                      }}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#202223" }}>
                      {t?.saves_legend || "Saves"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: "12px",
                        height: "12px",
                        borderRadius: "3px",
                        background: "#8c9196",
                      }}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#6d7175" }}>
                      {t?.removals_legend || "Removals"}
                    </span>
                  </div>
                </div>

                {/* Tooltip detail bar */}
                <div style={{ minHeight: "24px" }}>
                  {activeEntry ? (
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: "13px" }}>
                        {formatDateLabel(activeEntry.day)}:
                      </span>
                      <s-badge tone="success">{activeEntry.adds} {t?.saves_legend || "saves"}</s-badge>
                      <s-badge tone="neutral">{activeEntry.removes} {t?.removals_legend || "removals"}</s-badge>
                    </div>
                  ) : (
                    <span style={{ fontSize: "12px", color: "#6d7175" }}>
                      {t?.hover_inspect || "Hover or tap a day to inspect details"}
                    </span>
                  )}
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div style={{ width: "100%", overflowX: "auto" }}>
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  style={{ width: "100%", height: "auto", display: "block" }}
                >
                  <defs>
                    <linearGradient id="addsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#008060" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#108043" stopOpacity="0.75" />
                    </linearGradient>
                    <linearGradient id="removesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8c9196" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#6d7175" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines and Y labels */}
                  {Array.from({ length: yTicks + 1 }).map((_, i) => {
                    const tickVal = yStep * i;
                    const yPos = getY(tickVal);
                    return (
                      <g key={`ytick-${i}`}>
                        <line
                          x1={paddingLeft}
                          y1={yPos}
                          x2={svgWidth - paddingRight}
                          y2={yPos}
                          stroke="#e1e3e5"
                          strokeDasharray={i === 0 ? "none" : "3,3"}
                          strokeWidth="1"
                        />
                        <text
                          x={paddingLeft - 8}
                          y={yPos + 4}
                          textAnchor="end"
                          fontSize="11"
                          fill="#6d7175"
                        >
                          {tickVal}
                        </text>
                      </g>
                    );
                  })}

                  {/* Bars & X-axis Labels */}
                  {history.map((entry, index) => {
                    const colWidth = plotWidth / history.length;
                    const xCenter = paddingLeft + index * colWidth + colWidth / 2;
                    const barWidth = Math.min(Math.max(colWidth * 0.36, 6), 24);
                    const isHovered = hoveredIndex === index;

                    const addBarHeight = (entry.adds / yMax) * plotHeight;
                    const addBarY = paddingTop + plotHeight - addBarHeight;

                    const remBarHeight = (entry.removes / yMax) * plotHeight;
                    const remBarY = paddingTop + plotHeight - remBarHeight;

                    // Skip labels if there are too many days to prevent overlap
                    const showLabel =
                      history.length <= 15 ||
                      index === 0 ||
                      index === history.length - 1 ||
                      index % Math.ceil(history.length / 10) === 0;

                    return (
                      <g
                        key={entry.day}
                        style={{ cursor: "pointer" }}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Hover column background highlight */}
                        {isHovered && (
                          <rect
                            x={paddingLeft + index * colWidth}
                            y={paddingTop}
                            width={colWidth}
                            height={plotHeight}
                            fill="#000000"
                            opacity="0.04"
                            rx="4"
                          />
                        )}

                        {/* Adds bar */}
                        {entry.adds > 0 && (
                          <rect
                            x={xCenter - barWidth - 1}
                            y={addBarY}
                            width={barWidth}
                            height={Math.max(addBarHeight, 2)}
                            fill="url(#addsGradient)"
                            rx="3"
                          />
                        )}

                        {/* Removes bar */}
                        {entry.removes > 0 && (
                          <rect
                            x={xCenter + 1}
                            y={remBarY}
                            width={barWidth}
                            height={Math.max(remBarHeight, 2)}
                            fill="url(#removesGradient)"
                            rx="3"
                          />
                        )}

                        {/* X-axis date label */}
                        {showLabel && (
                          <text
                            x={xCenter}
                            y={paddingTop + plotHeight + 18}
                            textAnchor="middle"
                            fontSize="11"
                            fill={isHovered ? "#202223" : "#6d7175"}
                            fontWeight={isHovered ? "bold" : "normal"}
                          >
                            {entry.day.slice(8)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </s-box>
          )}
        </s-section>

        {/* ── Daily Breakdown Table ── */}
        <s-section heading={t?.daily_log || "Daily log"} padding="none">
          <s-table variant="auto">
            <s-table-header-row>
              <s-table-header>{t?.th_date || "Date"}</s-table-header>
              <s-table-header format="numeric">{t?.th_saves || "Saves"}</s-table-header>
              <s-table-header format="numeric">{t?.th_removals || "Removals"}</s-table-header>
              <s-table-header format="numeric">{t?.th_net || "Net Change"}</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {history.length === 0 ? (
                <s-table-row>
                  <s-table-cell>{t?.no_activity_title || "No activity recorded this month"}</s-table-cell>
                  <s-table-cell>—</s-table-cell>
                  <s-table-cell>—</s-table-cell>
                  <s-table-cell>—</s-table-cell>
                </s-table-row>
              ) : (
                [...history].reverse().map((entry) => {
                  const net = entry.adds - entry.removes;
                  return (
                    <s-table-row key={`table-${entry.day}`}>
                      <s-table-cell>{entry.day}</s-table-cell>
                      <s-table-cell>
                        <s-badge tone="success">{entry.adds}</s-badge>
                      </s-table-cell>
                      <s-table-cell>
                        {entry.removes > 0 ? (
                          <s-badge tone="neutral">{entry.removes}</s-badge>
                        ) : (
                          "0"
                        )}
                      </s-table-cell>
                      <s-table-cell>
                        <s-badge tone={net >= 0 ? "success" : "critical"}>
                          {(net >= 0 ? "+" : "") + net}
                        </s-badge>
                      </s-table-cell>
                    </s-table-row>
                  );
                })
              )}
            </s-table-body>
          </s-table>
        </s-section>

      </s-stack>
    </s-page>
  );
}
