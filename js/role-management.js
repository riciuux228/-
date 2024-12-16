// role-management.js

document.addEventListener('DOMContentLoaded', function () {
    const filterForm = document.getElementById('filter-form');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const rolesTbody = document.getElementById('roles-tbody');
    const paginationContainer = document.getElementById('pagination');
    const selectAllCheckbox = document.getElementById('select-all');
    const updateRolesBtn = document.getElementById('update-roles'); // Optional: Bulk update roles

    let currentPage = 1;
    let totalPages = 1;
    let currentFilters = {};

    // 定义所有可能的角色
    const roles = ['user', 'author', 'admin'];

    // 获取角色用户列表
    async function fetchRoles(page = 1, filters = {}) {
        try {
            const params = new URLSearchParams({
                page: page,
                per_page: 10,
                ...filters
            });

            const response = await fetch(APIURL + `/api/roles?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                }
            });

            const result = await response.json();

            if (result.code === 0) {
                renderRoles(result.data);
                renderPagination(result.pagination);
            } else {
                Swal.fire('错误', result.msg, 'error');
            }
        } catch (error) {
            console.error('获取角色用户失败:', error);
            Swal.fire('错误', '获取角色用户失败', 'error');
        }
    }

    // 渲染角色用户表格
    function renderRoles(users) {
        rolesTbody.innerHTML = '';

        users.forEach(user => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td><input type="checkbox" class="select-user" data-user-id="${user.id}"></td>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.phone}</td>
                <td>
                    <select class="role-select" data-user-id="${user.id}">
                        ${roles.map(role => `<option value="${role}" ${user.role === role ? 'selected' : ''}>${role}</option>`).join('')}
                    </select>
                </td>
                <td>${new Date(user.created_at).toLocaleString()}</td>
                <td>
                    <button class="action-btn save-btn" title="保存角色" data-user-id="${user.id}">
                        <i class="fas fa-save"></i> 保存
                    </button>
                </td>
            `;

            rolesTbody.appendChild(tr);
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
                fetchRoles(currentPage - 1, currentFilters);
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
                fetchRoles(i, currentFilters);
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
                fetchRoles(currentPage + 1, currentFilters);
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
            phone: formData.get('phone').trim(),
            role: formData.get('role').trim()
        };
        currentFilters = filters;
        fetchRoles(1, filters);
    });

    // 处理重置按钮
    resetFiltersBtn.addEventListener('click', function () {
        filterForm.reset();
        currentFilters = {};
        fetchRoles(1, {});
    });

    // 处理保存角色按钮
    rolesTbody.addEventListener('click', function (e) {
        if (e.target.closest('.save-btn')) {
            const userId = e.target.closest('.save-btn').dataset.userId;


            console.log('userId:', userId);
            const selectElem = document.querySelector(`select.role-select[data-user-id="${userId}"]`);
            const newRole = selectElem.value;

            // 发送更新角色请求
            updateUserRole(userId, newRole);
        }
    });

    // 批量更新角色按钮（可选）

    updateRolesBtn.addEventListener('click', function () {
        const selectedUsers = document.querySelectorAll('.select-user:checked');
        if (selectedUsers.length === 0) {
            Swal.fire('提示', '请选择至少一个用户', 'info');
            return;
        }

        Swal.fire({
            title: '批量更新角色',
            html: `
                <select id="swal-new-role" class="swal2-input">
                    ${roles.map(role => `<option value="${role}">${role}</option>`).join('')}
                </select>
            `,
            focusConfirm: false,
            preConfirm: () => {
                const newRole = document.getElementById('swal-new-role').value;
                return newRole;
            }
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                const newRole = result.value;
                const userIds = Array.from(selectedUsers).map(cb => parseInt(cb.dataset.userId, 10)).filter(uid => !isNaN(uid));


                try {
                    const response = await fetch(APIURL + '/api/update_roles', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${getToken()}`
                        },
                        body: JSON.stringify({ user_ids: userIds, role: newRole })
                    });

                    const resData = await response.json();

                    if (resData.code === 0) {
                        Swal.fire('成功', resData.msg, 'success');
                        fetchRoles(currentPage, currentFilters);
                    } else {
                        Swal.fire('错误', resData.msg, 'error');
                    }
                } catch (error) {
                    console.error('批量更新角色失败:', error);
                    Swal.fire('错误', '批量更新角色失败', 'error');
                }
            }
        });
    });

    // 处理全选复选框
    selectAllCheckbox.addEventListener('change', function () {
        const checkboxes = document.querySelectorAll('.select-user');
        checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
    });

    // 更新用户角色
    async function updateUserRole(userId, newRole) {
        try {
            const response = await fetch(APIURL + `/api/roles/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ role: newRole })
            });

            const resData = await response.json();

            if (resData.code === 0) {
                Swal.fire('成功', resData.msg, 'success');
                fetchRoles(currentPage, currentFilters);
            } else {
                Swal.fire('错误', resData.msg, 'error');
            }
        } catch (error) {
            console.error('更新角色失败:', error);
            Swal.fire('错误', '更新角色失败', 'error');
        }
    }

    // 初始化获取角色用户列表
    fetchRoles();
});

function getToken() {
    return localStorage.getItem('access_token') || '';
}
