# Danh sách route quản trị iAct CTU

Tài liệu này mô tả các route đang được khai báo trong `projects/mfe-admin/src/app/app.routes.ts`.
MFE admin được shell mount dưới prefix `/admin`, vì vậy các đường dẫn bên dưới là URL đầy đủ người dùng truy cập.

## Route dùng chung cho admin và đơn vị

| Route | Vai trò | Trang/Component | Vai trò nghiệp vụ |
| --- | --- | --- | --- |
| `/admin/dashboard` | `admin`, `department` | `DashboardComponent` | Xem tổng quan số liệu vận hành, hoạt động gần đây và các thao tác nhanh theo khu vực quản trị. |
| `/admin/notifications` | `admin`, `department` | `AdminNotificationCenterComponent` | Theo dõi, lọc, đọc và xử lý các thông báo gửi đến người dùng quản trị. |
| `/admin/notifications/:id` | `admin`, `department` | `AdminNotificationDetailComponent` | Xem chi tiết một thông báo và điều hướng đến hoạt động, duyệt minh chứng hoặc duyệt hoạt động liên quan. |

## Route vận hành của đơn vị/khoa

| Route | Vai trò | Trang/Component | Vai trò nghiệp vụ |
| --- | --- | --- | --- |
| `/admin/org/activities` | `admin`, `department` | `ActivityListComponent` | Quản lý danh sách hoạt động do đơn vị phụ trách, tra cứu trạng thái, đi đến chi tiết/chỉnh sửa và gửi thông báo cho sinh viên đã đăng ký một hoạt động cụ thể. |
| `/admin/org/activities/create` | `admin`, `department` | `ActivityCreateComponent` | Tạo mới hoạt động, cấu hình thông tin, lịch, quyền lợi và lưu nháp/gửi duyệt. |
| `/admin/org/activities/edit/:id` | `admin`, `department` | `ActivityCreateComponent` | Chỉnh sửa hoạt động đã tạo hoặc bản nháp hoạt động trước khi vận hành tiếp. |
| `/admin/org/activities/detail/:id` | `admin`, `department` | `ActivityManagementComponent` | Xem và vận hành chi tiết hoạt động, bao gồm trạng thái, thông tin tổ chức và hành động quản lý. |
| `/admin/org/activities/participants/:id` | `admin`, `department` | `ParticipantManagementComponent` | Quản lý sinh viên đăng ký/tham gia một hoạt động cụ thể. |
| `/admin/org/approvals` | `department` | `ApprovalsComponent` | Duyệt minh chứng sinh viên gửi lên cho hoạt động thuộc phạm vi đơn vị. |

## Route quản trị hệ thống

| Route | Vai trò | Trang/Component | Vai trò nghiệp vụ |
| --- | --- | --- | --- |
| `/admin/user-management` | `admin` | `UserManagementComponent` | Quản lý tài khoản sinh viên, đơn vị và quản trị viên; phân lớp và cập nhật thông tin người dùng. |
| `/admin/user-management/import-users` | `admin` | `ImportUsersComponent` | Nhập danh sách sinh viên từ file Excel và nhận kết quả xử lý dữ liệu nhập. |
| `/admin/activity-moderation` | `admin` | `ActivityModerationComponent` | Duyệt, từ chối và theo dõi hoạt động do các đơn vị gửi lên cấp toàn trường. |
| `/admin/semesters` | `admin` | `SemesterManagementComponent` | Quản lý học kỳ, trạng thái khóa/mở và học kỳ đang hoạt động. |
| `/admin/categories` | `admin` | `CategoryManagementComponent` | Quản lý danh mục điểm rèn luyện và cấu trúc điểm áp dụng cho hoạt động. |
| `/admin/departments` | `admin` | `DepartmentManagementComponent` | Quản lý Khoa, Trường, Viện và đơn vị đào tạo trong hệ thống. |
| `/admin/majors` | `admin` | `MajorManagementComponent` | Quản lý chuyên ngành, liên kết chuyên ngành với đơn vị đào tạo. |
| `/admin/classes` | `admin` | `ClassManagementComponent` | Quản lý lớp sinh hoạt, khóa tuyển sinh và liên kết lớp với chuyên ngành. |
| `/admin/settings` | `admin` | `SystemSettingsComponent` | Cấu hình các tham số vận hành hệ thống quản trị. |

## Route alias và tương thích ngược

| Route | Chuyển đến | Ghi chú |
| --- | --- | --- |
| `/admin` | `/admin/dashboard` | Trang mặc định khi vào khu vực quản trị. |
| `/admin/system` | `/admin/settings` | Giữ tương thích với tên route cũ. |
| `/admin/settings/system` | `/admin/settings` | Alias phụ cho nhóm cài đặt hệ thống. |
| `/admin/approvals` | `/admin/org/approvals` | Giữ tương thích với luồng thông báo cũ đang điều hướng đến `/admin/approvals`. |
| `/admin/org/students` | `/admin/org/activities` | Tạm tránh 404 cho menu quản lý sinh viên của đơn vị; hiện chưa có component quản lý sinh viên độc lập theo đơn vị. |
| `/admin/reports` | `/admin/dashboard` | Tạm đưa về dashboard vì chưa có component báo cáo riêng. |
| `/admin/faculty/activities` | `/admin/org/activities` | Alias từ cấu trúc route cũ. |
| `/admin/faculty/activities/create` | `/admin/org/activities/create` | Alias từ cấu trúc route cũ. |
| `/admin/faculty/activities/edit/:id` | `/admin/org/activities/edit/:id` | Alias từ cấu trúc route cũ. |
| `/admin/faculty/activities/detail/:id` | `/admin/org/activities/detail/:id` | Alias từ cấu trúc route cũ. |
| `/admin/super-admin/moderation` | `/admin/activity-moderation` | Alias từ cấu trúc route cũ. |
| `/admin/super-admin/users` | `/admin/user-management` | Alias từ cấu trúc route cũ. |
| `/admin/super-admin/classes` | `/admin/classes` | Alias từ cấu trúc route cũ. |
| `/admin/super-admin/settings` | `/admin/settings` | Alias từ cấu trúc route cũ. |
