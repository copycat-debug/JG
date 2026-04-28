const PROXY_API = "https://upbit-eight.vercel.app/api/upbit";

const DEFAULT_CHART_DAYS = 30;
const MAX_CHART_DAYS = 90;
const CHART_RANGE_STORAGE_KEY = "upbitChartDateRange";
const MAX_SEARCH_RESULTS = 50;

const SEARCH_SUGGESTION_LIMIT = 8;
const POPULAR_MARKET_CODES = ["KRW-BTC", "KRW-ETH", "KRW-XRP", "KRW-SOL", "KRW-DOGE", "KRW-ADA"];

// 연관 검색어는 API를 부르지 않고 이 로컬 목록만 사용합니다.
const LOCAL_KRW_MARKETS = [
  { market: "KRW-BTC", korean_name: "비트코인", english_name: "Bitcoin", aliases: ["BTC", "비트", "비트코인", "bitcoin"] },
  { market: "KRW-ETH", korean_name: "이더리움", english_name: "Ethereum", aliases: ["ETH", "이더", "이더리움", "ethereum"] },
  { market: "KRW-XRP", korean_name: "리플", english_name: "XRP", aliases: ["XRP", "리플", "엑스알피", "ripple"] },
  { market: "KRW-SOL", korean_name: "솔라나", english_name: "Solana", aliases: ["SOL", "솔", "솔라나", "solana"] },
  { market: "KRW-DOGE", korean_name: "도지코인", english_name: "Dogecoin", aliases: ["DOGE", "도지", "도지코인", "dogecoin"] },
  { market: "KRW-ADA", korean_name: "에이다", english_name: "Cardano", aliases: ["ADA", "카르다노", "에이다", "cardano"] },
  { market: "KRW-TRX", korean_name: "트론", english_name: "TRON", aliases: ["TRX", "트론", "tron"] },
  { market: "KRW-DOT", korean_name: "폴카닷", english_name: "Polkadot", aliases: ["DOT", "폴카닷", "polkadot"] },
  { market: "KRW-LINK", korean_name: "체인링크", english_name: "Chainlink", aliases: ["LINK", "체인링크", "chainlink"] },
  { market: "KRW-BCH", korean_name: "비트코인캐시", english_name: "Bitcoin Cash", aliases: ["BCH", "비캐", "비트코인캐시", "bitcoin cash"] },
  { market: "KRW-LTC", korean_name: "라이트코인", english_name: "Litecoin", aliases: ["LTC", "라이트", "라이트코인", "litecoin"] },
  { market: "KRW-ETC", korean_name: "이더리움클래식", english_name: "Ethereum Classic", aliases: ["ETC", "이클", "이더리움클래식", "ethereum classic"] },
  { market: "KRW-SUI", korean_name: "수이", english_name: "Sui", aliases: ["SUI", "수이", "sui"] },
  { market: "KRW-APT", korean_name: "앱토스", english_name: "Aptos", aliases: ["APT", "앱토스", "aptos"] },
  { market: "KRW-AVAX", korean_name: "아발란체", english_name: "Avalanche", aliases: ["AVAX", "아발란체", "avalanche"] },
  { market: "KRW-NEAR", korean_name: "니어프로토콜", english_name: "NEAR Protocol", aliases: ["NEAR", "니어", "니어프로토콜", "near"] },
  { market: "KRW-HBAR", korean_name: "헤데라", english_name: "Hedera", aliases: ["HBAR", "헤데라", "hedera"] },
  { market: "KRW-XLM", korean_name: "스텔라루멘", english_name: "Stellar", aliases: ["XLM", "스텔라", "스텔라루멘", "stellar"] },
  { market: "KRW-ATOM", korean_name: "코스모스", english_name: "Cosmos", aliases: ["ATOM", "코스모스", "cosmos"] },
  { market: "KRW-ALGO", korean_name: "알고랜드", english_name: "Algorand", aliases: ["ALGO", "알고랜드", "algorand"] },
  { market: "KRW-AAVE", korean_name: "에이브", english_name: "Aave", aliases: ["AAVE", "에이브", "aave"] },
  { market: "KRW-STX", korean_name: "스택스", english_name: "Stacks", aliases: ["STX", "스택스", "stacks"] },
  { market: "KRW-SHIB", korean_name: "시바이누", english_name: "Shiba Inu", aliases: ["SHIB", "시바", "시바이누", "shiba"] },
  { market: "KRW-MANA", korean_name: "디센트럴랜드", english_name: "Decentraland", aliases: ["MANA", "마나", "디센트럴랜드", "decentraland"] },
  { market: "KRW-SAND", korean_name: "샌드박스", english_name: "The Sandbox", aliases: ["SAND", "샌드", "샌드박스", "sandbox"] },
  { market: "KRW-ARB", korean_name: "아비트럼", english_name: "Arbitrum", aliases: ["ARB", "아비트럼", "arbitrum"] },
  { market: "KRW-SEI", korean_name: "세이", english_name: "Sei", aliases: ["SEI", "세이", "sei"] },
  { market: "KRW-BLUR", korean_name: "블러", english_name: "Blur", aliases: ["BLUR", "블러", "blur"] },
  { market: "KRW-IMX", korean_name: "이뮤터블엑스", english_name: "Immutable", aliases: ["IMX", "이뮤터블", "이뮤터블엑스", "immutable"] },
  { market: "KRW-MINA", korean_name: "미나", english_name: "Mina", aliases: ["MINA", "미나", "mina"] },
  { market: "KRW-POLYX", korean_name: "폴리매쉬", english_name: "Polymesh", aliases: ["POLYX", "폴리매쉬", "polymesh"] },
  { market: "KRW-CHZ", korean_name: "칠리즈", english_name: "Chiliz", aliases: ["CHZ", "칠리즈", "chiliz"] },
  { market: "KRW-ANKR", korean_name: "앵커", english_name: "Ankr", aliases: ["ANKR", "앵커", "ankr"] },
  { market: "KRW-BORA", korean_name: "보라", english_name: "BORA", aliases: ["BORA", "보라"] },
  { market: "KRW-USDT", korean_name: "테더", english_name: "Tether", aliases: ["USDT", "테더", "달러", "tether"] },
];


