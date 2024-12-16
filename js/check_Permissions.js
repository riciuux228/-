// 检查权限并重定向到登录页
function checkPermission() {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('access_token');

    // 如果没有 token，弹出提示并跳转到登录页面
    if (!token) {
        swal.fire({
            icon: 'error',
            title: '未登录',
            text: '请先登录！'
        }).then(() => {
            window.location.href = 'login.html';  // 假设 '/login' 是登录页路径
        });
        return;
    }
    verify_url = `${APIURL}/verify_token`;
    console.log('token:', token);
    // 发起请求验证 token 是否有效
    fetch(verify_url, {  // 假设后端提供 /verify_token API 进行 token 验证
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`  // 将 token 放在请求头中
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.code !== 0) {
                // 如果 token 无效，弹出提示并跳转到登录页面
                swal.fire({
                    icon: 'error',
                    title: '登录状态失效',
                    text: '请重新登录！'
                }).then(() => {
                    localStorage.removeItem('access_token'); // 移除失效的 token
                    window.location.href = 'login.html';
                });
            }
        })
        .catch(error => {
            console.error('Token 验证失败:', error);
            swal.fire({
                icon: 'error',
                title: '请求失败',
                text: '请稍后再试！'
            }).then(() => {
                window.location.href = 'login.html';
            });
        });
}

// 页面加载时检查权限
document.addEventListener('DOMContentLoaded', checkPermission);
