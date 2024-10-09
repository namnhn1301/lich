// script.js

let itemBeingEdited = null; // Để lưu trữ hàng đang chỉnh sửa

// Khởi tạo trang khi tải
function initPage() {
    displayCurrentDateTime();
    setupScrollToTopButton();
    setupSnowflakes();
    loadScheduleFromLocalStorage(); // Đảm bảo dữ liệu được tải
    updateTodaySchedule(); // Cập nhật lịch học hôm nay
}

// Hiển thị ngày và giờ hiện tại với biểu tượng từ Font Awesome
function displayCurrentDateTime() {
    const dateTimeElement = document.getElementById('date-time');
    setInterval(() => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('vi-VN'); // Lấy giờ
        const dateString = now.toLocaleDateString('vi-VN'); // Lấy ngày
        // Sử dụng icon từ Font Awesome
        dateTimeElement.innerHTML = `<i class="fas fa-clock"></i> ${timeString} | <i class="fas fa-calendar-alt"></i> ${dateString}`;
    }, 1000);
}

// Thiết lập nút cuộn lên đầu trang
function setupScrollToTopButton() {
    const scrollToTopButton = document.getElementById('scroll-to-top');
    window.addEventListener('scroll', () => {
        scrollToTopButton.style.display = window.scrollY > 200 ? 'block' : 'none';
    });
}

function scrollToTop(duration) {
    const startPosition = window.pageYOffset;
    const startTime = performance.now();

    function animationScroll(currentTime) {
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, -startPosition, duration);

        window.scrollTo(0, run);

        if (timeElapsed < duration) {
            requestAnimationFrame(animationScroll); // Tiếp tục cuộn cho đến khi hết thời gian
        }
    }

    // Hàm easing để làm mượt quá trình cuộn
    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animationScroll);
}

// Gắn sự kiện vào nút cuộn lên đầu trang
document.getElementById('scroll-to-top').addEventListener('click', function () {
    scrollToTop(2500); // Cuộn trang trong 5 giây (5000ms)
});

// Các chức năng modal để xác nhận xóa
let itemToDelete = null;

// Hàm xác nhận xóa phần tử và cập nhật lại bảng
function confirmDelete() {
    if (itemToDelete) {
        // Áp dụng hiệu ứng mờ dần trước khi xóa
        itemToDelete.style.transition = 'opacity 0.5s';
        itemToDelete.style.opacity = '0';

        // Đợi hiệu ứng hoàn tất rồi mới xóa phần tử
        setTimeout(() => {
            itemToDelete.remove(); // Xóa phần tử khỏi DOM
            saveScheduleToLocalStorage(); // Cập nhật lại dữ liệu trong localStorage
            showNotification('Xóa thành công!', 'success'); // Hiển thị thông báo xóa thành công
            itemToDelete = null; // Xóa tham chiếu đến phần tử đã xóa
            closeModal(); // Đóng modal xác nhận xóa
        }, 500); // Đợi 500ms để hiệu ứng mờ dần hoàn thành
    }
}


function openDeleteModal(item) {
    itemToDelete = item;
    document.getElementById('confirm-modal').classList.add('show');
}

function closeModal() {
    document.getElementById('confirm-modal').classList.remove('show');
}

function cancelDelete() {
    itemToDelete = null;
    closeModal();
}

// Kiểm tra dữ liệu trước khi cập nhật thời khóa biểu
function validateForm() {
    const subject = document.getElementById('subject').value.trim();
    const teacher = document.getElementById('teacher').value.trim();
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;

    if (!subject || !teacher) {
        showNotification('Hãy điền đầy đủ thông tin cho bộ môn và giáo viên.', 'error');
        return false;
    }

    // Kiểm tra giờ bắt đầu và giờ kết thúc
    if (startTime >= endTime) {
        showNotification('Giờ bắt đầu phải trước giờ kết thúc.', 'error');
        return false;
    }
    return true;
}