let krwMarkets = getLocalKrwMarkets();
let tickerRows = [];
let isInitialized = false;
let isLoading = false;
let selectedMarket = null;
let selectedChartData = [];
let selectedDateRange = getInitialChartDateRange();

export async function loadUpbitPage() {
  initUpbitEvents();
  ensureChartRangeControls();
  syncChartRangeInputs(selectedDateRange);

  const refreshBtn = document.getElementById("upbit-refresh-btn");
  const status = document.getElementById("upbit-status");
  const tbody = document.getElementById("upbit-tbody");
  const searchInput = document.getElementById("upbit-search");

  if (refreshBtn) {
    refreshBtn.innerText = "검색";
  }

  if (tbody && tickerRows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-row">
          코인명, 심볼, 마켓명을 검색하면 시세가 표시됩니다.
        </td>
      </tr>
    `;
  }

  ensureUpbitSearchSuggestions();
  await ensureKrwMarketsLoaded();

  if (status) {
    status.textContent = `연관 검색어 ${krwMarkets.length}개가 준비되었습니다. 검색창에 BTC, 비트코인, KRW-BTC처럼 입력해보세요.`;
  }

  renderSearchSuggestions(searchInput?.value || "", { forcePopular: false });
}

export async function refreshUpbitPrices() {
  if (isLoading) return;

  const refreshBtn = document.getElementById("upbit-refresh-btn");
  const status = document.getElementById("upbit-status");
  const tbody = document.getElementById("upbit-tbody");
  const searchInput = document.getElementById("upbit-search");

  const keyword = (searchInput?.value || "").trim();

  if (!keyword) {
    if (status) {
      status.textContent = "검색어를 입력해주세요. 예: BTC, 비트코인, KRW-BTC";
    }

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-row">
            검색어를 입력하면 해당 종목의 시세가 표시됩니다.
          </td>
        </tr>
      `;
    }

    closeUpbitChart();
    return;
  }

  isLoading = true;
  setButtonLoading(refreshBtn, true, "검색 중...");

  if (status) {
    status.textContent = "검색된 종목의 시세를 불러오는 중입니다...";
  }

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-row">데이터를 불러오는 중입니다...</td>
      </tr>
    `;
  }

  try {
    await ensureKrwMarketsLoaded();

    const matchedMarkets = searchMarkets(keyword);

    if (matchedMarkets.length === 0) {
      tickerRows = [];
      renderUpbitTable();

      if (status) {
        status.textContent = `"${keyword}"에 대한 검색 결과가 없습니다.`;
      }

      closeUpbitChart();
      return;
    }

    const limitedMarkets = matchedMarkets.slice(0, MAX_SEARCH_RESULTS);
    const marketCodes = limitedMarkets.map((market) => market.market);
    const tickers = await fetchTickers(marketCodes);
    const marketMap = new Map(limitedMarkets.map((market) => [market.market, market]));

    tickerRows = tickers
      .map((ticker) => {
        const market = marketMap.get(ticker.market) || {};

        return {
          ...ticker,
          korean_name: market.korean_name || ticker.market,
          english_name: market.english_name || "",
        };
      })
      .sort((a, b) => (b.acc_trade_price_24h || 0) - (a.acc_trade_price_24h || 0));

    renderUpbitTable();

    if (status) {
      const now = new Date();
      const limitedText =
        matchedMarkets.length > MAX_SEARCH_RESULTS
          ? ` / 상위 ${MAX_SEARCH_RESULTS}개만 표시`
          : "";

      status.textContent = `"${keyword}" 검색 결과 ${matchedMarkets.length}개${limitedText} · 마지막 업데이트: ${now.toLocaleString(
        "ko-KR"
      )}`;
    }

    hideSearchSuggestions();
    closeUpbitChart();
  } catch (error) {
    console.error("업비트 시세 로딩 오류:", error);

    if (status) {
      status.textContent = "시세 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
    }

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-row">오류 발생: ${escapeHTML(error.message)}</td>
        </tr>
      `;
    }
  } finally {
    isLoading = false;
    setButtonLoading(refreshBtn, false, "검색");
  }
}

