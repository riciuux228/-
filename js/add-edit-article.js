document.addEventListener('DOMContentLoaded', () => {
    const API_URL = APIURL + '/api/getArticle'; // 后端API端点
    const categoryAPI = APIURL + '/api/categories'; // 获取分类的端点
    const attachmentsAPI = APIURL + '/api/getAttachments'; // 获取附件的端点
    const deleteAttachmentAPI = APIURL + '/api/deleteAttachment'; // 删除附件的端点
    const articleForm = document.getElementById('article-form');
    const cancelBtn = document.getElementById('cancel');
    const replaceImageBtn = document.getElementById('replace-article-image');
    const articleImageInput = document.getElementById('article-image');
    const currentArticleImage = document.getElementById('current-article-image');
    const categorySelect = document.getElementById('category'); // 分类选择下拉框
    const attachmentsList = document.getElementById('attachments-list'); // 附件列表容器

    // 获取文章ID参数
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    // 获取Token（假设Token存储在localStorage中）
    function getToken() {
        return localStorage.getItem('access_token') || '';
    }

    // 初始化表单
    if (articleId) {
        // 编辑模式，获取文章数据
        fetchArticleData(articleId);
        fetchAttachments(articleId); // 获取附件数据
    }

    // 获取所有分类并填充到分类选择框
    async function fetchCategories() {
        try {
            const response = await fetch(categoryAPI, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            if (data.code === 0) {
                populateCategoryOptions(data.data);
            } else {
                Swal.fire('错误', data.msg || '获取分类数据失败。', 'error');
            }
        } catch (error) {
            console.error('获取分类失败:', error);
            Swal.fire('错误', '获取分类数据失败，请稍后再试。', 'error');
        }
    }

    // 填充分类选择框
    function populateCategoryOptions(categories) {
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.cid;  // Use cid as the value
            option.textContent = category.category_name;  // Display category name as the label
            categorySelect.appendChild(option);
        });
    }

    // 获取文章数据并填充表单
    async function fetchArticleData(aid) {
        try {
            const response = await fetch(`${API_URL}?aid=${aid}`, {
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
            if (data.code === 0) {
                await fetchCategories();
                populateForm(data.data);
            } else {
                Swal.fire('错误', data.msg || '获取文章数据失败。', 'error');
            }
        } catch (error) {
            console.error('获取文章数据失败:', error);
            Swal.fire('错误', '获取文章数据失败，请稍后再试。', 'error');
        }
    }

    // 填充表单数据
    function populateForm(article) {
        document.getElementById('title').value = article.title;
        document.getElementById('author').value = article.author;
        document.getElementById('keywords').value = article.keywords;
        document.getElementById('description').value = article.description; // 填充描述

        // 设置默认选择的分类
        categorySelect.value = article.cid; // Set the dropdown value to the correct cid

        document.getElementById('is_show').value = article.is_show == 1 ? 'true' : 'false';
        document.getElementById('is_top').value = article.is_top == 1 ? 'true' : 'false';
        quill.root.innerHTML = article.content; // 使用 Quill 填充内容

        // 填充主图
        if (article.image_url) {
            currentArticleImage.src = article.image_url;
            currentArticleImage.style.display = 'block'; // 显示主图
        }
    }

    // 获取文章附件并填充附件列表
    async function fetchAttachments(aid) {
        try {
            const response = await fetch(`${attachmentsAPI}?aid=${aid}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            if (data.code === 0) {
                populateAttachmentList(data.data);
            } else {
                Swal.fire('错误', data.msg || '获取附件失败。', 'error');
            }
        } catch (error) {
            console.error('获取附件失败:', error);
            Swal.fire('错误', '获取附件失败，请稍后再试。', 'error');
        }
    }

    // 填充附件列表
    function populateAttachmentList(attachments) {
        attachmentsList.innerHTML = ''; // 清空列表
        attachments.forEach(attachment => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.textContent = `${attachment.attachment_name} (${Math.round(attachment.size / 1024)} KB)`;

            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-danger btn-sm';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.onclick = () => deleteAttachment(attachment.id);

            li.appendChild(deleteButton);
            attachmentsList.appendChild(li);
        });
    }

    // 删除附件
    async function deleteAttachment(attachmentId) {
        try {
            const response = await fetch(`${deleteAttachmentAPI}/${attachmentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            if (data.code === 0) {
                Swal.fire('成功', '附件删除成功', 'success');
                // Refresh the attachment list
                fetchAttachments(articleId);
            } else {
                Swal.fire('错误', data.msg || '附件删除失败。', 'error');
            }
        } catch (error) {
            console.error('删除附件失败:', error);
            Swal.fire('错误', '删除附件失败，请稍后再试。', 'error');
        }
    }

    // Fetch categories for the dropdown at the start for new articles
    if (!articleId) {
        fetchCategories();
    }

    // 处理“替换主图”按钮点击
    replaceImageBtn.addEventListener('click', () => {
        articleImageInput.style.display = 'block'; // 显示文件输入框
        replaceImageBtn.style.display = 'none'; // 隐藏替换按钮
    });

    // 处理文章主图上传预览
    articleImageInput.addEventListener('change', () => {
        const file = articleImageInput.files[0];
        if (file) {
            const reader = new FileReader();

            reader.onload = (e) => {
                currentArticleImage.src = e.target.result; // 更新主图预览
                currentArticleImage.style.display = 'block'; // 确保主图可见
            };

            reader.readAsDataURL(file); // 读取文件内容并触发 onload
        }
    });

    // 处理表单提交
    articleForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('aid', articleId || ''); // 如果是编辑模式，传递文章ID
        formData.append('title', document.getElementById('title').value.trim());
        formData.append('author', document.getElementById('author').value.trim());
        formData.append('keywords', document.getElementById('keywords').value.trim());
        formData.append('description', document.getElementById('description').value.trim());
        formData.append('cid', document.getElementById('category').value.trim()); // 使用下拉框中选择的分类 ID
        formData.append('content', quill.root.innerHTML); // 从 Quill 获取内容
        formData.append('is_show', document.getElementById('is_show').value === 'true' ? 1 : 0);
        formData.append('is_top', document.getElementById('is_top').value === 'true' ? 1 : 0);

        // 处理主图上传，如果有用户上传新的主图
        if (articleImageInput.files.length > 0) {
            formData.append('article_image', articleImageInput.files[0]);
        }

        // 处理附件上传
        const attachmentInput = document.getElementById('attachments');
        if (attachmentInput.files.length > 0) {
            for (let i = 0; i < attachmentInput.files.length; i++) {
                formData.append('attachments', attachmentInput.files[i]);
            }
        }

        if (articleId) {
            // 更新文章
            await saveArticle('PUT', `${APIURL}/api/updateArticle`, formData);
        } else {
            // 添加文章
            await saveArticle('POST', `${APIURL}/api/addArticle`, formData);
        }
    });

    // 保存文章函数
    async function saveArticle(method, url, data) {
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${getToken()}` // 不要设置 'Content-Type'，因为 Fetch API 会自动处理
                },
                body: data
            });
            console.log(response);

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const result = await response.json();
            console.log(result);
            if (result.code === 0) {
                Swal.fire('成功', '文章保存成功', 'success').then(() => {
                    window.location.href = 'articles.html';
                });
            } else {
                Swal.fire('错误', result.msg || '保存文章失败。', 'error');
            }
        } catch (error) {
            console.error('保存文章失败:', error);
            Swal.fire('错误', '保存文章失败，请稍后再试。', 'error');
        }
    }

    // 处理取消按钮点击
    cancelBtn.addEventListener('click', () => {
        window.location.href = 'articles.html';
    });
}
);
