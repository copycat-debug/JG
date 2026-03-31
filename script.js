const SUPABASE_URL = 'https://vvwycqnhklqzdrpssdcb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_IACFRj-qlNFT5d3vPYfzaQ_teOgcI6X';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 페이지 로드 시 실행 (게시글 불러오기 + 타이핑 효과)
document.addEventListener('DOMContentLoaded', () => {
    loadPosts(); 
    setTimeout(typeEffect, 500);
});

// [DB] 게시글 불러오기 함수
async function loadPosts() {
    const { data, error } = await _supabase
        .from('posts')
        .select('*')
        .order('id', { ascending: false });

    if (data) {
        const postList = document.getElementById('postList');
        postList.innerHTML = ''; 
        data.forEach(post => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${post.content}</span><button class="delete-btn" onclick="deletePost(${post.id})">삭제</button>`;
            postList.appendChild(li);
        });
    }
}

// [DB] 게시글 추가 기능
async function addPost() {
    const input = document.getElementById('postInput');
    const text = input.value.trim();

    if (text === '') {
        alert('내용을 입력해주세요.');
        return;
    }

    // DB에 저장 명령!
    const { error } = await _supabase
        .from('posts')
        .insert([{ content: text }]);

    if (error) {
        console.error('저장 실패:', error);
    } else {
        input.value = '';
        loadPosts(); // 저장 후 다시 불러오기
    }
}

// [DB] 게시글 삭제 기능
async function deletePost(id) {
    const { error } = await _supabase
        .from('posts')
        .delete()
        .eq('id', id);

    if (!error) loadPosts();
}

// --- 기존 부가 기능들 ---

function toggleMode() {
    const body = document.body;
    const btn = document.getElementById("night_day");
    body.classList.toggle("dark");
    btn.value = body.classList.contains("dark") ? "⬜" : "⬛";
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
}

function handleKeyPress(event) {
    if (event.key === 'Enter') addPost();
}

// --- 타이핑 효과 기능 ---
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

let quoteIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
    const textElement = document.getElementById("rotating-text");
    if (!textElement) return;

    const currentQuote = quotes[quoteIndex];
    
    // 글자를 더하거나 지우는 인덱스 로직 개선
    if (isDeleting) {
        charIndex--;
    } else {
        charIndex++;
    }

    textElement.textContent = currentQuote.substring(0, charIndex);

    let delay = isDeleting ? 50 : 100;

    // 문구를 끝까지 다 쳤을 때
    if (!isDeleting && charIndex === currentQuote.length) {
        delay = 2000; // 2초 대기 후 지우기 시작
        isDeleting = true;
    } 
    // 다 지웠을 때
    else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        quoteIndex = (quoteIndex + 1) % quotes.length; // 다음 문구로 이동
        delay = 500; // 0.5초 대기 후 다시 타이핑 시작
    }

    setTimeout(typeEffect, delay);
}