export function closeUpbitChart() {
  selectedMarket = null;
  selectedChartData = [];

  const panel = document.getElementById("upbit-chart-panel");
  if (panel) panel.style.display = "none";

  document.querySelectorAll("#upbit-tbody tr.selected").forEach((row) => {
    row.classList.remove("selected");
  });
}

export function redrawUpbitChart() {
  if (selectedChartData.length > 0 && selectedMarket) {
    renderChart(selectedMarket, selectedChartData);
  }
}

function initUpbitEvents() {
  if (isInitialized) return;

  document.addEventListener("keydown", (event) => {
    if (event.target?.id === "upbit-search" && event.key === "Enter") {
      event.preventDefault();
      refreshUpbitPrices();
    }

    if (
      (event.target?.id === "upbit-start-date" || event.target?.id === "upbit-end-date") &&
      event.key === "Enter"
    ) {
      event.preventDefault();
      applyChartDateRangeFromInputs();
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target?.id !== "upbit-search") return;

    const keyword = event.target.value.trim();
    const tbody = document.getElementById("upbit-tbody");
    const status = document.getElementById("upbit-status");

    renderSearchSuggestions(keyword, { forcePopular: !keyword });

    if (!tbody) return;

    if (!keyword) {
      tickerRows = [];
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-row">
            코인명, 심볼, 마켓명을 검색하면 시세가 표시됩니다.
          </td>
        </tr>
      `;

      if (status && krwMarkets.length > 0) {
        status.textContent = `연관 검색어 ${krwMarkets.length}개가 준비되었습니다.`;
      }

      closeUpbitChart();
    }
  });

  document.addEventListener("focusin", (event) => {
    if (event.target?.id !== "upbit-search") return;

    const keyword = event.target.value.trim();
    renderSearchSuggestions(keyword, { forcePopular: !keyword });
  });

  document.addEventListener("click", (event) => {
    const suggestionBtn = event.target?.closest?.(".upbit-suggestion-item");
    if (suggestionBtn) {
      event.preventDefault();
      const searchInput = document.getElementById("upbit-search");
      if (searchInput) {
        searchInput.value = suggestionBtn.dataset.keyword || suggestionBtn.dataset.market || "";
        searchInput.focus();
      }
      hideSearchSuggestions();
      refreshUpbitPrices();
      return;
    }

    if (
      !event.target?.closest?.(".upbit-search-group") &&
      !event.target?.closest?.("#upbit-search-suggestions")
    ) {
      hideSearchSuggestions();
    }

    const applyBtn = event.target?.closest?.("#upbit-date-apply-btn");
    if (applyBtn) {
      event.preventDefault();
      applyChartDateRangeFromInputs();
      return;
    }

    const presetBtn = event.target?.closest?.(".chart-range-preset-btn");
    if (presetBtn) {
      event.preventDefault();
      selectChartRangePreset(Number(presetBtn.dataset.days));
      return;
    }

    const row = event.target?.closest?.("#upbit-tbody tr[data-market]");
    if (!row) return;

    selectMarket(row.dataset.market);
  });

  window.addEventListener("resize", positionSearchSuggestions);
  window.addEventListener("scroll", positionSearchSuggestions, true);

  isInitialized = true;
}

async function ensureKrwMarketsLoaded() {
  if (krwMarkets.length > 0) return;

  krwMarkets = getLocalKrwMarkets();
}

function getLocalKrwMarkets() {
  return LOCAL_KRW_MARKETS.map((market) => ({
    ...market,
    market: market.market.toUpperCase(),
    aliases: Array.isArray(market.aliases) ? market.aliases : [],
  }));
}

async function fetchTickers(markets) {
  if (!markets || markets.length === 0) return [];

  const url = `${PROXY_API}?path=ticker&markets=${encodeURIComponent(markets.join(","))}`;

  try {
    return await safeUpbitFetch(url);
  } catch (error) {
    const results = await Promise.all(
      markets.map(async (market) => {
        try {
          const oneUrl = `${PROXY_API}?path=ticker&markets=${encodeURIComponent(market)}`;
          const [ticker] = await safeUpbitFetch(oneUrl);
          return ticker || null;
        } catch (singleError) {
          console.warn("시세 조회 제외:", market, singleError.message);
          return null;
        }
      })
    );

    const validTickers = results.filter(Boolean);
    if (validTickers.length === 0) throw error;
    return validTickers;
  }
}

async function fetchDailyCandles(market, dateRange = selectedDateRange) {
  const safeRange = normalizeDateRange(dateRange.start, dateRange.end, {
    fallbackToDefault: true,
    clampToMax: true,
  });

  selectedDateRange = {
    start: safeRange.start,
    end: safeRange.end,
  };
  saveChartDateRange(selectedDateRange);
  syncChartRangeInputs(selectedDateRange);

  const count = safeRange.dayCount;
  const to = `${safeRange.end}T23:59:59+09:00`;
  const url = `${PROXY_API}?path=candles/days&market=${encodeURIComponent(
    market
  )}&count=${count}&to=${encodeURIComponent(to)}`;

  const candles = await safeUpbitFetch(url);

  return candles
    .reverse()
    .filter((candle) => {
      const candleDate = getCandleDate(candle);
      return candleDate >= safeRange.start && candleDate <= safeRange.end;
    });
}

async function safeUpbitFetch(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API 요청 실패 (${response.status})`);
  }

  const data = await response.json();

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

function searchMarkets(keyword) {
  const normalizedKeyword = normalizeSearchText(keyword);
  if (!normalizedKeyword) return [];

  return krwMarkets
    .map((market) => ({
      ...market,
      matchScore: getMarketMatchScore(market, normalizedKeyword),
    }))
    .filter((market) => market.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore || a.korean_name.localeCompare(b.korean_name, "ko-KR"));
}


function ensureUpbitSearchSuggestions() {
  const searchGroup = document.querySelector(".upbit-search-group");
  const searchInput = document.getElementById("upbit-search");

  if (!searchGroup || !searchInput || document.getElementById("upbit-search-suggestions")) return;

  searchGroup.classList.add("upbit-search-wrapper");
  searchInput.setAttribute("aria-controls", "upbit-search-suggestions");
  searchInput.setAttribute("autocomplete", "off");

  const suggestions = document.createElement("div");
  suggestions.id = "upbit-search-suggestions";
  suggestions.className = "upbit-suggestions hidden";
  suggestions.setAttribute("role", "listbox");
  suggestions.setAttribute("aria-label", "연관 검색어");

  // 검색창 부모 컨테이너의 overflow에 잘리지 않게 body로 빼서 띄운다.
  document.body.appendChild(suggestions);
}

function renderSearchSuggestions(keyword, options = {}) {
  ensureUpbitSearchSuggestions();

  const suggestions = document.getElementById("upbit-search-suggestions");
  if (!suggestions) return;

  const relatedMarkets = getRelatedSearches(keyword, options);

  if (relatedMarkets.length === 0) {
    hideSearchSuggestions();
    return;
  }

  const title = keyword.trim() ? "연관 검색어" : "인기 검색어";

  suggestions.innerHTML = `
    <div class="upbit-suggestion-title">${title}</div>
    ${relatedMarkets
      .map((market) => {
        const symbol = market.market.replace("KRW-", "");
        return `
          <button
            type="button"
            class="upbit-suggestion-item"
            data-market="${escapeHTML(market.market)}"
            data-keyword="${escapeHTML(market.market)}"
            role="option"
          >
            <span>
              <strong>${escapeHTML(market.korean_name)}</strong>
              <small>${escapeHTML(market.english_name || symbol)}</small>
            </span>
            <em>${escapeHTML(symbol)}</em>
          </button>
        `;
      })
      .join("")}
  `;

  suggestions.classList.remove("hidden");
  positionSearchSuggestions();
}

function hideSearchSuggestions() {
  const suggestions = document.getElementById("upbit-search-suggestions");
  if (suggestions) suggestions.classList.add("hidden");
}

function positionSearchSuggestions() {
  const suggestions = document.getElementById("upbit-search-suggestions");
  const searchInput = document.getElementById("upbit-search");

  if (!suggestions || !searchInput || suggestions.classList.contains("hidden")) return;

  const rect = searchInput.getBoundingClientRect();
  const viewportPadding = 14;
  const gap = 8;
  const minHeight = 180;
  const maxPreferredHeight = Math.min(420, Math.floor(window.innerHeight * 0.58));
  const availableBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
  const availableAbove = rect.top - gap - viewportPadding;
  const openAbove = availableBelow < minHeight && availableAbove > availableBelow;
  const availableSpace = openAbove ? availableAbove : availableBelow;
  const maxHeight = Math.max(minHeight, Math.min(maxPreferredHeight, availableSpace));
  const width = Math.min(rect.width, window.innerWidth - viewportPadding * 2);
  const left = Math.min(
    Math.max(rect.left, viewportPadding),
    window.innerWidth - width - viewportPadding
  );
  const top = openAbove
    ? Math.max(viewportPadding, rect.top - gap - maxHeight)
    : Math.min(rect.bottom + gap, window.innerHeight - viewportPadding - minHeight);

  suggestions.style.left = `${Math.round(left)}px`;
  suggestions.style.top = `${Math.round(top)}px`;
  suggestions.style.width = `${Math.round(width)}px`;
  suggestions.style.maxHeight = `${Math.round(maxHeight)}px`;
  suggestions.classList.toggle("open-above", openAbove);
}

function getRelatedSearches(keyword, options = {}) {
  const { forcePopular = false } = options;
  const normalizedKeyword = normalizeSearchText(keyword);

  if (!normalizedKeyword && !forcePopular) return [];

  if (!normalizedKeyword) {
    return POPULAR_MARKET_CODES
      .map((code) => krwMarkets.find((market) => market.market === code))
      .filter(Boolean)
      .slice(0, SEARCH_SUGGESTION_LIMIT);
  }

  return krwMarkets
    .map((market) => ({
      ...market,
      matchScore: getMarketMatchScore(market, normalizedKeyword),
    }))
    .filter((market) => market.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore || a.korean_name.localeCompare(b.korean_name, "ko-KR"))
    .slice(0, SEARCH_SUGGESTION_LIMIT);
}

function getMarketMatchScore(market, normalizedKeyword) {
  const symbol = market.market.replace("KRW-", "");
  const values = [
    market.market,
    symbol,
    market.korean_name,
    market.english_name,
    ...(market.aliases || []),
  ];

  let bestScore = 0;

  values.forEach((value) => {
    const normalizedValue = normalizeSearchText(value);
    if (!normalizedValue) return;

    if (normalizedValue === normalizedKeyword) bestScore = Math.max(bestScore, 120);
    else if (normalizedValue.startsWith(normalizedKeyword)) bestScore = Math.max(bestScore, 95);
    else if (normalizedValue.includes(normalizedKeyword)) bestScore = Math.max(bestScore, 70);
    else if (normalizedKeyword.includes(normalizedValue)) bestScore = Math.max(bestScore, 55);
  });

  if (POPULAR_MARKET_CODES.includes(market.market) && bestScore > 0) {
    bestScore += 5;
  }

  return bestScore;
}

function renderUpbitTable() {
  const tbody = document.getElementById("upbit-tbody");

  if (!tbody) return;

  if (tickerRows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-row">검색 결과가 없습니다.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = tickerRows
    .map((row) => {
      const changeClass = getChangeClass(row.signed_change_price);
      const sign = row.signed_change_price > 0 ? "+" : "";
      const rate = `${sign}${formatPercent(row.signed_change_rate)}`;
      const priceChange = `${sign}${formatKRW(row.signed_change_price)}`;
      const selectedClass = selectedMarket?.market === row.market ? " selected" : "";

      return `
        <tr
          class="upbit-row${selectedClass}"
          data-market="${escapeHTML(row.market)}"
          title="클릭하면 선택한 날짜 범위의 그래프를 볼 수 있습니다"
        >
          <td><strong>${escapeHTML(row.market)}</strong></td>
          <td>${escapeHTML(row.korean_name)}</td>
          <td><strong>${formatKRW(row.trade_price)}</strong></td>
          <td class="${changeClass}">
            <strong>${rate}</strong><br />
            <span>${priceChange}</span>
          </td>
          <td>${formatTradePrice(row.acc_trade_price_24h)}</td>
        </tr>
      `;
    })
    .join("");
}

async function selectMarket(marketCode) {
  const market = tickerRows.find((row) => row.market === marketCode);
  if (!market) return;

  selectedMarket = market;
  selectedChartData = [];

  document.querySelectorAll("#upbit-tbody tr.selected").forEach((row) => {
    row.classList.remove("selected");
  });

  document
    .querySelector(`#upbit-tbody tr[data-market="${cssEscape(market.market)}"]`)
    ?.classList.add("selected");

  const panel = document.getElementById("upbit-chart-panel");
  const title = document.getElementById("upbit-chart-title");

  ensureChartRangeControls();
  syncChartRangeInputs(selectedDateRange);

  if (panel) panel.style.display = "block";
  if (title) title.textContent = `${market.korean_name} (${market.market})`;

  await reloadSelectedMarketChart();
}

function renderChart(market, candles) {
  const canvas = document.getElementById("upbit-chart");
  const subtitle = document.getElementById("upbit-chart-subtitle");

  if (!canvas) return;

  if (candles.length === 0) {
    drawChartMessage(canvas, "선택한 날짜 범위에 표시할 일봉 데이터가 없습니다.");
    if (subtitle) {
      subtitle.textContent = `${formatDateRangeLabel(selectedDateRange)} · 표시할 데이터가 없습니다.`;
    }
    return;
  }

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.clientWidth || 900;
  const height = rect.height || 320;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const style = getComputedStyle(document.documentElement);
  const textColor = style.getPropertyValue("--text-secondary").trim() || "#4b5563";
  const mainTextColor = style.getPropertyValue("--text-primary").trim() || "#111827";
  const borderColor = style.getPropertyValue("--border-color").trim() || "#e5e7eb";
  const accentColor = style.getPropertyValue("--accent-color").trim() || "#4f46e5";
  const surfaceColor = style.getPropertyValue("--surface-color").trim() || "#ffffff";

  const prices = candles.map((candle) => candle.trade_price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  const padding = {
    top: 28,
    right: 22,
    bottom: 42,
    left: 76,
  };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xForIndex = (index) =>
    padding.left +
    (candles.length === 1 ? chartWidth / 2 : (chartWidth * index) / (candles.length - 1));

  const yForPrice = (price) =>
    padding.top + ((maxPrice - price) / range) * chartHeight;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = surfaceColor;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.font = "12px Pretendard, sans-serif";
  ctx.fillStyle = textColor;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight * i) / 4;
    const price = maxPrice - (range * i) / 4;

    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillText(shortKRW(price), padding.left - 10, y);
  }

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();

  candles.forEach((candle, index) => {
    const x = xForIndex(index);
    const y = yForPrice(candle.trade_price);

    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  ctx.fillStyle = accentColor;
  const pointStep = candles.length <= 14 ? 1 : candles.length <= 45 ? 4 : 8;

  candles.forEach((candle, index) => {
    if (index !== 0 && index !== candles.length - 1 && index % pointStep !== 0) return;

    ctx.beginPath();
    ctx.arc(xForIndex(index), yForPrice(candle.trade_price), 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const first = candles[0];
  const last = candles[candles.length - 1];

  ctx.fillText(
    formatDate(first.candle_date_time_kst),
    padding.left,
    height - padding.bottom + 18
  );

  ctx.fillText(
    formatDate(last.candle_date_time_kst),
    width - padding.right,
    height - padding.bottom + 18
  );

  ctx.fillStyle = mainTextColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "700 13px Pretendard, sans-serif";
  ctx.fillText(`현재가 ${formatKRW(market.trade_price)}`, padding.left, 8);

  if (subtitle) {
    subtitle.textContent = `${formatDateRangeLabel(selectedDateRange)} · ${candles.length}개 일봉 · 마지막 종가 ${formatKRW(
      last.trade_price
    )}`;
  }
}

async function reloadSelectedMarketChart() {
  if (!selectedMarket) return;

  const subtitle = document.getElementById("upbit-chart-subtitle");
  const canvas = document.getElementById("upbit-chart");
  const safeRange = normalizeDateRange(selectedDateRange.start, selectedDateRange.end, {
    fallbackToDefault: true,
    clampToMax: true,
  });

  selectedDateRange = {
    start: safeRange.start,
    end: safeRange.end,
  };
  saveChartDateRange(selectedDateRange);
  syncChartRangeInputs(selectedDateRange);

  if (subtitle) {
    subtitle.textContent = `${formatDateRangeLabel(selectedDateRange)} 종가 그래프를 불러오는 중입니다...`;
  }

  showChartLoading(canvas);

  try {
    const candles = await fetchDailyCandles(selectedMarket.market, selectedDateRange);
    selectedChartData = candles;
    renderChart(selectedMarket, candles);
  } catch (error) {
    console.error("업비트 그래프 로딩 오류:", error);

    if (subtitle) {
      subtitle.textContent = "그래프 데이터를 불러오지 못했습니다.";
    }

    showChartError(canvas, error.message);
  }
}

function ensureChartRangeControls() {
  const panel = document.getElementById("upbit-chart-panel");
  if (!panel || document.getElementById("upbit-date-range-controls")) return;

  const controls = document.createElement("div");
  controls.id = "upbit-date-range-controls";
  controls.className = "upbit-date-range-controls";
  controls.innerHTML = `
    <div class="upbit-date-range-title">
      <span>그래프 기간</span>
      <small>최대 ${MAX_CHART_DAYS}일</small>
    </div>
    <div class="upbit-date-range-fields">
      <label class="upbit-date-field">
        <span>시작일</span>
        <input type="date" id="upbit-start-date" class="upbit-date-input" />
      </label>
      <span class="upbit-date-separator">~</span>
      <label class="upbit-date-field">
        <span>종료일</span>
        <input type="date" id="upbit-end-date" class="upbit-date-input" />
      </label>
      <button type="button" id="upbit-date-apply-btn" class="btn upbit-date-apply-btn">적용</button>
    </div>
    <div class="upbit-date-presets" aria-label="빠른 기간 선택">
      <button type="button" class="chart-range-preset-btn" data-days="7">7일</button>
      <button type="button" class="chart-range-preset-btn" data-days="30">30일</button>
      <button type="button" class="chart-range-preset-btn" data-days="60">60일</button>
      <button type="button" class="chart-range-preset-btn" data-days="90">90일</button>
    </div>
  `;

  const header = panel.querySelector(".upbit-chart-header");
  if (header) {
    header.insertAdjacentElement("afterend", controls);
  } else {
    panel.prepend(controls);
  }
}

function applyChartDateRangeFromInputs() {
  const startInput = document.getElementById("upbit-start-date");
  const endInput = document.getElementById("upbit-end-date");
  const safeRange = normalizeDateRange(startInput?.value, endInput?.value, {
    fallbackToDefault: false,
    clampToMax: true,
  });

  if (!safeRange.ok) {
    alert(safeRange.message);
    syncChartRangeInputs(selectedDateRange);
    return;
  }

  const wasClamped = safeRange.wasClamped;

  selectedDateRange = {
    start: safeRange.start,
    end: safeRange.end,
  };
  saveChartDateRange(selectedDateRange);
  syncChartRangeInputs(selectedDateRange);

  if (wasClamped) {
    const subtitle = document.getElementById("upbit-chart-subtitle");
    if (subtitle) {
      subtitle.textContent = `업비트 요청 제한 때문에 ${MAX_CHART_DAYS}일 범위로 자동 조정했습니다.`;
    }
  }

  reloadSelectedMarketChart();
}

function selectChartRangePreset(days) {
  const safeDays = clampNumber(days, 1, MAX_CHART_DAYS);
  const endInput = document.getElementById("upbit-end-date");
  const today = formatInputDate(new Date());
  const rawEnd = isValidDateInput(endInput?.value) ? endInput.value : selectedDateRange.end;
  const end = rawEnd > today ? today : rawEnd;
  const start = shiftDate(end, -(safeDays - 1));

  selectedDateRange = { start, end };
  saveChartDateRange(selectedDateRange);
  syncChartRangeInputs(selectedDateRange);
  reloadSelectedMarketChart();
}

function syncChartRangeInputs(range) {
  const safeRange = normalizeDateRange(range?.start, range?.end, {
    fallbackToDefault: true,
    clampToMax: true,
  });
  const startInput = document.getElementById("upbit-start-date");
  const endInput = document.getElementById("upbit-end-date");
  const today = formatInputDate(new Date());

  if (startInput) {
    startInput.value = safeRange.start;
    startInput.max = today;
  }

  if (endInput) {
    endInput.value = safeRange.end;
    endInput.max = today;
  }

  document.querySelectorAll(".chart-range-preset-btn").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.days) === safeRange.dayCount);
  });
}

function getInitialChartDateRange() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHART_RANGE_STORAGE_KEY) || "null");
    const safeRange = normalizeDateRange(saved?.start, saved?.end, {
      fallbackToDefault: true,
      clampToMax: true,
    });

    return {
      start: safeRange.start,
      end: safeRange.end,
    };
  } catch (error) {
    return getDefaultDateRange();
  }
}

