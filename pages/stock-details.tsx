import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { apiRequest } from "../utils/api";

type StockDataPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close: number;
  volume: number;
  dividend_amount: number;
};

type StockDetailsResponse = {
  symbol: string;
  name: string;
  metadata?: Record<string, string>;
  weekly_data?: StockDataPoint[];
};

export default function StockDetails() {
  const router = useRouter();
  const { symbol } = router.query;

  const [weeklyData, setWeeklyData] = useState<StockDetailsResponse | null>(
    null,
  );

  const [monthlyData, setMonthlyData] = useState<StockDetailsResponse | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const [selectedWeeklyPoint, setSelectedWeeklyPoint] =
    useState<StockDataPoint | null>(null);

  const [selectedMonthlyPoint, setSelectedMonthlyPoint] =
    useState<StockDataPoint | null>(null);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      void router.push("/");
      return;
    }

    const symbolStr = Array.isArray(symbol) ? symbol[0] : symbol;

    if (!symbolStr) {
      setError("Missing stock symbol.");
      setLoading(false);
      return;
    }

    const fetchStockDetails = async () => {
      setLoading(true);
      setError("");
      setWarning("");
      setWeeklyData(null);
      setMonthlyData(null);

      const encodedSymbol = encodeURIComponent(symbolStr);

      const [weeklyResult, monthlyResult] = await Promise.allSettled([
        apiRequest(`/portfolio/weekly-data/${encodedSymbol}`),
        apiRequest(`/portfolio/monthly-data/${encodedSymbol}`),
      ]);

      let weeklyError = "";
      let monthlyError = "";

      if (weeklyResult.status === "fulfilled") {
        setWeeklyData(weeklyResult.value as StockDetailsResponse);
      } else {
        console.error("Weekly stock data request failed:", weeklyResult.reason);

        weeklyError =
          weeklyResult.reason instanceof Error
            ? weeklyResult.reason.message
            : "Weekly data unavailable.";
      }

      if (monthlyResult.status === "fulfilled") {
        setMonthlyData(monthlyResult.value as StockDetailsResponse);
      } else {
        console.error(
          "Monthly stock data request failed:",
          monthlyResult.reason,
        );

        monthlyError =
          monthlyResult.reason instanceof Error
            ? monthlyResult.reason.message
            : "Monthly data unavailable.";
      }

      if (
        weeklyResult.status === "rejected" &&
        monthlyResult.status === "rejected"
      ) {
        setError(weeklyError || monthlyError || "Unable to load stock data.");
      } else if (weeklyResult.status === "rejected") {
        setWarning(`Weekly data could not be loaded: ${weeklyError}`);
      } else if (monthlyResult.status === "rejected") {
        setWarning(`Monthly data could not be loaded: ${monthlyError}`);
      }

      setLoading(false);
    };

    void fetchStockDetails();
  }, [router, router.isReady, symbol]);

  const formatDate = (dateString: string) => {
    const parts = dateString.split("-");

    if (parts.length !== 3) {
      return dateString;
    }

    const [year, month, day] = parts;

    return `${day}-${month}-${year}`;
  };

  const getYAxisValues = (data: StockDataPoint[]) => {
    const allValues = data.flatMap((item) => [
      item.high,
      item.low,
      item.close,
      item.open,
    ]);

    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);

    const rawRange = maxValue - minValue;

    const padding =
      rawRange > 0 ? rawRange * 0.1 : Math.max(Math.abs(maxValue) * 0.05, 1);

    const adjustedMin = Math.max(0, minValue - padding);

    const adjustedMax = maxValue + padding;

    const adjustedRange = adjustedMax - adjustedMin || 1;

    const gridLineCount = 6;

    const values = Array.from(
      { length: gridLineCount },
      (_, index) => adjustedMax - (adjustedRange * index) / (gridLineCount - 1),
    );

    return {
      values,
      min: adjustedMin,
      max: adjustedMax,
    };
  };

  const renderGraph = (
    data: StockDataPoint[] | undefined,
    title: string,
    color: string,
    selectedPoint: StockDataPoint | null,
    onPointClick: (point: StockDataPoint) => void,
  ) => {
    if (!data || data.length === 0) {
      return (
        <div
          style={{
            marginBottom: "2rem",
            textAlign: "center",
            padding: "2rem",
            border: "1px solid #ddd",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{
              marginBottom: "1rem",
              color: "#333",
            }}
          >
            {title}
          </h3>

          <div style={{ color: "#666" }}>No data available</div>
        </div>
      );
    }

    const entries = [...data].reverse();

    const {
      values: yAxisValues,
      min: minValue,
      max: maxValue,
    } = getYAxisValues(entries);

    const range = Math.max(maxValue - minValue, Number.EPSILON);

    const graphWidth = Math.max(800, entries.length * 60);

    const getX = (index: number) => {
      if (entries.length === 1) {
        return graphWidth / 2;
      }

      return 80 + (index * (graphWidth - 120)) / (entries.length - 1);
    };

    const getY = (value: number) => 50 + ((maxValue - value) / range) * 350;

    return (
      <div style={{ marginBottom: "3rem" }}>
        <h3
          style={{
            textAlign: "center",
            marginBottom: "1rem",
            color: "#333",
          }}
        >
          {title}
        </h3>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "1rem",
            backgroundColor: "#f9f9f9",
            overflowX: "auto",
            height: "500px",
          }}
        >
          <svg width={graphWidth} height="450" style={{ minWidth: "100%" }}>
            {yAxisValues.map((value, index) => {
              const y =
                50 + index * (350 / Math.max(yAxisValues.length - 1, 1));

              return (
                <g key={`grid-${index}`}>
                  <line
                    x1="60"
                    y1={y}
                    x2={graphWidth - 40}
                    y2={y}
                    stroke="#e0e0e0"
                    strokeWidth="1"
                  />

                  <text
                    x="55"
                    y={y + 5}
                    fill="#000"
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    ${value.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {entries.map((item, index) => {
              const x = getX(index);
              const y = getY(item.close);

              const previousItem = index > 0 ? entries[index - 1] : null;

              return (
                <g key={item.date}>
                  {previousItem && (
                    <line
                      x1={getX(index - 1)}
                      y1={getY(previousItem.close)}
                      x2={x}
                      y2={y}
                      stroke={color}
                      strokeWidth="3"
                    />
                  )}

                  <circle
                    cx={x}
                    cy={y}
                    r="8"
                    fill={selectedPoint?.date === item.date ? "#ff6b6b" : color}
                    stroke="white"
                    strokeWidth="2"
                    style={{
                      cursor: "pointer",
                    }}
                    onClick={() => onPointClick(item)}
                  />

                  <text
                    x={x}
                    y="425"
                    fill="#000"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    transform={`rotate(-45, ${x}, 425)`}
                  >
                    {formatDate(item.date)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {selectedPoint && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: "#fff",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          >
            <h4
              style={{
                marginBottom: "0.5rem",
                color: "#000",
              }}
            >
              Details for {formatDate(selectedPoint.date)}
            </h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "0.5rem",
                fontSize: "0.9rem",
                color: "#000",
              }}
            >
              <div>
                <strong>Date:</strong> {selectedPoint.date}
              </div>

              <div>
                <strong>Open:</strong> ${selectedPoint.open.toFixed(4)}
              </div>

              <div>
                <strong>High:</strong> ${selectedPoint.high.toFixed(4)}
              </div>

              <div>
                <strong>Low:</strong> ${selectedPoint.low.toFixed(4)}
              </div>

              <div>
                <strong>Close:</strong> ${selectedPoint.close.toFixed(4)}
              </div>

              <div>
                <strong>Adjusted Close:</strong> $
                {selectedPoint.adjusted_close.toFixed(4)}
              </div>

              <div>
                <strong>Volume:</strong> {selectedPoint.volume.toLocaleString()}
              </div>

              <div>
                <strong>Dividend:</strong> $
                {selectedPoint.dividend_amount.toFixed(4)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div
        style={{
          fontFamily: "'Poppins', sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h2>Loading stock details...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          fontFamily: "'Poppins', sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ marginBottom: "2rem" }}>
          <button
            type="button"
            onClick={() => void router.push("/mystocks")}
            style={{
              padding: 0,
              border: "none",
              background: "none",
              textDecoration: "underline",
              color: "#0070f3",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            &larr; Back to My Stocks
          </button>
        </div>

        <div
          style={{
            textAlign: "center",
            color: "red",
          }}
        >
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const stockName = weeklyData?.name || monthlyData?.name;

  const displaySymbol =
    weeklyData?.symbol ||
    monthlyData?.symbol ||
    (Array.isArray(symbol) ? symbol[0] : symbol) ||
    "";

  return (
    <div
      style={{
        fontFamily: "'Poppins', sans-serif",
        padding: "2rem",
      }}
    >
      <div style={{ marginBottom: "2rem" }}>
        <button
          type="button"
          onClick={() => void router.push("/mystocks")}
          style={{
            padding: 0,
            border: "none",
            background: "none",
            textDecoration: "underline",
            color: "#0070f3",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          &larr; Back to My Stocks
        </button>
      </div>

      <h1
        style={{
          textAlign: "center",
          marginBottom: "2rem",
          color: "#333",
        }}
      >
        {stockName || displaySymbol} ({displaySymbol})
      </h1>

      {warning && (
        <p
          style={{
            textAlign: "center",
            color: "#856404",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeeba",
            borderRadius: "6px",
            padding: "0.75rem",
            maxWidth: "900px",
            margin: "0 auto 2rem",
          }}
        >
          {warning}
        </p>
      )}

      <div
        style={{
          maxWidth: "100%",
          margin: "0 auto",
        }}
      >
        {renderGraph(
          weeklyData?.weekly_data,
          "Weekly Data",
          "#0070f3",
          selectedWeeklyPoint,
          setSelectedWeeklyPoint,
        )}

        {renderGraph(
          monthlyData?.weekly_data,
          "Monthly Data",
          "#28a745",
          selectedMonthlyPoint,
          setSelectedMonthlyPoint,
        )}
      </div>
    </div>
  );
}
