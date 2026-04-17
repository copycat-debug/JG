/* ==========================================
   Firebase 초기화 및 설정
========================================== */
const firebaseConfig = {
    apiKey: "AIzaSyDzRqY2rtgkgzuINhmu2AbsWela_IC2J4Q",
    authDomain: "self-introduction-2d7b3.firebaseapp.com",
    projectId: "self-introduction-2d7b3",
    storageBucket: "self-introduction-2d7b3.appspot.com",
    messagingSenderId: "813752979383",
    appId: "1:813752979383:web:6f240affde82c967006232",
    measurementId: "G-5LLQ2ST47C"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
// 🔥 Storage 기능은 이전처럼 아예 사용하지 않습니다!

/* 브라우저 종료 시 자동 로그아웃 */
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
    .catch((error) => console.error("세션 설정 에러:", error));

/* 마크다운 하이라이트 설정 */
if (typeof marked !== 'undefined' && marked.setOptions) {
    marked.setOptions({
        highlight: function (code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }, langPrefix: 'hljs language-',
        breaks: true
    });
}

/* Navigation 설정 (수정본) */
function navigate(viewId) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${viewId}`).classList.add('active');
    
    document.querySelectorAll('.nav-links a').forEach(el => el.classList.remove('active'));
    
    if (viewId === 'main') document.getElementById('nav-main').classList.add('active');
    else if (viewId === 'about') document.getElementById('nav-about').classList.add('active');
    else if (viewId.startsWith('board')) document.getElementById('nav-board').classList.add('active');
    else if (viewId.startsWith('study')) document.getElementById('nav-study').classList.add('active');
    else if (viewId === 'login' || viewId === 'signup') document.getElementById('nav-login').classList.add('active');
    else if (viewId === 'crypto') document.getElementById('nav-crypto').classList.add('active'); // 메뉴 활성화 추가
    
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (viewId === 'board-list') loadBoardList();
    if (viewId === 'study-list') loadStudyList();

    // 🔥 핵심 수정: 코인 메뉴 클릭 시 동작
    if (viewId === 'crypto') {
        const user = firebase.auth().currentUser;
        if (user) {
            // 로그인 상태면 이전 데이터 싹 지우고 이 계정의 코인만 새로 불러옴
            loadUserCoins(user.uid); 
        } else {
            alert("로그인이 필요한 서비스입니다.");
            navigate('login');
        }
    }
}

/* 타이핑 효과 */
const quotes = [
    "기본에 충실하며 성장을 멈추지 않는 프론트엔드 개발자입니다.",
    "문제 해결의 즐거움을 코드에 담아내는 김민준의 포트폴리오입니다.",
    "작은 디테일이 모여 큰 차이를 만든다고 믿습니다.",
    "복잡한 문제를 단순하고 명확한 코드로 풀어냅니다.",
    "불닭볶음면이 먹고싶습니다.",
    "까르보 보단 오리지널이 맛있습니다.",
    "불닭볶음면을 우유와 같이 먹으면 맵찔이입니다.",
    "저는 맵찔이니, 우유와 같이 먹겠습니다."
];

let quoteIndex = 0; let charIndex = 0; let isDeleting = false;

function typeEffect() {
    const textElement = document.getElementById("rotating-text");
    if (!textElement) return;

    const currentQuote = quotes[quoteIndex];
    if (isDeleting) charIndex--; else charIndex++;

    textElement.textContent = currentQuote.substring(0, charIndex);
    let delay = isDeleting ? 50 : 100;

    if (!isDeleting && charIndex === currentQuote.length) {
        delay = 2000; isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false; quoteIndex = (quoteIndex + 1) % quotes.length; delay = 500;
    }
    setTimeout(typeEffect, delay);
}

function getTodayStr() { 
    const t = new Date(); 
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; 
}
function escapeHTML(str) { 
    return str ? str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])) : ''; 
}

/* ==========================================
   🔥 핵심: 이미지 미리보기 & Base64 자동 압축
========================================== */

// 1. 파일 선택 시 화면에 미리보기 표시
function previewImage(inputElement, previewId) {
    const preview = document.getElementById(previewId);
    if (inputElement.files && inputElement.files[0]) {
        const file = inputElement.files[0];
        
        if (file.size > 5 * 1024 * 1024) {
            alert("파일 용량이 너무 큽니다! 5MB 이하의 이미지만 선택해주세요.");
            inputElement.value = '';
            preview.style.display = 'none';
            preview.src = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.src = '';
        preview.style.display = 'none';
    }
}

// 2. Storage를 안 쓰는 대신, 사진을 텍스트로 압축 변환하는 함수
function getCompressedBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // 데이터베이스 한도에 안 걸리게 가로/세로 800px로 사이즈 축소
                const MAX_SIZE = 800;
                if (width > height && width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                } else if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // 압축해서 긴 문자열로 변환 (화질 70%)
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
        };
        reader.onerror = error => reject(error);
    });
}

/* ==========================================
   게시판 (Board) 
========================================== */
let currentBoardPost = null; 
let isBoardEditing = false;

function openNewPost() {
    isBoardEditing = false;
    currentBoardPost = null;
    document.getElementById('post-title').value = '';
    document.getElementById('post-author').value = '';
    document.getElementById('post-content').value = '';
    
    const fileInput = document.getElementById('post-image-input');
    if (fileInput) fileInput.value = '';
    const preview = document.getElementById('post-image-preview');
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    
    navigate('board-write');
}

async function loadBoardList() {
    const tbody = document.getElementById('board-tbody');
    tbody.innerHTML = `<tr><td colspan="4" class="empty-row">데이터를 불러오는 중입니다...</td></tr>`;

    try {
        const snapshot = await db.collection('posts').orderBy('timestamp', 'desc').get();
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            return tbody.innerHTML = `<tr><td colspan="4" class="empty-row">작성된 게시글이 없습니다.</td></tr>`;
        }

        let index = snapshot.size;
        snapshot.forEach((doc) => {
            const post = { id: doc.id, ...doc.data() };
            const tr = document.createElement('tr'); 
            tr.onclick = () => viewPost(post);
            tr.innerHTML = `
                <td>${index--}</td>
                <td>${escapeHTML(post.title || '제목 없음')}</td>
                <td>${escapeHTML(post.author || '익명')}</td>
                <td>${post.date}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-row">오류 발생: ${error.message}</td></tr>`;
    }
}