function saveChartDateRange(range) {
  try {
    localStorage.setItem(CHART_RANGE_STORAGE_KEY, JSON.stringify(range));
  } catch (error) {
    console.warn("그래프 기간 저장 실패:", error);
  }
}

function getDefaultDateRange() {
  const end = formatInputDate(new Date());
  const start = shiftDate(end, -(DEFAULT_CHART_DAYS - 1));
  return { start, end };
}

function normalizeDateRange(startValue, endValue, options = {}) {
  const { fallbackToDefault = true, clampToMax = true } = options;
  const today = formatInputDate(new Date());
  const fallback = getDefaultDateRange();
  let start = isValidDateInput(startValue) ? startValue : fallback.start;
  let end = isValidDateInput(endValue) ? endValue : fallback.end;

  if (!fallbackToDefault && (!isValidDateInput(startValue) || !isValidDateInput(endValue))) {
    return {
      ok: false,
      message: "시작일과 종료일을 모두 선택해주세요.",
    };
  }

  if (end > today) end = today;
  if (start > today) start = today;

  if (start > end) {
    return {
      ok: false,
      message: "시작일은 종료일보다 늦을 수 없습니다.",
    };
  }

  let dayCount = getDateRangeDayCount(start, end);
  let wasClamped = false;

  if (clampToMax && dayCount > MAX_CHART_DAYS) {
    start = shiftDate(end, -(MAX_CHART_DAYS - 1));
    dayCount = MAX_CHART_DAYS;
    wasClamped = true;
  }

  return {
    ok: true,
    start,
    end,
    dayCount,
    wasClamped,
  };
}

