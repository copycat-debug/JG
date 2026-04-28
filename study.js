import { requireAuth } from "./auth.js";

let currentStudyPost = null;
let isStudyEditing = false;

export function openNewStudy() {
  if (!requireAuth()) return;

  isStudyEditing = false;
  currentStudyPost = null;

  resetStudyForm();
  setStudySaveButtonText("저장");

  window.navigate("study-write");
}

export async function loadStudyList() {
  const tbody = document.getElementById("study-tbody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="4" class="empty-row">데이터를 불러오는 중입니다...</td>
    </tr>
  `;

  try {
    const snapshot = await window.db
      .collection("study")
      .orderBy("timestamp", "desc")
      .get();

    tbody.innerHTML = "";

    if (snapshot.empty) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-row">기록된 공부노트가 없습니다.</td>
        </tr>
      `;
      return;
    }

    let index = snapshot.size;

    snapshot.forEach((doc) => {
      const study = {
        id: doc.id,
        ...doc.data(),
      };

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${index--}</td>
        <td>${escapeHTML(study.title || "제목 없음")}</td>
        <td>
          <span class="category-badge">
            ${escapeHTML(study.category || "미분류")}
          </span>
        </td>
        <td>${escapeHTML(study.date || "-")}</td>
      `;

      tr.addEventListener("click", () => viewStudy(study));
      tbody.appendChild(tr);
    });
  } catch (error) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-row">오류 발생: ${escapeHTML(error.message)}</td>
      </tr>
    `;
  }
}

export async function saveStudy() {
  if (!requireAuth()) return;

  const title = document.getElementById("study-title").value.trim();
  const category =
    document.getElementById("study-category").value.trim() || "미분류";
  const author =
    document.getElementById("study-author").value.trim() ||
    window.auth.currentUser.email ||
    "익명";
  const content = document.getElementById("study-content").value.trim();
  const imageInput = document.getElementById("study-image");
  const imageFile = imageInput?.files?.[0] || null;

  if (imageFile && !validateImageFile(imageFile)) {
    return;
  }

  if (!title || !content) {
    alert("제목과 내용을 모두 입력해주세요.");
    return;
  }

  const saveBtn = document.getElementById("study-save-btn");
  setLoading(saveBtn, true, imageFile ? "이미지 압축 중..." : "저장 중...");

  try {
    const uploadedImage = imageFile ? await uploadImageFile(imageFile, "study") : null;
    const imageData = uploadedImage
      ? {
          imageUrl: uploadedImage.url,
          imagePath: uploadedImage.path,
        }
      : {};

    if (isStudyEditing && currentStudyPost) {
      if (!isOwner(currentStudyPost)) {
        alert("작성자만 수정할 수 있습니다.");
        return;
      }

      const previousImagePath = currentStudyPost.imagePath;

      await window.db.collection("study").doc(currentStudyPost.id).update({
        title,
        category,
        author,
        content,
        ...imageData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      if (uploadedImage && previousImagePath) {
        await deleteStoredImage(previousImagePath);
      }

      alert("성공적으로 수정되었습니다!");
    } else {
      await window.db.collection("study").add({
        title,
        category,
        author,
        content,
        ...imageData,
        date: getTodayStr(),
        uid: window.auth.currentUser.uid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });

      alert("공부노트가 성공적으로 기록되었습니다!");
    }

    isStudyEditing = false;
    currentStudyPost = null;
    resetStudyForm();

    window.navigate("study-list");
  } catch (error) {
    alert("노트 저장 중 오류 발생: " + error.message);
  } finally {
    setLoading(saveBtn, false, isStudyEditing ? "수정 완료" : "저장");
  }
}

function viewStudy(study) {
  currentStudyPost = study;

  document.getElementById("study-detail-title").innerText =
    study.title || "제목 없음";
  document.getElementById("study-detail-category").innerText =
    study.category || "미분류";
  document.getElementById("study-detail-author").innerText =
    study.author || "익명";
  document.getElementById("study-detail-date").innerText = study.date || "-";

  const rawMarkdown = study.content || "";
  const parsedContent =
    typeof marked.parse === "function"
      ? marked.parse(rawMarkdown)
      : marked(rawMarkdown);
  
  document.getElementById("study-detail-content").innerHTML = parsedContent;
  renderDetailImage("study-detail-image-wrap", "study-detail-image", study.imageUrl);

  if (typeof hljs !== "undefined") {
    document.querySelectorAll("#study-detail-content pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  }

  updateStudyOwnerButtons();
  loadStudyLikeState();
  loadStudyComments();

  window.navigate("study-detail");
}

export function goToEditStudy() {
  if (!requireAuth()) return;

  if (!currentStudyPost) {
    alert("수정할 공부노트를 찾을 수 없습니다.");
    return;
  }

  if (!isOwner(currentStudyPost)) {
    alert("작성자만 수정할 수 있습니다.");
    return;
  }

  isStudyEditing = true;

  document.getElementById("study-title").value = currentStudyPost.title || "";
  document.getElementById("study-category").value =
    currentStudyPost.category || "";
  document.getElementById("study-author").value =
    currentStudyPost.author || "";
  document.getElementById("study-content").value =
    currentStudyPost.content || "";
  const imageInput = document.getElementById("study-image");
  if (imageInput) imageInput.value = "";
  renderImagePreview("study-image-preview", currentStudyPost.imageUrl, "현재 등록된 이미지");

  setStudySaveButtonText("수정 완료");

  window.navigate("study-write");
}

export async function deleteStudy() {
  if (!requireAuth()) return;

  if (!currentStudyPost) {
    alert("삭제할 공부노트를 찾을 수 없습니다.");
    return;
  }

  if (!isOwner(currentStudyPost)) {
    alert("작성자만 삭제할 수 있습니다.");
    return;
  }

  const ok = confirm("정말로 이 공부노트를 삭제하시겠습니까?");
  if (!ok) return;

  try {
    await deleteStoredImage(currentStudyPost.imagePath);
    await window.db.collection("study").doc(currentStudyPost.id).delete();

    currentStudyPost = null;
    isStudyEditing = false;

    alert("공부노트가 삭제되었습니다.");
    window.navigate("study-list");
  } catch (error) {
    alert("삭제 중 오류 발생: " + error.message);
  }
}

export async function toggleStudyLike() {
  if (!requireAuth()) return;

  if (!currentStudyPost) {
    alert("공부노트 정보를 찾을 수 없습니다.");
    return;
  }

  const likeBtn = document.getElementById("study-like-btn");
  if (likeBtn) likeBtn.disabled = true;

  const uid = window.auth.currentUser.uid;

  const likeRef = window.db
    .collection("study")
    .doc(currentStudyPost.id)
    .collection("likes")
    .doc(uid);

  try {
    const likeDoc = await likeRef.get();

    if (likeDoc.exists) {
      await likeRef.delete();
    } else {
      await likeRef.set({
        uid,
        userEmail: window.auth.currentUser.email || "",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }

    await loadStudyLikeState();
  } catch (error) {
    alert("좋아요 처리 중 오류 발생: " + error.message);
  } finally {
    if (likeBtn) likeBtn.disabled = false;
  }
}

export async function addStudyComment() {
  if (!requireAuth()) return;

  if (!currentStudyPost) {
    alert("공부노트 정보를 찾을 수 없습니다.");
    return;
  }

  const input = document.getElementById("study-comment-input");
  const content = input.value.trim();

  if (!content) {
    alert("댓글 내용을 입력해주세요.");
    return;
  }

  const submitBtn = input
    .closest(".comment-write")
    ?.querySelector("button");
  setLoading(submitBtn, true, "작성 중...");

  try {
    const commentData = {
      content,
      uid: window.auth.currentUser.uid,
      author: window.auth.currentUser.email || "익명",
      date: getTodayStr(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await getStudyCommentsRef().add(commentData);

    input.value = "";
    await prependStudyComment({ id: docRef.id, ...commentData });
  } catch (error) {
    alert("댓글 작성 중 오류 발생: " + error.message);
  } finally {
    setLoading(submitBtn, false, "댓글 작성");
  }
}

async function loadStudyLikeState() {
  const likeBtn = document.getElementById("study-like-btn");
  const likeCount = document.getElementById("study-like-count");

  if (!currentStudyPost || !likeBtn || !likeCount) return;

  try {
    const likesRef = window.db
      .collection("study")
      .doc(currentStudyPost.id)
      .collection("likes");

    const likesSnapshot = await likesRef.get();
    likeCount.innerText = likesSnapshot.size;

    const user = window.auth.currentUser;

    if (!user) {
      renderLikeButton(likeBtn, false);
      return;
    }

    const myLike = await likesRef.doc(user.uid).get();
    renderLikeButton(likeBtn, myLike.exists);
  } catch (error) {
    console.error("좋아요 로딩 오류:", error);
  }
}

async function loadStudyComments() {
  const list = document.getElementById("study-comment-list");
  if (!list || !currentStudyPost) return;

  list.innerHTML = `<p class="empty-comment">댓글을 불러오는 중입니다...</p>`;

  try {
    const snapshot = await getStudyCommentsRef()
      .orderBy("timestamp", "desc")
      .get();

    list.innerHTML = "";

    if (snapshot.empty) {
      list.innerHTML = `<p class="empty-comment">아직 댓글이 없습니다.</p>`;
      return;
    }

    for (const doc of snapshot.docs) {
      const comment = {
        id: doc.id,
        ...doc.data(),
      };

      const item = await createStudyCommentElement(comment);
      list.appendChild(item);
    }
  } catch (error) {
    list.innerHTML = `<p class="empty-comment">댓글 로딩 오류: ${escapeHTML(error.message)}</p>`;
  }
}

async function createStudyCommentElement(comment) {
  const item = document.createElement("div");
  item.className = "comment-item";
  item.dataset.commentId = comment.id;

  const top = document.createElement("div");
  top.className = "comment-top";

  const info = document.createElement("span");
  info.className = "comment-info";
  info.textContent = `${comment.author || "익명"} · ${comment.date || "-"}${
    comment.updatedAt ? " · 수정됨" : ""
  }`;

  top.appendChild(info);

  const actions = document.createElement("div");
  actions.className = "comment-actions";

  if (isCommentOwner(comment)) {
    const editBtn = createTextButton("수정", "comment-action-btn", () => {
      openStudyCommentEditor(item);
    });
    const deleteBtn = createTextButton("삭제", "comment-action-btn danger", () => {
      deleteStudyComment(comment.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
  }

  top.appendChild(actions);

  const content = document.createElement("p");
  content.className = "comment-content";
  content.textContent = comment.content || "";

  const editForm = createStudyEditForm(comment.content || "", async (nextContent, saveBtn) => {
    await updateStudyComment(comment.id, nextContent, saveBtn);
  });

  const reactionBar = await createStudyCommentReactionBar(comment.id);

  const replyActions = document.createElement("div");
  replyActions.className = "reply-actions";

  const replyForm = createStudyReplyForm(comment.id);
  replyForm.classList.add("hidden");

  const replyToggleBtn = createTextButton("답글", "comment-action-btn", () => {
    replyForm.classList.toggle("hidden");
    if (!replyForm.classList.contains("hidden")) {
      replyForm.querySelector("textarea")?.focus();
    }
  });
  replyActions.appendChild(replyToggleBtn);

  const replies = document.createElement("div");
  replies.className = "reply-list";
  await loadStudyReplies(comment.id, replies);

  item.appendChild(top);
  item.appendChild(content);
  item.appendChild(editForm);
  item.appendChild(reactionBar);
  item.appendChild(replyActions);
  item.appendChild(replyForm);
  item.appendChild(replies);

  return item;
}

function createStudyEditForm(initialContent, onSave) {
  const form = document.createElement("div");
  form.className = "comment-edit-form hidden";

  const textarea = document.createElement("textarea");
  textarea.className = "form-control";
  textarea.value = initialContent;

  const actions = document.createElement("div");
  actions.className = "comment-inline-actions";

  const cancelBtn = createTextButton("취소", "comment-action-btn", () => {
    closeStudyCommentEditor(form.closest(".comment-item, .reply-item"));
  });

  const saveBtn = createTextButton("저장", "comment-action-btn primary", async () => {
    const nextContent = textarea.value.trim();

    if (!nextContent) {
      alert("내용을 입력해주세요.");
      return;
    }

    await onSave(nextContent, saveBtn);
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);
  form.appendChild(textarea);
  form.appendChild(actions);

  return form;
}

function openStudyCommentEditor(item) {
  if (!item) return;

  const content = item.querySelector(":scope > .comment-content");
  const form = item.querySelector(":scope > .comment-edit-form");

  if (content) content.style.display = "none";
  if (form) {
    form.classList.remove("hidden");
    form.querySelector("textarea")?.focus();
  }
}

function closeStudyCommentEditor(item) {
  if (!item) return;

  const content = item.querySelector(":scope > .comment-content");
  const form = item.querySelector(":scope > .comment-edit-form");

  if (content) content.style.display = "";
  if (form) form.classList.add("hidden");
}

async function updateStudyComment(commentId, content, saveBtn) {
  if (!requireAuth()) return;

  try {
    setLoading(saveBtn, true, "저장 중...");

    await getStudyCommentsRef().doc(commentId).update({
      content,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    const item = saveBtn?.closest(".comment-item");
    updateEditedCommentElement(item, content);
  } catch (error) {
    alert("댓글 수정 중 오류 발생: " + error.message);
  } finally {
    setLoading(saveBtn, false, "저장");
  }
}

async function deleteStudyComment(commentId) {
  if (!requireAuth()) return;

  const ok = confirm("댓글을 삭제하시겠습니까? 대댓글도 함께 삭제됩니다.");
  if (!ok) return;

  try {
    const commentRef = getStudyCommentsRef().doc(commentId);

    await deleteStudyReactions(commentRef.collection("reactions"));

    const repliesSnapshot = await commentRef.collection("replies").get();
    for (const replyDoc of repliesSnapshot.docs) {
      await deleteStudyReactions(replyDoc.ref.collection("reactions"));
      await replyDoc.ref.delete();
    }

    await commentRef.delete();
    document.querySelector(`.comment-item[data-comment-id="${commentId}"]`)?.remove();
    renderEmptyStudyCommentsIfNeeded();
  } catch (error) {
    alert("댓글 삭제 중 오류 발생: " + error.message);
  }
}

function createStudyReplyForm(commentId) {
  const form = document.createElement("div");
  form.className = "reply-write";

  const textarea = document.createElement("textarea");
  textarea.className = "form-control";
  textarea.placeholder = "답글을 입력하세요";

  const actions = document.createElement("div");
  actions.className = "comment-inline-actions";

  const cancelBtn = createTextButton("취소", "comment-action-btn", () => {
    textarea.value = "";
    form.classList.add("hidden");
  });

  const submitBtn = createTextButton("답글 작성", "comment-action-btn primary", async () => {
    await addStudyReply(commentId, textarea, submitBtn);
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(submitBtn);
  form.appendChild(textarea);
  form.appendChild(actions);

  return form;
}

async function addStudyReply(commentId, textarea, submitBtn) {
  if (!requireAuth()) return;

  if (!currentStudyPost) {
    alert("공부노트 정보를 찾을 수 없습니다.");
    return;
  }

  const content = textarea.value.trim();

  if (!content) {
    alert("답글 내용을 입력해주세요.");
    return;
  }

  try {
    setLoading(submitBtn, true, "작성 중...");

    const replyData = {
      content,
      uid: window.auth.currentUser.uid,
      author: window.auth.currentUser.email || "익명",
      date: getTodayStr(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await getStudyRepliesRef(commentId).add(replyData);
    const replyItem = await createStudyReplyElement(commentId, {
      id: docRef.id,
      ...replyData,
    });

    textarea.value = "";
    textarea.closest(".reply-write")?.classList.add("hidden");

    const commentItem = document.querySelector(`.comment-item[data-comment-id="${commentId}"]`);
    const repliesWrap = commentItem?.querySelector(":scope > .reply-list");
    if (repliesWrap) {
      repliesWrap.appendChild(replyItem);
    } else {
      await loadStudyComments();
    }
  } catch (error) {
    alert("답글 작성 중 오류 발생: " + error.message);
  } finally {
    setLoading(submitBtn, false, "답글 작성");
  }
}

async function loadStudyReplies(commentId, repliesWrap) {
  try {
    const snapshot = await getStudyRepliesRef(commentId)
      .orderBy("timestamp", "asc")
      .get();

    repliesWrap.innerHTML = "";

    if (snapshot.empty) return;

    for (const doc of snapshot.docs) {
      const reply = {
        id: doc.id,
        ...doc.data(),
      };

      const replyItem = await createStudyReplyElement(commentId, reply);
      repliesWrap.appendChild(replyItem);
    }
  } catch (error) {
    repliesWrap.innerHTML = `<p class="empty-comment">답글 로딩 오류: ${escapeHTML(error.message)}</p>`;
  }
}

async function createStudyReplyElement(commentId, reply) {
  const item = document.createElement("div");
  item.className = "reply-item";
  item.dataset.commentId = commentId;
  item.dataset.replyId = reply.id;

  const top = document.createElement("div");
  top.className = "comment-top";

  const info = document.createElement("span");
  info.className = "comment-info";
  info.textContent = `${reply.author || "익명"} · ${reply.date || "-"}${
    reply.updatedAt ? " · 수정됨" : ""
  }`;

  top.appendChild(info);

  const actions = document.createElement("div");
  actions.className = "comment-actions";

  if (isCommentOwner(reply)) {
    const editBtn = createTextButton("수정", "comment-action-btn", () => {
      openStudyCommentEditor(item);
    });
    const deleteBtn = createTextButton("삭제", "comment-action-btn danger", () => {
      deleteStudyReply(commentId, reply.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
  }

  top.appendChild(actions);

  const content = document.createElement("p");
  content.className = "comment-content";
  content.textContent = reply.content || "";

  const editForm = createStudyEditForm(reply.content || "", async (nextContent, saveBtn) => {
    await updateStudyReply(commentId, reply.id, nextContent, saveBtn);
  });

  const reactionBar = await createStudyCommentReactionBar(commentId, reply.id);

  item.appendChild(top);
  item.appendChild(content);
  item.appendChild(editForm);
  item.appendChild(reactionBar);

  return item;
}

async function updateStudyReply(commentId, replyId, content, saveBtn) {
  if (!requireAuth()) return;

  try {
    setLoading(saveBtn, true, "저장 중...");

    await getStudyRepliesRef(commentId).doc(replyId).update({
      content,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    const item = saveBtn?.closest(".reply-item");
    updateEditedCommentElement(item, content);
  } catch (error) {
    alert("답글 수정 중 오류 발생: " + error.message);
  } finally {
    setLoading(saveBtn, false, "저장");
  }
}

async function deleteStudyReply(commentId, replyId) {
  if (!requireAuth()) return;

  const ok = confirm("답글을 삭제하시겠습니까?");
  if (!ok) return;

  try {
    const replyRef = getStudyRepliesRef(commentId).doc(replyId);
    await deleteStudyReactions(replyRef.collection("reactions"));
    await replyRef.delete();
    document.querySelector(`.reply-item[data-comment-id="${commentId}"][data-reply-id="${replyId}"]`)?.remove();
  } catch (error) {
    alert("답글 삭제 중 오류 발생: " + error.message);
  }
}

async function createStudyCommentReactionBar(commentId, replyId = null) {
  const bar = document.createElement("div");
  bar.className = "comment-reaction-bar";

  const reactionsRef = getStudyReactionRef(commentId, replyId);
  const snapshot = await reactionsRef.get();
  const user = window.auth.currentUser;
  let likeCount = 0;
  let dislikeCount = 0;
  let myReaction = null;

  snapshot.forEach((doc) => {
    const type = doc.data().type;

    if (type === "like") likeCount++;
    if (type === "dislike") dislikeCount++;
    if (user && doc.id === user.uid) myReaction = type;
  });

  bar.dataset.commentId = commentId;
  if (replyId) bar.dataset.replyId = replyId;

  const likeBtn = createReactionButton("👍", "like", likeCount, myReaction === "like", () => {
    toggleStudyCommentReaction(commentId, "like", replyId, bar);
  });

  const dislikeBtn = createReactionButton("👎", "dislike", dislikeCount, myReaction === "dislike", () => {
    toggleStudyCommentReaction(commentId, "dislike", replyId, bar);
  });

  bar.appendChild(likeBtn);
  bar.appendChild(dislikeBtn);

  return bar;
}

function createReactionButton(label, type, count, isActive, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `comment-reaction-btn${isActive ? " active" : ""}`;
  button.dataset.reactionType = type;
  button.dataset.label = label;
  button.dataset.count = String(count);
  button.textContent = `${label} ${count}`;
  button.setAttribute("aria-pressed", String(isActive));
  button.addEventListener("click", onClick);

  return button;
}

async function toggleStudyCommentReaction(commentId, type, replyId = null, reactionBar = null) {
  if (!requireAuth()) return;

  const uid = window.auth.currentUser.uid;
  const reactionRef = getStudyReactionRef(commentId, replyId).doc(uid);
  const bar = reactionBar || getReactionBarElement(commentId, replyId);
  const previousType = getActiveReactionType(bar);
  const nextType = previousType === type ? null : type;

  // 화면은 즉시 바꾸고, 실패하면 이전 상태로 되돌립니다.
  if (bar) applyReactionBarState(bar, nextType, previousType);

  try {
    if (nextType) {
      await reactionRef.set({
        type: nextType,
        uid,
        userEmail: window.auth.currentUser.email || "",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await reactionRef.delete();
    }
  } catch (error) {
    if (bar) applyReactionBarState(bar, previousType, nextType);
    alert("댓글 반응 처리 중 오류 발생: " + error.message);
  }
}



async function prependStudyComment(comment) {
  const list = document.getElementById("study-comment-list");

  if (!list) {
    await loadStudyComments();
    return;
  }

  const empty = list.querySelector(".empty-comment");
  if (empty) list.innerHTML = "";

  const item = await createStudyCommentElement(comment);
  list.prepend(item);
}

function updateEditedCommentElement(item, content) {
  if (!item) return;

  const contentEl = item.querySelector(":scope > .comment-content");
  const infoEl = item.querySelector(":scope > .comment-top .comment-info");

  if (contentEl) {
    contentEl.textContent = content;
    contentEl.style.display = "";
  }

  if (infoEl && !infoEl.textContent.includes("수정됨")) {
    infoEl.textContent += " · 수정됨";
  }

  closeStudyCommentEditor(item);
}

function renderEmptyStudyCommentsIfNeeded() {
  const list = document.getElementById("study-comment-list");
  if (list && !list.querySelector(".comment-item")) {
    list.innerHTML = `<p class="empty-comment">아직 댓글이 없습니다.</p>`;
  }
}

function getReactionBarElement(commentId, replyId = null) {
  const replySelector = replyId ? `[data-reply-id="${replyId}"]` : ":not([data-reply-id])";
  return document.querySelector(
    `.comment-reaction-bar[data-comment-id="${commentId}"]${replySelector}`
  );
}

function getActiveReactionType(bar) {
  if (!bar) return null;

  const activeButton = bar.querySelector(".comment-reaction-btn.active");
  return activeButton?.dataset.reactionType || null;
}

function applyReactionBarState(bar, nextType, previousType) {
  if (!bar || nextType === previousType) return;

  const likeBtn = bar.querySelector('.comment-reaction-btn[data-reaction-type="like"]');
  const dislikeBtn = bar.querySelector('.comment-reaction-btn[data-reaction-type="dislike"]');

  const counts = {
    like: Number(likeBtn?.dataset.count || 0),
    dislike: Number(dislikeBtn?.dataset.count || 0),
  };

  if (previousType && counts[previousType] > 0) counts[previousType] -= 1;
  if (nextType) counts[nextType] += 1;

  renderReactionButtonState(likeBtn, counts.like, nextType === "like");
  renderReactionButtonState(dislikeBtn, counts.dislike, nextType === "dislike");
}

function renderReactionButtonState(button, count, isActive) {
  if (!button) return;

  const safeCount = Math.max(0, count);
  const label = button.dataset.label || "";

  button.dataset.count = String(safeCount);
  button.textContent = `${label} ${safeCount}`;
  button.classList.toggle("active", isActive);
  button.setAttribute("aria-pressed", String(isActive));
}

async function deleteStudyReactions(reactionsRef) {
  const snapshot = await reactionsRef.get();

  for (const doc of snapshot.docs) {
    await doc.ref.delete();
  }
}

function getStudyCommentsRef() {
  return window.db.collection("study").doc(currentStudyPost.id).collection("comments");
}

function getStudyRepliesRef(commentId) {
  return getStudyCommentsRef().doc(commentId).collection("replies");
}

function getStudyReactionRef(commentId, replyId = null) {
  if (replyId) {
    return getStudyRepliesRef(commentId).doc(replyId).collection("reactions");
  }

  return getStudyCommentsRef().doc(commentId).collection("reactions");
}

function isCommentOwner(comment) {
  return (
    window.auth.currentUser &&
    comment &&
    comment.uid &&
    comment.uid === window.auth.currentUser.uid
  );
}

function createTextButton(text, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.addEventListener("click", onClick);

  return button;
}

function renderLikeButton(button, isLiked) {
  button.classList.toggle("liked", isLiked);
  button.setAttribute("aria-pressed", String(isLiked));
  button.setAttribute("aria-label", isLiked ? "좋아요 취소" : "좋아요");
  button.innerHTML = `<span class="heart-icon" aria-hidden="true">${isLiked ? "♥" : "♡"}</span>`;
}

function updateStudyOwnerButtons() {
  const editBtn = document.getElementById("study-edit-btn");
  const deleteBtn = document.getElementById("study-delete-btn");

  const canEdit = currentStudyPost && isOwner(currentStudyPost);

  if (editBtn) editBtn.style.display = canEdit ? "inline-block" : "none";
  if (deleteBtn) deleteBtn.style.display = canEdit ? "inline-block" : "none";
}

function isOwner(study) {
  return (
    window.auth.currentUser &&
    study &&
    study.uid &&
    study.uid === window.auth.currentUser.uid
  );
}

function resetStudyForm() {
  const titleInput = document.getElementById("study-title");
  const categoryInput = document.getElementById("study-category");
  const authorInput = document.getElementById("study-author");
  const contentInput = document.getElementById("study-content");
  const imageInput = document.getElementById("study-image");

  if (titleInput) titleInput.value = "";
  if (categoryInput) categoryInput.value = "";
  if (authorInput) authorInput.value = "";
  if (contentInput) contentInput.value = "";
  if (imageInput) imageInput.value = "";
  renderImagePreview("study-image-preview", "");
}

function validateImageFile(file) {
  const maxSize = 10 * 1024 * 1024;
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    alert("JPG, PNG, GIF, WEBP 이미지만 업로드할 수 있습니다.");
    return false;
  }

  if (file.size > maxSize) {
    alert("이미지는 10MB 이하만 선택할 수 있습니다.");
    return false;
  }

  return true;
}

async function uploadImageFile(file, folder) {
  // Firebase Storage에 원본 파일을 올리지 않고,
  // 브라우저에서 먼저 압축한 뒤 Firestore에 바로 저장할 수 있는 data URL로 변환함.
  const dataUrl = await compressImageToDataUrl(file);
  return { url: dataUrl, path: null };
}

async function compressImageToDataUrl(file) {
  const maxWidth = 1200;
  const maxHeight = 1200;
  const maxDataUrlBytes = 750 * 1024;
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const { width, height } = getResizedImageSize(
      image.naturalWidth || image.width,
      image.naturalHeight || image.height,
      maxWidth,
      maxHeight
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("이미지를 변환할 수 없습니다.");
    }

    ctx.drawImage(image, 0, 0, width, height);

    let quality = 0.82;
    let dataUrl = "";

    while (quality >= 0.42) {
      dataUrl = canvas.toDataURL("image/webp", quality);

      // 일부 브라우저가 WebP 변환을 지원하지 않으면 JPEG로 대체
      if (!dataUrl.startsWith("data:image/webp")) {
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }

      if (getTextByteSize(dataUrl) <= maxDataUrlBytes) {
        return dataUrl;
      }

      quality -= 0.08;
    }

    throw new Error("압축 후에도 이미지가 너무 큽니다. 더 작은 이미지를 선택해주세요.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("이미지를 읽지 못했습니다."));
    image.src = src;
  });
}

function getResizedImageSize(width, height, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function getTextByteSize(text) {
  return new Blob([text]).size;
}

async function deleteStoredImage(path) {
  if (!path || !window.storage) return;

  try {
    await window.storage.ref().child(path).delete();
  } catch (error) {
    console.warn("이미지 삭제 오류:", error);
  }
}

function renderDetailImage(wrapId, imageId, imageUrl) {
  const wrap = document.getElementById(wrapId);
  const image = document.getElementById(imageId);

  if (!wrap || !image) return;

  if (!imageUrl) {
    wrap.style.display = "none";
    image.removeAttribute("src");
    return;
  }

  image.src = imageUrl;
  wrap.style.display = "block";
}

function renderImagePreview(previewId, imageUrl, label = "선택한 이미지") {
  const preview = document.getElementById(previewId);
  if (!preview) return;

  if (!imageUrl) {
    preview.innerHTML = "";
    return;
  }

  preview.innerHTML = `<p>${label}</p><img src="${imageUrl}" alt="이미지 미리보기" />`;
}

document.addEventListener("change", (event) => {
  if (event.target?.id !== "study-image") return;

  const file = event.target.files?.[0];
  if (!file) {
    renderImagePreview("study-image-preview", currentStudyPost?.imageUrl || "");
    return;
  }

  if (!validateImageFile(file)) {
    event.target.value = "";
    renderImagePreview("study-image-preview", currentStudyPost?.imageUrl || "");
    return;
  }

  renderImagePreview("study-image-preview", URL.createObjectURL(file));
});

function setStudySaveButtonText(text) {
  const saveBtn = document.getElementById("study-save-btn");
  if (saveBtn) saveBtn.innerText = text;
}

function setLoading(button, isLoading, text) {
  if (!button) return;

  button.disabled = isLoading;
  button.innerText = text;
}

function getTodayStr() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const date = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
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