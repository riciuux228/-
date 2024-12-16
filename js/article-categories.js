document.addEventListener("DOMContentLoaded", function () {
    loadCategories();

    // 绑定重置按钮事件
    document.getElementById("reset-filters").addEventListener("click", resetFilters);
    // 绑定添加分类按钮事件
    document.getElementById("add-category").addEventListener("click", addCategory);

    // 绑定搜索按钮事件
    document.getElementById("filter-form").addEventListener("submit", function (e) {
        e.preventDefault();
        loadCategories();
    });
});

// 加载分类数据函数
function loadCategories(page = 1) {
    const id = document.getElementById("filter-id").value;
    const name = document.getElementById("filter-name").value;

    const queryParams = new URLSearchParams({
        page: page,
        id: id,
        name: name,
        per_page: 10  // 每页显示的条目数
    });

    authorizedFetch(APIURL + `/api/categories?${queryParams.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (data.code === 0) {
                renderTable(data.data);
                renderPagination(data.pagination);  // 渲染分页按钮
            } else {
                Swal.fire("错误", data.msg, "error");
            }
        });
}

// 渲染分页
function renderPagination(pagination) {
    const paginationDiv = document.getElementById("pagination");
    paginationDiv.innerHTML = ''; // 清空分页内容

    for (let i = 1; i <= pagination.totalPages; i++) {
        const pageButton = document.createElement("button");
        pageButton.innerText = i;
        pageButton.classList.add("page-btn");
        if (i === pagination.currentPage) {
            pageButton.classList.add("active");
        }
        pageButton.addEventListener("click", () => loadCategories(i));  // 点击页码切换页面
        paginationDiv.appendChild(pageButton);
    }
}


// 渲染表格数据
function renderTable(categories) {
    const tbody = document.getElementById("categories-tbody");
    tbody.innerHTML = ''; // 清空表格

    categories.forEach(category => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td><input type="checkbox" class="select-category" data-id="${category.cid}"></td>
            <td>${category.cid}</td>
            <td>${category.category_name}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteCategory(${category.cid})">
                    <i class="fas fa-trash-alt"></i> 删除
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}



// 重置筛选条件
function resetFilters() {
    document.getElementById("filter-id").value = '';
    document.getElementById("filter-name").value = '';
    loadCategories();
}

// 添加分类
function addCategory() {
    Swal.fire({
        title: "添加新分类",
        html: `
            <input type="text" id="category-name" class="swal2-input" placeholder="分类名称">
        `,
        showCancelButton: true,
        confirmButtonText: "保存",
        preConfirm: () => {
            const name = document.getElementById("category-name").value;
            if (!name) {
                Swal.showValidationMessage("请输入分类名称");
                return false;
            }
            return { name: name };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const newCategory = result.value;
            authorizedFetch(APIURL + '/api/add_category', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCategory)
            })
                .then(response => response.json())
                .then(data => {
                    if (data.code === 0) {
                        Swal.fire("成功", "分类添加成功", "success");
                        loadCategories();
                    } else {
                        Swal.fire("错误", data.msg, "error");
                    }
                })
                .catch(error => {
                    console.error("添加分类失败:", error);
                    Swal.fire("错误", "添加分类失败", "error");
                });
        }
    });
}

// 删除分类
function deleteCategory(id) {
    Swal.fire({
        title: '确定删除?',
        text: "删除后无法恢复!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '删除',
        cancelButtonText: '取消'
    }).then((result) => {
        if (result.isConfirmed) {
            authorizedFetch(APIURL + `/api/categories/${id}`, {
                method: 'DELETE'
            })
                .then(response => response.json())
                .then(data => {
                    if (data.code === 0) {
                        Swal.fire('已删除!', '分类已删除.', 'success');
                        loadCategories();
                    } else if (data.code === 1002) {
                        Swal.fire('错误', '分类下存在文章，无法删除', 'error');
                    }
                    else {
                        Swal.fire('错误', data.msg, 'error');
                    }
                })
                .catch(error => {
                    console.error("删除分类失败:", error);
                    Swal.fire('错误', '删除分类失败', 'error');
                });
        }
    });
}

function authorizedFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    return fetch(url, {
        ...options,
        headers
    });
}

function getToken() {
    return localStorage.getItem('access_token') || '';
}
