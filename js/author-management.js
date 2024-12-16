// author-management.js

document.addEventListener('DOMContentLoaded', function () {
    const filterForm = document.getElementById('filter-form');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const addAuthorBtn = document.getElementById('add-author');
    const authorsTbody = document.getElementById('authors-tbody');
    const paginationContainer = document.getElementById('pagination');
    const selectAllCheckbox = document.getElementById('select-all');

    let currentPage = 1;
    let totalPages = 1;
    let currentFilters = {};

    // 获取作者列表
    async function fetchAuthors(page = 1, filters = {}) {
        try {
            const params = new URLSearchParams({
                page: page,
                per_page: 10,
                ...filters
            });

            const response = await fetch(APIURL + `/api/authors?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                }
            });

            const result = await response.json();

            if (result.code === 0) {
                renderAuthors(result.data);
                renderPagination(result.pagination);
            } else {
                Swal.fire('错误', result.msg, 'error');
            }
        } catch (error) {
            console.error('获取作者失败:', error);
            Swal.fire('错误', '获取作者失败', 'error');
        }
    }

    // 渲染作者表格
    function renderAuthors(authors) {
        authorsTbody.innerHTML = '';

        authors.forEach(author => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td><input type="checkbox" class="select-author" data-author-id="${author.id}"></td>
                <td>${author.id}</td>
                <td>${author.username}</td>
                <td>${author.phone}</td>
                <td>${new Date(author.created_at).toLocaleString()}</td>
                <td>
                    <button class="action-btn edit-btn" title="编辑作者" data-author-id="${author.id}">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="action-btn delete-btn" title="删除作者" data-author-id="${author.id}">
                        <i class="fas fa-trash-alt"></i> 删除
                    </button>
                </td>
            `;

            authorsTbody.appendChild(tr);
        });
    }

    // 渲染分页控件
    function renderPagination(pagination) {
        currentPage = pagination.currentPage;
        totalPages = pagination.totalPages;
        paginationContainer.innerHTML = '';

        // 上一页按钮
        const prevBtn = document.createElement('button');
        prevBtn.classList.add('page-btn');
        prevBtn.textContent = '上一页';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                fetchAuthors(currentPage - 1, currentFilters);
            }
        });
        paginationContainer.appendChild(prevBtn);

        // 页码按钮
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.classList.add('page-btn');
            if (i === currentPage) {
                pageBtn.classList.add('active');
            }
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                fetchAuthors(i, currentFilters);
            });
            paginationContainer.appendChild(pageBtn);
        }

        // 下一页按钮
        const nextBtn = document.createElement('button');
        nextBtn.classList.add('page-btn');
        nextBtn.textContent = '下一页';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                fetchAuthors(currentPage + 1, currentFilters);
            }
        });
        paginationContainer.appendChild(nextBtn);
    }

    // 处理表单提交（搜索）
    filterForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(filterForm);
        const filters = {
            author_id: formData.get('author_id').trim(),
            username: formData.get('username').trim(),
            phone: formData.get('phone').trim()
        };
        currentFilters = filters;
        fetchAuthors(1, filters);
    });

    // 处理重置按钮
    resetFiltersBtn.addEventListener('click', function () {
        filterForm.reset();
        currentFilters = {};
        fetchAuthors(1, {});
    });

    // 处理添加作者按钮
    addAuthorBtn.addEventListener('click', function () {
        Swal.fire({
            title: '添加新作者',
            html: `
                <input type="text" id="swal-username" class="swal2-input" placeholder="用户名">
                <input type="text" id="swal-phone" class="swal2-input" placeholder="手机号码">
                <input type="password" id="swal-password" class="swal2-input" placeholder="密码">
                <select id="swal-role" class="swal2-input" disabled>
                    <option value="author" selected>作者</option>
                </select>
            `,
            focusConfirm: false,
            preConfirm: () => {
                const username = document.getElementById('swal-username').value.trim();
                const phone = document.getElementById('swal-phone').value.trim();
                var password = document.getElementById('swal-password').value.trim();
                const role = 'author'; // 固定为作者角色

                if (!username || !phone || !password) {
                    Swal.showValidationMessage('请填写所有必填字段');
                    return false;
                }

                // 简单的手机号码格式验证（可根据需要调整）
                const phoneRegex = /^1[3-9]\d{9}$/;
                if (!phoneRegex.test(phone)) {
                    Swal.showValidationMessage('请输入有效的手机号码');
                    return false;
                }
                // 对密码进行 MD5 加密
                password = CryptoJS.MD5(password).toString();
                console.log('加密后的密码: ', password);

                return { username, phone, password, role };
            }
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                try {
                    const response = await fetch(APIURL + '/api/add_author', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${getToken()}`
                        },
                        body: JSON.stringify(result.value)
                    });

                    const resData = await response.json();

                    if (resData.code === 0) {
                        Swal.fire('成功', resData.msg, 'success');
                        fetchAuthors(currentPage, currentFilters);
                    } else {
                        Swal.fire('错误', resData.msg, 'error');
                    }
                } catch (error) {
                    console.error('添加作者失败:', error);
                    Swal.fire('错误', '添加作者失败', 'error');
                }
            }
        });
    });

    // 处理删除作者
    authorsTbody.addEventListener('click', function (e) {
        if (e.target.closest('.delete-btn')) {
            const authorId = e.target.closest('.delete-btn').dataset.authorId;
            Swal.fire({
                title: '确定要删除此作者吗？',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '删除',
                cancelButtonText: '取消'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await fetch(APIURL + `/api/authors/${authorId}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${getToken()}`
                            }
                        });

                        const resData = await response.json();

                        if (resData.code === 0) {
                            Swal.fire('成功', resData.msg, 'success');
                            fetchAuthors(currentPage, currentFilters);
                        } else {
                            Swal.fire('错误', resData.msg, 'error');
                        }
                    } catch (error) {
                        console.error('删除作者失败:', error);
                        Swal.fire('错误', '删除作者失败', 'error');
                    }
                }
            });
        }

        // 处理编辑作者
        if (e.target.closest('.edit-btn')) {
            const authorId = e.target.closest('.edit-btn').dataset.authorId;
            openEditAuthorModal(authorId);
        }
    });

    // 处理全选复选框
    selectAllCheckbox.addEventListener('change', function () {
        const checkboxes = document.querySelectorAll('.select-author');
        checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
    });

    // 打开编辑作者模态窗口
    async function openEditAuthorModal(authorId) {
        try {
            // 获取作者详情
            const response = await fetch(APIURL + `/api/authors/${authorId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                }
            });

            const resData = await response.json();

            if (resData.code !== 0) {
                Swal.fire('错误', resData.msg, 'error');
                return;
            }

            const author = resData.data;

            // 打开编辑模态框
            Swal.fire({
                title: '编辑作者',
                width: '600px',
                padding: '20px',
                customClass: {
                    popup: 'edit-author-modal'
                },
                html: `
                <div class="swal-input-group">
                    <label for="swal-username" class="swal-label">用户名</label>
                    <input type="text" id="swal-username" class="swal2-input" placeholder="用户名" value="${author.username}">
                    
                    <label for="swal-phone" class="swal-label">手机号码</label>
                    <input type="text" id="swal-phone" class="swal2-input" placeholder="手机号码" value="${author.phone}">
                    
                    <label for="swal-role" class="swal-label">角色</label>
                    <select id="swal-role" class="swal2-input" disabled>
                        <option value="author" selected>作者</option>
                    </select>
                    
                    <div class="swal-checkbox-group">
                        <input type="checkbox" id="swal-is-phone-verified" ${author.is_phone_verified ? 'checked' : ''}>
                        <label for="swal-is-phone-verified" class="swal-label">手机已验证</label>
                    </div>
                </div>
            `,
                focusConfirm: false,
                preConfirm: () => {
                    const username = document.getElementById('swal-username').value.trim();
                    const phone = document.getElementById('swal-phone').value.trim();
                    const role = 'author'; // 固定为作者角色
                    const is_phone_verified = document.getElementById('swal-is-phone-verified').checked;

                    if (!username || !phone) {
                        Swal.showValidationMessage('请填写所有必填字段');
                        return false;
                    }

                    // 简单的手机号码格式验证
                    const phoneRegex = /^1[3-9]\d{9}$/;
                    if (!phoneRegex.test(phone)) {
                        Swal.showValidationMessage('请输入有效的手机号码');
                        return false;
                    }

                    return { username, phone, role, is_phone_verified };
                }
            }).then(async (result) => {
                if (result.isConfirmed && result.value) {
                    try {
                        const updateData = result.value;
                        const response = await fetch(APIURL + `/api/authors/${authorId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${getToken()}`
                            },
                            body: JSON.stringify(updateData)
                        });

                        const resData = await response.json();

                        if (resData.code === 0) {
                            Swal.fire('成功', resData.msg, 'success');
                            fetchAuthors(currentPage, currentFilters);
                        } else {
                            Swal.fire('错误', resData.msg, 'error');
                        }
                    } catch (error) {
                        console.error('更新作者失败:', error);
                        Swal.fire('错误', '更新作者失败', 'error');
                    }
                }
            });
        } catch (error) {
            console.error('获取作者详情失败:', error);
            Swal.fire('错误', '获取作者详情失败', 'error');
        }
    }

    // 初始化获取作者列表
    fetchAuthors();
});

function getToken() {
    return localStorage.getItem('access_token') || '';
}
