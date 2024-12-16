// normal-users.js

document.addEventListener('DOMContentLoaded', function () {
    const filterForm = document.getElementById('filter-form');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const addUserBtn = document.getElementById('add-user');
    const usersTbody = document.getElementById('users-tbody');
    const paginationContainer = document.getElementById('pagination');
    const selectAllCheckbox = document.getElementById('select-all');

    let currentPage = 1;
    let totalPages = 1;
    let currentFilters = {};

    // 获取用户列表
    async function fetchUsers(page = 1, filters = {}) {
        try {
            const params = new URLSearchParams({
                page: page,
                per_page: 10,
                ...filters
            });

            const response = await fetch(APIURL + `/api/users?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}` // 假设token存储在localStorage
                }
            });

            const result = await response.json();

            if (result.code === 0) {
                renderUsers(result.data);
                renderPagination(result.pagination);
            } else {
                Swal.fire('错误', result.msg, 'error');
            }
        } catch (error) {
            console.error('获取用户失败:', error);
            Swal.fire('错误', '获取用户失败', 'error');
        }
    }

    // 渲染用户表格
    function renderUsers(users) {
        usersTbody.innerHTML = '';

        users.forEach(user => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td><input type="checkbox" class="select-user" data-user-id="${user.id}"></td>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.phone}</td>
                <td>${new Date(user.created_at).toLocaleString()}</td>
                <td>
                    <button class="action-btn edit-btn" title="编辑用户" data-user-id="${user.id}">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="action-btn delete-btn" title="删除用户" data-user-id="${user.id}">
                        <i class="fas fa-trash-alt"></i> 删除
                    </button>
                </td>
            `;

            usersTbody.appendChild(tr);
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
                fetchUsers(currentPage - 1, currentFilters);
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
                fetchUsers(i, currentFilters);
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
                fetchUsers(currentPage + 1, currentFilters);
            }
        });
        paginationContainer.appendChild(nextBtn);
    }

    // 处理表单提交（搜索）
    filterForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(filterForm);
        const filters = {
            user_id: formData.get('user_id').trim(),
            username: formData.get('username').trim(),
            phone: formData.get('phone').trim()
        };
        currentFilters = filters;
        fetchUsers(1, filters);
    });

    // 处理重置按钮
    resetFiltersBtn.addEventListener('click', function () {
        filterForm.reset();
        currentFilters = {};
        fetchUsers(1, {});
    });

    // 处理添加用户按钮
    addUserBtn.addEventListener('click', function () {
        Swal.fire({
            title: '添加新用户',
            html: `
                <input type="text" id="swal-username" class="swal2-input" placeholder="用户名">
                <input type="text" id="swal-phone" class="swal2-input" placeholder="手机号码">
                <input type="password" id="swal-password" class="swal2-input" placeholder="密码">
                <select id="swal-role" class="swal2-input">
                    <option value="user">用户</option>
                    <option value="author">作者</option>
                </select>
            `,
            focusConfirm: false,
            preConfirm: () => {
                const username = document.getElementById('swal-username').value.trim();
                const phone = document.getElementById('swal-phone').value.trim();
                var password = document.getElementById('swal-password').value.trim();
                const role = document.getElementById('swal-role').value;

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
                    const response = await fetch(APIURL + '/api/add_user', {
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
                        fetchUsers(currentPage, currentFilters);
                    } else {
                        Swal.fire('错误', resData.msg, 'error');
                    }
                } catch (error) {
                    console.error('添加用户失败:', error);
                    Swal.fire('错误', '添加用户失败', 'error');
                }
            }
        });
    });

    // 处理删除用户
    usersTbody.addEventListener('click', function (e) {
        if (e.target.closest('.delete-btn')) {
            const userId = e.target.closest('.delete-btn').dataset.userId;
            Swal.fire({
                title: '确定要删除此用户吗？',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '删除',
                cancelButtonText: '取消'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await fetch(APIURL + `/api/users/${userId}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${getToken()}`
                            }
                        });

                        const resData = await response.json();

                        if (resData.code === 0) {
                            Swal.fire('成功', resData.msg, 'success');
                            fetchUsers(currentPage, currentFilters);
                        } else {
                            Swal.fire('错误', resData.msg, 'error');
                        }
                    } catch (error) {
                        console.error('删除用户失败:', error);
                        Swal.fire('错误', '删除用户失败', 'error');
                    }
                }
            });
        }

        // 处理编辑用户（可选）
        if (e.target.closest('.edit-btn')) {
            const userId = e.target.closest('.edit-btn').dataset.userId;
            openEditUserModal(userId);
        }
    });

    // 处理全选复选框
    selectAllCheckbox.addEventListener('change', function () {
        const checkboxes = document.querySelectorAll('.select-user');
        checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
    });

    // 打开编辑用户模态窗口
    async function openEditUserModal(userId) {
        try {
            // 获取用户详情
            const response = await fetch(APIURL + `/api/users/${userId}`, {
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

            const user = resData.data;

            // 打开编辑模态框
            // 打开编辑模态框
            // 打开编辑模态框
            Swal.fire({
                title: '编辑用户',
                width: '600px',  // 设置弹出框宽度
                padding: '20px', // 增加内边距
                customClass: {
                    popup: 'edit-user-modal' // 自定义类名
                },
                html: `
                <div class="swal-input-group">
                    <label for="swal-username" class="swal-label">用户名</label>
                    <input type="text" id="swal-username" class="swal2-input" placeholder="用户名" value="${user.username}">
                    
                    <label for="swal-phone" class="swal-label">手机号码</label>
                    <input type="text" id="swal-phone" class="swal2-input" placeholder="手机号码" value="${user.phone}">
                    
                    <label for="swal-role" class="swal-label">角色</label>
                    <select id="swal-role" class="swal2-input">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>用户</option>
                        <option value="author" ${user.role === 'author' ? 'selected' : ''}>作者</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>管理员</option>
                    </select>
                    
                    <div class="swal-checkbox-group">
                        <input type="checkbox" id="swal-is-phone-verified" ${user.is_phone_verified ? 'checked' : ''}>
                        <label for="swal-is-phone-verified" class="swal-label">手机已验证</label>
                    </div>
                </div>
            `,
                focusConfirm: false,
                preConfirm: () => {
                    const username = document.getElementById('swal-username').value.trim();
                    const phone = document.getElementById('swal-phone').value.trim();
                    const role = document.getElementById('swal-role').value;
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
                        const response = await fetch(APIURL + `/api/users/${userId}`, {
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
                            fetchUsers(currentPage, currentFilters);
                        } else {
                            Swal.fire('错误', resData.msg, 'error');
                        }
                    } catch (error) {
                        console.error('更新用户失败:', error);
                        Swal.fire('错误', '更新用户失败', 'error');
                    }
                }
            });
        } catch (error) {
            console.error('获取用户详情失败:', error);
            Swal.fire('错误', '获取用户详情失败', 'error');
        }
    }

    // 初始化获取用户列表
    fetchUsers();
});

function getToken() {
    return localStorage.getItem('access_token') || '';
}