async function savePost(e) {
    const title = document.getElementById('post-title').value.trim();
    const author = document.getElementById('post-author').value.trim() || '익명';
    const content = document.getElementById('post-content').value.trim();
    
    if (!title || !content) return alert('제목과 내용을 모두 입력해주세요.');

    const currentUser = auth.currentUser;
    const email = currentUser ? currentUser.email : null;

    const fileInput = document.getElementById('post-image-input');
    const file = fileInput.files[0];
    let imageUrl = currentBoardPost ? currentBoardPost.imageUrl : null;

    const saveBtn = e.target;
    const originalText = saveBtn.innerText;
    saveBtn.innerText = "업로드 및 저장 중...⏳";
    saveBtn.disabled = true;

    try {
        // 🔥 Storage에 안 올리고 텍스트로 압축 변환만 합니다!
        if (file) {
            imageUrl = await getCompressedBase64(file);
        }

        const postData = { 
            title, author, content, email, date: getTodayStr(), 
            timestamp: firebase.firestore.FieldValue.serverTimestamp() 
        };
        
        if (imageUrl) postData.imageUrl = imageUrl;

        if (isBoardEditing && currentBoardPost) {
            await db.collection('posts').doc(currentBoardPost.id).update(postData);
            alert("성공적으로 수정되었습니다!");
        } else {
            postData.likes = []; 
            await db.collection('posts').add(postData);
            alert("게시글이 성공적으로 등록되었습니다!");
        }
        openNewPost();
        navigate('board-list');
    } catch (error) {
        console.error(error);
        alert("게시글 저장 중 오류 발생: " + error.message);
    } finally {
        saveBtn.innerText = originalText;
        saveBtn.disabled = false;
    }
}

function viewPost(post) {
    currentBoardPost = post;
    document.getElementById('detail-title').innerText = post.title; 
    document.getElementById('detail-author').innerText = post.author; 
    document.getElementById('detail-date').innerText = post.date; 
    
    const parsedContent = (typeof marked.parse === 'function') ? marked.parse(post.content) : marked(post.content);
    
    let imageHtml = '';
    if (post.imageUrl) {
        imageHtml = `<img src="${post.imageUrl}" style="max-width: 100%; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><br>`;
    }
    document.getElementById('detail-content').innerHTML = imageHtml + parsedContent;
    
    updateLikeUI('posts', post.likes || []); 
    loadComments('posts', post.id); 

    const currentUser = auth.currentUser;
    const actionBtns = document.getElementById('board-action-buttons');
    if (currentUser && post.email && currentUser.email === post.email) {
        actionBtns.style.display = 'inline-flex';
    } else {
        actionBtns.style.display = 'none';
    }

    navigate('board-detail');
}

