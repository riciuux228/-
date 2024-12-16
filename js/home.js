// js/home.js

document.addEventListener('DOMContentLoaded', () => {
    // 示例数据获取函数
    function fetchData() {
        // 在实际应用中，您应该从服务器获取数据
        return {
            articles: 120,
            users: 45,
            comments: 300,
            admins: 5,
            articlesPerMonth: [12, 19, 3, 5, 2, 3, 7, 10, 15, 20, 25, 30],
            usersPerMonth: [5, 9, 3, 5, 2, 3, 7, 8, 12, 15, 18, 20],
            recentActivities: [
                '您新增了5篇文章。',
                '用户张三注册了。',
                '用户李四发表评论。',
                '管理员王五更新了权限。',
                '您删除了一条评论。'
            ]
        };
    }

    // 更新统计卡片
    function updateStats(data) {
        document.getElementById('total-articles').textContent = data.articles;
        document.getElementById('total-users').textContent = data.users;
        document.getElementById('total-comments').textContent = data.comments;
        document.getElementById('total-admins').textContent = data.admins;
    }

    // 渲染图表
    function renderCharts(data) {
        const ctxArticles = document.getElementById('articlesChart').getContext('2d');
        const articlesChart = new Chart(ctxArticles, {
            type: 'line',
            data: {
                labels: [
                    '一月', '二月', '三月', '四月', '五月', '六月',
                    '七月', '八月', '九月', '十月', '十一月', '十二月'
                ],
                datasets: [{
                    label: '每月新增文章数',
                    data: data.articlesPerMonth,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        const ctxUsers = document.getElementById('usersChart').getContext('2d');
        const usersChart = new Chart(ctxUsers, {
            type: 'bar',
            data: {
                labels: [
                    '一月', '二月', '三月', '四月', '五月', '六月',
                    '七月', '八月', '九月', '十月', '十一月', '十二月'
                ],
                datasets: [{
                    label: '每月新增用户数',
                    data: data.usersPerMonth,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // 填充最近活动
    function populateActivities(activities) {
        const activitiesList = document.getElementById('activities-list');
        activitiesList.innerHTML = ''; // 清空现有内容
        activities.forEach(activity => {
            const li = document.createElement('li');
            li.textContent = activity;
            activitiesList.appendChild(li);
        });
    }

    // 初始化主页内容
    function initHome() {
        const data = fetchData();
        updateStats(data);
        renderCharts(data);
        populateActivities(data.recentActivities);
    }

    initHome();
});
