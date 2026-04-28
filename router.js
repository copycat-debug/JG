import { loadBoardList } from "./board.js";
import { loadStudyList } from "./study.js";
import { loadUpbitPage } from "./upbit.js";

export function navigate(viewId) {
  const targetView = document.getElementById(`view-${viewId}`);

  if (!targetView) {
    console.warn(`존재하지 않는 화면입니다: view-${viewId}`);
    return;
  }

  document.querySelectorAll(".page-section").forEach((section) => {
    section.classList.remove("active");
  });

  targetView.classList.add("active");

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.classList.remove("active");
  });

  if (viewId === "main") {
    setActiveNav("nav-main");
  } else if (viewId === "about") {
    setActiveNav("nav-about");
  } else if (viewId.startsWith("board")) {
    setActiveNav("nav-board");
  } else if (viewId.startsWith("study")) {
    setActiveNav("nav-study");
  } else if (viewId === "upbit") {
    setActiveNav("nav-upbit");
  } else if (viewId === "login" || viewId === "signup") {
    setActiveNav("nav-login");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  if (viewId === "board-list") {
    loadBoardList();
  }

  if (viewId === "study-list") {
    loadStudyList();
  }

  if (viewId === "upbit") {
    loadUpbitPage();
  }
}

function setActiveNav(navId) {
  const navItem = document.getElementById(navId);

  if (navItem) {
    navItem.classList.add("active");
  }
}