function goToEditPost() {
    if (!currentBoardPost) return;
    isBoardEditing = true;
    document.getElementById('post-title').value = currentBoardPost.title;
    document.getElementById('post-author').value = currentBoardPost.author;
    document.getElementById('post-content').value = currentBoardPost.content;
    
    const fileInput = document.getElementById('post-image-input');
    if (fileInput) fileInput.value = '';
    const preview = document.getElementById('post-image-preview');
    if (currentBoardPost.imageUrl) {
        preview.src = currentBoardPost.imageUrl;
        preview.style.display = 'block';
    } else {
        preview.src = '';
        preview.style.display = 'none';
    }
    
    navigate('board-write');
}

async function deletePost() {
    if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) { 
        try {
            await db.collection('posts').doc(currentBoardPost.id).delete();
            navigate('board-list'); 
        } catch (error) {
            alert("삭제 중 오류 발생: " + error.message);
        }
    }
}

/* ==========================================
   공부노트 (Study) 
========================================== */
let currentStudyPost = null;
let isStudyEditing = false;

function openNewStudy() {
    isStudyEditing = false;
    currentStudyPost = null;
    document.getElementById('study-title').value = '';
    document.getElementById('study-category').value = '';
    document.getElementById('study-author').value = '';
    document.getElementById('study-content').value = '';
    
    const fileInput = document.getElementById('study-image-input');
    if (fileInput) fileInput.value = '';
    const preview = document.getElementById('study-image-preview');
    if (preview) { preview.src = ''; preview.style.display = 'none'; }

    navigate('study-write');
}

