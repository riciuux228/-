document.addEventListener('DOMContentLoaded', function () {
    const adminInfoCard = document.getElementById('admin-info');
    const adminUsername = document.getElementById('admin-username');
    const adminPhone = document.getElementById('admin-phone');
    const adminRole = document.getElementById('admin-role');
    const adminVerified = document.getElementById('admin-verified');
    const adminCreatedAt = document.getElementById('admin-created-at');
    const adminIcon = document.getElementById('admin-icon');
    const editAdminBtn = document.getElementById('edit-admin');

    let adminId; // 存储管理员ID的变量
    let selectedAvatarFile = null; // 存储选择的头像文件，初始为 null

    // 获取管理员信息
    async function fetchAdminInfo() {
        try {
            const response = await fetch(APIURL + '/api/admin/info', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                }
            });

            const result = await response.json();

            if (result.code === 0) {
                const admin = result.data;
                adminId = admin.id; // 存储管理员ID
                adminUsername.textContent = admin.username;
                adminPhone.textContent = admin.phone;
                adminRole.textContent = admin.role;
                adminVerified.textContent = admin.is_phone_verified ? '是' : '否';
                adminCreatedAt.textContent = new Date(admin.created_at).toLocaleString();
                adminIcon.src = admin.user_icon_url || adminIcon.src; // 设置用户头像
            } else {
                Swal.fire('错误', result.msg, 'error');
            }
        } catch (error) {
            console.error('获取管理员信息失败:', error);
            // Swal.fire('错误', '获取管理员信息失败', 'error');
        }
    }

    // 处理编辑信息按钮点击
    editAdminBtn.addEventListener('click', function () {
        Swal.fire({
            title: '编辑管理员信息',
            html: `
                <div style="text-align: center;">
                    <img id="current-avatar" src="${adminIcon.src}" alt="Current Avatar" class="avatar" style="cursor: pointer;">
                </div>
                <input type="text" id="swal-username" class="swal2-input" placeholder="用户名" value="${adminUsername.textContent}">
                <input type="text" id="swal-phone" class="swal2-input" placeholder="手机号码" value="${adminPhone.textContent}">
                <select id="swal-role" class="swal2-input">
                    <option value="admin" ${adminRole.textContent === 'admin' ? 'selected' : ''}>管理员</option>
                    <option value="author" ${adminRole.textContent === 'author' ? 'selected' : ''}>作者</option>
                    <option value="user" ${adminRole.textContent === 'user' ? 'selected' : ''}>用户</option>
                </select>
                <input type="checkbox" id="swal-is-phone-verified" ${adminVerified.textContent === '是' ? 'checked' : ''}>
                <label for="swal-is-phone-verified">手机已验证</label>
                <input type="file" id="swal-avatar" class="swal2-input" accept="image/*" style="display: none;">
            `,
            focusConfirm: false,
            didOpen: () => {
                const currentAvatar = document.getElementById('current-avatar');
                const swalAvatarInput = document.getElementById('swal-avatar');

                // 绑定点击头像事件以选择文件
                currentAvatar.addEventListener('click', () => {
                    swalAvatarInput.click(); // 触发隐藏的文件输入
                });

                // 绑定文件选择事件
                swalAvatarInput.addEventListener('change', (event) => {
                    const file = event.target.files[0]; // 获取选择的文件

                    if (file) {
                        selectedAvatarFile = file; // 存储选择的文件
                        console.log('选择的头像文件:', selectedAvatarFile); // 确认文件对象

                        // 预览图像
                        const reader = new FileReader();
                        reader.onload = function (e) {
                            currentAvatar.src = e.target.result; // 替换当前头像
                        }
                        reader.readAsDataURL(file); // 转换为Base64字符串
                    } else {
                        console.log('未选择头像文件'); // 如果没有选择文件
                    }
                });
            },
            preConfirm: () => {
                const username = document.getElementById('swal-username').value.trim();
                const phone = document.getElementById('swal-phone').value.trim();
                const role = document.getElementById('swal-role').value;
                const is_phone_verified = document.getElementById('swal-is-phone-verified').checked;

                if (!username || !phone) {
                    Swal.showValidationMessage('请填写所有必填字段');
                    return false;
                }

                // 收集表单数据
                return { username, phone, role, is_phone_verified };
            }
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                // 调试信息确认选择的头像文件
                console.log('上传之前 selectedAvatarFile:', selectedAvatarFile);

                // 准备发送头像图像及其他数据
                const formData = new FormData();
                formData.append('username', result.value.username);
                formData.append('phone', result.value.phone);
                formData.append('role', result.value.role);
                formData.append('is_phone_verified', result.value.is_phone_verified);

                // 如果选择了头像文件，则添加到表单数据
                if (selectedAvatarFile) {
                    formData.append('avatar', selectedAvatarFile);
                } else {
                    console.log('未选择头像文件');
                }

                // 更新管理员信息
                try {
                    const response = await fetch(APIURL + `/api/admin/${adminId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${getToken()}`
                        },
                        body: formData // 发送表单数据与图像
                    });

                    const resData = await response.json();

                    if (resData.code === 0) {
                        Swal.fire('成功', resData.msg, 'success');
                        fetchAdminInfo(); // 重新获取信息
                    } else {
                        // Swal.fire('错误', resData.msg, 'error');
                    }
                } catch (error) {
                    // console.error('更新管理员信息失败:', error);
                    // Swal.fire('错误', '更新管理员信息失败', 'error');
                }
            }
        });
    });

    // 初始化获取管理员信息
    fetchAdminInfo();
});


// 预览图像功能
function previewImage(event) {
    const currentAvatar = document.getElementById('current-avatar');
    const file = event.target.files[0]; // 获取文件

    // 检查文件是否存在
    if (file) {
        selectedAvatarFile = file; // 存储选择的文件
        console.log('选择的头像文件:', selectedAvatarFile); // 确认文件对象

        const reader = new FileReader();
        reader.onload = function (e) {
            currentAvatar.src = e.target.result; // 替换当前头像
        }
        reader.readAsDataURL(file); // 转换为Base64字符串
    } else {
        console.log('未选择头像文件'); // 如果没有选择文件
    }
}
// 获取token
function getToken() {
    return localStorage.getItem('access_token');
}