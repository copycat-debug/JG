import { requireAuth } from "./auth.js";

let currentBoardPost = null;
let isBoardEditing = false;

export function openNewPost() {
  if (!requireAuth()) return;

  isBoardEditing = false;
  currentBoardPost = null;

  resetBoardForm();
  setPostSaveButtonText("등록");

  window.navigate("board-write");
}

export async function loadBoardList() {
  const tbody = document.getElementById("board-tbody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="4" class="empty-row">데이터를 불러오는 중입니다...</td>
    </tr>
  `;

  try {
    const snapshot = await window.db
      .collection("posts")
      .orderBy("timestamp", "desc")
      .get();

    tbody.innerHTML = "";

    if (snapshot.empty) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-row">작성된 게시글이 없습니다.</td>
        </tr>
      `;
      return;
    }

    let index = snapshot.size;

    snapshot.forEach((doc) => {
      const post = {
        id: doc.id,
        ...doc.data(),
      };

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${index--}</td>
        <td>${escapeHTML(post.title || "제목 없음")}</td>
        <td>${escapeHTML(post.author || "익명")}</td>
        <td>${escapeHTML(post.date || "-")}</td>
      `;

      tr.addEventListener("click", () => viewPost(post));
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

export async function savePost() {
  if (!requireAuth()) return;

  const title = document.getElementById("post-title").value.trim();
  const author =
    document.getElementById("post-author").value.trim() ||
    window.auth.currentUser.email ||
    "익명";
  const content = document.getElementById("post-content").value.trim();
  const imageInput = document.getElementById("post-image");
  const imageFile = imageInput?.files?.[0] || null;

  if (imageFile && !validateImageFile(imageFile)) {
    return;
  }

  if (!title || !content) {
    alert("제목과 내용을 모두 입력해주세요.");
    return;
  }

  const saveBtn = document.getElementById("post-save-btn");
  setLoading(saveBtn, true, imageFile ? "이미지 압축 중..." : "저장 중...");

  try {
    const uploadedImage = imageFile ? await uploadImageFile(imageFile, "board") : null;
    const imageData = uploadedImage
      ? {
          imageUrl: uploadedImage.url,
          imagePath: uploadedImage.path,
        }
      : {};

    if (isBoardEditing && currentBoardPost) {
      if (!isOwner(currentBoardPost)) {
        alert("작성자만 수정할 수 있습니다.");
        return;
      }

      const previousImagePath = currentBoardPost.imagePath;

      await window.db.collection("posts").doc(currentBoardPost.id).update({
        title,
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
      await window.db.collection("posts").add({
        title,
        author,
        content,
        ...imageData,
        date: getTodayStr(),
        uid: window.auth.currentUser.uid,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });

      alert("게시글이 성공적으로 등록되었습니다!");
    }

    isBoardEditing = false;
    currentBoardPost = null;
    resetBoardForm();

    window.navigate("board-list");
  } catch (error) {
    alert("게시글 저장 중 오류 발생: " + error.message);
  } finally {
    setLoading(saveBtn, false, isBoardEditing ? "수정 완료" : "등록");
  }
}

function viewPost(post) {
  currentBoardPost = post;

  document.getElementById("detail-title").innerText = post.title || "제목 없음";
  document.getElementById("detail-author").innerText = post.author || "익명";
  document.getElementById("detail-date").innerText = post.date || "-";
  document.getElementById("detail-content").innerText = post.content || "";
  renderDetailImage("detail-image-wrap", "detail-image", post.imageUrl);

  updateBoardOwnerButtons();
  loadBoardLikeState();
  loadBoardComments();

  window.navigate("board-detail");
}

export function goToEditPost() {
  if (!requireAuth()) return;

  if (!currentBoardPost) {
    alert("수정할 게시글을 찾을 수 없습니다.");
    return;
  }

  if (!isOwner(currentBoardPost)) {
    alert("작성자만 수정할 수 있습니다.");
    return;
  }

  isBoardEditing = true;

  document.getElementById("post-title").value = currentBoardPost.title || "";
  document.getElementById("post-author").value = currentBoardPost.author || "";
  document.getElementById("post-content").value = currentBoardPost.content || "";
  const imageInput = document.getElementById("post-image");
  if (imageInput) imageInput.value = "";
  renderImagePreview("post-image-preview", currentBoardPost.imageUrl, "현재 등록된 이미지");

  setPostSaveButtonText("수정 완료");

  window.navigate("board-write");
}

export async function deletePost() {
  if (!requireAuth()) return;

  if (!currentBoardPost) {
    alert("삭제할 게시글을 찾을 수 없습니다.");
    return;
  }

  if (!isOwner(currentBoardPost)) {
    alert("작성자만 삭제할 수 있습니다.");
    return;
  }

  const ok = confirm("정말로 이 게시글을 삭제하시겠습니까?");
  if (!ok) return;

  try {
    await deleteStoredImage(currentBoardPost.imagePath);
    await window.db.collection("posts").doc(currentBoardPost.id).delete();

    currentBoardPost = null;
    isBoardEditing = false;

    alert("게시글이 삭제되었습니다.");
    window.navigate("board-list");
  } catch (error) {
    alert("삭제 중 오류 발생: " + error.message);
  }
}

export async function toggleBoardLike() {
  if (!requireAuth()) return;

  if (!currentBoardPost) {
    alert("게시글 정보를 찾을 수 없습니다.");
    return;
  }

  const likeBtn = document.getElementById("board-like-btn");
  if (likeBtn) likeBtn.disabled = true;

  const uid = window.auth.currentUser.uid;

  const likeRef = window.db
    .collection("posts")
    .doc(currentBoardPost.id)
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

    await loadBoardLikeState();
  } catch (error) {
    alert("좋아요 처리 중 오류 발생: " + error.message);
  } finally {
    if (likeBtn) likeBtn.disabled = false;
  }
}

export async function addBoardComment() {
  if (!requireAuth()) return;

  if (!currentBoardPost) {
    alert("게시글 정보를 찾을 수 없습니다.");
    return;
  }

  const input = document.getElementById("board-comment-input");
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

    const docRef = await getBoardCommentsRef().add(commentData);

    input.value = "";
    await prependBoardComment({ id: docRef.id, ...commentData });
  } catch (error) {
    alert("댓글 작성 중 오류 발생: " + error.message);
  } finally {
    setLoading(submitBtn, false, "댓글 작성");
  }
}

async function loadBoardLikeState() {
  const likeBtn = document.getElementById("board-like-btn");
  const likeCount = document.getElementById("board-like-count");

  if (!currentBoardPost || !likeBtn || !likeCount) return;

  try {
    const likesRef = window.db
      .collection("posts")
      .doc(currentBoardPost.id)
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

async function loadBoardComments() {
  const list = document.getElementById("board-comment-list");
  if (!list || !currentBoardPost) return;

  list.innerHTML = `<p class="empty-comment">댓글을 불러오는 중입니다...</p>`;

  try {
    const snapshot = await getBoardCommentsRef()
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

      const item = await createBoardCommentElement(comment);
      list.appendChild(item);
    }
  } catch (error) {
    list.innerHTML = `<p class="empty-comment">댓글 로딩 오류: ${escapeHTML(error.message)}</p>`;
  }
}

async function createBoardCommentElement(comment) {
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
      openBoardCommentEditor(item);
    });
    const deleteBtn = createTextButton("삭제", "comment-action-btn danger", () => {
      deleteBoardComment(comment.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
  }

  top.appendChild(actions);

  const content = document.createElement("p");
  content.className = "comment-content";
  content.textContent = comment.content || "";

  const editForm = createBoardEditForm(comment.content || "", async (nextContent, saveBtn) => {
    await updateBoardComment(comment.id, nextContent, saveBtn);
  });

  const reactionBar = await createBoardCommentReactionBar(comment.id);

  const replyActions = document.createElement("div");
  replyActions.className = "reply-actions";

  const replyForm = createBoardReplyForm(comment.id);
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
  await loadBoardReplies(comment.id, replies);

  item.appendChild(top);
  item.appendChild(content);
  item.appendChild(editForm);
  item.appendChild(reactionBar);
  item.appendChild(replyActions);
  item.appendChild(replyForm);
  item.appendChild(replies);

  return item;
}

function createBoardEditForm(initialContent, onSave) {
  const form = document.createElement("div");
  form.className = "comment-edit-form hidden";

  const textarea = document.createElement("textarea");
  textarea.className = "form-control";
  textarea.value = initialContent;

  const actions = document.createElement("div");
  actions.className = "comment-inline-actions";

  const cancelBtn = createTextButton("취소", "comment-action-btn", () => {
    closeBoardCommentEditor(form.closest(".comment-item, .reply-item"));
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

function openBoardCommentEditor(item) {
  if (!item) return;

  const content = item.querySelector(":scope > .comment-content");
  const form = item.querySelector(":scope > .comment-edit-form");

  if (content) content.style.display = "none";
  if (form) {
    form.classList.remove("hidden");
    form.querySelector("textarea")?.focus();
  }
}

function closeBoardCommentEditor(item) {
  if (!item) return;

  const content = item.querySelector(":scope > .comment-content");
  const form = item.querySelector(":scope > .comment-edit-form");

  if (content) content.style.display = "";
  if (form) form.classList.add("hidden");
}

async function updateBoardComment(commentId, content, saveBtn) {
  if (!requireAuth()) return;

  try {
    setLoading(saveBtn, true, "저장 중...");

    await getBoardCommentsRef().doc(commentId).update({
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

async function deleteBoardComment(commentId) {
  if (!requireAuth()) return;

  const ok = confirm("댓글을 삭제하시겠습니까? 대댓글도 함께 삭제됩니다.");
  if (!ok) return;

  try {
    const commentRef = getBoardCommentsRef().doc(commentId);

    await deleteBoardReactions(commentRef.collection("reactions"));

    const repliesSnapshot = await commentRef.collection("replies").get();
    for (const replyDoc of repliesSnapshot.docs) {
      await deleteBoardReactions(replyDoc.ref.collection("reactions"));
      await replyDoc.ref.delete();
    }

    await commentRef.delete();
    document.querySelector(`.comment-item[data-comment-id="${commentId}"]`)?.remove();
    renderEmptyBoardCommentsIfNeeded();
  } catch (error) {
    alert("댓글 삭제 중 오류 발생: " + error.message);
  }
}

function createBoardReplyForm(commentId) {
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
    await addBoardReply(commentId, textarea, submitBtn);
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(submitBtn);
  form.appendChild(textarea);
  form.appendChild(actions);

  return form;
}

async function addBoardReply(commentId, textarea, submitBtn) {
  if (!requireAuth()) return;

  if (!currentBoardPost) {
    alert("게시글 정보를 찾을 수 없습니다.");
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

    const docRef = await getBoardRepliesRef(commentId).add(replyData);
    const replyItem = await createBoardReplyElement(commentId, {
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
      await loadBoardComments();
    }
  } catch (error) {
    alert("답글 작성 중 오류 발생: " + error.message);
  } finally {
    setLoading(submitBtn, false, "답글 작성");
  }
}

async function loadBoardReplies(commentId, repliesWrap) {
  try {
    const snapshot = await getBoardRepliesRef(commentId)
      .orderBy("timestamp", "asc")
      .get();

    repliesWrap.innerHTML = "";

    if (snapshot.empty) return;

    for (const doc of snapshot.docs) {
      const reply = {
        id: doc.id,
        ...doc.data(),
      };

      const replyItem = await createBoardReplyElement(commentId, reply);
      repliesWrap.appendChild(replyItem);
    }
  } catch (error) {
    repliesWrap.innerHTML = `<p class="empty-comment">답글 로딩 오류: ${escapeHTML(error.message)}</p>`;
  }
}

async function createBoardReplyElement(commentId, reply) {
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
      openBoardCommentEditor(item);
    });
    const deleteBtn = createTextButton("삭제", "comment-action-btn danger", () => {
      deleteBoardReply(commentId, reply.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
  }

  top.appendChild(actions);

  const content = document.createElement("p");
  content.className = "comment-content";
  content.textContent = reply.content || "";

  const editForm = createBoardEditForm(reply.content || "", async (nextContent, saveBtn) => {
    await updateBoardReply(commentId, reply.id, nextContent, saveBtn);
  });

  const reactionBar = await createBoardCommentReactionBar(commentId, reply.id);

  item.appendChild(top);
  item.appendChild(content);
  item.appendChild(editForm);
  item.appendChild(reactionBar);

  return item;
}

async function updateBoardReply(commentId, replyId, content, saveBtn) {
  if (!requireAuth()) return;

  try {
    setLoading(saveBtn, true, "저장 중...");

    await getBoardRepliesRef(commentId).doc(replyId).update({
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

async function deleteBoardReply(commentId, replyId) {
  if (!requireAuth()) return;

  const ok = confirm("답글을 삭제하시겠습니까?");
  if (!ok) return;

  try {
    const replyRef = getBoardRepliesRef(commentId).doc(replyId);
    await deleteBoardReactions(replyRef.collection("reactions"));
    await replyRef.delete();
    document.querySelector(`.reply-item[data-comment-id="${commentId}"][data-reply-id="${replyId}"]`)?.remove();
  } catch (error) {
    alert("답글 삭제 중 오류 발생: " + error.message);
  }
}

async function createBoardCommentReactionBar(commentId, replyId = null) {
  const bar = document.createElement("div");
  bar.className = "comment-reaction-bar";

  const reactionsRef = getBoardReactionRef(commentId, replyId);
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
    toggleBoardCommentReaction(commentId, "like", replyId, bar);
  });

  const dislikeBtn = createReactionButton("👎", "dislike", dislikeCount, myReaction === "dislike", () => {
    toggleBoardCommentReaction(commentId, "dislike", replyId, bar);
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

async function toggleBoardCommentReaction(commentId, type, replyId = null, reactionBar = null) {
  if (!requireAuth()) return;

  const uid = window.auth.currentUser.uid;
  const reactionRef = getBoardReactionRef(commentId, replyId).doc(uid);
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



async function prependBoardComment(comment) {
  const list = document.getElementById("board-comment-list");

  if (!list) {
    await loadBoardComments();
    return;
  }

  const empty = list.querySelector(".empty-comment");
  if (empty) list.innerHTML = "";

  const item = await createBoardCommentElement(comment);
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

  closeBoardCommentEditor(item);
}

function renderEmptyBoardCommentsIfNeeded() {
  const list = document.getElementById("board-comment-list");
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

async function deleteBoardReactions(reactionsRef) {
  const snapshot = await reactionsRef.get();

  for (const doc of snapshot.docs) {
    await doc.ref.delete();
  }
}

function getBoardCommentsRef() {
  return window.db.collection("posts").doc(currentBoardPost.id).collection("comments");
}

function getBoardRepliesRef(commentId) {
  return getBoardCommentsRef().doc(commentId).collection("replies");
}

function getBoardReactionRef(commentId, replyId = null) {
  if (replyId) {
    return getBoardRepliesRef(commentId).doc(replyId).collection("reactions");
  }

  return getBoardCommentsRef().doc(commentId).collection("reactions");
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

function updateBoardOwnerButtons() {
  const editBtn = document.getElementById("board-edit-btn");
  const deleteBtn = document.getElementById("board-delete-btn");

  const canEdit = currentBoardPost && isOwner(currentBoardPost);

  if (editBtn) editBtn.style.display = canEdit ? "inline-block" : "none";
  if (deleteBtn) deleteBtn.style.display = canEdit ? "inline-block" : "none";
}

function isOwner(post) {
  return (
    window.auth.currentUser &&
    post &&
    post.uid &&
    post.uid === window.auth.currentUser.uid
  );
}

function resetBoardForm() {
  const titleInput = document.getElementById("post-title");
  const authorInput = document.getElementById("post-author");
  const contentInput = document.getElementById("post-content");
  const imageInput = document.getElementById("post-image");

  if (titleInput) titleInput.value = "";
  if (authorInput) authorInput.value = "";
  if (contentInput) contentInput.value = "";
  if (imageInput) imageInput.value = "";
  renderImagePreview("post-image-preview", "");
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
  if (event.target?.id !== "post-image") return;

  const file = event.target.files?.[0];
  if (!file) {
    renderImagePreview("post-image-preview", currentBoardPost?.imageUrl || "");
    return;
  }

  if (!validateImageFile(file)) {
    event.target.value = "";
    renderImagePreview("post-image-preview", currentBoardPost?.imageUrl || "");
    return;
  }

  renderImagePreview("post-image-preview", URL.createObjectURL(file));
});

function setPostSaveButtonText(text) {
  const saveBtn = document.getElementById("post-save-btn");
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