// Thêm hoặc cập nhật một mục thời khóa biểu
function validateAndUpdateSchedule() {
    if (!validateForm()) return;

    const subject = document.getElementById('subject').value;
    const teacher = document.getElementById('teacher').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const daysChecked = days.map(day => document.getElementById(day).checked ? '✔' : '');

    let scheduleRow;
    if (itemBeingEdited) {
        // Nếu đang chỉnh sửa, cập nhật hàng hiện tại
        scheduleRow = itemBeingEdited;
        scheduleRow.style.transition = 'background-color 0.5s';
        scheduleRow.style.backgroundColor = '#d1ffd1'; // Màu nền nhạt cho chỉnh sửa
    } else {
        // Nếu không, thêm hàng mới
        scheduleRow = document.createElement('tr');
        scheduleRow.style.opacity = '0';
        scheduleRow.innerHTML = `
            <td>${subject}</td>
            <td>${teacher}</td>
            <td>${startTime} - ${endTime}</td>
            ${daysChecked.map(day => `<td>${day}</td>`).join('')}
            <td><button onclick="openDeleteModal(this.parentElement.parentElement)">Xóa</button></td>
            <td><button onclick="editSchedule(this.parentElement.parentElement)">Chỉnh sửa</button></td>
        `;
        document.getElementById('schedule-body').appendChild(scheduleRow);
        // Áp dụng hiệu ứng hiển thị dần
        setTimeout(() => {
            scheduleRow.style.transition = 'opacity 0.5s';
            scheduleRow.style.opacity = '1';
        }, 0);
    }
    saveScheduleToLocalStorage(); // Lưu lại thay đổi
    clearForm();
    showNotification('Cập nhật thành công!', 'success');
    itemBeingEdited = null;
}

// Xóa dữ liệu biểu mẫu sau khi gửi
function clearForm() {
    document.getElementById('subject').value = '';
    document.getElementById('teacher').value = '';
    document.getElementById('start-time').value = '';
    document.getElementById('end-time').value = '';
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
        document.getElementById(day).checked = false;
    });
    itemBeingEdited = null; // Xóa trạng thái chỉnh sửa
}

// Lưu thời khóa biểu vào localStorage
function saveScheduleToLocalStorage() {
    const scheduleData = Array.from(document.querySelectorAll('#schedule-body tr')).map(row => {
        const cells = row.children;
        return {
            subject: cells[0].textContent,
            teacher: cells[1].textContent,
            time: cells[2].textContent,
            days: Array.from(cells).slice(3, 10).map(cell => cell.textContent === '✔')
        };
    });
    localStorage.setItem('scheduleData', JSON.stringify(scheduleData));
}

// Gọi hàm `updateTodaySchedule` ngay sau khi tải lịch học từ `localStorage`
function getTodaySchedule() {
    const scheduleData = JSON.parse(localStorage.getItem('scheduleData')) || [];
    const today = new Date().getDay(); // Lấy ngày hiện tại (0: Chủ Nhật, 1: Thứ Hai, ...)

    // Tạo mảng chứa các lịch học hôm nay
    const todaySchedule = scheduleData.filter(data => data.days[today - 1] === true);

    if (todaySchedule.length === 0) {
        return 'Không có lịch học nào hôm nay.';
    }

    // Nếu có lịch học, ghép các lịch học thành chuỗi với dấu * và mỗi lịch trên một dòng
    return todaySchedule.map(data => `* ${data.subject} (${data.time}) - Giáo viên: ${data.teacher}`).join('<br/>');
}
// Hàm để cập nhật giao diện lịch học hôm nay
function updateTodaySchedule() {
    const scheduleDetails = document.getElementById('schedule-details');
    const todaySchedule = getTodaySchedule();

    if (todaySchedule === 'Không có lịch học nào hôm nay.') {
        scheduleDetails.innerHTML = todaySchedule; // Hiển thị như văn bản bình thường
    } else {
        scheduleDetails.innerHTML = todaySchedule; // Sử dụng innerHTML để nhận định dạng HTML
        scheduleDetails.style.display = 'block'; // Hiển thị nếu có lịch học
    }
}
function loadScheduleFromLocalStorage() {
    const scheduleData = JSON.parse(localStorage.getItem('scheduleData')) || [];
    const scheduleBody = document.getElementById('schedule-body');
    scheduleBody.innerHTML = ''; // Xóa tất cả các hàng hiện có trước khi thêm mới
    console.log('Dữ liệu lịch học:', scheduleData);

    scheduleData.forEach(data => {
        const scheduleRow = document.createElement('tr');
        scheduleRow.innerHTML = `
            <td>${data.subject}</td>
            <td>${data.teacher}</td>
            <td>${data.time}</td>
            ${data.days.map(day => `<td>${day ? '✔' : ''}</td>`).join('')}
            <td><button onclick="openDeleteModal(this.parentElement.parentElement)">Xóa</button></td>
            <td><button onclick="editSchedule(this.parentElement.parentElement)">Chỉnh sửa</button></td>
        `;
        scheduleBody.appendChild(scheduleRow);
    });

    updateTodaySchedule(); // Cập nhật lịch học hôm nay
}

