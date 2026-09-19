import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { apiRequest } from "../utils/api";

type StockSummary = {
  symbol: string;
  name: string;
  open?: number;
  high?: number;
  low?: number;
  price?: number;
  volume?: number;
  latest_trading_day?: string;
  previous_close?: number;
  change?: number;
  change_percent?: string;
};

type PortfolioEntry = {
  symbol: string;
  quantity: number;
  purchasePrice: number;
};

export default function MyStocks() {
  const router = useRouter();

  const [stocks, setStocks] = useState<StockSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSymbol, setLoadingSymbol] = useState<string | null>(null);
  const [removingSymbol, setRemovingSymbol] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [portfolioEntries, setPortfolioEntries] = useState<
    Record<string, PortfolioEntry>
  >({});
  const [portfolioStorageKey, setPortfolioStorageKey] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userEmail = localStorage.getItem("user_email")?.trim().toLowerCase();

    if (!token || !userEmail) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_email");

      void router.push("/");
      return;
    }

    const scopedStorageKey = `portfolioEntries:${userEmail}`;

    setPortfolioStorageKey(scopedStorageKey);

    /*
     * The old portfolioEntries key was shared by every account
     * using this browser.
     *
     * Its ownership cannot be determined safely, so remove it
     * rather than migrating potentially private data into the
     * currently logged-in account.
     */
    localStorage.removeItem("portfolioEntries");

    const savedEntries = localStorage.getItem(scopedStorageKey);

    if (savedEntries) {
      try {
        const parsedEntries = JSON.parse(savedEntries);

        if (
          parsedEntries &&
          typeof parsedEntries === "object" &&
          !Array.isArray(parsedEntries)
        ) {
          setPortfolioEntries(parsedEntries);
        }
      } catch (error) {
        console.error("Failed to read saved portfolio entries:", error);

        localStorage.removeItem(scopedStorageKey);
      }
    }

    const fetchPortfolio = async () => {
      setLoading(true);

      try {
        const data = await apiRequest("/portfolio/summary");

        if (!Array.isArray(data)) {
          throw new Error("Invalid portfolio response.");
        }

        setStocks(data);
      } catch (error) {
        console.error("Failed to load portfolio:", error);

        setStatus(
          error instanceof Error
            ? error.message
            : "Unable to load your portfolio.",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchPortfolio();
  }, [router]);

  const savePortfolioEntries = (entries: Record<string, PortfolioEntry>) => {
    if (!portfolioStorageKey) {
      return;
    }

    localStorage.setItem(portfolioStorageKey, JSON.stringify(entries));
  };

  const handleRemove = async (symbol: string) => {
    if (removingSymbol) {
      return;
    }

    setRemovingSymbol(symbol);
    setStatus("");

    try {
      await apiRequest(`/portfolio/remove/${encodeURIComponent(symbol)}`, {
        method: "DELETE",
      });

      setStocks((previous) =>
        previous.filter((stock) => stock.symbol !== symbol),
      );

      setPortfolioEntries((previous) => {
        const updatedEntries = {
          ...previous,
        };

        delete updatedEntries[symbol];

        savePortfolioEntries(updatedEntries);

        return updatedEntries;
      });

      setStatus(`${symbol} removed from your portfolio.`);
    } catch (error) {
      console.error("Failed to remove stock:", error);

      setStatus(
        error instanceof Error ? error.message : "Unable to remove stock.",
      );
    } finally {
      setRemovingSymbol(null);
    }
  };

  const handleRefresh = async (symbol: string) => {
    if (loadingSymbol) {
      return;
    }

    setLoadingSymbol(symbol);
    setStatus("");

    try {
      const updatedStock = (await apiRequest(
        `/portfolio/summary/${encodeURIComponent(symbol)}`,
      )) as StockSummary;

      if (!updatedStock?.symbol) {
        throw new Error("Invalid stock summary response.");
      }

      setStocks((previous) =>
        previous.map((stock) =>
          stock.symbol === symbol ? updatedStock : stock,
        ),
      );

      setStatus(`${symbol} market data refreshed.`);
    } catch (error) {
      console.error("Failed to refresh stock:", error);

      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to refresh stock data.",
      );
    } finally {
      setLoadingSymbol(null);
    }
  };

  const updatePortfolioEntry = (
    symbol: string,
    field: "quantity" | "purchasePrice",
    value: number,
  ) => {
    const safeValue = Number.isFinite(value) && value >= 0 ? value : 0;

    setPortfolioEntries((previous) => {
      const currentEntry = previous[symbol];

      const updatedEntries = {
        ...previous,
        [symbol]: {
          symbol,
          quantity:
            field === "quantity" ? safeValue : currentEntry?.quantity || 0,
          purchasePrice:
            field === "purchasePrice"
              ? safeValue
              : currentEntry?.purchasePrice || 0,
        },
      };

      savePortfolioEntries(updatedEntries);

      return updatedEntries;
    });
  };

  const calculateProfit = (stock: StockSummary) => {
    const entry = portfolioEntries[stock.symbol];

    if (
      !entry ||
      typeof stock.price !== "number" ||
      entry.quantity <= 0 ||
      entry.purchasePrice <= 0
    ) {
      return null;
    }

    const totalPurchaseValue = entry.quantity * entry.purchasePrice;

    const totalCurrentValue = entry.quantity * stock.price;

    return totalCurrentValue - totalPurchaseValue;
  };

  return (
    <div
      style={{
        fontFamily: "'Poppins', sans-serif",
        padding: "2rem",
      }}
    >
      <div
        style={{
          marginBottom: "1rem",
        }}
      >
        <button
          type="button"
          onClick={() => void router.push("/loggedin")}
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
          &larr; Return to main page
        </button>
      </div>

      <h1
        style={{
          marginBottom: "2rem",
        }}
      >
        My Stocks
      </h1>

      {status && (
        <p
          style={{
            marginBottom: "1rem",
            textAlign: "center",
          }}
        >
          {status}
        </p>
      )}

      {loading ? (
        <p>Loading your portfolio...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {stocks.length === 0 && <p>No stocks in your portfolio.</p>}

          {stocks.map((stock) => {
            const {
              symbol,
              name,
              price,
              change_percent,
              open,
              high,
              low,
              volume,
              latest_trading_day,
              previous_close,
              change,
            } = stock;

            const profit = calculateProfit(stock);

            const isProfit = profit !== null && profit >= 0;

            const portfolioEntry = portfolioEntries[symbol];

            const purchaseValue =
              portfolioEntry &&
              portfolioEntry.quantity > 0 &&
              portfolioEntry.purchasePrice > 0
                ? portfolioEntry.quantity * portfolioEntry.purchasePrice
                : null;

            const profitPercentage =
              profit !== null && purchaseValue && purchaseValue > 0
                ? (Math.abs(profit) / purchaseValue) * 100
                : null;

            return (
              <div
                key={symbol}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "10px",
                  padding: "1rem",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                    }}
                  >
                    {symbol}
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => void handleRefresh(symbol)}
                      disabled={loadingSymbol !== null}
                      title="Refresh stock data"
                      style={{
                        fontSize: "0.8rem",
                        padding: "0.15rem 0.5rem",
                        cursor:
                          loadingSymbol !== null ? "not-allowed" : "pointer",
                        borderRadius: "4px",
                        border: "1px solid #0070f3",
                        backgroundColor:
                          loadingSymbol === symbol ? "#cce4ff" : "white",
                        color: "#0070f3",
                      }}
                    >
                      {loadingSymbol === symbol ? "Loading..." : "Refresh"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void router.push({
                          pathname: "/stock-details",
                          query: {
                            symbol,
                          },
                        })
                      }
                      title="View stock details"
                      style={{
                        fontSize: "0.8rem",
                        padding: "0.15rem 0.5rem",
                        cursor: "pointer",
                        borderRadius: "4px",
                        border: "1px solid #28a745",
                        backgroundColor: "white",
                        color: "#28a745",
                      }}
                    >
                      Details
                    </button>
                  </div>
                </div>

                <p
                  style={{
                    margin: "0.3rem 0",
                  }}
                >
                  <strong>Company:</strong> {name || "N/A"}
                </p>

                <p
                  style={{
                    margin: "0.3rem 0",
                  }}
                >
                  <strong>Open:</strong>{" "}
                  {typeof open === "number" ? open.toFixed(4) : "N/A"}
                </p>

                <p
                  style={{
                    margin: "0.3rem 0",
                  }}
                >
                  <strong>High:</strong>{" "}
                  {typeof high === "number" ? high.toFixed(4) : "N/A"}
                </p>

                <p
                  style={{
                    margin: "0.3rem 0",
                  }}
                >
                  <strong>Low:</strong>{" "}
                  {typeof low === "number" ? low.toFixed(4) : "N/A"}
                </p>

                <p
                  style={{
                    margin: "0.3rem 0",
                  }}
                >
                  <strong>Price:</strong>{" "}
                  {typeof price === "number" ? price.toFixed(4) : "N/A"}
                </p>

                <p
                  style={{
                    margin: "0.3rem 0",
                  }}
                >
                  <strong>Volume:</strong>{" "}
                  {typeof volume === "number" ? volume.toLocaleString() : "N/A"}
                </p>

                <p
                  style={{
                    margin: "0.3rem 0",
                  }}
                >
                  <strong>Latest Trading Day:</strong>{" "}
                  {latest_trading_day || "N/A"}
                </p>

                <p
                  style={{
                    margin: "0.3rem 0",
                  }}
                >
                  <strong>Previous Close:</strong>{" "}
                  {typeof previous_close === "number"
                    ? previous_close.toFixed(4)
                    : "N/A"}
                </p>

                <p
                  style={{
                    margin: "0.3rem 0",
                  }}
                >
                  <strong>Change:</strong>{" "}
                  {typeof change === "number" ? change.toFixed(4) : "N/A"}
                </p>

                <p
                  style={{
                    margin: "0.3rem 0",
                  }}
                >
                  <strong>Change Percent:</strong> {change_percent ?? "N/A"}
                </p>

                <div
                  style={{
                    marginTop: "1rem",
                    padding: "0.75rem",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "6px",
                    border: "1px solid #e9ecef",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 0.5rem 0",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                    }}
                  >
                    My Portfolio
                  </h4>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      fontSize: "0.85rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <label
                        style={{
                          minWidth: "40px",
                        }}
                      >
                        Quantity:
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={portfolioEntry?.quantity || ""}
                        onChange={(event) =>
                          updatePortfolioEntry(
                            symbol,
                            "quantity",
                            Number(event.target.value),
                          )
                        }
                        style={{
                          flex: 1,
                          padding: "0.25rem",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          fontSize: "0.8rem",
                        }}
                        placeholder="0"
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <label
                        style={{
                          minWidth: "40px",
                        }}
                      >
                        Bought at:
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={portfolioEntry?.purchasePrice || ""}
                        onChange={(event) =>
                          updatePortfolioEntry(
                            symbol,
                            "purchasePrice",
                            Number(event.target.value),
                          )
                        }
                        style={{
                          flex: 1,
                          padding: "0.25rem",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          fontSize: "0.8rem",
                        }}
                        placeholder="0.00"
                      />
                    </div>

                    {profit !== null && profitPercentage !== null && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.25rem",
                          borderRadius: "4px",
                          backgroundColor: isProfit ? "#d4edda" : "#f8d7da",
                          border: `1px solid ${
                            isProfit ? "#c3e6cb" : "#f5c6cb"
                          }`,
                          color: isProfit ? "#155724" : "#721c24",
                        }}
                      >
                        <label
                          style={{
                            minWidth: "80px",
                            fontWeight: "bold",
                          }}
                        >
                          {isProfit ? "Profit:" : "Loss:"}
                        </label>

                        <span
                          style={{
                            fontWeight: "bold",
                          }}
                        >
                          ${Math.abs(profit).toFixed(2)}
                        </span>

                        <span
                          style={{
                            fontSize: "0.75rem",
                          }}
                        >
                          ({isProfit ? "+" : "-"}
                          {profitPercentage.toFixed(1)}
                          %)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "1rem",
                    display: "flex",
                    gap: "0.5rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => void handleRemove(symbol)}
                    disabled={removingSymbol !== null}
                    style={{
                      flex: 1,
                      padding: "0.5rem",
                      cursor:
                        removingSymbol !== null ? "not-allowed" : "pointer",
                      backgroundColor: "#e74c3c",
                      border: "none",
                      color: "white",
                      borderRadius: "5px",
                    }}
                  >
                    {removingSymbol === symbol ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
