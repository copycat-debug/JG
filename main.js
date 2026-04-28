import { navigate } from "./router.js";
import {
  loadUpbitPage,
  refreshUpbitPrices,
  closeUpbitChart,
  redrawUpbitChart,
} from "./upbit.js";

import {
  initAuth,
  handleSignUp,
  handleLogin,
  handleLogout,
  handleGoogleLogin,
} from "./auth.js";

import {
  openNewPost,
  savePost,
  goToEditPost,
  deletePost,
  loadBoardList,
  toggleBoardLike,
  addBoardComment,
} from "./board.js";

import {
  openNewStudy,
  saveStudy,
  goToEditStudy,
  deleteStudy,
  loadStudyList,
  toggleStudyLike,
  addStudyComment,
} from "./study.js";

/* ==========================================
   Firebase 초기화
========================================== */
const firebaseConfig = {
  apiKey: "AIzaSyDzRqY2rtgkgzuINhmu2AbsWela_IC2J4Q",
  authDomain: "self-introduction-2d7b3.firebaseapp.com",
  projectId: "self-introduction-2d7b3",
  storageBucket: "self-introduction-2d7b3.firebasestorage.app",
  messagingSenderId: "813752979383",
  appId: "1:813752979383:web:6f240affde82c967006232",
  measurementId: "G-5LLQ2ST47C",
};

firebase.initializeApp(firebaseConfig);

window.auth = firebase.auth();
window.db = firebase.firestore();
window.storage = firebase.storage();

/* ==========================================
   마크다운 코드 하이라이트 설정
========================================== */
if (typeof marked !== "undefined" && marked.setOptions) {
  marked.setOptions({
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
    langPrefix: "hljs language-",
  });
}

/* ==========================================
   타이핑 효과
========================================== */
const quotes = [
  "기본에 충실하며 성장을 멈추지 않는 프론트엔드 개발자입니다.",
  "문제 해결의 즐거움을 코드에 담아내는 김민준의 포트폴리오입니다.",
  "작은 디테일이 모여 큰 차이를 만든다고 믿습니다.",
  "복잡한 문제를 단순하고 명확한 코드로 풀어냅니다.",
  "불닭볶음면이 먹고싶습니다.",
  "까르보 보단 오리지널이 맛있습니다.",
  "불닭볶음면을 우유와 같이 먹으면 맵찔이입니다.",
  "저는 맵찔이니, 우유와 같이 먹겠습니다.",
];

let quoteIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
  const textElement = document.getElementById("rotating-text");
  if (!textElement) return;

  const currentQuote = quotes[quoteIndex];

  if (isDeleting) {
    charIndex--;
  } else {
    charIndex++;
  }

  textElement.textContent = currentQuote.substring(0, charIndex);

  let delay = isDeleting ? 50 : 100;

  if (!isDeleting && charIndex === currentQuote.length) {
    delay = 2000;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    quoteIndex = (quoteIndex + 1) % quotes.length;
    delay = 500;
  }

  setTimeout(typeEffect, delay);
}

/* ==========================================
   HTML onclick에서 쓸 함수들을 전역으로 연결
========================================== */
window.navigate = navigate;

window.handleSignUp = handleSignUp;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.handleGoogleLogin = handleGoogleLogin;

window.openNewPost = openNewPost;
window.savePost = savePost;
window.goToEditPost = goToEditPost;
window.deletePost = deletePost;
window.loadBoardList = loadBoardList;
window.toggleBoardLike = toggleBoardLike;
window.addBoardComment = addBoardComment;

window.openNewStudy = openNewStudy;
window.saveStudy = saveStudy;
window.goToEditStudy = goToEditStudy;
window.deleteStudy = deleteStudy;
window.loadStudyList = loadStudyList;
window.toggleStudyLike = toggleStudyLike;
window.addStudyComment = addStudyComment;

window.loadUpbitPage = loadUpbitPage;
window.refreshUpbitPrices = refreshUpbitPrices;
window.closeUpbitChart = closeUpbitChart;
window.redrawUpbitChart = redrawUpbitChart;

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("theme", nextTheme);

  const themeBtn = document.getElementById("theme-toggle-btn");
  if (themeBtn) {
    themeBtn.textContent = nextTheme === "dark" ? "S" : "D";
    themeBtn.setAttribute(
      "aria-label",
      nextTheme === "dark" ? "라이트모드 전환" : "다크모드 전환"
    );
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme || (prefersDark ? "dark" : "light"));
}

function toggleTheme() {
  const currentTheme =
    document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  applyTheme(currentTheme === "dark" ? "light" : "dark");

  if (typeof window.redrawUpbitChart === "function") {
    window.redrawUpbitChart();
  }
}

window.toggleTheme = toggleTheme;

/* ==========================================
   초기 실행
========================================== */
window.addEventListener("load", () => {
  initTheme();
  setTimeout(typeEffect, 500);
  initAuth();
});