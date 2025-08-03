import Comment from "../models/Comment-model.js";
import User from "../models/user-model.js";
import { CommentMessages } from "../constants/enums.js";
import { extractMentionedUsers } from "../utils/mentionUtils.js";
import sendEmail from "../utils/sendEmail.js";
import config from "../config.js";

/**
 * Create a new comment or reply
 */
export const createCommentService = async ({ actionId, workspaceName, description, createdBy, createdByName, role, parentComment }) => {
    try {
        const createdByModel = role === "superadmin" ? "Admin" : "User";

        const comment = new Comment({
            actionId,
            workspaceName,
            description,
            createdBy,
            createdByName,
            createdByModel,
            parentComment: parentComment || null,
        });

        const savedComment = await comment.save();

        // Extract mentioned users and send an email to them
        const allUsersInWorkspace = await User.find({ workspaceName }); // Fetch users in the workspace
        const mentionedUsers = extractMentionedUsers(description, allUsersInWorkspace);

        if (mentionedUsers.length > 0) {
            // Construct the action link (this link will be the one you want to send in the email)
            const actionLink = `${config.CLIENT_URL}/actions/view/${actionId}`;

            const emailPromises = mentionedUsers.map(user => {
                const emailOptions = {
                    email: user.email,
                    subject: 'You were mentioned in a comment!',
                    html: `
                        <div style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; padding: 20px; text-align: center;">
                            <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse;">
                                <tr>
                                    <td style="text-align: center; padding: 20px;">
                                        <h2 style="color: #333333;">Hello ${user.fname},</h2>
                                        <p style="color: #555555;">You have been mentioned in a comment related to an action. You can view the action by clicking the button below:</p>
                                        <a href="${actionLink}" style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; margin-top: 20px;">Click Here to View Action</a>
                                        <p style="color: #555555; margin-top: 20px;">Best regards,</p>
                                        <p style="color: #555555;">Your App Team</p>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    `,

                };
                return sendEmail(emailOptions); // Send the email to the mentioned user
            });

            // Wait for all email promises to be resolved
            await Promise.all(emailPromises);
        }

        return savedComment;
        // return await comment.save();
    } catch (error) {
        console.error(CommentMessages.ERROR_CREATING_COMMENT, error);
        throw new Error(CommentMessages.ERROR_CREATING_COMMENT);
    }
};

/**
 * Get comments by action ID with nested replies
 */
export const getCommentsByActionIdService = async (actionId) => {
    try {
        const comments = await Comment.find({ actionId }).sort({ createdAt: 1 });

        const mainComments = comments.filter((comment) => !comment.parentComment);
        const replies = comments.filter((comment) => comment.parentComment);

        return mainComments.map((main) => ({
            ...main.toObject(),
            replies: replies.filter((reply) => reply.parentComment.toString() === main._id.toString()),
        }));
    } catch (error) {
        console.error(CommentMessages.ERROR_FETCHING_COMMENTS, error);
        throw new Error(CommentMessages.ERROR_FETCHING_COMMENTS);
    }
};
export const deleteCommentByIdService = async (commentId) => {
    try {
        const comment = await Comment.findById(commentId);
        if (!comment) return null;

        // Delete replies if it is a main comment
        if (!comment.parentComment) {
            await Comment.deleteMany({ parentComment: commentId });
        }

        return await Comment.findByIdAndDelete(commentId);
    } catch (error) {
        
        throw new Error(CommentMessages.ERROR_DELETING_COMMENT);
    }
};