// Chỉnh sửa một hàng trong bảng thời khóa biểu
function editSchedule(row) {
    const cells = row.children;
    document.getElementById('subject').value = cells[0].textContent;
    document.getElementById('teacher').value = cells[1].textContent;
    const time = cells[2].textContent.split(' - ');
    document.getElementById('start-time').value = time[0];
    document.getElementById('end-time').value = time[1];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach((day, index) => {
        document.getElementById(day).checked = cells[index + 3].textContent === '✔';
    });
    itemBeingEdited = row; // Đặt hàng hiện tại thành hàng đang chỉnh sửa
}

// Chức năng tìm kiếm cho bảng
function searchTable(type) {
    const searchTerm = document.getElementById(`search-${type}`).value.toLowerCase();
    const rows = document.querySelectorAll('#schedule-table tbody tr');
    rows.forEach(row => {
        const cell = row.querySelector(`td:nth-child(${type === 'subject' ? 1 : 2})`).textContent.toLowerCase();
        row.style.display = cell.includes(searchTerm) ? '' : 'none';
    });
}

// Tìm kiếm và lọc bảng thời khóa biểu
function searchAndFilterSchedule() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const rows = document.querySelectorAll('#schedule-body tr');
    rows.forEach(row => {
        const subject = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
        const teacher = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        row.style.display = (subject.includes(searchTerm) || teacher.includes(searchTerm)) ? '' : 'none';
    });
}

