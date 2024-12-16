// article.js 用于管理文章列表页面的交互逻辑
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = APIURL + '/api/articles'; // 后端API端点
    const tbody = document.getElementById('articles-tbody');
    const filterForm = document.getElementById('filter-form');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const pagination = document.getElementById('pagination');
    const selectAllCheckbox = document.getElementById('select-all');
    const batchDeleteBtn = document.getElementById('batch-delete');

    let currentPage = 1;
    const limit = 10;
    let totalCount = 0;
    let currentFilters = {};


    const addArticleBtn = document.getElementById('add-article');

    // 处理“添加文章”按钮点击
    addArticleBtn.addEventListener('click', () => {
        // 跳转到添加/编辑文章页面，无需ID参数表示添加
        window.location.href = 'add-edit-article.html';
    });

    // 获取Token（假设Token存储在localStorage中）
    function getToken() {
        return localStorage.getItem('access_token') || '';
    }

    // 构建查询参数
    function buildQueryParams(page, limit, filters) {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);

        for (const key in filters) {
            if (filters[key]) {
                params.append(key, filters[key]);
            }
        }

        return params.toString();
    }

    // 获取文章数据
    async function fetchArticles(page = 1, limit = 10, filters = {}) {
        try {
            const queryParams = buildQueryParams(page, limit, filters);
            const response = await fetch(`${API_URL}?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('获取文章数据失败:', error);
            Swal.fire('错误', '获取文章数据失败，请稍后再试。', 'error');
            return null;
        }
    }

    // 渲染文章表格
    function renderTable(articles) {
        tbody.innerHTML = ''; // 清空现有内容

        if (articles.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 10; // 更新为10，因为新增了一列复选框
            td.textContent = '暂无数据';
            td.style.textAlign = 'center';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        articles.forEach(article => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>
                    <input type="checkbox" class="select-article" data-id="${article.aid}">
                </td>
                <td>${article.aid}</td>
                <td>${article.title}</td>
                <td>${article.author}</td>
                <td>${article.label}</td>
                <td>${article.is_show ? '是' : '否'}</td>
                <td>${article.is_top ? '是' : '否'}</td>
                <td>${article.click}</td>
                <td>${new Date(article.addtime).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-edit" data-id="${article.aid}"><i class="fas fa-edit"></i> 编辑</button>
                    <button class="btn btn-sm btn-delete" data-id="${article.aid}"><i class="fas fa-trash-alt"></i> 删除</button>
                </td>
            `;

            tbody.appendChild(tr);
        });

        // 重新绑定复选框事件，以更新“全选”状态
        bindCheckboxEvents();
    }

    // 绑定复选框事件
    function bindCheckboxEvents() {
        const individualCheckboxes = document.querySelectorAll('.select-article');

        individualCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const allChecked = Array.from(individualCheckboxes).every(cb => cb.checked);
                selectAllCheckbox.checked = allChecked;
            });
        });
    }

    // 渲染分页控件
    function renderPagination(total, page, limit) {
        pagination.innerHTML = ''; // 清空现有内容
        const totalPages = Math.ceil(total / limit);

        if (totalPages <= 1) return; // 不需要分页

        // 上一页按钮
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '上一页';
        prevBtn.classList.add('pagination-btn');
        prevBtn.disabled = page === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadArticles();
            }
        });
        pagination.appendChild(prevBtn);

        // 页码按钮（最多显示5个页码）
        const maxPageButtons = 5;
        let startPage = Math.max(1, page - Math.floor(maxPageButtons / 2));
        let endPage = startPage + maxPageButtons - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxPageButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.classList.add('pagination-btn');
            if (i === page) {
                pageBtn.classList.add('active');
                pageBtn.disabled = true;
            }
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                loadArticles();
            });
            pagination.appendChild(pageBtn);
        }

        // 下一页按钮
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '下一页';
        nextBtn.classList.add('pagination-btn');
        nextBtn.disabled = page === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadArticles();
            }
        });
        pagination.appendChild(nextBtn);
    }

    // 加载并显示文章数据
    async function loadArticles() {
        const data = await fetchArticles(currentPage, limit, currentFilters);
        if (data && data.code === 0) {
            totalCount = data.count;
            renderTable(data.data);
            renderPagination(totalCount, currentPage, limit);
            // 重置“全选”复选框状态
            selectAllCheckbox.checked = false;
        }
    }

    // 处理筛选表单提交
    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(filterForm);
        currentFilters = {};

        formData.forEach((value, key) => {
            if (value.trim() !== '') {
                currentFilters[key] = value.trim();
            }
        });

        currentPage = 1; // 重置到第一页
        loadArticles();
    });

    // 处理重置筛选
    resetFiltersBtn.addEventListener('click', () => {
        filterForm.reset();
        currentFilters = {};
        currentPage = 1;
        loadArticles();
    });

    // 处理编辑和删除按钮点击
    tbody.addEventListener('click', (e) => {
        if (e.target.closest('.btn-edit')) {
            const articleId = e.target.closest('.btn-edit').dataset.id;
            window.location.href = `add-edit-article.html?id=${articleId}`;
        }

        if (e.target.closest('.btn-delete')) {
            const articleId = e.target.closest('.btn-delete').dataset.id;
            // 显示删除确认弹窗
            Swal.fire({
                title: '确定删除吗？',
                text: `您将永久删除文章 ID: ${articleId}`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '是的，删除',
                cancelButtonText: '取消'
            }).then((result) => {
                if (result.isConfirmed) {
                    deleteArticle(articleId);
                }
            });
        }
    });

    // 删除文章函数（单个删除）
    async function deleteArticle(articleIds) {
        try {
            const response = await fetch(`${APIURL}/api/deleteArticles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ ids: articleIds })  // 发送包含多个 ID 的数组
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const data = await response.json();

            if (data.code === 0) {
                Swal.fire('已删除', '文章已成功删除。', 'success');
                loadArticles();
            } else {
                Swal.fire('错误', data.msg || '删除失败。', 'error');
            }
        } catch (error) {
            console.error('删除文章失败:', error);
            Swal.fire('错误', '删除文章失败，请稍后再试。', 'error');
        }
    }

    // 批量删除文章函数
    async function batchDeleteArticles(articleIds) {
        try {
            const response = await fetch(`${APIURL}/api/deleteArticles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ ids: articleIds })  // 发送包含多个 ID 的数组
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.code === 0) {
                Swal.fire('已删除', '选中的文章已成功删除。', 'success');
                loadArticles();
            } else {
                Swal.fire('错误', data.msg || '删除失败。', 'error');
            }
        } catch (error) {
            console.error('批量删除文章失败:', error);
            Swal.fire('错误', '批量删除文章失败，请稍后再试。', 'error');
        }
    }

    // 处理批量删除按钮点击
    batchDeleteBtn.addEventListener('click', () => {
        // 获取所有选中的复选框
        const selectedCheckboxes = document.querySelectorAll('.select-article:checked');
        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.id);

        if (selectedIds.length === 0) {
            Swal.fire('提示', '请先选择要删除的文章。', 'info');
            return;
        }

        // 显示确认删除弹窗
        Swal.fire({
            title: '确定批量删除吗？',
            text: `您将永久删除选中的 ${selectedIds.length} 篇文章`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '是的，删除',
            cancelButtonText: '取消'
        }).then((result) => {
            if (result.isConfirmed) {
                batchDeleteArticles(selectedIds);
            }
        });
    });

    // 处理“全选”复选框点击
    selectAllCheckbox.addEventListener('change', () => {
        const allCheckboxes = document.querySelectorAll('.select-article');
        allCheckboxes.forEach(cb => {
            cb.checked = selectAllCheckbox.checked;
        });
    });

    // 初始化加载文章数据
    loadArticles();
});