async function loadStudyList() {
    const tbody = document.getElementById('study-tbody');
    tbody.innerHTML = `<tr><td colspan="4" class="empty-row">데이터를 불러오는 중입니다...</td></tr>`;

    try {
        const snapshot = await db.collection('study').orderBy('timestamp', 'desc').get();
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            return tbody.innerHTML = `<tr><td colspan="4" class="empty-row">기록된 공부노트가 없습니다.</td></tr>`;
        }

        let index = snapshot.size;
        snapshot.forEach((doc) => {
            const study = { id: doc.id, ...doc.data() };
            const tr = document.createElement('tr'); 
            tr.onclick = () => viewStudy(study);
            tr.innerHTML = `
                <td>${index--}</td>
                <td>${escapeHTML(study.title)}</td>
                <td><span class="category-badge">${escapeHTML(study.category || '미분류')}</span></td>
                <td>${study.date}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-row">오류 발생: ${error.message}</td></tr>`;
    }
}

async function saveStudy(e) {
    const title = document.getElementById('study-title').value.trim();
    const category = document.getElementById('study-category').value.trim() || '미분류';
    const author = document.getElementById('study-author').value.trim() || '익명';
    const content = document.getElementById('study-content').value;
    
    if (!title || !content) return alert('제목과 내용을 모두 입력해주세요.');

    const currentUser = auth.currentUser;
    const email = currentUser ? currentUser.email : null;

    const fileInput = document.getElementById('study-image-input');
    const file = fileInput.files[0];
    let imageUrl = currentStudyPost ? currentStudyPost.imageUrl : null;

    const saveBtn = e.target;
    const originalText = saveBtn.innerText;
    saveBtn.innerText = "업로드 및 저장 중...⏳";
    saveBtn.disabled = true;

    try {
        // 🔥 Storage에 안 올리고 텍스트로 압축 변환!
        if (file) {
            imageUrl = await getCompressedBase64(file);
        }

        const studyData = { 
            title, category, author, content, email, date: getTodayStr(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (imageUrl) studyData.imageUrl = imageUrl;

        if (isStudyEditing && currentStudyPost) {
            await db.collection('study').doc(currentStudyPost.id).update(studyData);
            alert("성공적으로 수정되었습니다!");
        } else {
            studyData.likes = []; 
            await db.collection('study').add(studyData);
            alert("공부노트가 성공적으로 기록되었습니다!");
        }
        openNewStudy();
        navigate('study-list');
    } catch (error) {
        console.error(error);
        alert("노트 저장 중 오류 발생: " + error.message);
    } finally {
        saveBtn.innerText = originalText;
        saveBtn.disabled = false;
    }
}

function viewStudy(study) {
    currentStudyPost = study;
    document.getElementById('study-detail-title').innerText = study.title; 
    document.getElementById('study-detail-category').innerText = study.category || '미분류'; 
    document.getElementById('study-detail-author').innerText = study.author; 
    document.getElementById('study-detail-date').innerText = study.date; 
    
    const parsedContent = (typeof marked.parse === 'function') ? marked.parse(study.content) : marked(study.content);
    
    let imageHtml = '';
    if (study.imageUrl) {
        imageHtml = `<img src="${study.imageUrl}" style="max-width: 100%; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><br>`;
    }
    document.getElementById('study-detail-content').innerHTML = imageHtml + parsedContent;
    
    updateLikeUI('study', study.likes || []); 
    loadComments('study', study.id); 

    const currentUser = auth.currentUser;
    const actionBtns = document.getElementById('study-action-buttons');
    if (currentUser && study.email && currentUser.email === study.email) {
        actionBtns.style.display = 'inline-flex';
    } else {
        actionBtns.style.display = 'none';
    }

    navigate('study-detail');
}

function goToEditStudy() {
    if (!currentStudyPost) return;
    isStudyEditing = true;
    document.getElementById('study-title').value = currentStudyPost.title;
    document.getElementById('study-category').value = currentStudyPost.category;
    document.getElementById('study-author').value = currentStudyPost.author;
    document.getElementById('study-content').value = currentStudyPost.content;
    
    const fileInput = document.getElementById('study-image-input');
    if (fileInput) fileInput.value = '';
    const preview = document.getElementById('study-image-preview');
    if (currentStudyPost.imageUrl) {
        preview.src = currentStudyPost.imageUrl;
        preview.style.display = 'block';
    } else {
        preview.src = '';
        preview.style.display = 'none';
    }

    navigate('study-write');
}

async function deleteStudy() {
    if (confirm('정말로 이 공부노트를 삭제하시겠습니까?')) { 
        try {
            await db.collection('study').doc(currentStudyPost.id).delete();
            navigate('study-list'); 
        } catch (error) {
            alert("삭제 중 오류 발생: " + error.message);
        }
    }
}

/* ==========================================
   인증 및 기타 (로그인, 회원가입, 좋아요, 댓글)
========================================== */
async function handleSignUp() {
    const email = document.getElementById('signup-email').value.trim(); 
    const password = document.getElementById('signup-pw').value;

    if (!email || !password) return alert("이메일과 비밀번호를 모두 입력해주세요.");
    if (password.length < 6) return alert("비밀번호는 6자리 이상이어야 합니다.");

    try {
        await auth.createUserWithEmailAndPassword(email, password);
        alert("회원가입 완료! 자동으로 로그인됩니다.");
        document.getElementById('signup-email').value = '';
        document.getElementById('signup-pw').value = '';
        navigate('main');
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') alert("이미 사용 중인 이메일입니다.");
        else alert("회원가입 실패: " + error.message);
    }
}

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim(); 
    const password = document.getElementById('login-pw').value;

    if (!email || !password) return alert("이메일과 비밀번호를 모두 입력해주세요.");

    try {
        await auth.signInWithEmailAndPassword(email, password);
        alert("로그인 성공!");
        document.getElementById('login-email').value = '';
        document.getElementById('login-pw').value = '';
        navigate('main');
    } catch (error) {
        alert("로그인 실패: 아이디나 비밀번호를 확인해주세요.");
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
        alert("로그아웃 되었습니다.");
        navigate('main');
    } catch (error) {
        alert("로그아웃 오류: " + error.message);
    }
}

async function handleGoogleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await auth.signInWithPopup(provider);
        alert(`${result.user.displayName || '사용자'}님, 환영합니다!`);
        navigate('main');
    } catch (error) {
        console.error("구글 로그인 에러:", error);
        alert("구글 로그인 실패: " + error.message);
    }
}

function checkUser() {
    auth.onAuthStateChanged((user) => {
        const authForm = document.getElementById('auth-form');
        const userInfo = document.getElementById('user-info');
        const userEmailSpan = document.getElementById('user-email');
        const navLogin = document.getElementById('nav-login');

        if (user) {
            if(authForm) authForm.style.display = 'none';
            if(userInfo) userInfo.style.display = 'block';
            if(userEmailSpan) userEmailSpan.innerText = user.email;
            if(navLogin) navLogin.innerText = "내 정보"; 
        } else {
            if(authForm) authForm.style.display = 'block';
            if(userInfo) userInfo.style.display = 'none';
            if(navLogin) navLogin.innerText = "로그인";
        }
    });
}

window.onload = () => {
    setTimeout(typeEffect, 500); 
    checkUser(); 
};

