export const extractMentionedUsers = (text, allUsers) => {
  const mentionPattern = /@([a-zA-Z0-9 ]+)/g; // match multi-word names
  const mentionedNames = [...text.matchAll(mentionPattern)].map(match => match[1].trim().toLowerCase());

  return allUsers.filter(user => {
    const fullName = `${user.fname} ${user.lname}`.toLowerCase();
    return mentionedNames.includes(fullName);
  });
};