// Gọi hàm searchAndFilterSchedule khi người dùng gõ vào ô tìm kiếm
document.getElementById('search-input').addEventListener('input', searchAndFilterSchedule);
// Hiển thị thông báo
// Hàm hiển thị thông báo
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `popup show ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.remove('show');
        document.body.removeChild(notification);
    }, 3000); // Hiển thị thông báo trong 3 giây
}


// Thiết lập điều khiển hiệu ứng tuyết rơi
function setupSnowflakes() {
    const snowflakes = document.querySelectorAll('.snowflake');
    snowflakes.forEach(snowflake => {
        snowflake.addEventListener('click', () => snowflake.classList.toggle('paused'));
    });
}

// Khi tải trang, hiển thị các hàng đã lưu
function loadScheduleFromLocalStorage() {
    const scheduleData = JSON.parse(localStorage.getItem('scheduleData')) || [];
    scheduleData.forEach(data => {
        const scheduleRow = document.createElement('tr');
        scheduleRow.classList.add('visible'); // Hiển thị rõ dần
        scheduleRow.innerHTML = `
            <td>${data.subject}</td>
            <td>${data.teacher}</td>
            <td>${data.time}</td>
            ${data.days.map(day => `<td>${day ? '✔' : ''}</td>`).join('')}
            <td><button onclick="openDeleteModal(this.parentElement.parentElement)">Xóa</button></td>
            <td><button onclick="editSchedule(this.parentElement.parentElement)">Chỉnh sửa</button></td>
        `;
        document.getElementById('schedule-body').appendChild(scheduleRow);
    });

    // Thêm hiệu ứng mờ dần sau khi tải xong
    setTimeout(() => {
        document.querySelectorAll('#schedule-body tr').forEach(row => row.classList.add('visible'));
    }, 0);
}

// Thêm hoặc cập nhật một mục thời khóa biểu
function validateAndUpdateSchedule() {
    if (!validateForm()) return;

    const subject = document.getElementById('subject').value;
    const teacher = document.getElementById('teacher').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const daysChecked = days.map(day => document.getElementById(day).checked ? '✔' : '');

    let scheduleRow;
    if (itemBeingEdited) {
        // Nếu đang chỉnh sửa, cập nhật hàng hiện tại
        scheduleRow = itemBeingEdited;
        scheduleRow.style.transition = 'background-color 0.5s';
        scheduleRow.classList.add('updated');
        scheduleRow.innerHTML = `
            <td>${subject}</td>
            <td>${teacher}</td>
            <td>${startTime} - ${endTime}</td>
            ${daysChecked.map(day => `<td>${day}</td>`).join('')}
            <td><button onclick="openDeleteModal(this.parentElement.parentElement)">Xóa</button></td>
            <td><button onclick="editSchedule(this.parentElement.parentElement)">Chỉnh sửa</button></td>
        `;
    } else {
        // Nếu không, thêm hàng mới
        scheduleRow = document.createElement('tr');
        scheduleRow.classList.add('visible'); // Hiển thị rõ dần
        scheduleRow.innerHTML = `
            <td>${subject}</td>
            <td>${teacher}</td>
            <td>${startTime} - ${endTime}</td>
            ${daysChecked.map(day => `<td>${day}</td>`).join('')}
            <td><button onclick="openDeleteModal(this.parentElement.parentElement)">Xóa</button></td>
            <td><button onclick="editSchedule(this.parentElement.parentElement)">Chỉnh sửa</button></td>
        `;
        document.getElementById('schedule-body').appendChild(scheduleRow);
    }

    setTimeout(() => scheduleRow.classList.add('visible'), 0); // Hiệu ứng hiển thị rõ dần

    saveScheduleToLocalStorage(); // Lưu lại thay đổi
    clearForm();
    showNotification('Cập nhật thành công!', 'success');
    itemBeingEdited = null;
}

// Xuất dữ liệu thời khóa biểu ra CSV với mã hóa UTF-8 BOM
function exportToCSV() {
    const rows = document.querySelectorAll('#schedule-table tr');
    let csvContent = "\uFEFF"; // Thêm BOM để hỗ trợ Unicode

    rows.forEach((row) => {
        let rowData = Array.from(row.querySelectorAll('td, th'))
            .map(cell => cell.textContent)
            .join(",");
        csvContent += rowData + "\r\n";
    });

    // Tạo liên kết tải xuống tệp CSV
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "thoi_khoa_bieu.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Xuất CSV thành công!', 'success');
}

// Xuất dữ liệu thời khóa biểu ra PDF với font Times New Roman
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    // Thiết lập font Times New Roman
    pdf.setFont('times', 'normal');

    // Lấy dữ liệu từ bảng
    const rows = [];
    document.querySelectorAll('#schedule-table tr').forEach((row) => {
        const rowData = Array.from(row.querySelectorAll('td, th')).map(cell => cell.textContent);
        rows.push(rowData);
    });

    // Thêm tiêu đề PDF
    pdf.text("Thời Khóa Biểu", 14, 10);

    // Sử dụng autoTable để chèn bảng vào PDF
    pdf.autoTable({
        head: [rows[0]],
        body: rows.slice(1),
        startY: 20,
        styles: { font: 'times', fontStyle: 'normal' } // Sử dụng font Times New Roman
    });

    // Lưu tệp PDF
    pdf.save("thoi_khoa_bieu.pdf");
    showNotification('Xuất PDF thành công!', 'success');
}

// Hiển thị pop-up lơ lửng với hiệu ứng mượt mà
function showInfoPopup() {
    const popup = document.getElementById('info-popup');
    popup.style.display = 'block'; // Hiển thị pop-up
    setTimeout(() => {
        popup.classList.add('show'); // Thêm lớp để thực hiện hiệu ứng mượt
        popup.classList.remove('hide');
    }, 10); // Thêm một khoảng thời gian nhỏ để đảm bảo CSS chuyển đổi diễn ra

    updatePopupContent();

    // Đặt thời gian tự động ẩn pop-up sau 10 giây
    setTimeout(() => {
        closeInfoPopup();
    }, 10000); // 10000 ms = 10s
}

// Đóng pop-up với hiệu ứng mượt mà
function closeInfoPopup() {
    const popup = document.getElementById('info-popup');
    popup.classList.add('hide'); // Thêm lớp ẩn
    popup.classList.remove('show');
    setTimeout(() => {
        popup.style.display = 'none'; // Ẩn hoàn toàn sau khi hoàn tất hiệu ứng
    }, 500); // Thời gian chờ cho hiệu ứng chuyển tiếp (0.5s)
}

// Cập nhật nội dung của pop-up
function updatePopupContent() {
    const today = new Date();
    const dayOfWeek = today.toLocaleString('vi-VN', { weekday: 'long' });
    const dateStr = today.toLocaleDateString('vi-VN');
    const holidays = {
        '01/01': 'Tết Dương Lịch',
        '30/04': 'Ngày Giải Phóng',
        '01/05': 'Quốc tế Lao Động',
        '02/09': 'Quốc khánh',
        // Thêm các ngày lễ khác tại đây
    };
    const holidayInfo = holidays[dateStr.slice(0, 5)] || 'Không có ngày lễ đặc biệt';

    // Cập nhật nội dung
    document.getElementById('current-day').textContent = `Hôm nay là: ${dayOfWeek}, ${dateStr}`;
    document.getElementById('holiday-info').textContent = `Ngày lễ: ${holidayInfo}`;
    document.getElementById('today-schedule-info').textContent = `Lịch học hôm nay: ${getTodaySchedule()}`;

    // Thiết lập ảnh GIF dựa trên lịch học hôm nay
    const gifElement = document.getElementById('today-schedule-gif');
    const todaySchedule = getTodaySchedule();

    if (todaySchedule.includes('Không có lịch học nào')) {
        gifElement.src = 'assets/images/play.gif'; // Đường dẫn đến ảnh GIF khi không có lịch học
    } else {
        gifElement.src = 'assets/images/study.gif'; // Đường dẫn đến ảnh GIF khi có lịch học
    }
    gifElement.style.display = 'block'; // Hiển thị ảnh GIF
}

// Yêu cầu quyền thông báo khi tải trang
function requestNotificationPermission() {
    if ('Notification' in window) {
        // Kiểm tra trạng thái cấp quyền
        if (Notification.permission === 'default' || Notification.permission === 'denied') {
            // Liên tục yêu cầu quyền cho đến khi người dùng chấp nhận
            const interval = setInterval(() => {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        clearInterval(interval); // Ngừng yêu cầu khi đã được cấp quyền
                        console.log('Đã cấp quyền thông báo.');
                    } else {
                        console.log('Người dùng từ chối quyền thông báo.');
                    }
                });
            }, 1000); // Yêu cầu mỗi giây
        }
    } else {
        console.log('Trình duyệt không hỗ trợ Notification API.');
    }
}

// Hàm gọi API OpenWeatherMap để lấy thông tin thời tiết
async function fetchWeather() {
    const apiKey = '8554015aae0e02f67e53c6cbcddecc3d'; // Thay YOUR_API_KEY bằng API key thực của bạn
    const city = 'Hanoi'; // Bạn có thể thay đổi thành phố ở đây
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}&lang=vi`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.weather && data.main) {
            const temperature = data.main.temp;
            const weatherDescription = data.weather[0].description;
            const weatherIcon = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;

            // Cập nhật DOM với thông tin thời tiết
            document.getElementById('weather').innerHTML = `
                <img src="${weatherIcon}" alt="Weather Icon">
                ${temperature}°C, ${weatherDescription}
            `;
        } else {
            throw new Error('Không thể lấy thông tin thời tiết');
        }
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu thời tiết:', error);
        document.getElementById('weather').textContent = 'Không thể lấy dữ liệu thời tiết';
    }
}

// Gọi hàm khi trang được tải
fetchWeather();

window.onload = function() {
    initPage();
    showInfoPopup();
    displayCurrentDateTime();
    setupScrollToTopButton();
    setupSnowflakes();
    loadScheduleFromLocalStorage(); // Đảm bảo dữ liệu được tải
    updateTodaySchedule(); // Cập nhật lịch học hôm nay
    getLocationAndFetchWeather();  // Gọi hàm để lấy vị trí và hiển thị thời tiết
};