async function toggleLike(collection) {
    const user = auth.currentUser;
    if(!user) return alert("하트를 누르려면 로그인이 필요합니다.");
    
    const docId = collection === 'posts' ? currentBoardPost.id : currentStudyPost.id;
    const docRef = db.collection(collection).doc(docId);

    const doc = await docRef.get();
    let likes = doc.data().likes || [];
    
    if (likes.includes(user.email)) likes = likes.filter(e => e !== user.email);
    else likes.push(user.email);

    await docRef.update({ likes });
    
    if (collection === 'posts') currentBoardPost.likes = likes;
    if (collection === 'study') currentStudyPost.likes = likes;
    
    updateLikeUI(collection, likes);
}

function updateLikeUI(collection, likes) {
    const iconId = collection === 'posts' ? 'board-like-icon' : 'study-like-icon';
    const countId = collection === 'posts' ? 'board-like-count' : 'study-like-count';
    
    document.getElementById(countId).innerText = likes.length;
    if(auth.currentUser && likes.includes(auth.currentUser.email)) {
        document.getElementById(iconId).style.color = "#ef4444"; 
    } else {
        document.getElementById(iconId).style.color = "#d1d5db"; 
    }
}

let replyTargetId = null;
let commentsUnsubscribe = null;

async function loadComments(collection, docId) {
    const listId = collection === 'posts' ? 'board-comments-list' : 'study-comments-list';
    const listEl = document.getElementById(listId);
    
    if (commentsUnsubscribe) commentsUnsubscribe();
    listEl.innerHTML = "<p style='color:gray; font-size:0.9rem;'>댓글을 불러오는 중...</p>";
    
    commentsUnsubscribe = db.collection(collection).doc(docId).collection('comments').orderBy('timestamp', 'asc')
    .onSnapshot((snapshot) => {
        listEl.innerHTML = "";
        if(snapshot.empty) return listEl.innerHTML = "<p style='color:gray; font-size:0.9rem;'>작성된 댓글이 없습니다.</p>";

        const comments = [];
        snapshot.forEach(doc => comments.push({id: doc.id, ...doc.data()}));
        
        const parents = comments.filter(c => !c.parentId);
        const children = comments.filter(c => c.parentId);

        parents.forEach(parent => {
            listEl.appendChild(createCommentHTML(parent, collection, false));
            children.filter(child => child.parentId === parent.id).forEach(child => {
                listEl.appendChild(createCommentHTML(child, collection, true));
            });
        });
    });
}