function getDateRangeDayCount(start, end) {
  const startDate = parseDateInput(start);
  const endDate = parseDateInput(end);
  return Math.floor((endDate - startDate) / 86400000) + 1;
}

function getCandleDate(candle) {
  const rawDate = candle?.candle_date_time_kst || candle?.candle_date_time_utc || "";
  return rawDate.slice(0, 10);
}

function parseDateInput(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function isValidDateInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const date = parseDateInput(value);
  return !Number.isNaN(date.getTime());
}

function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDate(value, dayOffset) {
  const date = parseDateInput(value);
  date.setDate(date.getDate() + dayOffset);
  return formatInputDate(date);
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function formatDateRangeLabel(range) {
  const safeRange = normalizeDateRange(range?.start, range?.end, {
    fallbackToDefault: true,
    clampToMax: true,
  });

  return `${formatDisplayDate(safeRange.start)} ~ ${formatDisplayDate(safeRange.end)}`;
}

function formatDisplayDate(value) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${year}.${month}.${day}`;
}

function showChartLoading(canvas) {
  drawChartMessage(canvas, "그래프를 불러오는 중입니다...");
}

function showChartError(canvas, message) {
  drawChartMessage(canvas, `그래프 오류: ${message}`);
}

function drawChartMessage(canvas, message) {
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.clientWidth || 900;
  const height = rect.height || 320;

  const style = getComputedStyle(document.documentElement);
  const surfaceColor = style.getPropertyValue("--surface-color").trim() || "#ffffff";
  const textColor = style.getPropertyValue("--text-secondary").trim() || "#4b5563";

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = surfaceColor;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = textColor;
  ctx.font = "600 15px Pretendard, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, width / 2, height / 2);
}

function getChangeClass(changePrice) {
  if (changePrice > 0) return "price-up";
  if (changePrice < 0) return "price-down";
  return "price-flat";
}

function formatKRW(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";

  return `${value.toLocaleString("ko-KR", {
    maximumFractionDigits: value >= 100 ? 0 : 4,
  })}원`;
}

function shortKRW(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";

  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`;

  if (value >= 10000) {
    return `${Math.round(value / 10000).toLocaleString("ko-KR")}만`;
  }

  return value.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  });
}

function formatPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${(value * 100).toFixed(2)}%`;
}

function formatTradePrice(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";

  const eok = value / 100000000;

  if (eok >= 1) {
    return `${Math.round(eok).toLocaleString("ko-KR")}억`;
  }

  return formatKRW(value);
}

function formatDate(value) {
  if (!value) return "-";

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[2]}/${match[3]}` : value;
}

function setButtonLoading(button, isButtonLoading, text) {
  if (!button) return;

  button.disabled = isButtonLoading;
  button.innerText = text;
}

function cssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(value);
  return String(value).replace(/"/g, '\\"');
}

function escapeHTML(str) {
  if (!str) return "";

  return String(str).replace(/[&<>'"]/g, (tag) => {
    const chars = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };

    return chars[tag];
  });
}

function normalizeSearchText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "");
}