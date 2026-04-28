export async function initAuth() {
  const auth = window.auth;

  try {
    // 새로고침하거나 브라우저를 다시 열어도 로그인 상태가 유지되게 함
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  } catch (error) {
    console.error("인증 초기화 오류:", error);
  }

  auth.onAuthStateChanged((user) => {
    const authForm = document.getElementById("auth-form");
    const userInfo = document.getElementById("user-info");
    const userEmailSpan = document.getElementById("user-email");
    const navLogin = document.getElementById("nav-login");

    if (user) {
      if (authForm) authForm.style.display = "none";
      if (userInfo) userInfo.style.display = "block";
      if (userEmailSpan) userEmailSpan.innerText = user.email || "사용자";
      if (navLogin) navLogin.innerText = "내 정보";
    } else {
      if (authForm) authForm.style.display = "block";
      if (userInfo) userInfo.style.display = "none";
      if (navLogin) navLogin.innerText = "로그인";
    }
  });
}

export function requireAuth() {
  if (!window.auth.currentUser) {
    alert("로그인 후 이용할 수 있습니다.");
    window.navigate("login");
    return false;
  }

  return true;
}

export async function handleSignUp() {
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-pw").value;

  if (!email || !password) {
    alert("이메일과 비밀번호를 모두 입력해주세요.");
    return;
  }

  if (password.length < 6) {
    alert("비밀번호는 6자리 이상이어야 합니다.");
    return;
  }

  try {
    await window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    await window.auth.createUserWithEmailAndPassword(email, password);

    alert("회원가입 완료! 자동으로 로그인됩니다.");

    document.getElementById("signup-email").value = "";
    document.getElementById("signup-pw").value = "";

    window.navigate("main");
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      alert("이미 사용 중인 이메일입니다.");
    } else if (error.code === "auth/invalid-email") {
      alert("이메일 형식이 올바르지 않습니다.");
    } else {
      alert("회원가입 실패: " + error.message);
    }
  }
}

export async function handleLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-pw").value;

  if (!email || !password) {
    alert("이메일과 비밀번호를 모두 입력해주세요.");
    return;
  }

  try {
    await window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    await window.auth.signInWithEmailAndPassword(email, password);

    alert("로그인 성공!");

    document.getElementById("login-email").value = "";
    document.getElementById("login-pw").value = "";

    window.navigate("main");
  } catch (error) {
    alert("로그인 실패: 아이디나 비밀번호를 확인해주세요.");
  }
}

export async function handleLogout() {
  try {
    await window.auth.signOut();

    alert("로그아웃 되었습니다.");
    window.navigate("main");
  } catch (error) {
    alert("로그아웃 오류: " + error.message);
  }
}

export async function handleGoogleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();

  try {
    await window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    const result = await window.auth.signInWithPopup(provider);
    const name = result.user.displayName || "사용자";

    alert(`${name}님, 환영합니다!`);
    window.navigate("main");
  } catch (error) {
    console.error("구글 로그인 에러:", error);
    alert("구글 로그인 실패: " + error.message);
  }
}