function createCommentHTML(comment, collection, isReply) {
    const user = auth.currentUser;
    const div = document.createElement('div');
    
    div.style.padding = "1rem";
    div.style.borderBottom = "1px solid var(--border-color)";
    if (isReply) {
        div.style.marginLeft = "2.5rem";
        div.style.borderLeft = "3px solid var(--border-color)";
        div.style.backgroundColor = "var(--surface-hover)";
        div.style.borderRadius = "0 8px 8px 0";
        div.style.marginTop = "0.5rem";
    }
    
    const isOwner = user && user.email === comment.email;
    
    let dateStr = '방금 전';
    if (comment.timestamp && typeof comment.timestamp.toDate === 'function') {
        dateStr = comment.timestamp.toDate().toLocaleString();
    }
    
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:0.5rem;">
            <strong>${escapeHTML(comment.author)}</strong> <span style="color:var(--text-secondary);">${dateStr}</span>
        </div>
        <div id="comment-text-${comment.id}" style="margin-bottom:0.5rem; white-space:pre-wrap;">${escapeHTML(comment.text)}</div>
        <div style="display:flex; gap:10px; font-size:0.85rem;">
            ${!isReply ? `<button style="background:none;border:none;color:var(--text-secondary);cursor:pointer;" onclick="setReplyTarget('${comment.id}', '${escapeHTML(comment.author)}', '${collection}')">답글달기</button>` : ''}
            ${isOwner ? `<button style="background:none;border:none;color:var(--text-secondary);cursor:pointer;" onclick="editComment('${collection}', '${comment.id}')">수정</button>
                         <button style="background:none;border:none;color:var(--danger-color);cursor:pointer;" onclick="deleteComment('${collection}', '${comment.id}')">삭제</button>` : ''}
        </div>
    `;
    return div;
}

async function submitComment(collection) {
    const user = auth.currentUser;
    if(!user) return alert("로그인이 필요합니다.");
    
    const inputId = collection === 'posts' ? 'board-comment-input' : 'study-comment-input';
    const docId = collection === 'posts' ? currentBoardPost.id : currentStudyPost.id;
    const text = document.getElementById(inputId).value.trim();
    if(!text) return alert("내용을 입력해주세요.");

    await db.collection(collection).doc(docId).collection('comments').add({
        text: text, 
        author: user.displayName || user.email.split('@')[0], 
        email: user.email,
        parentId: replyTargetId, 
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    document.getElementById(inputId).value = "";
    replyTargetId = null;
    document.getElementById(inputId).placeholder = "댓글을 남겨보세요. (로그인 필요)";
}

async function editComment(collection, commentId) {
    const textEl = document.getElementById(`comment-text-${commentId}`);
    const originalText = textEl.innerText;
    const newText = prompt("댓글 수정:", originalText);
    
    if(newText !== null && newText.trim() !== "" && newText !== originalText) {
        const docId = collection === 'posts' ? currentBoardPost.id : currentStudyPost.id;
        await db.collection(collection).doc(docId).collection('comments').doc(commentId).update({ text: newText.trim() });
    }
}

async function deleteComment(collection, commentId) {
    if(!confirm("삭제하시겠습니까?")) return;
    const docId = collection === 'posts' ? currentBoardPost.id : currentStudyPost.id;
    await db.collection(collection).doc(docId).collection('comments').doc(commentId).delete();
}

function setReplyTarget(commentId, authorName, collection) {
    replyTargetId = commentId;
    const inputId = collection === 'posts' ? 'board-comment-input' : 'study-comment-input';
    const inputEl = document.getElementById(inputId);
    inputEl.placeholder = `@${authorName} 님에게 대댓글 작성 중...`;
    inputEl.focus();
}
/* ==========================================
   실시간 코인 대시보드 (최종 고도화 버전)
========================================== */
let subscribedMarkets = []; 
let currentChartedCoin = null; 
let detailedChart = null;
let upbitSocket = null;
let allUpbitCoins = []; 
// 🔥 그래프 데이터 유지를 위한 메모리 공간
let coinHistories = {}; 

// 1. 네비게이션 시 로그인 체크 및 데이터 불러오기
const originalNavigate = window.navigate;
window.navigate = function(viewId) {
    if (viewId === 'crypto') {
        const user = firebase.auth().currentUser;
        if (!user) {
            alert("로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.");
            originalNavigate('login');
            return;
        }
        // 로그인 상태라면 사용자 코인 목록 불러오기
        loadUserCoins(user.uid);
    }
    originalNavigate(viewId);
};

// 1. Firestore에서 사용자별 코인 목록 가져오기 (수정본)
// Firestore에서 사용자별 코인 목록 가져오기
async function loadUserCoins(uid) {
    try {
        // 🔥 가장 먼저 실행되어야 함: 이전 사용자의 카드와 차트를 싹 지움
        resetCryptoState(); 

        const snapshot = await db.collection('users').doc(uid).collection('myCoins').orderBy('addedAt', 'asc').get();
        
        // ... (이후 코드는 동일)
        
        if (snapshot.empty) {
            console.log("추가된 코인이 없습니다.");
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            renderCoinCard(data.marketCode, data.koreanName);
        });
        
        if (subscribedMarkets.length > 0) {
            connectUpbitWebSocket(subscribedMarkets);
            
            // 첫 번째 코인을 자동으로 차트에 띄워주기 (선택사항)
            const firstCoin = snapshot.docs[0].data();
            selectChartCoin(firstCoin.marketCode, firstCoin.koreanName);
        }
    } catch (error) {
        console.error("코인 목록 로드 실패:", error);
    }
}

// 🔥 모든 실시간 데이터와 UI를 초기화하는 함수
function resetCryptoState() {
    // 1. 메모리 변수 초기화
    subscribedMarkets = [];
    coinHistories = {};
    currentChartedCoin = null;

    // 2. 카드 목록 UI 초기화
    const container = document.getElementById('crypto-container');
    if (container) container.innerHTML = '';
    
    // 3. 차트 영역 숨기기 및 데이터 비우기
    const chartSection = document.getElementById('detailed-chart-section');
    if (chartSection) chartSection.style.display = 'none';

    if (detailedChart) {
        detailedChart.data.labels = [];
        detailedChart.data.datasets[0].data = [];
        detailedChart.update();
    }

    // 4. 이전 사용자의 웹소켓 연결 강제 종료
    if (upbitSocket) {
        upbitSocket.close();
        upbitSocket = null;
    }
}

// 로그아웃 함수 예시
function handleLogout() {
    firebase.auth().signOut().then(() => {
        resetCryptoState(); // 로그아웃 즉시 코인 데이터와 차트 삭제
        navigate('login');
    });
}

// 3. 차트 초기화 (변동성 완화 설정 추가)
function initDetailedChart() {
    const canvas = document.getElementById('mainDetailedChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    detailedChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: '가격', data: [], borderColor: '#3b82f6', borderWidth: 2, pointRadius: 0, fill: false }] },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            animation: false, 
            scales: { 
                x: { display: false }, 
                y: { 
                    display: true, 
                    position: 'right',
                    // 🔥 그래프가 너무 확대되지 않게 상하 여백(5%)을 줌
                    grace: '5%' 
                } 
            } 
        }
    });
}

// 4. 화면에 코인 카드 그리기 (삭제 버튼 포함)
function renderCoinCard(marketCode, koreanName) {
    if (document.getElementById(`card-${marketCode}`)) return;

    const container = document.getElementById('crypto-container');
    const cardHtml = `
        <div class="crypto-card" id="card-${marketCode}" onclick="selectChartCoin('${marketCode}', '${koreanName}')" style="cursor: pointer; border: 1px solid var(--border-color);">
            <button class="delete-btn" onclick="removeCoinCard(event, '${marketCode}')">×</button>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; padding-right: 20px;">
                <span style="font-weight: bold;">${koreanName}</span>
                <span style="color: gray; font-size: 0.8rem;">${marketCode.replace('KRW-', '')}</span>
            </div>
            <div id="price-${marketCode}" class="crypto-price">- 원</div>
            <div id="change-${marketCode}" class="crypto-change">- (-%)</div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', cardHtml);
    subscribedMarkets.push(marketCode);
    
    // 이 코인의 데이터 기록 저장소 만들기
    if (!coinHistories[marketCode]) {
        coinHistories[marketCode] = { labels: [], data: [] };
    }
}

