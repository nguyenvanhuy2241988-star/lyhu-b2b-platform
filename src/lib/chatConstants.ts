/**
 * File quản lý tập trung các thông số kỹ thuật (Magic Numbers) cho hệ thống Chat.
 * Giúp mã nguồn dễ bảo trì và tránh các giá trị không giải thích được.
 */
export const CHAT_CONSTANTS = {
    // Hệ thống Mention (@)
    MENTION_TRIGGER: '@',
    MAX_MENTION_QUERY_LENGTH: 50,
    MENTION_DEBOUNCE_MS: 300,

    // Gom nhóm tin nhắn (Message Grouping)
    // Nếu tin nhắn cùng người gửi cách nhau dưới 5 phút thì gom lại
    MESSAGE_GROUP_TIME_WINDOW_MS: 5 * 60 * 1000,

    // Hành vi Cuộn (Scroll Behavior)
    // Delay để đợi React-Virtuoso tính toán kích thước phần tử
    SCROLL_DELAY_MS: 100,

    // Trạng thái đang soạn thảo (Typing Indicator)
    TYPING_TIMEOUT_MS: 2000,

    // Tìm kiếm (Search)
    SEARCH_DEBOUNCE_MS: 500,
    MAX_SEARCH_RESULTS: 50,

    // Tải thêm tin nhắn (Pagination)
    MESSAGES_PER_PAGE: 50,
    LOAD_MORE_LIMIT: 20,
};
