import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

import { apiRequest } from "../utils/api";

interface StockSuggestion {
  symbol: string;
  name: string;
}

export default function LoggedIn() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [offset, setOffset] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [hasMore, setHasMore] = useState(false);

  const settingsRef = useRef<HTMLDivElement>(null);
  const searchRequestId = useRef(0);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedEmail = localStorage.getItem("user_email") || "";

    if (!token) {
      void router.push("/");
      return;
    }

    setEmail(storedEmail);

    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");

    void router.push("/");
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setStatus("");
  };

  useEffect(() => {
    const trimmedSearch = search.trim();

    if (!trimmedSearch) {
      setSuggestions([]);
      setOffset(0);
      setHasMore(false);
      setSearchLoading(false);
      return;
    }

    const currentRequestId = ++searchRequestId.current;

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);

      try {
        const data = await apiRequest(
          `/stocks?keywords=${encodeURIComponent(
            trimmedSearch,
          )}&offset=0&limit=50`,
        );

        if (currentRequestId !== searchRequestId.current) {
          return;
        }

        if (!Array.isArray(data)) {
          throw new Error("Invalid stock search response.");
        }

        setSuggestions(data);
        setOffset(data.length);
        setHasMore(data.length === 50);
      } catch (error) {
        if (currentRequestId !== searchRequestId.current) {
          return;
        }

        console.error("Stock search failed:", error);

        setSuggestions([]);
        setOffset(0);
        setHasMore(false);

        setStatus(
          error instanceof Error ? error.message : "Unable to search stocks.",
        );
      } finally {
        if (currentRequestId === searchRequestId.current) {
          setSearchLoading(false);
        }
      }
    }, 500);

    return () => {
      clearTimeout(delayDebounce);
    };
  }, [search]);

  const loadMoreStocks = async () => {
    const trimmedSearch = search.trim();

    if (!trimmedSearch || loadMoreLoading || !hasMore) {
      return;
    }

    setLoadMoreLoading(true);
    setStatus("");

    try {
      const data = await apiRequest(
        `/stocks?keywords=${encodeURIComponent(
          trimmedSearch,
        )}&offset=${offset}&limit=50`,
      );

      if (!Array.isArray(data)) {
        throw new Error("Invalid stock search response.");
      }

      setSuggestions((previous) => {
        const existingSymbols = new Set(previous.map((stock) => stock.symbol));

        const newStocks = data.filter(
          (stock: StockSuggestion) => !existingSymbols.has(stock.symbol),
        );

        return [...previous, ...newStocks];
      });

      setOffset((previous) => previous + data.length);
      setHasMore(data.length === 50);
    } catch (error) {
      console.error("Loading more stocks failed:", error);

      setStatus(
        error instanceof Error ? error.message : "Unable to load more stocks.",
      );
    } finally {
      setLoadMoreLoading(false);
    }
  };

  const handleAddStock = async (symbol: string) => {
    if (addingSymbol) {
      return;
    }

    setAddingSymbol(symbol);
    setStatus("");

    try {
      await apiRequest("/portfolio/add", {
        method: "POST",
        body: JSON.stringify({
          stock_symbol: symbol,
        }),
      });

      setSuggestions((previous) =>
        previous.filter((stock) => stock.symbol !== symbol),
      );

      setStatus(`${symbol} added to your portfolio.`);
    } catch (error) {
      console.error("Add to portfolio failed:", error);

      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to add stock to portfolio.",
      );
    } finally {
      setAddingSymbol(null);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f0f0f0",
          padding: "1rem 2rem",
          borderBottom: "1px solid #ccc",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            fontSize: "1.5rem",
          }}
        >
          Stokki
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <span>{email}</span>

          <div style={{ position: "relative" }} ref={settingsRef}>
            <button
              type="button"
              onClick={() => setSettingsOpen((previous) => !previous)}
              style={{
                backgroundColor: "#fff",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                cursor: "pointer",
                border: "1px solid #ccc",
              }}
            >
              Settings
            </button>

            {settingsOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "110%",
                  right: 0,
                  background: "white",
                  border: "1px solid #ccc",
                  borderRadius: "10px",
                  overflow: "hidden",
                  zIndex: 10,
                }}
              >
                {["My Stocks", "Profile", "Logout"].map((item) => (
                  <button
                    type="button"
                    key={item}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "0.8rem 1.2rem",
                      color: "black",
                      backgroundColor: "white",
                      cursor: "pointer",
                      border: "none",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => {
                      if (item === "My Stocks") {
                        void router.push("/mystocks");
                      } else if (item === "Profile") {
                        void router.push("/profilepage");
                      } else {
                        handleLogout();
                      }

                      setSettingsOpen(false);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          margin: "2rem auto",
          width: "400px",
          maxWidth: "calc(100% - 2rem)",
          position: "relative",
        }}
      >
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Type a symbol or company name"
          style={{
            width: "100%",
            padding: "0.8rem 1rem",
            borderRadius: "10px",
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
        />

        {searchLoading && (
          <p
            style={{
              textAlign: "center",
              color: "#666",
            }}
          >
            Searching...
          </p>
        )}
      </div>

      {status && (
        <p
          style={{
            textAlign: "center",
            margin: "1rem",
          }}
        >
          {status}
        </p>
      )}

      <div
        style={{
          marginTop: "3rem",
          padding: "0 2rem",
        }}
      >
        {!searchLoading && suggestions.length === 0 ? (
          <h2 style={{ textAlign: "center" }}>
            {search.trim()
              ? "No stocks found."
              : "Stock boxes will appear here..."}
          </h2>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                maxWidth: "1300px",
                margin: "0 auto",
                gap: "1rem",
                justifyContent: "center",
                padding: "0 1rem",
              }}
            >
              {suggestions.map(({ symbol, name }) => (
                <div
                  key={symbol}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    padding: "1rem",
                    width: "100%",
                    boxSizing: "border-box",
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "160px",
                    backgroundColor: "#fff",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={symbol}
                  >
                    <strong>Symbol:</strong> {symbol}
                  </div>

                  <div
                    style={{
                      fontSize: "0.9rem",
                      overflowWrap: "break-word",
                      whiteSpace: "normal",
                      maxHeight: "3.6em",
                      overflow: "hidden",
                    }}
                    title={name}
                  >
                    <strong>Company name:</strong> {name}
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleAddStock(symbol)}
                    disabled={addingSymbol !== null}
                    style={{
                      marginTop: "auto",
                      backgroundColor: "#007bff",
                      border: "none",
                      color: "white",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      cursor: addingSymbol !== null ? "not-allowed" : "pointer",
                      width: "100%",
                      fontWeight: "bold",
                    }}
                  >
                    {addingSymbol === symbol ? "Adding..." : "Add to my stocks"}
                  </button>
                </div>
              ))}
            </div>

            {hasMore && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: "2rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => void loadMoreStocks()}
                  disabled={loadMoreLoading}
                  style={{
                    backgroundColor: "#28a745",
                    border: "none",
                    color: "white",
                    padding: "0.5rem 1.2rem",
                    borderRadius: "8px",
                    cursor: loadMoreLoading ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {loadMoreLoading ? "Loading..." : "Show More Stocks"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