// 5. 코인 추가 (Firestore 저장)
async function addCoinCard(marketCode, koreanName) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    if (subscribedMarkets.includes(marketCode)) {
        alert('이미 추가된 종목입니다.');
        return;
    }

    try {
        await db.collection('users').doc(user.uid).collection('myCoins').doc(marketCode).set({
            marketCode, koreanName, addedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        renderCoinCard(marketCode, koreanName);
        connectUpbitWebSocket(subscribedMarkets);
        selectChartCoin(marketCode, koreanName);
    } catch (e) {
        console.error("추가 실패:", e);
    }
}

// 6. 코인 삭제 (Firestore 삭제)
async function removeCoinCard(event, marketCode) {
    event.stopPropagation(); // 카드 클릭 이벤트가 발생하는 것을 방지
    if (!confirm("해당 코인을 목록에서 삭제할까요?")) return;

    const user = firebase.auth().currentUser;
    try {
        await db.collection('users').doc(user.uid).collection('myCoins').doc(marketCode).delete();
        document.getElementById(`card-${marketCode}`).remove();
        subscribedMarkets = subscribedMarkets.filter(m => m !== marketCode);
        delete coinHistories[marketCode];
        
        if (currentChartedCoin === marketCode) {
            document.getElementById('detailed-chart-section').style.display = 'none';
            currentChartedCoin = null;
        }
        connectUpbitWebSocket(subscribedMarkets);
    } catch (e) {
        console.error("삭제 실패:", e);
    }
}

// 7. 차트 변경 (데이터 유지 로직 추가)
function selectChartCoin(marketCode, koreanName) {
    document.getElementById('detailed-chart-section').style.display = 'block';
    if (!detailedChart) initDetailedChart();

    document.getElementById('chart-coin-name').innerText = `${koreanName} (${marketCode.replace('KRW-', '')})`;
    currentChartedCoin = marketCode;

    // 🔥 이전 기록이 있다면 차트에 복원
    const history = coinHistories[marketCode];
    detailedChart.data.labels = history ? [...history.labels] : [];
    detailedChart.data.datasets[0].data = history ? [...history.data] : [];
    detailedChart.update('none');

    document.querySelectorAll('.crypto-card').forEach(c => c.style.borderColor = 'var(--border-color)');
    document.getElementById(`card-${marketCode}`).style.borderColor = '#3b82f6';
}

// 8. 데이터 업데이트 (기록 저장)
function updateCryptoUI(data) {
    const code = data.code;
    const history = coinHistories[code];
    
    // 모든 구독 코인의 실시간 데이터를 메모리에 기록 (그래프 유지용)
    if (history) {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        history.labels.push(timeStr);
        history.data.push(data.trade_price);
        if (history.labels.length > 50) { // 최대 50개 유지
            history.labels.shift();
            history.data.shift();
        }
    }

    // 카드 UI 업데이트
    const priceEl = document.getElementById(`price-${code}`);
    if (priceEl) {
        priceEl.innerText = `${data.trade_price.toLocaleString()} 원`;
        const color = data.change === "RISE" ? 'color-up' : data.change === "FALL" ? 'color-down' : 'color-even';
        priceEl.className = `crypto-price ${color}`;
    }

    // 현재 보고 있는 차트 업데이트
    if (code === currentChartedCoin && detailedChart) {
        detailedChart.data.labels = [...history.labels];
        detailedChart.data.datasets[0].data = [...history.data];
        
        const chartPriceEl = document.getElementById('chart-coin-price');
        if(chartPriceEl) {
            chartPriceEl.innerText = `${data.trade_price.toLocaleString()} 원`;
            chartPriceEl.className = `crypto-price ${data.change === "RISE" ? 'color-up' : 'color-even'}`;
        }
        detailedChart.update('none');
    }
}

// 웹소켓 연결 (기존 함수 재사용)
function connectUpbitWebSocket(markets_array) {
    if (upbitSocket) upbitSocket.close();
    if (markets_array.length === 0) return;
    upbitSocket = new WebSocket("wss://api.upbit.com/websocket/v1");
    upbitSocket.binaryType = 'blob';
    upbitSocket.onopen = () => {
        upbitSocket.send(JSON.stringify([{ "ticket": "test" }, { "type": "ticker", "codes": markets_array }]));
    };
    upbitSocket.onmessage = (event) => {
        const reader = new FileReader();
        reader.onload = () => updateCryptoUI(JSON.parse(reader.result));
        reader.readAsText(event.data);
    };
}

// 초기 코인 목록 로드 (검색용)
fetch('https://api.upbit.com/v1/market/all').then(res => res.json()).then(data => {
    allUpbitCoins = data.filter(c => c.market.startsWith('KRW-'));
});

// ==========================================
// 9. 코인 검색 및 자동완성 기능 (빠진 부분 추가)
// ==========================================
function handleSearchInput() {
    const query = document.getElementById('coin-search').value.toLowerCase().trim();
    const resultsEl = document.getElementById('search-results');
    
    // 검색어가 없으면 드롭다운 숨기기
    if (query.length === 0) { 
        resultsEl.style.display = 'none'; 
        return; 
    }

    // 한글 이름이나 영문 심볼(BTC, ETH 등)로 검색 (최대 10개)
    const filtered = allUpbitCoins.filter(coin => 
        coin.korean_name.includes(query) || coin.market.toLowerCase().includes(query)
    ).slice(0, 10);

    resultsEl.innerHTML = ''; 
    if (filtered.length > 0) {
        filtered.forEach(coin => {
            const li = document.createElement('li');
            li.style.padding = "12px 15px";
            li.style.cursor = "pointer";
            li.style.borderBottom = "1px solid var(--border-color)";
            li.style.display = "flex";
            li.style.justifyContent = "space-between";
            li.style.alignItems = "center";
            li.innerHTML = `<span><strong>${coin.korean_name}</strong> <span style="color:gray; font-size:0.85rem; margin-left:5px;">${coin.market.replace('KRW-', '')}</span></span> <span style="background:#3b82f6; color:white; padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:bold;">추가</span>`;
            
            // 마우스 오버 효과
            li.onmouseover = () => li.style.background = 'var(--surface-hover)';
            li.onmouseout = () => li.style.background = 'transparent';

            // 검색 결과 클릭 시 코인 추가 (Firestore 저장)
            li.onclick = () => addCoinCard(coin.market, coin.korean_name);
            resultsEl.appendChild(li);
        });
        resultsEl.style.display = 'block';
    } else {
        resultsEl.innerHTML = '<li style="padding:15px; text-align:center; color:gray;">검색 결과가 없습니다.</li>';
        resultsEl.style.display = 'block';
    }
}

// 화면의 빈 공간(검색창 밖)을 클릭하면 검색창 드롭다운 닫기
document.addEventListener('click', (e) => {
    const searchSection = document.querySelector('.search-section');
    const resultsEl = document.getElementById('search-results');
    if (searchSection && resultsEl && !searchSection.contains(e.target)) {
        resultsEl.style.display = 'none';
    }
});