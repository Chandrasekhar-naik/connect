export function toChatListItem(chat) {
    return {
        id: chat.id,
        is_group: chat.is_group,
        name: chat.name,
        avatar_url: chat.avatar_url,
        other: chat.otherUser ?? null,
        last_message: chat.lastMessage ?? null,
        last_at: chat.lastMessageTime ?? chat.updatedAt ?? chat.createdAt,
    };
}
