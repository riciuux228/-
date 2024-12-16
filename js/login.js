// js/login.js
// 生成随机验证码
function generateCaptcha() {
    const captchaText = Math.random().toString(36).substring(2, 7).toUpperCase();
    document.getElementById('captcha').innerText = captchaText;
}

// 初始化页面时生成验证码
document.addEventListener('DOMContentLoaded', generateCaptcha);

// 点击验证码图片时刷新验证码
document.getElementById('captcha').addEventListener('click', generateCaptcha);

// 处理表单提交
document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    const captchaInput = document.getElementById('captcha-input').value;
    const captcha = document.getElementById('captcha').innerText;

    // 验证码检查
    if (captchaInput.toUpperCase() !== captcha) {
        swal.fire({
            icon: 'error',
            title: '验证码错误',
            text: '请重新输入验证码！'
        });
        // 刷新验证码
        generateCaptcha();
        return;
    }

    // 对密码进行 MD5 加密
    password = CryptoJS.MD5(password).toString();
    console.log('加密后的密码: ', password);

    // 创建 XMLHttpRequest 对象
    const xhr = new XMLHttpRequest();

    // 使用配置中的 API 地址
    const loginUrl = `${APIURL}/admin_login`;

    // 配置请求
    xhr.open('POST', loginUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    // 处理响应
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) { // 请求已完成
            if (xhr.status === 200) { // 请求成功
                const response = JSON.parse(xhr.responseText);

                if (response.code === 0) {
                    // 登录成功，将 token 存储到 localStorage
                    localStorage.setItem('access_token', response.data.token);
                    swal.fire({
                        icon: 'success',
                        title: '登录成功',
                        text: '欢迎回来！',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.href = '/index.html'; // 跳转到管理页面
                    });
                } else {
                    swal.fire({
                        icon: 'error',
                        title: '登录失败',
                        text: response.msg
                    });
                }
            } else {
                swal.fire({
                    icon: 'error',
                    title: '请求失败',
                    text: '登录失败，请稍后再试。'
                });
            }
        }
    };

    // 发送请求
    const requestData = JSON.stringify({ username: username, password: password });
    xhr.send(requestData);
});
