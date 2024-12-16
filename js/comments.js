document.addEventListener("DOMContentLoaded", function () {
    loadComments();

    // 绑定重置按钮事件
    document.getElementById("reset-filters").addEventListener("click", resetFilters);

    // 绑定搜索事件
    document.getElementById("filter-form").addEventListener("submit", function (e) {
        e.preventDefault();
        loadComments();
    });

    // 绑定全选功能
    document.getElementById("select-all").addEventListener("change", function () {
        const checkboxes = document.querySelectorAll(".select-comment");
        checkboxes.forEach(checkbox => checkbox.checked = this.checked);
    });
});

// 加载评论数据
function loadComments(page = 1) {
    const articleId = document.getElementById("filter-article-id").value;
    const userId = document.getElementById("filter-user-id").value;
    const content = document.getElementById("filter-content").value;

    const queryParams = new URLSearchParams({
        page: page,
        article_id: articleId,
        user_id: userId,
        content: content,
        per_page: 10  // 每页条数
    });

    authorizedFetch(APIURL + `/api/comments?${queryParams.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.code === 0) {
                renderTable(data.data);
                renderPagination(data.pagination);
            } else {
                Swal.fire("错误", data.msg, "error");
            }
        });
}

// 渲染评论表格
function renderTable(comments) {
    const tbody = document.getElementById("comments-tbody");
    tbody.innerHTML = '';  // 清空表格

    comments.forEach(comment => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td><input type="checkbox" class="select-comment" data-id="${comment.id}"></td>
            <td>${comment.id}</td>
            <td>${comment.article_id}</td>
            <td>${comment.user_id || '游客'}</td>  <!-- 用户ID 为空时显示 '游客' -->
            <td>${comment.content}</td>
            <td>${comment.parent_comment_id || '-'}</td>  <!-- 如果没有父评论，显示 '-' -->
            <td>${comment.like_count}</td>
            <td>${comment.created_at}</td>
            <td>
               
                <button class="btn btn-danger" onclick="deleteComment(${comment.id})">删除</button>
              
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 渲染分页
function renderPagination(pagination) {
    const paginationDiv = document.getElementById("pagination");
    paginationDiv.innerHTML = '';  // 清空分页

    for (let i = 1; i <= pagination.totalPages; i++) {
        const pageButton = document.createElement("button");
        pageButton.innerText = i;
        pageButton.classList.add("page-btn");
        if (i === pagination.currentPage) {
            pageButton.classList.add("active");
        }
        pageButton.addEventListener("click", () => loadComments(i));
        paginationDiv.appendChild(pageButton);
    }
}

// 重置筛选条件
function resetFilters() {
    document.getElementById("filter-article-id").value = '';
    document.getElementById("filter-user-id").value = '';
    document.getElementById("filter-content").value = '';
    loadComments();
}

// 删除评论
function deleteComment(id) {
    Swal.fire({
        title: '确定删除?',
        text: "删除后无法恢复!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '删除',
        cancelButtonText: '取消'
    }).then((result) => {
        if (result.isConfirmed) {
            authorizedFetch(APIURL + `/api/comments/${id}`, {
                method: 'DELETE'
            })
                .then(response => response.json())
                .then(data => {
                    if (data.code === 0) {
                        Swal.fire("已删除!", "评论已删除.", "success");
                        loadComments();
                    } else {
                        Swal.fire('错误', data.msg, 'error');
                    }
                })
                .catch(error => {
                    console.error("删除评论失败:", error);
                    Swal.fire('错误', '删除评论失败', 'error');
                });
        }
    });
}

// 通用的 fetch 请求封装，包含 token
function authorizedFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    return fetch(url, {
        ...options,
        headers
    });
}

function getToken() {
    return localStorage.getItem('access_token') || '';
}

// 点赞评论
function likeComment(id) {
    authorizedFetch(APIURL + `/api/comments/${id}/like`, {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            if (data.code === 0) {
                Swal.fire("成功!", "点赞成功.", "success");
                loadComments();  // 重新加载评论，更新点赞数
            } else {
                Swal.fire('错误', data.msg, 'error');
            }
        })
        .catch(error => {
            console.error("点赞失败:", error);
            Swal.fire('错误', '点赞失败', 'error');
        });
}

