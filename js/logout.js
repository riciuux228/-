document.addEventListener('DOMContentLoaded', function () {
    console.log('logout page loaded');  // 调试输出，确保代码运行
    handleLogout();
});

function handleLogout() {
    // 移除本地存储中的 token
    localStorage.removeItem('access_token');
    console.log('已退出登录');  // 调试输出，确保代码运行

    // 提示用户已成功退出登录
    swal.fire({
        icon: 'success',
        title: '已退出登录',
        text: '您已成功退出。',
        showConfirmButton: true,
        allowOutsideClick: false
    }).then(() => {
        // 重定向到登录页面
        window.location.href = 'login.html';  // 假设 '/pages/login.html' 是登录页面路径
    });
}
